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

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/anish-chedalla/blueprints-app.git
   cd blueprints-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_PROJECT_ID`: Your Supabase project ID
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon/public key
   - `VITE_OPENAI_API_KEY`: Your OpenAI API key (for client-side calls)

4. **Configure Supabase Edge Functions**
   
   Your Supabase Edge Functions need the OpenAI API key as a secret:
   ```bash
   supabase secrets set OPENAI_API_KEY=your-openai-key
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```
   
   App will be available at `http://localhost:8080`

## GitHub Pages Deployment

### Prerequisites

1. **Enable GitHub Pages** in your repository:
   - Go to Settings → Pages
   - Source: GitHub Actions

2. **Add Repository Secrets**:
   - Go to Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `VITE_SUPABASE_PROJECT_ID`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
     - `VITE_SUPABASE_URL`
     - `VITE_OPENAI_API_KEY`

### Deploy

**Option 1: Automatic (via GitHub Actions)**
```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

The GitHub Actions workflow will automatically build and deploy to GitHub Pages.

**Option 2: Manual Deploy**
```bash
npm run deploy
```

Your app will be live at: `https://anish-chedalla.github.io/blueprints-app/`

## Project Structure

```
blueprints-app/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn/ui components
│   │   └── home/        # Home page sections
│   ├── pages/           # Page components
│   ├── integrations/    # Supabase client & types
│   ├── lib/             # Utilities (OpenAI client, etc.)
│   └── hooks/           # Custom React hooks
├── supabase/
│   └── functions/       # Edge Functions (AI chat, analysis)
├── public/              # Static assets
└── .github/workflows/   # GitHub Actions CI/CD

```

## Security Notes

⚠️ **Important**: The OpenAI API key in `.env` is exposed to the client. For production:
- Use Supabase Edge Functions (already implemented) for AI calls
- Never commit `.env` to version control (it's in `.gitignore`)
- Rotate API keys regularly
- Set usage limits on your OpenAI account

## Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Routing Issues on GitHub Pages
- Ensure `basename="/blueprints-app"` is set in `App.tsx`
- Ensure `base: "/blueprints-app/"` is set in `vite.config.ts`
- The `.nojekyll` file must be in the `public/` folder

### Supabase Connection Issues
- Verify all environment variables are set correctly
- Check Supabase dashboard for service status
- Ensure CORS is enabled for your deployment domain

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run deploy` - Build and deploy to GitHub Pages

## Contributing

This project was created for Arizona small businesses. Contributions welcome!

## License

MIT License - feel free to use this for your own projects

---

**Built with ❤️ for Arizona entrepreneurs**
