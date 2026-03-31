import { useLoaderData, useNavigate, Link, useFetcher, useOutletContext } from "react-router";
import React, { useState, useMemo, useEffect, useRef } from "react";
import type { MetaFunction, ActionFunctionArgs } from "react-router";
import { supabaseServer } from "../../lib/supabase.server";
import { ArrowLeft, ChevronDown, ChevronUp, Send, Terminal, Image as ImageIcon, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { mapToRegistry } from "../utils/mapper.server";
import { UserProfile } from "../../types";
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface LayoutContext {
  profile: UserProfile;
  isLoggedIn: boolean;
  addXp: (amount: number) => void;
  unlockAchievement: (id: string, xpReward: number) => boolean;
  syncUserProgress: (newProfile: UserProfile) => void;
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  if (!supabaseServer) throw new Response("Supabase client not initialized", { status: 500 });
  
  const formData = await request.formData();
  const content = formData.get("content") as string;
  const agentId = formData.get("agent_id") as string;
  const userId = formData.get("user_id") as string;

  if (!content || !agentId) {
    return { error: "Missing required fields" };
  }

  const { data, error } = await supabaseServer
    .from('comments')
    .insert([
      { 
        agent_id: agentId, 
        user_id: userId || "ANON", 
        content: content 
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("Error inserting comment:", error);
    return { error: error.message };
  }

  return { success: true, comment: data };
};

export const loader = async (args: any) => {
  let { slug } = args.params;
  
  if (slug && slug.endsWith('.data')) {
    slug = slug.replace(/\.data$/, '');
  }
  
  if (slug) {
      try {
          slug = decodeURIComponent(slug);
      } catch (e) {
          // ignore
      }
  }
  
  if (!supabaseServer) throw new Response("Supabase client not initialized", { status: 500 });

  try {
    let { data: agentData, error: agentError } = await supabaseServer.from('agents').select('id, name, slug, category, slogan, cover_url, video_url, video_poster, capability_tags, tags, nri_score, tactical_badges, metrics, specs, pricing, faq_content').eq('slug', slug).single();
    
    if (agentError || !agentData) {
      const { data: byIdData, error: byIdError } = await supabaseServer.from('agents').select('id, name, slug, category, slogan, cover_url, video_url, video_poster, capability_tags, tags, nri_score, tactical_badges, metrics, specs, pricing, faq_content').eq('id', slug).single();
      if (byIdError || !byIdData) {
        return { agent: null, comments: [], posts: [] };
      }
      agentData = byIdData;
    }

    // Parallel fetch
    const [commentsRes, postsRes] = await Promise.all([
      supabaseServer.from('comments').select('*').eq('agent_id', agentData.id).order('created_at', { ascending: true }),
      supabaseServer.from('posts').select('id, title, content, author, created_at').eq('agent_id', agentData.id).order('created_at', { ascending: false })
    ]);

    const registry = mapToRegistry(agentData);

    return { 
      agent: JSON.parse(JSON.stringify(registry)),
      comments: JSON.parse(JSON.stringify(commentsRes.data || [])),
      posts: JSON.parse(JSON.stringify(postsRes.data || []))
    };
  } catch (error) {
    console.error("Loader error:", error);
    return { agent: null, comments: [], posts: [] };
  }
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.agent) return [{ title: "Lounge Not Found | YouAgent OS" }];
  return [
    { title: `${data.agent.name || "Agent"} Lounge | YouAgent OS` },
  ];
};

function FaqAccordion({ faq, isFirst }: { faq: any, isFirst: boolean }) {
  const [isOpen, setIsOpen] = useState(isFirst);
  return (
    <div className="mb-4 border-l-2 border-cyan-500/40 bg-cyan-500/5 backdrop-blur-md overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-4 flex items-center justify-between hover:bg-cyan-500/10 transition-colors"
      >
        <span className={`font-mono text-sm uppercase tracking-wider transition-all ${isOpen ? 'text-cyan-400 [text-shadow:0_0_8px_rgba(34,211,238,0.6)]' : 'text-cyan-500'}`}>
          {'>_'} {faq.question || faq.q}
        </span>
        {isOpen ? <ChevronUp size={16} className="text-cyan-500" /> : <ChevronDown size={16} className="text-cyan-500" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="px-4 pb-4 font-mono text-slate-400 text-sm leading-relaxed"
          >
            <div className="pt-2 border-t border-cyan-500/20">
              {faq.answer || faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AgentLoungeRoute() {
  const { agent, comments: initialComments, posts } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const context = useOutletContext<LayoutContext>();
  const { profile, isLoggedIn } = context;
  
  const [comments, setComments] = useState(initialComments || []);
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (fetcher.data?.success && fetcher.data?.comment) {
      setComments((prev: any) => 
        prev.map((c: any) => c.id.toString().startsWith('temp-') && c.content === fetcher.data.comment.content ? fetcher.data.comment : c)
      );
    }
  }, [fetcher.data]);

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white font-mono bg-[#050505]">
        <div className="text-center">
          <h1 className="text-4xl text-cyan-500 mb-4">AGENT_NOT_FOUND</h1>
          <p className="text-gray-400">The requested neural entity could not be located.</p>
          <button onClick={() => navigate('/', { viewTransition: true })} className="mt-8 px-6 py-2 border border-cyan-500 text-cyan-500 rounded hover:bg-cyan-500/10">
            Return to Base
          </button>
        </div>
      </div>
    );
  }

  const faqs = agent.faq || [];

  const handleSend = () => {
    if (!input.trim() || fetcher.state !== "idle") return;
    
    const userId = isLoggedIn ? (profile.username || profile.id) : "ANON_" + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Optimistic UI update
    const optimisticComment = {
      id: "temp-" + Math.random().toString(36).substring(7),
      user_id: userId,
      content: input,
      created_at: new Date().toISOString(),
    };
    setComments((prev: any) => [...prev, optimisticComment]);
    
    fetcher.submit(
      { 
        content: input, 
        agent_id: agent.id,
        user_id: userId
      } as any,
      { method: "post" }
    );
    
    setInput('');
  };

  const onEmojiClick = (emojiObject: any) => {
    setInput(prevInput => prevInput + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden text-white">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(6,182,212,0.05)_0%,_transparent_60%)] pointer-events-none" />
      
      {/* Header / Breadcrumbs */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b border-white/5 bg-white/2 backdrop-blur-md">
        <div className="font-mono text-[10px] uppercase tracking-widest text-cyan-400/60 flex items-center gap-2">
          <Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link>
          <span>//</span>
          <Link to="/directory" className="hover:text-cyan-400 transition-colors">{agent.category || 'UNKNOWN'}</Link>
          <span>//</span>
          <Link to={`/agent/${agent.slug || agent.id}`} className="hover:text-cyan-400 transition-colors">{agent.name}</Link>
          <span>//</span>
          <span className="text-cyan-400">[LOUNGE]</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-10 flex flex-col lg:flex-row lg:overflow-hidden overflow-y-auto cyber-scroll">
        
        {/* Left Core Area */}
        <div className="flex-1 flex flex-col lg:border-r border-white/10 lg:overflow-y-auto cyber-scroll">
          
          {/* FAQ Section */}
          {faqs.length > 0 && (
            <div className="p-6 border-b border-white/10 shrink-0">
              <h2 className="font-mono text-sm text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Terminal size={14} />
                [SYSTEM_INTEL_ARCHIVE]
              </h2>
              <div className="space-y-2">
                {faqs.map((faq: any, i: number) => (
                  <FaqAccordion key={i} faq={faq} isFirst={i === 0} />
                ))}
              </div>
            </div>
          )}

          {/* Posts Section */}
          <div className="p-6 border-b border-white/10 shrink-0">
            <h2 className="font-mono text-sm text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Terminal size={14} />
              [DATA_CLUSTER_THREADS]
            </h2>
            <div className="grid gap-4">
              {posts.map((post: any) => (
                <div key={post.id} className="p-4 border border-white/5 bg-white/5 rounded-lg">
                  <h3 className="text-lg font-bold text-white tracking-wide mb-2">{post.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4">{post.content}</p>
                  <div className="text-[10px] text-slate-600 font-mono">
                    {post.author} • {post.created_at && !isNaN(new Date(post.created_at).getTime()) ? new Date(post.created_at).toLocaleDateString() : 'UNKNOWN DATE'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div className="p-6">
            <h2 className="font-mono text-sm text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
              <Terminal size={14} />
              [NEURAL_COMMS_FEED]
            </h2>
            
            <div className="space-y-4">
              {comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-4 p-3 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-cyan-900/30 flex items-center justify-center shrink-0">
                    <span className="font-mono text-xs text-cyan-400">{(comment.user_id || 'ANON').substring(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 font-sans whitespace-pre-wrap break-words">{comment.content}</p>
                    {comment.image_url && <img src={comment.image_url} alt="comment" className="mt-2 max-w-[150px] rounded-lg" loading="lazy" decoding="async" />}
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>
          </div>
        </div>

        {/* Right Tactical Widgets */}
        <div className="w-full lg:w-80 shrink-0 p-6 bg-black/20 flex flex-col gap-6 border-t lg:border-t-0 border-white/10 lg:overflow-y-auto cyber-scroll">
          <div className="border border-cyan-500/20 bg-black/40 p-4 backdrop-blur-md">
            <h3 className="font-mono text-[10px] text-gray-500 uppercase tracking-widest mb-2">Target Entity</h3>
            <div className="flex items-center gap-3">
              {agent.cover_url ? (
                <img src={agent.cover_url} alt={agent.name} className="w-12 h-12 rounded-sm border border-cyan-500/30 object-cover" loading="lazy" decoding="async" />
              ) : (
                <div className="w-12 h-12 rounded-sm border border-cyan-500/30 bg-cyan-900/20 flex items-center justify-center">
                  <Terminal size={20} className="text-cyan-500" />
                </div>
              )}
              <div>
                <div className="font-mono text-sm text-cyan-400 truncate">{agent.name}</div>
                <div className="font-mono text-[10px] text-gray-500">NRI: {agent.nri_score || 'CALCULATING...'}</div>
              </div>
            </div>
          </div>

          <div className="border border-cyan-500/20 bg-black/40 p-4 backdrop-blur-md">
            <h3 className="font-mono text-[10px] text-gray-500 uppercase tracking-widest mb-2">Active Synapses</h3>
            <div className="font-mono text-2xl text-cyan-500">{Math.floor(Math.random() * 100) + 12}</div>
            <div className="font-mono text-[10px] text-cyan-500/50 mt-1">Concurrent connections</div>
          </div>
        </div>
      </div>

      {/* Bottom Input */}
      <div className="relative z-10 p-6 border-t border-white/10 bg-[#050505]/60 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto flex items-center gap-2 relative">
          <div ref={emojiPickerRef} className="relative">
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-slate-500 hover:text-cyan-400"
            >
              <Smile size={20} />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 z-[100]">
                <EmojiPicker 
                  onEmojiClick={onEmojiClick} 
                  theme={Theme.DARK}
                  lazyLoadEmojis={true}
                />
              </div>
            )}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter neural command..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 font-mono text-sm text-white focus:outline-none focus:border-cyan-400 resize-none"
            rows={1}
          />
          <button className="text-slate-500 hover:text-cyan-400"><ImageIcon size={20} /></button>
          <button onClick={handleSend} className="text-cyan-400 hover:text-cyan-300"><Send size={20} /></button>
        </div>
      </div>
    </div>
  );
}
