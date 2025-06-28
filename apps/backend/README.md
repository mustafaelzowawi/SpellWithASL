# SpellWithASL Backend

FastAPI backend service that processes webcam images and coordinates with the AI service for ASL gesture recognition.

## 🎯 Purpose
This backend serves as the API gateway, handling image processing, validation, and communication between the frontend and AI inference service.

## 🛠️ Tech Stack
- **Framework**: FastAPI with Python 3.9+
- **Image Processing**: Pillow, OpenCV
- **HTTP Client**: httpx for AI service communication
- **Validation**: Pydantic models
- **CORS**: FastAPI CORS middleware

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- pip and virtualenv

### Setup
```bash
# From repository root
cd apps/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
python main.py
# Or: uvicorn main:app --reload
```

## 📁 Project Structure
```
apps/backend/
├── main.py                 # FastAPI application entry point
├── models.py               # Pydantic data models
├── services/
│   ├── image_processor.py  # Image processing utilities
│   └── ai_client.py        # AI service communication
├── tests/
│   └── test_api.py         # API tests
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables
└── README.md              # This file
```

## 🔗 API Endpoints

### Core Endpoints
- **POST /predict** - Process image and return ASL prediction
- **GET /health** - Health check with AI service status
- **POST /predict/batch** - Batch processing for multiple images

### Request/Response Examples

#### Prediction Request
```json
POST /predict
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

#### Prediction Response
```json
{
  "prediction": "A",
  "confidence": 0.95,
  "landmarks": [[0.1, 0.2, 0.3], ...],
  "processing_time": 0.156
}
```

## 🔄 Integration Points

### Frontend Integration
- **Receives**: Base64 encoded webcam images
- **Returns**: ASL predictions with confidence scores
- **CORS**: Configured for frontend on port 3000

### AI Service Integration  
- **Sends**: Processed/normalized image arrays
- **Receives**: Model predictions and hand landmarks
- **Health Monitoring**: Checks AI service availability

## 📋 Development Guide

For detailed development instructions, see:
**[📖 Backend Development Guide](../../docs/teammate2-backend-guide.md)**

## 🧪 Testing

### Run Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run API tests
pytest tests/ -v

# Manual testing
python test_api.py
```

### API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🚀 Deployment

### Development
```bash
python main.py
# Access at http://localhost:8000
```

### Production
```bash
# Using Gunicorn
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker

# Using Docker
docker build -t spellwithasl-backend .
docker run -p 8000:8000 spellwithasl-backend
```

### Heroku Deployment
```bash
# Create Procfile
echo "web: uvicorn main:app --host=0.0.0.0 --port=${PORT:-8000}" > Procfile

# Deploy
git add .
git commit -m "feat: add backend"
git push heroku main
```

## 🔄 Team Collaboration

- **Port**: 8000
- **Branch**: `feature/backend-*`
- **Issues**: Use label `backend`
- **Reviews**: Required before merging

## 📚 Key Services

### ImageProcessor
- Validates and processes base64 images
- Resizes images to model input requirements
- Handles various image formats and edge cases

### AIServiceClient
- Manages communication with AI inference service
- Handles timeouts and error conditions
- Provides fallback responses when AI service unavailable

## 🔧 Configuration

### Environment Variables
```env
AI_SERVICE_URL=http://localhost:8001
CORS_ORIGINS=["http://localhost:3000"]
LOG_LEVEL=info
MAX_IMAGE_SIZE=2097152  # 2MB
```

### Logging
- Structured logging with timestamps
- Configurable log levels
- Request/response logging for debugging

## 🆘 Troubleshooting

### Common Issues
- **CORS errors**: Check frontend URL in CORS_ORIGINS
- **AI service connection**: Verify AI service running on port 8001
- **Image processing errors**: Check image size and format
- **Memory issues**: Monitor memory usage with large images

### Performance Optimization
- **Image compression**: Optimize image processing pipeline
- **Async operations**: Use async/await for I/O operations
- **Connection pooling**: Reuse HTTP connections to AI service
- **Caching**: Cache frequent predictions (optional)

### Support
- Check the [backend development guide](../../docs/teammate2-backend-guide.md)
- Create a GitHub issue with label `backend`
- Ask teammates in team communication channel

---

**Building the bridge between user experience and AI intelligence! 🔧** 