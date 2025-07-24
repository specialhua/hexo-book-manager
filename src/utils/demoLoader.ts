/**
 * 示例数据加载工具
 * 统一从 demo_index.md 文件加载示例数据
 */

import { parseExistingBooks } from './bookParser'
import type { Book } from '../types'
import type { OriginalFileStructure } from './bookParser'

/**
 * demo_index.md 文件的内置内容（Web环境降级方案）
 */
const DEMO_CONTENT = `---
title: 书单
date: 2024-11-27 10:33:03
banner_img: https://your-banner-image.jpg
comment: true
---
<p class="note note-info">你可以随意写些什么...</p>

<div id="book">
    <div class="page">
        <ul class="content">
            <!-- 书籍我与地坛 -->
            <li>
                <div class="info">
                    <a href="https://book.douban.com/subject/5910656/" target="_blank" rel="noopener noreferrer" class="book-container">
                        <div class="book" title="我与地坛">
                            <img src="https://s2.loli.net/2024/01/01/example123456.jpg" alt="我与地坛">
                        </div>
                    </a>
                    <div class="info-card">
                        <div class="hidden-content">
                            <p class="text">我喜欢听他探讨生死、和读他面对命运思考的文字</p>
                        </div>
                        <h3>《我与地坛》</h3>
                        <p>作者：史铁生</p>
                        <p>出版时间：2011-01-01</p>
                        <p>
                            <a href="https://example.com/download/book1" target="_blank" rel="noopener noreferrer">📥 下载</a>
                        </p>
                        <p class="pwd-text">
                            提取码：1234
                        </p>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</div>

<script src="/js/book-pagination.js"></script>
`

export interface DemoLoadResult {
  books: Book[]
  originalFileStructure: OriginalFileStructure | null
}

/**
 * 加载示例数据
 * 优先从文件系统读取 demo_index.md，失败时使用内置内容
 * @returns 解析后的示例数据
 */
export async function loadDemoData(): Promise<DemoLoadResult> {
  let demoContent: string

  try {
    // 优先使用内置的示例内容，确保稳定性
    console.log('🎯 使用内置示例数据')
    demoContent = DEMO_CONTENT
    
    // 可选：在 Electron 环境中尝试读取更新的文件版本
    if (window.electronAPI && window.electronAPI.readFile) {
      try {
        // 尝试相对于应用程序根目录的路径
        const possiblePaths = [
          'src/config/demo_index.md',
          './src/config/demo_index.md',
          '../src/config/demo_index.md'
        ]
        
        for (const path of possiblePaths) {
          try {
            const result = await window.electronAPI.readFile(path)
            if (result.success && result.data) {
              demoContent = result.data
              console.log('✅ 成功从文件系统读取示例数据:', path)
              break
            }
          } catch (error) {
            // 忽略单个路径的错误，继续尝试下一个
            continue
          }
        }
      } catch (error) {
        console.log('📄 文件系统读取失败，使用内置内容:', error)
      }
    } else {
      console.log('🌐 Web环境或API不可用，使用内置示例数据')
    }
  } catch (error) {
    console.warn('⚠️ 加载示例数据时出错，使用内置内容:', error)
    demoContent = DEMO_CONTENT
  }

  try {
    // 使用统一的解析器解析示例数据
    console.log('🔍 开始解析示例数据...')
    const parseResult = parseExistingBooks(demoContent, [])
    
    if (!parseResult.books || parseResult.books.length === 0) {
      throw new Error('解析示例数据失败：未找到书籍信息')
    }

    // 为书籍分配排序
    const booksWithOrder = parseResult.books.map((book, index) => ({
      ...book,
      sort_order: index,
      // 确保示例数据有唯一ID
      id: book.id || `demo-${index + 1}`,
      // 添加时间戳
      created_at: book.created_at || new Date().toISOString(),
      updated_at: book.updated_at || new Date().toISOString()
    }))

    console.log(`✅ 成功解析示例数据，共 ${booksWithOrder.length} 本书籍`)
    
    return {
      books: booksWithOrder,
      originalFileStructure: parseResult.structure || null
    }
  } catch (error) {
    console.error('❌ 解析示例数据失败:', error)
    throw new Error(`解析示例数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 获取示例数据（兼容性方法）
 * @deprecated 请使用 loadDemoData() 获取完整的解析结果
 */
export async function getSampleBooks(): Promise<Book[]> {
  const result = await loadDemoData()
  return result.books
}