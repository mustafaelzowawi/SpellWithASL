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

### Phase 3: Pure ASL Classification Focus (Day 2) - SIMPLIFIED ARCHITECTURE

**🎯 New Architecture: MediaPipe moved to frontend for performance**
**Your Focus: Pure ASL model serving and optimization**

#### 3.1 Optimized ASL Model Inference (Your New Focus)
```python
# File: src/asl_classifier.py
import tensorflow as tf
import numpy as np
import cv2
from typing import Tuple
import logging

class OptimizedASLClassifier:
    """
    Pure ASL classification - no MediaPipe needed!
    Frontend handles hand tracking, you focus on accurate predictions
    """
    
    def __init__(self, model_path: str = "models/asl_classifier.h5"):
        self.model = tf.keras.models.load_model(model_path)
        self.class_names = [chr(i) for i in range(65, 91)]  # A-Z
        
        # Optimize model for inference
        self.model = self._optimize_model(self.model)
        logger.info(f"ASL Classifier loaded: {len(self.class_names)} classes")
    
    def _optimize_model(self, model):
        """Optimize model for faster inference"""
        # Convert to TensorFlow Lite for better performance
        try:
            converter = tf.lite.TFLiteConverter.from_keras_model(model)
            converter.optimizations = [tf.lite.Optimize.DEFAULT]
            tflite_model = converter.convert()
            
            # Save optimized model
            with open('models/asl_classifier_optimized.tflite', 'wb') as f:
                f.write(tflite_model)
            
            logger.info("Model optimized with TensorFlow Lite")
            return model  # Return original for now, can switch to TFLite later
        except Exception as e:
            logger.warning(f"TFLite optimization failed: {e}")
            return model
    
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess hand region image for model inference
        Input: Hand region from frontend MediaPipe (already cropped!)
        """
        # Resize to model input size
        image_resized = cv2.resize(image, (224, 224))
        
        # Normalize pixel values
        image_normalized = image_resized.astype(np.float32) / 255.0
        
        # Add batch dimension
        image_batch = np.expand_dims(image_normalized, axis=0)
        
        return image_batch
    
    def predict(self, hand_image: np.ndarray) -> Tuple[str, float]:
        """
        Predict ASL letter from hand region image
        Returns: (predicted_letter, confidence)
        """
        # Preprocess image
        processed_image = self.preprocess_image(hand_image)
        
        # Run inference
        predictions = self.model.predict(processed_image, verbose=0)
        
        # Get prediction results
        predicted_class_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_idx])
        predicted_letter = self.class_names[predicted_class_idx]
        
        return predicted_letter, confidence
    
    def predict_batch(self, hand_images: list) -> list:
        """
        Batch prediction for multiple images
        More efficient for multiple predictions
        """
        if not hand_images:
            return []
        
        # Preprocess all images
        processed_images = np.vstack([
            self.preprocess_image(img) for img in hand_images
        ])
        
        # Batch inference
        predictions = self.model.predict(processed_images, verbose=0)
        
        results = []
        for i, pred in enumerate(predictions):
            class_idx = np.argmax(pred)
            confidence = float(pred[class_idx])
            letter = self.class_names[class_idx]
            results.append((letter, confidence))
        
        return results
```

### Phase 4: Inference API (Day 2-3)

#### 4.1 FastAPI Server
Create inference server on port 8001:

```python
# File: inference_server.py
from fastapi import FastAPI
import numpy as np
import cv2
import base64
import time
import logging

app = FastAPI(title="ASL Inference API")

# Load optimized ASL classifier on startup
asl_classifier = None

@app.on_event("startup")
async def load_classifier():
    global asl_classifier
    from src.asl_classifier import OptimizedASLClassifier
    asl_classifier = OptimizedASLClassifier("models/asl_classifier.h5")

@app.post("/predict")
async def predict(request: dict):
    """
    Simplified prediction endpoint - receives pre-cropped hand images from frontend
    Frontend handles MediaPipe, you focus on accurate ASL classification
    """
    try:
        start_time = time.time()
        
        # Decode base64 image from frontend (already cropped by MediaPipe)
        image_data = base64.b64decode(request["image"])
        nparr = np.frombuffer(image_data, np.uint8)
        hand_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if hand_image is None:
            raise ValueError("Invalid image data")
        
        # Pure ASL classification - no MediaPipe needed!
        predicted_letter, confidence = asl_classifier.predict(hand_image)
        
        processing_time = time.time() - start_time
        
        logger.info(f"Prediction: {predicted_letter}, Confidence: {confidence:.3f}, Time: {processing_time:.3f}s")
        
        return {
            "prediction": predicted_letter,
            "confidence": confidence,
            "processing_time": processing_time,
            "hand_detected": True  # Frontend already confirmed hand detection
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