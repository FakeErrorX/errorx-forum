"use client"
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Icon } from '@iconify/react'

interface PollOption {
  id: string
  text: string
  votes: number
}

interface Poll {
  id: string
  question: string
  isMultiple: boolean
  closesAt?: string
  options: PollOption[]
}

interface PollDisplayProps {
  postId: string
  poll?: Poll
  onPollUpdate?: (poll: Poll) => void
}

export function PollDisplay({ postId, poll, onPollUpdate }: PollDisplayProps) {
  const [currentPoll, setCurrentPoll] = useState<Poll | null>(poll || null)
  const [loading, setLoading] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [hasVoted, setHasVoted] = useState(false)

  useEffect(() => {
    if (!currentPoll) {
      fetchPoll()
    }
  }, [postId])

  const fetchPoll = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/poll`)
      if (response.ok) {
        const data = await response.json()
        setCurrentPoll(data.poll)
      }
    } catch (error) {
      console.error('Error fetching poll:', error)
    }
  }

  const handleVote = async () => {
    if (!currentPoll || selectedOptions.length === 0 || loading) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/poll`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIds: selectedOptions })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentPoll(data.poll)
        setHasVoted(true)
        onPollUpdate?.(data.poll)
      }
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOptionChange = (optionId: string, checked: boolean) => {
    if (currentPoll?.isMultiple) {
      setSelectedOptions(prev => 
        checked 
          ? [...prev, optionId]
          : prev.filter(id => id !== optionId)
      )
    } else {
      setSelectedOptions(checked ? [optionId] : [])
    }
  }

  if (!currentPoll) {
    return null
  }

  const totalVotes = currentPoll.options.reduce((sum, option) => sum + option.votes, 0)
  const isClosed = currentPoll.closesAt && new Date(currentPoll.closesAt) < new Date()

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon icon="lucide:bar-chart-3" className="h-5 w-5" />
          Poll: {currentPoll.question}
        </CardTitle>
        {currentPoll.closesAt && (
          <p className="text-sm text-muted-foreground">
            Closes: {new Date(currentPoll.closesAt).toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {!hasVoted && !isClosed ? (
          <div className="space-y-4">
            {currentPoll.isMultiple ? (
              <div className="space-y-3">
                {currentPoll.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={(checked) => handleOptionChange(option.id, !!checked)}
                    />
                    <Label htmlFor={option.id} className="flex-1">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <RadioGroup value={selectedOptions[0] || ""} onValueChange={(value) => setSelectedOptions([value])}>
                {currentPoll.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            
            <Button 
              onClick={handleVote} 
              disabled={selectedOptions.length === 0 || loading}
              className="w-full"
            >
              {loading ? 'Voting...' : 'Vote'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentPoll.options.map((option) => {
              const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0
              return (
                <div key={option.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{option.text}</span>
                    <span>{option.votes} votes ({percentage.toFixed(1)}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
            <p className="text-sm text-muted-foreground text-center">
              Total votes: {totalVotes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
