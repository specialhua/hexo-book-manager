import { ref, Ref } from 'vue'
import { useMessage } from 'naive-ui'
import { storage } from '../utils/browserAPI'
import { versionSyncManager } from '../utils/versionSync'
import { getSampleBooks } from '../config/sampleData'
import type { Book } from '../types'
import type { OriginalFileStructure } from '../utils/bookParser'

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
  const checkIfFirstTimeUser = () => {
    const hasSeenSetup = storage.load<boolean>('hasSeenFirstTimeSetup', false)
    const blogConfig = versionSyncManager.getBlogConfig()
    
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
      storage.save('hasSeenFirstTimeSetup', true)
      
      if (blogPath) {
        // 确保博客路径设置完成
        await versionSyncManager.setBlogPath(blogPath)
        
        // 立即更新响应式的博客配置状态
        blogConfigState.value = versionSyncManager.getBlogConfig()
        
        // 验证保存结果
        const savedConfig = versionSyncManager.getBlogConfig()
        const savedSetup = storage.load<boolean>('hasSeenFirstTimeSetup', false)
        
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
            
            // 重要：保存所有数据到localStorage
            storage.save('books', syncedBooks)
            storage.save('currentFile', currentFile)
            
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
              const sampleBooks = getSampleBooks()
              
              // 保存示例数据到缓存
              storage.save('books', sampleBooks)
              
              // 使用示例数据时，不设置currentFile（保持为null）
              // 这样提示框会正确显示"使用示例数据"而不是"博客目录"
              storage.save('currentFile', null)
              
              setVersionStatus('conflict', 3000) // 因为缓存有示例数据，博客文件为空，锁定3秒
              message.info('已加载示例数据，您可以开始添加书籍')
              
              // 触发数据加载回调
              options.onDataLoaded?.(sampleBooks, null)
              
              return {
                books: sampleBooks,
                currentFile: null,
                originalFileOrder: [],
                originalFileStructure: null
              }
            } else {
              // 保持空白状态
              const currentFile = {
                fileName: blogPath.split('/').pop() || 'index.md',
                filePath: blogPath
              }
              
              // 保存到localStorage
              storage.save('books', [])
              storage.save('currentFile', currentFile)
              
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
            const sampleBooks = getSampleBooks()
            
            // 保存示例数据到缓存
            storage.save('books', sampleBooks)
            
            setVersionStatus('unknown')
            message.info('已加载示例数据，建议重新设置博客路径')
            
            // 触发数据加载回调
            options.onDataLoaded?.(sampleBooks, null)
            
            return {
              books: sampleBooks,
              currentFile: null,
              originalFileOrder: [],
              originalFileStructure: null
            }
          } else {
            // 用户选择重新设置，清除配置
            versionSyncManager.clearBlogConfig()
            blogConfigState.value = null // 更新响应式状态
            storage.save('hasSeenFirstTimeSetup', false)
            
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
        const sampleBooks = getSampleBooks()
        
        // 保存到localStorage
        storage.save('books', sampleBooks)
        storage.save('originalFileOrder', [])
        storage.save('currentFile', null)
        
        setVersionStatus('unknown')
        message.info('使用示例数据，您可以通过"从文件加载"来导入现有书单')
        
        // 触发数据加载回调
        options.onDataLoaded?.(sampleBooks, null)
        
        return {
          books: sampleBooks,
          currentFile: null,
          originalFileOrder: [],
          originalFileStructure: null
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
        const sampleBooks = getSampleBooks()
        
        // 保存到localStorage
        storage.save('books', sampleBooks)
        storage.save('originalFileOrder', [])
        storage.save('currentFile', null)
        
        setVersionStatus('unknown')
        message.info('使用示例数据，您可以通过"从文件加载"来导入现有书单')
        
        // 触发数据加载回调
        options.onDataLoaded?.(sampleBooks, null)
        
        return {
          books: sampleBooks,
          currentFile: null,
          originalFileOrder: [],
          originalFileStructure: null
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