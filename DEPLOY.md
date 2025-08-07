# Deploying Personal Finance Simulator to Netlify

This guide provides step-by-step instructions for deploying the Personal Finance Simulator application to Netlify.

## Prerequisites

- A GitHub account
- A Netlify account (you can sign up for free at [netlify.com](https://www.netlify.com/))
- Your repository pushed to GitHub

## Deployment Steps

### 1. Install Netlify CLI (optional)

If you want to deploy from your local machine:

```bash
npm install -g netlify-cli
```

### 2. Deploy via Netlify UI (Recommended)

1. Log in to your Netlify account
2. Click "New site from Git"
3. Select GitHub as your Git provider
4. Authorize Netlify to access your GitHub repositories
5. Select the `personal-finance-simulator` repository
6. Configure the build settings:
   - Build command: `npm install`
   - Publish directory: `public`
7. Click "Deploy site"

### 3. Deploy via Netlify CLI (Alternative)

If you've installed the Netlify CLI:

```bash
# Login to Netlify
netlify login

# Initialize and link your site
netlify init

# Deploy to production
netlify deploy --prod
```

## Environment Variables

If needed, you can set environment variables in the Netlify UI:

1. Go to Site settings > Build & deploy > Environment
2. Add any required environment variables

## Troubleshooting

If you encounter any issues during deployment:

1. Check the Netlify deployment logs
2. Ensure all dependencies are correctly listed in package.json
3. Verify that the serverless functions are correctly configured

## Accessing Your Deployed Site

Once deployed, your site will be available at:
- https://[your-site-name].netlify.app

You can set up a custom domain in the Netlify settings if desired.
