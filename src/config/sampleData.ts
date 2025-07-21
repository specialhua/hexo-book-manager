/**
 * 示例数据配置文件
 * 包含应用使用的示例书籍数据
 */

import type { Book } from '../types'

/**
 * 获取示例书籍数据
 * @returns 示例书籍数组
 */
export function getSampleBooks(): Book[] {
  return [
    {
      id: 'example-1',
      title: '我与地坛',
      author: '史铁生',
      isbn: '9787020073358',
      cover: 'https://s2.loli.net/2024/01/01/example123456.jpg', // sm.ms 示例图片链接
      douban_url: 'https://book.douban.com/subject/5910656/',
      description: '我喜欢听他探讨生死、和读他面对命运思考的文字',
      download_link: 'https://example.com/download/book1',
      extract_code: '1234',
      publish_date: '2011-01-01',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sort_order: 0
    }
  ]
}

/**
 * 获取单个示例书籍数据
 * @returns 单个示例书籍对象
 */
export function getSampleBook(): Book {
  return getSampleBooks()[0]
}

/**
 * 默认示例数据配置
 */
export const SAMPLE_DATA_CONFIG = {
  // 示例图床设置
  EXAMPLE_IMAGE_HOST: 'https://s2.loli.net', // sm.ms 图床域名
  
  // 示例下载链接设置
  EXAMPLE_DOWNLOAD_HOST: 'https://example.com',
  
  // 示例提取码
  DEFAULT_EXTRACT_CODE: '1234',
  
  // 示例书籍数量
  SAMPLE_BOOKS_COUNT: 1,
  
  // 是否在生产环境显示示例数据警告
  SHOW_SAMPLE_WARNING: true
} as const