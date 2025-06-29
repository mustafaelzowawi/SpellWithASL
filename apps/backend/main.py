from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import httpx
import os
import json
import numpy as np
from datetime import datetime
import uuid
from pathlib import Path

# Pydantic models
class LandmarkPoint(BaseModel):
    x: float
    y: float
    z: float

class LandmarkPredictionRequest(BaseModel):
    landmarks: List[List[float]]  # [[x,y,z], [x,y,z], ...] - more efficient format

class DataCollectionRequest(BaseModel):
    letter: str
    landmarks: List[List[float]]  # Updated to use array format
    timestamp: int

class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    landmarks: Optional[List[List[float]]] = None

class HealthResponse(BaseModel):
    status: str
    message: str
    timestamp: str

# Initialize FastAPI app
app = FastAPI(title="SpellWithASL Backend", version="1.0.0")

# Configure CORS - get allowed origins from environment
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,https://spell-with-asl.vercel.app").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "https://spell-with-asl-ai.up.railway.app")
DATA_DIR = Path("training_data")
DATA_DIR.mkdir(exist_ok=True)

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        message="Backend service is running",
        timestamp=datetime.now().isoformat()
    )

# Landmark-based prediction
@app.post("/predict-landmarks", response_model=PredictionResponse)
async def predict_asl_landmarks(request: LandmarkPredictionRequest):
    """Predict ASL letter from MediaPipe landmarks"""
    try:
        # Call AI service with landmarks (already in correct format)
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_SERVICE_URL}/predict-landmarks",
                json={"landmarks": request.landmarks},
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                return PredictionResponse(
                    prediction=result.get("prediction", "Unknown"),
                    confidence=result.get("confidence", 0.0),
                    landmarks=request.landmarks
                )
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"AI service error: {response.text}"
                )
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="AI service timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# Data collection endpoint
@app.post("/collect-sample")
async def collect_training_sample(request: DataCollectionRequest):
    """Collect landmark data for training"""
    try:
        # Create letter directory if it doesn't exist
        letter_dir = DATA_DIR / request.letter
        letter_dir.mkdir(exist_ok=True)
        
        # Create unique filename
        sample_id = str(uuid.uuid4())
        filename = letter_dir / f"{sample_id}.json"
        
        # Prepare sample data (convert to object format for consistency with existing data)
        landmarks_objects = [{"x": lm[0], "y": lm[1], "z": lm[2]} for lm in request.landmarks]
        
        sample_data = {
            "letter": request.letter,
            "landmarks": landmarks_objects,
            "timestamp": request.timestamp,
            "sample_id": sample_id
        }
        
        # Save to file
        with open(filename, 'w') as f:
            json.dump(sample_data, f, indent=2)
        
        return {
            "success": True,
            "message": f"Sample collected for letter {request.letter}",
            "sample_id": sample_id,
            "filename": str(filename)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to collect sample: {str(e)}")

# Get collection statistics
@app.get("/collection-stats")
async def get_collection_stats():
    """Get statistics about collected training data"""
    try:
        stats = {}
        total_samples = 0
        
        # Count samples for each letter
        for letter_dir in DATA_DIR.iterdir():
            if letter_dir.is_dir():
                letter = letter_dir.name
                sample_count = len(list(letter_dir.glob("*.json")))
                stats[letter] = sample_count
                total_samples += sample_count
        
        return {
            "total_samples": total_samples,
            "letter_stats": stats,
            "letters_with_data": len(stats),
            "data_directory": str(DATA_DIR)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

# New: Detailed data analysis
@app.get("/analyze-training-data")
async def analyze_training_data():
    """Analyze training data quality and distribution"""
    try:
        analysis = {
            "letter_distribution": {},
            "potential_issues": [],
            "recommendations": [],
            "similar_letters": {
                "G_vs_H": {"description": "G (flat hand) vs H (two fingers sideways)"},
                "F_vs_9": {"description": "F (circle with thumb/index) vs 9 (similar circle)"},
                "K_vs_P": {"description": "K vs P (similar finger positions)"},
                "M_vs_N": {"description": "M (3 fingers) vs N (2 fingers over thumb)"}
            }
        }
        
        total_samples = 0
        letter_counts = {}
        
        # Analyze each letter
        for letter_dir in DATA_DIR.iterdir():
            if letter_dir.is_dir():
                letter = letter_dir.name
                sample_files = list(letter_dir.glob("*.json"))
                count = len(sample_files)
                letter_counts[letter] = count
                total_samples += count
                
                # Analyze sample quality for this letter
                if count > 0:
                    # Sample a few files to check data quality
                    sample_file = sample_files[0]
                    try:
                        with open(sample_file, 'r') as f:
                            sample = json.load(f)
                        
                        landmarks = sample["landmarks"]
                        if len(landmarks) != 21:
                            analysis["potential_issues"].append(
                                f"Letter {letter}: Invalid landmark count ({len(landmarks)} instead of 21)"
                            )
                            
                        # Check for reasonable coordinate ranges
                        x_coords = [lm["x"] for lm in landmarks]
                        y_coords = [lm["y"] for lm in landmarks]
                        
                        if max(x_coords) - min(x_coords) < 0.1:
                            analysis["potential_issues"].append(
                                f"Letter {letter}: Hand appears too small (x-range: {max(x_coords) - min(x_coords):.3f})"
                            )
                            
                    except Exception as e:
                        analysis["potential_issues"].append(f"Letter {letter}: Data parsing error - {str(e)}")
        
        analysis["letter_distribution"] = letter_counts
        
        # Generate recommendations
        avg_samples = total_samples / len(letter_counts) if letter_counts else 0
        
        for letter, count in letter_counts.items():
            if count < 5:
                analysis["recommendations"].append(f"Collect more samples for '{letter}' (has {count}, need 10+)")
            elif count < avg_samples * 0.5:
                analysis["recommendations"].append(f"'{letter}' is underrepresented ({count} vs avg {avg_samples:.1f})")
        
        # Check for confusing letter pairs
        confusing_pairs = [("G", "H"), ("F", "9"), ("K", "P"), ("M", "N")]
        for letter1, letter2 in confusing_pairs:
            count1 = letter_counts.get(letter1, 0)
            count2 = letter_counts.get(letter2, 0)
            if count1 > 0 and count2 > 0:
                if abs(count1 - count2) > 5:
                    analysis["recommendations"].append(
                        f"Balance '{letter1}' ({count1}) and '{letter2}' ({count2}) - similar signs need equal data"
                    )
        
        if not analysis["potential_issues"]:
            analysis["potential_issues"].append("No major data quality issues detected")
            
        if not analysis["recommendations"]:
            analysis["recommendations"].append("Data distribution looks good!")
        
        return analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# Export training data
@app.get("/export-dataset")
async def export_training_dataset():
    """Export collected data in training format"""
    try:
        dataset = []
        
        # Load all samples
        for letter_dir in DATA_DIR.iterdir():
            if letter_dir.is_dir():
                letter = letter_dir.name
                for sample_file in letter_dir.glob("*.json"):
                    with open(sample_file, 'r') as f:
                        sample = json.load(f)
                        
                        # Convert to training format
                        landmarks_flat = []
                        for landmark in sample["landmarks"]:
                            landmarks_flat.extend([landmark["x"], landmark["y"], landmark["z"]])
                        
                        dataset.append({
                            "letter": letter,
                            "landmarks": landmarks_flat,  # 63 features (21 landmarks * 3 coordinates)
                            "sample_id": sample["sample_id"]
                        })
        
        return {
            "dataset": dataset,
            "total_samples": len(dataset),
            "feature_count": 63,  # 21 landmarks * 3 coordinates
            "format": "landmarks_flat"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export dataset: {str(e)}")

# Trigger model training
@app.post("/train-model")
async def trigger_model_training():
    """Trigger training of the landmark-based model"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_SERVICE_URL}/train-landmarks",
                json={"data_directory": str(DATA_DIR)},
                timeout=300.0  # 5 minutes timeout for training
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Training failed: {response.text}"
                )
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Training timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)