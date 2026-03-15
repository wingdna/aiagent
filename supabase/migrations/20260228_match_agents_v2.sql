-- Enable pgvector extension
create extension if not exists vector;

-- Add embedding column to agents table
alter table agents add column if not exists embedding vector(1024);

-- Create match_agents_v2 function
drop function if exists match_agents_v2(vector, float, int);

create or replace function match_agents_v2(
  query_embedding vector(1024),
  match_threshold float,
  match_count int
)
returns setof agents
language plpgsql
as $$
begin
  return query
  select *
  from agents
  where 1 - (agents.embedding <=> query_embedding) > match_threshold
  order by (hot_score * 0.7 + random() * 0.3) desc
  limit match_count;
end;
$$;
