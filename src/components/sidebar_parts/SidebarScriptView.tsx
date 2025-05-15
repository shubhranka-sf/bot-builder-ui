import React from 'react';
import { ScriptNodeData } from '../../types';
import { FileText } from 'lucide-react'; // Using FileText for script content icon

interface SidebarScriptViewProps {
    nodeData: ScriptNodeData;
}

const SidebarScriptView: React.FC<SidebarScriptViewProps> = ({ nodeData }) => {
    const name = nodeData.name || '(Unnamed Script)';
    const description = nodeData.description || '(No description)';
    const scriptContent = nodeData.scriptContent || '';
    const snippet = scriptContent.substring(0, 150) + (scriptContent.length > 150 ? '...' : '');

    return (
        <>
            <p className="text-sm">
                <span className="text-gray-500">Script Name:</span>{' '}
                <span className="font-medium text-purple-700 break-words">
                    {name}
                </span>
            </p>
            <p className="text-sm">
                <span className="text-gray-500">Description:</span>{' '}
                <span className="text-gray-700 italic text-xs break-words">
                    {description}
                </span>
            </p>
            <div className="text-sm mt-2">
                <span className="text-gray-500 flex items-center gap-1 mb-1">
                    <FileText size={14} /> Script Snippet:
                </span>
                {scriptContent ? (
                    <pre className="text-xs bg-gray-800 text-purple-300 p-2 rounded border border-gray-700 max-h-32 overflow-y-auto scrollbar-thin whitespace-pre-wrap break-all">
                        <code>{snippet}</code>
                    </pre>
                ) : (
                    <span className="text-gray-400 text-xs ml-1">(No script content yet)</span>
                )}
                <p className="text-xs text-gray-400 mt-1">Full script is editable on the node itself.</p>
            </div>
        </>
    );
};

export default SidebarScriptView;