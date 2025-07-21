/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// ElectronAPI 类型定义
interface ElectronAPI {
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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}