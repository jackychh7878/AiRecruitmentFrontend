#!/usr/bin/env pwsh

# AI Recruitment Frontend Azure Container Apps Deployment Script
# This script automates the deployment process to Azure Container Apps

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup,
    
    [Parameter(Mandatory=$true)]
    [string]$Location,
    
    [Parameter(Mandatory=$true)]
    [string]$AcrName,
    
    [Parameter(Mandatory=$false)]
    [string]$ImageTag = "latest",
    
    [Parameter(Mandatory=$false)]
    [string]$ContainerAppName = "ai-recruitment-frontend",
    
    [Parameter(Mandatory=$false)]
    [string]$EnvironmentName = "ai-recruitment-env",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiUrl = "https://ai-recruitment-backend.grayisland-39090923.eastasia.azurecontainerapps.io/api"
)

Write-Host "🚀 Starting deployment of AI Recruitment Frontend to Azure Container Apps..." -ForegroundColor Green

# Check if Azure CLI is installed
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "✅ Azure CLI version: $($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Error "❌ Azure CLI is not installed or not in PATH. Please install Azure CLI first."
    exit 1
}

# Check if logged in to Azure
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
} catch {
    Write-Host "🔐 Logging in to Azure..." -ForegroundColor Yellow
    az login
}

# Set subscription context
Write-Host "📋 Setting subscription context..." -ForegroundColor Yellow
az account set --subscription (az account show --query "id" --output tsv)

# Create resource group if it doesn't exist
Write-Host "🏗️  Creating/checking resource group: $ResourceGroup" -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output none

# Create ACR if it doesn't exist
Write-Host "🏗️  Creating/checking Azure Container Registry: $AcrName" -ForegroundColor Yellow
az acr create --resource-group $ResourceGroup --name $AcrName --sku Basic --location $Location --output none

# Login to ACR
Write-Host "🔐 Logging in to Azure Container Registry..." -ForegroundColor Yellow
az acr login --name $AcrName

# Build and push Docker image
Write-Host "🐳 Building and pushing Docker image..." -ForegroundColor Yellow
$imageName = "$AcrName.azurecr.io/$ContainerAppName`:$ImageTag"

docker build -t $imageName .
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Docker build failed"
    exit 1
}

docker push $imageName
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Docker push failed"
    exit 1
}

Write-Host "✅ Docker image built and pushed successfully" -ForegroundColor Green

# Create Container Apps environment if it doesn't exist
Write-Host "🏗️  Creating/checking Container Apps environment..." -ForegroundColor Yellow
az containerapp env create --name $EnvironmentName --resource-group $ResourceGroup --location $Location --output none 2>$null

# Deploy Container App
Write-Host "🚀 Deploying Container App..." -ForegroundColor Yellow
az containerapp create `
    --name $ContainerAppName `
    --resource-group $ResourceGroup `
    --environment $EnvironmentName `
    --image $imageName `
    --target-port 3000 `
    --ingress external `
    --min-replicas 1 `
    --max-replicas 5 `
    --cpu 0.5 `
    --memory 1.0Gi `
    --env-vars `
        NODE_ENV=production `
        PORT=3000 `
        NEXT_PUBLIC_API_URL=$ApiUrl `
        NEXT_PUBLIC_APP_NAME="AI Recruitment System" `
        NEXT_PUBLIC_ORG_NAME="Your Organization" `
        NEXT_PUBLIC_DEBUG=false `
        NEXT_PUBLIC_ENABLE_CHATBOT=false `
        NEXT_PUBLIC_ENABLE_SEARCH_STATS=true `
        NEXT_PUBLIC_ENABLE_BULK_OPERATIONS=true `
        NEXT_PUBLIC_MAX_FILE_SIZE=10 `
        NEXT_PUBLIC_DEFAULT_PAGE_SIZE=20 `
        NEXT_PUBLIC_SEARCH_DEBOUNCE=500 `
        NEXT_PUBLIC_API_TIMEOUT=30000 `
    --output none

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Container App deployment failed"
    exit 1
}

# Get the application URL
Write-Host "🔍 Getting application URL..." -ForegroundColor Yellow
$appUrl = az containerapp show --name $ContainerAppName --resource-group $ResourceGroup --query "properties.configuration.ingress.fqdn" --output tsv

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Your application is available at: https://$appUrl" -ForegroundColor Cyan
Write-Host "📊 Monitor your app: https://portal.azure.com/#@/resource/subscriptions/$(az account show --query 'id' --output tsv)/resourceGroups/$ResourceGroup/providers/Microsoft.App/containerApps/$ContainerAppName" -ForegroundColor Cyan

# Display useful commands
Write-Host "`n📚 Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs: az containerapp logs show --name $ContainerAppName --resource-group $ResourceGroup --follow" -ForegroundColor White
Write-Host "  Update env vars: az containerapp update --name $ContainerAppName --resource-group $ResourceGroup --set-env-vars NEXT_PUBLIC_DEBUG=true" -ForegroundColor White
Write-Host "  Scale app: az containerapp update --name $ContainerAppName --resource-group $ResourceGroup --min-replicas 2 --max-replicas 10" -ForegroundColor White
Write-Host "  Restart app: az containerapp restart --name $ContainerAppName --resource-group $ResourceGroup" -ForegroundColor White 