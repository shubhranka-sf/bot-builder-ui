import React from 'react';
import { CheckSquare } from 'lucide-react';
import { FormNodeData } from '../../types';

interface SidebarFormViewProps {
    nodeData: FormNodeData;
}

const SidebarFormView: React.FC<SidebarFormViewProps> = ({ nodeData }) => {
    const slots = nodeData.slots || [];

    return (
        <>
            <p className="text-sm">
                <span className="text-gray-500">Form Name:</span>{' '}
                <span className="font-medium text-teal-700 break-words">
                    {nodeData.name || '(Not Set)'}
                </span>
            </p>
            <p className="text-sm">
                <span className="text-gray-500">Form ID:</span>{' '}
                <code className="text-xs bg-teal-100 text-teal-700 px-1 py-0.5 rounded break-all">
                    {nodeData.formId || '(Not Set)'}
                </code>
            </p>
            <div className="text-sm">
                <span className="text-gray-500">Required Slots ({slots.length}):</span>
                {slots.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {slots.map((slot: string, i: number) => (
                            <span key={i} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-300">
                                <CheckSquare size={12} className="text-teal-600" /> {slot}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-gray-400 text-xs ml-1"> (None selected)</span>
                )}
            </div>
        </>
    );
};

export default SidebarFormView;