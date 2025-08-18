import { useEffect } from 'react'
import { useRuntimeConfig } from './use-runtime-config'
import { updateApiConfig } from '@/lib/api'

export function useApiConfig() {
  const { config, loading, error } = useRuntimeConfig()

  useEffect(() => {
    if (!loading && config.apiUrl) {
      updateApiConfig(config.apiUrl, config.apiTimeout)
      console.log('🔧 API client configured:', {
        apiUrl: config.apiUrl,
        apiTimeout: config.apiTimeout,
        timestamp: new Date().toISOString()
      })
    }
  }, [config.apiUrl, config.apiTimeout, loading])

  return { config, loading, error, isConfigured: !loading && !!config.apiUrl }
} 