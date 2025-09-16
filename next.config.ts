import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	env: {
		// Expose SEO-related envs to the client bundle
		SITE_URL: process.env.SITE_URL,
		SITE_NAME: process.env.SITE_NAME,
		SITE_DESCRIPTION: process.env.SITE_DESCRIPTION,
		TWITTER_HANDLE: process.env.TWITTER_HANDLE,
		TWITTER_SITE: process.env.TWITTER_SITE,
		TWITTER_URL: process.env.TWITTER_URL,
		GITHUB_URL: process.env.GITHUB_URL,
		TELEGRAM_URL: process.env.TELEGRAM_URL,
		FACEBOOK_URL: process.env.FACEBOOK_URL,
	},
};

export default nextConfig;