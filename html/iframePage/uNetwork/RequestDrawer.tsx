/* eslint-disable indent */
import { Button, Divider, Drawer, Tabs } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { FilterOutlined } from '@ant-design/icons';
import './RequestDrawer.css';
import ReactMarkdown from 'react-markdown';
import ClipboardCopy from './ClipboardCopy';
import { v4 as uuidv4 } from 'uuid';
import { APIUtil }  from './utils/api';
import { formatText } from './utils/common';

// 定义类型
interface AIRequestConfig {
    apiKey: string;
    url: string;
    model: string;
    temperature: number;
}

interface AIMessage {
    role: 'system' | 'user';
    content: string;
}

// AI请求配置
const AI_CONFIG: AIRequestConfig = {
    apiKey: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ1c2VyLWNlbnRlciIsImV4cCI6MTcxOTg4Nzg3OCwiaWF0IjoxNzEyMTExODc4LCJqdGkiOiJjbzZjMjFrdWR1NmYxcW1hMjRiMCIsInR5cCI6InJlZnJlc2giLCJzdWIiOiJjbmlpaGlwa3FxNGdxMWU5anFqZyIsInNwYWNlX2lkIjoiY25paWhpcGtxcTRncTFlOWpxajAiLCJhYnN0cmFjdF91c2VyX2lkIjoiY25paWhpcGtxcTRncTFlOWpxaWcifQ.G5DXRWN8rImpjmG4M-9xSl5G_3kLf2ZL1jAR_Y_ZwkuxqkZJ6SQU3yVsG_5-QeuqyncAZCFvl3da2Z0N_rzgPQ',
    url: 'http://10.50.3.213:8000/v1/chat/completions',
    model: 'moonshot-v1-8k',
    temperature: 0.3
};

// AI消息系统提示
const SYSTEM_PROMPTS = {
    documentation: '我会输入一些接口信息，你要帮我生成成接口的文档解释（不要重复输出接口信息直接详细阐述接口的作用接口即可），要多角度推断该接口的作用，特别是从路径信息的取名方式 入参字段以及返回的数据 输出markdown格式 正常排版即可 。',
    testCase: '我会输入一些接口信息，你要帮我生成成接口的pytest用例（需要部分定制）发送接口要用这种形式myrequest.request_send("Method", \'DescribeAuditDbTypes(取url最后一个单词)\', data=data)  。 myassert.equal(res["code"], "200")\n断言部分这样写死即可 发送接口前加入 with allure.step()内容智能生成  还有add_title() 以及add_desc() 内容智能生成 只需要专注生成主函数部分 导入以及main部分不需要生成 还有不需要实例化myassert 以及myrequest  只需要生成函数部分 不需要输出说明文字'
};

// 统一的AI请求处理函数
async function sendAIRequest(content: string, type: 'documentation' | 'testCase' = 'documentation'): Promise<string> {
    const messages: AIMessage[] = [
        {
            role: 'system',
            content: type === 'documentation' ? SYSTEM_PROMPTS.documentation : SYSTEM_PROMPTS.testCase
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

// 加密相关类型定义
interface EncryptionConfig {
    secretKey: string;
    accessKey: string;
}

// 加密配置
const ENCRYPTION_CONFIG: EncryptionConfig = {
    secretKey: 'nZYPci3jhJJoYzU2',
    accessKey: 'mByqaSdYnUaHWY9i'
};

// 加密工具类
class EncryptionUtil {
    static aesEncrypt(text: string, secretKey: string, iv: string): string {
        try {
            const encrypted = CryptoJS.AES.encrypt(text, secretKey, { iv });
            return encrypted.toString();
        } catch (error) {
            console.error('加密失败:', error);
            throw error;
        }
    }

    static generateSignature(accessKey: string, secretKey: string): string {
        const timeStamp = new Date().getTime();
        const comboxKey = `${accessKey}|${uuidv4()}|${timeStamp}`;
        return this.aesEncrypt(comboxKey, secretKey, accessKey);
    }
}

// 请求头工具类
class HeadersUtil {
    static getDefaultHeaders(accessKey: string, signature: string): Record<string, string> {
        return {
            'User-Agent': 'python-requests/2.25.1',
            'Content-Type': 'application/json',
            'ACCEPT': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'accessKey': accessKey,
            'signature': signature
        };
    }

    static setHeaders(config: EncryptionConfig): { headers: Record<string, string> } {
        const signature = EncryptionUtil.generateSignature(
            config.accessKey,
            config.secretKey
        );
        
        return {
            headers: this.getDefaultHeaders(config.accessKey, signature)
        };
    }
}

// IndexedDB 相关类型定义
interface DBConfig {
    name: string;
    version: number;
    store: string;
}

interface DBData {
    projectid?: string;
    user?: string;
    [key: string]: any;
}

// IndexedDB 配置
const DB_CONFIG: DBConfig = {
    name: 'myDatabase',
    version: 2,
    store: 'myObjectStore'
};

// IndexedDB 工具类
class IndexedDBUtil {
    static async getData(): Promise<DBData> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

            request.onsuccess = (event: Event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const transaction = db.transaction(DB_CONFIG.store, 'readwrite');
                const objectStore = transaction.objectStore(DB_CONFIG.store);

                const projectRequest = objectStore.get('projectid');
                const userRequest = objectStore.get('user');

                Promise.all([
                    this.handleRequest(projectRequest),
                    this.handleRequest(userRequest)
                ])
                    .then(([projectData, userData]) => {
                        if (projectData) {
                            resolve({
                                projectid: projectData.value,
                                user: userData?.value
                            });
                        } else {
                            reject(new Error('在IndexedDB中未找到projectid的值'));
                        }
                    })
                    .catch(reject);

                transaction.oncomplete = () => db.close();
            };

            request.onerror = () => {
                reject(new Error('Error opening IndexedDB'));
            };
        });
    }

    private static handleRequest(request: IDBRequest): Promise<any> {
        return new Promise((resolve, reject) => {
            request.onsuccess = (event: Event) => {
                resolve((event.target as IDBRequest).result);
            };
            request.onerror = () => {
                reject(new Error(`无法获取数据: ${request.error}`));
            };
        });
    }
}

