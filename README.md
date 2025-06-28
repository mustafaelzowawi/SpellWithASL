# SpellWithASL

## 🤟 AI-Powered ASL Learning Platform

An interactive web application that teaches users how to spell words in American Sign Language (ASL) using real-time AI-driven gesture recognition through webcam feeds.

### 🎯 Project Objective
Develop an MVP web application capable of:
- Recognizing ASL alphabet letters (A–Z) in real-time via webcam
- Allowing users to practice spelling words letter-by-letter using ASL gestures
- Integrating AI components for gesture recognition using computer vision

### 🛠️ Tech Stack
- **Frontend**: React/Next.js with TypeScript
- **Backend**: FastAPI (Python)
- **AI/ML**: TensorFlow/PyTorch + MediaPipe for hand tracking
- **Deployment**: Vercel (Frontend) + Heroku (Backend)

### 👥 Team Collaboration Structure
- **Teammate 1**: Frontend Development (React/Next.js, UI/UX, WebCam integration)
- **Teammate 2**: Backend Development (FastAPI, API endpoints, model serving)
- **Teammate 3**: AI/ML Development (Model training, MediaPipe integration, data preprocessing)

### 📁 Project Structure (Monorepo)
```
SpellWithASL/
├── apps/
│   ├── frontend/             # React/Next.js application (Teammate 1)
│   ├── backend/              # FastAPI server (Teammate 2)
│   └── ai-service/           # ML model and inference API (Teammate 3)
├── packages/
│   ├── shared-types/         # TypeScript interfaces and types
│   ├── ui-components/        # Reusable UI components
│   └── utils/                # Shared utilities and helpers
├── docs/                     # Documentation and guides
├── tools/                    # Build tools and scripts
└── deployment/               # Docker and deployment configs
```

### 🚀 Quick Start Guide

#### 1. Initial Setup (All Team Members)
```bash
# Clone the repository
git clone <repository-url>
cd SpellWithASL

# Create your feature branch
git checkout -b feature/your-name-component
```

#### 2. Development Environment Setup

**Frontend (Teammate 1)**:
```bash
cd apps/frontend
npm install
npm run dev
```

**Backend (Teammate 2)**:
```bash
cd apps/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**AI Service (Teammate 3)**:
```bash
cd apps/ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python inference_server.py
```

### 🔄 Git Workflow
1. **Feature Branches**: Each teammate works on feature branches
2. **Pull Requests**: All changes go through PR reviews
3. **Main Branch**: Protected, requires PR approval
4. **Daily Syncs**: Regular team check-ins and code reviews

### 📚 Detailed Development Guide
See the `docs/` folder for comprehensive step-by-step instructions for each team member.

### 🌍 Alignment with UN SDGs
- **Goal 4**: Quality Education - Making ASL learning accessible
- **Goal 10**: Reduced Inequalities - Breaking communication barriers

### 🎯 Hackathon Presentation Points
- Real-time AI gesture recognition
- Collaborative team development
- Accessibility and inclusivity focus
- Modern web technologies integration

## 🚀 Quick Start

### Repository Setup:
```bash
# Clone the repository
git clone https://github.com/mustafaelzowawi/SpellWithASL.git
cd SpellWithASL

# Run the interactive setup script
./tools/quick-start.sh
```

### For Individual Teammates:
```bash
# After cloning, setup your component:
# Teammate 1: cd apps/frontend && npm install && npm run dev
# Teammate 2: cd apps/backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
# Teammate 3: cd apps/ai-service && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

### Complete Project Structure:
```
SpellWithASL/
├── README.md                          # Project overview
├── apps/
│   ├── frontend/                      # React/Next.js app (Port 3000)
│   │   ├── package.json              # Dependencies configured
│   │   └── .env.local                # Environment variables
│   ├── backend/                       # FastAPI server (Port 8000)
│   │   ├── requirements.txt          # Python dependencies
│   │   └── .env                      # Environment variables  
│   └── ai-service/                    # ML inference API (Port 8001)
│       ├── requirements.txt          # AI/ML dependencies
│       ├── .env                      # Environment variables
│       └── {data,models,notebooks,scripts,src}/  # Project structure
├── packages/
│   ├── shared-types/                  # TypeScript interfaces
│   │   └── index.ts                  # API contracts & types
│   ├── ui-components/                 # Reusable components
│   └── utils/                         # Shared utilities
├── docs/
│   ├── teammate1-frontend-guide.md    # Complete frontend guide
│   ├── teammate2-backend-guide.md     # Complete backend guide  
│   ├── teammate3-ai-guide.md          # Complete AI/ML guide
│   └── team-collaboration-guide.md    # Git workflow & collaboration
├── tools/
│   └── quick-start.sh                 # Automated setup script
└── deployment/                        # Docker & deployment configs
```

## 🔗 Repository Information

**GitHub Repository**: [https://github.com/mustafaelzowawi/SpellWithASL](https://github.com/mustafaelzowawi/SpellWithASL)

### 🤝 Team Collaboration on GitHub:
- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Pull Requests**: All code changes go through PRs with team review
- **Branches**: Each teammate works on feature branches (see team collaboration guide)
- **Discussions**: Use GitHub Discussions for team coordination

---
**🎯 Next Steps**: 
1. **Clone repo**: `git clone https://github.com/mustafaelzowawi/SpellWithASL.git`
2. **Run setup**: `./tools/quick-start.sh`
3. **Read your guide**: `docs/teammate[X]-[role]-guide.md`  
4. **Start developing**: Follow your role-specific guide
5. **Stay coordinated**: Use `docs/team-collaboration-guide.md`
