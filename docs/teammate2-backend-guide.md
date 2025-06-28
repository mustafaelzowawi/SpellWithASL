# Backend Development Guide - Teammate 2

## 🎯 Your Mission
You're responsible for building a robust FastAPI backend that serves as the bridge between the frontend and AI service. You'll handle image processing, API endpoints, real-time communication, and ensure smooth data flow between all components.

## 🛠️ Tech Stack You'll Use
- **Framework**: FastAPI with Python 3.9+
- **Image Processing**: Pillow, OpenCV
- **HTTP Client**: httpx for AI service communication
- **Validation**: Pydantic models
- **CORS**: FastAPI CORS middleware
- **Deployment**: Uvicorn server

## 📋 Step-by-Step Development Plan

### Phase 1: Project Setup (Day 1)

#### 1.1 Initialize FastAPI Project
```bash
cd apps/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

#### 1.2 Create Requirements File
File: `requirements.txt`
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
pillow==10.0.1
opencv-python==4.8.1.78
httpx==0.25.2
pydantic==2.5.0
python-dotenv==1.0.0
numpy==1.24.3
base64
```

Install dependencies:
```bash
pip install -r requirements.txt
```

#### 1.3 Environment Configuration
File: `.env`
```env
AI_SERVICE_URL=http://localhost:8001
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
LOG_LEVEL=info
MAX_IMAGE_SIZE=2097152  # 2MB
```

### Phase 2: Core API Structure (Day 1)

#### 2.1 Main Application File
File: `main.py`
```python
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
```

#### 2.2 Pydantic Models
File: `models.py`
```python
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
```

### Phase 3: Service Layer (Day 1-2)

#### 3.1 Image Processing Service
File: `services/image_processor.py`
```python
import base64
import io
import cv2
import numpy as np
from PIL import Image
import logging

logger = logging.getLogger(__name__)

class ImageProcessor:
    def __init__(self):
        self.target_size = (224, 224)  # Standard input size for ML models
        self.max_size = 2 * 1024 * 1024  # 2MB max
    
    async def process_base64_image(self, base64_data: str) -> np.ndarray:
        """
        Process base64 image data and return normalized numpy array
        """
        try:
            # Decode base64
            image_data = base64.b64decode(base64_data)
            
            # Check file size
            if len(image_data) > self.max_size:
                raise ValueError(f"Image too large. Max size: {self.max_size} bytes")
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize image
            image = image.resize(self.target_size, Image.Resampling.LANCZOS)
            
            # Convert to numpy array and normalize
            image_array = np.array(image)
            image_array = image_array.astype(np.float32) / 255.0
            
            logger.info(f"Processed image: {image_array.shape}")
            return image_array
            
        except Exception as e:
            logger.error(f"Image processing failed: {str(e)}")
            raise ValueError(f"Failed to process image: {str(e)}")
    
    def extract_hand_region(self, image: np.ndarray) -> np.ndarray:
        """
        Extract hand region from image using basic computer vision
        This is a fallback if MediaPipe isn't available in backend
        """
        # Convert to grayscale for contour detection
        gray = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
        
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Threshold to create binary image
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            # Find largest contour (assuming it's the hand)
            largest_contour = max(contours, key=cv2.contourArea)
            
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(largest_contour)
            
            # Extract hand region with some padding
            padding = 20
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(image.shape[1] - x, w + 2 * padding)
            h = min(image.shape[0] - y, h + 2 * padding)
            
            hand_region = image[y:y+h, x:x+w]
            
            # Resize to target size
            hand_region = cv2.resize(hand_region, self.target_size)
            
            return hand_region
        
        # If no contours found, return resized original
        return cv2.resize(image, self.target_size)
```

