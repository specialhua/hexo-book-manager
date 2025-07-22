<template>
  <n-layout>
    <n-layout-header style="padding: 24px; border-bottom: 1px solid #e0e0e0;">
      <n-space align="center" justify="space-between">
        <n-h2 style="margin: 0;">书籍管理工具</n-h2>
        <n-space>
          <n-button @click="showThemeResource = true" quaternary>
            <template #icon>
              <n-icon>
                <FileIcon />
              </n-icon>
            </template>
            另存CSS和JS
          </n-button>
          <n-button @click="showSettings = true" quaternary>
            <template #icon>
              <n-icon>
                <SettingsIcon />
              </n-icon>
            </template>
            设置
          </n-button>
          <n-button @click="$emit('toggleTheme')" quaternary>
            <template #icon>
              <n-icon>
                <component :is="theme ? SunIcon : MoonIcon" />
              </n-icon>
            </template>
            {{ theme ? '浅色' : '深色' }}
          </n-button>
        </n-space>
      </n-space>
    </n-layout-header>
    
    <n-layout-content content-style="padding: 24px; width: 100%; max-width: none;">
      <BookManager 
        :image-bed-config="imageBedConfig" 
        :isbn-api-config="isbnApiConfig"
      />
    </n-layout-content>
  </n-layout>
  
  <!-- 统一设置界面 -->
  <AppSettings 
    v-model:show="showSettings" 
    :image-bed-config="imageBedConfig"
    @update-image-bed-config="updateImageBedConfig"
    @update-isbn-api-config="updateIsbnApiConfig"
    @update-settings="handleSettingsUpdate"
  />
  
  <!-- 主题资源界面 -->
  <ThemeResourceModal 
    v-model:show="showThemeResource"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { type GlobalTheme, useMessage } from 'naive-ui'
import BookManager from './BookManager.vue'
import AppSettings from './AppSettings.vue'
import ThemeResourceModal from './ThemeResourceModal.vue'
import { SunIcon, MoonIcon, SettingsIcon, FileIcon } from './Icons'
import { type ImageBedConfig } from '../utils/imageBed'
import { type IsbnApiConfig } from '../types'

interface Props {
  theme: GlobalTheme | null
  imageBedConfig: ImageBedConfig
  isbnApiConfig: IsbnApiConfig
}

interface AppSettings {
  imageBed: ImageBedConfig
  backup: {
    autoBackup: boolean
    folderPath: string
    maxBackups: number
    retentionDays: number
  }
  general: {
    defaultViewMode: 'grid' | 'table'
  }
  bookApi: {
    apiKey: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggleTheme: []
  updateImageBedConfig: [config: ImageBedConfig]
  updateIsbnApiConfig: [config: IsbnApiConfig]
}>()

const message = useMessage()
const showSettings = ref(false)
const showThemeResource = ref(false)

// 更新图床配置
const updateImageBedConfig = (config: ImageBedConfig) => {
  emit('updateImageBedConfig', config)
}

// 更新ISBN API配置
const updateIsbnApiConfig = (config: IsbnApiConfig) => {
  emit('updateIsbnApiConfig', config)
}

// 处理设置更新
const handleSettingsUpdate = (settings: AppSettings) => {
  console.log('应用设置已更新:', settings)
  // 这里可以添加更多的设置处理逻辑
  // 比如应用主题设置、视图模式等
}
</script>