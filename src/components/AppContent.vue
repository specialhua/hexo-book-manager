<template>
  <div id="app">
    <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
      <n-message-provider>
        <n-dialog-provider>
          <AppMain 
            :theme="theme" 
            :image-bed-config="imageBedConfig"
            :isbn-api-config="isbnApiConfig"
            @toggle-theme="toggleTheme"
            @update-image-bed-config="updateImageBedConfig"
            @update-isbn-api-config="updateIsbnApiConfig"
          />
        </n-dialog-provider>
      </n-message-provider>
    </n-config-provider>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { darkTheme, type GlobalTheme, type GlobalThemeOverrides } from 'naive-ui'
import AppMain from './AppMain.vue'
import { ImageBedType, type ImageBedConfig } from '../utils/imageBed'
import { type IsbnApiConfig } from '../types'
import { storage } from '../utils/browserAPI'
import { themeConfig } from '../utils/themeConfig'

const theme = ref<GlobalTheme | null>(null)
const themeOverrides = ref<GlobalThemeOverrides>({})
const isDark = ref(false)

// 图床配置
const imageBedConfig = ref<ImageBedConfig>({
  type: ImageBedType.QINIU,
  config: {
    qiniu_access_key: '',
    qiniu_secret_key: '',
    qiniu_bucket: '',
    qiniu_domain: '',
    qiniu_region: 'z0',
    qiniu_path: 'book-covers'
  }
})

// ISBN API配置
const isbnApiConfig = ref<IsbnApiConfig>({
  apiKey: ''
})

const toggleTheme = () => {
  isDark.value = !isDark.value
  applyTheme()
  storage.save('isDarkTheme', isDark.value)
}

const applyTheme = () => {
  if (isDark.value) {
    theme.value = darkTheme
    themeOverrides.value = themeConfig.dark.themeOverrides
  } else {
    theme.value = null
    themeOverrides.value = themeConfig.light.themeOverrides
  }
}

const updateImageBedConfig = (newConfig: ImageBedConfig) => {
  imageBedConfig.value = newConfig
}

const updateIsbnApiConfig = (newConfig: IsbnApiConfig) => {
  isbnApiConfig.value = newConfig
}

// 加载保存的配置
const loadSavedConfig = () => {
  const config = storage.load<ImageBedConfig>('imageBedConfig', null)
  if (config) {
    imageBedConfig.value = config
  }
  
  const isbnConfig = storage.load<IsbnApiConfig>('isbnApiConfig', null)
  if (isbnConfig) {
    isbnApiConfig.value = isbnConfig
  }
  
  // 加载主题设置
  const savedDarkMode = storage.load<boolean>('isDarkTheme', false)
  isDark.value = savedDarkMode
  applyTheme()
}

onMounted(() => {
  loadSavedConfig()
})
</script>

<style scoped>
#app {
  height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
</style>