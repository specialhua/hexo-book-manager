import { GlobalThemeOverrides } from 'naive-ui'

// 浅色主题配置
export const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#18a058',
    primaryColorHover: '#36ad6a',
    primaryColorPressed: '#0c7a43',
    primaryColorSuppl: '#36ad6a',
    
    errorColor: '#d03050',
    errorColorHover: '#de576d',
    errorColorPressed: '#ab1f3f',
    
    warningColor: '#f0a020',
    warningColorHover: '#fcb040',
    warningColorPressed: '#c97c10',
    
    infoColor: '#2080f0',
    infoColorHover: '#4098fc',
    infoColorPressed: '#1060c9',
    
    successColor: '#18a058',
    successColorHover: '#36ad6a',
    successColorPressed: '#0c7a43'
  },
  Card: {
    color: '#ffffff',
    colorHover: '#ffffff',
    borderColor: '#e5e5e5',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  },
  Button: {
    borderRadius: '6px'
  },
  Alert: {
    borderRadius: '8px',
    color: '#fafafa',
    titleTextColor: '#333333',
    contentTextColor: '#666666',
    iconColor: '#18a058'
  },
  Pagination: {
    itemColorHover: '#f5f5f5',
    itemColorActive: '#18a058',
    itemColorActiveHover: '#36ad6a'
  }
}

