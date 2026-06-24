# MotoRent

SaaS platform for motorcycle and car rental shops in Morocco.

## Features

- Vehicle inventory management
- Customer database
- Rental management with checklists
- Payment tracking and invoicing
- WhatsApp integration for reminders
- Loan tracking
- POS system
- AI-powered insights
- Multi-language support (Arabic/French)

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Hosting:** Netlify

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/Dexter53Ma/motosaas.git
cd motosaas
```

2. Install dependencies:
```bash
npm install
```

3. Create a Supabase project at https://supabase.com

4. Copy the environment variables:
```bash
cp .env.local.example .env.local
```

5. Update `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

6. Run the database migration in Supabase SQL Editor:
   - Go to Supabase Dashboard > SQL Editor
   - Copy and run the contents of `supabase/migrations/001_initial_schema.sql`

7. Start the development server:
```bash
npm run dev
```

8. Open http://localhost:3000

## Deployment

### Netlify

1. Push to GitHub
2. Connect repository to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy

## Project Structure

```
src/
├── app/
│   ├── dashboard/     # Dashboard page
│   ├── login/         # Login page
│   ├── signup/        # Signup page
│   └── page.tsx       # Landing page
├── components/        # Reusable components
└── lib/
    └── supabase/      # Supabase client configuration
        ├── client.ts  # Browser client
        ├── server.ts  # Server client
        └── middleware.ts
```

## License

MIT
