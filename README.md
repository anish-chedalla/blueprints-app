# Blueprints - Arizona Small Business Funding App

> Search live federal grants and reviewed funder opportunities, understand eligibility, and track the strongest matches.

## Features

- **Unified Grant Search**: Search live Grants.gov results and reviewed funder opportunities in one result set
- **Explainable Eligibility**: See likely matches, possible conflicts, missing profile facts, and the reason behind each score
- **Source Provenance**: Every normalized record carries its source, official URL, verification method, and last-reviewed time
- **Funding Pipeline**: Save live federal and reviewed opportunities and track them from research through award or decline
- **Saved Searches & Reminders**: Persist exact criteria, schedule in-app reminders, and optionally send email through the alert worker
- **Arizona Coverage Registry**: Distinguish live APIs from official pages that require human review
- **Secondary Loan Directory**: Browse curated loan programs without distracting from grant discovery

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + shadcn/ui components
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI**: OpenAI GPT-4o-mini via Supabase Edge Functions
- **Routing**: React Router v6
- **State**: TanStack Query

## Federal Grant Data Integration

The Grant Finder uses the official, no-key-required Grants.gov REST API as its
primary live catalog:

- `POST https://api.grants.gov/v1/api/search2` for keyword, eligibility,
  category, agency, status, instrument, and paginated searches
- `POST https://api.grants.gov/v1/api/fetchOpportunity` for a complete
  opportunity record

Search results are requested directly by the browser using a CORS-safelisted
`text/plain` request containing JSON. This matters because Grants.gov accepts
the JSON payload and returns CORS headers, but its `OPTIONS` handler currently
rejects browser preflight requests. No API key, proxy, or private credential is
shipped to the frontend.

The app normalizes and displays these decision-critical fields:

- Stable Grants.gov opportunity ID and opportunity number
- Title, agency, agency code, status, and opportunity category
- Posted, closing, and archive dates
- Award floor, ceiling, estimated total funding, and expected award count
- Applicant types and detailed eligibility notes
- Funding instrument and funding activity categories
- Assistance Listing (ALN/CFDA) numbers and program titles
- Cost-sharing requirement and agency contact details
- Official Grants.gov and agency-announcement links

Reviewed funder records remain in Supabase as a complementary dataset, with an Arizona-first emphasis.
The admin-only `sync-grants` function can cache federal search records in that
table, but the public live search does not depend on a sync being run. Because
the official API provides both broad search and detailed records, no scraper is
currently necessary.

## Source and eligibility model

`20260908010000_unify_grant_discovery.sql` adds the source-aware discovery model:

- `grant_sources` publishes the current coverage boundary and whether a source is automated
- provenance and structured eligibility fields extend curated `programs`
- `saved_opportunities` stores a normalized snapshot of either a live federal record or curated record
- `saved_searches` records exact filters and known result IDs for change detection
- `opportunity_reminders` powers due reminders and optional email delivery

The deterministic eligibility engine checks organization type, Arizona/city/county restrictions,
employee and revenue limits, demographics, and industry overlap. It deliberately reports missing
information instead of treating an AI guess as eligibility advice. Final eligibility always comes
from the linked funder announcement.

The coverage registry currently includes Grants.gov, Arizona Commerce Authority, Arizona Commission
on the Arts, Arizona Department of Administration/eCivis, Arizona Department of Agriculture,
Arizona Office of Economic Opportunity, SBA validation guidance, and the NASE Growth Grant.
Only Grants.gov is queried live. Other sources are plainly labeled as funder-page reviews, and
NASE's paid-membership eligibility requirement is shown before the user follows the application link.

---

## Complete Development Setup

Follow these steps to get **EVERYTHING WORKING** locally.

### **Prerequisites**

