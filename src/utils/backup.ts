/**
 * 文件备份和恢复工具
 */

export interface BackupInfo {
  original_path: string
  backup_path: string
  timestamp: string
  size: number
  checksum?: string
}

/**
 * 创建文件备份
 * @param filePath 原文件路径
 * @param backupFolderPath 可选的备份文件夹路径
 * @param maxBackups 最大备份数量
 * @returns 备份信息
 */
export async function createBackup(filePath: string, backupFolderPath?: string, maxBackups: number = 10): Promise<BackupInfo> {
  try {
    // 在Electron环境中使用新的API
    if (window.electronAPI && window.electronAPI.createBackup) {
      console.log('使用Electron API创建备份:', filePath, backupFolderPath)
      const result = await window.electronAPI.createBackup(filePath, backupFolderPath)
      
      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error(result.error || '备份创建失败')
      }
    } else {
      // Web环境下的模拟实现
      console.log('Web环境下模拟创建备份:', filePath)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = `${filePath}.backup.${timestamp}`
      
      const backupInfo: BackupInfo = {
        original_path: filePath,
        backup_path: backupPath,
        timestamp: new Date().toISOString(),
        size: 1024, // 模拟文件大小
        checksum: generateChecksum(filePath)
      }
      
      await saveBackupInfo(backupInfo, maxBackups)
      return backupInfo
    }
  } catch (error) {
    throw new Error(`创建备份失败: ${error}`)
  }
}

/**
 * 恢复文件从备份
 * @param backupInfo 备份信息
 */
export async function restoreFromBackup(backupInfo: BackupInfo): Promise<void> {
  try {
    // 在Electron环境中使用文件系统API
    if (window.electronAPI && window.electronAPI.writeFile && window.electronAPI.readFile) {
      // 读取备份文件内容
      const backupResult = await window.electronAPI.readFile(backupInfo.backup_path)
      if (!backupResult.success) {
        throw new Error(backupResult.error || '读取备份文件失败')
      }
      
      // 恢复到原文件
      const restoreResult = await window.electronAPI.writeFile(
        backupInfo.original_path, 
        atob(backupResult.data || '') // base64解码
      )
      
      if (!restoreResult.success) {
        throw new Error(restoreResult.error || '恢复文件失败')
      }
      
      console.log('文件恢复成功:', backupInfo.original_path)
    } else {
      // Web环境下无法直接恢复文件
      console.warn('Web环境下无法自动恢复文件，请手动处理')
      throw new Error('Web环境下不支持自动文件恢复')
    }
  } catch (error) {
    throw new Error(`恢复备份失败: ${error}`)
  }
}

/**
 * 获取备份文件夹路径选择
 */
export async function selectBackupFolder(): Promise<string | null> {
  try {
    console.log('开始选择备份文件夹...')
    
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.selectBackupFolder) {
      console.log('调用 Electron API selectBackupFolder')
      const result = await window.electronAPI.selectBackupFolder()
      console.log('Electron API 返回结果:', result)
      
      if (result.success && result.data) {
        console.log('选择成功，路径:', result.data.folderPath)
        return result.data.folderPath
      } else {
        console.log('用户取消选择或选择失败:', result.error)
        return null
      }
    } else {
      // 检测实际环境
      console.log('当前环境检测:', {
        typeofWindow: typeof window,
        hasElectronAPI: typeof window !== 'undefined' && !!window.electronAPI,
        hasSelectBackupFolder: typeof window !== 'undefined' && !!window.electronAPI?.selectBackupFolder,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        isElectron: typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron'),
        windowKeys: typeof window !== 'undefined' ? Object.keys(window) : [],
        electronKeys: typeof window !== 'undefined' && window.electronAPI ? Object.keys(window.electronAPI) : []
      })
      
      // 检查全局变量
      if (typeof window !== 'undefined') {
        console.log('window.electronAPI:', window.electronAPI)
      }
      
      // 如果是Electron环境但API未暴露，可能是预加载问题
      if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron')) {
        console.error('在Electron环境中但未检测到electronAPI，可能是预加载脚本问题')
        
        // 强制检查是否有electronAPI
        if (window.electronAPI) {
          console.log('发现electronAPI:', window.electronAPI)
        } else {
          console.error('未找到electronAPI')
        }
        
        throw new Error('检测到Electron环境，但文件选择功能未正确加载。请重启应用或检查开发环境。')
      } else {
        console.warn('当前环境不支持文件夹选择')
        throw new Error('当前环境不支持文件夹选择功能，请在Electron环境中使用')
      }
    }
  } catch (error) {
    console.error('选择备份文件夹失败:', error)
    throw error
  }
}

/**
 * 生成简单的校验和
 * @param content 内容
 * @returns 校验和
 */
function generateChecksum(content: string): string {
  // 简单的哈希实现
  let hash = 0
  if (content.length === 0) return hash.toString()
  
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  
  return hash.toString()
}

/**
 * 保存备份信息到本地存储
 * @param backupInfo 备份信息
 * @param maxBackups 最大备份数量
 */
async function saveBackupInfo(backupInfo: BackupInfo, maxBackups: number = 10): Promise<void> {
  try {
    const backupKey = 'backup_history'
    const existingBackups: BackupInfo[] = JSON.parse(localStorage.getItem(backupKey) || '[]')
    
    // 添加新的备份信息
    existingBackups.push(backupInfo)
    
    // 按时间戳排序（最新的在前）
    existingBackups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    // 保持最大备份数量限制
    const limitedBackups = existingBackups.slice(0, maxBackups)
    
    localStorage.setItem(backupKey, JSON.stringify(limitedBackups))
    console.log(`备份信息已保存，当前保留 ${limitedBackups.length} 个备份记录`)
  } catch (error) {
    console.error('保存备份信息失败:', error)
  }
}

/**
 * 获取备份历史记录
 * @returns 备份信息列表
 */
export function getBackupHistory(): BackupInfo[] {
  try {
    const backupKey = 'backup_history'
    const backups = localStorage.getItem(backupKey)
    return backups ? JSON.parse(backups) : []
  } catch (error) {
    console.error('读取备份历史失败:', error)
    return []
  }
}

/**
 * 清理过期的备份信息和限制备份数量
 * @param maxBackups 最大备份数量
 */
export function limitBackupHistory(maxBackups: number = 10): void {
  try {
    const backupKey = 'backup_history'
    const existingBackups: BackupInfo[] = JSON.parse(localStorage.getItem(backupKey) || '[]')
    
    // 按时间戳排序（最新的在前）
    existingBackups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    // 保持最大备份数量限制
    const limitedBackups = existingBackups.slice(0, maxBackups)
    
    localStorage.setItem(backupKey, JSON.stringify(limitedBackups))
    console.log(`备份数量已限制为 ${limitedBackups.length} 个`)
  } catch (error) {
    console.error('限制备份数量失败:', error)
  }
}

/**
 * 获取应用设置中的最大备份数量
 */
export function getMaxBackupsFromSettings(): number {
  try {
    const appSettings = JSON.parse(localStorage.getItem('appSettings') || '{}')
    return appSettings.backup?.maxBackups || 10
  } catch (error) {
    console.error('获取最大备份数量设置失败:', error)
    return 10
  }
}