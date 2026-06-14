# SAI Manager API

Node.js + Express + TypeScript REST API for the SAI Manager Flutter app, backed by Supabase.

## Setup

1. Install dependencies.

```bash
npm install
```

2. Copy the env example and fill in your Supabase values.

```bash
copy .env.example .env
```

3. Run the Supabase SQL schema against your project (Dashboard → SQL Editor).

```
supabase/schema.sql
```

4. Seed the database with demo data.

```bash
npm run seed
```

5. Start the API.

```bash
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service-role key (never expose client-side) |
| `SUPABASE_ANON_KEY` | — | Anon key (optional, for future use) |
| `PORT` | — | HTTP port (default: 3000) |
| `NODE_ENV` | — | Environment (default: development) |

## API Endpoints

All routes are under base path `/api`.  
Protected routes require `Authorization: Bearer <access_token>`.

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create a new account |
| POST | `/auth/login` | — | Sign in and get a session token |

### Users
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | ✅ | Get the current user's profile |

### Tasks
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/tasks` | ✅ | List all tasks for the user |
| POST | `/tasks` | ✅ | Create a task |
| PATCH | `/tasks/:id` | ✅ | Update a task |
| DELETE | `/tasks/:id` | ✅ | Delete a task |

### Projects
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/projects` | ✅ | List all projects (with computed progress) |
| POST | `/projects` | ✅ | Create a project |
| GET | `/projects/:id` | ✅ | Get a single project |
| PATCH | `/projects/:id` | ✅ | Update a project |
| DELETE | `/projects/:id` | ✅ | Delete a project |
| GET | `/projects/:id/tasks` | ✅ | List tasks linked to a project |
| POST | `/projects/:id/tasks` | ✅ | Create a task inside a project |

### Finance
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/finance/summary` | ✅ | Computed balance, monthly income/expenses, weekly chart data |
| GET | `/finance/transactions` | ✅ | List all transactions |
| POST | `/finance/transactions` | ✅ | Add a transaction |
| PATCH | `/finance/transactions/:id` | ✅ | Update a transaction |
| DELETE | `/finance/transactions/:id` | ✅ | Delete a transaction |

### Notes
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/notes` | ✅ | List all notes (pinned first) |
| POST | `/notes` | ✅ | Create a note |
| PATCH | `/notes/:id` | ✅ | Update a note |
| DELETE | `/notes/:id` | ✅ | Delete a note |

### Habits (Goals)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/habits` | ✅ | List all habits |
| POST | `/habits` | ✅ | Create a habit |
| PATCH | `/habits/:id` | ✅ | Update a habit (toggle completion, update streak) |
| DELETE | `/habits/:id` | ✅ | Delete a habit |

### Calendar
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/calendar` | ✅ | List all calendar events |
| POST | `/calendar` | ✅ | Create an event |
| PATCH | `/calendar/:id` | ✅ | Update an event |
| DELETE | `/calendar/:id` | ✅ | Delete an event |

### Health
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Server health check |

## Database

The complete schema is in `supabase/schema.sql`. Run it once in the Supabase SQL Editor. Individual table files are in `supabase/schemas/`.

**Tables:**
- `profiles` — user profile (1:1 with auth.users)
- `projects` — projects with task counts and progress
- `tasks` — tasks linked optionally to a project
- `transactions` — income / expense records
- `notes` — pinnable rich-text notes
- `habits` — daily habits with streak tracking
- `calendar_events` — scheduled events with time and color

All tables have Row Level Security (RLS) enabled — users can only access their own rows.

## Demo Credentials

After running `npm run seed`:

| Field | Value |
|---|---|
| Email | `demo@sai-manager.com` |
| Password | `Password123!` |

## Tests

```bash
npm test
```
