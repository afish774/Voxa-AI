import base64
import numpy as np
import cv2
from fastapi import FastAPI, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
import librosa
import io

app = FastAPI(title="Voxa Emotion AI Engine")

# 🛡️ Allow your React frontend and Node backend to communicate with this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "Voxa Emotion Engine is running."}

# ==============================================================================
# 👁️ VISUAL EMOTION PIPELINE (Using OpenCV & DeepFace)
# ==============================================================================
@app.post("/analyze/vision")
async def analyze_vision(image_b64: str = Form(...)):
    try:
        # 1. Clean the base64 string (remove the data:image/jpeg;base64, header if present)
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]
            
        # 2. Decode the image into a numpy array for OpenCV
        img_data = base64.b64decode(image_b64)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"error": "Failed to decode image."}

        # 3. Run the DeepFace CNN to extract emotions
        # enforce_detection=False ensures it doesn't crash if the user turns their head
        analysis = DeepFace.analyze(img, actions=['emotion'], enforce_detection=False)
        
        # DeepFace returns a list of faces. We grab the first one.
        dominant_emotion = analysis[0]['dominant_emotion']
        emotion_scores = analysis[0]['emotion']

        print(f"👁️ Vision Detected: {dominant_emotion}")

        return {
            "success": True,
            "dominant_emotion": dominant_emotion,
            "scores": emotion_scores
        }

    except Exception as e:
        print(f"❌ Vision Pipeline Error: {str(e)}")
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
        # sr=22050 is standard for voice processing
        y, sr = librosa.load(io.BytesIO(audio_bytes), sr=22050)
        
        # 3. Extract the MFCCs (The acoustic "fingerprint" of the voice)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mean_mfccs = np.mean(mfccs.T, axis=0)

        print(f"🎙️ Voice Features Extracted: {len(mean_mfccs)} MFCCs")

        # TODO: In the next step, we will pass 'mean_mfccs' through a trained Audio Neural Network.
        # For now, we return the successful extraction.
        
        return {
            "success": True,
            "message": "Acoustic features extracted successfully",
            "mfcc_shape": mean_mfccs.tolist(),
            "dominant_emotion": "neutral" # Placeholder until the Audio NN is wired
        }

    except Exception as e:
        print(f"❌ Voice Pipeline Error: {str(e)}")
        return {"error": str(e), "dominant_emotion": "neutral"}

if __name__ == "__main__":
    import uvicorn
    # Runs the server locally on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)