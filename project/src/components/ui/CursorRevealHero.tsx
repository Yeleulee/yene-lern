import React, { useEffect, useRef } from 'react';

interface CursorRevealHeroProps {
    imageSrc: string;
    altText: string;
    className?: string; // Container classes
}

const CursorRevealHero: React.FC<CursorRevealHeroProps> = ({ imageSrc, altText, className = '' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const revealLayerRef = useRef<HTMLDivElement>(null);
    const cursorFollowerRef = useRef<HTMLDivElement>(null);
    const maskSize = 300;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Check boundaries
            const isInside =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;

            if (isInside) {
                // Reveal Logic
                const gradient = `radial-gradient(circle ${maskSize}px at ${x}px ${y}px, black 0%, transparent 80%)`;

                if (revealLayerRef.current) {
                    revealLayerRef.current.style.maskImage = gradient;
                    revealLayerRef.current.style.webkitMaskImage = gradient;
                }

                // Follower Logic
                if (cursorFollowerRef.current) {
                    cursorFollowerRef.current.style.transform = `translate(${x}px, ${y}px)`;
                    cursorFollowerRef.current.style.opacity = '1';
                }
            } else {
                // Hide Effect when outside
                if (revealLayerRef.current) {
                    revealLayerRef.current.style.maskImage = 'radial-gradient(circle 0px at 0 0, black 0%, transparent 100%)';
                    revealLayerRef.current.style.webkitMaskImage = 'radial-gradient(circle 0px at 0 0, black 0%, transparent 100%)';
                }
                if (cursorFollowerRef.current) {
                    cursorFollowerRef.current.style.opacity = '0';
                }
            }
        };

        const handleMouseLeave = () => {
            if (revealLayerRef.current) {
                revealLayerRef.current.style.maskImage = 'radial-gradient(circle 0px at 0 0, black 0%, transparent 100%)';
                revealLayerRef.current.style.webkitMaskImage = 'radial-gradient(circle 0px at 0 0, black 0%, transparent 100%)';
            }
            if (cursorFollowerRef.current) {
                cursorFollowerRef.current.style.opacity = '0';
            }
        };

        // Use window for smoother tracking even if cursor slips out momentarily
        window.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden cursor-none ${className}`}
        >
            {/* Base Layer: Grayscale */}
            <img
                src={imageSrc}
                alt={altText}
                // Match dimensions exactly to avoid mask shifting
                className="w-full h-auto object-cover filter grayscale brightness-50 contrast-125 block"
            />

            {/* Reveal Layer: Full Color */}
            <div
                ref={revealLayerRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                    // Use 'absolute' positioning for inner img to overlay perfectly
                    maskImage: 'radial-gradient(circle 0px at 0 0, black 0%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(circle 0px at 0 0, black 0%, transparent 100%)',
                }}
            >
                <img
                    src={imageSrc}
                    alt={altText}
                    className="w-full h-auto object-cover block"
                />
            </div>

            {/* Reveal Cursor Element (Follower) */}
            <div
                ref={cursorFollowerRef}
                className="absolute top-0 left-0 pointer-events-none rounded-full border border-white/30 backdrop-blur-[1px] shadow-[0_0_15px_rgba(255,255,255,0.3)] z-50 mix-blend-overlay transition-opacity duration-200 opacity-0"
                style={{
                    width: maskSize * 0.8,
                    height: maskSize * 0.8,
                    marginTop: -(maskSize * 0.8) / 2, // Center vertically
                    marginLeft: -(maskSize * 0.8) / 2, // Center horizontally
                    willChange: 'transform, opacity',
                }}
            />
        </div>
    );
};

export default CursorRevealHero;
