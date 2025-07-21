<template>
  <div class="book-card">
    <div class="book-container">
      <div class="book" @click="openDoubanLink">
        <img 
          ref="imageRef"
          :src="imageSrc" 
          :alt="book.title" 
          @error="handleImageError" 
          @load="handleImageLoad"
          :class="{ 'image-loading': isImageLoading }"
        >
        <div v-if="isImageLoading" class="image-placeholder">
          <div class="loading-spinner"></div>
        </div>
        <div class="book-spine"></div>
      </div>
    </div>
    
    <div class="book-info">
      <h3 class="book-title" :title="book.title">{{ book.title }}</h3>
      <p class="book-author">{{ book.author }}</p>
      <p class="book-date">{{ book.publish_date }}</p>
      
      <div class="book-actions">
        <n-button size="small" type="primary" @click="$emit('edit', book)">
          编辑
        </n-button>
        <n-button size="small" type="error" @click="$emit('delete', book.id)">
          删除
        </n-button>
        <n-button size="small" @click="openDownloadLink" v-if="book.download_link">
          下载
        </n-button>
      </div>
      
      <div class="book-description" v-if="book.description">
        <p>{{ book.description }}</p>
      </div>
      
      <div class="extract-code" v-if="book.extract_code">
        <span>提取码: {{ book.extract_code }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { NButton } from 'naive-ui'
import type { Book } from '../types'

interface Props {
  book: Book
  enableLazyLoad?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enableLazyLoad: true
})

defineEmits<{
  edit: [book: Book]
  delete: [id: string]
}>()

const imageRef = ref<HTMLImageElement>()
const imageSrc = ref('')
const isImageLoading = ref(true)
const isVisible = ref(false)

// 默认的占位图片
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIyNSIgdmlld0JveD0iMCAwIDE1MCAyMjUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMjI1IiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9Ijc1IiB5PSIxMTIuNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Yqg6L295LitLi4uPC90ZXh0Pgo8L3N2Zz4K'

let observer: IntersectionObserver | null = null

const setupIntersectionObserver = () => {
  if (!imageRef.value || !props.enableLazyLoad) {
    // 如果不启用懒加载，直接显示图片
    imageSrc.value = props.book.cover || placeholderImage
    isImageLoading.value = false
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && !isVisible.value) {
        isVisible.value = true
        loadImage()
        observer?.unobserve(imageRef.value!)
      }
    },
    {
      rootMargin: '50px' // 提前50px开始加载
    }
  )

  observer.observe(imageRef.value)
}

const loadImage = () => {
  if (props.book.cover) {
    imageSrc.value = props.book.cover
  } else {
    imageSrc.value = placeholderImage
    isImageLoading.value = false
  }
}

const handleImageLoad = (event: Event) => {
  isImageLoading.value = false
  const img = event.target as HTMLImageElement
  console.log('图片加载成功:', img.src)
}

const handleImageError = (event: Event) => {
  isImageLoading.value = false
  imageSrc.value = placeholderImage
  const img = event.target as HTMLImageElement
  console.log('图片加载失败:', img.src)
}

const openDoubanLink = () => {
  if (props.book.douban_url) {
    if (window.electronAPI && window.electronAPI.openExternalLink) {
      window.electronAPI.openExternalLink(props.book.douban_url)
    } else {
      window.open(props.book.douban_url, '_blank')
    }
  }
}

const openDownloadLink = () => {
  if (props.book.download_link) {
    if (window.electronAPI && window.electronAPI.openExternalLink) {
      window.electronAPI.openExternalLink(props.book.download_link)
    } else {
      window.open(props.book.download_link, '_blank')
    }
  }
}

onMounted(() => {
  // 初始设置占位图片
  imageSrc.value = placeholderImage
  
  if (props.enableLazyLoad) {
    setupIntersectionObserver()
  } else {
    loadImage()
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.book-card {
  background: var(--n-color);
  border-radius: 12px;
  box-shadow: var(--n-box-shadow);
  transition: all 0.3s ease;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 100%;
  border: 1px solid var(--n-border-color, transparent);
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.book-container {
  position: relative;
  padding: 20px 20px 10px;
  display: flex;
  justify-content: center;
  background: var(--n-color-hover, linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%));
}

.book {
  position: relative;
  width: min(120px, 80%);
  height: 180px;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
  margin: 0 auto;
}

/* 响应式书本大小 */
@media (max-width: 200px) {
  .book {
    width: 80px;
    height: 120px;
  }
}

@media (min-width: 201px) and (max-width: 300px) {
  .book {
    width: 100px;
    height: 150px;
  }
}

.book:hover {
  transform: rotateY(-15deg) rotateX(5deg);
}

.book img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: box-shadow 0.3s ease, opacity 0.3s ease;
}

.book img.image-loading {
  opacity: 0.7;
}

.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 4px;
  z-index: 1;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid #666;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.book:hover img {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.book-spine {
  position: absolute;
  top: 0;
  right: -8px;
  width: 8px;
  height: 100%;
  background: linear-gradient(90deg, #ddd 0%, #bbb 50%, #999 100%);
  transform: rotateY(90deg);
  transform-origin: left;
  border-radius: 0 4px 4px 0;
}

.book-info {
  padding: 15px 20px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.book-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--n-title-text-color);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-author {
  font-size: 14px;
  color: var(--n-text-color);
  margin: 0 0 4px 0;
}

.book-date {
  font-size: 12px;
  color: var(--n-text-color-3);
  margin: 0 0 15px 0;
}

.book-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.book-description {
  font-size: 13px;
  color: var(--n-text-color);
  line-height: 1.5;
  margin-bottom: 10px;
  flex: 1;
}

.book-description p {
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.extract-code {
  font-size: 12px;
  color: var(--n-info-color);
  background: var(--n-info-color-suppl, rgba(32, 128, 240, 0.16));
  padding: 4px 8px;
  border-radius: 4px;
  text-align: center;
}

</style>