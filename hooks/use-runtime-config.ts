import { useState, useEffect } from 'react';

interface RuntimeConfig {
  apiUrl: string;
  appName: string;
  orgName: string;
  debug: boolean;
  enableChatbot: boolean;
  enableSearchStats: boolean;
  enableBulkOperations: boolean;
  maxFileSize: number;
  defaultPageSize: number;
  searchDebounce: number;
  apiTimeout: number;
  environment: string;
  timestamp: string;
  // N8N Chatbot Configuration
  n8nWebhookUrl: string;
  n8nAuthKey: string;
  n8nAuthValue: string;
  typewriterSpeed: number;
  enableTypewriter: boolean;
}

const defaultConfig: RuntimeConfig = {
  apiUrl: 'http://localhost:5000/api',
  appName: 'AI Recruitment System',
  orgName: 'Your Organization',
  debug: false,
  enableChatbot: false,
  enableSearchStats: true,
  enableBulkOperations: true,
  maxFileSize: 10,
  defaultPageSize: 20,
  searchDebounce: 500,
  apiTimeout: 30000,
  environment: 'development',
  timestamp: new Date().toISOString(),
  // N8N Chatbot Configuration defaults
  n8nWebhookUrl: '',
  n8nAuthKey: '',
  n8nAuthValue: '',
  typewriterSpeed: 100,
  enableTypewriter: true
};

export function useRuntimeConfig() {
  const [config, setConfig] = useState<RuntimeConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch runtime configuration from the API
        const response = await fetch('/api/config', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch config: ${response.status}`);
        }

        const runtimeConfig = await response.json();
        setConfig(runtimeConfig);
      } catch (err) {
        console.error('Failed to load runtime configuration:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fall back to default config
        setConfig(defaultConfig);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, loading, error };
}

// Export default config for use in components that don't need the hook
export { defaultConfig }; 