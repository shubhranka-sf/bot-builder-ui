import { useState, useCallback, useMemo, useRef, useEffect } from "react";
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
import { ActionDefinition, StartNodeData, IntentNodeData, ActionNodeData, IntentDefinition } from "./types";
import {
  initialNodes,
  initialEdges,
  mockDefinedActions,
  mockIntents,
  defaultEdgeOptions,
  getId,
} from "../data/mockData";

const colorClasses: { [key: string]: { bg: string; hoverBg: string } } = {
  purple: { bg: 'bg-purple-500', hoverBg: 'hover:bg-purple-600' },
  blue:   { bg: 'bg-blue-500',   hoverBg: 'hover:bg-blue-600' },
  green:  { bg: 'bg-green-500',  hoverBg: 'hover:bg-green-600' },
  red:    { bg: 'bg-red-500',    hoverBg: 'hover:bg-red-600' },
  gray:   { bg: 'bg-gray-500',   hoverBg: 'hover:bg-gray-600' },
};


function FlowContent() {
  const [nodes, setNodes] = useState<Node<StartNodeData | IntentNodeData | ActionNodeData | any>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
  const {
    setNodes: rfSetNodes,
    getNodes,
    addNodes,
    screenToFlowPosition,
    getNode,
    deleteElements, // Keep deleteElements if needed elsewhere, but not for type change
  } = useReactFlow();

  // --- Manage definitions in state ---
  const [definedActions, setDefinedActions] = useState<ActionDefinition[]>(mockDefinedActions);
  const [intents, setIntents] = useState<IntentDefinition[]>(mockIntents); // Manage intents in state

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      start: StartNode,
      intent: IntentNode,
      action: ActionNode,
      end: EndNode,
    }),
    []
  );

  // --- Callbacks ---
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
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge({ ...connection, ...defaultEdgeOptions }, eds)
      ),
    [setEdges]
  );

  const getFlowDataBetweenStartAndEnd = useCallback(() => {
     const startNode = nodes.find((node) => node.type === "start");

     if (!startNode) {
       console.error("Start node not found");
       return { nodes: [], edges: [] };
     }

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

         const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
         outgoingEdges.forEach(edge => {
             flowEdges.push(edge);
             if (!visitedNodes.has(edge.target)) {
                 queue.push(edge.target);
             }
         });
     }

      const endNode = nodes.find((node) => node.type === "end");
      if (endNode && !visitedNodes.has(endNode.id)) {
         console.warn("Defined End node was not reached in the traversal from Start.");
      } else if (!endNode && flowNodes.length > 0 && !flowNodes.some(n => n.type === 'end')) {
         console.warn("No End node found or reached in the flow path.");
      }

     return { nodes: flowNodes, edges: flowEdges };
   }, [nodes, edges]);

   const exportFlowData = useCallback(() => {
     const { nodes: flowNodes, edges: flowEdges } = getFlowDataBetweenStartAndEnd();

     if (flowNodes.length === 0 && nodes.some(n => n.type === 'start')) {
         alert("Could not find path from Start node. Exporting only the start node.");
         const startNode = nodes.find(n => n.type === 'start');
         if (startNode) {
             flowNodes.push(startNode);
         } else {
              alert("No Start node found to export.");
              return;
         }
     } else if (flowNodes.length === 0) {
         alert("No nodes found to export.");
         return;
     }

     const exportData = {
       nodes: flowNodes.map(({ id, type, position, data, width, height }) => ({
         id, type, position, data, width, height
       })),
       edges: flowEdges.map(({ id, source, target, animated, style, markerEnd, type: edgeType }) => ({
         id, source, target, animated, style, markerEnd, type: edgeType
       })),
     };

     const jsonString = JSON.stringify(exportData, null, 2);
     const blob = new Blob([jsonString], { type: "application/json" });
     saveAs(blob, "flow-data.json");
   }, [getFlowDataBetweenStartAndEnd, nodes]);

   // --- Node Update Callbacks ---

   const updateStartNode = useCallback(
    (nodeId: string, newStoryName: string) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId && node.type === 'start'
                    ? { ...node, data: { ...node.data, storyName: newStoryName } }
                    : node
            )
        );
        // Update selected node state directly if it's the one being edited
        setSelectedNode((prev) =>
            prev && prev.id === nodeId && prev.type === 'start'
                ? { ...prev, data: { ...prev.data, storyName: newStoryName } }
                : prev
        );
    },
    [setNodes] // No dependency on setSelectedNode needed here, it's just reading
  );

  // Updated to handle both definition changes (from list) and example edits
  const updateIntentNode = useCallback(
    (nodeId: string, newIntentId: string, newExamples?: string[]) => {
      const intentDefinition = intents.find(i => i.id === newIntentId);
      // If newExamples are provided (from Edit mode), use them.
      // Otherwise (from Change Intent list), use the definition's examples.
      const finalExamples = newExamples ?? intentDefinition?.examples ?? [];

      // 1. Update the specific node instance
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId && node.type === 'intent'
            ? { ...node, data: { ...node.data, intentId: newIntentId, examples: finalExamples } }
            : node
        )
      );

      // 2. Update the central intent definition (ONLY if examples were explicitly passed from Edit mode)
      if (newExamples !== undefined) {
        setIntents((prevIntents) => {
          const intentIndex = prevIntents.findIndex(intent => intent.id === newIntentId);
          if (intentIndex > -1) {
            const updatedIntents = [...prevIntents];
            updatedIntents[intentIndex] = { ...updatedIntents[intentIndex], examples: finalExamples };
            return updatedIntents;
          } else {
            console.warn(`Intent definition with ID "${newIntentId}" not found while saving edits. Cannot update definition examples.`);
            return prevIntents;
          }
        });
      }

      // 3. Update selected node state directly
      setSelectedNode((prev) =>
        prev && prev.id === nodeId && prev.type === 'intent'
          ? { ...prev, data: { ...prev.data, intentId: newIntentId, examples: finalExamples } }
          : prev
      );
    },
    [setNodes, setIntents, intents] // Added intents dependency
  );

  // Updated to handle both definition changes (from list) and full edits
  const updateActionNode = useCallback(
    (nodeId: string, actionData: Partial<ActionNodeData>) => {
      const nodeToUpdate = getNode(nodeId);
      if (!nodeToUpdate || nodeToUpdate.type !== 'action') return;

      let fullActionData: ActionNodeData;
      const actionDefinition = definedActions.find(a => a.name === actionData.name);

      // Check if this is likely from 'Change Action' (only name provided)
      // or from 'Edit Save' (more fields provided)
      const isChangeAction = actionData.name && Object.keys(actionData).length === 1;

      if (isChangeAction && actionDefinition) {
        // Use the full definition for 'Change Action'
        fullActionData = { ...actionDefinition };
      } else {
        // If not 'Change Action' or definition not found, merge or use defaults
        // This path handles 'Edit Save' or 'Change Action' where definition is missing.
        fullActionData = {
          // Start with definition if found, otherwise empty object
          ...(actionDefinition || {}),
          // Merge provided data, overriding definition fields if necessary
          ...actionData,
          // Ensure required fields have fallbacks if still missing after merge
          title: actionData.title || actionDefinition?.title || actionData.name || 'Untitled Action',
          name: actionData.name || actionDefinition?.name || `action_${nodeId.substring(0,4)}`, // Name must be present
          value: actionData.value ?? actionDefinition?.value ?? '',
          valueType: actionData.valueType || actionDefinition?.valueType || 'text',
        };
      }

      // 1. Update the specific node instance
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId && node.type === 'action'
            ? { ...node, data: { ...node.data, ...fullActionData } } // Apply the determined full data
            : node
        )
      );

      // 2. Update the central action definition (ONLY if saving from Edit mode - check for multiple fields)
      if (!isChangeAction && fullActionData.name) {
        setDefinedActions((prevActions) => {
          const actionIndex = prevActions.findIndex(action => action.name === fullActionData.name);
          if (actionIndex > -1) {
            // Update existing definition
            const updatedActions = [...prevActions];
            const existingId = updatedActions[actionIndex].id; // Preserve ID if exists
            updatedActions[actionIndex] = { ...fullActionData, id: existingId };
            return updatedActions;
          } else {
            // Add as new definition if name not found during edit save
            console.warn(`Action definition "${fullActionData.name}" not found during save. Adding as new definition.`);
            const newActionDef: ActionDefinition = { ...fullActionData };
            return [...prevActions, newActionDef];
          }
        });
      }

      // 3. Update selected node state directly
       setSelectedNode((prev) =>
        prev && prev.id === nodeId && prev.type === 'action'
          ? { ...prev, data: { ...prev.data, ...fullActionData } }
          : prev
      );
    },
    [setNodes, setDefinedActions, getNode, definedActions] // Added getNode, definedActions dependencies
  );


  // --- REMOVED handleChangeNodeType ---


  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      const newSelectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
      setSelectedNode(newSelectedNode);
      setIsFabMenuOpen(false); // Close FAB menu on any selection change

      const isConfigurable = newSelectedNode?.type === 'start' || newSelectedNode?.type === 'intent' || newSelectedNode?.type === 'action';

      if (!newSelectedNode && isSidebarOpen) {
         // If selection cleared, close sidebar
         setIsSidebarOpen(false);
      } else if (newSelectedNode && !isConfigurable && isSidebarOpen) {
         // If selected node is not configurable (e.g., 'end'), close sidebar
         setIsSidebarOpen(false);
      }
      // If a configurable node IS selected, we DON'T automatically close the sidebar.
      // It stays open if it was already open, or requires the cog button press if it was closed.
    },
    [isSidebarOpen] // Only depends on isSidebarOpen now
  );

  const clearSelectionAndCloseSidebar = useCallback(() => {
      const currentlySelectedNodeId = selectedNode?.id;
      setSelectedNode(null);
      setIsFabMenuOpen(false);
      setIsSidebarOpen(false);

      // Manually deselect nodes in reactflow state if needed
      if (currentlySelectedNodeId) {
          rfSetNodes(
              getNodes().map((node) =>
                  node.id === currentlySelectedNodeId ? { ...node, selected: false } : node
              )
          );
      }
  }, [selectedNode, rfSetNodes, getNodes]); // Added dependencies

  const getCenterPosition = useCallback((): XYPosition => {
    const flowPane = document.querySelector(".react-flow__pane");
    if (flowPane) {
      const bounds = flowPane.getBoundingClientRect();
      return screenToFlowPosition({
        x: bounds.width / 2 - 75,
        y: bounds.height / 4,
      });
    }
    return { x: 200 + Math.random() * 100, y: 100 + Math.random() * 100 };
  }, [screenToFlowPosition]);

  const handleAddNode = useCallback(
    (type: "intent" | "action" | "end" | "start") => {
      const position = getCenterPosition();
      let newNodeData: any = {};

      if (type === "start") {
          const existingStart = getNodes().find(n => n.type === 'start');
          if (existingStart) {
              alert("Only one Start node is allowed.");
              setIsFabMenuOpen(false);
              return;
          }
          newNodeData = { storyName: `New Story ${getId().slice(-4)}` };
      } else if (type === "intent") {
          const defaultIntent = intents[0] || { id: 'intent_default', label: 'Default Intent', examples: [] };
          newNodeData = { intentId: defaultIntent.id, examples: defaultIntent.examples || [] };
      } else if (type === "action") {
          const defaultAction = definedActions[0] || { title: 'New Action', name: 'new_action', value: 'Configure me...', valueType: 'text' };
          newNodeData = { ...defaultAction }; // Copy default action data
      } else if (type === "end") {
          newNodeData = {};
      }

      const newNode: Node = { id: getId(), type, position, data: newNodeData };
      addNodes(newNode);
      setIsFabMenuOpen(false);
    },
    [addNodes, getCenterPosition, definedActions, intents, getNodes] // Added intents, getNodes
  );

  const handleAddNewActionDefinition = useCallback(
    (newAction: ActionDefinition) => {
      // Optional: Add a unique ID if needed elsewhere
      // const newActionWithId = { ...newAction, id: getId() };
      setDefinedActions((prev) => [...prev, newAction]);
      console.log("Added new action definition:", newAction);
    },
    [setDefinedActions]
  );

  // --- Add New Intent Definition Callback (similar to action) ---
   const handleAddNewIntentDefinition = useCallback(
    (newIntent: IntentDefinition) => {
      setIntents((prev) => {
          // Prevent adding duplicate IDs
          if (prev.some(intent => intent.id === newIntent.id)) {
              alert(`Intent with ID "${newIntent.id}" already exists.`);
              return prev;
          }
          return [...prev, newIntent];
      });
      console.log("Added new intent definition:", newIntent);
    },
    [setIntents]
  );

  const toggleFabMenu = useCallback(() => {
    if (!isFabMenuOpen) {
        // Don't clear selection when opening FAB anymore
        // clearSelectionAndCloseSidebar();
    }
    setIsFabMenuOpen((prev) => !prev);
  }, [isFabMenuOpen]); // Removed clearSelectionAndCloseSidebar dependency


  // --- Effects ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsFabMenuOpen(false);
      }
      // Close sidebar if clicking outside the sidebar AND the flow pane (e.g., on empty space)
      // This requires identifying clicks specifically on the pane vs nodes vs controls
      // A simpler approach is handled by onPaneClick and selection changes.
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
    exit: { opacity: 0, y: 10, transition: { duration: 0.1, staggerChildren: 0.05, staggerDirection: -1 } },
  };

  const fabItemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.9, transition: { duration: 0.1 } }
  };

  const sidebarVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: "tween", duration: 0.3, ease: "easeOut" } },
    exit: { x: "100%", opacity: 0, transition: { type: "tween", duration: 0.2, ease: "easeIn" } },
  };

  // --- Render ---
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
          onPaneClick={clearSelectionAndCloseSidebar} // Clears selection and closes sidebar on pane click
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          className="bg-gradient-to-br from-indigo-50 via-white to-blue-50"
          deleteKeyCode={['Backspace', 'Delete']} // Enable delete key
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
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
             > Export Flow </motion.button>
         </div>

        {/* Floating Configuration Button */}
        <AnimatePresence>
        {selectedNode &&
          (selectedNode.type === "start" || selectedNode.type === "intent" || selectedNode.type === "action") &&
          !isSidebarOpen && ( // Only show if sidebar is closed
            <motion.div
              className="absolute bottom-24 right-6 z-30"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <motion.button
                onClick={() => {
                  console.log('Configure button clicked. Setting isSidebarOpen = true. Selected Node ID:', selectedNode?.id, 'Type:', selectedNode?.type);
                  setIsSidebarOpen(true); // Open the sidebar
                 }}
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
                className="flex flex-col items-end space-y-3 mb-3"
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
                ].map(nodeInfo => {
                   const bgColor = colorClasses[nodeInfo.color]?.bg || colorClasses['gray'].bg;
                   const hoverBgColor = colorClasses[nodeInfo.color]?.hoverBg || colorClasses['gray'].hoverBg;
                   return (
                       <motion.button
                         key={nodeInfo.type}
                         variants={fabItemVariants}
                         onClick={() => handleAddNode(nodeInfo.type as any)}
                         className={`flex items-center justify-center w-12 h-12 ${bgColor} text-white rounded-full shadow-lg ${hoverBgColor} transition-colors duration-200 ease-in-out transform hover:scale-110`}
                         title={nodeInfo.title}
                       >
                         <nodeInfo.Icon size={22} />
                       </motion.button>
                   );
                })}
              </motion.div>
            )}
          </AnimatePresence>
          {/* Main FAB */}
          <motion.button
             onClick={toggleFabMenu}
             className="flex items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 ease-in-out"
             title={isFabMenuOpen ? "Close Menu" : "Add Node"}
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.95 }}
             animate={{ rotate: isFabMenuOpen ? 135 : 0 }}
             transition={{ type: "spring", stiffness: 350, damping: 15 }}
           >
            <Plus size={28} />
          </motion.button>
        </div>
      </div>

      {/* Animated Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && selectedNode && ( // Render only if sidebar should be open AND a node is selected
          <motion.div
            key={`sidebar-${selectedNode.id}`} // Key ensures component remounts if node selection changes
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-72 h-full flex-shrink-0 bg-white shadow-lg border-l border-gray-200 flex flex-col" // Use flex-col for structure
          >
             {/* Sidebar component now manages its own scrolling internally */}
             <Sidebar
              selectedNode={selectedNode}
              intents={intents}
              definedActions={definedActions}
              onUpdateStartNode={updateStartNode}
              onUpdateIntent={updateIntentNode} // Updates node and potentially intent definition
              onUpdateAction={updateActionNode} // Updates node and potentially action definition
              // Removed onChangeNodeType
              onAddNewIntentDefinition={handleAddNewIntentDefinition} // Pass new handler
              onAddNewActionDefinition={handleAddNewActionDefinition}
              onClose={() => {
                  console.log("Sidebar close button clicked. Setting isSidebarOpen = false");
                  setIsSidebarOpen(false);
                  // Explicitly closing sidebar via X button should probably deselect the node
                  clearSelectionAndCloseSidebar();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Ensure these classes are available for Tailwind JIT/Purge
// bg-purple-500 hover:bg-purple-600
// bg-blue-500   hover:bg-blue-600
// bg-green-500  hover:bg-green-600
// bg-red-500    hover:bg-red-600
// bg-gray-500   hover:bg-gray-600

function Flow() {
  return (
    <ReactFlowProvider>
      <FlowContent />
    </ReactFlowProvider>
  );
}

export default Flow;