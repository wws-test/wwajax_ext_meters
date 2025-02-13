import React from 'react';
import { Button, Space, message } from 'antd';
import { CopyOutlined, BulbOutlined } from '@ant-design/icons';

interface ClipboardCopyProps {
  copyText: string;
  onAnalyze?: () => void;
  showAnalyzeButton?: boolean;
}

const ClipboardCopy: React.FC<ClipboardCopyProps> = ({ 
  copyText, 
  onAnalyze,
  showAnalyzeButton = true 
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      message.success('已复制到剪贴板');
    } catch (err) {
      message.error('复制失败');
    }
  };

  return (
    <Space style={{ marginTop: 16 }}>

      {showAnalyzeButton}
    </Space>
  );
};

export default ClipboardCopy;