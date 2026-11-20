# BHUcheck

## Setup

Requires Node.js 20 or newer and PostgreSQL.

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create the environment file:

   ```sh
   cp .env.example .env
   ```

   Set `DATABASE_URL` to your PostgreSQL connection string. Set
   `RATE_LIMIT_PEPPER` to a long random string. `STORAGE_DIR` is the directory
   for private uploads and reports.

3. Apply the schema and load the government source directory:

   ```sh
   npm run db:deploy
   npm run db:seed
   ```

4. Start the app:

   ```sh
   npm run dev
   ```

   Open http://localhost:3000.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```
