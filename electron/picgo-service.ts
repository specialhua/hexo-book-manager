import { PicGo } from 'picgo'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

export interface QiniuConfig {
  qiniu_access_key: string
  qiniu_secret_key: string
  qiniu_bucket: string
  qiniu_domain: string
  qiniu_region: string
  qiniu_path?: string
  qiniu_style_suffix?: string  // 图片样式后缀
}

export interface UploadFileData {
  name: string
  path?: string
  data: Buffer
}

export interface UploadResult {
  success: boolean
  url?: string
  key?: string
  error?: string
}

export class PicGoService {
  private picgo: PicGo

  constructor() {
    this.picgo = new PicGo()
    this.setupPicGo()
    
    // 设置 PicGo 事件监听器获取更详细的错误信息
    this.picgo.on('uploadProgress', (progress: any) => {
      console.log('PicGo上传进度:', progress)
    })
    
    this.picgo.on('beforeUpload', (ctx: any) => {
      console.log('PicGo准备上传，文件数量:', ctx.input?.length || 0)
    })
    
    this.picgo.on('afterUpload', (ctx: any) => {
      console.log('PicGo上传完成，结果:', ctx.output)
    })
    
    this.picgo.on('failed', (error: any) => {
      console.error('PicGo上传失败事件:', error)
    })
    
    this.picgo.on('notification', (notice: any) => {
      console.log('PicGo通知:', notice)
    })
  }

  private setupPicGo() {
    // 设置PicGo配置目录
    const configDir = path.join(process.cwd(), '.picgo')
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }
    
    // 检查PicGo可用的uploader
    console.log('PicGo可用的上传器:', this.picgo.helper.uploader.getList())
    
    // 检查七牛云uploader是否可用 - 打印详细信息用于调试
    const uploaders = this.picgo.helper.uploader.getList()
    console.log('上传器详细信息:', uploaders.map((uploader: any) => ({
      name: typeof uploader.name === 'function' ? uploader.name() : uploader.name,
      hasHandle: typeof uploader.handle === 'function',
      hasConfig: typeof uploader.config === 'function'
    })))
    
    const hasQiniu = uploaders.some((uploader: any) => {
      const name = typeof uploader.name === 'function' ? uploader.name() : uploader.name
      return name === 'qiniu' || name === 'Qiniu' || name.toLowerCase().includes('qiniu')
    })
    console.log('七牛云uploader可用:', hasQiniu)
    
