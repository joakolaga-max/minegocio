import React, { useRef, useCallback } from 'react';
import { Icon } from './Icon';

interface Props {
  onResult: (code: string) => void;
  onClose: () => void;
}

declare const window: any;

export function Scanner({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const startScan = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    // Try native BarcodeDetector first
    if ('BarcodeDetector' in window) {
      try {
        // Try rear camera first, fall back to any camera
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: 'environment' } }
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
        }
        video.srcObject = stream;
        await video.play();
        const detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e', 'itf'],
        });
        let active = true;
        const scan = async () => {
          if (!active) return;
          try {
            const barcodes = await detector.detect(video);
            if (barcodes.length > 0) {
              active = false;
              onResult(barcodes[0].rawValue);
              return;
            }
          } catch {}
          if (active) requestAnimationFrame(scan);
        };
        scan();
        cleanupRef.current = () => {
          active = false;
          stream.getTracks().forEach(t => t.stop());
        };
        return;
      } catch {}
    }

    // Fallback to ZXing
    if (!window.ZXing) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@zxing/library@0.20.0/umd/index.min.js';
      script.onload = () => startScan();
      document.head.appendChild(script);
      return;
    }

    try {
      const hints = new Map();
      hints.set(window.ZXing.DecodeHintType.TRY_HARDER, true);
      const reader = new window.ZXing.BrowserMultiFormatReader(hints, 200);
      reader.decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        video,
        (result: any, err: any) => {
          if (result) {
            onResult(result.getText());
          }
        }
      );
      cleanupRef.current = () => reader.reset();
    } catch (e) {
      console.error('Scanner error:', e);
    }
  }, [onResult]);

  React.useEffect(() => {
    startScan();
    return () => { cleanupRef.current?.(); };
  }, [startScan]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000', zIndex: 500,
      display: 'flex', flexDirection: 'column',
    }}>
      <video
        ref={videoRef}
        style={{ flex: 1, objectFit: 'cover', width: '100%' }}
        muted playsInline autoPlay
      />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 260, height: 160, border: '2px solid #6366f1',
        borderRadius: 12, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
      }} />
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <button
          onClick={() => { cleanupRef.current?.(); onClose(); }}
          style={{
            background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
            width: 44, height: 44, cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="x" size={22} />
        </button>
      </div>
      <div style={{
        position: 'absolute', bottom: 80, width: '100%',
        textAlign: 'center', color: '#94a3b8', fontSize: 14,
      }}>
        Apuntá la cámara al código de barras
      </div>
    </div>
  );
}