#### 3.2 AI Service Client
File: `services/ai_client.py`
```python
import httpx
import logging
import json
import numpy as np
from typing import Dict, Any
import asyncio

logger = logging.getLogger(__name__)

class AIServiceClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.client = httpx.AsyncClient(timeout=30.0)
        
    async def check_health(self) -> bool:
        """Check if AI service is responsive"""
        try:
            response = await self.client.get(f"{self.base_url}/health")
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"AI service health check failed: {e}")
            return False
    
    async def predict(self, image_array: np.ndarray) -> Dict[str, Any]:
        """
        Send image to AI service for prediction
        """
        try:
            # Convert numpy array to list for JSON serialization
            image_list = image_array.tolist()
            
            payload = {
                "image": image_list,
                "return_landmarks": True
            }
            
            response = await self.client.post(
                f"{self.base_url}/predict",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"AI prediction successful: {result['prediction']}")
                return result
            else:
                logger.error(f"AI service error: {response.status_code} - {response.text}")
                raise Exception(f"AI service returned {response.status_code}")
                
        except httpx.TimeoutException:
            logger.error("AI service timeout")
            raise Exception("AI service timeout")
        except Exception as e:
            logger.error(f"AI prediction failed: {str(e)}")
            # Return fallback response
            return {
                "prediction": "?",
                "confidence": 0.0,
                "landmarks": None,
                "processing_time": 0.0
            }
    
    async def predict_batch(self, images: list[np.ndarray]) -> list[Dict[str, Any]]:
        """Batch prediction for multiple images"""
        try:
            image_lists = [img.tolist() for img in images]
            
            payload = {
                "images": image_lists,
                "return_landmarks": True
            }
            
            response = await self.client.post(
                f"{self.base_url}/predict/batch",
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Batch prediction failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Batch prediction failed: {str(e)}")
            # Return fallback responses
            return [
                {"prediction": "?", "confidence": 0.0, "landmarks": None}
                for _ in images
            ]
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
```

### Phase 4: Testing and Validation (Day 2)

#### 4.1 Test File
File: `test_api.py`
```python
import pytest
import httpx
import base64
import asyncio
from PIL import Image
import io

BASE_URL = "http://localhost:8000"

def create_test_image() -> str:
    """Create a test image and return as base64"""
    # Create a simple test image
    img = Image.new('RGB', (640, 480), color='white')
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    img_data = buffer.getvalue()
    
    return base64.b64encode(img_data).decode('utf-8')

@pytest.mark.asyncio
async def test_health_endpoint():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["healthy", "degraded"]

@pytest.mark.asyncio
async def test_predict_endpoint():
    test_image = create_test_image()
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/predict",
            json={"image": test_image}
        )
        assert response.status_code == 200
        data = response.json()
        assert "prediction" in data
        assert "confidence" in data
        assert 0.0 <= data["confidence"] <= 1.0

if __name__ == "__main__":
    # Run a simple test
    async def run_test():
        await test_health_endpoint()
        await test_predict_endpoint()
        print("All tests passed!")
    
    asyncio.run(run_test())
```

#### 4.2 Docker Configuration (Optional)
File: `Dockerfile`
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔄 Integration Points with Team

### With Frontend (Teammate 1):
- **API Endpoint**: `POST /predict` 
- **Request Format**: `{"image": "base64_string"}`
- **Response Format**: `{"prediction": "A", "confidence": 0.95}`
- **CORS**: Configured for localhost:3000

### With AI Service (Teammate 3):
- **Service URL**: `http://localhost:8001`
- **Data Format**: Normalized numpy arrays as JSON
- **Expected Response**: Prediction with confidence and landmarks

## 🧪 Testing Strategy

### Unit Tests:
```bash
pip install pytest pytest-asyncio
pytest test_api.py -v
```

### Manual Testing:
```bash
# Start the server
python main.py

# Test health endpoint
curl http://localhost:8000/health

# Test prediction (with test image)
python test_api.py
```

### Load Testing:
```bash
pip install locust
# Create locustfile.py for load testing
```

## 🚀 Deployment Preparation

### Heroku Deployment:
File: `Procfile`
```
web: uvicorn main:app --host=0.0.0.0 --port=${PORT:-8000}
```

File: `runtime.txt`
```
python-3.9.18
```

### Environment Variables for Production:
- `AI_SERVICE_URL`: Production AI service URL
- `CORS_ORIGINS`: Production frontend URLs
- `LOG_LEVEL`: info or warning for production

## 📊 Monitoring and Logging

### Logging Configuration:
File: `logging_config.py`
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

## 🤝 Collaboration Tips:
1. **API Documentation**: FastAPI auto-generates docs at `/docs`
2. **Error Handling**: Always return meaningful error messages
3. **Logging**: Log all important operations and errors
4. **Testing**: Test all endpoints before committing
5. **Performance**: Monitor response times and optimize as needed

## 🆘 Troubleshooting:
- **CORS Issues**: Check frontend URL in CORS origins
- **AI Service Connection**: Verify AI service is running on port 8001
- **Image Processing**: Check image size limits and formats
- **Memory Issues**: Monitor memory usage with large images

Ready to build a robust backend? Let's create the bridge that connects everything together! 🚀 