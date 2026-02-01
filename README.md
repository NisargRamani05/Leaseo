# Rental Management System

A full-featured Rental Management System that enables businesses to rent products online while managing quotations, rental orders, inventory, invoicing, pickups, returns, and reporting.

This project supports Customers, Vendors, and Admins and provides a complete rental lifecycle: product browsing → quotation creation → order confirmation → payment → invoicing → pickup → return.

---

## Problem Overview
Businesses need a reliable way to rent products online while preventing overbooking, handling time-based pricing, and managing the full rental lifecycle. This system implements the end-to-end flow while exposing dashboards and reports for operational insights.

## Objectives
- Implement an end-to-end rental flow (Quotation → Order → Invoice → Return)
- Prevent overbooking through reservation logic
- Support flexible rental durations and time-based pricing
- Generate invoices (partial or full payments) and track payments
- Provide dashboards and exportable reports for business insights

## User Roles
- **Customer**: Browse products, create quotations, confirm orders, pay, view invoices and order history
- **Vendor**: Manage rental products, process orders, create invoices, track pickups & returns
- **Admin**: Manage system settings, vendors, products, and view global analytics & reports

## Core Modules
1. **Authentication & User Management**
   - Email/password login and signup
   - Signup requires name, email, company, GSTIN (for invoicing), password
   - Forgot password and verification workflows
   - Coupon support during signup (optional)

2. **Rental Product Management**
   - Mark products as rentable and set inventory
   - Pricing by period: Hour / Day / Week / Custom
   - Quantity on hand, cost & sales price, publish/unpublish
   - Product attributes, variants, and configurable attribute values

3. **Quotations & Rental Orders**
   - Quotation: created from cart and editable until confirmation
   - Order: created upon quotation confirmation and reserves stock
   - Order lifecycle: Draft → Sent → Confirmed
   - Rules:
     - Reservation prevents double-booking
     - Rental dates block availability
     - Order lines include rental period dates

4. **Pickup, Delivery & Return**
   - Pickup document generated on confirmation; stock moves to "With Customer"
   - Return document and stock restoration on return
   - Late return fees and automated reminders/alerts

5. **Invoicing & Payments**
   - Draft invoices from orders
   - Support full, partial, and security deposit payments
   - Tax calculation, print/export invoice, payment gateway integration
   - Payment confirmation updates invoice and order states

6. **Website & Customer Portal**
   - Product listing with filters and detail pages
   - Cart and checkout flow (address + payment selection)
   - Customer portal for orders, invoices, and status tracking

7. **Settings & Configuration**
   - Rental period definitions (Hourly, Daily, Weekly, Custom)
   - Product attributes & values, role management, GST/company details
   - User profile with company and GSTIN

8. **Reports & Dashboards**
   - Dashboards: revenue, most-rented products, vendor-wise performance, order trends
   - Reports exportable to PDF / XLSX / CSV with date-range filters

## Terminology
- **Quotation**: Price proposal before order confirmation
- **Rental Order**: Confirmed rental agreement with reserved stock
- **Reservation**: Prevents simultaneous booking of the same product/time
- **Invoice**: Financial document requesting payment
- **Security deposit**: Upfront amount to cover damages/late fees

## Deliverables (Hackathon / MVP)
- Functional rental flow (Quotation → Order → Invoice → Return)
- Website + backend integration with role-based access control
- At least one dashboard/report demonstrating analytics
- Clean, role-separated UI aligned with business flow

## Tech Stack (recommended)
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS, ShadCN UI
- Backend: Next.js server actions / API routes
- Database: PostgreSQL (NeonDB or similar), Prisma ORM
- Auth: NextAuth (Auth.js)
- Validation: Zod
- Storage: Cloud storage for uploads (optional)
- Payments: Razorpay / Stripe integration

## Project Structure (suggested)
```
src/
├─ app/                # Next.js App Router pages
│  ├─ api/             # API endpoints (payment, auth, orders)
│  ├─ products/        # product listing & detail pages
│  ├─ cart/            # cart + quotation pages
│  ├─ checkout/        # address, payment, confirmation
│  └─ profile/         # user profile & notifications
├─ actions/            # server actions (cart, checkout, orders)
├─ components/         # UI components
├─ lib/                # utilities (db, email, payments, availability)
├─ prisma/             # schema.prisma & migrations
```

## Installation & Quick Start
1. Clone repo:
```bash
git clone <repo-url>
cd <repo>
```
2. Install dependencies:
```bash
npm install
```
3. Add `.env` (example):
```env
DATABASE_URL=postgres://user:pass@host:5432/dbname
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
```
4. Run migrations:
```bash
npx prisma migrate dev
```
5. Start dev server:
```bash
npm run dev
```
Open http://localhost:3000

## Implementation Notes
- Reservation logic is critical to prevent overbooking — use date-range reservations instead of decrementing inventory directly.
- Perform server-side validation for coupon usage, pricing, and availability (not trusting client-side inputs).
- Generate invoices as separate entities linked to orders; allow partial payments and security deposits.

## Mockup
- Reference mockup: https://link.excalidraw.com/l/65VNwvy7c4X/3tAPpflFLrG

## Contribution
- Fork → branch → PR. Follow linting and TypeScript checks, provide tests for core reservation and payment paths.

---

If you want, I can:
- Create a `README.rental.md` file in the repository (done),
- Scaffold initial routes & server actions for quotations and reservation logic, or
- Generate a small migration and seed data for testing reservations.

Which next step would you like me to take? 🔧