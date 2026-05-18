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

### Step 4: Set Up Appwrite Database

Run the setup script to initialize all collections, attributes, and indexes:

```bash
node scripts/setup-appwrite.js
```

Then update the permissions:

```bash
node scripts/update-permissions.js
```

### Step 5: Seed Tasks

Seed the database with tasks:

```bash
node scripts/seed-tasks.js
```

### Step 6: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schemas

### 1. Users Collection
| Attribute             | Type      | Required | Default | Description                                  |
|-----------------------|-----------|----------|---------|----------------------------------------------|
| `userId`              | String    | Yes      | -       | Unique user ID                               |
| `email`               | String    | Yes      | -       | User's email address                         |
| `referredBy`          | String    | No       | -       | Who referred the user (referral code)       |
| `referralCode`        | String    | Yes      | -       | Unique 8-character referral code             |
| `tierLevel`           | Integer   | Yes      | 0       | User's tier level                            |
| `totalReferralEarnings`| Float     | Yes      | 0       | Total earnings from referrals and tasks      |
| `pendingWithdrawals`  | Float     | Yes      | 0       | Pending withdrawal amount                    |

### 2. Tasks Collection
| Attribute        | Type      | Required | Default | Description                                  |
|------------------|-----------|----------|---------|----------------------------------------------|
| `taskId`         | String    | Yes      | -       | Unique task ID                               |
| `title`          | String    | Yes      | -       | Task title                                   |
| `category`       | String    | Yes      | -       | Task category (Quick Cash, Steady Income, Mega Offers) |
| `payout`         | Float     | Yes      | 0       | Task payout amount                           |
| `difficulty`     | String    | Yes      | -       | Task difficulty (Easy, Medium, Hard)        |
| `affiliateUrl`   | String    | Yes      | -       | Affiliate URL for the task                   |
| `isActive`       | Boolean   | Yes      | true    | Whether the task is active                   |

### 3. Completions Collection
| Attribute         | Type      | Required | Default | Description                                  |
|-------------------|-----------|----------|---------|----------------------------------------------|
| `completionId`    | String    | Yes      | -       | Unique completion ID                         |
| `userId`          | String    | Yes      | -       | User who completed the task                  |
| `taskId`          | String    | Yes      | -       | Task that was completed                      |
| `status`          | String    | Yes      | -       | Completion status                            |
| `payoutEarned`    | Float     | Yes      | 0       | Amount earned from completion                |
| `timestamp`       | Datetime  | Yes      | -       | When the task was completed                  |

### 4. Withdrawals Collection
| Attribute         | Type      | Required | Default | Description                                  |
|-------------------|-----------|----------|---------|----------------------------------------------|
| `withdrawalId`    | String    | Yes      | -       | Unique withdrawal ID                         |
| `userId`          | String    | Yes      | -       | User requesting withdrawal                   |
| `amount`          | Float     | Yes      | 0       | Withdrawal amount                            |
| `status`          | String    | Yes      | Pending | Withdrawal status (Pending, Approved, Rejected) |
| `requestedAt`     | Datetime  | Yes      | -       | When withdrawal was requested                |
| `processedAt`     | Datetime  | No       | -       | When withdrawal was processed                |

### 5. Platforms Collection
| Attribute        | Type      | Required | Default | Description                                  |
|------------------|-----------|----------|---------|----------------------------------------------|
| `platformId`     | String    | Yes      | -       | Unique platform ID                           |
| `name`           | String    | Yes      | -       | Platform name                                |
| `url`            | String    | Yes      | -       | Platform URL                                 |
| `isActive`       | Boolean   | Yes      | true    | Whether the platform is active               |

### 6. Notifications Collection
| Attribute         | Type      | Required | Default | Description                                  |
|-------------------|-----------|----------|---------|----------------------------------------------|
| `notificationId`  | String    | Yes      | -       | Unique notification ID                       |
| `userId`          | String    | Yes      | -       | User the notification is for                 |
| `title`           | String    | Yes      | -       | Notification title                           |
| `message`         | String    | Yes      | -       | Notification message                         |
| `isRead`          | Boolean   | Yes      | false   | Whether the notification has been read       |
| `createdAt`       | Datetime  | Yes      | -       | When the notification was created            |

## Features

### User Features
- **Authentication**: Secure login/register with Appwrite
- **Referral System**: Unique 8-character referral codes for each user
- **Task Aggregator**: Tasks grouped by category (Quick Cash, Steady Income, Mega Offers)
- **Dashboard**: Metric-driven hub showing earnings, tier level, and referral code
- **Wallet**: Withdrawal functionality and transaction history
- **Settings**: Account settings, notification preferences, and earning platforms
- **Passive Mining**: Simulated background earning engine

### Admin Features
- **User Management**: View, delete, and manage all users
- **Withdrawal Management**: Process user withdrawal requests
- **Platform Management**: Add, view, and delete earning platforms
- **Admin Dashboard**: Statistics and overview of the entire system

## Pages & Routes

| Page                  | Route               | Description                                  |
|-----------------------|---------------------|----------------------------------------------|
| Home                  | `/`                 | Landing page (redirects to login if not authenticated) |
| Login                 | `/login`            | User login page                              |
| Register              | `/register`         | User registration page                       |
| Dashboard             | `/dashboard`        | User dashboard (tasks, metrics)             |
| Mining                | `/mining`           | Passive earning/mining page                  |
| Wallet                | `/wallet`           | Wallet and withdrawal page                   |
| Settings              | `/settings`         | Account settings                             |
| Admin Login           | `/admin/login`      | Admin login page                             |
| Admin Dashboard       | `/admin/dashboard`  | Admin management dashboard                   |
| Postback Webhook      | `/api/v1/postback` | Webhook for affiliate network payouts        |

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## License

MIT
