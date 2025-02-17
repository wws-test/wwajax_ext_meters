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

// AI配置
const AI_CONFIG: AIRequestConfig = {
  apiKey: 'bce-v3/ALTAK-zpfzMedc3P9zzgKnC2tfM/a605f34329539d395c120c569a3d8fad56398338',
  url: 'https://qianfan.baidubce.com/v2/chat/completions',
  model: 'ernie-speed-pro-128k',
  temperature: 0.5
};

// AI系统提示
const SYSTEM_PROMPTS = {
  documentation: '我会输入一些接口信息，你要帮我生成成接口的文档解释（不要重复输出接口信息直接详细阐述接口的作用接口即可），要多角度推断该接口的作用，特别是从路径信息的取名方式 入参字段以及返回的数据 输出markdown格式 正常排版即可 。',
  testCase: '我会输入一些接口信息，你要帮我生成成接口的pytest用例（需要部分定制）发送接口要用这种形式myrequest.request_send("Method", \'DescribeAuditDbTypes(取url最后一个单词)\', data=data)  。 myassert.equal(res["code"], "200")\n断言部分这样写死即可 发送接口前加入 with allure.step()内容智能生成  还有add_title() 以及add_desc() 内容智能生成 只需要专注生成主函数部分 导入以及main部分不需要生成 还有不需要实例化myassert 以及myrequest  只需要生成函数部分 不需要输出说明文字',
  error_analysis: `作为一个资深的测试开发工程师，我会帮你分析API测试场景。请按照以下格式输出分析结果：

1. 首先输出一段Markdown格式的分析总结，包含场景概述、主要发现和建议。

2. 然后在文档最后附上一段JSON格式的详细分析数据，使用以下模板：

\`\`\`json
{
    "scenarioInfo": {
        "apiCount": 3,
        "timestamp": "2024-01-01T12:00:00Z",
        "description": "登录及数据查询场景"
    },
    "flowAnalysis": {
        "optimizedOrder": [0, 1, 2],
        "missingSteps": ["身份验证", "数据清理"],
        "criticalPaths": [
            {
                "name": "用户认证流程",
                "steps": [0, 1],
                "description": "完成用户登录和token获取"
            }
        ]
    },
    "dependencies": [
        {
            "sourceApi": 0,
            "targetApi": 1,
            "params": [
                {
                    "source": {
                        "param": "token",
                        "location": "response",
                        "expression": "$.data.token",
                        "description": "登录接口返回的认证令牌"
                    },
                    "target": {
                        "param": "Authorization",
                        "location": "header",
                        "description": "用于后续请求的认证头"
                    }
                }
            ]
        }
    ],
    "testCoverage": {
        "assertions": [
            {
                "apiIndex": 0,
                "type": "status",
                "condition": "equals",
                "value": "200",
                "description": "验证响应状态码"
            },
            {
                "apiIndex": 0,
                "type": "response",
                "condition": "$.code",
                "value": "0",
                "description": "验证业务状态码"
            }
        ],
        "variables": [
            {
                "name": "baseUrl",
                "value": "https://api.example.com",
                "scope": "global",
                "description": "API基础地址"
            },
            {
                "name": "username",
                "value": "testuser",
                "scope": "api",
                "apiIndex": 0,
                "description": "测试用户名"
            }
        ],
        "dataPreparation": [
            {
                "type": "database",
                "description": "需要预先准备测试用户数据",
                "sql": "INSERT INTO users (username, status) VALUES ('testuser', 1)"
            }
        ]
    },
    "securityChecks": [
        {
            "type": "authentication",
            "apiIndex": 0,
            "description": "验证无效token的处理",
            "testCases": ["空token", "过期token", "无效格式token"]
        }
    ],
    "performanceConsiderations": [
        {
            "apiIndex": 1,
            "description": "数据查询接口可能需要性能测试",
            "thresholds": {
                "responseTime": 1000,
                "throughput": 100
            }
        }
    ]
}
\`\`\`

请确保JSON数据完整且格式正确，这将用于自动生成测试脚本。`
};

/**
 * API工具类
 */
export class APIUtil {
  /**
   * 发送AI请求
   * @param content 请求内容
   * @param type 请求类型
   * @returns Promise<string>
   */
  static async sendAIRequest(content: string, type: 'documentation' | 'testCase' | 'error_analysis' = 'documentation'): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPTS[type]
      },
      { role: 'user', content }
    ];

    try {
      const response = await fetch(AI_CONFIG.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages,
          temperature: AI_CONFIG.temperature
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
export { AI_CONFIG, SYSTEM_PROMPTS }; 