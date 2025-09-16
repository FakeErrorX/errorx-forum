'use client';

import { GoogleAnalytics } from '@next/third-parties/google';

interface GoogleAnalyticsProps {
  gaId: string;
}

export function GoogleAnalyticsComponent({ gaId }: GoogleAnalyticsProps) {
  if (!gaId) {
    console.warn('Google Analytics ID is not provided');
    return null;
  }

  return <GoogleAnalytics gaId={gaId} />;
}
