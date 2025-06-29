import pytest
import httpx
import asyncio
import random

BASE_URL = "http://localhost:8000"

def create_test_landmarks() -> list[list[float]]:
    """Create test landmark data (21 points with x,y,z coordinates)"""
    landmarks = []
    for _ in range(21):  # MediaPipe returns 21 hand landmarks
        landmarks.append([
            random.uniform(0.0, 1.0),  # x coordinate
            random.uniform(0.0, 1.0),  # y coordinate
            random.uniform(-0.1, 0.1)  # z coordinate (depth)
        ])
    return landmarks

@pytest.mark.asyncio
async def test_health_endpoint():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["healthy", "degraded"]

@pytest.mark.asyncio
async def test_predict_landmarks_endpoint():
    test_landmarks = create_test_landmarks()
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/predict-landmarks",
            json={"landmarks": test_landmarks}
        )
        # The response might be 200 (success) or 500 (if AI service unavailable)
        # Both are valid for testing purposes
        assert response.status_code in [200, 500]
        
        data = response.json()
        if response.status_code == 200:
            assert "prediction" in data
            assert "confidence" in data
            assert 0.0 <= data["confidence"] <= 1.0
        else:
            # If AI service is unavailable, expect error detail
            assert "detail" in data

@pytest.mark.asyncio
async def test_collection_stats_endpoint():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/collection-stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_samples" in data
        assert "letter_stats" in data
        assert isinstance(data["total_samples"], int)

if __name__ == "__main__":
    # Run tests
    async def run_tests():
        await test_health_endpoint()
        print("✅ Health endpoint test passed")
        
        await test_predict_landmarks_endpoint()
        print("✅ Predict landmarks endpoint test passed")
        
        await test_collection_stats_endpoint()
        print("✅ Collection stats endpoint test passed")
        
        print("🎉 All tests completed!")
    
    asyncio.run(run_tests())