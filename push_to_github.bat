@echo off
echo =========================================
echo    PUSH TO GITHUB
echo =========================================
echo.

echo This script will help you push to GitHub.
echo.
echo You have 3 options to authenticate:
echo.
echo 1. Use Windows Credential Manager (Recommended)
echo    - Git will prompt for your GitHub username and password
echo    - Use a Personal Access Token as the password
echo.
echo 2. Install GitHub CLI (Easy)
echo    - Download from: https://cli.github.com/
echo    - Run: gh auth login
echo.
echo 3. Use SSH Key
echo    - Generate SSH key and add to GitHub
echo.

echo Attempting to push to GitHub...
echo You may be prompted for credentials.
echo.
echo NOTE: If prompted for password, use a Personal Access Token!
echo Create one at: https://github.com/settings/tokens/new
echo.

git push -u origin main

echo.
echo =========================================
echo If authentication failed:
echo 1. Go to https://github.com/settings/tokens/new
echo 2. Generate a new token with 'repo' scope
echo 3. Run this script again
echo 4. Use token as password when prompted
echo =========================================
echo.
pause
