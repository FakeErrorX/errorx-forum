"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Icon } from '@iconify/react';
import { ModeToggle } from "@/components/mode-toggle";
import { UserRoleBadge } from "@/components/auth/user-role-badge";
import { AdminOnly } from "@/components/auth/role-guard";

interface User {
  name: string;
  email: string;
  userId: number;
  image?: string | null;
  username?: string | null;
}

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  currentUser: User | null;
  searchPlaceholder?: string;
}

export default function Header({ searchQuery, setSearchQuery, isSearching, currentUser, searchPlaceholder = "Search posts..." }: HeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/signin" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
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
            <Button variant="ghost" onClick={() => router.push("/members")} className="hidden sm:flex">
              <Icon icon="lucide:users" className="h-4 w-4 mr-2" />
              Members
            </Button>
            <AdminOnly>
              <Button variant="ghost" onClick={() => router.push("/admin")} className="hidden sm:flex">
                <Icon icon="lucide:shield" className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </AdminOnly>
          </div>
          
          {/* Desktop Search and User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Icon icon="lucide:search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
              {isSearching && (
                <Icon icon="lucide:loader-2" className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
              )}
            </div>

            {/* User Menu */}
            {session?.user ? (
              <div className="flex items-center space-x-4">
                <ModeToggle />
                <Button variant="ghost" size="sm">
                  <Icon icon="lucide:bell" className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={currentUser?.image || session.user.image || ""} alt={currentUser?.name || session.user.name || "User"} />
                        <AvatarFallback>{(currentUser?.name || session.user.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-none">{currentUser?.name || session.user.name}</p>
                          <UserRoleBadge className="text-xs" />
                        </div>
                        <p className="text-xs leading-none text-muted-foreground">
                          {currentUser?.username ? `@${currentUser.username}` : session.user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <Icon icon="lucide:user" className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/settings")}>
                      <Icon icon="lucide:settings" className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <AdminOnly>
                      <DropdownMenuItem onClick={() => router.push("/admin")}>
                        <Icon icon="lucide:shield" className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    </AdminOnly>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <Icon icon="lucide:log-out" className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <ModeToggle />
                <Button variant="ghost" onClick={() => router.push("/signin")}>
                  Sign In
                </Button>
                <Button onClick={() => router.push("/signup")}>
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center space-x-2">
            <ModeToggle />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Icon icon="lucide:menu" className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Access navigation links, search, and user account options
                </SheetDescription>
                <div className="flex flex-col space-y-6 mt-6">
                  {/* Mobile Search */}
                  <div className="relative">
                    <Icon icon="lucide:search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full"
                    />
                    {isSearching && (
                      <Icon icon="lucide:loader-2" className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                    )}
                  </div>

                  {/* Mobile Navigation */}
                  <div className="space-y-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        router.push("/members");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      <Icon icon="lucide:users" className="h-4 w-4 mr-2" />
                      Members
                    </Button>
                    <AdminOnly>
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          router.push("/admin");
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full justify-start"
                      >
                        <Icon icon="lucide:shield" className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Button>
                    </AdminOnly>
                  </div>

                  {/* Mobile User Menu */}
                  {session?.user ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={currentUser?.image || session.user.image || ""} alt={currentUser?.name || session.user.name || "User"} />
                          <AvatarFallback>{(currentUser?.name || session.user.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{currentUser?.name || session.user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {currentUser?.username ? `@${currentUser.username}` : session.user.email}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Icon icon="lucide:bell" className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            router.push("/profile");
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full justify-start"
                        >
                          <Icon icon="lucide:user" className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            router.push("/settings");
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full justify-start"
                        >
                          <Icon icon="lucide:settings" className="mr-2 h-4 w-4" />
                          Settings
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Icon icon="lucide:log-out" className="mr-2 h-4 w-4" />
                          Log out
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          router.push("/signin");
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full"
                      >
                        Sign In
                      </Button>
                      <Button 
                        onClick={() => {
                          router.push("/signup");
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full"
                      >
                        Sign Up
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
