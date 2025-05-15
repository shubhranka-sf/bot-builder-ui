import { useState, useCallback, useMemo, useEffect } from 'react';
import { Node } from 'reactflow';
import { toast } from 'react-toastify';
import {
    ActionNodeData,
    IntentDefinition,
    ActionDefinition,
    FormNodeData,
    ScriptNodeData,
    IfNodeData, // --- IMPORT IfNodeData ---
    ScriptUtilityFunction,
} from '../../types';
import { mockAvailableFunctions } from '../../data/mockData'; 

export type SidebarMode = 'view' | 'edit';
type ValueInputType = 'text' | 'function';

interface SidebarStateProps {
    selectedNode: Node | null;
    intents: IntentDefinition[]; 
    definedActions: ActionDefinition[]; 
    scriptUtilities: ScriptUtilityFunction[];
    onUpdateStartNode: (nodeId: string, name: string, storyId?: string) => void;
    onUpdateIntent: (nodeId: string, intentId: string, examples?: string[]) => void;
    onUpdateAction: (nodeId: string, data: Partial<ActionNodeData>) => void;
    onUpdateForm: (nodeId: string, data: Partial<FormNodeData>) => void;
    onUpdateScriptNode: (nodeId: string, data: Partial<ScriptNodeData>) => void;
    onUpdateIfNode: (nodeId: string, data: Partial<IfNodeData>) => void; // --- ADDED onUpdateIfNode ---
    onAddNewIntentDefinition: (intent: IntentDefinition) => void;
    onAddNewActionDefinition: (action: ActionDefinition) => void;
}

