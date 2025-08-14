# Deployment Guide: Loyverse Dashboard

This guide will walk you through deploying your Loyverse Dashboard to GitHub and then to Vercel.

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ Loyverse API credentials obtained
- ✅ GitHub account
- ✅ Vercel account (free tier available)

## Step 1: Get Your Loyverse API Credentials

### 1.1 Access Loyverse Developer Portal
1. Go to [https://developer.loyverse.com/](https://developer.loyverse.com/)
2. Sign in with your Loyverse account
3. Navigate to "My Apps" section

### 1.2 Create a New App
1. Click "Create New App"
2. Fill in the app details:
   - **App Name**: `Loyverse Dashboard` (or any name you prefer)
   - **Description**: `Dashboard for viewing daily takings`
   - **Redirect URI**: Leave blank for now
3. Click "Create App"

### 1.3 Get Your API Token
1. After creating the app, you'll see your **Client ID** and **Client Secret**
2. Click on "Generate Token" or "Get Access Token"
3. Copy the generated token - this is your `LOYVERSE_API_TOKEN`

### 1.4 Find Your Location ID
1. In the Loyverse Developer Portal, go to "API Reference"
2. Look for the "Locations" endpoint
3. Make a test request to `GET /v1.0/locations` using your token
4. Copy the `id` field from your location - this is your `LOYVERSE_LOCATION_ID`

### 1.5 Test Your API Access
You can test your credentials using curl:
```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.loyverse.com/v1.0/locations"
```

## Step 2: Deploy to GitHub

### 2.1 Initialize Git Repository
```bash
# Make sure you're in the project directory
cd "/Users/Kirk/Desktop/Web Apps/Loyverse V2"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit: Loyverse Dashboard"
```

### 2.2 Connect to GitHub Repository
```bash
# Add remote origin (replace with your actual GitHub username if different)
git remote add origin https://github.com/kirky29/Loyverse-V2.git

# Set main branch and push
git branch -M main
git push -u origin main
```

### 2.3 Verify on GitHub
1. Go to [https://github.com/kirky29/Loyverse-V2](https://github.com/kirky29/Loyverse-V2)
2. Confirm all files are uploaded
3. Your repository should now show the dashboard code

## Step 3: Deploy to Vercel

### 3.1 Connect Vercel to GitHub
1. Go to [https://vercel.com/](https://vercel.com/)
2. Sign in with your GitHub account
3. Click "New Project"

### 3.2 Import Your Repository
1. Select the `Loyverse-V2` repository from the list
2. Click "Import"

### 3.3 Configure Project Settings
1. **Project Name**: `loyverse-dashboard` (or any name you prefer)
2. **Framework Preset**: Should auto-detect as Next.js
3. **Root Directory**: Leave as `./` (default)
4. **Build Command**: Should auto-detect as `npm run build`
5. **Output Directory**: Should auto-detect as `.next`

### 3.4 Set Environment Variables
**IMPORTANT**: Before clicking "Deploy", you must set environment variables:

1. Click on "Environment Variables" section
2. Add the following variables:

   **Variable 1:**
   - **Name**: `LOYVERSE_API_TOKEN`
   - **Value**: Your Loyverse API token from Step 1.3
   - **Environment**: Production, Preview, Development (check all)

   **Variable 2:**
   - **Name**: `LOYVERSE_LOCATION_ID`
   - **Value**: Your Loyverse location ID from Step 1.4
   - **Environment**: Production, Preview, Development (check all)

3. Click "Add" for each variable
4. Verify both variables are listed

### 3.5 Deploy
1. Click "Deploy"
2. Vercel will automatically:
   - Install dependencies
   - Build your project
   - Deploy to a live URL

### 3.6 Access Your Dashboard
1. After successful deployment, Vercel will provide a URL (e.g., `https://loyverse-dashboard-abc123.vercel.app`)
2. Click the URL to access your dashboard
3. You should see your Loyverse daily takings data!

## Step 4: Verify Everything Works

### 4.1 Check Dashboard Functionality
1. Open your deployed dashboard URL
2. Verify that:
   - Summary cards show data
   - Chart displays daily takings
   - Table shows detailed breakdown
   - No error messages appear

### 4.2 Test API Endpoint
1. Visit `https://your-vercel-url.vercel.app/api/daily-takings`
2. You should see JSON data with your daily takings
3. If you see an error, check your environment variables in Vercel

### 4.3 Check Vercel Logs
If something isn't working:
1. Go to your Vercel project dashboard
2. Click on "Functions" tab
3. Check for any error logs in the API route

## Troubleshooting

### Common Issues

**"API Token not set" error:**
- Go to Vercel project settings → Environment Variables
- Ensure `LOYVERSE_API_TOKEN` is set correctly
- Redeploy after adding variables

**"Location ID not set" error:**
- Go to Vercel project settings → Environment Variables
- Ensure `LOYVERSE_LOCATION_ID` is set correctly
- Redeploy after adding variables

**No data showing:**
- Check Vercel function logs for API errors
- Verify your Loyverse API credentials
- Test API directly with curl command

**Build errors:**
- Check Vercel build logs
- Ensure all dependencies are in package.json
- Verify Next.js configuration

### Getting Help

- **Vercel Documentation**: [https://vercel.com/docs](https://vercel.com/docs)
- **Loyverse API Docs**: [https://developer.loyverse.com/docs](https://developer.loyverse.com/docs)
- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)

## Next Steps

Once deployed successfully:

1. **Custom Domain**: Set up a custom domain in Vercel if desired
2. **Monitoring**: Enable Vercel Analytics to monitor performance
3. **Updates**: Push code changes to GitHub for automatic redeployment
4. **Backup**: Consider backing up your environment variables

## Security Notes

- Never commit `.env.local` files to GitHub
- Keep your Loyverse API token secure
- Consider rotating API tokens periodically
- Monitor Vercel function usage and costs

---

🎉 **Congratulations!** Your Loyverse Dashboard is now live and accessible from anywhere!
