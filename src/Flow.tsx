import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  DefaultEdgeOptions,
  NodeTypes,
  OnSelectionChangeParams,
  useReactFlow,
  ReactFlowProvider,
  XYPosition,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Bot, Zap, FlagOff, Plus, Settings, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// import { saveAs } from 'file-saver';
import StartNode from './components/nodes/StartNode';
import IntentNode from './components/nodes/IntentNode';
import ActionNode from './components/nodes/ActionNode';
import EndNode from './components/nodes/EndNode';
import Sidebar from './components/Sidebar';
import { ActionDefinition } from './types';
import ChatBotWidget from './components/ChatBotWidget';

// Initial node in Canvas
const initialNodes: Node[] = [
  { id: '0', type: 'start', position: { x: 50, y: 200 }, data: {} },
  {
    id: '1',
    type: 'intent',
    position: { x: 300, y: 200 },
    data: { intentId: 'intent_greet', examples: ['hello', 'hi', 'hey'] },
  },
  {
    id: '2',
    type: 'action',
    position: { x: 550, y: 200 },
    data: {
      title: 'Send Greeting', // Added title
      name: 'utter_sendmessage',
      value: 'Hello! How can I help you today?',
      valueType: 'text', // Added valueType
    },
  },
  { id: '3', type: 'end', position: { x: 800, y: 200 }, data: {} },
];
//  Initial edges in canvas
const initialEdges: Edge[] = [
  {
    id: 'e0-1',
    source: '0',
    target: '1',
    animated: true,
    style: { strokeWidth: 2 },
  },
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
    style: { strokeWidth: 2 },
  },
  { id: 'e2-3', source: '2', target: '3', style: { strokeWidth: 2 } },
];

const defaultEdgeOptions: DefaultEdgeOptions = {
  style: { stroke: '#9ca3af' },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#9ca3af',
    width: 20,
    height: 20,
  },
};

const getId = () => `dndnode_${+new Date()}`;

