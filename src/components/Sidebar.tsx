// File: Sidebar.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Node } from 'reactflow';
import { Bot, Zap, X, PlusCircle, Type, Code, Edit, GitBranch, Replace, Check } from 'lucide-react';
import { ActionDefinition, AvailableFunction, IntentDefinition } from '../types'; // Import types
import { mockIntents, mockAvailableFunctions } from '../data/mockData'; // Import mock data

interface SidebarProps {
  selectedNode: Node | null;
  definedActions: ActionDefinition[]; // Receive defined actions from Flow state
  onUpdateIntent: (nodeId: string, newIntentId: string, examples?: string[]) => void; // Added examples
  onUpdateAction: (nodeId: string, actionData: Partial<ActionDefinition>) => void; // Allow partial updates
  onAddNewActionDefinition: (newAction: ActionDefinition) => void;
  onClose: () => void;
}

type SidebarMode = 'view' | 'edit' | 'change';
type ValueInputType = 'text' | 'function';

const Sidebar: React.FC<SidebarProps> = ({
  selectedNode,
  definedActions, // Use this prop for the list of assignable actions
  onUpdateIntent,
  onUpdateAction,
  onAddNewActionDefinition,
  onClose
}) => {
  const [mode, setMode] = useState<SidebarMode>('view');

  // --- State for Node Configuration (used in edit/change modes) ---
  // Action Node State
  const [currentActionConfig, setCurrentActionConfig] = useState<Partial<ActionDefinition>>({});
  const [currentValueInputType, setCurrentValueInputType] = useState<ValueInputType>('text');
  // Intent Node State
  const [currentIntentId, setCurrentIntentId] = useState<string>('');
  const [currentExamples, setCurrentExamples] = useState<string[]>([]); // State for examples being edited

  // --- State for New Intent Dialog ---
  const [showIntentDialog, setShowIntentDialog] = useState(false);
  const [newIntentLabel, setNewIntentLabel] = useState(''); // Changed from Name to Label
  const [newIntentId, setNewIntentId] = useState(''); // Added ID field
  const [newIntentExamples, setNewIntentExamples] = useState<string[]>(['']);

  // --- State for New Action Dialog ---
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionName, setNewActionName] = useState('');
  const [newActionValue, setNewActionValue] = useState('');
  const [newActionValueType, setNewActionValueType] = useState<ValueInputType>('text');


  // --- Effects ---
  // Initialize local state when selectedNode changes or mode changes back to view
  useEffect(() => {
    if (selectedNode) {
        if (selectedNode.type === 'intent') {
            const intentData = selectedNode.data || {};
            setCurrentIntentId(intentData.intentId || '');
            // Ensure examples is an array, default to empty if missing or not array
            setCurrentExamples(Array.isArray(intentData.examples) ? [...intentData.examples] : []);
        } else if (selectedNode.type === 'action') {
            const actionData = selectedNode.data || {};
            const initialConfig = {
                title: actionData.title || actionData.name || '',
                name: actionData.name || '',
                value: actionData.value || '',
                valueType: actionData.valueType || 'text',
            };
            setCurrentActionConfig(initialConfig);
            setCurrentValueInputType(initialConfig.valueType || 'text');
        }
    } else {
        // Reset if no node is selected
        setCurrentIntentId('');
        setCurrentExamples([]);
        setCurrentActionConfig({});
        setCurrentValueInputType('text');
    }
    // Always reset to view mode when the selected node changes
    setMode('view');

  }, [selectedNode]); // Rerun only when selected node changes

  // --- Event Handlers ---

  // Switch to a different mode (view, edit, change)
  const handleSetMode = (newMode: SidebarMode) => {
    setMode(newMode);
    // Re-initialize edit state if switching TO edit mode
     if (newMode === 'edit' && selectedNode) {
        if (selectedNode.type === 'intent') {
             setCurrentIntentId(selectedNode.data.intentId || '');
             setCurrentExamples(Array.isArray(selectedNode.data.examples) ? [...selectedNode.data.examples] : []);
        } else if (selectedNode.type === 'action') {
            const actionData = selectedNode.data || {};
             setCurrentActionConfig({
                title: actionData.title || actionData.name || '',
                name: actionData.name || '',
                value: actionData.value || '',
                valueType: actionData.valueType || 'text',
            });
             setCurrentValueInputType(actionData.valueType || 'text');
        }
     }
  };


  // Called when selecting an intent from the list (in 'change' mode)
  const handleIntentSelect = (intentId: string) => {
    if (selectedNode && selectedNode.type === 'intent') {
      // Find the selected intent definition to potentially get its default examples
      const selectedIntentDef = mockIntents.find(i => i.id === intentId);
      const examples = selectedIntentDef?.examples || [];
      onUpdateIntent(selectedNode.id, intentId, examples); // Update the actual node data
      handleSetMode('view'); // Exit change mode after selection
    }
  };

  // Called when selecting a pre-defined action from the list (in 'change' mode)
  const handleDefinedActionSelect = (action: ActionDefinition) => {
    if (selectedNode && selectedNode.type === 'action') {
      const newConfig = { // Prepare the full data object
        title: action.title,
        name: action.name,
        value: action.value,
        valueType: action.valueType,
      };
      onUpdateAction(selectedNode.id, newConfig); // Update the actual node data
      handleSetMode('view'); // Exit change mode after applying
    }
  };

  // -- Edit Mode Handlers --

  // Update action config fields during editing
  const handleActionConfigChange = (field: keyof ActionDefinition, value: string | ValueInputType) => {
    setCurrentActionConfig(prev => ({ ...prev, [field]: value }));
  };

  // Toggle action value type during editing
   const handleValueTypeToggle = (type: ValueInputType) => {
     setCurrentValueInputType(type);
     // Reset value based on new type (select first available function or empty string)
     const newValue = type === 'function' ? (mockAvailableFunctions[0]?.name || '') : '';
     setCurrentActionConfig(prev => ({
       ...prev,
       value: newValue,
       valueType: type
     }));
   };

  // Save changes made in Action Edit mode
  const handleActionEditSave = () => {
    if (selectedNode && selectedNode.type === 'action') {
      onUpdateAction(selectedNode.id, currentActionConfig);
      handleSetMode('view'); // Switch back to view mode
    }
  };

  // Update intent ID during editing
  const handleIntentIdChange = (newId: string) => {
      setCurrentIntentId(newId);
  };

  // Update intent example input during editing
  const handleExampleChange = (index: number, value: string) => {
    setCurrentExamples(prev => {
      const newInputs = [...prev];
      newInputs[index] = value;
      return newInputs;
    });
  };

  // Add a new example input field during editing
  const handleAddExampleInput = () => setCurrentExamples(prev => [...prev, '']);

  // Remove an example input field during editing
  const handleRemoveExampleInput = (index: number) => {
      setCurrentExamples(prev => prev.filter((_, i) => i !== index));
  };


  // Save changes made in Intent Edit mode
  const handleIntentEditSave = () => {
    if (selectedNode && selectedNode.type === 'intent') {
        // Filter out empty examples before saving
        const finalExamples = currentExamples.map(e => e.trim()).filter(e => e);
        onUpdateIntent(selectedNode.id, currentIntentId, finalExamples);
        handleSetMode('view'); // Switch back to view mode
    }
  };

  // --- New Intent Dialog Handlers ---
  const handleAddIntentExampleInput = () => setNewIntentExamples((prev) => [...prev, '']);
  const handleNewIntentExampleChange = (index: number, value: string) => {
    setNewIntentExamples((prev) => {
      const newInputs = [...prev];
      newInputs[index] = value;
      return newInputs;
    });
  };
   const handleRemoveNewIntentExample = (index: number) => {
       setNewIntentExamples(prev => prev.filter((_, i) => i !== index));
   };

  const handleIntentDialogSubmit = () => {
    const intentLabel = newIntentLabel.trim();
    const intentId = newIntentId.trim();
    const examplesArray = newIntentExamples.map(example => example.trim()).filter(example => example);

    if (!intentLabel || !intentId) {
        alert("Intent Label and ID are required.");
        return;
    }
    if (mockIntents.some(i => i.id === intentId)) { // Basic check for duplicate ID
        alert(`Intent ID "${intentId}" already exists.`);
        return;
    }

    const newIntentDef: IntentDefinition = { id: intentId, label: intentLabel, examples: examplesArray };

    console.log('New intent definition:', newIntentDef);
    // IMPORTANT: In a real app, you would:
    // 1. Make an API call to save the new intent definition.
    // 2. Update the application's central store of intents (e.g., refetch or add to local state).
    // 3. For this example, we'll just log it and maybe add it to the *local* mockIntents (won't persist).
    // mockIntents.push(newIntentDef); // This would only update the local array for the current session

    // Reset dialog state
    setNewIntentLabel('');
    setNewIntentId('');
    setNewIntentExamples(['']);
    setShowIntentDialog(false);
  };

  // --- New Action Dialog Handlers ---
  const handleNewActionValueTypeToggle = (type: ValueInputType) => {
    setNewActionValueType(type);
    setNewActionValue(type === 'function' ? (mockAvailableFunctions[0]?.name || '') : '');
  };

  const handleActionDialogSubmit = () => {
    const actionTitle = newActionTitle.trim();
    const actionName = newActionName.trim();

    if (!actionName) { // Name is mandatory
      alert("Action Name (Identifier) is required.");
      return;
    }
     if (definedActions.some(a => a.name === actionName)) { // Check against current state
        alert(`Action Name "${actionName}" already exists.`);
        return;
     }

    const newActionDefinition: ActionDefinition = {
      title: actionTitle || actionName, // Default title to name if empty
      name: actionName,
      value: newActionValue, // Value is already managed by state
      valueType: newActionValueType,
    };

    onAddNewActionDefinition(newActionDefinition); // Call the callback passed from FlowContent

    // Reset dialog state
    setNewActionTitle('');
    setNewActionName('');
    setNewActionValue('');
    setNewActionValueType('text');
    setShowActionDialog(false);
  };

  // --- Render Logic ---
  if (!selectedNode || (selectedNode.type !== 'intent' && selectedNode.type !== 'action')) {
    // Optionally return a placeholder or null
     return (
        <div className="relative w-72 bg-white border-l border-gray-200 shadow-lg flex flex-col h-full transition-all duration-300 ease-in-out z-10">
             <div className="p-4 border-b border-gray-200 flex justify-between items-center min-h-[60px]">
                <h3 className="text-lg font-semibold text-gray-500">Node Details</h3>
                 <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                 </button>
             </div>
             <div className="flex-grow p-4 text-center text-gray-400 text-sm">
                 Select an Intent or Action node to configure it.
             </div>
        </div>
     );
  }

  const isActionNodeSelected = selectedNode.type === 'action';
  const isIntentNodeSelected = selectedNode.type === 'intent';

  // Get current data directly from selectedNode for display in view mode
  const nodeData = selectedNode.data || {};
  const currentIntentDef = mockIntents.find(i => i.id === nodeData.intentId);
  const displayIntentLabel = currentIntentDef?.label || nodeData.intentId || 'N/A';
  const displayIntentId = nodeData.intentId || 'N/A';
  const displayActionTitle = nodeData.title || nodeData.name || 'N/A';
  const displayActionName = nodeData.name || 'N/A';
  const displayActionValue = nodeData.value ?? 'N/A'; // Use nullish coalescing
  const displayActionValueType = nodeData.valueType || 'text';

  return (
    <div className="relative w-72 bg-white border-l border-gray-200 shadow-lg flex flex-col h-full transition-all duration-300 ease-in-out z-10">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center min-h-[60px]">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
           {isActionNodeSelected ? <><Zap size={18} className="text-green-600"/> Action Node</> : <><Bot size={18} className="text-blue-600"/> Intent Node</>}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"> {/* Added scrollbar styling */}

        {/* === VIEW MODE === */}
        {mode === 'view' && (
          <div className="space-y-3 animate-fadeIn"> {/* Added fade-in animation */}
            <h4 className="text-md font-semibold text-gray-700 mb-2">Current Configuration</h4>
            {isIntentNodeSelected && (
              <>
                <p className="text-sm"><span className="text-gray-500">Intent:</span> <span className="font-medium text-blue-700">{displayIntentLabel}</span></p>
                <p className="text-sm"><span className="text-gray-500">ID:</span> <code className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">{displayIntentId}</code></p>
                <div className="text-sm">
                   <span className="text-gray-500">Examples:</span>
                   {Array.isArray(nodeData.examples) && nodeData.examples.length > 0 ? (
                       <ul className="list-disc list-inside pl-2 mt-1">
                           {nodeData.examples.slice(0, 3).map((ex: string, i: number) => <li key={i} className="text-gray-600 text-xs truncate">{ex}</li>)}
                           {nodeData.examples.length > 3 && <li className="text-gray-400 text-xs">...and {nodeData.examples.length - 3} more</li>}
                       </ul>
                   ) : (
                       <span className="text-gray-400 text-xs ml-1"> (None)</span>
                   )}
                </div>
              </>
            )}
            {isActionNodeSelected && (
              <>
                <p className="text-sm"><span className="text-gray-500">Title:</span> <span className="font-medium text-gray-800">{displayActionTitle}</span></p>
                <p className="text-sm"><span className="text-gray-500">Name:</span> <span className="font-medium text-green-700">{displayActionName}</span></p>
                <div className="text-sm flex items-start gap-2"> {/* Align items start */}
                  <span className="text-gray-500 flex-shrink-0">{displayActionValueType === 'function' ? 'Function:' : 'Value:'}</span>
                   {displayActionValueType === 'function' && <GitBranch size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />}
                   <code className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded break-words max-w-full"> {/* Ensure code block can wrap */}
                     {typeof displayActionValue === 'string' ? displayActionValue : JSON.stringify(displayActionValue)}
                   </code>
                </div>
              </>
            )}
            {/* --- Action Buttons for View Mode --- */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
               <button
                 onClick={() => handleSetMode('edit')}
                 className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded focus:outline-none focus:ring-2 text-sm font-medium transition-colors duration-150 ${
                    isActionNodeSelected
                    ? 'bg-green-50 border border-green-300 text-green-700 hover:bg-green-100 focus:ring-green-500'
                    : 'bg-blue-50 border border-blue-300 text-blue-700 hover:bg-blue-100 focus:ring-blue-500'
                 }`}
               >
                 <Edit size={16} /> Edit Details
               </button>
               <button
                 onClick={() => handleSetMode('change')}
                 className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded focus:outline-none focus:ring-2 text-sm font-medium transition-colors duration-150 ${
                    isActionNodeSelected
                    ? 'bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-gray-400'
                    : 'bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-gray-400'
                 }`}
                >
                  <Replace size={16} /> {isActionNodeSelected ? 'Change Type' : 'Change Intent'}
                </button>
            </div>
          </div>
        )}

        {/* === EDIT MODE === */}
        {mode === 'edit' && (
           <div className="space-y-4 animate-fadeIn">
            <h4 className="text-md font-semibold text-gray-700 mb-1 flex items-center gap-2"><Edit size={16}/> Edit Details</h4>

            {/* --- Edit Intent --- */}
            {isIntentNodeSelected && (
               <div className="space-y-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="intentIdEdit">
                        Intent ID
                      </label>
                      <select
                        id="intentIdEdit"
                        value={currentIntentId}
                        // Allow selection or potentially text input if needed later
                        onChange={(e) => handleIntentIdChange(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                       >
                         <option value="" disabled>Select Intent</option>
                         {mockIntents.map(intent => (
                             <option key={intent.id} value={intent.id}>
                                 {intent.label} ({intent.id})
                             </option>
                         ))}
                         {/* If currentIntentId isn't in mockIntents, show it as an option */}
                         {!mockIntents.some(i => i.id === currentIntentId) && currentIntentId && (
                             <option value={currentIntentId}>{currentIntentId} (Custom)</option>
                         )}
                      </select>
                       {/* Display Label based on selected ID */}
                        <p className="text-xs text-gray-500 mt-1">
                           Label: {mockIntents.find(i => i.id === currentIntentId)?.label || '(Custom or Not Found)'}
                        </p>
                    </div>

                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Examples</label>
                       {currentExamples.map((example, index) => (
                         <div key={index} className="mt-1 flex items-center gap-2">
                           <input
                             type="text"
                             value={example}
                             onChange={(e) => handleExampleChange(index, e.target.value)}
                             className="flex-grow border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                             placeholder={`Example ${index + 1}`}
                            />
                            <button
                                onClick={() => handleRemoveExampleInput(index)}
                                type="button"
                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 flex-shrink-0"
                                title="Remove example"
                            >
                               <X size={16} />
                            </button>
                         </div>
                       ))}
                        <button
                           onClick={handleAddExampleInput}
                           type="button"
                           className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                           <PlusCircle size={16} /> Add Example
                        </button>
                    </div>
                     {/* Save/Cancel Buttons */}
                     <div className="flex gap-2 pt-3 border-t border-blue-100">
                         <button onClick={handleIntentEditSave} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium">
                            <Check size={16}/> Save Intent Changes
                         </button>
                         <button onClick={() => handleSetMode('view')} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium">
                           Cancel
                         </button>
                     </div>
               </div>
            )}

            {/* --- Edit Action --- */}
            {isActionNodeSelected && (
                <div className="space-y-4 p-3 bg-green-50 border border-green-200 rounded-md">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="actionConfigTitle">
                         Title
                       </label>
                       <input
                         id="actionConfigTitle"
                         type="text"
                         value={currentActionConfig.title || ''}
                         onChange={(e) => handleActionConfigChange('title', e.target.value)}
                         className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm"
                         placeholder="User-friendly title"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="actionConfigName">
                         Name (Identifier) <span className="text-red-500">*</span>
                       </label>
                       <input
                         id="actionConfigName"
                         type="text"
                         value={currentActionConfig.name || ''}
                         onChange={(e) => handleActionConfigChange('name', e.target.value)}
                         required // Basic HTML validation
                         className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm"
                         placeholder="Code-friendly name (e.g., SendEmail)"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Value Type</label>
                       <div className="flex gap-2">
                          <button
                            onClick={() => handleValueTypeToggle('text')}
                            className={`flex items-center gap-1 px-3 py-1 rounded border text-sm transition-colors ${currentValueInputType === 'text' ? 'bg-green-100 border-green-300 text-green-800 font-medium' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                          >
                            <Type size={14} /> Text
                          </button>
                          <button
                            onClick={() => handleValueTypeToggle('function')}
                            className={`flex items-center gap-1 px-3 py-1 rounded border text-sm transition-colors ${currentValueInputType === 'function' ? 'bg-green-100 border-green-300 text-green-800 font-medium' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                          >
                            <GitBranch size={14} /> Function
                          </button>
                       </div>
                     </div>

                     {/* Conditional Value Input */}
                     {currentValueInputType === 'text' ? (
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="actionConfigValueText">
                           Text Value
                         </label>
                         <textarea
                           id="actionConfigValueText"
                           value={currentActionConfig.value || ''}
                           onChange={(e) => handleActionConfigChange('value', e.target.value)}
                           className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm font-mono"
                           placeholder="Enter text content, JSON, URL, etc."
                           rows={4}
                         />
                       </div>
                     ) : (
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="actionConfigValueFunction">
                           Select Function
                         </label>
                         <select
                           id="actionConfigValueFunction"
                           value={currentActionConfig.value || ''}
                           onChange={(e) => handleActionConfigChange('value', e.target.value)}
                           className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm"
                         >
                           <option value="" disabled>Select available function</option>
                           {mockAvailableFunctions.length === 0 && <option disabled>No functions available</option>}
                           {mockAvailableFunctions.map(func => (
                             <option key={func.name} value={func.name} title={func.description}>
                               {func.name}
                             </option>
                           ))}
                         </select>
                         <p className="text-xs text-gray-500 mt-1 h-4"> {/* Reserve space for description */}
                           {mockAvailableFunctions.find(f => f.name === currentActionConfig.value)?.description}
                         </p>
                       </div>
                     )}
                     {/* Save/Cancel Buttons */}
                     <div className="flex gap-2 pt-3 border-t border-green-100">
                         <button onClick={handleActionEditSave} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium">
                             <Check size={16}/> Save Action Changes
                         </button>
                         <button onClick={() => handleSetMode('view')} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium">
                            Cancel
                         </button>
                     </div>
                </div>
            )}
           </div>
        )}

        {/* === CHANGE MODE === */}
        {mode === 'change' && (
          <div className="space-y-4 animate-fadeIn">
             <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2"><Replace size={16}/> Change {isIntentNodeSelected ? 'Intent' : 'Action Type'}</h4>

             {/* --- Change Intent Selection --- */}
            {isIntentNodeSelected && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Select an intent to assign to this node.</p>
                <div className="border rounded max-h-80 overflow-y-auto scrollbar-thin">
                  <ul className="divide-y divide-gray-100">
                    {mockIntents.map((intent) => (
                      <li key={intent.id}>
                        <button
                          onClick={() => handleIntentSelect(intent.id)}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors duration-100 flex justify-between items-center ${
                            nodeData.intentId === intent.id // Highlight the currently assigned one
                              ? 'bg-blue-100 text-blue-800 font-medium'
                              : 'text-gray-700 hover:bg-blue-50'
                          }`}
                          title={intent.label}
                        >
                          <span>{intent.label}</span>
                          <code className="text-xs text-blue-600 bg-blue-200 px-1 rounded">{intent.id}</code>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* --- Change Action Type Selection --- */}
            {isActionNodeSelected && (
               <div className="space-y-3">
                  <p className="text-xs text-gray-500">Select a predefined action type to replace the current node's configuration.</p>
                  <div className="border rounded max-h-80 overflow-y-auto scrollbar-thin">
                      <ul className="divide-y divide-gray-100">
                        {definedActions.map((action, index) => ( // Use definedActions from props
                          <li key={`${action.name}-${index}`}>
                            <button
                              onClick={() => handleDefinedActionSelect(action)}
                              className={`w-full text-left px-3 py-2 text-sm transition-colors duration-100 flex justify-between items-center ${
                                  nodeData.name === action.name // Basic highlight if name matches
                                  ? 'bg-green-100 text-green-800 font-medium'
                                  : 'text-gray-700 hover:bg-green-50'
                              }`}
                              title={`${action.name} - ${action.valueType}: ${action.value}`}
                            >
                              <span className="flex items-center gap-2">
                                {action.valueType === 'function' && <GitBranch size={14} className="text-gray-400"/>}
                                {action.title || action.name}
                              </span>
                              <code className="text-xs text-green-600 bg-green-200 px-1 rounded">{action.name}</code>
                            </button>
                          </li>
                        ))}
                      </ul>
                  </div>
               </div>
            )}

            {/* Cancel Button for Change Mode */}
            <button
                onClick={() => handleSetMode('view')}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium"
              >
                 Cancel Change
            </button>
          </div>
        )}
      </div> {/* End Content Area */}


      {/* --- Footer Buttons for Defining New Types --- */}
       {/* Show these buttons only in 'view' or 'change' modes for less clutter during edits */}
      {(mode === 'view' || mode === 'change') && (
          <div className="p-3 border-t border-gray-200 mt-auto">
            {isIntentNodeSelected && (
              <button
                onClick={() => setShowIntentDialog(true)}
                className="w-full flex items-center justify-center gap-1.5 bg-blue-50 border border-blue-300 text-blue-700 px-3 py-2 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-150"
              >
                <PlusCircle size={16} /> Define New Intent
              </button>
            )}
            {isActionNodeSelected && (
              <button
                onClick={() => setShowActionDialog(true)}
                className="w-full flex items-center justify-center gap-1.5 bg-green-50 border border-green-300 text-green-700 px-3 py-2 rounded hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm transition-colors duration-150"
              >
                <PlusCircle size={16} /> Define New Action
              </button>
            )}
          </div>
      )}


      {/* --- DIALOGS --- */}
      {/* Dialog Modal for Defining New Intent */}
      {showIntentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative max-h-[90vh] flex flex-col">
            <button onClick={() => setShowIntentDialog(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" title="Close"><X size={20} /></button>
            <h4 className="text-xl font-semibold mb-5 text-gray-800 flex items-center gap-2"><Bot size={20} className="text-blue-600"/> Define New Intent</h4>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4 scrollbar-thin">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="intentLabel">Intent Label <span className="text-red-500">*</span></label>
                <input id="intentLabel" type="text" value={newIntentLabel} onChange={(e) => setNewIntentLabel(e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm" placeholder="User-friendly label (e.g., Order Pizza)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="intentId">Intent ID <span className="text-red-500">*</span></label>
                <input id="intentId" type="text" value={newIntentId} onChange={(e) => setNewIntentId(e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm font-mono" placeholder="Code-friendly ID (e.g., intent_order_pizza)" />
                 <p className="text-xs text-gray-500 mt-1">Must be unique. Use underscores, no spaces.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Example User Inputs</label>
                {newIntentExamples.map((example, index) => (
                  <div key={index} className="mt-2 flex items-center gap-2">
                    <input type="text" value={example} onChange={(e) => handleNewIntentExampleChange(index, e.target.value)} className="flex-grow border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm" placeholder={`Example ${index + 1} (e.g., "I want a pizza")`} />
                    <button onClick={handleAddIntentExampleInput} type="button" className={`p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100 ${index !== newIntentExamples.length - 1 ? 'invisible' : ''}`} title="Add another example"><PlusCircle size={20} /></button>
                    <button onClick={() => handleRemoveNewIntentExample(index)} type="button" className={`p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 ${newIntentExamples.length <= 1 ? 'invisible' : ''}`} title="Remove example"><X size={18} /></button>
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-1">Provide examples of how a user might express this intent.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 mt-4 flex-shrink-0">
              <button onClick={() => setShowIntentDialog(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium">Cancel</button>
              <button onClick={handleIntentDialogSubmit} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium flex items-center gap-1"><PlusCircle size={16}/> Create Intent Definition</button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Modal for Defining New Action */}
      {showActionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative max-h-[90vh] flex flex-col">
            <button onClick={() => setShowActionDialog(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" title="Close"><X size={20} /></button>
            <h4 className="text-xl font-semibold mb-5 text-gray-800 flex items-center gap-2"><Zap size={20} className="text-green-600"/> Define New Action</h4>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4 scrollbar-thin">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="newActionTitle">Title</label>
                <input id="newActionTitle" type="text" value={newActionTitle} onChange={(e) => setNewActionTitle(e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm" placeholder="User-friendly title (e.g., Send Confirmation)" />
                <p className="text-xs text-gray-500 mt-1">A short, descriptive title (optional, defaults to Name).</p>
              </div>
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="newActionName">Name (Identifier) <span className="text-red-500">*</span></label>
                <input id="newActionName" type="text" value={newActionName} onChange={(e) => setNewActionName(e.target.value)} required className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm font-mono" placeholder="Code-friendly name (e.g., SendEmail)" />
                <p className="text-xs text-gray-500 mt-1">Unique identifier for the action. Use underscores, no spaces.</p>
              </div>
              {/* Value Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value Type</label>
                 <div className="flex gap-2">
                   <button onClick={() => handleNewActionValueTypeToggle('text')} className={`flex items-center gap-1 px-3 py-1 rounded border text-sm transition-colors ${newActionValueType === 'text' ? 'bg-green-100 border-green-300 text-green-800 font-medium' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}><Type size={14} /> Text</button>
                   <button onClick={() => handleNewActionValueTypeToggle('function')} className={`flex items-center gap-1 px-3 py-1 rounded border text-sm transition-colors ${newActionValueType === 'function' ? 'bg-green-100 border-green-300 text-green-800 font-medium' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}><GitBranch size={14} /> Function</button>
                 </div>
              </div>
              {/* Conditional Value Input for Dialog */}
              {newActionValueType === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="newActionValueText">Text Value</label>
                  <textarea id="newActionValueText" value={newActionValue} onChange={(e) => setNewActionValue(e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm font-mono" placeholder="Enter text, JSON, URL, etc." rows={4} />
                  <p className="text-xs text-gray-500 mt-1">The static value or configuration for this action.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="newActionValueFunction">Select Function</label>
                  <select id="newActionValueFunction" value={newActionValue} onChange={(e) => setNewActionValue(e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm">
                    <option value="" disabled>Select available function</option>
                    {mockAvailableFunctions.length === 0 && <option value="" disabled>No functions available</option>}
                    {mockAvailableFunctions.map(func => (<option key={func.name} value={func.name} title={func.description}>{func.name}</option>))}
                  </select>
                   <p className="text-xs text-gray-500 mt-1 h-4">
                      {mockAvailableFunctions.find(f => f.name === newActionValue)?.description}
                   </p>
                </div>
              )}
            </div>
            {/* Dialog Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 mt-4 flex-shrink-0">
              <button onClick={() => setShowActionDialog(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium">Cancel</button>
              <button onClick={handleActionDialogSubmit} className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md font-medium flex items-center gap-1"><PlusCircle size={16}/> Create Action Definition</button>
            </div>
          </div>
        </div>
      )}

      {/* Add simple fade-in animation style */}
      <style jsx global>{`
         @keyframes fadeIn {
           from { opacity: 0; }
           to { opacity: 1; }
         }
         .animate-fadeIn {
           animation: fadeIn 0.3s ease-out;
         }
        /* Basic scrollbar styling */
        .scrollbar-thin {
            scrollbar-width: thin; /* For Firefox */
            scrollbar-color: #a0aec0 #e2e8f0; /* thumb track */
        }
        .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
            background: #e2e8f0; /* Use Tailwind gray-200 */
            border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: #a0aec0; /* Use Tailwind gray-400 */
            border-radius: 3px;
            border: 1px solid #e2e8f0; /* Optional: Match track color */
        }
        .hover\\:scrollbar-thumb-gray-400:hover::-webkit-scrollbar-thumb {
            background-color: #718096; /* Use Tailwind gray-500 */
        }
      `}</style>

    </div>
  );
};

export default Sidebar;