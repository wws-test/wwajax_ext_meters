import { HeadersUtil, ENCRYPTION_CONFIG } from './encryption';
import { ChromeStorageUtil } from './db';
import { v4 as uuidv4 } from 'uuid';
// AI请求配置接口
interface AIRequestConfig {
  apiKey: string;
  url: string;
  model: string;
  temperature: number;
}

// AI消息接口
interface AIMessage {
  role: 'system' | 'user';
  content: string;
}

// 默认AI配置（作为后门配置）
const DEFAULT_AI_CONFIG: AIRequestConfig = {
  apiKey: 'bce-v3/ALTAK-zpfzMedc3P9zzgKnC2tfM/a605f34329539d395c120c569a3d8fad56398338',
  url: 'https://qianfan.baidubce.com/v2/chat/completions',
  model: 'ernie-speed-pro-128k',
  temperature: 0.5
};

// AI系统提示
const SYSTEM_PROMPTS = {
  // 接口文档生成提示词
  documentation: '我会输入一些接口信息，你要帮我生成成接口的文档解释（不要重复输出接口信息直接详细阐述接口的作用接口即可），要多角度推断该接口的作用，特别是从路径信息的取名方式 入参字段以及返回的数据 输出markdown格式 正常排版即可 。',
  
  // 测试用例生成提示词
  testCase: '我会输入一些接口信息，你要帮我生成成接口的pytest用例（需要部分定制）发送接口要用这种形式myrequest.request_send("Method", \'DescribeAuditDbTypes(取url最后一个单词)\', data=data)  。 myassert.equal(res["code"], "200")\n断言部分这样写死即可 发送接口前加入 with allure.step()内容智能生成  还有add_title() 以及add_desc() 内容智能生成 只需要专注生成主函数部分 导入以及main部分不需要生成 还有不需要实例化myassert 以及myrequest  只需要生成函数部分 不需要输出说明文字',

  // 错误响应分析提示词
  error_response_analysis: `作为一个经验丰富的后端开发工程师和测试工程师，请帮我分析这个API异常情况。

请从以下几个方面进行分析：

1. 错误类型识别
   - 错误的类型（参数错误、权限错误、服务器错误等）
   - 错误的严重程度
   - 是否为系统性错误

2. 错误字段分析（如果提供了字段信息）
   - 字段的业务含义
   - 字段值的合法性
   - 字段与错误的关联性
   - 数据验证建议

3. 错误原因分析
   - 可能的直接原因
   - 潜在的深层原因
   - 是否与请求参数相关
   - 是否与特定字段相关

4. 排查建议
   - 需要检查的关键点
   - 排查的优先顺序
   - 具体的排查步骤
   - 相关字段的验证方法

5. 解决方案
   - 临时解决方案
   - 长期解决建议
   - 预防措施
   - 数据验证改进建议

6. 测试建议
   - 需要补充的测试用例
   - 边界条件测试
   - 异常场景测试
   - 字段相关的测试点

请用markdown格式输出，注意条理清晰，要让测试工程师能够清楚理解问题并知道如何进行后续测试。`,

  // 场景分析提示词
  scenario_analysis: `作为一个资深的测试开发工程师，请分析提供的API测试场景。

请从以下几个方面进行分析：

1. 场景流程分析
   - 接口调用顺序是否合理
   - 是否存在关键步骤缺失
   - 建议的最优调用顺序

2. 参数依赖关系
   - 接口间的参数传递
   - 关键参数的来源和使用
   - 潜在的数据关联

3. 测试覆盖建议
   - 功能测试要点
   - 性能测试考虑
   - 异常场景覆盖
   - 安全测试建议

4. 潜在问题和优化建议
   - 接口设计合理性
   - 性能优化机会
   - 安全风险提示

请首先输出一段Markdown格式的分析总结，然后在文档最后附上如下格式的JSON数据：

{
  "scenarioInfo": {
    "apiCount": 0,
    "timestamp": "2024-02-18T10:00:00Z",
    "description": "场景概述",
    "baseConfig": {
      "protocol": "https",
      "domain": "api.example.com",
      "port": "443"
    }
  },
  "requests": [
    {
      "name": "接口名称",
      "path": "/api/path",
      "method": "POST",
      "parameters": [
        {
          "name": "paramName",
          "value": "paramValue",
          "type": "query|body|path",
          "description": "参数描述"
        }
      ],
      "extractors": [
        {
          "name": "extractorName",
          "expression": "$.data.token",
          "matchNumber": "1",
          "description": "提取token"
        }
      ],
      "assertions": [
        {
          "type": "status|response|header",
          "value": "200",
          "description": "状态码检查"
        }
      ],
      "performanceConfig": {
        "responseTime": 1000,
        "throughput": 100
      }
    }
  ],
  "dependencies": [
    {
      "sourceRequest": 0,
      "targetRequest": 1,
      "params": [
        {
          "sourceParam": "token",
          "targetParam": "authorization",
          "location": "header",
          "extractorType": "json",
          "extractorExpression": "$.data.token"
        }
      ]
    }
  ],
  "variables": [
    {
      "name": "host",
      "value": "api.example.com",
      "description": "服务器地址"
    },
    {
      "name": "port",
      "value": "443",
      "description": "服务器端口"
    },
    {
      "name": "protocol",
      "value": "https",
      "description": "服务器协议"
    }
  ],
  "testConfig": {
    "threads": 1,
    "rampUp": 1,
    "loops": 1,
    "duration": 60,
    "defaultAssertions": true
  }
}

注意：JSON数据必须完全符合上述格式，以确保能够正确生成JMeter测试脚本。每个字段都应该基于实际分析结果填写，保持数据的准确性和完整性。`,
};

