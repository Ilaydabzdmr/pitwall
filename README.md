# 🏎️ PitWall — F1 Race Prediction & Mini Racing Game Platform

![PitWall](https://img.shields.io/badge/PitWall-F1%20Platform-e10600?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)

> A full-stack Formula 1 web application featuring real-time 2026 F1 season data, a race prediction system with points & leaderboard, and an interactive 2D mini racing game built with HTML5 Canvas.

---

## ✨ Features

- 🏁 **2026 F1 Season Data** — Live race calendar, driver profiles, and race results powered by [Jolpica F1 API](https://api.jolpi.ca)
- 🎯 **Prediction System** — Predict race winner, pole, fastest lap & DNF before each race. Earn points, use your seasonal Joker for 2x points
- 🏆 **Leaderboard** — Season-wide and weekly rankings
- 🎮 **Mini Racing Game** — Top-down 2D racing on real F1 circuits with pixel-based track detection. Driver stats (speed, grip, accel) affect in-game physics
- 🔐 **JWT Authentication** — Secure register/login, protected routes
- 🔄 **Auto Sync** — Daily cron job updates race statuses and fetches results automatically

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Axios, HTML5 Canvas |
| Backend | Node.js, Express.js, JWT, bcrypt, node-cron |
| Database | MySQL 8.0 |
| External APIs | Jolpica F1 API, OpenF1 API |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x
- MySQL 8.0
- Git

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/Ilaydabzdmr/pitwall.git
cd pitwall
```

**2. Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MySQL credentials and JWT secret
```

**3. Setup Database**
```bash
mysql -u root -p
CREATE DATABASE pitwall;
exit
# Then run schema
mysql -u root -p pitwall < src/db/schema.sql
```

**4. Sync F1 Data**

Start backend first, then call these endpoints once:
```
POST http://localhost:3001/api/sync/races
POST http://localhost:3001/api/sync/drivers
POST http://localhost:3001/api/sync/all-results
```

**5. Setup Frontend**
```bash
cd ../frontend
npm install
```

### Running the App

**Backend** (port 3001):
```bash
cd backend
npm run dev
```

**Frontend** (port 5173):
```bash
cd frontend
npm run dev
```

Or use the `PitWall.bat` file on Windows to start both with one double-click.

---

## 📁 Project Structure

```
pitwall/
├── backend/
│   ├── src/
│   │   ├── routes/         # auth, races, predictions, game, leaderboard
│   │   ├── controllers/    # business logic for each route
│   │   ├── middleware/     # JWT auth middleware
│   │   ├── services/       # jolpica.js, scorer.js
│   │   └── db/             # pool.js, schema.sql
│   └── app.js
└── frontend/
    ├── src/
    │   ├── pages/          # Home, Races, RaceDetail, Drivers, Game, Profile, Leaderboard
    │   ├── components/     # Navbar
    │   ├── hooks/          # useAuth
    │   ├── api/            # axios instance
    │   └── App.jsx
    └── public/             # Track images, car image, team logos
```

---

## 🗄️ Database Schema

7 tables: `users`, `races`, `drivers`, `predictions`, `game_scores`, `race_results`, `tracks`

---

## 🎮 Mini Game

- Select a driver and circuit
- F1-style 5-light start sequence
- Drive using arrow keys or WASD
- Pixel-based track boundary detection
- 3-lap race with lap time tracking
- DNF if off-track for 3+ seconds
- Scores submitted to backend for server-side point calculation

---

## 🔑 Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=pitwall
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=your_secret_key
PORT=3001
```

---

## 📚 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | ❌ | Register new user |
| POST | /api/auth/login | ❌ | Login, returns JWT |
| GET | /api/auth/me | ✅ | Get current user |
| GET | /api/races | ❌ | Get all races |
| GET | /api/races/:id | ❌ | Get race detail |
| POST | /api/predictions | ✅ | Submit prediction |
| GET | /api/predictions/me | ✅ | My predictions |
| GET | /api/leaderboard | ❌ | Season leaderboard |
| GET | /api/leaderboard/weekly | ❌ | Weekly leaderboard |
| POST | /api/game/score | ✅ | Submit game score |
| GET | /api/drivers | ❌ | Get all drivers |

---

## 👥 Team

Developed as a term project for **CENG316 – Web Programming**

---

## 📄 License

This project is for educational purposes only.
