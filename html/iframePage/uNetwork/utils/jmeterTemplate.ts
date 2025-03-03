/* eslint-disable indent */
import { v4 as uuidv4 } from 'uuid';

interface JMeterVariable {
    name: string;
    value: string;
    description: string;
}

interface JMeterRequest {
    name: string;
    path: string;
    method: string;
    parameters: Array<{
        name: string;
        value: string;
        description?: string;
    }>;
    headers: Array<{
        name: string;
        value: string;
    }>;
    body?: string;
    assertions?: Array<{
        type: string;
        value: string;
    }>;
    extractors?: Array<{
        name: string;
        expression: string;
        matchNumber?: string;
    }>;
}

export class JMeterTemplateUtil {
    private static readonly TEMPLATE_START = `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.5">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="测试计划" enabled="true">
      <stringProp name="TestPlan.comments"></stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="用户定义的变量" enabled="true">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
      <stringProp name="TestPlan.user_define_classpath"></stringProp>
    </TestPlan>
    <hashTree>`;

    private static readonly TEMPLATE_END = `
    </hashTree>
  </hashTree>
</jmeterTestPlan>`;

    private static generateVariables(variables: JMeterVariable[]): string {
        return `
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="线程组" enabled="true">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="循环控制器" enabled="true">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <stringProp name="LoopController.loops">1</stringProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">1</stringProp>
        <stringProp name="ThreadGroup.ramp_time">1</stringProp>
        <boolProp name="ThreadGroup.scheduler">false</boolProp>
        <stringProp name="ThreadGroup.duration"></stringProp>
        <stringProp name="ThreadGroup.delay"></stringProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
      </ThreadGroup>
      <hashTree>
        <Arguments guiclass="ArgumentsPanel" testclass="Arguments" testname="用户定义的变量" enabled="true">
          <collectionProp name="Arguments.arguments">
            ${variables.map(v => `
            <elementProp name="${v.name}" elementType="Argument">
              <stringProp name="Argument.name">${v.name}</stringProp>
              <stringProp name="Argument.value">${v.value}</stringProp>
              <stringProp name="Argument.desc">${v.description}</stringProp>
              <stringProp name="Argument.metadata">=</stringProp>
            </elementProp>`).join('')}
          </collectionProp>
        </Arguments>
        <hashTree/>`;
    }

    private static generateHTTPRequest(request: JMeterRequest): string {
        const uuid = uuidv4();
        return `
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${request.name}" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" enabled="true">
            <collectionProp name="Arguments.arguments">
              ${request.parameters.map(p => `
              <elementProp name="${p.name}" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">true</boolProp>
                <stringProp name="Argument.name">${p.name}</stringProp>
                <stringProp name="Argument.value">${p.value}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
                <boolProp name="HTTPArgument.use_equals">true</boolProp>
              </elementProp>`).join('')}
            </collectionProp>
          </elementProp>
          <stringProp name="HTTPSampler.domain">${'${host}'}</stringProp>
          <stringProp name="HTTPSampler.port">${'${port}'}</stringProp>
          <stringProp name="HTTPSampler.protocol">${'${protocol}'}</stringProp>
          <stringProp name="HTTPSampler.path">${request.path}</stringProp>
          <stringProp name="HTTPSampler.method">${request.method}</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
          <boolProp name="HTTPSampler.BROWSER_COMPATIBLE_MULTIPART">false</boolProp>
          <stringProp name="HTTPSampler.implementation">HttpClient4</stringProp>
          <boolProp name="HTTPSampler.monitor">false</boolProp>
          <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
          <stringProp name="TestPlan.comments"></stringProp>
        </HTTPSamplerProxy>
        <hashTree>
          ${this.generateHeaderManager(request.headers)}
          ${this.generateAssertions(request.assertions || [])}
          ${this.generateExtractors(request.extractors || [])}
        </hashTree>`;
    }

    private static generateHeaderManager(headers: Array<{ name: string; value: string }>): string {
        if (!headers.length) return '';
        return `
          <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP信息头管理器" enabled="true">
            <collectionProp name="HeaderManager.headers">
              ${headers.map(h => `
              <elementProp name="" elementType="Header">
                <stringProp name="Header.name">${h.name}</stringProp>
                <stringProp name="Header.value">${h.value}</stringProp>
              </elementProp>`).join('')}
            </collectionProp>
          </HeaderManager>
          <hashTree/>`;
    }

