
import React from 'react';

export const SkeletonTacticalHUD: React.FC = () => {
    return (
        <div className="relative w-full h-full flex flex-col font-sans bg-black bg-topology overflow-hidden">
            {/* Background Placeholder */}
            <div className="absolute inset-0 bg-gray-900/20 z-0 animate-pulse"></div>

            {/* Right Rail Skeleton */}
            <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[100] flex flex-col items-end gap-4 p-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-lg bg-gray-800 animate-pulse border border-white/5"></div>
                ))}
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 h-auto lg:h-full w-full max-w-[1920px] mx-auto pt-24 px-6 lg:px-12 gap-8">
                
                {/* COL 1: Identity Skeleton */}
                <div className="col-span-1 lg:col-span-3 flex flex-col space-y-6">
                    <div className="h-4 w-24 bg-gray-800 rounded animate-pulse"></div>
                    <div className="h-12 w-48 bg-gray-800 rounded animate-pulse"></div>
                    <div className="h-20 w-full bg-gray-800/50 border-l-4 border-gray-700 rounded animate-pulse"></div>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => <div key={i} className="h-6 w-16 bg-gray-800 rounded animate-pulse"></div>)}
                    </div>
                </div>

                {/* COL 2: Visual Skeleton */}
                <div className="col-span-1 lg:col-span-5 flex flex-col space-y-6">
                    {/* HoloFrame Skeleton */}
                    <div className="w-full aspect-video bg-gray-900 border border-gray-800 rounded-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_linear_infinite]"></div>
                    </div>
                    <div className="h-32 w-full bg-gray-900/50 rounded-lg animate-pulse border border-gray-800"></div>
                </div>

                {/* COL 3: Data Skeleton */}
                <div className="col-span-1 lg:col-span-4 flex flex-col space-y-4">
                    <div className="h-40 w-full bg-gray-900 rounded-xl animate-pulse border border-gray-800"></div>
                    <div className="h-24 w-full bg-gray-900/50 rounded-xl animate-pulse border border-gray-800"></div>
                    <div className="h-32 w-full bg-gray-900/30 rounded-xl animate-pulse border border-gray-800"></div>
                </div>

            </div>
        </div>
    );
};
