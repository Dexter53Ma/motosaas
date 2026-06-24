# PRD: MotoRent — SaaS for Vehicle Rental Shops & Dealerships

**Version:** 1.0
**Date:** 2026-06-24
**Status:** Draft

---

## Problem Statement

Small independent motorcycle and car rental shops and dealership agencies in Morocco manage their business using paper records, spreadsheets, or fragmented tools. They lose track of payment deadlines, struggle to follow up on overdue loans, have no centralized system for fleet management, and lack basic POS capabilities. This leads to revenue loss from missed payments, poor customer experience, and operational inefficiency.

## Solution

A multi-tenant SaaS platform called **MotoRent** that provides Moroccan vehicle rental shops and dealerships with a complete business management suite — including payment reminders via WhatsApp, loan tracking, rental management, POS, vehicle inventory, customer CRM, invoicing, and reporting — accessible via a web dashboard.

## Target Users

- **Primary:** Small independent motorcycle/car rental shops (1-10 locations) in Morocco
- **Secondary:** Small dealership agencies that also offer rental/loan services
- **Language:** Arabic and French (bilingual UI)
- **Currency:** MAD (Moroccan Dirham)

---

## User Stories

### Payment Reminders (Free)
1. As a shop owner, I want automatic WhatsApp reminders sent to customers before payment due dates, so that I get paid on time.
2. As a shop owner, I want automatic WhatsApp reminders sent to customers when a payment is overdue, so that I can recover late payments.
3. As a shop owner, I want to customize reminder messages (in Arabic and French), so that communication feels personal.
4. As a shop owner, I want to see which reminders were delivered and which failed, so that I can follow up manually.
5. As a shop owner, I want to set reminder frequency (e.g., 3 days before, on due date, 1 day after, 7 days after), so that I control the follow-up cadence.
6. As a staff member, I want to send a manual WhatsApp reminder to a specific customer, so that I can handle edge cases.
7. As a shop owner, I want to disable reminders for specific customers, so that I can handle VIP or special arrangements.

### Rental Management (Free)
8. As a staff member, I want to create a rental booking for a customer with start/end dates, so that the vehicle is reserved.
9. As a staff member, I want to assign a specific vehicle from inventory to a rental, so that availability is tracked.
10. As a staff member, I want to process a vehicle return and check for damages/late return, so that I can charge accordingly.
11. As a shop owner, I want to set daily/weekly/monthly rental rates per vehicle, so that pricing is flexible.
12. As a staff member, I want to see today's expected returns and today's new bookings on a dashboard, so that I can plan my day.
13. As a customer, I want to receive a WhatsApp confirmation when my rental is booked, so that I have a record.
14. As a customer, I want to receive a WhatsApp receipt when I return a vehicle and make payment, so that I have proof.

### Vehicle Inventory (Free)
15. As a shop owner, I want to add vehicles to my inventory with details (make, model, year, VIN, license plate, color, mileage, purchase price), so that I have a digital fleet register.
16. As a shop owner, I want to track vehicle status (available, rented, in maintenance, retired), so that I know what's deployable.
17. As a shop owner, I want to upload vehicle photos, so that I can quickly identify vehicles.
18. As a shop owner, I want to see total fleet value, so that I understand my assets.
19. As a staff member, I want to quickly check if a specific vehicle is available for a given date range, so that I can answer customer inquiries.

### Customer Database (Free)
20. As a staff member, I want to create a customer profile with name, phone, email, ID number, address, so that I have their info on file.
21. As a staff member, I want to search customers by name or phone number, so that I can find them quickly.
22. As a shop owner, I want to see a customer's full history (rentals, payments), so that I understand the relationship.
23. As a shop owner, I want to tag customers as VIP, blacklisted, or regular, so that I can manage relationships.
24. As a staff member, I want to add notes to a customer profile, so that important context is preserved.

### Invoice & Receipt Generation (Free)
25. As a staff member, I want to generate a PDF invoice for a rental, so that the customer has a formal record.
26. As a staff member, I want to generate a PDF receipt when a payment is received, so that the customer has proof.
27. As a staff member, I want to send invoices and receipts directly via WhatsApp (as PDF or image), so that delivery is instant.
28. As a shop owner, I want to track which invoices are paid vs. unpaid, so that I can manage cash flow.

