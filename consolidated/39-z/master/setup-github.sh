#!/bin/bash

echo "=== Z AGI GitHub Repository Setup ==="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: Not in the Z AGI project directory"
    exit 1
fi

echo "Current directory: $(pwd)"
echo "Git status:"
git status
echo ""

echo "=== Next Steps ==="
echo "1. Create a new repository on GitHub:"
echo "   - Go to https://github.com/new"
echo "   - Repository name: z-agi"
echo "   - Description: Z AGI - Constraint-Based Consciousness Framework"
echo "   - Make it PUBLIC"
echo "   - Don't initialize with README (we already have one)"
echo ""

echo "2. After creating the repository, run:"
echo "   git push -u origin master"
echo ""

echo "3. If you have 2FA enabled, you may need to:"
echo "   - Use a personal access token"
echo "   - Or authenticate with SSH key"
echo ""

echo "=== Repository Contents ==="
echo "Files that will be pushed:"
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.md" -o -name "*.json" | head -20
echo ""

echo "=== Ready to Push ==="
echo "Repository is ready for GitHub upload!"
echo "Total files: $(find . -type f | wc -l)"
echo "Total size: $(du -sh . | cut -f1)"