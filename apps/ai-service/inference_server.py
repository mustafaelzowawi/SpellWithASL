from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time
import logging
import os
from typing import List
from pydantic import BaseModel

# Try to import landmark model, return error if unavailable
try:
    from landmark_model import asl_model
    LANDMARK_MODEL_AVAILABLE = True
except ImportError as e:
    print(f"❌ Landmark model not available: {e}")
    LANDMARK_MODEL_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ASL Landmark Inference API")

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Pydantic models for landmark prediction
class LandmarkPredictionRequest(BaseModel):
    landmarks: List[List[float]]  # [[x,y,z], [x,y,z], ...]

class TrainingRequest(BaseModel):
    data_directory: str

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    model_status = "loaded" if LANDMARK_MODEL_AVAILABLE and asl_model.is_trained else "failed" if LANDMARK_MODEL_AVAILABLE else "unavailable"
    
    return {
        "status": "healthy" if LANDMARK_MODEL_AVAILABLE and asl_model.is_trained else "degraded",
        "message": f"ASL inference service running - model {model_status}",
        "model_available": LANDMARK_MODEL_AVAILABLE,
        "model_trained": asl_model.is_trained if LANDMARK_MODEL_AVAILABLE else False,
        "model_status": model_status,
        "version": "1.0.0"
    }

@app.post("/predict-landmarks")
async def predict_landmarks(request: LandmarkPredictionRequest):
    """Predict ASL letter from MediaPipe landmarks"""
    try:
        start_time = time.time()
        
        # Check if model is available
        if not LANDMARK_MODEL_AVAILABLE:
            return {
                "prediction": None,
                "confidence": 0.0,
                "error": "Landmark model dependencies not available. Please install required packages."
            }
        
        # Check if model is trained
        if not asl_model.is_trained:
            return {
                "prediction": None,
                "confidence": 0.0,
                "error": "Model not trained. Please train the model first using /train-landmarks endpoint."
            }
        
        # Validate landmarks
        if len(request.landmarks) != 21:
            return {
                "prediction": None,
                "confidence": 0.0,
                "error": f"Expected 21 landmarks, got {len(request.landmarks)}"
            }
        
        # Use real model for prediction
        result = asl_model.predict(request.landmarks)
        
        processing_time = time.time() - start_time
        result["processing_time"] = processing_time
        
        return result
        
    except Exception as e:
        logger.error(f"Landmark prediction failed: {str(e)}")
        return {
            "prediction": None,
            "confidence": 0.0,
            "error": f"Prediction failed: {str(e)}"
        }

@app.post("/train-landmarks")
async def train_landmarks(request: TrainingRequest):
    """Train landmark-based ASL model"""
    try:
        if not LANDMARK_MODEL_AVAILABLE:
            return {
                "success": False,
                "error": "Landmark model dependencies not available. Please install required packages."
            }
        
        logger.info(f"Starting model training with data from: {request.data_directory}")
        
        # Train the model
        results = asl_model.train(request.data_directory)
        
        # Save the trained model
        model_path = "models/asl_landmark_model"
        asl_model.save_model(model_path)
        
        logger.info("Model training completed successfully")
        
        return {
            "success": True,
            "message": "Model trained successfully",
            "results": results,
            "model_path": model_path
        }
        
    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        return {
            "success": False,
            "error": f"Training failed: {str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    
    logger.info("🤖 Starting ASL Landmark Inference Service...")
    
    if LANDMARK_MODEL_AVAILABLE:
        if asl_model.is_trained:
            logger.info("✅ Model loaded and ready for landmark predictions")
        else:
            logger.info("⚠️ Model available but not trained. Use /train-landmarks to train the model.")
    else:
        logger.info("❌ Model dependencies not available. Please install required packages.")
    
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(
        "inference_server:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    ) 