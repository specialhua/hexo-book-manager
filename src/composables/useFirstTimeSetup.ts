import { ref, Ref } from 'vue'
import { useMessage } from 'naive-ui'
import { storage } from '../utils/browserAPI'
import { versionSyncManager } from '../utils/versionSync'
import { loadDemoData } from '../utils/demoLoader'
import type { Book } from '../types'
import type { OriginalFileStructure } from '../utils/bookParser'
import { configAPI } from '../utils/configAPI'

export interface FileInfo {
  fileName: string
  filePath: string
}

export interface UseFirstTimeSetupOptions {
  onSetupCompleted?: (blogPath: string | null) => void
  onDataLoaded?: (books: Book[], currentFile: FileInfo | null) => void
}

export function useFirstTimeSetup(options: UseFirstTimeSetupOptions = {}) {
  const message = useMessage()
  const showFirstTimeSetup = ref(false)
  const loading = ref(false)

  // 检查是否为首次使用
  const checkIfFirstTimeUser = async () => {
    // 检查是否为重置状态
    const isReset = configAPI.isResetState()
    if (isReset) {
      console.log('检测到重置状态，强制显示首次设置界面')
      showFirstTimeSetup.value = true
      // 清除重置标记，避免重复触发
      configAPI.clearResetFlag()
      return
    }
    
    const appState = await configAPI.getAppState()
    const hasSeenSetup = appState?.hasSeenFirstTimeSetup || false
    const permanentlySkipped = appState?.permanentlySkippedSetup || false
    const blogConfig = await versionSyncManager.getBlogConfig()
    
    // 如果永久跳过了，不再显示设置界面
    if (permanentlySkipped) {
      return
    }
    
    // 只要没有见过设置或者没有博客配置，就显示设置界面
    if (!hasSeenSetup || !blogConfig) {
      showFirstTimeSetup.value = true
    }
  }

  // 处理首次设置完成
  const handleFirstTimeSetupCompleted = async (
    blogPath: string | null,
    setVersionStatus: (status: any, lockDuration?: number) => void,
    forceSetVersionStatus: (status: any) => void,
    blogConfigState: Ref<any>
  ): Promise<{
    books: Book[]
    currentFile: FileInfo | null
    originalFileOrder: Book[]
    originalFileStructure: OriginalFileStructure | null
  }> => {
    try {
      // 立即保存设置标记
      const appState = await configAPI.getAppState() || { hasSeenFirstTimeSetup: false, permanentlySkippedSetup: false, lastUsedVersion: '1.0.7' }
      appState.hasSeenFirstTimeSetup = true
      await configAPI.saveAppState(appState)
      
      if (blogPath) {
        // 确保博客路径设置完成
        await versionSyncManager.setBlogPath(blogPath)
        
        // 立即更新响应式的博客配置状态
        blogConfigState.value = await versionSyncManager.getBlogConfig()
        
        // 验证保存结果
        const savedConfig = await versionSyncManager.getBlogConfig()
        const savedSetup = appState.hasSeenFirstTimeSetup
        
        // 显示加载状态
        loading.value = true
        
        try {
          // 直接从博客文件同步数据到缓存，而不是加载示例数据
          const syncedBooks = await versionSyncManager.syncFromBlog()
          
          if (syncedBooks && syncedBooks.length > 0) {
            // 设置当前文件信息
            const currentFile = {
              fileName: blogPath.split('/').pop() || 'index.md',
              filePath: blogPath
            }
            
            // 重要：保存所有数据到configAPI
            await configAPI.saveBooksData({
              books: syncedBooks,
              originalFileOrder: syncedBooks,
              originalFileStructure: null,
              currentFile: currentFile
            })
            
            // 设置为已同步状态 - 锁定状态5秒
            setVersionStatus('synced', 5000)
            
            message.success(`设置完成！成功加载 ${syncedBooks.length} 本书籍`)
            
            // 触发数据加载回调
            options.onDataLoaded?.(syncedBooks, currentFile)
            
            return {
              books: syncedBooks,
              currentFile,
              originalFileOrder: syncedBooks,
              originalFileStructure: null
            }
          } else {
            // 博客文件为空，询问用户是否使用示例数据
            const useExample = window.confirm(
              '博客文件中没有找到书籍数据。\n\n' +
              '点击"确定"使用示例数据开始体验，\n' +
              '点击"取消"保持空白状态。'
            )
            
            if (useExample) {
              // 加载示例数据
              const demoResult = await loadDemoData()
              const sampleBooks = demoResult.books
              const originalFileStructure = demoResult.originalFileStructure
              
              // 保存示例数据到configAPI
              await configAPI.saveBooksData({
                books: sampleBooks,
                originalFileOrder: sampleBooks,
                originalFileStructure: originalFileStructure,
                currentFile: null // 使用示例数据时，不设置currentFile
              })
              
              setVersionStatus('conflict', 3000) // 因为缓存有示例数据，博客文件为空，锁定3秒
              message.info('已加载示例数据，您可以开始添加书籍')
              
              // 触发数据加载回调
              options.onDataLoaded?.(sampleBooks, null)
              
              return {
                books: sampleBooks,
                currentFile: null,
                originalFileOrder: sampleBooks, // 使用示例数据作为原始排序
                originalFileStructure
              }
            } else {
              // 保持空白状态
              const currentFile = {
                fileName: blogPath.split('/').pop() || 'index.md',
                filePath: blogPath
              }
              
              // 保存到configAPI
              await configAPI.saveBooksData({
                books: [],
                originalFileOrder: [],
                originalFileStructure: null,
                currentFile: currentFile
              })
              
              setVersionStatus('synced', 3000) // 都是空的，算作同步，锁定3秒
              message.info('设置完成，您可以开始添加书籍')
              
              // 触发数据加载回调
              options.onDataLoaded?.([], currentFile)
              
              return {
                books: [],
                currentFile,
                originalFileOrder: [],
                originalFileStructure: null
              }
            }
          }
        } catch (syncError) {
          console.error('从博客文件同步失败:', syncError)
          
          // 同步失败，询问用户是否使用示例数据
          const errorMessage = syncError instanceof Error ? syncError.message : '未知错误'
          const useExample = window.confirm(
            `从博客文件加载数据失败：${errorMessage}\n\n` +
            '点击"确定"使用示例数据开始体验，\n' +
            '点击"取消"重新设置博客路径。'
          )
          
          if (useExample) {
            // 使用示例数据
            const demoResult = await loadDemoData()
            const sampleBooks = demoResult.books
            const originalFileStructure = demoResult.originalFileStructure
            
            // 保存示例数据到configAPI
            await configAPI.saveBooksData({
              books: sampleBooks,
              originalFileOrder: sampleBooks,
              originalFileStructure: originalFileStructure,
              currentFile: null
            })
            
            setVersionStatus('unknown')
            message.info('已加载示例数据，建议重新设置博客路径')
            
            // 触发数据加载回调
            options.onDataLoaded?.(sampleBooks, null)
            
            return {
              books: sampleBooks,
              currentFile: null,
              originalFileOrder: sampleBooks, // 使用示例数据作为原始排序
              originalFileStructure
            }
          } else {
            // 用户选择重新设置，清除配置
            await versionSyncManager.clearBlogConfig()
            blogConfigState.value = null // 更新响应式状态
            appState.hasSeenFirstTimeSetup = false
            await configAPI.saveAppState(appState)
            
            setVersionStatus('unknown')
            
            message.error('请重新设置博客路径')
            
            // 重新显示首次设置对话框
            setTimeout(() => {
              showFirstTimeSetup.value = true
            }, 500)
            
            return {
              books: [],
              currentFile: null,
              originalFileOrder: [],
              originalFileStructure: null
            }
          }
        } finally {
          loading.value = false
        }
      } else {
        // 用户跳过设置，使用示例数据
        const demoResult = await loadDemoData()
        const sampleBooks = demoResult.books
        const originalFileStructure = demoResult.originalFileStructure
        
        // 保存到configAPI
        await configAPI.saveBooksData({
          books: sampleBooks,
          originalFileOrder: sampleBooks,
          originalFileStructure: originalFileStructure,
          currentFile: null
        })
        
        setVersionStatus('unknown')
        message.info('使用示例数据，您可以通过"从文件加载"来导入现有书单')
        
        // 触发数据加载回调
        options.onDataLoaded?.(sampleBooks, null)
        
        return {
          books: sampleBooks,
          currentFile: null,
          originalFileOrder: sampleBooks,
          originalFileStructure
        }
      }
    } catch (error) {
      console.error('首次设置完成处理失败:', error)
      loading.value = false
      
      // 发生错误时的处理
      if (blogPath) {
        const errorMessage = error instanceof Error ? error.message : '未知错误'
        message.error('设置失败：' + errorMessage)
        setVersionStatus('unknown')
      } else {
        // 跳过设置时出错，加载示例数据
        try {
          const demoResult = await loadDemoData()
          const sampleBooks = demoResult.books
          const originalFileStructure = demoResult.originalFileStructure
          
          // 保存到configAPI
          await configAPI.saveBooksData({
            books: sampleBooks,
            originalFileOrder: sampleBooks,
            originalFileStructure: originalFileStructure,
            currentFile: null
          })
          
          setVersionStatus('unknown')
          message.info('使用示例数据，您可以通过"从文件加载"来导入现有书单')
          
          // 触发数据加载回调
          options.onDataLoaded?.(sampleBooks, null)
          
          return {
            books: sampleBooks,
            currentFile: null,
            originalFileOrder: sampleBooks,
            originalFileStructure
          }
        } catch (demoError) {
          console.error('加载示例数据也失败了:', demoError)
          message.error('加载示例数据失败，请手动导入数据文件')
          
          return {
            books: [],
            currentFile: null,
            originalFileOrder: [],
            originalFileStructure: null
          }
        }
      }
      
      // 确保返回默认值
      return {
        books: [],
        currentFile: null,
        originalFileOrder: [],
        originalFileStructure: null
      }
    }
  }

  return {
    showFirstTimeSetup,
    loading,
    checkIfFirstTimeUser,
    handleFirstTimeSetupCompleted
  }
}