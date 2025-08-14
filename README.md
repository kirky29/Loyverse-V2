# Loyverse Dashboard V2

A simple dashboard to view daily takings from your Loyverse POS system.

## Features

- 📊 Daily takings overview with summary cards
- 📈 Visual chart showing takings trends
- 📋 Detailed table with daily breakdown
- 🔄 Real-time data from Loyverse API
- 📱 Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **API**: Loyverse REST API

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Loyverse account with API access
- GitHub account
- Vercel account (free tier available)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/kirky29/Loyverse-V2.git
   cd Loyverse-V2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   LOYVERSE_API_TOKEN=your_api_token_here
   LOYVERSE_LOCATION_ID=your_location_id_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How to Get Your Loyverse API Credentials

### Step 1: Access Loyverse Developer Portal

1. Go to [Loyverse Developer Portal](https://developer.loyverse.com/)
2. Sign in with your Loyverse account
3. Navigate to "My Apps" section

### Step 2: Create a New App

1. Click "Create New App"
2. Fill in the app details:
   - **App Name**: Loyverse Dashboard (or any name you prefer)
   - **Description**: Dashboard for viewing daily takings
   - **Redirect URI**: Leave blank for now
3. Click "Create App"

### Step 3: Get Your API Token

1. After creating the app, you'll see your **Client ID** and **Client Secret**
2. Click on "Generate Token" or "Get Access Token"
3. Copy the generated token - this is your `LOYVERSE_API_TOKEN`

### Step 4: Find Your Location ID

1. In the Loyverse Developer Portal, go to "API Reference"
2. Look for the "Locations" endpoint
3. Make a test request to `GET /v1.0/locations` using your token
4. Copy the `id` field from your location - this is your `LOYVERSE_LOCATION_ID`

### Step 5: Test Your API Access

You can test your credentials using curl:
```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.loyverse.com/v1.0/locations"
```

## Deployment

### Step 1: Push to GitHub

1. **Initialize git repository** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Loyverse Dashboard"
   ```

2. **Add remote origin**
   ```bash
   git remote add origin https://github.com/kirky29/Loyverse-V2.git
   ```

3. **Push to GitHub**
   ```bash
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. **Go to [Vercel](https://vercel.com/)**
   - Sign in with your GitHub account
   - Click "New Project"

2. **Import your repository**
   - Select the `Loyverse-V2` repository
   - Click "Import"

3. **Configure environment variables**
   - In the project settings, go to "Environment Variables"
   - Add the following variables:
     - `LOYVERSE_API_TOKEN`: Your Loyverse API token
     - `LOYVERSE_LOCATION_ID`: Your Loyverse location ID

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

5. **Access your dashboard**
   - Your dashboard will be available at the provided Vercel URL
   - You can also set up a custom domain if desired

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `LOYVERSE_API_TOKEN` | Your Loyverse API access token | Yes |
| `LOYVERSE_LOCATION_ID` | Your Loyverse location ID | Yes |

## API Endpoints

- `GET /api/daily-takings` - Fetches and aggregates daily takings data

## Troubleshooting

### Common Issues

1. **"API Token not set" error**
   - Ensure your `.env.local` file exists and contains the correct variables
   - For Vercel, check that environment variables are set in the project settings

2. **"Location ID not set" error**
   - Verify your location ID is correct
   - Test with the Loyverse API directly to confirm

3. **No data showing**
   - Check that your API token has the correct permissions
   - Verify your location ID is correct
   - Ensure you have receipts in your Loyverse system

4. **Build errors on Vercel**
   - Check the build logs in Vercel dashboard
   - Ensure all dependencies are properly installed

### Getting Help

- Check the [Loyverse API Documentation](https://developer.loyverse.com/docs)
- Review Vercel deployment logs
- Check browser console for frontend errors

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the ISC License.
