/* eslint-disable indent */
import React from 'react';
import { Modal, Spin, Button, Space, message } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import './ScenarioAnalysisModal.css';

interface ScenarioAnalysisModalProps {
    visible: boolean;
    onClose: () => void;
    loading: boolean;
    analysisResult: string;
    scenarioData?: any[];
    onGenerateJMeterScript?: () => void;
    isAnalysisOutdated?: boolean;
}

const ScenarioAnalysisModal: React.FC<ScenarioAnalysisModalProps> = ({
    visible,
    onClose,
    loading,
    analysisResult,
    scenarioData,
    onGenerateJMeterScript,
    isAnalysisOutdated
}) => {
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(analysisResult);
            message.success('分析结果已复制到剪贴板');
        } catch (error) {
            message.error('复制失败，请重试');
        }
    };

    return (
        <Modal
            title="场景分析结果"
            open={visible}
            onCancel={onClose}
            width={800}
            footer={null}
            className="scenario-analysis-modal"
        >
            <div className="scenario-analysis-content">
                {loading ? (
                    <div className="analysis-loading">
                        <Spin size="large" />
                        <p>AI正在分析场景数据，这可能需要一点时间...</p>
                    </div>
                ) : (
                    <div className="analysis-result">
                        {isAnalysisOutdated && (
                            <div className="analysis-warning" style={{
                                padding: '8px 12px',
                                marginBottom: '16px',
                                background: '#fffbe6',
                                border: '1px solid #ffe58f',
                                borderRadius: '4px'
                            }}>
                                <span style={{ color: '#faad14', marginRight: '8px' }}>⚠️</span>
                                当前分析结果已过期，正在重新分析...
                            </div>
                        )}
                        <div className="analysis-actions">
                            <Space>
                                <Button 
                                    type="primary" 
                                    icon={<CopyOutlined />}
                                    onClick={handleCopy}
                                    disabled={isAnalysisOutdated}
                                >
                                    复制分析结果
                                </Button>
                                {scenarioData && scenarioData.length > 0 && (
                                    <Button
                                        type="primary"
                                        icon={<DownloadOutlined />}
                                        onClick={onGenerateJMeterScript}
                                        disabled={isAnalysisOutdated}
                                    >
                                        生成JMeter脚本
                                    </Button>
                                )}
                            </Space>
                        </div>
                        <ReactMarkdown>{analysisResult}</ReactMarkdown>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ScenarioAnalysisModal; 