# FTPS Deployment Checklist - AI Recruitment Frontend

## 📋 **Pre-Deployment Checklist**

### ✅ Build Verification
- [x] Application built successfully (`npm run build`)
- [x] `.next/` folder contains build artifacts
- [x] No build errors or warnings
- [x] Repository cleaned up (removed unnecessary files)

### ✅ Files Ready for Upload

**Required Files (must upload to Azure):**
```
✅ .next/                    # Build output
✅ public/                   # Static assets  
✅ package.json              # Dependencies
✅ package-lock.json         # Exact dependency versions
✅ server.js                 # Custom Node.js server
✅ .npmrc                    # NPM config (legacy-peer-deps)
✅ process.json              # PM2 configuration (optional)
```

**Config Files (recommended to upload):**
```
✅ next.config.mjs          # Next.js configuration
✅ tsconfig.json            # TypeScript config
✅ postcss.config.mjs       # PostCSS config
```

**Files NOT to Upload:**
```
❌ node_modules/            # Install on Azure instead
❌ .git/                    # Version control
❌ app/, components/, etc.  # Source files (not needed after build)
❌ .env.local              # Use Azure app settings
❌ README.md               # Documentation (not needed on server)
❌ *.md files              # Documentation files
```

## 🔗 **FTPS Connection Setup**

### Step 1: Get FTPS Credentials
**Azure Portal Path:** Your App Service → Deployment Center → FTPS credentials

**Copy these values:**
- **FTPS endpoint**: `ftps://waws-prod-xxx.ftp.azurewebsites.windows.net`
- **Username**: `your-app-name\$your-app-name`
- **Password**: `[auto-generated]`

### Step 2: Choose FTP Client
**Recommended:** FileZilla (free, easy to use)

**FileZilla Settings:**
- Host: `ftps://waws-prod-xxx.ftp.azurewebsites.windows.net`
- Protocol: `FTP - File Transfer Protocol`
- Encryption: `Require explicit FTP over TLS`
- Port: `21`

## 📤 **Upload Process**

### Step 3: Upload Files
1. **Connect to FTPS server**
2. **Navigate to `/site/wwwroot`**
3. **Clear existing files** (select all, delete)
4. **Upload required files** (drag & drop from local folder)
5. **Verify `.next` folder uploaded completely** (this is critical!)

### Step 4: Install Dependencies
**Via Kudu Console:**
1. Go to `https://your-app-name.scm.azurewebsites.net`
2. Debug Console → CMD
3. Navigate to `site/wwwroot`
4. Run: `npm install --legacy-peer-deps --production`

## ⚙️ **Azure Configuration**

### Step 5: Environment Variables
**Azure Portal:** Configuration → Application settings

**Add these variables:**
```
NODE_ENV = production
NEXT_PUBLIC_API_URL = https://ai-recruitment-backend.grayisland-39090923.eastasia.azurecontainerapps.io/api
NEXT_PUBLIC_DEBUG = false
NEXT_PUBLIC_APP_NAME = AI Recruitment System
NEXT_PUBLIC_ORG_NAME = Your Organization
NEXT_PUBLIC_MAX_FILE_SIZE = 10
NEXT_PUBLIC_DEFAULT_PAGE_SIZE = 20
NEXT_PUBLIC_SEARCH_DEBOUNCE = 500
NEXT_PUBLIC_API_TIMEOUT = 30000
NEXT_PUBLIC_ENABLE_CHATBOT = false
NEXT_PUBLIC_ENABLE_SEARCH_STATS = true
NEXT_PUBLIC_ENABLE_BULK_OPERATIONS = true
WEBSITE_NODE_DEFAULT_VERSION = 18-lts
```

### Step 6: Startup Command
**Azure Portal:** Configuration → General settings → Startup Command

**Set to:** `npm start`

**Alternative commands if needed:**
- `node server.js`
- `pm2 start process.json --no-daemon`

## 🧪 **Testing & Verification**

### Step 7: Deploy & Test
1. **Restart App Service** (Overview → Restart)
2. **Monitor logs** (Log stream under Monitoring)
3. **Browse application** (click Browse or visit your URL)
4. **Check for errors** in application logs

### Expected Success Indicators:
```
✅ FTPS upload completed without errors
✅ npm install completed successfully
✅ Application starts without errors
✅ Web app loads in browser
✅ No 5xx errors in logs
✅ API calls working (if backend is available)
```

## 🚨 **Troubleshooting**

### Upload Issues:
- **Connection fails**: Check FTPS credentials, use passive mode
- **Upload incomplete**: Verify `.next` folder uploaded fully
- **Permission denied**: Use correct FTPS protocol (not SFTP)

### App Start Issues:
- **Container exits**: Check startup command is set
- **Dependencies missing**: Run npm install via Kudu console
- **Port binding**: Verify server.js listens on process.env.PORT

### Runtime Issues:
- **404 errors**: Check if `.next` folder uploaded correctly
- **500 errors**: Check environment variables
- **API failures**: Verify NEXT_PUBLIC_API_URL is correct

## 📁 **Final Repository Structure**

Your cleaned repository should now have:
```
AiRecruitmentFrontend/
├── .next/                  # ✅ Build output (upload)
├── public/                 # ✅ Static files (upload)
├── app/                    # 📁 Source files (keep in repo, don't upload)
├── components/             # 📁 Source files (keep in repo, don't upload)
├── lib/                    # 📁 Source files (keep in repo, don't upload)
├── package.json            # ✅ Required (upload)
├── package-lock.json       # ✅ Required (upload)
├── server.js               # ✅ Required (upload)
├── .npmrc                  # ✅ Required (upload)
├── process.json            # ✅ Optional (upload)
├── next.config.mjs         # ✅ Config (upload)
├── tsconfig.json           # ✅ Config (upload)
└── node_modules/           # ❌ Don't upload (install on Azure)
```

## ✅ **Ready to Deploy!**

Your repository is now clean and ready for FTPS deployment. The unnecessary files (`startup.sh`, `web.config`) have been removed, and you have a clear list of what to upload.

**Next step:** Get your FTPS credentials from Azure Portal and start the upload process! 