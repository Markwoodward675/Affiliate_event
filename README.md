# Affiliate Event - GPT Task Aggregator & Referral Engine

A professional, highly optimized task aggregator and referral engine built with Next.js, TypeScript, Tailwind CSS, and Appwrite.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Appwrite Cloud (Authentication, Database)
- **Deployment**: Vercel (Production)

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. Appwrite Cloud account (https://cloud.appwrite.io/)

### Step 1: Clone & Install Dependencies

```bash
npm install
```

### Step 2: Set Up Appwrite Cloud

1. Log in to Appwrite Cloud (https://cloud.appwrite.io/)
2. Create a new project
3. In your project, create a new database (name it whatever you like)
4. Go to **Settings → API Keys** and create a new API key with these scopes:
   - `users.read`
   - `users.write`
   - `databases.read`
   - `databases.write`
5. Copy your Project ID, Database ID, and API Key - you'll need these for the next step

### Step 3: Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update `.env.local` with your actual credentials:
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`: `https://cloud.appwrite.io/v1` (or your custom endpoint)
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`: Your Appwrite Project ID (from Step 2)
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`: Your Appwrite Database ID (from Step 2)
- `APPWRITE_API_KEY`: Your Appwrite API Key (from Step 2)

### Step 4: Set Up Appwrite Database and Admin Account

Run the setup script to initialize collections, attributes, indexes, and admin account:

```bash
node scripts/setup-appwrite.js
```

### Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **User Authentication**: Secure login/register with Appwrite
- **Referral System**: Unique 8-character referral codes for each user
- **Task Aggregator**: Tasks grouped by category (Quick Cash, Steady Income, Mega Offers)
- **Dashboard**: Metric-driven hub showing earnings, tier level, and referral code
- **Production Ready**: Optimized for Vercel deployment

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## License

MIT