/**
 * API工具类
 */
export class APIUtil {
  /**
   * 获取AI配置
   * @returns Promise<AIRequestConfig | null>
   */
  private static async getAIConfig(): Promise<AIRequestConfig | null> {
    try {
      // 获取所有配置，包括aiConfig
      const result = await ChromeStorageUtil.get(['aiConfig']);
      
      if (result.aiConfig) {
        const config = JSON.parse(result.aiConfig);
        // 检查是否为后门配置
        if (config.apiKey === 'admin') {
          return DEFAULT_AI_CONFIG;
        }
        // 验证用户配置是否完整
        if (config.apiKey && config.url && config.model) {
          return {
            apiKey: config.apiKey,
            url: config.url,
            model: config.model,
            temperature: config.temperature || 0.5
          };
        }
      }
      return null;
    } catch (error) {
      console.error('获取AI配置失败:', error);
      return null;
    }
  }

  /**
   * 发送AI请求
   * @param content 请求内容
   * @param type 请求类型
   * @returns Promise<string>
   */
  static async sendAIRequest(content: string, type: 'documentation' | 'testCase' | 'error_response_analysis' | 'scenario_analysis' = 'documentation'): Promise<string> {
    const aiConfig = await this.getAIConfig();
    
    if (!aiConfig) {
      throw new Error('请在设置页面配置AI参数（API Key、URL和模型）');
    }

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPTS[type]
      },
      { role: 'user', content }
    ];

    try {
      const response = await fetch(aiConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: aiConfig.model,
          messages,
          temperature: aiConfig.temperature
        })
      });

      if (!response.ok) {
        throw new Error(`AI请求失败: ${response.status}`);
      }

      const result = await response.json();
      return result.choices[0].message.content;
    } catch (error) {
      console.error('AI请求出错:', error);
      throw error;
    }
  }

  /**
   * 保存AI配置
   * @param config AI配置
   * @returns Promise<void>
   */
  static async saveAIConfig(config: Partial<AIRequestConfig>): Promise<void> {
    try {
      await ChromeStorageUtil.saveData({
        aiConfig: JSON.stringify(config)
      });
    } catch (error) {
      console.error('保存AI配置失败:', error);
      throw error;
    }
  }

  /**
   * 创建接口定义
   * @param record 请求记录
   * @returns Promise<any>
   */
  static async createInterfaceDefinition(record: any): Promise<any> {
    try {
      const s = HeadersUtil.setHeaders(ENCRYPTION_CONFIG);
      const data = await ChromeStorageUtil.getData();
      const url = new URL(record.request.url);
      const uuid = uuidv4();
      
      const requestBody = {
        projectId: data.projectid,
        name: url.pathname,
        status: 'Underway',
        method: record.request.method,
        userId: data.user,
        url: '',
        protocol: 'HTTP',
        environmentId: '',
        moduleId: '',
        modulePath: '/未规划接口',
        remark: '',
        description: 'query参数在这里' + url.search,
        tags: '',
        path: url.pathname,
        addFields: [],
        editFields: [],
        id: uuid
      };

      const apiUrl = 'https://metersphere.chintanneng.com/api/definition/created';
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: s.headers,
      });

      return await response.json();
    } catch (error) {
      console.error('创建接口定义失败:', error);
      throw error;
    }
  }
}

export type { AIRequestConfig, AIMessage };
export { DEFAULT_AI_CONFIG, SYSTEM_PROMPTS }; 