### Reporting Dashboard (Free - Basic)
29. As a shop owner, I want to see a dashboard with key metrics (total revenue, outstanding payments, overdue amount) at a glance, so that I can make informed decisions.
30. As a shop owner, I want to generate a daily/weekly/monthly revenue report, so that I can track business performance.
31. As a shop owner, I want to see a report of all overdue payments with customer details, so that I can take action.
32. As a shop owner, I want to export reports as CSV, so that I can share with accountants or partners.

### Multi-Tenancy & Authentication (Free)
33. As a shop owner, I want to register my shop and create an account, so that I can start using the platform.
34. As a shop owner, I want to invite staff members and assign them roles (Owner, Manager, Staff), so that I control access.
35. As a staff member, I want to log in with my email and password, so that I access only what my role permits.
36. As a shop owner, I want to be certain that no other shop can see my data, so that I trust the platform.
37. As a shop owner, I want to manage my shop settings (name, logo, contact info, tax ID), so that the platform reflects my brand.

### WhatsApp Integration (Free)
38. As a staff member, I want to connect my shop's WhatsApp account to the platform via WhatsApp Web, so that messages are sent from our number.
39. As a shop owner, I want to see the WhatsApp connection status (connected/disconnected), so that I know if reminders will work.
40. As a staff member, I want to receive incoming WhatsApp messages in the platform, so that I can respond to customers.
41. As a shop owner, I want to use templates for common messages (payment reminder, booking confirmation, receipt), so that communication is consistent.

### Subscription & Billing (Free)
42. As a shop owner, I want a 30-day free trial when I sign up, so that I can test the platform before committing.
43. As a shop owner, I want one simple Pro plan (100 MAD/month or 500 MAD/year), so that I don't have to choose between tiers.
44. As a shop owner, I want to see my billing history, current plan, and next payment date, so that I can manage my subscription.
45. As a shop owner, I want to pay via bank transfer or mobile money, so that I have flexible payment options.
46. As an admin, I want to manually activate/deactivate shops based on payment confirmation, so that I manage the business side.
47. As a shop owner, I want to see a countdown of my remaining trial days on the dashboard, so that I know when it expires.

### Loan Tracking (Pro)
48. As a shop owner, I want to create loan records for customers (vehicle purchase financed by the shop), so that I can track what they owe.
49. As a shop owner, I want to define loan terms: total amount, interest rate, number of installments, start date, so that the system calculates payment schedules automatically.
50. As a shop owner, I want to track each installment (paid, pending, overdue) on a loan, so that I have a clear view of repayment progress.
51. As a shop owner, I want to record partial payments against a loan, so that I can handle real-world payment behavior.
52. As a shop owner, I want to see total outstanding amount across all active loans, so that I know my exposure.
53. As a shop owner, I want to mark a loan as defaulted and generate a report, so that I can take legal/collection action.
54. As a manager, I want to view loan performance by customer, so that I can assess creditworthiness for future deals.

### POS System (Pro)
55. As a staff member, I want to quickly sell parts/accessories at the counter with a simple POS interface, so that sales are fast.
56. As a staff member, I want to accept cash or card (manual card entry) payments at POS, so that I can serve all customers.
57. As a staff member, I want to print or WhatsApp a receipt for POS transactions, so that customers have proof of purchase.
58. As a shop owner, I want POS sales to be tracked in daily revenue reports, so that I have a complete financial picture.
59. As a shop owner, I want to manage a product catalog with categories, prices, and stock levels, so that inventory stays accurate.
60. As a shop owner, I want low-stock alerts for products, so that I can reorder before running out.

### Advanced Reporting (Pro)
61. As a shop owner, I want to see rental income vs. POS income breakdown, so that I understand revenue streams.
62. As a shop owner, I want to see vehicle profitability (revenue earned vs. maintenance cost), so that I can decide when to retire vehicles.
63. As a shop owner, I want to export reports as PDF, so that I can share with accountants or partners.
64. As a manager, I want to filter reports by date range, vehicle, or customer, so that I can drill into specifics.
65. As a shop owner, I want to see fleet utilization rate (% of days rented out), so that I can optimize my fleet.

### Vehicle Condition & Damage Tracking (Pro)
66. As a staff member, I want to record vehicle condition at checkout with photos and notes, so that I can prove pre-existing damage.
67. As a staff member, I want to record vehicle condition at return with photos and notes, so that I can assess new damage.
68. As a shop owner, I want to compare checkout vs return photos side-by-side, so that I can fairly charge for damage.
69. As a shop owner, I want to track damage history per vehicle, so that I know which vehicles are problematic.

