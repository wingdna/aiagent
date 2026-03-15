
import React, { useRef, useEffect } from 'react';

export const NeuralFrequency: React.FC<{ active: boolean; color: string }> = ({ active, color }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;
        
        const render = () => {
            time += 0.1;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = color;
            
            // Draw Sine Wave with Noise
            for (let x = 0; x < canvas.width; x++) {
                // Amplitude modulation based on 'active' state
                const amp = active ? 20 : 5;
                const freq = active ? 0.2 : 0.05;
                const noise = active ? Math.random() * 5 : 0;
                
                const y = canvas.height / 2 + Math.sin(x * freq + time) * amp + noise;
                
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            
            ctx.stroke();

            // Glow Effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, [active, color]);

    return (
        <canvas ref={canvasRef} width={200} height={60} className="w-full h-full opacity-80" />
    );
};
