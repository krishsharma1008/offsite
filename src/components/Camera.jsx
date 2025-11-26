import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCamera } from '../hooks/useCamera';
import { createPhotoStorage } from '../utils/storage';
import { cameraSounds } from '../utils/sounds';
import { PhotoCounter } from './PhotoCounter';
import { useAuth } from '../contexts/AuthContext';

const EVENT_NAME = 'Zapcom Offsite';
const EVENT_END = 'Ends at 11:59pm';

export function Camera({ onViewGallery, onViewPhotoBook }) {
  const {
    videoRef,
    canvasRef,
    isReady,
    error,
    startCamera,
    capturePhoto
  } = useCamera();

  const { user, profile, signOut, photoCount, refreshPhotoCount, getRemainingPhotos, canTakePhoto } = useAuth();

  // Create storage manager with user ID
  const storage = useMemo(() => {
    return createPhotoStorage(user?.id, refreshPhotoCount);
  }, [user?.id, refreshPhotoCount]);

  const [remaining, setRemaining] = useState(10);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [isFlashReady, setIsFlashReady] = useState(true);
  const [showPermission, setShowPermission] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showInfoCard, setShowInfoCard] = useState(false);
  const [showRollPrompt, setShowRollPrompt] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({
    isUploading: false,
    status: 'ready', // 'ready' | 'uploading' | 'retrying' | 'success' | 'error'
    attempt: 0,
    maxAttempts: 3,
    error: null
  });

  const zoomOptions = [0.5, 1, 2];

  // Initialize and sync with Supabase photo count
  useEffect(() => {
    const initStorage = async () => {
      if (user?.id) {
        await storage.init();
        setRemaining(getRemainingPhotos());
      }
    };
    initStorage();
  }, [user?.id, storage, getRemainingPhotos]);

  // Update remaining when photoCount changes
  useEffect(() => {
    setRemaining(getRemainingPhotos());
    if (!canTakePhoto()) {
      setShowRollPrompt(true);
    }
  }, [photoCount, getRemainingPhotos, canTakePhoto]);

  const handleStartCamera = async () => {
    await cameraSounds.unlock();
    cameraSounds.playInitialWind();
    setShowPermission(false);
    await startCamera();
  };

  const handleSignOut = async () => {
    if (confirm('Sign out? You can sign back in anytime.')) {
      await signOut();
    }
  };

  const handleCapture = async () => {
    console.log('[Camera] handleCapture called, user:', user?.id, 'canTakePhoto:', canTakePhoto());
    
    if (!canTakePhoto()) {
      setShowRollPrompt(true);
      return;
    }

    if (!isReady || isCapturing || !isFlashReady || uploadStatus.isUploading) {
      console.log('[Camera] Blocked:', { isReady, isCapturing, isFlashReady, isUploading: uploadStatus.isUploading });
      return;
    }

    await cameraSounds.unlock();
    setIsCapturing(true);
    setIsFlashReady(false);
    cameraSounds.playFlashCharge();

    setTimeout(async () => {
      setFlashActive(true);
      cameraSounds.playFlashFire();
      cameraSounds.playShutterClick();

      const photoData = capturePhoto();
      console.log('[Camera] Photo captured, data length:', photoData?.length);

      if (photoData) {
        // Set uploading status
        setUploadStatus({
          isUploading: true,
          status: 'uploading',
          attempt: 1,
          maxAttempts: 3,
          error: null
        });

        // Upload to Supabase with progress callback
        console.log('[Camera] Calling storage.savePhoto...');
        const result = await storage.savePhoto(photoData, (progress) => {
          // Handle retry progress updates
          if (progress.status === 'retrying') {
            setUploadStatus(prev => ({
              ...prev,
              status: 'retrying',
              attempt: progress.attempt,
              maxAttempts: progress.max
            }));
          }
        });
        console.log('[Camera] savePhoto result:', result);

        if (result.success) {
          // Set success status
          setUploadStatus({
            isUploading: false,
            status: 'success',
            attempt: 0,
            maxAttempts: 3,
            error: null
          });

          setTimeout(() => {
            cameraSounds.playCounterClick();
          }, 90);

          setTimeout(() => {
            cameraSounds.playFilmAdvance();
            setRemaining(getRemainingPhotos());

            if (getRemainingPhotos() === 0) {
              setTimeout(() => {
                cameraSounds.playEndOfRoll();
                setShowRollPrompt(true);
              }, 380);
            }
          }, 220);
        } else {
          // Set error status
          setUploadStatus({
            isUploading: false,
            status: 'error',
            attempt: 0,
            maxAttempts: 3,
            error: result.reason
          });
          console.error('[Camera] Failed to save photo:', result.reason);
          alert('Failed to save photo: ' + result.reason);
        }
      }

      setTimeout(() => {
        setFlashActive(false);
        setIsCapturing(false);
      }, 160);

      setTimeout(() => {
        setIsFlashReady(true);
      }, 1500);
    }, 700);
  };

  const handleZoomChange = (value) => {
    setZoomLevel(value);
    cameraSounds.playCounterClick();
  };

  const handleFeedbackTest = async () => {
    await cameraSounds.unlock();
    cameraSounds.playShutterClick();
    setShowInfoCard(false);
  };

  const takenCount = 10 - remaining;
  const zoomScale = zoomLevel === 0.5 ? 0.88 : zoomLevel === 2 ? 1.25 : 1;

  let statusMessage = 'Ready';
  if (uploadStatus.status === 'uploading') {
    statusMessage = 'Uploading...';
  } else if (uploadStatus.status === 'retrying') {
    statusMessage = `Retrying (${uploadStatus.attempt}/${uploadStatus.maxAttempts})...`;
  } else if (!isFlashReady && remaining > 0) {
    statusMessage = 'Charging flash';
  } else if (remaining === 0) {
    statusMessage = 'Roll complete • view photo book';
  }

  return (
    <div className="relative w-full h-full bg-night-base text-white overflow-hidden">
      {/* Top + bottom gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(86,122,255,0.3),_transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Permission Screen */}
      <AnimatePresence>
        {showPermission && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-night-base flex items-center justify-center px-10"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <p className="uppercase text-night-muted tracking-[0.5em] text-xs">Welcome back</p>
              <h1 className="text-4xl font-semibold">{profile?.display_name || 'Photographer'}</h1>
              <p className="text-night-muted text-sm">{remaining} shots remaining</p>
              <button
                onClick={handleStartCamera}
                className="px-12 py-3 rounded-full bg-night-accent text-black font-semibold shadow-ring-glow"
              >
                Open Camera
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Error */}
      {error && (
        <div className="absolute inset-0 z-40 bg-night-base/95 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <p className="text-4xl">⚠️</p>
            <p className="text-sm text-night-muted">{error}</p>
            <button
              onClick={handleStartCamera}
              className="px-8 py-2 rounded-full bg-night-accent text-black font-semibold"
            >
              Retry camera
            </button>
          </div>
        </div>
      )}

      {/* Main Camera View */}
      {!showPermission && !error && (
        <>
          <div className="absolute inset-0 bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ transform: `scale(${zoomScale})` }}
              className="w-full h-full object-cover transition-transform duration-300 ease-out"
            />
            <div className="absolute inset-0 film-grain pointer-events-none" />
            <div className="absolute inset-0 vignette pointer-events-none" />
            <AnimatePresence>
              {flashActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.4, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 bg-white/90"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Top overlay */}
          <div className="absolute top-0 left-0 right-0 z-30 px-6 pt-6">
            <div className="flex items-start justify-between">
              <button
                onClick={handleSignOut}
                className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg"
                title="Sign out"
              >
                ✕
              </button>

              <div className="text-center">
                <p className="uppercase text-[11px] tracking-[0.4em] text-night-muted">{EVENT_NAME}</p>
                <p className="text-sm text-white/80 mt-1">{profile?.display_name || 'Photographer'}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowInfoCard((prev) => !prev)}
                  className="w-11 h-11 rounded-full bg-white/5 border border-white/10 text-base"
                >
                  ⓘ
                </button>
                <button
                  onClick={onViewPhotoBook}
                  className="w-11 h-11 rounded-full bg-white/5 border border-white/10"
                  title="Photo Book"
                >
                  📖
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showInfoCard && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-20 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md glass-panel rounded-3xl px-6 py-5 text-sm"
              >
                <p className="text-white/90 mb-3">
                  Photos from everyone are shared in the Photo Book. Each person gets 10 shots. Keep your phone volume up for the authentic shutter sound!
                </p>
                <button
                  onClick={() => setShowInfoCard(false)}
                  className="px-4 py-1.5 rounded-full bg-white/10 text-white/70 text-xs uppercase tracking-[0.4em]"
                >
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showRollPrompt && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-x-6 bottom-36 z-40 glass-panel rounded-3xl px-6 py-5 text-sm"
              >
                <p className="text-white/90 mb-3">
                  You&apos;ve used all 10 shots! Open the Photo Book to see everyone&apos;s captures from the event.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRollPrompt(false)}
                    className="flex-1 px-4 py-2 rounded-full border border-white/15 text-white/80 text-xs"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => {
                      setShowRollPrompt(false);
                      onViewPhotoBook();
                    }}
                    className="flex-1 px-4 py-2 rounded-full bg-night-accent text-black font-semibold shadow-ring-glow"
                  >
                    Photo Book
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Controls */}
          <div
            className="absolute bottom-0 left-0 right-0 z-30 px-6"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)' }}
          >
            <div className="flex items-end justify-between gap-4">
              <PhotoCounter remaining={remaining} />

              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm uppercase tracking-[0.4em]">
                  {zoomOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleZoomChange(option)}
                      className={`px-2 py-1 rounded-full text-xs tracking-[0.3em] ${option === zoomLevel ? 'bg-white text-black' : 'text-white/70'}`}
                    >
                      {option === 1 ? '1x' : option}
                    </button>
                  ))}
                </div>

                <motion.button
                  onClick={handleCapture}
                  disabled={!isReady || isCapturing || remaining === 0 || uploadStatus.isUploading}
                  whileTap={{ scale: 0.92 }}
                  className={`relative w-28 h-28 rounded-full border-4 border-white/15 flex items-center justify-center transition-all duration-200 shadow-ring-glow ${remaining === 0 ? 'opacity-40 cursor-not-allowed' : isFlashReady && !uploadStatus.isUploading ? 'bg-gradient-to-b from-white/60 to-white/30' : 'bg-white/10 animate-pulse cursor-wait'}`}
                >
                  <div className={`w-24 h-24 rounded-full ${isFlashReady && !uploadStatus.isUploading ? 'bg-white text-black' : 'bg-white/40'} flex items-center justify-center`}
                    style={{ boxShadow: isFlashReady && !uploadStatus.isUploading ? '0 0 45px rgba(154, 240, 255, 0.4)' : 'none' }}
                  >
                    <div className="w-14 h-14 rounded-full bg-night-base/80" />
                  </div>
                </motion.button>

                <div className="text-[11px] uppercase tracking-[0.4em] text-night-muted text-center">
                  {statusMessage}
                </div>
              </div>

              <motion.button
                onClick={onViewPhotoBook}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-20 h-24 flex flex-col items-center justify-end pb-3 rounded-[26px] border border-white/12 bg-white/5"
              >
                <div className="relative w-12 h-16 mb-2">
                  <div className="absolute inset-0 rounded-xl border border-white/20 bg-black/40" />
                  <div className="absolute top-2 right-1 w-10 h-14 rounded-xl border border-white/20 bg-black/40" />
                </div>
                <span className="text-sm font-semibold">{takenCount}</span>
                <span className="text-[10px] uppercase tracking-[0.4em] text-night-muted">shots</span>
              </motion.button>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </>
      )}
    </div>
  );
}