// 深色主题配置 - One Dark 风格
export const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#56b6c2',
    primaryColorHover: '#61afef',
    primaryColorPressed: '#4b9aa8',
    primaryColorSuppl: '#61afef',
    
    errorColor: '#e06c75',
    errorColorHover: '#e88080',
    errorColorPressed: '#be5046',
    
    warningColor: '#e5c07b',
    warningColorHover: '#f2c97d',
    warningColorPressed: '#d19a66',
    
    infoColor: '#61afef',
    infoColorHover: '#70c0e8',
    infoColorPressed: '#5399d3',
    
    successColor: '#98c379',
    successColorHover: '#a6d189',
    successColorPressed: '#89b56a',
    
    // One Dark 背景色系
    baseColor: '#21252b',
    bodyColor: '#282c34',
    popoverColor: '#2c313c',
    cardColor: '#282c34',
    modalColor: '#2c313c',
    
    borderColor: '#434b56',
    tableBorderColor: '#434b56',
    hoverColor: 'rgba(97, 175, 239, 0.1)',
    
    // One Dark 文本颜色
    textColorBase: '#abb2bf',
    textColor1: '#abb2bf',
    textColor2: 'rgba(171, 178, 191, 0.8)',
    textColor3: 'rgba(171, 178, 191, 0.5)',
    
    placeholderColor: 'rgba(171, 178, 191, 0.4)',
    iconColor: 'rgba(171, 178, 191, 0.7)'
  },
  Card: {
    color: '#282c34',
    colorHover: '#2c313c',
    borderColor: '#434b56',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    titleTextColor: '#abb2bf',
    textColor: 'rgba(171, 178, 191, 0.8)'
  },
  Button: {
    borderRadius: '6px',
    // 主要按钮
    colorPrimary: '#56b6c2',
    colorHoverPrimary: '#61afef',
    colorPressedPrimary: '#4b9aa8',
    textColorPrimary: '#282c34',
    textColorHoverPrimary: '#282c34',
    textColorPressedPrimary: '#282c34',
    
    // 错误按钮
    colorError: '#e06c75',
    colorHoverError: '#e88080',
    colorPressedError: '#be5046',
    textColorError: '#282c34',
    textColorHoverError: '#282c34',
    textColorPressedError: '#282c34',
    
    // 普通按钮
    color: 'rgba(171, 178, 191, 0.1)',
    colorHover: 'rgba(171, 178, 191, 0.15)',
    colorPressed: 'rgba(171, 178, 191, 0.05)',
    textColor: '#abb2bf',
    textColorHover: '#abb2bf',
    textColorPressed: 'rgba(171, 178, 191, 0.8)'
  },
  Alert: {
    borderRadius: '8px',
    color: '#2c313c',
    titleTextColor: '#abb2bf',
    contentTextColor: 'rgba(171, 178, 191, 0.8)',
    iconColor: 'rgba(171, 178, 191, 0.7)',
    
    // 成功提示
    colorSuccess: 'rgba(152, 195, 121, 0.16)',
    titleTextColorSuccess: '#abb2bf',
    contentTextColorSuccess: 'rgba(171, 178, 191, 0.8)',
    iconColorSuccess: '#98c379',
    borderSuccess: '1px solid rgba(152, 195, 121, 0.3)',
    
    // 警告提示
    colorWarning: 'rgba(229, 192, 123, 0.16)',
    titleTextColorWarning: '#abb2bf',
    contentTextColorWarning: 'rgba(171, 178, 191, 0.8)',
    iconColorWarning: '#e5c07b',
    borderWarning: '1px solid rgba(229, 192, 123, 0.3)',
    
    // 错误提示
    colorError: 'rgba(224, 108, 117, 0.16)',
    titleTextColorError: '#abb2bf',
    contentTextColorError: 'rgba(171, 178, 191, 0.8)',
    iconColorError: '#e06c75',
    borderError: '1px solid rgba(224, 108, 117, 0.3)',
    
    // 信息提示
    colorInfo: 'rgba(97, 175, 239, 0.16)',
    titleTextColorInfo: '#abb2bf',
    contentTextColorInfo: 'rgba(171, 178, 191, 0.8)',
    iconColorInfo: '#61afef',
    borderInfo: '1px solid rgba(97, 175, 239, 0.3)'
  },
  Pagination: {
    // 基础颜色
    itemColor: 'transparent',
    itemColorHover: 'rgba(171, 178, 191, 0.1)',
    itemColorPressed: 'rgba(171, 178, 191, 0.05)',
    itemColorActive: '#56b6c2',
    itemColorActiveHover: '#61afef',
    itemColorActivePressed: '#4b9aa8',
    itemColorDisabled: 'transparent',
    
    // 文字颜色
    itemTextColor: '#abb2bf',
    itemTextColorHover: '#abb2bf',
    itemTextColorPressed: 'rgba(171, 178, 191, 0.8)',
    itemTextColorActive: '#282c34',
    itemTextColorActiveHover: '#282c34',
    itemTextColorDisabled: 'rgba(171, 178, 191, 0.3)',
    
    // 边框
    itemBorder: '1px solid #434b56',
    itemBorderHover: '1px solid rgba(171, 178, 191, 0.3)',
    itemBorderPressed: '1px solid rgba(171, 178, 191, 0.05)',
    itemBorderActive: '1px solid #56b6c2',
    itemBorderDisabled: '1px solid #434b56',
    itemBorderRadius: '6px',
    
    // 快速跳转输入框
    inputColor: '#2c313c',
    inputColorActive: '#2c313c',
    inputBorder: '1px solid #434b56',
    inputBorderActive: '1px solid #56b6c2',
    inputTextColor: '#abb2bf',
    
    // 分页大小选择器
    selectColor: '#2c313c',
    selectTextColor: '#abb2bf',
    selectBorder: '1px solid #434b56',
    selectBorderActive: '1px solid #56b6c2',
    
    // 省略号颜色
    jumperTextColor: 'rgba(171, 178, 191, 0.5)',
    
    // 分页器背景（如果需要）
    color: 'transparent',
    
    // 前进后退按钮
    buttonColor: 'transparent',
    buttonColorHover: 'rgba(171, 178, 191, 0.1)',
    buttonColorPressed: 'rgba(171, 178, 191, 0.05)',
    buttonTextColor: '#abb2bf',
    buttonTextColorHover: '#abb2bf',
    buttonTextColorPressed: 'rgba(171, 178, 191, 0.8)',
    buttonBorder: '1px solid #434b56',
    buttonBorderHover: '1px solid rgba(171, 178, 191, 0.3)',
    buttonBorderPressed: '1px solid rgba(171, 178, 191, 0.05)'
  },
  DataTable: {
    thColor: '#2c313c',
    tdColor: '#282c34',
    borderColor: '#434b56',
    thTextColor: '#abb2bf',
    tdTextColor: 'rgba(171, 178, 191, 0.8)'
  },
  Input: {
    color: '#2c313c',
    colorFocus: '#2c313c',
    textColor: '#abb2bf',
    placeholderColor: 'rgba(171, 178, 191, 0.4)',
    border: '1px solid #434b56',
    borderFocus: '1px solid #56b6c2',
    borderHover: '1px solid rgba(171, 178, 191, 0.3)'
  },
  Select: {
    color: '#2c313c',
    menuColor: '#2c313c',
    optionColorHover: 'rgba(171, 178, 191, 0.1)',
    optionColorActive: 'rgba(86, 182, 194, 0.16)',
    optionTextColor: '#abb2bf'
  },
  Modal: {
    color: '#2c313c',
    textColor: '#abb2bf'
  },
  Dialog: {
    color: '#2c313c',
    textColor: '#abb2bf',
    titleTextColor: '#abb2bf',
    contentTextColor: 'rgba(171, 178, 191, 0.8)'
  },
  Layout: {
    headerColor: '#282c34',
    color: '#282c34',
    siderColor: '#282c34',
    footerColor: '#282c34'
  },
  Tabs: {
    tabTextColorActiveBar: '#56b6c2',
    tabTextColorHoverBar: '#abb2bf',
    barColor: '#56b6c2'
  },
  Switch: {
    railColorActive: '#56b6c2',
    buttonColor: '#ffffff'
  },
  Tooltip: {
    color: '#2c313c',
    textColor: '#abb2bf',
    arrowColor: '#2c313c'
  }
}

// 主题配置映射
export const themeConfig = {
  light: {
    theme: null,
    themeOverrides: lightThemeOverrides
  },
  dark: {
    theme: 'dark' as const,
    themeOverrides: darkThemeOverrides
  }
}