import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入中文翻译资源
import zhCommon from '@/locales/zh/common.json';
import zhApp from '@/locales/zh/app.json';
import zhComponents from '@/locales/zh/components.json';
import zhMessages from '@/locales/zh/messages.json';

// 导入英文翻译资源
import enCommon from '@/locales/en/common.json';
import enApp from '@/locales/en/app.json';
import enComponents from '@/locales/en/components.json';
import enMessages from '@/locales/en/messages.json';

// 组织翻译资源
const resources = {
  zh: {
    common: zhCommon,
    app: zhApp,
    components: zhComponents,
    messages: zhMessages
  },
  en: {
    common: enCommon,
    app: enApp,
    components: enComponents,
    messages: enMessages
  }
};

// i18n 配置
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // 默认语言和回退策略
    fallbackLng: 'zh',
    
    // 默认命名空间
    defaultNS: 'common',
    
    // 调试模式
    debug: true,
    
    // 语言检测配置
    detection: {
      // 检测优先级：localStorage > navigator语言 > 默认语言
      order: ['localStorage', 'navigator', 'htmlTag'],
      // 缓存用户语言选择
      caches: ['localStorage'],
      // localStorage 键名
      lookupLocalStorage: 'i18nextLng',
      // 转换函数
      convertDetectedLanguage: (lng: string) => {
        // 将所有中文变体转换为 zh
        if (lng.startsWith('zh')) return 'zh';
        // 将所有英文变体转换为 en  
        if (lng.startsWith('en')) return 'en';
        return lng;
      }
    },
    
    // 插值配置
    interpolation: {
      escapeValue: false // React 已经默认转义
    },
    
    // 翻译资源
    resources,
    
    // 返回对象配置
    returnObjects: false,
    
    // 后备配置
    returnEmptyString: false,
    returnNull: false
  });

export default i18n;