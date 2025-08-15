// Connection test utility for debugging API issues

import React from 'react'
import { getApiClient } from './api'

export interface ConnectionTestResult {
  isConnected: boolean
  error?: string
  responseTime?: number
  endpoint: string
}

export async function testBackendConnection(): Promise<ConnectionTestResult> {
  const apiClient = getApiClient()
  const endpoint = apiClient.baseUrl
  const startTime = Date.now()
  
  try {
    // Try a simple health check endpoint using a minimal candidates request
    const response = await fetch(`${endpoint}/candidates?page=1&per_page=1`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
    
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      return {
        isConnected: true,
        responseTime,
        endpoint
      }
    } else {
      return {
        isConnected: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseTime,
        endpoint
      }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to backend - server may be down or CORS not configured'
      } else if (error.name === 'AbortError') {
        errorMessage = 'Request timeout'
      } else {
        errorMessage = error.message
      }
    }
    
    return {
      isConnected: false,
      error: errorMessage,
      responseTime,
      endpoint
    }
  }
}

// React hook for connection testing
export function useConnectionTest() {
  const [result, setResult] = React.useState<ConnectionTestResult | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  
  const testConnection = async () => {
    setIsLoading(true)
    const result = await testBackendConnection()
    setResult(result)
    setIsLoading(false)
    return result
  }
  
  return { result, isLoading, testConnection }
} 