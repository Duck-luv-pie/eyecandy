# API Key Security Setup

## Overview
This project uses a secure configuration system to keep API keys out of version control.

## Setup Instructions

### 1. Create your config file
```bash
# Copy the template to create your config file
cp project/Assets/Scripts/config.template.txt project/Assets/Scripts/config.ts
```

### 2. Add your API keys
Open `project/Assets/Scripts/config.ts` and replace the placeholder values:
```typescript
export class Config {
  // Get your Gemini API key from: https://makersuite.google.com/app/apikey
  public static readonly GEMINI_API_KEY = "your-actual-gemini-api-key-here";
}
```

### 3. Verify .gitignore
The `.gitignore` file already excludes:
- `project/Assets/Scripts/config.ts`
- `project/Assets/Scripts/config.ts.meta`

## Files in this setup

### Tracked by git:
- `config.template.txt` - Template showing the structure (no real keys)
- `ImageDescriptionGenerator.ts` - Updated to import from config
- `.gitignore` - Excludes the actual config file

### NOT tracked by git:
- `config.ts` - Contains your actual API keys (ignored by git)
- `config.ts.meta` - Lens Studio metadata file (ignored by git)

## Alternative Methods

### Option 2: Use environment variables (if supported)
```typescript
private geminiApiKey: string = process.env.GEMINI_API_KEY || "fallback-key";
```

### Option 3: Git secret (for teams)
```bash
# Remove from git history if already committed
git rm --cached project/Assets/Scripts/config.ts
git commit -m "Remove config.ts from tracking"
```

## Security Best Practices
1. ✅ Never commit API keys to version control
2. ✅ Use separate config files that are gitignored
3. ✅ Provide templates for team members
4. ✅ Rotate API keys regularly
5. ✅ Use environment-specific configurations

## For Team Development
When sharing this project:
1. Share the `config.template.txt` file
2. Each developer creates their own `config.ts`
3. Each developer adds their own API keys
4. The actual keys never enter version control