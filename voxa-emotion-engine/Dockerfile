FROM python:3.10-slim-bookworm

WORKDIR /app

# Install system dependencies for OpenCV and Librosa audio processing
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

# Hugging Face Spaces run on port 7860 by default
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]