import React from 'react';
import { motion } from 'motion/react';
import { Flower2, Sparkles } from 'lucide-react';

interface SectionSeparatorProps {
  className?: string;
}

export const SectionSeparator: React.FC<SectionSeparatorProps> = ({ className = "" }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6 }}
      className={`flex items-center justify-center w-full max-w-[calc(100dvh*9/16)] mx-auto my-10 md:my-14 px-6 z-10 relative ${className}`}
    >
      {/* Left ornamental vine line */}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C9A45C]/30 to-[#C9A45C]/70" />
      
      {/* Central Floral Motif with 🌸 */}
      <div className="mx-3.5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rotate-45 bg-[#dec47f]/70" />
        <span className="text-xl leading-none select-none drop-shadow-sm hover:scale-125 transition-transform">
          🌸
        </span>
        <span className="w-1.5 h-1.5 rotate-45 bg-[#dec47f]/70" />
      </div>

      {/* Right ornamental vine line */}
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#C9A45C]/30 to-[#C9A45C]/70" />
    </motion.div>
  );
};

