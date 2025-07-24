/**
 * 统一配置接口
 * 提供跨平台的配置存储API（Electron原生配置 + localStorage降级）
 */

import type { 
  AppSettings, 
  BooksData, 
  SyncConfig, 
  AppState,
  ConfigResult,
  MigrationOptions,
  MigrationResult
} from '../types/config'

/**
 * 检测当前运行环境
 */
function isElectronEnvironment(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI
}

/**
 * 配置API类
 */
export class ConfigAPI {
  private isElectron: boolean
  private migrationCompleted: boolean = false
  
  // 添加内存缓存清理标记
  private memoryCache: {
    settings?: AppSettings
    booksData?: BooksData
    syncConfig?: SyncConfig
    appState?: AppState
  } = {}
  
  constructor() {
    this.isElectron = isElectronEnvironment()
    console.log('ConfigAPI initialized, isElectron:', this.isElectron)
  }

  /**
   * 初始化配置系统
   * 在Electron环境中检查是否需要从localStorage迁移数据
   */
  async initialize(): Promise<void> {
    if (!this.isElectron) {
      console.log('Web环境，使用localStorage存储')
      return
    }

    try {
      // 检查是否已存在配置文件
      const settingsExists = await window.electronAPI.configExists('settings.json')
      const booksExists = await window.electronAPI.configExists('books.json')
      
      if (!settingsExists.data && !booksExists.data) {
        // 配置文件不存在，检查localStorage中是否有数据需要迁移
        await this.migrateFromLocalStorageIfNeeded()
      }
      
      console.log('ConfigAPI初始化完成')
    } catch (error) {
      console.error('ConfigAPI初始化失败:', error)
    }
  }

  /**
   * 如果需要，从localStorage迁移数据
   */
  private async migrateFromLocalStorageIfNeeded(): Promise<void> {
    if (this.migrationCompleted) return

    try {
      // 收集localStorage中的所有相关数据
      const localStorageData: Record<string, any> = {}
      const keys = [
        'appSettings', 'imageBedConfig', 'isbnApiConfig', 'books', 'blogConfig',
        'originalFileOrder', 'originalFileStructure', 'currentFile',
        'hasSeenFirstTimeSetup', 'permanentlySkippedSetup'
      ]

      let hasData = false
      keys.forEach(key => {
        const fullKey = `book-manager_${key}`
        const value = localStorage.getItem(fullKey)
        if (value) {
          try {
            localStorageData[key] = JSON.parse(value)
            hasData = true
          } catch (error) {
            console.warn(`Failed to parse localStorage key ${key}:`, error)
          }
        }
      })

      if (!hasData) {
        console.log('localStorage中没有发现需要迁移的数据')
        this.migrationCompleted = true
        return
      }

      console.log('开始从localStorage迁移数据:', Object.keys(localStorageData))

      // 执行迁移
      const migrationOptions: MigrationOptions = {
        fromLocalStorage: true,
        createBackup: true,
        cleanupLocalStorage: false // 保留localStorage数据作为备份
      }

      const result = await window.electronAPI.configMigrateFromLocalStorage(
        localStorageData, 
        migrationOptions
      )

      if (result.success) {
        console.log('数据迁移成功:', result.migratedFiles)
        if (result.backupPath) {
          console.log('迁移备份路径:', result.backupPath)
        }
        this.migrationCompleted = true
      } else {
        console.error('数据迁移失败:', result.errors)
      }

    } catch (error) {
      console.error('迁移过程出错:', error)
    }
  }

  /**
   * 获取应用设置
   */
  async getSettings(): Promise<AppSettings | null> {
    if (this.isElectron) {
      try {
        const result = await window.electronAPI.configGetSettings()
        if (result.success) {
          return result.data
        } else {
          console.error('获取设置失败:', result.error)
          return null
        }
      } catch (error) {
        console.error('Electron API调用失败:', error)
        return null
      }
    } else {
      // Web环境降级到localStorage
      return this.getSettingsFromLocalStorage()
    }
  }

  /**
   * 保存应用设置
   */
  async saveSettings(settings: AppSettings): Promise<boolean> {
    if (this.isElectron) {
      try {
        const result = await window.electronAPI.configSaveSettings(settings)
        if (result.success) {
          return true
        } else {
          console.error('保存设置失败:', result.error)
          return false
        }
      } catch (error) {
        console.error('Electron API调用失败:', error)
        return false
      }
    } else {
      // Web环境降级到localStorage
      return this.saveSettingsToLocalStorage(settings)
    }
  }

