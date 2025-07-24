const { contextBridge, ipcRenderer } = require('electron')

// 非常明显的调试信号
console.log('=== PRELOAD.TS LOADED 2025-07-16 08:17 ===')
console.log('=== DOWNLOADIMAGE SHOULD BE AVAILABLE ===')

// 定义API接口
export interface ElectronAPI {
  // 图片上传相关
  uploadImage: (file: { name: string, path?: string, base64: string }, config: any) => Promise<{ success: boolean, data?: any, error?: string }>
  testQiniuConfig: (config: any) => Promise<{ success: boolean, data?: any, error?: string }>
  downloadImage: (imageUrl: string) => Promise<{ success: boolean, data?: any, error?: string }>
  
  // 文件系统相关
  selectFile: () => Promise<{ success: boolean, data?: string, error?: string }>
  readFile: (filePath: string) => Promise<{ success: boolean, data?: string, error?: string }>
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean, error?: string }>
  
  // 新增的文件操作API
  selectMdFile: () => Promise<{ success: boolean, data?: { content: string, fileName: string, filePath: string }, error?: string }>
  selectBackupFolder: () => Promise<{ success: boolean, data?: { folderPath: string }, error?: string }>
  createBackup: (originalPath: string, backupFolderPath?: string, maxBackups?: number) => Promise<{ success: boolean, data?: any, error?: string }>
  
  // 版本同步相关API
  getFileStats: (filePath: string) => Promise<{ success: boolean, data?: { exists: boolean, size: number, modifiedTime: number, createdTime: number, isFile: boolean, isDirectory: boolean }, error?: string }>
  fileExists: (filePath: string) => Promise<{ success: boolean, data?: boolean, error?: string }>
  
  // 文件夹操作相关API
  openInFolder: (filePath: string) => Promise<{ success: boolean, data?: { filePath: string }, error?: string }>
  
  // 外部链接相关API
  openExternalLink: (url: string) => Promise<{ success: boolean, data?: { url: string }, error?: string }>
  
  // 主题文件保存相关API
  saveThemeFile: (params: { filename: string, content: string, type: 'css' | 'js' }) => Promise<{ success: boolean, data?: { filePath: string }, error?: string }>
  
  // 配置管理API
  configGetSettings: () => Promise<{ success: boolean, data?: any, error?: string }>
  configSaveSettings: (settings: any) => Promise<{ success: boolean, error?: string }>
  configGetBooks: () => Promise<{ success: boolean, data?: any, error?: string }>
  configSaveBooks: (booksData: any) => Promise<{ success: boolean, error?: string }>
  configGetSync: () => Promise<{ success: boolean, data?: any, error?: string }>
  configSaveSync: (syncConfig: any) => Promise<{ success: boolean, error?: string }>
  configGetState: () => Promise<{ success: boolean, data?: any, error?: string }>
  configSaveState: (appState: any) => Promise<{ success: boolean, error?: string }>
  configMigrateFromLocalStorage: (localStorageData: Record<string, any>, options: any) => Promise<{ success: boolean, migratedFiles?: string[], errors?: string[], backupPath?: string }>
  configExportAll: () => Promise<{ success: boolean, data?: any, error?: string }>
  configExists: (filename: string) => Promise<{ success: boolean, data?: boolean, error?: string }>
  configGetDirectory: () => Promise<{ success: boolean, data?: { configDirectory: string, backupDirectory: string }, error?: string }>
  configClearAll: () => Promise<{ success: boolean, error?: string }>
}

