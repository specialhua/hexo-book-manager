/**
 * 版本同步工具类 - 管理缓存与博客文件的版本同步
 */

import { parseExistingBooks, type OriginalFileStructure, validateBookData } from './bookParser'
import { storage } from './browserAPI'
import type { Book } from '../types'

export interface BlogConfig {
  blogPath: string
  lastSyncTime: number
  cacheVersion: string
  autoVersionCheck?: boolean  // 可选字段，默认为true
}

export interface FileInfo {
  path: string
  modifiedTime: number
  size: number
  exists: boolean
}

export interface VersionCompareResult {
  hasConflict: boolean
  isConflict: boolean
  cacheNewer: boolean
  blogNewer: boolean
  cacheBooksCount: number
  blogBooksCount: number
  cacheModifiedTime: number
  blogModifiedTime: number
  // 新增：内容差异详情
  differences: ContentDifference[]
  conflictType: 'content' | 'none'
}

export interface ContentDifference {
  type: 'added' | 'removed' | 'modified' | 'reordered' | 'structure_changed' | 'validation_warning'
  field: string
  oldValue?: any
  newValue?: any
  bookId?: string
  bookTitle?: string
  description?: string // 用于描述结构变化
}

export interface ConflictResolution {
  action: 'use_cache' | 'use_blog' | 'manual_merge'
  createBackup: boolean
}

/**
 * 版本同步管理器
 */
export class VersionSyncManager {
  private static instance: VersionSyncManager
  
  private constructor() {}
  
  static getInstance(): VersionSyncManager {
    if (!VersionSyncManager.instance) {
      VersionSyncManager.instance = new VersionSyncManager()
    }
    return VersionSyncManager.instance
  }
  
  /**
   * 获取博客配置
   */
  getBlogConfig(): BlogConfig | null {
    return storage.load<BlogConfig>('blogConfig', null)
  }
  
  /**
   * 设置博客配置
   */
  setBlogConfig(config: BlogConfig): void {
    storage.save('blogConfig', config)
  }
  
  /**
   * 清除博客配置
   */
  clearBlogConfig(): void {
    storage.remove('blogConfig')
  }
  
  /**
   * 检查是否为初次启动
   */
  isFirstTimeUser(): boolean {
    const config = this.getBlogConfig()
    return !config || !config.blogPath
  }
  
  /**
   * 设置博客路径
   */
  async setBlogPath(path: string): Promise<void> {
    // 验证文件是否存在
    const fileInfo = await this.getFileInfo(path)
    if (!fileInfo.exists) {
      throw new Error('博客文件不存在')
    }
    
    // 生成基于当前缓存数据的版本标识
    const initialCacheVersion = this.generateCacheVersion()
    
    const config: BlogConfig = {
      blogPath: path,
      lastSyncTime: Date.now(),
      cacheVersion: initialCacheVersion,
      autoVersionCheck: true  // 默认启用自动版本检查
    }
    
    this.setBlogConfig(config)
  }
  
  /**
   * 获取文件信息
   */
  private async getFileInfo(path: string): Promise<FileInfo> {
    if (window.electronAPI && window.electronAPI.getFileStats) {
      try {
        const result = await window.electronAPI.getFileStats(path)
        if (result.success && result.data) {
          return {
            path,
            modifiedTime: result.data.modifiedTime,
            size: result.data.size,
            exists: true
          }
        }
      } catch (error) {
        console.error('获取文件信息失败:', error)
      }
    }
    
    // 降级方案：无法获取文件信息
    return {
      path,
      modifiedTime: 0,
      size: 0,
      exists: false
    }
  }
  
