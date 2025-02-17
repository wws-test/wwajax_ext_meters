# U-Network 网络分析工具

<div align="center">
  <img src="./icons/ajax-tools.png" width="300">
  
  [![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/kphegobalneikdjnboeiheiklpbbhncm.svg?logo=Google%20Chrome&logoColor=white&color=blue&style=flat-square)](https://chrome.google.com/webstore/detail/ajax-interceptor-tools/kphegobalneikdjnboeiheiklpbbhncm)
  [![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/kphegobalneikdjnboeiheiklpbbhncm.svg?logo=Google%20Chrome&logoColor=white&color=blue&style=flat-square)](https://chrome.google.com/webstore/detail/ajax-interceptor-tools/kphegobalneikdjnboeiheiklpbbhncm)
</div>

## 🌟 功能特点

### 1. 智能网络分析
- 实时监控和记录网络请求
- Deepseek驱动的场景分析和测试建议
- 自动识别接口依赖关系
- 智能参数提取和关联分析

### 2. 高级请求管理
- 支持拦截和修改 XMLHttpRequest 和 fetch 请求
- 基于正则表达式的请求匹配
- 灵活的请求头和请求体修改
- 支持 404 状态请求的处理

### 3. 响应数据处理
- JSON/JavaScript 格式响应编辑
- Mock.js 语法支持
- 原始请求信息获取
- 灵活的数据模拟场景

### 4. 测试场景管理
- 一键保存测试场景
- AI 驱动的场景分析
- JMeter 脚本自动生成
- 完整的测试覆盖建议

### 5. 开发辅助功能
- 画中画配置界面
- 规则导入/导出
- 分组管理
- 快速请求拦截

## 📦 安装

### Chrome 应用商店安装
访问 [Chrome Web Store](https://chrome.google.com/webstore/detail/ajax-interceptor-tools/kphegobalneikdjnboeiheiklpbbhncm) 安装插件

### 手动安装
1. 下载 [最新版本](https://raw.githubusercontent.com/PengChen96/ajax-tools/master/kphegobalneikdjnboeiheiklpbbhncm.crx)
2. 打开 Chrome 扩展管理页面 (chrome://extensions/)
3. 将下载的 .crx 文件拖入浏览器完成安装

## 🚀 使用指南

### 网络请求监控
1. 打开 Chrome DevTools (F12)
2. 切换到 U-Network 面板
3. 点击录制按钮开始监控网络请求
4. 使用过滤器快速定位目标请求

### 场景分析
1. 在请求列表中选择需要分析的接口
2. 点击"保存测试场景"按钮
3. 等待 AI 完成场景分析
4. 查看分析报告，包含：
   - 接口调用顺序建议
   - 参数依赖关系
   - 测试覆盖建议
   - 性能优化建议

### JMeter 脚本生成
1. 保存测试场景后
2. 点击"生成 JMeter 脚本"按钮
3. 自动生成包含以下配置的脚本：
   - 完整的请求配置
   - 参数关联
   - 断言设置
   - 性能测试参数

### 请求拦截和修改
1. 在请求列表中找到目标请求
2. 点击拦截图标添加拦截规则
3. 在配置面板中设置：
   - 请求 URL 和方法
   - 请求头信息
   - 请求体数据
   - 响应数据模拟

### Mock 数据配置
```javascript
// 示例：生成模拟数据
const data = Mock.mock({
    'list|1-10': [{
        'id|+1': 1,
        'name': '@cname',
        'date': '@date'
    }]
});
return {
    "status": 200,
    "response": data
}
```

## 🛠️ 高级功能

### 声明式网络请求配置
支持使用 chrome.declarativeNetRequest 进行高级请求控制：
```javascript
{
    "id": 1,
    "priority": 1,
    "action": {
        "type": "redirect",
        "redirect": {
            "transform": {
                "host": "new.api.example.com",
                "scheme": "https"
            }
        }
    },
    "condition": {
        "urlFilter": "api",
        "resourceTypes": ["xmlhttprequest"]
    }
}
```

### 画中画模式
- 支持将配置界面独立显示
- 方便在工作时随时调整配置
- 多屏工作效率提升

### 规则管理
- 支持规则的导入导出
- 分组管理和排序
- 批量启用/禁用规则
- 规则优先级调整

## 📚 API 文档

### 请求拦截 API
```javascript
// 获取原始请求信息
let { method, payload, originalResponse } = arguments[0];

// 自定义响应
return {
    "status": 200,
    "response": {
        "data": "自定义数据"
    }
};
```

### Mock.js 支持
- @cname - 生成中文名称
- @date - 生成日期
- @image - 生成图片链接
- @paragraph - 生成段落
- 更多语法参考 [Mock.js 文档](http://mockjs.com/examples.html)

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request 来帮助改进项目。

## 📄 许可证

本项目基于 MIT 许可证开源 - 详见 [LICENSE](LICENSE) 文件
