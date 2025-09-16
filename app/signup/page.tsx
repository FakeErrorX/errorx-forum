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

export default function SignUpPage() {
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Username validation states
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameMessage, setUsernameMessage] = useState("");

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameStatus('invalid');
      setUsernameMessage("Username must be at least 3 characters long");
      return;
    }

    setUsernameStatus('checking');
    setUsernameMessage("Checking availability...");

    try {
      const response = await fetch('/api/users/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const data = await response.json();

      if (data.available) {
        setUsernameStatus('available');
        setUsernameMessage("Username is available");
      } else {
        setUsernameStatus('taken');
        setUsernameMessage(data.message || "Username is already taken");
      }
    } catch (error) {
      setUsernameStatus('idle');
      setUsernameMessage("");
    }
  };

  // Debounced username checking
  useEffect(() => {
    if (!username) {
      setUsernameStatus('idle');
      setUsernameMessage("");
      return;
    }

    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [username]);

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match", {
        description: "Please make sure both passwords are identical."
      });
      return;
    }

    if (password.length < 8) {
      toast.error("Password too short", {
        description: "Password must be at least 8 characters long."
      });
      return;
    }

    if (username.length < 3) {
      toast.error("Username too short", {
        description: "Username must be at least 3 characters long."
      });
      return;
    }

    if (usernameStatus !== 'available') {
      toast.error("Username not available", {
        description: usernameMessage || "Please choose a different username."
      });
      return;
    }

    setLoading(true);

    try {
      // Create user account via API
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          username,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error("Sign up failed", {
          description: errorData.error || "Please try again with different credentials."
        });
        setLoading(false);
        return;
      }

      // Auto-login after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Auto-login failed", {
          description: "Account created but auto-login failed. Please sign in manually."
        });
        router.push("/signin");
      } else {
        const session = await getSession();
        if (session?.user) {
          setUser(session.user as User);
          toast.success("Account created successfully!", {
            description: `Welcome to ErrorX Community, ${name}!`
          });
          router.push("/");
        }
      }
    } catch (error: unknown) {
      toast.error("Sign up failed", {
        description: (error as Error).message || "Please try again with different credentials."
      });
    } finally {
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
            <CardTitle className="text-2xl">Welcome to ErrorX Community!</CardTitle>
            <CardDescription>
              Your account has been created successfully
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
              Join our amazing community
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Connect with developers worldwide, share your knowledge, and grow together in our vibrant community.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon icon="lucide:users" className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Join Thousands</p>
                  <p className="text-sm text-muted-foreground">Connect with active developers</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon icon="lucide:lightbulb" className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Share Knowledge</p>
                  <p className="text-sm text-muted-foreground">Post tutorials, tips, and resources</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon icon="lucide:heart" className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Build Reputation</p>
                  <p className="text-sm text-muted-foreground">Earn recognition for your contributions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Sign Up Form */}
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
              <h2 className="text-3xl font-bold text-foreground">Create your account</h2>
              <p className="mt-2 text-muted-foreground">Join our community and start your journey</p>
            </div>

            <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl text-center">Sign up</CardTitle>
                <CardDescription className="text-center">
                  Fill in your details to create your account
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Full name</Label>
                      <div className="relative">
                        <Icon 
                          icon="lucide:user" 
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" 
                        />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10 h-11"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                      <div className="relative">
                        <Icon 
                          icon="lucide:at-sign" 
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" 
                        />
                        <Input
                          id="username"
                          type="text"
                          placeholder="Choose a username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className={`pl-10 pr-10 h-11 ${
                            usernameStatus === 'available' ? 'border-green-500 focus:border-green-500' :
                            usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-500 focus:border-red-500' :
                            ''
                          }`}
                          required
                        />
                        {usernameStatus === 'checking' && (
                          <Icon 
                            icon="lucide:loader-2" 
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" 
                          />
                        )}
                        {usernameStatus === 'available' && (
                          <Icon 
                            icon="lucide:check-circle" 
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" 
                          />
                        )}
                        {usernameStatus === 'taken' && (
                          <Icon 
                            icon="lucide:x-circle" 
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" 
                          />
                        )}
                        {usernameStatus === 'invalid' && (
                          <Icon 
                            icon="lucide:alert-circle" 
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" 
                          />
                        )}
                      </div>
                      {usernameMessage && (
                        <p className={`text-xs ${
                          usernameStatus === 'available' ? 'text-green-600' :
                          usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'text-red-600' :
                          'text-muted-foreground'
                        }`}>
                          {usernameMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  
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
                        placeholder="Create a password"
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</Label>
                    <div className="relative">
                      <Icon 
                        icon="lucide:lock" 
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" 
                      />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10 h-11"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <Icon icon="lucide:eye-off" className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Icon icon="lucide:eye" className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <input
                      id="terms"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-1"
                      required
                    />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground">
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                  
                  <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                    {loading ? (
                      <>
                        <Icon icon="lucide:loader-2" className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <Icon icon="lucide:user-plus" className="mr-2 h-4 w-4" />
                        Create account
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

                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    className="h-11 w-full max-w-xs" 
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    disabled={loading}
                  >
                    <Icon icon="lucide:chrome" className="mr-2 h-4 w-4" />
                    Sign up with Google
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/signin" className="text-primary hover:underline font-medium">
                      Sign in instead
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                By creating an account, you agree to our community guidelines and code of conduct.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
