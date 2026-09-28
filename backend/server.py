from dotenv import load_dotenv

load_dotenv()

import os
import re
import uuid
import asyncio
import ipaddress
import logging
import bcrypt
import httpx
import jwt
import pyotp
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Cricket Association Pathankot API")
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("cap-api")


# ---------------- Models ----------------

class RegistrationCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    full_name: str = Field(min_length=2, max_length=120)
    date_of_birth: str = Field(min_length=4, max_length=10)
    gender: str = Field(min_length=1, max_length=20)
    age_group: str = Field(min_length=1, max_length=20)
    playing_role: str = Field(min_length=1, max_length=30)
    batting_style: Optional[str] = ""
    bowling_style: Optional[str] = ""
    phone: str = Field(min_length=6, max_length=20)
    email: str = Field(min_length=5, max_length=160)
    residence: str = Field(min_length=2, max_length=200)
    club_or_institute: Optional[str] = ""
    playing_experience: Optional[str] = ""
    website: str = Field(default="", max_length=200)  # honeypot — humans leave it empty


class Registration(RegistrationCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "registered"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ContactCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=160)
    phone: Optional[str] = ""
    subject: str = Field(min_length=2, max_length=160)
    message: str = Field(min_length=5, max_length=4000)
    website: str = Field(default="", max_length=200)  # honeypot — humans leave it empty


class ContactMessage(ContactCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    email: str
    password: str


# ---------------- Auth helpers ----------------

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user: dict) -> str:
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "type": "access",
        "ver": user.get("token_version", 0),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user: dict) -> str:
    payload = {
        "sub": user["id"],
        "type": "refresh",
        "ver": user.get("token_version", 0),
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if payload.get("ver", 0) != user.get("token_version", 0):
        raise HTTPException(status_code=401, detail="Session revoked — please sign in again")
    return serialize_user(user)


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role", "editor") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    return user


# ---------------- Security helpers ----------------

def serialize_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "role": user.get("role", "editor"),
        "totp_enabled": bool(user.get("totp_enabled")),
    }


def client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _parse_iso(ts: str):
    try:
        return datetime.fromisoformat(ts)
    except Exception:
        return None


async def log_login_event(email: str, ip: str, success: bool, reason: str):
    await db.login_events.insert_one({
        "id": str(uuid.uuid4()),
        "email": email,
        "ip": ip,
        "success": success,
        "reason": reason,
        "created_at": now_iso(),
    })
    # keep only the last 30 days of activity
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    await db.login_events.delete_many({"created_at": {"$lt": cutoff}})


# Wrong passwords per (IP + email): count reaches tier → account locked that long
EMAIL_LOCK_TIERS = [(5, 15), (10, 30), (15, 60)]
# Wrong passwords per IP across ANY email: protects against spraying many accounts
IP_LOCK_TIERS = [(20, 30), (30, 60)]


async def check_login_lockout(ip: str, email: str):
    now = datetime.now(timezone.utc)
    for identifier in (f"email:{ip}:{email}", f"ip:{ip}"):
        doc = await db.login_attempts.find_one({"identifier": identifier})
        locked_until = _parse_iso((doc or {}).get("locked_until", ""))
        if locked_until and now < locked_until:
            mins = max(1, int((locked_until - now).total_seconds() // 60) + 1)
            raise HTTPException(
                status_code=429,
                detail=f"Too many failed attempts. Locked — try again in about {mins} minutes.",
            )


async def record_failed_login(ip: str, email: str):
    now = datetime.now(timezone.utc)
    for identifier, tiers in ((f"email:{ip}:{email}", EMAIL_LOCK_TIERS), (f"ip:{ip}", IP_LOCK_TIERS)):
        doc = await db.login_attempts.find_one({"identifier": identifier})
        count = (doc or {}).get("count", 0) + 1
        update: dict = {"$set": {"count": count, "updated_at": now.isoformat()}}
        minutes = 0
        for threshold, lock_minutes in tiers:
            if count >= threshold:
                minutes = lock_minutes
        if minutes:
            update["$set"]["locked_until"] = (now + timedelta(minutes=minutes)).isoformat()
        await db.login_attempts.update_one({"identifier": identifier}, update, upsert=True)


async def clear_failed_logins(ip: str, email: str):
    await db.login_attempts.delete_one({"identifier": f"email:{ip}:{email}"})
    await db.login_attempts.update_one(
        {"identifier": f"ip:{ip}", "count": {"$gt": 0}}, {"$inc": {"count": -1}}
    )


# Public forms: max submissions per hour per IP
FORM_LIMITS = {"registrations": 5, "contact": 5}


async def check_form_rate(request: Request, kind: str):
    ip = client_ip(request)
    identifier = f"form:{kind}:{ip}"
    now = datetime.now(timezone.utc)
    doc = await db.login_attempts.find_one({"identifier": identifier})
    updated = _parse_iso((doc or {}).get("updated_at", ""))
    fresh = bool(updated) and (now - updated).total_seconds() < 3600
    if fresh and (doc or {}).get("count", 0) >= FORM_LIMITS[kind]:
        raise HTTPException(
            status_code=429,
            detail="Too many submissions from this connection. Please try again later.",
        )
    if fresh:
        await db.login_attempts.update_one(
            {"identifier": identifier}, {"$inc": {"count": 1}, "$set": {"updated_at": now.isoformat()}}
        )
    else:
        await db.login_attempts.update_one(
            {"identifier": identifier}, {"$set": {"count": 1, "updated_at": now.isoformat()}}, upsert=True
        )


# ---------------- Email alerts (Emergent-managed Resend integration) ----------------

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ["EMERGENT_EMAIL_KEY"]
EMAIL_FROM_NAME = os.environ["EMAIL_FROM_NAME"]
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")
ALERT_RECIPIENTS = [e.strip() for e in os.environ.get("ALERT_EMAILS", "").split(",") if e.strip()]

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")  # G2 ask-back phrasing
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)   # host-looking text

def _host_ok(host: str) -> bool:
    """Reject empty, punycode, IP-literal (v4 AND v6), and shortener hosts."""
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)

