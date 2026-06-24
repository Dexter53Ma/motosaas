# MotoRent Implementation Issues

## Issue 1: Project Setup & Infrastructure
**Blocked by:** None
**User stories covered:** 33, 34, 35, 36, 37

### What to build
Set up the Next.js project with Supabase integration, authentication, and basic project structure. Create the multi-tenant foundation with Row-Level Security.

### Acceptance criteria
- [ ] Next.js 14+ project created with App Router, TypeScript, Tailwind CSS
- [ ] Supabase project configured with connection strings
- [ ] Supabase Auth configured with email/password sign-up and sign-in
- [ ] Database schema created with `tenants` and `users` tables
- [ ] RLS policies implemented for tenant isolation on `tenants` and `users` tables
- [ ] Basic login/signup pages functional
- [ ] Environment variables configured for Supabase
- [ ] Project deploys to Netlify successfully

---

## Issue 2: Tenant Management & Onboarding
**Blocked by:** Issue 1
**User stories covered:** 33, 37, 42, 43, 44, 45, 46, 47

### What to build
Complete tenant onboarding flow: registration, shop setup, free trial management, and subscription tracking.

### Acceptance criteria
- [ ] Registration form captures shop name, owner name, email, phone, address
- [ ] New tenants created with `subscription_status = 'trial'` and `trial_ends_at = now() + 30 days`
- [ ] Dashboard shows trial countdown (days remaining)
- [ ] Shop settings page allows editing: name, logo, contact info, tax ID, RC number
- [ ] Role-based access: Owner can manage settings, Manager/Staff cannot
- [ ] Tenant data fully isolated via RLS on all subsequent tables
- [ ] Onboarding wizard guides new users through initial setup

---

## Issue 3: Vehicle Inventory Management
**Blocked by:** Issue 2
**User stories covered:** 15, 16, 17, 18, 19, 96, 97, 98

### What to build
Complete vehicle management: add vehicles, track status, manage photos, view availability calendar.

### Acceptance criteria
- [ ] Vehicle creation form: make, model, year, VIN, license plate, color, mileage, purchase price, fuel type
- [ ] Vehicle list with search, filter by status, sort by various fields
- [ ] Vehicle status management: available, rented, maintenance, retired
- [ ] Vehicle photo upload and gallery (multiple photos per vehicle)
- [ ] Availability calendar view showing which vehicles are booked on which dates
- [ ] Vehicle detail page showing full info, photos, rental history, maintenance history
- [ ] RLS ensures each tenant sees only their vehicles
- [ ] Total fleet value calculated and displayed

---

## Issue 4: Customer Database
**Blocked by:** Issue 2
**User stories covered:** 20, 21, 22, 23, 24, 83, 84, 141

### What to build
Customer management with search, tagging, notes, and communication history.

### Acceptance criteria
- [ ] Customer creation form: name, phone, email, ID number, address
- [ ] Customer list with search by name or phone number
- [ ] Customer tags: VIP, blacklisted, regular
- [ ] Internal notes on customer profiles (staff only, not visible to customer)
- [ ] Customer detail page showing full rental/payment history
- [ ] Communication history timeline (WhatsApp messages with this customer)
- [ ] Basic natural language search for customers
- [ ] RLS ensures each tenant sees only their customers

---

## Issue 5: Rental Management Core
**Blocked by:** Issues 3, 4
**User stories covered:** 8, 9, 10, 11, 12, 13, 14, 99, 100, 101

### What to build
Core rental workflow: create booking, assign vehicle, process return, handle checklists.

### Acceptance criteria
- [ ] Rental creation: select customer, select vehicle, set dates, set daily rate
- [ ] Vehicle availability check prevents double-booking
- [ ] Checkout checklist: fuel level, mileage, exterior condition, interior condition, photos
- [ ] Return checklist: compare with checkout, record new fuel/mileage, note damages
- [ ] Automatic late fee calculation for overdue returns
- [ ] WhatsApp confirmation sent on booking
- [ ] WhatsApp receipt sent on return with payment
- [ ] Rental status tracking: active, completed, overdue
- [ ] Dashboard shows today's expected returns and new bookings

---

## Issue 6: Payment Tracking & Invoicing
**Blocked by:** Issue 5
**User stories covered:** 25, 26, 27, 28, 29, 47, 48, 93

