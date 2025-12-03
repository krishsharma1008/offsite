import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const statusMessages = [
  'Calibrating lens',
  'Loading shared roll',
  'Preparing camera',
  'Initializing film',
];

export function LoadingScreen({ onComplete }) {
  const [currentStatus, setCurrentStatus] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2500);

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 50);

    // Status message cycling
    const statusInterval = setInterval(() => {
      setCurrentStatus((prev) => (prev + 1) % statusMessages.length);
    }, 600);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
      clearInterval(statusInterval);
    };
  }, [onComplete]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.34, 1.56, 0.64, 1],
      },
    },
  };

  return (
    <div className="fixed inset-0 bg-night-base text-white flex items-center justify-center overflow-hidden">
      {/* Enhanced Background Layers */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(81,110,199,0.5),_transparent_60%)]"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.2 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(125,162,255,0.25),_transparent_50%)]"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="absolute inset-0 film-grain opacity-[0.15]"
      />

      {/* Subtle parallax background elements */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(154,240,255,0.1),_transparent_70%)]"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center text-center px-6 sm:px-10 max-w-2xl w-full"
      >
        {/* Enhanced Header Section */}
        <motion.div variants={itemVariants} className="mb-12 sm:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="uppercase text-night-muted tracking-[0.6em] text-[11px] sm:text-xs mb-4 font-medium"
          >
            Zapcom Presents
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight drop-shadow-text-glow mb-4 leading-tight"
            style={{
              textShadow: '0 0 40px rgba(125, 162, 255, 0.4), 0 0 80px rgba(125, 162, 255, 0.2)',
            }}
          >
            Zapcom Offsite
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex items-center justify-center gap-3 text-night-muted text-sm sm:text-base"
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-night-accent animate-pulse" />
              Ends at 11:59pm
            </span>
            <span className="text-night-muted/50">•</span>
            <span>10 shared shots</span>
          </motion.div>
        </motion.div>

        {/* Enhanced Glass Card */}
        <motion.div
          variants={cardVariants}
          className="glass-panel rounded-[40px] px-8 sm:px-14 py-12 sm:py-16 w-full max-w-md relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(17, 21, 32, 0.95), rgba(13, 15, 20, 0.85))',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 60px rgba(125, 162, 255, 0.15)',
            backdropFilter: 'blur(30px)',
          }}
        >
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />

          {/* Sophisticated Camera Lens Animation */}
          <div className="relative w-32 h-32 mx-auto mb-10">
            {/* Outer rotating ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute inset-0 rounded-full border-2 border-white/10"
              style={{
                borderImage: 'linear-gradient(90deg, transparent, rgba(125, 162, 255, 0.3), transparent) 1',
              }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-3 rounded-full bg-night-accent/60" />
            </motion.div>

            {/* Middle ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute inset-2 rounded-full border border-white/8"
            >
              <div className="absolute top-0 right-0 w-1 h-2 rounded-full bg-night-accentGlow/40" />
            </motion.div>

            {/* Inner pulsing center */}
            <div className="absolute inset-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-ring-glow">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-night-accent via-night-accentGlow to-night-accent"
                style={{
                  boxShadow: '0 0 40px rgba(125, 162, 255, 0.5), inset 0 0 20px rgba(154, 240, 255, 0.3)',
                }}
              >
                {/* Aperture blades effect */}
                <div className="absolute inset-0">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        opacity: [0.2, 0.4, 0.2],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.25,
                      }}
                      className="absolute inset-0"
                      style={{
                        transform: `rotate(${i * 60}deg)`,
                        clipPath: 'polygon(50% 0%, 50% 30%, 100% 50%, 50% 70%, 50% 100%, 0% 50%)',
                        background: 'linear-gradient(135deg, rgba(125, 162, 255, 0.3), transparent)',
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Dynamic Status Message */}
          <motion.div
            key={currentStatus}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <p className="uppercase tracking-[0.4em] text-[13px] sm:text-sm text-night-muted font-medium">
              {statusMessages[currentStatus]}
            </p>
          </motion.div>

          {/* Fluid Wave Progress Indicator */}
          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-night-accent via-night-accentGlow to-night-accent rounded-full"
              style={{
                width: `${progress}%`,
                boxShadow: '0 0 20px rgba(125, 162, 255, 0.6)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {/* Wave effect */}
              <motion.div
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{
                  width: '50%',
                  transform: 'skewX(-20deg)',
                }}
              />
            </motion.div>
            {/* Shimmer effect */}
            <motion.div
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              style={{
                width: '30%',
              }}
            />
          </div>

          {/* Progress percentage (optional, subtle) */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.8 }}
            className="mt-4 text-[10px] text-night-muted/60 tracking-wider"
          >
            {Math.min(progress, 100)}%
          </motion.p>
        </motion.div>

        {/* Enhanced Footer Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.6] }}
          transition={{ delay: 1, duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
          className="mt-12 sm:mt-16"
        >
          <p className="text-night-muted/70 text-[11px] sm:text-xs tracking-[0.5em] uppercase font-light">
            Initializing camera system
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
