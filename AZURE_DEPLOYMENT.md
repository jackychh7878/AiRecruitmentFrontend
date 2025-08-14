# Azure Container Apps Deployment Guide

This guide explains how to deploy your AI Recruitment Frontend to Azure Container Apps with runtime environment variable configuration.

## Prerequisites

- Azure CLI installed and configured
- Docker installed and running
- Azure Container Registry (ACR) or access to Docker Hub

## 🚨 Pre-deployment: Fix Dependency Issues

If you encounter dependency sync errors during Docker build, run this script first:

```powershell
# Sync dependencies before building
.\sync-deps.ps1
```

This script will:
- Remove outdated lockfiles
- Reinstall dependencies with npm (React 18 compatible)
- Create fresh, synchronized lockfiles
- Ensure Docker build succeeds

**Note**: The application now uses React 18 for better package compatibility. If you were using React 19, the script will guide you through the migration.

## ⚠️ **IMPORTANT: Runtime Configuration Setup**

**The application now supports runtime environment variable changes!** This means you can change environment variables in Azure Portal without redeploying.

### How It Works

1. **Build-time**: Application builds with default/fallback values
2. **Runtime**: Application fetches actual configuration from `/api/config` endpoint
3. **Dynamic Updates**: Environment variables can be changed in Azure Portal and take effect immediately

### Required Environment Variables for Runtime

When deploying to Azure Container Apps, set these environment variables:

```bash
# Required for runtime configuration to work
NODE_ENV=production
PORT=3000

# These will be loaded at runtime from the /api/config endpoint
NEXT_PUBLIC_API_URL=https://your-backend.azurecontainerapps.io/api
NEXT_PUBLIC_APP_NAME="AI Recruitment System"
NEXT_PUBLIC_ORG_NAME="Your Organization"
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_ENABLE_CHATBOT=false
NEXT_PUBLIC_ENABLE_SEARCH_STATS=true
NEXT_PUBLIC_ENABLE_BULK_OPERATIONS=true
NEXT_PUBLIC_MAX_FILE_SIZE=10
NEXT_PUBLIC_DEFAULT_PAGE_SIZE=20
NEXT_PUBLIC_SEARCH_DEBOUNCE=500
NEXT_PUBLIC_API_TIMEOUT=30000
```

### Testing Runtime Configuration

Add the debug component to any page to verify configuration:

```tsx
import { ConfigDebug } from '@/components/config-debug';

export default function TestPage() {
  return (
    <div className="p-6">
      <h1>Configuration Test</h1>
      <ConfigDebug />
    </div>
  );
}
```

### Testing API Configuration

Visit `/api-test` to test your API configuration:

1. **Configuration Display**: Shows current runtime configuration
2. **API Testing**: Test API calls with the current configuration
3. **Debug Console**: Check browser console for detailed request information

### Troubleshooting Runtime Configuration

If your API is still calling localhost:5000:

1. **Check Browser Console**: Look for configuration update logs
2. **Verify Environment Variables**: Ensure they're set correctly in Azure Portal
3. **Test Configuration Endpoint**: Visit `/api/config` to see raw configuration
4. **Use Debug Pages**: Visit `/config-test` and `/api-test` for detailed debugging

**Common Issues:**
- Environment variables not set in Azure Container Apps
- Configuration not loading at runtime
- API client not updating with new configuration

**Debug Steps:**
1. Visit `/config-test` to see current configuration
2. Visit `/api-test` to test API calls
3. Check browser console for configuration logs
4. Verify environment variables in Azure Portal
5. Restart the container app if needed

## 1. Build and Push Docker Image

### Option A: Using Azure Container Registry (Recommended)

```bash
# Login to Azure
az login

# Set variables
RESOURCE_GROUP="your-resource-group"
LOCATION="eastasia"
ACR_NAME="your-acr-name"
IMAGE_NAME="ai-recruitment-frontend"
IMAGE_TAG="latest"

# Create ACR if it doesn't exist
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --location $LOCATION

# Login to ACR
az acr login --name $ACR_NAME

# Build and push image
docker build -t $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG .
docker push $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG
```

### Option B: Using Docker Hub

```bash
# Build image
docker build -t your-dockerhub-username/ai-recruitment-frontend:latest .

# Push to Docker Hub
docker push your-dockerhub-username/ai-recruitment-frontend:latest
```

### Option C: Alternative Dockerfile (if pnpm issues persist)

If you continue to have issues with the main Dockerfile, try the npm-based alternative:

```bash
# Use npm-based Dockerfile
docker build -f Dockerfile.npm -t ai-recruitment-frontend .
```

## 2. Deploy to Azure Container Apps

### Create Container App Environment

```bash
# Create Container Apps environment
az containerapp env create \
  --name "ai-recruitment-env" \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
```

### Deploy Container App

```bash
# Deploy the application
az containerapp create \
  --name "ai-recruitment-frontend" \
  --resource-group $RESOURCE_GROUP \
  --environment "ai-recruitment-env" \
  --image $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG \
  --target-port 3000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 5 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars \
    NODE_ENV=production \
    PORT=3000 \
    NEXT_PUBLIC_API_URL=https://ai-recruitment-backend.grayisland-39090923.eastasia.azurecontainerapps.io/api \
    NEXT_PUBLIC_APP_NAME="AI Recruitment System" \
    NEXT_PUBLIC_ORG_NAME="Your Organization" \
    NEXT_PUBLIC_DEBUG=false \
    NEXT_PUBLIC_ENABLE_CHATBOT=false \
    NEXT_PUBLIC_ENABLE_SEARCH_STATS=true \
    NEXT_PUBLIC_ENABLE_BULK_OPERATIONS=true \
    NEXT_PUBLIC_MAX_FILE_SIZE=10 \
    NEXT_PUBLIC_DEFAULT_PAGE_SIZE=20 \
    NEXT_PUBLIC_SEARCH_DEBOUNCE=500 \
    NEXT_PUBLIC_API_TIMEOUT=30000
```

