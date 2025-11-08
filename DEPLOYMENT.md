# Deployment Guide

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com/km-31)
2. Click "New repository" or go to: https://github.com/new
3. Repository name: `Performance-Critical-Data-Visualization-Dashboard`
4. Description: "High-performance real-time data visualization dashboard"
5. Set to **Public** or **Private** (your choice)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 2: Push Code to GitHub

After creating the repository, run these commands:

```bash
# Make sure you're in the project directory
cd "/Users/srinjoyroy/Documents/Flam Project"

# Verify remote is set (already done)
git remote -v

# Push to GitHub (you may need to authenticate)
git push -u origin main
```

If you get authentication errors:
- Use GitHub Personal Access Token instead of password
- Or set up SSH keys for GitHub
- Or use GitHub CLI: `gh auth login`

## Step 3: Deploy to Netlify

### Option A: Via Netlify Dashboard

1. Go to [Netlify](https://www.netlify.com/)
2. Sign up/Login with your GitHub account
3. Click "Add new site" → "Import an existing project"
4. Select "GitHub" and authorize Netlify
5. Find and select `Performance-Critical-Data-Visualization-Dashboard`
6. Netlify will auto-detect the settings from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 20
7. Click "Deploy site"
8. Wait for build to complete (usually 2-5 minutes)
9. Your site will be live at: `https://your-site-name.netlify.app`

### Option B: Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

## Step 4: Configure Environment (if needed)

The project doesn't require any environment variables for basic operation. If you need to add any in the future:

1. Go to Netlify Dashboard → Site settings → Environment variables
2. Add your variables
3. Redeploy the site

## Troubleshooting

### Build Fails on Netlify

1. Check build logs in Netlify dashboard
2. Common issues:
   - Node version mismatch → Set NODE_VERSION in netlify.toml
   - Missing dependencies → Check package.json
   - Build timeout → Increase build timeout in Netlify settings

### Authentication Issues with GitHub

1. **Personal Access Token:**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with `repo` scope
   - Use token as password when pushing

2. **SSH Keys:**
   ```bash
   # Generate SSH key
   ssh-keygen -t ed25519 -C "your_email@example.com"
   
   # Add to GitHub
   # Copy ~/.ssh/id_ed25519.pub to GitHub Settings → SSH keys
   
   # Change remote to SSH
   git remote set-url origin git@github.com:km-31/Performance-Critical-Data-Visualization-Dashboard.git
   ```

3. **GitHub CLI:**
   ```bash
   # Install GitHub CLI
   brew install gh  # macOS
   
   # Authenticate
   gh auth login
   
   # Push
   git push -u origin main
   ```

## Post-Deployment

After successful deployment:

1. **Custom Domain (Optional):**
   - Go to Netlify Dashboard → Domain settings
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Continuous Deployment:**
   - Enabled by default when connected to GitHub
   - Every push to `main` branch will trigger a new deployment

3. **Preview Deployments:**
   - Pull requests automatically get preview deployments
   - Test changes before merging

## Current Configuration

- **Framework:** Next.js 14+ (App Router)
- **Node Version:** 20
- **Build Command:** `npm run build`
- **Publish Directory:** `.next`
- **Plugin:** `@netlify/plugin-nextjs` (auto-installed)

The `netlify.toml` file is already configured and ready for deployment!

