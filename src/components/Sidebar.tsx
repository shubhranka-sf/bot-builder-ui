// File: Sidebar.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Bot, Zap, X, PlusCircle, Type, Code, Edit, GitBranch, Replace } from 'lucide-react';
import { ActionDefinition, AvailableFunction, IntentDefinition, StartNodeDefine } from '../types'; // Import types

// Mock data - In a real app, this would come from state management or an API
const start: StartNodeDefine[] = [
  { id: 'start', type: 'start', data: { storyName: 'Start' }, position: { x: 0, y: 0 } }
];

const intents: IntentDefinition[] = [
  { id: 'intent_greet', label: 'Greeting' , examples: ['hello', 'hi', 'hey']},
  { id: 'intent_order', label: 'Place Order' , examples: ['order', 'buy', 'purchase']},
  { id: 'intent_support', label: 'Request Support' , examples: ['support', 'help', 'assist']},
  { id: 'intent_goodbye', label: 'Goodbye' , examples: ['bye', 'goodbye', 'see you']},
  { id: 'intent_faq_shipping', label: 'FAQ - Shipping' , examples: ['shipping', 'delivery', 'ship']},
  { id: 'intent_faq_returns', label: 'FAQ - Returns' , examples: ['return', 'exchange', 'refund']},
];

// Mock list of available functions
const availableFunctions: AvailableFunction[] = [
  { name: 'getUserData', description: 'Fetches current user data' },
  { name: 'createSupportTicket', description: 'Creates a new support ticket' },
  { name: 'lookupOrder', description: 'Looks up an order by ID' },
  { name: 'sendConfirmationEmail', description: 'Sends a confirmation email' },
];

interface SidebarProps {
  selectedNode: Node | null;
  definedActions: ActionDefinition[]; // Receive defined actions from Flow
  onUpdateIntent: (nodeId: string, newIntentId: string) => void;
  onUpdateAction: (nodeId: string, actionData: Omit<ActionDefinition, 'id'>) => void; // Updated signature
  onAddNewActionDefinition: (newAction: ActionDefinition) => void; // Callback to add new action types
  onClose: () => void;
}

type ActiveTab = 'intents' | 'actions' | 'start';
type ValueInputType = 'text' | 'function';
type SidebarMode = 'view' | 'edit' | 'change'; // Keep 'change' mode