### Customer Reputation & Ratings (Pro)
70. As a staff member, I want to rate customers after each rental (payment reliability, vehicle care, communication), so that I build a reputation database.
71. As a shop owner, I want to see a customer's average rating and history, so that I can decide whether to rent to them again.
72. As a shop owner, I want to blacklist customers with consistently poor ratings, so that I avoid future losses.

### Late Fee Automation (Pro)
73. As a shop owner, I want to set late fee rules (e.g., 100 MAD/day after grace period), so that late returns are automatically penalized.
74. As a shop owner, I want a grace period setting (e.g., 2 hours free), so that minor delays aren't penalized.
75. As a staff member, I want to see calculated late fees when processing a return, so that I charge correctly.

### Document Storage (Pro)
76. As a staff member, I want to upload and store customer ID copies, driving licenses, and rental contracts, so that I have digital records.
77. As a shop owner, I want to access stored documents per customer or rental, so that I can retrieve them quickly if needed.

### Communication History (Pro)
78. As a staff member, I want to see all WhatsApp messages with a customer in one timeline, so that I have full context.
79. As a staff member, I want to add internal notes to a customer profile (not visible to customer), so that staff can share context.

### Audit Log (Pro)
80. As a shop owner, I want to see a log of who did what in the system (created rental, recorded payment, etc.), so that I can track accountability.

### Data Export & Backup (Pro)
81. As a shop owner, I want to export my data (customers, vehicles, rentals, payments) as CSV/Excel, so that I can use it elsewhere.
82. As a shop owner, I want to export financial reports as PDF, so that I can share with my accountant.

### Offline Capability (Pro)
83. As a staff member, I want basic offline access to customer list and vehicle status, so that I can still operate during internet outages.
84. As a staff member, I want to queue actions (new rental, payment) when offline, so that they sync when connection returns.

### Maintenance Scheduling (Pro)
85. As a shop owner, I want to schedule recurring maintenance (oil change, tire rotation) based on mileage or time intervals, so that vehicles stay road-legal.
86. As a shop owner, I want maintenance cost tracking per vehicle, so that I can calculate total cost of ownership.

### Fleet Utilization Analytics (Pro)
87. As a shop owner, I want to see which vehicles are most and least rented, so that I can optimize my fleet.
88. As a shop owner, I want to see revenue per vehicle, so that I know which vehicles are most profitable.
89. As a shop owner, I want to see idle cost (vehicles sitting unused), so that I can make better purchasing decisions.

### Multi-Language UI (Free)
90. As a user, I want to switch the interface between Arabic (RTL) and French, so that I can use the language I'm comfortable with.

### Mobile Responsive Design (Free)
91. As a user, I want the platform to work well on mobile phones, so that I can use it on the go.

### Custom Fields (Pro)
92. As a shop owner, I want to add custom fields to customers or vehicles (e.g., "preferred vehicle type", "special notes"), so that I can track shop-specific info.

### Moroccan-Specific Features (Free)
93. As a shop owner, I want TVA (VAT) calculation on invoices at 20%, so that I comply with Moroccan tax law.
94. As a shop owner, I want Moroccan holidays marked on the calendar, so that I plan around closures.
95. As a shop owner, I want to store my RC (Registre Commerce) number in shop settings, so that it appears on official documents.

### Availability Calendar (Free)
96. As a staff member, I want a visual calendar showing which vehicles are available on which dates, so that I can quickly answer customer inquiries.
97. As a staff member, I want to see overlapping bookings on the calendar, so that I can avoid double-booking.
98. As a shop owner, I want to see weekly/monthly fleet availability at a glance, so that I can plan ahead.

### Vehicle Handover Checklist (Free)
99. As a staff member, I want a standardized checklist for vehicle checkout (fuel level, mileage, exterior condition, interior condition), so that I don't miss anything.
100. As a staff member, I want a standardized checklist for vehicle return, so that I can compare with checkout.
101. As a staff member, I want to attach photos to each checklist item, so that I have visual proof.

### Insurance & Permit Tracking (Pro)
102. As a shop owner, I want to track insurance expiry dates per vehicle, so that I never let an uninsured vehicle go out.
103. As a shop owner, I want to track vehicle registration (carte grise) expiry, so that all vehicles stay legally registered.
104. As a shop owner, I want automatic reminders before insurance/registration expires, so that I have time to renew.
105. As a shop owner, I want to store insurance documents per vehicle, so that I can access them quickly.

