/**
 * 配置系统类型定义
 * 定义Electron原生配置存储的数据结构
 */

import type { Book } from './index'
import type { ImageBedConfig } from '../utils/imageBed'
import type { OriginalFileStructure } from '../utils/bookParser'

/**
 * 应用设置配置
 */
export interface AppSettings {
  imageBed: ImageBedConfig
  backup: BackupSettings
  general: GeneralSettings
  bookApi: BookApiSettings
  blog: BlogSettings
}

/**
 * 备份设置
 */
export interface BackupSettings {
  folderPath: string
  maxBackups: number
}

/**
 * 通用设置
 */
export interface GeneralSettings {
  defaultViewMode: 'grid' | 'table'
  gridViewPageSize: number
  tableViewPageSize: number
  gridLoadMode: 'pagination' | 'infinite'
  infiniteScrollBatchSize: number
  enableVirtualScroll: boolean
}

/**
 * 图书API设置
 */
export interface BookApiSettings {
  apiKey: string
}

/**
 * 博客设置
 */
export interface BlogSettings {
  blogPath: string
}

/**
 * 书籍数据配置
 */
export interface BooksData {
  books: Book[]
  originalFileOrder?: Book[]
  originalFileStructure?: OriginalFileStructure | null
  currentFile?: {
    fileName: string
    filePath: string
  } | null
}

/**
 * 版本同步配置
 */
export interface SyncConfig {
  blogPath: string
  lastSyncTime: number
  cacheVersion: string
  autoVersionCheck: boolean
}

/**
 * 应用状态配置
 */
export interface AppState {
  hasSeenFirstTimeSetup: boolean
  permanentlySkippedSetup: boolean
  lastUsedVersion: string
}

/**
 * 完整的配置结构
 */
export interface FullConfig {
  settings: AppSettings
  books: BooksData
  sync: SyncConfig
  state: AppState
  metadata: {
    version: string
    createdAt: number
    updatedAt: number
  }
}

/**
 * 配置文件映射
 */
export interface ConfigFileMap {
  'settings.json': AppSettings
  'books.json': BooksData
  'sync.json': SyncConfig
  'state.json': AppState
}

/**
 * 配置变更事件
 */
export interface ConfigChangeEvent<T = any> {
  file: keyof ConfigFileMap
  oldValue: T | null
  newValue: T
  timestamp: number
}

/**
 * 配置API结果
 */
export interface ConfigResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * 数据迁移选项
 */
export interface MigrationOptions {
  fromLocalStorage: boolean
  createBackup: boolean
  cleanupLocalStorage: boolean
}

/**
 * 数据迁移结果
 */
export interface MigrationResult {
  success: boolean
  migratedFiles: string[]
  errors: string[]
  backupPath?: string
}