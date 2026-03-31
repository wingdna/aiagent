import { useLoaderData, useOutletContext, useFetcher, Link } from "react-router";
import { getSupabaseSystemClient, supabaseServer } from "../../lib/supabase.server";
import { UserProfile, Agent } from "../../types";
import { NREProfile } from "../../hooks/useNRE";

interface LayoutContext {
    agents: Agent[];
    finalDisplayList: Agent[];
    activeAgentId: string | null;
    setActiveAgentId: (id: string) => void;
    currentAgent: Agent | null;
    profile: UserProfile;
    isLoggedIn: boolean;
    isForging: boolean;
    isSpeaking: boolean;
    isCommanderOpen: boolean;
    nreProfile: NREProfile;
    setNREProfile: (p: NREProfile) => void;
    addXp: (n: number) => void;
    updateBalance: (val: any) => void;
    unlockAchievement: (id: string, xp: number) => void;
    syncUserProgress: (profile: any) => void;
    initializing: boolean;
}
import { UserPlus, UserMinus, Heart, Bookmark, Share2, Users, Terminal, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { mapToRegistry } from "../utils/mapper.server";

export const action = async ({ request, params, context }: any) => {
  const headers = new Headers();
  const supabase = getSupabaseSystemClient(request, context.env, headers);
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const formData = await request.formData();
  const actionType = formData.get("actionType");
  const targetUserId = params.id;

  if (actionType === "toggle_friend") {
    // Fetch current user's profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileData) {
      const achievements = profileData.achievements || [];
      const friendKey = `friend:${targetUserId}`;
      const isFriend = achievements.includes(friendKey);
      
      let newAchievements = [...achievements];
      if (isFriend) {
        newAchievements = newAchievements.filter((a: string) => a !== friendKey);
      } else {
        newAchievements.push(friendKey);
      }

      await supabase
        .from('profiles')
        .update({ achievements: newAchievements })
        .eq('id', session.user.id);

      return { success: true, isFriend: !isFriend };
    }
  }

  return { error: "Invalid action" };
};

export const loader = async ({ request, params, context }: any) => {
  const headers = new Headers();
  const supabase = getSupabaseSystemClient(request, context.env, headers);
  const { data: { session } } = await supabase.auth.getSession();
  
  const targetUserId = params.id;

  // Fetch target user profile
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetUserId)
    .single();

  if (!targetProfile) {
    throw new Response("User not found", { status: 404 });
  }

  // Parse achievements and badges
  const achievements = targetProfile.achievements || [];
  const badges = targetProfile.badges || [];

  const likedAgentIds = achievements.filter((a: string) => a.startsWith('liked:')).map((a: string) => a.split(':')[1]);
  const sharedAgentIds = achievements.filter((a: string) => a.startsWith('shared:')).map((a: string) => a.split(':')[1]);
  const friendUserIds = achievements.filter((a: string) => a.startsWith('friend:')).map((a: string) => a.split(':')[1]);
  const bookmarkedAgentIds = badges;

  // Fetch agents
  const allAgentIds = Array.from(new Set([...likedAgentIds, ...sharedAgentIds, ...bookmarkedAgentIds]));
  let agents: Agent[] = [];
  
  if (allAgentIds.length > 0) {
    const { data: agentsData } = await supabase
      .from('agents')
      .select('id, name, slug, cover_url, category, slogan')
      .in('id', allAgentIds);
      
    if (agentsData) {
      agents = agentsData.map((a: any) => mapToRegistry(a)) as any as Agent[];
    }
  }

  // Fetch friends
  let friends: any[] = [];
  if (friendUserIds.length > 0) {
    const { data: friendsData } = await supabase
      .from('profiles')
      .select('id, username, xp')
      .in('id', friendUserIds);
      
    if (friendsData) {
      friends = friendsData;
    }
  }

  const isCurrentUser = session?.user?.id === targetUserId;
  
  // Check if current user is friend with target user
  let isFriend = false;
  if (session?.user && !isCurrentUser) {
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('achievements')
      .eq('id', session.user.id)
      .single();
      
    if (currentUserProfile) {
      isFriend = (currentUserProfile.achievements || []).includes(`friend:${targetUserId}`);
    }
  }

  return {
    targetProfile,
    agents,
    friends,
    likedAgentIds,
    sharedAgentIds,
    bookmarkedAgentIds,
    isCurrentUser,
    isFriendInitial: isFriend
  };
};

