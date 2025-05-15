import React from 'react';
import { Tag } from 'lucide-react';
import { IntentNodeData, IntentDefinition } from '../../types'; // Assuming IntentDefinition might be needed if passed down fully

interface SidebarIntentViewProps {
    nodeData: IntentNodeData;
    // Optional: Pass the full definition if needed for more details not in nodeData
    // intentDefinition?: IntentDefinition | null;
}

const SidebarIntentView: React.FC<SidebarIntentViewProps> = ({ nodeData }) => {
    // Prefer label from nodeData (synced from definition), fallback to intentId
    const displayLabel = nodeData.label || nodeData.intentId || '(Unknown)';
    const displayId = nodeData.intentId || 'N/A';
    const entities = nodeData.entities || [];
    const examples = nodeData.examples || [];

    // Function to highlight entities in examples
    const renderExample = (example: string) => {
        // Simple replacement, consider a more robust parser if complex markdown is needed
         return example.replace(/\[(.*?)\]\((.*?)\)/g, '[<strong class="text-blue-600 font-normal">$1</strong>]<span class="text-gray-500 font-normal">($2)</span>');
    };

    return (
        <>
            <p className="text-sm">
                <span className="text-gray-500">Intent Label:</span>{' '}
                <span className="font-medium text-blue-700 break-words">
                    {displayLabel}
                </span>
            </p>
            <p className="text-sm">
                <span className="text-gray-500">Intent ID:</span>{' '}
                <code className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded break-all">
                    {displayId}
                </code>
            </p>
            <div className="text-sm">
                <span className="text-gray-500">Entities Detected:</span>
                {entities.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {entities.map((entity: string, i: number) => (
                            <span key={i} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-300">
                                <Tag size={12} /> {entity}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-gray-400 text-xs ml-1"> (None detected)</span>
                )}
            </div>
            <div className="text-sm">
                <span className="text-gray-500">Examples ({examples.length}):</span>
                {examples.length > 0 ? (
                    <div className="mt-1 max-h-28 overflow-y-auto bg-gray-50 p-2 rounded border border-gray-200 scrollbar-thin">
                        <ul className="space-y-1">
                            {examples.map((ex: string, i: number) => (
                                <li key={i} className="text-gray-600 text-xs" title={ex}>
                                    <span dangerouslySetInnerHTML={{ __html: renderExample(ex) }} />
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <span className="text-gray-400 text-xs ml-1"> (None)</span>
                )}
            </div>
        </>
    );
};

export default SidebarIntentView;