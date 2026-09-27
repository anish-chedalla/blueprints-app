# 🚀 GitHub Pages Deployment Guide

## Quick Start

Follow these steps to deploy your Blueprints app to GitHub Pages:

---

## 1️⃣ Push Code to GitHub

If you haven't already, push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit - Ready for deployment"
git branch -M main
git remote add origin https://github.com/anish-chedalla/blueprints-app.git
git push -u origin main
```

---

## 2️⃣ Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select: **GitHub Actions**

---

## 3️⃣ Add Repository Secrets

Your app needs environment variables to work. Add these as GitHub secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each of the following:

| Secret Name | Value | Where to find it |
|------------|-------|------------------|
| `VITE_SUPABASE_PROJECT_ID` | Your Supabase project ID | Your `.env` file or Supabase Dashboard |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/public key | Your `.env` file or Supabase Dashboard |
| `VITE_SUPABASE_URL` | Your Supabase project URL | Your `.env` file or Supabase Dashboard |

**⚠️ Important**: These values are from your `.env` file but should NEVER be committed to git. Store `OPENAI_API_KEY` only as a Supabase Edge Function secret; never expose it as a `VITE_` variable.

---

## 4️⃣ Configure Supabase Edge Functions

Your AI features (Launch Companion, Idea Lab) use Supabase Edge Functions. Set the OpenAI key there:

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Link to your project (replace with your project ID)
supabase link --project-ref your-project-id

# Set the OpenAI secret (replace with your actual API key)
supabase secrets set OPENAI_API_KEY=your-openai-api-key-here
```

Alternatively, set it in **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**

---

## 5️⃣ Deploy

**Automatic Deployment (Recommended):**

Every time you push to `main`, GitHub Actions will automatically build and deploy:

```bash
git add .
git commit -m "Deploy updates"
git push origin main
```

**Manual Deployment:**

```bash
npm run deploy
```

---

## 6️⃣ Verify Deployment

1. **Check GitHub Actions**: Go to **Actions** tab in your repo to see the deployment status
2. **Visit your site**: Once complete, visit:
   ```
   https://anish-chedalla.github.io/blueprints-app/
   ```

---

## 🔧 Troubleshooting

### ❌ Build Fails

**Check the Actions log:**
1. Go to the **Actions** tab
2. Click on the failed workflow
3. Read the error messages

**Common issues:**
- Missing secrets → Add them in Settings → Secrets
- Wrong secret names → Must match exactly (case-sensitive)
- Build errors → Run `npm run build` locally first to test

### ❌ 404 Error on GitHub Pages

**Problem**: Routes other than home show 404

**Solution**: This is expected with client-side routing. The app handles it internally. If you refresh on `/grants`, GitHub Pages will show 404, but clicking links within the app works.

To fix this, add a `404.html` that redirects to `index.html` (optional enhancement).

### ❌ Blank Page

**Check browser console** for errors:

1. **CORS errors**: Your Supabase project needs to allow your GitHub Pages domain
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add: `https://anish-chedalla.github.io` to allowed URLs

2. **Environment variables missing**: Check GitHub secrets are set correctly

### ❌ AI Features Not Working

**Launch Companion or Idea Lab failing?**

1. Verify `OPENAI_API_KEY` secret is set in Supabase Edge Functions:
   ```bash
   supabase secrets list
   ```

2. Check Edge Function logs in Supabase Dashboard → Edge Functions → Logs

3. Verify OpenAI API key is valid and has credits

---

## 🔐 Security Checklist

- [ ] `.env` file is in `.gitignore` (never commit API keys!)
- [ ] GitHub repository secrets are set
- [ ] Supabase Edge Functions secrets are set
- [ ] Supabase Auth allows GitHub Pages URL
- [ ] OpenAI API has usage limits set (prevent abuse)

---

## 📊 Monitoring Your Deployment

**GitHub Actions**: Track every deployment
- Go to **Actions** tab to see build history

**Supabase Logs**: Monitor backend
- Database: Check query performance
- Edge Functions: See AI call logs
- Auth: Monitor user activity

**OpenAI Usage**: Track API costs
- Visit OpenAI Dashboard → Usage
- Set monthly limits to control costs

---

## 🎉 You're Live!

Your Blueprints app is now deployed at:
**https://anish-chedalla.github.io/blueprints-app/**

Share it with Arizona entrepreneurs! 🌵

---

## 🔄 Making Updates

1. Make your code changes locally
2. Test with `npm run dev`
3. Commit and push:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```
4. GitHub Actions automatically redeploys (takes 2-3 minutes)

---

Need help? Check the main [README.md](./README.md) or open an issue on GitHub.
