import base64
import io
import cv2
import numpy as np
from PIL import Image
import logging

logger = logging.getLogger(__name__)

class ImageProcessor:
    def __init__(self):
        self.target_size = (224, 224)  # Standard input size for ML models
        self.max_size = 2 * 1024 * 1024  # 2MB max
    
    async def process_base64_image(self, base64_data: str) -> np.ndarray:
        """
        Process base64 image data and return normalized numpy array
        """
        try:
            # Decode base64
            image_data = base64.b64decode(base64_data)
            
            # Check file size
            if len(image_data) > self.max_size:
                raise ValueError(f"Image too large. Max size: {self.max_size} bytes")
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize image
            image = image.resize(self.target_size, Image.Resampling.LANCZOS)
            
            # Convert to numpy array and normalize
            image_array = np.array(image)
            image_array = image_array.astype(np.float32) / 255.0
            
            logger.info(f"Processed image: {image_array.shape}")
            return image_array
            
        except Exception as e:
            logger.error(f"Image processing failed: {str(e)}")
            raise ValueError(f"Failed to process image: {str(e)}")
    
    def extract_hand_region(self, image: np.ndarray) -> np.ndarray:
        """
        Extract hand region from image using basic computer vision
        This is a fallback if MediaPipe isn't available in backend
        """
        # Convert to grayscale for contour detection
        gray = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
        
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Threshold to create binary image
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            # Find largest contour (assuming it's the hand)
            largest_contour = max(contours, key=cv2.contourArea)
            
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(largest_contour)
            
            # Extract hand region with some padding
            padding = 20
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(image.shape[1] - x, w + 2 * padding)
            h = min(image.shape[0] - y, h + 2 * padding)
            
            hand_region = image[y:y+h, x:x+w]
            
            # Resize to target size
            hand_region = cv2.resize(hand_region, self.target_size)
            
            return hand_region
        
        # If no contours found, return resized original
        return cv2.resize(image, self.target_size)