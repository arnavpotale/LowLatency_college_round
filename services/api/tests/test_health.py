def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "timestamp" in data
    assert data["database"] == "connected"
    assert data["mock_verification_enabled"] is True


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Second Opinion API" in data["name"]
    assert data["docs_url"] == "/docs"
