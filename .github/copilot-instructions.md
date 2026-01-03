# DepanceAPP - AI Coding Instructions

## Project Overview
Personal finance management API built with Express + Prisma + SQLite. Features multi-currency accounts, budgets, recurring transactions, and templates. Monorepo structure with `server/` (Express API), and planned `mobile/` client.

## Architecture & Key Patterns

### Database: Prisma with SQLite
- **Schema**: [`server/prisma/schema.prisma`](server/prisma/schema.prisma)
- **Singleton client**: Import from `server/src/utils/prisma.js` (single PrismaClient instance)
- **Cascade deletes**: User deletion cascades to all related entities (accounts, transactions, categories, budgets, recurring)
- **No soft deletes**: Direct deletion with CASCADE constraints

### Transaction Atomicity Pattern
**Critical**: All balance-changing operations MUST use Prisma `$transaction` to ensure data consistency.

```javascript
// Pattern used in transactionController, transferController, recurringController
await prisma.$transaction([
  prisma.transaction.create({ data: {...} }),
  prisma.account.update({ where: { id }, data: { balance: { increment: amount } } })
]);
```

Always pair transaction creation with account balance updates in atomic operations.

### Multi-Currency Architecture
- Each account stores its own `currency` field (USD, EUR, etc.)
- User has preferred `currency` for viewing
- **Currency conversion**: `server/src/utils/currencyService.js`
  - Uses `https://open.er-api.com/v6/latest/USD` (free, no API key)
  - 1-hour in-memory cache (`ratesCache`)
  - All conversions route through USD as base
- **Transfers between currencies**: Automatic conversion in `transferController.createTransfer()`
  - Creates two transactions with different amounts (original & converted)
  - Links via shared `transfer_id` (format: `sf-{timestamp}-{random}`)

### Authentication
- JWT tokens (Bearer scheme) via `authMiddleware.js`
- Decode provides `req.user.userId` for all protected routes
- All protected routes verify user ownership: `where: { user_id: userId }`

### Controller Patterns
1. **Authorization check**: Always verify ownership with `user_id` in WHERE clause
2. **Parsing**: Use `parseInt()` for IDs, `parseFloat()` for amounts from request body
3. **Type checking**: Transaction/recurring `type` field is `"income"` or `"expense"` (string literals)
4. **Error responses**: Return `{ error: message }` JSON with appropriate status codes

## Development Workflows

### Running the App
```bash
# Root: Run both server and mobile (future)
npm run dev

# Server only
npm run server  # or: cd server && npm run dev (uses nodemon)

# Tests (uses SQLite test database)
cd server && npm test
```

### Database Migrations
```bash
cd server
npx prisma migrate dev --name descriptive_name
npx prisma generate  # Regenerate client after schema changes
```

### Test Setup
- **Environment**: Jest with `NODE_ENV=test` (see `server/package.json`)
- **Setup/Teardown**: `server/tests/setup.js`
  - `beforeAll`: Connect to database
  - `afterEach`: Delete all test data in specific order (respects FK constraints)
  - `afterAll`: Disconnect
- **Auth**: Tests manually sign JWTs (see `transaction.test.js` lines 18-19)
- **Run in band**: `--runInBand` flag ensures sequential test execution (avoids DB conflicts)

## Project Conventions

### File Organization
- **Routes**: `server/src/routes/{resource}Routes.js` - express.Router() exported
- **Controllers**: `server/src/controllers/{resource}Controller.js` - exports named functions
- **Middleware**: `server/src/middleware/{name}Middleware.js`
- **Utilities**: `server/src/utils/` - shared services (prisma, currencyService)

### Naming Conventions
- Database columns: `snake_case` (e.g., `user_id`, `created_at`)
- JavaScript: `camelCase` for variables/functions, `PascalCase` for classes
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `BCRYPT_SALT_ROUNDS`, `CACHE_DURATION`)
- Table names: Singular in Prisma schema (`User`, `Transaction`)

### Route Structure
All routes require authentication except `/auth/register` and `/auth/login`:
- `/transactions` - CRUD for transactions
- `/accounts` - Account management
- `/transfers` - Cross-account transfers (handles currency conversion)
- `/templates` - Reusable transaction templates
- `/categories` - User-defined income/expense categories
- `/budgets` - Monthly/period budgets with spending tracking
- `/recurring` - Scheduled recurring transactions

### Budget Calculation Pattern
Budgets calculate "spent" by aggregating transactions from start of current period (see `budgetController.getBudgets()`):
```javascript
const startOfMonth = new Date();
startOfMonth.setDate(1);
startOfMonth.setHours(0, 0, 0, 0);
const aggregations = await prisma.transaction.aggregate({
  _sum: { amount: true },
  where: { user_id, created_at: { gte: startOfMonth }, type: 'expense', category_id }
});
```

## Critical Implementation Rules
1. **Never mutate account balance without Prisma transaction wrapper**
2. **Always verify user ownership** before operations (check `user_id` in WHERE)
3. **Handle currency conversion** for cross-account operations
4. **Link transfer pairs** with matching `transfer_id` field
5. **Test with Jest in-band** to avoid SQLite concurrency issues
6. **Parse numeric inputs** from request body (everything arrives as strings)
7. **Use cascade deletes** - don't manually delete related entities when deleting users

## Environment Variables
Required in `server/.env`:
- `DATABASE_URL` - SQLite connection string (e.g., `file:./dev.db`)
- `JWT_SECRET` - Token signing secret
- `PORT` - Server port (default: 3000)
- `ALLOWED_ORIGINS` - Comma-separated CORS origins (optional)
- `CLIENT_URL` - Frontend URL for CORS (optional)

## Common Gotchas
- Transfer creates TWO transactions (expense from source, income to destination)
- Currency conversion is async - await `convertCurrency()` calls
- Recurring transactions don't auto-execute - need scheduler implementation
- SQLite doesn't support concurrent writes - tests run with `--runInBand`
- Account types are stored as strings (`"normal"`, `"savings"`) - not enforced at DB level
