from pydantic import BaseModel, Field
from typing import Optional, List

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