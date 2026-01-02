import pytest
from fastapi.testclient import TestClient

from src.app import app


def test_get_activities():
    with TestClient(app) as client:
        resp = client.get("/activities")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)
        assert "Chess Club" in data


def test_signup_and_unregister_flow():
    test_email = "test.user@example.com"
    activity = "Chess Club"

    with TestClient(app) as client:
        # Ensure test email is not present (idempotency)
        resp = client.get("/activities")
        participants = resp.json()[activity]["participants"]
        if test_email in participants:
            client.post(f"/activities/{activity}/unregister?email={test_email}")

        # Signup
        resp = client.post(f"/activities/{activity}/signup?email={test_email}")
        assert resp.status_code == 200
        assert test_email in client.get("/activities").json()[activity]["participants"]

        # Duplicate signup should return 400
        resp = client.post(f"/activities/{activity}/signup?email={test_email}")
        assert resp.status_code == 400

        # Unregister
        resp = client.post(f"/activities/{activity}/unregister?email={test_email}")
        assert resp.status_code == 200
        assert test_email not in client.get("/activities").json()[activity]["participants"]
