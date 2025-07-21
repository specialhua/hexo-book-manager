import type { Book } from '../types'

/**
 * 验证URL格式
 * @param url 待验证的URL
 * @returns 是否为有效的URL
 */
export function isValidUrl(url: string): boolean {
  if (typeof url !== 'string') {
    return false
  }
  
  // 空字符串被认为是有效的（允许空值）
  if (url.trim() === '') {
    return true
  }
  
  // 检查是否为有效的URL格式
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * 验证提取码格式
 * @param extractCode 待验证的提取码
 * @returns 是否为有效的提取码
 */
export function isValidExtractCode(extractCode: string): boolean {
  if (!extractCode || typeof extractCode !== 'string') {
    return false
  }
  
  // 空字符串被认为是有效的（允许空值）
  if (extractCode.trim() === '') {
    return true
  }
  
  // 提取码通常是4-8位字母数字组合
  const extractCodePattern = /^[a-zA-Z0-9]{1,8}$/
  return extractCodePattern.test(extractCode.trim())
}

/**
 * 验证书籍数据完整性
 * @param book 书籍数据
 * @returns 验证结果
 */
export function validateBookData(book: Book): { isValid: boolean, warnings: string[] } {
  const warnings: string[] = []
  
  // 检查必需字段
  if (!book.title || book.title.trim() === '') {
    warnings.push('书名不能为空')
  }
  
  if (!book.author || book.author.trim() === '') {
    warnings.push('作者不能为空')
  }
  
  // 检查URL格式
  if (book.download_link && !isValidUrl(book.download_link)) {
    warnings.push('下载链接格式不正确')
  }
  
  if (book.douban_url && !isValidUrl(book.douban_url)) {
    warnings.push('豆瓣链接格式不正确')
  }
  
  if (book.cover && !isValidUrl(book.cover)) {
    warnings.push('封面链接格式不正确')
  }
  
  // 检查提取码格式
  if (book.extract_code && !isValidExtractCode(book.extract_code)) {
    warnings.push('提取码格式不正确')
  }
  
  return {
    isValid: warnings.length === 0,
    warnings
  }
}

/**
 * 原始文件结构信息
 */
export interface OriginalFileStructure {
  header: string  // 从文件开头到 <ul class="content"> 
  footer: string  // 从 </ul> 到文件结尾
  hasCustomContent: boolean  // 是否包含自定义内容（JS/CSS等）
}

/**
 * 解析现有的 index.md 文件，提取书籍信息和原始文件结构
 * @param content index.md 文件内容
 * @param existingBooks 现有的书籍数据，用于ID匹配
 * @returns 包含书籍列表和原始文件结构的对象
 */
export function parseExistingBooks(content: string, existingBooks?: Book[]): { books: Book[], structure: OriginalFileStructure } {
  console.log('📖 开始解析博客文件...')
  console.log('📖 文件内容长度:', content.length)
  console.log('📖 文件内容预览:', content.substring(0, 300) + '...')
  
  const books: Book[] = []
  
  // 尝试多种解析策略
  const parseResult = tryMultipleParseStrategies(content, existingBooks)
  
  console.log('📖 解析结果:', {
    booksCount: parseResult.books.length,
    hasStructure: !!parseResult.structure,
    structureHeader: parseResult.structure?.header ? parseResult.structure.header.length : 0,
    structureFooter: parseResult.structure?.footer ? parseResult.structure.footer.length : 0,
    hasCustomContent: parseResult.structure?.hasCustomContent,
    books: parseResult.books.map(b => ({ title: b.title, author: b.author }))
  })
  
  return parseResult
}

/**
 * 尝试多种解析策略
 * @param content 文件内容
 * @param existingBooks 现有的书籍数据，用于ID匹配
 * @returns 解析结果
 */
function tryMultipleParseStrategies(content: string, existingBooks?: Book[]): { books: Book[], structure: OriginalFileStructure } {
  // 策略1：标准格式解析
  const standardResult = parseStandardFormat(content, existingBooks)
  if (standardResult.books.length > 0) {
    console.log('📖 使用标准格式解析成功，找到', standardResult.books.length, '本书')
    return standardResult
  }
  
  // 策略2：宽松格式解析
  const relaxedResult = parseRelaxedFormat(content, existingBooks)
  if (relaxedResult.books.length > 0) {
    console.log('📖 使用宽松格式解析成功，找到', relaxedResult.books.length, '本书')
    return relaxedResult
  }
  
  // 策略3：通用HTML解析
  const genericResult = parseGenericHtml(content, existingBooks)
  if (genericResult.books.length > 0) {
    console.log('📖 使用通用HTML解析成功，找到', genericResult.books.length, '本书')
    return genericResult
  }
  
  // 所有策略都失败，返回空结果但保留文件结构
  console.warn('📖 所有解析策略都失败，返回空结果')
  return {
    books: [],
    structure: extractFileStructure(content)
  }
}

/**
 * 标准格式解析（原有逻辑）
 */
function parseStandardFormat(content: string, existingBooks?: Book[]): { books: Book[], structure: OriginalFileStructure } {
  const books: Book[] = []
  
  console.log('📖 标准格式解析：开始查找 <ul class="content"> 结构')
  console.log('📖 标准格式解析：文件内容包含 <ul class="content"> ?', content.includes('<ul class="content">'))
  console.log('📖 标准格式解析：文件内容包含 </ul> ?', content.includes('</ul>'))
  
  // 查找书籍列表的开始和结束位置
  const contentStart = content.indexOf('<ul class="content">')
  const contentEnd = content.indexOf('</ul>', contentStart)
  
  console.log('📖 标准格式解析：contentStart =', contentStart, 'contentEnd =', contentEnd)
  
  if (contentStart === -1 || contentEnd === -1) {
    console.log('📖 标准格式解析失败：未找到 <ul class="content"> 结构')
    return {
      books: [],
      structure: extractFileStructure(content)
    }
  }
  
  console.log('📖 标准格式解析：找到书籍列表结构')
  
  // 提取头部（从开头到 <ul class="content"> 之后）
  const headerEnd = content.indexOf('>', contentStart) + 1
  const header = content.substring(0, headerEnd)
  
  // 提取脚部（从 </ul> 到文件结尾）
  const footer = content.substring(contentEnd)
  
  // 检查是否包含自定义内容（JS/CSS）
  const hasCustomContent = footer.includes('<script') || footer.includes('<style') || footer.includes('</script>') || footer.includes('</style>')
  
  // 提取书籍列表内容
  const bookListContent = content.substring(headerEnd, contentEnd)
  
  console.log('📖 标准格式解析：书籍列表内容长度 =', bookListContent.length)
  console.log('📖 标准格式解析：书籍列表内容预览 =', bookListContent.substring(0, 200) + '...')
  
  // 使用正则表达式匹配每个书籍的 <li> 块
  const bookRegex = /<li>\s*<div class="info">([\s\S]*?)<\/div>\s*<\/div>\s*<\/li>/g
  
  let match
  while ((match = bookRegex.exec(bookListContent)) !== null) {
    console.log('📖 标准格式解析：找到书籍匹配，长度 =', match[1].length)
    const bookHtml = match[1]
    const book = parseBookFromHtml(bookHtml, existingBooks)
    if (book) {
      books.push(book)
    }
  }
  
  console.log('📖 标准格式解析：共解析出', books.length, '本书')
  
  return {
    books,
    structure: {
      header,
      footer,
      hasCustomContent
    }
  }
}

/**
 * 宽松格式解析 - 支持更多变种格式
 */
function parseRelaxedFormat(content: string, existingBooks?: Book[]): { books: Book[], structure: OriginalFileStructure } {
  const books: Book[] = []
  
  // 尝试查找任何ul标签
  const ulMatches = content.match(/<ul[^>]*class=[^>]*content[^>]*>[\s\S]*?<\/ul>/gi)
  if (!ulMatches || ulMatches.length === 0) {
    console.log('📖 宽松格式解析失败：未找到包含content类的ul标签')
    return {
      books: [],
      structure: extractFileStructure(content)
    }
  }
  
  const ulContent = ulMatches[0]
  const ulStart = content.indexOf(ulContent)
  const ulEnd = ulStart + ulContent.length
  
  // 提取头部和脚部
  const header = content.substring(0, ulStart + ulContent.indexOf('>') + 1)
  const footer = content.substring(ulEnd - 5) // 从</ul>开始
  
  // 检查自定义内容
  const hasCustomContent = footer.includes('<script') || footer.includes('<style') || footer.includes('</script>') || footer.includes('</style>')
  
  // 更宽松的书籍匹配模式
  const bookPatterns = [
    // 标准模式
    /<li>\s*<div class="info">([\s\S]*?)<\/div>\s*<\/div>\s*<\/li>/g,
    // 宽松模式1：允许不同的嵌套结构
    /<li[^>]*>([\s\S]*?)<\/li>/g,
    // 宽松模式2：查找包含书籍信息的div
    /<div[^>]*class=[^>]*info[^>]*>([\s\S]*?)<\/div>/g
  ]
  
  for (const pattern of bookPatterns) {
    let match
    while ((match = pattern.exec(ulContent)) !== null) {
      const bookHtml = match[1]
      const book = parseBookFromHtml(bookHtml, existingBooks)
      if (book && book.title) {
        books.push(book)
      }
    }
    
    if (books.length > 0) {
      console.log('📖 宽松格式解析成功，使用模式', pattern.source)
      break
    }
  }
  
  return {
    books,
    structure: {
      header,
      footer,
      hasCustomContent
    }
  }
}

/**
 * 通用HTML解析 - 尝试从任何HTML结构中提取书籍信息
 */
function parseGenericHtml(content: string, existingBooks?: Book[]): { books: Book[], structure: OriginalFileStructure } {
  const books: Book[] = []
  
  // 查找所有可能包含书籍信息的元素
  const patterns = [
    // 查找包含豆瓣链接的元素
    /<[^>]*href=[^>]*douban\.com[^>]*>[\s\S]*?<\/[^>]*>/g,
    // 查找包含书籍标题的元素
    /<[^>]*title=[^>]*>[\s\S]*?<\/[^>]*>/g,
    // 查找任何li元素
    /<li[^>]*>[\s\S]*?<\/li>/g,
    // 查找任何div元素（可能包含书籍信息）
    /<div[^>]*>[\s\S]*?<\/div>/g
  ]
  
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      const elementHtml = match[0]
      
      // 检查这个元素是否包含书籍相关信息
      if (containsBookInfo(elementHtml)) {
        const book = parseBookFromHtml(elementHtml, existingBooks)
        if (book && book.title) {
          // 避免重复
          if (!books.find(b => b.title === book.title && b.author === book.author)) {
            books.push(book)
          }
        }
      }
    }
    
    if (books.length > 0) {
      console.log('📖 通用HTML解析成功，使用模式', pattern.source)
      break
    }
  }
  
  return {
    books,
    structure: extractFileStructure(content)
  }
}

