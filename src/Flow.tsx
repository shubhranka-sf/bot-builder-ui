import React, { useState, useCallback, useMemo, useRef, useEffect, Suspense } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  NodeTypes,
  OnSelectionChangeParams,
  useReactFlow,
  ReactFlowProvider,
  XYPosition,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Bot, Zap, FlagOff, Plus, Settings, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StartNode from './components/nodes/StartNode';
import IntentNode from './components/nodes/IntentNode';
import ActionNode from './components/nodes/ActionNode';
import EndNode from './components/nodes/EndNode';
import Sidebar from './components/Sidebar';
import {
  ActionDefinition,
  StartNodeData,
  IntentNodeData,
  ActionNodeData,
  IntentDefinition,
} from './types';
import { mockDefinedActions, mockIntents, defaultEdgeOptions, getId } from './data/mockData';
// import ChatBotWidget from './components/ChatBotWidget';
const ChatBotWidget = React.lazy(() => import('./components/ChatBotWidget'));
import { useAtom, useAtomValue } from 'jotai';
import { EdgesAtom, isLoadingAtom, NodesAtom } from './store/flowAtom';
import { useDebouncedCallback } from 'use-debounce';
import { useSetAtom } from 'jotai';
import { toast, ToastContainer } from 'react-toastify';

const colorClasses: { [key: string]: { bg: string; hoverBg: string } } = {
  purple: { bg: 'bg-purple-500', hoverBg: 'hover:bg-purple-600' },
  blue: { bg: 'bg-blue-500', hoverBg: 'hover:bg-blue-600' },
  green: { bg: 'bg-green-500', hoverBg: 'hover:bg-green-600' },
  red: { bg: 'bg-red-500', hoverBg: 'hover:bg-red-600' },
  gray: { bg: 'bg-gray-500', hoverBg: 'hover:bg-gray-600' },
};

// Helper function to check if node is configurable
function isConfigurableNode(node: Node | null): boolean {
  if (!node) return false;
  return node.type === 'start' || node.type === 'intent' || node.type === 'action';
}

// Helper type for exported story step
type StoryStep = {
  node: 'intent' | 'action';
  name: string;
};

