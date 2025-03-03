/* eslint-disable indent */
import { v4 as uuidv4 } from 'uuid';

// 基础配置接口
interface BaseConfig {
    protocol: string;
    domain: string;
    port: string;
}

// 场景信息接口
interface ScenarioInfo {
    apiCount: number;
    timestamp: string;
    description: string;
    baseConfig: BaseConfig;
}

// 参数接口
interface Parameter {
    name: string;
    value: string;
    type: 'query' | 'body' | 'path';
    description: string;
}

// 请求头接口
interface Header {
    name: string;
    value: string;
}

// 提取器源接口
interface ExtractorSource {
    param: string;
    location: 'response' | 'header';
    expression: string;
    description: string;
}

// 提取器目标接口
interface ExtractorTarget {
    param: string;
    location: 'path' | 'query' | 'body' | 'header';
    description: string;
}

// 提取器接口
interface Extractor {
    name: string;
    expression: string;
    matchNumber: string;
    description: string;
}

// 断言接口
interface Assertion {
    apiIndex: number;
    type: 'status' | 'response' | 'header';
    condition: string;
    value: string;
    description: string;
}

// 性能配置接口
interface PerformanceConfig {
    responseTime: number;
    throughput: number;
}

// 请求接口
interface Request {
    name: string;
    path: string;
    method: string;
    parameters: Parameter[];
    headers: Header[];
    extractors: Extractor[];
    assertions: Assertion[];
    performanceConfig?: PerformanceConfig;
}

// 依赖参数接口
interface DependencyParam {
    source: ExtractorSource;
    target: ExtractorTarget;
}

// 依赖关系接口
interface Dependency {
    sourceApi: number;
    targetApi: number;
    params: DependencyParam[];
}

// 变量接口
interface Variable {
    name: string;
    value: string;
    scope: 'global' | 'api';
    apiIndex?: number;
    description: string;
}

// 测试配置接口
interface TestConfig {
    threads: number;
    rampUp: number;
    loops: number;
    duration: number;
    defaultAssertions: boolean;
}

// 完整场景配置接口
interface ScenarioConfig {
    scenarioInfo: ScenarioInfo;
    requests: Request[];
    dependencies: Dependency[];
    variables: Variable[];
    testConfig: TestConfig;
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

interface HTTPSamplerConfig {
    name: string;
    method: string;
    path: string;
    domain?: string;
    port?: string;
    protocol?: string;
    parameters: any[];
    headers: any[];
    postData?: string;
    dependencies?: Dependency[];
    assertions: Assertion[];
    performanceConfig?: PerformanceConsideration;
    apiIndex?: number;
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

    private static generateParameters(parameters: Array<{ name: string; value: string }>): string {
        if (!parameters || parameters.length === 0) {
            return '';
        }

        return parameters.map(param => `
            <elementProp name="${param.name}" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">true</boolProp>
                <stringProp name="Argument.name">${param.name}</stringProp>
                <stringProp name="Argument.value">${param.value}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
                <boolProp name="HTTPArgument.use_equals">true</boolProp>
            </elementProp>
        `).join('');
    }

    private static generateHTTPSamplerConfig(config: HTTPSamplerConfig): string {
        const {
            name,
            method,
            path,
            domain = '${host}',
            port = '${port}',
            protocol = '${protocol}',
            parameters = [],
            headers = [],
            postData,
            assertions = []
        } = config;

        const samplerXml = `
            <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${name}" enabled="true">
                <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" enabled="true">
                    <collectionProp name="Arguments.arguments">
                        ${this.generateParameters(parameters)}
                        ${postData ? `
                        <elementProp name="" elementType="HTTPArgument">
                            <boolProp name="HTTPArgument.always_encode">false</boolProp>
                            <stringProp name="Argument.value">${postData}</stringProp>
                            <stringProp name="Argument.metadata">=</stringProp>
                        </elementProp>
                        ` : ''}
                    </collectionProp>
                </elementProp>
                <stringProp name="HTTPSampler.domain">${domain}</stringProp>
                <stringProp name="HTTPSampler.port">${port}</stringProp>
                <stringProp name="HTTPSampler.protocol">${protocol}</stringProp>
                <stringProp name="HTTPSampler.path">${path}</stringProp>
                <stringProp name="HTTPSampler.method">${method}</stringProp>
                <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
                <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
                <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
                <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
                <boolProp name="HTTPSampler.BROWSER_COMPATIBLE_MULTIPART">false</boolProp>
                <stringProp name="HTTPSampler.implementation">HttpClient4</stringProp>
                <boolProp name="HTTPSampler.monitor">false</boolProp>
                <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
            </HTTPSamplerProxy>
            <hashTree>
                ${this.generateHeaderManager(headers)}
                ${this.generateAssertions(assertions)}
            </hashTree>`;

        return samplerXml;
    }

    private static generateHeaderManager(headers: Array<{ name: string; value: string }>): string {
        if (!headers || headers.length === 0) {
            return '';
        }

        return `
            <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP Header Manager" enabled="true">
                <collectionProp name="HeaderManager.headers">
                    ${headers.map(header => `
                        <elementProp name="" elementType="Header">
                            <stringProp name="Header.name">${header.name}</stringProp>
                            <stringProp name="Header.value">${header.value}</stringProp>
                        </elementProp>
                    `).join('')}
                </collectionProp>
            </HeaderManager>
            <hashTree/>`;
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

            const analysis = JSON.parse(jsonMatch[1]);
            
            // 生成脚本内容
            let scriptContent = this.TEMPLATE_START;

            // 添加变量配置
            const variables = this.extractVariables(analysis.variables || []);
            scriptContent += this.generateVariablesConfig(variables);

            // 添加HTTP请求默认值配置
            scriptContent += this.generateDefaultConfig();

            // 添加请求配置
            analysis.requests.forEach((request: any, index: number) => {
                scriptContent += this.generateHTTPSamplerConfig({
                    name: request.name,
                    path: request.path,
                    method: request.method,
                    parameters: request.parameters || [],
                    headers: request.headers || [],
                    assertions: request.assertions || []
                });
            });

            // 添加结束标记
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
            value: v.value.startsWith('${') ? v.value : `\${${v.value}}`
        }));
    }

    private static processParameters(params: any[], dependencies: Dependency[]): any[] {
        if (!params || !Array.isArray(params)) return [];

        return params.map(param => {
            if (!param || !param.name) return param;

            const dependency = dependencies?.find(dep => 
                dep?.params?.some(p => p?.target?.param === param.name)
            );

            if (dependency?.params) {
                const depParam = dependency.params.find(p => p?.target?.param === param.name);
                if (depParam?.source?.param) {
                    const varName = `${depParam.source.param}_${dependency.sourceApi}_${uuidv4()}`;
                    return {
                        ...param,
                        value: `\${${varName}}`
                    };
                }
            }

            return param;
        });
    }
} 