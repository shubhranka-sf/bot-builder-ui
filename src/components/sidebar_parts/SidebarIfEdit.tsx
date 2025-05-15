import React from 'react';
import { Check } from 'lucide-react';

interface SidebarIfEditProps {
    currentIfName: string;
    currentIfDescription: string;
    currentIfCondition: string; // Condition is primarily edited on the node
    onNameChange: (name: string) => void;
    onDescriptionChange: (description: string) => void;
    onConditionChange: (condition: string) => void; // For potential future sidebar editing
    onSave: () => void;
    onCancel: () => void;
}

const SidebarIfEdit: React.FC<SidebarIfEditProps> = ({
    currentIfName,
    currentIfDescription,
    // currentIfCondition, // Not directly edited here for now
    onNameChange,
    onDescriptionChange,
    // onConditionChange,
    onSave,
    onCancel,
}) => {
    return (
        <div className="space-y-4 p-3 bg-sky-50 border border-sky-200 rounded-md">
            {/* If Node Name Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ifNameEdit">Node Name</label>
                <input
                    id="ifNameEdit"
                    type="text"
                    value={currentIfName}
                    onChange={(e) => onNameChange(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm text-sm"
                    placeholder="Enter a descriptive name (e.g., Check User Status)"
                />
            </div>

            {/* If Node Description Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ifDescriptionEdit">Description <span className="text-gray-400 text-xs">(optional)</span></label>
                <textarea
                    id="ifDescriptionEdit"
                    value={currentIfDescription}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    rows={2}
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm text-sm"
                    placeholder="What does this condition check?"
                />
            </div>
            
            <p className="text-xs text-gray-500 bg-sky-100 border border-sky-200 p-2 rounded">
                The <strong>condition logic (Python expression)</strong> is edited directly on the node in the flow diagram.
                The underlying Rasa action code will be generated based on that condition.
            </p>

            {/* Save/Cancel Buttons */}
            <div className="flex gap-2 pt-3 border-t border-sky-100">
                <button
                    onClick={onSave}
                    className="flex-1 btn btn-primary btn-sm bg-sky-600 hover:bg-sky-700 border-sky-600" // Sky theme for button
                >
                    <Check size={16} /> Save Details
                </button>
                <button onClick={onCancel} className="flex-1 btn btn-secondary btn-sm"> Cancel </button>
            </div>
        </div>
    );
};

export default SidebarIfEdit;