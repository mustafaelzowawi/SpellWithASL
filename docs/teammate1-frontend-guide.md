# Frontend Development Guide - Teammate 1

## 🎯 Your Mission
You're responsible for creating an intuitive, responsive web interface that captures webcam input, displays real-time ASL predictions, and provides an engaging user experience for learning ASL spelling.

## 🛠️ Tech Stack You'll Use
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Webcam**: react-webcam
- **State Management**: React hooks + Context API
- **Real-time Communication**: WebSocket/SSE for live predictions

## 📋 Step-by-Step Development Plan

### Phase 1: Project Setup (Day 1)

#### 1.1 Initialize Next.js App
```bash
cd apps/frontend
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

#### 1.2 Install Essential Dependencies
```bash
npm install react-webcam @types/react-webcam
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-slot @radix-ui/react-button
```

#### 1.3 Set up Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Phase 2: Core Components (Day 1-2)

#### 2.1 Create Webcam Component
File: `src/components/WebcamCapture.tsx`
```typescript
'use client'
import React, { useRef, useCallback, useState } from 'react'
import Webcam from 'react-webcam'

interface WebcamCaptureProps {
  onCapture: (imageSrc: string) => void
  isCapturing: boolean
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({ 
  onCapture, 
  isCapturing 
}) => {
  const webcamRef = useRef<Webcam>(null)
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 })

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      onCapture(imageSrc)
    }
  }, [webcamRef, onCapture])

  // Auto-capture every 500ms when active
  React.useEffect(() => {
    if (isCapturing) {
      const interval = setInterval(capture, 500)
      return () => clearInterval(interval)
    }
  }, [isCapturing, capture])

  return (
    <div className="relative">
      <Webcam
        ref={webcamRef}
        audio={false}
        width={dimensions.width}
        height={dimensions.height}
        screenshotFormat="image/jpeg"
        className="rounded-lg border-2 border-blue-500"
      />
      {isCapturing && (
        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded">
          Recording...
        </div>
      )}
    </div>
  )
}
```

#### 2.2 Create Prediction Display Component
File: `src/components/PredictionDisplay.tsx`
```typescript
'use client'
interface PredictionDisplayProps {
  prediction: string | null
  confidence: number
  targetLetter?: string
}

export const PredictionDisplay: React.FC<PredictionDisplayProps> = ({
  prediction,
  confidence,
  targetLetter
}) => {
  const isCorrect = prediction === targetLetter
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">AI Prediction</h3>
      
      <div className="text-center">
        <div className={`text-6xl font-bold mb-2 ${
          isCorrect ? 'text-green-500' : 'text-gray-700'
        }`}>
          {prediction || '?'}
        </div>
        
        <div className="text-sm text-gray-600 mb-2">
          Confidence: {(confidence * 100).toFixed(1)}%
        </div>
        
        {targetLetter && (
          <div className="text-sm">
            Target: <span className="font-semibold">{targetLetter}</span>
            {isCorrect && <span className="text-green-500 ml-2">✓ Correct!</span>}
          </div>
        )}
      </div>
    </div>
  )
}
```

#### 2.3 Create Word Practice Component
File: `src/components/WordPractice.tsx`
```typescript
'use client'
import { useState } from 'react'

interface WordPracticeProps {
  onLetterChange: (letter: string) => void
}

