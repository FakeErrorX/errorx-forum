"use client"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Icon } from '@iconify/react'

interface Participant { id: string; userId: number; username: string | null; name: string | null; image: string | null; isOwner?: boolean }
interface Message { id: string; content: string; createdAt: string; sender: { id: string; username: string | null; name: string | null } }
interface ConversationListItem { id: string; title?: string | null; participants: Participant[]; lastMessage?: Message | null }

export default function ConversationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [list, setList] = useState<ConversationListItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [thread, setThread] = useState<{ id: string; title?: string | null; participants: Participant[]; messages: Message[] } | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/signin')
      return
    }
    loadList()
  }, [status, session])

  const loadList = async () => {
    try {
      const res = await fetch('/api/conversations')
      if (res.ok) {
        const data = await res.json()
        setList(data.conversations || [])
        if (data.conversations?.length && !activeId) {
          setActiveId(data.conversations[0].id)
          loadThread(data.conversations[0].id)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const loadThread = async (id: string) => {
    setActiveId(id)
    try {
      const res = await fetch(`/api/conversations/${id}`)
      if (res.ok) {
        const data = await res.json()
        setThread(data.conversation)
      }
    } catch {}
  }

  const send = async () => {
    if (!newMessage.trim() || !activeId) return
    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${activeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() })
      })
      if (res.ok) {
        setNewMessage('')
        await loadThread(activeId)
        await loadList()
      }
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon icon="lucide:loader-2" className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {list.length === 0 ? (
              <div className="text-muted-foreground text-sm">No conversations</div>
            ) : (
              list.map((c) => (
                <button key={c.id} onClick={() => loadThread(c.id)} className={`w-full text-left p-3 rounded border ${activeId===c.id ? 'bg-muted' : ''}`}>
                  <div className="flex items-center gap-2">
                    {c.participants.slice(0,2).map(p => (
                      <Avatar key={p.id} className="h-6 w-6">
                        <AvatarImage src={p.image || ''} />
                        <AvatarFallback>{(p.username || p.name || '?').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ))}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{c.title || c.participants.map(p => p.username || p.name).join(', ')}</div>
                      <div className="text-xs text-muted-foreground truncate">{c.lastMessage?.content || 'No messages'}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Thread */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{thread?.title || thread?.participants?.map(p => p.username || p.name).join(', ') || 'Conversation'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
              {thread?.messages?.map(m => (
                <div key={m.id} className="flex items-start gap-2">
                  <div className="text-xs text-muted-foreground w-24 truncate">{m.sender.username || m.sender.name || 'User'}</div>
                  <div className="flex-1 text-sm">{m.content}</div>
                </div>
              ))}
              {!thread && (
                <div className="text-sm text-muted-foreground">Select a conversation</div>
              )}
            </div>
            <div className="flex gap-2">
              <Textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." />
              <Button onClick={send} disabled={sending || !newMessage.trim()}>Send</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


