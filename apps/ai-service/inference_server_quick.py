#!/usr/bin/env python3
"""
Quick Inference Server for SpellWithASL
Simplified version for rapid hackathon development
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import tensorflow as tf
import numpy as np
import json
import logging
from pathlib import Path
import time
import mediapipe as mp
import cv2
from typing import List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SpellWithASL Quick AI Service",
    description="Rapid prototyping ASL inference API",
    version="1.0.0"
)

# Global variables
model = None
label_mapping = None
mp_hands = None

class PredictionRequest(BaseModel):
    image: List[List[List[float]]]  # Normalized image array (224, 224, 3)
    return_landmarks: bool = True

class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    landmarks: Optional[List[float]] = None
    processing_time: float

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    message: str

@app.on_event("startup")
async def load_model():
    """Load the model and initialize MediaPipe on startup"""
    global model, label_mapping, mp_hands
    
    try:
        # Load model
        model_path = "models/asl_classifier_quick.h5"
        if Path(model_path).exists():
            model = tf.keras.models.load_model(model_path)
            logger.info(f"✅ Model loaded from {model_path}")
        else:
            logger.warning(f"❌ Model file not found: {model_path}")
            logger.info("🔧 Creating a dummy model for testing...")
            
            # Create a simple dummy model for immediate testing
            model = tf.keras.Sequential([
                tf.keras.layers.Input(shape=(224, 224, 3)),
                tf.keras.layers.GlobalAveragePooling2D(),
                tf.keras.layers.Dense(128, activation='relu'),
                tf.keras.layers.Dense(26, activation='softmax')
            ])
            model.compile(optimizer='adam', loss='sparse_categorical_crossentropy')
            
            # Save dummy model
            Path("models").mkdir(exist_ok=True)
            model.save(model_path)
            logger.info("✅ Dummy model created and saved")
        
        # Load label mapping
        label_path = "data/label_mapping.json"
        if Path(label_path).exists():
            with open(label_path, "r") as f:
                label_mapping = json.load(f)
            logger.info(f"✅ Label mapping loaded: {len(label_mapping)} classes")
        else:
            # Create default mapping
            label_mapping = {str(i): chr(65 + i) for i in range(26)}  # A-Z
            Path("data").mkdir(exist_ok=True)
            with open(label_path, "w") as f:
                json.dump(label_mapping, f)
            logger.info("✅ Default label mapping created")
        
        # Initialize MediaPipe
        mp_solutions = mp.solutions
        mp_hands = mp_solutions.hands.Hands(
            static_image_mode=True,
            max_num_hands=1,
            min_detection_confidence=0.5
        )
        logger.info("✅ MediaPipe initialized")
        
    except Exception as e:
        logger.error(f"❌ Error during startup: {str(e)}")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if model is not None else "error",
        model_loaded=model is not None,
        message="Quick AI service is running" if model is not None else "Model not loaded"
    )

@app.post("/predict", response_model=PredictionResponse)
async def predict_asl(request: PredictionRequest):
    """Main prediction endpoint - simplified for quick development"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    start_time = time.time()
    
    try:
        # Convert input to numpy array
        image_array = np.array(request.image, dtype=np.float32)
        
        # Validate input shape
        if image_array.shape != (224, 224, 3):
            raise ValueError(f"Expected shape (224, 224, 3), got {image_array.shape}")
        
        # Add batch dimension
        image_batch = np.expand_dims(image_array, axis=0)
        
        # Make prediction
        predictions = model.predict(image_batch, verbose=0)
        
        # Get prediction results
        predicted_class_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_idx])
        predicted_letter = label_mapping[str(predicted_class_idx)]
        
        # Extract landmarks (simplified - just return dummy data for now)
        landmarks = None
        if request.return_landmarks:
            # For quick demo, return dummy landmarks
            # In real implementation, you'd process with MediaPipe
            landmarks = [0.5] * 63  # 21 landmarks * 3 coordinates
        
        processing_time = time.time() - start_time
        
        logger.info(f"Prediction: {predicted_letter}, Confidence: {confidence:.3f}")
        
        return PredictionResponse(
            prediction=predicted_letter,
            confidence=confidence,
            landmarks=landmarks,
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict/batch")
async def predict_batch(images: List[List[List[List[float]]]]):
    """Batch prediction endpoint"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        results = []
        for image_data in images:
            request = PredictionRequest(image=image_data, return_landmarks=False)
            result = await predict_asl(request)
            results.append(result)
        
        return results
        
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "message": "SpellWithASL Quick AI Service",
        "status": "running",
        "model_loaded": model is not None,
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting SpellWithASL Quick AI Service...")
    print("📝 API Documentation: http://localhost:8001/docs")
    print("🔍 Health Check: http://localhost:8001/health")
    print("🛑 Stop with Ctrl+C")
    
    uvicorn.run(
        "inference_server_quick:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    ) 