  /**
   * 获取书籍数据
   */
  async getBooksData(): Promise<BooksData | null> {
    if (this.isElectron) {
      try {
        const result = await window.electronAPI.configGetBooks()
        if (result.success) {
          return result.data
        } else {
          console.error('获取书籍数据失败:', result.error)
          return null
        }
      } catch (error) {
        console.error('Electron API调用失败:', error)
        return null
      }
    } else {
      // Web环境降级到localStorage
      return this.getBooksDataFromLocalStorage()
    }
  }

  /**
   * 保存书籍数据
   */
  async saveBooksData(booksData: BooksData): Promise<boolean> {
    if (this.isElectron) {
      try {
        const result = await window.electronAPI.configSaveBooks(booksData)
        if (result.success) {
          return true
        } else {
          console.error('保存书籍数据失败:', result.error)
          return false
        }
      } catch (error) {
        console.error('Electron API调用失败:', error)
        return false
      }
    } else {
      // Web环境降级到localStorage
      return this.saveBooksDataToLocalStorage(booksData)
    }
  }

  /**
   * 获取同步配置
   */
  async getSyncConfig(): Promise<SyncConfig | null> {
    if (this.isElectron) {
      try {
        const result = await window.electronAPI.configGetSync()
        if (result.success) {
          return result.data
        } else {
          console.error('获取同步配置失败:', result.error)
          return null
        }
      } catch (error) {
        console.error('Electron API调用失败:', error)
        return null
      }
    } else {
      // Web环境降级到localStorage
      return this.getSyncConfigFromLocalStorage()
    }
  }

  /**
   * 保存同步配置
   */
  async saveSyncConfig(syncConfig: SyncConfig): Promise<boolean> {
    if (this.isElectron) {
      try {
        const result = await window.electronAPI.configSaveSync(syncConfig)
        if (result.success) {
          return true
        } else {
          console.error('保存同步配置失败:', result.error)
          return false
        }
      } catch (error) {
        console.error('Electron API调用失败:', error)
        return false
      }
    } else {
      // Web环境降级到localStorage
      return this.saveSyncConfigToLocalStorage(syncConfig)
    }
  }

  /**
   * 获取应用状态
   */
  async getAppState(): Promise<AppState | null> {
    if (this.isElectron) {
      try {
        const result = await window.electronAPI.configGetState()
        if (result.success) {
          return result.data
        } else {
          console.error('获取应用状态失败:', result.error)
          return null
        }
      } catch (error) {
        console.error('Electron API调用失败:', error)
        return null
      }
    } else {
      // Web环境降级到localStorage
      return this.getAppStateFromLocalStorage()
    }
  }

  /**
   * 保存应用状态
   */
  async saveAppState(appState: AppState): Promise<boolean> {
    if (this.isElectron) {
      try {
        const result = await window.electronAPI.configSaveState(appState)
        if (result.success) {
          return true
        } else {
          console.error('保存应用状态失败:', result.error)
          return false
        }
      } catch (error) {
        console.error('Electron API调用失败:', error)
        return false
      }
    } else {
      // Web环境降级到localStorage
      return this.saveAppStateToLocalStorage(appState)
    }
  }

  /**
   * 导出所有配置
   */
  async exportAllConfig(): Promise<any | null> {
    if (this.isElectron) {
      try {
        const result = await window.electronAPI.configExportAll()
        if (result.success) {
          return result.data
        } else {
          console.error('导出配置失败:', result.error)
          return null
        }
      } catch (error) {
        console.error('Electron API调用失败:', error)
        return null
      }
    } else {
      // Web环境导出localStorage数据
      return this.exportLocalStorageData()
    }
  }

  /**
   * 获取配置目录路径（仅Electron环境）
   */
  async getConfigDirectory(): Promise<{ configDirectory: string, backupDirectory: string } | null> {
    if (this.isElectron) {
      try {
        const result = await window.electronAPI.configGetDirectory()
        if (result.success) {
          return result.data || null
        } else {
          console.error('获取配置目录失败:', result.error)
          return null
        }
      } catch (error) {
        console.error('Electron API调用失败:', error)
        return null
      }
    } else {
      return null
    }
  }

