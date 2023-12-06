import { Divider, Drawer, Tabs } from 'antd';
import React, { useEffect, useState } from 'react';
import { FilterOutlined } from '@ant-design/icons';
import './RequestDrawer.css';
import * as CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

const aesEncrypt = (text: string, secretKey: string, iv: string): string => {
  // @ts-ignore
  const encrypted = CryptoJS.AES.encrypt(text, secretKey, { iv: iv });
  return encrypted.toString();
};

const setHeaders = (s: any, accessKey: string, secretKey: string): any => {
  const timeStamp = new Date().getTime();
  const combox_key = accessKey + '|' + uuidv4() + '|' + timeStamp;
  const signature = aesEncrypt(combox_key, secretKey, accessKey);
  console.log(signature);
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
interface RequestDrawerProps {
  drawerOpen: boolean;
  record: any;
  onClose: () => void;
  onAddInterceptorClick: (record: any) => void;
}
const Wrapper = (props: { children: any }) => {
  return <div style={{ height: 'calc(100vh - 160px)', overflow: 'auto' }}>
    {props.children}
  </div>;
};
export default (props: RequestDrawerProps) => {
  const { drawerOpen, record, onClose, onAddInterceptorClick } = props;

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

      <Divider orientation="left" style={{ margin: '12px 0 4px' }}/>
      <h4><strong>Response Headers</strong></h4>
      <div className="ajax-tools-devtools-text">
        <strong>Http Version:&nbsp;</strong>
        <span>{record.response.httpVersion}</span>
      </div>
      {
        record.response.headers.map((v: {name: string, value: string}) => {
          return <div className="ajax-tools-devtools-text" key={v.name}>
            <strong>{v.name}:&nbsp;</strong>
            <span>{v.value}</span>
          </div>;
        })
      }

      <Divider orientation="left" style={{ margin: '12px 0 4px' }}/>
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
      console.log(' 解析成功', text);
    } catch (e) {
      text = value;  // 如果解析失败，则直接使用原始字符串
      console.log( '解析失败', e);
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
    }, []);
    return <>
      <pre>{formatText(response)}</pre>
    </>;
  };
  const CustomPayload = (props: { path: string }) => {
    const { path } = props;
    const [data, setData] = useState<any>(null);
    let s = { headers: {} }; // 创建一个空的请求头对象
    s = setHeaders(s, 'KUPXCvnjCna9ANc9', 'ptylbHok5nZSGexx'); // 设置请求头
    useEffect(() => {
      // 异步操作
      const fetchData = async () => {
        const requestBody = {
          name: path,
          projectId: ''
        };
        const apiUrl = `http://10.50.2.3:8081/api/definition/queryCaseInfo1`;
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: Object.assign({}, s.headers),
          });
          console.log(' response', response);
          const jsonData = await response.json();
          console.log(' jsonData', jsonData);
          setData(jsonData);
        } catch (error) {
          console.error(error);
        }
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

  const title = record && record.request.url.match('[^/]+(?!.*/)');
  return <Drawer
    title={<span style={{ fontSize: 12 }}>{title}</span>}
    open={drawerOpen}
    onClose={() => onClose()}
    width="80%"
    placement="right"
    mask={false}
    headerStyle={{ padding: '8px 12px', fontSize: '14px', wordBreak: 'break-all' }}
    bodyStyle={{ padding: '6px 24px' }}
  >
    <Tabs
      defaultActiveKey="1"
      size="small"
      // onChange={onChange}
      tabBarExtraContent={{
        right: <FilterOutlined
          className="ajax-tools-devtools-text-btn"
          title="Add requests to be intercepted"
          onClick={() => onAddInterceptorClick(record)}
        />
      }}
      items={[
        {
          label: `Headers`,
          key: '1',
          children: <Wrapper><Headers/></Wrapper>,
        },
        {
          label: `Payload`,
          key: '2',
          children: <Wrapper><Payload/></Wrapper>,
        },
        {
          label: `Response`,
          key: '3',
          children: <Wrapper><Response/></Wrapper>,
        },
        {
          label: `Custom Payload`,
          key: '4',
          children: <Wrapper><CustomPayload path={ record.request.url.pathname }/></Wrapper>,
        }
      ]}
    />
  </Drawer>;
};
