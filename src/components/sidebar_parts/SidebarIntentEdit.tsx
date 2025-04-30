import React from 'react';
import { Check, X, PlusCircle } from 'lucide-react';
import { IntentDefinition } from '../../types';

interface SidebarIntentEditProps {
    intents: IntentDefinition[]; // Full list for dropdown
    currentIntentId: string;
    currentExamples: string[];
    onIntentIdChange: (intentId: string) => void;
    onExampleChange: (index: number, value: string) => void;
    onAddExample: () => void;
    onRemoveExample: (index: number) => void;
    onSave: () => void;
    onCancel: () => void;
}

const SidebarIntentEdit: React.FC<SidebarIntentEditProps> = ({
    intents,
    currentIntentId,
    currentExamples,
    onIntentIdChange,
    onExampleChange,
    onAddExample,
    onRemoveExample,
    onSave,
    onCancel,
}) => {
    const selectedIntentDefinition = intents.find(i => i.id === currentIntentId);

    return (
        <div className="space-y-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            {/* Intent Definition Select */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="intentIdEdit">Intent Definition <span className="text-red-500">*</span></label>
                <select
                    id="intentIdEdit"
                    value={currentIntentId}
                    onChange={(e) => onIntentIdChange(e.target.value)}
                    required
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                >
                    <option value="" disabled>-- Select Intent --</option>
                    {intents.map((intent) => (
                        <option key={intent.id} value={intent.id}>
                            {intent.label} ({intent.id})
                        </option>
                    ))}
                    {/* Show current value if it's not in the list (e.g., loaded but definition deleted) */}
                     {!intents.some(i => i.id === currentIntentId) && currentIntentId && (
                         <option value={currentIntentId} disabled> {currentIntentId} (Current/Invalid) </option>
                     )}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                    Label: {selectedIntentDefinition?.label || <span className="italic text-red-600">Not Found</span>}
                </p>
            </div>

            {/* Examples Edit */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1"> Examples <span className="text-gray-400 text-xs">(updates definition)</span> </label>
                <p className="text-xs text-gray-500 mb-2"> Use <code className="text-xs">[value](entity)</code> format. Entities found: {selectedIntentDefinition?.entities?.join(', ') || 'None'} </p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin border bg-white border-gray-200 rounded p-2">
                    {currentExamples.map((example, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={example}
                                onChange={(e) => onExampleChange(index, e.target.value)}
                                className="flex-grow border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm input-sm" // Use input-sm
                                placeholder={`Example ${index + 1}`}
                            />
                            <button
                                onClick={() => onRemoveExample(index)}
                                type="button"
                                disabled={currentExamples.length <= 1 && example === ''} // Disable remove if only one empty example
                                className={`p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 flex-shrink-0 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed ${currentExamples.length <= 1 ? 'invisible' : ''}`}
                                title="Remove Example"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
                <button onClick={onAddExample} type="button" className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                    <PlusCircle size={16} /> Add Example
                </button>
            </div>

            {/* Save/Cancel Buttons */}
            <div className="flex gap-2 pt-3 border-t border-blue-100">
                <button
                    onClick={onSave}
                    className="flex-1 btn btn-primary btn-sm"
                    disabled={!currentIntentId || !intents.some(i => i.id === currentIntentId)} // Disable save if no valid intent selected
                >
                    <Check size={16} /> Save
                </button>
                <button onClick={onCancel} className="flex-1 btn btn-secondary btn-sm"> Cancel </button>
            </div>
        </div>
    );
};

export default SidebarIntentEdit;