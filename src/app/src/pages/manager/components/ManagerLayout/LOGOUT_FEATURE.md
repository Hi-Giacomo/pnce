# 退出登录功能说明

## ✅ 已完成的功能

### 1. 顶部退出按钮

在 Manager 布局的右上角添加了退出登录按钮，位于用户名旁边。

**位置**: 顶部导航栏右侧
**图标**: 退出箭头图标
**样式**: 红色主题，与整体设计风格一致

### 2. 功能特性

- ✅ **点击退出** - 点击按钮即可退出登录
- ✅ **加载状态** - 退出过程中显示"退出中..."文字
- ✅ **防止重复点击** - 退出过程中禁用按钮
- ✅ **清除状态** - 自动清除用户角色和权限
- ✅ **跳转登录页** - 退出后自动跳转到登录页面
- ✅ **错误处理** - 即使 API 失败也会清除本地状态

### 3. 用户体验

#### 正常流程
```
1. 用户点击右上角退出按钮
2. 按钮显示"退出中..."并禁用
3. 调用 Mock API 登出
4. 清除用户状态（roles, permissions, isLoggedIn）
5. 跳转到登录页 /login
```

#### 视觉效果
- 默认状态：淡红色背景 + 退出图标
- 悬停效果：深红色背景 + 图标右移动画
- 点击效果：缩小动画
- 禁用状态：半透明 + 不可点击

---

## 🎨 样式设计

### 按钮样式

```scss
.logout-btn {
  background: rgba(255, 77, 79, 0.1);    // 淡红色背景
  border: 1px solid rgba(255, 77, 79, 0.2);
  color: rgba(255, 77, 79, 0.85);        // 红色文字
  
  &:hover {
    background: rgba(255, 77, 79, 0.2);  // 深红色背景
    box-shadow: 0 0 12px rgba(255, 77, 79, 0.3);  // 发光效果
    transform: scale(1.05);              // 放大效果
  }
  
  &:active {
    transform: scale(0.95);              // 点击缩小
  }
  
  &:disabled {
    opacity: 0.5;                        // 禁用时半透明
    cursor: not-allowed;
  }
}
```

### 图标动画

```scss
&:hover svg {
  transform: translateX(2px);  // 图标向右移动
}
```

---

## 💻 代码实现

### 核心逻辑

```typescript
// 退出登录
const handleLogout = async () => {
  if (isLoggingOut) return;
  
  setIsLoggingOut(true);
  
  try {
    // 调用 Mock API 登出
    await mockApi.auth.logout();
    
    // 清除用户状态
    root.user.logout();
    notify();
    
    // 跳转到登录页
    navigate('/login');
  } catch (error) {
    console.error('退出登录失败:', error);
    // 即使失败也清除本地状态
    root.user.logout();
    notify();
    navigate('/login');
  } finally {
    setIsLoggingOut(false);
  }
};
```

### 状态管理

```typescript
const [isLoggingOut, setIsLoggingOut] = useState(false);

// 按钮禁用状态
<button
  className="logout-btn"
  onClick={handleLogout}
  disabled={isLoggingOut}
  title="退出登录"
>
  <svg>...</svg>
  {isLoggingOut ? '退出中...' : ''}
</button>
```

---

## 🔧 技术细节

### 1. 依赖导入

```typescript
import { root, notify } from '../../../../hooks';
import { mockApi } from '../../../../services/mock/mock-api';
```

### 2. 用户状态清除

```typescript
root.user.logout();  // 清除 roles, permissions, isLoggedIn
notify();            // 触发状态更新，重新渲染
```

### 3. Mock API 调用

```typescript
await mockApi.auth.logout();
// 返回: { code: 200, message: '登出成功', data: {...} }
```

### 4. 路由跳转

```typescript
navigate('/login');  // 使用 React Router 跳转
```

---

## 📍 文件修改清单

### 修改的文件

1. **ManagerLayout.tsx**
   - 添加 `isLoggingOut` 状态
   - 添加 `handleLogout` 函数
   - 添加退出按钮 UI
   - 导入 `notify` 和 `mockApi`
   - 显示动态用户名

