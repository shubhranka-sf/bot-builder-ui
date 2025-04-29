// src/Flow.tsx
import React, { useState, useMemo, Suspense, useEffect } from 'react';
import ReactFlow, {
    Controls,
    Background,
    NodeTypes, // Removed Node, Edge imports as we get them from atom
    useReactFlow, // Keep this if needed for other functionalities like fitView
    ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtom } from 'jotai'; // Import useAtom

// Node Components
import StartNode from './components/nodes/StartNode';
import IntentNode from './components/nodes/IntentNode';
import ActionNode from './components/nodes/ActionNode';
import EndNode from './components/nodes/EndNode';
import FormNode from './components/nodes/FormNode';

// UI Components
import Sidebar from './components/Sidebar';
import FlowFAB from './components/flow_parts/FlowFAB';
import FlowTopBar from './components/flow_parts/FlowTopBar';
const ChatBotWidget = React.lazy(() => import('./components/ChatBotWidget'));

// Hooks
import { useFlowCallbacks } from './hooks/useFlowCallbacks';
import { useNodeManagement } from './hooks/useNodeManagement';
import { useFlowEvents } from './hooks/useFlowEvents';
import { useFlowExport } from './hooks/useFlowExport';

// Data & Types
import { defaultEdgeOptions, mockDefinedActions, mockIntents } from './data/mockData';
import { ActionDefinition, IntentDefinition } from './types';
import { NodesAtom, EdgesAtom } from './store/flowAtom'; // Import Atoms

// Global State (Atoms are implicitly used via hooks)
import 'react-toastify/dist/ReactToastify.css';

