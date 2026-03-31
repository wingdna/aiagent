import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { Link } from 'react-router';
import { OmniRenderer } from '../content/OmniRenderer';
import { ReviewRadarChart } from './ReviewRadarChart';

export const ExpertReviewPanel: React.FC<{ agentId: string; agentSlug?: string }> = ({ agentId, agentSlug }) => {
    const { data: reviewData, isLoading } = useQuery({
        queryKey: ['expert-review', agentId, agentSlug],
        queryFn: () => dataService.getExpertReview(agentId, agentSlug),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (isLoading) {
        return (
            <section className="mt-8 border-t border-white/5 pt-6 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-gray-400 uppercase tracking-widest text-xs mb-4">Expert Review</h2>
                <div className="bg-black/60 border border-cyan-500/30 rounded-xl backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.15)] p-6">
                    <div className="border-l-2 border-cyan-400 pl-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 mb-6 gap-4">
                            <div className="h-12 bg-white/5 animate-pulse rounded"></div>
                            <div className="h-12 bg-white/5 animate-pulse rounded"></div>
                            <div className="h-12 bg-white/5 animate-pulse rounded"></div>
                        </div>
                        <div className="block">
                            <div className="float-left mr-6 mb-2 w-32 h-32 bg-white/5 animate-pulse rounded-full shrink-0"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-white/5 animate-pulse rounded w-full"></div>
                                <div className="h-4 bg-white/5 animate-pulse rounded w-5/6"></div>
                                <div className="h-4 bg-white/5 animate-pulse rounded w-4/6"></div>
                            </div>
                            <div className="clear-both"></div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <div className="h-4 bg-white/5 animate-pulse rounded w-20"></div>
                            <div className="h-4 bg-white/5 animate-pulse rounded w-24"></div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (!reviewData) {
        return null;
    }

    return (
        <section className="mt-8 border-t border-white/5 pt-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-gray-400 uppercase tracking-widest text-xs mb-4">Expert Review</h2>
            <div className="bg-black/60 border border-cyan-500/30 rounded-xl backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.15)] p-6">
                <div className="border-l-2 border-cyan-400 pl-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 mb-6 gap-4">
                        <div className="flex flex-col">
                            <span className="text-2xl font-display text-white">{reviewData.scores?.reasoning || reviewData.inference_score || '-'}</span>
                            <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono">Inference</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-display text-white">{reviewData.scores?.coding || reviewData.creativity_score || '-'}</span>
                            <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono">Coding</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-display text-white">{reviewData.scores?.speed || reviewData.speed_score || '-'}</span>
                            <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono">Speed</span>
                        </div>
                    </div>
                    
                    <div className="block relative">
                        <div 
                            className="float-left mr-6 mb-4 w-40 h-40 bg-cyan-500/5 rounded-full flex items-center justify-center border border-cyan-500/10 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]"
                            style={{ shapeOutside: 'circle(50%)', clipPath: 'circle(50%)' }}
                        >
                            <ReviewRadarChart scores={{
                                inference: reviewData.scores?.reasoning || reviewData.inference_score || 0,
                                creativity: reviewData.scores?.coding || reviewData.creativity_score || 0,
                                speed: reviewData.scores?.speed || reviewData.speed_score || 0
                            }} />
                        </div>
                        <div className="text-gray-300 text-sm leading-relaxed text-justify">
                            <OmniRenderer item={reviewData} />
                        </div>
                        <div className="clear-both"></div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-500 font-mono mt-4">
                        <span>ELO: {reviewData.elo || 'N/A'}</span>
                        <span className="flex gap-2 flex-wrap">
                            {reviewData.tags ? (
                                Array.isArray(reviewData.tags) ? (
                                    reviewData.tags.map((tag: string, idx: number) => (
                                        <Link key={idx} to={`/directory?q=${encodeURIComponent(tag)}`} className="hover:text-cyan-400 transition-colors">
                                            #{tag}
                                        </Link>
                                    ))
                                ) : (
                                    <Link to={`/directory?q=${encodeURIComponent(reviewData.tags)}`} className="hover:text-cyan-400 transition-colors">
                                        #{reviewData.tags}
                                    </Link>
                                )
                            ) : ''}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};
