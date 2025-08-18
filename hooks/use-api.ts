import { useMemo } from 'react';
import { getApiClient } from '@/lib/api';
import { useConfig } from '@/components/config-provider';

/**
 * Hook that returns the current API client instance
 * This ensures the API client always uses the latest configuration
 */
export function useApi() {
  const { configVersion, config, loading } = useConfig();
  
  return useMemo(() => {
    const apiClient = getApiClient();
    console.log('🔧 useApi: Getting API client', {
      configVersion,
      configLoading: loading,
      apiUrl: config?.apiUrl,
      clientBaseUrl: apiClient.baseUrl,
      timestamp: new Date().toISOString()
    });
    return apiClient;
  }, [configVersion, config?.apiUrl, loading]);
} 