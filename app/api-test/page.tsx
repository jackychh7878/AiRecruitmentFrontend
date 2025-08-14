'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/use-api';
import { useConfig } from '@/components/config-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

export default function ApiTestPage() {
  const { config } = useConfig();
  const api = useApi();
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testApiCall = async () => {
    try {
      setLoading(true);
      setTestResult(null);
      
      console.log('🧪 Testing API call with candidates endpoint');
      console.log('🔧 Current API config:', { baseUrl: api.baseUrl, timeout: api.timeoutValue });
      
      const response = await api.getCandidates({ page: 1, per_page: 5 });
      setTestResult({
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const testHealthCheck = async () => {
    try {
      setLoading(true);
      setTestResult(null);
      
      const response = await fetch('/api/health');
      const data = await response.json();
      
      setTestResult({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">API Configuration Test</h1>
        <p className="text-gray-600 mt-2">
          Test and verify your API configuration is working correctly.
        </p>
      </div>

      {/* Current Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>API Base URL</Label>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-1 break-all">
                {config.apiUrl}
              </p>
            </div>
            <div>
              <Label>Environment</Label>
              <Badge variant={config.environment === 'production' ? 'default' : 'secondary'}>
                {config.environment}
              </Badge>
            </div>
            <div>
              <Label>API Timeout</Label>
              <p className="text-sm">{config.apiTimeout}ms</p>
            </div>
            <div>
              <Label>Debug Mode</Label>
              <Badge variant={config.debug ? 'default' : 'outline'}>
                {config.debug ? 'ON' : 'OFF'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Test API Calls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testHealthCheck} disabled={loading}>
              {loading ? 'Testing...' : 'Test Health Check'}
            </Button>
            <Button onClick={testApiCall} disabled={loading}>
              {loading ? 'Testing...' : 'Test API Call'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className={testResult.success ? 'text-green-600' : 'text-red-600'}>
              Test Result - {testResult.success ? 'Success' : 'Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Timestamp: {new Date(testResult.timestamp).toLocaleString()}
              </p>
              {testResult.success ? (
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <p className="text-green-800 text-sm">
                    API call successful! Check browser console for detailed request information.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <p className="text-red-800 text-sm">
                    Error: {testResult.error}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Open your browser's developer console to see detailed API request information.
          </p>
          <div className="bg-gray-100 p-3 rounded font-mono text-sm">
            <p>🔍 Check console for:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Configuration updates</li>
              <li>API request URLs</li>
              <li>Request/response details</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 