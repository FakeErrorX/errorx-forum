'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInAppBrowser = (window.navigator as any).standalone === true;
    
    setIsInstalled(isStandalone || isInAppBrowser);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPrompt(e);
      
      // Show prompt after a delay if not installed
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true);
        }
      }, 5000);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      
      if (choice.outcome === 'accepted') {
        console.log('PWA installed successfully');
      }
      
      setInstallPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember user dismissed for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed or user dismissed
  if (isInstalled || !showPrompt || !installPrompt) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-80 z-50 shadow-lg border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Smartphone className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Install ErrorX Forum</h3>
            <p className="text-xs text-gray-600 mb-3">
              Get the app experience with offline access, push notifications, and faster loading.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleInstall} className="text-xs">
                <Download className="h-3 w-3 mr-1" />
                Install
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDismiss}
                className="text-xs"
              >
                Later
              </Button>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="p-1 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PWAFeatures() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <Monitor className="h-6 w-6 text-blue-600 mx-auto mb-2" />
        <h4 className="font-medium text-sm mb-1">Desktop App</h4>
        <p className="text-xs text-gray-600">
          Install as a desktop application for quick access
        </p>
      </div>
      
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <Smartphone className="h-6 w-6 text-green-600 mx-auto mb-2" />
        <h4 className="font-medium text-sm mb-1">Mobile App</h4>
        <p className="text-xs text-gray-600">
          Add to home screen for native app experience
        </p>
      </div>
      
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <Download className="h-6 w-6 text-purple-600 mx-auto mb-2" />
        <h4 className="font-medium text-sm mb-1">Offline Access</h4>
        <p className="text-xs text-gray-600">
          Read content and create posts while offline
        </p>
      </div>
    </div>
  );
}