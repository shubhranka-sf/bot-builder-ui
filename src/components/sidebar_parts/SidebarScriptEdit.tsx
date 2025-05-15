import React from 'react';
import { Check } from 'lucide-react';
// import { ScriptUtilityFunction } from '../../types'; // Not directly used in edit form for now

interface SidebarScriptEditProps {
    currentScriptName: string;
    currentScriptDescription: string;
    onNameChange: (name: string) => void;
    onDescriptionChange: (description: string) => void;
    onSave: () => void;
    onCancel: () => void;
    // scriptUtilities?: ScriptUtilityFunction[]; // Could be used for reference if needed
}

const SidebarScriptEdit: React.FC<SidebarScriptEditProps> = ({
    currentScriptName,
    currentScriptDescription,
    onNameChange,
    onDescriptionChange,
    onSave,
    onCancel,
}) => {
    return (
        <div className="space-y-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
            {/* Script Name Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="scriptNameEdit">Script Name</label>
                <input
                    id="scriptNameEdit"
                    type="text"
                    value={currentScriptName}
                    onChange={(e) => onNameChange(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm text-sm"
                    placeholder="Enter script name (e.g., Process User Input)"
                />
            </div>

            {/* Script Description Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="scriptDescriptionEdit">Description <span className="text-gray-400 text-xs">(optional)</span></label>
                <textarea
                    id="scriptDescriptionEdit"
                    value={currentScriptDescription}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    rows={3}
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm text-sm"
                    placeholder="Briefly describe what this script does"
                />
            </div>
            
            <p className="text-xs text-gray-500">
                The script code is edited directly on the node in the flow.
            </p>

            {/* Save/Cancel Buttons */}
            <div className="flex gap-2 pt-3 border-t border-purple-100">
                <button
                    onClick={onSave}
                    className="flex-1 btn btn-primary btn-sm" // Consider purple theme for consistency if btn-primary is indigo
                    // style={{ backgroundColor: '#8B5CF6', borderColor: '#7C3AED' }} // Example purple
                >
                    <Check size={16} /> Save Details
                </button>
                <button onClick={onCancel} className="flex-1 btn btn-secondary btn-sm"> Cancel </button>
            </div>
        </div>
    );
};

export default SidebarScriptEdit;