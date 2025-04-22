import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Node } from 'reactflow';
import {
  Bot,
  Zap,
  X,
  PlusCircle,
  Type,
  Edit,
  GitBranch,
  Replace,
  Check,
  PlayCircle,
  FlagOff,
  AlertTriangle,
  Search,
  ChevronLeft,
  Tag, // Icon for entities
  MessageSquarePlus, // Icon for variations
  Trash2, // Icon for deleting variations
} from 'lucide-react';
import {
  ActionDefinition,
  IntentDefinition,
  StartNodeData,
  IntentNodeData,
  ActionNodeData,
} from '../types';
import { mockAvailableFunctions } from '../data/mockData'; // Functions remain the same
import { parseEntitiesFromExamples } from '../utils/entityParser'; // Import parser
import { toast } from 'react-toastify'; // Import toast

interface SidebarProps {
  selectedNode: Node<StartNodeData | IntentNodeData | ActionNodeData | any> | null;
  intents: IntentDefinition[]; // Now includes entities
  definedActions: ActionDefinition[]; // Now includes variations
  onUpdateStartNode: (nodeId: string, newStoryName: string, storyId?: string) => void;
  onUpdateIntent: (nodeId: string, newIntentId: string, examples?: string[]) => void;
  // Update signature to potentially receive variations
  onUpdateAction: (nodeId: string, actionData: Partial<ActionNodeData>) => void;
  onAddNewIntentDefinition: (newIntent: IntentDefinition) => void;
  // Update signature to potentially receive variations
  onAddNewActionDefinition: (newAction: ActionDefinition) => void;
  onClose: () => void;
}

type SidebarMode = 'view' | 'edit';
type ValueInputType = 'text' | 'function';

