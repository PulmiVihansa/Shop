import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import '../../styles/introVideo.css';

const POSTER_URL = '/intro-poster.jpg';
const PREVIEW_WEBM_URL = '/intro-preview.webm';
const HQ_WEBM_URL = '/intro-hq.webm';
const FALLBACK_MP4_URL = '/intro-fallback.mp4';

function playVideo(video) {
  if (!video) return;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.play().catch(() => {});
}

export default function IntroVideoGate({ onFinish }) {
  const previewRef = useRef(null);
  const hqRef = useRef(null);
  const [visible, setVisible] = useState(true);
  const [previewReady, setPreviewReady] = useState(false);
  const [hqReady, setHqReady] = useState(false);
  const [canEnter, setCanEnter] = useState(false);

  useEffect(() => {
    if (!visible) return undefined;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;

    const revealTimer = window.setTimeout(() => setCanEnter(true), 1800);
    const fallbackTimer = window.setTimeout(() => setCanEnter(true), 3200);
    const preview = previewRef.current;

    playVideo(preview);

    if (preview) {
      preview.currentTime = 0;
    }

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, [visible]);

  useEffect(() => {
    if (!previewReady) return;
    playVideo(hqRef.current);
  }, [previewReady]);

  useEffect(() => {
    const hq = hqRef.current;
    const preview = previewRef.current;
    if (!hqReady || !hq || !preview) return;

    try {
      if (Number.isFinite(preview.currentTime) && Number.isFinite(hq.duration) && hq.duration > 0) {
        hq.currentTime = preview.currentTime % hq.duration;
      }
    } catch {
      // Browsers can reject currentTime before enough metadata is available.
    }
    playVideo(hq);
  }, [hqReady]);

  const enterSite = () => {
    setVisible(false);
    onFinish?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.section
          className="rawkode-video-intro"
          role="dialog"
          aria-label="RAWKODE cinematic launch intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.015, filter: 'blur(12px)' }}
          transition={{ duration: 0.95, ease: 'easeInOut' }}
        >
          <img
            className={`rawkode-video-intro__poster ${previewReady ? 'is-hidden' : ''}`}
            src={POSTER_URL}
            alt=""
            fetchpriority="high"
            decoding="sync"
          />

          <video
            ref={previewRef}
            className={`rawkode-video-intro__media rawkode-video-intro__media--preview ${previewReady ? 'is-ready' : ''}`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={POSTER_URL}
            disablePictureInPicture
            onCanPlay={() => {
              setPreviewReady(true);
              playVideo(previewRef.current);
            }}
            onLoadedData={() => setPreviewReady(true)}
          >
            <source src={PREVIEW_WEBM_URL} type="video/webm" />
            <source src={FALLBACK_MP4_URL} type="video/mp4" />
          </video>

          <video
            ref={hqRef}
            className={`rawkode-video-intro__media rawkode-video-intro__media--hq ${hqReady ? 'is-ready' : ''}`}
            autoPlay
            muted
            loop
            playsInline
            preload={previewReady ? 'auto' : 'none'}
            poster={POSTER_URL}
            disablePictureInPicture
            onCanPlay={() => setHqReady(true)}
            onLoadedData={() => setHqReady(true)}
          >
            {previewReady && <source src={HQ_WEBM_URL} type="video/webm" />}
            {previewReady && <source src={FALLBACK_MP4_URL} type="video/mp4" />}
          </video>

          <div className="rawkode-video-intro__grain" aria-hidden="true" />

          <div className="rawkode-video-intro__brand" aria-hidden="true">
            <img src="/models/logo.png" alt="" loading="eager" decoding="async" />
          </div>

          <div className="rawkode-video-intro__sound">SOUND ON</div>
          <div className="rawkode-video-intro__side rawkode-video-intro__side--left">BREAK RULES. NOT STYLE.</div>
          <div className="rawkode-video-intro__side rawkode-video-intro__side--right">SPRING / SUMMER 2026</div>

          <div className="rawkode-video-intro__cta">
            <motion.div
              className="rawkode-video-intro__cta-inner"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: canEnter ? 1 : 0, y: canEnter ? 0 : 24 }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
            >
              <p>PREMIUM STREETWEAR DESIGNED TO DEFY</p>
              <button type="button" onClick={enterSite} disabled={!canEnter}>
                <span>ENTER THE DROP</span>
                <span aria-hidden="true">-&gt;</span>
              </button>
            </motion.div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
