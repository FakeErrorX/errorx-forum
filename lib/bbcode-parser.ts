/**
 * BBCode Parser for Forum Posts
 * Supports common BBCode tags with security measures and customization
 */

export interface BBCodeTag {
  name: string
  openTag: RegExp
  closeTag: RegExp
  transform: (content: string, attributes?: Record<string, string>) => string
  allowedAttributes?: string[]
  selfClosing?: boolean
  blockLevel?: boolean
}

export interface BBCodeParserOptions {
  allowedTags?: string[]
  maxDepth?: number
  urlWhitelist?: string[]
  enableXSSProtection?: boolean
  customTags?: BBCodeTag[]
}

export class BBCodeParser {
  private readonly defaultTags: BBCodeTag[] = [
    // Text formatting
    {
      name: 'b',
      openTag: /\[b\]/gi,
      closeTag: /\[\/b\]/gi,
      transform: (content) => `<strong>${content}</strong>`
    },
    {
      name: 'i',
      openTag: /\[i\]/gi,
      closeTag: /\[\/i\]/gi,
      transform: (content) => `<em>${content}</em>`
    },
    {
      name: 'u',
      openTag: /\[u\]/gi,
      closeTag: /\[\/u\]/gi,
      transform: (content) => `<u>${content}</u>`
    },
    {
      name: 's',
      openTag: /\[s\]/gi,
      closeTag: /\[\/s\]/gi,
      transform: (content) => `<del>${content}</del>`
    },
    
    // Colors and sizing
    {
      name: 'color',
      openTag: /\[color=([#\w]+)\]/gi,
      closeTag: /\[\/color\]/gi,
      transform: (content, attrs) => `<span style="color: ${this.sanitizeColor(attrs?.color || '')}">${content}</span>`,
      allowedAttributes: ['color']
    },
    {
      name: 'size',
      openTag: /\[size=([1-7])\]/gi,
      closeTag: /\[\/size\]/gi,
      transform: (content, attrs) => {
        const size = parseInt(attrs?.size || '3')
        const fontSize = Math.max(1, Math.min(7, size)) * 2 + 6 // 8px to 20px
        return `<span style="font-size: ${fontSize}px">${content}</span>`
      },
      allowedAttributes: ['size']
    },
    
    // Links and media
    {
      name: 'url',
      openTag: /\[url=([^\]]+)\]/gi,
      closeTag: /\[\/url\]/gi,
      transform: (content, attrs) => {
        const url = this.sanitizeUrl(attrs?.url || '')
        return url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${content || url}</a>` : content
      },
      allowedAttributes: ['url']
    },
    {
      name: 'img',
      openTag: /\[img\]/gi,
      closeTag: /\[\/img\]/gi,
      transform: (content) => {
        const url = this.sanitizeUrl(content.trim())
        return url ? `<img src="${url}" alt="User Image" class="bbcode-img" loading="lazy" />` : ''
      }
    },
    {
      name: 'youtube',
      openTag: /\[youtube\]/gi,
      closeTag: /\[\/youtube\]/gi,
      transform: (content) => {
        const videoId = this.extractYouTubeId(content.trim())
        return videoId 
          ? `<div class="bbcode-youtube"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`
          : content
      }
    },
    
    // Code and preformatted text
    {
      name: 'code',
      openTag: /\[code(?:=([^\]]+))?\]/gi,
      closeTag: /\[\/code\]/gi,
      transform: (content, attrs) => {
        const language = attrs?.language ? ` class="language-${this.sanitizeString(attrs.language)}"` : ''
        return `<pre><code${language}>${this.escapeHtml(content)}</code></pre>`
      },
      allowedAttributes: ['language'],
      blockLevel: true
    },
    {
      name: 'pre',
      openTag: /\[pre\]/gi,
      closeTag: /\[\/pre\]/gi,
      transform: (content) => `<pre>${this.escapeHtml(content)}</pre>`,
      blockLevel: true
    },
    
    // Quotes and blocks
    {
      name: 'quote',
      openTag: /\[quote(?:=([^\]]+))?\]/gi,
      closeTag: /\[\/quote\]/gi,
      transform: (content, attrs) => {
        const author = attrs?.author ? `<cite>Originally posted by ${this.escapeHtml(attrs.author)}</cite>` : ''
        return `<blockquote class="bbcode-quote">${author}${content}</blockquote>`
      },
      allowedAttributes: ['author'],
      blockLevel: true
    },
    {
      name: 'spoiler',
      openTag: /\[spoiler(?:=([^\]]+))?\]/gi,
      closeTag: /\[\/spoiler\]/gi,
      transform: (content, attrs) => {
        const title = attrs?.title ? this.escapeHtml(attrs.title) : 'Spoiler'
        return `<details class="bbcode-spoiler"><summary>${title}</summary>${content}</details>`
      },
      allowedAttributes: ['title'],
      blockLevel: true
    },
    
    // Lists
    {
      name: 'list',
      openTag: /\[list(?:=([^\]]+))?\]/gi,
      closeTag: /\[\/list\]/gi,
      transform: (content, attrs) => {
        const type = attrs?.type === '1' ? 'ol' : 'ul'
        const processedContent = content.replace(/\[\*\]/gi, '<li>').replace(/<li>([^<]*?)(?=<li>|$)/gi, '<li>$1</li>')
        return `<${type} class="bbcode-list">${processedContent}</${type}>`
      },
      allowedAttributes: ['type'],
      blockLevel: true
    },
    
    // Alignment and formatting
    {
      name: 'center',
      openTag: /\[center\]/gi,
      closeTag: /\[\/center\]/gi,
      transform: (content) => `<div style="text-align: center">${content}</div>`,
      blockLevel: true
    },
    {
      name: 'right',
      openTag: /\[right\]/gi,
      closeTag: /\[\/right\]/gi,
      transform: (content) => `<div style="text-align: right">${content}</div>`,
      blockLevel: true
    },
    
    // Table support
    {
      name: 'table',
      openTag: /\[table\]/gi,
      closeTag: /\[\/table\]/gi,
      transform: (content) => {
        const tableContent = content
          .replace(/\[tr\]/gi, '<tr>')
          .replace(/\[\/tr\]/gi, '</tr>')
          .replace(/\[td\]/gi, '<td>')
          .replace(/\[\/td\]/gi, '</td>')
          .replace(/\[th\]/gi, '<th>')
          .replace(/\[\/th\]/gi, '</th>')
        return `<table class="bbcode-table">${tableContent}</table>`
      },
      blockLevel: true
    }
  ]

  private readonly options: Required<BBCodeParserOptions>
  private readonly tags: BBCodeTag[]

  constructor(options: BBCodeParserOptions = {}) {
    this.options = {
      allowedTags: options.allowedTags || this.defaultTags.map(tag => tag.name),
      maxDepth: options.maxDepth || 10,
      urlWhitelist: options.urlWhitelist || [],
      enableXSSProtection: options.enableXSSProtection !== false,
      customTags: options.customTags || []
    }

    this.tags = [
      ...this.defaultTags.filter(tag => this.options.allowedTags.includes(tag.name)),
      ...this.options.customTags
    ]
  }

  /**
   * Parse BBCode string to HTML
   */
  public parse(bbcode: string): string {
    if (!bbcode || typeof bbcode !== 'string') {
      return ''
    }

    // Remove potentially dangerous content
    let sanitized = this.options.enableXSSProtection ? this.sanitizeInput(bbcode) : bbcode

    // Process line breaks first
    sanitized = this.processLineBreaks(sanitized)

    // Parse BBCode tags
    sanitized = this.parseTags(sanitized, 0)

    // Final cleanup
    return this.finalCleanup(sanitized)
  }

  /**
   * Convert HTML back to BBCode (basic conversion)
   */
  public toBBCode(html: string): string {
    if (!html || typeof html !== 'string') {
      return ''
    }

    const bbcode = html
      // Basic formatting
      .replace(/<strong>(.*?)<\/strong>/gi, '[b]$1[/b]')
      .replace(/<b>(.*?)<\/b>/gi, '[b]$1[/b]')
      .replace(/<em>(.*?)<\/em>/gi, '[i]$1[/i]')
      .replace(/<i>(.*?)<\/i>/gi, '[i]$1[/i]')
      .replace(/<u>(.*?)<\/u>/gi, '[u]$1[/u]')
      .replace(/<del>(.*?)<\/del>/gi, '[s]$1[/s]')
      
      // Links
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[url=$1]$2[/url]')
      
      // Images
      .replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '[img]$1[/img]')
      
      // Code blocks
      .replace(/<pre><code(?:\s+class="language-([^"]*)")?>(.*?)<\/code><\/pre>/gi, (match, lang, content) => {
        const unescaped = this.unescapeHtml(content)
        return lang ? `[code=${lang}]${unescaped}[/code]` : `[code]${unescaped}[/code]`
      })
      
      // Quotes
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '[quote]$1[/quote]')
      
      // Lists
      .replace(/<ul[^>]*>(.*?)<\/ul>/gi, '[list]$1[/list]')
      .replace(/<ol[^>]*>(.*?)<\/ol>/gi, '[list=1]$1[/list]')
      .replace(/<li>(.*?)<\/li>/gi, '[*]$1')
      
      // Line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p><p>/gi, '\n\n')
      .replace(/<\/?p>/gi, '')

    return bbcode.trim()
  }

  /**
   * Strip all BBCode tags and return plain text
   */
  public stripTags(bbcode: string): string {
    if (!bbcode || typeof bbcode !== 'string') {
      return ''
    }

    return bbcode
      .replace(/\[[^\]]*\]/g, '') // Remove all BBCode tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  /**
   * Get a preview of the content (first N characters without BBCode)
   */
  public getPreview(bbcode: string, maxLength: number = 150): string {
    const plainText = this.stripTags(bbcode)
    
    if (plainText.length <= maxLength) {
      return plainText
    }

    return plainText.substring(0, maxLength - 3).replace(/\s+\S*$/, '') + '...'
  }

  /**
   * Validate BBCode syntax and return errors
   */
  public validate(bbcode: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!bbcode || typeof bbcode !== 'string') {
      return { isValid: true, errors }
    }

    // Check for unclosed tags
    const tagStack: string[] = []
    const tagRegex = /\[(\/?)([\w=]+)(?:[^\]]*)\]/gi
    let match

    while ((match = tagRegex.exec(bbcode)) !== null) {
      const isClosing = match[1] === '/'
      const tagName = match[2].toLowerCase().split('=')[0]
      
      if (isClosing) {
        if (tagStack.length === 0) {
          errors.push(`Unexpected closing tag: [/${tagName}]`)
        } else {
          const lastTag = tagStack.pop()
          if (lastTag !== tagName) {
            errors.push(`Mismatched tags: expected [/${lastTag}], found [/${tagName}]`)
          }
        }
      } else {
        const tag = this.tags.find(t => t.name === tagName)
        if (tag && !tag.selfClosing) {
          tagStack.push(tagName)
        }
      }
    }

    // Check for unclosed tags
    if (tagStack.length > 0) {
      tagStack.forEach(tag => {
        errors.push(`Unclosed tag: [${tag}]`)
      })
    }

    // Check nesting depth
    if (this.getNestingDepth(bbcode) > this.options.maxDepth) {
      errors.push(`Nesting depth exceeds maximum of ${this.options.maxDepth}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Private helper methods

  private parseTags(content: string, depth: number): string {
    if (depth > this.options.maxDepth) {
      return content
    }

    let result = content

    for (const tag of this.tags) {
      result = this.parseTag(result, tag, depth)
    }

    return result
  }

  private parseTag(content: string, tag: BBCodeTag, depth: number): string {
    const regex = new RegExp(
      `\\[${tag.name}(?:=([^\\]]+))?\\](.*?)\\[\\/${tag.name}\\]`,
      'gis'
    )

    return content.replace(regex, (match, attributes, innerContent) => {
      // Parse attributes if any
      const attrs: Record<string, string> = {}
      if (attributes && tag.allowedAttributes) {
        tag.allowedAttributes.forEach((attr, index) => {
          if (index === 0) {
            attrs[attr] = attributes
          }
        })
      }

      // Recursively parse inner content for nested tags
      const parsedInner = this.parseTags(innerContent, depth + 1)

      return tag.transform(parsedInner, attrs)
    })
  }

  private sanitizeInput(input: string): string {
    // Remove potentially dangerous content
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
  }

  private sanitizeUrl(url: string): string {
    if (!url) return ''
    
    try {
      const parsed = new URL(url.startsWith('//') ? `https:${url}` : url)
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return ''
      }

      // Check whitelist if configured
      if (this.options.urlWhitelist.length > 0) {
        const isWhitelisted = this.options.urlWhitelist.some(domain => 
          parsed.hostname.endsWith(domain)
        )
        if (!isWhitelisted) {
          return ''
        }
      }

      return parsed.toString()
    } catch {
      return ''
    }
  }

  private sanitizeColor(color: string): string {
    // Allow hex colors and basic color names
    if (/^#[0-9a-f]{3,6}$/i.test(color) || 
        /^(black|white|red|green|blue|yellow|orange|purple|pink|brown|gray|grey)$/i.test(color)) {
      return color
    }
    return 'inherit'
  }

  private sanitizeString(str: string): string {
    return str.replace(/[^a-zA-Z0-9\-_]/g, '')
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  private unescapeHtml(html: string): string {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }

  private extractYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  private processLineBreaks(content: string): string {
    // Convert double line breaks to paragraph breaks
    return content
      .replace(/\r\n/g, '\n')
      .replace(/\n\n+/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(.*)$/, '<p>$1</p>')
  }

  private finalCleanup(content: string): string {
    return content
      .replace(/<p><\/p>/g, '')
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private getNestingDepth(content: string): number {
    let maxDepth = 0
    let currentDepth = 0
    const tagRegex = /\[(\/?)([\w=]+)(?:[^\]]*)\]/gi
    let match

    while ((match = tagRegex.exec(content)) !== null) {
      const isClosing = match[1] === '/'
      const tagName = match[2].toLowerCase().split('=')[0]
      const tag = this.tags.find(t => t.name === tagName)
      
      if (tag && !tag.selfClosing) {
        if (isClosing) {
          currentDepth--
        } else {
          currentDepth++
          maxDepth = Math.max(maxDepth, currentDepth)
        }
      }
    }

    return maxDepth
  }
}

// Default parser instance
export const bbcodeParser = new BBCodeParser()

// Utility functions for easy use
export function parseBBCode(bbcode: string, options?: BBCodeParserOptions): string {
  const parser = options ? new BBCodeParser(options) : bbcodeParser
  return parser.parse(bbcode)
}

export function bbcodeToText(bbcode: string): string {
  return bbcodeParser.stripTags(bbcode)
}

export function getBBCodePreview(bbcode: string, maxLength?: number): string {
  return bbcodeParser.getPreview(bbcode, maxLength)
}

export function validateBBCode(bbcode: string): { isValid: boolean; errors: string[] } {
  return bbcodeParser.validate(bbcode)
}