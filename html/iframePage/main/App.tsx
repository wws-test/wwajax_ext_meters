
import React, { useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Collapse, Input, Select, Switch, Result, Dropdown, Space, MenuProps } from 'antd';
import { MinusOutlined, PlusOutlined, FormOutlined, GithubOutlined,
  DropboxOutlined, MoreOutlined, UploadOutlined, DownloadOutlined, RightOutlined, DeleteOutlined, ToTopOutlined } from '@ant-design/icons';
import ModifyDataModal, { ModifyDataModalOnSaveProps } from './ModifyDataModal';
import {
  defaultInterface,
  defaultAjaxDataList,
  DefaultInterfaceObject,
  HTTP_METHOD_MAP,
} from '../common/value';
import 'antd/dist/antd.css';
import './App.css';
import { exportJSON } from './utils/exportJson';
import { openImportJsonModal } from './utils/importJson';
import { popupWindow } from './utils/pictureInPicture';

const { Panel } = Collapse;
const { TextArea } = Input;
const colorMap = [
  'ajax-tools-color-volcano', 'ajax-tools-color-red',
  'ajax-tools-color-orange', 'ajax-tools-color-gold',
  'ajax-tools-color-green', 'ajax-tools-color-cyan',
  'ajax-tools-color-blue', 'ajax-tools-color-geekblue',
  'ajax-tools-color-purple', 'ajax-tools-color-magenta',
];