  // ====== localStorage降级方法 ======

  private getSettingsFromLocalStorage(): AppSettings | null {
    try {
      const imageBedConfig = this.getFromLocalStorage('imageBedConfig', { type: 'none' as any, config: {} })
      const appSettings = this.getFromLocalStorage('appSettings', {} as any)
      const isbnApiConfig = this.getFromLocalStorage('isbnApiConfig', { apiKey: '' })

      return {
        imageBed: imageBedConfig,
        backup: appSettings.backup || { folderPath: '', maxBackups: 10 },
        general: appSettings.general || {
          defaultViewMode: 'grid',
          gridViewPageSize: 12,
          tableViewPageSize: 10,
          gridLoadMode: 'pagination',
          infiniteScrollBatchSize: 12,
          enableVirtualScroll: false
        },
        bookApi: isbnApiConfig,
        blog: appSettings.blog || { blogPath: '' }
      }
    } catch (error) {
      console.error('从localStorage读取设置失败:', error)
      return null
    }
  }

  private saveSettingsToLocalStorage(settings: AppSettings): boolean {
    try {
      this.saveToLocalStorage('imageBedConfig', settings.imageBed)
      this.saveToLocalStorage('isbnApiConfig', settings.bookApi)
      this.saveToLocalStorage('appSettings', {
        backup: settings.backup,
        general: settings.general,
        blog: settings.blog
      })
      return true
    } catch (error) {
      console.error('保存设置到localStorage失败:', error)
      return false
    }
  }

  private getBooksDataFromLocalStorage(): BooksData | null {
    try {
      return {
        books: this.getFromLocalStorage('books', []),
        originalFileOrder: this.getFromLocalStorage('originalFileOrder', []),
        originalFileStructure: this.getFromLocalStorage('originalFileStructure', null),
        currentFile: this.getFromLocalStorage('currentFile', null)
      }
    } catch (error) {
      console.error('从localStorage读取书籍数据失败:', error)
      return null
    }
  }

  private saveBooksDataToLocalStorage(booksData: BooksData): boolean {
    try {
      this.saveToLocalStorage('books', booksData.books)
      if (booksData.originalFileOrder) {
        this.saveToLocalStorage('originalFileOrder', booksData.originalFileOrder)
      }
      if (booksData.originalFileStructure) {
        this.saveToLocalStorage('originalFileStructure', booksData.originalFileStructure)
      }
      if (booksData.currentFile) {
        this.saveToLocalStorage('currentFile', booksData.currentFile)
      }
      return true
    } catch (error) {
      console.error('保存书籍数据到localStorage失败:', error)
      return false
    }
  }

  private getSyncConfigFromLocalStorage(): SyncConfig | null {
    try {
      const blogConfig = this.getFromLocalStorage('blogConfig', null as any)
      if (!blogConfig) return null

      return {
        blogPath: blogConfig.blogPath || '',
        lastSyncTime: blogConfig.lastSyncTime || 0,
        cacheVersion: blogConfig.cacheVersion || '',
        autoVersionCheck: blogConfig.autoVersionCheck !== false
      }
    } catch (error) {
      console.error('从localStorage读取同步配置失败:', error)
      return null
    }
  }

  private saveSyncConfigToLocalStorage(syncConfig: SyncConfig): boolean {
    try {
      this.saveToLocalStorage('blogConfig', syncConfig)
      return true
    } catch (error) {
      console.error('保存同步配置到localStorage失败:', error)
      return false
    }
  }

  private getAppStateFromLocalStorage(): AppState | null {
    try {
      return {
        hasSeenFirstTimeSetup: this.getFromLocalStorage('hasSeenFirstTimeSetup', false),
        permanentlySkippedSetup: this.getFromLocalStorage('permanentlySkippedSetup', false),
        lastUsedVersion: '1.0.7'
      }
    } catch (error) {
      console.error('从localStorage读取应用状态失败:', error)
      return null
    }
  }

  private saveAppStateToLocalStorage(appState: AppState): boolean {
    try {
      this.saveToLocalStorage('hasSeenFirstTimeSetup', appState.hasSeenFirstTimeSetup)
      this.saveToLocalStorage('permanentlySkippedSetup', appState.permanentlySkippedSetup)
      return true
    } catch (error) {
      console.error('保存应用状态到localStorage失败:', error)
      return false
    }
  }

