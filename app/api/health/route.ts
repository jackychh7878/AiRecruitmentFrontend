export async function GET() {
  try {
    // Basic health check - you can add more sophisticated checks here
    // such as database connectivity, external API availability, etc.
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || 'unknown'
    };

    return Response.json(healthData, { status: 200 });
  } catch (error) {
    return Response.json(
      { 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 