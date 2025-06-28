#!/bin/bash

# SpellWithASL Quick Start Script
# This script helps set up the development environment for all teammates

set -e

echo "🤟 Setting up SpellWithASL Development Environment..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

if ! command_exists python3; then
    echo "❌ Python 3 is not installed. Please install Python 3.9+ from https://python.org/"
    exit 1
fi

if ! command_exists git; then
    echo "❌ Git is not installed. Please install Git from https://git-scm.com/"
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Get user's role
echo ""
echo "👥 Which teammate are you?"
echo "1) Teammate 1 - Frontend Developer"
echo "2) Teammate 2 - Backend Developer" 
echo "3) Teammate 3 - AI/ML Developer"
echo "4) All (Setup everything)"
read -p "Enter your choice (1-4): " role_choice

setup_frontend() {
    echo "🎨 Setting up Frontend (Next.js)..."
    cd apps/frontend
    
    if [ ! -f "package.json" ]; then
        echo "❌ package.json not found. Please ensure you're in the correct directory."
        return 1
    fi
    
    npm install
    
    # Create environment file
    if [ ! -f ".env.local" ]; then
        cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
EOF
        echo "✅ Created .env.local"
    fi
    
    echo "✅ Frontend setup complete!"
    echo "📝 To start development: cd apps/frontend && npm run dev"
    cd ../..
}

setup_backend() {
    echo "🔧 Setting up Backend (FastAPI)..."
    cd apps/backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        echo "✅ Created virtual environment"
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
        echo "✅ Installed Python dependencies"
    fi
    
    # Create environment file
    if [ ! -f ".env" ]; then
        cat > .env << EOF
AI_SERVICE_URL=http://localhost:8001
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
LOG_LEVEL=info
MAX_IMAGE_SIZE=2097152
EOF
        echo "✅ Created .env"
    fi
    
    echo "✅ Backend setup complete!"
    echo "📝 To start development: cd apps/backend && source venv/bin/activate && python main.py"
    cd ../..
}

setup_ai_service() {
    echo "🧠 Setting up AI Service (TensorFlow + MediaPipe)..."
    cd apps/ai-service
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        echo "✅ Created virtual environment"
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
        echo "✅ Installed AI/ML dependencies"
    fi
    
    # Create directories
    mkdir -p {data,models,notebooks,scripts,src}
    echo "✅ Created project directories"
    
    # Create environment file
    if [ ! -f ".env" ]; then
        cat > .env << EOF
MODEL_PATH=models/asl_classifier.h5
MEDIAPIPE_CONFIDENCE=0.5
INFERENCE_PORT=8001
LOG_LEVEL=info
EOF
        echo "✅ Created .env"
    fi
    
    echo "✅ AI Service setup complete!"
    echo "📝 To start development: cd apps/ai-service && source venv/bin/activate"
    echo "📝 Note: You'll need to download the ASL dataset and train your model first"
    cd ../..
}

# Setup based on user choice
case $role_choice in
    1)
        setup_frontend
        ;;
    2)
        setup_backend
        ;;
    3)
        setup_ai_service
        ;;
    4)
        setup_frontend
        setup_backend
        setup_ai_service
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup complete! Here are your next steps:"
echo ""
echo "📚 Read your role-specific guide:"
case $role_choice in
    1)
        echo "   👉 docs/teammate1-frontend-guide.md"
        ;;
    2)
        echo "   👉 docs/teammate2-backend-guide.md"
        ;;
    3)
        echo "   👉 docs/teammate3-ai-guide.md"
        ;;
    4)
        echo "   👉 docs/teammate1-frontend-guide.md"
        echo "   👉 docs/teammate2-backend-guide.md"
        echo "   👉 docs/teammate3-ai-guide.md"
        ;;
esac
echo ""
echo "🤝 Team Collaboration:"
echo "   👉 docs/team-collaboration-guide.md"
echo ""
echo "🚀 Quick Development Commands:"
echo "   Frontend:   cd apps/frontend && npm run dev"
echo "   Backend:    cd apps/backend && source venv/bin/activate && python main.py"
echo "   AI Service: cd apps/ai-service && source venv/bin/activate && python inference_server.py"
echo ""
echo "🔗 Development URLs:"
echo "   Frontend:   http://localhost:3000"
echo "   Backend:    http://localhost:8000"
echo "   AI Service: http://localhost:8001"
echo ""
echo "Happy coding! 🚀" 