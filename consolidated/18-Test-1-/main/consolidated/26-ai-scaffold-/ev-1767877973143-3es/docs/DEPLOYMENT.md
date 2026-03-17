# Deployment Guide

This guide details optimal procedures for deploying the application across various hosting platforms.

## 1. GitHub Pages (Static Deployment)

The preferred method leverages GitHub Actions for automated building and deployment from the `main` branch.

### 1.1 Automatic Deployment (Recommended via CI/CD)

Configure a GitHub Actions workflow to run on pushes to `main`. This workflow will build static assets and deploy them using the GitHub Pages workflow setup.

1. Push feature branches to `main`.
2. The CI/CD process automatically builds and deploys the content.

**Access URL:**
```
https://{owner}.github.io/{repo}/
```

### 1.2 Manual Deployment (Legacy)

*Note: This assumes static assets are built (e.g., into a `/dist` directory) before execution.*

```bash
# Build assets (if required)
# npm run build

# Ensure you are on the deployment branch
git checkout gh-pages

# Merge changes from the primary branch (e.g., main)
git merge main --no-edit

# Push the updated branch
git push origin gh-pages
```

## 2. Custom Domain Configuration

To ensure seamless accessibility, follow these steps to configure a custom domain.

1. Navigate to your repository **Settings**.
2. Select **Pages** from the navigation panel.
3. Enter the custom domain (e.g., `www.example.com`).
4. Configure required DNS records (A and CNAME) with your domain registrar as instructed by GitHub.

## 3. Environment Variables

Variables are critical for CI/CD and secure application execution.

### 3.1 Required Variables (CI/CD)

| Variable | Description | Scope |
| :--- | :--- | :--- |
| `GITHUB_TOKEN` | GitHub Personal Access Token (PAT). Must have sufficient scope (e.g., `repo`, `workflow`) for automated deployment. | CI/CD |

### 3.2 Optional Variables (Runtime / Build-time)

| Variable | Description | Scope |
| :--- | :--- | :--- |
| `FIREBASE_API_KEY` | Key for Firebase configuration and access. | Build/Runtime |
| `GEMINI_API_KEY` | API Key for the integrated AI engine. | Runtime (Can be entered at runtime) |

## 4. Hosting Alternatives

For dynamic requirements or specialized infrastructure needs.

### 4.1 Vercel (Serverless and Frontend Focus)

```bash
# Install CLI
npm i -g vercel

# Deploy to production environment
vercel --prod
```

### 4.2 Netlify (JAMstack and Static Sites)

```bash
# Install CLI
npm i -g netlify-cli

# Deploy the local build folder to production
netlify deploy --prod --dir=./dist
```

### 4.3 AWS S3 (High-Performance Static Hosting)

Requires AWS CLI configuration. Assume static content is in the `./dist` folder.

```bash
# Synchronize build assets with the S3 bucket, deleting unnecessary files.
aws s3 sync ./dist/ s3://your-bucket-name --delete
```