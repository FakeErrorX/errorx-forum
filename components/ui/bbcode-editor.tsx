"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Bold, Italic, Underline, Strikethrough, Code, Quote, Link, 
  Image, List, ListOrdered, AlignCenter, AlignRight, Eye, 
  Type, Palette, Upload, AlertTriangle
} from 'lucide-react'
import { parseBBCode, validateBBCode, getBBCodePreview } from '@/lib/bbcode-parser'
import { cn } from '@/lib/utils'

interface BBCodeEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  maxLength?: number
  showPreview?: boolean
  showValidation?: boolean
  allowAttachments?: boolean
  onAttachmentUpload?: (files: FileList) => void
}

interface BBCodeButton {
  icon: React.ComponentType<{ className?: string }>
  label: string
  action: () => void
  shortcut?: string
}

export function BBCodeEditor({
  value,
  onChange,
  placeholder = "Write your post...",
  disabled = false,
  className,
  maxLength,
  showPreview = true,
  showValidation = true,
  allowAttachments = false,
  onAttachmentUpload
}: BBCodeEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[] }>({ isValid: true, errors: [] })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Validate BBCode on change
  useEffect(() => {
    if (showValidation && value) {
      const validationResult = validateBBCode(value)
      setValidation(validationResult)
    } else {
      setValidation({ isValid: true, errors: [] })
    }
  }, [value, showValidation])

  // Insert text at cursor position
  const insertAtCursor = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    
    const insertText = selectedText || placeholder
    const newText = value.substring(0, start) + before + insertText + after + value.substring(end)
    
    onChange(newText)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + before.length + insertText.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }, [value, onChange])

  // Wrap selected text with BBCode tags
  const wrapText = useCallback((tag: string, attribute?: string) => {
    const openTag = attribute ? `[${tag}=${attribute}]` : `[${tag}]`
    const closeTag = `[/${tag}]`
    insertAtCursor(openTag, closeTag, 'text')
  }, [insertAtCursor])

  // Handle file upload
  const handleFileUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0 && onAttachmentUpload) {
      onAttachmentUpload(files)
    }
  }, [onAttachmentUpload])

  // Toolbar buttons configuration
  const toolbarButtons: BBCodeButton[] = [
    {
      icon: Bold,
      label: 'Bold',
      action: () => wrapText('b'),
      shortcut: 'Ctrl+B'
    },
    {
      icon: Italic,
      label: 'Italic',
      action: () => wrapText('i'),
      shortcut: 'Ctrl+I'
    },
    {
      icon: Underline,
      label: 'Underline',
      action: () => wrapText('u'),
      shortcut: 'Ctrl+U'
    },
    {
      icon: Strikethrough,
      label: 'Strikethrough',
      action: () => wrapText('s')
    },
    {
      icon: Code,
      label: 'Code',
      action: () => wrapText('code')
    },
    {
      icon: Quote,
      label: 'Quote',
      action: () => wrapText('quote')
    },
    {
      icon: Link,
      label: 'Link',
      action: () => {
        const url = prompt('Enter URL:')
        if (url) {
          wrapText('url', url)
        }
      }
    },
    {
      icon: Image,
      label: 'Image',
      action: () => insertAtCursor('[img]', '[/img]', 'image URL')
    },
    {
      icon: List,
      label: 'Unordered List',
      action: () => insertAtCursor('[list]\n[*]', '\n[*]item 2\n[/list]', 'item 1')
    },
    {
      icon: ListOrdered,
      label: 'Ordered List',
      action: () => insertAtCursor('[list=1]\n[*]', '\n[*]item 2\n[/list]', 'item 1')
    },
    {
      icon: AlignCenter,
      label: 'Center',
      action: () => wrapText('center')
    },
    {
      icon: AlignRight,
      label: 'Right Align',
      action: () => wrapText('right')
    },
    {
      icon: Type,
      label: 'Size',
      action: () => {
        const size = prompt('Enter size (1-7):')
        if (size && /^[1-7]$/.test(size)) {
          wrapText('size', size)
        }
      }
    },
    {
      icon: Palette,
      label: 'Color',
      action: () => {
        const color = prompt('Enter color (hex or name):')
        if (color) {
          wrapText('color', color)
        }
      }
    }
  ]

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!textareaRef.current?.contains(event.target as Node)) return

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'b':
            event.preventDefault()
            wrapText('b')
            break
          case 'i':
            event.preventDefault()
            wrapText('i')
            break
          case 'u':
            event.preventDefault()
            wrapText('u')
            break
          case 'k':
            event.preventDefault()
            const url = prompt('Enter URL:')
            if (url) wrapText('url', url)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [wrapText])

  const renderPreview = () => {
    if (!value.trim()) {
      return <div className="text-muted-foreground italic">Preview will appear here...</div>
    }

    try {
      const html = parseBBCode(value)
      return (
        <div 
          className="prose prose-sm max-w-none dark:prose-invert bbcode-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )
    } catch (error) {
      return (
        <div className="text-destructive">
          <AlertTriangle className="inline w-4 h-4 mr-2" />
          Error rendering preview: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border rounded-lg bg-muted/50">
        {toolbarButtons.map((button, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={button.action}
            disabled={disabled}
            title={`${button.label}${button.shortcut ? ` (${button.shortcut})` : ''}`}
            className="w-8 h-8 p-0"
          >
            <button.icon className="w-4 h-4" />
          </Button>
        ))}
        
        {allowAttachments && (
          <>
            <Separator orientation="vertical" className="h-8" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFileUpload}
              disabled={disabled}
              title="Upload Attachment"
              className="w-8 h-8 p-0"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              multiple
              className="hidden"
              accept="image/*,.pdf,.txt,.doc,.docx"
            />
          </>
        )}
      </div>

      {/* Editor/Preview Tabs */}
      {showPreview ? (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>
            
            {maxLength && (
              <div className={cn(
                "text-sm",
                value.length > maxLength ? "text-destructive" : "text-muted-foreground"
              )}>
                {value.length}/{maxLength}
              </div>
            )}
          </div>

          <TabsContent value="edit" className="mt-4">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[200px] font-mono text-sm"
              maxLength={maxLength}
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <Card>
              <CardContent className="p-4 min-h-[200px]">
                {renderPreview()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-2">
          {maxLength && (
            <div className="flex justify-end">
              <div className={cn(
                "text-sm",
                value.length > maxLength ? "text-destructive" : "text-muted-foreground"
              )}>
                {value.length}/{maxLength}
              </div>
            </div>
          )}
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[200px] font-mono text-sm"
            maxLength={maxLength}
          />
        </div>
      )}

      {/* Validation Messages */}
      {showValidation && !validation.isValid && validation.errors.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-destructive mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">BBCode Validation Errors:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* BBCode Help */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          BBCode Help
        </summary>
        <Card className="mt-2">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Text Formatting</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li><code>[b]bold[/b]</code></li>
                  <li><code>[i]italic[/i]</code></li>
                  <li><code>[u]underline[/u]</code></li>
                  <li><code>[s]strikethrough[/s]</code></li>
                  <li><code>[color=red]colored[/color]</code></li>
                  <li><code>[size=5]sized[/size]</code></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Links & Media</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li><code>[url=http://example.com]link[/url]</code></li>
                  <li><code>[img]image-url[/img]</code></li>
                  <li><code>[youtube]video-url[/youtube]</code></li>
                  <li><code>[quote=author]text[/quote]</code></li>
                  <li><code>[code]code here[/code]</code></li>
                  <li><code>[spoiler]hidden text[/spoiler]</code></li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </details>
    </div>
  )
}

export default BBCodeEditor