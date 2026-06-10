'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StateEmblemProps {
  className?: string;
  showText?: boolean;
}

export function StateEmblem({ className, showText = false }: StateEmblemProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center shrink-0", className)}>
      <svg
        viewBox="0 0 100 135"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-brand-yellow dark:text-brand-yellow"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* ========================================== */}
        {/* 1. CENTRAL LION FACE & HEAD                */}
        {/* ========================================== */}
        {/* Mane Outline & Forehead */}
        <path d="M 50 12 C 45 12, 40 14, 38 18 C 36 22, 38 27, 40 31 C 42 35, 45 38, 50 38 C 55 38, 58 35, 60 31 C 62 27, 64 22, 62 18 C 60 14, 55 12, 50 12 Z" fill="none" />
        
        {/* Forehead Wavy Hair Details */}
        <path d="M 46 14 C 48 15, 52 15, 54 14" />
        <path d="M 44 17 C 47 18, 53 18, 56 17" />
        <path d="M 42 20 C 46 22, 54 22, 58 20" />

        {/* Eyebrows & Eyes */}
        <path d="M 43 23 C 45 22, 47 23, 48 24" strokeWidth="1.5" />
        <path d="M 57 23 C 55 22, 53 23, 52 24" strokeWidth="1.5" />
        {/* Eyes outline */}
        <path d="M 43 25 C 44 24, 47 24, 48 26 C 47 27, 44 27, 43 25 Z" fill="currentColor" />
        <path d="M 57 25 C 56 24, 53 24, 52 26 C 53 27, 56 27, 57 25 Z" fill="currentColor" />

        {/* Nose & Bridge */}
        <path d="M 49 23 L 49 29 L 47 30 L 53 30 L 51 29 L 51 23 Z" />
        <path d="M 48 30 C 49 31, 51 31, 52 30" />

        {/* Snout, Whisker Pads, Open Mouth & Tongue */}
        <path d="M 45 32 C 46 34, 48 34, 50 34 C 52 34, 54 34, 55 32" />
        <path d="M 47 34 C 47 37, 53 37, 53 34" fill="none" />
        {/* Tongue / Inner Mouth */}
        <path d="M 48.5 34.5 C 49 35.8, 51 35.8, 51.5 34.5 Z" fill="currentColor" />

        {/* Ears */}
        <path d="M 39 16 C 37 15, 36 17, 37 19" />
        <path d="M 61 16 C 63 15, 64 17, 63 19" />

        {/* Central Lion Mane Wavy Textures */}
        <path d="M 39 23 C 41 24, 42 26, 41 28" />
        <path d="M 61 23 C 59 24, 58 26, 59 28" />
        <path d="M 40 29 C 42 30, 43 32, 42 34" />
        <path d="M 60 29 C 58 30, 57 32, 58 34" />

        {/* ========================================== */}
        {/* 2. SIDE LIONS (LEFT & RIGHT PROFILES)       */}
        {/* ========================================== */}
        
        {/* LEFT LION */}
        {/* Profile Head Outline */}
        <path d="M 38 18 C 34 18, 30 20, 26 24 C 23 28, 23 34, 26 38 C 29 42, 34 44, 38 44" fill="none" />
        {/* Eye */}
        <path d="M 28 25 C 29 24, 31 25, 31 26 C 30 27, 29 27, 28 25 Z" fill="currentColor" />
        {/* Snout & Mouth */}
        <path d="M 23 30 C 24 31, 26 31, 27 29" />
        <path d="M 24 33 C 25 34, 27 33, 27 32" />
        {/* Left Lion Mane Waves */}
        <path d="M 34 22 C 31 24, 29 28, 29 31" />
        <path d="M 35 27 C 32 30, 30 35, 31 39" />
        <path d="M 36 33 C 33 36, 32 41, 34 44" />
        <path d="M 35 38 C 33 41, 33 43, 35 45" />

        {/* RIGHT LION */}
        {/* Profile Head Outline */}
        <path d="M 62 18 C 66 18, 70 20, 74 24 C 77 28, 77 34, 74 38 C 71 42, 66 44, 62 44" fill="none" />
        {/* Eye */}
        <path d="M 72 25 C 71 24, 69 25, 69 26 C 70 27, 71 27, 72 25 Z" fill="currentColor" />
        {/* Snout & Mouth */}
        <path d="M 77 30 C 76 31, 74 31, 73 29" />
        <path d="M 76 33 C 75 34, 73 33, 73 32" />
        {/* Right Lion Mane Waves */}
        <path d="M 66 22 C 69 24, 71 28, 71 31" />
        <path d="M 65 27 C 68 30, 70 35, 69 39" />
        <path d="M 64 33 C 67 36, 68 41, 66 44" />
        <path d="M 65 38 C 67 41, 67 43, 65 45" />

        {/* ========================================== */}
        {/* 3. LEGS, CHEST & PAWS                      */}
        {/* ========================================== */}
        {/* Front Chest Outline */}
        <path d="M 44 38 L 41 85 L 59 85 L 56 38 Z" fill="none" />
        
        {/* Leg Muscle Dividers */}
        <line x1="50" y1="38" x2="50" y2="85" />
        <path d="M 46 48 C 44 55, 43 70, 44 78" />
        <path d="M 54 48 C 56 55, 57 70, 56 78" />
        
        {/* Side Legs (Background legs outline) */}
        <path d="M 30 42 L 32 85" />
        <path d="M 70 42 L 68 85" />

        {/* Paws detail lines */}
        <path d="M 41.5 81 L 41.5 85" />
        <path d="M 44 81 L 44 85" />
        <path d="M 46.5 81 L 46.5 85" />
        
        <path d="M 53.5 81 L 53.5 85" />
        <path d="M 56 81 L 56 85" />
        <path d="M 58.5 81 L 58.5 85" />

        {/* ========================================== */}
        {/* 4. ABACUS (Circular Base) & BEADS          */}
        {/* ========================================== */}
        {/* Upper and Lower Ledges of Abacus */}
        <rect x="22" y="85" width="56" height="15" rx="1.5" fill="none" />
        
        {/* Symmetrical Bead Patterns (dotted lines representation) */}
        <line x1="24" y1="87.5" x2="76" y2="87.5" strokeDasharray="1,2" strokeWidth="0.8" />
        <line x1="24" y1="97.5" x2="76" y2="97.5" strokeDasharray="1,2" strokeWidth="0.8" />

        {/* Center Ashoka Chakra Wheel (24 Spokes) */}
        <circle cx="50" cy="92.5" r="6" fill="none" strokeWidth="1" />
        <circle cx="50" cy="92.5" r="1" fill="currentColor" />
        {/* Spokes (8 principal lines drawn for clean scaling visibility) */}
        <path d="M 50 86.5 L 50 98.5 M 44 92.5 L 56 92.5 M 45.8 88.3 L 54.2 96.7 M 45.8 96.7 L 54.2 88.3" strokeWidth="0.5" />

        {/* Galloping Horse (Left Side) */}
        {/* Detailed vector silhouette mapping horse shape */}
        <path
          d="M 36 96 C 36 93, 34 92, 32 92 C 30 92, 29 89, 28 89 C 27 89, 26 91, 26 92 M 36 95 L 34 97 L 31 97 M 32 94 C 32 96, 30 97, 28 96 L 27 94"
          fill="none"
          strokeWidth="0.8"
        />

        {/* Humped Bull (Right Side) */}
        {/* Detailed vector silhouette mapping bull shape */}
        <path
          d="M 64 96 C 64 93, 66 92, 68 92 C 70 92, 71 89, 72 89 C 73 89, 74 91, 74 92 M 64 95 L 66 97 L 69 97 M 68 94 C 68 96, 70 97, 72 96 L 73 94"
          fill="none"
          strokeWidth="0.8"
        />

        {/* Minor side wheels outlines on edges */}
        <circle cx="24.5" cy="92.5" r="2" fill="none" strokeWidth="0.6" />
        <circle cx="75.5" cy="92.5" r="2" fill="none" strokeWidth="0.6" />

        {/* ========================================== */}
        {/* 5. BELL SHAPED INVERTED LOTUS              */}
        {/* ========================================== */}
        <path d="M 26 100 C 26 112, 33 118, 50 118 C 67 118, 74 112, 74 100" fill="none" />
        
        {/* Petal separators */}
        <path d="M 35 100 C 35 108, 38 114, 41 116" />
        <path d="M 50 100 C 50 108, 50 117, 50 118" />
        <path d="M 65 100 C 65 108, 62 114, 59 116" />
        
        {/* Intermediate petals lines */}
        <path d="M 30 100 C 30 106, 32 110, 32 111" strokeWidth="0.6" />
        <path d="M 42 100 C 42 106, 44 110, 44 111" strokeWidth="0.6" />
        <path d="M 58 100 C 58 106, 56 110, 56 111" strokeWidth="0.6" />
        <path d="M 70 100 C 70 106, 68 110, 68 111" strokeWidth="0.6" />
      </svg>
      {showText && (
        <span className="text-[7.5px] font-black tracking-widest text-brand-yellow font-sans uppercase mt-1 leading-none text-center block">
          सत्यमेव जयते
        </span>
      )}
    </div>
  );
}
