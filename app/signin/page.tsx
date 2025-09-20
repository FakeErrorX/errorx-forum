"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from '@iconify/react';
import Link from "next/link";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import Image from "next/image";

interface User {
  name: string;
  email: string;
  id: string;
}

export default function SignInPage() {
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        const session = await getSession();
        if (session?.user) {
          setUser(session.user as User);
          router.push("/");
        } else {
          setUser(null);
        }
      } catch (error) {
        // User not logged in
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signIn("google", { 
        callbackUrl: "/",
        redirect: false 
      });
      
      if (result?.error) {
        toast.error("Sign in failed", {
          description: result.error || "Please try again."
        });
        setLoading(false);
      } else if (result?.url) {
        // Successful sign in, redirect will happen automatically
        window.location.href = result.url;
      }
    } catch (error: unknown) {
      toast.error("Sign in failed", {
        description: (error as Error).message || "Please try again."
      });
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon icon="lucide:loader-2" className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back!</CardTitle>
            <CardDescription>
              You are logged in as {user.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => router.push("/")} 
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-16">
          <div className="max-w-md">
            <div className="flex items-center space-x-3 mb-8">
              <button 
                onClick={() => router.push("/")}
                className="hover:opacity-80 transition-opacity"
              >
                <Image 
                  src={resolvedTheme === 'dark' ? '/logo-light.png' : '/logo-dark.png'} 
                  alt="ErrorX Logo" 
                  width={100}
                  height={32}
                  className="h-8 w-auto"
                />
              </button>
            </div>
            
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Welcome back to the community
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Connect with developers, share knowledge, and grow together in our vibrant community.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon icon="lucide:users" className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Active Community</p>
                  <p className="text-sm text-muted-foreground">Join thousands of developers</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon icon="lucide:message-square" className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Knowledge Sharing</p>
                  <p className="text-sm text-muted-foreground">Share tips, tricks, and resources</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon icon="lucide:trending-up" className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Stay Updated</p>
                  <p className="text-sm text-muted-foreground">Latest trends and technologies</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex w-full lg:w-1/2 items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Branding */}
            <div className="lg:hidden text-center">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <button 
                  onClick={() => router.push("/")}
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image 
                    src={resolvedTheme === 'dark' ? '/logo-light.png' : '/logo-dark.png'} 
                    alt="ErrorX Logo" 
                    width={100}
                    height={32}
                    className="h-8 w-auto"
                  />
                </button>
              </div>
            </div>

            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
              <p className="mt-2 text-muted-foreground">Sign in with your Google account to continue</p>
            </div>

            <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl text-center">Sign in</CardTitle>
                <CardDescription className="text-center">
                  Use your Google account to access the community
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <Button 
                    className="h-12 w-full text-base font-medium" 
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Icon icon="lucide:loader-2" className="mr-2 h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Icon icon="lucide:chrome" className="mr-2 h-5 w-5" />
                        Continue with Google
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    New to our community? Sign in with Google to join us automatically!
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                By signing in, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