### What to build
Payment recording, invoice generation, receipt generation, and TVA calculation.

### Acceptance criteria
- [ ] Payment recording: amount, method (cash/card/bank transfer/mobile money), reference, notes
- [ ] Invoice generation with shop branding (logo, name, tax ID, RC number)
- [ ] TVA calculation at 20% on invoices
- [ ] Receipt generation for completed payments
- [ ] Send invoices/receipts via WhatsApp (PDF or image)
- [ ] Invoice status tracking: draft, sent, paid, overdue
- [ ] Payment history per customer and per rental
- [ ] Basic revenue dashboard: total revenue, outstanding payments, overdue amount

---

## Issue 7: WhatsApp Integration
**Blocked by:** Issue 6
**User stories covered:** 38, 39, 40, 41, 61, 62, 63, 64

### What to build
WhatsApp Web integration via whatsapp-web.js: connection, message sending, message receiving, templates.

### Acceptance criteria
- [ ] WhatsApp connection flow: QR code display, scan to connect
- [ ] Connection status indicator on dashboard (connected/disconnected)
- [ ] Reconnect button when disconnected
- [ ] Send WhatsApp messages from the platform
- [ ] Receive and store incoming WhatsApp messages
- [ ] Message templates for: payment reminder, booking confirmation, receipt
- [ ] Message delivery status tracking (sent, delivered, failed)
- [ ] Manual message sending to specific customers
- [ ] Session persistence across server restarts

---

## Issue 8: Payment Reminders
**Blocked by:** Issue 7
**User stories covered:** 1, 2, 3, 4, 5, 6, 7, 138, 139

### What to build
Automated WhatsApp payment reminders with scheduling and tracking.

### Acceptance criteria
- [ ] Reminder rules: before due date (3 days), on due date, after due date (1 day, 7 days)
- [ ] Automatic reminder sending via WhatsApp at scheduled times
- [ ] Customizable reminder messages (Arabic and French)
- [ ] Reminder delivery status tracking
- [ ] Option to disable reminders per customer
- [ ] Manual reminder sending for edge cases
- [ ] AI-powered optimal send time based on customer behavior
- [ ] Reminder history view per customer/rental

---

## Issue 9: Reporting Dashboard (Basic)
**Blocked by:** Issue 6
**User stories covered:** 29, 30, 31, 32, 61, 62, 63, 64

### What to build
Basic reporting: revenue, overdue payments, fleet utilization, export capabilities.

### Acceptance criteria
- [ ] Dashboard with key metrics: total revenue, outstanding, overdue, fleet utilization
- [ ] Daily/weekly/monthly revenue reports
- [ ] Overdue payments report with customer details
- [ ] Rental income vs POS income breakdown (basic)
- [ ] Filter by date range, vehicle, customer
- [ ] Export to CSV
- [ ] Export to PDF for financial reports
- [ ] Vehicle profitability view (basic)

---

## Issue 10: Admin Dashboard
**Blocked by:** Issue 2
**User stories covered:** 69

### What to build
Admin panel for managing tenants, activating/deactivating shops based on payment.

### Acceptance criteria
- [ ] Admin authentication (separate from shop users)
- [ ] Tenant list with subscription status, trial end date
- [ ] Activate/deactivate tenants manually
- [ ] View tenant details and subscription history
- [ ] Basic platform metrics (total tenants, active, trial, expired)

---

## Issue 11: Multi-Language UI (Arabic/French)
**Blocked by:** Issue 2
**User stories covered:** 90, 95

### What to build
Bilingual UI with Arabic (RTL) and French support.

### Acceptance criteria
- [ ] i18n setup with Arabic and French translation files
- [ ] Language switcher in settings/header
- [ ] RTL layout support for Arabic
- [ ] All UI text translated to both languages
- [ ] Date/number formatting for Moroccan locale
- [ ] Moroccan holidays marked on calendar

---

## Issue 12: Mobile Responsive Design
**Blocked by:** Issue 2
**User stories covered:** 91, 96

### What to build
Ensure all pages work well on mobile devices.

### Acceptance criteria
- [ ] All pages responsive from 320px to 1440px
- [ ] Touch-friendly UI elements (buttons, inputs)
- [ ] Mobile-optimized navigation
- [ ] POS interface works on tablet
- [ ] Calendar view works on mobile
- [ ] Photo upload works on mobile

