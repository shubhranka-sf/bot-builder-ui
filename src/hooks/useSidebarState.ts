import { useState, useCallback, useMemo, useEffect } from 'react';
import { Node } from 'reactflow';
import { toast } from 'react-toastify';
import {
    StartNodeData,
    IntentNodeData,
    ActionNodeData,
    FormNodeData,
    IntentDefinition,
    ActionDefinition,
    AvailableFunction, // Assuming mockAvailableFunctions is constant or passed in
} from '../types';
import { mockAvailableFunctions } from '../data/mockData'; // Import mock functions

export type SidebarMode = 'view' | 'edit';
type ValueInputType = 'text' | 'function';

interface SidebarStateProps {
    selectedNode: Node | null;
    intents: IntentDefinition[]; // Needed for edit dropdowns & entity list
    definedActions: ActionDefinition[]; // Needed for edit dropdowns
    onUpdateStartNode: (nodeId: string, name: string, storyId?: string) => void;
    onUpdateIntent: (nodeId: string, intentId: string, examples?: string[]) => void;
    onUpdateAction: (nodeId: string, data: Partial<ActionNodeData>) => void;
    onUpdateForm: (nodeId: string, data: Partial<FormNodeData>) => void;
    onAddNewIntentDefinition: (intent: IntentDefinition) => void;
    onAddNewActionDefinition: (action: ActionDefinition) => void;
}

/**
 * Hook to manage the complex state within the Sidebar component,
 * including edit modes, temporary values, and save handlers.
 */
