'use client';

import { useConfig } from './config-provider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export function ConfigDebug() {
  const { config, loading, error } = useConfig();

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading configuration...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Configuration Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Runtime Configuration</CardTitle>
        <p className="text-sm text-gray-500">
          Last updated: {new Date(config.timestamp).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">API URL</label>
            <p className="text-sm text-gray-900 break-all">{config.apiUrl}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Environment</label>
            <Badge variant={config.environment === 'production' ? 'default' : 'secondary'}>
              {config.environment}
            </Badge>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">App Name</label>
            <p className="text-sm text-gray-900">{config.appName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Organization</label>
            <p className="text-sm text-gray-900">{config.orgName}</p>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <label className="text-sm font-medium text-gray-700">Feature Flags</label>
          <div className="flex gap-2 mt-2">
            <Badge variant={config.debug ? 'default' : 'outline'}>
              Debug: {config.debug ? 'ON' : 'OFF'}
            </Badge>
            <Badge variant={config.enableChatbot ? 'default' : 'outline'}>
              Chatbot: {config.enableChatbot ? 'ON' : 'OFF'}
            </Badge>
            <Badge variant={config.enableSearchStats ? 'default' : 'outline'}>
              Search Stats: {config.enableSearchStats ? 'ON' : 'OFF'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 