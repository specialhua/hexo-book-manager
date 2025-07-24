import { createApp } from 'vue'
import App from './App.vue'

// 导入错误日志系统
import './utils/errorLogger'

// 导入并初始化配置系统
import { configAPI } from './utils/configAPI'

// 初始化配置系统（包括数据迁移）
async function initializeApp() {
  try {
    console.log('正在初始化配置系统...')
    await configAPI.initialize()
    console.log('配置系统初始化完成')
  } catch (error) {
    console.error('配置系统初始化失败:', error)
  }
}

// 按需导入 Naive UI 组件
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NSpace,
  NH2,
  NH3,
  NButton,
  NButtonGroup,
  NIcon,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NRadioGroup,
  NRadioButton,
  NInput,
  NInputGroup,
  NSelect,
  NDivider,
  NSpin,
  NEmpty,
  NAlert,
  NDescriptions,
  NDescriptionsItem,
  NCode,
  // 新增的组件
  NTabs,
  NTabPane,
  NSwitch,
  NInputNumber,
  NTooltip,
  NText,
  NEllipsis
} from 'naive-ui'

const app = createApp(App)

// 注册 Naive UI 组件
app.component('NConfigProvider', NConfigProvider)
app.component('NMessageProvider', NMessageProvider)
app.component('NDialogProvider', NDialogProvider)
app.component('NLayout', NLayout)
app.component('NLayoutHeader', NLayoutHeader)
app.component('NLayoutContent', NLayoutContent)
app.component('NSpace', NSpace)
app.component('NH2', NH2)
app.component('NH3', NH3)
app.component('NButton', NButton)
app.component('NButtonGroup', NButtonGroup)
app.component('NIcon', NIcon)
app.component('NDataTable', NDataTable)
app.component('NModal', NModal)
app.component('NForm', NForm)
app.component('NFormItem', NFormItem)
app.component('NRadioGroup', NRadioGroup)
app.component('NRadioButton', NRadioButton)
app.component('NInput', NInput)
app.component('NInputGroup', NInputGroup)
app.component('NSelect', NSelect)
app.component('NDivider', NDivider)
app.component('NSpin', NSpin)
app.component('NEmpty', NEmpty)
app.component('NAlert', NAlert)
app.component('NDescriptions', NDescriptions)
app.component('NDescriptionsItem', NDescriptionsItem)
app.component('NCode', NCode)
// 注册新增的组件
app.component('NTabs', NTabs)
app.component('NTabPane', NTabPane)
app.component('NSwitch', NSwitch)
app.component('NInputNumber', NInputNumber)
app.component('NTooltip', NTooltip)
app.component('NText', NText)
app.component('NEllipsis', NEllipsis)

// 初始化应用
initializeApp().then(() => {
  app.mount('#app')
  console.log('应用启动完成')
}).catch(error => {
  console.error('应用初始化失败:', error)
  // 即使初始化失败，也启动应用（降级模式）
  app.mount('#app')
})