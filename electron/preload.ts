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