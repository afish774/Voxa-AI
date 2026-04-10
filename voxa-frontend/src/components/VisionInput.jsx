import React, { useState, useRef } from 'react';

export default function VisionInput({ onImageSelected }) {
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Native browser API to convert the image file into a Base64 string
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            setPreview(base64String);

            // Pass the string up to your main chat component
            onImageSelected(base64String);
        };
        reader.readAsDataURL(file);
    };

    const clearImage = () => {
        setPreview(null);
        onImageSelected(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col gap-2 my-2">
            {/* Thumbnail Preview Area */}
            {preview && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-indigo-500 shadow-lg animate-fade-in">
                    <img
                        src={preview}
                        alt="Upload Preview"
                        className="object-cover w-full h-full"
                    />
                    <button
                        onClick={clearImage}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-700 transition-colors shadow"
                        title="Remove image"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Camera / Upload Button */}
            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-gray-800 text-white rounded-full hover:bg-indigo-600 transition-colors flex items-center justify-center w-12 h-12 shadow-md border border-gray-600"
                title="Upload Image"
                type="button"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                </svg>
            </button>

            <input
                type="file"
                accept="image/*"
                // The "capture" attribute tells mobile devices to open the native camera app!
                capture="environment"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
}