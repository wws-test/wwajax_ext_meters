import {Button, Divider, Drawer, Tabs} from 'antd';
import React, {useEffect, useRef, useState} from 'react';
import {FilterOutlined} from '@ant-design/icons';
import './RequestDrawer.css';
import * as CryptoJS from 'crypto-js';
import {v4 as uuidv4} from 'uuid';
import ReactMarkdown from 'react-markdown';

async function sendAIRequest(content: any) {
    console.log("content", content);
    const apiKey = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ1c2VyLWNlbnRlciIsImV4cCI6MTcxOTg4Nzg3OCwiaWF0IjoxNzEyMTExODc4LCJqdGkiOiJjbzZjMjFrdWR1NmYxcW1hMjRiMCIsInR5cCI6InJlZnJlc2giLCJzdWIiOiJjbmlpaGlwa3FxNGdxMWU5anFqZyIsInNwYWNlX2lkIjoiY25paWhpcGtxcTRncTFlOWpxajAiLCJhYnN0cmFjdF91c2VyX2lkIjoiY25paWhpcGtxcTRncTFlOWpxaWcifQ.G5DXRWN8rImpjmG4M-9xSl5G_3kLf2ZL1jAR_Y_ZwkuxqkZJ6SQU3yVsG_5-QeuqyncAZCFvl3da2Z0N_rzgPQ'; // 请替换为您的Moonshot API密钥
    const url = 'http://10.50.3.213:8000/v1/chat/completions';
    const model = 'moonshot-v1-8k';
    const messages = [
        {
            role: 'system',
            content: '我会输入一些接口信息，你要帮我生成成接口的文档解释（不要重复输出接口信息直接详细阐述接口的作用接口即可），要多角度推断该接口的作用，特别是从路径信息的取名方式 入参字段以及返回的数据 输出markdown格式 正常排版即可 。'
        },
        {role: 'user', content: content}
    ];
    const temperature = 0.3;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({model, messages})
    });

    const result = await response.json();
    console.log(result.choices[0].message.content);
    return result.choices[0].message.content;
}

const aesEncrypt = (text: string, secretKey: string, iv: string): string => {
    // @ts-ignore
    const encrypted = CryptoJS.AES.encrypt(text, secretKey, {iv: iv});
    return encrypted.toString();
};

const setHeaders = (s: any, accessKey: string, secretKey: string, ContentType = 'application/json'): any => {
    const timeStamp = new Date().getTime();
    const combox_key = accessKey + '|' + uuidv4() + '|' + timeStamp;
    const signature = aesEncrypt(combox_key, secretKey, accessKey);
    // console.log(signature);
    const header = {
        'User-Agent': 'python-requests/2.25.1',
        'Content-Type': ContentType,
        'ACCEPT': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'accessKey': accessKey,
        'signature': signature
    };
    s.headers = {...s.headers, ...header};
    return s;
};

function getDataFromIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('myDatabase', 2);

        request.onsuccess = function (event) {
            // @ts-ignore
            const db = event.target.result;
            const transaction = db.transaction('myObjectStore', 'readwrite');
            const objectStore = transaction.objectStore('myObjectStore');

            // 创建两个获取数据的请求
            const getRequest = objectStore.get('projectid');
            const getKeyRequest = objectStore.get('user');

            // 使用Promise.all来等待两个请求都成功完成
            Promise.all([
                new Promise((resolve, reject) => {
                    getRequest.onsuccess = function (event: { target: { result: unknown; }; }) {
                        resolve(event.target.result);
                    };
                    getRequest.onerror = function () {
                        reject(new Error('无法获取projectid'));
                    };
                }),
                new Promise((resolve, reject) => {
                    getKeyRequest.onsuccess = function (event: { target: { result: unknown; }; }) {
                        resolve(event.target.result);
                    };
                    getKeyRequest.onerror = function () {
                        reject(new Error('无法获取user'));
                    };
                })
            ]).then(values => {
                // values数组包含了两个请求的结果
                const [projectData, userData] = values;
                if (projectData) {
                    // @ts-ignore
                    resolve({projectid: projectData.value, user: userData.value});
                } else {
                    reject(new Error('在IndexedDB中未找到projectid的值'));
                }
            }).catch(error => {
                reject(error);
            });

            transaction.oncomplete = function () {
                db.close();
            };
        };

        request.onerror = function (event) {
            reject(new Error('Error opening IndexedDB'));
        };
    });
}

