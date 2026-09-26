# Auth Testing Playbook — Cricket Association Pathankot

## MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`, unique index on users.email, index on login_attempts.identifier.

## API Testing
```
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)

# Login (sets httpOnly cookies, also returns nothing else needed)
curl -s -c /tmp/cookies.txt -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"<admin email from test_credentials.md>","password":"<password>"}'

# Me (cookie auth)
curl -s -b /tmp/cookies.txt "$API_URL/api/auth/me"

# Me (bearer auth alternative)
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"...","password":"..."}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
```
Note: login response returns user object only; cookies carry the tokens. Bearer fallback: use access token cookie value.

## Public endpoints
- POST /api/registrations (full_name, date_of_birth, gender, age_group, playing_role, batting_style, bowling_style, phone, email, residence, club_or_institute, playing_experience) — form lives on /register page
- POST /api/contact (name, email, phone, subject, message)

## Admin endpoints (require auth)
- GET /api/admin/registrations
- GET /api/admin/registrations/export (CSV download, Content-Disposition attachment)
- GET /api/admin/messages
- POST /api/admin/announcements (title, body, pinned optional)
- POST /api/admin/announcements/{id}/pin (toggle pin; pinning one unpins others — exclusive)
- DELETE /api/admin/announcements/{id}
- PUT /api/admin/squads/{id} (group_photo, players[])

## Public announcements
- GET /api/announcements

## Brute force
5 failed logins on the same ip:email -> 429 for 15 minutes.
