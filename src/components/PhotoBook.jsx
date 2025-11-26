import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllPhotos } from '../lib/supabase';
import { cameraSounds } from '../utils/sounds';

export function PhotoBook({ onClose }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch all photos
  useEffect(() => {
    const fetchPhotos = async () => {
      console.log('[PhotoBook] Starting to fetch photos...');
      setLoading(true);
      setError(null);
      try {
        const data = await getAllPhotos();
        console.log('[PhotoBook] Received photos:', data?.length || 0);
        setPhotos(data);
      } catch (err) {
        console.error('[PhotoBook] Failed to fetch photos:', err);
        setError('Failed to load photos. Please try again.');
      } finally {
        console.log('[PhotoBook] Fetch complete, setting loading=false');
        setLoading(false);
      }
    };
    fetchPhotos();
  }, []);

  // Slideshow effect
  useEffect(() => {
    if (isSlideshow && photos.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % photos.length;
          cameraSounds.playSlideAdvance();
          return next;
        });
      }, 3500);

      return () => clearInterval(interval);
    }
  }, [isSlideshow, photos.length]);

  const handlePhotoClick = (photo, index) => {
    setSelectedPhoto(photo);
    setCurrentIndex(index);
    cameraSounds.playCounterClick();
  };

  const handleNext = () => {
    if (photos.length > 0) {
      const next = (currentIndex + 1) % photos.length;
      setCurrentIndex(next);
      setSelectedPhoto(photos[next]);
      cameraSounds.playSlideAdvance();
    }
  };

  const handlePrev = () => {
    if (photos.length > 0) {
      const prev = (currentIndex - 1 + photos.length) % photos.length;
      setCurrentIndex(prev);
      setSelectedPhoto(photos[prev]);
      cameraSounds.playSlideAdvance();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPhotographerName = (photo) => {
    return photo.users_profile?.display_name || photo.users_profile?.email?.split('@')[0] || 'Anonymous';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-night-base text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-night-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-night-muted text-sm uppercase tracking-[0.3em]">Loading photos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-night-base text-white flex items-center justify-center px-8">
        <div className="text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-night-muted mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full border border-white/15 text-white/80"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded-full bg-night-accent text-black font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night-base text-white">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(86,122,255,0.2),_transparent_55%)]" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-night-base/90 backdrop-blur-lg border-b border-white/5">
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
          >
            ←
          </button>

          <div className="text-center">
            <h1 className="text-lg font-semibold">Photo Book</h1>
            <p className="text-xs text-night-muted">{photos.length} memories captured</p>
          </div>

          <button
            onClick={() => setIsSlideshow(!isSlideshow)}
            className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm ${
              isSlideshow
                ? 'bg-night-accent text-black border-night-accent'
                : 'bg-white/5 border-white/10'
            }`}
          >
            {isSlideshow ? '⏸' : '▶'}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {photos.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
          <div className="text-6xl mb-6">📷</div>
          <h2 className="text-2xl font-semibold mb-2">No photos yet</h2>
          <p className="text-night-muted mb-6">
            Be the first to capture a moment! Photos from everyone will appear here.
          </p>
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-full bg-night-accent text-black font-semibold shadow-ring-glow"
          >
            Open Camera
          </button>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="p-4 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative group cursor-pointer"
                onClick={() => handlePhotoClick(photo, index)}
              >
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-night-panel border border-white/5">
                  <img
                    src={photo.public_url}
                    alt={`Photo by ${getPhotographerName(photo)}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                
                {/* Photo Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl">
                  <p className="text-xs font-medium truncate">{getPhotographerName(photo)}</p>
                  <p className="text-[10px] text-white/50">{formatDate(photo.created_at)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Full Screen Photo Viewer */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setSelectedPhoto(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl"
            >
              ✕
            </button>

            {/* Navigation arrows */}
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl"
            >
              ←
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl"
            >
              →
            </button>

            {/* Photo */}
            <motion.div
              key={selectedPhoto.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-[90vw] max-h-[80vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPhoto.public_url}
                alt={`Photo by ${getPhotographerName(selectedPhoto)}`}
                className="max-w-full max-h-[80vh] object-contain rounded-xl"
              />
              
              {/* Photo info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl">
                <p className="text-sm font-medium">{getPhotographerName(selectedPhoto)}</p>
                <p className="text-xs text-white/60">{formatDate(selectedPhoto.created_at)}</p>
                <p className="text-xs text-white/40 mt-1">{currentIndex + 1} of {photos.length}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slideshow Mode */}
      <AnimatePresence>
        {isSlideshow && photos.length > 0 && !selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          >
            <button
              onClick={() => setIsSlideshow(false)}
              className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"
            >
              ✕
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={photos[currentIndex].id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="max-w-[95vw] max-h-[90vh] relative"
              >
                <img
                  src={photos[currentIndex].public_url}
                  alt={`Photo by ${getPhotographerName(photos[currentIndex])}`}
                  className="max-w-full max-h-[90vh] object-contain rounded-xl"
                />
                
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl text-center">
                  <p className="text-lg font-medium">{getPhotographerName(photos[currentIndex])}</p>
                  <p className="text-sm text-white/60">{formatDate(photos[currentIndex].created_at)}</p>
                  
                  {/* Progress dots */}
                  <div className="flex justify-center gap-1.5 mt-4">
                    {photos.slice(0, Math.min(photos.length, 20)).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          idx === currentIndex % Math.min(photos.length, 20)
                            ? 'bg-white w-4'
                            : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

