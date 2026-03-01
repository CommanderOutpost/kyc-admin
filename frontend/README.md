# KYC Admin Frontend

React + TypeScript frontend for admin operations and customer portal.

## Run locally

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

If needed, set API URL:

```bash
cp .env.example .env
```

## Implemented pages

- `/login` : authentication
- `/admin` : admin dashboard
  - customer list + search
  - create customer
  - customer details
  - submit/approve/reject KYC
  - create/cancel subscription
  - webhook events preview
  - audit logs preview
- `/portal` : user portal
  - own profile
  - KYC status
  - subscription status

## Notes

- Auth uses JWT from backend and stores token in localStorage.
- Role-based route guards redirect users to the right page.
- API base URL defaults to `http://localhost:4000`.
