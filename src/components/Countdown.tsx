import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CountdownProps {
  targetDate: string;
}

export function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  function calculateTimeLeft(target: string) {
    const difference = new Date(target).getTime() - new Date().getTime();
    
    if (isNaN(difference) || difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="flex justify-center gap-3 sm:gap-6 mt-8 mb-4 px-2">
      {timeUnits.map((unit, index) => (
        <motion.div
          key={unit.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.15 + 0.5, duration: 0.5, type: 'spring', bounce: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 sm:w-22 sm:h-22 bg-white/90 backdrop-blur-md rounded-2xl border border-[#C9A45C]/50 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.1)] flex items-center justify-center mb-2.5 relative overflow-hidden">
            {/* Subtle inner reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent opacity-50" />
            <span className="font-display text-3xl sm:text-4xl font-extrabold text-[#B94E2F] drop-shadow-sm relative z-10 tabular-nums tracking-tight">
              {unit.value.toString().padStart(2, '0')}
            </span>
          </div>
          <span className="font-sans text-xs sm:text-sm uppercase tracking-[0.2em] text-[#641D2E] font-bold drop-shadow-sm">
            {unit.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