/**
 * 检查HTML片段是否包含书籍信息
 */
function containsBookInfo(html: string): boolean {
  const indicators = [
    /douban\.com/,
    /作者：/,
    /出版时间：/,
    /提取码：/,
    /下载/,
    /《.*?》/,
    /title=.*?书.*?"/
  ]
  
  return indicators.some(indicator => indicator.test(html))
}

/**
 * 提取文件结构（头部和脚部）
 */
function extractFileStructure(content: string): OriginalFileStructure {
  // 尝试找到任何书籍列表的开始和结束
  const listStart = content.search(/<(ul|ol|div)[^>]*>/i)
  const listEnd = content.lastIndexOf('</')
  
  if (listStart === -1 || listEnd === -1) {
    // 如果找不到列表结构，使用默认结构
    return {
      header: getDefaultHeader(),
      footer: getDefaultFooter(),
      hasCustomContent: content.includes('<script') || content.includes('<style')
    }
  }
  
  const header = content.substring(0, listStart)
  const footer = content.substring(listEnd)
  const hasCustomContent = footer.includes('<script') || footer.includes('<style') || footer.includes('</script>') || footer.includes('</style>')
  
  return {
    header: header || getDefaultHeader(),
    footer: footer || getDefaultFooter(),
    hasCustomContent
  }
}

