'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  Users, 
  Shield, 
  Trophy, 
  Folder, 
  Code, 
  BarChart3, 
  Settings, 
  Menu,
  Home,
  Flag,
  MessageSquare,
  FileText,
  Bell,
  Activity
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: Home,
    description: 'Overview and statistics'
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    description: 'Manage users, bans, and warnings'
  },
  {
    name: 'Role Management',
    href: '/admin/roles',
    icon: Shield,
    description: 'Configure roles and permissions'
  },
  {
    name: 'Trophy System',
    href: '/admin/trophies',
    icon: Trophy,
    description: 'Manage trophies and achievements'
  },
  {
    name: 'Node Management',
    href: '/admin/nodes',
    icon: Folder,
    description: 'Forum categories and structure'
  },
  {
    name: 'BBCode Management',
    href: '/admin/bbcodes',
    icon: Code,
    description: 'Custom BBCode tags'
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: Flag,
    description: 'User reports and moderation'
  },
  {
    name: 'Posts & Content',
    href: '/admin/content',
    icon: MessageSquare,
    description: 'Content moderation'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Forum statistics'
  },
  {
    name: 'Audit Log',
    href: '/admin/audit',
    icon: Activity,
    description: 'Admin actions log'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Forum configuration'
  }
]

function NavigationItem({ item, isActive }: { item: typeof navigation[0], isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <item.icon className="h-4 w-4" />
      <div className="flex flex-col">
        <span>{item.name}</span>
        <span className="text-xs opacity-70">{item.description}</span>
      </div>
    </Link>
  )
}

function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Shield className="h-6 w-6" />
          <span>Admin Panel</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3">
        <nav className="grid gap-1 py-2">
          {navigation.map((item) => (
            <NavigationItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <Sidebar />
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <div className="flex-1">
            <h1 className="text-lg font-semibold md:text-2xl">Admin Dashboard</h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}