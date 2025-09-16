// Unified, client-safe access to public environment values.
// Prefer NEXT_PUBLIC_* if present; otherwise fall back to server envs.

type PublicEnv = {
  SITE_URL: string;
  SITE_NAME: string;
  SITE_DESCRIPTION: string;
  TWITTER_HANDLE: string;
  TWITTER_SITE: string;
  TWITTER_URL: string;
  GITHUB_URL: string;
  TELEGRAM_URL: string;
  FACEBOOK_URL: string;
};

const get = (serverKey: string, publicKey: string): string => {
  return (process.env[publicKey as keyof NodeJS.ProcessEnv] as string) 
    || (process.env[serverKey as keyof NodeJS.ProcessEnv] as string) 
    || '';
};

export const PUBLIC_ENV: PublicEnv = {
  SITE_URL: get('SITE_URL', 'NEXT_PUBLIC_SITE_URL'),
  SITE_NAME: get('SITE_NAME', 'NEXT_PUBLIC_SITE_NAME'),
  SITE_DESCRIPTION: get('SITE_DESCRIPTION', 'NEXT_PUBLIC_SITE_DESCRIPTION'),
  TWITTER_HANDLE: get('TWITTER_HANDLE', 'NEXT_PUBLIC_TWITTER_HANDLE'),
  TWITTER_SITE: get('TWITTER_SITE', 'NEXT_PUBLIC_TWITTER_SITE'),
  TWITTER_URL: get('TWITTER_URL', 'NEXT_PUBLIC_TWITTER_URL'),
  GITHUB_URL: get('GITHUB_URL', 'NEXT_PUBLIC_GITHUB_URL'),
  TELEGRAM_URL: get('TELEGRAM_URL', 'NEXT_PUBLIC_TELEGRAM_URL'),
  FACEBOOK_URL: get('FACEBOOK_URL', 'NEXT_PUBLIC_FACEBOOK_URL'),
};


