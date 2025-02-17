/* eslint-disable indent */
import React from 'react';
import { Modal, Spin } from 'antd';
import ReactMarkdown from 'react-markdown';
import './ScenarioAnalysisModal.css';

interface ScenarioAnalysisModalProps {
    visible: boolean;
    onClose: () => void;
    loading: boolean;
    analysisResult: string;
}

const ScenarioAnalysisModal: React.FC<ScenarioAnalysisModalProps> = ({
    visible,
    onClose,
    loading,
    analysisResult
}) => {
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
                        <ReactMarkdown>{analysisResult}</ReactMarkdown>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ScenarioAnalysisModal; 