---

## Issue 13: Vehicle Handover Checklist
**Blocked by:** Issue 5
**User stories covered:** 99, 100, 101

### What to build
Standardized checklists for vehicle checkout and return with photo attachment.

### Acceptance criteria
- [ ] Configurable checklist items (fuel, mileage, exterior, interior, accessories)
- [ ] Photo attachment for each checklist item
- [ ] Checkout checklist required before marking rental as active
- [ ] Return checklist required before completing rental
- [ ] Comparison view: checkout vs return side-by-side
- [ ] Checklist history per vehicle

---

## Issue 14: Loan Tracking
**Blocked by:** Issue 5
**User stories covered:** 48, 49, 50, 51, 52, 53, 54

### What to build
Loan management: create loans, track installments, record payments, calculate default risk.

### Acceptance criteria
- [ ] Loan creation: customer, vehicle, total amount, interest rate, installment count, start date
- [ ] Automatic installment schedule generation
- [ ] Track each installment: paid, pending, overdue
- [ ] Record partial payments against loans
- [ ] Total outstanding amount across all active loans
- [ ] Mark loan as defaulted
- [ ] Loan performance report by customer
- [ ] WhatsApp reminders for loan installments

---

## Issue 15: POS System
**Blocked by:** Issue 6
**User stories covered:** 55, 56, 57, 58, 59, 60

### What to build
Point of sale for selling parts and accessories.

### Acceptance criteria
- [ ] Product catalog with categories, prices, stock levels
- [ ] POS interface: product grid, search, cart, checkout
- [ ] Cash and card (manual) payment acceptance
- [ ] Receipt generation and WhatsApp sending
- [ ] Stock management with low-stock alerts
- [ ] POS sales tracked in revenue reports
- [ ] Touch-friendly interface for tablet use

---

## Issue 16: Customer Reputation & Ratings
**Blocked by:** Issue 5
**User stories covered:** 70, 71, 72

### What to build
Customer rating system after each rental.

### Acceptance criteria
- [ ] Rate customers after rental: payment reliability, vehicle care, communication
- [ ] Overall score calculation
- [ ] Customer rating history visible on profile
- [ ] Auto-blacklist suggestion for consistently poor ratings
- [ ] Use ratings in vehicle recommendation engine

---

## Issue 17: Late Fee Automation
**Blocked by:** Issue 5
**User stories covered:** 73, 74, 75

### What to build
Automatic late fee calculation with configurable rules.

### Acceptance criteria
- [ ] Late fee rules: amount per day, grace period
- [ ] Automatic calculation on return
- [ ] Configurable grace period (e.g., 2 hours free)
- [ ] Display calculated fees to staff before processing
- [ ] Override capability for special cases

---

## Issue 18: Document Storage
**Blocked by:** Issue 4
**User stories covered:** 76, 77, 136, 137

### What to build
Upload and store customer documents (IDs, licenses, contracts) with OCR.

### Acceptance criteria
- [ ] Document upload for customers (ID card, driving license, contract)
- [ ] Document storage in Supabase Storage
- [ ] Document access per customer/rental
- [ ] AI-powered OCR to extract info from uploaded documents
- [ ] OCR data validation against expected formats
- [ ] Document type categorization

---

## Issue 19: Audit Log
**Blocked by:** Issue 2
**User stories covered:** 80

### What to build
Track all system actions for accountability.

### Acceptance criteria
- [ ] Log all create/update/delete operations
- [ ] Log user actions (login, logout, password change)
- [ ] Log WhatsApp message sends
- [ ] Filter by user, action type, date range
- [ ] View details of each action
- [ ] Export audit log

---

## Issue 20: Communication History
**Blocked by:** Issue 7
**User stories covered:** 78, 79

### What to build
Unified view of all customer communications.

### Acceptance criteria
- [ ] Timeline view of all WhatsApp messages with a customer
- [ ] Internal notes on customer profiles (not visible to customer)
- [ ] Staff can share context via internal notes
- [ ] Search within communication history

---

## Issue 21: Insurance & Permit Tracking
**Blocked by:** Issue 3
**User stories covered:** 102, 103, 104, 105

