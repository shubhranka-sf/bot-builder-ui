import React, { useState, useEffect, useCallback } from 'react';
import { X, PlusCircle, Check, Type, GitBranch, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { ActionDefinition, AvailableFunction } from '../../types';
import { mockAvailableFunctions } from '../../data/mockData';
import { slugify } from '../../utils/slugify';

type ValueInputType = 'text' | 'function';

interface DefineActionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newAction: ActionDefinition) => void;
    existingActionNames: string[];
    availableFunctions?: AvailableFunction[];
}

const DefineActionDialog: React.FC<DefineActionDialogProps> = ({
    isOpen,
    onClose,
    onSubmit,
    existingActionNames,
    availableFunctions = mockAvailableFunctions
}) => {
    const [newActionTitle, setNewActionTitle] = useState('');
    const [newActionName, setNewActionName] = useState('');
    const [newActionValueType, setNewActionValueType] = useState<ValueInputType>('text');
    const [newActionVariations, setNewActionVariations] = useState<string[]>(['']);
    const [newActionFunctionValue, setNewActionFunctionValue] = useState<string>(availableFunctions[0]?.name || '');
    const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);

    // Generate slug for newActionName when newActionTitle changes
    useEffect(() => {
        if (!isNameManuallyEdited && newActionTitle.trim()) {
            const slug = slugify(newActionTitle);
            let generatedName = `utter_${slug}`;
            let suffix = 1;
            let uniqueName = generatedName;
            while (existingActionNames.includes(uniqueName)) {
                uniqueName = `utter_${slug}_${suffix}`;
                suffix++;
            }
            setNewActionName(uniqueName);
        } else if (!newActionTitle.trim() && !isNameManuallyEdited) {
            setNewActionName('');
        }
    }, [newActionTitle, existingActionNames, isNameManuallyEdited]);

    const handleValueTypeToggle = useCallback((type: ValueInputType) => {
        setNewActionValueType(type);
        if (type === 'text') {
            setNewActionFunctionValue(availableFunctions[0]?.name || '');
            if (newActionVariations.length === 0) setNewActionVariations(['']);
        }
    }, [availableFunctions]);

    const handleVariationChange = useCallback((index: number, value: string) => {
        setNewActionVariations(prev => {
            const copy = [...prev];
            copy[index] = value;
            return copy;
        });
    }, []);

    const handleAddVariationInput = useCallback(() => {
        setNewActionVariations(prev => [...prev, '']);
    }, []);

    const handleRemoveVariationInput = useCallback((index: number) => {
        setNewActionVariations(prev => (prev.length <= 1 ? [''] : prev.filter((_, i) => i !== index)));
    }, []);

    const handleNameChange = (value: string) => {
        setIsNameManuallyEdited(true);
        setNewActionName(value);
    };

    const handleSubmit = useCallback(() => {
        const title = newActionTitle.trim();
        const name = newActionName.trim().replace(/\s+/g, '_').toLowerCase();

        if (!name) {
            toast.error('Action Name (ID) is required.');
            return;
        }
        if (existingActionNames.includes(name)) {
            toast.error(`Action Name "${name}" already exists.`);
            return;
        }

        let actionToAdd: ActionDefinition;

        if (newActionValueType === 'text') {
            const finalVariations = newActionVariations.map(v => v.trim()).filter(Boolean);
            if (finalVariations.length === 0) {
                toast.error('At least one text variation is required.');
                return;
            }
            actionToAdd = { title: title || name, name, valueType: 'text', variations: finalVariations, value: finalVariations[0] };
        } else {
            const functionValue = newActionFunctionValue.trim();
            if (!functionValue) {
                toast.error('Function name cannot be empty.');
                return;
            }
            if (!availableFunctions.some(f => f.name === functionValue)) {
                toast.error(`Selected function "${functionValue}" is not valid.`);
                return;
            }
            actionToAdd = { title: title || name, name, valueType: 'function', value: functionValue };
        }

        onSubmit(actionToAdd);

        // Reset form and close
        setNewActionTitle('');
        setNewActionName('');
        setNewActionValueType('text');
        setNewActionVariations(['']);
        setNewActionFunctionValue(availableFunctions[0]?.name || '');
        setIsNameManuallyEdited(false);
        onClose();
    }, [
        newActionTitle,
        newActionName,
        newActionValueType,
        newActionVariations,
        newActionFunctionValue,
        existingActionNames,
        availableFunctions,
        onSubmit,
        onClose
    ]);

    const handleDialogClose = () => {
        setNewActionTitle('');
        setNewActionName('');
        setNewActionValueType('text');
        setNewActionVariations(['']);
        setNewActionFunctionValue(availableFunctions[0]?.name || '');
        setIsNameManuallyEdited(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center border-b pb-3 mb-4 flex-shrink-0">
                    <h4 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                        <PlusCircle size={18} /> Define New Action
                    </h4>
                    <button onClick={handleDialogClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                {/* Body */}
                <div className="space-y-4 overflow-y-auto pr-2 flex-grow scrollbar-thin">
                    {/* Title Input */}
                    <div>
                        <label htmlFor="newActionTitle" className="block text-sm font-medium text-gray-700 mb-1">
                            Title <span className="text-gray-400 text-xs">(optional)</span>
                        </label>
                        <input
                            type="text"
                            id="newActionTitle"
                            value={newActionTitle}
                            onChange={(e) => setNewActionTitle(e.target.value)}
                            className="w-full input input-bordered input-sm"
                            placeholder="Display title"
                        />
                    </div>
                    {/* Name Input */}
                    <div>
                        <label htmlFor="newActionName" className="block text-sm font-medium text-gray-700 mb-1">
                            Name (ID) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="newActionName"
                            value={newActionName}
                            onChange={(e) => handleNameChange(e.target.value)}
                            required
                            className="w-full input input-bordered input-sm font-mono"
                            placeholder="e.g., action_lookup or utter_greet"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Auto-generated from title or enter manually (lowercase_underscores).
                        </p>
                    </div>
                    {/* Value Type Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Value Type</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleValueTypeToggle('text')}
                                className={`btn-sm btn-toggle ${newActionValueType === 'text' ? 'active' : ''}`}
                            >
                                <Type size={14} /> Text/Variations
                            </button>
                            <button
                                onClick={() => handleValueTypeToggle('function')}
                                className={`btn-sm btn-toggle ${newActionValueType === 'function' ? 'active' : ''}`}
                            >
                                <GitBranch size={14} /> Function
                            </button>
                        </div>
                    </div>
                    {/* Conditional Inputs: Variations or Function Select */}
                    {newActionValueType === 'text' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Response Variations <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin border border-gray-200 bg-white p-2 rounded">
                                {newActionVariations.map((variation, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <textarea
                                            value={variation}
                                            onChange={(e) => handleVariationChange(index, e.target.value)}
                                            className="flex-grow textarea textarea-bordered textarea-xs"
                                            placeholder={`Variation ${index + 1}`}
                                            rows={2}
                                        />
                                        <button
                                            onClick={() => handleRemoveVariationInput(index)}
                                            type="button"
                                            disabled={newActionVariations.length <= 1}
                                            className={`btn btn-ghost btn-xs p-1 text-red-500 disabled:text-gray-400 ${
                                                newActionVariations.length <= 1 ? '' : 'hover:bg-red-100'
                                            }`}
                                            title="Remove"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleAddVariationInput}
                                type="button"
                                className="mt-2 text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
                            >
                                <PlusCircle size={16} /> Add Variation
                            </button>
                        </div>
                    ) : (
                        <div>
                            <label htmlFor="newActionValueFunc" className="block text-sm font-medium text-gray-700 mb-1">
                                Select Function <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="newActionValueFunc"
                                value={newActionFunctionValue}
                                onChange={(e) => setNewActionFunctionValue(e.target.value)}
                                required
                                className="w-full select select-bordered select-sm"
                            >
                                <option value="" disabled>-- Select function --</option>
                                {availableFunctions.map((func) => (
                                    <option key={func.name} value={func.name} title={func.description}>
                                        {func.name}
                                    </option>
                                ))}
                            </select>
                            <p
                                className="text-xs text-gray-500 mt-1 h-4 truncate"
                                title={availableFunctions.find(f => f.name === newActionFunctionValue)?.description}
                            >
                                {availableFunctions.find(f => f.name === newActionFunctionValue)?.description}
                            </p>
                        </div>
                    )}
                </div>
                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 border-t pt-4 mt-4 flex-shrink-0">
                    <button onClick={handleDialogClose} className="btn btn-secondary btn-sm">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="btn btn-primary btn-sm">
                        <Check size={16} /> Create Action
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DefineActionDialog;