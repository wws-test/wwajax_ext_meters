/* eslint-disable object-curly-spacing */
/* eslint-disable indent */
import React, { useEffect, useRef, useState, useMemo } from 'react';
// @ts-ignore
import { VTablePro } from 'virtualized-table';
import { Button, Input, Modal, Radio, Space, message, Drawer, Tooltip, Switch } from 'antd';
import {
  BuildFilled,
  FilterOutlined,
  MenuUnfoldOutlined,
  PauseCircleFilled,
  PlayCircleTwoTone,
  StopOutlined,
  SaveOutlined,
  DownloadOutlined,
  SearchOutlined,
  DeleteOutlined
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
import { JMeterGenerator } from './utils/jmeterGenerator';
import type { TableRowSelection } from 'antd/es/table/interface';

interface AddInterceptorParams {
    ajaxDataList: AjaxDataListObject[],
    iframeVisible?: boolean,
    groupIndex?: number,
    request: string,
    responseText: string
}

interface NetworkRecord {
    id: string;
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

interface RequestInfo {
    url: string;
    method: string;
    headers: Array<{ name: string; value: string }>;
    queryParams?: Array<{ name: string; value: string }>;
    postData?: {
        text: string;
    };
}

interface RequestRecord {
    requestInfo: RequestInfo;
    [key: string]: any;
}

interface FilteredItem {
    id: string | number;
    requestInfo: RequestInfo;
    [key: string]: any;
}

interface PostData {
    [key: string]: unknown;
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
    const [filteredData, setFilteredData] = useState<RequestRecord[]>([]);
    const [dataSource, setDataSource] = useState<RequestRecord[]>([]);
    const [searchText, setSearchText] = useState('');
    const [isAnalysisOutdated, setIsAnalysisOutdated] = useState(false);

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

    // 修改行选择配置
    const rowSelection: TableRowSelection<NetworkRecord> = {
        columnWidth: 60,
        selectedRowKeys,
        type: 'checkbox',
        onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
            setSelectedRowKeys(selectedRowKeys);
            setSelectedRows(selectedRows);
            // 当选择变更时，将分析标记为已过期
            setIsAnalysisOutdated(true);
            // 如果当前分析面板是打开的，自动重新触发分析
            if (analysisModalVisible) {
                handleSaveTestScenario();
            }
        },
        onSelect: (record: any, selected: boolean, selectedRows: any[]) => {
            console.log('选择:', record, selected, selectedRows);
        },
        onSelectAll: (selected: boolean, selectedRows: any[], changeRows: any[]) => {
            console.log('全选:', selected, selectedRows, changeRows);
        },
        getCheckboxProps: (record: any) => ({
            disabled: false,
            name: record.url,
        }),
    };
    // URL请求记录映射
    const urlRequestMap = new Map<string, { first: any; last: any }>();

    const setUNetworkData = function (entry: any) {
        if (entry) {
            // 只接受fetch和xhr类型的请求
            if (entry._resourceType && !['fetch', 'xhr'].includes(entry._resourceType)) {
                return;
            }

            const url = new URL(entry.request.url);
            if (!url.pathname.endsWith('.js') &&
                !url.pathname.endsWith('.css')) {
                
                const contentType = entry.response.headers.find(
                    (header: any) => header.name.toLowerCase() === 'content-type'
                );
                
                if (contentType && contentType.value.toLowerCase().includes('text/html')) {
                    return;
                }

                // 为新请求添加唯一ID
                entry.id = uuidv4();

                // 更新uNetwork数据
                setUNetwork(prevNetwork => {
                    const newNetwork = [...prevNetwork];
                    newNetwork.push(entry);
                    return newNetwork;
                });

                // 更新dataSource数据
                setDataSource(prevData => {
                    const newData = [...prevData];
                    newData.push(entry);
                    setFilteredData(newData);
                    return newData;
                });
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
                const uNetworkList = Array.from(uNetwork as NetworkRecord[]).map((entry: NetworkRecord) => {
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
        setDataSource([]);  // 清除数据源
        setFilteredData([]); // 清除过滤后的数据
        setSelectedRows([]); // 清除选中的行
        setSelectedRowKeys([]); // 清除选中的行的key
    };

    const metersphere_import = () => {
        const requestBodyList = selectedRows.map((record: NetworkRecord) => {
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
            // 构建精简的分析数据，但保留必要信息
            const analysisData = `
场景概述：
- 接口总数：${scenarioData.length}
- 场景创建时间：${new Date().toLocaleString()}

接口列表：
${scenarioData.map((api, index) => {
    const url = new URL(api.requestInfo.url);
    return `${index + 1}. ${api.requestInfo.method} ${url.pathname}
    - 请求参数：${JSON.stringify(api.requestInfo.queryParams || [])}
    - 请求体：${api.requestInfo.postData?.text || '无'}
    - 响应数据：${api.responseData.substring(0, 1000)}...`; 
}).join('\n\n')}`;

            // 获取AI分析结果
            const aiAnalysis = await APIUtil.sendAIRequest(analysisData, 'scenario_analysis');
            
            // 分析参数依赖关系 - 这部分很重要，需要保留
            const dependencies = [];
            for (let i = 0; i < scenarioData.length; i++) {
                const currentRequest = scenarioData[i];
                let responseData: any = {};
                try {
                    responseData = JSON.parse(currentRequest.responseData);
                } catch (e) {
                    console.warn('响应数据解析失败:', e);
                }

                // 检查后续请求是否使用了当前请求的响应数据
                for (let j = i + 1; j < scenarioData.length; j++) {
                    const targetRequest = scenarioData[j];
                    const dependencyParams = [];

                    // 检查URL参数依赖
                    if (targetRequest.requestInfo.queryParams) {
                        targetRequest.requestInfo.queryParams.forEach(param => {
                            const dependencyPath = checkDependency(responseData, param.name);
                            if (dependencyPath) {
                                dependencyParams.push({
                                    sourceParam: param.name,
                                    targetParam: param.name,
                                    location: 'query',
                                    extractorType: 'json',
                                    extractorExpression: `$.${dependencyPath}`
                                });
                            }
                        });
                    }

                    // 检查POST数据依赖（包括嵌套结构）
                    if (targetRequest.requestInfo.postData?.text) {
                        const postDataDependencies = checkPostDataDependencies(
                            targetRequest.requestInfo.postData.text,
                            responseData
                        );
                        dependencyParams.push(...postDataDependencies);
                    }

                    // 如果找到依赖关系，添加到dependencies数组
                    if (dependencyParams.length > 0) {
                            dependencies.push({
                            sourceRequest: i,
                            targetRequest: j,
                            params: dependencyParams
                        });
                    }
                }
            }

            // 构建基础分析数据
            const baseAnalysis = {
                scenarioInfo: {
                    apiCount: scenarioData.length,
                    timestamp: new Date().toISOString(),
                    description: 'API测试场景',
                    baseConfig: {
                        protocol: 'https',
                        domain: new URL(scenarioData[0].requestInfo.url).hostname,
                        port: '443'
                    }
                },
                requests: scenarioData.map((api, index) => {
                    const url = new URL(api.requestInfo.url);
                    return {
                        name: `${index + 1}_${url.pathname}`,
                        path: url.pathname,
                        method: api.requestInfo.method,
                        parameters: api.requestInfo.queryParams || [],
                        extractors: dependencies
                            .filter(d => d.sourceRequest === index)
                            .flatMap(d => d.params.map(p => ({
                                name: `${p.sourceParam}_${index}`,
                                expression: p.extractorExpression,
                                matchNumber: '1'
                            })))
                    };
                }),
                dependencies: dependencies,
                variables: [
                    {
                        name: 'host',
                        value: new URL(scenarioData[0].requestInfo.url).hostname,
                        description: '服务器地址'
                    }
                ],
                testConfig: {
                    threads: 1,
                    rampUp: 1,
                    loops: 1,
                    duration: 60,
                    defaultAssertions: true
                }
            };

            return `# 测试场景分析报告

        ${aiAnalysis}

        \`\`\`json
        ${JSON.stringify(baseAnalysis, null, 2)}
        \`\`\``;
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
                    postData: record.request.postData
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
                setIsAnalysisOutdated(false); // 重置过期标记
                
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
        try {
            // 获取分析结果和场景数据
            if (!analysisResult || !selectedRows.length) {
                message.error('请先选择请求并进行场景分析');
                return;
            }

            // 使用JMeterGenerator生成JMeter脚本
            const jmeterScript = JMeterGenerator.generateJMeterScript(selectedRows, analysisResult);

            // 创建Blob对象
            const blob = new Blob([jmeterScript], { type: 'application/xml' });
            
            // 创建下载链接
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // 生成文件名：scenario_时间戳.jmx
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `scenario_${timestamp}.jmx`;
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            
            // 清理
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            message.success('JMeter脚本下载成功');
        } catch (error: unknown) {
            console.error('生成JMeter脚本失败:', error);
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            message.error(`生成JMeter脚本失败: ${errorMessage}`);
        }
    };

    const handleSearch = (value: string) => {
        setSearchText(value);
        if (!value.trim()) {
            setFilteredData(dataSource);
            return;
        }
        
        const filtered = dataSource.filter(item => {
            const { url, method } = item.requestInfo;
            return url.toLowerCase().includes(value.toLowerCase()) ||
                   method.toLowerCase().includes(value.toLowerCase());
        });
        setFilteredData(filtered);
    };

    const processPostData = (data: RequestRecord): Array<{ name: string; value: string }> => {
        const parameters: Array<{ name: string; value: string }> = [];
        if (data.requestInfo.postData?.text) {
            try {
                const postData = JSON.parse(data.requestInfo.postData.text) as PostData;
                for (const [key, value] of Object.entries(postData)) {
                    parameters.push({
                        name: key,
                        value: String(value)
                    });
                }
            } catch (e) {
                console.error('解析POST数据失败:', e);
            }
        }
        return parameters;
    };

    const handleAnalysisModalClose = () => {
        setAnalysisModalVisible(false);
        // 不清除分析结果，只关闭modal
    };

    const checkDependency = (responseData: any, paramName: string): string | null => {
        // 递归检查对象中是否存在指定参数
        const findParam = (obj: any, path: string = ''): string | null => {
            if (!obj || typeof obj !== 'object') return null;
            
            for (const [key, value] of Object.entries(obj)) {
                const currentPath = path ? `${path}.${key}` : key;
                
                // 检查当前键是否匹配
                if (key === paramName) {
                    return currentPath;
                }
                
                // 递归检查嵌套对象
                if (typeof value === 'object') {
                    const result = findParam(value, currentPath);
                    if (result) return result;
                }
            }
            return null;
        };

        return findParam(responseData);
    };

    // 检查POST数据依赖（支持嵌套结构）
    const checkPostDataDependencies = (postData: any, responseData: any): Array<{
        sourceParam: string;
        targetParam: string;
        location: string;
        extractorType: string;
        extractorExpression: string;
    }> => {
        const dependencies = [];
        
        const processObject = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            
            for (const [key, value] of Object.entries(obj)) {
                // 检查当前字段是否存在依赖
                const dependencyPath = checkDependency(responseData, key);
                if (dependencyPath) {
                    dependencies.push({
                        sourceParam: key,
                        targetParam: key,
                        location: 'body',
                        extractorType: 'json',
                        extractorExpression: `$.${dependencyPath}`
                    });
                }
                
                // 递归处理嵌套对象
                if (value && typeof value === 'object') {
                    processObject(value);
                }
            }
        };

        try {
            const data = typeof postData === 'string' ? JSON.parse(postData) : postData;
            processObject(data);
        } catch (e) {
            console.warn('POST数据解析失败:', e);
        }

        return dependencies;
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
                    value={searchText}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>
        </div>
        <VTablePro
            dataSource={filteredData.length > 0 ? filteredData : dataSource}
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
            onClose={handleAnalysisModalClose}
            loading={analysisLoading}
            analysisResult={analysisResult}
            scenarioData={selectedRows}
            onGenerateJMeterScript={handleDownloadJMeter}
            isAnalysisOutdated={isAnalysisOutdated}
        />
    </div>;
};
