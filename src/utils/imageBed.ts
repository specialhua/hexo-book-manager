import type { ImageUploadResponse } from '../types'
import { errorLogger, withErrorLogging } from './errorLogger'

// 类型声明，解决在Node.js环境下编译时的类型错误
declare var window: any

// 检查是否在Electron环境中
const isElectron = () => {
  const hasWindow = typeof window !== 'undefined' && window
  const hasElectronAPI = hasWindow && (window as any).electronAPI !== undefined
  
  if (hasWindow) {
    console.log('Electron环境检测:', {
      hasWindow,
      hasElectronAPI,
      electronAPI: (window as any).electronAPI || 'electronAPI不存在',
      availableMethods: (window as any).electronAPI ? Object.keys((window as any).electronAPI) : [],
      methodDetails: (window as any).electronAPI ? Object.keys((window as any).electronAPI).map((key: string) => ({
        name: key,
        type: typeof ((window as any).electronAPI as any)[key]
      })) : [],
      downloadImageExists: (window as any).electronAPI && 'downloadImage' in (window as any).electronAPI,
      hasDownloadImage: (window as any).electronAPI ? typeof (window as any).electronAPI.downloadImage === 'function' : false,
      userAgent: (window as any).navigator ? (window as any).navigator.userAgent : 'N/A'
    })
  }
  
  return hasElectronAPI
}

// 图床类型枚举
export enum ImageBedType {
  NONE = 'none',
  CUSTOM = 'custom',
  GITHUB = 'github',
  SM_MS = 'sm.ms',
  IMGBB = 'imgbb',
  IMGUR = 'imgur',
  QINIU = 'qiniu'
}

// 图床配置接口
export interface ImageBedConfig {
  type: ImageBedType
  config: {
    // 自定义图床配置
    custom_url?: string
    custom_token?: string
    
    // GitHub配置
    github_token?: string
    github_repo?: string
    github_branch?: string
    github_path?: string
    
    // SM.MS配置
    smms_token?: string
    
    // ImgBB配置
    imgbb_key?: string
    
    // Imgur配置
    imgur_client_id?: string

    // 七牛云配置
    qiniu_access_key?: string
    qiniu_secret_key?: string
    qiniu_bucket?: string
    qiniu_domain?: string
    qiniu_region?: string
    qiniu_path?: string
    qiniu_style_suffix?: string  // 图片样式后缀，如: -pic, ?imageView2/1/w/500
  }
}

/**
 * 将base64转换为Uint8Array (浏览器环境)
 */
function base64ToUint8Array(base64: string): Uint8Array {
  // 移除data URL前缀
  const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, '')
  
  // 浏览器环境中的base64解码
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * 转换文件格式为Electron API格式
 */
function prepareFileForElectron(file: string | File | { data: string, fileName: string }): { name: string, base64: string, path?: string } {
  if (typeof file === 'string') {
    // base64字符串，直接传输
    console.log('处理base64字符串，长度:', file.length)
    const fileName = `upload-${Date.now()}.jpg`
    console.log('准备传输的数据:', { name: fileName, base64Length: file.length })
    return { name: fileName, base64: file }
  } else if ('data' in file) {
    // 下载的图片数据
    console.log('处理下载的图片数据，长度:', file.data.length)
    console.log('准备传输的数据:', { name: file.fileName, base64Length: file.data.length })
    return { name: file.fileName, base64: file.data }
  } else {
    // File对象
    console.log('处理File对象:', file.name)
    return {
      name: file.name,
      base64: '', // 占位符，实际会在preload中处理
      path: (file as any).path // 如果是本地文件路径
    }
  }
}

/**
 * 上传图片到图床
 * @param file 图片文件（base64或文件路径）
 * @param config 图床配置
 * @returns 上传结果
 */