### Deposit Management (Pro)
106. As a staff member, I want to record security deposits taken from customers at checkout, so that I can track held funds.
107. As a staff member, I want to process deposit refunds (full or partial) at return, so that customers get their money back fairly.
108. As a shop owner, I want to see total deposits held across all active rentals, so that I know my liability.

### Dynamic Pricing Engine (Pro)
109. As a shop owner, I want to set different prices for peak season (summer, holidays) vs. off-peak, so that I maximize revenue.
110. As a shop owner, I want to set weekly and monthly discount rates, so that I encourage longer rentals.
111. As a shop owner, I want to set last-minute discounts for vehicles sitting idle, so that I reduce wasted inventory.

### Customer Loyalty (Pro)
112. As a shop owner, I want to track how many times a customer has rented, so that I can identify loyal customers.
113. As a shop owner, I want to offer automatic discounts to repeat customers, so that I encourage loyalty.
114. As a shop owner, I want to send birthday/anniversary messages via WhatsApp, so that I build relationships.

### Fuel Tracking (Pro)
115. As a staff member, I want to record fuel level at checkout and return, so that I can charge for fuel used.
116. As a shop owner, I want to track fuel costs per vehicle, so that I know true operating costs.

### Multi-Vehicle Bookings (Pro)
117. As a staff member, I want to book multiple vehicles for the same customer in one transaction, so that I can handle group/corporate rentals.
118. As a staff member, I want to allow vehicle swaps during a rental period, so that I can accommodate customer requests.

### Refund Management (Pro)
119. As a staff member, I want to process refunds for overpayments or cancellations, so that I can handle edge cases.
120. As a shop owner, I want to see a report of all refunds issued, so that I can track revenue adjustments.

### Vehicle Notification Queue (Pro)
121. As a staff member, I want to add customers to a notification list when a vehicle they want is currently rented, so that I can notify them when it becomes available.

### AI-Powered Features

#### Predictive Maintenance (Pro - AI)
122. As a shop owner, I want AI to predict when each vehicle needs maintenance based on mileage, age, and usage patterns, so that I prevent breakdowns.
123. As a shop owner, I want AI to suggest optimal maintenance schedules, so that I reduce costs while keeping vehicles road-legal.

#### Smart Pricing Recommendations (Pro - AI)
124. As a shop owner, I want AI to analyze market rates, demand, and seasonality to suggest optimal rental prices, so that I maximize revenue.
125. As a shop owner, I want AI to recommend when to offer discounts and when to hold firm on price, so that I make data-driven decisions.

#### Customer Churn Prediction (Pro - AI)
126. As a shop owner, I want AI to identify customers who are likely to stop renting, so that I can proactively offer incentives to retain them.
127. As a shop owner, I want AI to suggest personalized retention offers for at-risk customers, so that I reduce churn.

#### Payment Default Prediction (Pro - AI)
128. As a shop owner, I want AI to predict which loan customers are likely to default, so that I can take preventive action.
129. As a shop owner, I want AI to suggest credit limits for new loan customers based on their profile and history, so that I reduce risk.

#### Fraud & Anomaly Detection (Pro - AI)
130. As a shop owner, I want AI to detect unusual payment patterns (e.g., same customer paying multiple times, unusually large payments), so that I catch fraud early.
131. As a shop owner, I want AI to flag suspicious rental patterns (e.g., very short rentals, frequent vehicle swaps), so that I investigate.

#### Customer Sentiment Analysis (Pro - AI)
132. As a shop owner, I want AI to analyze WhatsApp conversations to detect customer satisfaction/dissatisfaction, so that I can address issues proactively.
133. As a shop owner, I want AI to generate a sentiment score per customer, so that I can prioritize outreach to unhappy customers.

#### Vehicle Recommendation Engine (Pro - AI)
134. As a staff member, I want AI to suggest vehicles to customers based on their rental history, budget, and preferences, so that I can make better recommendations.
135. As a shop owner, I want AI to identify which vehicles are most likely to be rented together or as alternatives, so that I can optimize my fleet.

#### Document OCR (Pro - AI)
136. As a staff member, I want AI to extract information from uploaded ID cards and driving licenses (name, number, expiry), so that I don't have to type it manually.
137. As a staff member, I want AI to validate extracted document data against expected formats, so that I catch errors.

