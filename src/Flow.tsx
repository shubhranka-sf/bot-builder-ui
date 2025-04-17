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

function FlowContent() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
  const {
    setNodes: rfSetNodes, // Renamed for clarity if needed, though not strictly necessary here
    getNodes,
    addNodes,
    screenToFlowPosition,
  } = useReactFlow();

  // State for defined actions, initialized from mock data
  const [definedActions, setDefinedActions] = useState<ActionDefinition[]>(mockDefinedActions);

  const nodeTypes: NodeTypes = useMemo(() => ({
    start: StartNode,
    intent: IntentNode,
    action: ActionNode,
    end: EndNode,
  }), []);

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

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: true, style: { strokeWidth: 2 } }, eds)),
    [setEdges]
  );

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

  const updateActionNode = useCallback(
    (nodeId: string, actionData: Partial<ActionDefinition>) => { // Allow partial updates
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...actionData } } : node
        )
      );
       setSelectedNode((prev) =>
        prev && prev.id === nodeId
          ? { ...prev, data: { ...prev.data, ...actionData } }
          : prev
      );
    },
    [setNodes] // Removed setSelectedNode dependency
  );

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


  const getCenterPosition = useCallback((): XYPosition => {
    const flowPane = document.querySelector('.react-flow__pane');
    if (flowPane) {
      const bounds = flowPane.getBoundingClientRect();
      // Place new nodes slightly offset from center top
      return screenToFlowPosition({
        x: bounds.width / 2,
        y: bounds.height / 4, // Closer to top
      });
    }
    // Fallback position
    return { x: 200 + Math.random() * 100, y: 100 + Math.random() * 100 };
  }, [screenToFlowPosition]);

  const handleAddNode = useCallback(
    (type: 'intent' | 'action' | 'end' | 'start') => {
      const position = getCenterPosition();
      let newNodeData: any = {};

      if (type === "intent") {
        newNodeData = { intentId: "intent_greet", examples: ["hello", "hi"] }; // Default intent
      } else if (type === "action") {
        const defaultAction = definedActions[0] || {
          title: "New Action", name: "new_action", value: "Configure me...", valueType: "text"
        };
        newNodeData = { ...defaultAction };
      }
      // Start and End nodes have empty data

      const newNode: Node = { id: getId(), type, position, data: newNodeData };
      addNodes(newNode);
      setIsFabMenuOpen(false);
    },
    [addNodes, getCenterPosition, definedActions]
  );

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

  // Effect to close FAB menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsFabMenuOpen(false);
      }
    };
    if (isFabMenuOpen) {
        document.addEventListener("mousedown", handleClickOutside);
    } else {
        document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFabMenuOpen]);

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
    hidden: { x: "100%", opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: "tween", duration: 0.3, ease: "easeOut" } },
    exit: { x: "100%", opacity: 0, transition: { type: "tween", duration: 0.2, ease: "easeIn" } },
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

              </motion.div>
            )}
          </AnimatePresence>

          {/* Main FAB */}
          <motion.button
            onClick={toggleFabMenu}
            className="flex items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 ease-in-out" // transition-all
            title={isFabMenuOpen ? "Close Menu" : "Add Node"}
            whileHover={{ scale: 1.1 }} // Slightly larger hover
            whileTap={{ scale: 0.95 }}
            animate={{ rotate: isFabMenuOpen ? 135 : 0 }} // Rotate further for 'X' effect
            transition={{ type: "spring", stiffness: 350, damping: 15 }}
          >
            <Plus size={28} />
          </motion.button>
        </div>
      </div> {/* End Main Flow Area */}

      {/* Animated Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && selectedNode && (
          <motion.div
            key="sidebar" // Key ensures animation runs on mount/unmount
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-72 h-full flex-shrink-0 bg-white shadow-lg border-l border-gray-200" // Added styles directly
          >
            <Sidebar
              selectedNode={selectedNode}
              definedActions={definedActions} // Pass current state of defined actions
              onUpdateIntent={updateIntentNode}
              onUpdateAction={updateActionNode}
              onAddNewActionDefinition={handleAddNewActionDefinition}
              onClose={() => setIsSidebarOpen(false)} // Simple close handler
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