export const uploadImage = withErrorLogging('imageBed', async function uploadImage(
  file: string | File, 
  config: ImageBedConfig
): Promise<ImageUploadResponse> {
  errorLogger.info('imageBed', `开始上传图片到${config.type}`, { 
    fileType: typeof file,
    configType: config.type 
  })
  
  switch (config.type) {
    case ImageBedType.NONE:
      throw new Error('请先配置图床或直接在表单中填写图片URL')
    case ImageBedType.CUSTOM:
      return uploadToCustomBed(file, config.config)
    case ImageBedType.GITHUB:
      return uploadToGitHub(file, config.config)
    case ImageBedType.SM_MS:
      return uploadToSMMS(file, config.config)
    case ImageBedType.IMGBB:
      return uploadToImgBB(file, config.config)
    case ImageBedType.IMGUR:
      return uploadToImgur(file, config.config)
    case ImageBedType.QINIU:
      return uploadToQiniu(file, config.config)
    default:
      throw new Error('不支持的图床类型')
  }
})

/**
 * 上传到自定义图床
 */
async function uploadToCustomBed(
  file: string | File, 
  config: any
): Promise<ImageUploadResponse> {
  throw new Error('自定义图床上传功能尚未实现')
}

/**
 * 上传到GitHub
 */
async function uploadToGitHub(
  file: string | File, 
  config: any
): Promise<ImageUploadResponse> {
  throw new Error('GitHub图床上传功能尚未实现')
}

/**
 * 上传到SM.MS
 */
async function uploadToSMMS(
  file: string | File, 
  config: any
): Promise<ImageUploadResponse> {
  throw new Error('SM.MS图床上传功能尚未实现')
}

/**
 * 上传到ImgBB
 */
async function uploadToImgBB(
  file: string | File, 
  config: any
): Promise<ImageUploadResponse> {
  throw new Error('ImgBB图床上传功能尚未实现')
}

/**
 * 上传到Imgur
 */
async function uploadToImgur(
  file: string | File, 
  config: any
): Promise<ImageUploadResponse> {
  throw new Error('Imgur图床上传功能尚未实现')
}

/**
 * 上传到七牛云 - PicGo-Core实现
 */
async function uploadToQiniu(
  file: string | File, 
  config: any
): Promise<ImageUploadResponse> {
  // 检查是否在Electron环境中
  if (isElectron()) {
    return uploadToQiniuElectron(file, config)
  } else {
    // 如果不在Electron环境，抛出错误
    throw new Error('七牛云上传需要在Electron环境中运行')
  }
}

/**
 * 在Electron环境中通过PicGo-Core上传到七牛云
 */