// --- Main Flow Content Component ---
function FlowContent() {
    // Global Definitions State
    const [definedActions, setDefinedActions] = useState<ActionDefinition[]>(() => {
        const stored = localStorage.getItem('definedActions');
        try {
            return stored ? JSON.parse(stored) : mockDefinedActions; // Use mock as fallback
        } catch { return mockDefinedActions; }
    });
    const [intents, setIntents] = useState<IntentDefinition[]>(() => {
        const stored = localStorage.getItem('intents');
         try { return stored ? JSON.parse(stored) : mockIntents; // Use mock as fallback
         } catch { return mockIntents; }
    });

    // *** Read nodes and edges state from Jotai Atoms ***
    const [nodes] = useAtom(NodesAtom);
    const [edges] = useAtom(EdgesAtom);
    // *** ***

    // --- Hooks ---
    // const { fitView } = useReactFlow(); // Keep if fitView or other ReactFlow methods are needed directly

    const {
        selectedNode,
        setSelectedNode,
        isSidebarOpen,
        setIsSidebarOpen,
        isFabMenuOpen,
        fabRef,
        onSelectionChange,
        clearSelectionAndCloseSidebar,
        toggleFabMenu,
        isConfigurableNode,
    } = useFlowEvents(); // Manages selection, UI toggles, loads initial atom state

    const { onNodesChange, onEdgesChange, onConnect } = useFlowCallbacks(); // Manages graph interactions -> updates atoms

    const {
        updateStartNode,
        updateIntentNode,
        updateActionNode,
        updateFormNode,
        handleAddNode,
        handleAddNewIntentDefinition,
        handleAddNewActionDefinition,
    } = useNodeManagement({
        intents, setIntents, definedActions, setDefinedActions, setSelectedNode
    }); // Manages node data manipulation -> updates atoms

    const { exportFlowData, callPredictApi, isLoading, isTrained } = useFlowExport({
        intents, definedActions
    }); // Manages backend interactions

    // --- Chat State & Handlers ---
    const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);

     const handleNewMessage = (text: string) => {
        const userMessage = { role: 'user', content: text };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
    };
    const onBotResponse = (response: string) => {
        const botMessage = { role: 'assistant', content: response };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
    };

    // Save definitions to localStorage
    useEffect(() => {
        if (definedActions.length > 0 || localStorage.getItem('definedActions')) {
             localStorage.setItem('definedActions', JSON.stringify(definedActions));
        }
    }, [definedActions]);

     useEffect(() => {
        if (intents.length > 0 || localStorage.getItem('intents')) {
             localStorage.setItem('intents', JSON.stringify(intents));
        }
    }, [intents]);


    // --- Node Types ---
    const nodeTypes: NodeTypes = useMemo(
        () => ({ start: StartNode, intent: IntentNode, action: ActionNode, end: EndNode, form: FormNode }),
        []
    );

     // Effect to fit view once nodes are loaded initially
     const { fitView } = useReactFlow();
     useEffect(() => {
        // Only fit view if there are nodes and maybe not on every subsequent node change
        // A small delay can help ensure the layout engine has processed the nodes
        if (nodes.length > 0) {
           const timeoutId = setTimeout(() => fitView({ duration: 300, padding: 0.1 }), 50);
            return () => clearTimeout(timeoutId);
        }
     }, [nodes.length, fitView]); // Depend on node count


    // --- Render ---
    return (
        <div className="h-screen w-screen flex overflow-hidden bg-gray-50">
            <div className="flex-grow h-full relative">
                {/* *** Pass nodes and edges from Atoms to ReactFlow component *** */}
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onSelectionChange={onSelectionChange}
                    onPaneClick={clearSelectionAndCloseSidebar}
                    nodeTypes={nodeTypes}
                    defaultEdgeOptions={defaultEdgeOptions}
                    // fitView // fitView is now called programmatically in useEffect
                    className="bg-gradient-to-br from-indigo-50 via-white to-blue-50"
                    deleteKeyCode={['Backspace', 'Delete']}
                >
                    <Controls />
                    <Background />
                </ReactFlow>
                {/* *** *** */}

                {/* UI Components */}
                <FlowTopBar onTrain={exportFlowData} isLoading={isLoading} />

                <AnimatePresence>
                    {selectedNode && isConfigurableNode(selectedNode) && !isSidebarOpen && (
                        <motion.div
                            className="absolute bottom-24 right-6 z-30"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            <motion.button
                                onClick={() => setIsSidebarOpen(true)}
                                className="btn btn-circle btn-neutral shadow-xl"
                                title="Configure Node"
                                whileHover={{ scale: 1.1, rotate: 15 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <Settings size={28} />
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                 <FlowFAB
                    isOpen={isFabMenuOpen}
                    toggleFabMenu={toggleFabMenu}
                    onAddNode={handleAddNode}
                    fabRef={fabRef}
                 />


                {/* Conditional Chat Widget */}
                {isTrained ? (
                    <Suspense fallback={<div className='absolute bottom-5 left-5 text-gray-500'>Loading Chat...</div>}>
                        <ChatBotWidget
                            callApi={callPredictApi}
                            handleNewMessage={handleNewMessage}
                            onBotResponse={onBotResponse}
                            messages={messages}
                            primaryColor="#4F46E5"
                        />
                    </Suspense>
                ) : (
                     <div className="absolute bottom-6 left-6 p-3 bg-yellow-100 text-yellow-800 text-xs rounded-md shadow border border-yellow-300 z-10">
                         Train the model to enable the chat widget.
                     </div>
                )}
            </div>

            {/* Conditional Sidebar */}
            {isSidebarOpen && selectedNode && isConfigurableNode(selectedNode) && (
                <div
                     key={`${selectedNode.id}-${selectedNode.type}`}
                     className="w-80 h-full flex-shrink-0 bg-white shadow-lg border-l border-gray-200 flex flex-col"
                 >
                    <Sidebar
                        selectedNode={selectedNode}
                        intents={intents}
                        definedActions={definedActions}
                        onUpdateStartNode={updateStartNode}
                        onUpdateIntent={updateIntentNode}
                        onUpdateAction={updateActionNode}
                        onUpdateForm={updateFormNode}
                        onAddNewIntentDefinition={handleAddNewIntentDefinition}
                        onAddNewActionDefinition={handleAddNewActionDefinition}
                        onClose={clearSelectionAndCloseSidebar}
                    />
                </div>
            )}
        </div>
    );
}

// --- Main App Component ---
function Flow() {
    return (
        // ReactFlowProvider is essential for useReactFlow() hook to work
        <ReactFlowProvider>
            <FlowContent />
        </ReactFlowProvider>
    );
}

export default Flow;