export default function ProfileRoute() {
  const { 
    targetProfile, agents, friends, 
    likedAgentIds, sharedAgentIds, bookmarkedAgentIds, 
    isCurrentUser, isFriendInitial 
  } = useLoaderData<typeof loader>();
  
  const { isLoggedIn, profile } = useOutletContext<LayoutContext>();
  const fetcher = useFetcher();
  
  const isFriend = fetcher.data?.success ? fetcher.data.isFriend : isFriendInitial;
  const canViewDynamics = isCurrentUser || isFriend;

  const getAgents = (ids: string[]) => agents.filter(a => ids.includes(a.id));

  const renderAgentList = (list: Agent[], emptyMessage: string) => {
    if (!canViewDynamics) {
      return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center mt-4">
          <Lock size={24} className="mx-auto text-slate-500 mb-2" />
          <div className="text-slate-400 font-mono text-sm">
            This activity is private. Add as a friend to view.
          </div>
        </div>
      );
    }

    if (list.length === 0) {
      return <div className="text-slate-500 font-mono text-sm py-4">{emptyMessage}</div>;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {list.map(agent => (
          <Link key={agent.id} to={`/agent/${agent.slug || agent.id}`} className="block group">
            <div className="border border-white/10 bg-white/5 rounded-lg p-4 hover:border-cyan-500/50 transition-colors">
              <div className="flex items-center gap-3">
                {agent.assets?.cover_url ? (
                  <img src={agent.assets.cover_url} alt={agent.name} className="w-10 h-10 rounded object-cover" loading="lazy" decoding="async" />
                ) : (
                  <div className="w-10 h-10 rounded bg-cyan-900/20 flex items-center justify-center">
                    <Terminal size={16} className="text-cyan-500" />
                  </div>
                )}
                <div>
                  <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{agent.name}</div>
                  <div className="text-xs text-slate-400 truncate">{agent.slogan || agent.category}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 lg:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center">
              <span className="text-3xl font-mono text-cyan-400">
                {(targetProfile.username || 'ANON').substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{targetProfile.username}</h1>
              <div className="flex items-center gap-4 mt-2 font-mono text-sm text-slate-400">
                <span>LVL {Math.floor((targetProfile.xp || 0) / 1000) + 1}</span>
                <span>•</span>
                <span>{targetProfile.xp || 0} XP</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isCurrentUser && (
              <button 
                onClick={() => {
                  // The actual logout logic is handled by the LayoutContext, but we don't have it directly here.
                  // We can just redirect to a logout route or use a form.
                  // For now, let's use a simple form to a logout route, or just call supabase.auth.signOut()
                  // Actually, we can use the supabase client directly here since it's client-side.
                  import('../../lib/supabase').then(({ supabase }) => {
                    if (supabase) {
                      supabase.auth.signOut().then(() => {
                        window.location.href = '/';
                      });
                    }
                  });
                }}
                className="px-6 py-3 rounded-lg font-mono text-sm transition-colors bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10"
              >
                LOGOUT
              </button>
            )}
            
            {!isCurrentUser && isLoggedIn && (
              <fetcher.Form method="post">
                <input type="hidden" name="actionType" value="toggle_friend" />
                <button 
                  type="submit"
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-mono text-sm transition-colors ${
                    isFriend 
                      ? 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400' 
                      : 'bg-cyan-500 text-black hover:bg-cyan-400'
                  }`}
                >
                  {isFriend ? (
                    <>
                      <UserMinus size={16} />
                      <span>REMOVE FRIEND</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      <span>ADD FRIEND</span>
                    </>
                  )}
                </button>
              </fetcher.Form>
            )}
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Agents */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-400 border-b border-white/10 pb-2">
                <Heart size={20} />
                Liked Agents
              </h2>
              {renderAgentList(getAgents(likedAgentIds), "No liked agents yet.")}
            </section>

            <section>
              <h2 className="text-xl font-bold flex items-center gap-2 text-yellow-500 border-b border-white/10 pb-2">
                <Bookmark size={20} />
                Bookmarked Agents
              </h2>
              {renderAgentList(getAgents(bookmarkedAgentIds), "No bookmarked agents yet.")}
            </section>

            <section>
              <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-400 border-b border-white/10 pb-2">
                <Share2 size={20} />
                Shared Agents
              </h2>
              {renderAgentList(getAgents(sharedAgentIds), "No shared agents yet.")}
            </section>
          </div>

          {/* Right Column: Friends */}
          <div className="space-y-8">
            <section className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white mb-6">
                <Users size={18} className="text-cyan-400" />
                Network Connections
              </h2>
              
              {friends.length === 0 ? (
                <div className="text-slate-500 font-mono text-sm">No connections established.</div>
              ) : (
                <div className="space-y-4">
                  {friends.map(friend => (
                    <Link key={friend.id} to={`/profile/${friend.id}`} className="flex items-center gap-3 group">
                      <div className="w-10 h-10 rounded-full bg-cyan-900/20 border border-cyan-500/20 flex items-center justify-center group-hover:border-cyan-400 transition-colors">
                        <span className="text-xs font-mono text-cyan-500 group-hover:text-cyan-400">
                          {(friend.username || 'ANON').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{friend.username}</div>
                        <div className="text-[10px] font-mono text-slate-500">LVL {Math.floor((friend.xp || 0) / 1000) + 1}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
