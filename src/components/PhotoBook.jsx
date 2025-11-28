import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllPhotos } from '../lib/supabase';
import { cameraSounds } from '../utils/sounds';
import { downloadPhotosAsZip, downloadPhotosAsPdf } from '../utils/downloads';

// Card animation variants for subtle entry
const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 16, 
    scale: 0.97 
  },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.04,
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1]
    }
  })
};

// Overlay transition for smooth viewer/slideshow
const overlayTransition = {
  duration: 0.28,
  ease: [0.4, 0, 0.2, 1]
};

export function PhotoBook({ onClose }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0, message: '' });
  const [downloadError, setDownloadError] = useState(null);
  const scrollRef = useRef(null);
  const downloadMenuRef = useRef(null);

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

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (selectedPhoto || isSlideshow) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedPhoto, isSlideshow]);

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setDownloadMenuOpen(false);
      }
    };
    if (downloadMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [downloadMenuOpen]);

  // Handle ZIP download
  const handleDownloadZip = async () => {
    if (photos.length === 0 || downloading) return;
    
    setDownloadMenuOpen(false);
    setDownloading(true);
    setDownloadError(null);
    setDownloadProgress({ current: 0, total: photos.length, message: 'Preparing download...' });

    try {
      await downloadPhotosAsZip(photos, (current, total, message) => {
        setDownloadProgress({ current, total, message: message || `Downloading ${current} of ${total} photos...` });
      });
      setDownloading(false);
      setDownloadProgress({ current: 0, total: 0, message: '' });
    } catch (err) {
      console.error('Download ZIP error:', err);
      setDownloadError(err.message || 'Failed to download photos. Please try again.');
      setDownloading(false);
      setDownloadProgress({ current: 0, total: 0, message: '' });
    }
  };

  // Handle PDF download
  const handleDownloadPdf = async () => {
    if (photos.length === 0 || downloading) return;
    
    setDownloadMenuOpen(false);
    setDownloading(true);
    setDownloadError(null);
    setDownloadProgress({ current: 0, total: photos.length, message: 'Preparing PDF...' });

    try {
      await downloadPhotosAsPdf(photos, (current, total, message) => {
        setDownloadProgress({ current, total, message: message || `Processing ${current} of ${total} photos...` });
      });
      setDownloading(false);
      setDownloadProgress({ current: 0, total: 0, message: '' });
    } catch (err) {
      console.error('Download PDF error:', err);
      setDownloadError(err.message || 'Failed to create PDF. Please try again.');
      setDownloading(false);
      setDownloadProgress({ current: 0, total: 0, message: '' });
    }
  };

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

  // Loading State
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] text-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm tracking-wide">Loading photos...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] text-white flex items-center justify-center z-50 px-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-5 opacity-60">⚠️</div>
          <h2 className="text-lg font-medium mb-2">Something went wrong</h2>
          <p className="text-white/50 text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-white/15 text-white/70 text-sm hover:bg-white/5 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0c]">
      {/* Sticky Header */}
      <header className="flex-shrink-0 sticky top-0 z-40 bg-[#0a0a0c]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={onClose}
            aria-label="Go back"
            className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] flex items-center justify-center transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-base sm:text-lg font-semibold tracking-tight">Photo Book</h1>
            <p className="text-[11px] sm:text-xs text-white/40 mt-0.5">
              {photos.length} {photos.length === 1 ? 'memory' : 'memories'} captured
            </p>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {/* Download Menu */}
            {photos.length > 0 && (
              <div className="relative" ref={downloadMenuRef}>
                <button
                  onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                  disabled={downloading}
                  aria-label="Download photo book"
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                    downloading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'bg-white/[0.06] hover:bg-white/10 border-white/[0.08]'
                  }`}
                >
                  {downloading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                  )}
                </button>

                {/* Download Menu Dropdown */}
                <AnimatePresence>
                  {downloadMenuOpen && !downloading && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-48 bg-[#1a1a1c] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <button
                        onClick={handleDownloadZip}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-white/[0.05] transition-colors flex items-center gap-3"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                        <span>Download as ZIP</span>
                      </button>
                      <button
                        onClick={handleDownloadPdf}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-white/[0.05] transition-colors flex items-center gap-3 border-t border-white/[0.05]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                        </svg>
                        <span>Download as PDF</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Slideshow Toggle */}
            <button
              onClick={() => {
                setIsSlideshow(!isSlideshow);
                cameraSounds.playCounterClick();
              }}
              aria-label={isSlideshow ? 'Stop slideshow' : 'Start slideshow'}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                isSlideshow
                  ? 'bg-white text-black border-white'
                  : 'bg-white/[0.06] hover:bg-white/10 border-white/[0.08]'
              }`}
            >
              {isSlideshow ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.14v14l11-7-11-7z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Empty State */}
        {photos.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
            <h2 className="text-xl font-medium mb-2">No photos yet</h2>
            <p className="text-white/40 text-sm mb-6 max-w-xs">
              Be the first to capture a moment! Photos from everyone will appear here.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Open Camera
            </button>
          </div>
        )}

        {/* Photo Grid */}
        {photos.length > 0 && (
          <div className="px-3 sm:px-4 lg:px-6 py-4 pb-24">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {photos.map((photo, index) => (
                <motion.article
                  key={photo.id}
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  className="relative cursor-pointer group"
                  onClick={() => handlePhotoClick(photo, index)}
                >
                  {/* Card Container */}
                  <div className="aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-white/[0.03] ring-1 ring-white/[0.06] shadow-lg shadow-black/20">
                    <img
                      src={photo.public_url}
                      alt={`Photo by ${getPhotographerName(photo)} on ${formatDate(photo.created_at)}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                      draggable="false"
                    />
                    
                    {/* Photo Info Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                      <p className="text-[11px] sm:text-xs font-medium truncate text-white/90">
                        {getPhotographerName(photo)}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-white/50 mt-0.5">
                        {formatDate(photo.created_at)}
                      </p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Full Screen Photo Viewer */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setSelectedPhoto(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              aria-label="Close viewer"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>

            {/* Navigation - Previous */}
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              aria-label="Previous photo"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>

            {/* Navigation - Next */}
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              aria-label="Next photo"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>

            {/* Photo Display */}
            <motion.div
              key={selectedPhoto.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="max-w-[92vw] max-h-[85vh] sm:max-w-[88vw] sm:max-h-[82vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPhoto.public_url}
                alt={`Photo by ${getPhotographerName(selectedPhoto)} on ${formatDate(selectedPhoto.created_at)}`}
                className="max-w-full max-h-[85vh] sm:max-h-[82vh] object-contain rounded-lg sm:rounded-xl shadow-2xl"
                draggable="false"
              />
              
              {/* Photo info bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-b-lg sm:rounded-b-xl">
                <p className="text-sm font-medium">{getPhotographerName(selectedPhoto)}</p>
                <p className="text-xs text-white/50 mt-0.5">{formatDate(selectedPhoto.created_at)}</p>
                <p className="text-[10px] text-white/30 mt-2">{currentIndex + 1} of {photos.length}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download Progress Overlay */}
      <AnimatePresence>
        {downloading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-[#1a1a1c] border border-white/[0.1] rounded-2xl p-6 sm:p-8 max-w-sm w-full mx-4">
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Downloading Photo Book</h3>
                <p className="text-sm text-white/60 mb-4">
                  {downloadProgress.message || `Processing ${downloadProgress.current} of ${downloadProgress.total}...`}
                </p>
                {downloadProgress.total > 0 && (
                  <div className="w-full bg-white/[0.1] rounded-full h-2 overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                )}
                <p className="text-xs text-white/40">
                  {downloadProgress.current} / {downloadProgress.total} photos
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download Error Toast */}
      <AnimatePresence>
        {downloadError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-red-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-2xl max-w-sm w-full mx-4"
          >
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium">Download Failed</p>
                <p className="text-xs text-white/80 mt-0.5">{downloadError}</p>
              </div>
              <button
                onClick={() => setDownloadError(null)}
                className="text-white/60 hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
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
            transition={overlayTransition}
            className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
          >
            {/* Close Slideshow */}
            <button
              onClick={() => setIsSlideshow(false)}
              aria-label="Exit slideshow"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>

            {/* Slideshow Photo */}
            <AnimatePresence mode="wait">
              <motion.div
                key={photos[currentIndex].id}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="max-w-[95vw] max-h-[88vh] relative"
              >
                <img
                  src={photos[currentIndex].public_url}
                  alt={`Photo by ${getPhotographerName(photos[currentIndex])} on ${formatDate(photos[currentIndex].created_at)}`}
                  className="max-w-full max-h-[88vh] object-contain rounded-xl shadow-2xl"
                  draggable="false"
                />
                
                {/* Slideshow Info */}
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-b-xl text-center">
                  <p className="text-base sm:text-lg font-medium">{getPhotographerName(photos[currentIndex])}</p>
                  <p className="text-sm text-white/50 mt-1">{formatDate(photos[currentIndex].created_at)}</p>
                  
                  {/* Progress Indicator */}
                  <div className="flex justify-center items-center gap-1.5 mt-4">
                    {photos.slice(0, Math.min(photos.length, 15)).map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          idx === currentIndex % Math.min(photos.length, 15)
                            ? 'bg-white w-6'
                            : 'bg-white/25 w-1.5'
                        }`}
                      />
                    ))}
                    {photos.length > 15 && (
                      <span className="text-[10px] text-white/40 ml-2">+{photos.length - 15}</span>
                    )}
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
