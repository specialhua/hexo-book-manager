<template>
  <div>
    <n-form
      ref="formRef"
      :model="formValue"
      :rules="rules"
      label-placement="left"
      label-width="120px"
      require-mark-placement="right-hanging"
      size="medium"
    >
      <n-form-item label="输入方式" path="inputType">
        <n-radio-group v-model:value="formValue.inputType">
          <n-radio-button value="isbn">ISBN</n-radio-button>
          <n-radio-button value="manual">手动输入</n-radio-button>
        </n-radio-group>
      </n-form-item>

      <n-form-item 
        v-if="formValue.inputType !== 'manual'"
        :label="getInputLabel()" 
        path="searchInput"
      >
        <n-input-group>
          <n-input
            v-model:value="formValue.searchInput"
            :placeholder="getInputPlaceholder()"
            clearable
          />
          <n-button 
            type="primary" 
            @click="fetchBookInfo"
            :loading="fetching"
          >
            获取信息
          </n-button>
        </n-input-group>
        <template #feedback>
          <n-text depth="3" style="font-size: 12px;">
            {{ getInputHint() }}
          </n-text>
        </template>
      </n-form-item>

      <n-divider />

      <n-form-item label="书名" path="title">
        <n-input v-model:value="formValue.title" placeholder="请输入书名" />
      </n-form-item>

      <n-form-item label="作者" path="author">
        <n-input v-model:value="formValue.author" placeholder="请输入作者" />
      </n-form-item>

      <n-form-item label="ISBN" path="isbn">
        <n-input v-model:value="formValue.isbn" placeholder="请输入ISBN" />
      </n-form-item>

      <n-form-item label="豆瓣链接" path="douban_url">
        <n-input v-model:value="formValue.douban_url" placeholder="请输入豆瓣链接" />
      </n-form-item>

      <n-form-item label="出版日期" path="publish_date">
        <n-input v-model:value="formValue.publish_date" placeholder="YYYY-MM-DD" />
      </n-form-item>

      <n-form-item label="封面图片" path="cover">
        <n-input-group>
          <n-input
            v-model:value="formValue.cover"
            placeholder="封面图片URL"
            readonly
          />
          <n-button @click="uploadCover" :loading="uploading">
            上传图片
          </n-button>
        </n-input-group>
      </n-form-item>

      <n-form-item label="个人评价" path="description">
        <n-input
          v-model:value="formValue.description"
          type="textarea"
          placeholder="请输入个人评价"
          :rows="3"
        />
      </n-form-item>

      <n-form-item label="下载链接" path="download_link">
        <n-input v-model:value="formValue.download_link" placeholder="请输入下载链接" />
      </n-form-item>

      <n-form-item label="提取码" path="extract_code">
        <n-input v-model:value="formValue.extract_code" placeholder="请输入提取码" />
      </n-form-item>
    </n-form>

    <n-space justify="end" style="margin-top: 16px;">
      <n-button @click="$emit('cancel')">取消</n-button>
      <n-button type="primary" @click="handleSave" :loading="saving">
        保存
      </n-button>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useMessage, NText } from 'naive-ui'
import type { FormInst } from 'naive-ui'
import type { Book, InputType, IsbnApiConfig } from '../types'
import { getBookByISBN, convertApiBookToBook } from '../utils/doubanAPI'
import { downloadAndUploadImage, uploadImage, type ImageBedConfig } from '../utils/imageBed'
import { selectImage } from '../utils/browserAPI'

// 接收图床和ISBN API配置
const props = defineProps<{
  imageBedConfig: ImageBedConfig
  isbnApiConfig: IsbnApiConfig
}>()

const emit = defineEmits<{
  save: [book: Book]
  cancel: []
}>()

const message = useMessage()
const formRef = ref<FormInst | null>(null)
const fetching = ref(false)
const uploading = ref(false)
const saving = ref(false)

const formValue = reactive({
  inputType: 'isbn' as InputType,
  searchInput: '',
  title: '',
  author: '',
  isbn: '',
  cover: '',
  douban_url: '',
  description: '',
  download_link: '',
  extract_code: '',
  publish_date: ''
})

const rules = {
  title: [{ required: true, message: '请输入书名', trigger: 'blur' }],
  author: [{ required: true, message: '请输入作者', trigger: 'blur' }],
  douban_url: [{ required: true, message: '请输入豆瓣链接', trigger: 'blur' }]
}

const getInputLabel = () => {
  switch (formValue.inputType) {
    case 'isbn': return 'ISBN'
    default: return '输入内容'
  }
}

const getInputPlaceholder = () => {
  switch (formValue.inputType) {
    case 'isbn': return '请输入ISBN号码'
    default: return '请输入内容'
  }
}

const getInputHint = () => {
  switch (formValue.inputType) {
    case 'isbn': return '支持ISBN-10或ISBN-13格式，如：9787544291170'
    default: return ''
  }
}

const fetchBookInfo = async () => {
  if (!formValue.searchInput.trim()) {
    message.warning('请输入ISBN号码')
    return
  }

  fetching.value = true
  try {
    let doubanBook = null
    
    // 只处理ISBN查询
    if (formValue.inputType === 'isbn') {
      doubanBook = await getBookByISBN(formValue.searchInput, props.isbnApiConfig)
    }
    
    if (doubanBook) {
      const bookData = convertApiBookToBook(doubanBook)
      
      // 如果有封面图片，上传到图床
      if (bookData.cover) {
        message.info('正在上传封面图片到图床...')
        const result = await downloadAndUploadImage(bookData.cover, props.imageBedConfig)
        
        bookData.cover = result.url
        
        if (result.uploadSuccess) {
          message.success('封面图片上传成功')
        } else if (result.fallback) {
          message.warning(`封面图片上传失败，使用原始链接: ${result.error || '未知错误'}`)
          console.error('封面图片上传失败:', result.error)
        }
      }
      
      Object.assign(formValue, bookData)
      message.success('书籍信息获取成功')
    } else {
      message.error('未找到相关书籍信息')
    }
  } catch (error) {
    // 显示具体的错误信息，帮助用户了解问题
    const errorMessage = error.message || '获取书籍信息失败'
    message.error(errorMessage)
    console.error('获取书籍信息失败:', error)
  } finally {
    fetching.value = false
  }
}

const uploadCover = async () => {
  uploading.value = true
  try {
    const imageDataUrl = await selectImage()
    
    // 使用配置的图床上传图片
    message.info('正在上传图片到图床...')
    const result = await uploadImage(imageDataUrl, props.imageBedConfig)
    formValue.cover = result.url
    message.success('图片上传成功')
    
  } catch (error) {
    if (error.message !== '未选择图片') {
      message.error(`图片上传失败: ${error.message}`)
      console.error('图片上传失败:', error)
    }
  } finally {
    uploading.value = false
  }
}

const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true
    
    const book: Book = {
      id: Date.now().toString(),
      title: formValue.title,
      author: formValue.author,
      isbn: formValue.isbn,
      cover: formValue.cover,
      douban_url: formValue.douban_url,
      description: formValue.description,
      download_link: formValue.download_link,
      extract_code: formValue.extract_code,
      publish_date: formValue.publish_date,
      sort_order: 0  // 新书籍默认排序为0，会在BookManager中重新分配
    }
    
    emit('save', book)
  } catch (error) {
    message.error('请完善必填信息')
  } finally {
    saving.value = false
  }
}
</script>