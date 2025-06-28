# SpellWithASL Frontend

React/Next.js frontend application for real-time ASL gesture recognition and learning.

## 🎯 Purpose
This frontend provides an intuitive user interface for learning ASL alphabet letters through real-time webcam-based gesture recognition.

## 🛠️ Tech Stack
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Webcam**: react-webcam
- **State Management**: React hooks + Context API

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
# From repository root
cd apps/frontend

# Install dependencies  
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your backend URL

# Start development server
npm run dev
```

## 📁 Project Structure
```
apps/frontend/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   │   ├── WebcamCapture.tsx
│   │   ├── PredictionDisplay.tsx
│   │   └── WordPractice.tsx
│   ├── lib/                 # Utilities and API client
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
├── package.json             # Dependencies
└── README.md               # This file
```

## 🔗 Integration Points

### API Endpoints
- **Backend URL**: `http://localhost:8000` (development)
- **Prediction Endpoint**: `POST /predict`
- **Health Check**: `GET /health`

### Data Flow
1. User enables webcam
2. App captures frames every 500ms
3. Frames sent to backend as base64 images
4. Backend processes and forwards to AI service
5. Predictions displayed in real-time UI

## 📋 Development Guide

For detailed development instructions, see:
**[📖 Frontend Development Guide](../../docs/teammate1-frontend-guide.md)**

## 🧪 Testing
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests (when implemented)
npm test
```

## 🚀 Deployment

### Development
```bash
npm run dev
# Access at http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

### Vercel Deployment
```bash
npm install -g vercel
vercel --prod
```

## 🔄 Team Collaboration

- **Port**: 3000
- **Branch**: `feature/frontend-*`
- **Issues**: Use label `frontend`
- **Reviews**: Required before merging

## 📚 Key Components

### WebcamCapture
- Handles webcam initialization and frame capture
- Auto-captures frames every 500ms when active
- Provides visual feedback during recording

### PredictionDisplay  
- Shows AI prediction results
- Displays confidence levels
- Provides visual feedback for correct/incorrect predictions

### WordPractice
- Manages word spelling practice sessions
- Tracks progress through each letter
- Provides completion feedback

## 🆘 Troubleshooting

### Common Issues
- **Webcam not working**: Check browser permissions
- **API calls failing**: Verify backend is running on port 8000
- **Build errors**: Check TypeScript types and imports
- **Styling issues**: Verify Tailwind classes

### Support
- Check the [frontend development guide](../../docs/teammate1-frontend-guide.md)
- Create a GitHub issue with label `frontend`
- Ask teammates in team communication channel

---

**Building accessible ASL education, one component at a time! 🎨** 