function FlowContent() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
  const { setNodes: rfSetNodes, getNodes, addNodes, screenToFlowPosition } = useReactFlow();
  // console.log("Nodes in flows,", nodes);

  // State for defined actions (could come from API/storage later)
  const [definedActions, setDefinedActions] = useState<ActionDefinition[]>([
    {
      // action_id: '1',
      title: 'Send Message',
      name: 'utter_sendmessage',
      value: 'Default message text...',
      valueType: 'text',
    },
    {
      title: 'API Call',
      name: 'ApiCall',
      value: 'https://api.example.com/data',
      valueType: 'text',
    },
    {
      title: 'Transfer to Agent',
      name: 'TransferToAgent',
      value: 'support_queue',
      valueType: 'text',
    },
    {
      title: 'Update Context',
      name: 'UpdateContext',
      value: '{ "user_status": "verified" }',
      valueType: 'text',
    },
    {
      title: 'Get User Data',
      name: 'GetUserDataFunc',
      value: 'getUserData',
      valueType: 'function',
    },
  ]);

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      start: StartNode,
      intent: IntentNode,
      action: ActionNode,
      end: EndNode,
    }),
    []
  );

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
      setEdges((eds) => addEdge({ ...connection, animated: true, style: { strokeWidth: 2 } }, eds)),
    [setEdges]
  );
  // Function to find nodes and edges between start and end
  const getFlowDataBetweenStartAndEnd = useCallback(() => {
    // Find start and end nodes
    const startNode = nodes.find((node) => node.type === 'start');
    const endNode = nodes.find((node) => node.type === 'end');

    if (!startNode || !endNode) {
      console.error('Start or End node not found');
      return { nodes: [], edges: [] };
    }

    // Collect nodes and edges in the path
    const visitedNodes = new Set<string>([startNode.id]);
    const flowNodes = [startNode];
    const flowEdges: Edge[] = [];

    // Function to traverse from a given node
    const traverse = (currentNodeId: string) => {
      // Get outgoing edges
      const outgoingEdges = edges.filter((edge) => edge.source === currentNodeId);
      for (const edge of outgoingEdges) {
        if (!visitedNodes.has(edge.target)) {
          visitedNodes.add(edge.target);
          const targetNode = nodes.find((node) => node.id === edge.target);
          if (targetNode) {
            flowNodes.push(targetNode);
            flowEdges.push(edge);
            // Stop if we reach the end node
            if (targetNode.type !== 'end') {
              traverse(targetNode.id);
            }
          }
        }
      }
    };

    traverse(startNode.id);

    // Ensure end node is included if reached
    if (visitedNodes.has(endNode.id)) {
      return { nodes: flowNodes, edges: flowEdges };
    } else {
      console.warn('No valid path found between start and end');
      return { nodes: [startNode], edges: [] };
    }
  }, [nodes, edges]);

  // Function to export data as JSON
  const exportFlowData = useCallback(() => {
    const { nodes: flowNodes, edges: flowEdges } = getFlowDataBetweenStartAndEnd();
    console.log('Flow nodes and edges for export:', flowNodes, flowEdges);

    // Extract intents
    const intents = flowNodes
      .filter((node) => node.type === 'intent')
      .map((node) => {
        const intentObj = {
          name: node.data.intentId || `intent_${node.id}`,
          examples: node.data.examples || [],
          entities: [],
        };
        console.log('Intent node data:', node.data);

        return intentObj;
      });

    // Extract actions
    const actions = flowNodes
      .filter((node) => node.type === 'action')
      .map((node) => ({
        type: node.data.valueType || 'text',
        name: node.data.name || `action_${node.id}`,
        value: node.data.value || '',
      }));

    // Build stories
    const stories = [];
    const startNode = flowNodes.find((node) => node.type === 'start');
    if (startNode) {
      const storySteps = [];
      let currentNode = startNode;

      // Traverse the flow using edges
      while (currentNode && currentNode.type !== 'end') {
        // Find the outgoing edge
        const outgoingEdge = flowEdges.find((edge) => edge.source === currentNode.id);
        if (!outgoingEdge) break; // No further connection

        const nextNode = flowNodes.find((node) => node.id === outgoingEdge.target);
        if (!nextNode) break; // No target node

        // Add step based on node type
        if (nextNode.type === 'intent') {
          storySteps.push({
            node: 'intent',
            name: nextNode.data.intentId || `intent_${nextNode.id}`,
          });
        } else if (nextNode.type === 'action') {
          storySteps.push({
            node: 'action',
            name: nextNode.data.name || `action_${nextNode.id}`,
          });
        }

        currentNode = nextNode;
      }

      // Add story if there are valid steps
      if (storySteps.length > 0) {
        stories.push({
          name: startNode.data.storyName || 'greeting_flow', // Use storyName from start node or default
          steps: storySteps,
        });
      }
    }

    // Create JSON object
    const exportData = {
      intents,
      actions,
      stories,
    };
    // Send data to API
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
      })
      .catch((error) => {
        console.error('❌ Error sending data to API:', error);
      });
  }, [getFlowDataBetweenStartAndEnd]);

  const updateIntentNode = useCallback(
    (nodeId: string, updatedData: Partial<Node['data']>) => {
      console.log('Updating intent node with ID:', nodeId, 'Data:', updatedData);

      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...updatedData } } // Merge new data with existing data
            : node
        )
      );
      setSelectedNode((prev) =>
        prev && prev.id === nodeId
          ? { ...prev, data: { ...prev.data, ...updatedData } } // Update selected node state
          : prev
      );
    },
    [setNodes]
  );

  // Updated to handle the full ActionDefinition
  const updateActionNode = useCallback(
    (nodeId: string, actionData: Omit<ActionDefinition, 'id'>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...actionData } } : node
        )
      );
      // Update selected node state if it's the one being changed
      setSelectedNode((prev) =>
        prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, ...actionData } } : prev
      );
    },
    [setNodes]
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      const newSelectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
      setSelectedNode(newSelectedNode);
      setIsFabMenuOpen(false);
      // Open sidebar automatically if a configurable node is selected and sidebar isn't already open
      if (
        newSelectedNode &&
        (newSelectedNode.type === 'intent' || newSelectedNode.type === 'action') &&
        !isSidebarOpen
      ) {
        // setIsSidebarOpen(true); // Optional: auto-open sidebar on selection
      }
    },
    [isSidebarOpen]
  ); // Added isSidebarOpen dependency

  const clearSelectionAndCloseFab = useCallback(() => {
    const currentlySelectedNodeId = selectedNode?.id;
    setSelectedNode(null);
    setIsFabMenuOpen(false);
    setIsSidebarOpen(false);
    if (currentlySelectedNodeId) {
      rfSetNodes(
        getNodes().map((node) =>
          node.id === currentlySelectedNodeId || node.selected ? { ...node, selected: false } : node
        )
      );
    }
  }, [selectedNode, rfSetNodes, getNodes]);

  const getCenterPosition = useCallback((): XYPosition => {
    const flowPane = document.querySelector('.react-flow__pane');
    if (flowPane) {
      const bounds = flowPane.getBoundingClientRect();
      return screenToFlowPosition({
        x: bounds.width / 2,
        y: bounds.height / 3,
      });
    }
    return { x: 200 + Math.random() * 50, y: 100 + Math.random() * 50 };
  }, [screenToFlowPosition]);

  const handleAddNode = useCallback(
    (type: 'intent' | 'action' | 'end' | 'start') => {
      const position = getCenterPosition();
      const currentDateTime = new Date().toISOString(); // Get current date and time in ISO format
      let newNodeData: any = {}; // Use 'any' temporarily or define a broader type
      if (type === 'start') {
        newNodeData = { storyName: `story_${currentDateTime}` }; // Default story name
      } else if (type === 'intent') {
        newNodeData = { intentId: 'intent_greet', examples: [] }; // Default intent
      } else if (type === 'action') {
        // Use the first defined action as default or a generic placeholder
        const defaultAction = definedActions[0] || {
          title: 'New Action',
          name: 'NewAction',
          value: 'Configure me...',
          valueType: 'text',
        };
        newNodeData = { ...defaultAction };
      }
      // Start and End nodes have empty data initially

      const newNode: Node = { id: getId(), type, position, data: newNodeData };
      addNodes(newNode);
      setIsFabMenuOpen(false);
    },
    [addNodes, getCenterPosition, definedActions] // Add definedActions dependency
  );

  // Callback to add a newly defined action type
  const handleAddNewActionDefinition = useCallback(
    (newAction: ActionDefinition) => {
      setDefinedActions((prev) => [...prev, newAction]);
      // In a real app, you'd likely save this to a backend/storage here
      console.log('Added new action definition:', newAction);
    },
    [setDefinedActions]
  );

  const toggleFabMenu = () => {
    setSelectedNode(null);
    setIsFabMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsFabMenuOpen(false);
      }
      // Consider closing sidebar on outside click too, if desired
      // const sidebarElement = document.querySelector('.sidebar-container'); // Add a class to sidebar div
      // if (sidebarElement && !sidebarElement.contains(event.target as Node) && isSidebarOpen) {
      //    setIsSidebarOpen(false);
      // }
    };
    if (isFabMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFabMenuOpen]); // Removed isSidebarOpen dependency for this effect

  const fabMenuVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.1,
      },
    },
    exit: { opacity: 0, y: 10, transition: { duration: 0.1 } },
  };

  const fabItemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  const sidebarVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: 'tween', duration: 0.3, ease: 'easeOut' },
    },
    exit: {
      x: '100%',
      opacity: 0,
      transition: { type: 'tween', duration: 0.2, ease: 'easeIn' },
    },
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Main Flow Area */}
      <div className="flex-grow h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          onPaneClick={clearSelectionAndCloseFab}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <Controls />
          <Background />
        </ReactFlow>
        {/* Export Button */}
        <div className="absolute top-4 right-6 z-30">
          <motion.button
            onClick={exportFlowData}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Built Bot
          </motion.button>
        </div>
        {/* Floating Configuration Button */}
        {selectedNode &&
          (selectedNode.type === 'intent' ||
            selectedNode.type === 'action' ||
            selectedNode.type === 'start') &&
          !isSidebarOpen && (
            <div className="absolute bottom-24 right-6 z-30">
              <motion.button
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center justify-center w-14 h-14 bg-gray-700 text-white rounded-full shadow-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out"
                title="Configure Node"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings size={28} />
              </motion.button>
            </div>
          )}

        {/* Floating Action Button Menu */}
        <div ref={fabRef} className="absolute bottom-6 right-6 z-20">
          <AnimatePresence>
            {isFabMenuOpen && (
              <motion.div
                className="flex flex-col items-end space-y-2 mb-2"
                variants={fabMenuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.button
                  variants={fabItemVariants}
                  onClick={() => handleAddNode('start')}
                  className="flex items-center justify-center w-12 h-12 bg-purple-500 text-white rounded-full shadow-lg hover:bg-purple-600 transition-colors duration-200 ease-in-out transform hover:scale-105"
                  title="Add Start Node"
                >
                  <PlayCircle size={20} />
                </motion.button>
                <motion.button
                  variants={fabItemVariants}
                  onClick={() => handleAddNode('intent')}
                  className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-200 ease-in-out transform hover:scale-105"
                  title="Add Intent Node"
                >
                  <Bot size={20} />
                </motion.button>
                <motion.button
                  variants={fabItemVariants}
                  onClick={() => handleAddNode('action')}
                  className="flex items-center justify-center w-12 h-12 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-colors duration-200 ease-in-out transform hover:scale-105"
                  title="Add Action Node"
                >
                  <Zap size={20} />
                </motion.button>
                <motion.button
                  variants={fabItemVariants}
                  onClick={() => handleAddNode('end')}
                  className="flex items-center justify-center w-12 h-12 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors duration-200 ease-in-out transform hover:scale-105"
                  title="Add End Node"
                >
                  <FlagOff size={20} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main FAB */}
          <motion.button
            onClick={toggleFabMenu}
            className="flex items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out"
            title={isFabMenuOpen ? 'Close Menu' : 'Add Node'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ rotate: isFabMenuOpen ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Plus size={28} />
          </motion.button>
        </div>
      </div>

      {/* Animated Sidebar */}
      <AnimatePresence>
        {isSidebarOpen &&
          selectedNode && ( // Ensure selectedNode exists before rendering Sidebar
            <motion.div
              key="sidebar"
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-72 h-full flex-shrink-0 sidebar-container" // Added class for potential outside click handling
            >
              <Sidebar
                selectedNode={selectedNode} // Pass the selected node
                definedActions={definedActions} // Pass defined actions
                onUpdateIntent={updateIntentNode}
                onUpdateAction={updateActionNode}
                onAddNewActionDefinition={handleAddNewActionDefinition} // Pass handler for new definitions
                onClose={() => setIsSidebarOpen(false)}
              />
            </motion.div>
          )}
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
