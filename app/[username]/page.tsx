"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from '@iconify/react';

export default function UsernameRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // This will be handled by the server-side redirect
    // But we'll add a fallback client-side redirect
    const currentPath = window.location.pathname;
    if (currentPath && currentPath !== '/') {
      const username = currentPath.substring(1); // Remove leading slash
      router.replace(`/profile/${username}`);
    }
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Icon icon="lucide:loader-2" className="h-6 w-6 animate-spin" />
          <span>Redirecting to profile...</span>
        </div>
      </div>
    </div>
  );
}
