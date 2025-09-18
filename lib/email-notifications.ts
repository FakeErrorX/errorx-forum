/**
 * Email Notifications Service
 * Handles sending email notifications for various forum events
 */

import { transporter } from '@/lib/email'

export interface NotificationEmailData {
  id: string
  type: string
  title: string
  message: string
  userId: string
  fromUserId?: string
  postId?: string
  commentId?: string
  createdAt: Date
  fromUser?: {
    id: string
    username?: string
    name?: string
    image?: string
  }
}

export async function sendNotificationEmail(notification: NotificationEmailData) {
  try {
    // Get user email
    const user = await getUserEmailAndPreferences(notification.userId)
    if (!user?.email) {
      console.log('No email found for user:', notification.userId)
      return
    }

    // Check if user wants email notifications for this type
    const preferences = (user.emailNotifications as any) || {}
    const typePrefs = preferences[notification.type]
    if (!typePrefs?.email) {
      console.log(`User ${user.email} has disabled email notifications for ${notification.type}`)
      return
    }

    const emailContent = generateNotificationEmail(notification, user)
    
    const mailOptions = {
      from: {
        name: 'ErrorX Community',
        address: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@errorx.com'
      },
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`✅ Notification email sent to ${user.email}:`, result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('❌ Failed to send notification email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function getUserEmailAndPreferences(userId: string) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        emailNotifications: true,
      },
    });
    return user;
  } catch (error) {
    console.error('Failed to get user email and preferences:', error);
    return null;
  }
}

function generateNotificationEmail(notification: NotificationEmailData, user: any) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const fromUserName = notification.fromUser?.username || notification.fromUser?.name || 'Someone'
  
  let subject = ''
  let actionUrl = ''
  let actionText = ''
  let description = ''

  switch (notification.type) {
    case 'mention':
      subject = `You were mentioned by ${fromUserName}`
      actionUrl = `${baseUrl}/posts/${notification.postId}`
      actionText = 'View Post'
      description = `${fromUserName} mentioned you in a post`
      break
    
    case 'reply':
      subject = `New reply from ${fromUserName}`
      actionUrl = `${baseUrl}/posts/${notification.postId}`
      actionText = 'View Reply'
      description = `${fromUserName} replied to your post`
      break
    
    case 'follow':
      subject = `${fromUserName} started following you`
      actionUrl = `${baseUrl}/profile/${notification.fromUser?.username}`
      actionText = 'View Profile'
      description = `${fromUserName} is now following you`
      break
    
    case 'like':
      subject = `${fromUserName} liked your post`
      actionUrl = `${baseUrl}/posts/${notification.postId}`
      actionText = 'View Post'
      description = `${fromUserName} liked your post`
      break
    
    case 'message':
      subject = `New message from ${fromUserName}`
      actionUrl = `${baseUrl}/conversations`
      actionText = 'View Messages'
      description = `You have a new private message from ${fromUserName}`
      break
    
    case 'trophy':
      subject = 'You earned a new trophy!'
      actionUrl = `${baseUrl}/profile/${user.username || user.name}`
      actionText = 'View Profile'
      description = notification.message
      break
    
    case 'system':
      subject = notification.title
      actionUrl = baseUrl
      actionText = 'Visit Forum'
      description = notification.message
      break
    
    default:
      subject = notification.title
      actionUrl = baseUrl
      actionText = 'Visit Forum'
      description = notification.message
  }

  const html = generateNotificationHTML({
    subject,
    description,
    actionUrl,
    actionText,
    userName: user.name || user.username || 'there',
    fromUserName,
    notificationType: notification.type
  })

  const text = generateNotificationText({
    subject,
    description,
    actionUrl,
    userName: user.name || user.username || 'there'
  })

  return { subject, html, text }
}

function generateNotificationHTML(data: {
  subject: string
  description: string
  actionUrl: string
  actionText: string
  userName: string
  fromUserName?: string
  notificationType: string
}) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background: white;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .notification-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 24px;
          color: white;
        }
        .title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 15px;
        }
        .description {
          font-size: 16px;
          color: #6b7280;
          margin-bottom: 30px;
        }
        .action-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 500;
          text-align: center;
          margin: 20px 0;
        }
        .action-button:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6c5ce7 100%);
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #9ca3af;
          text-align: center;
        }
        .unsubscribe {
          color: #6b7280;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">ErrorX Community</div>
          <div class="notification-icon">
            ${getNotificationIcon(data.notificationType)}
          </div>
        </div>
        
        <div class="title">Hi ${data.userName}!</div>
        <div class="description">${data.description}</div>
        
        <div style="text-align: center;">
          <a href="${data.actionUrl}" class="action-button">${data.actionText}</a>
        </div>
        
        <div class="footer">
          <p>Stay connected with your community!</p>
          <p>
            <a href="${process.env.NEXTAUTH_URL}/settings" class="unsubscribe">
              Manage your notification preferences
            </a>
          </p>
          <p>© ${new Date().getFullYear()} ErrorX Community. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateNotificationText(data: {
  subject: string
  description: string
  actionUrl: string
  userName: string
}) {
  return `
Hi ${data.userName}!

${data.description}

${data.actionUrl}

---
ErrorX Community
© ${new Date().getFullYear()} ErrorX Community. All rights reserved.

Manage your notification preferences: ${process.env.NEXTAUTH_URL}/settings
  `.trim()
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'mention': return '@'
    case 'reply': return '💬'
    case 'follow': return '👥'
    case 'like': return '❤️'
    case 'message': return '✉️'
    case 'trophy': return '🏆'
    case 'system': return '⚙️'
    default: return '🔔'
  }
}

