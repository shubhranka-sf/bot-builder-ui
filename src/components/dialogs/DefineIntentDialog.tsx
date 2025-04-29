import React, { useState, useCallback } from 'react';
import { X, PlusCircle, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { IntentDefinition } from '../../types';
import { parseEntitiesFromExamples } from '../../utils/entityParser';

interface DefineIntentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newIntent: IntentDefinition) => void;
    existingIntentIds: string[];
}

const DefineIntentDialog: React.FC<DefineIntentDialogProps> = ({ isOpen, onClose, onSubmit, existingIntentIds }) => {
    const [newIntentLabel, setNewIntentLabel] = useState('');
    const [newIntentId, setNewIntentId] = useState('');
    const [newIntentExamples, setNewIntentExamples] = useState<string[]>(['']);

    const handleAddExampleInput = useCallback(() => setNewIntentExamples((prev) => [...prev, '']), []);
    const handleExampleChange = useCallback((index: number, value: string) => {
        setNewIntentExamples((prev) => { const copy = [...prev]; copy[index] = value; return copy; });
    }, []);
    const handleRemoveExample = useCallback((index: number) => {
        setNewIntentExamples((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : ['']);
    }, []);

    const handleSubmit = useCallback(() => {
        const label = newIntentLabel.trim();
        const id = newIntentId.trim().replace(/\s+/g, '_').toLowerCase();
        const finalExamples = newIntentExamples.map((e) => e.trim()).filter(Boolean);

        if (!label || !id) { toast.error('Intent Label and ID are required.'); return; }
        if (existingIntentIds.includes(id)) { toast.error(`Intent ID "${id}" already exists.`); return; }
        // Basic validation for examples if needed
        // if (finalExamples.length === 0) { toast.warn('Consider adding examples for better training.'); }

        const parsedEntities = parseEntitiesFromExamples(finalExamples);
        onSubmit({ id, label, examples: finalExamples, entities: parsedEntities });

        // Reset form and close
        setNewIntentLabel(''); setNewIntentId(''); setNewIntentExamples(['']);
        onClose();
    }, [newIntentLabel, newIntentId, newIntentExamples, existingIntentIds, onSubmit, onClose]);

    const handleDialogClose = () => {
         // Reset form state on close
         setNewIntentLabel(''); setNewIntentId(''); setNewIntentExamples(['']);
         onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center border-b pb-3 mb-4 flex-shrink-0">
                    <h4 className="text-lg font-semibold text-blue-800 flex items-center gap-2"><PlusCircle size={18} /> Define New Intent</h4>
                    <button onClick={handleDialogClose} className="text-gray-400 hover:text-gray-600"> <X size={20} /> </button>
                </div>
                <div className="space-y-4 overflow-y-auto pr-2 flex-grow scrollbar-thin">
                    {/* Label Input */}
                    <div>
                        <label htmlFor="newIntentLabel" className="block text-sm font-medium text-gray-700 mb-1"> Label <span className="text-red-500">*</span> </label>
                        <input type="text" id="newIntentLabel" value={newIntentLabel} onChange={(e) => setNewIntentLabel(e.target.value)} required className="w-full input input-bordered input-sm" placeholder="e.g., Check Balance" />
                    </div>
                    {/* ID Input */}
                    <div>
                        <label htmlFor="newIntentId" className="block text-sm font-medium text-gray-700 mb-1"> ID <span className="text-red-500">*</span> </label>
                        <input type="text" id="newIntentId" value={newIntentId} onChange={(e) => setNewIntentId(e.target.value)} required className="w-full input input-bordered input-sm font-mono" placeholder="e.g., intent_check_balance" />
                        <p className="text-xs text-gray-500 mt-1"> Use lowercase_underscores. </p>
                    </div>
                    {/* Examples Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1"> Examples </label>
                        <p className="text-xs text-gray-500 mb-2"> Use <code className="text-xs">[value](entity)</code> format. </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin border bg-gray-50 border-gray-200 rounded p-2">
                            {newIntentExamples.map((example, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input type="text" value={example} onChange={(e) => handleExampleChange(index, e.target.value)} className="flex-grow input input-bordered input-xs" placeholder={`Example ${index + 1}`} />
                                    <button onClick={() => handleRemoveExample(index)} type="button" disabled={newIntentExamples.length <= 1 && example === ''} className={`btn btn-ghost btn-xs p-1 text-red-500 ${newIntentExamples.length <= 1 ? 'invisible' : ''}`} title="Remove"> <X size={16} /> </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleAddExampleInput} type="button" className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"> <PlusCircle size={16} /> Add Example </button>
                    </div>
                </div>
                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 border-t pt-4 mt-4 flex-shrink-0">
                    <button onClick={handleDialogClose} className="btn btn-secondary btn-sm"> Cancel </button>
                    <button onClick={handleSubmit} className="btn btn-primary btn-sm"> <Check size={16} /> Create Intent </button>
                </div>
            </div>
        </div>
    );
};

export default DefineIntentDialog;