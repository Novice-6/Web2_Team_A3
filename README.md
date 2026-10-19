# Green Tomorrow — Charity Events Website

A complete dynamic website for the **Green Tomorrow** charity platform, developed for **PROG2002 Web Development II — Assessment 3**. It consists of a public client-side website (browse, search, and register for charity events) and an admin-side dashboard (full CRUD management of events), both served by a single Node.js/Express REST API backed by MySQL, and deployed to SCU cPanel.

## Features

### Client-side website
- **Home page** — featured upcoming events with category and date information
- **Search page** — filter events by keyword, category, and status, with client-side validation
- **Event detail page** — full event information plus the live list of registrations (sorted by latest registration)
- **Registration page** — users register for a selected event, choose ticket quantity; duplicate registrations for the same event are blocked with friendly error feedback
- **Weather panel** — event page shows a 7-day forecast from the external Open-Meteo API (optional bonus feature)

### Admin-side website
- **Event list** — displays all events regardless of status (active / past / suspended), with registration counts and delete actions
- **Create / Update form** — validated form to add new events or edit existing ones
- **Registrations viewer** — staff can inspect who registered for each event
- **Delete protection** — events with existing registrations cannot be deleted; the API returns `409 Conflict` and the UI explains why

### REST API
- Full CRUD cycle for events (`/api/admin/events`)
- Public read endpoints for events, categories, organisations, search, and featured events
- Registration endpoints with server-side duplicate checking (`UNIQUE(email, event_id)` in the database as the final guard)
- Open-Meteo weather proxy endpoint with timeout handling and graceful fallback

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 22 (standalone components, lazy-loaded routes), TypeScript, CSS |
| Backend | Node.js, Express.js |
| Database | MySQL (mysql2 connection pool) |
| External API | Open-Meteo Weather API (bonus feature) |
| Deployment | SCU cPanel (Node.js App + phpMyAdmin) |

## Project Structure

```
├── package.json              # API server scripts and dependencies
├── .env.example              # Environment variable template
└── source/
    ├── api/
    │   ├── server.js         # Express server: API routes + static hosting of the Angular build
    │   └── event_db.js       # Database access layer (pooled queries, all SQL logic)
    ├── client/               # Angular workspace (client + admin pages in one SPA)
    │   └── src/app/
    │       ├── pages/        # home, search, event-detail, registration, admin-*
    │       ├── core/         # ApiService, models
    │       └── shared/       # event card, header/footer, pipes, directives
    ├── database/
    │   ├── schema.sql        # Table definitions
    │   ├── seed.sql          # Sample data
    │   ├── database-final.sql     # Full schema + data for local use
    │   └── database-cpanel.sql    # Schema + data prepared for cPanel import
    └── assets/               # Images and static assets
```

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MySQL 8 (local or via cPanel)

### 1. Database
Import the SQL file into MySQL:

```sql
CREATE DATABASE charityevents_db CHARACTER SET utf8mb4;
USE charityevents_db;
SOURCE source/database/database-final.sql;
```

(Or import `database-cpanel.sql` via phpMyAdmin when deploying to cPanel.)

### 2. API server
```bash
npm install
cp .env.example .env        # then edit the values
npm start                   # http://localhost:3101
```

Environment variables (`.env`):

| Variable | Description |
|----------|-------------|
| `PORT` | Port the Express server listens on (default `3101`) |
| `DB_HOST` | MySQL host (usually `localhost`) |
| `DB_USER` | MySQL user (on cPanel use the full prefixed name, e.g. `user_ab3`) |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name (on cPanel use the full prefixed name) |

### 3. Angular frontend
The Angular app is built and served **by the Express server** (no separate frontend server needed):

```bash
cd source/client
npm install
ng build --configuration production
```

Restart the API server and open http://localhost:3101 — the SPA and the API are served from the same origin, so all `/api` calls work with no CORS setup.

