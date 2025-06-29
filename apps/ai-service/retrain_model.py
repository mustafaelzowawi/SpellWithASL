#!/usr/bin/env python3
"""
ASL Model Retraining Script
===========================
Retrains the ASL landmark model with improved data and fixed preprocessing.

Usage:
    python3 retrain_model.py

This script will:
1. Load training data from ../backend/training_data/
2. Apply proper hand pose normalization 
3. Use class balancing to handle data imbalance
4. Train with early stopping to prevent overfitting
5. Save the trained model to models/ directory
"""

import os
from landmark_model import ASLLandmarkModel

def count_samples_per_letter(data_directory):
    """Count samples for each letter to show data balance"""
    letters = {}
    
    for letter_dir in os.listdir(data_directory):
        letter_path = os.path.join(data_directory, letter_dir)
        if os.path.isdir(letter_path) and len(letter_dir) == 1:
            sample_count = len([f for f in os.listdir(letter_path) if f.endswith('.json')])
            letters[letter_dir] = sample_count
    
    return letters

def main():
    print("🚀 ASL Model Retraining Script")
    print("=" * 50)
    
    # Data directory
    data_directory = "../backend/training_data"
    
    if not os.path.exists(data_directory):
        print(f"❌ Training data directory not found: {data_directory}")
        return
    
    # Show current data balance
    letter_counts = count_samples_per_letter(data_directory)
    for letter, count in sorted(letter_counts.items()):
        print(f"  {letter}: {count} samples")
    
    total_samples = sum(letter_counts.values())
    avg_per_letter = total_samples / len(letter_counts)
    
    print(f"\n📊 Dataset Summary:")
    print(f"  Total samples: {total_samples}")
    print(f"  Letters with data: {len(letter_counts)}/26")
    print(f"  Average per letter: {avg_per_letter:.1f}")
    
    print(f"\n🎯 Starting training with improved preprocessing...")
    print(f"   - Hand pose normalization")
    print(f"   - Data augmentation (5x samples)")
    print(f"   - Class balancing")
    print(f"   - Early stopping")
    
    # Initialize and train model
    model = ASLLandmarkModel()
    
    try:
        # Train the model
        results = model.train(data_directory, epochs=100)
        
        # Save the model
        model_path = "models/asl_landmark_model"
        model.save_model(model_path)
        
        print(f"\n✅ Training Complete!")
        print(f"   Final accuracy: {results['accuracy']:.4f}")
        print(f"   Total samples used: {results['samples']}")
        print(f"   Features per sample: {results['features']}")
        print(f"   Classes trained: {', '.join(results['classes'])}")
        
        print(f"\n💾 Model saved to: {model_path}")
        print(f"   Model will be automatically loaded on next server start")
        
        # Test the model with a simple prediction
        print(f"\n🧪 Testing model...")
        test_landmarks = [[0.5, 0.5, 0.0] for _ in range(21)]
        test_result = model.predict(test_landmarks)
        print(f"   Test prediction: {test_result}")
        
        print(f"\n🎉 Model training successful!")
        print(f"   You can now use the practice page for real-time predictions")
        
    except Exception as e:
        print(f"\n❌ Training failed: {str(e)}")
        return

if __name__ == "__main__":
    main() 