# Prumo Billing Trial

Prumo Billing Trial is a public portfolio-ready demo version of the Financial SaaS project.

It showcases a full-stack billing and financial operations product built with React, Rails API, PostgreSQL and Docker. The trial environment is isolated from the main project and includes fictional seed data for customers, products, coupons, invoices and cancellation history.

## Stack

- Backend: Ruby on Rails API
- Frontend: React with Vite
- Database: PostgreSQL
- Cache/queue support: Redis
- Local infrastructure: Docker Compose

## Main Features

- Secure login with token-based sessions
- Role-based access control: Administrator, Finance and Sales
- Customer records with unique identifiers
- Product and service catalog
- Coupon management
- Invoice generation with billing periods, due dates and discounts
- Invoice status flow: open, paid, canceled and overdue
- Service cancellation scheduling and reactivation
- Customer billing and service history
- Secure PDF document upload for customer files
- Dashboard with financial indicators and cash-flow insights
- Portuguese and English frontend language switcher

## Local Ports

- Frontend: `http://localhost:4010`
- Backend Rails API: `http://localhost:3010`
- PostgreSQL Docker: `localhost:5440`
- Redis Docker: `localhost:6380`

## Demo Login

- Username: `dev-prumo`
- Password: `Prumo2026!Admin#`

## Local Setup

Start PostgreSQL and Redis:

```powershell
docker compose up -d db redis
```

Prepare and run the backend:

```powershell
cd backend
$env:POSTGRES_PORT="5440"
$env:POSTGRES_PASSWORD="postgres"
bundle install
bundle exec rails db:create db:migrate db:seed
bundle exec rails server -p 3010
```

Prepare and run the frontend in another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:4010`.

## Seed Data

The seed creates:

- administrator user `dev-prumo`;
- products `Plano Starter`, `Plano Basic` and `Plano Enterprise`;
- coupons `TRIAL10` and `WELCOME50`;
- fictional individual and company customers;
- open, paid, overdue and canceled invoices;
- a scheduled cancellation event for customer history validation.

## Security Notes

This trial includes token-based sessions, role-based authorization, secured PDF upload validation, safer production defaults and sanitized seed behavior. It is intended for portfolio demonstration and should not be used with real personal, financial or tax data.

## Notes

This environment uses fictional data only. Do not use real documents, real tax IDs, customer personal data, secrets or production credentials here.