import base64
import numpy as np
import cv2
from io import BytesIO
from PIL import Image
from fastapi import FastAPI, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
from deepface import DeepFace
import librosa

app = FastAPI(title="Voxa Emotion AI Engine")

# 🛡️ Allow your React frontend and Node backend to communicate with this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🚀 Load a modern, state-of-the-art model trained on AffectNet & FERPlus!
print("⏳ Loading Modern AffectNet AI Model...")
emotion_classifier = pipeline("image-classification", model="dima806/facial_emotions_image_detection")
print("✅ AI Model Loaded!")

@app.get("/")
def health_check():
    return {"status": "Voxa Emotion Engine is running."}

# ==============================================================================
# 👁️ VISUAL EMOTION PIPELINE (Using OpenCV, DeepFace Cropping & Hugging Face)
# ==============================================================================
@app.post("/analyze/vision")
async def analyze_vision(image_b64: str = Form(...)):
    try:
        # 1. Clean the base64 string
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]
            
        # 2. Decode the image into a numpy array for OpenCV
        img_data = base64.b64decode(image_b64)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"error": "Failed to decode image."}

        # 3. Use DeepFace strictly to CROP the face out of the background
        faces = DeepFace.extract_faces(img, enforce_detection=False)
        if len(faces) == 0:
             return {"error": "No face detected.", "dominant_emotion": "neutral"}
             
        # Grab the cropped face array and convert it to a PIL Image for Hugging Face
        cropped_face_array = faces[0]['face']
        # DeepFace returns floats [0,1], convert back to uint8 [0,255] for PIL
        cropped_face_uint8 = (cropped_face_array * 255).astype(np.uint8)
        pil_image = Image.fromarray(cv2.cvtColor(cropped_face_uint8, cv2.COLOR_BGR2RGB))

        # 4. Pass the cropped face to the MODERN AffectNet model!
        results = emotion_classifier(pil_image)
        
        # HuggingFace returns a list of dicts: [{'label': 'happy', 'score': 0.98}, ...]
        dominant_emotion = results[0]['label'].lower()
        
        # 🚀 THE FIX: Convert numpy float32 to standard Python floats for JSON serialization
        safe_scores = {res['label'].lower(): float(res['score']) for res in results}

        print(f"👁️ Modern Vision Detected: {dominant_emotion.upper()} | Accuracy: {safe_scores[dominant_emotion]*100:.1f}%")

        return {
            "success": True,
            "dominant_emotion": dominant_emotion,
            "scores": safe_scores
        }

    except Exception as e:
        print(f"❌ Modern Vision Pipeline Error: {str(e)}")
        return {"error": str(e), "dominant_emotion": "neutral"}

# ==============================================================================
# 🎙️ ACOUSTIC EMOTION PIPELINE (Using Librosa MFCCs)
# ==============================================================================
@app.post("/analyze/voice")
async def analyze_voice(audio_file: UploadFile = File(...)):
    try:
        # 1. Read the incoming audio file bytes
        audio_bytes = await audio_file.read()
        
        # 2. Load the audio into Librosa for frequency extraction
        y, sr = librosa.load(BytesIO(audio_bytes), sr=22050)
        
        # 3. Extract the MFCCs
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mean_mfccs = np.mean(mfccs.T, axis=0)

        print(f"🎙️ Voice Features Extracted: {len(mean_mfccs)} MFCCs")
        
        # 🚀 THE FIX: Convert NumPy array to standard Python list for JSON serialization
        safe_mfccs = [float(x) for x in mean_mfccs]

        return {
            "success": True,
            "message": "Acoustic features extracted successfully",
            "mfcc_shape": safe_mfccs,
            "dominant_emotion": "neutral" 
        }

    except Exception as e:
        print(f"❌ Voice Pipeline Error: {str(e)}")
        return {"error": str(e), "dominant_emotion": "neutral"}

if __name__ == "__main__":
    import uvicorn
    # Runs the server locally on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)