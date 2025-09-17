'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'
import { PERMISSIONS, ROLES } from '@/lib/permissions'

interface RoleGuardProps {
  children: ReactNode
  requiredPermission?: string
  requiredPermissions?: string[]
  requiredRole?: string
  requiredRoles?: string[]
  requireAllPermissions?: boolean
  requireAllRoles?: boolean
  fallback?: ReactNode
  showFallback?: boolean
}

export function RoleGuard({
  children,
  requiredPermission,
  requiredPermissions,
  requiredRole,
  requiredRoles,
  requireAllPermissions = false,
  requireAllRoles = false,
  fallback = null,
  showFallback = true
}: RoleGuardProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session?.user) {
    return showFallback ? <>{fallback}</> : null
  }

  type SessionPermission = { permission: { name: string } }
  type SessionRole = { name: string; permissions?: SessionPermission[] }
  type SessionUserWithRole = { role?: SessionRole }
  const su = session.user as unknown as SessionUserWithRole
  const userRole = su.role?.name
  const userPermissions = su.role?.permissions?.map(p => p.permission.name) || []

  // Check role-based access
  if (requiredRole && userRole !== requiredRole) {
    return showFallback ? <>{fallback}</> : null
  }

  if (requiredRoles && !requiredRoles.includes(userRole || '')) {
    return showFallback ? <>{fallback}</> : null
  }

  // Check permission-based access
  if (requiredPermission && !userPermissions.includes(requiredPermission)) {
    return showFallback ? <>{fallback}</> : null
  }

  if (requiredPermissions) {
    if (requireAllPermissions) {
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      )
      if (!hasAllPermissions) {
        return showFallback ? <>{fallback}</> : null
      }
    } else {
      const hasAnyPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      )
      if (!hasAnyPermission) {
        return showFallback ? <>{fallback}</> : null
      }
    }
  }

  return <>{children}</>
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard requiredPermission={PERMISSIONS.ADMIN_ACCESS} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function SuperAdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard requiredRole={ROLES.SUPER_ADMIN} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function ModeratorOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard 
      requiredRoles={[ROLES.MOD, ROLES.STAFF, ROLES.ADMIN, ROLES.SUPER_ADMIN]} 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  )
}

export function PostEditOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard 
      requiredPermissions={[PERMISSIONS.POSTS_EDIT_OWN, PERMISSIONS.POSTS_EDIT_ALL]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  )
}

export function PostDeleteOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard 
      requiredPermissions={[PERMISSIONS.POSTS_DELETE_OWN, PERMISSIONS.POSTS_DELETE_ALL]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  )
}

export function CommentEditOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard 
      requiredPermissions={[PERMISSIONS.COMMENTS_EDIT_OWN, PERMISSIONS.COMMENTS_EDIT_ALL]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  )
}

export function CommentDeleteOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard 
      requiredPermissions={[PERMISSIONS.COMMENTS_DELETE_OWN, PERMISSIONS.COMMENTS_DELETE_ALL]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  )
}
