/**
 * 错误日志记录系统
 * 用于记录和分析应用中的错误信息
 */

export interface ErrorLogEntry {
  id: string
  timestamp: string
  level: 'error' | 'warning' | 'info'
  category: string
  message: string
  stack?: string
  context?: Record<string, any>
  userAgent?: string
  url?: string
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = []
  private maxLogs = 100 // 最多保留100条日志

  /**
   * 记录错误
   */
  error(category: string, message: string, error?: Error, context?: Record<string, any>) {
    this.addLog('error', category, message, error?.stack, context)
  }

  /**
   * 记录警告
   */
  warning(category: string, message: string, context?: Record<string, any>) {
    this.addLog('warning', category, message, undefined, context)
  }

  /**
   * 记录信息
   */
  info(category: string, message: string, context?: Record<string, any>) {
    this.addLog('info', category, message, undefined, context)
  }

  /**
   * 添加日志条目
   */
  private addLog(level: 'error' | 'warning' | 'info', category: string, message: string, stack?: string, context?: Record<string, any>) {
    const entry: ErrorLogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    this.logs.unshift(entry)
    
    // 保持日志数量在限制内
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // 同时输出到控制台
    const consoleMethod = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log
    consoleMethod(`[${level.toUpperCase()}] ${category}: ${message}`, {
      stack,
      context,
      timestamp: entry.timestamp
    })

    // 保存到本地存储
    this.saveToLocalStorage()
  }

  /**
   * 获取所有日志
   */
  getLogs(level?: 'error' | 'warning' | 'info'): ErrorLogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level)
    }
    return [...this.logs]
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = []
    this.saveToLocalStorage()
  }

  /**
   * 导出日志为JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * 保存到本地存储
   */
  private saveToLocalStorage() {
    try {
      localStorage.setItem('app_error_logs', JSON.stringify(this.logs))
    } catch (error) {
      console.error('Failed to save logs to localStorage:', error)
    }
  }

  /**
   * 从本地存储加载日志
   */
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('app_error_logs')
      if (saved) {
        this.logs = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load logs from localStorage:', error)
    }
  }

  /**
   * 获取错误统计
   */
  getErrorStats() {
    const stats = {
      total: this.logs.length,
      error: 0,
      warning: 0,
      info: 0,
      categories: {} as Record<string, number>
    }

    this.logs.forEach(log => {
      stats[log.level]++
      stats.categories[log.category] = (stats.categories[log.category] || 0) + 1
    })

    return stats
  }
}

// 创建全局错误记录器实例
export const errorLogger = new ErrorLogger()

// 页面加载时从本地存储恢复日志
errorLogger.loadFromLocalStorage()

// 捕获全局未处理的错误
window.addEventListener('error', (event) => {
  errorLogger.error('global', `Global error: ${event.message}`, event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  })
})

// 捕获Promise的未处理拒绝
window.addEventListener('unhandledrejection', (event) => {
  errorLogger.error('global', `Unhandled promise rejection: ${event.reason}`, undefined, {
    reason: event.reason
  })
})

/**
 * 工具函数：包装异步函数以自动记录错误
 */
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  category: string,
  func: T,
  context?: Record<string, any>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await func(...args)
    } catch (error) {
      errorLogger.error(category, `Function ${func.name || 'anonymous'} failed`, error as Error, {
        ...context,
        args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg)
      })
      throw error
    }
  }) as T
}