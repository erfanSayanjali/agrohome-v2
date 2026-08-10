import React, { useRef, useState, useEffect } from 'react';

export default function VideoPlayer({ url, poster, className = '', autoPlay = false, muted = false }) {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0); // 0 - 100
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(muted);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;

        const onTime = () => {
            setCurrentTime(v.currentTime);
            setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
        };
        const onDuration = () => setDuration(v.duration || 0);
        const onEnded = () => setPlaying(false);

        v.addEventListener('timeupdate', onTime);
        v.addEventListener('durationchange', onDuration);
        v.addEventListener('ended', onEnded);

        return () => {
            v.removeEventListener('timeupdate', onTime);
            v.removeEventListener('durationchange', onDuration);
            v.removeEventListener('ended', onEnded);
        };
    }, []);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.muted = isMuted;
    }, [isMuted]);

    useEffect(() => {
        // keyboard controls: Space to toggle play/pause, "m" to mute
        const onKey = (e) => {
            if (!containerRef.current) return;
            // only react when container is focused or hovered (approximation) — check if event target is inside container
            if (!containerRef.current.contains(document.activeElement) && !containerRef.current.matches(':hover')) return;
            if (e.code === 'Space') {
                e.preventDefault();
                togglePlay();
            }
            if (e.key === 'm') {
                setIsMuted((s) => !s);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) {
            v.play();
            setPlaying(true);
        } else {
            v.pause();
            setPlaying(false);
        }
    };

    const handleSeek = (e) => {
        const v = videoRef.current;
        if (!v) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        v.currentTime = pct * (v.duration || 0);
        setProgress(pct * 100);
    };

    const toggleFullscreen = async () => {
        const el = containerRef.current;
        if (!el) return;
        if (!document.fullscreenElement) {
            try {
                await el.requestFullscreen();
                setIsFullscreen(true);
            } catch (err) {
                console.warn('fullscreen failed', err);
            }
        } else {
            await document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const formatTime = (t) => {
        if (!t || Number.isNaN(t)) return '0:00';
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div
            dir='ltr'
            ref={containerRef}
            className={`relative bg-black rounded-2xl overflow-hidden shadow-lg ${className}`}
            tabIndex={0} // make focusable for keyboard
            aria-label="Custom video player"
        >
            {/* Video element */}
            <video
                ref={videoRef}
                src={url}
                poster={poster}
                className="w-full h-auto max-h-[65vh] block"
                preload="metadata"
                onClick={togglePlay}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            />

            {/* Big overlay play button (hidden when playing) */}
            {!playing && (
                <button
                    onClick={togglePlay}
                    aria-label="Play video"
                    className="absolute inset-0 m-auto w-full h-full flex items-center justify-center bg-black/40 backdrop-blur-sm"
                >
                    <div className="flex items-center gap-4 p-4 rounded-full bg-white/10 hover:bg-white/20 transition">
                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="59.2585" height="59.2585" rx="29.6293" fill="#025C38"/>
<path d="M37.6404 26.7595L25.5199 19.3424C23.1081 17.8665 20.0059 19.5976 20.0059 22.4196V36.8411C20.0059 39.6631 23.1081 41.3939 25.5199 39.918L37.6404 32.5009C39.7875 31.1861 39.7875 28.0731 37.6404 26.7595Z" fill="white"/>
</svg>


                  
                    </div>
                </button>
            )}

            {/* Controls bar */}
            <div className="absolute left-0 right-0 bottom-0 p-3 bg-linear-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    {/* Play/Pause small */}
                    <button
                        onClick={togglePlay}
                        aria-label={playing ? 'Pause' : 'Play'}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
                    >
                        {playing ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="6" y="5" width="4" height="14" fill="white" />
                                <rect x="14" y="5" width="4" height="14" fill="white" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 5v14l11-7L8 5z" fill="white" />
                            </svg>
                        )}
                    </button>

                    {/* Progress bar (click to seek) */}
                    <div
                        className="flex-1 h-2 rounded-lg bg-white/20 cursor-pointer"
                        onClick={handleSeek}
                        role="slider"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(progress)}
                        aria-label="Seek"
                    >
                        <div className="h-full rounded-lg bg-white/60" style={{ width: `${progress}%` }} />
                    </div>

                    {/* Time */}
                    <div className="text-xs text-white/90 min-w-[68px] text-right">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>

                    {/* Mute */}
                    <button
                        onClick={() => setIsMuted((s) => !s)}
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
                    >
                        {isMuted ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 9v6h4l5 4V5L9 9H5z" fill="white" />
                                <path d="M16 8l4 4M20 8l-4 4" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 9v6h4l5 4V5L9 9H5z" fill="white" />
                                <path d="M16 8c1.5 1.5 1.5 6 0 7.5" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>

                    {/* Fullscreen */}
                    <button
                        onClick={toggleFullscreen}
                        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 8V4h4" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M20 16v4h-4" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M20 8V4h-4" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                            <path d="M4 16v4h4" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
