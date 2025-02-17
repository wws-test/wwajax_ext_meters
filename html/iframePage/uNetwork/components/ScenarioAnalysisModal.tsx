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
}

const ScenarioAnalysisModal: React.FC<ScenarioAnalysisModalProps> = ({
    visible,
    onClose,
    loading,
    analysisResult,
    scenarioData,
    onGenerateJMeterScript
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
                        <div className="analysis-actions">
                            <Space>
                                <Button 
                                    type="primary" 
                                    icon={<CopyOutlined />}
                                    onClick={handleCopy}
                                >
                                    复制分析结果
                                </Button>
                                {scenarioData && scenarioData.length > 0 && (
                                    <Button
                                        type="primary"
                                        icon={<DownloadOutlined />}
                                        onClick={onGenerateJMeterScript}
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