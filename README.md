# PakiPark — Smart Parking Reservation System

> **CCDI Capstone Project** · Stack: **Next.js (React)** + **NestJS (TypeScript)**

## 🏗️ Project Structure (Monorepo)

```
PakiPark/
├── frontend/          ← Next.js 15 App Router (React 18 + TypeScript)
│   ├── src/
│   │   ├── app/       ← Pages (App Router)
│   │   │   ├── teller/home/   ← Teller Dashboard
│   │   │   └── ...
│   │   ├── services/  ← API service layer
│   │   └── lib/       ← API client
│   └── public/assets/ ← Mascot images & static files
│
└── backend/           ← NestJS API (TypeScript)
    ├── src/
    │   ├── auth/          ← JWT auth
    │   ├── bookings/      ← Booking management
    │   ├── vehicles/      ← Vehicle management
    │   ├── locations/     ← Parking locations
    │   ├── parking-slots/ ← Slot grid & dashboard
    │   ├── users/         ← User management
    │   ├── reviews/       ← Location reviews
    │   ├── analytics/     ← Booking analytics
    │   ├── logs/          ← Activity & transaction logs
    │   ├── settings/      ← System settings
    │   └── database/      ← Sequelize / PostgreSQL
    └── .env               ← DB credentials + JWT secret
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Backend — copy and fill:
```bash
cp backend/.env.example backend/.env
```

Frontend — already set to `http://localhost:5000/api`:
```bash
cp frontend/.env.example frontend/.env.local
```

### 3. Run in Development

```bash
# Terminal 1 — Backend (NestJS on port 5000)
cd backend
npm run start:dev

# Terminal 2 — Frontend (Next.js on port 3000)
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔑 Tech Stack

| Layer    | Technology          | Version |
|----------|---------------------|---------|
| Frontend | **Next.js**         | 15.x    |
| Language | **TypeScript**      | 5.x     |
| UI       | React 18, Tailwind, shadcn/ui components |   |
| Backend  | **NestJS**          | 10.x    |
| Language | **TypeScript** (JS strictly prohibited) | 5.x |
| Database | **PostgreSQL** via Sequelize | 6.x |
| Auth     | JWT (passport-jwt)  |         |
| Hosting  | Supabase (PostgreSQL) |       |

## 💡 Key Features

- **Teller Dashboard** — scan/lookup, check-in, check-out with ₱15/hr overtime (first 2h free)
- **Smart Slot Grid** — real-time availability, auto-assign, no-show detection
- **Role-based Access** — customer, teller, admin, business_partner
- **Denormalized Bookings** — snapshot columns for zero-join reads
- **Refund Policy** — 100% / 50% / 0% based on time of cancellation

## 🌐 API Endpoints

Backend runs at `http://localhost:5000/api`

| Route                          | Method | Auth     | Description              |
|-------------------------------|--------|----------|--------------------------|
| `/auth/login`                 | POST   | Public   | Login                    |
| `/auth/register/customer`     | POST   | Public   | Register customer        |
| `/bookings`                   | GET    | Staff    | All bookings             |
| `/bookings/my`                | GET    | Customer | My bookings              |
| `/bookings/:id/checkout`      | PATCH  | Staff    | Check-out + billing      |
| `/parking-slots/dashboard/:id`| GET    | Auth     | Real-time slot grid      |
| `/locations`                  | GET    | Public   | All locations            |

## 📋 CCDI Compliance Checklist

- [x] Frontend: **React** with **Next.js** framework
- [x] Backend: **TypeScript** (no JavaScript)
- [x] Backend: **NestJS** framework
- [x] Monorepo structure (`frontend/` + `backend/`)
- [x] PostgreSQL database
- [x] JWT authentication
- [x] Role-based access control

---

*PakiPark · Built for CCDI Capstone · 2026*