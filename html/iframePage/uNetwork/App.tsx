import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import { VTablePro } from 'virtualized-table';
import { Button, Input, Modal, Radio, Space } from 'antd';
import { FilterOutlined, PauseCircleFilled, PlayCircleTwoTone, StopOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';
import './App.css';
import RequestDrawer from './RequestDrawer';
import { defaultInterface, AjaxDataListObject, DefaultInterfaceObject } from '../common/value';

interface AddInterceptorParams {
  ajaxDataList: AjaxDataListObject[],
  iframeVisible?: boolean,
  groupIndex?: number,
  request: string,
  responseText: string
}

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
      title: 'Status',
      dataIndex: 'status',
      width: 60,
      align: 'center',
      render: (value: any, record: { response: { status: string }; }) => record.response.status,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 60,
      align: 'center',
      render: (value: any, record: { _resourceType: string; }) => record._resourceType,
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

  const setUNetworkData = function (request:any) {
    if (['fetch', 'xhr'].includes(request._resourceType)) {
      uNetwork.push(request);
      setUNetwork([...uNetwork]);
    }
  };
useEffect(() => {
    // 当 recording 状态发生变化时执行
    if (chrome.devtools) {
      if (recording) {
        // 设置 requestFinishedRef.current 为 setUNetworkData 函数
        requestFinishedRef.current = setUNetworkData;
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
    if (record.getContent) {
      // 如果存在获取内容的方法，则调用该方法获取内容，并处理添加拦截器的逻辑
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
            title: 'Request Already Intercepted',
            content: 'This request has already been intercepted. Do you want to add another interceptor?',
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
  const onRequestUrlClick = (record: React.SetStateAction<null>) => {
    setCurrRecord(record);
    setDrawerOpen(true);
  };
  const columns = getColumns({
    onAddInterceptorClick,
    onRequestUrlClick,
  });
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
        title="Clear"
        icon={<StopOutlined/>}
        onClick={() => setUNetwork([])}
      />
      <Input
        placeholder="Filter RegExp"
        size="small"
        style={{ width: 160, marginLeft: 16 }}
        onChange={(e) => setFilterKey(e.target.value)}
      />
    </div>
    <VTablePro
      bordered
      headerNotSticky
      columns={columns}
      dataSource={uNetwork.filter((v: { request: { url: string; }; }) => v.request.url.match(strToRegExp(filterKey)))}
      visibleHeight={window.innerHeight - 50}
      rowHeight={24}
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