export function useSidebarState({
    selectedNode,
    intents,
    definedActions,
    // scriptUtilities, // Not directly used in this hook's state setters for ScriptNode
    onUpdateStartNode,
    onUpdateIntent,
    onUpdateAction,
    onUpdateForm,
    onUpdateScriptNode,
    onUpdateIfNode, // --- ADDED onUpdateIfNode ---
}: SidebarStateProps) {
    const [mode, setMode] = useState<SidebarMode>('view');
    const [isChangingDefinition, setIsChangingDefinition] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Common state
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
    const [currentScriptName, setCurrentScriptName] = useState<string>('');
    const [currentScriptDescription, setCurrentScriptDescription] = useState<string>('');
    // --- ADDED IF NODE STATE ---
    const [currentIfName, setCurrentIfName] = useState<string>('');
    const [currentIfDescription, setCurrentIfDescription] = useState<string>('');
    const [currentIfCondition, setCurrentIfCondition] = useState<string>('');


    const availableEntities = useMemo(() => { /* ... (no change) ... */
        const allEntities = new Set<string>();
        intents.forEach(intent => {
            (intent.entities || []).forEach(entity => allEntities.add(entity));
        });
        return Array.from(allEntities).sort();
    }, [intents]);

    const filteredIntents = useMemo(() => intents.filter(intent => /* ... (no change) ... */
        intent.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intent.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (intent.entities && intent.entities.some(e => e.toLowerCase().includes(searchTerm.toLowerCase())))
    ), [intents, searchTerm]);

    const filteredActions = useMemo(() => definedActions.filter(action => /* ... (no change) ... */
        (action.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        action.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [definedActions, searchTerm]);

    useEffect(() => {
        if (selectedNode) {
            setMode('view'); 
            setIsChangingDefinition(false);
            setSearchTerm('');
            initializeEditState(selectedNode.data, selectedNode.type);
        } else {
            resetAllEditStates();
            setMode('view');
            setIsChangingDefinition(false);
            setSearchTerm('');
        }
    }, [selectedNode]); 

    const resetAllEditStates = () => {
        setCurrentStoryName(''); setCurrentStoryId('');
        setCurrentIntentId(''); setCurrentExamples([]);
        setCurrentActionConfig({}); setCurrentValueInputType('text'); setCurrentVariations(['']);
        setCurrentFormName(''); setCurrentFormId(''); setCurrentSlots([]);
        setCurrentScriptName(''); setCurrentScriptDescription('');
        setCurrentIfName(''); setCurrentIfDescription(''); setCurrentIfCondition(''); // Reset If state
    };

    const initializeEditState = (nodeData: any, nodeType?: string) => {
         resetAllEditStates(); 
         const data = nodeData || {};
         switch (nodeType) {
             case 'start': /* ... (no change) ... */
                 setCurrentStoryName(data.storyName || '');
                 setCurrentStoryId(data.storyId || '');
                 break;
             case 'intent': /* ... (no change) ... */
                 setCurrentIntentId(data.intentId || '');
                  const definition = intents.find(i => i.id === data.intentId);
                  setCurrentExamples(definition?.examples ? [...definition.examples] : (Array.isArray(data.examples) ? [...data.examples] : [])); 
                 break;
             case 'action': /* ... (no change) ... */
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
             case 'form': /* ... (no change) ... */
                 setCurrentFormName(data.name || '');
                 setCurrentFormId(data.formId || '');
                 setCurrentSlots(Array.isArray(data.slots) ? [...data.slots] : []);
                 break;
             case 'script': /* ... (no change) ... */
                 setCurrentScriptName(data.name || '');
                 setCurrentScriptDescription(data.description || '');
                 break;
             case 'if': // --- INITIALIZE IF NODE STATE ---
                 setCurrentIfName(data.name || '');
                 setCurrentIfDescription(data.description || '');
                 setCurrentIfCondition(data.condition || ''); // Condition from node data
                 break;
         }
     };

    const handleSetMode = useCallback( /* ... (no change) ... */
        (newMode: SidebarMode) => {
            setMode(newMode);
            setIsChangingDefinition(false); 
            setSearchTerm('');
            if (newMode === 'edit' && selectedNode) {
                initializeEditState(selectedNode.data, selectedNode.type);
            }
        },
        [selectedNode] 
    );

    // Start Node Handlers (no change)
    const handleStoryNameChange = useCallback((newName: string) => setCurrentStoryName(newName), []);
    const handleStoryIdChange = useCallback((newId: string) => setCurrentStoryId(newId.trim().replace(/\s+/g, '_').toLowerCase()), []);
    const handleStartNodeEditSave = useCallback(() => { /* ... (no change) ... */
        if (selectedNode?.type === 'start') {
            const finalName = currentStoryName.trim() || `Story_${selectedNode.id.slice(-4)}`;
            const finalId = currentStoryId.trim() || `story_${selectedNode.id.slice(-4)}`;
            onUpdateStartNode(selectedNode.id, finalName, finalId);
            handleSetMode('view');
        }
    }, [selectedNode, onUpdateStartNode, currentStoryName, currentStoryId, handleSetMode]);

    // Intent Node Handlers (no change)
    const handleIntentIdEditChange = useCallback((newId: string) => { /* ... (no change) ... */
         setCurrentIntentId(newId);
         const definition = intents.find((i) => i.id === newId);
         setCurrentExamples(definition?.examples ? [...definition.examples] : []);
     }, [intents]); 
    const handleExampleChange = useCallback((index: number, value: string) => { /* ... (no change) ... */
        setCurrentExamples((prev) => { const copy = [...prev]; copy[index] = value; return copy; });
    }, []);
    const handleAddExampleInput = useCallback(() => setCurrentExamples((prev) => [...prev, '']), []);
    const handleRemoveExampleInput = useCallback((index: number) => { /* ... (no change) ... */
        setCurrentExamples((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : ['']);
    }, []);
    const handleIntentEditSave = useCallback(() => { /* ... (no change) ... */
        if (selectedNode?.type === 'intent') {
            const finalIntentId = currentIntentId.trim();
            if (!finalIntentId) { toast.error('Intent ID cannot be empty.'); return; }
             if (!intents.some(i => i.id === finalIntentId)) {
                 toast.error(`Selected Intent ID "${finalIntentId}" is not a valid defined intent.`);
                 return;
             }
             const finalExamples = currentExamples.map((e) => e.trim()).filter(Boolean);
             const definition = intents.find(i => i.id === finalIntentId);
             const examplesChanged = JSON.stringify(finalExamples) !== JSON.stringify(definition?.examples || []);

            onUpdateIntent(selectedNode.id, finalIntentId, examplesChanged ? finalExamples : undefined);
            handleSetMode('view');
        }
    }, [selectedNode, onUpdateIntent, currentIntentId, currentExamples, handleSetMode, intents]);

    // Action Node Handlers (no change)
    const handleActionConfigChange = useCallback( /* ... (no change) ... */
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
                    setCurrentValueInputType(newType); 
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
    const handleVariationChange = useCallback((index: number, value: string) => { /* ... (no change) ... */
        setCurrentVariations(prev => { const copy = [...prev]; copy[index] = value; return copy; });
    }, []);
    const handleAddVariationInput = useCallback(() => setCurrentVariations(prev => [...prev, '']), []);
    const handleRemoveVariationInput = useCallback((index: number) => { /* ... (no change) ... */
        setCurrentVariations(prev => (prev.length <= 1 ? [''] : prev.filter((_, i) => i !== index)));
    }, []);
    const handleActionEditSave = useCallback(() => { /* ... (no change) ... */
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

    // Form Node Handlers (no change)
    const handleFormNameChange = useCallback((newName: string) => setCurrentFormName(newName), []);
    const handleFormIdChange = useCallback((newId: string) => setCurrentFormId(newId.trim().replace(/\s+/g, '_').toLowerCase()), []);
    const handleSlotToggle = useCallback((slotName: string) => { /* ... (no change) ... */
        setCurrentSlots(prev => prev.includes(slotName) ? prev.filter(s => s !== slotName) : [...prev, slotName]);
    }, []);
    const handleFormEditSave = useCallback(() => { /* ... (no change) ... */
        if (selectedNode?.type === 'form') {
            const finalName = currentFormName.trim() || `Form_${selectedNode.id.slice(-4)}`;
            const finalId = currentFormId.trim();
            if (!finalId) { toast.error('Form ID is required.'); return; }
            if (currentSlots.length === 0) toast.warn('This form currently has no slots selected.');
            onUpdateForm(selectedNode.id, { name: finalName, formId: finalId, slots: currentSlots });
            handleSetMode('view');
        }
    }, [selectedNode, onUpdateForm, currentFormName, currentFormId, currentSlots, handleSetMode]);

    // Script Node Handlers (no change)
    const handleScriptNameChange = useCallback((newName: string) => setCurrentScriptName(newName), []);
    const handleScriptDescriptionChange = useCallback((newDescription: string) => setCurrentScriptDescription(newDescription), []);
    const handleScriptNodeEditSave = useCallback(() => { /* ... (no change) ... */
        if (selectedNode?.type === 'script') {
            const finalName = currentScriptName.trim() || `Script_${selectedNode.id.slice(-4)}`;
            onUpdateScriptNode(selectedNode.id, {
                name: finalName,
                description: currentScriptDescription.trim(),
            });
            handleSetMode('view');
        }
    }, [selectedNode, onUpdateScriptNode, currentScriptName, currentScriptDescription, handleSetMode]);

    // --- IF NODE Handlers ---
    const handleIfNameChange = useCallback((newName: string) => setCurrentIfName(newName), []);
    const handleIfDescriptionChange = useCallback((newDescription: string) => setCurrentIfDescription(newDescription), []);
    const handleIfConditionChange = useCallback((newCondition: string) => setCurrentIfCondition(newCondition), []); // For node's own editor usually
    const handleIfNodeEditSave = useCallback(() => {
        if (selectedNode?.type === 'if') {
            const finalName = currentIfName.trim() || `IfCondition_${selectedNode.id.slice(-4)}`;
            // Condition is primarily edited on the node itself.
            // If the sidebar were to also edit the condition, this would be the place to use `currentIfCondition`.
            // For now, we only save name and description from the sidebar.
            // The `updateIfNode` in useNodeManagement handles regenerating scriptContent if condition changes.
            onUpdateIfNode(selectedNode.id, {
                name: finalName,
                description: currentIfDescription.trim(),
                // condition: currentIfCondition.trim() // Only if sidebar edits condition
            });
            handleSetMode('view');
        }
    }, [selectedNode, onUpdateIfNode, currentIfName, currentIfDescription, /* currentIfCondition, */ handleSetMode]);


    // Change Definition Handlers (no change)
     const handleChangeIntentClick = useCallback((newIntentId: string) => { /* ... (no change) ... */
         if (selectedNode?.type === 'intent') {
             onUpdateIntent(selectedNode.id, newIntentId); 
             setIsChangingDefinition(false);
             setSearchTerm('');
             setMode('view'); 
         }
     }, [selectedNode, onUpdateIntent]); 

     const handleChangeActionClick = useCallback((newActionName: string) => { /* ... (no change) ... */
         if (selectedNode?.type === 'action') {
             onUpdateAction(selectedNode.id, { name: newActionName });
             setIsChangingDefinition(false);
             setSearchTerm('');
             setMode('view'); 
         }
     }, [selectedNode, onUpdateAction]); 


    return {
        mode,
        setMode: handleSetMode, 
        isChangingDefinition,
        setIsChangingDefinition,
        searchTerm,
        setSearchTerm,
        // Edit State Values
        currentStoryName, currentStoryId,
        currentActionConfig, currentValueInputType, currentVariations,
        currentIntentId, currentExamples,
        currentFormName, currentFormId, currentSlots,
        currentScriptName, currentScriptDescription,
        currentIfName, currentIfDescription, currentIfCondition, // If Node
        // Edit State Handlers
        handleStoryNameChange, handleStoryIdChange,
        handleActionConfigChange, handleValueTypeToggle, handleVariationChange, handleAddVariationInput, handleRemoveVariationInput,
        handleIntentIdEditChange, handleExampleChange, handleAddExampleInput, handleRemoveExampleInput,
        handleFormNameChange, handleFormIdChange, handleSlotToggle,
        handleScriptNameChange, handleScriptDescriptionChange,
        handleIfNameChange, handleIfDescriptionChange, handleIfConditionChange, // If Node
        // Save Handlers
        handleStartNodeEditSave,
        handleIntentEditSave,
        handleActionEditSave,
        handleFormEditSave,
        handleScriptNodeEditSave,
        handleIfNodeEditSave, // If Node
        // Change Definition Handlers
        handleChangeIntentClick,
        handleChangeActionClick,
        // Derived/Filtered Data
        availableEntities,
        filteredIntents,
        filteredActions,
    };
}