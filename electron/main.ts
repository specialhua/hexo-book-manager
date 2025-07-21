import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import { PicGoService } from './picgo-service.js'
import https from 'https'
import http from 'http'
import { URL } from 'url'

// 在CommonJS环境中__dirname是可用的
// const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null
let picGoService: PicGoService | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,  // 自动隐藏菜单栏，按Alt键可显示
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false  // 临时禁用网络安全用于调试
    },
    icon: path.join(__dirname, '../public/icon.png')
  })

  // 开发模式下加载Vite服务器
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:1420')
    mainWindow.webContents.openDevTools()
    
    // 调试preload加载
    mainWindow.webContents.once('did-finish-load', () => {
      console.log('页面加载完成，检查electronAPI')
      if (mainWindow) {
        mainWindow.webContents.executeJavaScript('console.log("electronAPI keys:", Object.keys(window.electronAPI || {}))')
      }
    })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
  createWindow()
  
  // 初始化PicGo服务
  picGoService = new PicGoService()
  
  // macOS上，当点击dock图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 当所有窗口关闭时退出应用 (macOS除外)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC处理器

ipcMain.handle('upload-image', async (event, file: { name: string, base64: string, path?: string }, config: any) => {
  try {
    if (!picGoService) {
      throw new Error('PicGo service not initialized')
    }
    
    // 处理base64数据
    let fileData: { name: string, path?: string, data: Buffer }
    
    if (file.path) {
      // 如果有路径，直接使用
      fileData = { name: file.name, path: file.path, data: Buffer.alloc(0) }
    } else {
      // 如果是base64数据，转换为Buffer
      console.log('处理base64数据，原始长度:', file.base64.length)
      console.log('base64前缀:', file.base64.substring(0, 50))
      
      // 正确处理 data URL 格式的 base64
      const base64Data = file.base64.replace(/^data:image\/[a-z]+;base64,/, '')
      console.log('清理后base64长度:', base64Data.length)
      
      const buffer = Buffer.from(base64Data, 'base64')
      console.log('转换后Buffer大小:', buffer.length, 'bytes')
      
      fileData = { 
        name: file.name, 
        data: buffer 
      }
    }
    
    console.log('开始上传到七牛云，文件信息:', fileData.name)
    console.log('=== IPC收到的配置参数 ===')
    console.log('config对象:', config)
    console.log('config.qiniu_style_suffix:', config.qiniu_style_suffix)
    console.log('config类型:', typeof config)
    console.log('config所有字段:', Object.keys(config))
    console.log('========================')
    
    const result = await picGoService.uploadToQiniu(config, fileData)
    
    console.log('七牛云上传结果:', result)
    return result
  } catch (error) {
    console.error('Upload failed:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('test-qiniu-config', async (event, config: any, enableFileUploadTest: boolean = false) => {
  try {
    if (!picGoService) {
      throw new Error('PicGo service not initialized')
    }
    
    console.log('收到测试配置请求，完整测试模式:', enableFileUploadTest)
    const result = await picGoService.testQiniuConfig(config, enableFileUploadTest)
    return result
  } catch (error) {
    console.error('Config test failed:', error)
    return { success: false, error: (error as Error).message }
  }
})

// 下载图片的IPC处理器
console.log('注册 download-image IPC 处理器')
ipcMain.handle('download-image', async (event, imageUrl: string) => {
  console.log('收到 download-image 请求:', imageUrl)
  return new Promise((resolve) => {
    try {
      // 验证URL格式
      if (!imageUrl || typeof imageUrl !== 'string') {
        resolve({ success: false, error: '无效的图片URL' })
        return
      }
      
      // 检查URL协议
      const url = new URL(imageUrl)
      if (!['http:', 'https:'].includes(url.protocol)) {
        resolve({ success: false, error: '不支持的URL协议，仅支持HTTP和HTTPS' })
        return
      }
      
      const client = url.protocol === 'https:' ? https : http
      
      const request = client.get(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      }, (response) => {
        if (response.statusCode !== 200) {
          resolve({ 
            success: false, 
            error: `HTTP ${response.statusCode}: ${response.statusMessage}` 
          })
          return
        }
        
        const chunks: Buffer[] = []
        
        response.on('data', (chunk) => {
          chunks.push(chunk)
        })
        
        response.on('end', () => {
          const buffer = Buffer.concat(chunks)
          const base64 = buffer.toString('base64')
          const contentType = response.headers['content-type'] || 'image/jpeg'
          
          resolve({
            success: true,
            data: {
              base64: `data:${contentType};base64,${base64}`,
              size: buffer.length,
              contentType
            }
          })
        })
        
        response.on('error', (error) => {
          resolve({ 
            success: false, 
            error: `Download error: ${error.message}` 
          })
        })
      })
      
      request.on('timeout', () => {
        request.destroy()
        resolve({ 
          success: false, 
          error: 'Download timeout' 
        })
      })
      
      request.on('error', (error) => {
        resolve({ 
          success: false, 
          error: `Request error: ${error.message}` 
        })
      })
      
    } catch (error) {
      resolve({ 
        success: false, 
        error: `Invalid URL: ${(error as Error).message}` 
      })
    }
  })
})

ipcMain.handle('select-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
      ]
    })
    
    if (result.canceled) {
      return { success: false, error: 'User cancelled' }
    }
    
    return { success: true, data: result.filePaths[0] }
  } catch (error) {
    console.error('File selection failed:', error)
    return { success: false, error: (error as Error).message }
  }
})

