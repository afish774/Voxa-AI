import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Disc, Calendar, ExternalLink, AlignLeft, ChevronDown, Clock, Mic2 } from 'lucide-react';

// ============================================================================
// 🎵 MusicWidget — Apple Premium Audio & Lyrics Card
// ============================================================================
// Design DNA: iOS 17 Apple Music / Cupertino Glassmorphism
// Features: 24px backdrop blur, hairline borders, smooth spring animations,
// and ambient gradient glows simulating album art bleed.
// ============================================================================

const MusicWidget = ({ data }) => {
    const {
        queryType = 'song_info', title, artist, album, releaseYear, duration,
        lyricsPreview, topAlbums, spotifySearchUrl, type, genres, error,
    } = data || {};

    const [isExpanded, setIsExpanded] = useState(false);

    // ── Error State ──────────────────────────────────────────────────────────
    if (error) {
        return (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[420px] rounded-[24px] sm:rounded-[28px] p-5 mt-5"
                style={{ background: 'rgba(28, 28, 30, 0.8)', border: '1px solid rgba(255,69,58,0.2)' }}>
                <span className="text-[13px] text-[#FF453A] font-medium tracking-tight">{error}</span>
            </motion.div>
        );
    }

    const isArtistMode = queryType === 'artist_info';
    const displayTitle = title || (isArtistMode ? artist : 'Unknown Track');
    const displaySubtitle = isArtistMode ? (genres?.[0] || type || 'Artist') : (artist || 'Unknown Artist');

    const safeAlbums = topAlbums || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[440px] rounded-[32px] overflow-hidden mt-5 shadow-2xl"
            style={{
                background: 'rgba(20, 20, 22, 0.65)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
        >
            {/* ── Ambient Album Art Bleed (Background Glow) ── */}
            <div className="absolute top-0 left-0 w-full h-48 pointer-events-none opacity-40" style={{
                background: 'radial-gradient(ellipse at 20% 0%, rgba(250, 35, 59, 0.3) 0%, transparent 60%), radial-gradient(ellipse at 80% 0%, rgba(94, 92, 230, 0.3) 0%, transparent 60%)',
                filter: 'blur(40px)',
            }} />

            <div className="relative z-10 p-5 sm:p-6">
                {/* ── Header ── */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] flex items-center justify-center shrink-0" style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                    }}>
                        {isArtistMode ? <Mic2 className="w-6 h-6 text-white/90" /> : <Music className="w-6 h-6 text-white/90" />}
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-[19px] sm:text-[21px] font-bold text-white tracking-[-0.02em] leading-tight truncate">
                            {displayTitle}
                        </h3>
                        <p className="text-[14px] text-white/60 font-medium tracking-tight mt-0.5 truncate capitalize">
                            {displaySubtitle}
                        </p>
                    </div>
                </div>

                {/* ── Metadata Grid ── */}
                {!isArtistMode && (album || releaseYear || duration) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
                        {album && (
                            <div className="p-3 rounded-[16px] col-span-2 sm:col-span-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <Disc className="w-3.5 h-3.5 text-white/40 mb-1.5" />
                                <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-0.5">Album</p>
                                <p className="text-[13px] text-white/90 font-medium truncate">{album}</p>
                            </div>
                        )}
                        {releaseYear && (
                            <div className="p-3 rounded-[16px]" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <Calendar className="w-3.5 h-3.5 text-white/40 mb-1.5" />
                                <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-0.5">Year</p>
                                <p className="text-[13px] text-white/90 font-medium">{releaseYear}</p>
                            </div>
                        )}
                        {duration && (
                            <div className="p-3 rounded-[16px]" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <Clock className="w-3.5 h-3.5 text-white/40 mb-1.5" />
                                <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-0.5">Duration</p>
                                <p className="text-[13px] text-white/90 font-medium">{duration}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Artist Top Albums (If Artist Mode) ── */}
                {isArtistMode && safeAlbums.length > 0 && (
                    <div className="mb-5 p-4 rounded-[20px]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="flex items-center gap-1.5 mb-3">
                            <Disc className="w-4 h-4 text-white/50" />
                            <span className="text-[12px] font-semibold text-white/60 tracking-tight">Top Albums</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            {safeAlbums.map((alb, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-[12px] font-bold text-white/20 w-3 text-right">{i + 1}</span>
                                    <span className="text-[14px] text-white/90 font-medium truncate">{alb}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Expandable Lyrics Section ── */}
                {lyricsPreview && (
                    <div className="mb-5 rounded-[20px] overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="p-4">
                            <div className="flex items-center gap-1.5 mb-2">
                                <AlignLeft className="w-4 h-4 text-white/50" />
                                <span className="text-[12px] font-semibold text-white/60 tracking-tight">Lyrics Snippet</span>
                            </div>

                            <motion.div
                                animate={{ height: isExpanded ? 'auto' : '80px' }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className="relative overflow-hidden"
                            >
                                <p className="text-[14px] text-white/80 leading-relaxed font-medium" style={{ whiteSpace: 'pre-line' }}>
                                    {lyricsPreview}
                                </p>
                                {!isExpanded && (
                                    <div className="absolute bottom-0 left-0 w-full h-12" style={{
                                        background: 'linear-gradient(to top, rgba(35,35,38,1) 0%, transparent 100%)'
                                    }} />
                                )}
                            </motion.div>

                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex items-center gap-1 mt-2 text-[12px] font-semibold text-[#0A84FF] hover:text-[#5E5CE6] transition-colors"
                            >
                                {isExpanded ? 'Show less' : 'Read more'}
                                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                                    <ChevronDown className="w-3 h-3" />
                                </motion.div>
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Primary Action Button ── */}
                {spotifySearchUrl && (
                    <a href={spotifySearchUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-[15px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                        style={{
                            background: '#1DB954',
                            boxShadow: '0 8px 16px -4px rgba(29, 185, 84, 0.3)'
                        }}>
                        Play on Spotify <ExternalLink className="w-4 h-4" />
                    </a>
                )}
            </div>
        </motion.div>
    );
};

export default MusicWidget;