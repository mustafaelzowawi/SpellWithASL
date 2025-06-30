import numpy as np
import json
import os
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
import pickle
from sklearn.utils.class_weight import compute_class_weight

class ASLLandmarkModel:
    def __init__(self):
        self.model = None
        self.label_encoder = None
        self.scaler = None
        self.is_trained = False
        
    def load_dataset(self, data_directory):
        """Load landmark data from JSON files"""
        features = []
        labels = []
        
        data_path = Path(data_directory)
        print(f"Loading data from: {data_path}")
        
        for letter_dir in data_path.iterdir():
            if letter_dir.is_dir():
                letter = letter_dir.name
                print(f"Loading samples for letter: {letter}")
                
                for sample_file in letter_dir.glob("*.json"):
                    try:
                        with open(sample_file, 'r') as f:
                            sample = json.load(f)
                            
                        # Extract landmarks as flat array
                        landmarks = sample["landmarks"]
                        feature_vector = []
                        
                        for landmark in landmarks:
                            feature_vector.extend([
                                landmark["x"], 
                                landmark["y"], 
                                landmark["z"]
                            ])
                        
                        if len(feature_vector) == 63:  # 21 landmarks * 3 coords
                            features.append(feature_vector)
                            labels.append(letter)
                        else:
                            print(f"Invalid sample: {sample_file} (expected 63 features, got {len(feature_vector)})")
                            
                    except Exception as e:
                        print(f"Error loading {sample_file}: {e}")
        
        print(f"Loaded {len(features)} samples for {len(set(labels))} letters")
        return np.array(features), np.array(labels)
    
    def normalize_hand_pose(self, landmarks):
        """Normalize hand pose to be more robust"""
        landmarks = np.array(landmarks).reshape(21, 3)
        
        # Get wrist landmark (index 0)
        wrist = landmarks[0]
        
        # Translate so wrist is at origin
        landmarks_centered = landmarks - wrist
        
        # Scale by hand size (distance from wrist to middle finger tip)
        middle_tip = landmarks_centered[12]  # Middle finger tip
        hand_size = np.linalg.norm(middle_tip)
        
        if hand_size > 0:
            landmarks_normalized = landmarks_centered / hand_size
        else:
            landmarks_normalized = landmarks_centered
        
        # Flatten back to 63 features
        return landmarks_normalized.flatten()
    
    def augment_data(self, X, y):
        """MINIMAL data augmentation for ASL - respects sign semantics"""
        augmented_X = []
        augmented_y = []
        
        for i, (sample, label) in enumerate(zip(X, y)):
            # Always keep original sample
            augmented_X.append(sample)
            augmented_y.append(label)
            
            landmarks = sample.reshape(21, 3)
            
        print(f"Minimal augmentation: {len(X)} -> {len(augmented_X)} samples")
        return np.array(augmented_X), np.array(augmented_y)

    def preprocess_data(self, X, y):
        """Enhanced preprocessing with normalization"""
        # Normalize hand poses
        X_normalized = np.array([self.normalize_hand_pose(sample) for sample in X])
        
        # Apply data augmentation
        X_augmented, y_augmented = self.augment_data(X_normalized, y)
        
        print(f"Data augmented from {len(X)} to {len(X_augmented)} samples")
        
        # Encode labels
        if self.label_encoder is None:
            self.label_encoder = LabelEncoder()
            y_encoded = self.label_encoder.fit_transform(y_augmented)
        else:
            y_encoded = self.label_encoder.transform(y_augmented)
        
        # Scale features
        if self.scaler is None:
            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X_augmented)
        else:
            X_scaled = self.scaler.transform(X_augmented)
        
        return X_scaled, y_encoded
    
    def build_model(self, input_shape, num_classes):
        """Build neural network model - optimized for speed and accuracy"""
        model = Sequential([
            Dense(128, activation='relu', input_shape=(input_shape,)),
            BatchNormalization(),
            Dropout(0.3),
            
            Dense(64, activation='relu'),
            BatchNormalization(),
            Dropout(0.2),
            
            Dense(32, activation='relu'),
            Dropout(0.2),
            
            Dense(num_classes, activation='softmax')
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def train(self, data_directory, test_size=0.2, epochs=100):
        """Train the model"""
        print("🚀 Starting ASL Landmark Model Training...")
        
        # Load data
        X, y = self.load_dataset(data_directory)
        
        if len(X) == 0:
            raise ValueError("No training data found!")
        
        print(f"Dataset: {len(X)} samples, {len(np.unique(y))} classes")
        
        # Preprocess
        X_processed, y_processed = self.preprocess_data(X, y)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_processed, y_processed, 
            test_size=test_size, 
            random_state=42, 
            stratify=y_processed
        )
        
        print(f"Train: {len(X_train)}, Test: {len(X_test)}")
        
        # Calculate class weights to handle imbalance
        classes = np.unique(y_processed)
        class_weights = compute_class_weight('balanced', classes=classes, y=y_processed)
        class_weight_dict = {i: weight for i, weight in enumerate(class_weights)}
        print(f"Using class weights to balance training data")
        
        # Build model
        num_classes = len(np.unique(y_processed))
        self.model = self.build_model(X_processed.shape[1], num_classes)
        
        print(f"Model built with {X_processed.shape[1]} features, {num_classes} classes")
        
        # Callbacks
        callbacks = [
            EarlyStopping(patience=15, restore_best_weights=True),
            ModelCheckpoint('best_model.keras', save_best_only=True)
        ]
        
        # Train with class weights
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_test, y_test),
            epochs=epochs,
            batch_size=32,
            class_weight=class_weight_dict,
            callbacks=callbacks,
            verbose=1
        )
        
        # Evaluate
        test_predictions = self.model.predict(X_test)
        test_pred_classes = np.argmax(test_predictions, axis=1)
        accuracy = accuracy_score(y_test, test_pred_classes)
        
        print(f"\n✅ Training Complete!")
        print(f"Test Accuracy: {accuracy:.4f}")
        print(f"Classes: {self.label_encoder.classes_}")
        
        self.is_trained = True
        return {
            "accuracy": accuracy,
            "classes": self.label_encoder.classes_.tolist(),
            "samples": len(X),
            "features": X_processed.shape[1]
        }
    
    def predict(self, landmarks):
        """Predict ASL letter from landmarks - optimized for speed"""
        if not self.is_trained or self.model is None:
            return {"prediction": "?", "confidence": 0.0, "error": "Model not trained"}
        
        try:
            # Convert landmarks to feature vector
            if isinstance(landmarks[0], dict):
                # Format: [{"x": 0.1, "y": 0.2, "z": 0.3}, ...]
                feature_vector = []
                for landmark in landmarks:
                    feature_vector.extend([landmark["x"], landmark["y"], landmark["z"]])
            else:
                # Format: [[x, y, z], ...]
                feature_vector = []
                for landmark in landmarks:
                    feature_vector.extend(landmark)
            
            if len(feature_vector) != 63:
                return {"prediction": "?", "confidence": 0.0, "error": f"Expected 63 features, got {len(feature_vector)}"}
            
            # Apply same normalization as training (CRITICAL FOR ACCURACY)
            normalized_features = self.normalize_hand_pose(feature_vector)
            
            # Preprocess (optimized)
            X = np.array([normalized_features], dtype=np.float32)
            X_scaled = self.scaler.transform(X)
            
            # Predict (optimized: verbose=0 to reduce TensorFlow output)
            predictions = self.model.predict(X_scaled, verbose=0)
            predicted_class = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_class])
            
            # Get top 3 predictions for debugging confusing letters
            top_3_indices = np.argsort(predictions[0])[-3:][::-1]
            top_3_predictions = []
            for idx in top_3_indices:
                letter = self.label_encoder.inverse_transform([idx])[0]
                conf = float(predictions[0][idx])
                top_3_predictions.append({"letter": letter, "confidence": conf})
            
            # Apply confidence threshold
            if confidence < 0.5:
                return {
                    "prediction": "?",
                    "confidence": confidence,
                    "note": "Low confidence prediction",
                    "top_predictions": top_3_predictions
                }
            
            # Decode label
            predicted_letter = self.label_encoder.inverse_transform([predicted_class])[0]
            
            return {
                "prediction": predicted_letter,
                "confidence": confidence,
                "top_predictions": top_3_predictions,  # Added for debugging
                "debug_info": {
                    "features_normalized": True,
                    "hand_size": float(np.linalg.norm(np.array(feature_vector).reshape(21, 3)[12] - np.array(feature_vector).reshape(21, 3)[0]))
                }
            }
            
        except Exception as e:
            return {"prediction": "?", "confidence": 0.0, "error": str(e)}
    
    def save_model(self, filepath):
        """Save model and preprocessors"""
        if self.model is None:
            raise ValueError("No model to save")
        
        # Save model
        self.model.save(f"{filepath}_model.keras")
        
        # Save preprocessors
        with open(f"{filepath}_preprocessors.pkl", 'wb') as f:
            pickle.dump({
                'label_encoder': self.label_encoder,
                'scaler': self.scaler
            }, f)
        
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath):
        """Load model and preprocessors"""
        try:
            # Try new format first with compatibility handling
            if os.path.exists(f"{filepath}_model.keras"):
                # Handle TensorFlow version compatibility issues
                try:
                    self.model = tf.keras.models.load_model(f"{filepath}_model.keras")
                except Exception as keras_error:
                    print(f"Keras format failed: {keras_error}")
                    # Try loading with custom objects if needed
                    return False
            elif os.path.exists(f"{filepath}_model.h5"):
                try:
                    self.model = tf.keras.models.load_model(f"{filepath}_model.h5")
                except Exception as h5_error:
                    print(f"H5 format failed: {h5_error}")
                    return False
            else:
                raise FileNotFoundError("No model file found")
            
            # Load preprocessors
            with open(f"{filepath}_preprocessors.pkl", 'rb') as f:
                preprocessors = pickle.load(f)
                self.label_encoder = preprocessors['label_encoder']
                self.scaler = preprocessors['scaler']
            
            self.is_trained = True
            print(f"Model loaded from {filepath}")
            return True
            
        except Exception as e:
            print(f"Failed to load model: {e}")
            self.is_trained = False
            self.model = None
            return False

# Initialize global model instance
asl_model = ASLLandmarkModel()

# Try to load existing model on startup
model_path = "models/asl_landmark_model"
print(f"🔍 Looking for model files at: {model_path}")
print(f"📁 Current working directory: {os.getcwd()}")
print(f"📁 Directory contents: {os.listdir('.')}")

if os.path.exists("models"):
    print(f"📁 Models directory contents: {os.listdir('models')}")
else:
    print("❌ Models directory does not exist!")

if os.path.exists(f"{model_path}_model.keras") or os.path.exists(f"{model_path}_model.h5"):
    print("🔄 Attempting to load model...")
    if asl_model.load_model(model_path):
        print("✅ Pre-trained model loaded successfully")
    else:
        print("❌ Failed to load pre-trained model. Will need retraining.")
else:
    print("ℹ️ No pre-trained model found. Model will be trained on first request.") 