# GitHub Authentication Guide

Since password authentication is no longer supported by GitHub, you need to use one of these methods:

## Method 1: Personal Access Token (Quickest)

1. **Create a Personal Access Token:**
   - Go to: https://github.com/settings/tokens/new
   - Sign in if needed
   - Give it a name: "domain-image-scraper-push"
   - Select scopes: ✅ `repo` (Full control of private repositories)
   - Click "Generate token"
   - **COPY THE TOKEN NOW** (you won't see it again!)

2. **Use the token to push:**
   ```bash
   # When prompted for password, paste your token
   git push -u origin main
   ```
   - Username: `zoubiromar`
   - Password: `[PASTE YOUR TOKEN HERE]`

## Method 2: GitHub CLI (Recommended for long-term)

1. **Install GitHub CLI:**
   - Download from: https://cli.github.com/
   - Or use winget: `winget install --id GitHub.cli`

2. **Authenticate:**
   ```bash
   gh auth login
   ```
   - Choose GitHub.com
   - Choose HTTPS
   - Authenticate with browser

3. **Push using gh:**
   ```bash
   gh repo sync
   ```

## Method 3: Git Credential Manager

Windows should have Git Credential Manager installed. Try:

```bash
git config --global credential.helper manager
git push -u origin main
```

This should open a browser window for authentication.

## Method 4: Update Remote URL with Token

If you have a token, you can embed it in the URL:

```bash
git remote set-url origin https://zoubiromar:YOUR_TOKEN@github.com/zoubiromar/domain-image-scraper.git
git push -u origin main
```

**Note:** This embeds your token in the git config, so it's less secure.

---

## Quick Token Setup:

1. Visit: https://github.com/settings/tokens/new
2. Token settings:
   - **Note**: domain-image-scraper
   - **Expiration**: 90 days (or your preference)
   - **Scopes**: Select `repo`
3. Generate and copy token
4. Run: `push_to_github.bat`
5. Enter username: `zoubiromar`
6. Enter password: `[YOUR TOKEN]`

The token acts as your password for Git operations.
