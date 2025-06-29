import httpx
import logging
import json
import numpy as np
from typing import Dict, Any
import asyncio

logger = logging.getLogger(__name__)

class AIServiceClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.client = httpx.AsyncClient(timeout=30.0)
        
    async def check_health(self) -> bool:
        """Check if AI service is responsive"""
        try:
            response = await self.client.get(f"{self.base_url}/health")
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"AI service health check failed: {e}")
            return False
    
    async def predict(self, image_array: np.ndarray) -> Dict[str, Any]:
        """
        Send image to AI service for prediction
        """
        try:
            # Convert numpy array to list for JSON serialization
            image_list = image_array.tolist()
            
            payload = {
                "image": image_list,
                "return_landmarks": True
            }
            
            response = await self.client.post(
                f"{self.base_url}/predict",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"AI prediction successful: {result['prediction']}")
                return result
            else:
                logger.error(f"AI service error: {response.status_code} - {response.text}")
                raise Exception(f"AI service returned {response.status_code}")
                
        except httpx.TimeoutException:
            logger.error("AI service timeout")
            raise Exception("AI service timeout")
        except Exception as e:
            logger.error(f"AI prediction failed: {str(e)}")
            # Return fallback response
            return {
                "prediction": "?",
                "confidence": 0.0,
                "landmarks": None,
                "processing_time": 0.0
            }
    
    async def predict_batch(self, images: list[np.ndarray]) -> list[Dict[str, Any]]:
        """Batch prediction for multiple images"""
        try:
            image_lists = [img.tolist() for img in images]
            
            payload = {
                "images": image_lists,
                "return_landmarks": True
            }
            
            response = await self.client.post(
                f"{self.base_url}/predict/batch",
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Batch prediction failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Batch prediction failed: {str(e)}")
            # Return fallback responses
            return [
                {"prediction": "?", "confidence": 0.0, "landmarks": None}
                for _ in images
            ]
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()