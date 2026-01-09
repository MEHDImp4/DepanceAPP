# DepanceAPP - AI Coding Instructions
# DepanceAPP — Copilot / AI Agent Instructions

Purpose: short, precise rules and file references so an AI coding agent can be productive immediately.

Overview
- Monorepo: `server/` contains the Express API (Prisma + SQLite). `client/` is a Vite React app. `mobile/` planned.
- Core concepts: multi-currency accounts, atomic balance updates, user-scoped resources, recurring transactions, templates.

Quick references (concrete files)
- Prisma schema: [server/prisma/schema.prisma](server/prisma/schema.prisma)
- Singleton Prisma client: [server/src/utils/prisma.js](server/src/utils/prisma.js)
- Currency service: [server/src/utils/currencyService.js](server/src/utils/currencyService.js)
- Transfer logic (currency + transfer_id): [server/src/controllers/transferController.js](server/src/controllers/transferController.js)
- Transaction patterns: [server/src/controllers/transactionController.js](server/src/controllers/transactionController.js)
- Test setup & teardown: [server/tests/setup.js](server/tests/setup.js)
- Root start: `npm run dev` (runs server+client via `concurrently`) — see [package.json](package.json)

Critical coding rules (do not change)
- Always use `prisma.$transaction([...])` for any operation that creates/deletes a `Transaction` and updates an `Account` balance. See `transactionController.createTransaction` and `transferController.createTransfer` for the canonical examples.
- Verify user ownership on all protected DB reads/writes by including `user_id` in `where` clauses (pattern used across controllers).
- Parse incoming numeric strings explicitly (`parseInt`, `parseFloat`) before DB writes.
- Transfers create TWO `Transaction` rows (expense + income) linked by `transfer_id` (format: `sf-{timestamp}-{random}`) — preserve this convention.

Currency & conversion notes
- `convertCurrency(amount, from, to)` lives in [server/src/utils/currencyService.js](server/src/utils/currencyService.js). It uses `https://open.er-api.com/v6/latest/USD` and has a 1-hour in-memory cache; all conversions route through USD.
- The `validCurrencies` array in the same file is the primary place to check supported currencies.
- When presenting transactions to users, controllers convert per-account amounts into the user's preferred `currency` (see `transactionController.getTransactions`).

Testing & DB workflow
- Tests run in `server` with Jest. Use `npm test` from `server/` or `npm run server` from root for dev server. Jest is configured to run `./tests/setup.js`.
- Tests use SQLite and rely on sequential execution: use `--runInBand` (already set in `server/package.json`).
- Use `npx prisma migrate dev --name <desc>` and `npx prisma generate` when schema changes are required.

Project-specific patterns & gotchas
- No soft deletes: schema relies on cascade deletes in relations. Deleting a `User` cascades. See `schema.prisma` relations.
- Account `type` values are stored as plain strings (e.g., `"normal"`, `"savings"`) — code expects these literal values.
- Budget calculations aggregate `Transaction` amounts from a period start (see `budgetController.getBudgets` pattern in repository).
- Recurring entries are scheduled records (`RecurringTransaction`) and do not auto-run — adding a scheduler is outside current scope.

When editing code
- Keep edits minimal and consistent with existing controllers' style (commonjs modules, error JSON `{ error: message }`).
- When adding balance changes, mirror the two-step pattern: create transaction record + update account balance inside a single `prisma.$transaction` call.
- If modifying currency behavior, update both `currencyService.js` and places that call `convertCurrency` (transactions, transfers, reporting).

Suggested tasks for an AI agent
- Fix: Prefer root-level small, targeted patches that preserve API behavior.
- Tests: Run `cd server && npm test -- --runInBand` after changes that affect DB logic.
- Migrations: After schema edits update Prisma with `npx prisma migrate dev` and `npx prisma generate`.

If anything is unclear or you want expansions (e.g., more controller examples, a checklist for PRs, or a runnable dev guide), tell me which section to expand.
