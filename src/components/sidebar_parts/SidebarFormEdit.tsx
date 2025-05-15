import React from 'react';
import { Check, ListChecks } from 'lucide-react';

interface SidebarFormEditProps {
    currentFormName: string;
    currentFormId: string;
    currentSlots: string[];
    availableEntities: string[];
    onNameChange: (name: string) => void;
    onIdChange: (id: string) => void;
    onSlotToggle: (slotName: string) => void;
    onSave: () => void;
    onCancel: () => void;
}

const SidebarFormEdit: React.FC<SidebarFormEditProps> = ({
    currentFormName,
    currentFormId,
    currentSlots,
    availableEntities,
    onNameChange,
    onIdChange,
    onSlotToggle,
    onSave,
    onCancel,
}) => {
    return (
        <div className="space-y-4 p-3 bg-teal-50 border border-teal-200 rounded-md">
            {/* Form Name Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="formNameEdit">Form Name</label>
                <input
                    id="formNameEdit"
                    type="text"
                    value={currentFormName}
                    onChange={(e) => onNameChange(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm text-sm"
                    placeholder="Enter form name"
                />
            </div>
            {/* Form ID Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="formIdEdit">Form ID <span className="text-red-500">*</span></label>
                <input
                    id="formIdEdit"
                    type="text"
                    value={currentFormId}
                    onChange={(e) => onIdChange(e.target.value)}
                    required
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm text-sm font-mono"
                    placeholder="e.g., user_info_form"
                />
                <p className="text-xs text-gray-500 mt-1">Unique ID (lowercase_underscores).</p>
            </div>
            {/* Slots Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <ListChecks size={14} /> Required Slots
                </label>
                {availableEntities.length === 0 ? (
                    <p className="text-xs text-gray-500 bg-white p-2 rounded border border-gray-200">
                        No entities found in intents. Add entities like <code className="text-xs">[value](entity_name)</code> to intent examples to create available slots.
                    </p>
                ) : (
                    <div className="space-y-1 max-h-60 overflow-y-auto border rounded-md p-2 bg-white scrollbar-thin">
                        {availableEntities.map(entity => (
                            <label key={entity} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-1 hover:bg-teal-50 rounded">
                                <input
                                    type="checkbox"
                                    checked={currentSlots.includes(entity)}
                                    onChange={() => onSlotToggle(entity)}
                                    // Using Tailwind classes for basic checkbox styling, requires @tailwindcss/forms plugin or manual styling
                                    // Or use DaisyUI classes if available: className="checkbox checkbox-sm checkbox-primary ..."
                                    className="form-checkbox h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                />
                                <span className="select-none">{entity}</span>
                            </label>
                        ))}
                    </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Select entities the form should collect.</p>
            </div>
            {/* Save/Cancel Buttons */}
            <div className="flex gap-2 pt-3 border-t border-teal-100">
                <button
                    onClick={onSave}
                    className="flex-1 btn btn-primary btn-sm"
                    disabled={!currentFormId} // Disable save if ID is empty
                >
                    <Check size={16} /> Save
                </button>
                <button onClick={onCancel} className="flex-1 btn btn-secondary btn-sm"> Cancel </button>
            </div>
        </div>
    );
};

export default SidebarFormEdit;