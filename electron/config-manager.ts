/**
 * Electron配置管理器
 * 负责原生文件系统的配置存储和管理
 */

import { app } from 'electron'
import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import type { 
  AppSettings, 
  BooksData, 
  SyncConfig, 
  AppState, 
  ConfigFileMap, 
  ConfigResult,
  ConfigChangeEvent,
  MigrationOptions,
  MigrationResult
} from '../src/types/config'

/**
 * 配置管理器类
 */
export class ConfigManager {
  private configDir: string
  private backupDir: string
  private changeListeners: Map<string, Array<(event: ConfigChangeEvent) => void>> = new Map()
  
  constructor() {
    // 获取用户数据目录
    this.configDir = join(app.getPath('userData'), 'config')
    this.backupDir = join(app.getPath('userData'), 'backups')
  }

  /**
   * 初始化配置目录
   */
  async initialize(): Promise<void> {
    try {
      // 确保配置目录存在
      await fs.mkdir(this.configDir, { recursive: true })
      await fs.mkdir(this.backupDir, { recursive: true })
      
      console.log('ConfigManager initialized:', this.configDir)
    } catch (error) {
      console.error('Failed to initialize config directory:', error)
      throw error
    }
  }

  /**
   * 获取配置文件路径
   */
  private getConfigPath(filename: keyof ConfigFileMap): string {
    return join(this.configDir, filename)
  }

  /**
   * 获取备份文件路径
   */
  private getBackupPath(filename: string, timestamp: number): string {
    const backupName = `${filename.replace('.json', '')}_${timestamp}.json`
    return join(this.backupDir, backupName)
  }

