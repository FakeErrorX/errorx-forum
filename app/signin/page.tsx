"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Sign in failed", {
          description: "Please check your credentials and try again."
        });
      } else {
        const session = await getSession();
        if (session?.user) {
          setUser(session.user as User);
      toast.success("Welcome back!", {
            description: `Signed in as ${session.user.name}`
      });
      router.push("/");
        }
      }
    } catch (error: any) {
      toast.error("Sign in failed", {
        description: error.message || "Please check your credentials and try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      toast.success("Reset link sent!", {
        description: data.message || "Check your email for password reset instructions."
      });
      
      setResetEmail("");
      setForgotPassword(false);
    } catch (error: any) {
      toast.error("Failed to send reset email", {
        description: error.message || "Please check your email address and try again."
      });
    } finally {
      setResetLoading(false);
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
                  src={theme === 'dark' ? '/logo-light.png' : '/logo-dark.png'} 
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
                    src={theme === 'dark' ? '/logo-light.png' : '/logo-dark.png'} 
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
              <p className="mt-2 text-muted-foreground">Sign in to your account to continue</p>
            </div>

            <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl text-center">Sign in</CardTitle>
                <CardDescription className="text-center">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
            {!forgotPassword ? (
              <>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                        <div className="relative">
                          <Icon 
                            icon="lucide:mail" 
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" 
                          />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-11"
                      required
                    />
                        </div>
                  </div>
                  
                  <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                          <Icon 
                            icon="lucide:lock" 
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" 
                          />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10 h-11"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                              <Icon icon="lucide:eye-off" className="h-4 w-4 text-muted-foreground" />
                        ) : (
                              <Icon icon="lucide:eye" className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            id="remember"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <Label htmlFor="remember" className="text-sm text-muted-foreground">
                            Remember me
                          </Label>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForgotPassword(true)}
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          Forgot password?
                        </button>
                      </div>
                      
                      <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                    {loading ? (
                      <>
                        <Icon icon="lucide:loader-2" className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                          <>
                            <Icon icon="lucide:log-in" className="mr-2 h-4 w-4" />
                            Sign in
                          </>
                    )}
                  </Button>
                </form>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-11" disabled>
                        <Icon icon="lucide:github" className="mr-2 h-4 w-4" />
                        GitHub
                      </Button>
                      <Button variant="outline" className="h-11" disabled>
                        <Icon icon="lucide:chrome" className="mr-2 h-4 w-4" />
                        Google
                      </Button>
                </div>

                    <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                        <Link href="/signup" className="text-primary hover:underline font-medium">
                          Create one now
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              <>
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon icon="lucide:key" className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold">Reset your password</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Enter your email address and we'll send you a reset link
                      </p>
                    </div>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                        <Label htmlFor="resetEmail" className="text-sm font-medium">Email address</Label>
                        <div className="relative">
                          <Icon 
                            icon="lucide:mail" 
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" 
                          />
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="Enter your email address"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                            className="pl-10 h-11"
                      required
                    />
                        </div>
                  </div>
                  
                      <Button type="submit" className="w-full h-11 text-base font-medium" disabled={resetLoading}>
                    {resetLoading ? (
                      <>
                        <Icon icon="lucide:loader-2" className="mr-2 h-4 w-4 animate-spin" />
                        Sending reset email...
                      </>
                    ) : (
                          <>
                            <Icon icon="lucide:send" className="mr-2 h-4 w-4" />
                            Send reset email
                          </>
                    )}
                  </Button>
                </form>

                    <div className="text-center">
                  <button
                    type="button"
                        onClick={() => setForgotPassword(false)}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        <Icon icon="lucide:arrow-left" className="inline h-3 w-3 mr-1" />
                    Back to sign in
                  </button>
                </div>
              </>
            )}
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
