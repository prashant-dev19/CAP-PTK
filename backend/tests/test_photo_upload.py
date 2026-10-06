"""Backend tests for photo upload feature (/api/admin/upload, /api/files/{path})."""
import os
import struct
import zlib

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

ADMIN_EMAIL = "admin@capathankot.in"
ADMIN_PASSWORD = "CAPadmin#2026"
EDITOR_EMAIL = "editor@capathankot.in"
EDITOR_PASSWORD = "Editor@123"


def make_png(width=4, height=4):
    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    raw = b""
    for _ in range(height):
        raw += b"\x00" + b"\xff\x00\x00" * width
    idat = chunk(b"IDAT", zlib.compress(raw))
    iend = chunk(b"IEND", b"")
    return sig + ihdr + idat + iend


def _login(email, password):
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"login {email}: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def admin_sess():
    return _login(ADMIN_EMAIL, ADMIN_PASSWORD)


@pytest.fixture(scope="module")
def editor_sess():
    try:
        return _login(EDITOR_EMAIL, EDITOR_PASSWORD)
    except AssertionError:
        return None


class TestUpload:
    def test_upload_requires_auth(self):
        r = requests.post(
            f"{BASE_URL}/api/admin/upload",
            files={"file": ("x.png", make_png(), "image/png")},
        )
        assert r.status_code == 401, f"expected 401, got {r.status_code}: {r.text}"

    def test_upload_rejects_text(self, admin_sess):
        r = admin_sess.post(
            f"{BASE_URL}/api/admin/upload",
            files={"file": ("note.txt", b"hello", "text/plain")},
        )
        assert r.status_code == 400
        assert "JPG" in r.json().get("detail", "")

    def test_upload_rejects_oversize(self, admin_sess):
        """The input cap is 12 MB; anything bigger is rejected outright.
        (Photos under the cap are accepted and auto-compressed on storage.)"""
        big = b"\x89PNG\r\n\x1a\n" + b"\x00" * (13 * 1024 * 1024)
        r = admin_sess.post(
            f"{BASE_URL}/api/admin/upload",
            files={"file": ("big.png", big, "image/png")},
        )
        assert r.status_code == 400
        detail = r.json().get("detail", "").lower()
        assert "12" in detail or "large" in detail

    def test_upload_png_and_fetch(self, admin_sess):
        png = make_png()
        r = admin_sess.post(
            f"{BASE_URL}/api/admin/upload",
            files={"file": ("test.png", png, "image/png")},
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["url"].startswith("/api/files/capathankot/uploads/")
        assert body["url"].endswith(".png")
        fetch = requests.get(f"{BASE_URL}{body['url']}")
        assert fetch.status_code == 200
        assert fetch.headers.get("Content-Type", "").startswith("image/")
        # NOTE: upstream CDN (Cloudflare) overrides Cache-Control at the edge to no-store.
        # Backend sets 'public, max-age=86400' — accept either so test is portable.
        cc = fetch.headers.get("Cache-Control", "")
        assert "max-age" in cc or "no-store" in cc
        assert len(fetch.content) == len(png)

    def test_upload_editor_allowed(self, editor_sess):
        if not editor_sess:
            pytest.skip("no editor session")
        r = editor_sess.post(
            f"{BASE_URL}/api/admin/upload",
            files={"file": ("e.png", make_png(), "image/png")},
        )
        assert r.status_code == 200, f"editor upload failed: {r.status_code} {r.text}"

    def test_files_404_for_unknown(self):
        r = requests.get(f"{BASE_URL}/api/files/capathankot/uploads/does-not-exist.png")
        assert r.status_code == 404


class TestAdminRegression:
    def test_registrations_list(self, admin_sess):
        r = admin_sess.get(f"{BASE_URL}/api/admin/registrations")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_messages_list(self, admin_sess):
        r = admin_sess.get(f"{BASE_URL}/api/admin/messages")
        assert r.status_code == 200

    def test_announcements_public(self):
        r = requests.get(f"{BASE_URL}/api/announcements?page=1&page_size=5")
        assert r.status_code == 200
        body = r.json()
        assert "items" in body and "total" in body

    def test_squads_public(self):
        r = requests.get(f"{BASE_URL}/api/squads")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_popup_public(self):
        r = requests.get(f"{BASE_URL}/api/popup")
        assert r.status_code == 200
