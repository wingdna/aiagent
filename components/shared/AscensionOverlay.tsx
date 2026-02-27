
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const AscensionOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const columns = Math.floor(canvas.width / 20);
        const drops: number[] = Array(columns).fill(1);
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";

        let frameId: number;
        let startTime = Date.now();

        const draw = () => {
            // Semi-transparent black to create trail effect
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#0F0"; // Matrix Green
            ctx.font = "15px monospace";

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * 20, drops[i] * 20);

                if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }

            if (Date.now() - startTime < 2500) { // Run for 2.5s (visuals persist slightly longer than lock)
                frameId = requestAnimationFrame(draw);
            } else {
                onComplete();
            }
        };

        draw();

        return () => cancelAnimationFrame(frameId);
    }, [onComplete]);

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[9999] bg-black pointer-events-auto flex items-center justify-center"
        >
            <canvas ref={canvasRef} className="absolute inset-0" />
            <div className="relative z-10 text-center">
                <motion.h1 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    className="text-6xl md:text-9xl font-display font-black text-white mix-blend-difference tracking-tighter"
                >
                    SYSTEM UPGRADE
                </motion.h1>
                <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: '100%' }} 
                    transition={{ duration: 2 }}
                    className="h-2 bg-matrix-green mt-4 shadow-[0_0_20px_#0F0]"
                />
            </div>
        </motion.div>
    );
};