  /**
   * 安全地读取JSON文件
   */
  private async readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
    try {
      const data = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // 文件不存在，返回默认值
        return defaultValue
      }
      console.error('Error reading config file:', filePath, error)
      throw error
    }
  }

  /**
   * 安全地写入JSON文件
   */
  private async writeJsonFile<T>(filePath: string, data: T, createBackup: boolean = true): Promise<void> {
    try {
      // 确保目录存在
      await fs.mkdir(dirname(filePath), { recursive: true })
      
      // 创建备份
      if (createBackup) {
        try {
          await fs.access(filePath)
          const timestamp = Date.now()
          const backupPath = this.getBackupPath(filePath.split('/').pop() || 'unknown', timestamp)
          await fs.copyFile(filePath, backupPath)
          
          // 清理旧备份（保留最近10个）
          await this.cleanupBackups(filePath.split('/').pop() || 'unknown', 10)
        } catch (error) {
          // 文件不存在或无法备份，继续执行
        }
      }
      
      // 写入数据
      const jsonData = JSON.stringify(data, null, 2)
      await fs.writeFile(filePath, jsonData, 'utf-8')
    } catch (error) {
      console.error('Error writing config file:', filePath, error)
      throw error
    }
  }

  /**
   * 清理旧备份文件
   */
  private async cleanupBackups(filename: string, keepCount: number): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir)
      const prefix = filename.replace('.json', '')
      
      const backupFiles = files
        .filter(file => file.startsWith(prefix) && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: join(this.backupDir, file),
          timestamp: parseInt(file.split('_').pop()?.replace('.json', '') || '0')
        }))
        .sort((a, b) => b.timestamp - a.timestamp)
      
      // 删除多余的备份文件
      if (backupFiles.length > keepCount) {
        const filesToDelete = backupFiles.slice(keepCount)
        for (const file of filesToDelete) {
          await fs.unlink(file.path)
        }
      }
    } catch (error) {
      console.error('Error cleaning up backups:', error)
      // 不抛出错误，清理失败不应该影响主要功能
    }
  }

  /**
   * 触发配置变更事件
   */
  private emitChangeEvent<T>(file: keyof ConfigFileMap, oldValue: T | null, newValue: T): void {
    const event: ConfigChangeEvent<T> = {
      file,
      oldValue,
      newValue,
      timestamp: Date.now()
    }
    
    const listeners = this.changeListeners.get(file) || []
    listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Error in config change listener:', error)
      }
    })
  }

  /**
   * 添加配置变更监听器
   */
  addChangeListener(file: keyof ConfigFileMap, listener: (event: ConfigChangeEvent) => void): void {
    if (!this.changeListeners.has(file)) {
      this.changeListeners.set(file, [])
    }
    this.changeListeners.get(file)!.push(listener)
  }

  /**
   * 移除配置变更监听器
   */
  removeChangeListener(file: keyof ConfigFileMap, listener: (event: ConfigChangeEvent) => void): void {
    const listeners = this.changeListeners.get(file)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * 读取应用设置
   */
  async getSettings(): Promise<ConfigResult<AppSettings>> {
    try {
      const defaultSettings: AppSettings = {
        imageBed: { type: 'none' as any, config: {} },
        backup: { folderPath: '', maxBackups: 10 },
        general: {
          defaultViewMode: 'grid',
          gridViewPageSize: 12,
          tableViewPageSize: 10,
          gridLoadMode: 'pagination',
          infiniteScrollBatchSize: 12,
          enableVirtualScroll: false
        },
        bookApi: { apiKey: '' },
        blog: { blogPath: '' }
      }
      
      const settings = await this.readJsonFile(this.getConfigPath('settings.json'), defaultSettings)
      return { success: true, data: settings }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * 保存应用设置
   */
  async saveSettings(settings: AppSettings): Promise<ConfigResult<void>> {
    try {
      const oldSettings = await this.getSettings()
      await this.writeJsonFile(this.getConfigPath('settings.json'), settings)
      
      this.emitChangeEvent('settings.json', oldSettings.data || null, settings)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * 读取书籍数据
   */
  async getBooksData(): Promise<ConfigResult<BooksData>> {
    try {
      const defaultBooksData: BooksData = {
        books: [],
        originalFileOrder: [],
        originalFileStructure: null,
        currentFile: null
      }
      
      const booksData = await this.readJsonFile(this.getConfigPath('books.json'), defaultBooksData)
      return { success: true, data: booksData }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * 保存书籍数据
   */
  async saveBooksData(booksData: BooksData): Promise<ConfigResult<void>> {
    try {
      const oldBooksData = await this.getBooksData()
      await this.writeJsonFile(this.getConfigPath('books.json'), booksData)
      
      this.emitChangeEvent('books.json', oldBooksData.data || null, booksData)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * 读取同步配置
   */
  async getSyncConfig(): Promise<ConfigResult<SyncConfig>> {
    try {
      const defaultSyncConfig: SyncConfig = {
        blogPath: '',
        lastSyncTime: 0,
        cacheVersion: '',
        autoVersionCheck: true
      }
      
      const syncConfig = await this.readJsonFile(this.getConfigPath('sync.json'), defaultSyncConfig)
      return { success: true, data: syncConfig }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * 保存同步配置
   */
  async saveSyncConfig(syncConfig: SyncConfig): Promise<ConfigResult<void>> {
    try {
      const oldSyncConfig = await this.getSyncConfig()
      await this.writeJsonFile(this.getConfigPath('sync.json'), syncConfig)
      
      this.emitChangeEvent('sync.json', oldSyncConfig.data || null, syncConfig)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * 读取应用状态
   */
  async getAppState(): Promise<ConfigResult<AppState>> {
    try {
      const defaultAppState: AppState = {
        hasSeenFirstTimeSetup: false,
        permanentlySkippedSetup: false,
        lastUsedVersion: '1.0.0'
      }
      
      const appState = await this.readJsonFile(this.getConfigPath('state.json'), defaultAppState)
      return { success: true, data: appState }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * 保存应用状态
   */
  async saveAppState(appState: AppState): Promise<ConfigResult<void>> {
    try {
      const oldAppState = await this.getAppState()
      await this.writeJsonFile(this.getConfigPath('state.json'), appState)
      
      this.emitChangeEvent('state.json', oldAppState.data || null, appState)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * 从localStorage迁移数据
   */
  async migrateFromLocalStorage(localStorageData: Record<string, any>, options: MigrationOptions): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedFiles: [],
      errors: []
    }

    try {
      // 创建备份
      if (options.createBackup) {
        const timestamp = Date.now()
        const backupData = {
          localStorageData,
          timestamp,
          version: '1.0.0'
        }
        const backupPath = join(this.backupDir, `migration_backup_${timestamp}.json`)
        await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2))
        result.backupPath = backupPath
      }

      // 迁移设置数据
      if (localStorageData.appSettings || localStorageData.imageBedConfig || localStorageData.isbnApiConfig) {
        try {
          const settings: AppSettings = {
            imageBed: localStorageData.imageBedConfig || { type: 'none', config: {} },
            backup: localStorageData.appSettings?.backup || { folderPath: '', maxBackups: 10 },
            general: localStorageData.appSettings?.general || {
              defaultViewMode: 'grid',
              gridViewPageSize: 12,
              tableViewPageSize: 10,
              gridLoadMode: 'pagination',
              infiniteScrollBatchSize: 12,
              enableVirtualScroll: false
            },
            bookApi: localStorageData.isbnApiConfig || { apiKey: '' },
            blog: localStorageData.appSettings?.blog || { blogPath: '' }
          }
          
          await this.saveSettings(settings)
          result.migratedFiles.push('settings.json')
        } catch (error) {
          result.errors.push(`设置迁移失败: ${(error as Error).message}`)
        }
      }

      // 迁移书籍数据
      if (localStorageData.books) {
        try {
          const booksData: BooksData = {
            books: localStorageData.books || [],
            originalFileOrder: localStorageData.originalFileOrder || [],
            originalFileStructure: localStorageData.originalFileStructure || null,
            currentFile: localStorageData.currentFile || null
          }
          
          await this.saveBooksData(booksData)
          result.migratedFiles.push('books.json')
        } catch (error) {
          result.errors.push(`书籍数据迁移失败: ${(error as Error).message}`)
        }
      }

      // 迁移同步配置
      if (localStorageData.blogConfig) {
        try {
          const syncConfig: SyncConfig = {
            blogPath: localStorageData.blogConfig.blogPath || '',
            lastSyncTime: localStorageData.blogConfig.lastSyncTime || 0,
            cacheVersion: localStorageData.blogConfig.cacheVersion || '',
            autoVersionCheck: localStorageData.blogConfig.autoVersionCheck !== false
          }
          
          await this.saveSyncConfig(syncConfig)
          result.migratedFiles.push('sync.json')
        } catch (error) {
          result.errors.push(`同步配置迁移失败: ${(error as Error).message}`)
        }
      }

      // 迁移应用状态
      try {
        const appState: AppState = {
          hasSeenFirstTimeSetup: localStorageData.hasSeenFirstTimeSetup || false,
          permanentlySkippedSetup: localStorageData.permanentlySkippedSetup || false,
          lastUsedVersion: '1.0.7' // 当前版本
        }
        
        await this.saveAppState(appState)
        result.migratedFiles.push('state.json')
      } catch (error) {
        result.errors.push(`应用状态迁移失败: ${(error as Error).message}`)
      }

      // 如果有错误，标记为部分失败
      if (result.errors.length > 0) {
        result.success = false
      }

    } catch (error) {
      result.success = false
      result.errors.push(`迁移过程失败: ${(error as Error).message}`)
    }

    return result
  }

  /**
   * 获取配置目录路径
   */
  getConfigDirectory(): string {
    return this.configDir
  }

  /**
   * 获取备份目录路径
   */
  getBackupDirectory(): string {
    return this.backupDir
  }

  /**
   * 检查配置文件是否存在
   */
  async configExists(filename: keyof ConfigFileMap): Promise<boolean> {
    try {
      await fs.access(this.getConfigPath(filename))
      return true
    } catch {
      return false
    }
  }

  /**
   * 导出所有配置
   */
  async exportAllConfig(): Promise<ConfigResult<any>> {
    try {
      const settings = await this.getSettings()
      const booksData = await this.getBooksData()
      const syncConfig = await this.getSyncConfig()
      const appState = await this.getAppState()

      const exportData = {
        settings: settings.data,
        books: booksData.data,
        sync: syncConfig.data,
        state: appState.data,
        exportedAt: Date.now(),
        version: '1.0.7'
      }

      return { success: true, data: exportData }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * 清除所有配置文件
   * 用于重置应用到初始状态
   */
  async clearAllConfigs(): Promise<ConfigResult<void>> {
    try {
      const configFiles: (keyof ConfigFileMap)[] = ['settings.json', 'books.json', 'sync.json', 'state.json']
      const deletedFiles: string[] = []
      const errors: string[] = []

      for (const file of configFiles) {
        try {
          const filePath = this.getConfigPath(file)
          await fs.unlink(filePath)
          deletedFiles.push(file)
          console.log(`已删除配置文件: ${file}`)
        } catch (error) {
          // 文件不存在不算错误
          if ((error as any).code !== 'ENOENT') {
            errors.push(`删除 ${file} 失败: ${(error as Error).message}`)
          }
        }
      }

      if (errors.length > 0) {
        console.warn('部分配置文件删除失败:', errors)
        return { 
          success: false, 
          error: `部分配置文件删除失败: ${errors.join(', ')}` 
        }
      }

      console.log('所有配置文件已清除，应用已重置为初始状态')
      return { success: true }
    } catch (error) {
      console.error('清除配置文件失败:', error)
      return { success: false, error: (error as Error).message }
    }
  }
}

// 创建单例实例
export const configManager = new ConfigManager()