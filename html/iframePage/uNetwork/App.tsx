import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import { VTablePro } from 'virtualized-table';
import { Button, Input, Modal, Radio, Space } from 'antd';
import { MenuUnfoldOutlined, BuildFilled, FilterOutlined, PauseCircleFilled, PlayCircleTwoTone, StopOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';
import './App.css';
import RequestDrawer from './RequestDrawer';
import { defaultInterface, AjaxDataListObject, DefaultInterfaceObject } from '../common/value';
import * as CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

interface AddInterceptorParams {
  ajaxDataList: AjaxDataListObject[],
  iframeVisible?: boolean,
  groupIndex?: number,
  request: string,
  responseText: string
}

const aesEncrypt = (text: string, secretKey: string, iv: string): string => {
  // @ts-ignore
  const encrypted = CryptoJS.AES.encrypt(text, secretKey, { iv: iv });
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
  s.headers = { ...s.headers, ...header };
  return s;
};
function getDataFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('myDatabase', 1);

    request.onsuccess = function(event) {
      // @ts-ignore
      const db = event.target.result;
      const transaction = db.transaction('myObjectStore', 'readonly');
      const objectStore = transaction.objectStore('myObjectStore');

      const getRequest = objectStore.get('projectid');

      getRequest.onsuccess = function(event: { target: { result: any; }; }) {
        const data = event.target.result;
        if (data) {
          resolve(data);
        } else {
          reject(new Error('Value not found in IndexedDB'));
        }
      };

      // @ts-ignore
      transaction.oncomplete = function(event) {
        db.close();
      };
    };

    request.onerror = function(event) {
      reject(new Error('Error opening IndexedDB'));
    };
  });
}
const fetchData = async (requestBodyList: any) => {
  let s = { headers: {} }; // 创建一个空的请求头对象    const url = new URL(record.request.url);
  s = setHeaders(s, 'OjoTCHX6sfhcWMq6', '3kT6tWHbwa1jOyGY'); // 设置请求头
  getDataFromIndexedDB().then(async data => {

    const apiUrl = `http://10.50.3.224:8081/api/definition/Bulk_import_created`;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        // @ts-ignore
        body: JSON.stringify(requestBodyList),
        headers: Object.assign({}, s.headers),
      });
      const jsonData = await  response.json();
      console.log('jsonData', jsonData);
      alert(JSON.stringify(jsonData, null, 2));
    } catch (error) {
      console.error(error);
    }
  });

};

