import { useState, useRef, useEffect } from 'react';

export function useCamera() {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(mediaStream);
      setError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsReady(true);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError(err.message);
      setIsReady(false);
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

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply vintage effects
    applyVintageEffect(ctx, canvas.width, canvas.height);

    // Convert to data URL
    return canvas.toDataURL('image/jpeg', 0.85);
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
