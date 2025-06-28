from pydantic import BaseModel, Field, validator
from typing import Optional, List
import base64

class PredictionRequest(BaseModel):
    image: str = Field(
        ..., 
        description="Base64 encoded image data",
        min_length=100
    )
    
    @validator('image')
    def validate_base64(cls, v):
        try:
            # Remove data URL prefix if present
            if ',' in v:
                v = v.split(',')[1]
            
            # Validate base64
            base64.b64decode(v)
            return v
        except Exception:
            raise ValueError("Invalid base64 image data")

class PredictionResponse(BaseModel):
    prediction: str = Field(..., description="Predicted ASL letter")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Prediction confidence")
    landmarks: Optional[List[List[float]]] = Field(None, description="Hand landmarks if available")
    processing_time: Optional[float] = Field(None, description="Processing time in seconds")

class HealthResponse(BaseModel):
    status: str = Field(..., description="Service status")
    message: str = Field(..., description="Status message")
    version: Optional[str] = Field(None, description="API version")
    ai_service_status: Optional[str] = Field(None, description="AI service connectivity")

class BatchPredictionRequest(BaseModel):
    images: List[str] = Field(..., min_items=1, max_items=10)