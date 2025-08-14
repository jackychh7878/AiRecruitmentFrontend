import { useMemo } from 'react';
import { getApiClient } from '@/lib/api';
import { useConfig } from '@/components/config-provider';

/**
 * Hook that returns the current API client instance
 * This ensures the API client always uses the latest configuration
 */
export function useApi() {
  const { configVersion } = useConfig();
  
  return useMemo(() => getApiClient(), [configVersion]);
} 