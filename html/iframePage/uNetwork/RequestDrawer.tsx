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
import { JsonViewer } from '@textea/json-viewer';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';

// 注册语言
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('xml', xml);
SyntaxHighlighter.registerLanguage('javascript', javascript);

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

interface ResponseProps {
    record: any;
    drawerOpen: boolean;
}

const Response: React.FC<ResponseProps> = ({ record, drawerOpen }) => {
    const [response, setResponse] = useState('');
    const [contentType, setContentType] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (drawerOpen && record.getContent) {
            const contentTypeHeader = record.response.headers.find(
                (header: { name: string; value: string }) => 
                    header.name.toLowerCase() === 'content-type'
            );
            setContentType(contentTypeHeader?.value || '');

            record.getContent((content: string) => {
                setResponse(content);
                setError(null);
            });
        }
    }, [drawerOpen, record]);

    const renderContent = () => {
        if (error) {
            return <div className="response-error">{error}</div>;
        }

        try {
            // 尝试解析为JSON
            if (contentType.includes('application/json') || (!contentType && isValidJSON(response))) {
                const jsonData = JSON.parse(response);
                return (
                    <div className="json-viewer">
                        <JsonViewer 
                            value={jsonData}
                            rootName={false}
                            displayDataTypes={false}
                            enableClipboard
                            displaySize
                            theme={{
                                scheme: 'custom',
                                author: 'custom',
                                base00: 'transparent',
                                base01: '#eee',
                                base02: '#ccc',
                                base03: '#999',
                                base04: '#666',
                                base05: '#333',
                                base06: '#000',
                                base07: '#000',
                                base08: '#ff4d4f', // null
                                base09: '#722ed1', // number
                                base0A: '#fa8c16', // boolean
                                base0B: '#52c41a', // string
                                base0C: '#1890ff', // key
                                base0D: '#1890ff', // brackets
                                base0E: '#722ed1', // symbol
                                base0F: '#ff4d4f'  // error
                            }}
                        />
                    </div>
                );
            }

            // XML内容
            if (contentType.includes('xml')) {
                return (
                    <SyntaxHighlighter 
                        language="xml" 
                        style={docco}
                        customStyle={{
                            margin: 0,
                            borderRadius: '4px'
                        }}
                    >
                        {response}
                    </SyntaxHighlighter>
                );
            }

            // JavaScript内容
            if (contentType.includes('javascript')) {
                return (
                    <SyntaxHighlighter 
                        language="javascript" 
                        style={docco}
                        customStyle={{
                            margin: 0,
                            borderRadius: '4px'
                        }}
                    >
                        {response}
                    </SyntaxHighlighter>
                );
            }

            // 其他类型内容
            return (
                <SyntaxHighlighter 
                    language="text" 
                    style={docco}
                    customStyle={{
                        margin: 0,
                        borderRadius: '4px'
                    }}
                >
                    {response}
                </SyntaxHighlighter>
            );
        } catch (err) {
            // 如果JSON解析失败，显示原始内容
            return (
                <SyntaxHighlighter 
                    language="text" 
                    style={docco}
                    customStyle={{
                        margin: 0,
                        borderRadius: '4px'
                    }}
                >
                    {response}
                </SyntaxHighlighter>
            );
        }
    };

    return (
        <div className="response-container">
            {response ? renderContent() : <div className="loading">Loading...</div>}
        </div>
    );
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

// 辅助函数：验证字符串是否为有效的JSON
const isValidJSON = (str: string): boolean => {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
};

export default RequestDrawer;