export const WordPractice: React.FC<WordPracticeProps> = ({ onLetterChange }) => {
  const [currentWord, setCurrentWord] = useState('HELLO')
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0)
  const [completedLetters, setCompletedLetters] = useState<boolean[]>([])

  const currentLetter = currentWord[currentLetterIndex]

  const markLetterComplete = () => {
    const newCompleted = [...completedLetters]
    newCompleted[currentLetterIndex] = true
    setCompletedLetters(newCompleted)
    
    if (currentLetterIndex < currentWord.length - 1) {
      setCurrentLetterIndex(currentLetterIndex + 1)
      onLetterChange(currentWord[currentLetterIndex + 1])
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Practice Word</h3>
      
      <div className="flex justify-center space-x-2 mb-4">
        {currentWord.split('').map((letter, index) => (
          <div
            key={index}
            className={`w-12 h-12 flex items-center justify-center text-xl font-bold border-2 rounded ${
              index === currentLetterIndex
                ? 'border-blue-500 bg-blue-50'
                : completedLetters[index]
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300'
            }`}
          >
            {letter}
          </div>
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">
          Sign the letter: <span className="font-bold text-xl">{currentLetter}</span>
        </p>
        <button
          onClick={markLetterComplete}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Mark as Complete
        </button>
      </div>
    </div>
  )
}
```

### Phase 3: Main Application Logic (Day 2-3)

#### 3.1 Create API Service
File: `src/lib/api.ts`
```typescript
export interface PredictionResponse {
  prediction: string
  confidence: number
  landmarks?: number[][]
}

export class APIService {
  private baseURL: string

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }

  async predictASL(imageData: string): Promise<PredictionResponse> {
    try {
      const response = await fetch(`${this.baseURL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          image: imageData.split(',')[1] // Remove data:image/jpeg;base64, prefix
        }),
      })

      if (!response.ok) {
        throw new Error('Prediction failed')
      }

      return await response.json()
    } catch (error) {
      console.error('API Error:', error)
      return { prediction: 'Error', confidence: 0 }
    }
  }
}

export const apiService = new APIService()
```

#### 3.2 Main Application Page
File: `src/app/page.tsx`
```typescript
'use client'
import { useState, useCallback } from 'react'
import { WebcamCapture } from '@/components/WebcamCapture'
import { PredictionDisplay } from '@/components/PredictionDisplay'
import { WordPractice } from '@/components/WordPractice'
import { apiService } from '@/lib/api'

export default function Home() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [prediction, setPrediction] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [targetLetter, setTargetLetter] = useState('H')

  const handleCapture = useCallback(async (imageSrc: string) => {
    if (isCapturing) {
      try {
        const result = await apiService.predictASL(imageSrc)
        setPrediction(result.prediction)
        setConfidence(result.confidence)
      } catch (error) {
        console.error('Prediction error:', error)
      }
    }
  }, [isCapturing])

  const toggleCapture = () => {
    setIsCapturing(!isCapturing)
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-600">
          🤟 SpellWithASL
        </h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <WebcamCapture 
              onCapture={handleCapture}
              isCapturing={isCapturing}
            />
            
            <div className="text-center">
              <button
                onClick={toggleCapture}
                className={`px-6 py-3 rounded-lg font-semibold ${
                  isCapturing
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isCapturing ? 'Stop Recognition' : 'Start Recognition'}
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            <PredictionDisplay
              prediction={prediction}
              confidence={confidence}
              targetLetter={targetLetter}
            />
            
            <WordPractice
              onLetterChange={setTargetLetter}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
```

## 🔄 Integration Points with Team

### With Backend (Teammate 2):
- **API Endpoints**: `/predict` for ASL recognition
- **Data Format**: Base64 encoded images
- **Response Format**: `{ prediction: string, confidence: number }`

### With AI Service (Teammate 3):
- **Image Processing**: Send webcam frames as base64
- **Real-time Requirements**: 500ms intervals for predictions
- **Landmark Data**: Optional hand landmark visualization

## 🧪 Testing Strategy

### Component Testing:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

### Manual Testing Checklist:
- [ ] Webcam initializes correctly
- [ ] Start/stop capture works
- [ ] API calls are made properly
- [ ] UI updates with predictions
- [ ] Word practice flow works
- [ ] Responsive on mobile/desktop

## 🚀 Deployment Preparation

### Vercel Deployment:
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Environment Variables for Production:
- `NEXT_PUBLIC_API_URL`: Production backend URL
- `NEXT_PUBLIC_WS_URL`: Production WebSocket URL

## 📱 Bonus Features (If Time Permits):
- Dark mode toggle
- Progress tracking and statistics
- Custom word input
- ASL alphabet reference chart

## 🤝 Collaboration Tips:
1. **Daily Commits**: Push your changes daily to your feature branch
2. **Component Documentation**: Add JSDoc comments to components
3. **Styling Consistency**: Use Tailwind classes consistently
4. **Mobile First**: Design for mobile, enhance for desktop
5. **Error Handling**: Always handle API failures gracefully

## 🆘 Troubleshooting:
- **Webcam not working**: Check browser permissions
- **API calls failing**: Verify backend is running on port 8000
- **Build errors**: Check TypeScript types and imports
- **Styling issues**: Verify Tailwind classes and responsive breakpoints

Ready to build an amazing frontend? Let's make ASL learning accessible and fun! 🚀 