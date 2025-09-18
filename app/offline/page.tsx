'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, Home, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-full w-fit">
            <WifiOff className="h-8 w-8 text-gray-600" />
          </div>
          <CardTitle className="text-2xl">You're Offline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-gray-600">
              It looks like you've lost your internet connection. Don't worry, you can still browse 
              some cached content.
            </p>
            <p className="text-sm text-gray-500">
              Any actions you take will be synced once you're back online.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleRetry} 
              className="w-full flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Link href="/">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </Link>
              
              <Link href="/conversations">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Messages
                </Button>
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">Available Offline:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Recently viewed posts</li>
              <li>• Cached conversations</li>
              <li>• Your profile information</li>
              <li>• Draft posts and comments</li>
            </ul>
          </div>

          <div className="pt-4 border-t text-xs text-gray-500">
            <p>
              Offline mode powered by service worker caching. 
              Your data will sync automatically when connection is restored.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}