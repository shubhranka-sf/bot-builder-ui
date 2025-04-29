import React from 'react';
import { Check, Type, GitBranch, PlusCircle, Trash2 } from 'lucide-react';
import { ActionNodeData, AvailableFunction } from '../../types';
import { mockAvailableFunctions } from '../../data/mockData'; // Or receive via props

type ValueInputType = 'text' | 'function';

interface SidebarActionEditProps {
    config: Partial<ActionNodeData>;
    variations: string[];
    valueType: ValueInputType;
    onConfigChange: (field: keyof ActionNodeData | 'functionValue', value: string | ValueInputType) => void;
    onVariationChange: (index: number, value: string) => void;
    onAddVariation: () => void;
    onRemoveVariation: (index: number) => void;
    onValueTypeToggle: (type: ValueInputType) => void;
    onSave: () => void;
    onCancel: () => void;
    availableFunctions?: AvailableFunction[]; // Optional prop
}

const SidebarActionEdit: React.FC<SidebarActionEditProps> = ({
    config,
    variations,
    valueType,
    onConfigChange,
    onVariationChange,
    onAddVariation,
    onRemoveVariation,
    onValueTypeToggle,
    onSave,
    onCancel,
    availableFunctions = mockAvailableFunctions,
}) => {
    return (
        <div className="space-y-4 p-3 bg-green-50 border border-green-200 rounded-md">
            {/* Title Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="actionConfigTitle">Display Title <span className="text-gray-400 text-xs">(optional)</span></label>
                <input
                    id="actionConfigTitle"
                    type="text"
                    value={config.title || ''}
                    onChange={(e) => onConfigChange('title', e.target.value)}
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm"
                    placeholder="Node title"
                />
            </div>
            {/* Name Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="actionConfigName">Action Name (ID) <span className="text-red-500">*</span></label>
                <input
                    id="actionConfigName"
                    type="text"
                    value={config.name || ''}
                    onChange={(e) => onConfigChange('name', e.target.value)}
                    required
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm font-mono"
                    placeholder="e.g., action_ask_name"
                />
                <p className="text-xs text-gray-500 mt-1">Unique ID (lowercase_underscores).</p>
            </div>
            {/* Value Type Toggle */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value Type</label>
                <div className="flex gap-2">
                    <button onClick={() => onValueTypeToggle('text')} className={`btn-sm btn-toggle ${valueType === 'text' ? 'active' : ''}`}> <Type size={14} /> Text/Variations </button>
                    <button onClick={() => onValueTypeToggle('function')} className={`btn-sm btn-toggle ${valueType === 'function' ? 'active' : ''}`}> <GitBranch size={14} /> Function </button>
                </div>
            </div>
            {/* Variations Input Area */}
            {valueType === 'text' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1"> Response Variations <span className="text-red-500">*</span></label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin border border-gray-200 bg-white p-2 rounded">
                        {variations.map((variation, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <textarea
                                    value={variation}
                                    onChange={(e) => onVariationChange(index, e.target.value)}
                                    className="flex-grow border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm font-mono text-xs"
                                    placeholder={`Variation ${index + 1}`}
                                    rows={2}
                                />
                                <button
                                    onClick={() => onRemoveVariation(index)}
                                    type="button"
                                    disabled={variations.length <= 1}
                                    className={`p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 flex-shrink-0 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed`}
                                    title="Remove variation"
                                > <Trash2 size={16} /> </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={onAddVariation} type="button" className="mt-2 text-green-600 hover:text-green-800 text-sm flex items-center gap-1"> <PlusCircle size={16} /> Add Variation </button>
                </div>
            )}
            {/* Function Select Area */}
            {valueType === 'function' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="actionConfigValueFunction"> Select Function <span className="text-red-500">*</span> </label>
                    <select
                        id="actionConfigValueFunction"
                        value={config.value || ''}
                        onChange={(e) => onConfigChange('functionValue', e.target.value)}
                        required
                        className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm"
                    >
                        <option value="" disabled>-- Select function --</option>
                        {availableFunctions.map((func) => (<option key={func.name} value={func.name} title={func.description}>{func.name}</option>))}
                        {/* Show current value if it's not in the list (e.g., loaded from storage but func removed) */}
                        {config.value && !availableFunctions.some(f => f.name === config.value) && (
                             <option value={config.value} disabled> {config.value} (Current/Invalid) </option>
                         )}
                    </select>
                     <p className="text-xs text-gray-500 mt-1 h-4 truncate" title={availableFunctions.find(f => f.name === config.value)?.description}>
                        {availableFunctions.find(f => f.name === config.value)?.description}
                    </p>
                </div>
            )}
            {/* Save/Cancel Buttons */}
            <div className="flex gap-2 pt-3 border-t border-green-100">
                <button onClick={onSave} className="flex-1 btn btn-primary btn-sm" disabled={!config.name}> <Check size={16} /> Save </button>
                <button onClick={onCancel} className="flex-1 btn btn-secondary btn-sm"> Cancel </button>
            </div>
        </div>
    );
};

export default SidebarActionEdit;