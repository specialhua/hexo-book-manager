/**
 * 浏览器环境下的文件操作工具
 * 替代 Tauri 的文件系统API
 */

export interface FileInfo {
  content: string
  fileName: string
  filePath: string
}

/**
 * 读取用户选择的文件
 * @returns 文件信息
 */
export async function readFile(): Promise<FileInfo> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.txt'
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        reject(new Error('未选择文件'))
        return
      }
      
      try {
        const content = await file.text()
        resolve({
          content,
          fileName: file.name,
          filePath: file.webkitRelativePath || file.name
        })
      } catch (error) {
        reject(error)
      }
    }
    
    input.click()
  })
}

/**
 * 下载文件到用户设备
 * @param content 文件内容
 * @param filename 文件名
 * @param mimeType MIME类型
 */
export function downloadFile(
  content: string, 
  filename: string, 
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  
  URL.revokeObjectURL(url)
}

/**
 * 下载JSON文件
 * @param data 数据对象
 * @param filename 文件名
 */
export function downloadJSON(data: any, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2)
  downloadFile(jsonString, filename, 'application/json')
}

/**
 * 读取用户选择的JSON文件
 * @returns 解析后的数据
 */
export async function readJSON<T = any>(): Promise<T> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        reject(new Error('未选择文件'))
        return
      }
      
      try {
        const content = await file.text()
        const data = JSON.parse(content)
        resolve(data)
      } catch (error) {
        reject(error)
      }
    }
    
    input.click()
  })
}

/**
 * 选择并读取图片文件
 * @returns 图片的base64数据URL
 */
export async function selectImage(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        reject(new Error('未选择图片'))
        return
      }
      
      try {
        const reader = new FileReader()
        reader.onload = () => {
          resolve(reader.result as string)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      } catch (error) {
        reject(error)
      }
    }
    
    input.click()
  })
}

/**
 * 本地存储管理
 */
export class LocalStorageManager {
  private prefix: string
  
  constructor(prefix: string = 'book-manager') {
    this.prefix = prefix
  }
  
  /**
   * 保存数据
   * @param key 键
   * @param value 值
   */
  save(key: string, value: any): boolean {
    try {
      const fullKey = `${this.prefix}_${key}`
      const jsonString = JSON.stringify(value)
      localStorage.setItem(fullKey, jsonString)
      return true
    } catch (error) {
      console.error('保存数据失败:', error)
      return false
    }
  }
  
