"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useConfig } from "@/components/config-provider"
import { useApi } from "@/hooks/use-api"
import { getApiConfig, getApiClient } from "@/lib/api"
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react"

export default function DebugConfigPage() {
  const { config, loading: configLoading, configVersion } = useConfig()
  const api = useApi()
  const [refreshKey, setRefreshKey] = useState(0)
  const [testResult, setTestResult] = useState<any>(null)

  const refresh = () => {
    setRefreshKey(prev => prev + 1)
    setTestResult(null)
  }

  const testApiConnection = async () => {
    try {
      console.log('Testing API connection...')
      // Try to fetch candidates to test the API
      const response = await api.getCandidates({ page: 1, per_page: 1 }) // Get 1 candidate per page, page 1
      setTestResult({ success: true, data: response })
    } catch (error) {
      console.error('API test failed:', error)
      setTestResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }

  useEffect(() => {
    // Log everything when component mounts or refreshes
    console.log('🔍 Debug Config Component - Current State:', {
      configLoading,
      configVersion,
      config,
      apiConfig: getApiConfig(),
      apiClient: {
        baseUrl: api.baseUrl,
        timeout: api.timeoutValue
      },
      timestamp: new Date().toISOString()
    })
  }, [config, configLoading, configVersion, api, refreshKey])

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Configuration Debug</h1>
          <p className="text-gray-600">Debug API configuration and connectivity</p>
        </div>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Runtime Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Runtime Configuration
              {configLoading ? (
                <AlertCircle className="w-5 h-5 ml-2 text-yellow-500" />
              ) : (
                <CheckCircle className="w-5 h-5 ml-2 text-green-500" />
              )}
            </CardTitle>
            <CardDescription>
              Config from /api/config endpoint (ConfigProvider)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Loading:</strong> {configLoading ? 'Yes' : 'No'}</div>
              <div><strong>Config Version:</strong> {configVersion}</div>
              <div><strong>API URL:</strong> {config?.apiUrl || 'Not loaded'}</div>
              <div><strong>API Timeout:</strong> {config?.apiTimeout || 'Not loaded'}</div>
              <div><strong>Environment:</strong> {config?.environment || 'Not loaded'}</div>
              <div><strong>Debug Mode:</strong> {config?.debug ? 'Yes' : 'No'}</div>
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">Full Config Object</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(config, null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>

        {/* API Client State */}
        <Card>
          <CardHeader>
            <CardTitle>API Client State</CardTitle>
            <CardDescription>Current API client configuration from lib/api.ts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Global Config Base URL:</strong> {getApiConfig().baseUrl}</div>
              <div><strong>Global Config Timeout:</strong> {getApiConfig().timeout}</div>
              <div><strong>useApi() Base URL:</strong> {api.baseUrl}</div>
              <div><strong>useApi() Timeout:</strong> {api.timeoutValue}</div>
              <div><strong>URLs Match:</strong> {getApiConfig().baseUrl === api.baseUrl ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Using Localhost:</strong> {api.baseUrl.includes('localhost') ? '❌ Yes' : '✅ No'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Info</CardTitle>
            <CardDescription>Client-side environment detection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Window Location:</strong> {typeof window !== 'undefined' ? window.location.href : 'SSR'}</div>
              <div><strong>Is Production:</strong> {typeof window !== 'undefined' && !window.location.hostname.includes('localhost') ? 'Yes' : 'No'}</div>
              <div><strong>Process ENV NODE_ENV:</strong> {process.env.NODE_ENV}</div>
              <div><strong>Process ENV API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</div>
            </div>
          </CardContent>
        </Card>

        {/* API Test */}
        <Card>
          <CardHeader>
            <CardTitle>API Connectivity Test</CardTitle>
            <CardDescription>Test actual API connection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={testApiConnection} disabled={configLoading}>
                Test API Connection
              </Button>
              
              {testResult && (
                <div className={`p-4 rounded ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {testResult.success ? (
                    <div>
                      <div className="flex items-center text-green-700 font-medium">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        API Connection Successful
                      </div>
                      <div className="mt-2 text-sm text-green-600">
                        Successfully fetched data from the API
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center text-red-700 font-medium">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        API Connection Failed
                      </div>
                      <div className="mt-2 text-sm text-red-600">
                        {testResult.error}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 