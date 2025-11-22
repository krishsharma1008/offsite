import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { photoStorage } from '../utils/storage';
import { cameraSounds } from '../utils/sounds';

export function Gallery({ onClose }) {
  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSlideshow, setIsSlideshow] = useState(false);

  useEffect(() => {
    setPhotos(photoStorage.getPhotos());
  }, []);

  useEffect(() => {
    if (isSlideshow && photos.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % photos.length;
          cameraSounds.playSlideAdvance();
          return next;
        });
      }, 3200);

      return () => clearInterval(interval);
    }
  }, [isSlideshow, photos.length]);

  const handleNext = () => {
    if (photos.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
      cameraSounds.playSlideAdvance();
    }
  };

  const handlePrev = () => {
    if (photos.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
      cameraSounds.playSlideAdvance();
    }
  };

  const handleSwipe = (e, info) => {
    if (info.offset.x > 100) {
      handlePrev();
    } else if (info.offset.x < -100) {
      handleNext();
    }
  };

  const handleReset = async () => {
    if (confirm('Delete all photos and start a new roll?')) {
      await cameraSounds.unlock();
      photoStorage.clearPhotos();
      cameraSounds.playInitialWind();
      onClose();
    }
  };

  if (photos.length === 0) {
    return (
      <div className="fixed inset-0 bg-night-base text-white z-50 flex items-center justify-center">
        <div className="text-center p-10 glass-panel rounded-3xl">
          <p className="uppercase text-night-muted tracking-[0.4em] text-xs mb-4">gallery</p>
          <p className="text-2xl font-semibold mb-6">No shared shots yet</p>
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-full bg-night-accent/90 text-white font-medium shadow-ring-glow"
          >
            Back to camera
          </button>
        </div>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-night-base text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,115,227,0.35),_transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 film-grain opacity-20 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        <header className="px-6 pt-6 pb-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg"
          >
            ✕
          </button>

          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.4em] text-night-muted">Shared roll</p>
            <p className="text-base font-semibold mt-1">
              {currentIndex + 1} of {photos.length}
            </p>
          </div>

          <button
            onClick={() => setIsSlideshow(!isSlideshow)}
            className="px-4 py-2 rounded-full border border-white/10 text-sm flex items-center gap-2"
          >
            {isSlideshow ? 'Pause' : 'Auto'}
            <span className="text-xs opacity-60">▶</span>
          </button>
        </header>

        <div className="flex-1 flex flex-col gap-6 px-6 pb-8">
          <div className="flex-1 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhoto.id}
                initial={{ opacity: 0, scale: 0.94, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -30 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleSwipe}
                className="relative w-full max-w-3xl"
              >
                <div className="relative w-full h-[68vh] max-h-[75vh] rounded-[32px] overflow-hidden border border-white/10 bg-black/60 shadow-panel">
                  <img
                    src={currentPhoto.data}
                    alt={`Photo ${currentIndex + 1}`}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 vignette pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />
                  <div className="absolute bottom-6 left-0 right-0 flex items-center justify-between px-8 text-sm text-white/85">
                    <span>{new Date(currentPhoto.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                    <span className="uppercase tracking-[0.3em] text-[11px] text-night-muted">zapcom offsite</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrev}
              className="w-14 h-14 rounded-full bg-white/5 border border-white/10 text-lg"
            >
              ←
            </button>

            <div className="flex gap-2 overflow-x-auto px-2 max-w-full">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => {
                    setCurrentIndex(index);
                    cameraSounds.playCounterClick();
                  }}
                  className={`
                    relative flex-shrink-0 w-14 h-14 rounded-2xl overflow-hidden border transition-all duration-200
                    ${index === currentIndex
                      ? 'border-night-accent shadow-ring-glow scale-105'
                      : 'border-white/10 opacity-60'
                    }
                  `}
                >
                  <img src={photo.data} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-14 h-14 rounded-full bg-white/5 border border-white/10 text-lg"
            >
              →
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-night-muted uppercase tracking-[0.4em]">
            <button
              onClick={handleReset}
              className="px-5 py-2 rounded-full border border-white/10 text-white text-[11px] uppercase tracking-[0.4em]"
            >
              New Roll
            </button>

            <div className="text-right">
              <p>{new Date(currentPhoto.timestamp).toLocaleDateString()}</p>
              <p className="text-[10px] tracking-[0.5em]">shared lens</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