export async function sendDigestEmail(userId: string, notifications: NotificationEmailData[], period: 'daily' | 'weekly') {
  try {
    const user = await getUserEmailAndPreferences(userId)
    if (!user?.email) return

    const preferences = (user.emailNotifications as any) || {}
    if (preferences.emailDigest !== period) return

    const subject = `Your ${period} digest from ErrorX Community`
    const html = generateDigestHTML(notifications, user, period)
    const text = generateDigestText(notifications, user, period)

    const mailOptions = {
      from: {
        name: 'ErrorX Community',
        address: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@errorx.com'
      },
      to: user.email,
      subject,
      html,
      text
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`✅ Digest email sent to ${user.email}:`, result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('❌ Failed to send digest email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

function generateDigestHTML(notifications: NotificationEmailData[], user: any, period: string) {
  const groupedNotifications = groupNotificationsByType(notifications)
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your ${period} digest</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background: white;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 20px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
        }
        .notification-item {
          padding: 15px;
          border-left: 3px solid #667eea;
          background: #f8fafc;
          margin-bottom: 10px;
          border-radius: 0 6px 6px 0;
        }
        .notification-count {
          background: #667eea;
          color: white;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 12px;
          margin-left: 8px;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 500;
          text-align: center;
          margin: 20px auto;
          display: block;
          width: fit-content;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #9ca3af;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">ErrorX Community</div>
          <h2>Your ${period} digest</h2>
          <p>Here's what happened while you were away</p>
        </div>
        
        ${Object.entries(groupedNotifications).map(([type, notifications]) => `
          <div class="section">
            <h3 class="section-title">
              ${getNotificationIcon(type)} ${getTypeDisplayName(type)}
              <span class="notification-count">${notifications.length}</span>
            </h3>
            ${notifications.slice(0, 5).map(notification => `
              <div class="notification-item">
                ${notification.message}
              </div>
            `).join('')}
            ${notifications.length > 5 ? `<p>And ${notifications.length - 5} more...</p>` : ''}
          </div>
        `).join('')}
        
        <a href="${process.env.NEXTAUTH_URL}" class="cta-button">
          Visit ErrorX Community
        </a>
        
        <div class="footer">
          <p>Stay connected with your community!</p>
          <p>
            <a href="${process.env.NEXTAUTH_URL}/settings">
              Manage your notification preferences
            </a>
          </p>
          <p>© ${new Date().getFullYear()} ErrorX Community. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateDigestText(notifications: NotificationEmailData[], user: any, period: string) {
  const groupedNotifications = groupNotificationsByType(notifications)
  
  let text = `Your ${period} digest from ErrorX Community\n\n`
  text += `Hi ${user.name || user.username || 'there'}!\n\n`
  text += `Here's what happened while you were away:\n\n`
  
  Object.entries(groupedNotifications).forEach(([type, notifications]) => {
    text += `${getTypeDisplayName(type)} (${notifications.length}):\n`
    notifications.slice(0, 5).forEach(notification => {
      text += `- ${notification.message}\n`
    })
    if (notifications.length > 5) {
      text += `- And ${notifications.length - 5} more...\n`
    }
    text += '\n'
  })
  
  text += `Visit ErrorX Community: ${process.env.NEXTAUTH_URL}\n\n`
  text += `---\n`
  text += `Manage your notification preferences: ${process.env.NEXTAUTH_URL}/settings\n`
  text += `© ${new Date().getFullYear()} ErrorX Community. All rights reserved.`
  
  return text
}

function groupNotificationsByType(notifications: NotificationEmailData[]) {
  return notifications.reduce((groups, notification) => {
    const type = notification.type
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(notification)
    return groups
  }, {} as Record<string, NotificationEmailData[]>)
}

function getTypeDisplayName(type: string): string {
  switch (type) {
    case 'mention': return 'Mentions'
    case 'reply': return 'Replies'
    case 'follow': return 'New Followers'
    case 'like': return 'Likes'
    case 'message': return 'Messages'
    case 'trophy': return 'Trophies'
    case 'system': return 'System Notifications'
    default: return 'Notifications'
  }
}