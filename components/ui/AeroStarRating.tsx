import React from 'react';
import { Star } from 'lucide-react';

interface AeroStarRatingProps {
    rating: number; // 0-100
    className?: string;
}

export const AeroStarRating: React.FC<AeroStarRatingProps> = ({ rating, className = '' }) => {
    // Normalize 0-100 to 0-5
    const normalized = Math.max(0, Math.min(100, rating)) / 20;
    const fullStars = Math.floor(normalized);
    const partialPercent = (normalized - fullStars) * 100;

    return (
        <div className={`flex items-center gap-1 ${className}`} aria-label={`${normalized.toFixed(1)} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((i) => {
                const isFull = i <= fullStars;
                const isPartial = i === fullStars + 1;
                
                return (
                    <div key={i} className="relative">
                        {/* Background Star (Empty) */}
                        <Star
                            size={14}
                            className="text-gray-800 fill-transparent"
                            strokeWidth={1.5}
                        />
                        
                        {/* Foreground Star (Full or Partial) */}
                        {(isFull || isPartial) && (
                            <div 
                                className="absolute top-0 left-0 overflow-hidden"
                                style={{ width: isFull ? '100%' : `${partialPercent}%` }}
                            >
                                <Star
                                    size={14}
                                    className="text-cyan-400 fill-cyan-400/20 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]"
                                    strokeWidth={1.5}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
