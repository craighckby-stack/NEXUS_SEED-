# API Reference

## GitHub API

### Authentication
All requests require a Personal Access Token in the Authorization header.

```http
Authorization: token <GITHUB_TOKEN>
```

### Endpoints

#### Get Repository Info
```http
GET https://api.github.com/repos/{owner}/{repo}
```

#### Get File Content
```http
GET https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}
```

#### Create Branch
```http
POST https://api.github.com/repos/{owner}/{repo}/git/refs
```

#### Update File
```http
PUT https://api.github.com/repos/{owner}/{repo}/contents/{path}
```

## AI Engine

### Gemini API

#### Generate Content
```http
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}
```

**Request Body**:
```json
{
  "contents": [{ "parts": [{ "text": "prompt" }] }],
  "systemInstruction": { "parts": [{ "text": "system prompt" }] }
}
```

## Firebase

### Collections

#### linear_evolution
```javascript
{
  cycle: number,
  branch: string,
  meta: string,
  timestamp: firebase.firestore.FieldValue.serverTimestamp()
}
```
