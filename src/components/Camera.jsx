import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCamera } from '../hooks/useCamera';
import { photoStorage } from '../utils/storage';
import { cameraSounds } from '../utils/sounds';
import { PhotoCounter } from './PhotoCounter';

const EVENT_NAME = 'Zapcom Offsite';
const EVENT_END = 'Ends at 11:59pm';

export function Camera({ onPhotoTaken, onViewGallery }) {
  const {
    videoRef,
    canvasRef,
    isReady,
    error,
    startCamera,
    capturePhoto
  } = useCamera();

  const [remaining, setRemaining] = useState(10);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [isFlashReady, setIsFlashReady] = useState(true);
  const [showPermission, setShowPermission] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showInfoCard, setShowInfoCard] = useState(false);
  const [showRollPrompt, setShowRollPrompt] = useState(false);

  const zoomOptions = [0.5, 1, 2];

  useEffect(() => {
    setRemaining(photoStorage.getRemainingCount());
    if (!photoStorage.canTakePhoto()) {
      setShowRollPrompt(true);
    }
  }, []);

  const handleStartCamera = async () => {
    await cameraSounds.unlock();
    cameraSounds.playInitialWind();
    await startCamera();
    setShowPermission(false);
  };

  const handleResetRoll = async (shouldConfirm = true) => {
    if (!shouldConfirm || confirm('Start a fresh roll? All captured shots will be cleared.')) {
      await cameraSounds.unlock();
      photoStorage.clearPhotos();
      setRemaining(photoStorage.getRemainingCount());
      cameraSounds.playInitialWind();
      setShowInfoCard(false);
      setShowRollPrompt(false);
      if (onPhotoTaken) {
        onPhotoTaken(0);
      }
    }
  };

  const handleCapture = async () => {
    if (!photoStorage.canTakePhoto()) {
      setShowRollPrompt(true);
    }

    if (!isReady || isCapturing || !photoStorage.canTakePhoto() || !isFlashReady) {
      return;
    }

    await cameraSounds.unlock();
    setIsCapturing(true);
    setIsFlashReady(false);
    cameraSounds.playFlashCharge();

    setTimeout(() => {
      setFlashActive(true);
      cameraSounds.playFlashFire();
      cameraSounds.playShutterClick();

      const photoData = capturePhoto();

      if (photoData) {
        const result = photoStorage.savePhoto(photoData);

        if (result.success) {
          setTimeout(() => {
            cameraSounds.playCounterClick();
          }, 90);

          setTimeout(() => {
            cameraSounds.playFilmAdvance();
            setRemaining(photoStorage.getRemainingCount());

            if (photoStorage.getRemainingCount() === 0) {
              setTimeout(() => {
                cameraSounds.playEndOfRoll();
              }, 380);
            }
          }, 220);

          if (onPhotoTaken) {
            onPhotoTaken(result.count);
          }
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

  const photoCount = photoStorage.getTakenCount();
  const zoomScale = zoomLevel === 0.5 ? 0.88 : zoomLevel === 2 ? 1.25 : 1;

  let statusMessage = 'Ready';
  if (!isFlashReady && remaining > 0) statusMessage = 'Charging flash';
  if (remaining === 0) statusMessage = 'Film empty • open gallery';

  useEffect(() => {
    if (remaining === 0) {
      setShowRollPrompt(true);
    } else if (photoStorage.canTakePhoto()) {
      setShowRollPrompt(false);
    }
  }, [remaining]);

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
              <p className="uppercase text-night-muted tracking-[0.5em] text-xs">Shared roll</p>
              <h1 className="text-5xl font-semibold">{EVENT_NAME}</h1>
              <p className="text-night-muted text-sm">{EVENT_END} • 10 shots</p>
              <button
                onClick={handleStartCamera}
                className="px-12 py-3 rounded-full bg-night-accent text-black font-semibold shadow-ring-glow"
              >
                Join camera
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
                onClick={handleResetRoll}
                className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg"
                title="Reset roll"
              >
                ✕
              </button>

              <div className="text-center">
                <p className="uppercase text-[11px] tracking-[0.4em] text-night-muted">{EVENT_NAME}</p>
                <p className="text-sm text-white/80 mt-1">{EVENT_END}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowInfoCard((prev) => !prev)}
                  className="w-11 h-11 rounded-full bg-white/5 border border-white/10 text-base"
                >
                  ⓘ
                </button>
                <button
                  onClick={handleFeedbackTest}
                  className="w-11 h-11 rounded-full bg-white/5 border border-white/10"
                  title="Test haptics"
                >
                  ⚙
                </button>
                <button
                  onClick={onViewGallery}
                  className="w-11 h-11 rounded-full bg-white/5 border border-white/10"
                  title="Open gallery"
                >
                  ☰
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
                  Shots from everyone drop here in real time. Keep your phone volume up for the authentic shutter and haptic feedback.
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
                  You&apos;ve used all 10 shared shots. Start a new roll or open the gallery to see everything that was captured.
                </p>
                <div className="flex gap-3">
                  <button
                  onClick={() => {
                    setShowRollPrompt(false);
                    handleResetRoll(false);
                  }}
                    className="flex-1 px-4 py-2 rounded-full bg-night-accent text-black font-semibold shadow-ring-glow"
                  >
                    New Roll
                  </button>
                  <button
                    onClick={() => {
                      setShowRollPrompt(false);
                      onViewGallery();
                    }}
                    className="flex-1 px-4 py-2 rounded-full border border-white/15 text-white/80 uppercase tracking-[0.3em] text-xs"
                  >
                    Gallery
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
                  disabled={!isReady || isCapturing || remaining === 0}
                  whileTap={{ scale: 0.92 }}
                  className={`relative w-28 h-28 rounded-full border-4 border-white/15 flex items-center justify-center transition-all duration-200 shadow-ring-glow ${remaining === 0 ? 'opacity-40 cursor-not-allowed' : isFlashReady ? 'bg-gradient-to-b from-white/60 to-white/30' : 'bg-white/10 animate-pulse cursor-wait'}`}
                >
                  <div className={`w-24 h-24 rounded-full ${isFlashReady ? 'bg-white text-black' : 'bg-white/40'} flex items-center justify-center`}
                    style={{ boxShadow: isFlashReady ? '0 0 45px rgba(154, 240, 255, 0.4)' : 'none' }}
                  >
                    <div className="w-14 h-14 rounded-full bg-night-base/80" />
                  </div>
                </motion.button>

                <div className="text-[11px] uppercase tracking-[0.4em] text-night-muted text-center">
                  {statusMessage}
                </div>
              </div>

              <motion.button
                onClick={onViewGallery}
                disabled={photoCount === 0}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`relative w-20 h-24 flex flex-col items-center justify-end pb-3 rounded-[26px] border border-white/12 bg-white/5 ${photoCount === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="relative w-12 h-16 mb-2">
                  <div className="absolute inset-0 rounded-xl border border-white/20 bg-black/40" />
                  <div className="absolute top-2 right-1 w-10 h-14 rounded-xl border border-white/20 bg-black/40" />
                </div>
                <span className="text-sm font-semibold">{photoCount}</span>
                <span className="text-[10px] uppercase tracking-[0.4em] text-night-muted">roll</span>
              </motion.button>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </>
      )}
    </div>
  );
}
