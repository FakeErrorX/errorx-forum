import { NextRequest } from 'next/server';

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  stack?: string;
}

interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit' | 'suspicious_activity' | 'xss_attempt' | 'sql_injection' | 'csrf_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent?: string;
  userId?: string;
  details: Record<string, any>;
  timestamp: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private securityEvents: SecurityEvent[] = [];
  private maxLogAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  private maxLogsInMemory = 10000;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  constructor() {
    // Set log level from environment
    const envLogLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (envLogLevel && envLogLevel in LogLevel) {
      this.logLevel = LogLevel[envLogLevel as keyof typeof LogLevel];
    }

    // Start cleanup interval
    setInterval(() => this.cleanup(), 60 * 60 * 1000); // Every hour
  }

  private cleanup() {
    const cutoff = Date.now() - this.maxLogAge;
    
    // Remove old logs
    this.logs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() > cutoff
    );
    
    // Keep only the most recent logs if we have too many
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.maxLogsInMemory);
    }

    // Remove old security events
    this.securityEvents = this.securityEvents.filter(event =>
      new Date(event.timestamp).getTime() > cutoff
    );
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${levelName}: ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    if (level < this.logLevel) return;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      stack: error?.stack,
    };

    // Add to memory store
    this.logs.push(logEntry);

    // Console output
    const formattedMessage = this.formatMessage(level, message, context);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedMessage);
        if (error) console.error(error.stack);
        break;
    }

    // In production, you would send logs to external service here
    if (process.env.NODE_ENV === 'production' && level >= LogLevel.ERROR) {
      // Example: send to external logging service
      // this.sendToExternalLogger(logEntry);
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  critical(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.CRITICAL, message, context, error);
  }

  // Request logging
  logRequest(req: NextRequest, context?: Record<string, any>) {
    const requestContext = {
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      ...context,
    };

    this.info('Request received', requestContext);
  }

  // Security event logging
  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.securityEvents.push(securityEvent);
    
    const logLevel = this.getLogLevelForSeverity(event.severity);
    this.log(logLevel, `Security event: ${event.type}`, {
      severity: event.severity,
      ip: event.ip,
      details: event.details,
    });

    // Alert on critical security events
    if (event.severity === 'critical') {
      this.alertCriticalSecurity(securityEvent);
    }
  }

  private getLogLevelForSeverity(severity: SecurityEvent['severity']): LogLevel {
    switch (severity) {
      case 'low': return LogLevel.INFO;
      case 'medium': return LogLevel.WARN;
      case 'high': return LogLevel.ERROR;
      case 'critical': return LogLevel.CRITICAL;
    }
  }

  private alertCriticalSecurity(event: SecurityEvent) {
    // In production, send alerts via email, Slack, etc.
    console.error('CRITICAL SECURITY EVENT:', event);
    
    // Example: send to monitoring service
    // this.sendToMonitoringService(event);
  }

  // Performance logging
  logPerformance(operation: string, duration: number, context?: Record<string, any>) {
    const performanceContext = {
      operation,
      duration,
      ...context,
    };

    if (duration > 1000) { // Slow operation
      this.warn('Slow operation detected', performanceContext);
    } else {
      this.debug('Performance metric', performanceContext);
    }
  }

  // Database operation logging
  logDatabaseOperation(operation: string, table: string, duration: number, success: boolean, error?: string) {
    const context = {
      operation,
      table,
      duration,
      success,
      error,
    };

    if (!success) {
      this.error('Database operation failed', undefined, context);
    } else if (duration > 1000) {
      this.warn('Slow database operation', context);
    } else {
      this.debug('Database operation', context);
    }
  }

  // API error logging
  logApiError(endpoint: string, error: Error, context?: Record<string, any>) {
    this.error(`API error at ${endpoint}`, error, {
      endpoint,
      ...context,
    });
  }

  // Authentication logging
  logAuth(type: 'login' | 'logout' | 'register' | 'password_reset', userId?: string, success: boolean = true, context?: Record<string, any>) {
    const authContext = {
      type,
      userId,
      success,
      ...context,
    };

    if (success) {
      this.info(`Authentication: ${type}`, authContext);
    } else {
      this.warn(`Authentication failed: ${type}`, authContext);
    }
  }

  // Get logs for admin dashboard
  getLogs(options: {
    level?: LogLevel;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const { level, limit = 100, offset = 0, startDate, endDate } = options;
    
    let filteredLogs = [...this.logs];

    // Filter by level
    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }

    // Filter by date range
    if (startDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= startDate
      );
    }
    
    if (endDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= endDate
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Pagination
    const total = filteredLogs.length;
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    return {
      logs: paginatedLogs,
      total,
      hasMore: offset + limit < total,
    };
  }

  // Get security events
  getSecurityEvents(options: {
    severity?: SecurityEvent['severity'];
    type?: SecurityEvent['type'];
    limit?: number;
    offset?: number;
  } = {}) {
    const { severity, type, limit = 50, offset = 0 } = options;
    
    let filteredEvents = [...this.securityEvents];

    // Filter by severity
    if (severity) {
      filteredEvents = filteredEvents.filter(event => event.severity === severity);
    }

    // Filter by type
    if (type) {
      filteredEvents = filteredEvents.filter(event => event.type === type);
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Pagination
    const total = filteredEvents.length;
    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    return {
      events: paginatedEvents,
      total,
      hasMore: offset + limit < total,
    };
  }

  // Get statistics
  getStats() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const last7d = now - 7 * 24 * 60 * 60 * 1000;

    const recentLogs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() > last24h
    );

    const recentSecurityEvents = this.securityEvents.filter(event =>
      new Date(event.timestamp).getTime() > last24h
    );

    const logsByLevel = Object.values(LogLevel)
      .filter(level => typeof level === 'number')
      .reduce((acc, level) => {
        acc[LogLevel[level as number]] = recentLogs.filter(log => log.level === level).length;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalLogs: this.logs.length,
      recentLogs: recentLogs.length,
      totalSecurityEvents: this.securityEvents.length,
      recentSecurityEvents: recentSecurityEvents.length,
      logsByLevel,
      criticalEvents: this.securityEvents.filter(event => event.severity === 'critical').length,
    };
  }
}

export const logger = Logger.getInstance();

// Convenience functions
export const logRequest = (req: NextRequest, context?: Record<string, any>) => 
  logger.logRequest(req, context);

export const logSecurityEvent = (event: Omit<SecurityEvent, 'timestamp'>) => 
  logger.logSecurityEvent(event);

export const logPerformance = (operation: string, duration: number, context?: Record<string, any>) =>
  logger.logPerformance(operation, duration, context);

export const logApiError = (endpoint: string, error: Error, context?: Record<string, any>) =>
  logger.logApiError(endpoint, error, context);

export const logAuth = (type: 'login' | 'logout' | 'register' | 'password_reset', userId?: string, success?: boolean, context?: Record<string, any>) =>
  logger.logAuth(type, userId, success, context);

export const logDatabaseOperation = (operation: string, table: string, duration: number, success: boolean, error?: string) =>
  logger.logDatabaseOperation(operation, table, duration, success, error);

export default logger;