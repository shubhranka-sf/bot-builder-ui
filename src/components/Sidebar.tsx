import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Node } from 'reactflow';
import { Bot, Zap, X, PlusCircle, Type, Code, Edit, GitBranch, Replace, Check, PlayCircle, FlagOff, AlertTriangle, Search, ChevronLeft } from 'lucide-react';
import { ActionDefinition, AvailableFunction, IntentDefinition, StartNodeData, IntentNodeData, ActionNodeData } from '../types';
import { mockAvailableFunctions } from '../../data/mockData'; // mockIntents are now passed as props

interface SidebarProps {
  selectedNode: Node<StartNodeData | IntentNodeData | ActionNodeData | any> | null;
  intents: IntentDefinition[];
  definedActions: ActionDefinition[];
  onUpdateStartNode: (nodeId: string, newStoryName: string) => void;
  onUpdateIntent: (nodeId: string, newIntentId: string, examples?: string[]) => void;
  onUpdateAction: (nodeId: string, actionData: Partial<ActionNodeData>) => void;
  onAddNewIntentDefinition: (newIntent: IntentDefinition) => void;
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
  onClose
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

  // State for Dialogs
  const [showIntentDialog, setShowIntentDialog] = useState(false);
  const [newIntentLabel, setNewIntentLabel] = useState('');
  const [newIntentId, setNewIntentId] = useState('');
  const [newIntentExamples, setNewIntentExamples] = useState<string[]>(['']);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionName, setNewActionName] = useState('');
  const [newActionValue, setNewActionValue] = useState('');
  const [newActionValueType, setNewActionValueType] = useState<ValueInputType>('text');


  // --- Effects ---
  useEffect(() => {
    // Reset internal state only when the selected node *identity* changes.
    if (selectedNode) {
        console.log('Sidebar useEffect [selectedNode changed]: Resetting mode/state. New Node ID:', selectedNode?.id);
        setMode('view');
        setIsChangingDefinition(false);
        setSearchTerm('');

        // Initialize edit state based on the new node's data
        const nodeData = selectedNode.data || {};
         if (selectedNode.type === 'start') {
             setCurrentStoryName(nodeData.storyName || '');
             setCurrentStoryId(nodeData.storyId || '');
         } else if (selectedNode.type === 'intent') {
             setCurrentIntentId(nodeData.intentId || '');
             setCurrentExamples(Array.isArray(nodeData.examples) ? [...nodeData.examples] : []);
         } else if (selectedNode.type === 'action') {
             setCurrentActionConfig({ title: nodeData.title || nodeData.name || '', name: nodeData.name || '', value: nodeData.value || '', valueType: nodeData.valueType || 'text', });
             setCurrentValueInputType(nodeData.valueType || 'text');
         }
    } else {
         // Clear everything if no node is selected
        setCurrentStoryName(''); setCurrentIntentId(''); setCurrentExamples([]); setCurrentActionConfig({}); setCurrentValueInputType('text');
        setMode('view'); setIsChangingDefinition(false); setSearchTerm('');
    }

  }, [selectedNode]); // Dependency array only includes selectedNode

  // --- Event Handlers ---
   const handleSetMode = useCallback((newMode: SidebarMode) => {
    setMode(newMode);
    setIsChangingDefinition(false);
    setSearchTerm('');
     // Re-initialize edit state IF switching TO edit mode
     if (newMode === 'edit' && selectedNode) {
         console.log("Switching to Edit Mode, re-initializing edit state.");
         const nodeData = selectedNode.data || {};
         if (selectedNode.type === 'start') { setCurrentStoryName(nodeData.storyName || ''); }
         else if (selectedNode.type === 'intent') { setCurrentIntentId(nodeData.intentId || ''); setCurrentExamples(Array.isArray(nodeData.examples) ? [...nodeData.examples] : []); }
         else if (selectedNode.type === 'action') { setCurrentActionConfig({ title: nodeData.title || nodeData.name || '', name: nodeData.name || '', value: nodeData.value || '', valueType: nodeData.valueType || 'text', }); setCurrentValueInputType(nodeData.valueType || 'text'); }
     }
   }, [selectedNode]);

   // --- Start Node Handlers ---
   const handleStoryNameChange = useCallback((newName: string) => { setCurrentStoryName(newName); }, []);
   const handleStoryIdChange = useCallback((newId: string) => { setCurrentStoryId(newId); }, []);
   const handleStartNodeEditSave = useCallback(() => { if (selectedNode?.type === 'start') { onUpdateStartNode(selectedNode.id, currentStoryName.trim() || 'Default Start Story'); handleSetMode('view'); } }, [selectedNode, onUpdateStartNode, currentStoryName, handleSetMode]);

   // --- Intent Node Handlers (Edit Mode) ---
   const handleIntentIdEditChange = useCallback((newId: string) => { setCurrentIntentId(newId); const def = intents.find(i => i.id === newId); setCurrentExamples(def?.examples ? [...def.examples] : []); }, [intents]);
   const handleExampleChange = useCallback((index: number, value: string) => { setCurrentExamples(prev => { const copy = [...prev]; copy[index] = value; return copy; }); }, []);
   const handleAddExampleInput = useCallback(() => setCurrentExamples(prev => [...prev, '']), []);
   const handleRemoveExampleInput = useCallback((index: number) => { setCurrentExamples(prev => prev.filter((_, i) => i !== index)); }, []);
   const handleIntentEditSave = useCallback(() => { if (selectedNode?.type === 'intent') { const finalId = currentIntentId.trim(); if (!finalId) { alert("Intent ID empty."); return; } const finalEx = currentExamples.map(e => e.trim()).filter(e => e); onUpdateIntent(selectedNode.id, finalId, finalEx); handleSetMode('view'); } }, [selectedNode, onUpdateIntent, currentIntentId, currentExamples, handleSetMode]);

   // --- Action Node Handlers (Edit Mode) ---
   const handleActionConfigChange = useCallback((field: keyof ActionNodeData, value: string | ValueInputType) => { setCurrentActionConfig(prev => { const newState = { ...prev, [field]: value }; if (field === 'name' && (!newState.title || newState.title === prev.name)) { newState.title = value as string; } return newState; }); }, []);
   const handleValueTypeToggle = useCallback((type: ValueInputType) => { setCurrentValueInputType(type); const newVal = type === 'function' ? (mockAvailableFunctions[0]?.name || '') : ''; setCurrentActionConfig(prev => ({ ...prev, value: newVal, valueType: type })); }, []);
   const handleActionEditSave = useCallback(() => { if (selectedNode?.type === 'action') { const finalName = currentActionConfig.name?.trim(); if (!finalName) { alert("Action Name required."); return; } const finalConfig: ActionNodeData = { name: finalName, title: currentActionConfig.title?.trim() || finalName, value: currentActionConfig.value || '', valueType: currentValueInputType, }; onUpdateAction(selectedNode.id, finalConfig); handleSetMode('view'); } }, [selectedNode, onUpdateAction, currentActionConfig, currentValueInputType, handleSetMode]);

   // --- Change Definition Handlers (View Mode) ---
   const handleChangeIntentClick = useCallback((newIntentId: string) => { if (selectedNode?.type === 'intent') { onUpdateIntent(selectedNode.id, newIntentId); setIsChangingDefinition(false); setSearchTerm(''); } }, [selectedNode, onUpdateIntent]);
   const handleChangeActionClick = useCallback((newActionName: string) => { if (selectedNode?.type === 'action') { onUpdateAction(selectedNode.id, { name: newActionName }); setIsChangingDefinition(false); setSearchTerm(''); } }, [selectedNode, onUpdateAction]);

   // --- Dialog Handlers ---
   const handleAddIntentExampleInput = useCallback(() => setNewIntentExamples(prev => [...prev, '']), []);
   const handleNewIntentExampleChange = useCallback((index: number, value: string) => { setNewIntentExamples(prev => { const copy = [...prev]; copy[index] = value; return copy; }); }, []);
   const handleRemoveNewIntentExample = useCallback((index: number) => { setNewIntentExamples(prev => prev.filter((_, i) => i !== index)); }, []);
   const handleIntentDialogSubmit = useCallback(() => { const label = newIntentLabel.trim(); const id = newIntentId.trim().replace(/\s+/g, '_').toLowerCase(); const examples = newIntentExamples.map(e => e.trim()).filter(e => e); if (!label || !id) { alert("Label/ID required."); return; } if (intents.some(i => i.id === id)) { alert(`Intent ID "${id}" exists.`); return; } onAddNewIntentDefinition({ id, label, examples }); setNewIntentLabel(''); setNewIntentId(''); setNewIntentExamples(['']); setShowIntentDialog(false); }, [newIntentLabel, newIntentId, newIntentExamples, intents, onAddNewIntentDefinition]);
   const handleNewActionValueTypeToggle = useCallback((type: ValueInputType) => { setNewActionValueType(type); setNewActionValue(type === 'function' ? (mockAvailableFunctions[0]?.name || '') : ''); }, []);
   const handleActionDialogSubmit = useCallback(() => { const title = newActionTitle.trim(); const name = newActionName.trim().replace(/\s+/g, '_').toLowerCase(); if (!name) { alert("Name required."); return; } if (definedActions.some(a => a.name === name)) { alert(`Action Name "${name}" exists.`); return; } onAddNewActionDefinition({ title: title || name, name, value: newActionValue, valueType: newActionValueType }); setNewActionTitle(''); setNewActionName(''); setNewActionValue(''); setNewActionValueType('text'); setShowActionDialog(false); }, [newActionTitle, newActionName, newActionValue, newActionValueType, definedActions, onAddNewActionDefinition]);

   // --- Filtering Logic ---
   const filteredIntents = useMemo(() => intents.filter(intent => intent.label.toLowerCase().includes(searchTerm.toLowerCase()) || intent.id.toLowerCase().includes(searchTerm.toLowerCase()) ), [intents, searchTerm]);
   const filteredActions = useMemo(() => definedActions.filter(action => action.title.toLowerCase().includes(searchTerm.toLowerCase()) || action.name.toLowerCase().includes(searchTerm.toLowerCase()) ), [definedActions, searchTerm]);

  // --- Render Logic ---
  let NodeIcon: React.ElementType | null = null;
  let nodeTypeName = "Node";
  let headerColor = "text-gray-800";
  let iconColor = "text-gray-600";

  if (!selectedNode) { /* ... keep No Selection fallback ... */ return ( <div className="relative w-72 bg-white border-l border-gray-200 shadow-lg flex flex-col h-full"> <div className="p-4 border-b border-gray-200 flex justify-between items-center min-h-[60px] flex-shrink-0"> <h3 className="text-lg font-semibold text-gray-500 flex items-center gap-2"><AlertTriangle size={18} className="text-yellow-500"/> No Selection</h3> <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button> </div> <div className="flex-grow p-4 text-center text-gray-500 text-sm"> Please select a node on the canvas to see its details. </div> </div> ); }

  switch (selectedNode.type) { /* ... keep icon/color switch ... */ case 'start': NodeIcon = PlayCircle; nodeTypeName = "Start Node"; headerColor = "text-indigo-800"; iconColor = "text-indigo-600"; break; case 'intent': NodeIcon = Bot; nodeTypeName = "Intent Node"; headerColor = "text-blue-800"; iconColor = "text-blue-600"; break; case 'action': NodeIcon = Zap; nodeTypeName = "Action Node"; headerColor = "text-green-800"; iconColor = "text-green-600"; break; case 'end': NodeIcon = FlagOff; nodeTypeName = "End Node"; headerColor = "text-red-800"; iconColor = "text-red-600"; break; default: NodeIcon = AlertTriangle; nodeTypeName = "Unknown Node"; iconColor="text-yellow-500"; }
  const isConfigurableNode = selectedNode.type === 'start' || selectedNode.type === 'intent' || selectedNode.type === 'action';
  const nodeData = selectedNode.data || {};

  return (
    <div className="relative w-72 bg-white border-l border-gray-200 shadow-lg flex flex-col h-full transition-all duration-300 ease-in-out z-10">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center min-h-[60px] flex-shrink-0">
        <h3 className={`text-lg font-semibold ${headerColor} flex items-center gap-2`}> {NodeIcon && <NodeIcon size={18} className={iconColor}/>} {nodeTypeName} </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"> <X size={20} /> </button>
      </div>

      {/* Content Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
          {!isConfigurableNode ? ( <div className="text-center text-gray-400 text-sm pt-4"> This node type ({selectedNode.type || 'Unknown'}) has no configurable options. </div> )
           : (
            <>
              {/* VIEW MODE - NORMAL DISPLAY */}
              {mode === 'view' && !isChangingDefinition && (
                 <div className="space-y-3"> {/* REMOVED animate-fadeIn */}
                    {/* --- Current Configuration Display --- */}
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Current Configuration</h4>
                    {/* ... Keep Start/Intent/Action view details ... */}
                    {selectedNode.type === 'start' && ( <p className="text-sm"><span className="text-gray-500">Story Name:</span> <span className="font-medium text-indigo-700 break-words">{nodeData.storyName || '(Not Set)'}</span></p> )}
                    {selectedNode.type === 'intent' && ( <> <p className="text-sm"><span className="text-gray-500">Intent:</span> <span className="font-medium text-blue-700 break-words">{intents.find(i => i.id === nodeData.intentId)?.label || nodeData.intentId || '(Not Set)'}</span></p> <p className="text-sm"><span className="text-gray-500">ID:</span> <code className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded break-all">{nodeData.intentId || 'N/A'}</code></p> <div className="text-sm"> <span className="text-gray-500">Examples:</span> {Array.isArray(nodeData.examples) && nodeData.examples.length > 0 ? ( <ul className="list-disc list-inside pl-2 mt-1 space-y-0.5"> {nodeData.examples.slice(0, 3).map((ex: string, i: number) => <li key={i} className="text-gray-600 text-xs truncate" title={ex}>{ex}</li>)} {nodeData.examples.length > 3 && <li className="text-gray-400 text-xs italic">...and {nodeData.examples.length - 3} more</li>} </ul> ) : ( <span className="text-gray-400 text-xs ml-1"> (None)</span> )} </div> </> )}
                    {selectedNode.type === 'action' && ( <> <p className="text-sm"><span className="text-gray-500">Title:</span> <span className="font-medium text-gray-800 break-words">{nodeData.title || nodeData.name || '(Not Set)'}</span></p> <p className="text-sm"><span className="text-gray-500">Name:</span> <span className="font-medium text-green-700 break-words">{nodeData.name || '(Not Set)'}</span></p> <div className="text-sm flex items-start gap-2"> <span className="text-gray-500 flex-shrink-0">{nodeData.valueType === 'function' ? 'Function:' : 'Value:'}</span> {nodeData.valueType === 'function' && <GitBranch size={14} className="text-gray-500 mt-0.5 flex-shrink-0" title="Function Call"/>} <code className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded break-words max-w-full flex-grow"> {typeof nodeData.value === 'string' ? (nodeData.value || '(empty)') : JSON.stringify(nodeData.value)} </code> </div> </> )}

                   {/* --- Action Buttons (Edit, Change Intent/Action) --- */}
                   <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                      {/* Edit Button */}
                      <button onClick={() => handleSetMode('edit')} className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded focus:outline-none focus:ring-2 text-sm font-medium transition-colors duration-150 border ${ selectedNode.type === 'start' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-500' : selectedNode.type === 'intent' ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 focus:ring-blue-500' : 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100 focus:ring-green-500' }`} > <Edit size={16} /> Edit Details </button>
                      {/* Change Button */}
                      {(selectedNode.type === 'intent' || selectedNode.type === 'action') && ( <button onClick={() => setIsChangingDefinition(true)} className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium" > <Replace size={16} /> {selectedNode.type === 'intent' ? 'Change Intent' : 'Change Action'} </button> )}
                   </div>

                   {/* --- Footer Buttons (Define New) --- */}
                   <div className="mt-auto pt-3 border-t border-gray-200">
                       {selectedNode.type === 'intent' && ( <button onClick={() => setShowIntentDialog(true)} className="w-full flex items-center justify-center gap-1.5 bg-blue-50 border border-blue-300 text-blue-700 px-3 py-2 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-150"> <PlusCircle size={16} /> Define New Intent </button> )}
                       {selectedNode.type === 'action' && ( <button onClick={() => setShowActionDialog(true)} className="w-full flex items-center justify-center gap-1.5 bg-green-50 border border-green-300 text-green-700 px-3 py-2 rounded hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm transition-colors duration-150"> <PlusCircle size={16} /> Define New Action </button> )}
                   </div>
                 </div>
              )}

              {/* VIEW MODE - CHANGE DEFINITION */}
              {mode === 'view' && isChangingDefinition && (
                  <div className="space-y-3"> {/* REMOVED animate-fadeIn */}
                      {/* ... Keep Change Definition UI (Title, Cancel, Search, List) ... */}
                      <div className="flex justify-between items-center mb-2"> <h4 className="text-md font-semibold text-gray-700"> Select New {selectedNode.type === 'intent' ? 'Intent' : 'Action'} </h4> <button onClick={() => { setIsChangingDefinition(false); setSearchTerm(''); }} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1" title="Cancel Change" > <ChevronLeft size={16} /> Cancel </button> </div>
                      <div className="relative"> <input type="text" placeholder={`Search ${selectedNode.type === 'intent' ? 'intents' : 'actions'}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 pl-8 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" /> <Search size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" /> </div>
                      <div className="space-y-1 max-h-80 overflow-y-auto border rounded-md p-1 bg-gray-50 scrollbar-thin">
                          {selectedNode.type === 'intent' && ( filteredIntents.length > 0 ? filteredIntents.map(intent => ( <button key={intent.id} onClick={() => handleChangeIntentClick(intent.id)} disabled={nodeData.intentId === intent.id} className={`w-full text-left px-3 py-1.5 rounded text-sm flex justify-between items-center transition-colors duration-100 ${ nodeData.intentId === intent.id ? 'bg-blue-100 text-blue-800 font-medium cursor-not-allowed' : 'hover:bg-blue-100 text-gray-700 hover:text-blue-800' }`} title={intent.id} > <span>{intent.label}</span> <code className="text-xs text-gray-500">{intent.id}</code> </button> )) : <p className="text-center text-xs text-gray-400 py-4">No matching intents.</p> )}
                          {selectedNode.type === 'action' && ( filteredActions.length > 0 ? filteredActions.map(action => ( <button key={action.name} onClick={() => handleChangeActionClick(action.name)} disabled={nodeData.name === action.name} className={`w-full text-left px-3 py-1.5 rounded text-sm flex justify-between items-center transition-colors duration-100 ${ nodeData.name === action.name ? 'bg-green-100 text-green-800 font-medium cursor-not-allowed' : 'hover:bg-green-100 text-gray-700 hover:text-green-800' }`} title={action.name} > <span className="truncate">{action.title || action.name}</span> {action.valueType === 'function' && <GitBranch size={14} className="text-gray-500 ml-2 flex-shrink-0" title="Function"/>} </button> )) : <p className="text-center text-xs text-gray-400 py-4">No matching actions.</p> )}
                      </div>
                  </div>
              )}

              {/* EDIT MODE */}
              {mode === 'edit' && (
                 <div className="space-y-4"> {/* REMOVED animate-fadeIn */}
                   <h4 className="text-md font-semibold text-gray-700 mb-1 flex items-center gap-2"><Edit size={16}/> Edit Details</h4>
                    {/* ... Keep Edit Start/Intent/Action forms ... */}
                    {selectedNode.type === 'start' && ( <div className="space-y-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md"> <div> <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="storyNameEdit"> Story Name </label> <input id="storyNameEdit" type="text" value={currentStoryName} onChange={(e) => handleStoryNameChange(e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm" placeholder="Enter a name for this story" /> </div> <div className="flex gap-2 pt-3 border-t border-indigo-100"> <button onClick={handleStartNodeEditSave} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"> <Check size={16}/> Save </button> <button onClick={() => handleSetMode('view')} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium"> Cancel </button> </div> </div> )}
                    {selectedNode.type === 'start' && ( <div className="space-y-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md"> <div> <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="storyIdEdit"> Story Id </label> <input id="storyIdEdit" type="text" value={currentStoryId} onChange={(e) => handleStoryIdChange(e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm" placeholder="Enter a code friendly id" /> </div> <div className="flex gap-2 pt-3 border-t border-indigo-100"> <button onClick={handleStartNodeEditSave} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"> <Check size={16}/> Save </button> <button onClick={() => handleSetMode('view')} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium"> Cancel </button> </div> </div> )}
                    {/* Add for story label change and story id change */}

                    {selectedNode.type === 'intent' && ( <div className="space-y-4 p-3 bg-blue-50 border border-blue-200 rounded-md"> <div> <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="intentIdEdit"> Intent <span className="text-red-500">*</span></label> <select id="intentIdEdit" value={currentIntentId} onChange={(e) => handleIntentIdEditChange(e.target.value)} required className="block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm" > <option value="" disabled>Select Intent</option> {intents.map(intent => (<option key={intent.id} value={intent.id}>{intent.label} ({intent.id})</option>))} {!intents.some(i => i.id === currentIntentId) && currentIntentId && (<option value={currentIntentId}>{currentIntentId} (Current/Unknown)</option>)} </select> <p className="text-xs text-gray-500 mt-1"> Label: {intents.find(i => i.id === currentIntentId)?.label || '(Custom/Not Found)'} </p> </div> <div> <label className="block text-sm font-medium text-gray-700 mb-1">Examples <span className="text-gray-400 text-xs">(node & def)</span></label> {currentExamples.map((example, index) => ( <div key={index} className="mt-1 flex items-center gap-2"> <input type="text" value={example} onChange={(e) => handleExampleChange(index, e.target.value)} className="flex-grow border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm" placeholder={`Example ${index + 1}`} /> <button onClick={() => handleRemoveExampleInput(index)} type="button" className={`p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 flex-shrink-0 ${currentExamples.length <= 0 ? 'invisible' : ''}`} title="Remove example"> <X size={16} /> </button> </div> ))} {currentExamples.length === 0 && <p className="text-xs text-gray-400 italic mt-1">No examples.</p>} <button onClick={handleAddExampleInput} type="button" className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"> <PlusCircle size={16} /> Add Example </button> </div> <div className="flex gap-2 pt-3 border-t border-blue-100"> <button onClick={handleIntentEditSave} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"> <Check size={16}/> Save </button> <button onClick={() => handleSetMode('view')} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium"> Cancel </button> </div> </div> )}
                    {selectedNode.type === 'action' && ( <div className="space-y-4 p-3 bg-green-50 border border-green-200 rounded-md"> <div> <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="actionConfigTitle"> Title </label> <input id="actionConfigTitle" type="text" value={currentActionConfig.title || ''} onChange={(e) => handleActionConfigChange('title', e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm" placeholder="User-friendly title (optional)" /> </div> <div> <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="actionConfigName"> Name (ID) <span className="text-red-500">*</span> </label> <input id="actionConfigName" type="text" value={currentActionConfig.name || ''} onChange={(e) => handleActionConfigChange('name', e.target.value)} required className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm font-mono" placeholder="e.g., action_ask_name" /> </div> <div> <label className="block text-sm font-medium text-gray-700 mb-1">Value Type</label> <div className="flex gap-2"> <button onClick={() => handleValueTypeToggle('text')} className={`flex items-center gap-1 px-3 py-1 rounded border text-sm transition-colors ${currentValueInputType === 'text' ? 'bg-green-100 border-green-300 text-green-800 font-medium' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}> <Type size={14} /> Text </button> <button onClick={() => handleValueTypeToggle('function')} className={`flex items-center gap-1 px-3 py-1 rounded border text-sm transition-colors ${currentValueInputType === 'function' ? 'bg-green-100 border-green-300 text-green-800 font-medium' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}> <GitBranch size={14} /> Function </button> </div> </div> {currentValueInputType === 'text' ? ( <div> <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="actionConfigValueText"> Text Value </label> <textarea id="actionConfigValueText" value={currentActionConfig.value || ''} onChange={(e) => handleActionConfigChange('value', e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm font-mono" placeholder="Enter text, JSON, URL, etc." rows={4} /> </div> ) : ( <div> <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="actionConfigValueFunction"> Select Function </label> <select id="actionConfigValueFunction" value={currentActionConfig.value || ''} onChange={(e) => handleActionConfigChange('value', e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm" > <option value="" disabled>Select function</option> {mockAvailableFunctions.length === 0 && <option disabled>No functions available</option>} {mockAvailableFunctions.map(func => (<option key={func.name} value={func.name} title={func.description}>{func.name}</option>))} {currentActionConfig.value && !mockAvailableFunctions.some(f => f.name === currentActionConfig.value) && ( <option value={currentActionConfig.value}>{currentActionConfig.value} (Current/Unknown)</option> )} </select> <p className="text-xs text-gray-500 mt-1 h-4 truncate"> {mockAvailableFunctions.find(f => f.name === currentActionConfig.value)?.description} </p> </div> )} <div className="flex gap-2 pt-3 border-t border-green-100"> <button onClick={handleActionEditSave} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium"> <Check size={16}/> Save </button> <button onClick={() => handleSetMode('view')} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium"> Cancel </button> </div> </div> )}
                 </div>
              )}
            </>
          )}
      </div> {/* End Content Area */}


      {/* --- DIALOGS --- */}
      {showIntentDialog && ( /* ... keep existing Intent Dialog ... */ <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4"> <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative max-h-[90vh] flex flex-col"> <div className="flex justify-between items-center border-b pb-3 mb-4 flex-shrink-0"> <h4 className="text-lg font-semibold text-blue-800 flex items-center gap-2"><PlusCircle size={18} /> Define New Intent</h4> <button onClick={() => setShowIntentDialog(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button> </div> <div className="space-y-4 overflow-y-auto pr-2 flex-grow scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"> <div> <label htmlFor="newIntentLabel" className="block text-sm font-medium text-gray-700 mb-1">Label <span className="text-red-500">*</span></label> <input type="text" id="newIntentLabel" value={newIntentLabel} onChange={e => setNewIntentLabel(e.target.value)} required className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm" placeholder="User-friendly label (e.g., Greet User)" /> </div> <div> <label htmlFor="newIntentId" className="block text-sm font-medium text-gray-700 mb-1">ID <span className="text-red-500">*</span></label> <input type="text" id="newIntentId" value={newIntentId} onChange={e => setNewIntentId(e.target.value)} required className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm font-mono" placeholder="Code-friendly ID (e.g., intent_greet)" /> <p className="text-xs text-gray-500 mt-1">Use lowercase_underscores. Sanitized on save.</p> </div> <div> <label className="block text-sm font-medium text-gray-700 mb-1">Examples</label> {newIntentExamples.map((example, index) => ( <div key={index} className="mt-1 flex items-center gap-2"> <input type="text" value={example} onChange={e => handleNewIntentExampleChange(index, e.target.value)} className="flex-grow border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm" placeholder={`Example ${index + 1}`}/> <button onClick={() => handleRemoveNewIntentExample(index)} type="button" className={`p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 flex-shrink-0 ${newIntentExamples.length <= 1 ? 'invisible' : ''}`} title="Remove example"><X size={16} /></button> </div> ))} <button onClick={handleAddIntentExampleInput} type="button" className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"><PlusCircle size={16} /> Add Example</button> </div> </div> <div className="flex justify-end gap-3 border-t pt-4 mt-4 flex-shrink-0"> <button onClick={() => setShowIntentDialog(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm font-medium">Cancel</button> <button onClick={handleIntentDialogSubmit} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium flex items-center gap-1.5"><Check size={16}/> Create Intent</button> </div> </div> </div> )}
      {showActionDialog && ( /* ... keep existing Action Dialog ... */ <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4"> <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative max-h-[90vh] flex flex-col"> <div className="flex justify-between items-center border-b pb-3 mb-4 flex-shrink-0"> <h4 className="text-lg font-semibold text-green-800 flex items-center gap-2"><PlusCircle size={18} /> Define New Action</h4> <button onClick={() => setShowActionDialog(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button> </div> <div className="space-y-4 overflow-y-auto pr-2 flex-grow scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"> <div> <label htmlFor="newActionTitle" className="block text-sm font-medium text-gray-700 mb-1">Title</label> <input type="text" id="newActionTitle" value={newActionTitle} onChange={e => setNewActionTitle(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm" placeholder="User-friendly title (optional)" /> </div> <div> <label htmlFor="newActionName" className="block text-sm font-medium text-gray-700 mb-1">Name (ID) <span className="text-red-500">*</span></label> <input type="text" id="newActionName" value={newActionName} onChange={e => setNewActionName(e.target.value)} required className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm font-mono" placeholder="e.g., action_send_message" /> <p className="text-xs text-gray-500 mt-1">Use lowercase_underscores. Sanitized on save.</p> </div> <div> <label className="block text-sm font-medium text-gray-700 mb-1">Value Type</label> <div className="flex gap-2"> <button onClick={() => handleNewActionValueTypeToggle('text')} className={`flex items-center gap-1 px-3 py-1 rounded border text-sm transition-colors ${newActionValueType === 'text' ? 'bg-green-100 border-green-300 text-green-800 font-medium' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}><Type size={14} /> Text</button> <button onClick={() => handleNewActionValueTypeToggle('function')} className={`flex items-center gap-1 px-3 py-1 rounded border text-sm transition-colors ${newActionValueType === 'function' ? 'bg-green-100 border-green-300 text-green-800 font-medium' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}><GitBranch size={14} /> Function</button> </div> </div> {newActionValueType === 'text' ? ( <div> <label htmlFor="newActionValueText" className="block text-sm font-medium text-gray-700 mb-1">Text Value</label> <textarea id="newActionValueText" value={newActionValue} onChange={e => setNewActionValue(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm font-mono" placeholder="Enter text, JSON, URL, etc." rows={4} /> </div> ) : ( <div> <label htmlFor="newActionValueFunc" className="block text-sm font-medium text-gray-700 mb-1">Select Function</label> <select id="newActionValueFunc" value={newActionValue} onChange={e => setNewActionValue(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm"> <option value="" disabled>Select function</option> {mockAvailableFunctions.length === 0 && <option disabled>No functions available</option>} {mockAvailableFunctions.map(func => (<option key={func.name} value={func.name} title={func.description}>{func.name}</option>))} </select> <p className="text-xs text-gray-500 mt-1 h-4 truncate">{mockAvailableFunctions.find(f => f.name === newActionValue)?.description}</p> </div> )} </div> <div className="flex justify-end gap-3 border-t pt-4 mt-4 flex-shrink-0"> <button onClick={() => setShowActionDialog(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm font-medium">Cancel</button> <button onClick={handleActionDialogSubmit} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-medium flex items-center gap-1.5"><Check size={16}/> Create Action</button> </div> </div> </div> )}

      {/* Global Styles - Removed fadeIn keyframes as class is removed */}
      <style jsx global>{`
         /* Basic scrollbar styling */
         .scrollbar-thin { scrollbar-width: thin; scrollbar-color: #CBD5E0 #EDF2F7; /* thumb track */ }
         .scrollbar-thin::-webkit-scrollbar { width: 8px; height: 8px; }
         .scrollbar-thin::-webkit-scrollbar-track { background: #EDF2F7; border-radius: 4px; }
         .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #CBD5E0; border-radius: 4px; border: 2px solid #EDF2F7; }
         .hover\\:scrollbar-thumb-gray-400:hover::-webkit-scrollbar-thumb { background-color: #A0AEC0; }
      `}</style>
    </div> // End Root Sidebar Div
  );
};

export default Sidebar;