export function useSidebarState({
    selectedNode,
    intents,
    definedActions,
    onUpdateStartNode,
    onUpdateIntent,
    onUpdateAction,
    onUpdateForm,
    onAddNewIntentDefinition, // Pass through dialog handlers
    onAddNewActionDefinition,
}: SidebarStateProps) {
    const [mode, setMode] = useState<SidebarMode>('view');
    const [isChangingDefinition, setIsChangingDefinition] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // State for configurations (used ONLY in EDIT mode)
    const [currentStoryName, setCurrentStoryName] = useState<string>('');
    const [currentStoryId, setCurrentStoryId] = useState<string>('');
    const [currentActionConfig, setCurrentActionConfig] = useState<Partial<ActionNodeData>>({});
    const [currentValueInputType, setCurrentValueInputType] = useState<ValueInputType>('text');
    const [currentIntentId, setCurrentIntentId] = useState<string>('');
    const [currentExamples, setCurrentExamples] = useState<string[]>([]);
    const [currentVariations, setCurrentVariations] = useState<string[]>(['']);
    const [currentFormName, setCurrentFormName] = useState<string>('');
    const [currentFormId, setCurrentFormId] = useState<string>('');
    const [currentSlots, setCurrentSlots] = useState<string[]>([]);

    // State for Dialogs (managed within the main Sidebar component now)
    // const [showIntentDialog, setShowIntentDialog] = useState(false);
    // const [showActionDialog, setShowActionDialog] = useState(false);

    // Derived State
    const availableEntities = useMemo(() => {
        const allEntities = new Set<string>();
        intents.forEach(intent => {
            (intent.entities || []).forEach(entity => allEntities.add(entity));
        });
        return Array.from(allEntities).sort();
    }, [intents]);

    const filteredIntents = useMemo(() => intents.filter(intent =>
        intent.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intent.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (intent.entities && intent.entities.some(e => e.toLowerCase().includes(searchTerm.toLowerCase())))
    ), [intents, searchTerm]);

    const filteredActions = useMemo(() => definedActions.filter(action =>
        (action.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || // Handle potentially missing title
        action.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [definedActions, searchTerm]);

    // --- Effects ---
    // Effect to reset state when selectedNode changes
    useEffect(() => {
        if (selectedNode) {
            setMode('view'); // Always reset to view mode
            setIsChangingDefinition(false);
            setSearchTerm('');
            initializeEditState(selectedNode.data, selectedNode.type);
        } else {
            // Clear everything if no node is selected
            resetAllEditStates();
            setMode('view');
            setIsChangingDefinition(false);
            setSearchTerm('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNode]); // Dependency only on selectedNode identity

    // --- Helper Functions ---
    const resetAllEditStates = () => {
        setCurrentStoryName(''); setCurrentStoryId('');
        setCurrentIntentId(''); setCurrentExamples([]);
        setCurrentActionConfig({}); setCurrentValueInputType('text'); setCurrentVariations(['']);
        setCurrentFormName(''); setCurrentFormId(''); setCurrentSlots([]);
    };

    const initializeEditState = (nodeData: any, nodeType?: string) => {
         resetAllEditStates(); // Start fresh
         const data = nodeData || {};
         switch (nodeType) {
             case 'start':
                 setCurrentStoryName(data.storyName || '');
                 setCurrentStoryId(data.storyId || '');
                 break;
             case 'intent':
                 setCurrentIntentId(data.intentId || '');
                 // Fetch examples based on the *current* definition, not potentially stale node data examples
                  const definition = intents.find(i => i.id === data.intentId);
                  setCurrentExamples(definition?.examples ? [...definition.examples] : (Array.isArray(data.examples) ? [...data.examples] : [])); // Fallback to node data if def not found
                 break;
             case 'action':
                 const type = data.valueType || 'text';
                 setCurrentValueInputType(type);
                 const initialVariations = type === 'text' ? (Array.isArray(data.variations) && data.variations.length > 0 ? [...data.variations] : ['']) : [''];
                 setCurrentVariations(initialVariations);
                 setCurrentActionConfig({
                     title: data.title || data.name || '',
                     name: data.name || '',
                     valueType: type,
                     value: type === 'function' ? data.value || '' : initialVariations[0] || '',
                     variations: type === 'text' ? initialVariations : undefined,
                 });
                 break;
             case 'form':
                 setCurrentFormName(data.name || '');
                 setCurrentFormId(data.formId || '');
                 setCurrentSlots(Array.isArray(data.slots) ? [...data.slots] : []);
                 break;
         }
     };

    // --- Event Handlers ---
    const handleSetMode = useCallback(
        (newMode: SidebarMode) => {
            setMode(newMode);
            setIsChangingDefinition(false); // Reset change definition mode when switching main mode
            setSearchTerm('');
            // If switching TO edit mode, ensure state is initialized
            if (newMode === 'edit' && selectedNode) {
                initializeEditState(selectedNode.data, selectedNode.type);
            }
        },
        [selectedNode] // Add dependency
    );

    // --- Start Node ---
    const handleStoryNameChange = useCallback((newName: string) => setCurrentStoryName(newName), []);
    const handleStoryIdChange = useCallback((newId: string) => setCurrentStoryId(newId.trim().replace(/\s+/g, '_').toLowerCase()), []);
    const handleStartNodeEditSave = useCallback(() => {
        if (selectedNode?.type === 'start') {
            const finalName = currentStoryName.trim() || `Story_${selectedNode.id.slice(-4)}`;
            const finalId = currentStoryId.trim() || `story_${selectedNode.id.slice(-4)}`;
            onUpdateStartNode(selectedNode.id, finalName, finalId);
            handleSetMode('view');
        }
    }, [selectedNode, onUpdateStartNode, currentStoryName, currentStoryId, handleSetMode]);

    // --- Intent Node ---
     const handleIntentIdEditChange = useCallback((newId: string) => {
         setCurrentIntentId(newId);
         const definition = intents.find((i) => i.id === newId);
         // Update examples based on the *newly selected definition* during edit
         setCurrentExamples(definition?.examples ? [...definition.examples] : []);
     }, [intents]); // Dependency on intents
    const handleExampleChange = useCallback((index: number, value: string) => {
        setCurrentExamples((prev) => { const copy = [...prev]; copy[index] = value; return copy; });
    }, []);
    const handleAddExampleInput = useCallback(() => setCurrentExamples((prev) => [...prev, '']), []);
    const handleRemoveExampleInput = useCallback((index: number) => {
        setCurrentExamples((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : ['']);
    }, []);
    const handleIntentEditSave = useCallback(() => {
        if (selectedNode?.type === 'intent') {
            const finalIntentId = currentIntentId.trim();
            if (!finalIntentId) { toast.error('Intent ID cannot be empty.'); return; }
             if (!intents.some(i => i.id === finalIntentId)) {
                 toast.error(`Selected Intent ID "${finalIntentId}" is not a valid defined intent.`);
                 return;
             }
            // Filter out empty examples before saving
             const finalExamples = currentExamples.map((e) => e.trim()).filter(Boolean);
             // Pass examples ONLY IF they have been potentially modified (i.e., different from definition)
             // OR if the definition wasn't found initially. This prevents unnecessary definition updates.
             // A more robust check might involve deep comparison, but this is simpler.
             const definition = intents.find(i => i.id === finalIntentId);
             const examplesChanged = JSON.stringify(finalExamples) !== JSON.stringify(definition?.examples || []);

            onUpdateIntent(selectedNode.id, finalIntentId, examplesChanged ? finalExamples : undefined);
            handleSetMode('view');
        }
    }, [selectedNode, onUpdateIntent, currentIntentId, currentExamples, handleSetMode, intents]); // Added intents dependency

    // --- Action Node ---
    const handleActionConfigChange = useCallback(
        (field: keyof ActionNodeData | 'functionValue', value: string | ValueInputType) => {
            setCurrentActionConfig((prev) => {
                const newState = { ...prev };
                if (field === 'title') newState.title = value as string;
                else if (field === 'name') {
                    const newName = (value as string).trim().replace(/\s+/g, '_').toLowerCase();
                    if (!newState.title || newState.title === prev.name) newState.title = newName;
                    newState.name = newName;
                } else if (field === 'valueType') {
                    const newType = value as ValueInputType;
                    newState.valueType = newType;
                    setCurrentValueInputType(newType); // Update separate tracker too
                    if (newType === 'function') {
                        newState.value = prev.value && mockAvailableFunctions.some(f => f.name === prev.value) ? prev.value : (mockAvailableFunctions[0]?.name || '');
                        setCurrentVariations(['']); newState.variations = undefined;
                    } else {
                        newState.value = currentVariations[0] || '';
                        newState.variations = [...currentVariations];
                    }
                } else if (field === 'functionValue' && newState.valueType === 'function') {
                    newState.value = value as string;
                }
                return newState;
            });
        }, [currentVariations]
    );
    const handleValueTypeToggle = useCallback((type: ValueInputType) => handleActionConfigChange('valueType', type), [handleActionConfigChange]);
    const handleVariationChange = useCallback((index: number, value: string) => {
        setCurrentVariations(prev => { const copy = [...prev]; copy[index] = value; return copy; });
    }, []);
    const handleAddVariationInput = useCallback(() => setCurrentVariations(prev => [...prev, '']), []);
    const handleRemoveVariationInput = useCallback((index: number) => {
        setCurrentVariations(prev => (prev.length <= 1 ? [''] : prev.filter((_, i) => i !== index)));
    }, []);
    const handleActionEditSave = useCallback(() => {
        if (selectedNode?.type === 'action') {
            const finalName = currentActionConfig.name?.trim();
            if (!finalName) { toast.error('Action Name (ID) is required.'); return; }

            const finalTitle = currentActionConfig.title?.trim() || finalName;
            const finalValueType = currentValueInputType;
            let finalConfig: Partial<ActionNodeData>;

            if (finalValueType === 'text') {
                const finalVariations = currentVariations.map(v => v.trim()).filter(Boolean);
                if (finalVariations.length === 0) { toast.error('At least one text variation is required.'); return; }
                finalConfig = { name: finalName, title: finalTitle, valueType: 'text', variations: finalVariations, value: finalVariations[0] };
            } else {
                const finalFunctionValue = currentActionConfig.value?.trim();
                if (!finalFunctionValue) { toast.error('Function name cannot be empty.'); return; }
                 if (!mockAvailableFunctions.some(f => f.name === finalFunctionValue)) {
                     toast.error(`Selected function "${finalFunctionValue}" is not available.`);
                     return;
                 }
                finalConfig = { name: finalName, title: finalTitle, valueType: 'function', value: finalFunctionValue, variations: undefined };
            }
            onUpdateAction(selectedNode.id, finalConfig);
            handleSetMode('view');
        }
    }, [selectedNode, onUpdateAction, currentActionConfig, currentValueInputType, currentVariations, handleSetMode]);

    // --- Form Node ---
    const handleFormNameChange = useCallback((newName: string) => setCurrentFormName(newName), []);
    const handleFormIdChange = useCallback((newId: string) => setCurrentFormId(newId.trim().replace(/\s+/g, '_').toLowerCase()), []);
    const handleSlotToggle = useCallback((slotName: string) => {
        setCurrentSlots(prev => prev.includes(slotName) ? prev.filter(s => s !== slotName) : [...prev, slotName]);
    }, []);
    const handleFormEditSave = useCallback(() => {
        if (selectedNode?.type === 'form') {
            const finalName = currentFormName.trim() || `Form_${selectedNode.id.slice(-4)}`;
            const finalId = currentFormId.trim();
            if (!finalId) { toast.error('Form ID is required.'); return; }
            if (currentSlots.length === 0) toast.warn('This form currently has no slots selected.');
            onUpdateForm(selectedNode.id, { name: finalName, formId: finalId, slots: currentSlots });
            handleSetMode('view');
        }
    }, [selectedNode, onUpdateForm, currentFormName, currentFormId, currentSlots, handleSetMode]);

    // --- Change Definition ---
     const handleChangeIntentClick = useCallback((newIntentId: string) => {
         if (selectedNode?.type === 'intent') {
             // Update the node data directly with the new intent ID.
             // The main node update logic (in useNodeManagement or Flow.tsx) should handle
             // fetching the corresponding definition data (label, examples, entities)
             // OR, pass the full new definition here if preferred. Let's stick to ID for simplicity.
             onUpdateIntent(selectedNode.id, newIntentId); // Examples will be updated based on new definition
             setIsChangingDefinition(false);
             setSearchTerm('');
             setMode('view'); // Go back to view mode
         }
     }, [selectedNode, onUpdateIntent]); // Removed handleSetMode

     const handleChangeActionClick = useCallback((newActionName: string) => {
         if (selectedNode?.type === 'action') {
             // Pass only the name to trigger the "isChangingWhichAction" logic in updateActionNode
             onUpdateAction(selectedNode.id, { name: newActionName });
             setIsChangingDefinition(false);
             setSearchTerm('');
             setMode('view'); // Go back to view mode
         }
     }, [selectedNode, onUpdateAction]); // Removed handleSetMode


    return {
        mode,
        setMode: handleSetMode, // Use the guarded setter
        isChangingDefinition,
        setIsChangingDefinition,
        searchTerm,
        setSearchTerm,
        // Edit State Values
        currentStoryName,
        currentStoryId,
        currentActionConfig,
        currentValueInputType,
        currentIntentId,
        currentExamples,
        currentVariations,
        currentFormName,
        currentFormId,
        currentSlots,
        // Edit State Handlers
        handleStoryNameChange,
        handleStoryIdChange,
        handleActionConfigChange,
        handleValueTypeToggle,
        handleIntentIdEditChange,
        handleExampleChange,
        handleAddExampleInput,
        handleRemoveExampleInput,
        handleVariationChange,
        handleAddVariationInput,
        handleRemoveVariationInput,
        handleFormNameChange,
        handleFormIdChange,
        handleSlotToggle,
        // Save Handlers
        handleStartNodeEditSave,
        handleIntentEditSave,
        handleActionEditSave,
        handleFormEditSave,
        // Change Definition Handlers
        handleChangeIntentClick,
        handleChangeActionClick,
        // Derived/Filtered Data
        availableEntities,
        filteredIntents,
        filteredActions,
        // Passthrough Dialog Handlers (if needed by sub-components, though dialogs are separate now)
        // onAddNewIntentDefinition,
        // onAddNewActionDefinition,
    };
}