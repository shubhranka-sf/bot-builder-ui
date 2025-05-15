import React from 'react';
import { Check } from 'lucide-react';

interface SidebarStartEditProps {
    currentStoryName: string;
    currentStoryId: string;
    onNameChange: (name: string) => void;
    onIdChange: (id: string) => void;
    onSave: () => void;
    onCancel: () => void;
}

const SidebarStartEdit: React.FC<SidebarStartEditProps> = ({
    currentStoryName,
    currentStoryId,
    onNameChange,
    onIdChange,
    onSave,
    onCancel,
}) => {
    return (
        <div className="space-y-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="storyNameEdit">Story Name</label>
                <input
                    id="storyNameEdit"
                    type="text"
                    value={currentStoryName}
                    onChange={(e) => onNameChange(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                    placeholder="Enter story name"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="storyIdEdit">Story ID <span className="text-red-500">*</span></label>
                <input
                    id="storyIdEdit"
                    type="text"
                    value={currentStoryId}
                    onChange={(e) => onIdChange(e.target.value)}
                    required
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm font-mono"
                    placeholder="e.g., main_story_path"
                />
                <p className="text-xs text-gray-500 mt-1">Unique ID (lowercase_underscores).</p>
            </div>
            <div className="flex gap-2 pt-3 border-t border-indigo-100">
                <button onClick={onSave} className="flex-1 btn btn-primary btn-sm"> <Check size={16} /> Save </button>
                <button onClick={onCancel} className="flex-1 btn btn-secondary btn-sm"> Cancel </button>
            </div>
        </div>
    );
};

export default SidebarStartEdit;