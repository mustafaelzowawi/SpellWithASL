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

#### 1.1 Initialize AI Service Project
```bash
cd apps/ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
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

### Phase 3: MediaPipe Integration (Day 2)

#### 3.1 Hand Tracking Implementation
```python
# File: src/mediapipe_processor.py
import mediapipe as mp
import cv2
import numpy as np

class HandTracker:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.5
        )
    
    def process_frame(self, frame):
        # Extract hand landmarks and region
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        if results.multi_hand_landmarks:
            landmarks = results.multi_hand_landmarks[0]
            return self.extract_landmarks(landmarks)
        return None
```

### Phase 4: Inference API (Day 2-3)

#### 4.1 FastAPI Server
Create inference server on port 8001:

```python
# File: inference_server.py
from fastapi import FastAPI
import tensorflow as tf
import numpy as np

app = FastAPI(title="ASL Inference API")

# Load model on startup
model = None

@app.on_event("startup")
async def load_model():
    global model
    model = tf.keras.models.load_model("models/asl_model.h5")

@app.post("/predict")
async def predict(image_data: dict):
    # Process image and return prediction
    image = np.array(image_data["image"])
    prediction = model.predict(np.expand_dims(image, 0))
    
    return {
        "prediction": chr(65 + np.argmax(prediction)),  # Convert to letter
        "confidence": float(np.max(prediction)),
        "processing_time": 0.1
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