#### Smart Reminder Timing (Pro - AI)
138. As a shop owner, I want AI to determine the optimal time to send payment reminders based on when each customer typically responds, so that I increase response rates.
139. As a shop owner, I want AI to adjust reminder frequency based on customer behavior (more frequent for non-responsive, less for reliable payers), so that I balance persistence with relationship.

#### Revenue Optimization (Pro - AI)
140. As a shop owner, I want AI to analyze my entire operation and suggest actions to increase revenue (e.g., retire underperforming vehicles, adjust pricing, target specific customer segments), so that I continuously improve.

#### Natural Language Search (Pro - AI)
141. As a staff member, I want to search customers and vehicles using natural language (e.g., "show me Toyota Corollas available next week" or "find customers with overdue payments over 500 MAD"), so that I can find information faster.

#### AI Chat Assistant (Pro - AI)
142. As a shop owner, I want an AI assistant that can answer questions about my business ("How much revenue did I make last month?", "Which vehicles are most profitable?"), so that I get insights without running reports.
143. As a staff member, I want AI to suggest responses to common customer WhatsApp messages, so that I can reply faster.

---

## Free vs Pro Features

| Free (Hook & Dependency) | Pro (100 MAD/month) |
|---------------------------|---------------------|
| WhatsApp payment reminders | Loan tracking & installments |
| Customer database (unlimited) | POS system (parts/accessories) |
| Vehicle inventory (unlimited) | Advanced reporting & analytics |
| Basic rental management | Fleet utilization analytics |
| Invoice & receipt generation | Multi-user access (unlimited staff) |
| Vehicle handover checklist | Custom branding (logo on invoices) |
| Availability calendar | Damage tracking & comparison |
| Basic dashboard (revenue, overdue) | Customer ratings & reputation |
| TVA calculation | Audit log |
| Mobile responsive | Offline capability |
| Arabic & French UI | Late fee automation |
| | Maintenance scheduling |
| | Custom fields |
| | Document storage (IDs, contracts) |
| | Communication history |
| | Insurance & permit tracking |
| | Deposit management |
| | Dynamic pricing engine |
| | Customer loyalty program |
| | Fuel tracking |
| | Multi-vehicle bookings |
| | Refund management |
| | Vehicle notification queue |
| | **AI: Predictive maintenance** |
| | **AI: Smart pricing recommendations** |
| | **AI: Customer churn prediction** |
| | **AI: Payment default prediction** |
| | **AI: Fraud & anomaly detection** |
| | **AI: Customer sentiment analysis** |
| | **AI: Vehicle recommendation engine** |
| | **AI: Document OCR** |
| | **AI: Smart reminder timing** |
| | **AI: Revenue optimization** |
| | **AI: Natural language search** |
| | **AI: AI chat assistant** |
| | Priority support |

**Rationale:** Free features are the ones shops use daily and create data dependency. Once they have 100+ customers and vehicles in the system, they won't want to switch. Pro features are for mature shops that need operational depth.

---

## Implementation Decisions

### Architecture
- **Frontend:** Next.js 14+ (App Router) with TypeScript, deployed on Netlify
- **Backend:** Next.js API routes + Supabase Edge Functions for WhatsApp processing
- **Database:** Supabase (PostgreSQL) with Row-Level Security (RLS) for multi-tenancy
- **Auth:** Supabase Auth (email/password, with potential for phone auth later)
- **Storage:** Supabase Storage for vehicle photos, invoices, receipts
- **Real-time:** Supabase Realtime for live dashboard updates

### Multi-Tenancy
- Shared Supabase project with `tenant_id` on every table
- Supabase RLS policies enforce data isolation: each query automatically filters by the user's `tenant_id`
- Tenant context set via Supabase JWT claims on login

