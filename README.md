# BookLeaf Author Support Portal

A full-stack author support and ticket management application built for the BookLeaf Publishing Full Stack Developer technical assignment. The portal allows authors to view their books and royalty information, raise support tickets, and communicate with the support team. Administrators can manage tickets, track their status, and use AI-assisted response drafts.

## Features

### Author Portal
- Secure login and role-based access.
- View books, publication details, and royalty information.
- Create support tickets and associate them with books.
- Search and filter tickets by status.
- View ticket conversations and public support replies.

### Admin Portal
- Dashboard with ticket metrics and recent activity.
- Search, filter, sort, and paginate the ticket queue.
- Manage ticket status, category, priority, and assignment.
- Send public responses and add private internal notes.
- Review ticket details and AI-generated response drafts.

### Authentication and Security
- JWT-based access tokens and refresh-token sessions.
- HTTP-only cookie for the refresh token.
- Role-based authorization for author and admin routes.
- Request validation, centralized error handling, security headers, CORS configuration, and API rate limiting.

### AI-Assisted Support
- AI-assisted ticket categorization and priority suggestions.
- Draft support responses informed by a BookLeaf knowledge base.
- Support for Google Gemini and Groq API integration.
- Manual ticket handling remains available when AI processing fails.

## Technology Stack

**Frontend:** React, Vite, Tailwind CSS, React Router, Axios, Lucide React.

**Backend:** Node.js, Express.js, REST APIs.

**Database and ORM:** PostgreSQL, Prisma ORM.

**Authentication and validation:** JSON Web Tokens (JWT), bcryptjs, HTTP-only cookies, Zod.

**AI integration:** Google Gemini and Groq APIs.

**Development and testing:** Git, GitHub, Postman, ESLint.

## Project Structure

```text
bookleaf-author-support-portal/
├── client/
│   ├── public/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── contexts/
│       ├── pages/
│       └── services/
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   ├── seed-data.json
│   │   └── seed.js
│   └── src/
│       ├── constants/
│       ├── controllers/
│       ├── db/
│       ├── middlewares/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       └── validators/
└── README.md
```

## Prerequisites

- Node.js 22.12 or newer.
- PostgreSQL.
- npm.
- An API key for at least one supported AI provider if AI-assisted functionality is required.

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/jhasaurav97/bookleaf-author-support-portal.git
cd bookleaf-author-support-portal
```

### 2. Configure the Backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME?schema=public"

ACCESS_TOKEN_SECRET=replace_with_a_long_random_secret
REFRESH_TOKEN_SECRET=replace_with_another_long_random_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

SEED_AUTHOR_PASSWORD=replace_with_a_development_password
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=replace_with_another_development_password

GEMINI_API_KEY=
GROQ_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GROQ_MODEL=llama-3.3-70b-versatile
```

Replace the database connection string and placeholder credentials with your own development values. Configure at least one supported AI provider key to enable its integration. Never commit `.env` or real API keys.

### 3. Set Up the Database

Ensure PostgreSQL is running and the configured database exists. From the `server` directory, run:

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

The seed process reads `prisma/seed-data.json` and creates or updates the supplied author and book records, along with the configured admin account. Use the intended development database when running the seed process.

### 4. Start the Backend

From the `server` directory:

```bash
npm run dev
```

With the example configuration, the API runs at:

`http://localhost:5000`

Health check:

`http://localhost:5000/api/health`

### 5. Configure and Start the Frontend

Open a separate terminal from the project root:

```bash
cd client
npm install
```

Create a `.env.local` file inside `client`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

### 6. Login

Use the admin email and password configured through `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

For an author account, use an email from the supplied seed dataset and the password configured through `SEED_AUTHOR_PASSWORD`.

## Validation

The frontend lint and production build were verified during development:

```bash
cd client
npm run lint
npm run build
```

The primary author and admin workflows and API routes were also exercised manually during development using Postman.

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API health check |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Retrieve the current user |
| POST | `/api/auth/refresh` | Refresh the session |
| POST | `/api/auth/logout` | End the session |
| GET | `/api/author/books` | Retrieve author books |
| POST | `/api/tickets` | Create a support ticket |
| GET | `/api/tickets` | List the current author's tickets |
| GET | `/api/tickets/:id` | Retrieve ticket details |
| GET | `/api/admin/tickets` | List and filter support tickets |
| PATCH | `/api/admin/tickets/:id` | Update ticket properties |
| POST | `/api/admin/tickets/:id/assign-to-me` | Assign a ticket to the current admin |
| POST | `/api/admin/tickets/:id/messages` | Add a public response or internal note |

Admin-only routes require appropriate authentication and authorization. See the source code for the complete route definitions and supported query parameters.

## Assumptions and Limitations

- Seed credentials are configured through environment variables instead of hardcoded passwords.
- AI-generated classifications and drafts are suggestions and should be reviewed by an administrator before sending a response.
- Ticket creation is designed to remain available when AI processing fails, allowing support staff to handle the ticket manually.
- File attachment selection is represented in the UI, but actual file uploading and server-side attachment storage are not implemented.
- The application requires a configured PostgreSQL database and valid environment variables to run successfully.

## Repository

GitHub: https://github.com/jhasaurav97/bookleaf-author-support-portal
