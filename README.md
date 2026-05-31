# SAI Manager API

Node.js + Express API for the SAI Manager UI, backed by Supabase.

## Setup

1. Install dependencies.

```bash
npm install
```

2. Create your local env file from the example and fill the values.

```bash
copy .env.example .env
```

3. Start the API.

```bash
npm run dev
```

## Environment

Required values:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional values:

- `SUPABASE_ANON_KEY`
- `PORT`
- `NODE_ENV`

## API Endpoints

Base path: `/api`

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`
- `GET /projects`
- `POST /projects`
- `GET /projects/:id`
- `PATCH /projects/:id`
- `DELETE /projects/:id`
- `GET /projects/:id/tasks`
- `POST /projects/:id/tasks`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`

## Database

The starter Supabase schema is in `supabase/schema.sql`.

## Tests

```bash
npm test
```
