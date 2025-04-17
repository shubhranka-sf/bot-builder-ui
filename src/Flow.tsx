// File: Flow.tsx

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
<<<<<<< Updated upstream
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Bot, Zap, FlagOff, Plus, X, Settings, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import StartNode from './components/nodes/StartNode';
import IntentNode from './components/nodes/IntentNode';
import ActionNode from './components/nodes/ActionNode';
import EndNode from './components/nodes/EndNode';
import Sidebar from './components/Sidebar';
import { IntentDefinition, ActionDefinition } from './types';

const initialNodes: Node[] = [
  { id: '0', type: 'start', position: { x: 50, y: 200 }, data: {} },
  { id: '1', type: 'intent', position: { x: 300, y: 200 }, data: { intentId: 'intent_greet', examples: ['hello', 'hi', 'hey'] } },
  {
    id: '2',
    type: 'action',
    position: { x: 550, y: 200 },
    data: {
      title: 'Send Greeting', // Added title
      name: 'SendMessage',
      value: 'Hello! How can I help you today?',
      valueType: 'text' // Added valueType
    }
  },
  { id: '3', type: 'end', position: { x: 800, y: 200 }, data: {} },
];

const initialEdges: Edge[] = [
  { id: 'e0-1', source: '0', target: '1', animated: true, style: { strokeWidth: 2 } },
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { strokeWidth: 2 } },
  { id: 'e2-3', source: '2', target: '3', style: { strokeWidth: 2 } },
];

const defaultEdgeOptions: DefaultEdgeOptions = {
  style: { stroke: '#9ca3af' },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af', width: 20, height: 20 },
};

const getId = () => `dndnode_${+new Date()}`;
=======
} from "reactflow";
import "reactflow/dist/style.css";
import { Bot, Zap, FlagOff, Plus, Settings, PlayCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { saveAs } from 'file-saver';

import StartNode from "./components/nodes/StartNode";
import IntentNode from "./components/nodes/IntentNode";
import ActionNode from "./components/nodes/ActionNode";
import EndNode from "./components/nodes/EndNode";
import Sidebar from "./components/Sidebar";
import { ActionDefinition } from "./types";
import {
  initialNodes,
  initialEdges,
  mockDefinedActions, // Use mock data
  defaultEdgeOptions,
  getId,
} from "./data/mockData"; // Import from centralized file
>>>>>>> Stashed changes

function FlowContent() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
<<<<<<< Updated upstream
  const { setNodes: rfSetNodes, getNodes, addNodes, screenToFlowPosition } = useReactFlow();

  // State for defined actions (could come from API/storage later)
  const [definedActions, setDefinedActions] = useState<ActionDefinition[]>([
    { title: 'Send Message', name: 'SendMessage', value: 'Default message text...', valueType: 'text' },
    { title: 'API Call', name: 'ApiCall', value: 'https://api.example.com/data', valueType: 'text' },
    { title: 'Transfer to Agent', name: 'TransferToAgent', value: 'support_queue', valueType: 'text' },
    { title: 'Update Context', name: 'UpdateContext', value: '{ "user_status": "verified" }', valueType: 'text' },
    { title: 'Get User Data', name: 'GetUserDataFunc', value: 'getUserData', valueType: 'function' },
  ]);
=======
  const {
    setNodes: rfSetNodes, // Renamed for clarity if needed, though not strictly necessary here
    getNodes,
    addNodes,
    screenToFlowPosition,
  } = useReactFlow();

  // State for defined actions, initialized from mock data
  const [definedActions, setDefinedActions] = useState<ActionDefinition[]>(mockDefinedActions);
>>>>>>> Stashed changes

  const nodeTypes: NodeTypes = useMemo(() => ({
    start: StartNode,
    intent: IntentNode,
    action: ActionNode,
    end: EndNode,
  }), []);

<<<<<<< Updated upstream
  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
=======
  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

>>>>>>> Stashed changes
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: true, style: { strokeWidth: 2 } }, eds)),
    [setEdges]
  );
<<<<<<< Updated upstream

  const updateIntentNode = useCallback((nodeId: string, newIntentId: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, intentId: newIntentId } } : node
      )
    );
    // Update selected node state if it's the one being changed
    setSelectedNode((prev) =>
      prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, intentId: newIntentId } } : prev
    );
  }, [setNodes]);
