# KYC Admin Portal

Monorepo for the Full-Stack take-home assessment covering customer onboarding, KYC review, subscription management, and simulated payment webhooks.

## Apps

- `backend-api/` - Express + TypeScript + Prisma API
- `frontend/` - React + TypeScript admin and customer portal
- `docker-compose.yml` - local full-stack run for web, API, and Postgres

## Quick Start

From the repository root:

```bash
docker-compose up --build
```

App URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Swagger: `http://localhost:4000/docs`

Bootstrap admin credentials:

- Email: `admin@fonu.test`
- Password: `Password123`

If no admin exists in the database, the backend creates this admin automatically on startup.

## Design Notes

- Kept the backend explicit and lightweight: route/controller-per-domain with Prisma for migrations and schema consistency.
- Stored webhook events and audit logs separately so operational debugging does not depend on application logs.
- Used a dedicated subscription-plan catalog so admins can manage plan definitions and users only choose from valid plans.
- Preserved historical subscription records for auditability, while simplifying the customer portal to show only the current actionable subscription state.
- With more time, I would add stronger test coverage around plan management and webhook edge cases, improve admin feedback/toasts across all flows, and add first-login password reset for seeded or admin-generated accounts.

## More Information

For implementation details:

- Backend setup, API details, env vars, and webhook examples: [backend-api/README.md](/Users/rasheed/Documents/codehub/jobs/fonu/kyc-admin/backend-api/README.md)
- Frontend routes and local run notes: [frontend/README.md](/Users/rasheed/Documents/codehub/jobs/fonu/kyc-admin/frontend/README.md)