// 暴露API到渲染进程
const electronAPI = {
  uploadImage: (file: { name: string, path?: string, base64: string }, config: any) => {
    return ipcRenderer.invoke('upload-image', file, config)
  },
  
  testQiniuConfig: (config: any) => {
    return ipcRenderer.invoke('test-qiniu-config', config)
  },
  
  downloadImage: (imageUrl: string) => {
    console.log('preload.ts: downloadImage 被调用', imageUrl)
    return ipcRenderer.invoke('download-image', imageUrl)
  },
  
  selectFile: () => {
    return ipcRenderer.invoke('select-file')
  },
  
  readFile: (filePath: string) => {
    return ipcRenderer.invoke('read-file', filePath)
  },
  
  writeFile: (filePath: string, content: string) => {
    return ipcRenderer.invoke('write-file', filePath, content)
  },
  
  // 新增的文件操作API实现
  selectMdFile: () => {
    console.log('preload.ts: selectMdFile 被调用')
    return ipcRenderer.invoke('select-md-file')
  },
  
  selectBackupFolder: () => {
    console.log('preload.ts: selectBackupFolder 被调用')
    return ipcRenderer.invoke('select-backup-folder').then((result: any) => {
      console.log('preload.ts: selectBackupFolder 返回结果:', result)
      return result
    })
  },
  
  createBackup: (originalPath: string, backupFolderPath?: string, maxBackups?: number) => {
    console.log('preload.ts: createBackup 被调用', originalPath, backupFolderPath, maxBackups)
    return ipcRenderer.invoke('create-backup', originalPath, backupFolderPath, maxBackups)
  },
  
  // 版本同步相关API实现
  getFileStats: (filePath: string) => {
    console.log('preload.ts: getFileStats 被调用', filePath)
    return ipcRenderer.invoke('get-file-stats', filePath)
  },
  
  fileExists: (filePath: string) => {
    console.log('preload.ts: fileExists 被调用', filePath)
    return ipcRenderer.invoke('file-exists', filePath)
  },
  
  openInFolder: (filePath: string) => {
    console.log('preload.ts: openInFolder 被调用', filePath)
    return ipcRenderer.invoke('open-in-folder', filePath)
  },
  
  openExternalLink: (url: string) => {
    console.log('preload.ts: openExternalLink 被调用', url)
    return ipcRenderer.invoke('open-external-link', url)
  },
  
  saveThemeFile: (params: { filename: string, content: string, type: 'css' | 'js' }) => {
    console.log('preload.ts: saveThemeFile 被调用', params.filename)
    return ipcRenderer.invoke('save-theme-file', params)
  },
  
  // 配置管理API实现
  configGetSettings: () => {
    console.log('preload.ts: configGetSettings 被调用')
    return ipcRenderer.invoke('config-get-settings')
  },
  
  configSaveSettings: (settings: any) => {
    console.log('preload.ts: configSaveSettings 被调用')
    return ipcRenderer.invoke('config-save-settings', settings)
  },
  
  configGetBooks: () => {
    console.log('preload.ts: configGetBooks 被调用')
    return ipcRenderer.invoke('config-get-books')
  },
  
  configSaveBooks: (booksData: any) => {
    console.log('preload.ts: configSaveBooks 被调用')
    return ipcRenderer.invoke('config-save-books', booksData)
  },
  
  configGetSync: () => {
    console.log('preload.ts: configGetSync 被调用')
    return ipcRenderer.invoke('config-get-sync')
  },
  
  configSaveSync: (syncConfig: any) => {
    console.log('preload.ts: configSaveSync 被调用')
    return ipcRenderer.invoke('config-save-sync', syncConfig)
  },
  
  configGetState: () => {
    console.log('preload.ts: configGetState 被调用')
    return ipcRenderer.invoke('config-get-state')
  },
  
  configSaveState: (appState: any) => {
    console.log('preload.ts: configSaveState 被调用')
    return ipcRenderer.invoke('config-save-state', appState)
  },
  
  configMigrateFromLocalStorage: (localStorageData: Record<string, any>, options: any) => {
    console.log('preload.ts: configMigrateFromLocalStorage 被调用')
    return ipcRenderer.invoke('config-migrate-from-localstorage', localStorageData, options)
  },
  
  configExportAll: () => {
    console.log('preload.ts: configExportAll 被调用')
    return ipcRenderer.invoke('config-export-all')
  },
  
  configExists: (filename: string) => {
    console.log('preload.ts: configExists 被调用', filename)
    return ipcRenderer.invoke('config-exists', filename)
  },
  
  configGetDirectory: () => {
    console.log('preload.ts: configGetDirectory 被调用')
    return ipcRenderer.invoke('config-get-directory')
  },
  
  configClearAll: () => {
    console.log('preload.ts: configClearAll 被调用')
    return ipcRenderer.invoke('config-clear-all')
  }
} as ElectronAPI

console.log('preload.ts: 暴露API到渲染进程', Object.keys(electronAPI))
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// 类型声明
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}