### Database Schema (Key Tables)
```
tenants (id, name, logo_url, phone, email, address, tax_id, subscription_status [trial|active|expired|suspended], trial_ends_at, subscription_starts_at, subscription_expires_at, billing_cycle [monthly|annual], created_at)

users (id, tenant_id, email, password_hash, full_name, phone, role [owner|manager|staff], created_at)

vehicles (id, tenant_id, make, model, year, vin, license_plate, color, mileage, purchase_price, fuel_type, status [available|rented|maintenance|retired], photo_urls, created_at)

vehicle_photos (id, tenant_id, vehicle_id, url, caption, category [exterior|interior|damage|document], created_at)

vehicle_maintenance (id, tenant_id, vehicle_id, type, description, cost, odometer_reading, performed_at, next_due_km, next_due_date)

vehicle_insurance (id, tenant_id, vehicle_id, provider, policy_number, start_date, end_date, cost, document_url, created_at)

vehicle_registration (id, tenant_id, vehicle_id, expiry_date, document_url, created_at)

customers (id, tenant_id, full_name, phone, email, id_number, address, tags [vip|blacklisted|regular], loyalty_score, sentiment_score, notes, created_at)

customer_documents (id, tenant_id, customer_id, type [id_card|driving_license|contract|other], url, ocr_data_json, created_at)

customer_ratings (id, tenant_id, customer_id, rental_id, payment_reliability_score, vehicle_care_score, communication_score, overall_score, rated_by, created_at)

rentals (id, tenant_id, customer_id, vehicle_id, start_date, end_date, actual_return_date, daily_rate, total_amount, late_fee, fuel_level_out, fuel_level_in, mileage_out, mileage_in, checkout_checklist_json, return_checklist_json, status [active|completed|overdue|swapped], created_at)

vehicle_swaps (id, tenant_id, rental_id, original_vehicle_id, new_vehicle_id, swap_date, reason, created_at)

loans (id, tenant_id, customer_id, vehicle_id, total_amount, interest_rate, installment_count, start_date, monthly_amount, credit_score, default_risk_score, status [active|completed|defaulted], created_at)

loan_installments (id, tenant_id, loan_id, installment_number, due_date, amount_due, amount_paid, paid_at, status [pending|paid|overdue], created_at)

deposits (id, tenant_id, customer_id, rental_id, amount, status [held|refunded|partial], refund_amount, refund_date, created_at)

payments (id, tenant_id, customer_id, rental_id|loan_id|null, amount, payment_method [cash|card|bank_transfer|mobile_money], reference, notes, is_refund, created_at)

refunds (id, tenant_id, payment_id, amount, reason, processed_by, created_at)

products (id, tenant_id, name, category, price, stock_quantity, low_stock_threshold, created_at)

pos_transactions (id, tenant_id, items_json, total_amount, payment_method, receipt_url, staff_id, created_at)

invoices (id, tenant_id, customer_id, type [rental|loan|pos], related_id, items_json, total_amount, discount, tax_amount, status [draft|sent|paid|overdue], pdf_url, created_at)

whatsapp_messages (id, tenant_id, customer_id, direction [inbound|outbound], message, status [sent|delivered|failed], template_name, sentiment_score, created_at)

reminder_schedules (id, tenant_id, loan_id|rental_id, reminder_type [before_due|on_due|overdue_1d|overdue_7d], send_at, optimal_send_time, status [pending|sent|failed])

notification_queue (id, tenant_id, customer_id, vehicle_id, message, status [pending|sent|failed], created_at)

audit_log (id, tenant_id, user_id, action, entity_type, entity_id, details_json, created_at)

custom_fields (id, tenant_id, entity_type [customer|vehicle], field_name, field_type [text|number|date|select], field_options_json, created_at)

custom_field_values (id, tenant_id, custom_field_id, entity_id, value, created_at)

pricing_rules (id, tenant_id, name, type [seasonal|weekly_discount|monthly_discount|last_minute], conditions_json, discount_percent, valid_from, valid_until, created_at)

loyalty_transactions (id, tenant_id, customer_id, rental_id, points, type [earned|redeemed], created_at)

ai_predictions (id, tenant_id, entity_type [vehicle|customer|loan], entity_id, prediction_type [maintenance|churn|default_risk|pricing|fraud], confidence_score, prediction_json, created_at)
```

### WhatsApp Integration
- Use `whatsapp-web.js` (unofficial) library running on a dedicated server/container
- QR code authentication: shop owner scans QR from their WhatsApp to link
- Session persistence stored in Supabase Storage or a dedicated Redis instance
- Outbound messages sent via whatsapp-web.js client
- Inbound messages captured via `onMessage` event and stored in `whatsapp_messages` table
- Dashboard shows connection status with reconnect button

### POS System
- Simplified POS interface: product grid with search, cart, checkout flow
- Supports cash (manual entry of amount given) and card (manual confirmation — no actual card terminal integration in MVP)
- Generates receipt as image/PDF sent via WhatsApp or printed
- Stock decremented on sale