=======

  const getFlowDataBetweenStartAndEnd = useCallback(() => {
    const startNode = nodes.find((node) => node.type === "start");
    const endNode = nodes.find((node) => node.type === "end");

    if (!startNode) {
      console.error("Start node not found");
      // Return all nodes/edges if no start node? Or just empty? Adjust as needed.
      return { nodes: [], edges: [] };
    }

    // Collect nodes and edges reachable from the start node
    const visitedNodes = new Set<string>();
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    const queue: string[] = [startNode.id];

    while (queue.length > 0) {
        const currentNodeId = queue.shift()!;
        if (visitedNodes.has(currentNodeId)) continue;

        visitedNodes.add(currentNodeId);
        const currentNode = nodes.find(n => n.id === currentNodeId);
        if (!currentNode) continue;

        flowNodes.push(currentNode);

        // Find outgoing edges for the current node
        const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
        outgoingEdges.forEach(edge => {
            flowEdges.push(edge);
            if (!visitedNodes.has(edge.target)) {
                queue.push(edge.target);
            }
        });
    }

     // Optional: Check if the intended end node was reached if one exists
     if (endNode && !visitedNodes.has(endNode.id)) {
        console.warn("Defined End node was not reached in the traversal from Start.");
     } else if (!endNode) {
        console.warn("No End node found in the flow definition.");
     }

    return { nodes: flowNodes, edges: flowEdges };
  }, [nodes, edges]);

  const exportFlowData = useCallback(() => {
    const { nodes: flowNodes, edges: flowEdges } = getFlowDataBetweenStartAndEnd();

    if (flowNodes.length === 0 && nodes.length > 0) {
        alert("Could not find path from Start node. Please check connections.");
        return;
    }

    const exportData = {
      nodes: flowNodes.map(({ id, type, position, data, width, height }) => ({ // Include size if needed
        id,
        type,
        position,
        data,
        // Optional: width, height // Consider if needed for layout restoration
      })),
      edges: flowEdges.map(({ id, source, target, animated, style, markerEnd }) => ({
        id,
        source,
        target,
        // Optional: Include properties needed for reconstruction
        animated,
        style,
        markerEnd,
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    saveAs(blob, "flow-data.json");
  }, [getFlowDataBetweenStartAndEnd, nodes]); // Added nodes dependency

  const updateIntentNode = useCallback(
    (nodeId: string, newIntentId: string, newExamples?: string[]) => { // Allow updating examples too
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, intentId: newIntentId, examples: newExamples ?? node.data.examples } }
            : node
        )
      );
      setSelectedNode((prev) =>
        prev && prev.id === nodeId
          ? { ...prev, data: { ...prev.data, intentId: newIntentId, examples: newExamples ?? prev.data.examples } }
          : prev
      );
    },
    [setNodes] // Removed setSelectedNode dependency as it's derived
  );
>>>>>>> Stashed changes

  const updateActionNode = useCallback(
<<<<<<< Updated upstream
    (nodeId: string, actionData: Omit<ActionDefinition, 'id'>) => {
=======
    (nodeId: string, actionData: Partial<ActionDefinition>) => { // Allow partial updates
>>>>>>> Stashed changes
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...actionData } } : node
        )
      );
<<<<<<< Updated upstream
       // Update selected node state if it's the one being changed
      setSelectedNode((prev) =>
        prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, ...actionData } } : prev
=======
       setSelectedNode((prev) =>
        prev && prev.id === nodeId
          ? { ...prev, data: { ...prev.data, ...actionData } }
          : prev
>>>>>>> Stashed changes
      );
    },
    [setNodes] // Removed setSelectedNode dependency
  );

<<<<<<< Updated upstream
  const onSelectionChange = useCallback(({ nodes: selectedNodes }: OnSelectionChangeParams) => {
    const newSelectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
    setSelectedNode(newSelectedNode);
    setIsFabMenuOpen(false);
    // Open sidebar automatically if a configurable node is selected and sidebar isn't already open
    if (newSelectedNode && (newSelectedNode.type === 'intent' || newSelectedNode.type === 'action') && !isSidebarOpen) {
       // setIsSidebarOpen(true); // Optional: auto-open sidebar on selection
    }
  }, [isSidebarOpen]); // Added isSidebarOpen dependency
=======
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      const newSelectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
      setSelectedNode(newSelectedNode);
      setIsFabMenuOpen(false); // Close FAB on selection change
      // Keep sidebar open/closed state independent unless explicitly toggled
    },
    [] // Removed isSidebarOpen dependency
  );

  const clearSelectionAndCloseSidebar = useCallback(() => {
      const currentlySelectedNodeId = selectedNode?.id;
      setSelectedNode(null);
      setIsFabMenuOpen(false);
      setIsSidebarOpen(false); // Close sidebar on pane click

      if (currentlySelectedNodeId) {
          // Deselect nodes visually
          rfSetNodes(
              getNodes().map((node) =>
                  node.selected ? { ...node, selected: false } : node
              )
          );
      }
  }, [selectedNode, rfSetNodes, getNodes]); // Keep dependencies
