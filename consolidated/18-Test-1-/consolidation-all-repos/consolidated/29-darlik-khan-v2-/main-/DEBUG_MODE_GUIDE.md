# 🔍 DEBUG MODE - How to Diagnose Evolution Issues

## 🎯 **Purpose of Debug Mode**

The Debug tab shows **exactly what's happening** in your evolution system. This helps identify why the system might not be updating or evolving itself.

---

## 📋 **How to Use Debug Mode:**

### **Step 1: Go to Debug Tab**

```
Visit: http://localhost:3000
Click: "Debug" tab (6th tab)
```

### **Step 2: Check Environment Variables**

Look at the **Environment Variables** section:

✅ **Expected Status (All Green):**
```
✅ SET (40 chars)     ← GitHub Token
✅ SET (39 chars)      ← API Key
```

❌ **Problem Status (Any Red):**
```
❌ NOT SET (0 chars)   ← GitHub Token (BAD - missing!)
❌ NOT SET (0 chars)   ← API Key (BAD - missing!)
```

**If NOT SET:**
1. Go to "API Keys" tab
2. Enter your GitHub token (get from https://github.com/settings/tokens)
3. Enter your Gemini API key (get from https://console.cloud.google.com/apis/credentials)
4. Click "Save Keys" button
5. Click "Refresh" button in Debug tab

---

### **Step 3: Check Repository Settings**

Look at the **Repository Settings** section:

✅ **Expected Status:**
```
Repository Owner: craighckby-stack
Repository Name: darlik-khan-v2
Full: craighckby-stack/darlik-khan-v2
```

**If Different:**
- This is fine if you're using a different repo
- Make sure the repo exists and you have access

---

### **Step 4: Check Available Files**

Look at the **Available Files** section:

✅ **Expected Status (Green Badge with count):**
```
12 files     ← Should show count > 0
```

✅ **Expected Content (File List):**
Should see files like:
```
src/app/page.tsx
src/lib/evolution-service.ts
src/system/placeholders.ts
src/components/PlaceholderDashboard.tsx
...
```

❌ **Problem Status (Red Badge with "0 files"):**
```
0 files      ← BAD - no files found to mutate
```

**If "0 files":**
- Problem: `getRepositoryFiles()` is failing
- Possible causes:
  1. GitHub token is invalid or missing
  2. Repository doesn't exist
  3. No write access to repository
  4. GitHub API rate limits
  5. File filtering is too restrictive (excluding all files)

**How to Fix:**
1. Check browser console (F12) for errors
2. Verify GitHub token has "repo" scope
3. Verify repository owner and name are correct
4. Try different repo if needed
5. Click "Refresh List" button in Debug tab

---

### **Step 5: Check Next Target (Placeholder)**

Look at the **Next Target (Placeholder)** section:

✅ **Expected Status (Shows placeholder details):**
```
📋 Next Target (Placeholder)
[Title] ← Placeholder title
[CRITICAL] ← Priority badge
[AI-Infrastructure] ← Category badge
src/system/placeholders.ts ← File path
```

**If Nothing Shows:**
- No placeholders available to fill
- All placeholders already filled
- System has no work to do

**How to Fix:**
1. Go to "Placeholders" tab
2. Check if all 17 are filled
3. If not filled, check for dependencies
4. Try using RANDOM mode instead of STRATEGIC

---

### **Step 6: Start Evolution & Watch Logs**

1. Go to "Dashboard" tab
2. Click "🚀 Start Evolution" button
3. Immediately switch to "Logs" tab
4. Look for **🔍 debug messages** (marked with 🔍 emoji)

---

## 🔍 **Debug Messages in Logs:**

When you click "Start Evolution", these messages appear in Logs tab:

### **Initial Debug Messages:**

```
🚀 Evolution system started
🎯 Mode: RANDOM / HYBRID / STRATEGIC
🔍 GitHub Token: SET (40 chars)  ← Should say SET
🔍 API Key: SET (39 chars)      ← Should say SET
🔍 Repository: craighckby-stack/darlik-khan-v2
🔍 Available Files: 12 files  ← Should show count
📝 Phase 1: Question Generation
```

**If You See:**
```
❌ ERROR: GitHub token not set - Please add in API Keys tab
```
**Fix:** Add GitHub token in API Keys tab

**If You See:**
```
❌ ERROR: API key not set - Please add in API Keys tab
```
**Fix:** Add Gemini API key in API Keys tab

**If You See:**
```
❌ ERROR: No files available to mutate
```
**Fix:** Check GitHub token, verify repo access, click "Refresh List" in Debug tab

---

### **Phase Debug Messages:**

```
🤖 Phase 2: Getting AI Answer
🔍 Calling AI with API key length: 39  ← Should say 39 or your key length
```

**If API Key is Short (0 chars):**
- AI calls will fail
- You'll see error messages in logs

```
🧬 Phase 5: Code Mutation
🔍 Mutating file: src/app/page.tsx  ← Should show filename
🔍 Using placeholder: NONE / [id]     ← Shows if placeholder or not
```

**If You See:**
```
❌ Mutation failed: [error details]
```
**Fix:** Check error message, try again, or check AI API key

```
📤 Phase 6: Commit to GitHub
🔍 Committing with GitHub token length: 40  ← Should say 40 or your token length
🔍 Committing to repository: craighckby-stack/darlik-khan-v2
```

**If You See:**
```
❌ Failed to commit: [error details]
```
**Fix:** Check GitHub token, verify repo access, check file path

---

## 🚨 **Common Issues & Solutions:**

### **Issue #1: "No files available to mutate"**

**Symptoms:**
```
❌ ERROR: No files available to mutate
```

**Causes:**
1. GitHub token is invalid or missing
2. Repository doesn't exist or wrong name
3. No write access to repository
4. File filtering excludes all files

**Solutions:**
1. **Check Debug Tab** → Environment Variables → GitHub Token status
2. **Go to API Keys Tab** → Enter valid GitHub token
3. **Generate New Token:**
   - Go to: https://github.com/settings/tokens
   - Click: "Generate new token (classic)"
   - Select: "repo" scope
   - Copy and paste the token
4. **Verify Repo:** Make sure repo owner and name are correct
5. **Check File List:** Look at "Available Files" section in Debug tab
   - Should show list of files like: `src/app/page.tsx`, `src/lib/...`, etc.
   - If empty, GitHub API is failing
6. **Refresh List:** Click "Refresh List" button in Debug tab

---

### **Issue #2: "AI calls failing"**

**Symptoms:**
```
❌ Evolution cycle error: [AI error message]
```

**Causes:**
1. Gemini API key is missing or invalid
2. API key doesn't have correct permissions
3. API rate limits

**Solutions:**
1. **Check Debug Tab** → Environment Variables → API Key status
2. **Go to API Keys Tab** → Enter valid Gemini API key
3. **Get New API Key:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Create or select your API key
   - Copy and paste the key
4. **Verify Key Length:** Debug tab should show 30+ characters
5. **Check Logs Tab:** Look for error messages about AI calls

---

### **Issue #3: "Commits failing"**

**Symptoms:**
```
❌ Failed to commit: [error details]
```

**Causes:**
1. GitHub token is invalid or expired
2. Token doesn't have "repo" scope
3. Repository doesn't exist or wrong name
4. File path is incorrect

**Solutions:**
1. **Check Debug Tab** → Environment Variables → GitHub Token status
2. **Verify Token:**
   - Go to: https://github.com/settings/tokens
   - Check if token is still valid
   - Regenerate if expired
3. **Check Token Scope:**
   - Token must have "repo" scope
   - "classic" token (not OAuth)
4. **Verify Repo:** Make sure repo owner and name are correct
5. **Check File Path:** Debug tab should show target file being mutated

---

### **Issue #4: "Nothing happening after clicking Start"**

**Symptoms:**
- Click "Start Evolution" button
- No logs appear
- Nothing changes

**Causes:**
1. JavaScript errors in browser console
2. API routes failing silently
3. Server-side errors not shown to client

**Solutions:**
1. **Open Browser Console:** Press F12
2. **Look for Red Errors:** Should show what's failing
3. **Check Debug Tab:** Should show system state
4. **Refresh Page:** Press Ctrl+R or Cmd+R
5. **Check Server Logs:** Look at terminal where `bun run dev` is running

---

## 🔧 **Debug Mode Checklist:**

### **Before Starting Evolution:**

- [ ] GitHub Token says "SET" in Debug tab
- [ ] API Key says "SET" in Debug tab
- [ ] Repository shows correct owner/name
- [ ] Available Files shows count > 0
- [ ] Available Files shows list of files
- [ ] Next Target shows placeholder (if strategic mode)

### **After Clicking Start:**

- [ ] Logs tab shows "🚀 Evolution system started"
- [ ] Logs tab shows "🎯 Mode: [RANDOM/HYBRID/STRATEGIC]"
- [ ] Logs tab shows "🔍 GitHub Token: SET (40 chars)"
- [ ] Logs tab shows "🔍 API Key: SET (39 chars)"
- [ ] Logs tab shows "🔍 Repository: [owner/name]"
- [ ] Logs tab shows "🔍 Available Files: [count] files"
- [ ] Logs tab shows "📝 Phase 1: Question Generation"
- [ ] Logs tab shows "🤖 Phase 2: Getting AI Answer"
- [ ] Logs tab shows "🔍 Calling AI with API key length: [length]"

### **If Errors Appear:**

- [ ] Check Debug tab for system status
- [ ] Check browser console (F12) for detailed errors
- [ ] Check server terminal for backend errors
- [ ] Verify API keys are correct
- [ ] Verify GitHub token has "repo" scope
- [ ] Verify repository owner and name are correct

---

## 🚀 **Step-by-Step Debugging Process:**

### **Step 1: Verify API Keys (Do This First!)**

```
1. Visit: http://localhost:3000
2. Click: "API Keys" tab (5th tab)
3. Enter your Gemini API key
4. Enter your GitHub token (with "repo" scope)
5. (Optional) Verify repository owner/name
6. Click: "Save Keys" button
7. Wait 3 seconds for "Saved!" message
8. Click "Test System" button
```

### **Step 2: Check Debug Tab**

```
1. Click: "Debug" tab (6th tab)
2. Check Environment Variables section:
   - GitHub Token should say "SET" with 40+ chars
   - API Key should say "SET" with 30+ chars
   - Repository should show correct owner/name
3. Check Available Files section:
   - Should show badge with count > 0
   - Should show list of files (first 20)
4. If any issues, fix them before proceeding
```

### **Step 3: Start Evolution**

```
1. Go to: "Dashboard" tab (1st tab)
2. Select Mode: RANDOM / HYBRID / STRATEGIC
3. Select Speed: Normal (60s) / Fast (10s) / Insane (5s)
4. Click: "🚀 Start Evolution" button
```

### **Step 4: Watch Logs Tab**

```
1. Switch to: "Logs" tab (3rd tab)
2. Look for 🔍 debug messages:
   - "🔍 GitHub Token: SET"
   - "🔍 API Key: SET"
   - "🔍 Repository: [owner/name]"
   - "🔍 Available Files: [count]"
3. Watch for 7 phases with emoji:
   - 📝 Phase 1: Question Generation
   - 🤖 Phase 2: Getting AI Answer
   - ⚖️ Phase 3: PRO/CON Debate
   - 🎯 Phase 4: Decision Making
   - 🧬 Phase 5: Code Mutation
   - 📤 Phase 6: Commit to GitHub
   - 🔄 Phase 7: Monitoring Deployment
4. Watch for 🔍 detailed messages in each phase
5. Check for any ❌ error messages
```

---

## 📊 **What Debug Mode Shows:**

### **Environment Variables:**
- ✅ GitHub Token status (SET / NOT SET + character count)
- ✅ API Key status (SET / NOT SET + character count)
- ✅ Repository Owner
- ✅ Repository Name
- ✅ Full Repository path (owner/name)

### **Repository Files:**
- ✅ File count badge (green if > 0, red if 0)
- ✅ Scrollable file list (first 20 files)
- ✅ Refresh List button
- ✅ Error message if no files found

### **Next Target:**
- ✅ Placeholder title (if in STRATEGIC/HYBRID mode)
- ✅ Priority badge
- ✅ Category badge
- ✅ File path
- ✅ Only shown if placeholder is next target

### **Real-Time Debugging:**
- ✅ System logs with 🔍 debug markers
- ✅ Shows what's happening at each phase
- ✅ Shows GitHub token length being used
- ✅ Shows API key length being used
- ✅ Shows which file is being mutated
- ✅ Shows if placeholder is being used or random file

---

## 🎯 **Quick Reference for Common Problems:**

### **"Still missing updates on the system itself"**

This means the system is NOT mutating files. Here's how to fix:

**1. Add API Keys (Most Common Cause)**
```
Go to API Keys tab
Paste Gemini API key
Paste GitHub token
Click Save
```

**2. Check Debug Tab**
```
Look for:
✅ GitHub Token: SET (40 chars)
✅ API Key: SET (39 chars)
✅ Available Files: 12 files
```

If any of these are NOT SET or show 0 files, that's the problem!

**3. Start Evolution and Watch Logs**
```
Look for these messages in order:
1. 🚀 Evolution system started
2. 📝 Phase 1: Question Generation
3. 🤖 Phase 2: Getting AI Answer
4. ⚖️ Phase 3: PRO/CON Debate
5. 🎯 Phase 4: Decision Making
6. ✅ Decision: GO - proceeding with evolution
7. 🧬 Phase 5: Code Mutation
8. 🔍 Mutating file: [filename]
9. 📤 Phase 6: Commit to GitHub
10. ✅ Commit: [sha]
11. 🔄 Phase 7: Monitoring Deployment
```

If you don't see these messages, something is failing.

**4. Check for Errors in Logs**
```
Look for:
❌ Failed to commit
❌ Mutation failed
❌ Evolution cycle error
```

**5. Open Browser Console**
```
Press F12
Look for red errors
These will show exactly what's failing
```

---

## ✅ **What Should Happen When System Works:**

### **Expected Timeline (Normal Speed - 60s between phases):**

```
Time 0s:
- Dashboard shows: "○ IDLE"
- Cycle count: 0

Time 0-5s:
- Click "Start Evolution" button
- Dashboard shows: "● ACTIVE"
- Cycle count: 0
- Badge shows: "📝 Phase 1: Question Generation"
- Logs tab shows:
  - 🚀 Evolution system started
  - 🎯 Mode: RANDOM/HYBRID/STRATEGIC
  - 🔍 GitHub Token: SET (40 chars)
  - 🔍 API Key: SET (39 chars)
  - 🔍 Repository: craighckby-stack/darlik-khan-v2
  - 🔍 Available Files: 12 files
  - 📝 Phase 1: Question Generation

Time 5-65s:
- Dashboard shows: "● ACTIVE"
- Badge shows: "🤖 Phase 2: Getting AI Answer"
- Logs tab shows:
  - 🤖 Phase 2: Getting AI Answer
  - 🔍 Calling AI with API key length: 39
- (System waits 60s while AI generates answer)

Time 65-130s:
- Dashboard shows: "● ACTIVE"
- Badge shows: "⚖️ Phase 3: PRO/CON Debate"
- Logs tab shows:
  - ⚖️ Phase 3: PRO/CON Debate
- (System waits 60s while AI generates debate)

Time 130-195s:
- Dashboard shows: "● ACTIVE"
- Badge shows: "🎯 Phase 4: Decision Making"
- Logs tab shows:
  - 🎯 Phase 4: Decision Making
  - (System waits 60s while AI makes decision)

Time 195-260s:
- Dashboard shows: "● ACTIVE"
- Badge shows: "🎯 Phase 4: Decision Making"
- Logs tab shows:
  - ✅ Decision: GO - proceeding with evolution
  - 🎯 Target type: PLACEHOLDER / RANDOM
  - 🔍 Mutating file: [filename]

Time 260-325s:
- Dashboard shows: "● ACTIVE"
- Badge shows: "🧬 Phase 5: Code Mutation"
- Logs tab shows:
  - 🧬 Phase 5: Code Mutation
  - 🔍 Mutating file: [filename]
- (System waits 60s while AI generates code)

Time 325-390s:
- Dashboard shows: "● ACTIVE"
- Badge shows: "📤 Phase 6: Commit to GitHub"
- Logs tab shows:
  - 📤 Phase 6: Commit to GitHub
  - 🔍 Committing with GitHub token length: 40
  - 🔍 Committing to repository: craighckby-stack/darlik-khan-v2
- (System waits 60s while committing to GitHub)

Time 390-455s:
- Dashboard shows: "● ACTIVE"
- Cycle count: 1 (increments)
- Last commit SHA: abc1234 (7 characters)
- Badge shows: "🔄 Phase 7: Monitoring Deployment"
- Logs tab shows:
  - 🔄 Phase 7: Monitoring Deployment
  - 🔍 Monitoring deployment for commit: abc1234
  - ✅ Commit: abc1234
- (System polls GitHub Actions every 10s)

Time 455-...s:
- If deployment succeeds:
  - Logs: "✅ Deployment successful - refreshing page"
  - Page auto-refreshes after 2 seconds
- If deployment fails:
  - Logs: "❌ Deployment failed"
  - System waits 60s, then starts next cycle
- If deployment still pending:
  - Logs: "⏳ Deployment still pending..."
  - System waits 60s, then starts next cycle
```

---

## 🚀 **Summary:**

**Debug Mode shows exactly what's happening at every step**

**Most Common Cause:** Missing API keys (easy to fix!)
**Second Common Cause:** GitHub API issues (check token and repo)
**Third Common Cause:** File filtering excludes all files (check file list)

**What to Do:**
1. Add API keys in API Keys tab
2. Check Debug tab to verify everything is SET
3. Start evolution and watch Logs tab
4. Look for 🔍 debug messages showing system state
5. Open browser console (F12) for detailed errors
6. Use Debug tab info to identify and fix issues

**System is ready - just add API keys and watch it work!** 🚀

---

**Author:** Craig Huckerby
**Powered by:** Z.ai • Next.js 15
**Date:** January 10, 2026