    private static generateAssertions(assertions: Array<{ type: string; value: string }>): string {
        return assertions.map(assertion => {
            switch (assertion.type) {
                case 'response':
                    return `
          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="响应断言" enabled="true">
            <collectionProp name="Asserion.test_strings">
              <stringProp name="${uuidv4()}">${assertion.value}</stringProp>
            </collectionProp>
            <stringProp name="Assertion.custom_message"></stringProp>
            <stringProp name="Assertion.test_field">Assertion.response_data</stringProp>
            <boolProp name="Assertion.assume_success">false</boolProp>
            <intProp name="Assertion.test_type">16</intProp>
          </ResponseAssertion>
          <hashTree/>`;
                default:
                    return '';
            }
        }).join('');
    }

    private static generateExtractors(extractors: Array<{ name: string; expression: string; matchNumber?: string }>): string {
        return extractors.map(extractor => `
          <JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="JSON提取器" enabled="true">
            <stringProp name="JSONPostProcessor.referenceNames">${extractor.name}</stringProp>
            <stringProp name="JSONPostProcessor.jsonPathExprs">${extractor.expression}</stringProp>
            <stringProp name="JSONPostProcessor.match_numbers">${extractor.matchNumber || '1'}</stringProp>
          </JSONPostProcessor>
          <hashTree/>`).join('');
    }

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
        const variables: JMeterVariable[] = [
            {
                name: 'host',
                value: 'localhost',
                description: '服务器主机名'
            },
            {
                name: 'port',
                value: '8080',
                description: '服务器端口'
            },
            {
                name: 'protocol',
                value: 'http',
                description: '协议'
            }
        ];

        // 解析AI分析结果中的参数依赖关系
        const dependencySection = aiAnalysis.match(/### 参数传递关系\n([\s\S]*?)(?=###|$)/);
        const dependencies = new Map<string, string>();
        
        if (dependencySection) {
            const lines = dependencySection[1].split('\n');
            lines.forEach(line => {
                const match = line.match(/参数 \`(.*?)\` 可能依赖于接口 (\d+)/);
                if (match) {
                    dependencies.set(match[1], match[2]);
                }
            });
        }

        const requests: JMeterRequest[] = scenarioData.map((data: any, index: number) => {
            const url = new URL(data.requestInfo.url);
            const extractors = [];
            const parameters = [];

            // 处理查询参数
            if (data.requestInfo.queryParams) {
                data.requestInfo.queryParams.forEach((param: any) => {
                    const dependentApi = dependencies.get(param.name);
                    if (dependentApi) {
                        // 如果参数有依赖，使用变量引用
                        const varName = `${param.name}_${dependentApi}`;
                        parameters.push({
                            name: param.name,
                            value: `\${${varName}}`
                        });
                    } else {
                        parameters.push({
                            name: param.name,
                            value: param.value
                        });
                    }
                });
            }

            // 处理POST数据
            if (data.requestInfo.postData?.text) {
                try {
                    const postData = JSON.parse(data.requestInfo.postData.text);
                    Object.entries(postData).forEach(([key, value]) => {
                        const dependentApi = dependencies.get(key);
                        if (dependentApi) {
                            const varName = `${key}_${dependentApi}`;
                            parameters.push({
                                name: key,
                                value: `\${${varName}}`
                            });
                        } else {
                            parameters.push({
                                name: key,
                                value: String(value)
                            });
                        }
                    });
                } catch (e) {
                    console.error('解析POST数据失败:', e);
                }
            }

            // 添加响应提取器
            if (dependencies.size > 0) {
                dependencies.forEach((sourceApi, paramName) => {
                    if (sourceApi === String(index + 1)) {
                        extractors.push({
                            name: `${paramName}_${sourceApi}`,
                            expression: `$.${paramName}`,
                            matchNumber: '1'
                        });
                    }
                });
            }

            return {
                name: `${index + 1}_${url.pathname}`,
                path: url.pathname,
                method: data.requestInfo.method,
                parameters,
                headers: data.requestInfo.headers,
                extractors,
                assertions: [{
                    type: 'response',
                    value: '200'
                }]
            };
        });

        return { variables, requests };
    }
} 