function FlowContent() {
  const [nodes, setNodes] =
    useAtom<Node<StartNodeData | IntentNodeData | ActionNodeData | any>[]>(NodesAtom);
  const [edges, setEdges] = useAtom<Edge[]>(EdgesAtom);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const fabRef = useRef<HTMLDivElement>(null);
  const {
    setNodes: rfSetNodes,
    getNodes,
    getEdges,
    addNodes,
    screenToFlowPosition,
    getNode,
  } = useReactFlow();

  const [definedActions, setDefinedActions] = useState<ActionDefinition[]>(mockDefinedActions);
  const [intents, setIntents] = useState<IntentDefinition[]>(mockIntents);
  const [isLoading, setLoading] = useAtom(isLoadingAtom);
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      start: StartNode,
      intent: IntentNode,
      action: ActionNode,
      end: EndNode,
    }),
    []
  );

  // --- Callbacks (onNodesChange, onEdgesChange, onConnect - unchanged) ---
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, ...defaultEdgeOptions }, eds)),
    [setEdges]
  );

  // --- Node Update Callbacks (updateStartNode, updateIntentNode, updateActionNode - unchanged) ---
  // Generic update function
  const updateNode = useCallback(
    <T extends StartNodeData | IntentNodeData | ActionNodeData>(
      nodeId: string,
      nodeType: string,
      updateData: Partial<T>
    ) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId && node.type === nodeType
            ? { ...node, data: { ...node.data, ...updateData } }
            : node
        )
      );

      setSelectedNode((prev) =>
        prev && prev.id === nodeId && prev.type === nodeType
          ? { ...prev, data: { ...prev.data, ...updateData } }
          : prev
      );
    },
    [setNodes, setSelectedNode]
  );

  // Start node updater
  const updateStartNode = useCallback(
    (nodeId: string, newStoryName: string) => {
      updateNode(nodeId, 'start', {
        label: newStoryName,
        storyName: newStoryName,
      });
    },
    [updateNode]
  );

  // Intent node updater
  const updateIntentNode = useCallback(
    (nodeId: string, newIntentId: string, newExamples?: string[]) => {
      const intentDefinition = intents.find((i) => i.id === newIntentId);
      const finalExamples = newExamples ?? intentDefinition?.examples ?? [];

      updateNode(nodeId, 'intent', {
        intentId: newIntentId,
        examples: finalExamples,
      });

      if (newExamples !== undefined) {
        setIntents((prevIntents) => {
          const intentIndex = prevIntents.findIndex((intent) => intent.id === newIntentId);
          if (intentIndex > -1) {
            const updatedIntents = [...prevIntents];
            updatedIntents[intentIndex] = {
              ...updatedIntents[intentIndex],
              examples: finalExamples,
            };
            console.log('Updated intent examples:', updatedIntents[intentIndex]);

            return updatedIntents;
          } else {
            console.warn(`Intent definition ID "${newIntentId}" not found during edit save.`);
            return prevIntents;
          }
        });
      }
    },
    [updateNode, intents, setIntents]
  );

  // Action node updater
  const updateActionNode = useCallback(
    (nodeId: string, actionData: Partial<ActionNodeData>) => {
      const nodeToUpdate = getNode(nodeId);
      if (!nodeToUpdate || nodeToUpdate.type !== 'action') return;

      const actionDefinition = definedActions.find((a) => a.name === actionData.name);
      const isChangeAction = actionData.name && Object.keys(actionData).length === 1;

      let fullActionData: ActionNodeData;
      if (isChangeAction && actionDefinition) {
        fullActionData = { ...actionDefinition };
      } else {
        fullActionData = {
          ...(actionDefinition || {}),
          ...actionData,
          title:
            actionData.title || actionDefinition?.title || actionData.name || 'Untitled Action',
          name: actionData.name || actionDefinition?.name || `action_${nodeId.slice(0, 4)}`,
          value: actionData.value ?? actionDefinition?.value ?? '',
          valueType: actionData.valueType || actionDefinition?.valueType || 'text',
        };
      }

      updateNode(nodeId, 'action', fullActionData);

      if (!isChangeAction && fullActionData.name) {
        setDefinedActions((prevActions) => {
          const index = prevActions.findIndex((a) => a.name === fullActionData.name);
          if (index > -1) {
            const updated = [...prevActions];
            const existingId = updated[index].id;
            updated[index] = { ...fullActionData, id: existingId };
            return updated;
          } else {
            console.warn(`Action definition "${fullActionData.name}" not found. Adding new.`);
            return [...prevActions, fullActionData];
          }
        });
      }
    },
    [getNode, definedActions, setDefinedActions, updateNode]
  );

  // --- onSelectionChange, clearSelectionAndCloseSidebar, getCenterPosition (unchanged) ---
  const onSelectionChange = useCallback(({ nodes: selectedNodes }: OnSelectionChangeParams) => {
    const newSelectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
    setSelectedNode(newSelectedNode);
    setIsFabMenuOpen(false);
    // Close sidebar if no configurable node is selected
    if (!newSelectedNode || !isConfigurableNode(newSelectedNode)) {
      setIsSidebarOpen(false);
    }
  }, []);
  const clearSelectionAndCloseSidebar = useCallback(() => {
    setSelectedNode(null);
    setIsFabMenuOpen(false);
    setIsSidebarOpen(false);
    rfSetNodes(getNodes().map((node) => ({ ...node, selected: false })));
  }, [rfSetNodes, getNodes]);

  const getCenterPosition = useCallback((): XYPosition => {
    const fp = document.querySelector('.react-flow__pane');
    if (fp) {
      const b = fp.getBoundingClientRect();
      return screenToFlowPosition({ x: b.width / 2 - 75, y: b.height / 4 });
    }
    return { x: 200 + Math.random() * 100, y: 100 + Math.random() * 100 };
  }, [screenToFlowPosition]);

  // --- handleAddNode (Updated to allow multiple start nodes) ---
  const handleAddNode = useCallback(
    (type: 'intent' | 'action' | 'end' | 'start') => {
      const position = getCenterPosition();
      let newNodeData: any = {};

      if (type === 'start') {
        // REMOVED the check for existing start node
        newNodeData = { storyName: `New Story ${getId().slice(-4)}` };
      } else if (type === 'intent') {
        const defaultIntent = intents[0] || {
          id: 'intent_default',
          label: 'Default Intent',
          examples: [],
        };
        newNodeData = { intentId: defaultIntent.id, examples: defaultIntent.examples || [] };
      } else if (type === 'action') {
        const defaultAction = definedActions[0] || {
          title: 'New Action',
          name: 'new_action',
          value: 'Configure me...',
          valueType: 'text',
        };
        newNodeData = { ...defaultAction };
      } else if (type === 'end') {
        newNodeData = {};
      }

      const newNode: Node = { id: getId(), type, position, data: newNodeData };
      addNodes(newNode);
      setIsFabMenuOpen(false);
    },
    // Removed getNodes from dependency as it's not used here anymore for the check
    [addNodes, getCenterPosition, definedActions, intents]
  );

  // --- Add/Define Callbacks (handleAddNewActionDefinition, handleAddNewIntentDefinition - unchanged) ---
  const handleAddNewActionDefinition = useCallback(
    (newAction: ActionDefinition) => {
      setDefinedActions((prev) => [...prev, newAction]);
      // console.log('Added new action definition:', newAction);
    },
    [setDefinedActions]
  );
  const handleAddNewIntentDefinition = useCallback(
    (newIntent: IntentDefinition) => {
      setIntents((prev) => {
        if (prev.some((intent) => intent.id === newIntent.id)) {
          alert(`Intent ID "${newIntent.id}" already exists.`);
          return prev;
        }
        return [...prev, newIntent];
      });
      // console.log('Added new intent definition:', newIntent);
    },
    [setIntents]
  );
  const toggleFabMenu = useCallback(() => {
    setIsFabMenuOpen((prev) => !prev);
  }, []);

  // --- Export Flow Data (Unchanged - already handles multiple start nodes) ---
  const exportFlowData = useCallback(async () => {
    setLoading(true); // Set loading to true immediately when starting the process

    const allNodes = getNodes();
    const allEdges = getEdges();

    // 1. Format Intents
    const formattedIntents = intents.map((intent) => ({
      name: intent.id,
      examples: intent.examples || [],
      entities: [],
    }));

    // 2. Format Actions
    const formattedActions = definedActions.map((action) => {
      let type: 'text' | 'action' | 'button' = 'text';
      let value: any = undefined;
      if (action.valueType === 'function' || action.name.startsWith('action_')) {
        type = 'action';
      } else if (action.name.startsWith('utter_')) {
        if (action.valueType === 'text') {
          try {
            const parsedValue = JSON.parse(action.value);
            if (
              Array.isArray(parsedValue) &&
              parsedValue.every(
                (item) =>
                  typeof item === 'object' && item !== null && 'title' in item && 'payload' in item
              )
            ) {
              type = 'button';
              value = parsedValue;
            } else {
              type = 'text';
              value = action.value;
            }
          } catch (e) {
            type = 'text';
            value = action.value;
          }
        } else {
          type = 'text';
          value = action.value;
        }
      } else {
        type = 'text';
        value = action.value;
      }
      const formattedAction: any = { type, name: action.name };
      if (value !== undefined && (type === 'text' || type === 'button')) {
        formattedAction.value = value;
      }
      return formattedAction;
    });

    // 3. Generate Stories (iterates through all start nodes)
    const stories: { name: string; steps: StoryStep[] }[] = [];
    const startNodes = allNodes.filter((node) => node.type === 'start');
    if (startNodes.length === 0) {
      console.warn('No Start Nodes found.');
    }

    startNodes.forEach((startNode) => {
      const storyId = startNode.data?.storyId || `Story_${startNode.id}`;
      const steps: StoryStep[] = [];
      const visitedInPath = new Set<string>();
      let currentNodeId: string | null = startNode.id;
      while (currentNodeId) {
        if (visitedInPath.has(currentNodeId)) {
          console.warn(`Loop detected in story '${storyId}' at ${currentNodeId}.`);
          break;
        }
        visitedInPath.add(currentNodeId);
        const currentNode = allNodes.find((n) => n.id === currentNodeId);
        if (!currentNode) break;
        const outgoingEdge = allEdges.find((edge) => edge.source === currentNodeId);
        if (!outgoingEdge) break;
        const nextNodeId = outgoingEdge.target;
        const nextNode = allNodes.find((n) => n.id === nextNodeId);
        if (!nextNode || nextNode.type === 'end') break;
        if (nextNode.type === 'intent' && nextNode.data?.intentId) {
          steps.push({ node: 'intent', name: nextNode.data.intentId });
        } else if (nextNode.type === 'action' && nextNode.data?.name) {
          steps.push({ node: 'action', name: nextNode.data.name });
        } else {
          console.warn(`Skipping unsupported node type '${nextNode.type}' in story '${storyId}'.`);
        }
        currentNodeId = nextNodeId;
      }
      stories.push({ name: storyId, steps });
    });

    // 4. Assemble Final JSON
    const exportData = { intents: formattedIntents, actions: formattedActions, stories: stories };

    console.log('Exported Data:', JSON.stringify(exportData, null, 2));

    // Use `toast.promise` to show loading and handle success/failure
    await toast
      .promise(
        fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/train`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(exportData),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error('Failed to send data to the API');
            }
            return response.json();
          })
          .then((data) => {
            console.log('✅ API response:', data);
            return data;
          })
          .catch((error) => {
            console.error('❌ Error sending data to API:', error);
            throw error;
          }),
        {
          pending: 'Building Bot...',
          success: 'Bot Builded Successfully!',
          error: 'Failed to Build Bot',
        },
        { autoClose: 2000 }
      )
      .finally(() => {
        setLoading(false);
      });
  }, [intents, definedActions, getNodes, getEdges]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsFabMenuOpen(false);
      }
    };
    if (isFabMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFabMenuOpen]);

  const saveNodesToLocalStorage = useDebouncedCallback((nodes) => {
    localStorage.setItem('nodes', JSON.stringify(nodes));
    console.log('Saving nodes to localStorage:', nodes);
  }, 1000);
  useEffect(() => {
    saveNodesToLocalStorage(nodes);
  }, [nodes, saveNodesToLocalStorage]);

  // Debounced function for edges
  const saveEdgesToLocalStorage = useDebouncedCallback((edges) => {
    localStorage.setItem('edges', JSON.stringify(edges));
    console.log('Saving edges to localStorage:', edges);
  }, 1000);
  useEffect(() => {
    saveEdgesToLocalStorage(edges);
  }, [edges, saveEdgesToLocalStorage]);

  // --- Animation Variants (unchanged) ---
  const fabMenuVariants = {
    hidden: { opacity: 0, y: 20, transition: { staggerChildren: 0.05, staggerDirection: -1 } },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
    exit: {
      opacity: 0,
      y: 10,
      transition: { duration: 0.1, staggerChildren: 0.05, staggerDirection: -1 },
    },
  };
  const fabItemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.9, transition: { duration: 0.1 } },
  };
  const sidebarVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: 'tween', duration: 0.3, ease: 'easeOut' } },
    exit: { x: '100%', opacity: 0, transition: { type: 'tween', duration: 0.2, ease: 'easeIn' } },
  };

  // chatbot things.........................................................
  const handleNewMessage = (message: string) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };
  const onBotResponse = (response: string) => {
    const botMessage = { role: 'assistant', content: response };
    setMessages((prevMessages) => [...prevMessages, botMessage]);
  };

  // --- Render (unchanged) ---
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gray-50">
      <div className="flex-grow h-full relative">
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
          fitView
          className="bg-gradient-to-br from-indigo-50 via-white to-blue-50"
          deleteKeyCode={['Backspace', 'Delete']}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
        >
          <Controls /> <Background />
        </ReactFlow>
        <div className="absolute top-4 right-6 z-10 flex gap-3">
          {isLoading ? (
            <motion.button
              className="flex items-center text-center gap-1 justify-center px-4 py-2 bg-blue-600/70 text-white rounded-md shadow-md  text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled
            >
              Building Bot... <Bot />
            </motion.button>
          ) : (
            <motion.button
              onClick={exportFlowData}
              className="flex items-center text-center gap-1 justify-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Build Bot <Bot />
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {' '}
          {selectedNode && isConfigurableNode(selectedNode) && !isSidebarOpen && (
            <motion.div
              className="absolute bottom-24 right-6 z-30"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {' '}
              <motion.button
                onClick={() => {
                  setIsSidebarOpen(true);
                }}
                className="flex items-center justify-center w-14 h-14 bg-gray-700 text-white rounded-full shadow-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out"
                title="Configure Node"
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
              >
                {' '}
                <Settings size={28} />{' '}
              </motion.button>{' '}
            </motion.div>
          )}{' '}
        </AnimatePresence>
        <div ref={fabRef} className="absolute bottom-6 right-6 z-20">
          {' '}
          <AnimatePresence>
            {' '}
            {isFabMenuOpen && (
              <motion.div
                className="flex flex-col items-end space-y-3 mb-3"
                variants={fabMenuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {' '}
                {[
                  { type: 'start', Icon: PlayCircle, color: 'purple', title: 'Add Start Node' },
                  { type: 'intent', Icon: Bot, color: 'blue', title: 'Add Intent Node' },
                  { type: 'action', Icon: Zap, color: 'green', title: 'Add Action Node' },
                  { type: 'end', Icon: FlagOff, color: 'red', title: 'Add End Node' },
                ].map((nodeInfo) => {
                  const bgColor = colorClasses[nodeInfo.color]?.bg || colorClasses['gray'].bg;
                  const hoverBgColor =
                    colorClasses[nodeInfo.color]?.hoverBg || colorClasses['gray'].hoverBg;
                  return (
                    <motion.button
                      key={nodeInfo.type}
                      variants={fabItemVariants}
                      onClick={() => handleAddNode(nodeInfo.type as any)}
                      className={`flex items-center justify-center w-12 h-12 ${bgColor} text-white rounded-full shadow-lg ${hoverBgColor} transition-colors duration-200 ease-in-out transform hover:scale-110`}
                      title={nodeInfo.title}
                    >
                      {' '}
                      <nodeInfo.Icon size={22} />{' '}
                    </motion.button>
                  );
                })}{' '}
              </motion.div>
            )}{' '}
          </AnimatePresence>{' '}
          <motion.button
            onClick={toggleFabMenu}
            className="flex items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 ease-in-out"
            title={isFabMenuOpen ? 'Close Menu' : 'Add Node'}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{ rotate: isFabMenuOpen ? 135 : 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 15 }}
          >
            {' '}
            <Plus size={28} />{' '}
          </motion.button>{' '}
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <ChatBotWidget
            callApi={async (message) => {
              const data = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/predict`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  text: message,
                  sender_id: 'user1',
                  model_name: 'default_model.tar.gz',
                }),
              });
              // console.log('API response:', data);

              const res = await data.json();
              return res.response[0].text;
            }}
            handleNewMessage={handleNewMessage}
            onBotResponse={onBotResponse}
            messages={messages}
            primaryColor="#4F46E5"
          />
        </Suspense>
      </div>
      <AnimatePresence>
        {' '}
        {isSidebarOpen && selectedNode && (
          <motion.div
            key={selectedNode ? 'sidebar-visible' : 'sidebar-hidden'}
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-72 h-full flex-shrink-0 bg-white shadow-lg border-l border-gray-200 flex flex-col"
          >
            {' '}
            <Sidebar
              selectedNode={selectedNode}
              intents={intents}
              definedActions={definedActions}
              onUpdateStartNode={updateStartNode}
              onUpdateIntent={updateIntentNode}
              onUpdateAction={updateActionNode}
              onAddNewIntentDefinition={handleAddNewIntentDefinition}
              onAddNewActionDefinition={handleAddNewActionDefinition}
              onClose={clearSelectionAndCloseSidebar}
            />{' '}
          </motion.div>
        )}{' '}
      </AnimatePresence>
    </div>
  );
}

function Flow() {
  return (
    <ReactFlowProvider>
      <FlowContent />
    </ReactFlowProvider>
  );
}

export default Flow;
