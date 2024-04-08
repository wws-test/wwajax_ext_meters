import React from 'react';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {message} from 'antd';

// @ts-ignore
const ClipboardCopy = ({copyText}) => {
    const onCopy = () => {
        message.success('复制成功');
    };

    return (
        <CopyToClipboard text={copyText} onCopy={onCopy}>
            <button>复制到剪贴板</button>
        </CopyToClipboard>
    );
};

export default ClipboardCopy;