async function uploadToQiniuElectron(
  file: string | File, 
  config: any
): Promise<ImageUploadResponse> {
  // 配置验证
  if (!config.qiniu_access_key || !config.qiniu_secret_key || !config.qiniu_bucket) {
    const missingFields = []
    if (!config.qiniu_access_key) missingFields.push('AccessKey')
    if (!config.qiniu_secret_key) missingFields.push('SecretKey')
    if (!config.qiniu_bucket) missingFields.push('Bucket')
    
    const error = new Error(`七牛云配置不完整，缺少: ${missingFields.join(', ')}`)
    errorLogger.error('imageBed', '七牛云配置验证失败', error, { 
      config: {
        hasAccessKey: !!config.qiniu_access_key,
        hasSecretKey: !!config.qiniu_secret_key,
        hasBucket: !!config.qiniu_bucket,
        hasRegion: !!config.qiniu_region,
        hasDomain: !!config.qiniu_domain
      }
    })
    throw error
  }
  
  try {
    errorLogger.info('imageBed', '开始PicGo-Core七牛云上传', { 
      bucket: config.qiniu_bucket,
      region: config.qiniu_region,
      domain: config.qiniu_domain,
      path: config.qiniu_path
    })

    // 准备文件数据
    const fileData = prepareFileForElectron(file)
    
    // 将配置对象转换为普通对象，避免序列化问题
    const plainConfig = JSON.parse(JSON.stringify(config))
    
    console.log('即将调用 Electron API uploadImage，配置:', {
      bucket: plainConfig.qiniu_bucket,
      domain: plainConfig.qiniu_domain,
      region: plainConfig.qiniu_region,
      styleSuffix: plainConfig.qiniu_style_suffix,
      fileDataName: fileData.name
    })
    
    // 通过Electron API上传
    const result = await (typeof window !== 'undefined' && window ? (window as any).electronAPI.uploadImage : (() => { throw new Error('Electron API不可用') }))({ 
      name: fileData.name, 
      path: fileData.path || '', 
      base64: fileData.base64 
    }, plainConfig)
    
    console.log('Electron API uploadImage 返回结果:', result)
    
    if (result.success && result.data?.url) {
      errorLogger.info('imageBed', 'PicGo-Core上传成功', { url: result.data.url, key: result.data?.key })
      
      return {
        success: true,
        url: result.data.url,
        message: '上传成功'
      }
    } else {
      console.error('Electron API 返回失败:', {
        success: result.success,
        error: result.error,
        url: result.data?.url || '',
        fullResult: result
      })
      throw new Error(result.error || '上传失败')
    }
  } catch (error) {
    errorLogger.error('imageBed', 'PicGo-Core上传异常', error instanceof Error ? error : new Error(String(error)), {
      config: {
        bucket: config.qiniu_bucket,
        region: config.qiniu_region
      }
    })
    
    return {
      success: false,
      url: '',
      error: error instanceof Error ? error.message : String(error),
      message: `七牛云上传失败: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 下载图片并上传到指定图床
 * @param imageUrl 图片URL
 * @param config 图床配置
 * @returns 上传结果
 */
export const downloadAndUploadImage = withErrorLogging('imageBed', async function downloadAndUploadImage(
  imageUrl: string, 
  config: ImageBedConfig
): Promise<ImageUploadResponse> {
  errorLogger.info('imageBed', '开始下载并上传图片', { 
    imageUrl,
    configType: config.type 
  })
  
  try {
    let fileBlob: File | string
    
    if (isElectron() && typeof window !== 'undefined' && window && (window as any).electronAPI && typeof (window as any).electronAPI.downloadImage === 'function') {
      // 在Electron环境中使用主进程下载
      errorLogger.info('imageBed', '使用Electron主进程下载图片', { imageUrl })
      
      const downloadResult = await (window as any).electronAPI.downloadImage(imageUrl)
      
      if (!downloadResult.success || !downloadResult.data) {
        throw new Error(downloadResult.error || '下载失败')
      }
      
      // 将base64数据直接传递，不需要转换为File对象
      const base64Data = downloadResult.data.base64
      
      // 从URL中提取文件扩展名
      const urlPath = new URL(imageUrl).pathname
      const extension = urlPath.split('.').pop() || 'jpg'
      const fileName = `downloaded-${Date.now()}.${extension}`
      
      console.log('准备上传下载的图片，base64长度:', base64Data.length)
      
      // 直接使用base64字符串
      fileBlob = base64Data
      
    } else {
      // 在浏览器环境中直接使用fetch下载
      errorLogger.info('imageBed', '使用浏览器fetch下载图片', { imageUrl })
      
      try {
        const response = await fetch(imageUrl, {
          mode: 'cors',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const blob = await response.blob()
        
        // 从URL中提取文件扩展名
        const urlPath = new URL(imageUrl).pathname
        const extension = urlPath.split('.').pop() || 'jpg'
        const fileName = `downloaded-${Date.now()}.${extension}`
        
        fileBlob = new File([blob], fileName, { type: blob.type || 'image/jpeg' })
        
      } catch (fetchError) {
        errorLogger.warning('imageBed', '浏览器直接下载失败，返回原始URL', { 
          imageUrl,
          error: fetchError instanceof Error ? fetchError.message : String(fetchError)
        })
        
        return {
          url: imageUrl
        }
      }
    }
    
    // 上传到图床
    const result = await uploadImage(fileBlob, config)
    
    errorLogger.info('imageBed', '图片下载并上传成功', { 
      originalUrl: imageUrl,
      newUrl: result.url 
    })
    
    return {
      ...result,
      success: true,
      uploadSuccess: true,  // 明确标识上传成功
      fallback: false
    }
  } catch (error) {
    errorLogger.error('imageBed', '下载并上传图片失败', error instanceof Error ? error : new Error(String(error)), {
      imageUrl,
      configType: config.type
    })
    
    // 失败时返回原始URL作为降级方案
    errorLogger.warning('imageBed', '上传失败，使用原始图片URL作为降级方案', { 
      imageUrl,
      error: error instanceof Error ? error.message : String(error)
    })
    
    return {
      url: imageUrl,
      success: true,  // 返回结果成功（有URL可用）
      uploadSuccess: false,  // 但上传失败
      fallback: true,  // 使用了降级方案
      error: error instanceof Error ? error.message : String(error)
    }
  }
})