def _same_site(shown: str, real: str) -> bool:
    """Share a registrable domain by label-boundary suffix."""
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)

class _EmailScan(HTMLParser):
    """Real parsing, not regex: collects each anchor's decoded visible text."""
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []
    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []
    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)
    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []

def _assert_safe_email(subject: str, html: str) -> None:
    """Best-effort structural check for G2 + G3 (defense in depth, NOT G1)."""
    scan = _EmailScan(); scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to, subject, html, reply_to=None):
    _assert_safe_email(subject, html)          # G2-G3 gate — never skip
    payload = {
        "to": to if isinstance(to, list) else [to],
        "subject": subject,
        "html": html,
        "from_name": EMAIL_FROM_NAME,
    }
    if reply_to or EMAIL_REPLY_TO:
        payload["contact_email"] = reply_to or EMAIL_REPLY_TO
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        email_id = resp.json().get("id")
        logger.info(f"Email alert sent to {len(payload['to'])} recipient(s): {subject[:60]} (id={email_id})")
        return email_id
    except httpx.HTTPStatusError as e:
        logger.error(f"Email send failed: {e.response.status_code} {e.response.text}")
        raise HTTPException(status_code=502, detail="Failed to send email")
    except Exception as e:
        logger.error(f"Email send error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send email")


def _email_row(label: str, value) -> str:
    shown = escape(str(value).strip()) if value and str(value).strip() else "—"
    return (
        f'<tr>'
        f'<td style="padding:7px 18px 7px 0;font-size:13px;color:#6b6b60;white-space:nowrap;vertical-align:top">{escape(label)}</td>'
        f'<td style="padding:7px 0;font-size:13px;color:#1c2419;font-weight:600;word-break:break-word">{shown}</td>'
        f'</tr>'
    )


def _email_shell(title: str, rows_html: str, note: str) -> str:
    return (
        '<table role="presentation" width="100%" style="background:#f2efe6;padding:28px 12px" bgcolor="#f2efe6">'
        '<tr><td align="center">'
        '<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">'
        f'<tr><td style="background:#0A1F16;padding:20px 26px" bgcolor="#0A1F16">'
        f'<p style="margin:0;color:#CFA858;font-size:11px;letter-spacing:2px;text-transform:uppercase">{escape(EMAIL_FROM_NAME)}</p>'
        f'<p style="margin:7px 0 0;color:#F5F2EA;font-size:19px;font-weight:bold">{escape(title)}</p>'
        '</td></tr>'
        f'<tr><td style="padding:22px 26px"><table role="presentation" width="100%">{rows_html}</table>'
        f'<p style="margin:16px 0 0;font-size:12px;color:#8a8a80">{escape(note)}</p></td></tr>'
        '<tr><td style="padding:14px 26px;background:#f8f6ef" bgcolor="#f8f6ef">'
        f'<p style="margin:0;font-size:11px;color:#9a9a90">Sent automatically by the {escape(EMAIL_FROM_NAME)} website when a form is submitted.</p>'
        '</td></tr>'
        '</table></td></tr></table>'
    )


async def send_registration_alert(reg: dict):
    if not ALERT_RECIPIENTS:
        return
    rows = "".join([
        _email_row("Full name", reg.get("full_name")),
        _email_row("Date of birth", reg.get("date_of_birth")),
        _email_row("Gender", reg.get("gender")),
        _email_row("Age group", reg.get("age_group")),
        _email_row("Playing role", reg.get("playing_role")),
        _email_row("Batting style", reg.get("batting_style")),
        _email_row("Bowling style", reg.get("bowling_style")),
        _email_row("Phone", reg.get("phone")),
        _email_row("Email", reg.get("email")),
        _email_row("Residence", reg.get("residence")),
        _email_row("Club / institute", reg.get("club_or_institute")),
        _email_row("Experience", reg.get("playing_experience")),
    ])
    html = _email_shell("New player registration", rows, "Open the admin panel to view and manage registrations.")
    await send_email(
        to=ALERT_RECIPIENTS,
        subject=f"New player registration — {reg.get('full_name', '')} ({reg.get('age_group', '')})",
        html=html,
        reply_to=EMAIL_REPLY_TO,
    )


async def send_contact_alert(msg: dict):
    if not ALERT_RECIPIENTS:
        return
    rows = "".join([
        _email_row("Name", msg.get("name")),
        _email_row("Email", msg.get("email")),
        _email_row("Phone", msg.get("phone")),
        _email_row("Subject", msg.get("subject")),
        _email_row("Message", msg.get("message")),
    ])
    html = _email_shell("New contact message", rows, "Open the admin panel to view and reply from the Messages tab.")
    await send_email(
        to=ALERT_RECIPIENTS,
        subject=f"New contact message — {msg.get('name', '')}",
        html=html,
        reply_to=EMAIL_REPLY_TO,
    )


