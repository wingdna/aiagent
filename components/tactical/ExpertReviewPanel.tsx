import React, { Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';
import { useInView } from 'react-intersection-observer';

const ReviewRadarChart = lazy(() => import('./ReviewRadarChart').then(m => ({ default: m.ReviewRadarChart })));

export const ExpertReviewPanel: React.FC<{ agentId: string }> = ({ agentId }) => {
    const { ref, inView } = useInView({
        triggerOnce: true,
        rootMargin: '100px 0px',
    });
    const { data: reviewData, isLoading } = useQuery({
        queryKey: ['expert-review', agentId],
        queryFn: () => dataService.getExpertReview(agentId),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (isLoading) {
        return (
            <section className="mt-8 border-t border-white/5 pt-6 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-gray-400 uppercase tracking-widest text-xs mb-4">Expert Review</h2>
                <div className="bg-black/60 border border-cyan-500/30 rounded-xl backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.15)] p-6">
                    <div className="border-l-2 border-cyan-400 pl-4">
                        <div className="grid grid-cols-3 mb-6 gap-4">
                            <div className="h-12 bg-white/5 animate-pulse rounded"></div>
                            <div className="h-12 bg-white/5 animate-pulse rounded"></div>
                            <div className="h-12 bg-white/5 animate-pulse rounded"></div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-6 mb-4 items-center sm:items-start">
                            <div className="w-32 h-32 bg-white/5 animate-pulse rounded-full shrink-0"></div>
                            <div className="space-y-2 w-full flex-1">
                                <div className="h-4 bg-white/5 animate-pulse rounded w-full"></div>
                                <div className="h-4 bg-white/5 animate-pulse rounded w-5/6"></div>
                                <div className="h-4 bg-white/5 animate-pulse rounded w-4/6"></div>
                            </div>
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
                    <div className="grid grid-cols-3 mb-6 gap-4">
                        <div className="flex flex-col">
                            <span className="text-2xl font-display text-white">{reviewData.inference_score || '-'}</span>
                            <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono">Inference</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-display text-white">{reviewData.creativity_score || '-'}</span>
                            <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono">Creativity</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-display text-white">{reviewData.speed_score || '-'}</span>
                            <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono">Speed</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-6 mb-4 items-center sm:items-start">
                        <div ref={ref} className="shrink-0 w-32 h-32">
                            {inView ? (
                                <Suspense fallback={<div className="w-32 h-32 rounded-full bg-gray-800 animate-pulse" />}>
                                    <ReviewRadarChart scores={{
                                        inference: reviewData.inference_score || 0,
                                        creativity: reviewData.creativity_score || 0,
                                        speed: reviewData.speed_score || 0
                                    }} />
                                </Suspense>
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gray-800" />
                            )}
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap flex-1">
                            {reviewData.summary}
                        </p>
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-500 font-mono mt-4">
                        <span>ELO: {reviewData.elo || 'N/A'}</span>
                        <span>{reviewData.tags ? (Array.isArray(reviewData.tags) ? reviewData.tags.join(', ') : reviewData.tags) : ''}</span>
                    </div>
                </div>
            </div>
        </section>
    );
};
