'use client';

import { createContext, useContext, useEffect, ReactNode, useState } from 'react';
import { useRuntimeConfig } from '@/hooks/use-runtime-config';
import { updateApiConfig, getApiConfig } from '@/lib/api';

interface ConfigContextType {
  config: any;
  loading: boolean;
  error: string | null;
  configVersion: number; // Add version to force re-renders
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { config, loading, error } = useRuntimeConfig();
  const [configVersion, setConfigVersion] = useState(0);

  useEffect(() => {
    if (config && !loading) {
      console.log('🔄 ConfigProvider: Updating API configuration...', {
        oldConfig: getApiConfig(),
        newConfig: { apiUrl: config.apiUrl, timeout: config.apiTimeout }
      });
      
      // Update API configuration with runtime values
      updateApiConfig(config.apiUrl, config.apiTimeout);
      
      // Increment version to force re-renders
      setConfigVersion(prev => prev + 1);
      
      // Log configuration for debugging
      if (config.debug) {
        console.log('✅ Runtime configuration loaded:', config);
      }
      
      console.log('✅ ConfigProvider: API configuration updated. New config:', getApiConfig());
    }
  }, [config, loading]);

  const value = {
    config,
    loading,
    error,
    configVersion
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
} 