  /**
   * 读取数据
   * @param key 键
   * @param defaultValue 默认值
   * @returns 数据
   */
  load<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const fullKey = `${this.prefix}_${key}`
      const jsonString = localStorage.getItem(fullKey)
      if (!jsonString) {
        return defaultValue
      }
      return JSON.parse(jsonString)
    } catch (error) {
      console.error('读取数据失败:', error)
      return defaultValue
    }
  }
  
  /**
   * 删除数据
   * @param key 键
   */
  remove(key: string): void {
    try {
      const fullKey = `${this.prefix}_${key}`
      localStorage.removeItem(fullKey)
    } catch (error) {
      console.error('删除数据失败:', error)
    }
  }
  
  /**
   * 获取指定键的值，如果不存在则返回默认值
   * @param key 键
   * @param defaultValue 默认值
   * @returns 数据
   */
  getItem<T>(key: string, defaultValue?: T): T | null {
    return this.load(key, defaultValue || null)
  }

  /**
   * 设置指定键的值
   * @param key 键
   * @param value 值
   */
  setItem(key: string, value: any): boolean {
    return this.save(key, value)
  }

  /**
   * 移除指定键的值
   * @param key 键
   */
  removeItem(key: string): void {
    this.remove(key)
  }

  /**
   * 获取所有存储的键
   * @returns 键数组
   */
  getAllKeys(): string[] {
    try {
      const keys = Object.keys(localStorage)
      return keys
        .filter(key => key.startsWith(`${this.prefix}_`))
        .map(key => key.substring(this.prefix.length + 1))
    } catch (error) {
      console.error('获取所有键失败:', error)
      return []
    }
  }

  /**
   * 检查指定键是否存在
   * @param key 键
   * @returns 是否存在
   */
  hasKey(key: string): boolean {
    try {
      const fullKey = `${this.prefix}_${key}`
      return localStorage.getItem(fullKey) !== null
    } catch (error) {
      console.error('检查键存在性失败:', error)
      return false
    }
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(`${this.prefix}_`)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('清空数据失败:', error)
    }
  }

  /**
   * 获取存储统计信息
   * @returns 存储统计数据
   */
  getStorageStats(): {
    totalKeys: number
    totalSize: number
    keysByType: Record<string, number>
    sizeByType: Record<string, number>
  } {
    try {
      const keys = this.getAllKeys()
      const stats = {
        totalKeys: keys.length,
        totalSize: 0,
        keysByType: {} as Record<string, number>,
        sizeByType: {} as Record<string, number>
      }

      keys.forEach(key => {
        const fullKey = `${this.prefix}_${key}`
        const value = localStorage.getItem(fullKey)
        if (value) {
          const size = new Blob([value]).size
          stats.totalSize += size

          // 按键类型分组统计
          const keyType = key.split('_')[0] || 'other'
          stats.keysByType[keyType] = (stats.keysByType[keyType] || 0) + 1
          stats.sizeByType[keyType] = (stats.sizeByType[keyType] || 0) + size
        }
      })

      return stats
    } catch (error) {
      console.error('获取存储统计失败:', error)
      return {
        totalKeys: 0,
        totalSize: 0,
        keysByType: {},
        sizeByType: {}
      }
    }
  }

  /**
   * 批量设置多个键值对
   * @param items 键值对对象
   */
  setItems(items: Record<string, any>): boolean {
    try {
      let allSuccess = true
      Object.entries(items).forEach(([key, value]) => {
        const success = this.save(key, value)
        if (!success) allSuccess = false
      })
      return allSuccess
    } catch (error) {
      console.error('批量设置失败:', error)
      return false
    }
  }

  /**
   * 批量获取多个键的值
   * @param keys 键数组
   * @returns 键值对对象
   */
  getItems<T = any>(keys: string[]): Record<string, T | null> {
    try {
      const result: Record<string, T | null> = {}
      keys.forEach(key => {
        result[key] = this.load<T>(key, null)
      })
      return result
    } catch (error) {
      console.error('批量获取失败:', error)
      return {}
    }
  }

  /**
   * 批量删除多个键
   * @param keys 键数组
   */
  removeItems(keys: string[]): void {
    try {
      keys.forEach(key => {
        this.remove(key)
      })
    } catch (error) {
      console.error('批量删除失败:', error)
    }
  }

  /**
   * 导出所有数据
   * @returns 所有数据的对象
   */
  exportAllData(): Record<string, any> {
    try {
      const keys = this.getAllKeys()
      const data: Record<string, any> = {}
      
      keys.forEach(key => {
        data[key] = this.load(key, null)
      })
      
      return data
    } catch (error) {
      console.error('导出数据失败:', error)
      return {}
    }
  }

  /**
   * 导入数据
   * @param data 要导入的数据对象
   * @param overwrite 是否覆盖已存在的键
   */
  importData(data: Record<string, any>, overwrite: boolean = false): boolean {
    try {
      let allSuccess = true
      Object.entries(data).forEach(([key, value]) => {
        if (overwrite || !this.hasKey(key)) {
          const success = this.save(key, value)
          if (!success) allSuccess = false
        }
      })
      return allSuccess
    } catch (error) {
      console.error('导入数据失败:', error)
      return false
    }
  }

  /**
   * 检查存储空间使用情况
   * @returns 存储空间信息
   */
  getStorageUsage(): {
    used: number
    available: number
    percentage: number
  } {
    try {
      // 估算localStorage的可用空间（通常为5-10MB）
      const ESTIMATED_LIMIT = 5 * 1024 * 1024 // 5MB
      const stats = this.getStorageStats()
      
      return {
        used: stats.totalSize,
        available: ESTIMATED_LIMIT - stats.totalSize,
        percentage: (stats.totalSize / ESTIMATED_LIMIT) * 100
      }
    } catch (error) {
      console.error('获取存储使用情况失败:', error)
      return {
        used: 0,
        available: 0,
        percentage: 0
      }
    }
  }

  /**
   * 清理过期数据
   * @param expiredKeys 过期键数组
   */
  cleanupExpiredData(expiredKeys: string[]): void {
    try {
      expiredKeys.forEach(key => {
        if (this.hasKey(key)) {
          this.remove(key)
        }
      })
    } catch (error) {
      console.error('清理过期数据失败:', error)
    }
  }
}

/**
 * 默认的存储管理器实例
 */
export const storage = new LocalStorageManager()

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  } catch (error) {
    throw new Error('复制失败: ' + error)
  }
}

/**
 * 检查浏览器是否支持某个功能
 */
export const browserSupport = {
  clipboard: !!(navigator.clipboard && window.isSecureContext),
  fileAPI: !!(window.File && window.FileReader && window.FileList && window.Blob),
  localStorage: (() => {
    try {
      const test = 'test'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  })()
}