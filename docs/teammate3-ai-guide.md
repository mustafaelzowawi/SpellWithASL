# AI/ML Development Guide - Teammate 3

## 🎯 Your Mission
You're responsible for the AI/ML core of the project: building and training an ASL gesture recognition model, integrating MediaPipe for hand tracking, and creating an inference API that serves predictions to the backend. This is the brain of the application!

## 🛠️ Tech Stack You'll Use
- **ML Framework**: TensorFlow/Keras
- **Hand Tracking**: MediaPipe
- **Image Processing**: OpenCV, NumPy
- **API Framework**: FastAPI (for inference service)
- **Data**: ASL Alphabet dataset
- **Model Serving**: Custom inference server

## 📋 Step-by-Step Development Plan

### Phase 1: Environment Setup & Data Preparation (Day 1)

#### 1.1 Clone Repository & Setup
```bash
# Clone the repository
git clone https://github.com/mustafaelzowawi/SpellWithASL.git
cd SpellWithASL

# Run setup script
./tools/quick-start.sh
# OR manually setup AI service:
cd apps/ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 1.2 Create Requirements File
File: `requirements.txt`
```txt
tensorflow==2.13.0
mediapipe==0.10.7
opencv-python==4.8.1.78
numpy==1.24.3
pillow==10.0.1
fastapi==0.104.1
uvicorn[standard]==0.24.0
scikit-learn==1.3.2
matplotlib==3.7.2
seaborn==0.13.0
jupyter==1.0.0
python-dotenv==1.0.0
pydantic==2.5.0
```

#### 1.3 Download ASL Dataset
Use Kaggle to download the ASL alphabet dataset:
```bash
# Set up Kaggle API credentials first
pip install kaggle
kaggle datasets download -d grassknoted/asl-alphabet
unzip asl-alphabet.zip -d data/
```

#### 1.4 Project Structure
```bash
mkdir -p {data,models,notebooks,scripts,src}
```

### Phase 2: Model Development (Day 1-2)

#### 2.1 Build CNN Model
Create a CNN architecture optimized for ASL gesture recognition:

```python
# File: src/model.py
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

def build_asl_model(num_classes=26, input_shape=(224, 224, 3)):
    model = keras.Sequential([
        layers.Input(shape=input_shape),
        
        # CNN layers
        layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.3),
        
        layers.GlobalAveragePooling2D(),
        
        # Dense layers
        layers.Dense(512, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        
        layers.Dense(num_classes, activation='softmax')
    ])
    
    return model
```

#### 2.2 Train the Model
Target 95%+ accuracy with data augmentation and proper validation.

### Phase 3: MediaPipe Integration (Day 2) - YOUR CORE RESPONSIBILITY

MediaPipe hand tracking is YOUR responsibility as the AI/ML developer. This provides critical hand landmarks that can enhance model predictions.

#### 3.1 Complete MediaPipe Hand Tracking Implementation
```python
# File: src/mediapipe_processor.py
import mediapipe as mp
import cv2
import numpy as np
from typing import Optional, Tuple

