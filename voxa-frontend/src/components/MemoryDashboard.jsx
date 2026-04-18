import React, { useState, useEffect } from 'react';

export default function MemoryDashboard({ userToken }) {
    const [memories, setMemories] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchMemories = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://voxa-ai-zh5o.onrender.com/api/memory', {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            const data = await response.json();
            // 🛠️ SURGICAL FIX: Guard against non-array API responses to prevent .map() crash
            setMemories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load memories", error);
        }
        setLoading(false);
    };

    const deleteMemory = async (id) => {
        // Optimistic UI update: remove it from the screen instantly for a snappy feel
        setMemories(memories.filter(m => m._id !== id));

        try {
            await fetch(`https://voxa-ai-zh5o.onrender.com/api/memory/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
        } catch (error) {
            console.error("Failed to delete memory", error);
            fetchMemories(); // Re-fetch if the delete failed
        }
    };

    // Load memories when the panel is opened
    useEffect(() => {
        if (isOpen) fetchMemories();
    }, [isOpen]);

    return (
        <div className="fixed top-4 right-4 z-50">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-semibold shadow-lg transition-all"
            >
                {isOpen ? 'Close Brain' : '🧠 View Voxa\'s Brain'}
            </button>

            {/* The Dashboard Panel */}
            {isOpen && (
                <div className="absolute top-14 right-0 w-80 max-h-[70vh] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
                    <div className="bg-gray-800 p-4 border-b border-gray-700">
                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                            <span>🧠</span> Core Memories
                        </h3>
                        <p className="text-gray-400 text-xs mt-1">Manage what Voxa knows about you.</p>
                    </div>

                    <div className="overflow-y-auto p-4 flex flex-col gap-3">
                        {loading ? (
                            <div className="text-gray-400 text-sm text-center py-4">Accessing neural net...</div>
                        ) : memories.length === 0 ? (
                            <div className="text-gray-500 text-sm text-center py-4">No core memories established yet.</div>
                        ) : (
                            memories.map((mem) => (
                                <div key={mem._id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 relative group">
                                    <p className="text-gray-200 text-sm pr-6">{mem.fact}</p>
                                    <span className="text-gray-500 text-[10px] mt-2 block">
                                        {new Date(mem.timestamp).toLocaleDateString()}
                                    </span>

                                    {/* Delete Button (appears on hover) */}
                                    <button
                                        onClick={() => deleteMemory(mem._id)}
                                        className="absolute top-2 right-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Erase Memory"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}