  private exportLocalStorageData(): any {
    const data: any = {}
    const keys = Object.keys(localStorage)
    
    keys.forEach(key => {
      if (key.startsWith('book-manager_')) {
        const shortKey = key.replace('book-manager_', '')
        const value = localStorage.getItem(key)
        if (value) {
          try {
            data[shortKey] = JSON.parse(value)
          } catch {
            data[shortKey] = value
          }
        }
      }
    })

    return {
      ...data,
      exportedAt: Date.now(),
      version: '1.0.7',
      source: 'localStorage'
    }
  }

  private getFromLocalStorage<T>(key: string, defaultValue: T): T {
    try {
      const fullKey = `book-manager_${key}`
      const value = localStorage.getItem(fullKey)
      if (value === null) return defaultValue
      return JSON.parse(value)
    } catch {
      return defaultValue
    }
  }

  private saveToLocalStorage(key: string, value: any): void {
    try {
      const fullKey = `book-manager_${key}`
      localStorage.setItem(fullKey, JSON.stringify(value))
    } catch (error) {
      console.error('localStorage保存失败:', error)
    }
  }

  /**
   * 清除所有配置数据
   * 用于重置应用到初始状态
   */
  async clearAllData(): Promise<ConfigResult<void>> {
    try {
      // 设置重置状态标记
      this.setResetFlag(true)
      
      if (this.isElectron) {
        // 在Electron环境中使用原生配置清理
        const result = await window.electronAPI.configClearAll()
        if (result.success) {
          console.log('所有配置文件已通过Electron清除')
        } else {
          console.error('Electron配置清理失败:', result.error)
          return { success: false, error: result.error || '配置清理失败' }
        }
      } else {
        // Web环境中清除localStorage
        this.clearLocalStorage()
        console.log('localStorage已清除')
      }
      
      // 清除内存缓存
      this.clearMemoryCache()
      
      return { success: true }
    } catch (error) {
      console.error('清除所有配置数据失败:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * 设置重置状态标记
   */
  private setResetFlag(isReset: boolean): void {
    try {
      if (this.isElectron) {
        // 在Electron环境中存储到临时变量
        (window as any).__APP_RESET_FLAG__ = isReset
      } else {
        // 在Web环境中存储到sessionStorage（页面刷新后会清除）
        if (isReset) {
          sessionStorage.setItem('__APP_RESET_FLAG__', 'true')
        } else {
          sessionStorage.removeItem('__APP_RESET_FLAG__')
        }
      }
    } catch (error) {
      console.warn('设置重置标记失败:', error)
    }
  }

  /**
   * 检查是否为重置状态
   */
  isResetState(): boolean {
    try {
      if (this.isElectron) {
        return !!(window as any).__APP_RESET_FLAG__
      } else {
        return sessionStorage.getItem('__APP_RESET_FLAG__') === 'true'
      }
    } catch (error) {
      console.warn('检查重置状态失败:', error)
      return false
    }
  }

  /**
   * 清除重置状态标记
   */
  clearResetFlag(): void {
    try {
      if (this.isElectron) {
        delete (window as any).__APP_RESET_FLAG__
      } else {
        sessionStorage.removeItem('__APP_RESET_FLAG__')
      }
    } catch (error) {
      console.warn('清除重置标记失败:', error)
    }
  }

  /**
   * 清除内存缓存
   */
  private clearMemoryCache(): void {
    this.memoryCache = {}
    console.log('内存缓存已清除')
  }

  /**
   * 清除localStorage中的所有book-manager相关数据
   */
  private clearLocalStorage(): void {
    try {
      const keysToRemove: string[] = []
      
      // 遍历所有localStorage键，找到book-manager相关的键
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('book-manager_')) {
          keysToRemove.push(key)
        }
      }

      // 删除找到的所有键
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`已删除localStorage键: ${key}`)
      })

      console.log(`共清除了 ${keysToRemove.length} 个localStorage键`)
    } catch (error) {
      console.error('清除localStorage失败:', error)
      throw error
    }
  }
}

// 创建单例实例
export const configAPI = new ConfigAPI()