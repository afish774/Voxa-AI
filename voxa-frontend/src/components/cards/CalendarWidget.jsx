import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, MapPin, CheckCircle2 } from 'lucide-react';

const CalendarWidget = ({ data }) => {
    const { mode, events, event, totalEvents, dateRange, error } = data || {};
    const safeEvents = events || [];

    if (error) {
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[420px] rounded-[24px] p-5 mt-4"
                style={{ background: '#1C1C1E', border: '1px solid rgba(255,69,58,0.2)' }}>
                <span className="text-[13px] text-[#FF453A] font-medium">{error}</span>
            </motion.div>
        );
    }

    const formatTime = (isoString) => {
        if (!isoString) return '';
        return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

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
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shadow-sm" style={{ background: '#FF453A' }}>
                        <CalendarIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-[18px] font-semibold text-[#FFFFFF] tracking-tight">{mode === 'create' ? 'Event Scheduled' : 'Your Schedule'}</h3>
                        <p className="text-[13px] text-[#EBEBF5] opacity-60 font-medium capitalize">{dateRange || 'Today'}</p>
                    </div>
                </div>

                {/* Created Event Mode */}
                {mode === 'create' && event && (
                    <div className="p-4 rounded-[18px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-[#30D158]" />
                            <span className="text-[14px] font-semibold text-[#FFFFFF]">{event.summary}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 ml-6">
                            <Clock className="w-3.5 h-3.5 text-[#EBEBF5] opacity-50" />
                            <span className="text-[13px] text-[#EBEBF5] opacity-70">{formatTime(event.start)}</span>
                        </div>
                    </div>
                )}

                {/* List Schedule Mode */}
                {mode === 'schedule' && (
                    <div className="flex flex-col gap-3">
                        {safeEvents.length === 0 ? (
                            <p className="text-[14px] text-[#EBEBF5] opacity-60 text-center py-4">No events scheduled.</p>
                        ) : (
                            safeEvents.map((evt, idx) => (
                                <div key={idx} className="flex gap-4 p-3 rounded-[16px] transition-colors hover:bg-white/5">
                                    <div className="flex flex-col items-end shrink-0 w-16 pt-0.5">
                                        <span className="text-[13px] font-medium text-[#FFFFFF]">{formatTime(evt.start)}</span>
                                        <span className="text-[11px] text-[#EBEBF5] opacity-40">{formatTime(evt.end)}</span>
                                    </div>
                                    <div className="w-[3px] rounded-full bg-[#FF453A] opacity-80" />
                                    <div className="flex flex-col justify-center">
                                        <span className="text-[15px] font-semibold text-[#FFFFFF] tracking-tight">{evt.summary}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default CalendarWidget;