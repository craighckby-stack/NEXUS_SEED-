# Darlek Khan AI Autonomous Enhancer - Setup Guide

## 🔧 API Credentials Setup

The application is currently using placeholder API credentials, which causes authentication errors. To use the application, you need to configure real API keys.

### 📋 Required API Keys

#### 1. GitHub Personal Access Token
1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Set the following scopes:
   - ✅ `repo` (Access repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `read:org` (Read org and team membership)
4. Click "Generate token"
5. Copy the token (starts with `ghp_`)

#### 2. Google Gemini API Key
1. Go to [Google AI Studio > API Keys](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the API key (starts with `AIzaSy`)

### 🛠️ Configuration

#### Option 1: Update Environment File
Edit the `.env` file in the project root:

```env
# Replace with your real credentials
GITHUB_TOKEN=ghp_your_actual_github_token_here
GOOGLE_API_KEY=AIzaSy_your_actual_gemini_key_here
```

#### Option 2: Use Web Interface
1. Open the application at http://localhost:3000
2. Click "Configuration" or "Settings"
3. Enter your real API keys in the form
4. Click "Save Configuration"

### ✅ Verification

After setting up credentials:
1. The system health check should show:
   - ✅ GitHub API: Configured
   - ✅ Gemini API: Configured
   - ✅ Overall Status: Ready

2. You can then start enhancement cycles successfully

### 🚨 Important Notes

- **Never commit API keys to version control**
- **Keep your API keys secure and private**
- **GitHub tokens expire - regenerate if needed**
- **Monitor API usage to avoid rate limits**

### 🎯 Ready to Use

Once configured, the Darlek Khan AI Autonomous Enhancer will:
- Automatically analyze your codebase
- Enhance code quality using AI
- Create pull requests with improvements
- Process multiple enhancement cycles

---

**Need Help?**
- GitHub Token Issues: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
- Gemini API Issues: https://ai.google.dev/docs/api_quick_start