    if (!hasQiniu) {
      console.warn('警告：七牛云uploader不可用，但PicGo通常内置七牛云支持，继续尝试上传')
    }
  }

  /**
   * 上传图片到七牛云
   */
  async uploadToQiniu(config: QiniuConfig, file: UploadFileData): Promise<UploadResult> {
    try {
      console.log('开始PicGo-Core上传:', file.name)
      
      // 验证配置
      this.validateQiniuConfig(config)
      
      // 设置PicGo七牛云配置
      const qiniuConfig = {
        accessKey: config.qiniu_access_key,
        secretKey: config.qiniu_secret_key,
        bucket: config.qiniu_bucket,
        url: config.qiniu_domain,
        area: this.getQiniuArea(config.qiniu_region),
        path: config.qiniu_path || 'book-covers/',
        options: config.qiniu_style_suffix || ''  // 图片样式后缀
      }
      
      console.log('PicGo七牛云配置:', {
        ...qiniuConfig,
        accessKey: config.qiniu_access_key.substring(0, 8) + '***',
        secretKey: '***',
        options: qiniuConfig.options
      })
      console.log('样式后缀详细信息:', {
        原始配置: config.qiniu_style_suffix,
        处理后options: qiniuConfig.options,
        options长度: qiniuConfig.options.length,
        options类型: typeof qiniuConfig.options
      })
      
      this.picgo.setConfig({
        'picBed.uploader': 'qiniu',
        'picBed.qiniu': qiniuConfig
      })

      // 处理文件
      let filePath: string
      if (file.path && fs.existsSync(file.path)) {
        filePath = file.path
        console.log('使用现有文件路径:', filePath)
      } else {
        // 创建临时文件
        const tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true })
          console.log('创建临时目录:', tempDir)
        }
        
        filePath = path.join(tempDir, file.name)
        console.log('创建临时文件:', filePath, '大小:', file.data.length, 'bytes')
        
        try {
          fs.writeFileSync(filePath, file.data)
          console.log('临时文件写入成功')
          
          // 验证文件是否写入成功
          const stats = fs.statSync(filePath)
          console.log('临时文件验证:', {
            存在: fs.existsSync(filePath),
            大小: stats.size,
            创建时间: stats.birthtime
          })
        } catch (writeError: any) {
          console.error('临时文件写入失败:', writeError)
          throw new Error(`临时文件写入失败: ${writeError.message}`)
        }
      }

      console.log('上传文件路径:', filePath)

      try {
        // 检查 PicGo 当前配置
        const currentConfig = this.picgo.getConfig() as any
        console.log('当前PicGo配置:', {
          uploader: currentConfig?.picBed?.uploader,
          qiniuConfig: currentConfig?.picBed?.qiniu ? {
            bucket: currentConfig.picBed.qiniu.bucket,
            area: currentConfig.picBed.qiniu.area,
            hasAccessKey: !!currentConfig.picBed.qiniu.accessKey,
            hasSecretKey: !!currentConfig.picBed.qiniu.secretKey
          } : 'not configured'
        })
        
        console.log('开始执行PicGo上传...')
        
        // 执行上传
        const result = await this.picgo.upload([filePath])
        
        console.log('PicGo upload result:', result)
        
        // 清理临时文件
        if (!file.path) {
          fs.unlinkSync(filePath)
        }

        if (result && Array.isArray(result) && result.length > 0) {
          const uploadResult = result[0]
          console.log('上传成功:', uploadResult)
          console.log('URL检查:', {
            生成的URL: uploadResult.imgUrl || uploadResult.url,
            是否包含样式后缀: qiniuConfig.options ? (uploadResult.imgUrl || uploadResult.url).includes(qiniuConfig.options) : '无样式后缀',
            期望的样式后缀: qiniuConfig.options
          })
          
          return {
            success: true,
            url: uploadResult.imgUrl || uploadResult.url,
            key: uploadResult.fileName || file.name
          }
        } else {
          console.error('PicGo上传返回空结果，可能的原因：')
          console.error('1. 七牛云配置错误（AccessKey、SecretKey、Bucket、域名）')
          console.error('2. 网络连接问题')
          console.error('3. 七牛云服务异常')
          console.error('4. 文件格式不支持')
          throw new Error('PicGo上传返回空结果。请检查七牛云配置是否正确。')
        }
        
      } catch (uploadError) {
        console.error('PicGo upload 异常:', uploadError)
        throw uploadError
      }

    } catch (error) {
      console.error('PicGo上传失败:', error)
      
      // 增强错误信息
      let detailError = (error as Error).message || '未知错误'
      
      if (detailError.includes('ENOTFOUND')) {
        detailError = '网络连接失败，请检查网络连接或七牛云域名配置'
      } else if (detailError.includes('Unauthorized') || detailError.includes('401')) {
        detailError = '认证失败，请检查七牛云AccessKey和SecretKey是否正确'
      } else if (detailError.includes('ETIMEDOUT')) {
        detailError = '上传超时，请检查网络连接'
      } else if (detailError.includes('bucket')) {
        detailError = '存储空间错误，请检查七牛云Bucket配置是否正确'
      } else if (detailError.includes('permission') || detailError.includes('403')) {
        detailError = '权限不足，请检查七牛云账户权限'
      }
      
      console.error('详细错误信息:', detailError)
      
      return {
        success: false,
        error: detailError
      }
    }
  }

  /**
   * 测试七牛云配置
   */
  async testQiniuConfig(config: QiniuConfig, enableFileUploadTest: boolean = false): Promise<{ success: boolean, error?: string, details?: any }> {
    try {
      console.log('开始测试七牛云配置...')
      
      this.validateQiniuConfig(config)
      
      // 打印配置信息用于调试
      console.log('七牛云配置详情:', {
        bucket: config.qiniu_bucket,
        domain: config.qiniu_domain,
        region: config.qiniu_region,
        path: config.qiniu_path,
        accessKeyLength: config.qiniu_access_key.length,
        secretKeyLength: config.qiniu_secret_key.length
      })
      
      // 步骤1: 验证token生成
      console.log('步骤1: 验证上传token生成能力')
      const testToken = this.generateUploadToken(config, 'test-key')
      if (!testToken) {
        return { 
          success: false, 
          error: '无法生成上传token，请检查AccessKey和SecretKey格式',
          details: { step: 'token_generation', tokenGenerated: false }
        }
      }
      console.log('✓ 上传Token生成成功')
      
      // 步骤2: 测试域名解析和连通性
      console.log('步骤2: 测试域名解析和连通性')
      const domainTestResult = await this.testDomainResolution(config.qiniu_domain)
      if (!domainTestResult.success) {
        return {
          success: false,
          error: domainTestResult.error || '域名解析失败',
          details: { 
            step: 'domain_resolution', 
            ...domainTestResult.details 
          }
        }
      }
      console.log('✓ 域名连通性正常')
      
      const completedSteps = ['token_generation', 'domain_resolution']
      
      // 步骤3: 可选的文件上传测试
      let fileUploadResult = null
      if (enableFileUploadTest) {
        console.log('步骤3: 测试实际文件上传功能')
        fileUploadResult = await this.testFileUpload(config)
        if (!fileUploadResult.success) {
          return {
            success: false,
            error: fileUploadResult.error || '文件上传测试失败',
            details: { 
              step: 'file_upload_test', 
              ...fileUploadResult.details 
            }
          }
        }
        console.log('✓ 文件上传测试成功')
        completedSteps.push('file_upload_test')
      }
      
      // 所有测试通过
      const baseMessage = 'Token生成和域名连通性正常'
      const uploadMessage = enableFileUploadTest ? '，文件上传功能验证通过' : ''
      
      return { 
        success: true, 
        details: {
          message: `配置测试通过！${baseMessage}${uploadMessage}`,
          bucket: config.qiniu_bucket,
          domain: config.qiniu_domain,
          region: config.qiniu_region,
          tokenGenerated: true,
          domainResolved: true,
          fileUploadTested: enableFileUploadTest,
          steps: completedSteps,
          ...(fileUploadResult?.details && { uploadTestDetails: fileUploadResult.details })
        }
      }
      
    } catch (error) {
      console.error('配置测试失败:', error)
      return { 
        success: false, 
        error: (error as Error).message,
        details: { 
          errorType: 'validation_error',
          originalError: (error as Error).message
        }
      }
    }
  }

  /**
   * 验证七牛云配置
   */
  private validateQiniuConfig(config: QiniuConfig) {
    if (!config.qiniu_access_key) {
      throw new Error('AccessKey不能为空')
    }
    if (!config.qiniu_secret_key) {
      throw new Error('SecretKey不能为空')
    }
    if (!config.qiniu_bucket) {
      throw new Error('Bucket不能为空')
    }
    if (!config.qiniu_domain) {
      throw new Error('域名不能为空')
    }
  }

  /**
   * 获取七牛云存储区域代码
   */
  private getQiniuArea(region: string): string {
    const regionMap: { [key: string]: string } = {
      'z0': 'z0', // 华东
      'z1': 'z1', // 华北
      'z2': 'z2', // 华南
      'na0': 'na0', // 北美
      'as0': 'as0', // 东南亚
      'cn-east-2': 'cn-east-2' // 华东-浙江2
    }
    
    return regionMap[region] || 'z0'
  }

  /**
   * 生成七牛云上传token (用于配置测试)
   */
  private generateUploadToken(config: QiniuConfig, key: string): string {
    try {
      const policy = JSON.stringify({
        scope: `${config.qiniu_bucket}:${key}`,
        deadline: Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
        returnBody: JSON.stringify({
          key: '$(key)',
          hash: '$(etag)',
          bucket: '$(bucket)',
          name: '$(x:name)'
        })
      })

      const encodedPolicy = Buffer.from(policy).toString('base64url')
      const signature = crypto
        .createHmac('sha1', config.qiniu_secret_key)
        .update(encodedPolicy)
        .digest('base64url')

      return `${config.qiniu_access_key}:${signature}:${encodedPolicy}`
    } catch (error) {
      console.error('生成token失败:', error)
      return ''
    }
  }

  /**
   * 测试Bucket连接性 - 实际调用七牛云API
   */
  private async testBucketConnection(config: QiniuConfig): Promise<{ success: boolean, error?: string, details?: any }> {
    try {
      // 使用七牛云管理API获取空间信息
      const bucketInfoUrl = this.getBucketInfoUrl(config.qiniu_region)
      const accessToken = this.generateAccessToken(config, 'GET', '/buckets')
      
      console.log('测试Bucket连接, URL:', bucketInfoUrl)
      
      const { default: fetch } = await import('node-fetch')
      
      // 创建 AbortController 来处理超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
      
      const response = await fetch(bucketInfoUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Qiniu ${accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      console.log('Bucket API响应状态:', response.status, response.statusText)
      
      if (response.status === 200) {
        const data = await response.text()
        console.log('Bucket API响应成功，数据长度:', data.length)
        return { 
          success: true, 
          details: { 
            status: response.status,
            message: 'Bucket连接成功',
            responseLength: data.length
          } 
        }
      } else if (response.status === 401) {
        return { 
          success: false, 
          error: 'AccessKey或SecretKey无效，请检查凭据是否正确',
          details: { 
            status: response.status, 
            statusText: response.statusText 
          } 
        }
      } else if (response.status === 404) {
        return { 
          success: false, 
          error: `Bucket '${config.qiniu_bucket}' 不存在或无访问权限`,
          details: { 
            status: response.status, 
            bucket: config.qiniu_bucket 
          } 
        }
      } else if (response.status === 403) {
        return { 
          success: false, 
          error: '账户权限不足，无法访问该Bucket',
          details: { 
            status: response.status, 
            statusText: response.statusText 
          } 
        }
      } else {
        const errorText = await response.text()
        return { 
          success: false, 
          error: `Bucket连接失败：HTTP ${response.status}`,
          details: { 
            status: response.status, 
            statusText: response.statusText,
            responseText: errorText.substring(0, 200)
          } 
        }
      }
    } catch (error: any) {
      console.error('Bucket连接测试异常:', error)
      
      let errorMessage = 'Bucket连接测试失败'
      if (error.code === 'ENOTFOUND') {
        errorMessage = '网络连接失败，请检查网络设置或七牛云服务状态'
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = '连接超时，请检查网络连接'
      } else if (error.message) {
        errorMessage = `连接异常：${error.message}`
      }
      
      return { 
        success: false, 
        error: errorMessage,
        details: { 
          errorCode: error.code,
          errorType: 'network_error',
          originalError: error.message
        } 
      }
    }
  }

  /**
   * 测试域名解析
   */
  private async testDomainResolution(domain: string): Promise<{ success: boolean, error?: string, details?: any }> {
    try {
      // 确保域名格式正确
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
      const testUrl = `https://${cleanDomain}`
      
      console.log('测试域名解析:', testUrl)
      
      const { default: fetch } = await import('node-fetch')
      
      // 创建 AbortController 来处理超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8秒超时
      
      const response = await fetch(testUrl, {
        method: 'HEAD', // 只获取头部信息，减少传输
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      console.log('域名解析响应:', response.status, response.statusText)
      
      // 任何响应都表示域名可以解析
      return { 
        success: true, 
        details: { 
          domain: cleanDomain,
          status: response.status,
          message: '域名解析正常',
          responseHeaders: Object.fromEntries(response.headers.entries())
        } 
      }
      
    } catch (error: any) {
      console.error('域名解析测试异常:', error)
      
      let errorMessage = '域名解析失败'
      if (error.code === 'ENOTFOUND') {
        errorMessage = `域名 '${domain}' 无法解析，请检查域名配置是否正确`
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = '域名访问超时，请检查域名是否可用'
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = '域名连接被拒绝，请检查域名和端口配置'
      } else if (error.message) {
        errorMessage = `域名测试失败：${error.message}`
      }
      
      return { 
        success: false, 
        error: errorMessage,
        details: { 
          domain: domain,
          errorCode: error.code,
          errorType: 'dns_error',
          originalError: error.message
        } 
      }
    }
  }

  /**
   * 测试文件上传功能 - 上传小测试文件后立即删除
   */
  private async testFileUpload(config: QiniuConfig): Promise<{ success: boolean, error?: string, details?: any }> {
    let testFileName = ''
    let uploadedUrl = ''
    
    try {
      // 创建1KB的测试文件
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      testFileName = `test/connection-test-${timestamp}.png`
      
      // 创建一个1x1像素的透明PNG图片 (67 bytes)
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'base64'
      )
      
      console.log('创建测试文件:', testFileName, '大小:', testImageBuffer.length, 'bytes')
      
      // 使用现有的上传方法
      const uploadResult = await this.uploadToQiniu(config, {
        name: testFileName,
        data: testImageBuffer
      })
      
      if (!uploadResult.success) {
        return {
          success: false,
          error: `测试文件上传失败: ${uploadResult.error}`,
          details: {
            step: 'upload',
            fileName: testFileName,
            fileSize: testImageBuffer.length,
            uploadError: uploadResult.error
          }
        }
      }
      
      uploadedUrl = uploadResult.url || ''
      console.log('测试文件上传成功，URL:', uploadedUrl)
      
      // 立即删除测试文件
      const deleteResult = await this.deleteFileFromQiniu(config, uploadResult.key || testFileName)
      
      if (!deleteResult.success) {
        console.warn('测试文件删除失败，但不影响测试结果:', deleteResult.error)
      } else {
        console.log('测试文件已成功删除')
      }
      
      return {
        success: true,
        details: {
          fileName: testFileName,
          fileSize: testImageBuffer.length,
          uploadUrl: uploadedUrl,
          uploadedKey: uploadResult.key,
          deleted: deleteResult.success,
          uploadTime: new Date().toISOString()
        }
      }
      
    } catch (error) {
      console.error('文件上传测试异常:', error)
      
      // 如果上传成功但删除失败，尝试清理
      if (uploadedUrl) {
        try {
          await this.deleteFileFromQiniu(config, testFileName)
        } catch (cleanupError) {
          console.warn('清理测试文件失败:', cleanupError)
        }
      }
      
      return {
        success: false,
        error: `文件上传测试失败: ${(error as Error).message}`,
        details: {
          fileName: testFileName,
          errorType: 'upload_test_error',
          originalError: (error as Error).message
        }
      }
    }
  }

  /**
   * 从七牛云删除文件
   */
  private async deleteFileFromQiniu(config: QiniuConfig, fileKey: string): Promise<{ success: boolean, error?: string }> {
    try {
      const deleteUrl = this.getDeleteUrl(config.qiniu_region)
      const encodedKey = Buffer.from(fileKey, 'utf-8').toString('base64url')
      const deletePath = `/delete/${encodedKey}`
      
      const accessToken = this.generateAccessToken(config, 'POST', deletePath)
      
      const { default: fetch } = await import('node-fetch')
      
      // 创建 AbortController 来处理超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8秒超时
      
      const response = await fetch(`${deleteUrl}${deletePath}`, {
        method: 'POST',
        headers: {
          'Authorization': `Qiniu ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      console.log('删除文件API响应:', response.status, response.statusText)
      
      if (response.status === 200) {
        return { success: true }
      } else {
        const errorText = await response.text()
        return { 
          success: false, 
          error: `删除失败: HTTP ${response.status} - ${errorText.substring(0, 100)}`
        }
      }
      
    } catch (error: any) {
      console.error('删除文件异常:', error)
      return { 
        success: false, 
        error: `删除操作失败: ${error.message}` 
      }
    }
  }

  /**
   * 获取删除API的URL
   */
  private getDeleteUrl(region: string): string {
    const regionHosts: { [key: string]: string } = {
      'z0': 'rs.qiniu.com',    // 华东
      'z1': 'rs-z1.qiniu.com', // 华北  
      'z2': 'rs-z2.qiniu.com', // 华南
      'na0': 'rs-na0.qiniu.com', // 北美
      'as0': 'rs-as0.qiniu.com', // 东南亚
    }
    
    const host = regionHosts[region] || 'rs.qiniu.com'
    return `https://${host}`
  }

  /**
   * 获取Bucket信息API的URL
   */
  private getBucketInfoUrl(region: string): string {
    const regionHosts: { [key: string]: string } = {
      'z0': 'rs.qiniu.com',    // 华东
      'z1': 'rs-z1.qiniu.com', // 华北  
      'z2': 'rs-z2.qiniu.com', // 华南
      'na0': 'rs-na0.qiniu.com', // 北美
      'as0': 'rs-as0.qiniu.com', // 东南亚
    }
    
    const host = regionHosts[region] || 'rs.qiniu.com'
    return `https://${host}/buckets`
  }

  /**
   * 生成管理API访问令牌
   */
  private generateAccessToken(config: QiniuConfig, method: string, path: string, body?: string): string {
    try {
      // 根据区域获取正确的host
      const regionHosts: { [key: string]: string } = {
        'z0': 'rs.qiniu.com',    // 华东
        'z1': 'rs-z1.qiniu.com', // 华北  
        'z2': 'rs-z2.qiniu.com', // 华南
        'na0': 'rs-na0.qiniu.com', // 北美
        'as0': 'rs-as0.qiniu.com', // 东南亚
      }
      
      const host = regionHosts[config.qiniu_region] || 'rs.qiniu.com'
      const url = path
      const query = ''
      const contentType = 'application/json'
      
      // 构建签名数据 - 使用正确的Host
      let data = `${method} ${url}`
      if (query) {
        data += `?${query}`
      }
      data += `\nHost: ${host}`
      if (contentType) {
        data += `\nContent-Type: ${contentType}`
      }
      data += '\n\n'
      if (body) {
        data += body
      }

      console.log('生成签名数据:', data)
      console.log('使用的Host:', host)
      console.log('配置的区域:', config.qiniu_region)

      // 使用HMAC-SHA1生成签名
      const signature = crypto
        .createHmac('sha1', config.qiniu_secret_key)
        .update(data, 'utf8')
        .digest('base64')

      return `${config.qiniu_access_key}:${signature}`
    } catch (error) {
      console.error('生成访问令牌失败:', error)
      return ''
    }
  }
}