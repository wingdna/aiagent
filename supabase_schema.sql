
-- Enable RLS (Optional, but good practice)
-- alter table agents enable row level security;

-- Create Agents Table
create table if not exists agents (
  id text primary key,
  name text not null,
  slogan text,
  description text,
  metrics jsonb default '{}'::jsonb,
  stats jsonb default '{}'::jsonb,
  connectivity jsonb default '{}'::jsonb,
  tags text[] default '{}',
  category text,
  video_poster text,
  persona_img text,
  voice_config jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- V31.0: CEREBRO ANALYTICS EXTENSION
alter table agents add column if not exists nri_score float default 0;
alter table agents add column if not exists external_stats jsonb default '{"github_stars": 0, "web_mentions": 0, "last_crawled": null}'::jsonb;

create table if not exists rankings_snapshot (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  type text check (type in ('WEEKLY', 'MONTHLY', 'ALL_TIME')),
  data jsonb -- Stores the ordered array of agent snapshots
);

-- V32.0: LOUNGE ANNOUNCEMENTS (Autonomous Messenger)
create table if not exists lounge_announcements (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  type text default 'WEEKLY_REPORT', -- WEEKLY_REPORT, SYSTEM_ALERT, BOUNTY_DROP
  created_at timestamptz default now()
);

-- V11.2: Neural Social Profiles (Enhanced for Guest Persistence)
create table if not exists profiles (
  id text primary key, -- Changed from uuid/references for Guest Mode compatibility
  username text,
  xp integer default 0,
  balance integer default 1000, -- Added Balance (Neurons)
  reputation integer default 100,
  achievements jsonb default '[]'::jsonb,
  badges text[] default '{}',
  updated_at timestamptz default now()
);

-- V23.0: Project CEREBRO Seed Queue
create table if not exists seed_queue (
  url text primary key,
  source text,
  status text default 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
  fail_count int default 0,
  last_scanned_at timestamptz default now()
);

-- Enable Realtime (Safe Operation)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE agents;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL; 
  END;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL; 
  END;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE seed_queue;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL; 
  END;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE lounge_announcements;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL; 
  END;
END $$;

-- Function to increment stats (Atomic)
create or replace function increment_stat(row_id text, stat_type text)
returns void as $$
begin
  if stat_type = 'win' then
    update agents set stats = jsonb_set(stats, '{wins}', (coalesce(stats->>'wins','0')::int + 1)::text::jsonb) where id = row_id;
  elsif stat_type = 'loss' then
    update agents set stats = jsonb_set(stats, '{losses}', (coalesce(stats->>'losses','0')::int + 1)::text::jsonb) where id = row_id;
  elsif stat_type = 'like' then
    update agents set stats = jsonb_set(stats, '{likes}', (coalesce(stats->>'likes','0')::int + 1)::text::jsonb) where id = row_id;
  end if;
end;
$$ language plpgsql;

-- V11.3: Auto-create Profile Trigger (For OAuth robustness)
-- This ensures that when a new user is created in auth.users, a corresponding profile is created
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, username, xp, balance, reputation)
  values (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'USER_' || substring(new.id from 1 for 4)), 
    100, -- Bonus XP for registering
    1500, -- Bonus Balance
    100
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Bind trigger to auth.users (Safe check)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END $$;

-- V32.0: CHRONOS TRIGGER UPDATE (Returns JSONB for Worker Processing)
-- Fix 42P13: Drop old function signature first
DROP FUNCTION IF EXISTS generate_leaderboard_snapshot(text);

-- Computes NRI scores for all agents and saves the Top 100 snapshot.
create or replace function generate_leaderboard_snapshot(type_text text)
returns jsonb as $$
declare
    agent_record RECORD;
    w_elo float;
    w_stars float;
    w_mentions float;
    w_hype float;
    final_score float;
    snapshot_data jsonb;
    result_record jsonb;
begin
    -- 1. Recalculate NRI for all agents
    for agent_record in select id, stats, external_stats from agents loop
        -- Defaults
        w_elo := coalesce((agent_record.stats->>'elo')::float, 1200.0) * 0.3;
        
        -- Log10(Stars) * 15
        w_stars := log(10, greatest(1.0, coalesce((agent_record.external_stats->>'github_stars')::float, 0.0))) * 15.0;
        
        -- Mentions * 0.2 (Capped at 200)
        w_mentions := least(200.0, coalesce((agent_record.external_stats->>'web_mentions')::float, 0.0) * 0.2);
        
        -- Hype: likes * 5 (Capped at 300)
        w_hype := least(300.0, coalesce((agent_record.stats->>'likes')::float, 0.0) * 5.0);
        
        final_score := w_elo + w_stars + w_mentions + w_hype;
        
        update agents set nri_score = final_score where id = agent_record.id;
    end loop;

    -- 2. Select Data for Snapshot
    select json_agg(t) into snapshot_data from (
        select id, name, category, nri_score, stats 
        from agents 
        order by nri_score desc 
        limit 100
    ) t;

    -- 3. Create Snapshot and Return It
    insert into rankings_snapshot (type, data)
    values (type_text, snapshot_data)
    returning to_jsonb(rankings_snapshot.*) into result_record;

    return result_record;
end;
$$ language plpgsql security definer;
