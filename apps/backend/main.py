from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

from models import PredictionRequest, PredictionResponse, HealthResponse
from services.image_processor import ImageProcessor
from services.ai_client import AIServiceClient

load_dotenv()

app = FastAPI(
    title="SpellWithASL Backend API",
    description="Backend API for ASL gesture recognition",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
image_processor = ImageProcessor()
ai_client = AIServiceClient(
    base_url=os.getenv("AI_SERVICE_URL", "http://localhost:8001")
)

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="SpellWithASL Backend API is running",
        version="1.0.0"
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check including AI service connectivity"""
    ai_healthy = await ai_client.check_health()
    
    return HealthResponse(
        status="healthy" if ai_healthy else "degraded",
        message="Backend is running",
        ai_service_status="connected" if ai_healthy else "disconnected"
    )

@app.post("/predict", response_model=PredictionResponse)
async def predict_asl(request: PredictionRequest):
    """
    Main prediction endpoint for ASL gesture recognition
    Accepts base64 encoded image and returns prediction
    """
    try:
        # Process the image
        processed_image = await image_processor.process_base64_image(
            request.image
        )
        
        # Send to AI service for prediction
        prediction_result = await ai_client.predict(processed_image)
        
        return PredictionResponse(
            prediction=prediction_result["prediction"],
            confidence=prediction_result["confidence"],
            landmarks=prediction_result.get("landmarks"),
            processing_time=prediction_result.get("processing_time", 0.0)
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict/batch", response_model=list[PredictionResponse])
async def predict_asl_batch(images: list[str]):
    """Batch prediction endpoint for multiple images"""
    try:
        results = []
        for image_b64 in images:
            processed_image = await image_processor.process_base64_image(image_b64)
            prediction_result = await ai_client.predict(processed_image)
            
            results.append(PredictionResponse(
                prediction=prediction_result["prediction"],
                confidence=prediction_result["confidence"],
                landmarks=prediction_result.get("landmarks")
            ))
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=os.getenv("LOG_LEVEL", "info")
    )