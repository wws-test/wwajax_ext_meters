/* eslint-disable indent */
import { v4 as uuidv4 } from 'uuid';

// AI分析结果接口
interface ScenarioInfo {
    apiCount: number;
    timestamp: string;
    description: string;
}

interface CriticalPath {
    name: string;
    steps: number[];
    description: string;
}

interface FlowAnalysis {
    optimizedOrder: number[];
    missingSteps: string[];
    criticalPaths: CriticalPath[];
}

interface ParamSource {
    param: string;
    location: 'response' | 'header';
    expression: string;
    description: string;
}

interface ParamTarget {
    param: string;
    location: 'path' | 'query' | 'body' | 'header';
    description: string;
}

interface Dependency {
    sourceApi: number;
    targetApi: number;
    params: Array<{
        source: ParamSource;
        target: ParamTarget;
    }>;
}

interface Assertion {
    apiIndex: number;
    type: 'status' | 'response' | 'header';
    condition: string;
    value: string;
    description: string;
}

interface Variable {
    name: string;
    value: string;
    scope: 'global' | 'api';
    apiIndex?: number;
    description: string;
}

interface DataPreparation {
    type: string;
    description: string;
    sql?: string;
}

interface SecurityCheck {
    type: string;
    apiIndex: number;
    description: string;
    testCases: string[];
}

interface PerformanceConsideration {
    apiIndex: number;
    description: string;
    thresholds: {
        responseTime: number;
        throughput: number;
    };
}

interface APIAnalysisResult {
    scenarioInfo: ScenarioInfo;
    flowAnalysis: FlowAnalysis;
    dependencies: Dependency[];
    testCoverage: {
        assertions: Assertion[];
        variables: Variable[];
        dataPreparation: DataPreparation[];
    };
    securityChecks: SecurityCheck[];
    performanceConsiderations: PerformanceConsideration[];
}

// JMeter变量接口
interface JMeterVariable {
    name: string;
    value: string;
    scope?: 'global' | 'api';
    apiIndex?: number;
}

// JMeter依赖关系接口
interface JMeterDependency {
    sourceApi: number;
    targetApi: number;
    sourceParam: string;
    targetParam: string;
    sourceLocation: 'response' | 'header';
    targetLocation: 'path' | 'query' | 'body' | 'header';
    extractExpression: string;
}

