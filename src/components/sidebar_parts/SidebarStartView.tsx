import React from 'react';
import { StartNodeData } from '../../types';

interface SidebarStartViewProps {
    nodeData: StartNodeData;
}

const SidebarStartView: React.FC<SidebarStartViewProps> = ({ nodeData }) => {
    return (
        <>
            <p className="text-sm">
                <span className="text-gray-500">Story Name:</span>{' '}
                <span className="font-medium text-indigo-700 break-words">
                    {nodeData.storyName || '(Not Set)'}
                </span>
            </p>
            <p className="text-sm">
                <span className="text-gray-500">Story ID:</span>{' '}
                <code className="text-xs bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded break-all">
                    {nodeData.storyId || '(Not Set)'}
                </code>
            </p>
        </>
    );
};

export default SidebarStartView;