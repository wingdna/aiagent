import React, { useEffect, useState } from 'react';

interface ReviewRadarChartProps {
    scores: {
        inference: number;
        creativity: number;
        speed: number;
    };
}

export const ReviewRadarChart: React.FC<ReviewRadarChartProps> = ({ scores }) => {
    const [animatedScores, setAnimatedScores] = useState({ inference: 0, creativity: 0, speed: 0 });

    useEffect(() => {
        // Trigger animation after mount
        const timer = setTimeout(() => {
            setAnimatedScores(scores);
        }, 50);
        return () => clearTimeout(timer);
    }, [scores]);

    const centerX = 50;
    const centerY = 50;
    const radius = 40;

    // Angles: Inference (top, 0 rad), Creativity (bottom right, 2pi/3 rad), Speed (bottom left, 4pi/3 rad)
    const angleInference = 0;
    const angleCreativity = (2 * Math.PI) / 3;
    const angleSpeed = (4 * Math.PI) / 3;

    const getPoint = (score: number, angle: number) => {
        const normalizedScore = Math.max(0, Math.min(100, score)) / 100;
        const r = normalizedScore * radius;
        return {
            x: centerX + r * Math.sin(angle),
            y: centerY - r * Math.cos(angle),
        };
    };

    const pInference = getPoint(animatedScores.inference, angleInference);
    const pCreativity = getPoint(animatedScores.creativity, angleCreativity);
    const pSpeed = getPoint(animatedScores.speed, angleSpeed);

    const polygonPoints = `${pInference.x},${pInference.y} ${pCreativity.x},${pCreativity.y} ${pSpeed.x},${pSpeed.y}`;

    // Background grid points
    const bgPoints100 = `${getPoint(100, angleInference).x},${getPoint(100, angleInference).y} ${getPoint(100, angleCreativity).x},${getPoint(100, angleCreativity).y} ${getPoint(100, angleSpeed).x},${getPoint(100, angleSpeed).y}`;
    const bgPoints66 = `${getPoint(66.6, angleInference).x},${getPoint(66.6, angleInference).y} ${getPoint(66.6, angleCreativity).x},${getPoint(66.6, angleCreativity).y} ${getPoint(66.6, angleSpeed).x},${getPoint(66.6, angleSpeed).y}`;
    const bgPoints33 = `${getPoint(33.3, angleInference).x},${getPoint(33.3, angleInference).y} ${getPoint(33.3, angleCreativity).x},${getPoint(33.3, angleCreativity).y} ${getPoint(33.3, angleSpeed).x},${getPoint(33.3, angleSpeed).y}`;

    return (
        <div className="w-32 h-32 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                {/* Background Grid */}
                <polygon points={bgPoints100} className="fill-transparent stroke-gray-800" strokeWidth="1" />
                <polygon points={bgPoints66} className="fill-transparent stroke-gray-800" strokeWidth="1" />
                <polygon points={bgPoints33} className="fill-transparent stroke-gray-800" strokeWidth="1" />
                
                {/* Axes */}
                <line x1={centerX} y1={centerY} x2={getPoint(100, angleInference).x} y2={getPoint(100, angleInference).y} className="stroke-gray-800" strokeWidth="1" />
                <line x1={centerX} y1={centerY} x2={getPoint(100, angleCreativity).x} y2={getPoint(100, angleCreativity).y} className="stroke-gray-800" strokeWidth="1" />
                <line x1={centerX} y1={centerY} x2={getPoint(100, angleSpeed).x} y2={getPoint(100, angleSpeed).y} className="stroke-gray-800" strokeWidth="1" />

                {/* Data Polygon */}
                <polygon 
                    points={polygonPoints} 
                    className="fill-cyan-400/20 stroke-cyan-400 transition-all duration-700 ease-out" 
                    strokeWidth="1.5" 
                />

                {/* Vertex Markers */}
                <circle cx={pInference.x} cy={pInference.y} r="2" className="fill-cyan-400 transition-all duration-700 ease-out" />
                <circle cx={pCreativity.x} cy={pCreativity.y} r="2" className="fill-cyan-400 transition-all duration-700 ease-out" />
                <circle cx={pSpeed.x} cy={pSpeed.y} r="2" className="fill-cyan-400 transition-all duration-700 ease-out" />
                
                {/* Labels */}
                <text x={50} y={5} className="fill-gray-500 text-[8px] font-mono text-center" textAnchor="middle">INF</text>
                <text x={95} y={80} className="fill-gray-500 text-[8px] font-mono text-center" textAnchor="middle">CRE</text>
                <text x={5} y={80} className="fill-gray-500 text-[8px] font-mono text-center" textAnchor="middle">SPD</text>
            </svg>
        </div>
    );
};
