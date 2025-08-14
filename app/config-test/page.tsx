import { ConfigDebug } from '@/components/config-debug';

export default function ConfigTestPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configuration Test Page</h1>
        <p className="text-gray-600 mt-2">
          This page shows the current runtime configuration. Environment variables can be changed in Azure Portal without redeploying.
        </p>
      </div>
      
      <ConfigDebug />
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">How to Test Runtime Configuration</h2>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Deploy this application to Azure Container Apps</li>
          <li>Go to Azure Portal → Container Apps → Your App → Configuration</li>
          <li>Change any environment variable (e.g., NEXT_PUBLIC_API_URL)</li>
          <li>Save the changes</li>
          <li>Refresh this page - the new values should appear immediately</li>
        </ol>
      </div>
    </div>
  );
} 