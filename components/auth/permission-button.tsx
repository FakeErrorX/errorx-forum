'use client'

import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { PERMISSIONS, ROLES } from '@/lib/permissions'

type ButtonProps = React.ComponentProps<typeof Button>

interface PermissionButtonProps extends ButtonProps {
  requiredPermission?: string
  requiredPermissions?: string[]
  requiredRole?: string
  requiredRoles?: string[]
  requireAllPermissions?: boolean
  requireAllRoles?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionButton({
  requiredPermission,
  requiredPermissions,
  requiredRole,
  requiredRoles,
  requireAllPermissions = false,
  requireAllRoles = false,
  fallback = null,
  children,
  ...buttonProps
}: PermissionButtonProps) {
  const { data: session } = useSession()

  if (!session?.user) {
    return <>{fallback}</>
  }

  type SessionPermission = { permission: { name: string } }
  type SessionRole = { name: string; permissions?: SessionPermission[] }
  type SessionUserWithRole = { role?: SessionRole }
  const su = session.user as unknown as SessionUserWithRole
  const userRole = su.role?.name
  const userPermissions = su.role?.permissions?.map(p => p.permission.name) || []

  // Check role-based access
  if (requiredRole && userRole !== requiredRole) {
    return <>{fallback}</>
  }

  if (requiredRoles && !requiredRoles.includes(userRole || '')) {
    return <>{fallback}</>
  }

  // Check permission-based access
  if (requiredPermission && !userPermissions.includes(requiredPermission)) {
    return <>{fallback}</>
  }

  if (requiredPermissions) {
    if (requireAllPermissions) {
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      )
      if (!hasAllPermissions) {
        return <>{fallback}</>
      }
    } else {
      const hasAnyPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      )
      if (!hasAnyPermission) {
        return <>{fallback}</>
      }
    }
  }

  return <Button {...buttonProps}>{children}</Button>
}

// Convenience components for common use cases
export function AdminButton({ children, fallback, ...props }: Omit<PermissionButtonProps, 'requiredPermission'>) {
  return (
    <PermissionButton 
      requiredPermission={PERMISSIONS.ADMIN_ACCESS} 
      fallback={fallback}
      {...props}
    >
      {children}
    </PermissionButton>
  )
}

export function PostEditButton({ children, fallback, ...props }: Omit<PermissionButtonProps, 'requiredPermissions'>) {
  return (
    <PermissionButton 
      requiredPermissions={[PERMISSIONS.POSTS_EDIT_OWN, PERMISSIONS.POSTS_EDIT_ALL]}
      fallback={fallback}
      {...props}
    >
      {children}
    </PermissionButton>
  )
}

export function PostDeleteButton({ children, fallback, ...props }: Omit<PermissionButtonProps, 'requiredPermissions'>) {
  return (
    <PermissionButton 
      requiredPermissions={[PERMISSIONS.POSTS_DELETE_OWN, PERMISSIONS.POSTS_DELETE_ALL]}
      fallback={fallback}
      {...props}
    >
      {children}
    </PermissionButton>
  )
}

export function CommentEditButton({ children, fallback, ...props }: Omit<PermissionButtonProps, 'requiredPermissions'>) {
  return (
    <PermissionButton 
      requiredPermissions={[PERMISSIONS.COMMENTS_EDIT_OWN, PERMISSIONS.COMMENTS_EDIT_ALL]}
      fallback={fallback}
      {...props}
    >
      {children}
    </PermissionButton>
  )
}

export function CommentDeleteButton({ children, fallback, ...props }: Omit<PermissionButtonProps, 'requiredPermissions'>) {
  return (
    <PermissionButton 
      requiredPermissions={[PERMISSIONS.COMMENTS_DELETE_OWN, PERMISSIONS.COMMENTS_DELETE_ALL]}
      fallback={fallback}
      {...props}
    >
      {children}
    </PermissionButton>
  )
}