- Node.js 18+ installed ([Download](https://nodejs.org/))
- npm or bun package manager
- A Supabase account ([Sign up free](https://supabase.com))
- An OpenAI account ([Sign up](https://platform.openai.com))

---

### **Step 1: Clone and Install Dependencies**

```bash
# Clone the repository
git clone https://github.com/anish-chedalla/blueprints-app.git
cd blueprints-app

# Install dependencies
npm install
```

---

### **Step 2: Create a Supabase Project**

1. **Go to [Supabase Dashboard](https://app.supabase.com)**
2. **Click "New Project"**
3. **Fill in the details:**
   - Name: `blueprints-app` (or any name you prefer)
   - Database Password: Choose a strong password (save it!)
   - Region: Choose closest to you
4. **Wait 2-3 minutes** for the project to be created

---

### **Step 3: Set Up Supabase Database**

#### **3.1 Run Migrations**

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link to your project:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```
   - Find your `PROJECT_ID` in Supabase Dashboard → Settings → General → Reference ID

4. **Run the migrations:**
   ```bash
   supabase db push
   ```
   - This creates the current schema, source registry, user pipeline, and reviewed seed records.

#### **3.2 Manual Setup (Alternative)**

If you prefer manual setup or CLI doesn't work:

1. **Go to Supabase Dashboard → SQL Editor**
2. **Copy and paste the SQL from each file in `supabase/migrations/` folder**
3. **Run them in order** (oldest to newest by filename):
   - `20251019055016_*.sql` - Creates tables and initial 4 programs
   - `20251021021010_*.sql` - Adds sync metadata table
   - `20251021024338_*.sql` - Sets up cron jobs
   - `20251026013316_*.sql` - Adds Launch Companion tables
   - `20251029180000_*.sql` - **Adds 32 more grant and loan programs**
   - `20260823010000_*.sql` - Secures AI and sync functions and repairs stale records
   - `20260827010000_*.sql` - Adds currently verified Arizona opportunities
   - `20260908010000_*.sql` - Adds unified saves, searches, reminders, provenance, eligibility, sources, and AZ FAST rounds
4. **Important:** Run all migration files to get the current schema. The source registry documents
   the actual coverage boundary; this project intentionally does not claim a complete grant dataset.

---

### **Step 4: Configure Supabase Authentication**

1. **Go to Supabase Dashboard → Authentication → Providers**
2. **Email provider should be enabled** by default
3. **Disable Google provider** (we removed it from the app)

#### **Configure Email Settings (Important!)**

1. **Go to Authentication → Email Templates**
2. **For development**, you can use Supabase's built-in email service
3. **For production**, configure a custom SMTP provider

#### **Set Site URL**

1. **Go to Authentication → URL Configuration**
2. **Site URL**: `http://localhost:8081/blueprints-app`
3. **Redirect URLs**: Add:
   - `http://localhost:8081/blueprints-app/`
   - `http://localhost:8081/blueprints-app/onboarding`

---

### **Step 5: Get Your OpenAI API Key**

1. **Go to [OpenAI Platform](https://platform.openai.com/api-keys)**
2. **Sign in or create an account**
3. **Click "Create new secret key"**
4. **Name it** `blueprints-app`
5. **Copy the key** (starts with `sk-proj-...`)
6. **Save it immediately** - you can't view it again!

**Set spending limits:**
- Go to Settings → Billing → Set monthly budget ($5-10 is plenty for development)

---

### **Step 6: Configure Environment Variables**

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Open `.env` and fill in your credentials:**

   ```env
   # Get these from Supabase Dashboard → Settings → API
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
   ```

   Keep the OpenAI key only in Supabase Edge Function secrets. Never use a
   `VITE_` prefix for a private key because Vite exposes those values to the browser.

3. **Find your Supabase values:**
   - Go to Supabase Dashboard → Settings → API
   - **Project URL** = `VITE_SUPABASE_URL`
   - **Project ID** = part of the URL or in Settings → General
   - **anon/public key** = `VITE_SUPABASE_PUBLISHABLE_KEY`

---

### **Step 7: Deploy Supabase Edge Functions**

Grant discovery and eligibility scoring do not require AI. Grant email delivery uses the separate
`process-alerts` worker. The older assistant functions are optional legacy features and are not in
the primary navigation.

1. **Set OpenAI key as a secret in Supabase:**
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
   ```
   
   Or via Dashboard → Edge Functions → Secrets

2. **Deploy the grant-alert function:**
   ```bash
   supabase functions deploy process-alerts
   ```

   Deploy `chat-assistant`, `analyze-idea`, or `launch-companion` separately only if you intentionally
   expose those legacy routes.

3. **Optional email alerts:** configure a verified sender with Resend and protect the scheduled worker:
   ```bash
   supabase secrets set RESEND_API_KEY=your-resend-key
   supabase secrets set ALERT_FROM_EMAIL="Blueprints <alerts@your-domain.example>"
   supabase secrets set ALERT_CRON_SECRET=a-long-random-secret
   ```

   Schedule an authenticated `POST` to `/functions/v1/process-alerts` with the Supabase service-role
   bearer token and the same secret in `x-alert-cron-secret`. The worker sends due reminders, checks
   opted-in saved searches against both live federal results and the current Arizona catalog, emails
   only newly observed matches, and records delivery timestamps. If Resend is not configured, in-app
   reminders and saved searches continue to work without pretending an email was sent.

**Alternative:** Functions auto-deploy when you push to GitHub if you have GitHub Actions set up.

---

### **Step 8: Run the Development Server**

```bash
npm run dev
```

The app will start at: **`http://localhost:8081/blueprints-app/`**

**Important:** 
- The URL **must include** `/blueprints-app/` at the end
- Don't just go to `http://localhost:8081/`

---

## Verify Everything Works

### **Test Authentication**
1. Go to `http://localhost:8081/blueprints-app/auth`
2. Sign up with an email and password
3. You should receive a confirmation email (check spam)
4. Sign in after confirming

### **Test Database**
1. Go to `http://localhost:8081/blueprints-app/grants`
2. You should see live federal results and currently available reviewed Arizona records in one result set.
3. Go to `/loans` - you should see **17 loan programs** including:
   - State loans (AZ Small Business Loan, Women Business Loan, etc.)
   - Local loans (Phoenix, Mesa, Tucson area loans)
   - National loans (SBA 7(a), SBA 504, SBA Microloans, etc.)
4. Open the Coverage & Sources tab and confirm live versus reviewed sources are clearly labeled.

### **Test Matching and Alerts**
1. Sign in and go to `/idea-lab` to review your deterministic match profile.
2. Open `/grants`, save one federal and one Arizona opportunity, and confirm both appear in `/saved`.
3. Change their pipeline stages and create a near-term in-app reminder.
4. Save a search, then confirm its email preference appears in the Alerts tab.

### **Test User Features**
1. Click the heart icon on any program to save it
2. Go to `/saved` - should see your saved programs
3. Go to `/dashboard` - should see your profile
4. Complete the onboarding if you haven't

---

## Troubleshooting

### **"Vite not found" error**
```bash
rm -rf node_modules package-lock.json
npm install
```

### **Blank page / 404 errors**
- Make sure you access: `http://localhost:8081/blueprints-app/` (with the path)
- Check browser console for errors
- Verify `.env` file exists and has correct values

### **Supabase connection errors**
- Verify all environment variables in `.env` are correct
- Check Supabase Dashboard → Settings → API for correct values
- Make sure your Supabase project is active (not paused)

### **AI features not working**
- Check that Edge Functions are deployed: `supabase functions list`
- Verify OpenAI API key is set: `supabase secrets list`
- Check OpenAI account has credits and billing set up
- Look at Edge Function logs in Supabase Dashboard

### **Authentication issues**
- Check Site URL and Redirect URLs in Supabase Dashboard
- Verify email provider is enabled
- Check spam folder for confirmation emails
- Clear browser cookies and try again

### **Port 8080 already in use**
Vite will automatically use port 8081 or higher. Just use whatever port it shows.

---

## Development Workflow

### **Database Changes**
```bash
# Create a new migration
supabase migration new my_change_name

# Edit the SQL file in supabase/migrations/

# Apply migrations
supabase db push
```

### **Edge Function Changes**
```bash
# Test locally
supabase functions serve function-name

# Deploy to Supabase
supabase functions deploy function-name
```

### **Frontend Changes**
Just edit files - Vite hot reloads automatically!

---

## Production Deployment (GitHub Pages)

Once your development environment is working, you can deploy to GitHub Pages.

### **Setup GitHub Pages**

1. **Enable GitHub Pages:**
   - Go to GitHub repository → Settings → Pages
   - Source: **GitHub Actions**

2. **Add Repository Secrets:**
   - Go to Settings → Secrets and variables → Actions
   - Add these secrets (same values from your `.env`):
     - `VITE_SUPABASE_PROJECT_ID`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
     - `VITE_SUPABASE_URL`
     - `SUPABASE_ACCESS_TOKEN` (used by GitHub Actions to deploy migrations and Edge Functions)
     - `SUPABASE_DB_PASSWORD` (the production project database password)

   Without the two `SUPABASE_` deployment secrets, GitHub Pages still deploys
   the frontend, but the workflow reports that backend deployment was skipped.

3. **Update Supabase Auth URLs:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add: `https://your-username.github.io/blueprints-app/`
   - Add redirect: `https://your-username.github.io/blueprints-app/onboarding`

### **Deploy**

**Automatic (via GitHub Actions):**
```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

**Manual:**
```bash
npm run deploy
```

Your app will be live at: `https://your-username.github.io/blueprints-app/`

---

## Project Structure

```
blueprints-app/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn/ui components
│   │   └── home/        # Home page sections
│   ├── pages/           # Page components (Home, Grants, Loans, etc.)
│   ├── integrations/    # Supabase client & types
│   ├── lib/             # Utilities (OpenAI client, etc.)
│   └── hooks/           # Custom React hooks
├── supabase/
│   ├── functions/       # Edge Functions (AI chat, analysis)
│   └── migrations/      # Database schema & seed data
├── public/              # Static assets
└── .github/workflows/   # GitHub Actions CI/CD
```

---

## Security Notes

 **Important Security Practices:**

- **Never commit `.env` files** - already in `.gitignore`
- **Use Supabase Edge Functions** for AI calls (already implemented)
- **Rotate API keys regularly** 
- **Set spending limits** on OpenAI account
- **Enable Row Level Security** on all Supabase tables (already configured)
- **Use GitHub Secrets** for deployment, not hardcoded values

---

## 📝 Available Scripts

- **`npm run dev`** - Start development server
- **`npm run build`** - Build for production  
- **`npm run preview`** - Preview production build locally
- **`npm run lint`** - Run ESLint
- **`npm run deploy`** - Build and deploy to GitHub Pages

---

## Contributing

This project was created for Arizona small businesses. Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - feel free to use this for your own projects.

---

## Support

**Having issues?**
- Check the [Troubleshooting](#-troubleshooting) section
- Review Supabase Dashboard logs
- Check browser console for errors
- Verify all environment variables are set correctly

**Need help?**
- Open an issue on GitHub
- Check [Supabase Docs](https://supabase.com/docs)
- Check [Vite Docs](https://vitejs.dev/)

---

**Built with ❤️ for Arizona entrepreneurs**
