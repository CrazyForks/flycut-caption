# 消息中心使用说明

消息中心系统已成功集成到应用中，提供统一的消息通知和管理功能。

## 功能概览

### 🔔 Toast 通知
- **即时通知**: 操作完成时立即显示Toast提示
- **自动消失**: 默认4秒后自动关闭（错误消息6秒，警告5秒）
- **动画效果**: 滑入动画和进度条
- **操作按钮**: 可添加操作按钮进行快速响应

### 📋 消息中心面板
- **消息历史**: 保存所有通知消息的历史记录
- **未读提醒**: 红色徽章显示未读消息数量
- **分类筛选**: 按消息类型（成功、错误、警告、信息）筛选
- **搜索功能**: 支持按标题和内容搜索消息
- **批量操作**: 全部标记已读、清空消息等

## 如何使用

### 1. 基本用法

```typescript
import { useShowSuccess, useShowError, useShowWarning, useShowInfo } from '@/stores/messageStore';

function YourComponent() {
  const showSuccess = useShowSuccess();
  const showError = useShowError();
  const showWarning = useShowWarning();
  const showInfo = useShowInfo();

  const handleSuccess = () => {
    showSuccess('操作成功', '数据已保存');
  };

  const handleError = () => {
    showError('操作失败', '请检查网络连接');
  };

  // ...
}
```

### 2. 高级用法

```typescript
import { useShowToast, useAddMessage } from '@/stores/messageStore';

function YourComponent() {
  const showToast = useShowToast();
  const addMessage = useAddMessage();

  // 带操作按钮的Toast
  const showToastWithAction = () => {
    showToast({
      type: 'warning',
      title: '存在未保存的更改',
      content: '确定要离开此页面吗？',
      duration: 0, // 不自动关闭
      action: {
        label: '保存并离开',
        handler: () => {
          // 执行保存操作
          console.log('保存数据...');
        }
      }
    });
  };

  // 持久化消息（在消息中心置顶显示）
  const addPersistentMessage = () => {
    addMessage({
      type: 'info',
      title: '系统维护通知',
      content: '系统将于今晚12点进行维护，预计持续2小时',
      persistent: true,
      action: {
        label: '了解详情',
        handler: () => {
          // 跳转到详情页
        }
      }
    });
  };
}
```

### 3. 获取消息状态

```typescript
import { useMessages, useUnreadCount } from '@/stores/messageStore';

function MessageStatusComponent() {
  const messages = useMessages();
  const unreadCount = useUnreadCount();

  return (
    <div>
      <p>总消息数: {messages.length}</p>
      <p>未读消息: {unreadCount}</p>
    </div>
  );
}
```

## 消息类型

- **success** 🟢: 成功操作（绿色）
- **error** 🔴: 错误信息（红色）  
- **warning** 🟡: 警告提示（黄色）
- **info** 🔵: 一般信息（蓝色）

## 已集成的功能

### ASR 面板
- ✅ 模型加载成功/失败提示
- ✅ 语音识别完成通知
- ✅ 错误状态提醒

### 待集成的组件
- [ ] 文件上传成功/失败
- [ ] 视频处理进度通知
- [ ] 导出功能状态
- [ ] 网络连接状态
- [ ] 存储空间提醒

## UI 位置

- **Toast通知**: 屏幕右上角悬浮显示
- **消息中心按钮**: 顶部标题栏右侧，铃铛图标
- **消息中心面板**: 点击铃铛按钮弹出，右侧悬浮面板

## 注意事项

1. **⚠️ 避免无限循环**: 必须使用独立的选择器（如 `useShowSuccess()`），**绝对不要**使用返回对象的选择器（如 `useMessageActions()`），这会造成无限循环渲染
2. **性能**: 每个选择器都是独立的，不会创建新的对象引用
3. **持久化**: 消息仅在当前会话中保存
4. **限制**: 建议控制消息历史数量，避免内存过大  
5. **可访问性**: 所有组件支持键盘导航和屏幕阅读器

### ❌ 错误用法
```typescript
// 这会造成无限循环！
const { showSuccess, showError } = useMessageActions();
```

### ✅ 正确用法
```typescript
// 使用独立选择器
const showSuccess = useShowSuccess();
const showError = useShowError();
```

## 自定义扩展

可以通过修改以下文件来扩展功能：
- `src/types/message.ts` - 消息类型定义
- `src/stores/messageStore.ts` - 状态管理逻辑
- `src/components/MessageCenter/` - UI组件
- `src/index.css` - 样式和动画