>>>>>>> Stashed changes


  const getCenterPosition = useCallback((): XYPosition => {
    const flowPane = document.querySelector('.react-flow__pane');
    if (flowPane) {
      const bounds = flowPane.getBoundingClientRect();
<<<<<<< Updated upstream
      return screenToFlowPosition({ x: bounds.width / 2, y: bounds.height / 3 });
=======
      // Place new nodes slightly offset from center top
      return screenToFlowPosition({
        x: bounds.width / 2,
        y: bounds.height / 4, // Closer to top
      });
>>>>>>> Stashed changes
    }
    // Fallback position
    return { x: 200 + Math.random() * 100, y: 100 + Math.random() * 100 };
  }, [screenToFlowPosition]);

  const handleAddNode = useCallback(
    (type: 'intent' | 'action' | 'end' | 'start') => {
      const position = getCenterPosition();
<<<<<<< Updated upstream
      let newNodeData: any = {}; // Use 'any' temporarily or define a broader type
      if (type === 'intent') {
        newNodeData = { intentId: 'intent_greet' }; // Default intent
      } else if (type === 'action') {
        // Use the first defined action as default or a generic placeholder
        const defaultAction = definedActions[0] || { title: 'New Action', name: 'NewAction', value: 'Configure me...', valueType: 'text' };
=======
      let newNodeData: any = {};

      if (type === "intent") {
        newNodeData = { intentId: "intent_greet", examples: ["hello", "hi"] }; // Default intent
      } else if (type === "action") {
        const defaultAction = definedActions[0] || {
          title: "New Action", name: "new_action", value: "Configure me...", valueType: "text"
        };
>>>>>>> Stashed changes
        newNodeData = { ...defaultAction };
      }
      // Start and End nodes have empty data

      const newNode: Node = { id: getId(), type, position, data: newNodeData };
      addNodes(newNode);
      setIsFabMenuOpen(false);
    },
    [addNodes, getCenterPosition, definedActions]
  );

<<<<<<< Updated upstream
  // Callback to add a newly defined action type
  const handleAddNewActionDefinition = useCallback((newAction: ActionDefinition) => {
    setDefinedActions(prev => [...prev, newAction]);
    // In a real app, you'd likely save this to a backend/storage here
    console.log("Added new action definition:", newAction);
  }, [setDefinedActions]);


  const toggleFabMenu = () => { setSelectedNode(null); setIsFabMenuOpen((prev) => !prev);};
=======
  const handleAddNewActionDefinition = useCallback(
    (newAction: ActionDefinition) => {
      setDefinedActions((prev) => [...prev, newAction]);
      // Here you would typically also make an API call to save the new definition persistently
      console.log("Added new action definition:", newAction);
    },
    [setDefinedActions] // Keep dependency
  );

  const toggleFabMenu = () => {
    // If opening FAB, ensure no node is selected and sidebar is closed
    if (!isFabMenuOpen) {
        clearSelectionAndCloseSidebar();
    }
    setIsFabMenuOpen((prev) => !prev);
  };
>>>>>>> Stashed changes

  // Effect to close FAB menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsFabMenuOpen(false);
      }
    };
<<<<<<< Updated upstream
    if (isFabMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFabMenuOpen]); // Removed isSidebarOpen dependency for this effect
=======
    if (isFabMenuOpen) {
        document.addEventListener("mousedown", handleClickOutside);
    } else {
        document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFabMenuOpen]);
>>>>>>> Stashed changes

  // --- Animation Variants ---
  const fabMenuVariants = {
    hidden: { opacity: 0, y: 20, transition: { staggerChildren: 0.05, staggerDirection: -1 } },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
    exit: { opacity: 0, y: 10, transition: { duration: 0.1 } },
  };

  const fabItemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  };

  const sidebarVariants = {
<<<<<<< Updated upstream
    hidden: { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: 'tween', duration: 0.3, ease: 'easeOut' } },
    exit: { x: '100%', opacity: 0, transition: { type: 'tween', duration: 0.2, ease: 'easeIn' } },
=======
    hidden: { x: "100%", opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: "tween", duration: 0.3, ease: "easeOut" } },
    exit: { x: "100%", opacity: 0, transition: { type: "tween", duration: 0.2, ease: "easeIn" } },
>>>>>>> Stashed changes
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gray-50"> {/* Added base bg color */}
      {/* Main Flow Area */}
      <div className="flex-grow h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          onPaneClick={clearSelectionAndCloseSidebar} // Use updated handler
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          className="bg-gradient-to-br from-indigo-50 via-white to-blue-50" // Adjusted background
        >
          <Controls />
          <Background />
        </ReactFlow>

<<<<<<< Updated upstream
        {/* Floating Configuration Button */}