const Sidebar: React.FC<SidebarProps> = ({
  selectedNode,
  definedActions,
  onUpdateIntent,
  onUpdateAction,
  onAddNewActionDefinition,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('intents');
  const [mode, setMode] = useState<SidebarMode>('view'); // Control view, edit, or change mode

  // --- State for Node Configuration ---
  const [currentActionConfig, setCurrentActionConfig] = useState<Omit<ActionDefinition, 'id'>>({
    title: '', name: '', value: '', valueType: 'text'
  });
  const [currentValueInputType, setCurrentValueInputType] = useState<ValueInputType>('text');
  const [currentIntentId, setCurrentIntentId] = useState<string>('');

  // --- State for New Intent Dialog ---
  const [showIntentDialog, setShowIntentDialog] = useState(false);
  const [newIntentName, setNewIntentName] = useState('');
  const [exampleInputs, setExampleInputs] = useState<string[]>(['']);

  // --- State for New Action Dialog ---
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionName, setNewActionName] = useState('');
  const [newActionValue, setNewActionValue] = useState('');
  const [newActionValueType, setNewActionValueType] = useState<ValueInputType>('text');

  // --- State for Start Node ---
  const [storyName, setStoryName] = useState<string>(''); // State for storyName
  // --- Effects ---
  // Update active tab, configuration state, and reset mode when selectedNode changes
  useEffect(() => {
    setMode('view'); // Reset mode on node change
    if (selectedNode?.type === 'intent') {
      setActiveTab('intents');
      setCurrentIntentId(selectedNode.data.intentId || '');
    } else if (selectedNode?.type === 'action') {
      setActiveTab('actions');
      const initialConfig = {
        title: selectedNode.data.title || selectedNode.data.name || '',
        name: selectedNode.data.name || '',
        value: selectedNode.data.value || '',
        valueType: selectedNode.data.valueType || 'text',
      };
      setCurrentActionConfig(initialConfig);
      setCurrentValueInputType(initialConfig.valueType);
    } else if (selectedNode?.type === 'start') {
      setActiveTab('start');
      setStoryName(selectedNode.data.storyName || ''); // Initialize storyName
    } else {
      setCurrentActionConfig({ title: '', name: '', value: '', valueType: 'text' });
      setCurrentValueInputType('text');
      setCurrentIntentId('');
    }
  }, [selectedNode]);


  // --- Event Handlers ---
  // Called when selecting an intent from the list (in 'change' mode)
  const handleIntentSelect = (intentId: string) => {
    if (selectedNode && selectedNode.type === 'intent') {
      const selectedIntent = intents.find((intent) => intent.id === intentId);
  
      const updatedNodeData = {
        ...selectedNode.data, // Keep existing data
        intentId, // Update intentId
        examples: selectedIntent?.examples || [], // Set examples from the selected intent
      };
  
      setCurrentIntentId(intentId); // Update local state
      onUpdateIntent(selectedNode.id, updatedNodeData); // Pass the updated data to the parent
      setMode('view'); // Exit change mode
    }
  };

  // Called when selecting a pre-defined action from the list (in 'change' mode)
  const handleDefinedActionSelect = (action: ActionDefinition) => {
    if (selectedNode && selectedNode.type === 'action') {
      const newConfig = {
        title: action.title,
        name: action.name,
        value: action.value,
        valueType: action.valueType,
      };
      setCurrentActionConfig(newConfig); // Update local state
      setCurrentValueInputType(action.valueType);
      onUpdateAction(selectedNode.id, newConfig); // Update the actual node
      setMode('view'); // Exit change mode after applying
    }
  };

  // Called when editing fields in 'edit' mode (only for Action nodes now)
  const handleConfigChange = (field: keyof Omit<ActionDefinition, 'id'>, value: string | ValueInputType) => {
    const newConfig = { ...currentActionConfig, [field]: value };
    setCurrentActionConfig(newConfig);
    // Update node immediately while editing
    if (selectedNode && selectedNode.type === 'action') {
       onUpdateAction(selectedNode.id, newConfig);
    }
  };

  // Called when toggling value type in 'edit' mode (only for Action nodes)
  const handleValueTypeToggle = (type: ValueInputType) => {
    setCurrentValueInputType(type);
    const newValue = type === 'function' ? (availableFunctions[0]?.name || '') : '';
    // Update both value and valueType in the config and the node
    const newConfig = {
      ...currentActionConfig,
      value: newValue,
      valueType: type
    };
    setCurrentActionConfig(newConfig);
     if (selectedNode && selectedNode.type === 'action') {
      onUpdateAction(selectedNode.id, newConfig);
    }
  };

  // --- Intent Dialog Handlers ---
  const handleAddExampleInput = () => setExampleInputs((prev) => [...prev, '']);
  const handleExampleChange = (index: number, value: string) => {
    setExampleInputs((prev) => {
      const newInputs = [...prev];
      newInputs[index] = value;
      return newInputs;
    });
  };
  const handleIntentDialogSubmit = () => {
    const examplesArray = exampleInputs.map(example => example.trim()).filter(example => example !== '');
    console.log('New intent definition:', { name: newIntentName, examples: examplesArray });
    // TODO: Add logic to actually save the new intent definition
    // TODO: Update the `intents` array state (if managed locally) or refetch
    setNewIntentName('');
    setExampleInputs(['']);
    setShowIntentDialog(false);
  };

  // --- Action Dialog Handlers ---
  const handleNewActionValueTypeToggle = (type: ValueInputType) => {
    setNewActionValueType(type);
    setNewActionValue(type === 'function' ? (availableFunctions[0]?.name || '') : '');
  };

  const handleActionDialogSubmit = () => {
    const finalValue = newActionValueType === 'function' ? newActionValue : newActionValue;
    const newActionDefinition: ActionDefinition = {
      title: newActionTitle.trim() || newActionName.trim(),
      name: newActionName.trim(),
      value: finalValue,
      valueType: newActionValueType,
    };
    if (!newActionDefinition.name) {
      alert("Action Name is required.");
      return;
    }
    onAddNewActionDefinition(newActionDefinition);
    setNewActionTitle('');
    setNewActionName('');
    setNewActionValue('');
    setNewActionValueType('text');
    setShowActionDialog(false);
  };

  // --- Render Logic ---
  if (!selectedNode || (selectedNode.type !== 'start' && selectedNode.type !== 'intent' && selectedNode.type !== 'action')) {
    return null;
  }

  const isStartNode = selectedNode.type === 'start';
  const isActionNodeSelected = selectedNode.type === 'action';
  const isIntentNodeSelected = selectedNode.type === 'intent';

  // Get current data directly from selectedNode for display in view mode
  const currentIntentLabel = intents.find(i => i.id === selectedNode.data.intentId)?.label || selectedNode.data.intentId || 'N/A';
  const currentActionTitle = selectedNode.data.title || selectedNode.data.name || 'N/A';
  const currentActionName = selectedNode.data.name || 'N/A';
  const currentActionValue = selectedNode.data.value || 'N/A';
  const currentActionValueType = selectedNode.data.valueType || 'text';

  return (
    <div className="relative w-72 bg-white border-l border-gray-200 shadow-lg flex flex-col h-full transition-all duration-300 ease-in-out z-10">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center min-h-[60px]">
        <h3 className="text-lg font-semibold text-gray-800">
        {isActionNodeSelected ? 'Action Node' : (isIntentNodeSelected ? 'Intent Node' : (isStartNode ? 'Start Node' : 'Default Node'))}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {isIntentNodeSelected && (
          <div className={`flex-1 py-2 px-4 text-sm font-medium text-center flex items-center justify-center gap-1 border-b-2 border-blue-500 text-blue-600`}>
            <Bot size={16} /> Intent
          </div>
        )}
        {isActionNodeSelected && (
          <div className={`flex-1 py-2 px-4 text-sm font-medium text-center flex items-center justify-center gap-1 border-b-2 border-green-500 text-green-600`}>
            <Zap size={16} /> Action
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6">

        {/* View Mode */}
        {mode === 'view' && (
          <div className="space-y-3">
            <h4 className="text-md font-semibold text-gray-700 mb-2">Current Configuration</h4>
            {isIntentNodeSelected && (
              <>
                <p className="text-sm"><span className="text-gray-500">Intent:</span> <span className="font-medium text-blue-700">{currentIntentLabel}</span></p>
                <p className="text-sm"><span className="text-gray-500">ID:</span> <code className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">{selectedNode.data.intentId || 'N/A'}</code></p>
              </>
            )}
            {isActionNodeSelected && (
              <>
                <p className="text-sm"><span className="text-gray-500">Title:</span> <span className="font-medium text-gray-800">{currentActionTitle}</span></p>
                <p className="text-sm"><span className="text-gray-500">Name:</span> <span className="font-medium text-green-700">{currentActionName}</span></p>
                <div className="text-sm flex items-center gap-2">
                  <span className="text-gray-500">{currentActionValueType === 'function' ? 'Function:' : 'Value:'}</span>
                  {currentActionValueType === 'function' && <GitBranch size={14} className="text-gray-500" />}
                  <code className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded break-all">{currentActionValue}</code>
                </div>
              </>
            )}
            {/* Edit and Change Buttons */}
            <div className="mt-4 flex gap-2">
               {isActionNodeSelected && ( // Only show Edit for Action nodes
                 <button
                   onClick={() => setMode('edit')}
                   className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium"
                 >
                   <Edit size={16} /> Edit Details
                 </button>
               )}
               {isActionNodeSelected && ( // Show Change Type for Action nodes
                 <button
                   onClick={() => setMode('change')}
                   className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium"
                 >
                   <Replace size={16} /> Change Type
                 </button>
               )}
               {isIntentNodeSelected && ( // Show Edit for Intent nodes
                 <button
                   onClick={() => setMode('edit')}
                   // make the button outline
                   className='flex-1 flex items-center justify-center gap-2 border border-blue-700 text-blue-700 px-4 py-2 rounded hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium'
              
                 >
                   <Edit size={16} /> Edit Details
                 </button>
               )}
                {isIntentNodeSelected && ( // Show Change Intent for Intent nodes
                 <button
                   onClick={() => setMode('change')} // Intent 'Change' button now sets mode to 'change'
                   className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                 >
                   <Replace size={16} /> Change Intent
                 </button>
               )}
            </div>
          </div>
        )}

        {/* Edit Mode (Only for Action Nodes) */}
        {mode === 'edit' && isActionNodeSelected && (
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-700 mb-1">Edit Action Details</h4>
             {/* Configuration Fields */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="actionConfigTitle">
                 Title
               </label>
               <input
                 id="actionConfigTitle"
                 type="text"
                 value={currentActionConfig.title}
                 onChange={(e) => handleConfigChange('title', e.target.value)}
                 className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm"
                 placeholder="User-friendly title"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="actionConfigName">
                 Name (Identifier)
               </label>
               <input
                 id="actionConfigName"
                 type="text"
                 value={currentActionConfig.name}
                 onChange={(e) => handleConfigChange('name', e.target.value)}
                 className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm"
                 placeholder="Code-friendly name (e.g., SendEmail)"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Value Type</label>
               <div className="flex gap-2">
                  <button
                    onClick={() => handleValueTypeToggle('text')}
                    className={`flex items-center gap-1 px-3 py-1 rounded border text-sm ${currentValueInputType === 'text' ? 'bg-green-100 border-green-300 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Type size={14} /> Text
                  </button>
                  <button
                    onClick={() => handleValueTypeToggle('function')}
                    className={`flex items-center gap-1 px-3 py-1 rounded border text-sm ${currentValueInputType === 'function' ? 'bg-gray-100 border-gray-300 text-gray-800' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`} // Adjusted function button style
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
                   value={currentActionConfig.value}
                   onChange={(e) => handleConfigChange('value', e.target.value)}
                   className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm font-mono"
                   placeholder="Enter text content, JSON, URL, etc."
                   rows={3}
                 />
               </div>
             ) : (
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="actionConfigValueFunction">
                   Select Function
                 </label>
                 <select
                   id="actionConfigValueFunction"
                   value={currentActionConfig.value}
                   onChange={(e) => handleConfigChange('value', e.target.value)}
                   className="block w-full border border-gray-300 rounded-md p-2 focus:ring-gray-500 focus:border-gray-500 shadow-sm text-sm" // Adjusted focus ring
                 >
                   {availableFunctions.length === 0 && <option disabled>No functions available</option>}
                   {availableFunctions.map(func => (
                     <option key={func.name} value={func.name} title={func.description}>
                       {func.name}
                     </option>
                   ))}
                 </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {availableFunctions.find(f => f.name === currentActionConfig.value)?.description}
                  </p>
               </div>
             )}
              {/* Button to finish editing */}
              <button
                onClick={() => setMode('view')}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium"
              >
                 Done Editing
              </button>
          </div>
        )}

        {mode === 'edit' && isIntentNodeSelected && (
          <div>
            <h4 className="text-md font-semibold text-gray-700 mb-3">Edit Intent</h4>
            <p className="text-xs text-gray-500 mb-3">Edit the intent assigned to this node.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="intentId">
                Intent ID
              </label>
              <input
                id="intentId"
                type="text"
                value={currentIntentId}
                onChange={(e) => handleIntentSelect(e.target.value)}
                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-gray-500 focus:border-gray-500 shadow-sm text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="intentLabel">
                Examples 
              </label>
              {intents.find(i => i.id === currentIntentId)?.examples?.map((example, index) => (
                <input
                  key={index}
                  type="text"
                  value={example}
                  onChange={(e) => handleInputExampleChange(index, e.target.value)}
                  className="block w-full border border-gray-300 rounded-md p-2 focus:ring-gray-500 focus:border-gray-500 shadow-sm text-sm"
                />
              ))}
            </div>
            <button
              onClick={() => setMode('view')}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium"
            >
              Done Editing
            </button>
          </div>
        )}

        {/* Change Mode */}
        {mode === 'change' && (
          <>
            {/* Change Intent Selection */}
            {isIntentNodeSelected && (
              <div>
                <h4 className="text-md font-semibold text-gray-700 mb-3">Change Intent</h4>
                <p className="text-xs text-gray-500 mb-3">Select an intent to assign to this node.</p>
                <ul className="space-y-1 max-h-96 overflow-y-auto border rounded p-1">
                  {intents.map((intent) => (
                    <li key={intent.id}>
                      <button
                        onClick={() => handleIntentSelect(intent.id)} // Select and exit change mode
                        className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                          currentIntentId === intent.id // Use local state for selection highlight
                            ? 'bg-blue-100 text-blue-800 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        title={intent.label}
                      >
                        {intent.label} (<code className="text-xs">{intent.id}</code>)
                      </button>
                    </li>
                  ))}
                </ul>
                 <button
                    onClick={() => setMode('view')}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium"
                  >
                     Cancel Change
                  </button>
              </div>
            )}

            {/* Change Action Type Selection */}
            {isActionNodeSelected && (
               <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-2">Change Action Type</h4>
                  <p className="text-xs text-gray-500 mb-3">Select a predefined action type to replace the current node's configuration.</p>
                  <ul className="space-y-1 max-h-96 overflow-y-auto border rounded p-1">
                    {definedActions.map((action, index) => (
                      <li key={`${action.name}-${index}`}>
                        <button
                          onClick={() => handleDefinedActionSelect(action)} // Apply selected action and exit change mode
                          className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors flex justify-between items-center text-gray-600 hover:bg-gray-100`}
                          title={`${action.name} - ${action.valueType}: ${action.value}`}
                        >
                          <span>{action.title || action.name}</span>
                          {action.valueType === 'function' && <GitBranch size={14} className="text-gray-500 ml-2"/>}
                        </button>
                      </li>
                    ))}
                  </ul>
                   <button
                      onClick={() => setMode('view')}
                      className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium"
                    >
                       Cancel Change
                    </button>
               </div>
            )}
          </>
        )}

        {isStartNode && (
          <>
            {mode === 'view' && (
              <div className="space-y-3">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Start Node Configuration</h4>
                <p className="text-sm">
                  <span className="text-gray-500">Story Name:</span>{' '}
                  <span className="font-medium text-gray-800">{storyName || 'N/A'}</span>
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setMode('edit')}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium"
                  >
                    <Edit size={16} /> Edit Details
                  </button>
                </div>
              </div>
            )}

            {mode === 'edit' && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-700 mb-1">Edit Start Node</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="storyName">
                    Story Name
                  </label>
                  <input
                    id="storyName"
                    type="text"
                    value={storyName}
                    onChange={(e) => setStoryName(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm"
                    placeholder="Enter story name"
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      if (selectedNode) {
                        selectedNode.data.storyName = storyName; // Update the node's data
                      }
                      setMode('view'); // Return to view mode
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setMode('view')}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Buttons for Defining New Types */}
      <div className="p-4 border-t border-gray-200 flex justify-end">
        {/* Keep Define New Intent/Action buttons regardless of mode */}
        {isIntentNodeSelected && (
          <button
            onClick={() => setShowIntentDialog(true)}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <Bot size={16} /> Define New Intent
          </button>
        )}
        {isActionNodeSelected && (
          <button
            onClick={() => setShowActionDialog(true)}
            className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            <Zap size={16} /> Define New Action
          </button>
        )}
      </div>

      {/* --- DIALOGS --- */}
      {/* Dialog Modal for Defining New Intent */}
      {showIntentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative max-h-[80vh] flex flex-col">
            <button onClick={() => setShowIntentDialog(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" title="Close"><X size={20} /></button>
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Define New Intent</h4>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="intentName">Intent Name</label>
                <input id="intentName" type="text" value={newIntentName} onChange={(e) => setNewIntentName(e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm" placeholder="e.g., OrderPizza" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Example User Inputs</label>
                {exampleInputs.map((example, index) => (
                  <div key={index} className="mt-2 flex items-center gap-2">
                    <input type="text" value={example} onChange={(e) => handleExampleChange(index, e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm" placeholder={`Example ${index + 1} (e.g., "I want a pizza")`} />
                    {index === exampleInputs.length - 1 && (<button onClick={handleAddExampleInput} type="button" className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100" title="Add another example"><PlusCircle size={20} /></button>)}
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-1">Provide examples of how a user might express this intent.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 mt-4">
              <button onClick={() => setShowIntentDialog(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium">Cancel</button>
              <button onClick={handleIntentDialogSubmit} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium">Create Intent Definition</button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Modal for Defining New Action */}
      {showActionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative max-h-[80vh] flex flex-col">
            <button onClick={() => setShowActionDialog(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" title="Close"><X size={20} /></button>
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Define New Action</h4>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="newActionTitle">Title</label>
                <input id="newActionTitle" type="text" value={newActionTitle} onChange={(e) => setNewActionTitle(e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm" placeholder="User-friendly title (e.g., Send Confirmation)" />
                <p className="text-xs text-gray-500 mt-1">A short, descriptive title.</p>
              </div>
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="newActionName">Name (Identifier)</label>
                <input id="newActionName" type="text" value={newActionName} onChange={(e) => setNewActionName(e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm" placeholder="Code-friendly name (e.g., SendEmail)" />
                <p className="text-xs text-gray-500 mt-1">A unique identifier for the action.</p>
              </div>
              {/* Value Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value Type</label>
                 <div className="flex gap-2">
                   <button onClick={() => handleNewActionValueTypeToggle('text')} className={`flex items-center gap-1 px-3 py-1 rounded border text-sm ${newActionValueType === 'text' ? 'bg-green-100 border-green-300 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}><Type size={14} /> Text</button>
                   <button onClick={() => handleNewActionValueTypeToggle('function')} className={`flex items-center gap-1 px-3 py-1 rounded border text-sm ${newActionValueType === 'function' ? 'bg-gray-100 border-gray-300 text-gray-800' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}><GitBranch size={14} /> Function</button> {/* Updated Icon */}
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
                  <select id="newActionValueFunction" value={newActionValue} onChange={(e) => setNewActionValue(e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-gray-500 focus:border-gray-500 shadow-sm text-sm"> {/* Adjusted focus ring */}
                    {availableFunctions.length === 0 && <option value="" disabled>No functions available</option>}
                    {availableFunctions.map(func => (<option key={func.name} value={func.name} title={func.description}>{func.name}</option>))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Select the function this action should execute.</p>
                </div>
              )}
            </div>
            {/* Dialog Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 mt-4">
              <button onClick={() => setShowActionDialog(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium">Cancel</button>
              <button onClick={handleActionDialogSubmit} className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md font-medium">Create Action Definition</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