interface RequestDrawerProps {
    drawerOpen: boolean;
    record: any;
    onClose: () => void;
    onAddInterceptorClick: (record: any) => void;
}

const Wrapper = (props: { children: any }) => {
    return <div style={{height: 'calc(100vh - 160px)', overflow: 'auto'}}>
        {props.children}
    </div>;
};
export default (props: RequestDrawerProps) => {
    const {drawerOpen, record, onClose, onAddInterceptorClick} = props;

    const Headers = () => {
        return <>
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
            {/*<div className="ajax-tools-devtools-text">*/}
            {/*  <strong>Referrer Policy:&nbsp;</strong>*/}
            {/*  <span>xxx</span>*/}
            {/*</div>*/}

            <Divider orientation="left" style={{margin: '12px 0 4px'}}/>
            <h4><strong>Response Headers</strong></h4>
            <div className="ajax-tools-devtools-text">
                <strong>Http Version:&nbsp;</strong>
                <span>{record.response.httpVersion}</span>
            </div>
            {
                record.response.headers.map((v: { name: string, value: string }) => {
                    return <div className="ajax-tools-devtools-text" key={v.name}>
                        <strong>{v.name}:&nbsp;</strong>
                        <span>{v.value}</span>
                    </div>;
                })
            }

            <Divider orientation="left" style={{margin: '12px 0 4px'}}/>
            <h4><strong>Request Headers</strong></h4>
            <div className="ajax-tools-devtools-text">
                <strong>Http Version:&nbsp;</strong>
                <span>{record.request.httpVersion}</span>
            </div>
            {
                record.request.headers.map((v: { name: string, value: string }) => {
                    return <div className="ajax-tools-devtools-text" key={v.name}>
                        <strong>{v.name}:&nbsp;</strong>
                        <span>{v.value}</span>
                    </div>;
                })
            }
        </>;
    };
    /**
     * 格式化文本
     * @param value - 需要格式化的字符串
     * @returns 格式化后的文本
     */
    const formatText = (value: string) => {
        let text = '';
        try {
            text = JSON.stringify(JSON.parse(value), null, 4);  // 将字符串解析为JSON对象，再将JSON对象转换为格式化后的字符串
        } catch (e) {
            text = value;  // 如果解析失败，则直接使用原始字符串
        }
        return text;
    };
    const Payload = () => {
        const postData = record.request.postData || {};
        return <>
            <h4><strong>Query String Parameters</strong></h4>
            {
                record.request.queryString.map((v: { name: string, value: string }) => {
                    return <div className="ajax-tools-devtools-text" key={v.name}>
                        <strong>{v.name}:&nbsp;</strong>
                        <span>{v.value}</span>
                    </div>;
                })
            }
            <Divider orientation="left" style={{margin: '12px 0 4px'}}/>
            <h4><strong>Request Payload</strong></h4>
            <div className="ajax-tools-devtools-text">
                <strong>mimeType:&nbsp;</strong>
                <span>{postData.mimeType}</span>
            </div>
            <div className="ajax-tools-devtools-text" style={{display: 'flex'}}>
                <strong style={{flex: 'none'}}>text:&nbsp;</strong>
                <pre>{formatText(postData.text)}</pre>
            </div>
            {
                postData.params && <div className="ajax-tools-devtools-text">
                    <strong>Params:&nbsp;</strong>
                    {
                        (postData.params || []).map((v: { name: string, value: string }) => {
                            return <div className="ajax-tools-devtools-text" key={v.name}>
                                <strong>{v.name}:&nbsp;</strong>
                                <span>{v.value}</span>
                            </div>;
                        })
                    }
                </div>
            }
        </>;
    };
    const Response = () => {
        const [response, setResponse] = useState('');
        useEffect(() => {
            if (drawerOpen && record.getContent) {
                record.getContent((content: string) => {
                    setResponse(content);
                });
            }
        }, [drawerOpen, record.getContent]);
        return <>
            <pre>{formatText(response)}</pre>
        </>;
    };
    const Assertion = () => {
        const [response, setResponse] = useState('');
        useEffect(() => {
            if (drawerOpen && record.getContent) {
                record.getContent((content: string) => {
                    setResponse(content);
                });
            }
        }, [drawerOpen, record.getContent]);

        const [responseContent, setResponseContent] = useState("");
        const prevResponseRef = useRef();

        useEffect(() => {
            if (response && response !== prevResponseRef.current) {
                console.log("发送AI请求:", `${JSON.stringify(record.request)}`, response);
                sendAIRequest(`${JSON.stringify(record.request.url) + JSON.stringify(record.request.postData) + response}`)
                    .then((result) => {
                        // @ts-ignore
                        if (result) {
                            console.log("收到响应:", result);
                            setResponseContent(result); // 更新响应内容
                        } else {
                            console.log("无效的响应");
                            // 处理无效的响应
                        }
                    })
                    .catch((error) => {
                        console.log("请求错误:", error);
                        // 处理错误
                    });
                // @ts-ignore
                prevResponseRef.current = response;
            }
        }, [response]);

        if (responseContent) {
            return (
                <ReactMarkdown children={responseContent}/>
            )
        } else {
            return (
                <pre>loading...</pre>
            );
        }
    };
    const CustomPayload = (props: { path: string }) => {
        const {path} = props;
        const url = new URL(path);
        console.log('path', path, url.pathname);
        const [data, setData] = useState<any>(null);
        let s = {headers: {}}; // 创建一个空的请求头对象
        s = setHeaders(s, 'TkA1lh4Mqc4J19Fg', 'BWtRQJgZswbGOMi5'); // 设置请求头
        useEffect(() => {
            // 异步操作
            const fetchData = async () => {
                getDataFromIndexedDB().then(async data => {
                    console.log('Data retrieved from IndexedDB:', data);
                    const requestBody = {
                        name: url.pathname,
                        projectId: ''
                    };
                    // @ts-ignore
                    requestBody.projectId = data.projectId;
                    console.log('requestBody', requestBody);
                    const apiUrl = `http://10.50.3.224:8081/api/definition/queryCaseInfo1`;
                    try {
                        const response = await fetch(apiUrl, {
                            method: 'POST',
                            body: JSON.stringify(requestBody),
                            headers: Object.assign({}, s.headers),
                        });
                        const jsonData = await response.json();
                        setData(jsonData);
                    } catch (error) {
                        console.error(error);
                    }
                });

            };

            fetchData();
        }, [path]);
        if (data) {
            // 使用 formatText 函数对数据进行格式化
            const formattedData = formatText(JSON.stringify(data || {}, null, 4));
            return <>
                <pre>{formattedData}</pre>
            </>;
        }

        return <>
            <pre>loading...</pre>
        </>; // 或者可以返回一个 loading 状态的 UI，表示正在加载数据
    };

    const fetchData = async () => {
        let s = {headers: {}}; // 创建一个空的请求头对象    const url = new URL(record.request.url);
        s = setHeaders(s, 'OjoTCHX6sfhcWMq6', '3kT6tWHbwa1jOyGY'); // 设置请求头
        const postData = record.request.postData || '';

        const url = new URL(record.request.url);
        const uuid = uuidv4();
        getDataFromIndexedDB().then(async data => {
            const requestBody = {};
            // @ts-ignore
            requestBody.projectId = data.projectid;
            requestBody.name = url.pathname;
            requestBody.status = 'Underway';
            requestBody.method = record.request.method;
            // @ts-ignore
            requestBody.userId = data.user;
            requestBody.url = '';
            requestBody.protocol = 'HTTP';
            requestBody.environmentId = '';
            requestBody.moduleId = '';
            requestBody.modulePath = '/未规划接口';
            requestBody.remark = '';
            requestBody.description = 'query参数在这里' + url.search;
            requestBody.tags = '';
            requestBody.request = {
                id: uuid,
                type: 'HTTPSamplerProxy',
                name: url.pathname,
                enabled: true,
                $type: 'Sampler',
                protocol: 'HTTP',
                method: record.request.method,
                path: url.pathname,
                autoRedirects: false,
                followRedirects: true,
                useKeepalive: true,
                doMultipartPost: false,
                connectTimeout: 60000,
                responseTimeout: 60000,
                body: {
                    type: 'Raw',
                    raw: postData.text,
                    kvs: [],
                    binary: []
                },
                arguments: [
                    {
                        type: 'text',
                        enable: true,
                        uuid: '4a0b3',
                        contentType: 'text/plain',
                        required: false,
                        urlEncode: false
                    }
                ],
                rest: [],
                files: [],
                headers: [
                    {
                        name: '',
                        value: '',
                        enable: true
                    }
                ],
                hashTree: [
                    {
                        resourceId: '1dfb130c-bd54-40c5-b33f-1e3eca04e81c',
                        type: 'Assertions',
                        text: [],
                        regex: [],
                        jsonPath: [],
                        jsr223: [],
                        xpath2: [],
                        duration: {
                            type: 'Duration'
                        },
                        enable: true,
                        document: {
                            type: 'JSON',
                            data: {
                                xmlFollowAPI: false,
                                jsonFollowAPI: false,
                                json: [],
                                xml: []
                            },
                            enable: true
                        },
                        clazzName: 'io.metersphere.api.dto.definition.request.assertions.MsAssertions'
                    }
                ],
                clazzName: 'io.metersphere.api.dto.definition.request.sampler.MsHTTPSamplerProxy',
                preSize: 0,
                postSize: 0,
                ruleSize: 0
            };
            requestBody.path = url.pathname;
            requestBody.addFields = [];
            requestBody.editFields = [];
            requestBody.id = uuid;
            requestBody.response = {
                headers: [
                    {
                        name: '',
                        value: '',
                        enable: true
                    }
                ],
                body: {
                    type: 'Raw',
                    raw: 'response',
                    kvs: [],
                    binary: []
                },
                statusCode: [
                    {
                        name: '',
                        value: '',
                        enable: true
                    }
                ],
                type: 'HTTP'
            };
            console.log('requestBody', requestBody);
            const apiUrl = `http://10.50.3.224:8081/api/definition/created`;
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    // @ts-ignore
                    body: JSON.stringify(requestBody),
                    headers: Object.assign({}, s.headers),
                });
                const jsonData = await response.json();
                console.log('jsonData', jsonData);
                alert(JSON.stringify(jsonData, null, 2));
            } catch (error) {
                console.error(error);
            }
        });

    };
    const commit = () => {
        console.log('record', record);
        fetchData();
    };
    const title = record && record.request.url.match('[^/]+(?!.*/)');
    return <Drawer
        title={<span style={{fontSize: 12}}>{title}</span>}
        open={drawerOpen}
        onClose={() => onClose()}
        width="80%"
        placement="right"
        mask={false}
        headerStyle={{padding: '8px 12px', fontSize: '14px', wordBreak: 'break-all'}}
        bodyStyle={{padding: '6px 24px'}}
    >
        <Tabs
            defaultActiveKey="1"
            size="small"
            // onChange={onChange}
            tabBarExtraContent={{
                right: (
                    <>
                        <FilterOutlined
                            className="ajax-tools-devtools-text-btn"
                            title="Add requests to be intercepted"
                            onClick={() => onAddInterceptorClick(record)}
                        />
                        <div style={{width: '8px'}}></div>
                        {/* 使用CSS样式设置间距 */}
                        <Button
                            type="primary"
                            onClick={() => commit()}
                        >
                            提交
                        </Button>
                    </>
                )
            }}
            items={[
                {
                    label: `请求头`,
                    key: '1',
                    children: <Wrapper><Headers/></Wrapper>,
                },
                {
                    label: `请求体`,
                    key: '2',
                    children: <Wrapper><Payload/></Wrapper>,
                },
                {
                    label: `响应体`,
                    key: '3',
                    children: <Wrapper><Response/></Wrapper>,
                },
                {
                    label: `AI接口分析`,
                    key: '5',
                    children: <Wrapper><Assertion/></Wrapper>,
                },
            ]}
        />
    </Drawer>;
};
