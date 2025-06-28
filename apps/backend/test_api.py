import pytest
import httpx
import base64
import asyncio
from PIL import Image
import io

BASE_URL = "http://localhost:8000"

def create_test_image() -> str:
    """Create a test image and return as base64"""
    # Create a simple test image
    img = Image.new('RGB', (640, 480), color='white')
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    img_data = buffer.getvalue()
    
    return base64.b64encode(img_data).decode('utf-8')

@pytest.mark.asyncio
async def test_health_endpoint():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["healthy", "degraded"]

@pytest.mark.asyncio
async def test_predict_endpoint():
    test_image = create_test_image()
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/predict",
            json={"image": test_image}
        )
        assert response.status_code == 200
        data = response.json()
        assert "prediction" in data
        assert "confidence" in data
        assert 0.0 <= data["confidence"] <= 1.0

if __name__ == "__main__":
    # Run a simple test
    async def run_test():
        await test_health_endpoint()
        await test_predict_endpoint()
        print("All tests passed!")
    
    asyncio.run(run_test())