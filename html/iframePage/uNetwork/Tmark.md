# 测试场景脚本自动生成技术文档

## 一、功能概述

测试场景脚本自动生成功能是一个智能化的测试工具，能够基于用户选择的HTTP请求自动分析场景流程，识别参数依赖关系，并生成完整的JMeter测试脚本。该功能极大地提升了测试脚本编写效率，确保了测试场景的完整性和准确性。

## 二、核心功能模块

### 2.1 数据采集模块

#### 2.1.1 功能说明
- 实时捕获HTTP请求信息
- 支持多请求选择和场景组合
- 提供请求过滤和搜索功能

#### 2.1.2 核心实现
```typescript
// 表格行选择处理
const handleTableRow = (selectedRowKeys: React.Key[], selectedRows: RequestRecord[]) => {
    setSelectedRowKeys(selectedRowKeys);
    setSelectedRows(selectedRows);
};

// 请求数据处理
interface RequestRecord {
    requestInfo: {
        url: string;
        method: string;
        headers: Array<{ name: string; value: string }>;
        queryParams?: Array<{ name: string; value: string }>;
        postData?: {
            text: string;
        };
    };
}
```

### 2.2 AI场景分析模块

#### 2.2.1 功能说明
- 智能分析接口调用顺序
- 识别接口间的参数依赖
- 生成测试建议和优化方案

#### 2.2.2 核心实现
```typescript
const analyzeScenario = async (scenarioData: ScenarioData[]) => {
    try {
        const report: string[] = [];
        
        // 1. 场景概述
        report.push('## 场景概述\n');
        report.push(`- 接口总数：${scenarioData.length}`);
        report.push(`- 分析时间：${new Date().toISOString()}\n`);
        
        // 2. 接口调用顺序分析
        report.push('## 接口调用顺序\n');
        scenarioData.forEach((data, index) => {
            const url = new URL(data.requestInfo.url);
            report.push(`${index + 1}. ${url.pathname}`);
        });
        
        // 3. 参数依赖分析
        report.push('\n## 参数依赖关系\n');
        // ... 参数依赖分析逻辑
        
        return report.join('\n');
    } catch (error) {
        console.error('场景分析失败:', error);
        throw error;
    }
};
```

### 2.3 JMeter脚本生成模块

#### 2.3.1 功能说明
- 生成标准JMX格式脚本
- 支持变量提取和参数关联
- 自动配置断言和性能监控

#### 2.3.2 核心实现
```typescript
class JMeterTemplateUtil {
    static generateJMXContent(
        variables: JMeterVariable[],
        requests: JMeterRequest[]
    ): string {
        return `${this.TEMPLATE_START}
        ${this.generateVariables(variables)}
        ${requests.map(request => this.generateHTTPRequest(request)).join('')}
        </hashTree>
        ${this.TEMPLATE_END}`;
    }

    static analyzeParameterDependencies(
        scenarioData: any[],
        aiAnalysis: string
    ): {
        variables: JMeterVariable[];
        requests: JMeterRequest[];
    } {
        // ... 参数依赖分析和请求处理逻辑
    }
}
```

## 三、使用示例

### 3.1 基础场景示例

```json
{
    "scenarioData": [
        {
            "requestInfo": {
                "url": "https://api.example.com/login",
                "method": "POST",
                "headers": [
                    {
                        "name": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "postData": {
                    "text": "{\"username\":\"test\",\"password\":\"123456\"}"
                }
            }
        },
        {
            "requestInfo": {
                "url": "https://api.example.com/users/profile",
                "method": "GET",
                "headers": [
                    {
                        "name": "Authorization",
                        "value": "${token}"
                    }
                ]
            }
        }
    ]
}
```

### 3.2 生成的JMeter脚本

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.5">
    <hashTree>
        <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="测试计划">
            <hashTree>
                <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="线程组">
                    <hashTree>
                        <!-- 变量定义 -->
                        <Arguments guiclass="ArgumentsPanel" testclass="Arguments" testname="用户定义的变量">
                            <elementProp name="host" elementType="Argument">
                                <stringProp name="Argument.name">host</stringProp>
                                <stringProp name="Argument.value">api.example.com</stringProp>
                            </elementProp>
                        </Arguments>
                        
                        <!-- 登录请求 -->
                        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="1_登录">
                            <!-- 请求配置 -->
                        </HTTPSamplerProxy>
                        
                        <!-- 获取用户信息请求 -->
                        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="2_获取用户信息">
                            <!-- 请求配置 -->
                        </HTTPSamplerProxy>
                    </hashTree>
                </ThreadGroup>
            </hashTree>
        </TestPlan>
    </hashTree>
</jmeterTestPlan>
```

## 四、技术要点

### 4.1 参数依赖处理
1. 变量提取器配置
   - JSON提取器：处理JSON响应数据
   - 正则提取器：处理特殊格式数据
   - 边界提取器：处理文本数据

2. 参数关联实现
   - 变量命名规范：`${paramName}_${apiIndex}`
   - 作用域控制：线程组级别/全局级别
   - 默认值处理：防止提取失败场景

### 4.2 性能配置优化
1. 线程组设置
   - 并发用户数：根据实际压测需求设置
   - 启动时间：合理分配启动时间，避免瞬时高峰
   - 循环次数：支持持续时间和循环次数两种模式

2. 监控指标配置
   - 响应时间监控：设置合理的响应时间断言
   - 吞吐量控制：使用吞吐量整形器
   - 错误率监控：配置错误率断言

### 4.3 异常处理机制
1. 请求异常处理
   - 超时重试机制
   - 错误响应处理
   - 断言失败处理

2. 数据异常处理
   - 参数提取失败处理
   - 数据格式异常处理
   - 依赖链断裂处理

## 五、最佳实践

### 5.1 场景设计建议
1. 合理规划接口顺序
2. 正确处理参数依赖
3. 设置合适的性能阈值

### 5.2 脚本优化建议
1. 使用变量替代硬编码值
2. 合理设置断言条件
3. 添加必要的监控指标

### 5.3 执行优化建议
1. 分批次执行大规模测试
2. 监控系统资源使用
3. 及时分析执行结果

## 六、注意事项

1. 参数提取和关联
   - 确保参数名称唯一性
   - 处理可选参数情况
   - 避免循环依赖

2. 性能测试配置
   - 合理设置并发用户数
   - 控制请求发送频率
   - 监控系统资源使用

3. 数据安全处理
   - 敏感数据加密处理
   - 测试数据隔离
   - 权限访问控制

## 七、未来优化方向

1. 智能化增强
   - 智能场景识别
   - 自动化参数关联
   - 智能断言生成

2. 功能扩展
   - 支持更多协议类型
   - 增加更多断言类型
   - 提供更多变量处理函数

3. 性能优化
   - 提升脚本生成效率
   - 优化内存使用
   - 提高并发处理能力
