// 书籍基础信息接口
export interface Book {
  id: string
  title: string
  author: string
  isbn: string
  cover: string
  douban_url: string
  description: string
  download_link: string
  extract_code: string
  publish_date: string
  created_at?: string
  updated_at?: string
  sort_order?: number  // 排序顺序，数字越小越靠前
}

// ISBN API返回的书籍信息
export interface IsbnBookInfo {
  isbn: string
  bookName: string
  author: string
  press: string
  pressDate: string
  pressPlace: string
  price: number
  pictures: string  // 注意：API返回的是JSON字符串，需要解析
  clcCode: string
  clcName: string
  bookDesc: string
  binding: string
  language: string
  format: string
  pages: string
  edition: string
  words: string
}

// ISBN API响应格式
export interface IsbnApiResponse {
  code: number
  data: IsbnBookInfo | null
  actionHint: string
  success: boolean
}

// 豆瓣API返回的书籍信息
export interface DoubanBookInfo {
  title: string
  author: string[]
  isbn10?: string
  isbn13?: string
  images: {
    small: string
    medium: string
    large: string
  }
  url: string
  summary: string
  pubdate: string
  rating: {
    average: number
    numRaters: number
  }
  tags: Array<{
    name: string
    count: number
  }>
}

// 书籍搜索结果
export interface BookSearchResult {
  books: DoubanBookInfo[]
  count: number
  start: number
  total: number
}

// 输入方式枚举
export enum InputType {
  ISBN = 'isbn',
  MANUAL = 'manual'
}

// 添加书籍表单数据
export interface AddBookFormData {
  inputType: InputType
  searchInput: string
  title: string
  author: string
  isbn: string
  cover: string
  douban_url: string
  description: string
  download_link: string
  extract_code: string
  publish_date: string
}

// 图床上传响应
export interface ImageUploadResponse {
  url: string
  success?: boolean
  uploadSuccess?: boolean  // 是否真正上传成功
  fallback?: boolean       // 是否使用了降级方案
  error?: string
  message?: string
  thumbnail?: string
  delete_url?: string
}

// ISBN API配置
export interface IsbnApiConfig {
  apiKey: string  // 用户配置的API Key，可为空
}

// 应用配置
export interface AppConfig {
  image_bed: {
    type: 'custom' | 'github' | 'sm.ms' | 'imgbb'
    config: Record<string, any>
  }
  douban_api: {
    base_url: string
    timeout: number
  }
  isbn_api: IsbnApiConfig
  hexo_path: string
  backup_enabled: boolean
}

// HTML生成配置
export interface HtmlGenerateConfig {
  template_path: string
  output_path: string
  backup_original: boolean
}

// 分页配置接口
export interface PaginationConfig {
  page: number
  pageSize: number
  showSizePicker: boolean
  pageSizes: number[]
  showQuickJumper: boolean
}

// 通用设置接口
export interface GeneralSettings {
  defaultViewMode: 'grid' | 'table'
  gridViewPageSize: number
  tableViewPageSize: number
  gridLoadMode: 'pagination' | 'infinite' // 网格视图加载模式
  infiniteScrollBatchSize: number // 无限滚动每批加载数量
  enableVirtualScroll: boolean // 是否启用虚拟滚动
}