# AI StudyBuddy — Enhanced v2.0

AI-powered study backend using Node.js, Express, MongoDB and Gemini 2.5 Flash.

## What was enhanced
- Fixed real PDF text extraction using `pdf-parse`.
- Public registration can no longer self-assign the `admin` role.
- Stronger password hashing and input validation.
- Added material search, tags, favorites, difficulty and progress tracking.
- Added student dashboard analytics.
- Added safer MongoDB/ObjectId handling and centralized 404/error handling.
- Added AI JSON parsing that tolerates fenced JSON responses.
- Added 10 MB upload limit and cleanup for temporary files.
- Added admin analytics with average progress.
- Added clean `.env.example` and removed secrets from the project package.

## Requirements
- Node.js 18+
- MongoDB 6+
- Gemini API key

## Setup

```bash
npm install
copy .env.example .env
```

On macOS/Linux:
```bash
cp .env.example .env
```

Edit `.env` with your MongoDB URI, JWT secrets and Gemini API key.

Run:
```bash
npm run dev
```

API: `http://localhost:5000`

## Main API

### Auth
- `POST /api/auth/register` — `{ name, email, password }`
- `POST /api/auth/login` — `{ email, password }`
- `POST /api/auth/refresh` — header `x-refresh-token`
- `POST /api/auth/logout`

### Student materials
All require `Authorization: Bearer <accessToken>`.
- `POST /api/materials/upload` — multipart `file`, optional `title`, `tags`
- `GET /api/materials`
- `GET /api/materials?search=network&favorite=true&difficulty=medium&tag=computer`
- `GET /api/materials/dashboard`
- `GET /api/materials/:id`
- `PATCH /api/materials/:id` — title/favorite/difficulty/progress/tags
- `DELETE /api/materials/:id`
- `POST /api/materials/:id/summarize`
- `POST /api/materials/:id/flashcards` — `{ count: 5 }`
- `POST /api/materials/:id/quiz` — `{ count: 5 }`
- `POST /api/materials/:id/study-plan` — `{ goal, hoursPerDay, days }`

### Admin
Admin role required.
- `GET /api/admin/users`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/stats`

## Creating the first admin
Registration intentionally creates only students. After creating your account, promote it directly in MongoDB:

```js
db.users.updateOne({ email: "your-email@example.com" }, { $set: { role: "admin" } })
```

## Important security note
Never commit `.env` or expose your Gemini API key. If the key in your original reference project was a real key, rotate/revoke it in the Google AI Studio console and create a fresh key.

## Project structure
```text
ai-studybuddy-enhanced/
├── index.js
├── package.json
├── .env.example
├── README.md
├── uploads/
└── src/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    └── utils/
```