// 选择Markdown文件 - 返回完整路径信息
ipcMain.handle('select-md-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [
        { name: 'Markdown文件', extensions: ['md'] },
        { name: '文本文件', extensions: ['txt'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })
    
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: '用户取消选择' }
    }
    
    const filePath = result.filePaths[0]
    const fs = await import('fs')
    const path = await import('path')
    
    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf8')
    const fileName = path.basename(filePath)
    
    return { 
      success: true, 
      data: {
        content,
        fileName,
        filePath: filePath // 完整绝对路径
      }
    }
  } catch (error) {
    console.error('Select markdown file failed:', error)
    return { success: false, error: (error as Error).message }
  }
})

// 选择备份文件夹
ipcMain.handle('select-backup-folder', async () => {
  try {
    console.log('Electron: 开始选择备份文件夹...')
    
    if (!mainWindow) {
      console.error('Electron: mainWindow 未初始化')
      return { success: false, error: '窗口未初始化' }
    }

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: '选择备份文件夹',
      buttonLabel: '选择此文件夹'
    })
    
    console.log('Electron: 选择结果:', result)
    
    if (result.canceled || result.filePaths.length === 0) {
      console.log('Electron: 用户取消选择')
      return { success: false, error: '用户取消选择' }
    }
    
    const selectedPath = result.filePaths[0]
    console.log('Electron: 选择成功，路径:', selectedPath)
    
    return { 
      success: true, 
      data: {
        folderPath: selectedPath
      }
    }
  } catch (error) {
    console.error('Electron: Select backup folder failed:', error)
    return { success: false, error: (error as Error).message }
  }
})

