from dotenv import load_dotenv

load_dotenv()

import os
import uuid
import logging
import bcrypt
import jwt
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
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user: dict) -> str:
    payload = {
        "sub": user["id"],
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_admin(request: Request) -> dict:
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
    return {"id": user["id"], "email": user["email"], "role": user.get("role", "admin")}


# ---------------- Public endpoints ----------------

@api_router.get("/")
async def root():
    return {"app": "Cricket Association Pathankot API", "status": "ok"}


@api_router.post("/registrations", response_model=Registration, status_code=201)
async def create_registration(payload: RegistrationCreate):
    reg = Registration(**payload.model_dump())
    doc = reg.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.registrations.insert_one(doc)
    logger.info(f"New player registration: {reg.full_name} ({reg.age_group})")
    return reg


@api_router.post("/contact", response_model=ContactMessage, status_code=201)
async def create_contact(payload: ContactCreate):
    msg = ContactMessage(**payload.model_dump())
    doc = msg.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.contact_messages.insert_one(doc)
    logger.info(f"New contact message from: {msg.name}")
    return msg


# ---------------- Announcements ----------------

class AnnouncementCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str = Field(min_length=3, max_length=160)
    body: str = Field(min_length=3, max_length=4000)
    pinned: bool = False
    notice_no: int = 0


class Announcement(AnnouncementCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


@api_router.get("/announcements", response_model=List[Announcement])
async def list_announcements():
    docs = await db.announcements.find().sort([("pinned", -1), ("created_at", -1)]).to_list(200)
    return [Announcement(**d) for d in docs]


@api_router.get("/admin/announcements", response_model=List[Announcement])
async def list_announcements_admin(admin: dict = Depends(get_current_admin)):
    docs = await db.announcements.find().sort([("pinned", -1), ("created_at", -1)]).to_list(200)
    return [Announcement(**d) for d in docs]


@api_router.post("/admin/announcements", response_model=Announcement, status_code=201)
async def create_announcement(payload: AnnouncementCreate, admin: dict = Depends(get_current_admin)):
    last = await db.announcements.find_one(sort=[("notice_no", -1)])
    notice_no = ((last or {}).get("notice_no", 0)) + 1
    ann = Announcement(**{**payload.model_dump(), "notice_no": notice_no})
    doc = ann.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.announcements.insert_one(doc)
    logger.info(f"New announcement posted: {ann.title}")
    return ann


@api_router.post("/admin/announcements/{announcement_id}/pin", response_model=Announcement)
async def toggle_pin_announcement(announcement_id: str, admin: dict = Depends(get_current_admin)):
    doc = await db.announcements.find_one({"id": announcement_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Announcement not found")
    new_pinned = not doc.get("pinned", False)
    if new_pinned:
        await db.announcements.update_many({"pinned": True}, {"$set": {"pinned": False}})
    await db.announcements.update_one({"id": announcement_id}, {"$set": {"pinned": new_pinned}})
    doc["pinned"] = new_pinned
    return Announcement(**doc)


@api_router.get("/admin/registrations/export")
async def export_registrations_csv(admin: dict = Depends(get_current_admin)):
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


@api_router.put("/admin/squads/{squad_id}", response_model=SquadOut)
async def update_squad(squad_id: str, payload: SquadUpdate, admin: dict = Depends(get_current_admin)):
    doc = await db.squads.find_one({"id": squad_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Squad not found")
    update_fields = {
        "players": [p.model_dump() for p in payload.players],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if payload.group_photo is not None:
        update_fields["group_photo"] = payload.group_photo
    await db.squads.update_one({"id": squad_id}, {"$set": update_fields})
    doc.update(update_fields)
    return SquadOut(**doc)


@api_router.delete("/admin/announcements/{announcement_id}", status_code=204)
async def delete_announcement(announcement_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.announcements.delete_one({"id": announcement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return Response(status_code=204)


# ---------------- Auth endpoints ----------------

@api_router.post("/auth/login")
async def login(request: Request, response: Response, payload: LoginRequest):
    email = payload.email.strip().lower()
    identifier = f"{request.client.host if request.client else 'unknown'}:{email}"

    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5 and datetime.now(timezone.utc) < attempt.get(
        "locked_until", datetime.now(timezone.utc)
    ):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        update: dict = {"$inc": {"count": 1}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
        new_count = (attempt.get("count", 0) if attempt else 0) + 1
        if new_count >= 5:
            update["$set"]["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        await db.login_attempts.update_one({"identifier": identifier}, update, upsert=True)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"id": user["id"], "email": user["email"], "role": user.get("role", "admin")}


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
    response.set_cookie(key="access_token", value=create_access_token(user), httponly=True, secure=True, samesite="none", max_age=900, path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(admin: dict = Depends(get_current_admin)):
    return admin


# ---------------- Admin endpoints ----------------

@api_router.get("/admin/registrations", response_model=List[Registration])
async def list_registrations(admin: dict = Depends(get_current_admin)):
    docs = await db.registrations.find().sort("created_at", -1).to_list(2000)
    return [Registration(**d) for d in docs]


@api_router.get("/admin/messages", response_model=List[ContactMessage])
async def list_messages(admin: dict = Depends(get_current_admin)):
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


@app.on_event("startup")
async def startup():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@capathankot.in").strip().lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    hashed = hash_password(admin_password)
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hashed,
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hashed}})
        logger.info(f"Admin password updated from env: {admin_email}")
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")

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
