import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Sparkles, Download, Wand2 } from 'lucide-react';

const ImageWidget = ({ data }) => {
    const { prompt, imageUrl, style, width, height, error } = data || {};
    const [isLoaded, setIsLoaded] = useState(false);

    if (error) {
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[420px] rounded-[24px] p-5 mt-4"
                style={{ background: '#1C1C1E', border: '1px solid rgba(255,69,58,0.2)' }}>
                <span className="text-[13px] text-[#FF453A] font-medium">{error}</span>
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
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-4 px-2">
                    <Wand2 className="w-4 h-4 text-[#0A84FF]" />
                    <span className="text-[12px] font-semibold text-[#EBEBF5] uppercase tracking-wider">AI Generation</span>
                    {style && style !== 'default' && (
                        <span className="ml-auto text-[10px] font-medium text-[#EBEBF5] opacity-60 bg-white/5 px-2 py-1 rounded-full capitalize">
                            {style}
                        </span>
                    )}
                </div>

                {/* Image Container */}
                <div className="relative w-full rounded-[20px] overflow-hidden bg-black/40" style={{ aspectRatio: width && height ? `${width}/${height}` : '1/1' }}>
                    <AnimatePresence>
                        {!isLoaded && (
                            <motion.div
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                >
                                    <Sparkles className="w-6 h-6 text-[#0A84FF] opacity-50" />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {imageUrl && (
                        <img
                            src={imageUrl}
                            alt={prompt}
                            onLoad={() => setIsLoaded(true)}
                            className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                        />
                    )}
                </div>

                {/* Prompt & Actions */}
                <div className="mt-4 px-2 flex items-start justify-between gap-4">
                    <p className="text-[13px] text-[#EBEBF5] opacity-80 leading-relaxed font-medium line-clamp-2 flex-1">
                        "{prompt}"
                    </p>
                    {isLoaded && (
                        <a
                            href={imageUrl}
                            download={`voxa-ai-${Date.now()}.png`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 transition-colors"
                        >
                            <Download className="w-4 h-4 text-white" />
                        </a>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ImageWidget;