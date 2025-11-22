import { motion } from 'framer-motion';
import { useEffect } from 'react';

export function LoadingScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-night-base text-white flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(81,110,199,0.45),_transparent_55%)]" />
      <div className="absolute inset-0 film-grain opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center px-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mb-10"
        >
          <p className="uppercase text-night-muted tracking-[0.5em] text-xs mb-3">Zapcom Presents</p>
          <h1 className="text-5xl font-semibold tracking-tight drop-shadow-text-glow">Zapcom Offsite</h1>
          <p className="text-night-muted mt-2 text-sm">Ends at 11:59pm • 10 shared shots</p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="glass-panel rounded-[32px] px-12 py-10"
        >
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-b from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-ring-glow">
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-night-accent to-night-accentGlow"
            />
          </div>
          <p className="uppercase tracking-[0.35em] text-[12px] text-night-muted">Loading shared roll</p>
          <div className="mt-6 flex items-center justify-center gap-2">
            {[0, 1, 2, 3].map((idx) => (
              <motion.div
                key={idx}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
                transition={{ delay: idx * 0.15, duration: 1.4, repeat: Infinity }}
                className="w-2 h-6 rounded-full bg-night-accent"
              />
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 0.75, duration: 2, repeat: Infinity }}
          className="mt-10 text-night-muted text-xs tracking-[0.4em] uppercase"
        >
          Calibrating lens
        </motion.p>
      </motion.div>
    </div>
  );
}
