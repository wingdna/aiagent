import React, { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence, useInView } from 'framer-motion';
import { contentService } from '../../services/contentService';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis, Tooltip
} from 'recharts';

import { Star, Shield, Zap, TrendingUp, ArrowRight, X, LayoutGrid, List, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useNavigate, Link, useParams } from 'react-router';

import { OmniRenderer } from '../content/OmniRenderer';

import { AgentReview } from '../../types';

export const ReviewBoard: React.FC<{ initialReviews?: AgentReview[] }> = ({ initialReviews }) => {
    const navigate = useNavigate();
    const { slug } = useParams();
    const [reviews, setReviews] = useState<AgentReview[]>(initialReviews || []);
    const [loading, setLoading] = useState(!initialReviews);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

    useEffect(() => {
        const fetchReviews = async () => {
            if (initialReviews && initialReviews.length > 0) {
                setLoading(false);
                return;
            }
            
            try {
                const data = await contentService.getAllExpertReviews();
                const allReviews = data as AgentReview[] || [];
                setReviews(allReviews);
            } catch (err) {
                console.error('[ReviewBoard] Error fetching reviews:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [initialReviews]);

    useEffect(() => {
        if (reviews.length > 0 && slug) {
            const review = reviews.find(r => r.agents?.slug === slug || r.agent_id_link === slug || r.id === slug);
            if (review) {
                setSelectedReviewId(review.id);
            } else {
                setSelectedReviewId(null);
            }
        } else if (!slug) {
            setSelectedReviewId(null);
        }
    }, [slug, reviews]);

    const selectedReview = reviews.find(r => r.id === selectedReviewId);
    const selectedIndex = reviews.findIndex(r => r.id === selectedReviewId);

    const handleNext = () => {
        if (selectedIndex < reviews.length - 1) {
            navigate(`/reviews/${reviews[selectedIndex + 1].id}`, { viewTransition: true });
        }
    };

    const handlePrev = () => {
        if (selectedIndex > 0) {
            navigate(`/reviews/${reviews[selectedIndex - 1].id}`, { viewTransition: true });
        }
    };

    const avgNRI = reviews.length > 0 
        ? (reviews.reduce((acc, r) => acc + (Number(r.agents?.nri_score || r.agents?.metrics?.nri_score) || 0), 0) / reviews.length).toFixed(1)
        : "0.0";

    const globalChartData = [
        { subject: 'Reasoning', A: reviews.length > 0 ? reviews.reduce((acc, r) => acc + (Number(r.scores?.reasoning) || 0), 0) / reviews.length : 0 },
        { subject: 'Coding', A: reviews.length > 0 ? reviews.reduce((acc, r) => acc + (Number(r.scores?.coding) || 0), 0) / reviews.length : 0 },
        { subject: 'Speed', A: reviews.length > 0 ? reviews.reduce((acc, r) => acc + (Number(r.scores?.speed) || 0), 0) / reviews.length : 0 },
        { subject: 'Reliability', A: reviews.length > 0 ? reviews.reduce((acc, r) => acc + (Number(r.scores?.reliability) || 0), 0) / reviews.length : 0 },
        { subject: 'Creativity', A: reviews.length > 0 ? reviews.reduce((acc, r) => acc + (Number(r.scores?.creativity) || 0), 0) / reviews.length : 0 },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const Breadcrumbs = () => (
        <nav className="flex items-center gap-2 mb-2 text-[10px] md:text-xs font-mono text-gray-500 uppercase tracking-[0.2em]">
            <button 
                onClick={() => navigate('/', { viewTransition: true })} 
                className="hover:text-cyan-400 transition-colors flex items-center gap-1 group"
            >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">/</span>
                HOME
            </button>
            <ChevronRight size={10} className="text-gray-800" />
            <button 
                onClick={() => navigate('/reviews', { viewTransition: true })} 
                className={`hover:text-cyan-400 transition-colors group ${!selectedReview ? 'text-cyan-400 font-bold' : ''}`}
            >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">/</span>
                EXPERT INTELLIGENCE BOARD
            </button>
            {selectedReview && (
                <>
                    <ChevronRight size={10} className="text-gray-800" />
                    <span className="text-cyan-400/80 font-bold truncate max-w-[150px] md:max-w-[300px]">
                        {selectedReview.title?.toUpperCase()}
                    </span>
                </>
            )}
        </nav>
    );

    return (
        <m.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full min-h-full flex flex-col"
        >
            {/* Header */}
            <header className="py-6 border-b border-white/10 flex items-center justify-between px-8 bg-black/40 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                        <TrendingUp className="text-cyan-400 w-6 h-6" />
                    </div>
                    <div>
                        <Breadcrumbs />
                        <h1 className="text-xl font-display font-bold text-white tracking-widest uppercase">Expert Intelligence Board</h1>
                        <p className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-[0.2em] mt-1">Neural Evaluation & Strategic Analysis</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 p-8 relative">
                <AnimatePresence mode="wait">
                    {selectedReview ? (
                        <m.div
                            key="detail"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-4xl mx-auto"
                        >
                            {/* Detail Navigation */}
                            <div className="flex items-center justify-between mb-8">
                                <button 
                                    onClick={() => navigate('/reviews', { viewTransition: true })}
                                    className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors group"
                                >
                                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                                    <span className="font-mono text-xs uppercase tracking-widest">Back to Board</span>
                                </button>

                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={handlePrev}
                                        disabled={selectedIndex === 0}
                                        className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <span className="font-mono text-[10px] text-gray-500 uppercase">
                                        {selectedIndex + 1} / {reviews.length}
                                    </span>
                                    <button 
                                        onClick={handleNext}
                                        disabled={selectedIndex === reviews.length - 1}
                                        className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Review Content */}
                            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                                <div className="h-64 relative">
                                    <img 
                                        src={selectedReview.agents?.cover_url || `https://picsum.photos/seed/${selectedReview.agents?.slug}/1200/400`}
                                        className="w-full h-full object-cover opacity-50"
                                        referrerPolicy="no-referrer"
                                        loading="eager"
                                        decoding="sync"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent" />
                                    <div className="absolute bottom-8 left-8 right-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 bg-cyan-500/10 rounded border border-cyan-500/20 uppercase">
                                                {selectedReview.agents?.category}
                                            </span>
                                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                                                Published: {selectedReview.updated_at ? new Date(selectedReview.updated_at).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                        <h2 className="text-4xl font-bold text-white mb-2">{selectedReview.title}</h2>
                                        <p className="text-xl text-cyan-400/80 font-medium italic">Expert analysis of {selectedReview.agents?.name}</p>
                                    </div>
                                </div>

                                <div className="p-12">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
                                        <div className="lg:col-span-2 prose prose-invert prose-cyan max-w-none">
                                            <div className="markdown-body text-gray-300 leading-relaxed text-lg">
                                                <OmniRenderer item={selectedReview as any} size="lg" />
                                            </div>
                                        </div>
                                        <div className="space-y-8">
                                            <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
                                                <h4 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-6">Neural Performance</h4>
                                                <div className="h-48 w-full">
                                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                                            { subject: 'Reasoning', A: Number(selectedReview.scores?.reasoning) || 0 },
                                                            { subject: 'Coding', A: Number(selectedReview.scores?.coding) || 0 },
                                                            { subject: 'Speed', A: Number(selectedReview.scores?.speed) || 0 },
                                                            { subject: 'Reliability', A: Number(selectedReview.scores?.reliability) || 0 },
                                                            { subject: 'Creativity', A: Number(selectedReview.scores?.creativity) || 0 },
                                                        ]}>
                                                            <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
                                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                            <Radar
                                                                name={selectedReview.agents?.name}
                                                                dataKey="A"
                                                                stroke="#06b6d4"
                                                                fill="#06b6d4"
                                                                fillOpacity={0.4}
                                                            />
                                                        </RadarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                                                    <span className="text-[10px] font-mono text-gray-500 uppercase">NRI_SCORE</span>
                                                    <span className="text-2xl font-display font-black text-cyan-400">{selectedReview.agents?.nri_score || selectedReview.agents?.metrics?.nri_score || 0}</span>
                                                </div>
                                            </div>

                                            <Link 
                                                to={`/agent/${selectedReview.agents?.slug}`}
                                                className="w-full py-4 bg-cyan-500 text-black font-bold uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-3 group"
                                            >
                                                Deploy Agent <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </m.div>
                    ) : loading ? (
                        <m.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col items-center justify-center gap-4"
                        >
                            <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                            <span className="font-mono text-xs text-cyan-400 animate-pulse">SYNCHRONIZING_NEURAL_REVIEWS...</span>
                        </m.div>
                    ) : (
                        <m.div 
                            key="list"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-7xl mx-auto space-y-12"
                        >
                            {/* Global Summary Section */}
                            <m.section 
                                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                            >
                                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row gap-8">
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-white mb-4">Neural Ecosystem Overview</h2>
                                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                            Aggregated intelligence metrics across all evaluated agents. Our neural network analysis identifies trends in reasoning capabilities, speed optimization, and creative output across the current sector.
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                                <div className="text-[10px] font-mono text-gray-500 uppercase">Total Evaluations</div>
                                                <div className="text-2xl font-black text-cyan-400">{reviews.length}</div>
                                            </div>
                                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                                <div className="text-[10px] font-mono text-gray-500 uppercase">Avg NRI Score</div>
                                                <div className="text-2xl font-black text-cyan-400">
                                                    {avgNRI}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-64 h-64 bg-cyan-500/5 rounded-2xl border border-cyan-500/10 p-4">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={globalChartData}>
                                                <PolarGrid stroke="rgba(6,182,212,0.2)" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(6,182,212,0.5)', fontSize: 10 }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                <Radar name="Average" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#06b6d4' }}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-cyan-500/20 to-transparent border border-cyan-500/30 rounded-3xl p-8 flex flex-col justify-center relative overflow-hidden">
                                    <div className="relative z-10">
                                        <Zap className="text-cyan-400 w-12 h-12 mb-6" />
                                        <h3 className="text-xl font-bold text-white mb-2">Strategic Insight</h3>
                                        <p className="text-cyan-100/70 text-sm leading-relaxed">
                                            The current trend shows a 14% increase in reasoning efficiency across LLM-based agents. We recommend prioritizing agents with high reliability scores for mission-critical deployments.
                                        </p>
                                    </div>
                                    <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
                                </div>
                            </m.section>

                            <m.div 
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className={viewMode === 'grid' 
                                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" 
                                    : "space-y-6 max-w-5xl mx-auto"
                                }
                            >
                                {reviews.map((review) => (
                                    <ReviewCard 
                                        key={review.id} 
                                        review={review} 
                                        viewMode={viewMode} 
                                        onSelect={() => navigate(`/reviews/${review.id}`, { viewTransition: true })}
                                    />
                                ))}
                            </m.div>
                        </m.div>
                    )}
                </AnimatePresence>
            </main>
        </m.div>
    );
};

const ReviewCard: React.FC<{ review: AgentReview, viewMode: 'grid' | 'list', onSelect: () => void }> = ({ review, viewMode, onSelect }) => {
    const agent = review.agents;
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "200px 0px" });

    const scores = [
        { subject: 'Reasoning', A: Number(review.scores?.reasoning) || 0 },
        { subject: 'Coding', A: Number(review.scores?.coding) || 0 },
        { subject: 'Speed', A: Number(review.scores?.speed) || 0 },
        { subject: 'Reliability', A: Number(review.scores?.reliability) || 0 },
        { subject: 'Creativity', A: Number(review.scores?.creativity) || 0 },
    ];

    if (viewMode === 'list') {
        return (
            <m.div 
                ref={ref}
                variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                onClick={onSelect}
                className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 transition-all flex gap-8 items-center cursor-pointer"
            >
                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-white/10">
                    <img 
                        src={agent?.cover_url || `https://picsum.photos/seed/${agent?.slug}/200/200`} 
                        alt={agent?.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 bg-cyan-500/10 rounded border border-cyan-500/20 uppercase">
                            {agent?.category}
                        </span>
                        <h3 className="text-xl font-bold text-white truncate">{agent?.name}</h3>
                    </div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2 italic">"{review.title}"</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{review.summary}</p>
                </div>

                <div className="w-48 h-32 shrink-0">
                    {isInView ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={scores}>
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 8 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name={agent?.name}
                                    dataKey="A"
                                    stroke="#06b6d4"
                                    fill="#06b6d4"
                                    fillOpacity={0.3}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#06b6d4' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-cyan-400 group-hover:border-cyan-500/50 group-hover:bg-cyan-500/10 transition-all shrink-0">
                    <BookOpen size={20} />
                </div>
            </m.div>
        );
    }

    return (
        <m.div 
            ref={ref}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            onClick={onSelect}
            className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-cyan-500/50 transition-all flex flex-col cursor-pointer"
        >
            {/* Card Header Image */}
            <div className="h-48 relative overflow-hidden">
                <img 
                    src={agent?.cover_url || `https://picsum.photos/seed/${agent?.slug}/400/300`} 
                    alt={agent?.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                <div className="absolute bottom-4 left-6 right-6">
                    <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 bg-cyan-500/10 rounded border border-cyan-500/20 uppercase mb-2 inline-block">
                        {agent?.category}
                    </span>
                    <h3 className="text-2xl font-bold text-white">{agent?.name}</h3>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-6 flex-1 flex flex-col">
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-cyan-100 mb-2 line-clamp-1">{review.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{review.summary}</p>
                </div>

                {/* Chart Area */}
                <div className="h-56 w-full bg-black/40 rounded-2xl border border-white/5 p-4 mb-6 relative">
                    <div className="absolute top-4 right-4 flex flex-col items-end">
                        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">NRI_SCORE</div>
                        <div className="text-2xl font-display font-black text-cyan-400">{agent?.nri_score || agent?.metrics?.nri_score || 0}</div>
                    </div>

                    {isInView ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={scores}>
                                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name={agent?.name}
                                    dataKey="A"
                                    stroke="#06b6d4"
                                    fill="#06b6d4"
                                    fillOpacity={0.4}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#06b6d4' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex -space-x-2">
                        {[Star, Shield, Zap].map((Icon, i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400/60">
                                <Icon size={14} />
                            </div>
                        ))}
                    </div>
                    
                    <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase tracking-widest rounded-lg group-hover:bg-cyan-500 group-hover:text-black transition-all flex items-center gap-2">
                        Read Review <BookOpen size={12} />
                    </div>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                <div className="absolute top-4 right-4 w-1 h-1 bg-cyan-500 rounded-full animate-pulse" />
                <div className="absolute top-4 right-6 w-4 h-[1px] bg-cyan-500/30" />
                <div className="absolute top-6 right-4 w-[1px] h-4 bg-cyan-500/30" />
            </div>
        </m.div>
    );
};