## 3. Runtime Environment Variable Configuration

### Update Environment Variables

You can update environment variables at runtime without redeploying:

```bash
# Update API URL
az containerapp update \
  --name "ai-recruitment-frontend" \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars NEXT_PUBLIC_API_URL="https://new-api-url.com/api"

# Update multiple variables
az containerapp update \
  --name "ai-recruitment-frontend" \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars \
    NEXT_PUBLIC_DEBUG=true \
    NEXT_PUBLIC_ENABLE_CHATBOT=true \
    NEXT_PUBLIC_ORG_NAME="New Organization Name"
```

### View Current Environment Variables

```bash
az containerapp show \
  --name "ai-recruitment-frontend" \
  --resource-group $RESOURCE_GROUP \
  --query "properties.template.containers[0].env"
```

## 4. Environment Variable Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API endpoint | `https://your-backend.azurecontainerapps.io/api` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Application port | `3000` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NEXT_PUBLIC_APP_NAME` | Application title | "AI Recruitment System" | "My Company HR" |
| `NEXT_PUBLIC_ORG_NAME` | Organization name | "Your Organization" | "Acme Corp" |
| `NEXT_PUBLIC_DEBUG` | Enable debug features | `false` | `true` |
| `NEXT_PUBLIC_ENABLE_CHATBOT` | Enable chatbot feature | `false` | `true` |
| `NEXT_PUBLIC_ENABLE_SEARCH_STATS` | Enable search statistics | `true` | `false` |
| `NEXT_PUBLIC_ENABLE_BULK_OPERATIONS` | Enable bulk operations | `true` | `false` |
| `NEXT_PUBLIC_MAX_FILE_SIZE` | Max file upload size (MB) | `10` | `25` |
| `NEXT_PUBLIC_DEFAULT_PAGE_SIZE` | Default pagination size | `20` | `50` |
| `NEXT_PUBLIC_SEARCH_DEBOUNCE` | Search debounce delay (ms) | `500` | `1000` |
| `NEXT_PUBLIC_API_TIMEOUT` | API request timeout (ms) | `30000` | `60000` |

## 5. Scaling and Monitoring

### Auto-scaling Rules

```bash
# Add scaling rule based on HTTP requests
az containerapp revision set-mode \
  --name "ai-recruitment-frontend" \
  --resource-group $RESOURCE_GROUP \
  --mode multiple

az containerapp update \
  --name "ai-recruitment-frontend" \
  --resource-group $RESOURCE_GROUP \
  --min-replicas 2 \
  --max-replicas 10 \
  --scale-rule-name "http-scaling" \
  --scale-rule-type "http" \
  --scale-rule-http-concurrency 50
```

### View Logs

```bash
# View application logs
az containerapp logs show \
  --name "ai-recruitment-frontend" \
  --resource-group $RESOURCE_GROUP \
  --follow
```

## 6. Health Check and Monitoring

The Dockerfile includes a health check endpoint. Ensure your application responds to `/api/health`:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'healthy', timestamp: new Date().toISOString() })
}
```

## 7. Troubleshooting

### Common Issues

1. **Image Pull Errors**: Ensure ACR credentials are configured
2. **Port Mismatch**: Verify `PORT` environment variable matches `target-port`
3. **Environment Variables**: Check that all required variables are set
4. **Health Check Failures**: Verify health endpoint is accessible

### Debug Commands

```bash
# Check container app status
az containerapp show \
  --name "ai-recruitment-frontend" \
  --resource-group $RESOURCE_GROUP

# View revision details
az containerapp revision list \
  --name "ai-recruitment-frontend" \
  --resource-group $RESOURCE_GROUP

# Restart container app
az containerapp restart \
  --name "ai-recruitment-frontend" \
  --resource-group $RESOURCE_GROUP
```

## 8. Cost Optimization

- Use `--min-replicas 0` for development environments
- Set appropriate CPU and memory limits
- Monitor usage with Azure Cost Management
- Consider using consumption plan for variable workloads

## 9. Security Best Practices

- Use managed identity for ACR access
- Enable HTTPS ingress
- Set appropriate resource limits
- Use non-root user (already configured in Dockerfile)
- Regularly update base images

## 10. CI/CD Integration

Consider setting up GitHub Actions or Azure DevOps pipelines for automated deployments:

```yaml
# Example GitHub Actions workflow
name: Deploy to Azure Container Apps
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push
        run: |
          docker build -t ${{ secrets.ACR_NAME }}.azurecr.io/ai-recruitment-frontend:${{ github.sha }} .
          docker push ${{ secrets.ACR_NAME }}.azurecr.io/ai-recruitment-frontend:${{ github.sha }}
      - name: Deploy to Azure
        run: |
          az containerapp update \
            --name "ai-recruitment-frontend" \
            --resource-group ${{ secrets.RESOURCE_GROUP }} \
            --image ${{ secrets.ACR_NAME }}.azurecr.io/ai-recruitment-frontend:${{ github.sha }}
``` 