const Sidebar: React.FC<SidebarProps> = ({
  selectedNode,
  intents,
  definedActions,
  onUpdateStartNode,
  onUpdateIntent,
  onUpdateAction,
  onAddNewIntentDefinition,
  onAddNewActionDefinition,
  onClose,
}) => {
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
  // State for Action Text Variations (Edit Mode)
  const [currentVariations, setCurrentVariations] = useState<string[]>(['']); // Start with one empty

  // State for Dialogs
  const [showIntentDialog, setShowIntentDialog] = useState(false);
  const [newIntentLabel, setNewIntentLabel] = useState('');
  const [newIntentId, setNewIntentId] = useState('');
  const [newIntentExamples, setNewIntentExamples] = useState<string[]>(['']);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionName, setNewActionName] = useState('');
  const [newActionValueType, setNewActionValueType] = useState<ValueInputType>('text');
  // State for Variations in New Action Dialog
  const [newActionVariations, setNewActionVariations] = useState<string[]>(['']);
  const [newActionFunctionValue, setNewActionFunctionValue] = useState<string>(''); // Separate state for function value


  // --- Effects ---
  useEffect(() => {
    if (selectedNode) {
      console.log('Sidebar useEffect [selectedNode changed]: Resetting mode/state.', selectedNode.id, selectedNode.type);
      setMode('view');
      setIsChangingDefinition(false);
      setSearchTerm('');

      const nodeData = selectedNode.data || {};
      if (selectedNode.type === 'start') {
        setCurrentStoryName(nodeData.storyName || '');
        setCurrentStoryId(nodeData.storyId || '');
      } else if (selectedNode.type === 'intent') {
        setCurrentIntentId(nodeData.intentId || '');
        setCurrentExamples(Array.isArray(nodeData.examples) ? [...nodeData.examples] : []);
      } else if (selectedNode.type === 'action') {
        const type = nodeData.valueType || 'text';
        setCurrentValueInputType(type);
        // Initialize variations state specifically based on type and data
        const initialVariations = type === 'text' ? (Array.isArray(nodeData.variations) && nodeData.variations.length > 0 ? [...nodeData.variations] : ['']) : [''];
        setCurrentVariations(initialVariations);
        // Set basic config, deriving value/variations based on type
        setCurrentActionConfig({
            title: nodeData.title || nodeData.name || '',
            name: nodeData.name || '',
            valueType: type,
            value: type === 'function' ? nodeData.value || '' : initialVariations[0] || '', // Use first variation or func value
            variations: type === 'text' ? initialVariations : undefined,
        });
      } else {
         // Reset for other types
        setCurrentStoryName(''); setCurrentStoryId(''); setCurrentIntentId(''); setCurrentExamples([]); setCurrentActionConfig({}); setCurrentValueInputType('text'); setCurrentVariations(['']);
      }
    } else {
      // Clear everything if no node is selected
       console.log('Sidebar useEffect [no selected node]: Clearing state.');
       setCurrentStoryName(''); setCurrentStoryId(''); setCurrentIntentId(''); setCurrentExamples([]); setCurrentActionConfig({}); setCurrentValueInputType('text'); setCurrentVariations(['']);
       setMode('view'); setIsChangingDefinition(false); setSearchTerm('');
    }
  }, [selectedNode]); // Dependency only on selectedNode identity

  // --- Event Handlers ---
  const handleSetMode = useCallback(
    (newMode: SidebarMode) => {
      setMode(newMode);
      setIsChangingDefinition(false);
      setSearchTerm('');
      // Re-initialize edit state ONLY IF switching TO edit mode FROM view mode
      if (newMode === 'edit' && mode === 'view' && selectedNode) {
        console.log('Switching to Edit Mode, re-initializing edit state.');
        const nodeData = selectedNode.data || {};
        if (selectedNode.type === 'start') {
          setCurrentStoryName(nodeData.storyName || '');
           setCurrentStoryId(nodeData.storyId || '');
        } else if (selectedNode.type === 'intent') {
          setCurrentIntentId(nodeData.intentId || '');
          setCurrentExamples(Array.isArray(nodeData.examples) ? [...nodeData.examples] : []);
        } else if (selectedNode.type === 'action') {
           const type = nodeData.valueType || 'text';
           setCurrentValueInputType(type);
            const initialVariations = type === 'text' ? (Array.isArray(nodeData.variations) && nodeData.variations.length > 0 ? [...nodeData.variations] : ['']) : [''];
           setCurrentVariations(initialVariations);
           setCurrentActionConfig({
                title: nodeData.title || nodeData.name || '',
                name: nodeData.name || '',
                valueType: type,
                value: type === 'function' ? nodeData.value || '' : initialVariations[0] || '',
                variations: type === 'text' ? initialVariations : undefined,
            });
        }
      }
    },
    [selectedNode, mode]
  );

  // --- Start Node Handlers (Unchanged) ---
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

  // --- Intent Node Handlers (Unchanged) ---
  const handleIntentIdEditChange = useCallback((newId: string) => {
      setCurrentIntentId(newId);
      const definition = intents.find((i) => i.id === newId);
      setCurrentExamples(definition?.examples ? [...definition.examples] : []);
  }, [intents]);
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
      const finalExamples = currentExamples.map((e) => e.trim()).filter((e) => e);
      onUpdateIntent(selectedNode.id, finalIntentId, finalExamples);
      handleSetMode('view');
    }
  }, [selectedNode, onUpdateIntent, currentIntentId, currentExamples, handleSetMode]);


  // --- Action Node Handlers (Edit Mode - Updated for Variations) ---
   const handleActionConfigChange = useCallback(
    // Now explicitly handles 'functionValue' separately from 'value'
    (field: keyof ActionNodeData | 'functionValue', value: string | ValueInputType) => {
      setCurrentActionConfig((prev) => {
        const newState = { ...prev };

        if (field === 'title') {
            newState.title = value as string;
        } else if (field === 'name') {
            const newName = (value as string).trim().replace(/\s+/g, '_').toLowerCase();
            if (!newState.title || newState.title === prev.name) {
                newState.title = newName; // Auto-update title
            }
            newState.name = newName;
        } else if (field === 'valueType') {
            const newType = value as ValueInputType;
            newState.valueType = newType;
            setCurrentValueInputType(newType); // Update separate tracker
            if (newType === 'function') {
                newState.value = prev.value && mockAvailableFunctions.some(f=>f.name === prev.value) ? prev.value : (mockAvailableFunctions[0]?.name || ''); // Keep old func value if valid, else default
                setCurrentVariations(['']); // Reset variations state
                newState.variations = undefined;
            } else { // Switching to text
                newState.value = currentVariations[0] || ''; // Use first current variation
                newState.variations = [...currentVariations]; // Assign current variations
            }
        } else if (field === 'functionValue' && newState.valueType === 'function') {
             newState.value = value as string; // Update function value
        }
        // Note: 'variations' array itself is updated via setCurrentVariations
        // 'value' for text type will be updated based on variations on save

        return newState;
      });
    },
    [currentVariations] // Depend on currentVariations for switching to text type
  );

   // Handler specifically for the value type toggle buttons
   const handleValueTypeToggle = useCallback((type: ValueInputType) => {
      handleActionConfigChange('valueType', type);
   }, [handleActionConfigChange]);

   // Handlers for Variations array in Edit mode
   const handleVariationChange = useCallback((index: number, value: string) => {
       setCurrentVariations(prev => {
           const copy = [...prev];
           copy[index] = value;
           return copy;
       });
   }, []);

   const handleAddVariationInput = useCallback(() => {
       setCurrentVariations(prev => [...prev, '']);
   }, []);

   const handleRemoveVariationInput = useCallback((index: number) => {
       setCurrentVariations(prev => {
           if (prev.length <= 1) return ['']; // Keep at least one empty input
           return prev.filter((_, i) => i !== index);
       });
   }, []);

  // Save handler updated for variations
  const handleActionEditSave = useCallback(() => {
    if (selectedNode?.type === 'action') {
      const finalName = currentActionConfig.name?.trim();
      if (!finalName) { toast.error('Action Name (ID) is required.'); return; }

      const finalTitle = currentActionConfig.title?.trim() || finalName;
      const finalValueType = currentValueInputType;

      let finalConfig: Partial<ActionNodeData>;

      if (finalValueType === 'text') {
          const finalVariations = currentVariations.map(v => v.trim()).filter(v => v); // Filter empty variations
          if (finalVariations.length === 0) {
              toast.error('At least one text variation is required.');
              return;
          }
          finalConfig = {
              name: finalName,
              title: finalTitle,
              valueType: 'text',
              variations: finalVariations,
              value: finalVariations[0], // Keep first variation in value field
          };
      } else { // Function type
          const finalFunctionValue = currentActionConfig.value?.trim();
           if (!finalFunctionValue) {
               toast.error('Function name cannot be empty.');
               return;
           }
          finalConfig = {
              name: finalName,
              title: finalTitle,
              valueType: 'function',
              value: finalFunctionValue,
              variations: undefined, // Ensure variations is undefined
          };
      }

      console.log("Saving action config:", finalConfig);
      onUpdateAction(selectedNode.id, finalConfig);
      handleSetMode('view');
    }
  }, [selectedNode, onUpdateAction, currentActionConfig, currentValueInputType, currentVariations, handleSetMode]);


  // --- Change Definition Handlers (View Mode - Unchanged) ---
  const handleChangeIntentClick = useCallback((newIntentId: string) => {
      if (selectedNode?.type === 'intent') {
        onUpdateIntent(selectedNode.id, newIntentId);
        setIsChangingDefinition(false); setSearchTerm('');
      }
    }, [selectedNode, onUpdateIntent]);
  const handleChangeActionClick = useCallback((newActionName: string) => {
      if (selectedNode?.type === 'action') {
        // When changing definition, we update the node data using the new definition's data
        const newDef = definedActions.find(a => a.name === newActionName);
        if (newDef) {
             onUpdateAction(selectedNode.id, { ...newDef }); // Pass full new definition data
        } else {
             toast.error(`Cannot find definition for action: ${newActionName}`);
        }
        setIsChangingDefinition(false); setSearchTerm('');
      }
    }, [selectedNode, onUpdateAction, definedActions]); // Add definedActions dependency

  // --- Dialog Handlers ---
   // --- Intent Dialog (Unchanged) ---
    const handleAddIntentExampleInput = useCallback(() => setNewIntentExamples((prev) => [...prev, '']), []);
    const handleNewIntentExampleChange = useCallback((index: number, value: string) => { setNewIntentExamples((prev) => { const copy = [...prev]; copy[index] = value; return copy; }); }, []);
    const handleRemoveNewIntentExample = useCallback((index: number) => { setNewIntentExamples((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : ['']); }, []);
    const handleIntentDialogSubmit = useCallback(() => {
        const label = newIntentLabel.trim();
        const id = newIntentId.trim().replace(/\s+/g, '_').toLowerCase();
        const finalExamples = newIntentExamples.map((e) => e.trim()).filter((e) => e);
        if (!label || !id) { toast.error('Intent Label and ID are required.'); return; }
        if (intents.some((i) => i.id === id)) { toast.error(`Intent ID "${id}" already exists.`); return; }
        const parsedEntities = parseEntitiesFromExamples(finalExamples);
        onAddNewIntentDefinition({ id, label, examples: finalExamples, entities: parsedEntities });
        setNewIntentLabel(''); setNewIntentId(''); setNewIntentExamples(['']); setShowIntentDialog(false);
    }, [newIntentLabel, newIntentId, newIntentExamples, intents, onAddNewIntentDefinition]);

   // --- Action Dialog (UPDATED for Variations) ---
    const handleNewActionValueTypeToggle = useCallback((type: ValueInputType) => {
        setNewActionValueType(type);
        // Reset relevant state when type changes
        if (type === 'text') {
            setNewActionFunctionValue(''); // Clear function value
            if (newActionVariations.length === 0) setNewActionVariations(['']); // Ensure at least one empty variation input
        } else {
            // Don't necessarily clear variations state immediately, user might toggle back
             setNewActionFunctionValue(mockAvailableFunctions[0]?.name || ''); // Set default function
        }
    }, [newActionVariations.length]); // Dependency ensures check on variations length

    // Variation handlers for the dialog
     const handleNewActionVariationChange = useCallback((index: number, value: string) => {
       setNewActionVariations(prev => {
           const copy = [...prev];
           copy[index] = value;
           return copy;
       });
   }, []);
    const handleAddNewActionVariationInput = useCallback(() => {
       setNewActionVariations(prev => [...prev, '']);
   }, []);
    const handleRemoveNewActionVariationInput = useCallback((index: number) => {
       setNewActionVariations(prev => {
           if (prev.length <= 1) return [''];
           return prev.filter((_, i) => i !== index);
       });
   }, []);

    // Dialog submit updated for variations
    const handleActionDialogSubmit = useCallback(() => {
        const title = newActionTitle.trim();
        const name = newActionName.trim().replace(/\s+/g, '_').toLowerCase();
        if (!name) { toast.error('Action Name (ID) is required.'); return; }
        if (definedActions.some((a) => a.name === name)) { toast.error(`Action Name "${name}" exists.`); return; }

        let actionToAdd: ActionDefinition;

        if (newActionValueType === 'text') {
            const finalVariations = newActionVariations.map(v => v.trim()).filter(v => v);
            if (finalVariations.length === 0) {
                toast.error('At least one text variation is required.');
                return;
            }
            actionToAdd = {
                title: title || name,
                name,
                valueType: 'text',
                variations: finalVariations,
                 value: finalVariations[0], // Set first variation as value
            };
        } else { // Function type
             const functionValue = newActionFunctionValue.trim();
            if (!functionValue) {
                 toast.error('Function name cannot be empty.');
                 return;
             }
            actionToAdd = {
                title: title || name,
                name,
                valueType: 'function',
                value: functionValue,
                 // variations: undefined, // Ensure variations is not set
            };
        }

        onAddNewActionDefinition(actionToAdd);

        // Reset dialog state
        setNewActionTitle(''); setNewActionName(''); setNewActionValueType('text');
        setNewActionVariations(['']); setNewActionFunctionValue(''); // Reset all value states
        setShowActionDialog(false);
    }, [
        newActionTitle, newActionName, newActionValueType, newActionVariations, newActionFunctionValue, // Include new states
        definedActions, onAddNewActionDefinition,
    ]);


  // --- Filtering Logic (unchanged) ---
  const filteredIntents = useMemo(() => intents.filter(intent =>
          intent.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          intent.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (intent.entities && intent.entities.some(e => e.toLowerCase().includes(searchTerm.toLowerCase())))
      ), [intents, searchTerm]);
  const filteredActions = useMemo(() => definedActions.filter(action =>
          action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          action.name.toLowerCase().includes(searchTerm.toLowerCase())
      ), [definedActions, searchTerm]);

  // --- Render Logic ---
  let NodeIcon: React.ElementType | null = null;
  let nodeTypeName = 'Node';
  let headerColor = 'text-gray-800';
  let iconColor = 'text-gray-600';

  if (!selectedNode) {
     return ( // No Selection Fallback
      <div className="relative w-80 bg-white border-l border-gray-200 shadow-lg flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center min-h-[60px] flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-500 flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-500" /> No Selection
          </h3> <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div> <div className="flex-grow p-4 text-center text-gray-500 text-sm">Please select a node.</div>
      </div> );
  }

  // Determine Icon, Type Name, Colors
   switch (selectedNode.type) {
     case 'start': NodeIcon = PlayCircle; nodeTypeName = 'Start Node'; headerColor = 'text-indigo-800'; iconColor = 'text-indigo-600'; break;
     case 'intent': NodeIcon = Bot; nodeTypeName = 'Intent Node'; headerColor = 'text-blue-800'; iconColor = 'text-blue-600'; break;
     case 'action': NodeIcon = Zap; nodeTypeName = 'Action Node'; headerColor = 'text-green-800'; iconColor = 'text-green-600'; break;
     case 'end': NodeIcon = FlagOff; nodeTypeName = 'End Node'; headerColor = 'text-red-800'; iconColor = 'text-red-600'; break;
     default: NodeIcon = AlertTriangle; nodeTypeName = 'Unknown Node'; headerColor = 'text-gray-800'; iconColor = 'text-yellow-500';
   }
  const isConfigurable = selectedNode.type === 'start' || selectedNode.type === 'intent' || selectedNode.type === 'action';
  const nodeData = selectedNode.data || {};
  const currentIntentDefinition = nodeData.intentId ? intents.find(i => i.id === nodeData.intentId) : null;

  return (
    <div className="relative w-80 bg-white border-l border-gray-200 shadow-lg flex flex-col h-full transition-all duration-300 ease-in-out z-10">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center min-h-[60px] flex-shrink-0">
        <h3 className={`text-lg font-semibold ${headerColor} flex items-center gap-2`}> {NodeIcon && <NodeIcon size={18} className={iconColor} />} {nodeTypeName} </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"> <X size={20} /> </button>
      </div>

      {/* Content Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
        {!isConfigurable ? ( <div className="text-center text-gray-400 text-sm pt-4"> This node type ({selectedNode.type || 'Unknown'}) has no configurable options. </div>
        ) : (
          <>
            {/* VIEW MODE - NORMAL DISPLAY */}
            {mode === 'view' && !isChangingDefinition && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Current Configuration</h4>
                {/* --- Start Node View --- */}
                {selectedNode.type === 'start' && ( <>
                    <p className="text-sm"><span className="text-gray-500">Story Name:</span> <span className="font-medium text-indigo-700 break-words">{nodeData.storyName || '(Not Set)'}</span></p>
                    <p className="text-sm"><span className="text-gray-500">Story ID:</span> <code className="text-xs bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded break-all">{nodeData.storyId || '(Not Set)'}</code></p>
                </> )}
                {/* --- Intent Node View --- */}
                {selectedNode.type === 'intent' && ( <>
                    <p className="text-sm"><span className="text-gray-500">Intent Label:</span> <span className="font-medium text-blue-700 break-words">{currentIntentDefinition?.label || nodeData.intentId || '(Not Set)'}</span></p>
                    <p className="text-sm"><span className="text-gray-500">Intent ID:</span> <code className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded break-all">{nodeData.intentId || 'N/A'}</code></p>
                    <div className="text-sm"> <span className="text-gray-500">Entities:</span>
                        {nodeData.entities && nodeData.entities.length > 0 ? ( <div className="flex flex-wrap gap-1 mt-1"> {nodeData.entities.map((entity: string, i: number) => ( <span key={i} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-300"><Tag size={12} /> {entity}</span> ))} </div>
                        ) : ( <span className="text-gray-400 text-xs ml-1"> (None detected)</span> )}
                    </div>
                    <div className="text-sm"> <span className="text-gray-500">Examples:</span>
                        {Array.isArray(nodeData.examples) && nodeData.examples.length > 0 ? ( <div className="mt-1 max-h-28 overflow-y-auto bg-gray-50 p-2 rounded border border-gray-200 scrollbar-thin"> <ul className="space-y-1"> {nodeData.examples.map((ex: string, i: number) => ( <li key={i} className="text-gray-600 text-xs" title={ex}> <span dangerouslySetInnerHTML={{ __html: ex.replace(/\[(.*?)\]\((.*?)\)/g, '[<strong class="text-blue-600 font-normal">$1</strong>]<span class="text-gray-500 font-normal">($2)</span>') }} /> </li> ))} </ul> </div>
                        ) : ( <span className="text-gray-400 text-xs ml-1"> (None)</span> )}
                    </div>
                </> )}
                {/* --- Action Node View (Updated for Variations) --- */}
                 {selectedNode.type === 'action' && ( <>
                    <p className="text-sm"> <span className="text-gray-500">Title:</span> <span className="font-medium text-gray-800 break-words">{nodeData.title || nodeData.name || '(Not Set)'}</span> </p>
                    <p className="text-sm"> <span className="text-gray-500">Name (ID):</span> <code className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded break-all">{nodeData.name || '(Not Set)'}</code> </p>
                    {nodeData.valueType === 'function' ? (
                        // Function View
                         <div className="text-sm flex items-start gap-1">
                            <span className="text-gray-500 flex-shrink-0 mt-0.5">Function:</span>
                            <GitBranch size={14} className="text-gray-500 mt-1 flex-shrink-0" title="Function Call" />
                            <div className="text-xs bg-green-50 border border-green-200 text-green-800 px-2 py-1 rounded break-words max-w-full flex-grow font-mono">
                                {nodeData.value || <span className="text-gray-400 italic">(Not Set)</span>}
                            </div>
                         </div>
                    ) : (
                        // Text/Variations View
                        <div className="text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Text Variations:</span>
                                <span className='text-xs text-gray-400'>({nodeData.variations?.length || 0} total)</span>
                            </div>
                             {Array.isArray(nodeData.variations) && nodeData.variations.length > 0 ? (
                                <div className="mt-1 max-h-32 overflow-y-auto bg-gray-50 p-2 rounded border border-gray-200 scrollbar-thin">
                                    <ul className="space-y-1">
                                    {nodeData.variations.map((v: string, i: number) => (
                                        <li key={i} className="text-green-800 text-xs font-mono bg-green-50 p-1 rounded border border-green-100 whitespace-pre-wrap" title={v}>
                                         {v}
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                            ) : (
                                <span className="text-gray-400 text-xs ml-1"> (None defined)</span>
                            )}
                        </div>
                    )}
                 </> )}
                 {/* --- Action Buttons --- */}
                 <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                  <button onClick={() => handleSetMode('edit')} className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded focus:outline-none focus:ring-2 text-sm font-medium transition-colors duration-150 border ${selectedNode.type === 'start' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-500' : selectedNode.type === 'intent' ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 focus:ring-blue-500' : 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100 focus:ring-green-500'}`}> <Edit size={16} /> Edit Details </button>
                  {(selectedNode.type === 'intent' || selectedNode.type === 'action') && ( <button onClick={() => { setIsChangingDefinition(true); setSearchTerm(''); }} className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium"> <Replace size={16} /> Change {selectedNode.type === 'intent' ? 'Intent' : 'Action'} Definition </button> )}
                 </div>
                 {/* --- Footer Buttons (Define New) --- */}
                <div className="mt-auto pt-3 border-t border-gray-200">
                  {selectedNode.type === 'intent' && ( <button onClick={() => setShowIntentDialog(true)} className="w-full flex items-center justify-center gap-1.5 bg-blue-50 border border-blue-300 text-blue-700 px-3 py-2 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"> <PlusCircle size={16} /> Define New Intent </button> )}
                  {selectedNode.type === 'action' && ( <button onClick={() => setShowActionDialog(true)} className="w-full flex items-center justify-center gap-1.5 bg-green-50 border border-green-300 text-green-700 px-3 py-2 rounded hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"> <PlusCircle size={16} /> Define New Action </button> )}
                </div>
              </div>
            )}

            {/* VIEW MODE - CHANGE DEFINITION (Unchanged Structure) */}
            {mode === 'view' && isChangingDefinition && ( <div className="space-y-3">
                 <div className="flex justify-between items-center mb-2"> <h4 className="text-md font-semibold text-gray-700">Select New {selectedNode.type === 'intent' ? 'Intent' : 'Action'}</h4> <button onClick={() => { setIsChangingDefinition(false); setSearchTerm(''); }} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1" title="Cancel Change"> <ChevronLeft size={16} /> Cancel </button> </div>
                 <div className="relative"> <input type="text" placeholder={`Search ${selectedNode.type === 'intent' ? 'intents...' : 'actions...'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 pl-8 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" /> <Search size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" /> </div>
                 <div className="space-y-1 max-h-80 overflow-y-auto border rounded-md p-1 bg-gray-50 scrollbar-thin">
                  {selectedNode.type === 'intent' && (filteredIntents.length > 0 ? ( filteredIntents.map((intent) => ( <button key={intent.id} onClick={() => handleChangeIntentClick(intent.id)} disabled={nodeData.intentId === intent.id} className={`w-full text-left px-3 py-1.5 rounded text-sm flex justify-between items-center transition-colors duration-100 ${nodeData.intentId === intent.id ? 'bg-blue-100 text-blue-800 font-medium cursor-not-allowed opacity-70' : 'hover:bg-blue-50 text-gray-700 hover:text-blue-800'}`} title={`ID: ${intent.id}\nEntities: ${intent.entities?.join(', ') || 'None'}`}> <span className='truncate pr-2'>{intent.label}</span> <code className="text-xs text-gray-500 flex-shrink-0">{intent.id}</code> </button> )) ) : ( <p className="text-center text-xs text-gray-400 py-4">No matching intents.</p> ))}
                  {selectedNode.type === 'action' && (filteredActions.length > 0 ? ( filteredActions.map((action) => ( <button key={action.name} onClick={() => handleChangeActionClick(action.name)} disabled={nodeData.name === action.name} className={`w-full text-left px-3 py-1.5 rounded text-sm flex justify-between items-center transition-colors duration-100 ${nodeData.name === action.name ? 'bg-green-100 text-green-800 font-medium cursor-not-allowed opacity-70' : 'hover:bg-green-50 text-gray-700 hover:text-green-800'}`} title={`Name: ${action.name}\nType: ${action.valueType}`}> <span className="truncate pr-2">{action.title || action.name}</span> {action.valueType === 'function' && ( <GitBranch size={14} className="text-gray-500 ml-2 flex-shrink-0" title="Function" /> )} </button> )) ) : ( <p className="text-center text-xs text-gray-400 py-4">No matching actions.</p> ))}
                 </div>
            </div> )}

            {/* EDIT MODE */}
            {mode === 'edit' && ( <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-700 mb-1 flex items-center gap-2"> <Edit size={16} /> Edit Details </h4>
                {/* --- Edit Start Node --- */}
                {selectedNode.type === 'start' && ( <div className="space-y-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                    <div> <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="storyNameEdit">Story Name</label> <input id="storyNameEdit" type="text" value={currentStoryName} onChange={(e) => handleStoryNameChange(e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm" placeholder="Enter story name"/> </div>
                    <div> <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="storyIdEdit">Story ID <span className="text-red-500">*</span></label> <input id="storyIdEdit" type="text" value={currentStoryId} onChange={(e) => handleStoryIdChange(e.target.value)} required className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm font-mono" placeholder="e.g., main_story_path"/> <p className="text-xs text-gray-500 mt-1">Unique ID (lowercase_underscores).</p> </div>
                    <div className="flex gap-2 pt-3 border-t border-indigo-100"> <button onClick={handleStartNodeEditSave} className="flex-1 btn btn-primary btn-sm"> <Check size={16} /> Save </button> <button onClick={() => handleSetMode('view')} className="flex-1 btn btn-secondary btn-sm"> Cancel </button> </div>
                </div> )}
                {/* --- Edit Intent Node --- */}
                {selectedNode.type === 'intent' && ( <div className="space-y-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div> <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="intentIdEdit">Intent Definition <span className="text-red-500">*</span></label> <select id="intentIdEdit" value={currentIntentId} onChange={(e) => handleIntentIdEditChange(e.target.value)} required className="block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"> <option value="" disabled>-- Select Intent --</option> {intents.map((intent) => ( <option key={intent.id} value={intent.id}> {intent.label} ({intent.id}) </option> ))} {!intents.some(i => i.id === currentIntentId) && currentIntentId && ( <option value={currentIntentId} disabled> {currentIntentId} (Current/Invalid) </option> )} </select> <p className="text-xs text-gray-500 mt-1"> Label: {intents.find(i => i.id === currentIntentId)?.label || <span className="italic text-red-600">Not Found</span>} </p> </div>
                    <div> <label className="block text-sm font-medium text-gray-700 mb-1"> Examples <span className="text-gray-400 text-xs">(updates definition)</span> </label> <p className="text-xs text-gray-500 mb-2"> Use <code className="text-xs">[value](entity)</code> format. </p> <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin"> {currentExamples.map((example, index) => ( <div key={index} className="flex items-center gap-2"> <input type="text" value={example} onChange={(e) => handleExampleChange(index, e.target.value)} className="flex-grow border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm" placeholder={`Example ${index + 1}`}/> <button onClick={() => handleRemoveExampleInput(index)} type="button" disabled={currentExamples.length <= 1 && example === ''} className={`p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 flex-shrink-0 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed ${currentExamples.length <= 1 ? 'invisible' : ''}`} title="Remove"> <X size={16} /> </button> </div> ))} </div> <button onClick={handleAddExampleInput} type="button" className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"> <PlusCircle size={16} /> Add Example </button> </div>
                    <div className="flex gap-2 pt-3 border-t border-blue-100"> <button onClick={handleIntentEditSave} className="flex-1 btn btn-primary btn-sm" disabled={!currentIntentId || !intents.some(i => i.id === currentIntentId)}> <Check size={16} /> Save </button> <button onClick={() => handleSetMode('view')} className="flex-1 btn btn-secondary btn-sm"> Cancel </button> </div>
                </div> )}
                {/* --- Edit Action Node (Updated for Variations) --- */}
                {selectedNode.type === 'action' && ( <div className="space-y-4 p-3 bg-green-50 border border-green-200 rounded-md">
                     <div> <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="actionConfigTitle">Display Title <span className="text-gray-400 text-xs">(optional)</span></label> <input id="actionConfigTitle" type="text" value={currentActionConfig.title || ''} onChange={(e) => handleActionConfigChange('title', e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm" placeholder="Node title"/> </div>
                     <div> <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="actionConfigName">Action Name (ID) <span className="text-red-500">*</span></label> <input id="actionConfigName" type="text" value={currentActionConfig.name || ''} onChange={(e) => handleActionConfigChange('name', e.target.value)} required className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm font-mono" placeholder="e.g., action_ask_name"/> <p className="text-xs text-gray-500 mt-1">Unique ID (lowercase_underscores).</p> </div>
                     <div> <label className="block text-sm font-medium text-gray-700 mb-1">Value Type</label> <div className="flex gap-2"> <button onClick={() => handleValueTypeToggle('text')} className={`btn-sm btn-toggle ${currentValueInputType === 'text' ? 'active' : ''}`}> <Type size={14} /> Text/Variations </button> <button onClick={() => handleValueTypeToggle('function')} className={`btn-sm btn-toggle ${currentValueInputType === 'function' ? 'active' : ''}`}> <GitBranch size={14} /> Function </button> </div> </div>
                     {/* Variations Input Area */}
                    {currentValueInputType === 'text' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1"> Response Variations <span className="text-red-500">*</span></label>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin border border-gray-200 bg-white p-2 rounded">
                                {currentVariations.map((variation, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <textarea
                                            value={variation}
                                            onChange={(e) => handleVariationChange(index, e.target.value)}
                                            className="flex-grow border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm font-mono text-xs"
                                            placeholder={`Variation ${index + 1}`}
                                            rows={2} // Small text area for each variation
                                        />
                                        <button
                                            onClick={() => handleRemoveVariationInput(index)}
                                            type="button"
                                            disabled={currentVariations.length <= 1} // Disable removing the last one
                                            className={`p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 flex-shrink-0 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed`}
                                            title="Remove variation"
                                        > <Trash2 size={16} /> </button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleAddVariationInput} type="button" className="mt-2 text-green-600 hover:text-green-800 text-sm flex items-center gap-1"> <PlusCircle size={16} /> Add Variation </button>
                        </div>
                     )}
                     {/* Function Select Area */}
                    {currentValueInputType === 'function' && (
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="actionConfigValueFunction"> Select Function <span className="text-red-500">*</span> </label>
                             <select id="actionConfigValueFunction" value={currentActionConfig.value || ''} onChange={(e) => handleActionConfigChange('functionValue', e.target.value)} required className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm">
                                <option value="" disabled>-- Select function --</option>
                                {mockAvailableFunctions.map((func) => ( <option key={func.name} value={func.name} title={func.description}>{func.name}</option> ))}
                                {currentActionConfig.value && !mockAvailableFunctions.some(f => f.name === currentActionConfig.value) && ( <option value={currentActionConfig.value} disabled> {currentActionConfig.value} (Current/Invalid) </option> )}
                             </select>
                            <p className="text-xs text-gray-500 mt-1 h-4 truncate" title={mockAvailableFunctions.find(f => f.name === currentActionConfig.value)?.description}> {mockAvailableFunctions.find(f => f.name === currentActionConfig.value)?.description} </p>
                        </div>
                    )}
                    <div className="flex gap-2 pt-3 border-t border-green-100"> <button onClick={handleActionEditSave} className="flex-1 btn btn-primary btn-sm" disabled={!currentActionConfig.name}> <Check size={16} /> Save </button> <button onClick={() => handleSetMode('view')} className="flex-1 btn btn-secondary btn-sm"> Cancel </button> </div>
                </div> )}
            </div> )}
          </>
        )}
      </div>

        {/* --- DIALOGS --- */}
        {/* Define New Intent Dialog (Unchanged Structure) */}
        {showIntentDialog && ( <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4"> <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 mb-4 flex-shrink-0"> <h4 className="text-lg font-semibold text-blue-800 flex items-center gap-2"><PlusCircle size={18} /> Define New Intent</h4> <button onClick={() => setShowIntentDialog(false)} className="text-gray-400 hover:text-gray-600"> <X size={20} /> </button> </div>
            <div className="space-y-4 overflow-y-auto pr-2 flex-grow scrollbar-thin">
                <div> <label htmlFor="newIntentLabel" className="block text-sm font-medium text-gray-700 mb-1"> Label <span className="text-red-500">*</span> </label> <input type="text" id="newIntentLabel" value={newIntentLabel} onChange={(e) => setNewIntentLabel(e.target.value)} required className="w-full input input-bordered input-sm" placeholder="e.g., Check Balance"/> </div>
                <div> <label htmlFor="newIntentId" className="block text-sm font-medium text-gray-700 mb-1"> ID <span className="text-red-500">*</span> </label> <input type="text" id="newIntentId" value={newIntentId} onChange={(e) => setNewIntentId(e.target.value)} required className="w-full input input-bordered input-sm font-mono" placeholder="e.g., intent_check_balance"/> <p className="text-xs text-gray-500 mt-1"> Use lowercase_underscores. </p> </div>
                <div> <label className="block text-sm font-medium text-gray-700 mb-1"> Examples </label> <p className="text-xs text-gray-500 mb-2"> Use <code className="text-xs">[value](entity)</code> format. </p> <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin"> {newIntentExamples.map((example, index) => ( <div key={index} className="flex items-center gap-2"> <input type="text" value={example} onChange={(e) => handleNewIntentExampleChange(index, e.target.value)} className="flex-grow input input-bordered input-sm" placeholder={`Example ${index + 1}`}/> <button onClick={() => handleRemoveNewIntentExample(index)} type="button" disabled={newIntentExamples.length <= 1 && example === ''} className={`btn btn-ghost btn-xs p-1 text-red-500 ${newIntentExamples.length <= 1 ? 'invisible' : ''}`} title="Remove"> <X size={16} /> </button> </div> ))} </div> <button onClick={handleAddIntentExampleInput} type="button" className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"> <PlusCircle size={16} /> Add Example </button> </div>
            </div>
            <div className="flex justify-end gap-3 border-t pt-4 mt-4 flex-shrink-0"> <button onClick={() => setShowIntentDialog(false)} className="btn btn-secondary btn-sm"> Cancel </button> <button onClick={handleIntentDialogSubmit} className="btn btn-primary btn-sm"> <Check size={16} /> Create Intent </button> </div>
        </div> </div> )}

      {/* Define New Action Dialog (UPDATED for Variations) */}
       {showActionDialog && ( <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4"> <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 mb-4 flex-shrink-0"> <h4 className="text-lg font-semibold text-green-800 flex items-center gap-2"> <PlusCircle size={18} /> Define New Action </h4> <button onClick={() => setShowActionDialog(false)} className="text-gray-400 hover:text-gray-600"> <X size={20} /> </button> </div>
             {/* Dialog Body */}
            <div className="space-y-4 overflow-y-auto pr-2 flex-grow scrollbar-thin">
                <div> <label htmlFor="newActionTitle" className="block text-sm font-medium text-gray-700 mb-1"> Title <span className="text-gray-400 text-xs">(optional)</span> </label> <input type="text" id="newActionTitle" value={newActionTitle} onChange={(e) => setNewActionTitle(e.target.value)} className="w-full input input-bordered input-sm" placeholder="Display title"/> </div>
                <div> <label htmlFor="newActionName" className="block text-sm font-medium text-gray-700 mb-1"> Name (ID) <span className="text-red-500">*</span> </label> <input type="text" id="newActionName" value={newActionName} onChange={(e) => setNewActionName(e.target.value)} required className="w-full input input-bordered input-sm font-mono" placeholder="e.g., action_lookup or utter_greet"/> <p className="text-xs text-gray-500 mt-1"> Use lowercase_underscores. </p> </div>
                <div> <label className="block text-sm font-medium text-gray-700 mb-1">Value Type</label> <div className="flex gap-2"> <button onClick={() => handleNewActionValueTypeToggle('text')} className={`btn-sm btn-toggle ${newActionValueType === 'text' ? 'active' : ''}`}> <Type size={14} /> Text/Variations </button> <button onClick={() => handleNewActionValueTypeToggle('function')} className={`btn-sm btn-toggle ${newActionValueType === 'function' ? 'active' : ''}`}> <GitBranch size={14} /> Function </button> </div> </div>
                 {/* Variations Input for Dialog */}
                {newActionValueType === 'text' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1"> Response Variations <span className="text-red-500">*</span></label>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin border border-gray-200 bg-white p-2 rounded">
                            {newActionVariations.map((variation, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <textarea value={variation} onChange={(e) => handleNewActionVariationChange(index, e.target.value)} className="flex-grow textarea textarea-bordered textarea-xs" placeholder={`Variation ${index + 1}`} rows={2}/>
                                    <button onClick={() => handleRemoveNewActionVariationInput(index)} type="button" disabled={newActionVariations.length <= 1} className={`btn btn-ghost btn-xs p-1 text-red-500 disabled:text-gray-400 ${newActionVariations.length <= 1 ? '' : 'hover:bg-red-100'}`} title="Remove"> <Trash2 size={16} /> </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleAddNewActionVariationInput} type="button" className="mt-2 text-green-600 hover:text-green-800 text-sm flex items-center gap-1"> <PlusCircle size={16} /> Add Variation </button>
                    </div>
                 ) : ( // Function Select for Dialog
                     <div>
                        <label htmlFor="newActionValueFunc" className="block text-sm font-medium text-gray-700 mb-1"> Select Function <span className="text-red-500">*</span> </label>
                        <select id="newActionValueFunc" value={newActionFunctionValue} onChange={(e) => setNewActionFunctionValue(e.target.value)} required className="w-full select select-bordered select-sm">
                            <option value="" disabled>-- Select function --</option>
                            {mockAvailableFunctions.map((func) => ( <option key={func.name} value={func.name} title={func.description}>{func.name}</option> ))}
                         </select>
                        <p className="text-xs text-gray-500 mt-1 h-4 truncate" title={mockAvailableFunctions.find(f => f.name === newActionFunctionValue)?.description}> {mockAvailableFunctions.find(f => f.name === newActionFunctionValue)?.description} </p>
                     </div>
                 )}
            </div>
            {/* Dialog Footer */}
            <div className="flex justify-end gap-3 border-t pt-4 mt-4 flex-shrink-0"> <button onClick={() => setShowActionDialog(false)} className="btn btn-secondary btn-sm"> Cancel </button> <button onClick={handleActionDialogSubmit} className="btn btn-primary btn-sm"> <Check size={16} /> Create Action </button> </div>
        </div> </div> )}

      {/* Global Styles & CSS Variables */}
      <style jsx global>{`
        .scrollbar-thin { scrollbar-width: thin; scrollbar-color: #cbd5e0 #edf2f7; }
        .scrollbar-thin::-webkit-scrollbar { width: 8px; height: 8px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: #edf2f7; border-radius: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #cbd5e0; border-radius: 4px; border: 2px solid #edf2f7; }
        .hover\\:scrollbar-thumb-gray-400:hover::-webkit-scrollbar-thumb { background-color: #a0aec0; }
        .btn-sm { padding: 0.25rem 0.75rem; font-size: 0.875rem; border-radius: 0.25rem; transition: background-color 0.2s, border-color 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 0.25rem; font-weight: 500; }
        .btn-secondary { background-color: #e5e7eb; color: #374151; border: 1px solid #d1d5db; }
        .btn-secondary:hover { background-color: #d1d5db; }
        .btn-primary { background-color: #4f46e5; color: white; border: 1px solid transparent; }
        .btn-primary:hover { background-color: #4338ca; }
        .btn-primary:disabled { background-color: #a5b4fc; cursor: not-allowed; }
        .btn-toggle { background-color: white; border: 1px solid #d1d5db; color: #4b5563; }
        .btn-toggle:hover { background-color: #f9fafb; }
        .btn-toggle.active { background-color: #e0f2fe; border-color: #7dd3fc; color: #0369a1; font-weight: 500; }
        .btn-ghost { background-color: transparent; border: none; }
        .btn { /* Base button styles if not using a UI library */ }
        .input, .textarea, .select { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; font-size: 0.875rem; line-height: 1.25rem; box-shadow: inset 0 1px 2px 0 rgb(0 0 0 / 0.05); }
        .input:focus, .textarea:focus, .select:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #60a5fa; box-shadow: 0 0 0 2px #bfdbfe; }
        .input-sm, .textarea-sm, .select-sm { padding-top: 0.25rem; padding-bottom: 0.25rem; font-size: 0.875rem; line-height: 1.25rem; } /* Adjust padding/font for sm */
        .textarea-xs { font-size: 0.75rem; line-height: 1rem; padding: 0.25rem 0.5rem; }
        .input-bordered, .textarea-bordered, .select-bordered { /* Add specific border styles if needed */ }
         /* Add any other specific styles for DaisyUI/Tailwind Forms if used */
      `}</style>
    </div>
  );
};

export default Sidebar;