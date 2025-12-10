
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { IMAGE_CONFIG } from '../constants';
import { showGlobalToast } from './Toast';

interface UploadAreaProps {
  onImageSelected: (file: File) => void;
}

// Supported image formats for Gemini API
const SUPPORTED_FORMATS = [...IMAGE_CONFIG.SUPPORTED_FORMATS];
const SUPPORTED_EXTENSIONS = [...IMAGE_CONFIG.SUPPORTED_EXTENSIONS];

export const UploadArea: React.FC<UploadAreaProps> = ({ onImageSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle File Input with format validation
  const handleFile = useCallback((file: File) => {
    // Clear previous error
    setFormatError(null);

    if (!file) return;

    // Check if file type is supported
    if (!(SUPPORTED_FORMATS as readonly string[]).includes(file.type)) {
      setFormatError(`Unsupported format! Please upload ${SUPPORTED_EXTENSIONS.join(', ')} images only.`);
      return;
    }

    // Check file size (max 20MB for Gemini)
    if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE_BYTES) {
      setFormatError('Image too large! Please upload an image under 20MB.');
      return;
    }

    onImageSelected(file);
  }, [onImageSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // --- Camera Logic ---

  // 1. Initialize Stream
  const startCamera = async () => {
    try {
      // Request camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (err) {
      console.error("Error accessing camera", err);
      showGlobalToast('Could not access camera. Please check permissions.', 'error');
    }
  };

  // 2. Attach Stream to Video Element when available
  useEffect(() => {
    if (showCamera && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(e => console.error("Error playing video:", e));
    }
  }, [showCamera, cameraStream]);

  // 3. Cleanup on unmount or stop
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip horizontally for mirror effect
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0);

        // Convert canvas to Blob, then to File
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            stopCamera();
            onImageSelected(file);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  if (showCamera) {
    return (
      <div className="relative w-full h-[500px] rounded-3xl bg-black overflow-hidden flex flex-col items-center justify-center animate-fade-in shadow-2xl border border-slate-800">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
        />

        {/* Camera Overlay UI */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>

        <div className="absolute bottom-8 flex items-center gap-8 z-20">
          <button
            onClick={stopCamera}
            className="p-4 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors border border-white/10"
            title="Cancel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={capturePhoto}
            className="group w-20 h-20 rounded-full border-4 border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 shadow-lg"
          >
            <div className="w-16 h-16 bg-white rounded-full group-hover:scale-90 transition-transform duration-200 shadow-inner"></div>
          </button>

          {/* Spacer for visual balance */}
          <div className="w-14 h-14 opacity-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Format Error Message */}
      {formatError && (
        <div className="w-full p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-3 animate-fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span className="text-sm font-medium">{formatError}</span>
          <button
            onClick={() => setFormatError(null)}
            className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Drag & Drop Zone */}
        <div
          className={`order-2 md:order-1 relative w-full h-[350px] rounded-3xl transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden group border-2 border-dashed
          ${isDragging
              ? 'bg-brand-50 border-brand-500 scale-[0.99] dark:bg-brand-900/10'
              : 'bg-slate-50 border-slate-300 hover:border-brand-400 hover:bg-slate-100 dark:bg-neutral-900/50 dark:border-neutral-700 dark:hover:bg-neutral-800 dark:hover:border-brand-500/50'
            }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
            className="hidden"
            onChange={handleChange}
          />

          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400 dark:text-neutral-400 group-hover:text-brand-500 transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>

          <div className="text-center px-6">
            <p className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              Upload Image
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              Supports: {SUPPORTED_EXTENSIONS.join(', ')} (max 20MB)
            </p>
          </div>
        </div>

        {/* Camera Button Zone */}
        <div
          onClick={startCamera}
          className="order-1 md:order-2 relative w-full h-[350px] rounded-3xl bg-slate-50 dark:bg-neutral-900/50 border-2 border-dashed border-slate-300 dark:border-neutral-700 hover:border-brand-400 dark:hover:border-brand-500/50 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400 dark:text-neutral-400 group-hover:text-brand-500 transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          </div>

          <div className="text-center px-6">
            <p className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              Open Camera
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Take a photo instantly
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