/**
 * 从单个书籍的 HTML 块中提取书籍信息
 * @param bookHtml 单个书籍的HTML内容
 * @param existingBooks 现有的书籍数据，用于ID匹配
 * @returns 书籍对象
 */
function parseBookFromHtml(bookHtml: string, existingBooks?: Book[]): Book | null {
  try {
    console.log('📖 解析书籍HTML片段:', bookHtml.substring(0, 200) + '...')
    
    // 使用多种策略尝试提取书籍信息
    const extractedInfo = extractBookInfo(bookHtml)
    
    // 如果没有提取到标题，跳过这个书籍
    if (!extractedInfo.title) {
      console.log('📖 跳过：未找到书籍标题')
      return null
    }
    
    // 智能匹配或生成ID
    const id = findOrGenerateBookId(extractedInfo.title, extractedInfo.author, extractedInfo.douban_url, existingBooks)
    
    const book: Book = {
      id,
      title: extractedInfo.title,
      author: extractedInfo.author,
      isbn: '', // 现有数据中没有ISBN，需要后续补充
      cover: extractedInfo.cover,
      douban_url: extractedInfo.douban_url,
      description: extractedInfo.description,
      download_link: extractedInfo.download_link,
      extract_code: extractedInfo.extract_code,
      publish_date: extractedInfo.publish_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('📖 成功解析书籍:', { title: book.title, author: book.author, id: book.id })
    return book
    
  } catch (error) {
    console.error('📖 解析书籍信息失败:', error)
    return null
  }
}

/**
 * 提取书籍信息的核心函数
 */
function extractBookInfo(html: string) {
  const info = {
    title: '',
    author: '',
    cover: '',
    douban_url: '',
    description: '',
    download_link: '',
    extract_code: '',
    publish_date: ''
  }
  
  // 豆瓣链接提取 - 多种模式
  const doubanPatterns = [
    /href="(https:\/\/book\.douban\.com\/subject\/[^"]+)"/,
    /href='(https:\/\/book\.douban\.com\/subject\/[^']+)'/,
    /douban\.com\/subject\/(\d+)/
  ]
  
  for (const pattern of doubanPatterns) {
    const match = html.match(pattern)
    if (match) {
      info.douban_url = match[1].startsWith('http') ? match[1] : `https://book.douban.com/subject/${match[1]}`
      break
    }
  }
  
  // 书名提取 - 多种模式
  const titlePatterns = [
    /title="([^"]+)"/,
    /title='([^']+)'/,
    /<h[1-6][^>]*>《([^》]+)》<\/h[1-6]>/,
    /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/,
    /《([^》]+)》/,
    /<[^>]*class=[^>]*title[^>]*>([^<]+)<\/[^>]*>/,
    /<strong[^>]*>([^<]+)<\/strong>/
  ]
  
  for (const pattern of titlePatterns) {
    const match = html.match(pattern)
    if (match) {
      info.title = match[1].trim()
      break
    }
  }
  
  // 封面图片提取
  const coverPatterns = [
    /src="([^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)"[^>]*alt="[^"]*书[^"]*"/i,
    /src="([^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/,
    /src='([^']+\.(?:jpg|jpeg|png|gif|webp)[^']*)'/
  ]
  
  for (const pattern of coverPatterns) {
    const match = html.match(pattern)
    if (match) {
      info.cover = match[1]
      break
    }
  }
  
  // 描述提取
  const descriptionPatterns = [
    /<p[^>]*class=[^>]*text[^>]*>([^<]+)<\/p>/,
    /<p[^>]*>([^<]{20,})<\/p>/,
    /<div[^>]*class=[^>]*desc[^>]*>([^<]+)<\/div>/,
    /<span[^>]*class=[^>]*desc[^>]*>([^<]+)<\/span>/
  ]
  
  for (const pattern of descriptionPatterns) {
    const match = html.match(pattern)
    if (match) {
      info.description = match[1].trim()
      break
    }
  }
  
  // 作者提取
  const authorPatterns = [
    /作者：([^<\n]+)(?:<|$)/,
    /作者:([^<\n]+)(?:<|$)/,
    /著者：([^<\n]+)(?:<|$)/,
    /by ([^<\n]+)(?:<|$)/i,
    /<[^>]*class=[^>]*author[^>]*>([^<]+)<\/[^>]*>/
  ]
  
  for (const pattern of authorPatterns) {
    const match = html.match(pattern)
    if (match) {
      info.author = match[1].trim()
      break
    }
  }
  
  // 出版时间提取
  const pubDatePatterns = [
    /出版时间：([^<\n]+)(?:<|$)/,
    /出版时间:([^<\n]+)(?:<|$)/,
    /出版：([^<\n]+)(?:<|$)/,
    /(\d{4}年\d{1,2}月|\d{4}-\d{1,2}-\d{1,2}|\d{4}\/\d{1,2}\/\d{1,2})/
  ]
  
  for (const pattern of pubDatePatterns) {
    const match = html.match(pattern)
    if (match) {
      info.publish_date = match[1].trim()
      break
    }
  }
  
  // 下载链接提取
  const downloadPatterns = [
    /href="([^"]+)"[^>]*>📥 下载<\/a>/,
    /href="([^"]+)"[^>]*>下载<\/a>/,
    /href="([^"]+)"[^>]*>.*?下载.*?<\/a>/,
    /<a[^>]*href="([^"]+)"[^>]*>.*?(?:下载|download).*?<\/a>/i
  ]
  
  for (const pattern of downloadPatterns) {
    const match = html.match(pattern)
    if (match) {
      info.download_link = match[1]
      break
    }
  }
  
  // 提取码提取 - 支持多行HTML格式
  const extractCodePatterns = [
    // 匹配多行HTML结构中的提取码
    /<p\s+class=["']pwd-text["'][^>]*>[\s\S]*?提取码：([^<\n\s]+)[\s\S]*?<\/p>/i,
    /<p\s+class=["']pwd-text["'][^>]*>[\s\S]*?提取码:([^<\n\s]+)[\s\S]*?<\/p>/i,
    // 匹配单行格式
    /提取码：([^<\n\s]+)(?:<|$)/,
    /提取码:([^<\n\s]+)(?:<|$)/,
    /密码：([^<\n\s]+)(?:<|$)/,
    /密码:([^<\n\s]+)(?:<|$)/,
    /code：([^<\n\s]+)(?:<|$)/i,
    /code:([^<\n\s]+)(?:<|$)/i
  ]
  
  for (const pattern of extractCodePatterns) {
    const match = html.match(pattern)
    if (match) {
      info.extract_code = match[1].trim()
      break
    }
  }
  
  // 处理空提取码的情况 - 检查是否存在空的提取码标签
  if (!info.extract_code) {
    const emptyExtractCodePatterns = [
      /<p\s+class=["']pwd-text["'][^>]*>[\s\S]*?提取码：[\s\S]*?<\/p>/i,
      /<p\s+class=["']pwd-text["'][^>]*>[\s\S]*?提取码:[\s\S]*?<\/p>/i,
      /提取码：[\s]*(?:<|$)/,
      /提取码:[\s]*(?:<|$)/
    ]
    
    for (const pattern of emptyExtractCodePatterns) {
      if (html.match(pattern)) {
        info.extract_code = ''
        break
      }
    }
  }
  
  return info
}

/**
 * 智能匹配现有书籍ID
 * @param title 书名
 * @param author 作者
 * @param doubanUrl 豆瓣URL
 * @param existingBooks 现有的书籍数据
 * @returns 匹配的书籍ID或新生成的ID
 */
function findOrGenerateBookId(title: string, author: string, doubanUrl: string, existingBooks?: Book[]): string {
  if (!existingBooks || existingBooks.length === 0) {
    return generateBookId(title, author)
  }
  
  // 1. 尝试通过标题+作者匹配
  const titleAuthorMatch = existingBooks.find(book => 
    book.title === title && book.author === author
  )
  if (titleAuthorMatch) {
    return titleAuthorMatch.id
  }
  
  // 2. 尝试通过豆瓣URL匹配
  if (doubanUrl && doubanUrl.trim()) {
    const doubanMatch = existingBooks.find(book => 
      book.douban_url === doubanUrl
    )
    if (doubanMatch) {
      return doubanMatch.id
    }
  }
  
  // 3. 模糊匹配标题（去除书名号）
  const normalizedTitle = title.replace(/[《》「」『』]/g, '').trim()
  const fuzzyMatch = existingBooks.find(book => {
    const bookTitle = book.title.replace(/[《》「」『』]/g, '').trim()
    return bookTitle === normalizedTitle && book.author === author
  })
  if (fuzzyMatch) {
    return fuzzyMatch.id
  }
  
  // 4. 都没找到，生成新ID
  return generateBookId(title, author)
}

/**
 * 生成书籍ID
 * @param title 书名
 * @param author 作者
 * @returns 唯一ID
 */
function generateBookId(title: string, author: string): string {
  // 使用书名和作者生成简单的哈希ID
  const str = `${title}-${author}`;
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString();
}

/**
 * 获取默认的头部内容
 */
function getDefaultHeader(): string {
  return `---
title: 书单
date: 2024-11-27 10:33:03
banner_img: https://cdn.specialhua.top/hexo_img/wallhaven-43kyk6.webp
comment: true
---
<p class="note note-info">
  这里有一些书，以前也做过书单页面，也看别人做。<br>
  但我觉得差点意思的地方在于大部分都只给了一个豆瓣的链接，而我这里，白（Bu）嫖（shi）党可以很方便的直接去<b>网盘<b>下载，免得你再找。<br>
  资源大部分来自<b>Z-Library<b>，网盘为<b>天翼网盘<b>。没有百度网盘，<b>狗都不用<b><br>
  下面的zlib地址可能会失效，注意甄别
  读书愉快，朋友~</p>
<a class="btn" href="https://z-library.sk/" title="Z-Library官网地址">Z-Library</a>

<div id="book">
    <div class="page">
        <ul class="content">`
}

/**
 * 获取默认的脚部内容
 */
function getDefaultFooter(): string {
  return `        </ul>
    </div>
</div>`
}

/**
 * 生成符合现有格式的书籍HTML
 * @param book 书籍对象
 * @returns HTML字符串
 */
export function generateBookHtml(book: Book): string {
  return `            <!-- 书籍${book.title} -->
            <li>
                <div class="info">
                    <a href="${book.douban_url}" target="_blank" rel="noopener noreferrer" class="book-container">
                        <div class="book" title="${book.title}">
                            <img src="${book.cover}" alt="${book.title}">
                        </div>
                    </a>
                    <div class="info-card">
                        <div class="hidden-content">
                            <p class="text">${book.description}</p>
                        </div>
                        <h3>《${book.title}》</h3>
                        <p>作者：${book.author}</p>
                        <p>出版时间：${book.publish_date}</p>
                        <p>
                            <a href="${book.download_link}" target="_blank" rel="noopener noreferrer">📥 下载</a>
                        </p>
                        <p class="pwd-text">
                            提取码：${book.extract_code}
                        </p>
                    </div>
                </div>
            </li>`;
}

/**
 * 生成完整的 index.md 文件内容
 * @param books 书籍列表
 * @param structure 原始文件结构（可选）
 * @returns 完整的 index.md 内容
 */
export function generateIndexMd(books: Book[], structure?: OriginalFileStructure): string {
  // 如果没有提供结构，使用默认结构
  const header = structure?.header || getDefaultHeader()
  const footer = structure?.footer || getDefaultFooter()
  
  // 生成书籍列表HTML
  const bookListHtml = books.map(book => generateBookHtml(book)).join('\n')
  
  // 组合完整内容
  return header + '\n' + bookListHtml + '\n' + footer
}
