# SpellWithASL AI Service

AI/ML inference service for real-time ASL gesture recognition using TensorFlow and MediaPipe.

## 🎯 Purpose
This service provides the core AI functionality, including ASL gesture recognition model training, MediaPipe hand tracking, and inference API for real-time predictions.

## 🛠️ Tech Stack
- **ML Framework**: TensorFlow/Keras
- **Hand Tracking**: MediaPipe
- **Image Processing**: OpenCV, NumPy  
- **API Framework**: FastAPI
- **Data Science**: Jupyter, Matplotlib, Scikit-learn

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- CUDA-compatible GPU (recommended for training)
- Minimum 8GB RAM

### Setup
```bash
# From repository root
cd apps/ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up project structure
mkdir -p {data,models,notebooks,scripts,src}

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start inference server
python inference_server.py
```

## 📁 Project Structure
```
apps/ai-service/
├── data/                    # Training datasets
│   ├── asl_alphabet_train/  # Training images
│   ├── asl_alphabet_test/   # Test images
│   └── processed/           # Preprocessed data
├── models/                  # Trained model files
│   ├── asl_classifier.h5    # Main model
│   └── checkpoints/         # Training checkpoints
├── notebooks/               # Jupyter notebooks
│   ├── 01_data_exploration.ipynb
│   ├── 02_model_training.ipynb
│   └── 03_evaluation.ipynb
├── scripts/                 # Training and utility scripts
│   ├── train_model.py
│   ├── evaluate_model.py
│   └── preprocess_data.py
├── src/                     # Source code modules
│   ├── model.py
│   ├── data_preprocessor.py
│   └── mediapipe_processor.py
├── inference_server.py      # FastAPI inference server
├── requirements.txt         # Dependencies
└── README.md               # This file
```

## 🔗 API Endpoints

### Inference Endpoints
- **POST /predict** - Single image ASL prediction
- **POST /predict/batch** - Batch prediction for multiple images
- **GET /health** - Model health and status check

### Request/Response Examples

#### Prediction Request
```json
POST /predict
{
  "image": [[[0.5, 0.5, 0.5], ...]], // Normalized 224x224x3 array
  "return_landmarks": true
}
```

#### Prediction Response
```json
{
  "prediction": "A",
  "confidence": 0.95,
  "landmarks": [[0.1, 0.2, 0.3], ...], // MediaPipe hand landmarks
  "processing_time": 0.078
}
```

## 🧠 Model Architecture

### CNN Model
- **Input**: 224x224x3 RGB images
- **Architecture**: Convolutional layers + Global Average Pooling
- **Output**: 26 classes (A-Z ASL letters)
- **Target Accuracy**: >95%

### MediaPipe Integration
- **Hand Detection**: Real-time hand landmark detection
- **Feature Extraction**: 21 hand landmarks with 3D coordinates
- **Preprocessing**: Landmark normalization and augmentation

## 📋 Development Workflow

### 1. Data Preparation
```bash
# Download ASL dataset
python scripts/download_dataset.py

# Preprocess data
python scripts/preprocess_data.py
```

### 2. Model Training
```bash
# Train the model
python scripts/train_model.py

# Monitor training
tensorboard --logdir logs/
```

### 3. Model Evaluation
```bash
# Evaluate performance
python scripts/evaluate_model.py

# Generate confusion matrix and metrics
```

### 4. Inference Server
```bash
# Start inference API
python inference_server.py
# Access at http://localhost:8001
```

## 📊 Performance Targets

### Model Performance
- **Accuracy**: >95% on test set
- **Inference Time**: <500ms per prediction
- **Model Size**: <100MB for deployment
- **Real-time FPS**: 30+ with MediaPipe

### API Performance
- **Response Time**: <200ms for inference
- **Throughput**: 10+ requests/second
- **Memory Usage**: <2GB during inference
- **GPU Utilization**: Efficient CUDA usage

## 📋 Development Guide

For detailed development instructions, see:
**[📖 AI/ML Development Guide](../../docs/teammate3-ai-guide.md)**

## 🧪 Testing

### Model Testing
```bash
# Run model evaluation
python scripts/evaluate_model.py

# Test inference pipeline
python -c "
from src.model import ASLClassifier
import numpy as np
model = ASLClassifier()
# Add your test code here
"
```

### API Testing
```bash
# Test inference server
python -m pytest tests/ -v

# Manual API testing
curl -X POST "http://localhost:8001/predict" \
  -H "Content-Type: application/json" \
  -d '{"image": [[[0.5, 0.5, 0.5]]]}'
```

## 🚀 Deployment

### Development
```bash
python inference_server.py
# Access at http://localhost:8001
```

### Production
```bash
# Using Docker
docker build -t spellwithasl-ai .
docker run -p 8001:8001 --gpus all spellwithasl-ai

# Using cloud deployment
# See deployment guide for specific platforms
```

### Model Optimization
```bash
# Convert to TensorFlow Lite
python scripts/convert_to_tflite.py

# ONNX conversion (optional)
python scripts/convert_to_onnx.py
```

## 🔄 Team Collaboration

- **Port**: 8001
- **Branch**: `feature/ai-*`
- **Issues**: Use label `ai-ml`
- **Reviews**: Required before merging

## 📚 Key Components

### ASLClassifier
- CNN model architecture for ASL recognition
- Training pipeline with data augmentation
- Model checkpointing and optimization

### MediaPipeProcessor
- Real-time hand tracking and landmark extraction
- Hand region cropping and normalization
- Landmark-based feature engineering

### DataPreprocessor
- Dataset loading and preprocessing
- Image augmentation and normalization
- Train/validation/test split management

## 🔧 Configuration

### Environment Variables
```env
MODEL_PATH=models/asl_classifier.h5
MEDIAPIPE_CONFIDENCE=0.5
INFERENCE_PORT=8001
LOG_LEVEL=info
CUDA_VISIBLE_DEVICES=0
```

### Training Configuration
- **Batch Size**: 32 (adjust based on GPU memory)
- **Learning Rate**: 0.001 with decay
- **Epochs**: 50 with early stopping
- **Data Augmentation**: Rotation, zoom, brightness

## 🆘 Troubleshooting

### Common Issues
- **CUDA errors**: Verify TensorFlow GPU installation
- **MediaPipe issues**: Check camera permissions and lighting
- **Memory errors**: Reduce batch size or model complexity
- **Poor accuracy**: Increase dataset size or model complexity

### Performance Optimization
- **GPU Utilization**: Monitor with nvidia-smi
- **Memory Management**: Use tf.data for efficient loading
- **Model Optimization**: Quantization and pruning
- **Inference Speed**: Batch predictions when possible

### Data Issues
- **Dataset Quality**: Ensure diverse, high-quality images
- **Class Imbalance**: Use weighted loss or data sampling
- **Overfitting**: Add regularization and dropout
- **Underfitting**: Increase model capacity or training time

### Support
- Check the [AI/ML development guide](../../docs/teammate3-ai-guide.md)
- Create a GitHub issue with label `ai-ml`
- Ask teammates in team communication channel

---

**Powering intelligent ASL recognition with cutting-edge AI! 🧠** 