### What to build
Track vehicle insurance and registration expiry with reminders.

### Acceptance criteria
- [ ] Insurance record per vehicle: provider, policy number, dates, cost, document
- [ ] Registration expiry tracking per vehicle
- [ ] Automatic reminders before expiry
- [ ] Document storage for insurance/registration papers
- [ ] Dashboard alerts for expiring documents

---

## Issue 22: Deposit Management
**Blocked by:** Issue 5
**User stories covered:** 106, 107, 108

### What to build
Track security deposits taken and refunded.

### Acceptance criteria
- [ ] Record deposit at checkout
- [ ] Process full/partial refunds at return
- [ ] Track deposit status: held, refunded, partial
- [ ] Total deposits held across active rentals
- [ ] Deposit report and history

---

## Issue 23: Dynamic Pricing Engine
**Blocked by:** Issue 5
**User stories covered:** 109, 110, 111

### What to build
Configurable pricing rules for seasonal, weekly, and monthly discounts.

### Acceptance criteria
- [ ] Pricing rules: seasonal (peak/off-peak), weekly discount, monthly discount
- [ ] Last-minute discounts for idle vehicles
- [ ] Automatic price suggestion based on rules
- [ ] Override capability for manual pricing
- [ ] Pricing rules management interface

---

## Issue 24: Customer Loyalty Program
**Blocked by:** Issue 5
**User stories covered:** 112, 113, 114

### What to build
Track customer loyalty and offer automatic discounts.

### Acceptance criteria
- [ ] Loyalty points earned per rental
- [ ] Automatic discounts for repeat customers
- [ ] Birthday/anniversary WhatsApp messages
- [ ] Customer loyalty dashboard
- [ ] Loyalty tier system

---

## Issue 25: Fuel Tracking
**Blocked by:** Issue 5
**User stories covered:** 115, 116

### What to build
Track fuel levels and costs per vehicle.

### Acceptance criteria
- [ ] Record fuel level at checkout and return
- [ ] Calculate fuel used and charge accordingly
- [ ] Track fuel costs per vehicle
- [ ] Fuel cost reports
- [ ] Integrate with handover checklists

---

## Issue 26: Multi-Vehicle Bookings & Swaps
**Blocked by:** Issue 5
**User stories covered:** 117, 118, 121

### What to build
Handle multiple vehicle bookings and mid-rental swaps.

### Acceptance criteria
- [ ] Book multiple vehicles for same customer in one transaction
- [ ] Vehicle swap during rental period
- [ ] Vehicle availability notification queue
- [ ] Notify customers when vehicle becomes available
- [ ] Track swap history and reasons

---

## Issue 27: Refund Management
**Blocked by:** Issue 6
**User stories covered:** 119, 120

### What to build
Process and track refunds.

### Acceptance criteria
- [ ] Process refunds for overpayments or cancellations
- [ ] Full and partial refund support
- [ ] Refund report with reasons
- [ ] Link refunds to original payments
- [ ] Staff authorization for refunds

---

## Issue 28: AI - Document OCR
**Blocked by:** Issues 4, 18
**User stories covered:** 136, 137

### What to build
AI-powered extraction of information from uploaded documents.

### Acceptance criteria
- [ ] OCR for ID cards: extract name, number, expiry
- [ ] OCR for driving licenses: extract name, number, categories, expiry
- [ ] Validate extracted data against expected formats
- [ ] Store OCR results in customer document records
- [ ] Manual correction capability for OCR errors

---

## Issue 29: AI - Sentiment Analysis
**Blocked by:** Issue 7
**User stories covered:** 132, 133

### What to build
Analyze WhatsApp messages for customer satisfaction.

### Acceptance criteria
- [ ] Analyze inbound WhatsApp messages for sentiment
- [ ] Generate sentiment score per customer
- [ ] Flag customers with declining sentiment
- [ ] Suggest outreach to unhappy customers
- [ ] Sentiment history per customer

---

## Issue 30: AI - Smart Reminder Timing
**Blocked by:** Issue 8
**User stories covered:** 138, 139

### What to build
AI-optimized timing for payment reminders.

### Acceptance criteria
- [ ] Track when customers typically respond to messages
- [ ] Calculate optimal send time per customer
- [ ] Adjust reminder frequency based on behavior
- [ ] A/B test different timing strategies
- [ ] Show timing optimization metrics

