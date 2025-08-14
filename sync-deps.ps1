#!/usr/bin/env pwsh

# Dependency Sync Script for AI Recruitment Frontend
# This script helps sync package.json and lockfiles before Docker build

Write-Host "🔄 Syncing dependencies for Docker build..." -ForegroundColor Green

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Error "❌ npm is not available. Please install Node.js first."
    exit 1
}

Write-Host "`n🔍 Checking current dependency status..." -ForegroundColor Yellow

# Check if lockfiles exist
$npmLockExists = Test-Path "package-lock.json"

if ($npmLockExists) {
    Write-Host "📦 package-lock.json found" -ForegroundColor Green
} else {
    Write-Host "❌ package-lock.json not found" -ForegroundColor Red
}

Write-Host "`n🔄 Syncing dependencies..." -ForegroundColor Yellow

# Remove existing lockfiles and node_modules
if (Test-Path "node_modules") {
    Write-Host "🗑️  Removing existing node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules"
}

if (Test-Path "package-lock.json") {
    Write-Host "🗑️  Removing existing package-lock.json..." -ForegroundColor Yellow
    Remove-Item "package-lock.json"
}

# Check if React 18 migration is needed
$packageContent = Get-Content "package.json" -Raw
if ($packageContent -match '"react": "\^19"') {
    Write-Host "⚠️  React 19 detected. Migrating to React 18 for compatibility..." -ForegroundColor Yellow
    Write-Host "📝 Please update package.json to use React 18 before running this script" -ForegroundColor Red
    Write-Host "💡 Run: npm run clean:install after updating package.json" -ForegroundColor Cyan
    exit 1
}

# Install dependencies with npm
Write-Host "📦 Installing dependencies with npm..." -ForegroundColor Yellow
npm install --legacy-peer-deps

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ npm install completed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ npm install failed, trying clean install..." -ForegroundColor Yellow
    npm run clean:install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Clean install completed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Both install methods failed, trying force install..." -ForegroundColor Yellow
        npm install --force --legacy-peer-deps
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Force install completed successfully" -ForegroundColor Green
        } else {
            Write-Error "❌ All install methods failed"
            exit 1
        }
    }
}

# Verify lockfiles
Write-Host "`n🔍 Verifying lockfiles..." -ForegroundColor Yellow

if (Test-Path "package-lock.json") {
    Write-Host "✅ package-lock.json created/updated" -ForegroundColor Green
} else {
    Write-Host "⚠️  package-lock.json not created" -ForegroundColor Yellow
}

# Verify Tailwind CSS 4 setup
Write-Host "`n🔍 Verifying Tailwind CSS 4 setup..." -ForegroundColor Yellow
if (Test-Path "node_modules/@tailwindcss/postcss") {
    Write-Host "✅ @tailwindcss/postcss found" -ForegroundColor Green
} else {
    Write-Host "⚠️  @tailwindcss/postcss not found - Tailwind setup may be incomplete" -ForegroundColor Yellow
}

Write-Host "`n🚀 Dependencies synced successfully!" -ForegroundColor Green
Write-Host "You can now run: docker build -t ai-recruitment-frontend ." -ForegroundColor Cyan

# Show available Dockerfiles
Write-Host "`n📋 Available Dockerfiles:" -ForegroundColor Yellow
if (Test-Path "Dockerfile") {
    Write-Host "  • Dockerfile (npm-based with React 18 + Tailwind CSS 4)" -ForegroundColor White
}

Write-Host "`n💡 Tip: Using npm with React 18 and Tailwind CSS 4 for modern development" -ForegroundColor Cyan 