# StoicApp

A daily companion for Stoic philosophy — quotes, reflections, and journaling grounded in timeless wisdom.

## Tech Stack

| Layer      | Technology                                                                 |
| ---------- | -------------------------------------------------------------------------- |
| Frontend   | [Next.js](https://nextjs.org/) (App Router) + [React](https://react.dev/)  |
| Language   | TypeScript                                                                 |
| Database   | [SQLite](https://www.sqlite.org/) via [Prisma ORM](https://www.prisma.io/) |
| Auth       | [NextAuth.js](https://next-auth.js.org/)                                   |
| Styling    | Tailwind CSS v4                                                            |
| Linting    | ESLint (via `eslint-config-next`)                                          |
| Formatting | Prettier                                                                   |
| CI         | GitHub Actions                                                             |
| Deployment | [Vercel](https://vercel.com/)                                              |

## Project Structure

```
StoicApp/
├── app/               # Next.js App Router pages & layouts
│   ├── api/           # API route handlers
│   ├── layout.tsx     # Root layout (fonts, metadata)
│   ├── page.tsx       # Home page
│   └── globals.css    # Global styles
├── __tests__/         # Vitest unit & integration tests
├── components/        # Shared React components
├── lib/               # Shared server-side utilities (auth, Prisma client)
├── prisma/
│   └── schema.prisma  # Database schema (SQLite)
├── types/             # Shared TypeScript types & enums
├── public/            # Static assets
├── .github/
│   └── workflows/
│       └── ci.yml     # GitHub Actions CI workflow
├── .env.example       # Example environment variables (copy to .env.local)
├── .prettierrc        # Prettier configuration
├── eslint.config.mjs  # ESLint configuration
├── next.config.ts     # Next.js configuration
├── tailwind.config.*  # Tailwind CSS configuration
├── tsconfig.json      # TypeScript configuration
└── vercel.json        # Vercel deployment configuration
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- npm v10 or later

No database installation is required — the app uses **SQLite**, a lightweight, file-based database that is created automatically when you first push the schema.

### Installation

```bash
# Clone the repository
git clone https://github.com/adam-c-white/StoicApp.git
cd StoicApp

# Install dependencies (also auto-generates the Prisma client)
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and set NEXTAUTH_SECRET to a random string:
#   openssl rand -base64 32

# Create the database and apply the schema (creates dev.db automatically)
npm run db:push

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command                | Description                                   |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Start the development server                  |
| `npm run build`        | Build the app for production                  |
| `npm run start`        | Start the production server                   |
| `npm run lint`         | Run ESLint                                    |
| `npm run format`       | Format all files with Prettier                |
| `npm run format:check` | Check formatting without writing files        |
| `npm test`             | Run the test suite                            |
| `npm run test:watch`   | Run tests in watch mode                       |
| `npm run db:push`      | Push the Prisma schema to the SQLite database |
| `npm run db:studio`    | Open Prisma Studio (visual DB browser)        |

## Database

The app uses **SQLite** — a file-based, zero-configuration database. The database file (`dev.db`) is created automatically in the project root when you run `npm run db:push`. It is excluded from version control via `.gitignore`.

### Why SQLite?

- **No installation required** — works out-of-the-box on Linux, macOS, and Windows
- **Cross-platform** — single file that can be copied or backed up easily
- **Sufficient performance** for local and small-scale production workloads
- **Simplified onboarding** — contributors can run the app with `npm install` + `npm run db:push`

## Continuous Integration

GitHub Actions runs automatically on every push to `main` and on every pull request:

1. **Check formatting** — Prettier format check
2. **Lint** — ESLint
3. **Build** — Next.js production build

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml) for the workflow definition.

## Deployment

The app is deployed on [Vercel](https://vercel.com/) for cost-effective hosting. To deploy your own instance:

1. Fork this repository
2. Import the repo in the [Vercel dashboard](https://vercel.com/new)
3. Set the required environment variables in Vercel:
   - `DATABASE_URL` — SQLite is ideal for development and low-traffic deployments.
     For production workloads with concurrent writes or high traffic, consider
     switching to a hosted database (e.g. [PlanetScale](https://planetscale.com/),
     [Neon](https://neon.tech/), or [Supabase](https://supabase.com/)) and updating
     the Prisma provider accordingly.
   - `NEXTAUTH_SECRET` — a random secret string
   - `NEXTAUTH_URL` — your production domain
4. Vercel auto-detects Next.js and deploys on every push to `main`

> **SQLite production note:** SQLite is an excellent choice for development and
> single-instance deployments. For production environments that require concurrent
> write access, replication, or horizontal scaling, a client-server database such
> as PostgreSQL is recommended.

## Contributing

1. Fork the repo and create a feature branch from `main`
2. Run `npm install` to set up your local environment
3. Copy `.env.example` to `.env.local` and fill in the values
4. Run `npm run db:push` to initialise the local database
5. Make your changes, ensuring code is linted and formatted:
   ```bash
   npm run lint
   npm run format
   ```
6. Open a pull request — CI will run automatically

## Project Goals

- Deliver daily Stoic quotes and reflections
- Provide a minimal journaling experience
- Keep infrastructure costs as low as possible (free tier hosting)
- Maintain high code quality through automated linting, formatting, and CI

## License

MIT
