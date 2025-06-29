# SpellWithASL 🤟

**Learn ASL spelling with real-time AI feedback**

> An interactive learning platform that makes American Sign Language education accessible through AI-powered gesture recognition.

An interactive web application that teaches American Sign Language (ASL) spelling using AI-powered hand gesture recognition through your webcam.

## 🎥 Demo

[Live Demo](https://spell-with-asl.vercel.app) | [Video Demo](https://your-video-link-here)

*Try it yourself - no installation required! Just allow camera access and start signing.*

## ✨ Features

- **Real-time ASL Recognition**: Recognizes A-Z letters using MediaPipe hand landmarks
- **Interactive Learning**: Practice spelling any word letter-by-letter
- **Auto-Progression**: Automatically moves to next word after completion
- **Minimal Design**: Clean, focused interface for distraction-free learning
- **Data Collection**: Built-in tools for expanding the training dataset

## 🏗️ Architecture

```
Frontend (Next.js)     Backend (FastAPI)     AI Service (TensorFlow)
     :3000         →        :8000         →         :8001
                  landmarks              neural network
```

- **Frontend**: React/Next.js with MediaPipe for hand tracking
- **Backend**: FastAPI server handling requests and data collection
- **AI Service**: TensorFlow model for ASL letter classification

## 🚀 Quick Start

### 1. Start AI Service
```bash
cd apps/ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python inference_server.py  # Runs on :8001
```

### 2. Start Backend
```bash
cd apps/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload  # Runs on :8000
```

### 3. Start Frontend
```bash
cd apps/frontend
npm install
npm run dev  # Runs on :3000
```

Visit `http://localhost:3000` to start learning!

## 🧠 How It Works

1. **MediaPipe** extracts 21 hand landmarks from your webcam
2. **TensorFlow model** predicts ASL letter from landmark coordinates
3. **Real-time feedback** guides you through spelling words
4. **Auto-progression** keeps you learning with minimal interruption

## 🛠️ Tech Stack

- **Frontend**: Next.js, TypeScript, MediaPipe, Tailwind CSS
- **Backend**: FastAPI, Python, Uvicorn
- **AI/ML**: TensorFlow, NumPy, Scikit-learn
- **Data**: JSON-based training samples with hand landmarks

## 📁 Project Structure

```
SpellWithASL/
├── apps/
│   ├── frontend/          # Next.js web app
│   ├── backend/           # FastAPI server
│   └── ai-service/        # ML inference service
├── packages/
│   └── shared-types/      # TypeScript interfaces
└── tools/                 # Utility scripts
```

## 🎯 Development

The system uses landmarks-only approach for better performance, privacy, and real-time processing. All services communicate via REST APIs with standardized TypeScript interfaces.

---

*Created for accessible ASL education through AI technology*
