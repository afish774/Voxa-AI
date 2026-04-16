import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IconUser, IconMail, IconClock, IconTrash } from "../icons/Icons";

export function InputField({ theme, icon, placeholder, type = "text", defaultValue, onChange, disabled }) {
    const [isFocused, setIsFocused] = useState(false);
    return (
        <div style={{ position: "relative", marginBottom: 16 }}>
            <div style={{ position: "absolute", left: 16, top: 14, color: isFocused ? "#7c3aed" : theme.textFaint, transition: "color 0.2s" }}>{icon}</div>
            <input
                type={type}
                placeholder={placeholder}
                defaultValue={defaultValue}
                onChange={onChange}
                disabled={disabled}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                    width: "100%", padding: "14px 18px 14px 44px", borderRadius: 14,
                    border: `1px solid ${isFocused ? "#7c3aed" : theme.inputBorder}`,
                    background: theme.inputBg, color: disabled ? theme.textMuted : theme.text,
                    fontSize: "16px", outline: "none", fontFamily: "inherit", transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                    boxShadow: isFocused ? "0 0 0 3px rgba(124,58,237,0.15)" : "none",
                    cursor: disabled ? "not-allowed" : "text", WebkitAppearance: "none"
                }}
            />
        </div>
    );
}

export function ProfileScreen({ theme, user, userName, setUserName }) {
    const [tempName, setTempName] = useState(userName);
    const handleSave = () => {
        setUserName(tempName);
        try { localStorage.setItem('voxa_username', tempName); } catch (e) { }
        alert("Profile Saved locally! (Backend update coming soon)");
    };

    return (
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 12 }}>
                <div style={{ position: "relative" }}>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#db2777)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#fff", fontWeight: 600, boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}>{userName?.charAt(0).toUpperCase() || "V"}</div>
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: theme.text, letterSpacing: "-0.02em" }}>{userName}</h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: 14, color: theme.textMuted }}>Voxa AI User</p>
                </div>
            </div>
            <div style={{ marginTop: 8 }}>
                <label style={{ display: "block", fontSize: 12, color: theme.textMuted, marginBottom: 8, marginLeft: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Display Name</label>
                <InputField theme={theme} icon={<IconUser />} defaultValue={userName} onChange={(e) => setTempName(e.target.value)} />
                <label style={{ display: "block", fontSize: 12, color: theme.textMuted, marginBottom: 8, marginLeft: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email (Read Only)</label>
                <InputField theme={theme} icon={<IconMail />} defaultValue={user?.email || "guest@voxa.ai"} disabled={true} />
            </div>
            <motion.button onClick={handleSave} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: "100%", padding: "16px", borderRadius: 14, border: `1px solid ${theme.buttonBorder}`, background: theme.buttonBg, color: theme.text, fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}>Save Changes</motion.button>
        </div>
    );
}

export function HistoryScreen({ theme, user, onClose }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // 🚀 FIXED: Fallback to localStorage token specifically for OAuth users
                const token = user?.token || localStorage.getItem('voxa_token');

                const response = await fetch('https://voxa-ai-zh5o.onrender.com/api/chat/history', {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await response.json();

                if (Array.isArray(data)) {
                    const formatted = data.map(msg => {
                        const date = new Date(msg.timestamp);
                        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return { role: msg.role === 'ai' ? 'ai' : 'user', q: msg.text, time: `${date.toLocaleDateString()} • ${timeString}` };
                    });
                    setHistory(formatted);
                }
            } catch (err) {
                setHistory([{ role: 'ai', q: "Failed to connect to the database.", time: "System Error" }]);
            } finally { setLoading(false); }
        };
        fetchHistory();
    }, [user]);

    return (
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 12 }}>
            {loading ? <p style={{ color: theme.textMuted, textAlign: "center", marginTop: 20 }}>Loading logs...</p> : history.length === 0 ? <p style={{ color: theme.textMuted, textAlign: "center", marginTop: 20 }}>No chat history found.</p> : history.map((item, i) => (
                <motion.div key={i} whileHover={{ scale: 1.02, backgroundColor: theme.dropdownHover }} style={{ padding: 18, borderRadius: 16, border: `1px solid ${theme.buttonBorder}`, background: item.role === 'user' ? theme.buttonBg : 'transparent', cursor: "pointer", transition: "border-color 0.2s" }}>
                    <p style={{ margin: "0 0 8px 0", fontSize: 15, color: item.role === 'user' ? theme.text : theme.textMuted, lineHeight: 1.4, fontWeight: item.role === 'user' ? 500 : 400 }}>"{item.q}"</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: theme.textFaint }}><IconClock /><span style={{ fontSize: 12 }}>{item.role === 'user' ? 'You' : 'Voxa'} • {item.time}</span></div>
                </motion.div>
            ))}
        </div>
    );
}