### Invoice Generation
- Use a PDF library (e.g., `@react-pdf/renderer` or `puppeteer`) to generate branded PDFs
- Shop owner uploads logo and enters tax ID in settings
- Invoices stored in Supabase Storage, URL shared via WhatsApp

### Reporting
- Aggregation queries run server-side via Supabase RPC functions
- Dashboard renders charts using a lightweight charting library (e.g., Recharts)
- CSV export via API route, PDF export via PDF library
- Filters: date range, vehicle, customer, payment status

### Subscription & Manual Billing
- **One plan only: Pro** — 100 MAD/month or 500 MAD/year (~58% discount for annual)
- **30-day free trial** for all new shops — no credit card required at signup
- Trial starts on signup, expires automatically if no payment received
- After trial: shop locked until manual payment + admin activation
- Admin dashboard (separate from shop dashboard) to manage tenants, activate/deactivate based on payment confirmation
- No automated payment collection — shops pay via bank transfer or mobile money, admin activates manually
- Limits: No artificial feature gates — Pro plan includes everything from day 1

---

## Testing Decisions

- **Unit tests:** Test loan calculation logic, payment schedule generation, late fee computation — these are pure functions with clear inputs/outputs.
- **Integration tests:** Test Supabase RLS policies to ensure tenant isolation — verify that a user in Tenant A cannot query Tenant B data.
- **E2E tests:** Test critical flows — rental creation, payment recording, invoice generation — using Playwright.
- **Manual testing:** WhatsApp integration requires manual testing due to unofficial API nature.
- **Mobile testing:** Test responsive design on various screen sizes (320px to 1440px).
- **RTL testing:** Verify Arabic language rendering and layout direction.

---

## Out of Scope (v1)

- Actual payment processing (Stripe, card terminal integration)
- SMS notifications
- Native mobile app (web-only for MVP, but mobile-responsive)
- Accounting software integration (QuickBooks, etc.)
- Customer self-service portal
- Multi-location management (each location = separate tenant in v1)
- GPS tracking of vehicles
- Online booking by customers
- Arabic/French mixed-language invoices (one language per invoice)
- Vehicle telemetry/OBD integration
- Multi-currency support (MAD only for v1)
- White-label solution for large rental companies

---

## Further Notes

### Morocco-Specific Considerations
- **Currency:** All amounts in MAD (Moroccan Dirham)
- **Language:** UI must support Arabic (RTL) and French — consider from day 1 (CSS logical properties, i18n library)
- **WhatsApp penetration:** Very high in Morocco — this is the primary communication channel
- **Mobile money:** Inwi Money, mada — support these as payment methods in the manual billing flow
- **Tax:** Morocco uses TVA (VAT) at 20% — invoices should include TVA calculation
- **Business registration:** Shops have RC (Registre Commerce) number — include in tenant settings
- **Internet connectivity:** Variable in some areas — offline capability is important

### Free vs Pro Strategy
- **Free tier** is designed for **daily dependency** — shops use it every day for core operations
- Once data (customers, vehicles, rental history) accumulates, **switching cost is high**
- **Pro features** unlock when shops need **operational depth** (loans, POS, analytics, damage tracking)
- This creates a natural upgrade path without artificial limits on core features
- **Free features are genuinely useful** — not crippled or limited. Shops can run their entire business on free.
- **Pro features add intelligence** — they help shops make better decisions, reduce risk, and save time.

### Competitive Landscape
- No dominant SaaS for vehicle rental shops in Morocco — most use paper/Excel
- Opportunity to be the first mover in this niche
- Free tier with no vehicle/customer limits is unusual — strong differentiator
- WhatsApp integration is a killer feature — no competitor offers this

### AI Strategy
- AI features are **Pro-only** — they add significant value and justify the subscription
- Start with simpler AI features (OCR, sentiment analysis) and add complex ones (predictive maintenance, revenue optimization) over time
- Use **Supabase Edge Functions** for AI processing (can call OpenAI/Anthropic APIs)
- AI predictions stored in `ai_predictions` table for historical tracking and model improvement
- AI features should be **assistive, not autonomous** — always show confidence scores and let humans make final decisions

### Growth Potential (Post-MVP)
- Expand to other North African markets (Tunisia, Algeria)
- Add actual payment processing
- Customer mobile app for self-service bookings
- Fleet management with GPS
- Insurance partnerships
- Vehicle telemetry/OBD integration
- Multi-currency support
- White-label solution for large rental companies
- AI model training on Morocco-specific data for better accuracy
