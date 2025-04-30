import React from 'react';
import { GitBranch, MessageSquarePlus } from 'lucide-react';
import { ActionNodeData } from '../../types';

interface SidebarActionViewProps {
    nodeData: ActionNodeData;
}

const SidebarActionView: React.FC<SidebarActionViewProps> = ({ nodeData }) => {
    const isFunction = nodeData.valueType === 'function';
    const variationsCount = nodeData.variations?.length || 0;

    return (
        <>
            <p className="text-sm">
                <span className="text-gray-500">Title:</span>{' '}
                <span className="font-medium text-gray-800 break-words">
                    {nodeData.title || nodeData.name || '(Not Set)'}
                </span>
            </p>
            <p className="text-sm">
                <span className="text-gray-500">Name (ID):</span>{' '}
                <code className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded break-all">
                    {nodeData.name || '(Not Set)'}
                </code>
            </p>
            {isFunction ? (
                <div className="text-sm flex items-start gap-1 mt-2">
                    <span className="text-gray-500 flex-shrink-0 mt-0.5">Function:</span>
                    <GitBranch size={14} className="text-gray-500 mt-1 flex-shrink-0" title="Function Call" />
                    <div className="text-xs bg-green-50 border border-green-200 text-green-800 px-2 py-1 rounded break-words max-w-full flex-grow font-mono">
                        {nodeData.value || <span className="text-gray-400 italic">(Not Set)</span>}
                    </div>
                </div>
            ) : (
                <div className="text-sm mt-2">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 flex items-center gap-1"><MessageSquarePlus size={14} /> Text Variations:</span>
                        <span className='text-xs text-gray-400'>({variationsCount} total)</span>
                    </div>
                    {Array.isArray(nodeData.variations) && nodeData.variations.length > 0 ? (
                        <div className="mt-1 max-h-32 overflow-y-auto bg-gray-50 p-2 rounded border border-gray-200 scrollbar-thin">
                            <ul className="space-y-1">
                                {nodeData.variations.map((v: string, i: number) => (
                                    <li key={i} className="text-green-800 text-xs font-mono bg-green-50 p-1 rounded border border-green-100 whitespace-pre-wrap" title={v}>
                                        {v}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <span className="text-gray-400 text-xs ml-1"> (None defined)</span>
                    )}
                </div>
            )}
        </>
    );
};

export default SidebarActionView;