  /**
   * 读取博客文件内容
   */
  private async readBlogFile(path: string): Promise<string> {
    if (!window.electronAPI || !window.electronAPI.readFile) {
      throw new Error('electronAPI.readFile 不可用')
    }
    
    try {
      // 简化超时机制
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('读取文件超时(5秒)'))
        }, 5000) // 减少到5秒
      })
      
      // 创建读取Promise
      const readPromise = window.electronAPI.readFile(path).catch(error => {
        throw new Error(`文件读取API调用失败: ${error.message || error}`)
      })
      
      // 等待结果
      const result = await Promise.race([readPromise, timeoutPromise])
      
      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error(result.error || '读取文件失败')
      }
    } catch (error) {
      // 简化错误处理
      if (error instanceof Error) {
        if (error.message.includes('超时')) {
          throw new Error('文件读取超时，请检查文件是否被其他程序锁定')
        } else if (error.message.includes('不存在')) {
          throw new Error('博客文件不存在，请检查文件路径是否正确')
        } else if (error.message.includes('权限')) {
          throw new Error('没有权限访问博客文件')
        } else if (error.message.includes('不可用')) {
          throw new Error('文件系统API不可用，请确保在Electron环境中运行')
        } else {
          throw new Error(`文件读取失败: ${error.message}`)
        }
      } else {
        throw new Error('文件读取时发生未知错误')
      }
    }
  }
  
  /**
   * 标准化字段值，统一处理空值和格式
   * @param value 原始值
   * @param fieldName 字段名称
   * @returns 标准化后的值
   */
  private normalizeFieldValue(value: any, fieldName: string): string {
    if (value === null || value === undefined) {
      return ''
    }
    
    let normalized = String(value).trim()
    
    // 对特定字段进行特殊处理
    switch (fieldName) {
      case 'extract_code':
        // 提取码应该是纯字母数字，去除所有空格
        normalized = normalized.replace(/\s+/g, '')
        break
      case 'download_link':
      case 'douban_url': 
      case 'cover':
        // URL字段，空值统一处理
        if (normalized === '' || normalized === 'undefined' || normalized === 'null') {
          normalized = ''
        }
        break
    }
    
    return normalized
  }
  
  /**
   * 验证并清理书籍数据
   * @param books 书籍数组
   * @returns 清理后的书籍数组和警告信息
   */
  private validateAndCleanBooks(books: Book[]): { books: Book[], warnings: string[] } {
    const warnings: string[] = []
    const cleanedBooks: Book[] = []
    
    books.forEach((book, index) => {
      const validation = validateBookData(book)
      if (!validation.isValid) {
        warnings.push(`书籍 "${book.title}" (索引 ${index}): ${validation.warnings.join(', ')}`)
      }
      
      // 清理并标准化书籍数据
      const cleanedBook: Book = {
        ...book,
        title: this.normalizeFieldValue(book.title, 'title'),
        author: this.normalizeFieldValue(book.author, 'author'),
        description: this.normalizeFieldValue(book.description, 'description'),
        download_link: this.normalizeFieldValue(book.download_link, 'download_link'),
        extract_code: this.normalizeFieldValue(book.extract_code, 'extract_code'),
        cover: this.normalizeFieldValue(book.cover, 'cover'),
        douban_url: this.normalizeFieldValue(book.douban_url, 'douban_url'),
        publish_date: this.normalizeFieldValue(book.publish_date, 'publish_date'),
        isbn: this.normalizeFieldValue(book.isbn, 'isbn')
      }
      
      cleanedBooks.push(cleanedBook)
    })
    
    return { books: cleanedBooks, warnings }
  }

  /**
   * 智能匹配书籍 - 处理ID不一致的情况
   */
  private findMatchingBook(targetBook: Book, bookList: Book[]): Book | null {
    // 1. 首先尝试ID匹配
    const idMatch = bookList.find(book => book.id === targetBook.id)
    if (idMatch) {
      return idMatch
    }
    
    // 2. 使用标题+作者匹配
    const titleAuthorMatch = bookList.find(book => 
      book.title === targetBook.title && book.author === targetBook.author
    )
    if (titleAuthorMatch) {
      return titleAuthorMatch
    }
    
    // 3. 使用豆瓣URL匹配（如果都有的话）
    if (targetBook.douban_url && targetBook.douban_url.trim()) {
      const doubanMatch = bookList.find(book => 
        book.douban_url === targetBook.douban_url
      )
      if (doubanMatch) {
        return doubanMatch
      }
    }
    
    // 4. 模糊匹配标题（处理标题可能有细微差异的情况）
    const fuzzyTitleMatch = bookList.find(book => {
      const targetTitle = targetBook.title.replace(/[《》「」『』]/g, '').trim()
      const bookTitle = book.title.replace(/[《》「」『』]/g, '').trim()
      return targetTitle === bookTitle && book.author === targetBook.author
    })
    if (fuzzyTitleMatch) {
      return fuzzyTitleMatch
    }
    
    return null
  }

  /**
   * 比较两个书籍数组的内容差异
   */
  private compareBookContents(cacheBooks: Book[], blogBooks: Book[]): ContentDifference[] {
    const differences: ContentDifference[] = []
    
    // 先进行数据验证和清理
    const cleanedCacheResult = this.validateAndCleanBooks(cacheBooks)
    const cleanedBlogResult = this.validateAndCleanBooks(blogBooks)
    
    // 如果有验证警告，记录到差异中
    if (cleanedCacheResult.warnings.length > 0) {
      differences.push({
        type: 'validation_warning',
        field: 'cache_data',
        oldValue: '',
        newValue: cleanedCacheResult.warnings.join('; '),
        description: '缓存数据验证警告：' + cleanedCacheResult.warnings.join('; ')
      })
    }
    
    if (cleanedBlogResult.warnings.length > 0) {
      differences.push({
        type: 'validation_warning',
        field: 'blog_data',
        oldValue: '',
        newValue: cleanedBlogResult.warnings.join('; '),
        description: '博客数据验证警告：' + cleanedBlogResult.warnings.join('; ')
      })
    }
    
    // 使用清理后的数据进行比较
    const cleanedCacheBooks = cleanedCacheResult.books
    const cleanedBlogBooks = cleanedBlogResult.books
    
    // 1. 比较书籍数量
    if (cleanedCacheBooks.length !== cleanedBlogBooks.length) {
      differences.push({
        type: cleanedCacheBooks.length > cleanedBlogBooks.length ? 'added' : 'removed',
        field: 'book_count',
        oldValue: cleanedBlogBooks.length,
        newValue: cleanedCacheBooks.length,
        description: `书籍数量变化：${cleanedBlogBooks.length} → ${cleanedCacheBooks.length}`
      })
    }
    
    // 2. 检查新增的书籍
    cleanedCacheBooks.forEach(cacheBook => {
      const blogBook = this.findMatchingBook(cacheBook, cleanedBlogBooks)
      if (!blogBook) {
        differences.push({
          type: 'added',
          field: 'book',
          newValue: cacheBook,
          bookId: cacheBook.id,
          bookTitle: cacheBook.title,
          description: `新增书籍：${cacheBook.title}`
        })
      }
    })
    
    // 3. 检查删除的书籍
    cleanedBlogBooks.forEach(blogBook => {
      const cacheBook = this.findMatchingBook(blogBook, cleanedCacheBooks)
      if (!cacheBook) {
        differences.push({
          type: 'removed',
          field: 'book',
          oldValue: blogBook,
          bookId: blogBook.id,
          bookTitle: blogBook.title,
          description: `删除书籍：${blogBook.title}`
        })
      }
    })
    
    // 4. 检查修改的书籍
    cleanedCacheBooks.forEach(cacheBook => {
      const blogBook = this.findMatchingBook(cacheBook, cleanedBlogBooks)
      if (blogBook) {
        // 比较关键字段 - 只比较MD文件中实际存储的字段
        const fieldsToCompare = ['title', 'author', 'description', 'download_link', 'extract_code', 'cover', 'douban_url', 'publish_date']
        
        fieldsToCompare.forEach(field => {
          const cacheValue = cacheBook[field as keyof Book]
          const blogValue = blogBook[field as keyof Book]
          
          // 改进的空值处理和标准化
          const normalizedCacheValue = this.normalizeFieldValue(cacheValue, field)
          const normalizedBlogValue = this.normalizeFieldValue(blogValue, field)
          
          if (normalizedCacheValue !== normalizedBlogValue) {
            differences.push({
              type: 'modified',
              field,
              oldValue: normalizedBlogValue,
              newValue: normalizedCacheValue,
              bookId: cacheBook.id,
              bookTitle: cacheBook.title,
              description: `${cacheBook.title} 的 ${field} 被修改`
            })
          }
        })
      }
    })
    
    // 5. 检查排序变化 - 使用智能匹配
    if (cleanedCacheBooks.length === cleanedBlogBooks.length && cleanedCacheBooks.length > 0) {
      let orderChanged = false
      
      for (let i = 0; i < cleanedCacheBooks.length; i++) {
        const cacheBook = cleanedCacheBooks[i]
        const blogBook = cleanedBlogBooks[i]
        
        // 使用智能匹配判断是否为同一本书
        const isSameBook = this.findMatchingBook(cacheBook, [blogBook]) !== null
        
        if (!isSameBook) {
          orderChanged = true
          break
        }
      }
      
      if (orderChanged) {
        differences.push({
          type: 'reordered',
          field: 'book_order',
          oldValue: blogBooks.map(b => ({ id: b.id, title: b.title })),
          newValue: cacheBooks.map(b => ({ id: b.id, title: b.title })),
          description: '书籍排序发生变化'
        })
      }
    }
    
    return differences
  }

  /**
   * 比较文件结构差异（头部和尾部）
   */
  private compareFileStructure(cacheStructure: OriginalFileStructure | null, blogStructure: OriginalFileStructure | null): ContentDifference[] {
    const differences: ContentDifference[] = []
    
    // 如果缓存中没有结构信息，跳过比较
    if (!cacheStructure || !blogStructure) {
      return differences
    }
    
    // 比较头部内容（Hexo标签、用户自定义语言等）
    if (cacheStructure.header !== blogStructure.header) {
      differences.push({
        type: 'structure_changed',
        field: 'header',
        oldValue: blogStructure.header,
        newValue: cacheStructure.header,
        description: '文件头部内容发生变化（可能包含Hexo标签、语言设置等）'
      })
    }
    
    // 比较尾部内容（JS脚本、CSS样式等）
    if (cacheStructure.footer !== blogStructure.footer) {
      differences.push({
        type: 'structure_changed',
        field: 'footer',
        oldValue: blogStructure.footer,
        newValue: cacheStructure.footer,
        description: '文件尾部内容发生变化（可能包含JS脚本、CSS样式等）'
      })
    }
    
    // 比较自定义内容标识
    if (cacheStructure.hasCustomContent !== blogStructure.hasCustomContent) {
      differences.push({
        type: 'structure_changed',
        field: 'custom_content',
        oldValue: blogStructure.hasCustomContent,
        newValue: cacheStructure.hasCustomContent,
        description: cacheStructure.hasCustomContent ? '新增自定义内容（JS/CSS）' : '移除自定义内容（JS/CSS）'
      })
    }
    
    return differences
  }

  /**
   * 综合比较所有内容差异
   */
  private compareAllContent(cacheBooks: Book[], blogBooks: Book[], cacheStructure: OriginalFileStructure | null, blogStructure: OriginalFileStructure | null): ContentDifference[] {
    const bookDifferences = this.compareBookContents(cacheBooks, blogBooks)
    const structureDifferences = this.compareFileStructure(cacheStructure, blogStructure)
    
    return [...bookDifferences, ...structureDifferences]
  }
  
  /**
   * 比较版本 - 基于内容而非时间
   */
  async compareVersions(): Promise<VersionCompareResult | null> {
    const config = this.getBlogConfig()
    if (!config) {
      return null
    }
    
    try {
      // 获取博客文件信息
      const blogFileInfo = await this.getFileInfo(config.blogPath)
      if (!blogFileInfo.exists) {
        return null
      }
      
      // 获取缓存数据
      const cacheBooks = storage.load<Book[]>('books', []) || []
      const cacheStructure = storage.load<OriginalFileStructure>('originalFileStructure', null)
      
      // 生成当前缓存的版本标识
      const currentCacheVersion = this.generateCacheVersion()
      console.log('🔍 当前缓存版本标识:', currentCacheVersion)
      console.log('🔍 配置中的版本标识:', config.cacheVersion)
      
      // 读取博客文件内容
      let blogContent: string
      try {
        blogContent = await this.readBlogFile(config.blogPath)
      } catch (error) {
        throw new Error(`无法读取博客文件: ${error instanceof Error ? error.message : String(error)}`)
      }
      
      if (!blogContent || blogContent.trim().length === 0) {
        return null
      }
      
      // 解析博客文件
      let blogParseResult: any
      try {
        blogParseResult = parseExistingBooks(blogContent, cacheBooks)
      } catch (error) {
        throw new Error(`博客文件解析失败: ${error instanceof Error ? error.message : String(error)}`)
      }
      
      const blogBooks = blogParseResult.books || []
      const blogStructure = blogParseResult.structure || null
      
      // 验证解析结果
      const parseValidation = this.validateParseResult(blogBooks, blogContent)
      if (!parseValidation.isValid) {
        console.warn('博客文件解析结果可能不完整:', parseValidation.warnings)
      }
      
      // 首先进行版本标识比较
      const blogBooksSorted = blogBooks.map((book: any, index: number) => ({
        ...book,
        sort_order: index
      }))
      
      // 直接计算博客数据的版本标识，不需要临时保存到 localStorage
      const blogVersionIdentifier = this.generateVersionIdentifier(blogBooksSorted, blogStructure)
      
      console.log('🔍 博客内容对应的版本标识:', blogVersionIdentifier)
      
      // 如果版本标识相同，说明内容一致，无需冲突
      if (currentCacheVersion === blogVersionIdentifier) {
        console.log('✅ 版本标识匹配，无冲突')
        return {
          hasConflict: false,
          isConflict: false,
          cacheNewer: false,
          blogNewer: false,
          cacheBooksCount: cacheBooks.length,
          blogBooksCount: blogBooks.length,
          cacheModifiedTime: Date.now(),
          blogModifiedTime: blogFileInfo.modifiedTime,
          differences: [],
          conflictType: 'none'
        }
      }
      
      // 版本标识不同，进行详细的内容比较
      console.log('🔍 检测到版本差异，进行详细比较')
      
      // 比较内容差异
      const differences = this.compareAllContent(cacheBooks, blogBooks, cacheStructure, blogStructure)
      const hasConflict = differences.length > 0
      
      console.log('🔍 差异数量:', differences.length)
      
      // 构建比较结果
      const result: VersionCompareResult = {
        hasConflict,
        isConflict: hasConflict,
        cacheNewer: true,
        blogNewer: false,
        cacheBooksCount: cacheBooks.length,
        blogBooksCount: blogBooks.length,
        cacheModifiedTime: Date.now(),
        blogModifiedTime: blogFileInfo.modifiedTime,
        differences,
        conflictType: hasConflict ? 'content' : 'none'
      }
      
      return result
      
    } catch (error) {
      console.error('版本比较失败:', error)
      throw error
    }
  }
  
  /**
   * 验证解析结果的有效性
   */
  private validateParseResult(books: Book[], originalContent: string): { isValid: boolean, warnings: string[] } {
    const warnings: string[] = []
    
    // 检查是否解析出了书籍
    if (books.length === 0) {
      warnings.push('未解析出任何书籍')
    }
    
    // 检查原始内容是否包含书籍相关信息
    const hasBookIndicators = /《.*?》|作者：|出版时间：|下载|douban\.com/g.test(originalContent)
    if (hasBookIndicators && books.length === 0) {
      warnings.push('原始内容包含书籍信息，但解析结果为空')
    }
    
    // 检查书籍信息完整性
    const incompleteBooks = books.filter(book => !book.title || !book.author)
    if (incompleteBooks.length > 0) {
      warnings.push(`${incompleteBooks.length}本书籍信息不完整`)
    }
    
    return {
      isValid: warnings.length === 0,
      warnings
    }
  }
  
  /**
   * 解决冲突
   */
  async resolveConflict(resolution: ConflictResolution): Promise<boolean> {
    const config = this.getBlogConfig()
    if (!config) {
      return false
    }
    
    try {
      if (resolution.action === 'use_blog') {
        // 使用博客文件版本
        const blogBooks = await this.syncFromBlog()
        return blogBooks.length > 0
      } else if (resolution.action === 'use_cache') {
        // 使用缓存版本，同步到博客文件
        return await this.syncToBlob(resolution.createBackup)
      } else {
        // 手动合并 - 暂时不实现
        throw new Error('手动合并功能暂未实现')
      }
    } catch (error) {
      console.error('解决冲突失败:', error)
      return false
    }
  }
  
  /**
   * 从博客文件同步到缓存
   */
  async syncFromBlog(): Promise<Book[]> {
    const config = this.getBlogConfig()
    if (!config) {
      throw new Error('博客配置不存在')
    }
    
    try {
      // 获取博客文件信息
      const blogFileInfo = await this.getFileInfo(config.blogPath)
      if (!blogFileInfo.exists) {
        throw new Error('博客文件不存在')
      }
      
      // 读取博客文件
      const blogContent = await this.readBlogFile(config.blogPath)
      
      if (!blogContent || blogContent.trim().length === 0) {
        throw new Error('博客文件内容为空')
      }
      
      // 解析博客文件
      const currentBooks = storage.load<Book[]>('books', [])
      const parseResult = parseExistingBooks(blogContent, currentBooks || [])
      
      if (!parseResult.books || parseResult.books.length === 0) {
        // 验证文件是否包含书籍信息
        const hasBookInfo = /《.*?》|作者：|出版时间：|下载|douban\.com/g.test(blogContent)
        if (hasBookInfo) {
          throw new Error('博客文件包含书籍信息但解析失败，请检查文件格式')
        } else {
          // 返回空数组，但不抛出错误
          return []
        }
      }
      
      // 为书籍分配排序
      const booksWithOrder = parseResult.books.map((book, index) => ({
        ...book,
        sort_order: index
      }))
      
      // 创建备份（保存当前缓存）
      const existingBooks = storage.load<Book[]>('books', [])
      if (existingBooks && existingBooks.length > 0) {
        const backupKey = `books_backup_${Date.now()}`
        storage.save(backupKey, existingBooks)
      }
      
      // 更新缓存
      storage.save('books', booksWithOrder)
      storage.save('originalFileOrder', booksWithOrder)
      storage.save('originalFileStructure', parseResult.structure)
      storage.save('currentFile', {
        fileName: config.blogPath.split('/').pop() || 'index.md',
        filePath: config.blogPath
      })
      
      // 在同步后生成版本标识，确保它反映更新后的缓存数据
      const updatedCacheVersion = this.generateCacheVersion()
      console.log('📤 从博客同步后的缓存版本标识:', updatedCacheVersion)
      
      // 更新博客配置
      const newConfig: BlogConfig = {
        ...config,
        lastSyncTime: Date.now(),
        cacheVersion: updatedCacheVersion
      }
      this.setBlogConfig(newConfig)
      
      return booksWithOrder
      
    } catch (error) {
      console.error('从博客同步失败:', error)
      throw error
    }
  }
  
  /**
   * 从缓存同步到博客文件
   */
  async syncToBlob(createBackup: boolean = true): Promise<boolean> {
    const config = this.getBlogConfig()
    if (!config) {
      console.error('📤 博客配置不存在')
      return false
    }
    
    // 在同步前生成版本标识，确保它反映当前缓存数据
    const currentCacheVersion = this.generateCacheVersion()
    console.log('📤 当前缓存版本标识:', currentCacheVersion)
    
    // 开始从缓存同步到博客文件
    
    try {
      // 创建备份
      if (createBackup && window.electronAPI && window.electronAPI.createBackup) {
        // 创建博客文件备份
        
        // 从应用设置获取备份文件夹路径
        let backupFolderPath: string | undefined
        let maxBackups = 10 // 默认值
        
        try {
          const savedSettings = localStorage.getItem('appSettings')
          if (savedSettings) {
            const settings = JSON.parse(savedSettings)
            backupFolderPath = settings.backup?.folderPath
            maxBackups = settings.backup?.maxBackups || 10
          }
        } catch (error) {
          console.warn('📤 获取备份设置失败:', error)
        }
        
        try {
          const backupResult = await window.electronAPI.createBackup(
            config.blogPath,
            backupFolderPath,
            maxBackups
          )
          
          if (!backupResult.success) {
            console.warn('📤 创建备份失败:', backupResult.error)
            // 备份失败不应该阻止后续操作，只是发出警告
            if (backupResult.error?.includes('路径')) {
              console.warn('📤 备份路径无效，请检查备份文件夹设置')
            } else if (backupResult.error?.includes('权限')) {
              console.warn('📤 备份权限不足，请检查文件夹权限')
            }
          } else {
            console.log('📤 备份创建成功:', backupResult.data?.backupPath || '未知路径')
          }
        } catch (backupError) {
          console.error('📤 备份创建过程出错:', backupError)
          // 备份失败不应该阻止后续操作
        }
      }
      
      // 获取缓存数据
      const cacheBooks = storage.load<Book[]>('books', []) || []
      const originalFileStructure = storage.load<OriginalFileStructure>('originalFileStructure', null)
      
      // 详细记录文件结构信息
      if (originalFileStructure) {
        // 验证文件结构数据的完整性
        const isValidStructure = this.validateFileStructure(originalFileStructure)
        
        if (!isValidStructure.isValid) {
          console.warn('📤 警告：文件结构数据验证失败:', isValidStructure.errors)
        }
      }
      
      if (cacheBooks.length === 0) {
        console.warn('📤 缓存中没有书籍数据')
        return false
      }
      
      // 生成HTML内容
      const { generateIndexMd } = await import('./bookParser')
      const htmlContent = generateIndexMd(cacheBooks, originalFileStructure || undefined)
      
      if (!htmlContent || htmlContent.trim().length === 0) {
        console.error('📤 生成的HTML内容为空')
        return false
      }
      
      // 如果有原始结构，验证生成的内容是否使用了正确的结构
      if (originalFileStructure) {
        const headerMatch = htmlContent.startsWith(originalFileStructure.header.substring(0, 100))
        const footerMatch = htmlContent.endsWith(originalFileStructure.footer.substring(-100))
        
        if (!headerMatch || !footerMatch) {
          console.warn('📤 警告：生成的HTML内容可能没有正确使用原始文件结构')
        }
      }
      
      // 写入博客文件
      if (window.electronAPI && window.electronAPI.writeFile) {
        console.log('📤 开始写入博客文件:', config.blogPath)
        
        try {
          const writeResult = await window.electronAPI.writeFile(config.blogPath, htmlContent)
          
          if (writeResult.success) {
            console.log('📤 博客文件写入成功')
            
            // 验证写入结果 - 读取文件确认内容
            try {
              const verifyResult = await window.electronAPI.readFile(config.blogPath)
              if (verifyResult.success && verifyResult.data) {
                const writtenContent = verifyResult.data
                
                if (writtenContent === htmlContent) {
                  console.log('📤 写入内容验证成功')
                } else {
                  console.warn('📤 警告：写入的内容与预期不符，但文件已更新')
                  console.log('📤 预期长度:', htmlContent.length, '实际长度:', writtenContent.length)
                }
              } else {
                console.warn('📤 无法验证写入结果，但写入操作报告成功:', verifyResult.error)
              }
            } catch (verifyError) {
              console.warn('📤 写入验证失败，但写入操作报告成功:', verifyError)
            }
            
            // 更新博客配置
            const newConfig: BlogConfig = {
              ...config,
              lastSyncTime: Date.now(),
              cacheVersion: currentCacheVersion
            }
            this.setBlogConfig(newConfig)
            
            console.log('📤 博客配置更新成功')
            return true
          } else {
            const errorMsg = writeResult.error || '未知写入错误'
            console.error('📤 博客文件写入失败:', errorMsg)
            
            // 提供更详细的错误信息
            if (errorMsg.includes('ENOENT') || errorMsg.includes('路径')) {
              console.error('📤 错误原因：文件路径不存在或无效')
              throw new Error(`文件路径无效: ${config.blogPath}`)
            } else if (errorMsg.includes('EACCES') || errorMsg.includes('权限')) {
              console.error('📤 错误原因：文件权限不足')
              throw new Error(`文件权限不足，无法写入: ${config.blogPath}`)
            } else if (errorMsg.includes('ENOSPC') || errorMsg.includes('空间')) {
              console.error('📤 错误原因：磁盘空间不足')
              throw new Error('磁盘空间不足，无法写入文件')
            } else if (errorMsg.includes('EMFILE') || errorMsg.includes('文件句柄')) {
              console.error('📤 错误原因：文件句柄不足')
              throw new Error('系统文件句柄不足，请稍后重试')
            } else {
              console.error('📤 错误原因：未知错误')
              throw new Error(`文件写入失败: ${errorMsg}`)
            }
          }
        } catch (writeError) {
          console.error('📤 写入过程出现异常:', writeError)
          throw writeError
        }
      } else {
        const errorMsg = 'Electron API不可用，无法写入文件'
        console.error('📤', errorMsg)
        throw new Error(errorMsg)
      }
      
    } catch (error) {
      console.error('📤 同步到博客失败:', error)
      
      // 提供更详细的错误分类和处理建议
      if (error instanceof Error) {
        const errorMsg = error.message
        
        if (errorMsg.includes('路径') || errorMsg.includes('ENOENT')) {
          console.error('📤 错误类型：文件路径问题')
          console.error('📤 解决建议：请检查博客文件路径是否正确，文件是否存在')
        } else if (errorMsg.includes('权限') || errorMsg.includes('EACCES')) {
          console.error('📤 错误类型：文件权限问题')
          console.error('📤 解决建议：请检查文件权限，确保应用有写入权限')
        } else if (errorMsg.includes('空间') || errorMsg.includes('ENOSPC')) {
          console.error('📤 错误类型：磁盘空间问题')
          console.error('📤 解决建议：请清理磁盘空间后重试')
        } else if (errorMsg.includes('API') || errorMsg.includes('Electron')) {
          console.error('📤 错误类型：系统API问题')
          console.error('📤 解决建议：请确保在Electron环境中运行，或重启应用')
        } else if (errorMsg.includes('备份')) {
          console.error('📤 错误类型：备份创建问题')
          console.error('📤 解决建议：请检查备份文件夹设置，或禁用备份功能')
        } else if (errorMsg.includes('验证')) {
          console.error('📤 错误类型：文件结构验证问题')
          console.error('📤 解决建议：请检查原始文件结构是否完整')
        } else {
          console.error('📤 错误类型：未知错误')
          console.error('📤 解决建议：请查看详细错误信息并重试')
        }
        
        console.error('📤 详细错误信息:', errorMsg)
      } else {
        console.error('📤 发生未知类型的错误:', error)
      }
      
      return false
    }
  }
  
  /**
   * 验证文件结构数据的完整性
   */
  private validateFileStructure(structure: OriginalFileStructure): { isValid: boolean, errors: string[] } {
    const errors: string[] = []
    
    // 检查必需字段
    if (!structure.header || typeof structure.header !== 'string') {
      errors.push('header 字段缺失或不是字符串')
    }
    
    if (!structure.footer || typeof structure.footer !== 'string') {
      errors.push('footer 字段缺失或不是字符串')
    }
    
    if (typeof structure.hasCustomContent !== 'boolean') {
      errors.push('hasCustomContent 字段缺失或不是布尔值')
    }
    
    // 检查内容合理性
    if (structure.header && structure.header.length === 0) {
      errors.push('header 内容为空')
    }
    
    if (structure.footer && structure.footer.length === 0) {
      errors.push('footer 内容为空')
    }
    
    // 检查头部是否包含基本的HTML结构
    if (structure.header && !structure.header.includes('<ul class="content">')) {
      errors.push('header 中缺少 <ul class="content"> 标签')
    }
    
    // 检查尾部是否包含基本的HTML结构
    if (structure.footer && !structure.footer.includes('</ul>')) {
      errors.push('footer 中缺少 </ul> 标签')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  /**
   * 手动同步
   */
  async manualSync(): Promise<boolean> {
    const compareResult = await this.compareVersions()
    if (!compareResult) {
      return false
    }
    
    if (!compareResult.hasConflict) {
      return true // 没有内容冲突，无需同步
    }
    
    // 默认使用缓存版本同步到博客
    return await this.syncToBlob(true)
  }
  
  /**
   * 生成版本标识
   * 基于指定的数据内容生成，确保相同内容产生相同的版本标识
   */
  private generateVersionIdentifier(books?: Book[], structure?: OriginalFileStructure | null): string {
    // 如果没有传入参数，使用当前缓存数据
    const targetBooks = books || (storage.load<Book[]>('books', []) || [])
    const targetStructure = structure !== undefined ? structure : storage.load<OriginalFileStructure>('originalFileStructure', null)
    
    // 创建内容摘要字符串
    const contentSummary = {
      books: targetBooks.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        description: book.description,
        download_link: book.download_link,
        extract_code: book.extract_code,
        sort_order: book.sort_order
      })),
      hasCustomContent: targetStructure?.hasCustomContent || false,
      bookCount: targetBooks.length
    }
    
    // 将内容转换为JSON字符串并生成简单的哈希值
    const contentString = JSON.stringify(contentSummary)
    let hash = 0
    for (let i = 0; i < contentString.length; i++) {
      const char = contentString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    
    // 生成基于内容的版本标识
    return `v${Math.abs(hash)}-${contentSummary.bookCount}`
  }
  
  /**
   * 生成缓存版本标识
   * 基于当前缓存数据内容生成，确保相同内容产生相同的版本标识
   */
  private generateCacheVersion(): string {
    return this.generateVersionIdentifier()
  }
  
  /**
   * 获取当前缓存版本标识
   */
  getCurrentCacheVersion(): string {
    return this.generateCacheVersion()
  }
  
  /**
   * 检测数据一致性和恢复
   */
  async detectDataLoss(): Promise<{
    hasDataLoss: boolean
    recoveryOptions: string[]
    backupBooks: Book[]
  }> {
    // 数据一致性检测
    const currentBooks = storage.load<Book[]>('books', [])
    const backupKeys = storage.getAllKeys().filter(key => key.startsWith('books_backup_'))
    
    // 如果没有当前数据但有备份数据，可能发生了数据丢失
    if ((currentBooks?.length || 0) === 0 && backupKeys.length > 0) {
      // 找到最新的备份
      const latestBackupKey = backupKeys.sort().pop()
      if (latestBackupKey) {
        const backupBooks = storage.load<Book[]>(latestBackupKey, [])
        if (backupBooks && backupBooks.length > 0) {
          return {
            hasDataLoss: true,
            recoveryOptions: ['restore_from_backup', 'ignore'],
            backupBooks: backupBooks || []
          }
        }
      }
    }
    
    return {
      hasDataLoss: false,
      recoveryOptions: [],
      backupBooks: []
    }
  }
  
  /**
   * 恢复数据
   */
  async recoverData(option: 'restore_from_backup' | 'ignore'): Promise<boolean> {
    if (option === 'restore_from_backup') {
      const backupKeys = storage.getAllKeys().filter(key => key.startsWith('books_backup_'))
      if (backupKeys.length === 0) {
        return false
      }
      
      const latestBackupKey = backupKeys.sort().pop()
      if (!latestBackupKey) {
        return false
      }
      
      const backupBooks = storage.load<Book[]>(latestBackupKey, [])
      if (!backupBooks || backupBooks.length === 0) {
        return false
      }
      
      // 恢复数据
      const success = storage.save('books', backupBooks)
      if (success) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * 格式化时间
   */
  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString('zh-CN')
  }
}

// 导出单例实例
export const versionSyncManager = VersionSyncManager.getInstance()