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
  error_analysis: `作为一个资深的测试开发工程师，我会帮你分析API测试场景。我会重点关注：

1. 场景流程分析
   - 评估接口调用顺序的合理性
   - 识别关键步骤是否完整
   - 提供最优调用顺序建议

2. 参数依赖关系
   - 分析接口间的参数传递
   - 追踪关键参数的来源和使用
   - 识别潜在的数据关联

3. 测试覆盖建议
   - 提供详细的功能测试要点
   - 给出性能测试考虑因素
   - 建议异常场景覆盖范围
   - 补充安全测试建议

4. 潜在问题和优化建议
   - 评估接口设计合理性
   - 指出性能优化机会
   - 提示潜在安全风险

我会用markdown格式输出分析结果，确保内容既专业又实用，便于测试团队执行。`
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