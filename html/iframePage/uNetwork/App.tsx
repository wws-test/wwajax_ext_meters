/* eslint-disable object-curly-spacing */
/* eslint-disable indent */
import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import { VTablePro } from 'virtualized-table';
import { Button, Input, Modal, Radio, Space, message } from 'antd';
import {
  BuildFilled,
  FilterOutlined,
  MenuUnfoldOutlined,
  PauseCircleFilled,
  PlayCircleTwoTone,
  StopOutlined,
  SaveOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import 'antd/dist/antd.css';
import './App.css';
import RequestDrawer from './RequestDrawer';
import { AjaxDataListObject, defaultInterface, DefaultInterfaceObject } from '../common/value';
import { HeadersUtil, ENCRYPTION_CONFIG } from './utils/encryption';
import { ChromeStorageUtil } from './utils/db';
import { strToRegExp, getChromeLocalStorage } from './utils/common';
import { v4 as uuidv4 } from 'uuid';
import ScenarioAnalysisModal from './components/ScenarioAnalysisModal';
import { APIUtil } from './utils/api';

interface AddInterceptorParams {
    ajaxDataList: AjaxDataListObject[],
    iframeVisible?: boolean,
    groupIndex?: number,
    request: string,
    responseText: string
}

interface NetworkEntry {
  request: {
    url: string;
    method: string;
  };
  response: {
    status: string;
  };
  time: number;
}

interface RequestBodyItem {
  projectId: string;
  userId: string;
  name: string;
  status: string;
  method: string;
  url: string;
  protocol: string;
  environmentId: string;
  moduleId: string;
  modulePath: string;
  remark: string;
  description: string;
  tags: string;
  path: string;
  addFields: any[];
  editFields: any[];
  id: string;
}

interface ScenarioData {
    id: string;
    requestInfo: {
        url: string;
        method: string;
        queryParams: Array<{ name: string; value: string }>;
        postData: any;
        headers: Array<{ name: string; value: string }>;
    };
    responseData: string;
    timestamp: number;
}

interface Dependency {
    from: number;
    param: string;
    value: string;
}

interface RowSelectionConfig {
    columnWidth: number;
    selectedRowKeys: React.Key[];
    type: 'checkbox';
    onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => void;
    onSelect: (record: any, selected: boolean, selectedRows: any[], nativeEvent: Event) => void;
    onSelectAll: (selected: boolean, selectedRows: any[], changeRows: any[]) => void;
    getCheckboxProps: (record: any) => { disabled: boolean; name: string };
}

const aesEncrypt = (text: string, secretKey: string, iv: string): string => {
    // @ts-ignore
    const encrypted = CryptoJS.AES.encrypt(text, secretKey, {iv: iv});
    return encrypted.toString();
};

const setHeaders = (s: any, accessKey: string, secretKey: string): any => {
    const timeStamp = new Date().getTime();
    const combox_key = accessKey + '|' + uuidv4() + '|' + timeStamp;
    const signature = aesEncrypt(combox_key, secretKey, accessKey);
    const header = {
        'User-Agent': 'python-requests/2.25.1',
        'Content-Type': 'application/json',
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

const fetchData = async (requestBodyList: any) => {
    let s = {headers: {}}; // 创建一个空的请求头对象    const url = new URL(record.request.url);
    s = setHeaders(s, 'mByqaSdYnUaHWY9i', 'nZYPci3jhJJoYzU2'); // 设置请求头
    getDataFromIndexedDB().then(async data => {

        const apiUrl = `https://metersphere.chintanneng.com/api/definition/Bulk_import_created`;
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                // @ts-ignore
                body: JSON.stringify(requestBodyList),
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

// "/^t.*$/" or "^t.*$" => new RegExp
// 定义一个函数，将字符串转换为正则表达式
const strToRegExp1 = (regStr: string) => {
    // 初始化一个空的正则表达式
    let regexp = new RegExp('');
    try {
        // 使用正则表达式匹配字符串中的正则表达式部分和修饰符部分
        const regParts = regStr.match(new RegExp('^/(.*?)/([gims]*)$'));
        if (regParts) {
            // 如果匹配成功，则使用提取出的正则表达式和修饰符创建新的正则表达式
            regexp = new RegExp(regParts[1], regParts[2]);
        } else {
            // 如果匹配失败，则直接使用原始字符串创建正则表达式
            regexp = new RegExp(regStr);
        }
    } catch (error) {
        // 捕获可能的错误，并打印错误信息
        console.error(error);
    }
    // 返回转换后的正则表达式
    return regexp;
};
export default () => {
    const requestFinishedRef = useRef<any>(null);
    const [recording, setRecording] = useState(false);
    const [uNetwork, setUNetwork] = useState<any>([]);
    const [filterKey, setFilterKey] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currRecord, setCurrRecord] = useState(null);
    const [comparedRows, setComparedRows] = useState([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState<any>([]);
    const [selectedRows, setSelectedRows] = useState<any>([]);
    const [savedScenarios, setSavedScenarios] = useState<any[]>([]);
    const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');

    const getColumns = ({
                            onAddInterceptorClick,
                            onRequestUrlClick
                        }: {
        onAddInterceptorClick: (record: any) => void,
        onRequestUrlClick: (record: any) => void,

    }) => {
        return [
            {
                title: 'Index',
                dataIndex: 'Index',
                width: 60,
                align: 'center',
                render: (value: any, record: any, index: any, realIndex: number) => realIndex + 1,
            },
            {
                title: 'Name',
                dataIndex: 'name',
                width: 200,
                ellipsis: true,
                style: {padding: '0 4px'},
                render: (value: any, record: { request: { url: string }; }) => {
                    const name = record.request.url.match('[^/]+(?!.*/)');
                    return <span
                        className="ajax-tools-devtools-text-btn"
                        title={record.request.url}
                        onClick={() => onRequestUrlClick(record)}
                    >
            {name && name[0]}
          </span>;
                }
            },
            {
                title: 'Method',
                dataIndex: 'method',
                width: 60,
                align: 'center',
                render: (value: any, record: { request: { method: string }; }) => record.request.method,
            },
            {
                title: 'Time(秒)',
                dataIndex: 'time',
                width: 60,
                align: 'center',
                // @ts-ignore
                render: (value: any, record: { response: { status: string }; }) => (record.time / 1000).toFixed(4),
            },
            {
                title: 'Status',
                dataIndex: 'status',
                width: 60,
                align: 'center',
                render: (value: any, record: { response: { status: string }; }) => record.response.status,
            },
            {
                title: 'metersphere',
                dataIndex: 'metersphere',
                width: 60,
                align: 'center',
                render: (text: any, record: any, index: any) => {
                    // @ts-ignore
                    return comparedRows.includes(index) ? 'miss' : '';
                }
            },
            // { title: 'Initiator', dataIndex: 'initiator', width: 100 },
            // {
            //   title: 'Size',
            //   dataIndex: 'size',
            //   width: 60,
            //   render: (value, record) => record.response.bodySize,
            // },
            // { title: 'Time', dataIndex: 'time', width: 60 },
            {
                title: 'Action',
                dataIndex: 'action',
                width: 60,
                align: 'center',
                render: (value: any, record: any) => {
                    return <>
                        <FilterOutlined
                            className="ajax-tools-devtools-text-btn"
                            title="Add request to be intercepted"
                            onClick={() => onAddInterceptorClick(record)}
                        />
                    </>;
                }
            }
        ];
    };
    const filteredDataSource = uNetwork
        .filter((v: { request: { url: string; }; }) => v.request.url.match(strToRegExp(filterKey)));

    // 定义行选择功能的配置对象 rowSelection
    const rowSelection: RowSelectionConfig = {
        // 设置复选框所在列的宽度为60像素
        columnWidth: 60,

        // 设置当前选中的行键，与 selectedRowKeys 状态保持同步
        selectedRowKeys,

        // 指定选择类型为复选框形式
        type: 'checkbox',

        // onChange 回调会在用户更改选中项时触发，更新 selectedRowKeys 状态并打印变化后的选中信息
        onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
            setSelectedRowKeys(selectedRowKeys);
            setSelectedRows(selectedRows);
        },

        // onSelect 回调会在用户单独勾选或取消勾选某一行时触发
        onSelect: (record: any, selected: boolean, selectedRows: any[], nativeEvent: Event) => {
            const keys = selected ? 
                [...selectedRowKeys, record.id] : 
                selectedRowKeys.filter(key => key !== record.id);
            setSelectedRowKeys(keys);
            setSelectedRows(selectedRows);
        },

        // onSelectAll 回调会在用户全选/反选所有行时触发
        onSelectAll: (selected: boolean, selectedRows: any[], changeRows: any[]) => {
            const keys = selected ? 
                filteredDataSource.map((item: any) => item.id) : 
                [];
            setSelectedRowKeys(keys);
            setSelectedRows(selectedRows);
        },

        // 获取每一行的key
        getCheckboxProps: (record: any) => ({
            disabled: false, // 设置是否禁用复选框
            name: record.id,
        }),
    };
    // 定义一个名为setUNetworkData的函数，参数为request
    const uNetworkSet = new Set(); // Create a Set to store unique URLs
    const setUNetworkData = function (entry: any) {
        if (['fetch', 'xhr'].includes(entry._resourceType)) {
            const url = new URL(entry.request.url);
            if (!url.pathname.startsWith('/custom') && !url.pathname.endsWith('.json') && !url.pathname.endsWith('.png') && !url.pathname.endsWith('.js') && !url.pathname.endsWith('.css')) {
                const contentType = entry.response.headers.find((header: any) => header.name.toLowerCase() === 'content-type');
                if (contentType && contentType.value.toLowerCase().includes('text/html')) {
                    return; // 如果响应的Content-Type是text/html，则直接返回，不执行后续操作
                }
                if (!uNetworkSet.has(entry.request.url)) {
                    uNetworkSet.add(entry.request.url);
                    // 添加唯一ID
                    entry.id = uuidv4();
                    uNetwork.push(entry);
                    setUNetwork([...uNetwork]);
                }
            }
        }
    };
    useEffect(() => {
        // 当 recording 状态发生变化时执行
        if (chrome.devtools) {
            if (recording) {
                // 设置 requestFinishedRef.current 为 setUNetworkData 函数
                requestFinishedRef.current = setUNetworkData;
                console.log('requestFinishedRef.current', requestFinishedRef.current);
                // 向 chrome.devtools.network 注册 requestFinished 事件监听器
                chrome.devtools.network.onRequestFinished.addListener(requestFinishedRef.current);
            } else {
                // 从 chrome.devtools.network 移除 requestFinished 事件监听器
                chrome.devtools.network.onRequestFinished.removeListener(requestFinishedRef.current);
            }
        }
    }, [recording]);

    useEffect(() => {
        // 当 uNetwork 数组发生变化且 recording 为 true 且 uNetwork 长度小于 1 时执行
        if (chrome.devtools && recording && uNetwork.length < 1) {
            // 从 chrome.devtools.network 移除 requestFinished 事件监听器
            chrome.devtools.network.onRequestFinished.removeListener(requestFinishedRef.current);
            // 设置 requestFinishedRef.current 为 setUNetworkData 函数
            requestFinishedRef.current = setUNetworkData;
            // 向 chrome.devtools.network 注册 requestFinished 事件监听器
            chrome.devtools.network.onRequestFinished.addListener(requestFinishedRef.current);
        }
    }, [uNetwork]);

    const getChromeLocalStorage = (keys: string | string[]) => new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result);
            }
        });
    });
    const compare = () => {
        const fetchData = async () => {
            try {
                const data = await ChromeStorageUtil.getData();
                const uNetworkList = Array.from(uNetwork as NetworkEntry[]).map((entry: NetworkEntry) => {
                    const url = new URL(entry.request.url);
                    return url.pathname;
                });
                console.log('uNetworkList', uNetworkList);
                
                const requestBody = {
                    paths: uNetworkList,
                    projectId: data.projectid
                };

                const s = HeadersUtil.setHeaders(ENCRYPTION_CONFIG);
                const apiUrl = 'https://metersphere.chintanneng.com/project/addRedisInterface';
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    body: JSON.stringify(requestBody),
                    headers: s.headers,
                });

                const jsonData = await response.json();
                console.log('jsonData', jsonData);
                
                const dataToCompare = jsonData.data;
                console.log('dataToCompare', dataToCompare);
                
                const comparedRow = dataToCompare.map((item: string) => {
                    const index = uNetworkList.findIndex((path) => path === item);
                    return index;
                });
                setComparedRows(comparedRow);
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
    };
    /**
     * 当点击添加拦截器时的回调函数
     * @param record - 记录对象，包含请求信息和获取内容的方法
     */
    const onAddInterceptorClick = (
        record: {
            request: { url: string; };
            getContent: (arg0: (content: any) => void) => void;
        }
    ) => {
        const requestUrl = record.request.url.split('?')[0];
        const matchUrl = requestUrl.match('(?<=//.*/).+');
        console.log('requestUrl:', requestUrl);
        console.log('matchUrl:', matchUrl && matchUrl[0]);
        if (record.getContent) {
            record.getContent((content) => {
                handleAddInterceptor({
                    request: matchUrl && matchUrl[0] || '',
                    responseText: content
                });
            });
        } else {
            // 如果不存在获取内容的方法，则直接处理添加拦截器的逻辑
            handleAddInterceptor({
                request: matchUrl && matchUrl[0] || '',
                responseText: ''
            });
        }
    };
    // 定义一个异步函数，用于处理添加拦截器的操作
    const handleAddInterceptor = async (
        {request, responseText}: { request: string, responseText: string }
    ) => {
        try {
            const {
                ajaxDataList = [],
                iframeVisible
            } = await ChromeStorageUtil.get(['iframeVisible', 'ajaxDataList']);
            
            const interfaceList = ajaxDataList.flatMap((item: {
                interfaceList: DefaultInterfaceObject[];
            }) => item.interfaceList || []);
            
            const hasIntercepted = interfaceList.some((v: { request: string | null }) => v.request === request);
            
            if (hasIntercepted) {
                const confirmed = await new Promise((resolve) => {
                    Modal.confirm({
                        title: '请求已被截获',
                        content: '此请求已被截获。是否要添加另一个拦截器？',
                        onOk: () => resolve(true),
                        onCancel: () => resolve(false),
                    });
                });
                
                if (confirmed) {
                    await addInterceptorIfNeeded({ ajaxDataList, iframeVisible, request, responseText });
                }
            } else {
                await addInterceptorIfNeeded({ ajaxDataList, iframeVisible, request, responseText });
            }
        } catch (error) {
            console.error(error);
        }
    };
    const addInterceptorIfNeeded = async ({
                                              ajaxDataList,
                                              iframeVisible,
                                              request,
                                              responseText
                                          }: AddInterceptorParams) => {
        if (ajaxDataList.length === 0) { // 首次，未添加过拦截接口
            ajaxDataList = [{
                summaryText: 'Group Name（Editable）',
                collapseActiveKeys: [],
                headerClass: 'ajax-tools-color-volcano',
                interfaceList: []
            }];
        }
        const groupIndex: any = ajaxDataList.length > 1 ? await showGroupModal({ajaxDataList}) : 0;
        showSidePage(iframeVisible);
        addInterceptor({ajaxDataList, groupIndex, request, responseText});
    };
    const showGroupModal = ({ajaxDataList}: { ajaxDataList: AjaxDataListObject[] }) => new Promise((resolve) => {
        const SelectGroupContent = (props: { onChange: (arg0: any) => void; }) => {
            const [value, setValue] = useState(0);
            return <Radio.Group
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    props.onChange(e.target.value);
                }}
            >
                <Space direction="vertical">
                    {ajaxDataList.map((v, index) => <Radio key={index}
                                                           value={index}>Group {index + 1}：{v.summaryText}</Radio>)}
                </Space>
            </Radio.Group>;
        };
        let _groupIndex = 0;
        Modal.confirm({
            title: 'Which group to add to',
            content: <SelectGroupContent onChange={(value) => _groupIndex = value}/>,
            onOk: () => resolve(_groupIndex),
        });
    });
    const showSidePage = (iframeVisible: undefined | boolean) => {
        if (iframeVisible) { // 当前没展示，要展示
            chrome.tabs.query(
                {active: true, currentWindow: true},
                function (tabs) {
                    const tabId = tabs[0]?.id;
                    // 发送消息到content.js
                    if (tabId) {
                        chrome.tabs.sendMessage(
                            tabId,
                            {type: 'iframeToggle', iframeVisible},
                            function (response) {
                                console.log('【uNetwork/App.jsx】->【content】【ajax-tools-iframe-show】Return message:', response);
                                chrome.storage.local.set({iframeVisible: response.nextIframeVisible});
                            }
                        );
                    }
                }
            );
        }
    };
    /**
     * 添加拦截器
     * @param ajaxDataList - AJAX数据列表
     * @param groupIndex - 分组索引，默认为0
     * @param request - 请求对象
     * @param responseText - 响应文本
     */
    const addInterceptor = (
        {ajaxDataList, groupIndex = 0, request, responseText}: AddInterceptorParams
    ) => {
        const key = String(Date.now());
        ajaxDataList[groupIndex]!.collapseActiveKeys.push(key);
        const interfaceObj: DefaultInterfaceObject = {
            ...defaultInterface,
            key,
            request,
            responseText,
        };
        ajaxDataList[groupIndex].interfaceList.push(interfaceObj);
        // 发送给iframe(src/App.jsx)侧边页面，更新ajaxDataList
        chrome.runtime.sendMessage(chrome.runtime.id, {
            type: 'ajaxTools_updatePage',
            to: 'mainSettingSidePage',
            ajaxDataList
        });
    };
    // 定义一个名为onRequestUrlClick的函数，参数为record，类型为React.SetStateAction<null>
    const onRequestUrlClick = (record: React.SetStateAction<null>) => {
        // 设置当前记录为传入的record
        setCurrRecord(record);
        // 打开抽屉
        setDrawerOpen(true);
    };
    const columns = getColumns({
        onAddInterceptorClick,
        onRequestUrlClick,
    });
    const clearRecords = () => {
        setUNetwork([]);
        setComparedRows([]);
    };

    const metersphere_import = () => {
        const requestBodyList = selectedRows.map((record: NetworkEntry) => {
            const url = new URL(record.request.url);
            const uuid = uuidv4();
            return {
                projectId: '',
                name: url.pathname,
                status: 'Underway',
                method: record.request.method,
                userId: '',
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
                id: uuid,
            } as RequestBodyItem;
        });

        const fetchData = async () => {
            try {
                const data = await ChromeStorageUtil.getData();
                requestBodyList.forEach((item: RequestBodyItem) => {
                    item.projectId = data.projectid || '';
                    item.userId = data.user || '';
                });

                const s = HeadersUtil.setHeaders(ENCRYPTION_CONFIG);
                const apiUrl = 'https://metersphere.chintanneng.com/api/definition/Bulk_import_created';
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    body: JSON.stringify(requestBodyList),
                    headers: s.headers,
                });

                const result = await response.json();
                console.log('result', result);
                alert(JSON.stringify(result, null, 2));
            } catch (error) {
                console.error(error);
            }
        };

        fetchData();
    };

    const analyzeScenario = async (scenarioData: ScenarioData[]) => {
        try {
            // 构建场景数据
            const analysisData = `
场景概述：
- 接口总数：${scenarioData.length}
- 场景创建时间：${new Date().toLocaleString()}

接口列表：
${scenarioData.map((api, index) => {
    const url = new URL(api.requestInfo.url);
    return `${index + 1}. ${api.requestInfo.method} ${url.pathname}
    - 请求参数：${JSON.stringify(api.requestInfo.queryParams)}
    - 请求体：${api.requestInfo.postData?.text || '无'}
    - 响应数据：${api.responseData.substring(0, 200)}...`;
}).join('\n\n')}`;

            // 调用AI接口获取分析结果
            const aiAnalysis = await APIUtil.sendAIRequest(analysisData, 'scenario_analysis');
            
            // 如果AI分析成功，直接返回分析结果
            if (aiAnalysis) {
                return aiAnalysis;
            }

            // 如果AI分析失败，返回基础分析结果
            const report = [];
            
            // 1. 基本信息概述
            report.push('# 测试场景分析报告\n');
            report.push(`## 基本信息\n`);
            report.push(`- 接口总数：${scenarioData.length}`);
            report.push(`- 场景创建时间：${new Date().toLocaleString()}\n`);

            // 2. 接口调用顺序分析
            report.push('## 接口调用顺序\n');
            scenarioData.forEach((api, index) => {
                const url = new URL(api.requestInfo.url);
                report.push(`${index + 1}. \`${api.requestInfo.method}\` ${url.pathname}`);
            });
            report.push('');

            // 3. 参数依赖关系分析
            report.push('## 参数依赖关系分析\n');
            const parameterMap = new Map();
            const responseDataMap = new Map();

            // 分析请求参数
            scenarioData.forEach((api, index) => {
                const url = new URL(api.requestInfo.url);
                const queryParams = api.requestInfo.queryParams || [];
                const postData = api.requestInfo.postData?.text ? JSON.parse(api.requestInfo.postData.text) : {};
                
                // 收集请求参数
                const parameters = [...queryParams, ...Object.entries(postData)];
                if (parameters.length > 0) {
                    parameterMap.set(index, parameters);
                }

                // 收集响应数据
                try {
                    const responseJson = JSON.parse(api.responseData);
                    responseDataMap.set(index, responseJson);
                } catch (e) {
                    // 响应不是JSON格式，跳过
                }
            });

            // 分析参数依赖
            report.push('### 参数传递关系\n');
            parameterMap.forEach((params: any[], apiIndex: number) => {
                const dependencies: Dependency[] = [];
                params.forEach((param: [string, any]) => {
                    // 检查参数值是否来自之前接口的响应
                    responseDataMap.forEach((response, respIndex) => {
                        if (respIndex >= apiIndex) return;
                        
                        const paramValue = param[1]?.toString() || '';
                        if (JSON.stringify(response).includes(paramValue)) {
                            dependencies.push({
                                from: respIndex,
                                param: param[0],
                                value: paramValue
                            });
                        }
                    });
                });

                if (dependencies.length > 0) {
                    const url = new URL(scenarioData[apiIndex].requestInfo.url);
                    report.push(`#### ${apiIndex + 1}. ${url.pathname}\n`);
                    dependencies.forEach(dep => {
                        report.push(`- 参数 \`${dep.param}\` 可能依赖于接口 ${dep.from + 1} 的响应数据`);
                    });
                    report.push('');
                }
            });

            // 4. 测试建议
            report.push('## 测试建议\n');
            report.push('### 功能测试建议');
            report.push('1. 验证所有必填参数的校验逻辑');
            report.push('2. 测试参数边界值和异常情况');
            report.push('3. 验证接口之间的数据传递是否正确\n');

            report.push('### 性能测试建议');
            report.push('1. 建议对关键接口进行并发测试');
            report.push('2. 监控接口响应时间，建议阈值：');
            report.push('   - 普通接口：< 1s');
            report.push('   - 数据处理接口：< 3s\n');

            report.push('### 安全测试建议');
            report.push('1. 验证接口的访问权限控制');
            report.push('2. 检查敏感数据的加密传输');
            report.push('3. 进行必要的 SQL 注入和 XSS 测试\n');

            return report.join('\n');
        } catch (error) {
            console.error('场景分析失败:', error);
            throw error;
        }
    };

    const handleSaveTestScenario = async () => {
        if (!selectedRows.length) {
            message.warning('请先选择需要保存的接口');
            return;
        }

        try {
            // 预处理选中的接口数据
            const scenarioData = await Promise.all(selectedRows.map(async (record: any) => {
                // 提取请求信息
                const requestInfo = {
                    url: record.request.url,
                    method: record.request.method,
                    queryParams: record.request.queryString,
                    postData: record.request.postData,
                    headers: record.request.headers
                };

                // 提取响应信息
                let responseData = '';
                try {
                    responseData = await new Promise((resolve) => {
                        record.getContent((content: string) => {
                            resolve(content);
                        });
                    });
                } catch (error) {
                    console.error('获取响应内容失败:', error);
                }

                return {
                    id: record.id,
                    requestInfo,
                    responseData,
                    timestamp: record.time
                };
            }));

            setAnalysisModalVisible(true);
            setAnalysisLoading(true);

            try {
                const result = await analyzeScenario(scenarioData);
                setAnalysisResult(result);
                
                setSavedScenarios(prev => [...prev, {
                    id: uuidv4(),
                    name: `测试场景_${new Date().toLocaleString()}`,
                    data: scenarioData,
                    analysis: result
                }]);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : '未知错误';
                message.error('场景分析失败：' + errorMessage);
            } finally {
                setAnalysisLoading(false);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            message.error('处理数据时出错：' + errorMessage);
        }
    };

    const handleDownloadJMeter = () => {
        // TODO: 实现JMeter脚本下载功能
        message.info('JMeter脚本下载功能开发中...');
    };

    return <div className="ajax-tools-devtools">
        <div className="ajax-tools-devtools-header">
            <div className="ajax-tools-devtools-header-left">
                <div className="ajax-tools-devtools-header-btn-group">
                    {recording ? (
                        <PauseCircleFilled
                            className="ajax-tools-devtools-text-btn"
                            title="Stop recording"
                            onClick={() => setRecording(false)}
                        />
                    ) : (
                        <PlayCircleTwoTone
                            className="ajax-tools-devtools-text-btn"
                            title="Start recording"
                            onClick={() => setRecording(true)}
                        />
                    )}
                    <StopOutlined
                        className="ajax-tools-devtools-text-btn"
                        title="Clear all"
                        onClick={clearRecords}
                    />
                    <BuildFilled
                        className="ajax-tools-devtools-text-btn"
                        title="Compare with metersphere"
                        onClick={compare}
                    />
                    <MenuUnfoldOutlined
                        className="ajax-tools-devtools-text-btn"
                        title="Import to metersphere"
                        onClick={metersphere_import}
                    />
                    <SaveOutlined
                        className="ajax-tools-devtools-text-btn"
                        title="保存测试场景"
                        onClick={handleSaveTestScenario}
                        style={{ color: selectedRows.length ? '#1890ff' : '#999' }}
                    />
                    <DownloadOutlined
                        className="ajax-tools-devtools-text-btn"
                        title="下载JMeter脚本"
                        onClick={handleDownloadJMeter}
                        style={{ color: savedScenarios.length ? '#1890ff' : '#999' }}
                    />
                </div>
            </div>
            <div className="ajax-tools-devtools-header-right">
                <Input
                    placeholder="Filter"
                    value={filterKey}
                    onChange={(e) => setFilterKey(e.target.value)}
                />
            </div>
        </div>
        <VTablePro
            dataSource={filteredDataSource}
            columns={getColumns({
                onAddInterceptorClick,
                onRequestUrlClick
            })}
            rowSelection={rowSelection}
            rowKey="id"
            scroll={{ y: 'calc(100vh - 80px)' }}
        />
        {
            currRecord && <RequestDrawer
                drawerOpen={drawerOpen}
                record={currRecord}
                onClose={() => setDrawerOpen(false)}
                onAddInterceptorClick={onAddInterceptorClick}
            />
        }
        <ScenarioAnalysisModal
            visible={analysisModalVisible}
            onClose={() => setAnalysisModalVisible(false)}
            loading={analysisLoading}
            analysisResult={analysisResult}
        />
    </div>;
};