// "/^t.*$/" or "^t.*$" => new RegExp
// 定义一个函数，将字符串转换为正则表达式
const strToRegExp = (regStr: string) => {
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
  const getColumns = ({
    onAddInterceptorClick,
    onRequestUrlClick
  } : {
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
        style: { padding: '0 4px' },
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
          return comparedRows.includes(index) ? 'miss' : ''; }
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
  const rowSelection = {
    // 设置复选框所在列的宽度为60像素
    columnWidth: 60,

    // getCheckboxProps 是一个函数，返回每一条记录的 checkbox 属性配置，这里禁用了 id 等于5的行的复选框
    getCheckboxProps: (record: { id: number; }) => ({
    }),

    // 设置当前选中的行键，与 selectedRowKeys 状态保持同步
    selectedRowKeys,

    // 指定选择类型为复选框形式
    type: 'checkbox',

    // onChange 回调会在用户更改选中项时触发，更新 selectedRowKeys 状态并打印变化后的选中信息
    onChange: (selectedRowKeys: any, selectedRows: any) => {
      console.log(selectedRowKeys, selectedRows);
      setSelectedRowKeys(selectedRowKeys);
      setSelectedRows(selectedRows);
    },

    // onSelect 回调会在用户单独勾选或取消勾选某一行时触发，打印被操作的记录、选中状态以及所有已选中的行信息
    onSelect: (record: any, selected: any, selectedRows: any, nativeEvent: any) => {
      console.log(record, selected, selectedRows);
    },

    // onSelectAll 回调会在用户全选/反选所有行时触发，打印全选状态、所有已选中的行以及本次改变所涉及的行集合
    onSelectAll: (selected: any, selectedRows: any, changeRows: any) => {
      console.log(selected, selectedRows, changeRows);
    },
    rowRemoveVisible: true,
    onRowRemove: (e: any, row: any, rowIndex: any, realRowIndex: any) => {
      console.log('rowRemove', e, row, rowIndex, realRowIndex);
      console.log(uNetwork);
    }
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

  const getChromeLocalStorage = (keys: string|string[]) => new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
  const compare = () => {
    let s = { headers: {} }; // 创建一个空的请求头对象
    s = setHeaders(s, 'TkA1lh4Mqc4J19Fg', 'BWtRQJgZswbGOMi5'); // 设置请求头
    const fetchData = async () => {
      getDataFromIndexedDB().then(async data => {
        const uNetworkList = Array.from(uNetwork).map(entry => {
          // @ts-ignore
          const url = new URL(entry.request.url);
          return url.pathname;
        });
        console.log('uNetworkList', uNetworkList);
        const requestBody = {
          paths: uNetworkList,
          projectId: ''
        };
        // @ts-ignore
        requestBody.projectId = data.value;
        const apiUrl = `http://10.50.3.224:8081/project/addRedisInterface`;
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: Object.assign({}, s.headers),
          });
          const jsonData = await  response.json();
          console.log('jsonData', jsonData);
          // 从返回的jsonData中提取data数组
          const dataToCompare = jsonData.data;
          console.log('dataToCompare', dataToCompare);
          // 循环查找在uNetworkList中的序列号
          const comparedRow = dataToCompare.map((item: string) => {
            const index = uNetworkList.findIndex((path) => path === item);
            return index;
          });
          setComparedRows(comparedRow);
        } catch (error) {
          console.error(error);
        }
      });

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
    // 获取请求的URL，并去除查询参数
    const requestUrl = record.request.url.split('?')[0];
    // 从URL中匹配出主机名之后的路径
    const matchUrl = requestUrl.match('(?<=//.*/).+');
    console.log('requestUrl:', requestUrl); // 输出requestUrl的值
    console.log('matchUrl:', matchUrl && matchUrl[0]); // 输出matchUrl的值
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
    { request, responseText }: { request: string, responseText: string }
  ) => {
    try {
      // 从Chrome本地存储中获取ajaxDataList和iframeVisible的值，如果没有则赋值为空数组和undefined
      const { ajaxDataList = [], iframeVisible }: AddInterceptorParams|any = await getChromeLocalStorage(['iframeVisible', 'ajaxDataList']);
      // 将ajaxDataList中的每个item的interfaceList取出来，如果不存在则赋值为空数组
      const interfaceList = ajaxDataList.flatMap((item: { interfaceList: DefaultInterfaceObject[]; }) => item.interfaceList || []);
      // 判断interfaceList中是否存在与当前请求相同的request，如果存在则返回true，否则返回false
      const hasIntercepted = interfaceList.some((v: { request: string | null; }) => v.request === request);
      // 如果已经拦截过该请求
      if (hasIntercepted) {
        // 弹出确认框，询问是否添加另一个拦截器
        const confirmed = await new Promise((resolve) => {
          Modal.confirm({
            title: '请求已被截获',
            content: '此请求已被截获。是否要添加另一个拦截器？',
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });
        // 如果确认添加另一个拦截器
        if (confirmed) {
          // 调用addInterceptorIfNeeded函数，传入相关参数
          await addInterceptorIfNeeded({ ajaxDataList, iframeVisible, request, responseText });
        }
      } else {
        // 调用addInterceptorIfNeeded函数，传入相关参数
        await addInterceptorIfNeeded({ ajaxDataList, iframeVisible, request, responseText });
      }
    } catch(error) {
      // 捕获错误并打印到控制台
      console.error(error);
    }
  };
  const addInterceptorIfNeeded = async ({ ajaxDataList, iframeVisible, request, responseText }: AddInterceptorParams) => {
    if (ajaxDataList.length === 0) { // 首次，未添加过拦截接口
      ajaxDataList = [{
        summaryText: 'Group Name（Editable）',
        collapseActiveKeys: [],
        headerClass: 'ajax-tools-color-volcano',
        interfaceList: []
      }];
    }
    const groupIndex: any = ajaxDataList.length > 1 ? await showGroupModal({ ajaxDataList }) : 0;
    showSidePage(iframeVisible);
    addInterceptor({ ajaxDataList, groupIndex, request, responseText });
  };
  const showGroupModal = ({ ajaxDataList }: { ajaxDataList: AjaxDataListObject[] }) => new Promise((resolve) => {
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
          {ajaxDataList.map((v, index) => <Radio key={index} value={index}>Group {index + 1}：{v.summaryText}</Radio>)}
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
        { active: true, currentWindow: true },
        function (tabs) {
          const tabId = tabs[0]?.id;
          // 发送消息到content.js
          if (tabId) {
            chrome.tabs.sendMessage(
              tabId,
              { type: 'iframeToggle', iframeVisible },
              function (response) {
                console.log('【uNetwork/App.jsx】->【content】【ajax-tools-iframe-show】Return message:', response);
                chrome.storage.local.set({ iframeVisible: response.nextIframeVisible });
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
    { ajaxDataList, groupIndex = 0, request, responseText }: AddInterceptorParams
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
    const requestBodyList = []; // 创建一个空数组
    for (let i = 0; i < selectedRows.length; i++) {
      console.log(selectedRows[i]);
      const postData = selectedRows[i].request.postData || '';
      const url = new URL(selectedRows[i].request.url);
      const uuid = uuidv4();
      const requestBody = {
      };
      getDataFromIndexedDB().then(async data => {
        // @ts-ignore
        requestBody.projectId = data.value;
      });
      // @ts-ignore
      requestBody.name = url.pathname;
      // @ts-ignore
      requestBody.status = 'Underway';
      // @ts-ignore
      requestBody.method = selectedRows[i].request.method;
      // @ts-ignore
      requestBody.userId = 'admin';
      // @ts-ignore
      requestBody.url = '';
      // @ts-ignore
      requestBody.protocol = 'HTTP';
      // @ts-ignore
      requestBody.environmentId = '';
      // @ts-ignore
      requestBody.moduleId = 'Bulk_import';
      // @ts-ignore
      requestBody.modulePath = '/未规划接口';
      // @ts-ignore
      requestBody.remark = '';
      // @ts-ignore
      requestBody.tags = '';
      // @ts-ignore
      requestBody.request = {
        id: uuid,
        type: 'HTTPSamplerProxy',
        name: url.pathname,
        enabled: true,
        $type: 'Sampler',
        protocol: 'HTTP',
        method: selectedRows[i].request.method,
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
      // @ts-ignore
      requestBody.path = url.pathname + url.search;
      // @ts-ignore
      requestBody.addFields = [];
      // @ts-ignore
      requestBody.editFields = [];
      // @ts-ignore
      requestBody.id = uuid;
      // @ts-ignore
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
      requestBodyList.push(requestBody);
    }
    console.log(requestBodyList);
    fetchData(requestBodyList);

  };
  return <div>
    <div className="ajax-tools-devtools-action-bar">
      <Button
        type="text"
        shape="circle"
        danger={recording}
        title={recording ? '停止录制网络请求' : '开始录制网络请求'}
        icon={recording ? <PauseCircleFilled/> : <PlayCircleTwoTone/>}
        onClick={() => setRecording(!recording)}
      />
      <Button
        type="text"
        shape="circle"
        title="清除记录"
        icon={<StopOutlined/>}
        onClick={clearRecords}
      />
      <Button
        type="text"
        title="一键对比"
        icon={<BuildFilled />}
        onClick={() => compare()}
      />
      <Button
        type="text"
        title="批量导入"
        icon={<MenuUnfoldOutlined />}
        onClick={() => metersphere_import()}
      />
      <Input
        placeholder="筛选请求"
        size="small"
        style={{ width: 160, marginLeft: 16 }}
        onChange={(e) => setFilterKey(e.target.value)}
      />
    </div>
    <VTablePro
      bordered
      headerNotSticky
      columns={columns}
      dataSource={filteredDataSource}
      visibleHeight={window.innerHeight - 50}
      rowHeight={24}
      rowSelection={rowSelection}
      estimatedRowHeight={24}
      locale={{
        emptyText: <div style={{ textAlign: 'center' }}>
          <p>提示正在记录网络活动 </p>
          <p>提示点击记录按钮，并执行请求或按下 <strong>Ctrl + R</strong> 来记录加载</p>
        </div>
      }}
    />
    {
      currRecord && <RequestDrawer
        record={currRecord}
        drawerOpen={drawerOpen}
        onAddInterceptorClick={onAddInterceptorClick}
        onClose={() => setDrawerOpen(false)}
      />
    }
  </div>;
};
