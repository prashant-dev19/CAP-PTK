"""Backend tests for announcements pagination."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://cricket-pathankot.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@capathankot.in"
ADMIN_PASS = "CAPadmin#2026"
EDITOR_EMAIL = "editor@capathankot.in"
EDITOR_PASS = "Editor@123"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def editor_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": EDITOR_EMAIL, "password": EDITOR_PASS})
    assert r.status_code == 200, f"editor login failed: {r.status_code} {r.text}"
    return s


def test_public_default_page():
    r = requests.get(f"{API}/announcements")
    assert r.status_code == 200
    data = r.json()
    for k in ("items", "total", "page", "pages", "limit"):
        assert k in data, f"missing key {k}"
    assert data["limit"] == 10
    assert data["page"] == 1
    assert len(data["items"]) <= 10
    assert len(data["items"]) == min(10, data["total"])
    # pinned first on page 1
    if data["items"]:
        # If there's a pinned notice at all, it must be first
        # Find any pinned notice via a bigger fetch
        big = requests.get(f"{API}/announcements?limit=50").json()
        pinned = [it for it in big["items"] if it.get("pinned")]
        if pinned:
            assert data["items"][0]["pinned"] is True
    # newest first among non-pinned
    non_pinned = [it for it in data["items"] if not it.get("pinned")]
    for a, b in zip(non_pinned, non_pinned[1:]):
        assert a["created_at"] >= b["created_at"]


def test_page_2():
    total = requests.get(f"{API}/announcements").json()["total"]
    if total <= 10:
        pytest.skip("not enough data for page 2")
    r = requests.get(f"{API}/announcements?page=2&limit=10")
    assert r.status_code == 200
    data = r.json()
    assert data["page"] == 2
    assert len(data["items"]) == min(10, total - 10)


def test_page_clamps():
    r = requests.get(f"{API}/announcements?page=99&limit=10")
    assert r.status_code == 200
    data = r.json()
    assert data["page"] == data["pages"]


def test_limit_5():
    r = requests.get(f"{API}/announcements?limit=5")
    assert r.status_code == 200
    data = r.json()
    assert data["limit"] == 5
    assert len(data["items"]) <= 5
    total = data["total"]
    assert data["pages"] == max(1, (total + 4) // 5)


def test_no_duplicates_between_pages():
    total = requests.get(f"{API}/announcements").json()["total"]
    if total <= 10:
        pytest.skip("not enough data for a second page")
    p1 = requests.get(f"{API}/announcements?page=1&limit=10").json()
    p2 = requests.get(f"{API}/announcements?page=2&limit=10").json()
    ids1 = {it["id"] for it in p1["items"]}
    ids2 = {it["id"] for it in p2["items"]}
    assert ids1.isdisjoint(ids2)


def test_no_mongo_id_field():
    data = requests.get(f"{API}/announcements").json()
    for it in data["items"]:
        assert "_id" not in it


def test_admin_announcements_paginated(admin_session):
    r = admin_session.get(f"{API}/admin/announcements?page=1&limit=10")
    assert r.status_code == 200
    data = r.json()
    assert data["limit"] == 10
    assert data["page"] == 1
    assert len(data["items"]) <= 10


def test_admin_announcements_requires_auth():
    r = requests.get(f"{API}/admin/announcements")
    assert r.status_code in (401, 403)


def test_editor_can_list_admin_announcements(editor_session):
    r = editor_session.get(f"{API}/admin/announcements?page=1&limit=10")
    assert r.status_code == 200
    data = r.json()
    assert "items" in data and "total" in data


def test_limit_capped_at_50():
    r = requests.get(f"{API}/announcements?limit=999")
    assert r.status_code == 200
    assert r.json()["limit"] == 50
