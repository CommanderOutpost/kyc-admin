# KYC Admin Backend API

Express + TypeScript + Prisma backend for the subscriptions and KYC admin assessment.

## Implemented Features

- JWT authentication with roles (`ADMIN`, `USER`)
- Password hashing with bcrypt
- Customer onboarding and search
- KYC submit/approve/reject workflow
- Subscription creation/list/cancel workflow
- Auth rate limiting on register/login endpoints
- Payment webhook handler with HMAC signature validation
- Webhook event persistence for auditing
- Audit logs for admin and webhook actions
- Swagger/OpenAPI docs (`/docs`, `/docs.json`)
- TypeScript unit tests for auth/KYC/subscription/webhook logic

## API Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Customers (Admin)

- `POST /customers`
- `GET /customers?search=<name-or-email>`
- `GET /customers/:id`

### KYC

- `POST /customers/:id/kyc/submit` (Admin or linked user)
- `POST /customers/:id/kyc/approve` (Admin)
- `POST /customers/:id/kyc/reject` (Admin)

### Subscriptions

- `POST /customers/:id/subscriptions` (Admin)
- `GET /customers/:id/subscriptions` (Admin or linked user)
- `POST /subscriptions/:id/cancel` (Admin)

### Webhooks

- `POST /webhooks/payments`
- `GET /webhooks/events` (Admin)

### Audit + Docs

- `GET /audit-logs` (Admin)
- `GET /docs`
- `GET /docs.json`

## Business Rules

- Subscriptions are created as `INACTIVE`.
- `payment.success` only activates a subscription when customer KYC is `APPROVED`.
- `payment.failed` sets subscription to `PAST_DUE`.
- `subscription.canceled` sets subscription to `CANCELED`.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Apply migrations:

```bash
npm run prisma:deploy
```

5. Run API in dev mode:

```bash
npm run dev
```

API base URL: `http://localhost:4000`

Swagger UI: `http://localhost:4000/docs`

## Docker (API + PostgreSQL)

From repository root:

```bash
docker compose up --build
```

## Testing

```bash
npm test
```

Current tests: 7

## Environment Variables

- `DATABASE_URL`
- `JWT_SECRET`
- `WEBHOOK_SECRET`
- `BCRYPT_ROUNDS`
- `AUTH_RATE_LIMIT_WINDOW_MS` (default: `900000`)
- `AUTH_RATE_LIMIT_MAX` (default: `10`)

## Seed Credentials (example)

If no `ADMIN` user exists, the backend auto-creates one on startup:

- Admin: `admin@fonu.test` / `Password123`

You can override the bootstrap admin credentials with:

- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`

Additional users can still be created via API:

- User: `user@fonu.test` / `Password123`

Register examples:

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fonu.test","password":"Password123","role":"ADMIN"}'

curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@fonu.test","password":"Password123","role":"USER"}'
```

## Webhook Trigger Examples

Signature creation uses HMAC SHA256 of the raw request body with `WEBHOOK_SECRET`.

Example payload:

```json
{"eventType":"payment.success","subscriptionId":"sub_id_here","paymentReference":"pay_123"}
```

Create signature:

```bash
body='{"eventType":"payment.success","subscriptionId":"sub_id_here","paymentReference":"pay_123"}'
sig=$(printf '%s' "$body" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')
```

Send webhook:

```bash
curl -X POST http://localhost:4000/webhooks/payments \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $sig" \
  -d "$body"
```

## Design Notes

- Kept architecture lightweight and explicit: controller-per-domain + middleware for auth/validation/errors.
- Prisma used for schema consistency and migration portability.
- Webhook events are stored even when signature validation fails for audit visibility.
- Added explicit audit log persistence for operational actions (customer creation, KYC approval/rejection, subscription creation/cancel, webhook processing).
- Added rate limiting to auth endpoints to reduce brute-force attempts.