def queue_email_alert(alert_coro):
    """Fire-and-forget: a mail outage must never break or delay a form submission."""

    async def _run():
        try:
            await alert_coro
        except Exception as e:
            logger.error(f"Email alert failed: {e}")

    asyncio.create_task(_run())


# ---------------- Public endpoints ----------------

@api_router.get("/")
async def root():
    return {"app": "Cricket Association Pathankot API", "status": "ok"}


@api_router.post("/registrations", response_model=Registration, status_code=201)
async def create_registration(payload: RegistrationCreate, request: Request):
    await check_form_rate(request, "registrations")
    data = payload.model_dump()
    if data.pop("website", "").strip():
        logger.info(f"Honeypot triggered on registration form ({client_ip(request)})")
        return Registration(**payload.model_dump())
    reg = Registration(**data)
    doc = reg.model_dump()
    doc.pop("website", None)
    doc["created_at"] = doc["created_at"].isoformat()
    await db.registrations.insert_one(doc)
    logger.info(f"New player registration: {reg.full_name} ({reg.age_group})")
    queue_email_alert(send_registration_alert(doc))
    return reg


@api_router.post("/contact", response_model=ContactMessage, status_code=201)
async def create_contact(payload: ContactCreate, request: Request):
    await check_form_rate(request, "contact")
    data = payload.model_dump()
    if data.pop("website", "").strip():
        logger.info(f"Honeypot triggered on contact form ({client_ip(request)})")
        return ContactMessage(**payload.model_dump())
    msg = ContactMessage(**data)
    doc = msg.model_dump()
    doc.pop("website", None)
    doc["created_at"] = doc["created_at"].isoformat()
    await db.contact_messages.insert_one(doc)
    logger.info(f"New contact message from: {msg.name}")
    queue_email_alert(send_contact_alert(doc))
    return msg


# ---------------- Announcements ----------------

class AnnouncementCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str = Field(min_length=3, max_length=160)
    body: str = Field(min_length=3, max_length=4000)
    pinned: bool = False
    notice_no: int = 0
    link_url: str = Field(default="", max_length=600)


