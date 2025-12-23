
'use client';

import { useEffect, useState } from 'react';

const CONFETTI_COUNT = 50;

// Utility to generate a random number in a given range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Define the shape of a single confetti piece
interface ConfettiPiece {
  id: number;
  style: React.CSSProperties;
  className: string;
}

export function Celebration() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const newPieces: ConfettiPiece[] = Array.from({ length: CONFETTI_COUNT }).map((_, index) => {
      const duration = random(3000, 6000); // 3-6 seconds
      const delay = random(0, 2000); // Start at different times
      const startX = random(0, 100); // Start anywhere across the top
      const endX = startX + random(-40, 40); // Drift sideways
      const rotationStart = random(0, 360);
      const rotationEnd = rotationStart + random(180, 720);
      const scale = random(0.6, 1.2);
      const colors = ['#fde2e4', '#fad2e1', '#c5dedd', '#dbe7e4', '#f0efeb', '#ffe5d9', '#ffd7ba', '#fec89a'];
      const color = colors[Math.floor(random(0, colors.length))];
      
      const animationName = `fall-${index}`;

      // We need to inject keyframes dynamically for each unique animation
      const styleSheet = document.styleSheets[0];
      if (styleSheet) {
          styleSheet.insertRule(`
            @keyframes ${animationName} {
              0% {
                transform: translate3d(${startX}vw, -10vh, 0) rotate(${rotationStart}deg) scale(${scale});
                opacity: 1;
              }
              100% {
                transform: translate3d(${endX}vw, 110vh, 0) rotate(${rotationEnd}deg) scale(${scale});
                opacity: 0.5;
              }
            }
          `, styleSheet.cssRules.length);
      }

      return {
        id: index,
        className: 'confetti-piece',
        style: {
          '--start-x': `${startX}vw`,
          '--end-x': `${endX}vw`,
          '--rot-start': `${rotationStart}deg`,
          '--rot-end': `${rotationEnd}deg`,
          '--scale': `${scale}`,
          left: `${startX}vw`,
          backgroundColor: color,
          animation: `${animationName} ${duration}ms linear ${delay}ms forwards`,
        },
      };
    });

    setPieces(newPieces);
    
    // Cleanup keyframes after animation ends
    const cleanupTimeout = setTimeout(() => {
        const styleSheet = document.styleSheets[0];
        if (styleSheet) {
            // This is a simplified cleanup; a more robust solution would be more complex
            // For now, it's safer to let them exist as they are namespaced
        }
    }, 8000); // Max duration + max delay

    return () => clearTimeout(cleanupTimeout);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden z-50"
    >
      {pieces.map(piece => (
        <div key={piece.id} style={piece.style} className="absolute top-0 h-3 w-2 rounded-sm opacity-0" />
      ))}
    </div>
  );
}
