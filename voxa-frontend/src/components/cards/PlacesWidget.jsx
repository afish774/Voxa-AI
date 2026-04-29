import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Clock, Navigation } from 'lucide-react';

const PlacesWidget = ({ data }) => {
    const { query, location, places, totalFound, error } = data || {};
    const safePlaces = places || [];

    if (error || safePlaces.length === 0) {
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[420px] rounded-[24px] p-5 mt-4"
                style={{ background: '#1C1C1E', border: '1px solid rgba(255,69,58,0.2)' }}>
                <span className="text-[13px] text-[#FF453A] font-medium">{error || 'No places found nearby.'}</span>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[420px] rounded-[28px] overflow-hidden mt-4 shadow-2xl"
            style={{
                background: 'rgba(28, 28, 30, 0.65)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}
        >
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(52, 199, 89, 0.15)' }}>
                        <MapPin className="w-5 h-5 text-[#30D158]" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-[18px] font-semibold text-[#FFFFFF] tracking-tight truncate capitalize">{query || 'Nearby Places'}</h3>
                        <p className="text-[12px] text-[#EBEBF5] opacity-60 font-medium truncate">Near {location}</p>
                    </div>
                </div>

                {/* Places List */}
                <div className="flex flex-col gap-2">
                    {safePlaces.map((place, idx) => (
                        <div key={idx} className="p-3.5 rounded-[16px] transition-colors hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="text-[15px] font-semibold text-[#FFFFFF] truncate pr-2">{place.name}</h4>
                                {place.rating && (
                                    <div className="flex items-center gap-1 shrink-0 bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-bold text-amber-400">
                                        {place.rating} <Star className="w-3 h-3 fill-amber-400" />
                                    </div>
                                )}
                            </div>

                            <p className="text-[12px] text-[#EBEBF5] opacity-60 truncate mb-2">{place.address}</p>

                            <div className="flex items-center gap-3 text-[11px] font-medium">
                                {place.isOpen !== null && (
                                    <span className={place.isOpen ? 'text-[#30D158]' : 'text-[#FF453A]'}>
                                        {place.isOpen ? 'Open Now' : 'Closed'}
                                    </span>
                                )}
                                {place.priceLevel && (
                                    <span className="text-[#EBEBF5] opacity-40">
                                        {Array(place.priceLevel).fill('$').join('')}
                                    </span>
                                )}
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="ml-auto flex items-center gap-1 text-[#0A84FF] hover:opacity-80">
                                    <Navigation className="w-3 h-3" /> Directions
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default PlacesWidget;