// 创建文件备份
ipcMain.handle('create-backup', async (event, originalPath: string, backupFolderPath?: string, maxBackups?: number) => {
  try {
    const fs = await import('fs')
    const path = await import('path')
    
    // 生成备份文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const originalName = path.basename(originalPath)
    const nameWithoutExt = path.parse(originalName).name
    const ext = path.parse(originalName).ext
    const backupName = `${nameWithoutExt}.backup.${timestamp}${ext}`
    
    // 确定备份路径
    if (!backupFolderPath || !fs.existsSync(backupFolderPath)) {
      // 如果用户没有配置备份路径或路径不存在，返回错误
      const errorMsg = !backupFolderPath 
        ? '未配置备份文件夹路径，请在设置中配置备份路径' 
        : '配置的备份文件夹不存在，请检查备份路径设置'
      console.error('备份失败:', errorMsg)
      return { success: false, error: errorMsg }
    }
    
    // 使用用户配置的备份文件夹
    const backupPath = path.join(backupFolderPath, backupName)
    console.log('使用用户配置的备份路径:', backupPath)
    
    // 复制文件
    fs.copyFileSync(originalPath, backupPath)
    
    // 获取文件大小
    const stats = fs.statSync(backupPath)
    
    // 实现备份数量限制
    if (maxBackups && maxBackups > 0) {
      try {
        const backupDir = path.dirname(backupPath)
        const files = fs.readdirSync(backupDir)
        
        // 过滤备份文件（包含.backup.的文件）
        const backupFiles = files.filter(file => file.includes('.backup.'))
        
        // 如果超过限制，删除最老的备份
        if (backupFiles.length > maxBackups) {
          // 获取文件的创建时间并排序
          const filesWithStats = backupFiles.map(file => ({
            name: file,
            path: path.join(backupDir, file),
            stats: fs.statSync(path.join(backupDir, file))
          }))
          
          // 按创建时间排序（最老的在前）
          filesWithStats.sort((a, b) => a.stats.ctime.getTime() - b.stats.ctime.getTime())
          
          // 删除超出限制的文件
          const filesToDelete = filesWithStats.slice(0, filesWithStats.length - maxBackups)
          filesToDelete.forEach(file => {
            try {
              fs.unlinkSync(file.path)
              console.log(`删除旧备份文件: ${file.name}`)
            } catch (deleteError) {
              console.error(`删除备份文件失败: ${file.name}`, deleteError)
            }
          })
        }
      } catch (cleanupError) {
        console.warn('清理旧备份文件时出错:', cleanupError)
      }
    }
    
    return {
      success: true,
      data: {
        original_path: originalPath,
        backup_path: backupPath,
        timestamp: new Date().toISOString(),
        size: stats.size,
        used_default_path: false
      }
    }
  } catch (error) {
    console.error('Create backup failed:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('read-file', async (event, filePath: string) => {
  console.log('🔄 main.ts: read-file 请求:', filePath)
  
  try {
    const fs = await import('fs')
    const path = await import('path')
    
    // 首先检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error('🔄 main.ts: 文件不存在:', filePath)
      return { success: false, error: '文件不存在' }
    }
    
    // 检查文件大小，避免读取过大的文件
    const stats = fs.statSync(filePath)
    const fileSizeMB = stats.size / (1024 * 1024)
    
    console.log('🔄 main.ts: 文件信息:', {
      path: filePath,
      size: `${fileSizeMB.toFixed(2)}MB`,
      exists: true
    })
    
    if (fileSizeMB > 10) {
      console.warn('🔄 main.ts: 文件过大，可能影响性能:', fileSizeMB + 'MB')
    }
    
    // 使用异步读取防止阻塞主进程
    const data = await fs.promises.readFile(filePath, 'utf8')
    
    console.log('🔄 main.ts: 文件读取成功:', {
      contentLength: data.length,
      preview: data.substring(0, 100) + '...'
    })
    
    return { success: true, data: data }
  } catch (error) {
    console.error('🔄 main.ts: 文件读取失败:', error)
    
    // 提供更详细的错误信息
    let errorMessage = (error as Error).message
    if ((error as any).code === 'ENOENT') {
      errorMessage = '文件不存在或无法访问'
    } else if ((error as any).code === 'EACCES') {
      errorMessage = '没有权限访问文件'
    } else if ((error as any).code === 'EISDIR') {
      errorMessage = '指定的路径是一个目录而不是文件'
    } else if ((error as any).code === 'EMFILE') {
      errorMessage = '系统打开的文件数量过多'
    }
    
    return { success: false, error: errorMessage }
  }
})

ipcMain.handle('write-file', async (event, filePath: string, content: string) => {
  try {
    const fs = await import('fs')
    fs.writeFileSync(filePath, content, 'utf8')
    return { success: true }
  } catch (error) {
    console.error('Write file failed:', error)
    return { success: false, error: (error as Error).message }
  }
})

// 获取文件状态信息
ipcMain.handle('get-file-stats', async (event, filePath: string) => {
  try {
    const fs = await import('fs')
    const stats = fs.statSync(filePath)
    
    return {
      success: true,
      data: {
        exists: true,
        size: stats.size,
        modifiedTime: stats.mtime.getTime(),
        createdTime: stats.birthtime.getTime(),
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      }
    }
  } catch (error) {
    // 文件不存在或其他错误
    if ((error as any).code === 'ENOENT') {
      return {
        success: true,
        data: {
          exists: false,
          size: 0,
          modifiedTime: 0,
          createdTime: 0,
          isFile: false,
          isDirectory: false
        }
      }
    }
    
    console.error('Get file stats failed:', error)
    return { success: false, error: (error as Error).message }
  }
})

// 检查文件是否存在
ipcMain.handle('file-exists', async (event, filePath: string) => {
  try {
    const fs = await import('fs')
    return {
      success: true,
      data: fs.existsSync(filePath)
    }
  } catch (error) {
    console.error('File exists check failed:', error)
    return { success: false, error: (error as Error).message }
  }
})

// 在文件夹中打开指定文件
ipcMain.handle('open-in-folder', async (event, filePath: string) => {
  try {
    console.log('Electron: 请求在文件夹中打开文件:', filePath)
    
    // 检查文件是否存在
    const fs = require('fs')
    if (!fs.existsSync(filePath)) {
      console.error('文件不存在:', filePath)
      return {
        success: false,
        error: '文件不存在'
      }
    }
    
    // 使用shell.showItemInFolder在文件夹中显示文件
    shell.showItemInFolder(filePath)
    
    console.log('成功在文件夹中打开文件:', filePath)
    return {
      success: true,
      data: { filePath }
    }
  } catch (error) {
    console.error('在文件夹中打开文件时发生错误:', error)
    return {
      success: false,
      error: (error as Error).message
    }
  }
})

// 在默认浏览器中打开外部链接
ipcMain.handle('open-external-link', async (event, url: string) => {
  try {
    console.log('Electron: 请求在默认浏览器中打开链接:', url)
    
    // 验证URL格式
    if (!url || typeof url !== 'string') {
      return {
        success: false,
        error: '无效的URL'
      }
    }
    
    // 使用shell.openExternal在默认浏览器中打开链接
    await shell.openExternal(url)
    
    console.log('成功在默认浏览器中打开链接:', url)
    return {
      success: true,
      data: { url }
    }
  } catch (error) {
    console.error('在默认浏览器中打开链接时发生错误:', error)
    return {
      success: false,
      error: (error as Error).message
    }
  }
})