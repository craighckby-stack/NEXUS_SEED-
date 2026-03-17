# Frequently Asked Questions

## General Questions

### What is Dalek Linear Evolution?
Dalek Linear Evolution is an autonomous code improvement system that uses AI to iteratively refine codebases through multiple evolution cycles.

### Is it free to use?
Yes! Dalek Linear Evolution is open-source and free to use under the MIT License.

### Do I need to install anything?
No! You can use the application directly from GitHub Pages. For local development, you just need Python or a simple HTTP server.

## Usage Questions

### How do I get a GitHub token?
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select `repo` scope
4. Generate and copy the token
5. Paste it into the application

### How many cycles can I run?
You can configure between 1 and 20 cycles. The default is 5 cycles for quick testing.

### What if the evolution breaks my code?
Evolution creates branches and doesn't modify your main branch. You can always delete the evolution branch and start over.

## Technical Questions

### Which AI model does it use?
Currently uses Google Gemini 2.0 Flash for code analysis and generation.

### Can I use a different AI model?
Yes, you can modify the `callGemini` function in `index.html` to use a different AI provider.

### Does it work with private repositories?
Yes, as long as your GitHub token has access to the private repository.

## Security Questions

### Is my code sent to third-party services?
Code is sent to Google Gemini for analysis. You can review the code and opt-out anytime.

### Is my GitHub token stored?
No, tokens are only stored in browser memory and cleared on page refresh.

## Troubleshooting

### Evolution stops unexpectedly
Check:
1. GitHub token is valid and has correct permissions
2. Repository exists and you have access
3. Gemini API key is correct (when prompted)
4. Browser console for error messages

### Files not being updated
Ensure:
1. Branch was created successfully
2. Files match the configured patterns
3. No merge conflicts occurred
4. File sizes are within limits

## More Help

- [Documentation](README.md)
- [Issues](https://github.com/craighckby-stack/ai-scaffold/issues)
- [Discussions](https://github.com/craighckby-stack/ai-scaffold/discussions)
