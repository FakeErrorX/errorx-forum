'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { pwaManager, useOnlineStatus } from '@/lib/pwa-utils';
import { PWAInstallPrompt } from '@/components/ui/pwa-install';
import { toast } from 'sonner';

interface PWAContextType {
  isOnline: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  installPWA: () => Promise<boolean>;
  cacheSize: number;
  clearCache: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const isOnline = useOnlineStatus();
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    // Initialize PWA
    initializePWA();
    
    // Check if app is installed
    checkInstallStatus();
    
    // Listen for install prompt
    setupInstallPrompt();
    
    // Update cache size periodically
    updateCacheSize();
    const interval = setInterval(updateCacheSize, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Show connection status toasts
    if (typeof window !== 'undefined') {
      if (isOnline) {
        toast.success('Connection restored');
      } else {
        toast.warning('You are now offline. Some features may be limited.');
      }
    }
  }, [isOnline]);

  const initializePWA = async () => {
    try {
      const registered = await pwaManager.registerServiceWorker();
      if (registered) {
        console.log('PWA initialized successfully');
        
        // Request notification permission
        const notificationPermission = await pwaManager.requestNotificationPermission();
        if (notificationPermission) {
          await pwaManager.subscribeToPushNotifications();
        }
      }
    } catch (error) {
      console.error('Failed to initialize PWA:', error);
    }
  };

  const checkInstallStatus = () => {
    if (typeof window === 'undefined') return;
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInAppBrowser = (window.navigator as any).standalone === true;
    
    setIsInstalled(isStandalone || isInAppBrowser);
  };

  const setupInstallPrompt = () => {
    if (typeof window === 'undefined') return;
    
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setInstallPrompt(null);
      toast.success('App installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  };

  const updateCacheSize = async () => {
    try {
      const size = await pwaManager.getCacheSize();
      setCacheSize(size);
    } catch (error) {
      console.error('Failed to get cache size:', error);
    }
  };

  const installPWA = async (): Promise<boolean> => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      
      if (choice.outcome === 'accepted') {
        setCanInstall(false);
        setInstallPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Installation failed:', error);
      toast.error('Installation failed. Please try again.');
      return false;
    }
  };

  const clearCache = async () => {
    try {
      await pwaManager.clearCache();
      setCacheSize(0);
      toast.success('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  const contextValue: PWAContextType = {
    isOnline,
    isInstalled,
    canInstall,
    installPWA,
    cacheSize,
    clearCache,
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      {!isInstalled && <PWAInstallPrompt />}
    </PWAContext.Provider>
  );
}