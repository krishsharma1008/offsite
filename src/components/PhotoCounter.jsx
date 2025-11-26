import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cameraSounds } from '../utils/sounds';

// Simple digit display with rolling animation
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
    <div 
      className="relative overflow-hidden"
      style={{ 
        width: '32px', 
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          initial={shouldAnimate ? { y: -48, opacity: 0 } : { y: 0, opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          exit={shouldAnimate ? { y: 48, opacity: 0 } : { y: 0, opacity: 0 }}
          transition={{
            y: { type: "spring", stiffness: 60, damping: 12, mass: 1.2, delay },
            opacity: { duration: 0.3, delay }
          }}
          className={isLow ? 'text-orange-400' : 'text-white'}
          style={{
            fontSize: '36px',
            fontWeight: '700',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
            lineHeight: 1,
            display: 'block',
            textAlign: 'center',
            width: '100%'
          }}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// Odometer component
function Odometer({ value, isLow }) {
  const [prevValue, setPrevValue] = useState(value);
  const valueStr = value.toString().padStart(2, '0');
  const digits = valueStr.split('').map(Number);
  const prevDigits = prevValue.toString().padStart(2, '0').split('').map(Number);

  useEffect(() => {
    if (value !== prevValue) {
      const timer = setTimeout(() => {
        setPrevValue(value);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  return (
    <div 
      className="rounded-2xl border border-white/20"
      style={{
        background: 'linear-gradient(180deg, rgba(30,30,35,0.95) 0%, rgba(15,15,20,0.98) 100%)',
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {digits.map((digit, index) => (
        <OdometerDigit
          key={index}
          digit={digit}
          prevDigit={prevDigits[index]}
          isLow={isLow}
          delay={index * 0.1}
        />
      ))}
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
    <div style={{ transform: 'none' }}>
      <Odometer value={displayNumber} isLow={isLow} />
    </div>
  );
}
