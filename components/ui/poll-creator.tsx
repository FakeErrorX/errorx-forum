"use client"
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Icon } from '@iconify/react'

interface Poll {
  id: string
  question: string
  isMultiple: boolean
  closesAt?: string
  options: Array<{ id: string; text: string; votes: number }>
}

interface PollCreatorProps {
  postId: string
  onPollCreated?: (poll: Poll) => void
}

export function PollCreator({ postId, onPollCreated }: PollCreatorProps) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [isMultiple, setIsMultiple] = useState(false)
  const [closesAt, setClosesAt] = useState('')
  const [loading, setLoading] = useState(false)

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ''])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleCreatePoll = async () => {
    if (!question.trim() || options.filter(o => o.trim()).length < 2) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          options: options.filter(o => o.trim()),
          isMultiple,
          closesAt: closesAt || undefined
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        onPollCreated?.(data.poll)
        // Reset form
        setQuestion('')
        setOptions(['', ''])
        setIsMultiple(false)
        setClosesAt('')
      }
    } catch (error) {
      console.error('Error creating poll:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon icon="lucide:plus-circle" className="h-5 w-5" />
          Create Poll
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="question">Poll Question</Label>
          <Input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to ask?"
            maxLength={200}
          />
        </div>

        <div>
          <Label>Options</Label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  maxLength={100}
                />
                {options.length > 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                  >
                    <Icon icon="lucide:x" className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <Button variant="outline" size="sm" onClick={addOption}>
                <Icon icon="lucide:plus" className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="multiple"
            checked={isMultiple}
            onCheckedChange={(checked) => setIsMultiple(!!checked)}
          />
          <Label htmlFor="multiple">Allow multiple selections</Label>
        </div>

        <div>
          <Label htmlFor="closesAt">Close Date (Optional)</Label>
          <Input
            id="closesAt"
            type="datetime-local"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
          />
        </div>

        <Button 
          onClick={handleCreatePoll}
          disabled={loading || !question.trim() || options.filter(o => o.trim()).length < 2}
          className="w-full"
        >
          {loading ? 'Creating...' : 'Create Poll'}
        </Button>
      </CardContent>
    </Card>
  )
}
