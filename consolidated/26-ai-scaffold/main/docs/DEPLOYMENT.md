# Deployment Guide

## GitHub Pages

### Automatic Deployment
1. Push to `gh-pages` branch
2. GitHub automatically deploys to:
   ```
   https://{owner}.github.io/{repo}/
   ```

### Manual Deployment
```bash
git checkout gh-pages
git merge main
git push origin gh-pages
```

## Custom Domain

1. Go to repository Settings
2. Navigate to Pages
3. Add custom domain
4. Configure DNS records

## Environment Variables

### Required
- `GITHUB_TOKEN`: GitHub Personal Access Token

### Optional
- `FIREBASE_API_KEY`: Firebase configuration
- `GEMINI_API_KEY`: AI engine key (can be entered at runtime)

## Hosting Alternatives

### Vercel
```bash
npm i -g vercel
vercel
```

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod
```

### AWS S3
```bash
aws s3 sync . s3://your-bucket --delete
```