// 组件类型定义
interface RequestDrawerProps {
    drawerOpen: boolean;
    record: any;
    onClose: () => void;
    onAddInterceptorClick: (record: any) => void;
}

interface WrapperProps {
    children: React.ReactNode;
}

// 子组件
const Headers: React.FC<{ record: any }> = ({ record }) => (
    <>
        <h4><strong>General</strong></h4>
        <div className="ajax-tools-devtools-text">
            <strong>Request URL:&nbsp;</strong>
            <span>{record.request.url}</span>
        </div>
        <div className="ajax-tools-devtools-text">
            <strong>Request Method:&nbsp;</strong>
            <span>{record.request.method}</span>
        </div>
        <div className="ajax-tools-devtools-text">
            <strong>Status Code:&nbsp;</strong>
            <span>{record.response.status}</span>
        </div>
        <div className="ajax-tools-devtools-text">
            <strong>Remote Address:&nbsp;</strong>
            <span>{record.serverIPAddress}</span>
        </div>

        <Divider orientation="left" style={{ margin: '12px 0 4px' }}/>
        <h4><strong>Response Headers</strong></h4>
        <div className="ajax-tools-devtools-text">
            <strong>Http Version:&nbsp;</strong>
            <span>{record.response.httpVersion}</span>
        </div>
        {record.response.headers.map((v: { name: string, value: string }) => (
            <div className="ajax-tools-devtools-text" key={v.name}>
                <strong>{v.name}:&nbsp;</strong>
                <span>{v.value}</span>
            </div>
        ))}

        <Divider orientation="left" style={{ margin: '12px 0 4px' }}/>
        <h4><strong>Request Headers</strong></h4>
        <div className="ajax-tools-devtools-text">
            <strong>Http Version:&nbsp;</strong>
            <span>{record.request.httpVersion}</span>
        </div>
        {record.request.headers.map((v: { name: string, value: string }) => (
            <div className="ajax-tools-devtools-text" key={v.name}>
                <strong>{v.name}:&nbsp;</strong>
                <span>{v.value}</span>
            </div>
        ))}
    </>
);

