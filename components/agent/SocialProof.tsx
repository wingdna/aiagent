import React from 'react';
import { Github, Twitter, Globe, Star, MessageSquare } from 'lucide-react';

interface SocialProofProps {
    developer_socials?: {
        github?: string;
        twitter?: string;
        website?: string;
        [key: string]: string | undefined;
    };
    social_proof?: {
        rating?: number;
        reviews_count?: number;
        testimonials?: Array<{ user: string; comment: string; rating: number }>;
        [key: string]: any;
    };
}

export const SocialProof: React.FC<SocialProofProps> = ({ developer_socials, social_proof }) => {
    const hasSocials = developer_socials && Object.keys(developer_socials).length > 0;
    const hasProof = social_proof && (social_proof.rating || social_proof.reviews_count || (social_proof.testimonials && social_proof.testimonials.length > 0));

    if (!hasSocials && !hasProof) return null;

    return (
        <div className="bg-black/20 border border-white/5 rounded-xl p-4 backdrop-blur-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 text-cyan-400 border-b border-white/5 pb-2">
                <Star size={18} />
                <h3 className="font-mono text-sm uppercase tracking-widest font-bold">Social Resonance</h3>
            </div>

            {hasProof && (
                <div className="flex items-center gap-4">
                    {social_proof?.rating && (
                        <div className="flex items-center gap-1 text-yellow-400">
                            <Star size={16} fill="currentColor" />
                            <span className="font-mono font-bold text-lg">{social_proof.rating.toFixed(1)}</span>
                        </div>
                    )}
                    {social_proof?.reviews_count && (
                        <div className="text-gray-500 text-xs font-mono uppercase">
                            {social_proof.reviews_count} Reviews
                        </div>
                    )}
                </div>
            )}

            {hasSocials && (
                <div className="flex gap-4">
                    {developer_socials?.github && (
                        <a href={developer_socials.github} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                            <Github size={20} />
                        </a>
                    )}
                    {developer_socials?.twitter && (
                        <a href={developer_socials.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-cyan-400 transition-colors">
                            <Twitter size={20} />
                        </a>
                    )}
                    {developer_socials?.website && (
                        <a href={developer_socials.website} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-green-400 transition-colors">
                            <Globe size={20} />
                        </a>
                    )}
                </div>
            )}

            {social_proof?.testimonials && social_proof.testimonials.length > 0 && (
                <div className="mt-2 border-t border-white/5 pt-2">
                    <div className="text-xs text-gray-400 italic">
                        "{social_proof.testimonials[0].comment}"
                    </div>
                    <div className="text-[10px] text-gray-600 font-mono mt-1 text-right">
                        — {social_proof.testimonials[0].user}
                    </div>
                </div>
            )}
        </div>
    );
};
