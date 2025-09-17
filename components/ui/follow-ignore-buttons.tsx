"use client"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface FollowIgnoreButtonsProps {
  targetUserId: string
}

export function FollowIgnoreButtons({ targetUserId }: FollowIgnoreButtonsProps) {
  const [following, setFollowing] = useState(false)
  const [ignored, setIgnored] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [fRes, iRes] = await Promise.all([
          fetch('/api/follow'),
          fetch('/api/ignore')
        ])
        if (fRes.ok) {
          const d: { following: Array<{ followingId: string }> } = await fRes.json()
          setFollowing((d.following || []).some((it) => it.followingId === targetUserId))
        }
        if (iRes.ok) {
          const d: { ignores: Array<{ ignoredId: string }> } = await iRes.json()
          setIgnored((d.ignores || []).some((it) => it.ignoredId === targetUserId))
        }
      } catch {}
    }
    load()
  }, [targetUserId])

  const toggleFollow = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/follow', {
        method: following ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId })
      })
      if (res.ok) setFollowing(!following)
    } finally {
      setLoading(false)
    }
  }

  const toggleIgnore = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/ignore', {
        method: ignored ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId })
      })
      if (res.ok) setIgnored(!ignored)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant={following ? 'default' : 'outline'} onClick={toggleFollow} disabled={loading}>
        {following ? 'Following' : 'Follow'}
      </Button>
      <Button size="sm" variant={ignored ? 'destructive' : 'outline'} onClick={toggleIgnore} disabled={loading}>
        {ignored ? 'Ignored' : 'Ignore'}
      </Button>
    </div>
  )
}