export function MemoryScreen({ theme, user }) {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMemories = async () => {
        try {
            // 🚀 FIXED: Added localStorage OAuth fallback here too
            const token = user?.token || localStorage.getItem('voxa_token');
            const response = await fetch('https://voxa-ai-zh5o.onrender.com/api/memory', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (Array.isArray(data)) setMemories(data);
        } catch (error) { console.error("Failed to load memories", error); } finally { setLoading(false); }
    };

    const deleteMemory = async (id) => {
        const token = user?.token || localStorage.getItem('voxa_token');
        setMemories(memories.filter(m => m._id !== id));
        try { await fetch(`https://voxa-ai-zh5o.onrender.com/api/memory/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); }
        catch (error) { fetchMemories(); }
    };

    useEffect(() => { fetchMemories(); }, [user]);

    return (
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 12 }}>
            {loading ? <p style={{ color: theme.textMuted, textAlign: "center", marginTop: 20 }}>Accessing neural net...</p> : memories.length === 0 ? <p style={{ color: theme.textMuted, textAlign: "center", marginTop: 20 }}>No core memories established yet.</p> : memories.map((mem) => (
                <motion.div key={mem._id} whileHover={{ scale: 1.02, backgroundColor: theme.dropdownHover }} style={{ padding: 18, borderRadius: 16, border: `1px solid ${theme.buttonBorder}`, background: 'transparent', transition: "border-color 0.2s", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1, paddingRight: 16 }}><p style={{ margin: "0 0 8px 0", fontSize: 15, color: theme.text, lineHeight: 1.4, fontWeight: 400 }}>{mem.fact}</p><span style={{ fontSize: 12, color: theme.textFaint }}>{new Date(mem.timestamp).toLocaleDateString()}</span></div>
                    <button onClick={() => deleteMemory(mem._id)} style={{ background: "transparent", border: "none", color: theme.danger, cursor: "pointer", padding: 8, outline: "none", opacity: 0.8 }} title="Erase Memory" onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}><IconTrash /></button>
                </motion.div>
            ))}
        </div>
    );
}

export function PersonalizationScreen({ theme, selectedVoice, setSelectedVoice }) {
    const handleVoiceChange = (v) => { setSelectedVoice(v); try { localStorage.setItem('voxa_voice_preference', v); } catch (e) { } };
    return (
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
                <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>AI Voice Model</p>
                <div style={{ display: "flex", gap: 16 }}>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleVoiceChange("female")} style={{ flex: 1, padding: "24px 16px", borderRadius: 20, border: `2px solid ${selectedVoice === "female" ? "#7c3aed" : theme.buttonBorder}`, background: selectedVoice === "female" ? "rgba(124,58,237,0.1)" : theme.buttonBg, cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
                        <span style={{ fontSize: 32, display: "block", marginBottom: 12 }}>👩🏻‍🦰</span><span style={{ fontSize: 15, color: theme.text, fontWeight: 600, display: "block" }}>Nova</span><span style={{ fontSize: 12, color: theme.textMuted, marginTop: 4, display: "block" }}>Warm & Natural</span>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleVoiceChange("male")} style={{ flex: 1, padding: "24px 16px", borderRadius: 20, border: `2px solid ${selectedVoice === "male" ? "#7c3aed" : theme.buttonBorder}`, background: selectedVoice === "male" ? "rgba(124,58,237,0.1)" : theme.buttonBg, cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
                        <span style={{ fontSize: 32, display: "block", marginBottom: 12 }}>👨🏽‍🦱</span><span style={{ fontSize: 15, color: theme.text, fontWeight: 600, display: "block" }}>Orion</span><span style={{ fontSize: 12, color: theme.textMuted, marginTop: 4, display: "block" }}>Deep & Clear</span>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export function FeedbackScreen({ theme }) {
    const [rating, setRating] = useState(0);
    return (
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{ fontSize: 15, color: theme.textMuted, lineHeight: 1.5 }}>How is your experience with Voxa so far?</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", margin: "10px 0" }}>{[1, 2, 3, 4, 5].map(star => (<motion.span whileHover={{ scale: 1.2 }} key={star} onClick={() => setRating(star)} style={{ fontSize: 36, cursor: "pointer", color: star <= rating ? "#f59e0b" : theme.buttonBorder, transition: "color 0.2s" }}>★</motion.span>))}</div>
            <div style={{ position: "relative" }}><textarea placeholder="Tell us what you love or what could be better..." style={{ width: "100%", height: 120, padding: "16px 18px", borderRadius: 14, border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: "16px", outline: "none", resize: "none", fontFamily: "inherit", transition: "border-color 0.2s", WebkitAppearance: "none" }} onFocus={e => e.target.style.borderColor = "#7c3aed"} onBlur={e => e.target.style.borderColor = theme.inputBorder} /></div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #7c3aed, #db2777)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 10px 20px -10px rgba(124,58,237,0.5)" }}>Submit Feedback</motion.button>
        </div>
    );
}

export function SupportScreen({ theme }) {
    return (
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{ fontSize: 15, color: theme.textMuted, lineHeight: 1.5 }}>Raise a support ticket. Our engineering team will get back to you shortly.</p>
            <div style={{ position: "relative" }}><select style={{ width: "100%", padding: "16px 18px", borderRadius: 14, border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: "16px", outline: "none", fontFamily: "inherit", WebkitAppearance: "none", cursor: "pointer" }}><option>General Inquiry</option><option>Bug Report</option><option>Feature Request</option></select>
                <div style={{ position: "absolute", right: 18, top: 18, pointerEvents: "none", color: theme.textFaint }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
            </div>
            <textarea placeholder="Please describe the issue in detail..." style={{ width: "100%", height: 140, padding: "16px 18px", borderRadius: 14, border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: "16px", outline: "none", resize: "none", fontFamily: "inherit", WebkitAppearance: "none" }} onFocus={e => e.target.style.borderColor = "#7c3aed"} onBlur={e => e.target.style.borderColor = theme.inputBorder} />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #7c3aed, #db2777)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 10px 20px -10px rgba(124,58,237,0.5)" }}>Submit Ticket</motion.button>
        </div>
    );
}