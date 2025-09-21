# 🚀 GitHub Actions Auto-Sync Setup

This will automatically sync your FPL data every 2 hours using GitHub's free cloud infrastructure!

## 📋 Setup Steps:

### 1. Get Your Supabase Service Role Key
- Go to **Supabase Dashboard** → **Settings** → **API**
- Copy the **"service_role"** key (NOT the anon key)

### 2. Add GitHub Repository Secrets
- Go to your GitHub repository
- Click **Settings** → **Secrets and variables** → **Actions**
- Click **New repository secret**
- Add these two secrets:

**Secret 1:**
- Name: `SUPABASE_URL`
- Value: `https://crwdsmxpypaeoyzltmvc.supabase.co`

**Secret 2:**
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `[your service role key from step 1]`

### 3. Push to GitHub
```bash
git add .
git commit -m "Add GitHub Actions auto-sync"
git push origin main
```

### 4. Verify It's Working
- Go to your GitHub repository
- Click **Actions** tab
- You should see "FPL Data Sync" workflow
- It will run automatically every 2 hours

## 🎯 What This Does:

✅ **Runs every 2 hours automatically**  
✅ **Updates all FPL data** (teams, gameweeks, fixtures)  
✅ **Fixes your score display issue**  
✅ **Completely FREE** (uses GitHub's free tier)  
✅ **No need to keep your computer on**  
✅ **Can be triggered manually** from GitHub UI  

## 🔧 Manual Trigger:
- Go to **Actions** → **FPL Data Sync** → **Run workflow**
- Click the green **Run workflow** button

## 📊 Monitoring:
- Check the **Actions** tab to see sync history
- Each run shows what was updated
- Failed runs will show error details

## 💡 Benefits:
- **24/7 automatic updates** without any costs
- **Reliable cloud infrastructure** 
- **Easy monitoring and debugging**
- **Manual trigger option** for immediate updates

Your FPL data will now stay fresh automatically! 🎉
