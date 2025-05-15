import React from 'react';
import { IfNodeData } from '../../types';
import { Terminal } from 'lucide-react'; // Using Terminal for code/condition icon

interface SidebarIfViewProps {
    nodeData: IfNodeData;
}

const SidebarIfView: React.FC<SidebarIfViewProps> = ({ nodeData }) => {
    const name = nodeData.name || '(Unnamed If Condition)';
    const description = nodeData.description || '(No description provided)';
    const condition = nodeData.condition || '(No condition set)';
    
    // Display a snippet of the condition if it's too long
    const conditionSnippet = condition.length > 100 ? condition.substring(0, 97) + '...' : condition;

    return (
        <>
            <p className="text-sm">
                <span className="text-gray-500">Node Name:</span>{' '}
                <span className="font-medium text-sky-700 break-words">
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
                    <Terminal size={14} /> Condition (Python):
                </span>
                {nodeData.condition ? (
                    <pre className="text-xs bg-slate-800 text-sky-300 p-2 rounded border border-slate-700 max-h-24 overflow-y-auto scrollbar-thin whitespace-pre-wrap break-all" title={condition}>
                        <code>{conditionSnippet}</code>
                    </pre>
                ) : (
                    <span className="text-gray-400 text-xs ml-1">(No condition set)</span>
                )}
                <p className="text-xs text-gray-400 mt-1">Condition is editable on the node itself.</p>
            </div>
            <div className="text-sm mt-2">
                 <span className="text-gray-500">Outputs:</span>
                 <ul className="list-disc list-inside ml-2 text-xs">
                    <li className="text-green-600">True path</li>
                    <li className="text-red-600">False path</li>
                 </ul>
            </div>
             <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                Note: The underlying Rasa action for this node evaluates the condition and sets a slot (e.g., <code className="text-xs">if_condition_true</code> or <code className="text-xs">if_condition_false</code>). Your stories then branch based on this slot.
            </p>
        </>
    );
};

export default SidebarIfView;