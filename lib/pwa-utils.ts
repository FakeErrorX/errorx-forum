'use client';

// PWA utilities for service worker registration and offline functionality

export interface OfflineAction {
  id: string;
  type: 'post' | 'comment' | 'reaction';
  data: any;
  timestamp: number;
  postId?: string;
}

class PWAManager {
  private static instance: PWAManager;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isOnline = true;
  private offlineQueue: OfflineAction[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.setupEventListeners();
    }
  }

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  async registerServiceWorker(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return false;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered:', this.swRegistration);

      // Handle updates
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available, refresh?
              this.notifyUpdate();
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  private setupEventListeners(): void {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineActions();
      this.notifyConnectionStatus(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyConnectionStatus(false);
    });

    // Page visibility for better caching
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncOfflineActions();
      }
    });
  }

  private notifyUpdate(): void {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      new Notification('Update Available', {
        body: 'A new version of ErrorX Forum is available. Refresh to update.',
        icon: '/icons/icon-192x192.png',
        tag: 'update-available',
      });
    }
  }

  private notifyConnectionStatus(online: boolean): void {
    const event = new CustomEvent('connectionchange', { detail: { online } });
    window.dispatchEvent(event);
  }

  // Offline queue management
  async queueOfflineAction(action: OfflineAction): Promise<void> {
    try {
      const db = await this.openDB();
      const storeName = `offline-${action.type}s`;
      
      await this.addToStore(db, storeName, action);
      this.offlineQueue.push(action);
      
      // Register background sync if available
      try {
        if ('serviceWorker' in navigator) {
          // Background sync will be handled by the service worker
          console.log('Queued offline action for sync');
        }
      } catch (error) {
        console.log('Background sync not available');
      }
    } catch (error) {
      console.error('Failed to queue offline action:', error);
    }
  }

  private async syncOfflineActions(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    const actions = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const action of actions) {
      try {
        await this.syncAction(action);
      } catch (error) {
        console.error('Failed to sync action:', error);
        // Re-queue failed actions
        this.offlineQueue.push(action);
      }
    }
  }

  private async syncAction(action: OfflineAction): Promise<void> {
    let url = '';
    let method = 'POST';

    switch (action.type) {
      case 'post':
        url = '/api/posts';
        break;
      case 'comment':
        url = `/api/posts/${action.postId}/comments`;
        break;
      case 'reaction':
        url = `/api/posts/${action.postId}/reactions`;
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action.data),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync ${action.type}: ${response.statusText}`);
    }

    // Remove from offline storage
    const db = await this.openDB();
    await this.deleteFromStore(db, `offline-${action.type}s`, action.id);
  }

  // Push notifications
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async subscribeToPushNotifications(): Promise<string | null> {
    if (!this.swRegistration) {
      console.error('Service Worker not registered');
      return null;
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        // applicationServerKey will be handled by the server if needed
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return JSON.stringify(subscription);
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  // IndexedDB helpers
  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('errorx-forum', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('offline-posts')) {
          db.createObjectStore('offline-posts', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('offline-comments')) {
          db.createObjectStore('offline-comments', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('offline-reactions')) {
          db.createObjectStore('offline-reactions', { keyPath: 'id' });
        }
      };
    });
  }

  private addToStore(db: IDBDatabase, storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private deleteFromStore(db: IDBDatabase, storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Utility methods
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  }

  async getCacheSize(): Promise<number> {
    if (!('caches' in window)) return 0;
    
    let totalSize = 0;
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }
    
    return totalSize;
  }
}

// Export singleton instance
export const pwaManager = PWAManager.getInstance();

// React hooks for PWA functionality
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleConnectionChange = (event: any) => {
      setIsOnline(event.detail.online);
    };

    window.addEventListener('connectionchange', handleConnectionChange);

    return () => {
      window.removeEventListener('connectionchange', handleConnectionChange);
    };
  }, []);

  return isOnline;
}

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setCanInstall(false);
      setInstallPrompt(null);
      return choice.outcome === 'accepted';
    } catch (error) {
      console.error('Installation failed:', error);
      return false;
    }
  };

  return { canInstall, install };
}