For active frontend development, run `ng serve` inside `source/client` and use your own proxy for `/api`.

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List events (filters: `status`, `category`, `keyword`, `open`) |
| GET | `/api/events/featured` | Upcoming non-suspended events |
| GET | `/api/events/search` | Keyword/category search |
| GET | `/api/events/:id` | Single event **with all its registrations** |
| GET | `/api/events/:id/registrations` | Registrations for one event |
| POST | `/api/events/:id/registrations` | Create a registration (blocks duplicates) |
| GET | `/api/categories` | All event categories |
| GET | `/api/organisations` | All charity organisations |
| GET | `/api/weather` | Open-Meteo forecast by `latitude` / `longitude` |
| GET | `/api/admin/events` | Admin list — all events with registration counts |
| GET | `/api/admin/events/:id` | Admin event detail |
| POST | `/api/admin/events` | Create an event |
| PUT | `/api/admin/events/:id` | Update an event |
| DELETE | `/api/admin/events/:id` | Delete an event — returns **409** if registrations exist |

All endpoints were tested with Postman and the browser during development.

## Deployment (SCU cPanel)

1. Import `database-cpanel.sql` via phpMyAdmin (database/user names on cPanel carry a mandatory prefix).
2. Upload the project, create `.env` with the cPanel-prefixed `DB_USER` / `DB_NAME`.
3. Create a **Node.js App** (Application startup file: `source/api/server.js`), run *Run NPM Install*, then *Restart*.
4. Build the Angular app locally before uploading so `source/client/dist/client/browser/` ships with the code — Express serves it as the SPA root.

---

## Team & Collaboration

**Team members:**

| Member | Student ID | GitHub | Main Responsibility |
|--------|-----------|--------|---------------------|
| Wang Hao (王昊) | [24832782] | [Novice-6] | Registration feature, Admin-side website, REST API (CRUD), Weather API, cPanel deployment |
| Zijun Lin (林孜骏) | [24832397] | [Hayes] | Database design & seed data, Client-side pages (home / search / event detail), Core read APIs, Testing |

### Division of Work

| Module | Owner | Details |
|--------|-------|---------|
| Database schema & `registrations` table | Zijun Lin | Designed PK/FK relationships, `UNIQUE(email, event_id)` constraint, 12 seed registrations across active/past/suspended events |
| Core REST API (read endpoints) | Zijun Lin | Events list, search, featured, categories, organisations |
| Client-side pages | Zijun Lin | Home, search (filtering + validation), event detail with registration list |
| Registration feature | Wang Hao | Registration API with duplicate check, registration page form + client-side validation |
| Admin CRUD API | Wang Hao | Create / update / delete endpoints, 409 delete protection preserving data integrity |
| Admin dashboard | Wang Hao | Event list, create/update form, registrations viewer, all-pages navigation |
| Open-Meteo weather integration (bonus) | Wang Hao | Weather proxy endpoint, graceful fallback, event card display |
| cPanel deployment | Wang Hao | Node.js App setup, `.env` configuration, database import, production build |
| Joint testing & bug fixes | Both | Postman API tests, end-to-end walkthrough of all user flows |

### How we collaborated
- All work was pushed to this shared GitHub repository with descriptive commit messages, so each member's progress is visible in the commit history.
- Tasks were split by module (database/client vs. API/admin/deployment), with joint code review before merging changes into `main`.
- We synced weekly to agree on the API response format and page design before implementing each side, which kept the frontend and backend contracts stable.

### Development Timeline (October 2026)

| Date | Milestone | Owner |
|------|-----------|-------|
| Oct 12 | Requirements analysis, reviewed A2 codebase, agreed on task split and API contract | Team |
| Oct 13 | Database schema design: `registrations` table, FK/PK/UNIQUE constraints, seed data | Zijun Lin |
| Oct 14 | Core read APIs (events / search / featured / categories / organisations) | Zijun Lin |
| Oct 15 | Client pages wired to the API: home, search, event detail with registrations list | Zijun Lin |
| Oct 16 | Registration API (duplicate check + friendly errors) and registration page | Wang Hao |
| Oct 17 | Admin CRUD APIs, delete protection (409 on existing registrations) | Wang Hao |
| Oct 18 | Admin dashboard pages: list, create/update form, registrations viewer | Wang Hao |
| Oct 19 | Open-Meteo weather integration, cPanel deployment, end-to-end testing and fixes | Both |
