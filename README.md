# Blueprints - Arizona Small Business Funding App

> Find grants, match to loans, and track deadlines for Arizona small businesses. Your complete funding companion.

## Features

- **Grant & Loan Discovery**: Browse Arizona-specific funding programs
- **AI-Powered Assistant**: Launch Companion helps guide you through business setup
- **Idea Lab**: Analyze business ideas with AI recommendations
- **Licensing Checklist**: Track required permits and licenses
- **Profile Management**: Save favorites and track applications
- **Smart Matching**: Filter programs by industry, location, and demographics

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + shadcn/ui components
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI**: OpenAI GPT-4o-mini via Supabase Edge Functions
- **Routing**: React Router v6
- **State**: TanStack Query

---

## 📦 Complete Development Setup

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
   - This creates all tables, policies, and **seeds 36 funding programs**:
     - ✅ 19 grants (state, local, and national)
     - ✅ 17 loans (SBA, state, and local programs)
     - ✅ Complete with realistic Arizona-specific opportunities

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
4. **Important:** Run ALL migration files to get the complete dataset

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
6. **⚠️ Save it immediately** - you can't view it again!

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
   
   # Your OpenAI API key from Step 5
   VITE_OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
   ```

3. **Find your Supabase values:**
   - Go to Supabase Dashboard → Settings → API
   - **Project URL** = `VITE_SUPABASE_URL`
   - **Project ID** = part of the URL or in Settings → General
   - **anon/public key** = `VITE_SUPABASE_PUBLISHABLE_KEY`

---

### **Step 7: Deploy Supabase Edge Functions (AI Features)**

The AI features (Launch Companion, Idea Lab) use Supabase Edge Functions.

1. **Set OpenAI key as a secret in Supabase:**
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
   ```
   
   Or via Dashboard → Edge Functions → Secrets

2. **Deploy the functions:**
   ```bash
   supabase functions deploy chat-assistant
   supabase functions deploy analyze-idea
   supabase functions deploy launch-companion
   ```

**Alternative:** Functions auto-deploy when you push to GitHub if you have GitHub Actions set up.

---

### **Step 8: Run the Development Server**

```bash
npm run dev
```

The app will start at: **`http://localhost:8081/blueprints-app/`**

**⚠️ Important:** 
- The URL **must include** `/blueprints-app/` at the end
- Don't just go to `http://localhost:8081/`

---

## ✅ Verify Everything Works

### **Test Authentication**
1. Go to `http://localhost:8081/blueprints-app/auth`
2. Sign up with an email and password
3. You should receive a confirmation email (check spam)
4. Sign in after confirming

### **Test Database**
1. Go to `http://localhost:8081/blueprints-app/grants`
2. You should see **19 grant programs** including:
   - State grants (Arizona Innovation Challenge, AZ Main Street, etc.)
   - Local grants (Phoenix, Scottsdale, Mesa, Tucson, etc.)
   - National grants (SBIR, STTR, USDA, Minority/Women/Veteran programs)
3. Go to `/loans` - you should see **17 loan programs** including:
   - State loans (AZ Small Business Loan, Women Business Loan, etc.)
   - Local loans (Phoenix, Mesa, Tucson area loans)
   - National loans (SBA 7(a), SBA 504, SBA Microloans, etc.)
4. **Total: 36 funding programs** fully populated and ready to explore

### **Test AI Features**
1. Sign in and go to `/idea-lab`
2. Enter a business idea
3. Click "Analyze Idea" - should get AI response
4. Go to `/assistant` (Launch Companion)
5. Ask a question - should get AI response

### **Test User Features**
1. Click the heart icon on any program to save it
2. Go to `/saved` - should see your saved programs
3. Go to `/dashboard` - should see your profile
4. Complete the onboarding if you haven't

---

## 🐛 Troubleshooting

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

## 🎯 Development Workflow

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

## 🌐 Production Deployment (GitHub Pages)

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
     - `VITE_OPENAI_API_KEY`

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

## 🔐 Security Notes

⚠️ **Important Security Practices:**

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

## 📞 Support

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