const Payload: React.FC<{ record: any }> = ({ record }) => {
    const postData = record.request.postData || {};
    return (
        <>
            <h4><strong>Query String Parameters</strong></h4>
            {record.request.queryString.map((v: { name: string, value: string }) => (
                <div className="ajax-tools-devtools-text" key={v.name}>
                    <strong>{v.name}:&nbsp;</strong>
                    <span>{v.value}</span>
                </div>
            ))}
            <Divider orientation="left" style={{ margin: '12px 0 4px' }}/>
            <h4><strong>Request Payload</strong></h4>
            <div className="ajax-tools-devtools-text">
                <strong>mimeType:&nbsp;</strong>
                <span>{postData.mimeType}</span>
            </div>
            <div className="ajax-tools-devtools-text" style={{ display: 'flex' }}>
                <strong style={{ flex: 'none' }}>text:&nbsp;</strong>
                <pre>{formatText(postData.text)}</pre>
            </div>
            {postData.params && (
                <div className="ajax-tools-devtools-text">
                    <strong>Params:&nbsp;</strong>
                    {(postData.params || []).map((v: { name: string, value: string }) => (
                        <div className="ajax-tools-devtools-text" key={v.name}>
                            <strong>{v.name}:&nbsp;</strong>
                            <span>{v.value}</span>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

const Response: React.FC<{ record: any, drawerOpen: boolean }> = ({ record, drawerOpen }) => {
    const [response, setResponse] = useState('');

    useEffect(() => {
        if (drawerOpen && record.getContent) {
            record.getContent((content: string) => {
                setResponse(content);
            });
        }
    }, [drawerOpen, record.getContent]);

    return <pre>{formatText(response)}</pre>;
};

const AIResponse: React.FC<{ record: any, drawerOpen: boolean, type: 'documentation' | 'testCase' }> = ({ 
    record, 
    drawerOpen,
    type
}) => {
    const [response, setResponse] = useState('');
    const [responseContent, setResponseContent] = useState('');
    const prevResponseRef = useRef();

    useEffect(() => {
        if (drawerOpen && record.getContent) {
            record.getContent((content: string) => {
                setResponse(content);
            });
        }
    }, [drawerOpen, record.getContent]);

    useEffect(() => {
        if (response && response !== prevResponseRef.current) {
            const requestData = `${JSON.stringify(record.request.url) + JSON.stringify(record.request.postData) + response}`;
            
            APIUtil.sendAIRequest(requestData, type)
                .then((result) => {
                    if (result) {
                        setResponseContent(result);
                    }
                })
                .catch(console.error);

            prevResponseRef.current = response;
        }
    }, [response, type, record.request]);

    if (!responseContent) {
        return <pre>loading...</pre>;
    }

    return (
        <div>
            <ReactMarkdown>{responseContent}</ReactMarkdown>
            {type === 'testCase' && <ClipboardCopy copyText={responseContent} />}
        </div>
    );
};

const Wrapper: React.FC<WrapperProps> = ({ children }) => (
    <div style={{ height: 'calc(100vh - 160px)', overflow: 'auto' }}>
        {children}
    </div>
);

// 主组件
const RequestDrawer: React.FC<RequestDrawerProps> = ({
    drawerOpen,
    record,
    onClose,
    onAddInterceptorClick
}) => {
    const title = record && record.request.url.match('[^/]+(?!.*/)');

    const commit = async () => {
        try {
            const result = await APIUtil.createInterfaceDefinition(record);
            alert(JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('提交失败:', error);
            alert('提交失败，请查看控制台了解详情');
        }
    };

    return (
        <Drawer
            title={<span style={{ fontSize: 12 }}>{title}</span>}
            open={drawerOpen}
            onClose={onClose}
            width="80%"
            placement="right"
            mask={false}
            headerStyle={{ padding: '8px 12px', fontSize: '14px', wordBreak: 'break-all' }}
            bodyStyle={{ padding: '6px 24px' }}
        >
            <Tabs
                defaultActiveKey="1"
                size="small"
                tabBarExtraContent={{
                    right: (
                        <>
                            <FilterOutlined
                                className="ajax-tools-devtools-text-btn"
                                title="Add requests to be intercepted"
                                onClick={() => onAddInterceptorClick(record)}
                            />
                            <div style={{ width: '8px' }} />
                            <Button type="primary" onClick={commit}>
                                提交
                            </Button>
                        </>
                    ),
                }}
                items={[
                    {
                        label: '请求头',
                        key: '1',
                        children: <Wrapper><Headers record={record} /></Wrapper>,
                    },
                    {
                        label: '请求体',
                        key: '2',
                        children: <Wrapper><Payload record={record} /></Wrapper>,
                    },
                    {
                        label: '响应体',
                        key: '3',
                        children: <Wrapper><Response record={record} drawerOpen={drawerOpen} /></Wrapper>,
                    },
                    {
                        label: 'AI接口分析',
                        key: '5',
                        children: <Wrapper><AIResponse record={record} drawerOpen={drawerOpen} type="documentation" /></Wrapper>,
                    },
                    {
                        label: 'AI用例生成',
                        key: '6',
                        children: <Wrapper><AIResponse record={record} drawerOpen={drawerOpen} type="testCase" /></Wrapper>,
                    },
                ]}
            />
        </Drawer>
    );
};

export default RequestDrawer;