2. **index.scss**
   - 添加 `.logout-btn` 样式
   - 添加悬停、激活、禁用状态
   - 添加图标动画

---

## 🎯 使用方式

### 基本使用

1. 登录系统（任意账号）
2. 进入 Manager 页面
3. 查看右上角的用户名和退出按钮
4. 点击退出按钮
5. 自动跳转到登录页

### 测试不同账号

```
admin     → 点击右上角退出 → 跳转到登录页
developer → 点击右上角退出 → 跳转到登录页
viewer    → 点击右上角退出 → 跳转到登录页
```

---

## 🔍 功能验证

### 验证步骤

1. **登录验证**
   ```
   - 使用 admin/123456 登录
   - 确认进入仪表板
   - 查看右上角显示 "admin"
   ```

2. **退出验证**
   ```
   - 点击退出按钮
   - 观察按钮显示"退出中..."
   - 确认跳转到登录页
   - 尝试访问 /manager/dashboard
   - 应该被重定向到登录页（权限守卫）
   ```

3. **状态清除验证**
   ```
   - 退出后检查 root.user
   - roles 应该为空数组 []
   - permissions 应该为空数组 []
   - isLoggedIn 应该为 false
   - username 应该为空字符串 ""
   ```

---

## ⚙️ 自定义配置

### 修改按钮文本

```typescript
{isLoggingOut ? '正在退出...' : ''}
```

### 修改跳转路径

```typescript
navigate('/login');  // 改为其他路径
```

### 添加确认对话框

```typescript
const handleLogout = async () => {
  if (!confirm('确定要退出登录吗？')) return;
  
  // ... 退出逻辑
};
```

### 修改样式颜色

编辑 `index.scss` 中的颜色值：

```scss
.logout-btn {
  background: rgba(255, 77, 79, 0.1);  // 修改这里
  border-color: rgba(255, 77, 79, 0.2);
  color: rgba(255, 77, 79, 0.85);
}
```

---

## 🐛 常见问题

### Q1: 点击退出没有反应？

**检查**:
1. 控制台是否有错误
2. Mock API 是否正常
3. 网络连接是否正常

**解决**:
```typescript
// 添加调试日志
console.log('开始退出...');
await mockApi.auth.logout();
console.log('API 调用完成');
```

### Q2: 退出后还能访问受保护页面？

**原因**: 浏览器缓存或状态未清除

**解决**:
```typescript
// 确保调用了 notify()
root.user.logout();
notify();  // 这行很重要！
navigate('/login');
```

### Q3: 按钮样式不显示？

**检查**:
1. SCSS 文件是否正确导入
2. 类名是否匹配
3. 样式是否被覆盖

**解决**:
```bash
# 重启开发服务器
npm run dev
```

---

## 🚀 未来优化建议

### 1. 添加确认对话框

```typescript
import { Modal } from '@/components';

const showLogoutConfirm = () => {
  Modal.confirm({
    title: '确认退出',
    content: '确定要退出登录吗？',
    onOk: handleLogout,
  });
};
```

### 2. 添加退出动画

```scss
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.logout-animation {
  animation: fadeOut 0.3s ease;
}
```

### 3. 保存退出前的页面

```typescript
// 保存当前路径
sessionStorage.setItem('lastPath', location.pathname);

// 登录后恢复
const lastPath = sessionStorage.getItem('lastPath');
if (lastPath) {
  navigate(lastPath);
}
```

### 4. 添加退出日志

```typescript
console.log(`用户 ${user.username} 于 ${new Date().toISOString()} 退出登录`);
```

---

## 📝 总结

退出登录功能已完整实现，包括：

- ✅ UI 按钮（图标 + 文字）
- ✅ 交互逻辑（点击、禁用、加载）
- ✅ 状态管理（清除用户信息）
- ✅ 路由跳转（回到登录页）
- ✅ 样式设计（红色主题、动画效果）
- ✅ 错误处理（API 失败也能退出）

现在用户可以方便地从任何页面退出登录，系统会正确清除所有状态并重定向到登录页面。

---

**更新日期**: 2026-04-08  
**版本**: 1.0.0
