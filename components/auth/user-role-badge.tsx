'use client'

import { useSession } from 'next-auth/react'
import { Badge } from '@/components/ui/badge'

interface UserRoleBadgeProps {
  className?: string
  showIcon?: boolean
}

export function UserRoleBadge({ className, showIcon = true }: UserRoleBadgeProps) {
  const { data: session } = useSession()

  type SessionRole = { displayName: string; color?: string }
  type SessionUserWithRole = { role?: SessionRole }
  const su = session?.user as unknown as SessionUserWithRole | undefined

  if (!su?.role) {
    return null
  }

  const { role } = su

  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 ${className || ''}`}
      style={{ borderColor: role.color }}
    >
      {showIcon && (
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: role.color }}
        />
      )}
      {role.displayName}
    </Badge>
  )
}

interface RoleBadgeProps {
  role: {
    name: string
    displayName: string
    color?: string
  }
  className?: string
  showIcon?: boolean
}

export function RoleBadge({ role, className, showIcon = true }: RoleBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 ${className || ''}`}
      style={{ borderColor: role.color }}
    >
      {showIcon && (
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: role.color }}
        />
      )}
      {role.displayName}
    </Badge>
  )
}
