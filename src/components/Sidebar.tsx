import React, { useState, useMemo, useCallback } from 'react';
import { Node } from 'reactflow';
import {
  Bot, Zap, X, PlusCircle, PlayCircle, FlagOff, AlertTriangle, Edit, Replace, ClipboardList, FileCode, GitMerge // Added GitMerge
} from 'lucide-react';
import {
  ActionDefinition, IntentDefinition, StartNodeData, IntentNodeData, ActionNodeData, FormNodeData, ScriptNodeData, ScriptUtilityFunction, IfNodeData // Added IfNodeData
} from '../types';

// View Components
import SidebarStartView from './sidebar_parts/SidebarStartView';
import SidebarIntentView from './sidebar_parts/SidebarIntentView';
import SidebarActionView from './sidebar_parts/SidebarActionView';
import SidebarFormView from './sidebar_parts/SidebarFormView';
import SidebarScriptView from './sidebar_parts/SidebarScriptView';
import SidebarIfView from './sidebar_parts/SidebarIfView'; // --- IMPORT IF VIEW ---

// Edit Components
import SidebarStartEdit from './sidebar_parts/SidebarStartEdit';
import SidebarIntentEdit from './sidebar_parts/SidebarIntentEdit';
import SidebarActionEdit from './sidebar_parts/SidebarActionEdit';
import SidebarFormEdit from './sidebar_parts/SidebarFormEdit';
import SidebarScriptEdit from './sidebar_parts/SidebarScriptEdit';
import SidebarIfEdit from './sidebar_parts/SidebarIfEdit'; // --- IMPORT IF EDIT ---

// Other UI Components
import SidebarChangeDefinition from './sidebar_parts/SidebarChangeDefinition';
import DefineIntentDialog from './dialogs/DefineIntentDialog';
import DefineActionDialog from './dialogs/DefineActionDialog';
import { useSidebarState } from './hooks/useSidebarState';

interface SidebarProps {
  selectedNode: Node | null;
  intents: IntentDefinition[];
  definedActions: ActionDefinition[];
  scriptUtilities: ScriptUtilityFunction[];
  onUpdateStartNode: (nodeId: string, newStoryName: string, storyId?: string) => void;
  onUpdateIntent: (nodeId: string, newIntentId: string, examples?: string[]) => void;
  onUpdateAction: (nodeId: string, actionData: Partial<ActionNodeData>) => void;
  onUpdateForm: (nodeId: string, formData: Partial<FormNodeData>) => void;
  onUpdateScriptNode: (nodeId: string, scriptData: Partial<ScriptNodeData>) => void;
  onUpdateIfNode: (nodeId: string, ifData: Partial<IfNodeData>) => void; // --- ADDED onUpdateIfNode ---
  onAddNewIntentDefinition: (newIntent: IntentDefinition) => void;
  onAddNewActionDefinition: (newAction: ActionDefinition) => void;
  onClose: () => void;
}

const nodeTypeConfig = {
    start: { icon: PlayCircle, name: 'Start Node', color: 'indigo', editComponent: SidebarStartEdit, viewComponent: SidebarStartView, canChangeDef: false },
    intent: { icon: Bot, name: 'Intent Node', color: 'blue', editComponent: SidebarIntentEdit, viewComponent: SidebarIntentView, canChangeDef: true },
    action: { icon: Zap, name: 'Action Node', color: 'green', editComponent: SidebarActionEdit, viewComponent: SidebarActionView, canChangeDef: true },
    form: { icon: ClipboardList, name: 'Form Node', color: 'teal', editComponent: SidebarFormEdit, viewComponent: SidebarFormView, canChangeDef: false },
    script: { icon: FileCode, name: 'Script Node', color: 'purple', editComponent: SidebarScriptEdit, viewComponent: SidebarScriptView, canChangeDef: false },
    if: { icon: GitMerge, name: 'If Condition Node', color: 'sky', editComponent: SidebarIfEdit, viewComponent: SidebarIfView, canChangeDef: false }, // --- ADDED IF CONFIG ---
    end: { icon: FlagOff, name: 'End Node', color: 'red', editComponent: null, viewComponent: null, canChangeDef: false },
    default: { icon: AlertTriangle, name: 'Unknown Node', color: 'gray', editComponent: null, viewComponent: null, canChangeDef: false },
};

