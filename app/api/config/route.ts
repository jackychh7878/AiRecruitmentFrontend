export async function GET() {
  try {
    // Log environment variables for debugging (only in debug mode)
    const isDebug = process.env.NEXT_PUBLIC_DEBUG === 'true'
    
    if (isDebug) {
      console.log('🔍 Environment Variables Debug:', {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_DEBUG: process.env.NEXT_PUBLIC_DEBUG,
        // Log all NEXT_PUBLIC_ variables
        allNextPublicVars: Object.keys(process.env)
          .filter(key => key.startsWith('NEXT_PUBLIC_'))
          .reduce((acc, key) => {
            acc[key] = process.env[key]
            return acc
          }, {} as Record<string, string | undefined>)
      })
    }

    // Return runtime configuration that can be accessed by the frontend
    const config = {
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'AI Recruitment System',
      orgName: process.env.NEXT_PUBLIC_ORG_NAME || 'Your Organization',
      debug: process.env.NEXT_PUBLIC_DEBUG === 'true',
      enableChatbot: process.env.NEXT_PUBLIC_ENABLE_CHATBOT === 'true',
      enableSearchStats: process.env.NEXT_PUBLIC_ENABLE_SEARCH_STATS === 'true',
      enableBulkOperations: process.env.NEXT_PUBLIC_ENABLE_BULK_OPERATIONS === 'true',
      maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10'),
      defaultPageSize: parseInt(process.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE || '20'),
      searchDebounce: parseInt(process.env.NEXT_PUBLIC_SEARCH_DEBOUNCE || '500'),
      apiTimeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
      environment: process.env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString()
    };

    if (isDebug) {
      console.log('📤 Config Response:', config)
    }

    return Response.json(config, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('❌ Config Route Error:', error)
    return Response.json(
      { 
        error: 'Failed to load configuration',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
} 