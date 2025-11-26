import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cameraSounds } from '../utils/sounds';

// Odometer digit component with smooth rolling animation
function OdometerDigit({ digit, prevDigit, isLow, delay = 0 }) {
  const shouldAnimate = prevDigit !== undefined && digit !== prevDigit;

  useEffect(() => {
    if (shouldAnimate) {
      const timer = setTimeout(() => {
        cameraSounds.playOdometerRoll();
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate, delay, digit]);

  return (
    <div className="relative inline-block overflow-hidden h-[1.6em] leading-[1.6em] w-[1em] text-center">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          initial={shouldAnimate ? { y: '-100%', filter: 'blur(2px)', opacity: 0 } : { y: '0%', filter: 'blur(0px)', opacity: 1 }}
          animate={{ y: '0%', filter: 'blur(0px)', opacity: 1 }}
          exit={shouldAnimate ? { y: '100%', filter: 'blur(2px)', opacity: 0 } : { y: '0%', filter: 'blur(0px)', opacity: 0 }}
          transition={{
            y: { type: "spring", stiffness: 60, damping: 12, mass: 1.2, delay: delay },
            opacity: { duration: 0.4, delay: delay },
            filter: { duration: 0.4, delay: delay }
          }}
          className={`block text-4xl font-mono font-bold tabular-nums ${
            isLow ? 'text-night-warning drop-shadow-[0_0_8px_rgba(255,158,123,0.6)]' : 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]'
          }`}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// Odometer component
function Odometer({ value, maxValue, isLow }) {
  const [prevValue, setPrevValue] = useState(value);
  const valueStr = value.toString().padStart(2, '0');
  // const maxStr = maxValue.toString().padStart(2, '0'); // Removed as per request for simple odometer
  const digits = valueStr.split('').map(Number);
  const prevDigits = prevValue.toString().padStart(2, '0').split('').map(Number);

  useEffect(() => {
    if (value !== prevValue) {
      // Update prevValue after animation completes to prepare for next change
      const timer = setTimeout(() => {
        setPrevValue(value);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  return (
    <div className="flex items-center justify-center p-5">
      <div className="relative px-6 py-4 bg-gradient-to-b from-night-panel to-[#0A0C10] border border-white/10 rounded-xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.7)] backdrop-blur-md ring-1 ring-white/5">
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none" />
        
        {/* Glass highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

        <div className="flex items-center gap-2 relative z-10">
          {digits.map((digit, index) => (
            <OdometerDigit
              key={`${index}`} // Fixed key to position to allow digit change animation
              digit={digit}
              prevDigit={prevDigits[index]}
              isLow={isLow}
              delay={index * 0.1} // Increased stagger for sexier ripple
            />
          ))}
        </div>
      </div>
    </div>
  );
}

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

  return (
    <div className="text-white select-none">
      <div className="mt-3">
        <Odometer value={displayNumber} maxValue={total} isLow={isLow} />
      </div>
    </div>
  );
}