const Sidebar: React.FC<SidebarProps> = (props) => {
    const { selectedNode, intents, definedActions, scriptUtilities, onClose } = props;

    const state = useSidebarState(props);

    const [showIntentDialog, setShowIntentDialog] = useState(false);
    const [showActionDialog, setShowActionDialog] = useState(false);

    const config = useMemo(() => {
        return nodeTypeConfig[selectedNode?.type as keyof typeof nodeTypeConfig] || nodeTypeConfig.default;
    }, [selectedNode?.type]);

    const handleIntentDialogSubmit = useCallback((newIntent: IntentDefinition) => {
        props.onAddNewIntentDefinition(newIntent);
    }, [props.onAddNewIntentDefinition]);

     const handleActionDialogSubmit = useCallback((newAction: ActionDefinition) => {
        props.onAddNewActionDefinition(newAction);
    }, [props.onAddNewActionDefinition]);


    if (!selectedNode) {
        return (
            <div className="relative w-80 bg-white border-l border-gray-200 shadow-lg flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center min-h-[60px] flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-500 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-yellow-500" /> No Selection
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <div className="flex-grow p-4 text-center text-gray-500 text-sm">Please select a node.</div>
            </div>
        );
    }

    const NodeIcon = config.icon;
    const isConfigurable = !!config.editComponent;
    const nodeData = selectedNode.data || {};
    const headerColorClass = `text-${config.color}-800`; // e.g. text-sky-800
    const iconColorClass = `text-${config.color}-600`;   // e.g. text-sky-600
    const editButtonClass = `bg-${config.color}-50 border-${config.color}-300 text-${config.color}-700 hover:bg-${config.color}-100 focus:ring-${config.color}-500`;


    return (
        <div className="relative w-80 bg-white border-l border-gray-200 shadow-lg flex flex-col h-full transition-all duration-300 ease-in-out z-10">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center min-h-[60px] flex-shrink-0">
                <h3 className={`text-lg font-semibold ${headerColorClass} flex items-center gap-2`}>
                    {NodeIcon && <NodeIcon size={18} className={iconColorClass} />} {config.name}
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"> <X size={20} /> </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                {!isConfigurable ? (
                    <div className="text-center text-gray-400 text-sm pt-4">This node type ({selectedNode.type || 'Unknown'}) has no configurable options.</div>
                ) : (
                    <>
                        {state.mode === 'view' && !state.isChangingDefinition && config.viewComponent && (
                            <div className="space-y-4">
                                <h4 className="text-md font-semibold text-gray-700 mb-2">Current Configuration</h4>
                                {React.createElement(config.viewComponent, { 
                                  nodeData,
                                  ...(selectedNode.type === 'script' && { scriptUtilities }),
                                  // ...(selectedNode.type === 'if' && { /* pass relevant view props */ })
                                 })}
                                <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                                    <button onClick={() => state.setMode('edit')} className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded focus:outline-none focus:ring-2 text-sm font-medium transition-colors duration-150 border ${editButtonClass}`}>
                                        <Edit size={16} /> Edit Details
                                    </button>
                                    {config.canChangeDef && (
                                        <button onClick={() => state.setIsChangingDefinition(true)} className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium">
                                            <Replace size={16} /> Change {selectedNode.type === 'intent' ? 'Intent' : 'Action'} Definition
                                        </button>
                                    )}
                                </div>
                                <div className="mt-auto pt-3 border-t border-gray-200">
                                     {selectedNode.type === 'intent' && ( <button onClick={() => setShowIntentDialog(true)} className="w-full flex items-center justify-center gap-1.5 bg-blue-50 border border-blue-300 text-blue-700 px-3 py-2 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"> <PlusCircle size={16} /> Define New Intent </button> )}
                                     {selectedNode.type === 'action' && ( <button onClick={() => setShowActionDialog(true)} className="w-full flex items-center justify-center gap-1.5 bg-green-50 border border-green-300 text-green-700 px-3 py-2 rounded hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"> <PlusCircle size={16} /> Define New Action </button> )}
                                </div>
                            </div>
                        )}

                         {state.mode === 'view' && state.isChangingDefinition && config.canChangeDef && (
                            <SidebarChangeDefinition
                                nodeType={selectedNode.type as 'intent' | 'action'}
                                currentNodeId={selectedNode.type === 'intent' ? nodeData.intentId : nodeData.name}
                                searchTerm={state.searchTerm}
                                onSearchTermChange={state.setSearchTerm}
                                filteredIntents={state.filteredIntents}
                                filteredActions={state.filteredActions}
                                onSelectIntent={state.handleChangeIntentClick}
                                onSelectAction={state.handleChangeActionClick}
                                onCancel={() => state.setIsChangingDefinition(false)}
                            />
                         )}

                        {state.mode === 'edit' && config.editComponent && (
                             <div className="space-y-4">
                                <h4 className="text-md font-semibold text-gray-700 mb-1 flex items-center gap-2"> <Edit size={16} /> Edit Details </h4>
                                {React.createElement(config.editComponent, {
                                     ...(selectedNode.type === 'start' && {
                                         currentStoryName: state.currentStoryName,
                                         currentStoryId: state.currentStoryId,
                                         onNameChange: state.handleStoryNameChange,
                                         onIdChange: state.handleStoryIdChange,
                                         onSave: state.handleStartNodeEditSave,
                                         onCancel: () => state.setMode('view'),
                                     }),
                                      ...(selectedNode.type === 'action' && {
                                         config: state.currentActionConfig,
                                         variations: state.currentVariations,
                                         valueType: state.currentValueInputType,
                                         onConfigChange: state.handleActionConfigChange,
                                         onVariationChange: state.handleVariationChange,
                                         onAddVariation: state.handleAddVariationInput,
                                         onRemoveVariation: state.handleRemoveVariationInput,
                                         onValueTypeToggle: state.handleValueTypeToggle,
                                         onSave: state.handleActionEditSave,
                                         onCancel: () => state.setMode('view'),
                                     }),
                                     ...(selectedNode.type === 'intent' && {
                                         intents: intents,
                                         currentIntentId: state.currentIntentId,
                                         currentExamples: state.currentExamples,
                                         onIntentIdChange: state.handleIntentIdEditChange, 
                                         onExampleChange: state.handleExampleChange,
                                         onAddExample: state.handleAddExampleInput,
                                         onRemoveExample: state.handleRemoveExampleInput, 
                                         onSave: state.handleIntentEditSave,
                                         onCancel: () => state.setMode('view'),
                                     }),
                                     ...(selectedNode.type === 'form' && {
                                         currentFormName: state.currentFormName,
                                         currentFormId: state.currentFormId,
                                         currentSlots: state.currentSlots,
                                         availableEntities: state.availableEntities,
                                         onNameChange: state.handleFormNameChange,
                                         onIdChange: state.handleFormIdChange,
                                         onSlotToggle: state.handleSlotToggle,
                                         onSave: state.handleFormEditSave,
                                         onCancel: () => state.setMode('view'),
                                     }),
                                     ...(selectedNode.type === 'script' && {
                                        currentScriptName: state.currentScriptName,
                                        currentScriptDescription: state.currentScriptDescription,
                                        onNameChange: state.handleScriptNameChange,
                                        onDescriptionChange: state.handleScriptDescriptionChange,
                                        onSave: state.handleScriptNodeEditSave,
                                        onCancel: () => state.setMode('view'),
                                        scriptUtilities: scriptUtilities,
                                     }),
                                     // --- ADDED IF NODE EDIT PROPS ---
                                     ...(selectedNode.type === 'if' && {
                                        currentIfName: state.currentIfName,
                                        currentIfDescription: state.currentIfDescription,
                                        currentIfCondition: state.currentIfCondition, // Condition is edited on node
                                        onNameChange: state.handleIfNameChange,
                                        onDescriptionChange: state.handleIfDescriptionChange,
                                        onConditionChange: state.handleIfConditionChange, // For sidebar edit if any
                                        onSave: state.handleIfNodeEditSave,
                                        onCancel: () => state.setMode('view'),
                                     }),
                                })}
                             </div>
                        )}
                    </>
                )}
            </div>

            <DefineIntentDialog
                isOpen={showIntentDialog}
                onClose={() => setShowIntentDialog(false)}
                onSubmit={handleIntentDialogSubmit}
                existingIntentIds={intents.map(i => i.id)}
            />
            <DefineActionDialog
                 isOpen={showActionDialog}
                 onClose={() => setShowActionDialog(false)}
                 onSubmit={handleActionDialogSubmit}
                 existingActionNames={definedActions.map(a => a.name)}
            />
        </div>
    );
};

export default Sidebar;