#!/bin/bash

# Dalek Linear Evolution - Deploy Script

echo "🚀 Deploying to GitHub Pages..."
echo ""

# Check if on gh-pages branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" != "gh-pages" ]; then
    echo "📌 Switching to gh-pages branch..."
    git checkout gh-pages || git checkout -b gh-pages
fi

# Merge latest changes from main
echo "🔄 Merging main branch..."
git merge main --no-edit

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin gh-pages

echo ""
echo "✅ Deployment complete!"
echo "🌐 Live at: https://craighckby-stack.github.io/ai-scaffold/"