=======
        {/* Top Bar Buttons */}
         <div className="absolute top-4 right-6 z-10 flex gap-3">
          {/* Export Button */}
           <motion.button
             onClick={exportFlowData}
             className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out text-sm font-medium"
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
           >
             Export Flow
           </motion.button>
           {/* Add more top bar buttons here if needed */}
         </div>


        {/* Floating Configuration Button - Only shows if node selected AND sidebar closed */}
        <AnimatePresence>
>>>>>>> Stashed changes
        {selectedNode &&
          (selectedNode.type === 'intent' || selectedNode.type === 'action') &&
          !isSidebarOpen && (
            <motion.div
              className="absolute bottom-24 right-6 z-30"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <motion.button
                onClick={() => setIsSidebarOpen(true)} // Open sidebar on click
                className="flex items-center justify-center w-14 h-14 bg-gray-700 text-white rounded-full shadow-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out"
                title="Configure Node"
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
              >
                <Settings size={28} />
              </motion.button>
            </motion.div>
          )}
          </AnimatePresence>

        {/* Floating Action Button Menu */}
        <div ref={fabRef} className="absolute bottom-6 right-6 z-20">
          <AnimatePresence>
            {isFabMenuOpen && (
              <motion.div
                className="flex flex-col items-end space-y-3 mb-3" // Increased spacing
                variants={fabMenuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
<<<<<<< Updated upstream
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
=======
                {/* Add Node Buttons */}
                {[
                   { type: 'start', Icon: PlayCircle, color: 'purple', title: 'Add Start Node' },
                   { type: 'intent', Icon: Bot, color: 'blue', title: 'Add Intent Node' },
                   { type: 'action', Icon: Zap, color: 'green', title: 'Add Action Node' },
                   { type: 'end', Icon: FlagOff, color: 'red', title: 'Add End Node' },
                ].map(nodeInfo => (
                   <motion.button
                     key={nodeInfo.type}
                     variants={fabItemVariants}
                     onClick={() => handleAddNode(nodeInfo.type as any)} // Type assertion needed
                     className={`flex items-center justify-center w-12 h-12 bg-${nodeInfo.color}-500 text-white rounded-full shadow-lg hover:bg-${nodeInfo.color}-600 transition-colors duration-200 ease-in-out transform hover:scale-110`} // Enhanced hover
                     title={nodeInfo.title}
                   >
                     <nodeInfo.Icon size={22} />
                   </motion.button>
                ))}

>>>>>>> Stashed changes
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main FAB */}
          <motion.button
            onClick={toggleFabMenu}
<<<<<<< Updated upstream
            className="flex items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out"
            title={isFabMenuOpen ? 'Close Menu' : 'Add Node'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ rotate: isFabMenuOpen ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
=======
            className="flex items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 ease-in-out" // transition-all
            title={isFabMenuOpen ? "Close Menu" : "Add Node"}
            whileHover={{ scale: 1.1 }} // Slightly larger hover
            whileTap={{ scale: 0.95 }}
            animate={{ rotate: isFabMenuOpen ? 135 : 0 }} // Rotate further for 'X' effect
            transition={{ type: "spring", stiffness: 350, damping: 15 }}
>>>>>>> Stashed changes
          >
            <Plus size={28} />
          </motion.button>
        </div>
      </div> {/* End Main Flow Area */}

      {/* Animated Sidebar */}
      <AnimatePresence>
<<<<<<< Updated upstream
        {isSidebarOpen && selectedNode && ( // Ensure selectedNode exists before rendering Sidebar
          <motion.div
            key="sidebar"
=======
        {isSidebarOpen && selectedNode && (
          <motion.div
            key="sidebar" // Key ensures animation runs on mount/unmount
>>>>>>> Stashed changes
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
<<<<<<< Updated upstream
            className="w-72 h-full flex-shrink-0 sidebar-container" // Added class for potential outside click handling
          >
            <Sidebar
              selectedNode={selectedNode} // Pass the selected node
              definedActions={definedActions} // Pass defined actions
              onUpdateIntent={updateIntentNode}
              onUpdateAction={updateActionNode}
              onAddNewActionDefinition={handleAddNewActionDefinition} // Pass handler for new definitions
              onClose={() => setIsSidebarOpen(false)}
=======
            className="w-72 h-full flex-shrink-0 bg-white shadow-lg border-l border-gray-200" // Added styles directly
          >
            <Sidebar
              selectedNode={selectedNode}
              definedActions={definedActions} // Pass current state of defined actions
              onUpdateIntent={updateIntentNode}
              onUpdateAction={updateActionNode}
              onAddNewActionDefinition={handleAddNewActionDefinition}
              onClose={() => setIsSidebarOpen(false)} // Simple close handler
>>>>>>> Stashed changes
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Wrap FlowContent with ReactFlowProvider
function Flow() {
  return (
    <ReactFlowProvider>
      <FlowContent />
    </ReactFlowProvider>
  );
}

export default Flow;