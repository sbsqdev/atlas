import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n/useT';

const MAX_SECONDS = 12;

/** Telegram-style round video message recorder. Records a short clip via the
 *  camera and returns it as a data URL. LOCAL only (stored on this device). */
export default function CircleRecorder({ onSend, onCancel }: { onSend: (dataUrl: string) => void; onCancel: () => void }) {
  const { t } = useT();
  const liveRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const [state, setState] = useState<'init' | 'ready' | 'rec' | 'done' | 'denied'>('init');
  const [seconds, setSeconds] = useState(0);
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320, facingMode: 'user' }, audio: true });
        if (cancelled) { stream.getTracks().forEach((tr) => tr.stop()); return; }
        streamRef.current = stream;
        if (liveRef.current) { liveRef.current.srcObject = stream; liveRef.current.play().catch(() => {}); }
        setState('ready');
      } catch {
        setState('denied');
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  // Auto-stop at the max duration.
  useEffect(() => {
    if (state !== 'rec') return;
    const id = window.setInterval(() => setSeconds((s) => {
      if (s + 1 >= MAX_SECONDS) stop();
      return s + 1;
    }), 1000);
    return () => window.clearInterval(id);
  }, [state]);

  const start = () => {
    const stream = streamRef.current;
    if (!stream) return;
    chunks.current = [];
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' : 'video/webm';
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 500_000 });
    rec.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunks.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onload = () => { setDataUrl(String(reader.result)); setState('done'); };
      reader.readAsDataURL(blob);
    };
    recRef.current = rec;
    rec.start();
    setSeconds(0);
    setState('rec');
  };

  const stop = () => {
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop();
  };

  useEffect(() => {
    if (state === 'done' && previewRef.current && dataUrl) {
      previewRef.current.src = dataUrl;
    }
  }, [state, dataUrl]);

  return (
    <div className="circle-rec">
      {state === 'denied' ? (
        <div className="circle-denied">📷 {t('cameraDenied')}
          <button className="btn small" style={{ marginTop: 10 }} onClick={onCancel}>{t('cancelRec')}</button>
        </div>
      ) : (
        <>
          <div className="circle-frame">
            {state !== 'done'
              ? <video ref={liveRef} muted playsInline className="circle-video" />
              : <video ref={previewRef} controls autoPlay loop playsInline className="circle-video" />}
            {state === 'rec' && <span className="rec-dot">● {seconds}s</span>}
          </div>
          <p className="circle-hint">🎥 {t('circleHint')} · ≤{MAX_SECONDS}s</p>
          <div className="circle-actions">
            {state === 'ready' && <button className="btn primary" onClick={start}>● {t('recordCircle')}</button>}
            {state === 'rec' && <button className="btn" onClick={stop}>■ {t('stopRec')}</button>}
            {state === 'done' && <button className="btn primary" onClick={() => onSend(dataUrl)}>{t('sendCircle')} →</button>}
            <button className="btn ghost" onClick={onCancel}>{t('cancelRec')}</button>
          </div>
        </>
      )}
    </div>
  );
}
