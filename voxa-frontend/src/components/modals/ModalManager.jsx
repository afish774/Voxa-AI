import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ProfileScreen, HistoryScreen, MemoryScreen,
    PersonalizationScreen, FeedbackScreen, SupportScreen
} from "./ModalScreens";

export default function ModalManager({
    activeModal, setActiveModal, isDark, theme,
    user, userName, setUserName, selectedVoice, setSelectedVoice
}) {

    const renderContent = () => {
        switch (activeModal) {
            case 'profile': return { title: "Profile Setup", component: <ProfileScreen theme={theme} user={user} userName={userName} setUserName={setUserName} /> };
            case 'history': return { title: "Recent Activity", component: <HistoryScreen theme={theme} user={user} onClose={() => setActiveModal(null)} /> };
            case 'brain': return { title: "Voxa's Brain", component: <MemoryScreen theme={theme} user={user} /> };
            case 'personalization': return { title: "Personalization", component: <PersonalizationScreen theme={theme} selectedVoice={selectedVoice} setSelectedVoice={setSelectedVoice} /> };
            case 'feedback': return { title: "Submit Feedback", component: <FeedbackScreen theme={theme} /> };
            case 'support': return { title: "Contact Support", component: <SupportScreen theme={theme} /> };
            default: return { title: "", component: null };
        }
    };

    const modalData = renderContent();

    return (
        <>
            <AnimatePresence>
                {activeModal === 'history' && (
                    <motion.div key="history-modal" initial={{ opacity: 0, x: -40, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -30, scale: 0.95, transition: { duration: 0.2 } }} transition={{ type: "spring", stiffness: 250, damping: 28 }} style={{ position: "absolute", top: 16, bottom: 16, left: 16, width: "clamp(280px, 80vw, 420px)", zIndex: 100, background: isDark ? "rgba(15,15,20,0.65)" : "rgba(250,250,252,0.65)", backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)", border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 40, padding: 28, display: "flex", flexDirection: "column", color: theme.text, overflowY: "auto", WebkitOverflowScrolling: "touch", boxShadow: "0 40px 100px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2)" }}>
                        <h2 style={{ margin: "0 0 24px 0", fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: theme.text }}>{modalData.title}</h2>
                        {modalData.component}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(activeModal && activeModal !== 'history') && (
                    <motion.div key="general-modal" initial={{ opacity: 0, y: 60, scale: 0.9, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(8px)", transition: { duration: 0.25 } }} transition={{ type: "spring", stiffness: 250, damping: 28 }} style={{ position: "absolute", zIndex: 100, width: "min(90vw, 540px)", maxHeight: "85dvh", background: isDark ? "rgba(15,15,20,0.65)" : "rgba(250,250,252,0.65)", backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)", border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 40, padding: "clamp(24px, 4vw, 40px)", display: "flex", flexDirection: "column", color: theme.text, overflowY: "auto", WebkitOverflowScrolling: "touch", boxShadow: "0 40px 100px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2)" }}>
                        <h2 style={{ margin: "0 0 28px 0", fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: theme.text }}>{modalData?.title}</h2>
                        {modalData?.component}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}