---

## Issue 31: AI - Customer Churn Prediction
**Blocked by:** Issues 4, 5
**User stories covered:** 126, 127

### What to build
Predict which customers are likely to stop renting.

### Acceptance criteria
- [ ] Analyze rental frequency patterns
- [ ] Identify declining engagement signals
- [ ] Generate churn risk score per customer
- [ ] Suggest retention offers for at-risk customers
- [ ] Track churn prediction accuracy

---

## Issue 32: AI - Payment Default Prediction
**Blocked by:** Issue 14
**User stories covered:** 128, 129

### What to build
Predict which loan customers are likely to default.

### Acceptance criteria
- [ ] Analyze payment history patterns
- [ ] Consider customer rating and rental history
- [ ] Generate default risk score per loan
- [ ] Suggest credit limits for new customers
- [ ] Track prediction accuracy over time

---

## Issue 33: AI - Fraud & Anomaly Detection
**Blocked by:** Issue 6
**User stories covered:** 130, 131

### What to build
Detect unusual patterns in payments and rentals.

### Acceptance criteria
- [ ] Flag unusual payment patterns (multiple payments, large amounts)
- [ ] Flag suspicious rental patterns (very short, frequent swaps)
- [ ] Generate anomaly alerts for admin review
- [ ] Track flagged incidents and resolutions
- [ ] Learn from confirmed/false positive flags

---

## Issue 34: AI - Vehicle Recommendation Engine
**Blocked by:** Issues 3, 5
**User stories covered:** 134, 135

### What to build
AI-powered vehicle suggestions for customers.

### Acceptance criteria
- [ ] Recommend vehicles based on customer history
- [ ] Consider budget, preferences, past rentals
- [ ] Suggest alternatives when preferred vehicle unavailable
- [ ] Track recommendation acceptance rate
- [ ] Improve recommendations based on feedback

---

## Issue 35: AI - Predictive Maintenance
**Blocked by:** Issue 3
**User stories covered:** 122, 123

### What to build
AI predicts when vehicles need maintenance.

### Acceptance criteria
- [ ] Analyze mileage, age, usage patterns
- [ ] Predict optimal maintenance timing
- [ ] Generate maintenance alerts with confidence scores
- [ ] Compare predicted vs actual maintenance needs
- [ ] Improve predictions over time

---

## Issue 36: AI - Smart Pricing Recommendations
**Blocked by:** Issue 23
**User stories covered:** 124, 125

### What to build
AI suggests optimal rental prices.

### Acceptance criteria
- [ ] Analyze market rates, demand, seasonality
- [ ] Suggest price adjustments per vehicle
- [ ] Recommend when to discount vs hold firm
- [ ] Track revenue impact of AI pricing suggestions
- [ ] Allow manual override of AI suggestions

---

## Issue 37: AI - Revenue Optimization
**Blocked by:** Issues 6, 9
**User stories covered:** 140

### What to build
AI analyzes operations and suggests revenue improvements.

### Acceptance criteria
- [ ] Analyze fleet performance data
- [ ] Identify underperforming vehicles
- [ ] Suggest pricing adjustments
- [ ] Recommend fleet changes (add/remove vehicles)
- [ ] Generate weekly optimization report

---

## Issue 38: AI - Natural Language Search
**Blocked by:** Issue 4
**User stories covered:** 141

### What to build
Search using natural language queries.

### Acceptance criteria
- [ ] Support queries in Arabic, French, and English
- [ ] Natural language queries for customers, vehicles, rentals
- [ ] Example: "find Toyota Corollas available next week"
- [ ] Example: "customers with overdue payments over 500 MAD"
- [ ] Results with relevance scoring

---

## Issue 39: AI - Chat Assistant
**Blocked by:** Issue 9
**User stories covered:** 142, 143

### What to build
AI assistant that answers business questions.

### Acceptance criteria
- [ ] Answer questions about revenue, payments, fleet
- [ ] Generate quick insights without running reports
- [ ] Suggest responses to customer WhatsApp messages
- [ ] Support Arabic, French, and English
- [ ] Context-aware responses based on actual data

---

## Issue 40: Notification Queue
**Blocked by:** Issue 7
**User stories covered:** 121

