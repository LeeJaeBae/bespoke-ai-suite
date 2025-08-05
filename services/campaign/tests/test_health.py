import pytest
from fastapi.testclient import TestClient

from src.main import create_app


@pytest.fixture
def client():
    """Test client fixture"""
    app = create_app()
    return TestClient(app)


def test_health_endpoint(client):
    """Test health check endpoint"""
    response = client.get("/health")
    
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "campaign-service"
    assert data["version"] == "1.0.0"


def test_api_docs_accessible(client):
    """Test that API documentation is accessible"""
    response = client.get("/api/v1/docs")
    assert response.status_code == 200
    assert "swagger-ui" in response.text.lower()


def test_openapi_spec_accessible(client):
    """Test that OpenAPI specification is accessible"""
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    
    data = response.json()
    assert "openapi" in data
    assert data["info"]["title"] == "Bespoke Campaign Service"