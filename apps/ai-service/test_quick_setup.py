#!/usr/bin/env python3
"""
Test script for SpellWithASL Quick Setup
Verifies that all components are working correctly
"""

import requests
import numpy as np
import json
import time
from pathlib import Path

def test_api_health():
    """Test if the API is running and healthy"""
    try:
        response = requests.get("http://localhost:8001/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ API Health Check Passed")
            print(f"   Status: {data['status']}")
            print(f"   Model Loaded: {data['model_loaded']}")
            return True
        else:
            print(f"❌ API Health Check Failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ API Health Check Failed: Cannot connect to API")
        print("   Make sure to run: python inference_server_quick.py")
        return False
    except Exception as e:
        print(f"❌ API Health Check Failed: {str(e)}")
        return False

def test_prediction():
    """Test the prediction endpoint with dummy data"""
    try:
        # Create dummy image data (224x224x3 normalized)
        dummy_image = np.random.random((224, 224, 3)).tolist()
        
        payload = {
            "image": dummy_image,
            "return_landmarks": True
        }
        
        print("🔄 Testing prediction endpoint...")
        start_time = time.time()
        
        response = requests.post(
            "http://localhost:8001/predict",
            json=payload,
            timeout=10
        )
        
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Prediction Test Passed")
            print(f"   Prediction: {data['prediction']}")
            print(f"   Confidence: {data['confidence']:.3f}")
            print(f"   Processing Time: {data['processing_time']:.3f}s")
            print(f"   Total Request Time: {end_time - start_time:.3f}s")
            print(f"   Landmarks: {'✅ Included' if data['landmarks'] else '❌ None'}")
            return True
        else:
            print(f"❌ Prediction Test Failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Prediction Test Failed: {str(e)}")
        return False

def test_batch_prediction():
    """Test batch prediction endpoint"""
    try:
        # Create multiple dummy images
        dummy_images = [
            np.random.random((224, 224, 3)).tolist() for _ in range(3)
        ]
        
        print("🔄 Testing batch prediction endpoint...")
        start_time = time.time()
        
        response = requests.post(
            "http://localhost:8001/predict/batch",
            json=dummy_images,
            timeout=15
        )
        
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Batch Prediction Test Passed")
            print(f"   Batch Size: {len(data)}")
            print(f"   Total Time: {end_time - start_time:.3f}s")
            print(f"   Avg Time per Image: {(end_time - start_time) / len(data):.3f}s")
            
            for i, result in enumerate(data):
                print(f"   Image {i+1}: {result['prediction']} ({result['confidence']:.3f})")
            
            return True
        else:
            print(f"❌ Batch Prediction Test Failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Batch Prediction Test Failed: {str(e)}")
        return False

def test_file_structure():
    """Test if required files exist"""
    print("🔄 Testing file structure...")
    
    required_files = [
        "models/asl_classifier_quick.h5",
        "data/label_mapping.json",
        "inference_server_quick.py"
    ]
    
    all_exist = True
    for file_path in required_files:
        if Path(file_path).exists():
            print(f"   ✅ {file_path}")
        else:
            print(f"   ❌ {file_path} - Missing!")
            all_exist = False
    
    return all_exist

def test_model_loading():
    """Test if model can be loaded manually"""
    try:
        import tensorflow as tf
        
        model_path = "models/asl_classifier_quick.h5"
        if Path(model_path).exists():
            print("🔄 Testing model loading...")
            model = tf.keras.models.load_model(model_path)
            print("✅ Model loads successfully")
            print(f"   Input Shape: {model.input_shape}")
            print(f"   Output Shape: {model.output_shape}")
            return True
        else:
            print("❌ Model file doesn't exist")
            return False
    except Exception as e:
        print(f"❌ Model loading failed: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🧪 SpellWithASL Quick Setup Test Suite")
    print("=" * 50)
    
    tests = [
        ("File Structure", test_file_structure),
        ("Model Loading", test_model_loading),
        ("API Health", test_api_health),
        ("Single Prediction", test_prediction),
        ("Batch Prediction", test_batch_prediction),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Running {test_name} Test...")
        if test_func():
            passed += 1
        else:
            print(f"   ⚠️  {test_name} test failed")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your AI service is ready!")
        print("\n🎯 Next Steps:")
        print("   1. Your API is working at http://localhost:8001")
        print("   2. Check API docs at http://localhost:8001/docs")
        print("   3. Integrate with your teammates' backend")
        print("   4. Replace dummy model with real ASL data")
    else:
        print("⚠️  Some tests failed. Check the issues above.")
        print("\n🔧 Troubleshooting:")
        print("   1. Make sure inference_server_quick.py is running")
        print("   2. Run: python quick_pretrained_setup.py")
        print("   3. Check your Python environment and dependencies")
    
    return passed == total

if __name__ == "__main__":
    main() 