class Announcement(AnnouncementCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AnnouncementsPage(BaseModel):
    items: List[Announcement]
    total: int
    page: int
    pages: int
    limit: int


async def fetch_announcements_page(page: int, limit: int) -> AnnouncementsPage:
    limit = max(1, min(limit, 50))
    total = await db.announcements.count_documents({})
    pages = max(1, (total + limit - 1) // limit)
    current = max(1, min(page, pages))
    docs = (
        await db.announcements.find()
        .sort([("pinned", -1), ("created_at", -1)])
        .skip((current - 1) * limit)
        .to_list(limit)
    )
    return AnnouncementsPage(
        items=[Announcement(**d) for d in docs],
        total=total,
        page=current,
        pages=pages,
        limit=limit,
    )


@api_router.get("/announcements", response_model=AnnouncementsPage)
async def list_announcements(page: int = 1, limit: int = 10):
    return await fetch_announcements_page(page, limit)


@api_router.get("/admin/announcements", response_model=AnnouncementsPage)
async def list_announcements_admin(
    user: dict = Depends(get_current_user), page: int = 1, limit: int = 10
):
    return await fetch_announcements_page(page, limit)


@api_router.post("/admin/announcements")
async def create_announcement(payload: AnnouncementCreate, user: dict = Depends(get_current_user)):
    dump = payload.model_dump()
    link = (dump.get("link_url") or "").strip()
    if link and not link.startswith(("http://", "https://")):
        link = f"https://{link}"
    dump["link_url"] = link
    if user.get("role") != "admin":
        await create_pending_change(
            "announcement", "create", dump, user, f'New notice — "{payload.title}"'
        )
        return {"pending": True}
    last = await db.announcements.find_one(sort=[("notice_no", -1)])
    notice_no = ((last or {}).get("notice_no", 0)) + 1
    ann = Announcement(**{**dump, "notice_no": notice_no})
    doc = ann.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.announcements.insert_one(doc)
    logger.info(f"New announcement posted: {ann.title}")
    return ann


@api_router.post("/admin/announcements/{announcement_id}/pin", response_model=Announcement)
async def toggle_pin_announcement(announcement_id: str, user: dict = Depends(get_current_user)):
    doc = await db.announcements.find_one({"id": announcement_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Announcement not found")
    new_pinned = not doc.get("pinned", False)
    if user.get("role") != "admin":
        await create_pending_change(
            "announcement",
            "pin",
            {"announcement_id": announcement_id, "pinned": new_pinned},
            user,
            f"{'Pin' if new_pinned else 'Unpin'} notice #{doc.get('notice_no', 0)}",
        )
        return {"pending": True}
    if new_pinned:
        await db.announcements.update_many({"pinned": True}, {"$set": {"pinned": False}})
    await db.announcements.update_one({"id": announcement_id}, {"$set": {"pinned": new_pinned}})
    doc["pinned"] = new_pinned
    return Announcement(**doc)


@api_router.get("/admin/registrations/export")
async def export_registrations_csv(admin: dict = Depends(get_current_user)):
    import csv
    import io

    docs = await db.registrations.find().sort("created_at", -1).to_list(5000)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        ["Full Name", "Date of Birth", "Gender", "Age Group", "Playing Role", "Batting Style",
         "Bowling Style", "Phone", "Email", "Residence", "Club / Institute", "Experience", "Registered On"]
    )
    for d in docs:
        writer.writerow([
            d.get("full_name", ""), d.get("date_of_birth", ""), d.get("gender", ""),
            d.get("age_group", ""), d.get("playing_role", ""), d.get("batting_style", "") or "",
            d.get("bowling_style", "") or "", d.get("phone", ""), d.get("email", ""),
            d.get("residence", ""), d.get("club_or_institute", "") or "",
            d.get("playing_experience", "") or "", d.get("created_at", ""),
        ])
    buffer.seek(0)
    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="cap-registrations.csv"'},
    )


# ---------------- Squads ----------------

class SquadPlayer(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(min_length=2, max_length=120)
    role: Optional[str] = ""
    batting_style: Optional[str] = ""
    bowling_style: Optional[str] = ""
    jersey_number: Optional[int] = None


class SquadUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    group_photo: Optional[str] = None
    players: List[SquadPlayer] = Field(default_factory=list)


class SquadOut(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    age_group: str
    label: str
    description: str = ""
    wing: str = "Men"
    group_photo: str = ""
    players: List[SquadPlayer] = Field(default_factory=list)
    order: int = 0


@api_router.get("/squads", response_model=List[SquadOut])
async def list_squads():
    docs = await db.squads.find().sort("order", 1).to_list(20)
    return [SquadOut(**d) for d in docs]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_pending_change(resource: str, action: str, payload: dict, user: dict, summary: str):
    await db.pending_changes.insert_one({
        "id": str(uuid.uuid4()),
        "resource": resource,
        "action": action,
        "payload": payload,
        "summary": summary,
        "proposed_by": user.get("email", ""),
        "proposed_by_role": user.get("role", "editor"),
        "created_at": now_iso(),
        "status": "pending",
    })
    logger.info(f"Pending change queued ({resource}.{action}) by {user.get('email')}")


async def apply_pending_change(change: dict):
    resource = change["resource"]
    action = change["action"]
    payload = change.get("payload") or {}

    if resource == "content":
        doc = {**payload, "slot": "content", "updated_at": now_iso()}
        await db.site_settings.update_one({"slot": "content"}, {"$set": doc}, upsert=True)
    elif resource == "popup":
        doc = {**payload, "slot": "popup", "updated_at": now_iso()}
        await db.site_settings.update_one({"slot": "popup"}, {"$set": doc}, upsert=True)
    elif resource == "squad" and action == "update":
        squad = await db.squads.find_one({"id": payload.get("squad_id")})
        if squad:
            fields = {"players": payload.get("players", []), "updated_at": now_iso()}
            if payload.get("group_photo") is not None:
                fields["group_photo"] = payload["group_photo"]
            await db.squads.update_one({"id": payload["squad_id"]}, {"$set": fields})
    elif resource == "announcement":
        if action == "create":
            last = await db.announcements.find_one(sort=[("notice_no", -1)])
            notice_no = ((last or {}).get("notice_no", 0)) + 1
            ann = {
                **payload,
                "id": str(uuid.uuid4()),
                "notice_no": notice_no,
                "created_at": now_iso(),
            }
            ann.pop("pending", None)
            await db.announcements.insert_one(ann)
        elif action == "delete":
            await db.announcements.delete_one({"id": payload.get("announcement_id")})
        elif action == "pin":
            if payload.get("pinned"):
                await db.announcements.update_many({"pinned": True}, {"$set": {"pinned": False}})
            await db.announcements.update_one(
                {"id": payload.get("announcement_id")}, {"$set": {"pinned": bool(payload.get("pinned"))}}
            )


@api_router.put("/admin/squads/{squad_id}", response_model=SquadOut)
async def update_squad(squad_id: str, payload: SquadUpdate, user: dict = Depends(get_current_user)):
    doc = await db.squads.find_one({"id": squad_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Squad not found")
    update_fields = {
        "players": [p.model_dump() for p in payload.players],
        "updated_at": now_iso(),
    }
    if payload.group_photo is not None:
        update_fields["group_photo"] = payload.group_photo
    if user.get("role") != "admin":
        await create_pending_change(
            "squad",
            "update",
            {"squad_id": squad_id, "group_photo": update_fields.get("group_photo"), "players": update_fields["players"]},
            user,
            f"Update {doc.get('age_group', '')} squad ({len(update_fields['players'])} players)",
        )
        return {"pending": True}
    await db.squads.update_one({"id": squad_id}, {"$set": update_fields})
    doc.update(update_fields)
    return SquadOut(**doc)


# ---------------- Home pop-up ----------------

class PopupUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    enabled: bool = False
    title: str = Field(default="", max_length=120)
    message: str = Field(default="", max_length=2000)
    image_url: str = Field(default="", max_length=600)


@api_router.get("/popup")
async def get_popup():
    doc = await db.site_settings.find_one({"slot": "popup"})
    if not doc:
        return {"enabled": False, "title": "", "message": "", "image_url": ""}
    return {k: doc.get(k, "") for k in ("enabled", "title", "message", "image_url")}


@api_router.put("/admin/popup")
async def update_popup(payload: PopupUpdate, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        await create_pending_change("popup", "update", payload.model_dump(), user, "Pop-up update")
        return {"pending": True}
    doc = {
        "slot": "popup",
        "enabled": payload.enabled,
        "title": payload.title,
        "message": payload.message,
        "image_url": payload.image_url,
        "updated_at": now_iso(),
    }
    await db.site_settings.update_one({"slot": "popup"}, {"$set": doc}, upsert=True)
    return {k: doc[k] for k in ("enabled", "title", "message", "image_url")}


# ---------------- Homepage content (CMS) ----------------

HERO_URL = "https://images.unsplash.com/photo-1759733845137-5eb942436f49?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwzfHxjcmlja2V0JTIwc3RhZGl1bSUyMGdyZWVufGVufDB8fHx8MTc5MDQxNjIzMHww&ixlib=rb-4.1.0&q=85"
ABOUT_URL = "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODl8MHwxfHNlYXJjaHwxfHxjcmlja2V0JTIwYmF0c21hbiUyMGFjdGlvbnxlbnwwfHx8fDE3OTA0MTYyMzB8MA&ixlib=rb-4.1.0&q=85"
G = "?crop=entropy&cs=srgb&fm=jpg&q=85"
U = "https://images.unsplash.com"

DEFAULT_CONTENT = {
    "hero_line1": "The Home of",
    "hero_line2_gold": "Pathankot",
    "hero_line2_rest": "Cricket",
    "hero_subline": "The official cricketing body of District Pathankot, affiliated to the Punjab Cricket Association, Mohali — conducting trials, selecting players and fielding squads from U-14 to Seniors, for men and women, into inter-district competition.",
    "hero_image": HERO_URL,
    "about_heading": "One body for the game in Pathankot.",
    "about_p1": "The Cricket Association Pathankot (CAP) is the official cricketing body for District Pathankot, affiliated to the Punjab Cricket Association (PCA), Mohali.",
    "about_p2": "From identifying talent at open trials to formalising squads after selection, the Association administers every stage of the district game — conducting selections, making teams, and sending Pathankot's sides to inter-district competition.",
    "about_image": ABOUT_URL,
    "about_points": [
        "Official body for District Pathankot",
        "Affiliated to PCA, Mohali",
        "Trials & merit-based selections",
        "Squads from U-14 to Seniors — Men & Women",
    ],
    "trials_label": "District Trials · All Age Groups",
    "trials_heading": "Open trials for U-14 to Seniors — men & women.",
    "trials_dates": "To be Announced Soon",
    "teams_heading": "Nine squads. Two wings.",
    "teams_accent": "One district.",
    "teams_sub": "Selections are held for every category, for men and women alike. Registered players are called to trials as squads are formalised.",
    "process_heading": "From trials to the district cap.",
    "process_steps": [
        {"title": "Open Trials", "desc": "Trials for each age group are announced by the Association, open to eligible players from across District Pathankot."},
        {"title": "Merit Selection", "desc": "Selectors assess skill, form and match temperament. Selections are made on merit — for both men's and women's wings."},
        {"title": "Squad Formation", "desc": "Selected players are formalised into official district squads — the Pathankot teams for the season."},
        {"title": "Inter-District", "desc": "Squads carry the district colours into inter-district matches under the Punjab Cricket Association."},
    ],
    "gallery_heading": "District cricket, in pictures.",
    "gallery_urls": [
        f"{U}/photo-1565787154274-c8d076ad34e7{G}",
        f"{U}/photo-1593766827228-8737b4534aa6{G}",
        f"{U}/photo-1595210382051-4d2c31fcc2f4{G}",
        f"{U}/photo-1624193757636-b829dfa06a1b{G}",
        f"{U}/photo-1729027696167-0f3aa8e92e64{G}",
        f"{U}/photo-1595210382266-2d0077c1f541{G}",
    ],
    "contact_address": "Jodhamal Colony, Pathankot",
    "contact_phone": "89680-44334",
    "contact_email": "cricketpathankot@gmail.com",
    "footer_tagline": "The official cricketing body of District Pathankot, affiliated to the Punjab Cricket Association, Mohali.",
    "bearers": [
        {"role": "President", "name": "Sh. Balbir Manhas"},
        {"role": "Sr. Vice President", "name": "Sh. Satish Mahendru"},
        {"role": "Vice President", "name": "Sh. Varun Thakur"},
        {"role": "Secretary", "name": "Sh. Sunny Mahajan"},
        {"role": "Joint Secretary", "name": "Sh. Prashant Sharma"},
    ],
}


class ProcessStep(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str = ""
    desc: str = ""


class Bearer(BaseModel):
    model_config = ConfigDict(extra="ignore")

    role: str = ""
    name: str = ""


class SiteContentUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    hero_line1: str = DEFAULT_CONTENT["hero_line1"]
    hero_line2_gold: str = DEFAULT_CONTENT["hero_line2_gold"]
    hero_line2_rest: str = DEFAULT_CONTENT["hero_line2_rest"]
    hero_subline: str = DEFAULT_CONTENT["hero_subline"]
    hero_image: str = DEFAULT_CONTENT["hero_image"]
    about_heading: str = DEFAULT_CONTENT["about_heading"]
    about_p1: str = DEFAULT_CONTENT["about_p1"]
    about_p2: str = DEFAULT_CONTENT["about_p2"]
    about_image: str = DEFAULT_CONTENT["about_image"]
    about_points: List[str] = Field(default_factory=lambda: list(DEFAULT_CONTENT["about_points"]))
    trials_label: str = DEFAULT_CONTENT["trials_label"]
    trials_heading: str = DEFAULT_CONTENT["trials_heading"]
    trials_dates: str = DEFAULT_CONTENT["trials_dates"]
    teams_heading: str = DEFAULT_CONTENT["teams_heading"]
    teams_accent: str = DEFAULT_CONTENT["teams_accent"]
    teams_sub: str = DEFAULT_CONTENT["teams_sub"]
    process_heading: str = DEFAULT_CONTENT["process_heading"]
    process_steps: List[ProcessStep] = Field(default_factory=lambda: [ProcessStep(**s) for s in DEFAULT_CONTENT["process_steps"]])
    gallery_heading: str = DEFAULT_CONTENT["gallery_heading"]
    gallery_urls: List[str] = Field(default_factory=lambda: list(DEFAULT_CONTENT["gallery_urls"]))
    contact_address: str = DEFAULT_CONTENT["contact_address"]
    contact_phone: str = DEFAULT_CONTENT["contact_phone"]
    contact_email: str = DEFAULT_CONTENT["contact_email"]
    footer_tagline: str = DEFAULT_CONTENT["footer_tagline"]
    bearers: List[Bearer] = Field(default_factory=lambda: [Bearer(**b) for b in DEFAULT_CONTENT["bearers"]])


@api_router.get("/content")
async def get_content():
    doc = await db.site_settings.find_one({"slot": "content"})
    if not doc:
        return DEFAULT_CONTENT
    return {k: doc.get(k, DEFAULT_CONTENT.get(k, "")) for k in DEFAULT_CONTENT}


@api_router.put("/admin/content")
async def update_content(payload: SiteContentUpdate, user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    if user.get("role") != "admin":
        await create_pending_change("content", "update", doc, user, "Homepage content update")
        return {"pending": True}
    doc["slot"] = "content"
    doc["updated_at"] = now_iso()
    await db.site_settings.update_one({"slot": "content"}, {"$set": doc}, upsert=True)
    logger.info("Homepage content updated")
    return {k: v for k, v in doc.items() if k not in ("slot", "updated_at")}


@api_router.delete("/admin/announcements/{announcement_id}")
async def delete_announcement(announcement_id: str, user: dict = Depends(get_current_user)):
    doc = await db.announcements.find_one({"id": announcement_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Announcement not found")
    if user.get("role") != "admin":
        await create_pending_change(
            "announcement",
            "delete",
            {"announcement_id": announcement_id},
            user,
            f"Delete notice #{doc.get('notice_no', 0)} — \"{doc.get('title', '')}\"",
        )
        return {"pending": True}
    await db.announcements.delete_one({"id": announcement_id})
    return Response(status_code=204)


# ---------------- Users & approvals (admin only) ----------------

class UserCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    email: str
    password: str
    role: str = "editor"


@api_router.get("/admin/users")
async def list_users(admin: dict = Depends(require_admin)):
    docs = await db.users.find({}, {"password_hash": 0}).sort("created_at", 1).to_list(100)
    return [
        {"id": d.get("id", ""), "email": d.get("email", ""), "role": d.get("role", "editor"), "created_at": d.get("created_at", "")}
        for d in docs
    ]


@api_router.post("/admin/users", status_code=201)
async def create_user(payload: UserCreate, admin: dict = Depends(require_admin)):
    email = payload.email.strip().lower()
    role = payload.role if payload.role in ("admin", "editor") else "editor"
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Enter a valid email address")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="A user with this email already exists")
    await db.users.insert_one({
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(payload.password),
        "role": role,
        "created_at": now_iso(),
    })
    logger.info(f"User created: {email} ({role}) by {admin['email']}")
    return {"id": "", "email": email, "role": role, "created_at": now_iso()}


@api_router.delete("/admin/users/{user_id}", status_code=204)
async def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target["id"] == admin["id"]:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    if target.get("role") == "admin" and await db.users.count_documents({"role": "admin"}) <= 1:
        raise HTTPException(status_code=400, detail="The last admin cannot be removed")
    await db.users.delete_one({"id": user_id})
    return Response(status_code=204)


@api_router.get("/admin/pending")
async def list_pending(admin: dict = Depends(require_admin)):
    docs = await db.pending_changes.find({"status": "pending"}).sort("created_at", -1).to_list(200)
    return [
        {
            "id": d["id"],
            "resource": d.get("resource", ""),
            "action": d.get("action", ""),
            "summary": d.get("summary", ""),
            "payload": d.get("payload", {}),
            "proposed_by": d.get("proposed_by", ""),
            "created_at": d.get("created_at", ""),
        }
        for d in docs
    ]


@api_router.post("/admin/pending/{change_id}/approve")
async def approve_change(change_id: str, admin: dict = Depends(require_admin)):
    change = await db.pending_changes.find_one({"id": change_id})
    if not change:
        raise HTTPException(status_code=404, detail="Change not found")
    await apply_pending_change(change)
    await db.pending_changes.delete_one({"id": change_id})
    logger.info(f"Approved ({change.get('resource')}.{change.get('action')}): {change.get('summary')} — by {admin['email']}")
    return {"ok": True}


@api_router.post("/admin/pending/{change_id}/reject")
async def reject_change(change_id: str, admin: dict = Depends(require_admin)):
    result = await db.pending_changes.delete_one({"id": change_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Change not found")
    logger.info(f"Rejected a pending change — by {admin['email']}")
    return {"ok": True}


# ---------------- Auth endpoints ----------------

@api_router.post("/auth/login")
async def login(request: Request, response: Response, payload: LoginRequest):
    email = payload.email.strip().lower()
    ip = client_ip(request)

    await check_login_lockout(ip, email)

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        await record_failed_login(ip, email)
        await log_login_event(email, ip, False, "no_such_user" if not user else "wrong_password")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.get("totp_enabled"):
        ticket = jwt.encode(
            {"sub": user["id"], "type": "2fa", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
            get_jwt_secret(),
            algorithm=JWT_ALGORITHM,
        )
        await log_login_event(email, ip, False, "2fa_code_required")
        return {"two_factor": True, "ticket": ticket}

    await clear_failed_logins(ip, email)
    await log_login_event(email, ip, True, "ok")
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return serialize_user(user)


class TwoFactorLogin(BaseModel):
    model_config = ConfigDict(extra="ignore")

    ticket: str
    code: str = Field(min_length=6, max_length=8)


@api_router.post("/auth/login/2fa")
async def login_2fa(request: Request, response: Response, payload: TwoFactorLogin):
    ip = client_ip(request)
    try:
        tk = jwt.decode(payload.ticket, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="This sign-in attempt expired — please sign in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid sign-in attempt — please sign in again")
    if tk.get("type") != "2fa":
        raise HTTPException(status_code=401, detail="Invalid sign-in attempt — please sign in again")

    user = await db.users.find_one({"id": tk["sub"]})
    if not user or not user.get("totp_enabled"):
        raise HTTPException(status_code=401, detail="Please sign in again")

    email = user["email"]
    await check_login_lockout(ip, email)

    code = payload.code.strip().replace(" ", "")
    if not user.get("totp_secret") or not pyotp.TOTP(user["totp_secret"]).verify(code, valid_window=1):
        await record_failed_login(ip, email)
        await log_login_event(email, ip, False, "2fa_code_invalid")
        raise HTTPException(status_code=401, detail="That code didn't match. Check your authenticator app and try again.")

    await clear_failed_logins(ip, email)
    await log_login_event(email, ip, True, "ok")
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return serialize_user(user)


class TwoFactorActivate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    code: str = Field(min_length=6, max_length=8)


@api_router.post("/auth/2fa/setup")
async def setup_2fa(request: Request, user: dict = Depends(get_current_user)):
    doc = await db.users.find_one({"id": user["id"]})
    if doc.get("totp_enabled"):
        raise HTTPException(status_code=400, detail="Two-factor authentication is already enabled")
    secret = pyotp.random_base32()
    await db.users.update_one({"id": user["id"]}, {"$set": {"totp_secret": secret, "totp_enabled": False}})
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user["email"], issuer_name="CAP Pathankot")
    return {"secret": secret, "otpauth_uri": uri}


@api_router.post("/auth/2fa/activate")
async def activate_2fa(payload: TwoFactorActivate, request: Request, user: dict = Depends(get_current_user)):
    doc = await db.users.find_one({"id": user["id"]})
    if doc.get("totp_enabled"):
        raise HTTPException(status_code=400, detail="Two-factor authentication is already enabled")
    if not doc.get("totp_secret"):
        raise HTTPException(status_code=400, detail="Start the setup first")
    if not pyotp.TOTP(doc["totp_secret"]).verify(payload.code.strip().replace(" ", ""), valid_window=1):
        raise HTTPException(status_code=400, detail="That code didn't match — use the current code from your authenticator app")
    await db.users.update_one({"id": user["id"]}, {"$set": {"totp_enabled": True}})
    await log_login_event(user["email"], client_ip(request), True, "2fa_enabled")
    return {"enabled": True}


class PasswordConfirm(BaseModel):
    model_config = ConfigDict(extra="ignore")

    password: str


@api_router.post("/auth/2fa/disable")
async def disable_2fa(payload: PasswordConfirm, request: Request, user: dict = Depends(get_current_user)):
    doc = await db.users.find_one({"id": user["id"]})
    if not doc.get("totp_enabled"):
        raise HTTPException(status_code=400, detail="Two-factor authentication is not enabled")
    if not verify_password(payload.password, doc["password_hash"]):
        await log_login_event(user["email"], client_ip(request), False, "2fa_disable_bad_password")
        raise HTTPException(status_code=400, detail="Your password is incorrect")
    await db.users.update_one({"id": user["id"]}, {"$set": {"totp_enabled": False, "totp_secret": ""}})
    await log_login_event(user["email"], client_ip(request), True, "2fa_disabled")
    return {"enabled": False}


class PasswordChange(BaseModel):
    model_config = ConfigDict(extra="ignore")

    current_password: str
    new_password: str = Field(min_length=10, max_length=128)


def password_policy_error(pw: str) -> Optional[str]:
    if not re.search(r"[A-Za-z]", pw):
        return "include at least one letter"
    if not re.search(r"\d", pw):
        return "include at least one number"
    return None


@api_router.post("/auth/change-password")
async def change_password(payload: PasswordChange, request: Request, response: Response, user: dict = Depends(get_current_user)):
    doc = await db.users.find_one({"id": user["id"]})
    if not doc or not verify_password(payload.current_password, doc["password_hash"]):
        raise HTTPException(status_code=400, detail="Your current password is incorrect")
    policy = password_policy_error(payload.new_password)
    if policy:
        raise HTTPException(status_code=400, detail=f"Weak password — use 10+ characters and {policy}")
    if payload.new_password == payload.current_password:
        raise HTTPException(status_code=400, detail="Choose a password you haven't used before")
    new_version = doc.get("token_version", 0) + 1
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": hash_password(payload.new_password), "token_version": new_version}},
    )
    doc["token_version"] = new_version
    response.set_cookie(key="access_token", value=create_access_token(doc), httponly=True, secure=True, samesite="none", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=create_refresh_token(doc), httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    await log_login_event(user["email"], client_ip(request), True, "password_changed")
    return {"ok": True}


@api_router.post("/auth/logout-all")
async def logout_all(request: Request, response: Response, user: dict = Depends(get_current_user)):
    doc = await db.users.find_one({"id": user["id"]})
    await db.users.update_one(
        {"id": user["id"]}, {"$set": {"token_version": (doc or {}).get("token_version", 0) + 1}}
    )
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    await log_login_event(user["email"], client_ip(request), True, "logged_out_everywhere")
    return {"ok": True}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"ok": True}


@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if payload.get("ver", 0) != user.get("token_version", 0):
        raise HTTPException(status_code=401, detail="Session revoked — please sign in again")
    response.set_cookie(key="access_token", value=create_access_token(user), httponly=True, secure=True, samesite="none", max_age=900, path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(admin: dict = Depends(get_current_user)):
    return admin


@api_router.get("/admin/login-events")
async def list_login_events(admin: dict = Depends(require_admin)):
    docs = await db.login_events.find().sort("created_at", -1).to_list(100)
    return [
        {
            "id": d.get("id", ""),
            "email": d.get("email", ""),
            "ip": d.get("ip", ""),
            "success": d.get("success", False),
            "reason": d.get("reason", ""),
            "created_at": d.get("created_at", ""),
        }
        for d in docs
    ]


# ---------------- Admin endpoints ----------------

@api_router.get("/admin/registrations", response_model=List[Registration])
async def list_registrations(admin: dict = Depends(get_current_user)):
    docs = await db.registrations.find().sort("created_at", -1).to_list(2000)
    return [Registration(**d) for d in docs]


@api_router.get("/admin/messages", response_model=List[ContactMessage])
async def list_messages(admin: dict = Depends(get_current_user)):
    docs = await db.contact_messages.find().sort("created_at", -1).to_list(2000)
    return [ContactMessage(**d) for d in docs]


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()],
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.on_event("startup")
async def startup():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@capathankot.in").strip().lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    # Seed the admin only when missing. The password can be changed inside the
    # admin panel, so the stored hash is never overwritten from .env on restart.
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "token_version": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin seeded: {admin_email}")
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.login_events.create_index("created_at")

    unnumbered = await db.announcements.find({"notice_no": {"$exists": False}}).sort("created_at", 1).to_list(1000)
    if unnumbered:
        last = await db.announcements.find_one(sort=[("notice_no", -1)])
        nxt = ((last or {}).get("notice_no", 0)) + 1
        for d in unnumbered:
            await db.announcements.update_one({"id": d["id"]}, {"$set": {"notice_no": nxt}})
            nxt += 1
        logger.info(f"Assigned notice numbers to {len(unnumbered)} notices")

    squads_count = await db.squads.count_documents({})
    if squads_count and await db.squads.count_documents({"wing": {"$exists": False}}) > 0:
        await db.squads.delete_many({})
        squads_count = 0
        logger.info("Legacy squads (no wing) cleared for re-seed")
    if squads_count == 0:
        squad_seed = [
            {"order": 1, "wing": "Men", "age_group": "U-14", "label": "Under-14", "description": "Foundation age-group cricket for the district's youngest talent.", "group_photo": "", "players": []},
            {"order": 2, "wing": "Men", "age_group": "U-16", "label": "Under-16", "description": "Developing players for state-level age-group competitions.", "group_photo": "", "players": []},
            {"order": 3, "wing": "Men", "age_group": "U-19", "label": "Under-19", "description": "The pathway squad bridging junior and senior cricket.", "group_photo": "", "players": []},
            {"order": 4, "wing": "Men", "age_group": "U-23", "label": "Under-23", "description": "Emerging talent on the edge of senior selection.", "group_photo": "", "players": []},
            {"order": 5, "wing": "Men", "age_group": "Seniors", "label": "Senior Men", "description": "The flagship men's district side in PCA inter-district championships.", "group_photo": "", "players": []},
            {"order": 6, "wing": "Women", "age_group": "U-15", "label": "Under-15 Girls", "description": "The youngest wing of Pathankot women's cricket.", "group_photo": "", "players": []},
            {"order": 7, "wing": "Women", "age_group": "U-19", "label": "Under-19 Girls", "description": "Developing young women cricketers for state-level competition.", "group_photo": "", "players": []},
            {"order": 8, "wing": "Women", "age_group": "U-23", "label": "Under-23 Women", "description": "Emerging women's talent on the edge of senior selection.", "group_photo": "", "players": []},
            {"order": 9, "wing": "Women", "age_group": "Seniors", "label": "Senior Women", "description": "The flagship women's district side in PCA inter-district championships.", "group_photo": "", "players": []},
        ]
        for s in squad_seed:
            s["id"] = str(uuid.uuid4())
            s["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.squads.insert_many(squad_seed)
        logger.info("Squads seeded (9 squads: 5 men's, 4 women's)")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
