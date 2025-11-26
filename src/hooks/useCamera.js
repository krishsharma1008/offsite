import { useState, useRef, useEffect } from 'react';

// Optimal resolution for mobile sharing (balances quality and upload speed)
const TARGET_MAX_DIMENSION = 1280; // Max width or height
const JPEG_QUALITY = 0.75; // Reduced from 0.85

export function useCamera() {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize camera - wait for video to actually have frames
  const waitForVideoReady = () => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video) {
        console.warn('No video element, resolving anyway');
        resolve();
        return;
      }

      // Check if already playing with valid dimensions
      if (!video.paused && video.videoWidth > 0 && video.videoHeight > 0) {
        console.log('Video already playing');
        resolve();
        return;
      }

      let resolved = false;
      
      // Poll for video readiness as a fallback
      const pollInterval = setInterval(() => {
        if (!resolved && video.videoWidth > 0 && video.videoHeight > 0) {
          resolved = true;
          clearInterval(pollInterval);
          clearTimeout(timeout);
          cleanup();
          console.log('Video ready via polling:', video.videoWidth, video.videoHeight);
          resolve();
        }
      }, 100);

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          clearInterval(pollInterval);
          cleanup();
          console.log('Camera timeout - resolving anyway to allow capture attempts');
          // Resolve instead of reject - let the user try to take photos
          resolve();
        }
      }, 5000); // Reduced to 5 seconds

      // The 'playing' event is the most reliable - fires when frames are rendering
      const handlePlaying = () => {
        if (!resolved) {
          resolved = true;
          clearInterval(pollInterval);
          clearTimeout(timeout);
          cleanup();
          console.log('Video playing with dimensions:', video.videoWidth, video.videoHeight);
          resolve();
        }
      };

      // canplay fires when enough data is available to start playing
      const handleCanPlay = () => {
        if (!resolved) {
          resolved = true;
          clearInterval(pollInterval);
          clearTimeout(timeout);
          cleanup();
          console.log('Video can play with dimensions:', video.videoWidth, video.videoHeight);
          resolve();
        }
      };

      // loadedmetadata fires when dimensions are known
      const handleLoadedMetadata = () => {
        if (!resolved && video.videoWidth > 0 && video.videoHeight > 0) {
          resolved = true;
          clearInterval(pollInterval);
          clearTimeout(timeout);
          cleanup();
          console.log('Video metadata loaded:', video.videoWidth, video.videoHeight);
          resolve();
        }
      };

      const handleError = (e) => {
        if (!resolved) {
          resolved = true;
          clearInterval(pollInterval);
          clearTimeout(timeout);
          cleanup();
          console.error('Video error:', e);
          // Still resolve - let user see the error state
          resolve();
        }
      };

      const cleanup = () => {
        video.removeEventListener('playing', handlePlaying);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('error', handleError);
      };

      video.addEventListener('playing', handlePlaying);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('error', handleError);
    });
  };

  const startCamera = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError('Camera is not supported in this browser or context.');
      setIsReady(false);
      return;
    }

    try {
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      // Clear any existing error
      setError(null);
      setIsReady(false);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Start playing the video
        try {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
          console.log('Video play() succeeded');
        } catch (playError) {
          console.warn('Video play error:', playError);
          // On some browsers, play() fails but the video still works
        }

        // Wait for video to actually have renderable frames
        await waitForVideoReady();
        
        // Set ready regardless - the stream is active
        console.log('Camera ready - isReady set to true');
        setIsReady(true);
      } else {
        console.error('videoRef.current is null after getting stream');
        setError('Camera preview element not found. Please refresh the page.');
      }
    } catch (err) {
      console.error('Camera error:', err);
      let message = 'Unable to access the device camera.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission denied. Please allow camera access and try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Camera is already in use by another application.';
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
      setIsReady(false);
      
      // Clean up on error
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsReady(false);
    }
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current || !isReady) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');

    const videoWidth = video.videoWidth || video.clientWidth || 1080;
    const videoHeight = video.videoHeight || video.clientHeight || 1920;

    if (!videoWidth || !videoHeight) {
      console.warn('Video dimensions not ready.');
      return null;
    }

    // Calculate scaled dimensions to reduce file size
    let targetWidth = videoWidth;
    let targetHeight = videoHeight;

    const maxDim = Math.max(videoWidth, videoHeight);
    if (maxDim > TARGET_MAX_DIMENSION) {
      const scale = TARGET_MAX_DIMENSION / maxDim;
      targetWidth = Math.round(videoWidth * scale);
      targetHeight = Math.round(videoHeight * scale);
      console.log(`[Camera] Scaling from ${videoWidth}x${videoHeight} to ${targetWidth}x${targetHeight}`);
    }

    // Use scaled dimensions
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Unable to access canvas context.');
      return null;
    }

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply vintage effects
    applyVintageEffect(ctx, canvas.width, canvas.height);

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    console.log('[Camera] Photo captured:', {
      originalDimensions: `${videoWidth}x${videoHeight}`,
      compressedDimensions: `${canvas.width}x${canvas.height}`,
      dataUrlSize: `${Math.round(dataUrl.length / 1024)}KB`,
      quality: JPEG_QUALITY
    });
    return dataUrl;
  };

  // Apply vintage photo effects
  const applyVintageEffect = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Apply warm vintage tone and slight grain
    for (let i = 0; i < data.length; i += 4) {
      // Warm vintage color adjustment
      data[i] = Math.min(255, data[i] * 1.1);     // Red +10%
      data[i + 1] = Math.min(255, data[i + 1] * 1.05); // Green +5%
      data[i + 2] = Math.min(255, data[i + 2] * 0.9);  // Blue -10%

      // Slight grain
      const noise = (Math.random() - 0.5) * 15;
      data[i] += noise;
      data[i + 1] += noise;
      data[i + 2] += noise;
    }

    ctx.putImageData(imageData, 0, 0);

    // Add vignette
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width * 0.7
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.7, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    stream,
    error,
    isReady,
    startCamera,
    stopCamera,
    capturePhoto
  };
}