export class JMeterGenerator {
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
    <hashTree>
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
      <hashTree>`;

    private static readonly TEMPLATE_END = `
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>`;

    private static generateVariablesConfig(variables: JMeterVariable[]): string {
        if (variables.length === 0) return '';

        return `
        <Arguments guiclass="ArgumentsPanel" testclass="Arguments" testname="用户定义的变量" enabled="true">
          <collectionProp name="Arguments.arguments">
            ${variables.map(variable => `
            <elementProp name="${variable.name}" elementType="Argument">
              <stringProp name="Argument.name">${variable.name}</stringProp>
              <stringProp name="Argument.value">${variable.value}</stringProp>
              <stringProp name="Argument.metadata">=</stringProp>
            </elementProp>`).join('')}
          </collectionProp>
        </Arguments>
        <hashTree/>`;
    }

    private static generateHTTPSamplerConfig(config: {
        name: string;
        method: string;
        path: string;
        domain: string;
        port: string;
        protocol: string;
        parameters: any[];
        postData?: string;
        dependencies: Dependency[];
        assertions: Assertion[];
        performanceConfig?: PerformanceConsideration;
        apiIndex: number;
    }): string {
        const uuid = uuidv4().replace(/-/g, '');
        let samplerConfig = this.generateBasicHTTPSampler(config);

        // 添加断言
        samplerConfig += this.generateAssertions(config.assertions);

        // 添加参数提取器
        config.dependencies.forEach(dep => {
            dep.params.forEach(param => {
                samplerConfig += this.generateExtractor(param.source, uuid);
            });
        });

        // 添加性能配置
        if (config.performanceConfig) {
            samplerConfig += this.generatePerformanceConfig(config.performanceConfig);
        }

        samplerConfig += '\n        </hashTree>';
        return samplerConfig;
    }

    private static generateBasicHTTPSampler(config: {
        name: string;
        method: string;
        path: string;
        domain: string;
        port: string;
        protocol: string;
        parameters: any[];
        postData?: string;
    }): string {
        return `
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${config.name}" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" enabled="true">
            <collectionProp name="Arguments.arguments">
              ${config.parameters.map(param => `
              <elementProp name="${param.name}" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">true</boolProp>
                <stringProp name="Argument.name">${param.name}</stringProp>
                <stringProp name="Argument.value">${param.value}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
                <boolProp name="HTTPArgument.use_equals">true</boolProp>
              </elementProp>`).join('')}
              ${config.postData ? `
              <elementProp name="" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">${config.postData}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>` : ''}
            </collectionProp>
          </elementProp>
          <stringProp name="HTTPSampler.domain">${config.domain}</stringProp>
          <stringProp name="HTTPSampler.port">${config.port}</stringProp>
          <stringProp name="HTTPSampler.protocol">${config.protocol}</stringProp>
          <stringProp name="HTTPSampler.path">${config.path}</stringProp>
          <stringProp name="HTTPSampler.method">${config.method}</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
          <stringProp name="HTTPSampler.implementation">HttpClient4</stringProp>
        </HTTPSamplerProxy>
        <hashTree>`;
    }

    private static generatePerformanceConfig(config: PerformanceConsideration): string {
        return `
          <DurationAssertion guiclass="DurationAssertionGui" testclass="DurationAssertion" testname="响应时间断言" enabled="true">
            <stringProp name="DurationAssertion.duration">${config.thresholds.responseTime}</stringProp>
          </DurationAssertion>
          <hashTree/>
          <ConstantThroughputTimer guiclass="TestBeanGUI" testclass="ConstantThroughputTimer" testname="吞吐量控制器" enabled="true">
            <intProp name="calcMode">0</intProp>
            <doubleProp>
              <name>throughput</name>
              <value>${config.thresholds.throughput}</value>
              <savedValue>0.0</savedValue>
            </doubleProp>
          </ConstantThroughputTimer>
          <hashTree/>`;
    }

    private static generateExtractor(source: ParamSource, uuid: string): string {
        if (source.location === 'response') {
            return `
          <JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="JSON提取器 - ${source.description}" enabled="true">
            <stringProp name="JSONPostProcessor.referenceNames">${source.param}_${uuid}</stringProp>
            <stringProp name="JSONPostProcessor.jsonPathExprs">${source.expression}</stringProp>
            <stringProp name="JSONPostProcessor.match_numbers">1</stringProp>
            <stringProp name="JSONPostProcessor.defaultValues">NOT_FOUND</stringProp>
          </JSONPostProcessor>
          <hashTree/>`;
        } else {
            return `
          <RegexExtractor guiclass="RegexExtractorGui" testclass="RegexExtractor" testname="正则提取器 - ${source.description}" enabled="true">
            <stringProp name="RegexExtractor.useHeaders">true</stringProp>
            <stringProp name="RegexExtractor.refname">${source.param}_${uuid}</stringProp>
            <stringProp name="RegexExtractor.regex">${source.expression}</stringProp>
            <stringProp name="RegexExtractor.template">$1$</stringProp>
            <stringProp name="RegexExtractor.default">NOT_FOUND</stringProp>
            <stringProp name="RegexExtractor.match_number">1</stringProp>
          </RegexExtractor>
          <hashTree/>`;
        }
    }

    private static generateAssertions(assertions: Assertion[]): string {
        return assertions.map(assertion => {
            switch (assertion.type) {
                case 'status':
                    return `
          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="响应状态断言 - ${assertion.description}" enabled="true">
            <collectionProp name="Asserion.test_strings">
              <stringProp name="0">${assertion.value}</stringProp>
            </collectionProp>
            <stringProp name="Assertion.custom_message"></stringProp>
            <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
            <boolProp name="Assertion.assume_success">false</boolProp>
            <intProp name="Assertion.test_type">8</intProp>
          </ResponseAssertion>
          <hashTree/>`;
                case 'response':
                    return `
          <JSONPathAssertion guiclass="JSONPathAssertionGui" testclass="JSONPathAssertion" testname="JSON断言 - ${assertion.description}" enabled="true">
            <stringProp name="JSON_PATH">${assertion.condition}</stringProp>
            <stringProp name="EXPECTED_VALUE">${assertion.value}</stringProp>
            <boolProp name="JSONVALIDATION">true</boolProp>
            <boolProp name="EXPECT_NULL">false</boolProp>
            <boolProp name="INVERT">false</boolProp>
            <boolProp name="ISREGEX">false</boolProp>
          </JSONPathAssertion>
          <hashTree/>`;
                case 'header':
                    return `
          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="响应头断言 - ${assertion.description}" enabled="true">
            <collectionProp name="Asserion.test_strings">
              <stringProp name="0">${assertion.value}</stringProp>
            </collectionProp>
            <stringProp name="Assertion.custom_message"></stringProp>
            <stringProp name="Assertion.test_field">Assertion.response_headers</stringProp>
            <boolProp name="Assertion.assume_success">false</boolProp>
            <intProp name="Assertion.test_type">2</intProp>
          </ResponseAssertion>
          <hashTree/>`;
                default:
                    return '';
            }
        }).join('\n');
    }

    static generateJMeterScript(scenarioData: any[], analysisResult: string): string {
        try {
            // 从分析结果中提取JSON部分
            const jsonMatch = analysisResult.match(/```json\n([\s\S]*?)\n```/);
            if (!jsonMatch) {
                throw new Error('未找到分析结果JSON数据');
            }

            const analysis: APIAnalysisResult = JSON.parse(jsonMatch[1]);
            
            // 生成脚本内容
            let scriptContent = this.TEMPLATE_START;

            // 添加变量配置
            const variables = this.extractVariables(analysis.testCoverage.variables);
            scriptContent += this.generateVariablesConfig(variables);

            // 添加HTTP请求默认值配置
            scriptContent += this.generateDefaultConfig();

            // 添加数据准备步骤（如果有）
            if (analysis.testCoverage.dataPreparation.length > 0) {
                scriptContent += this.generateDataPreparation(analysis.testCoverage.dataPreparation);
            }

            // 按照优化后的顺序生成请求
            const requestOrder = analysis.flowAnalysis.optimizedOrder.length > 0 
                ? analysis.flowAnalysis.optimizedOrder 
                : scenarioData.map((_, index) => index);

            requestOrder.forEach(index => {
                const api = scenarioData[index];
                const url = new URL(api.requestInfo.url);
                
                // 获取当前API的断言配置
                const assertions = analysis.testCoverage.assertions
                    .filter(a => a.apiIndex === index);

                // 获取当前API的依赖关系
                const apiDependencies = analysis.dependencies
                    .filter(d => d.targetApi === index);

                // 获取性能配置
                const performanceConfig = analysis.performanceConsiderations
                    .find(p => p.apiIndex === index);

                scriptContent += this.generateHTTPSamplerConfig({
                    name: `${index + 1}_${url.pathname}`,
                    method: api.requestInfo.method,
                    path: url.pathname,
                    domain: url.hostname,
                    port: url.port || (url.protocol === 'https:' ? '443' : '80'),
                    protocol: url.protocol.replace(':', ''),
                    parameters: this.processParameters(
                        api.requestInfo.queryParams,
                        apiDependencies
                    ),
                    postData: api.requestInfo.postData?.text,
                    dependencies: apiDependencies,
                    assertions,
                    performanceConfig,
                    apiIndex: index
                });
            });

            scriptContent += this.TEMPLATE_END;
            return scriptContent;
        } catch (error) {
            console.error('生成JMeter脚本失败:', error);
            throw error;
        }
    }

    private static generateDefaultConfig(): string {
        return `
        <ConfigTestElement guiclass="HttpDefaultsGui" testclass="ConfigTestElement" testname="HTTP请求默认值" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="用户定义的变量" enabled="true">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
          <stringProp name="HTTPSampler.domain"></stringProp>
          <stringProp name="HTTPSampler.port"></stringProp>
          <stringProp name="HTTPSampler.protocol"></stringProp>
          <stringProp name="HTTPSampler.contentEncoding">UTF-8</stringProp>
          <stringProp name="HTTPSampler.path"></stringProp>
          <stringProp name="HTTPSampler.concurrentPool">6</stringProp>
          <stringProp name="HTTPSampler.connect_timeout">60000</stringProp>
          <stringProp name="HTTPSampler.response_timeout">60000</stringProp>
        </ConfigTestElement>
        <hashTree/>
        <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP信息头管理器" enabled="true">
          <collectionProp name="HeaderManager.headers">
            <elementProp name="" elementType="Header">
              <stringProp name="Header.name">Content-Type</stringProp>
              <stringProp name="Header.value">application/json</stringProp>
            </elementProp>
            <elementProp name="" elementType="Header">
              <stringProp name="Header.name">Accept</stringProp>
              <stringProp name="Header.value">application/json</stringProp>
            </elementProp>
          </collectionProp>
        </HeaderManager>
        <hashTree/>`;
    }

    private static generateDataPreparation(preparations: DataPreparation[]): string {
        return preparations.map(prep => {
            if (prep.type === 'database' && prep.sql) {
                return `
    <JDBCSampler guiclass="TestBeanGUI" testclass="JDBCSampler" testname="数据准备 - ${prep.description}" enabled="true">
      <stringProp name="dataSource">testDB</stringProp>
      <stringProp name="query">${prep.sql}</stringProp>
      <stringProp name="queryType">Update Statement</stringProp>
      <stringProp name="resultVariable"></stringProp>
      <stringProp name="variableNames"></stringProp>
      <stringProp name="queryTimeout"></stringProp>
      <stringProp name="resultSetHandler">Store as String</stringProp>
    </JDBCSampler>
    <hashTree/>`;
            }
            return '';
        }).join('\n');
    }

    private static extractVariables(variables: Variable[]): Array<{ name: string; value: string }> {
        return variables.map(v => ({
            name: v.name,
            value: v.value
        }));
    }

    private static processParameters(params: any[], dependencies: Dependency[]): any[] {
        if (!params) return [];

        return params.map(param => {
            const dependency = dependencies.find(dep => 
                dep.params.some(p => p.target.param === param.name)
            );

            if (dependency) {
                const depParam = dependency.params.find(p => p.target.param === param.name);
                if (depParam) {
                    return {
                        ...param,
                        value: '${' + depParam.source.param + '_' + dependency.sourceApi + '}'
                    };
                }
            }

            return param;
        });
    }
} 