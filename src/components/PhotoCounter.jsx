import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function PhotoCounter({ remaining, total = 10 }) {
  const [displayNumber, setDisplayNumber] = useState(remaining);

  useEffect(() => {
    if (remaining !== displayNumber) {
      const timer = setTimeout(() => {
        setDisplayNumber(remaining);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [remaining, displayNumber]);

  const isLow = displayNumber <= 2;
  const progress = Math.min(Math.max(displayNumber / total, 0), 1);
  const used = Math.max(total - displayNumber, 0);

  return (
    <div className="text-white select-none">
      <div className="text-[11px] uppercase tracking-[0.4em] text-night-muted mb-1">
        Shots
      </div>

      <div className="flex items-end gap-3">
        <div className="relative min-w-[52px]">
          <AnimatePresence mode="wait">
            <motion.span
              key={displayNumber}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`text-5xl font-semibold leading-none ${isLow ? 'text-night-warning drop-shadow-text-glow' : 'text-white'}`}
            >
              {displayNumber}
            </motion.span>
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col leading-tight"
        >
          <span className="text-xs uppercase tracking-[0.4em] text-night-muted">shots</span>
          <span className="text-sm uppercase tracking-[0.3em] text-white/85">remaining</span>
        </motion.div>
      </div>

      <div className="mt-3 w-40 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`h-full rounded-full ${isLow ? 'bg-night-warning' : 'bg-night-accent'}`}
        />
      </div>

      <div className="mt-1 text-[11px] uppercase tracking-[0.25em] text-night-muted">
        {used}/{total} used
      </div>
    </div>
  );
}