class MediaPipeHandProcessor:
    def __init__(self, 
                 max_num_hands: int = 1,
                 min_detection_confidence: float = 0.5,
                 min_tracking_confidence: float = 0.5):
        
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=True,  # For single image processing
            max_num_hands=max_num_hands,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
        self.mp_draw = mp.solutions.drawing_utils
        
    def process_image(self, image: np.ndarray) -> Tuple[Optional[np.ndarray], bool]:
        """
        Process image and extract hand landmarks
        
        Returns:
            - landmarks: Hand landmarks as numpy array (63,) or None
            - hand_detected: Boolean indicating if hand was detected
        """
        # Convert BGR to RGB for MediaPipe
        if len(image.shape) == 3 and image.shape[2] == 3:
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        else:
            rgb_image = image
        
        # Process the image
        results = self.hands.process(rgb_image)
        
        landmarks = None
        hand_detected = False
        
        if results.multi_hand_landmarks:
            hand_detected = True
            hand_landmarks = results.multi_hand_landmarks[0]  # Get first hand
            
            # Extract landmark coordinates
            landmarks = np.array([[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark])
            # Keep as (21, 3) shape for consistency with shared types
            
            # Normalize landmarks relative to wrist
            landmarks = self.normalize_landmarks(landmarks)
        
        return landmarks, hand_detected
    
    def normalize_landmarks(self, landmarks: np.ndarray) -> np.ndarray:
        """Normalize landmarks relative to wrist position"""
        if landmarks is None:
            return landmarks
        
        # landmarks is already (21, 3) shape
        # Get wrist position (landmark 0)
        wrist_pos = landmarks[0]
        
        # Normalize relative to wrist
        normalized = landmarks - wrist_pos
        
        return normalized  # Keep as (21, 3) for consistency
    
    def extract_hand_region(self, image: np.ndarray, landmarks: np.ndarray) -> np.ndarray:
        """Extract hand region based on landmarks"""
        if landmarks is None:
            return image
        
        # landmarks is already (21, 3), extract only x, y coordinates
        landmarks_2d = landmarks[:, :2]  # Only x, y coordinates
        
        # Get image dimensions
        h, w = image.shape[:2]
        
        # Convert normalized coordinates to pixel coordinates
        landmarks_px = landmarks_2d * [w, h]
        
        # Find bounding box
        x_min, y_min = landmarks_px.min(axis=0).astype(int)
        x_max, y_max = landmarks_px.max(axis=0).astype(int)
        
        # Add padding
        padding = 50
        x_min = max(0, x_min - padding)
        y_min = max(0, y_min - padding)
        x_max = min(w, x_max + padding)
        y_max = min(h, y_max + padding)
        
        # Extract hand region
        hand_region = image[y_min:y_max, x_min:x_max]
        
        return hand_region
```

### Phase 4: Inference API (Day 2-3)

#### 4.1 FastAPI Server
Create inference server on port 8001:

```python
# File: inference_server.py
from fastapi import FastAPI
import tensorflow as tf
import numpy as np
import time

app = FastAPI(title="ASL Inference API")

# Load model and MediaPipe processor on startup
model = None
mp_processor = None

@app.on_event("startup")
async def load_model():
    global model, mp_processor
    # Load ASL classification model
    model = tf.keras.models.load_model("models/asl_model.h5")
    
    # Initialize MediaPipe hand processor (YOUR RESPONSIBILITY)
    from src.mediapipe_processor import MediaPipeHandProcessor
    mp_processor = MediaPipeHandProcessor()

@app.post("/predict")
async def predict(request: dict):
    # Extract image data
    image = np.array(request["image"])  # Normalized (224, 224, 3) array
    return_landmarks = request.get("return_landmarks", True)
    
    start_time = time.time()
    
    # 1. Extract hand landmarks with MediaPipe (YOUR RESPONSIBILITY)
    landmarks = None
    hand_detected = False
    
    if mp_processor and return_landmarks:
        # Convert normalized image back to uint8 for MediaPipe
        image_uint8 = (image * 255).astype(np.uint8)
        landmarks, hand_detected = mp_processor.process_image(image_uint8)
    
    # 2. Run ASL classification model
    prediction_probs = model.predict(np.expand_dims(image, 0))
    predicted_class = np.argmax(prediction_probs[0])
    confidence = float(prediction_probs[0][predicted_class])
    predicted_letter = chr(65 + predicted_class)  # Convert to A-Z
    
    processing_time = time.time() - start_time
    
    return {
        "prediction": predicted_letter,
        "confidence": confidence,
        "landmarks": landmarks.tolist() if landmarks is not None else None,
        "hand_detected": hand_detected,
        "processing_time": processing_time
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": model is not None}
```

## 🔄 Integration Points with Team

### With Backend (Teammate 2):
- **API Endpoint**: `POST /predict` on port 8001
- **Input Format**: Normalized image arrays (224, 224, 3)
- **Output**: `{"prediction": "A", "confidence": 0.95}`

### With Frontend (Teammate 1):
- **Real-time Processing**: MediaPipe integration
- **Performance**: <500ms response time
- **Error Handling**: Fallback for undetected hands

## 🧪 Testing Strategy

### Model Validation:
```bash
python scripts/evaluate_model.py
```

### API Testing:
```bash
python inference_server.py &
curl -X POST "http://localhost:8001/predict" -H "Content-Type: application/json" -d '{"image": [...]}'
```

## 📊 Performance Targets:
- **Accuracy**: >95% on test set
- **Inference Time**: <500ms per prediction
- **Real-time FPS**: 30+ with MediaPipe
- **Model Size**: <100MB

## 🤝 Collaboration Tips:
1. **Model Checkpoints**: Save multiple versions during training
2. **API Documentation**: Clear endpoint specifications
3. **Performance Logs**: Monitor inference times
4. **Error Handling**: Graceful failure modes
5. **Testing**: Comprehensive validation scripts

## 🆘 Troubleshooting:
- **GPU Setup**: Verify TensorFlow CUDA installation
- **MediaPipe**: Check camera permissions
- **Memory**: Optimize batch sizes
- **Accuracy**: Try data augmentation

Ready to build the AI brain? Let's create intelligent ASL recognition! 🚀 