### What to build
Queue and manage notifications for vehicle availability.

### Acceptance criteria
- [ ] Add customers to notification list for specific vehicles
- [ ] Auto-notify when vehicle becomes available
- [ ] Track notification status (pending, sent, failed)
- [ ] Manage notification queue per vehicle
- [ ] Prevent duplicate notifications

---

## Issue 41: Custom Fields
**Blocked by:** Issue 2
**User stories covered:** 92

### What to build
Allow shops to add custom data fields to customers and vehicles.

### Acceptance criteria
- [ ] Create custom fields: text, number, date, select
- [ ] Apply custom fields to customers or vehicles
- [ ] Display custom fields on entity detail pages
- [ ] Search/filter by custom field values
- [ ] Manage custom fields in settings

---

## Issue 42: Data Export & Backup
**Blocked by:** Issue 6
**User stories covered:** 81, 82

### What to build
Export capabilities for data and reports.

### Acceptance criteria
- [ ] Export customers as CSV
- [ ] Export vehicles as CSV
- [ ] Export rentals as CSV
- [ ] Export payments as CSV
- [ ] Export financial reports as PDF
- [ ] Full data export for tenant

---

## Issue 43: Offline Capability
**Blocked by:** Issue 2
**User stories covered:** 83, 84

### What to build
Basic offline access with sync.

### Acceptance criteria
- [ ] Cache customer list for offline access
- [ ] Cache vehicle status for offline access
- [ ] Queue actions when offline (new rental, payment)
- [ ] Sync queued actions when connection returns
- [ ] Show offline/online status indicator

---

## Dependency Graph

```
Issue 1: Project Setup
  └── Issue 2: Tenant Management
        ├── Issue 3: Vehicle Inventory
        │     ├── Issue 5: Rental Management Core
        │     │     ├── Issue 6: Payment Tracking & Invoicing
        │     │     │     ├── Issue 7: WhatsApp Integration
        │     │     │     │     └── Issue 8: Payment Reminders
        │     │     │     ├── Issue 9: Reporting Dashboard
        │     │     │     ├── Issue 15: POS System
        │     │     │     ├── Issue 27: Refund Management
        │     │     │     └── Issue 42: Data Export
        │     │     ├── Issue 13: Vehicle Handover Checklist
        │     │     ├── Issue 14: Loan Tracking
        │     │     ├── Issue 16: Customer Ratings
        │     │     ├── Issue 17: Late Fee Automation
        │     │     ├── Issue 22: Deposit Management
        │     │     ├── Issue 23: Dynamic Pricing
        │     │     ├── Issue 24: Customer Loyalty
        │     │     ├── Issue 25: Fuel Tracking
        │     │     ├── Issue 26: Multi-Vehicle Bookings
        │     │     └── Issue 40: Notification Queue
        │     ├── Issue 21: Insurance Tracking
        │     └── Issue 35: AI Predictive Maintenance
        ├── Issue 4: Customer Database
        │     ├── Issue 18: Document Storage
        │     │     └── Issue 28: AI Document OCR
        │     ├── Issue 20: Communication History
        │     ├── Issue 31: AI Churn Prediction
        │     └── Issue 38: AI Natural Language Search
        ├── Issue 10: Admin Dashboard
        ├── Issue 11: Multi-Language UI
        ├── Issue 12: Mobile Responsive
        ├── Issue 19: Audit Log
        ├── Issue 41: Custom Fields
        └── Issue 43: Offline Capability
```

## Summary

| Phase | Issues | Description |
|-------|--------|-------------|
| **Foundation** | 1-2 | Infrastructure, auth, multi-tenancy |
| **Core Free** | 3-9 | Vehicles, customers, rentals, payments, WhatsApp, reminders |
| **Core Pro** | 13-17 | Handover, loans, POS, ratings, late fees |
| **Advanced Pro** | 18-27 | Documents, insurance, deposits, pricing, loyalty, fuel, bookings, refunds |
| **AI Features** | 28-39 | OCR, sentiment, timing, churn, default, fraud, recommendations, pricing, revenue, search, chat |
| **Infrastructure** | 10-12, 19, 40-43 | Admin, language, mobile, audit, notifications, custom fields, export, offline |

**Total: 43 issues**
