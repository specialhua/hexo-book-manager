import { ref, computed, Ref } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { versionSyncManager, type VersionCompareResult } from '../utils/versionSync'
import { storage } from '../utils/browserAPI'
import type { Book } from '../types'

export interface UseVersionCheckOptions {
  onVersionStatusChange?: (status: VersionStatus) => void
  onConflictResolved?: (success: boolean) => void
}

export type VersionStatus = 'synced' | 'conflict' | 'checking' | 'unknown'

export function useVersionCheck(options: UseVersionCheckOptions = {}) {
  const message = useMessage()
  const dialog = useDialog()
  
  // 版本检查状态
  const versionStatus = ref<VersionStatus>('unknown')
  const checkingVersions = ref(false)
  const versionConflictData = ref<VersionCompareResult | null>(null)
  const showVersionConflict = ref(false)
  
  // 版本状态锁定机制
  const versionStatusLocked = ref(false)
  const versionStatusLockTimeout = ref<NodeJS.Timeout | null>(null)
  
  // 博客配置状态
  const blogConfigState = ref(versionSyncManager.getBlogConfig())
  
  // 计算是否配置了博客
  const hasBlogConfig = computed(() => {
    return blogConfigState.value && blogConfigState.value.blogPath
  })
  
  // 计算版本状态显示
  const versionStatusDisplay = computed(() => {
    if (!hasBlogConfig.value) {
      return { text: '未配置', type: 'default' as const }
    }
    
    switch (versionStatus.value) {
      case 'synced':
        return { text: '已同步', type: 'success' as const }
      case 'conflict':
        return { text: '有冲突', type: 'warning' as const }
      case 'checking':
        return { text: '检查中', type: 'info' as const }
      case 'unknown':
      default:
        return { text: '未知', type: 'default' as const }
    }
  })
  
  // 安全地设置版本状态（带锁定机制）
  const setVersionStatus = (status: VersionStatus, lockDuration?: number) => {
    // 如果状态被锁定，只允许手动操作覆盖
    if (versionStatusLocked.value) {
      return
    }
    
    versionStatus.value = status
    
    // 如果指定了锁定时间，锁定状态
    if (lockDuration) {
      versionStatusLocked.value = true
      
      // 清除之前的超时
      if (versionStatusLockTimeout.value) {
        clearTimeout(versionStatusLockTimeout.value)
      }
      
      // 设置新的超时
      versionStatusLockTimeout.value = setTimeout(() => {
        versionStatusLocked.value = false
        versionStatusLockTimeout.value = null
      }, lockDuration)
    }
    
    // 触发回调
    options.onVersionStatusChange?.(status)
  }
  
  // 强制设置版本状态（忽略锁定）
  const forceSetVersionStatus = (status: VersionStatus) => {
    // 清除锁定
    if (versionStatusLockTimeout.value) {
      clearTimeout(versionStatusLockTimeout.value)
      versionStatusLockTimeout.value = null
    }
    versionStatusLocked.value = false
    
    versionStatus.value = status
    
    // 触发回调
    options.onVersionStatusChange?.(status)
  }
  
  // 检查版本（自动）
  const checkVersions = async () => {
    const blogConfig = versionSyncManager.getBlogConfig()
    if (!blogConfig) {
      return
    }
    
    // 只有开启了自动版本检查才执行自动检查
    if (!blogConfig.autoVersionCheck) {
      return
    }
    
    // 如果状态被锁定，跳过自动检查
    if (versionStatusLocked.value) {
      return
    }
    
    setVersionStatus('checking')
    
    try {
      const compareResult = await versionSyncManager.compareVersions()
      
      if (compareResult) {
        if (compareResult.hasConflict) {
          setVersionStatus('conflict')
          versionConflictData.value = compareResult
          // 自动检查时不自动弹出对话框，等待用户手动点击
          // showVersionConflict.value = true
        } else {
          setVersionStatus('synced')
        }
      } else {
        setVersionStatus('unknown')
      }
    } catch (error) {
      console.error('版本检查失败:', error)
      setVersionStatus('unknown')
    }
  }
  
  // 手动检查版本
  const manualCheckVersions = async () => {
    const blogConfig = versionSyncManager.getBlogConfig()
    if (!blogConfig) {
      message.warning('请先在设置中配置博客文件路径')
      return
    }
    
    // 防止重复调用
    if (checkingVersions.value) {
      message.info('版本检查正在进行中，请稍候...')
      return
    }
    
    // 设置状态为检查中
    checkingVersions.value = true
    forceSetVersionStatus('checking')
    
    // 创建一个保险机制，确保状态在合理时间内被重置
    const safetyTimeout = setTimeout(() => {
      console.error('版本检查超时，强制重置状态')
      checkingVersions.value = false
      forceSetVersionStatus('unknown')
      message.error('版本检查超时，请稍后重试')
    }, 15000) // 15秒超时保护
    
    try {
      const compareResult = await versionSyncManager.compareVersions()
      
      // 清除超时保护
      clearTimeout(safetyTimeout)
      
      if (compareResult) {
        if (compareResult.hasConflict) {
          forceSetVersionStatus('conflict')
          versionConflictData.value = compareResult
          
          // 延迟显示冲突对话框，确保状态已更新
          await new Promise(resolve => setTimeout(resolve, 100))
          
          try {
            showVersionConflict.value = true
            message.info('检测到版本冲突，请选择处理方式')
          } catch (dialogError) {
            console.error('显示版本冲突对话框失败:', dialogError)
            message.error('无法显示版本冲突对话框，请检查系统配置')
            forceSetVersionStatus('unknown')
          }
        } else {
          forceSetVersionStatus('synced')
          message.success('版本检查完成，缓存与博客文件已同步')
        }
      } else {
        forceSetVersionStatus('unknown')
        message.warning('版本检查失败，请检查博客文件路径')
      }
    } catch (error) {
      // 清除超时保护
      clearTimeout(safetyTimeout)
      
      console.error('版本检查失败:', error)
      forceSetVersionStatus('unknown')
      
      // 简化错误处理
      if (error instanceof Error) {
        if (error.message.includes('超时')) {
          message.error('版本检查超时：可能文件正被其他程序占用，请稍后重试')
        } else if (error.message.includes('不存在')) {
          message.error('版本检查失败：博客文件不存在，请检查路径')
        } else if (error.message.includes('权限')) {
          message.error('版本检查失败：没有访问文件的权限')
        } else {
          message.error(`版本检查失败：${error.message}`)
        }
      } else {
        message.error('版本检查失败：未知错误')
      }
    } finally {
      // 确保状态被重置
      checkingVersions.value = false
    }
  }
  
  // 处理版本冲突解决
  const handleVersionConflictResolved = async (success: boolean) => {
    if (success) {
      // 更新版本状态为已同步
      forceSetVersionStatus('synced')
      
      // 冲突解决成功后，需要同步版本标识
      const blogConfig = versionSyncManager.getBlogConfig()
      if (blogConfig) {
        const currentCacheVersion = versionSyncManager.getCurrentCacheVersion()
        const newConfig = {
          ...blogConfig,
          cacheVersion: currentCacheVersion,
          lastSyncTime: Date.now()
        }
        versionSyncManager.setBlogConfig(newConfig)
      }
      
      message.success('版本冲突已解决，数据已同步')
    } else {
      // 冲突解决失败，保持冲突状态
      forceSetVersionStatus('conflict')
      message.error('冲突解决失败，请重试')
    }
    
    // 清理冲突数据
    versionConflictData.value = null
    showVersionConflict.value = false
    
    // 触发回调
    options.onConflictResolved?.(success)
  }
  
  // 回溯调整 - 使用博客文件的数据覆盖缓存
  const resetSortOrder = async (): Promise<Book[]> => {
    // 使用 Naive UI 对话框
    return new Promise((resolve) => {
      dialog.warning({
        title: '确认回溯调整',
        content: '此操作将使用博客文件中的数据和排序覆盖当前缓存，当前的修改将被丢弃。是否继续？',
        positiveText: '确认',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            const syncedBooks = await versionSyncManager.syncFromBlog()
            
            if (syncedBooks && syncedBooks.length > 0) {
              // 更新界面
              forceSetVersionStatus('synced')
              message.success(`回溯调整完成，已恢复 ${syncedBooks.length} 本书籍`)
              resolve(syncedBooks)
            } else {
              message.warning('博客文件中没有书籍数据')
              resolve([])
            }
          } catch (error) {
            console.error('回溯调整失败:', error)
            message.error('回溯调整失败：' + (error instanceof Error ? error.message : '未知错误'))
            resolve([])
          }
        },
        onNegativeClick: () => {
          resolve([])
        }
      })
    })
  }
  
  // 更新博客配置状态
  const updateBlogConfigState = () => {
    blogConfigState.value = versionSyncManager.getBlogConfig()
  }
  
  // 通知版本状态需要更新
  const notifyVersionStatusUpdate = () => {
    const blogConfig = versionSyncManager.getBlogConfig()
    if (blogConfig && blogConfig.blogPath) {
      setVersionStatus('conflict')
    }
  }
  
  return {
    // 状态
    versionStatus,
    checkingVersions,
    versionConflictData,
    showVersionConflict,
    versionStatusLocked,
    blogConfigState,
    hasBlogConfig,
    versionStatusDisplay,
    
    // 方法
    setVersionStatus,
    forceSetVersionStatus,
    checkVersions,
    manualCheckVersions,
    handleVersionConflictResolved,
    resetSortOrder,
    updateBlogConfigState,
    notifyVersionStatusUpdate,
    
    // 导出 versionSyncManager 以供直接访问
    versionSyncManager
  }
}