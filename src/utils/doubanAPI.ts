import type { DoubanBookInfo, BookSearchResult, Book, IsbnBookInfo, IsbnApiResponse, IsbnApiConfig } from '../types'

// ISBN API配置
const ISBN_API_CONFIG = {
  baseUrl: 'http://data.isbn.work/openApi',
  timeout: 10000
}

/**
 * 验证 ISBN 格式
 * @param isbn ISBN号
 * @returns 是否有效
 */
function validateISBN(isbn: string): boolean {
  const cleanISBN = isbn.replace(/[-\s]/g, '')
  
  // ISBN-10: 10位数字，最后一位可以是X
  const isbn10Regex = /^[0-9]{9}[0-9X]$/i
  // ISBN-13: 13位数字
  const isbn13Regex = /^[0-9]{13}$/
  
  return isbn10Regex.test(cleanISBN) || isbn13Regex.test(cleanISBN)
}

/**
 * 通过ISBN获取书籍信息（商业API）
 * @param isbn ISBN号
 * @param apiConfig ISBN API配置
 * @returns 书籍信息
 */
export async function getBookByISBN(isbn: string, apiConfig: IsbnApiConfig): Promise<DoubanBookInfo | null> {
  try {
    // 验证API配置
    if (!apiConfig.apiKey || apiConfig.apiKey.trim() === '') {
      throw new Error('请先在设置中配置ISBN API Key，或使用手动录入功能')
    }

    // 清理ISBN格式
    const cleanISBN = isbn.replace(/[-\s]/g, '')
    
    if (!cleanISBN || cleanISBN.length < 10) {
      throw new Error('ISBN格式错误：长度不足')
    }
    
    if (!validateISBN(cleanISBN)) {
      throw new Error('ISBN格式错误：请输入有效的10位或13位ISBN')
    }

    console.log(`正在查询ISBN: ${cleanISBN}`)
    
    // 调用商业ISBN API
    const url = `${ISBN_API_CONFIG.baseUrl}/getInfoByIsbn?isbn=${cleanISBN}&appKey=${apiConfig.apiKey}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), ISBN_API_CONFIG.timeout)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('API调用频率过高，请稍后再试')
      } else if (response.status === 401) {
        throw new Error('API密钥无效或已过期')
      } else if (response.status >= 500) {
        throw new Error('API服务器暂时不可用，请稍后再试')
      } else {
        throw new Error(`网络请求失败 (${response.status}): ${response.statusText}`)
      }
    }
    
    const apiResponse: IsbnApiResponse = await response.json()
    
    if (apiResponse.code === 0 && apiResponse.success && apiResponse.data) {
      // 转换ISBN API数据为DoubanBookInfo格式
      return convertIsbnToDoubanFormat(apiResponse.data)
    } else {
      // 根据不同的错误代码提供更友好的错误信息
      let errorMessage = 'ISBN查询失败'
      if (apiResponse.code === 1001) {
        errorMessage = '找不到该ISBN对应的书籍信息'
      } else if (apiResponse.code === 1002) {
        errorMessage = 'API调用次数已用完，请联系管理员'
      } else if (apiResponse.code === 1003) {
        errorMessage = 'ISBN格式错误'
      } else if (apiResponse.code !== 0) {
        errorMessage = `查询失败 (错误代码: ${apiResponse.code})`
      }
      
      console.warn(`ISBN API返回错误: code=${apiResponse.code}, message=${errorMessage}`)
      throw new Error(errorMessage)
    }
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('ISBN查询超时')
      throw new Error('查询超时，请重试')
    }
    console.error('获取书籍信息失败:', error)
    throw new Error(`获取书籍信息失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 将ISBN API数据转换为DoubanBookInfo格式
 * @param isbnBook ISBN API返回的书籍信息
 * @returns DoubanBookInfo格式的数据
 */
function convertIsbnToDoubanFormat(isbnBook: IsbnBookInfo): DoubanBookInfo {
  // 解析pictures JSON字符串
  let pictureUrls: string[] = []
  try {
    pictureUrls = JSON.parse(isbnBook.pictures)
  } catch (error) {
    console.warn('解析图片URL失败:', error)
    pictureUrls = []
  }
  
  const coverUrl = pictureUrls.length > 0 ? pictureUrls[0] : ''
  
  return {
    title: isbnBook.bookName,
    author: [isbnBook.author], // ISBN API返回的是字符串，转为数组
    isbn13: isbnBook.isbn,
    isbn10: '', // ISBN API不区分ISBN10/13
    images: {
      small: coverUrl,
      medium: coverUrl,
      large: coverUrl
    },
    url: '', // ISBN API不提供豆瓣链接
    summary: isbnBook.bookDesc || '',
    pubdate: isbnBook.pressDate || '',
    rating: {
      average: 0, // ISBN API不提供评分
      numRaters: 0
    },
    tags: [] // ISBN API不提供标签
  }
}

/**
 * 将API返回的数据转换为应用内的书籍格式
 * @param apiBook API返回的书籍信息
 * @returns 应用内书籍格式
 */
export function convertApiBookToBook(apiBook: DoubanBookInfo): Partial<Book> {
  return {
    title: apiBook.title,
    author: Array.isArray(apiBook.author) ? apiBook.author.join(', ') : apiBook.author,
    isbn: apiBook.isbn13 || apiBook.isbn10 || '',
    cover: apiBook.images.large || apiBook.images.medium || apiBook.images.small,
    douban_url: apiBook.url || '',
    description: apiBook.summary ? (apiBook.summary.length > 200 ? 
      apiBook.summary.slice(0, 200) + '...' : apiBook.summary) : '',
    publish_date: apiBook.pubdate || '',
    download_link: '',
    extract_code: ''
  }
}

// 保持向后兼容性
export const convertDoubanBookToBook = convertApiBookToBook