function App() {
  const modifyDataModalRef = useRef<any>({});

  const [ajaxToolsSkin, setAjaxToolsSkin] = useState('light');
  const [ajaxToolsSwitchOn, setAjaxToolsSwitchOn] = useState(true); // 默认开启
  const [ajaxToolsSwitchOnNot200, setAjaxToolsSwitchOnNot200] = useState(true); // 默认开启
  const [ajaxDataList, setAjaxDataList] = useState(defaultAjaxDataList);

  useEffect(() => {
    if (chrome.storage) {
      chrome.storage.local.get(['ajaxDataList', 'ajaxToolsSwitchOn', 'ajaxToolsSwitchOnNot200', 'ajaxToolsSkin'], (result) => {
        const { ajaxDataList = [], ajaxToolsSwitchOn = true, ajaxToolsSwitchOnNot200 = true, ajaxToolsSkin = 'light' } = result;
        if (ajaxDataList.length > 0) {
          setAjaxDataList(ajaxDataList);
        }
        setAjaxToolsSwitchOn(ajaxToolsSwitchOn);
        setAjaxToolsSwitchOnNot200(ajaxToolsSwitchOnNot200);
        setAjaxToolsSkin(ajaxToolsSkin);
      });
    }
    if (chrome.runtime) {
      // 接收uNetwork/App.jsx发来的数据（在uNetWork面板中可以添加拦截数据更新页面）
      chrome.runtime.onMessage.addListener((request) => {
        const { type, to, ajaxDataList } = request;
        if (type === 'ajaxTools_updatePage' && to === 'mainSettingSidePage') {
          console.log('【main/App.jsx】<-【uNetwork】Receive message:', request);
          setAjaxDataList(ajaxDataList);
          chrome.storage.local.set({ ajaxDataList });
        }
      });
    }
  }, []);

  const onImportClick = async () => {
    const importJsonData = await openImportJsonModal();
    let newAjaxDataList = ajaxDataList;
    if (Array.isArray(importJsonData)) {
      newAjaxDataList = [...ajaxDataList, ...importJsonData];
    }
    setAjaxDataList(newAjaxDataList);
    chrome.storage.local.set({ ajaxDataList: newAjaxDataList });
  };
  // 新增分组
  const onGroupAdd = () => {
    const len = ajaxDataList.length;
    const newAjaxDataList = [...ajaxDataList, {
      summaryText: '默认组名 (可编辑)',
      collapseActiveKeys: [],
      headerClass: colorMap[len % 9],
      interfaceList: [{ ...defaultInterface }]
    }];
    setAjaxDataList([...newAjaxDataList]);
    chrome.storage.local.set({ ajaxDataList: newAjaxDataList });
  };
  const onGroupDelete = (groupIndex: number) => {
    const newAjaxDataList = ajaxDataList.filter((_, i) => i !== groupIndex);
    setAjaxDataList([...newAjaxDataList]);
    chrome.storage.local.set({ ajaxDataList: newAjaxDataList });
  };
  // placement: top|bottom
  const onGroupMove = (groupIndex: number, placement: string) => {
    const movedItem = ajaxDataList.splice(groupIndex, 1)[0];
    if (placement === 'top') {
      ajaxDataList.unshift(movedItem);
    } else if (placement === 'bottom') {
      ajaxDataList.push(movedItem);
    }
    setAjaxDataList([...ajaxDataList]);
    chrome.storage.local.set({ ajaxDataList });
  };
  const onGroupSummaryTextChange = (e: React.ChangeEvent<HTMLInputElement>, groupIndex: number) => {
    ajaxDataList[groupIndex].summaryText = e.target.value;
    setAjaxDataList([...ajaxDataList]);
    chrome.storage.local.set({ ajaxDataList });
  };
  // 收缩分组 折叠全部keys传[]
  const onCollapseChange = (groupIndex: number, keys: string | string[]) => {
    ajaxDataList[groupIndex].collapseActiveKeys = Array.isArray(keys) ? keys : [keys];
    setAjaxDataList([...ajaxDataList]);
    chrome.storage.local.set({ ajaxDataList });
  };
  const onGroupOpenChange = (groupIndex: number, open: boolean) => {
    ajaxDataList[groupIndex].interfaceList = ajaxDataList[groupIndex].interfaceList.map((v) => {
      v.open = open;
      return v;
    });
    setAjaxDataList([...ajaxDataList]);
    chrome.storage.local.set({ ajaxDataList });
  };

  // interfaceList值变化
  const onInterfaceListChange = (groupIndex: number, interfaceIndex: number, key: string, value: string | boolean) => {
    if (key === 'headers' || key === 'responseText') {
      try {
        const lastValue = ajaxDataList[groupIndex]?.interfaceList?.[interfaceIndex]?.[key];
        const formattedValue = JSON.stringify(JSON.parse(value as string), null, 4);
        value = lastValue === formattedValue ? value : formattedValue;
      } catch (e) {
        // value = value;
      }
    }
    ajaxDataList[groupIndex].interfaceList[interfaceIndex][key]! = value;
    setAjaxDataList([...ajaxDataList]);
    chrome.storage.local.set({ ajaxDataList });
  };
  const onInterfaceListAdd = (groupIndex: number) => {
    const key = String(Date.now());
    ajaxDataList[groupIndex].collapseActiveKeys.push(key);
    const interfaceItem = { ...defaultInterface };
    interfaceItem.key = key;
    ajaxDataList[groupIndex].interfaceList.push(interfaceItem);
    setAjaxDataList([...ajaxDataList]);
    chrome.storage.local.set({ ajaxDataList });
  };
  const onInterfaceListDelete = (groupIndex: number, key: string) => {
    ajaxDataList[groupIndex].collapseActiveKeys = ajaxDataList[groupIndex].collapseActiveKeys.filter((activeKey) => activeKey !== key);
    ajaxDataList[groupIndex].interfaceList = ajaxDataList[groupIndex].interfaceList.filter((v) => v.key !== key);
    setAjaxDataList([...ajaxDataList]);
    chrome.storage.local.set({ ajaxDataList });
  };
  const onInterfaceListSave = (
    { groupIndex, interfaceIndex, replacementMethod, replacementUrl, headersEditorValue,
      requestPayloadEditorValue, responseEditorValue, language } : ModifyDataModalOnSaveProps
  ) => {
    if (replacementMethod !== undefined) onInterfaceListChange(groupIndex, interfaceIndex, 'replacementMethod', replacementMethod);
    if (replacementUrl !== undefined) onInterfaceListChange(groupIndex, interfaceIndex, 'replacementUrl', replacementUrl);
    if (headersEditorValue !== undefined) onInterfaceListChange(groupIndex, interfaceIndex, 'headers', headersEditorValue);
    if (requestPayloadEditorValue !== undefined) onInterfaceListChange(groupIndex, interfaceIndex, 'requestPayloadText', requestPayloadEditorValue);
    if (responseEditorValue !== undefined) onInterfaceListChange(groupIndex, interfaceIndex, 'responseText', responseEditorValue);
    if (language !== undefined) onInterfaceListChange(groupIndex, interfaceIndex, 'language', language);
  };
  // placement: top|bottom
  const onInterfaceMove = (groupIndex: number, interfaceIndex: number, placement: string ) => {
    const { interfaceList = [] } = ajaxDataList[groupIndex];
    const movedItem = interfaceList.splice(interfaceIndex, 1)[0];
    if (placement === 'top') {
      interfaceList.unshift(movedItem);
    } else if (placement === 'bottom') {
      interfaceList.push(movedItem);
    }
    ajaxDataList[groupIndex].interfaceList = interfaceList;
    setAjaxDataList([...ajaxDataList]);
    chrome.storage.local.set({ ajaxDataList });
  };

  const genExtra = (
    groupIndex: number,
    interfaceIndex: number,
    v: DefaultInterfaceObject,
  ) => {
    const { interfaceList = [] } = ajaxDataList[groupIndex];
    const items: MenuProps['items'] = [
      {
        key: '0',
        label: 'Edit data',
        icon: <FormOutlined style={{ fontSize: 14 }} />,
        onClick: () => modifyDataModalRef.current.openModal({
          groupIndex,
          interfaceIndex,
          activeTab: 'Response',
          request: v.request,
          replacementMethod: v.replacementMethod,
          replacementUrl: v.replacementUrl,
          headersText: v.headers,
          requestPayloadText: v.requestPayloadText,
          responseLanguage: v.language,
          responseText: v.responseText
        })
      },
      {
        key: '1',
        label: 'Move to top',
        icon: <ToTopOutlined style={{ fontSize: 14 }} />,
        onClick: () => onInterfaceMove( groupIndex, interfaceIndex, 'top'),
        disabled: interfaceIndex === 0
      },
      {
        key: '2',
        label: 'Move to bottom',
        icon: <ToTopOutlined style={{ transform: 'rotateZ(180deg)', fontSize: 14 }}/>,
        onClick: () => onInterfaceMove(groupIndex, interfaceIndex, 'bottom'),
        disabled: interfaceIndex === interfaceList.length - 1
      },
    ];
    return <div onClick={(event) => event.stopPropagation()} style={{ display: 'flex', alignItems: 'center', height: 24 }}>
      <Switch
        title={v.open ? 'Disable Extension' : 'Enable Extension'}
        checked={v.open}
        onChange={(value) => onInterfaceListChange(groupIndex, interfaceIndex, 'open', value)}
        size="small"
        style={{ margin: '0 4px' }}
      />
      <Button
        danger
        size="small"
        type="primary"
        shape="circle"
        icon={<MinusOutlined/>}
        title="Delete Interface"
        onClick={() => onInterfaceListDelete(groupIndex, v.key)}
        style={{ minWidth: 16, width: 16, height: 16 }}
      />
      <Dropdown
        menu={{ items }}
        trigger={['click']}
      >
        <MoreOutlined title="More" style={{ marginLeft: 4, fontSize: 18 }}/>
      </Dropdown>
    </div>;
  };

  const inIframe = top?.location !== self.location;
  return (
    <div
      className="ajax-tools-iframe-container"
      style={{
        filter: ajaxToolsSkin === 'dark' ? 'invert(1)' : undefined
      }}
    >
      <nav className="ajax-tools-iframe-action">
        <Space>
          <Dropdown.Button
            size="small"
            type="primary"
            onClick={onGroupAdd}
            menu={{
              items: [
                {
                  key: '1',
                  label: 'Import',
                  icon: <UploadOutlined style={{ fontSize: 14 }} />,
                  onClick: onImportClick
                },
                {
                  key: '2',
                  label: 'Export',
                  icon: <DownloadOutlined style={{ fontSize: 14 }} />,
                  onClick: () => exportJSON(`AjaxInterceptorData_${JSON.stringify(new Date())}`, ajaxDataList),
                  disabled: ajaxDataList.length < 1
                },
              ]
            }}>
            添加数据组
          </Dropdown.Button>
        </Space>
        <div>
          <Checkbox
            defaultChecked
            checked={ajaxToolsSwitchOnNot200}
            onChange={(e) => {
              setAjaxToolsSwitchOnNot200(e.target.checked);
              chrome.storage.local.set({ ajaxToolsSwitchOnNot200: e.target.checked });
            }}
            style={{ filter: ajaxToolsSwitchOn ? undefined : 'opacity(0.5)' }}
          >
            <span title="Change the request status from 404/500 to 200">强制修改http状态码为200</span>
          </Checkbox>
          <Switch
            defaultChecked
            checkedChildren="开启"
            unCheckedChildren="关闭"
            checked={ajaxToolsSwitchOn}
            onChange={(value) => {
              setAjaxToolsSwitchOn(value);
              chrome.storage.local.set({ ajaxToolsSwitchOn: value });
            }}
          />
          {
            inIframe ? null : <i
              className="c-iconfont c-icon-zoomout"
              title="Picture in picture"
              style={{ marginLeft: 12, cursor: 'pointer' }}
              onClick={() => popupWindow({ url: chrome.runtime.getURL('html/iframePage/dist/index.html') })}
            />
          }
        </div>
      </nav>
      <main
        className="ajax-tools-iframe-body"
        style={{ filter: ajaxToolsSwitchOn ? undefined : 'opacity(0.5)' }}
      >
        {
          ajaxDataList.map((item, index) => {
            const { summaryText, headerClass, interfaceList = [], collapseActiveKeys = [] } = item;
            const groupOpen = !!interfaceList.find(v => v.open);
            const fold = collapseActiveKeys.length < 1;
            return <div key={index}>
              <div className={`ajax-tools-iframe-body-header ${headerClass}`}>
                <Button
                  type="text"
                  shape="circle"
                  size="small"
                  title="Collapse All"
                  icon={<RightOutlined style={{ transform: fold ? undefined : 'rotateZ(90deg)', transition: '.3s' }}/>}
                  onClick={() => {
                    if (fold) { // 当前折叠要展开
                      const allKeys = interfaceList.map(v => v.key);
                      onCollapseChange(index, allKeys);
                    } else {
                      onCollapseChange(index, []);
                    }
                  }}
                />
                <Input
                  value={summaryText}
                  className={`ajax-tools-iframe-body-header-input ${headerClass}`}
                  onChange={(e) => onGroupSummaryTextChange(e, index)}
                />
                <Switch
                  title={groupOpen ? 'Disable group' : 'Enable group'}
                  checked={groupOpen}
                  onChange={(open) => onGroupOpenChange(index, open)}
                  size="small"
                  style={{ margin: '0 22px 0 4px' }}
                />
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: '0',
                        label: 'Move to top',
                        icon: <ToTopOutlined style={{ fontSize: 14 }} />,
                        onClick: () => onGroupMove(index, 'top'),
                        disabled: index === 0
                      },
                      {
                        key: '1',
                        label: 'Move to bottom',
                        icon: <ToTopOutlined style={{ transform: 'rotateZ(180deg)', fontSize: 14 }}/>,
                        onClick: () => onGroupMove(index, 'bottom'),
                        disabled: index === ajaxDataList.length - 1
                      },
                      {
                        key: '99',
                        danger: true,
                        label: 'Delete group',
                        icon: <DeleteOutlined style={{ fontSize: 14 }}/>,
                        onClick: () => onGroupDelete(index)
                      },
                    ]
                  }}
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    shape="circle"
                    size="small"
                    title="More"
                    icon={<MoreOutlined style={{ fontSize: 22 }}/>}
                  />
                </Dropdown>
              </div>
              <Collapse
                className="ajax-tools-iframe-collapse"
                defaultActiveKey={['1']}
                activeKey={item.collapseActiveKeys}
                onChange={(keys) => onCollapseChange(index, keys)}
                style={{ borderRadius: 0 }}
              >
                {
                  interfaceList.map((v, i) => {
                    return <Panel
                      key={v.key}
                      header={
                        <div onClick={e => e.stopPropagation()}>
                          <div style={{
                            display: 'inline-grid',
                            width: 'calc(100vw - 160px)'
                          }}>
                            <Input
                              value={v.request}
                              onChange={(e) => onInterfaceListChange(index, i, 'request', e.target.value)}
                              placeholder="Please enter the matching interface"
                              size="small"
                              addonBefore={
                                <Space.Compact>
                                  <Select
                                    value={v.matchType}
                                    onChange={(value) => onInterfaceListChange(index, i, 'matchType', value)}
                                  >
                                    <Select.Option value="normal">Normal</Select.Option>
                                    <Select.Option value="regex">Regex</Select.Option>
                                  </Select>
                                  <Select
                                    dropdownMatchSelectWidth={false}
                                    value={v.matchMethod}
                                    onChange={(value) => onInterfaceListChange(index, i, 'matchMethod', value)}
                                  >
                                    <Select.Option value="">*(any)</Select.Option>
                                    { HTTP_METHOD_MAP.map((method) => <Select.Option key={method} value={method}>{method}</Select.Option>) }
                                  </Select>
                                </Space.Compact>
                              }
                            />
                            <Input
                              value={v.requestDes}
                              onChange={(e) => onInterfaceListChange(index, i, 'requestDes', e.target.value)}
                              placeholder="Remark（Editable）"
                              size="small"
                              className="ajax-tools-iframe-request-des-input"
                            />
                          </div>
                        </div>
                      }
                      extra={genExtra(index, i, v)}
                    >
                      <div style={{ position: 'relative' }}>
                        <TextArea
                          rows={4}
                          value={v.responseText}
                          onChange={(e) => onInterfaceListChange(index, i, 'responseText', e.target.value)}
                          placeholder='Response  e.g. { "status": 200, "response": "OK" }'
                        />
                        <FormOutlined
                          title="Edit"
                          className="ajax-tools-textarea-edit"
                          onClick={() => modifyDataModalRef.current.openModal({
                            groupIndex: index,
                            interfaceIndex: i,
                            activeTab: 'Response',
                            request: v.request,
                            replacementMethod: v.replacementMethod,
                            replacementUrl: v.replacementUrl,
                            headersText: v.headers,
                            requestPayloadText: v.requestPayloadText,
                            responseLanguage: v.language,
                            responseText: v.responseText
                          })}
                        />
                      </div>
                    </Panel>;
                  })
                }
              </Collapse>
              <div className="ajax-tools-iframe-body-footer">
                <Button
                  size="small"
                  type="primary"
                  shape="circle"
                  icon={<PlusOutlined/>}
                  title="Add Interface"
                  onClick={() => onInterfaceListAdd(index)}
                />
              </div>
            </div>;
          })
        }
        {
          ajaxDataList.length < 1 && <Result
            icon={<DropboxOutlined style={{ color: '#c1d0dd' }}/>}
            title={'Ohhh... nothing here'}
            subTitle={<>
                Create a rule by clicking the <Button size="small" type="primary" onClick={onGroupAdd}>Add Group</Button> button <br/>
                Or importing a <strong>.json</strong> file by clicking the <Button size="small" style={{ marginTop: 6 }} onClick={onImportClick}><UploadOutlined/>Import</Button> button<br/>
                Or F12 opens devtools and selects the U-Network panel to get started quickly.
            </>}
          />
        }
      </main>
      <footer className="ajax-tools-iframe-footer">
        (Powered by metersphere)
        <a href="http://10.50.3.224:8081/" target="_blank" rel="noreferrer" style={{ color: '#666' }}>
          &nbsp;点击跳转metersphere&nbsp;
        </a>
        )
      </footer>
      <ModifyDataModal
        ref={modifyDataModalRef}
        onSave={onInterfaceListSave}
      />
    </div>
  );
}

export default App;
