"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from '@iconify/react';
import Link from "next/link";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import Image from "next/image";

function ResetPasswordForm() {
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Get token from URL
  const token = searchParams.get('token');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid reset link", {
        description: "Please request a new password reset from the sign in page."
      });
      return;
    }

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

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast.success("Password reset successful!", {
        description: "Your password has been updated successfully."
      });
      
      setSuccess(true);
    } catch (error: unknown) {
      toast.error("Failed to reset password", {
        description: (error as Error)?.message || "Please try again or request a new reset link."
      });
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="relative flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <Icon icon="lucide:check-circle" className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Password Reset Successful!</CardTitle>
              <CardDescription className="text-base">
                Your password has been updated successfully. You can now sign in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => router.push("/signin")} 
                className="w-full h-11 text-base font-medium"
              >
                <Icon icon="lucide:log-in" className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
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
              Reset your password
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Enter your new password to regain access to your account and continue your journey with our community.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon icon="lucide:shield-check" className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Secure Reset</p>
                  <p className="text-sm text-muted-foreground">Your password is encrypted and secure</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon icon="lucide:key" className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Strong Password</p>
                  <p className="text-sm text-muted-foreground">Choose a secure password for your account</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon icon="lucide:users" className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Back to Community</p>
                  <p className="text-sm text-muted-foreground">Rejoin our vibrant developer community</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Reset Form */}
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
              <h2 className="text-3xl font-bold text-foreground">Reset your password</h2>
              <p className="mt-2 text-muted-foreground">Enter your new password to continue</p>
            </div>

            <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl text-center">Reset password</CardTitle>
                <CardDescription className="text-center">
                  Create a new secure password for your account
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">New password</Label>
                    <div className="relative">
                      <Icon 
                        icon="lucide:lock" 
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" 
                      />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your new password"
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
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm new password</Label>
                    <div className="relative">
                      <Icon 
                        icon="lucide:lock" 
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" 
                      />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your new password"
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
                  
                  <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                    {loading ? (
                      <>
                        <Icon icon="lucide:loader-2" className="mr-2 h-4 w-4 animate-spin" />
                        Resetting password...
                      </>
                    ) : (
                      <>
                        <Icon icon="lucide:key" className="mr-2 h-4 w-4" />
                        Reset password
                      </>
                    )}
                  </Button>
                </form>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Remember your password?{" "}
                    <Link href="/signin" className="text-primary hover:underline font-medium">
                      Sign in instead
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Password reset links are valid for 24 hours for security purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Icon icon="lucide:loader-2" className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
