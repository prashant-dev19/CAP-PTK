"""Menu + pages management tests (admin direct save, editor pending approval, validation)."""
import os
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://cricket-pathankot.preview.emergentagent.com"

ADMIN_EMAIL = "admin@capathankot.in"
ADMIN_PASS = "CAPadmin#2026"
EDITOR_EMAIL = "editor@capathankot.in"
EDITOR_PASS = "Editor@123"

DEFAULT_ITEMS = [
    {"label": "The Association", "url": "/#about", "enabled": True},
    {"label": "Squads", "url": "/squads", "enabled": True},
    {"label": "The Pathway", "url": "/#pathway", "enabled": True},
    {"label": "Contact", "url": "/#contact", "enabled": True},
]
DEFAULT_PAGES = {"squads": True, "notices": True, "register": True}


def _clear_lockouts():
    try:
        from pymongo import MongoClient
        c = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
        c[os.environ.get("DB_NAME", "test_database")].login_attempts.delete_many({})
    except Exception:
        pass


def _login(email, pw):
    _clear_lockouts()
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pw}, timeout=15)
    assert r.status_code == 200, f"login {email} failed: {r.status_code} {r.text}"
    tok = r.json().get("access_token") or r.json().get("token")
    if tok:
        s.headers["Authorization"] = f"Bearer {tok}"
    return s


@pytest.fixture(scope="module")
def admin():
    return _login(ADMIN_EMAIL, ADMIN_PASS)


@pytest.fixture(scope="module")
def editor():
    return _login(EDITOR_EMAIL, EDITOR_PASS)


@pytest.fixture(autouse=True)
def _restore_default(admin):
    """Ensure menu is at defaults before AND after each test; reject any pending menu changes."""
    def restore():
        admin.put(f"{BASE_URL}/api/admin/menu", json={
            "items": DEFAULT_ITEMS, "show_register_cta": True, "pages": DEFAULT_PAGES,
        }, timeout=15)
        # Reject any pending menu changes
        r = admin.get(f"{BASE_URL}/api/admin/pending", timeout=15)
        if r.status_code == 200:
            for pc in r.json():
                if pc.get("resource") == "menu":
                    admin.post(f"{BASE_URL}/api/admin/pending/{pc['id']}/reject", timeout=15)
    restore()
    yield
    restore()


# --- Public GET /api/menu ---

def test_public_menu_returns_defaults():
    r = requests.get(f"{BASE_URL}/api/menu", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "items" in data and "show_register_cta" in data and "pages" in data
    labels = [i["label"] for i in data["items"]]
    assert "Squads" in labels and "Contact" in labels
    assert data["pages"] == DEFAULT_PAGES
    assert data["show_register_cta"] is True


# --- Admin direct update + persistence ---

def test_admin_update_menu_persists(admin):
    payload = {
        "items": DEFAULT_ITEMS + [{"label": "Insta", "url": "instagram.com/cappathankot", "enabled": True}],
        "show_register_cta": False,
        "pages": {"squads": False, "notices": True, "register": True},
    }
    r = admin.put(f"{BASE_URL}/api/admin/menu", json=payload, timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body.get("show_register_cta") is False
    assert body["pages"]["squads"] is False

    # Verify via public GET
    pub = requests.get(f"{BASE_URL}/api/menu", timeout=15).json()
    assert pub["show_register_cta"] is False
    assert pub["pages"]["squads"] is False
    # bare domain auto-prefixed to https://
    insta = [i for i in pub["items"] if i["label"] == "Insta"]
    assert insta and insta[0]["url"].startswith("https://instagram.com/")


def test_admin_max_25_items(admin):
    many = [{"label": f"L{i}", "url": f"/x{i}", "enabled": True} for i in range(30)]
    r = admin.put(f"{BASE_URL}/api/admin/menu", json={"items": many, "show_register_cta": True, "pages": DEFAULT_PAGES}, timeout=15)
    assert r.status_code == 200
    assert len(r.json()["items"]) == 25


def test_admin_pages_sanitized_to_three_keys(admin):
    r = admin.put(f"{BASE_URL}/api/admin/menu", json={
        "items": DEFAULT_ITEMS,
        "show_register_cta": True,
        "pages": {"squads": False, "notices": True, "register": False, "evil": True},
    }, timeout=15)
    assert r.status_code == 200
    assert set(r.json()["pages"].keys()) == {"squads", "notices", "register"}


# --- Validation ---

def test_empty_label_rejected(admin):
    r = admin.put(f"{BASE_URL}/api/admin/menu", json={
        "items": [{"label": "", "url": "/x", "enabled": True}],
        "show_register_cta": True, "pages": DEFAULT_PAGES,
    }, timeout=15)
    assert r.status_code == 422


# --- Editor path: pending approval ---

def test_editor_update_queues_pending(editor, admin):
    r = editor.put(f"{BASE_URL}/api/admin/menu", json={
        "items": DEFAULT_ITEMS + [{"label": "Editor Link", "url": "/ed", "enabled": True}],
        "show_register_cta": True,
        "pages": DEFAULT_PAGES,
    }, timeout=15)
    assert r.status_code == 200
    assert r.json().get("pending") is True

    # Public menu MUST NOT change yet
    pub = requests.get(f"{BASE_URL}/api/menu", timeout=15).json()
    assert "Editor Link" not in [i["label"] for i in pub["items"]]

    # Admin can see pending change
    pending = admin.get(f"{BASE_URL}/api/admin/pending", timeout=15)
    assert pending.status_code == 200
    menu_pcs = [p for p in pending.json() if p.get("resource") == "menu"]
    assert len(menu_pcs) >= 1

    # Approve it
    pc_id = menu_pcs[0]["id"]
    appr = admin.post(f"{BASE_URL}/api/admin/pending/{pc_id}/approve", timeout=15)
    assert appr.status_code == 200

    # Now public menu reflects it
    pub2 = requests.get(f"{BASE_URL}/api/menu", timeout=15).json()
    assert "Editor Link" in [i["label"] for i in pub2["items"]]


# --- Auth ---

def test_unauthenticated_cannot_update_menu():
    r = requests.put(f"{BASE_URL}/api/admin/menu", json={
        "items": DEFAULT_ITEMS, "show_register_cta": True, "pages": DEFAULT_PAGES,
    }, timeout=15)
    assert r.status_code in (401, 403)
