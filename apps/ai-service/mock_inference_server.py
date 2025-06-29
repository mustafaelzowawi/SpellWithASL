from fastapi import FastAPI
import random
import time
import base64
import numpy as np
from io import BytesIO
from PIL import Image
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Mock ASL Inference API")

# Mock ASL letters for random prediction
ASL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
               'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Mock AI service is running",
        "version": "1.0.0-mock"
    }

@app.post("/predict")
async def predict(request: dict):
    """
    Mock prediction endpoint that simulates AI inference
    Returns realistic-looking predictions for testing
    """
    try:
        start_time = time.time()
        
        # Validate request
        if "image" not in request:
            return {
                "prediction": "?",
                "confidence": 0.0,
                "processing_time": 0.0,
                "hand_detected": False,
                "error": "No image provided"
            }
        
        # Decode and validate image (basic check)
        try:
            image_data = base64.b64decode(request["image"])
            image = Image.open(BytesIO(image_data))
            hand_detected = True
            logger.info(f"Received image: {image.size}")
        except Exception as e:
            logger.error(f"Invalid image data: {e}")
            return {
                "prediction": "?",
                "confidence": 0.0,
                "processing_time": 0.0,
                "hand_detected": False,
                "error": "Invalid image data"
            }
        
        # Simulate processing time
        processing_delay = random.uniform(0.1, 0.3)  # 100-300ms
        time.sleep(processing_delay)
        
        # Generate mock prediction with realistic confidence
        predicted_letter = random.choice(ASL_LETTERS)
        
        # Simulate confidence distribution (more realistic)
        if random.random() < 0.7:  # 70% chance of high confidence
            confidence = random.uniform(0.7, 0.95)
        else:  # 30% chance of lower confidence
            confidence = random.uniform(0.3, 0.69)
        
        processing_time = time.time() - start_time
        
        logger.info(f"Mock prediction: {predicted_letter} (confidence: {confidence:.3f})")
        
        return {
            "prediction": predicted_letter,
            "confidence": confidence,
            "processing_time": processing_time,
            "hand_detected": hand_detected
        }
        
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        return {
            "prediction": "?",
            "confidence": 0.0,
            "processing_time": 0.0,
            "hand_detected": False,
            "error": str(e)
        }

@app.post("/predict/batch")
async def predict_batch(request: dict):
    """Mock batch prediction"""
    images = request.get("images", [])
    
    results = []
    for i, image_data in enumerate(images):
        # Mock prediction for each image
        predicted_letter = random.choice(ASL_LETTERS)
        confidence = random.uniform(0.5, 0.95)
        
        results.append({
            "prediction": predicted_letter,
            "confidence": confidence,
            "processing_time": random.uniform(0.1, 0.2),
            "hand_detected": True
        })
    
    return results

if __name__ == "__main__":
    import uvicorn
    
    logger.info("🤖 Starting Mock AI Service for testing...")
    logger.info("⚠️  This is a MOCK service - replace with real AI model later!")
    
    uvicorn.run(
        "mock_inference_server:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    ) 