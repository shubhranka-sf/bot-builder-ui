// ./src/Flow.tsx
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
  // ConnectionMode // Optional import
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Bot, Zap, FlagOff, Plus, Settings, PlayCircle, ClipboardList } from 'lucide-react'; // Added ClipboardList
import { motion, AnimatePresence } from 'framer-motion';
import StartNode from './components/nodes/StartNode';
import IntentNode from './components/nodes/IntentNode';
import ActionNode from './components/nodes/ActionNode';
import EndNode from './components/nodes/EndNode';
import FormNode from './components/nodes/FormNode'; // Import FormNode
import Sidebar from './components/Sidebar';
import {
  ActionDefinition,
  StartNodeData,
  IntentNodeData,
  ActionNodeData,
  IntentDefinition,
  FormNodeData, // Import FormNodeData
} from './types';
// Import processed edges if using defaults application in mockData.ts
import {
  mockDefinedActions,
  mockIntents,
  initialNodes as initialNodesData,
  processedInitialEdges,
  defaultEdgeOptions,
  getId,
} from './data/mockData';
const ChatBotWidget = React.lazy(() => import('./components/ChatBotWidget'));
import { useAtom } from 'jotai';
import { EdgesAtom, isLoadingAtom, isBotTrainedAtom, NodesAtom } from './store/flowAtom'; // Added isBotTrainedAtom
import { useDebouncedCallback } from 'use-debounce';
import { toast } from 'react-toastify'; // Removed ToastContainer import here
import 'react-toastify/dist/ReactToastify.css';
import { parseEntitiesFromExamples } from './utils/entityParser';

const colorClasses: { [key: string]: { bg: string; hoverBg: string } } = {
  purple: { bg: 'bg-purple-500', hoverBg: 'hover:bg-purple-600' },
  blue: { bg: 'bg-blue-500', hoverBg: 'hover:bg-blue-600' },
  green: { bg: 'bg-green-500', hoverBg: 'hover:bg-green-600' },
  red: { bg: 'bg-red-500', hoverBg: 'hover:bg-red-600' },
  teal: { bg: 'bg-teal-500', hoverBg: 'hover:bg-teal-600' }, // Added teal
  gray: { bg: 'bg-gray-500', hoverBg: 'hover:bg-gray-600' },
};

function isConfigurableNode(node: Node | null): boolean {
  if (!node) return false;
  // Add 'form' to configurable node types
  return node.type === 'start' || node.type === 'intent' || node.type === 'action' || node.type === 'form';
}

type StoryStep = {
  node: 'intent' | 'action' | 'form'; // Add form to story steps
  name: string;
};

function FlowContent() {
  // Use Jotai atoms for state
  const [nodes, setNodes] = useAtom(NodesAtom);
  const [edges, setEdges] = useAtom(EdgesAtom);
  // Local component state
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const fabRef = useRef<HTMLDivElement>(null);
  const {
    setViewport,
    getViewport,
    setNodes: rfSetNodes,
    getNodes,
    getEdges,
    addNodes,
    screenToFlowPosition,
    getNode,
  } = useReactFlow();

  // Global definitions state
  const [definedActions, setDefinedActions] = useState<ActionDefinition[]>(mockDefinedActions);
  const [intents, setIntents] = useState<IntentDefinition[]>(mockIntents);
  const [isLoading, setLoading] = useAtom(isLoadingAtom);
  const [isTrained, setIsTrained] = useAtom(isBotTrainedAtom); // Use isBotTrainedAtom

  // Initialize nodes/edges from local storage or mock data ONCE
  useEffect(() => {
    const storedNodes = localStorage.getItem('nodes');
    const storedEdges = localStorage.getItem('edges');

    if (storedNodes && storedNodes !== '[]') {
      console.log('Loading nodes from localStorage');
      setNodes(JSON.parse(storedNodes));
    } else {
      console.log('Initializing nodes from mock data');
      // Use initialNodesData directly from mockData import
      setNodes(initialNodesData);
    }

    if (storedEdges && storedEdges !== '[]') {
      console.log('Loading edges from localStorage');
      setEdges(JSON.parse(storedEdges));
    } else {
      console.log('Initializing edges from mock data');
      setEdges(processedInitialEdges); // Use edges with defaults applied
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  // Include FormNode in nodeTypes
  const nodeTypes: NodeTypes = useMemo(
    () => ({ start: StartNode, intent: IntentNode, action: ActionNode, end: EndNode, form: FormNode }),
    []
  );

  // --- Callbacks ---
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

  // --- Node Update Logic ---
  const updateNode = useCallback(
    // Extend generic type to include FormNodeData
    <T extends StartNodeData | IntentNodeData | ActionNodeData | FormNodeData>(
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
    [setNodes]
  );

  const updateStartNode = useCallback(
    (nodeId: string, newStoryName: string, newStoryId?: string) => {
      const updateData: Partial<StartNodeData> = { storyName: newStoryName, label: newStoryName };
      if (newStoryId !== undefined) updateData.storyId = newStoryId;
      updateNode<StartNodeData>(nodeId, 'start', updateData);
    },
    [updateNode]
  );

  const updateIntentNode = useCallback(
    (nodeId: string, newIntentId: string, newExamples?: string[]) => {
      const intentDefinition = intents.find((i) => i.id === newIntentId);
      const finalExamples = newExamples ?? intentDefinition?.examples ?? [];
      const parsedEntities = parseEntitiesFromExamples(finalExamples);
      updateNode<IntentNodeData>(nodeId, 'intent', {
        intentId: newIntentId,
        examples: finalExamples,
        entities: parsedEntities,
        label: intentDefinition?.label,
      });
      if (newExamples !== undefined) {
        setIntents((prevIntents) => {
          const intentIndex = prevIntents.findIndex((i) => i.id === newIntentId);
          if (intentIndex > -1) {
            const updatedIntents = [...prevIntents];
            updatedIntents[intentIndex] = {
              ...updatedIntents[intentIndex],
              examples: finalExamples,
              entities: parsedEntities,
            };
            return updatedIntents;
          }
          return prevIntents;
        });
      }
    },
    [updateNode, intents, setIntents]
  );

  const updateActionNode = useCallback(
    (nodeId: string, actionData: Partial<ActionNodeData>) => {
      const nodeToUpdate = getNode(nodeId);
      if (!nodeToUpdate || nodeToUpdate.type !== 'action') return;

      const isChangingWhichAction =
        actionData.name &&
        Object.keys(actionData).length === 1 &&
        actionData.name !== nodeToUpdate.data?.name;
      let finalActionData: ActionNodeData;

      if (isChangingWhichAction && actionData.name) {
        const newActionDefinition = definedActions.find((a) => a.name === actionData.name);
        if (newActionDefinition) {
          // Important: Create a copy of the definition for the node data
          finalActionData = { ...newActionDefinition };
        } else {
          console.warn(`Selected action definition "${actionData.name}" not found.`);
          finalActionData = {
            name: actionData.name,
            title: actionData.name,
            valueType: 'text',
            variations: [''],
          }; // Basic fallback
        }
      } else {
        // Merge edits onto current node data, prioritize incoming actionData
        const baseData = nodeToUpdate.data || {};
        const determinedType = actionData.valueType || baseData.valueType || 'text';
        const mergedVariations =
          determinedType === 'text'
            ? (actionData.variations ?? baseData.variations ?? [''])
            : undefined;

        finalActionData = {
          name: actionData.name || baseData.name || `action_${nodeId.slice(0, 4)}`,
          title:
            actionData.title ||
            baseData.title ||
            actionData.name ||
            baseData.name ||
            'Untitled Action',
          valueType: determinedType,
          // Handle value/variations based on the *determined* type
          value:
            determinedType === 'function'
              ? (actionData.value ?? baseData.value ?? '') // Use func value
              : (mergedVariations?.[0] ?? ''), // Use first variation for value
          variations: mergedVariations,
        };
      }

      updateNode<ActionNodeData>(nodeId, 'action', finalActionData);

      // Update global definition if not just changing which action is selected
      if (!isChangingWhichAction && finalActionData.name) {
        setDefinedActions((prevActions) => {
          const index = prevActions.findIndex((a) => a.name === finalActionData.name);
          const definitionToUpdate = {
            ...finalActionData,
            id: index > -1 ? prevActions[index].id : `action_${Date.now()}`,
          }; // Preserve or create ID

          if (index > -1) {
            const updated = [...prevActions];
            updated[index] = definitionToUpdate; // Overwrite existing
            console.log('Updated action definition:', updated[index]);
            return updated;
          } else {
            console.warn(
              `Action definition "${finalActionData.name}" not found during edit. Adding as new.`
            );
            return [...prevActions, definitionToUpdate]; // Add new
          }
        });
      }
    },
    [getNode, definedActions, setDefinedActions, updateNode]
  );

  // --- Add Form Node Update Logic ---
  const updateFormNode = useCallback(
    (nodeId: string, formData: Partial<FormNodeData>) => {
      updateNode<FormNodeData>(nodeId, 'form', formData);
      // Note: Form definitions are not stored globally like actions/intents in this setup.
      // The form's definition *is* the node data.
    },
    [updateNode]
  );

  // --- Selection & UI ---
  const onSelectionChange = useCallback(({ nodes: selectedNodes }: OnSelectionChangeParams) => {
    const newSelectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
    const isConfigurable = newSelectedNode && isConfigurableNode(newSelectedNode);
    setSelectedNode(newSelectedNode);
    setIsFabMenuOpen(false);
    setIsSidebarOpen(!!isConfigurable);
  }, []);

  const clearSelectionAndCloseSidebar = useCallback(() => {
    setSelectedNode(null);
    setIsFabMenuOpen(false);
    setIsSidebarOpen(false);
    rfSetNodes(getNodes().map((node) => ({ ...node, selected: false })));
  }, [rfSetNodes, getNodes]);

  const getCenterPosition = useCallback((): XYPosition => {
    const flowPane = document.querySelector('.react-flow__pane');
    if (flowPane) {
      const bounds = flowPane.getBoundingClientRect();
      return screenToFlowPosition({ x: bounds.width / 2 - 100, y: bounds.height / 4 }); // Adjust offset
    }
    return { x: 250 + Math.random() * 100, y: 150 + Math.random() * 100 };
  }, [screenToFlowPosition]);

  // --- Add Node (Updated for Form Node) ---
  const handleAddNode = useCallback(
    (type: 'intent' | 'action' | 'end' | 'start' | 'form') => { // Added 'form'
      const position = getCenterPosition();
      let newNodeData: any = {};
      if (type === 'start') {
        newNodeData = {
          storyName: `New Story`,
          storyId: `story_${getId().slice(-4)}`,
          label: `New Story`,
        };
      } else if (type === 'intent') {
        const defaultIntent = intents[0] || {
          id: 'intent_new',
          label: 'New Intent',
          examples: [],
          entities: [],
        };
        newNodeData = {
          intentId: defaultIntent.id,
          examples: [...(defaultIntent.examples || [])],
          entities: [...(defaultIntent.entities || [])],
          label: defaultIntent.label,
        };
      } else if (type === 'action') {
        const defaultAction = definedActions[0] || {
          title: 'New Action',
          name: `action_new_${getId().slice(-4)}`,
          valueType: 'text',
          variations: ['Configure me...'],
        };
        // Important: Create a *copy* of the definition data for the node
        newNodeData = {
          title: defaultAction.title,
          name: defaultAction.name,
          valueType: defaultAction.valueType,
          value:
            defaultAction.valueType === 'function'
              ? defaultAction.value
              : defaultAction.variations?.[0],
          variations:
            defaultAction.valueType === 'text'
              ? [...(defaultAction.variations || [''])]
              : undefined,
        };
      } else if (type === 'form') { // Handle form node creation
          newNodeData = {
              name: 'New Form',
              formId: `form_${getId().slice(-4)}`,
              slots: [], // Start with empty slots
          };
      } else if (type === 'end') {
        newNodeData = {};
      }

      const newNode: Node = { id: getId(), type, position, data: newNodeData };
      addNodes(newNode);
      setIsFabMenuOpen(false);
    },
    [addNodes, getCenterPosition, definedActions, intents]
  );

  // --- Add Definitions (Unchanged) ---
  const handleAddNewIntentDefinition = useCallback(
    (newIntent: IntentDefinition) => {
      setIntents((prev) => {
        if (prev.some((i) => i.id === newIntent.id)) {
          toast.error(`Intent ID "${newIntent.id}" exists.`);
          return prev;
        }
        toast.success(`Intent "${newIntent.label}" defined.`);
        return [...prev, newIntent];
      });
    },
    [setIntents]
  );
  const handleAddNewActionDefinition = useCallback(
    (newAction: ActionDefinition) => {
      setDefinedActions((prev) => {
        if (prev.some((a) => a.name === newAction.name)) {
          toast.error(`Action Name "${newAction.name}" exists.`);
          return prev;
        }
        toast.success(`Action "${newAction.title || newAction.name}" defined.`);
        // Ensure correct structure based on type before adding
        const completeAction = {
          id: `action_${Date.now()}`,
          ...newAction, // Spread incoming data (name, title, valueType)
          value:
            newAction.valueType === 'function'
              ? newAction.value || ''
              : newAction.variations?.[0] || '',
          variations:
            newAction.valueType === 'text'
              ? newAction.variations && newAction.variations.length > 0
                ? newAction.variations
                : ['']
              : undefined,
        };
        // Clean up potentially undefined fields if necessary (optional)
        if (completeAction.valueType === 'text') delete completeAction.value; // Or keep first variation as value
        if (completeAction.valueType === 'function') delete completeAction.variations;

        return [...prev, completeAction];
      });
    },
    [setDefinedActions]
  );

  const toggleFabMenu = useCallback(() => setIsFabMenuOpen((prev) => !prev), []);

  // --- Export Flow Data (Updated for Forms) ---
  const exportFlowData = useCallback(async () => {
    setLoading(true);
    const allNodes = getNodes();
    const allEdges = getEdges();

    // 1. Format Intents (Unchanged)
    const formattedIntents = intents.map((i) => ({
      name: i.id,
      examples: i.examples || [],
      entities: i.entities || [],
    }));

    // Collect entities while formatting intents (optimization)
    const entitiesSet = new Set<string>(); // Explicitly string
    intents.forEach((intent) => {
      intent.entities?.forEach((entity) => entitiesSet.add(entity));
    });

    // 2. Format Actions (Unchanged)
    const formattedActions = definedActions.map((action) => {
      if (action.valueType === 'function') {
        return { type: 'action', name: action.name };
      } else {
        const value = action.variations && action.variations.length > 0 ? action.variations : [''];

        // Check if the value looks like Rasa buttons JSON
        let isButtonFormat = false;
        if (
          value.length === 1 &&
          typeof value[0] === 'string' &&
          value[0].trim().startsWith('[') &&
          value[0].includes('"title"')
        ) {
          try {
            const parsed = JSON.parse(value[0]);
            isButtonFormat =
              Array.isArray(parsed) &&
              parsed.every(
                (item) =>
                  typeof item === 'object' && item !== null && 'title' in item && 'payload' in item
              );
            if (isButtonFormat) {
              return { type: 'button', name: action.name, value: parsed };
            }
          } catch (e) {
            /* Not JSON or not button format */
          }
        }

        return { type: 'text', name: action.name, variations: value };
      }
    });

    // 3. Format Forms (NEW)
    const formattedForms: { [formId: string]: { required_slots: string[] } } = {};
    allNodes.forEach(node => {
        if (node.type === 'form' && node.data?.formId) {
            // Basic validation: ensure slots are strings
            const validSlots = Array.isArray(node.data.slots)
                ? node.data.slots.filter((s: any): s is string => typeof s === 'string')
                : [];
            if (validSlots.length > 0) {
                formattedForms[node.data.formId] = {
                    required_slots: validSlots
                };
                // Also add required slots to the global entity set
                validSlots.forEach(slot => entitiesSet.add(slot));
            } else {
                 console.warn(`Form node ${node.id} (ID: ${node.data.formId}) has no valid slots defined.`);
            }
        }
    });

    // 4. Generate Stories using Topological Sort (Updated to include forms)
    const stories = [];

    // Create efficient lookup maps
    const nodeMap = Object.fromEntries(allNodes.map((node) => [node.id, node]));
    const outgoingEdges: { [key: string]: Edge[] } = {}; // Typed
    const incomingEdges: { [key: string]: Edge[] } = {}; // Typed

    // Initialize edge tracking
    allNodes.forEach((node) => {
      outgoingEdges[node.id] = [];
      incomingEdges[node.id] = [];
    });

    // Populate edge maps
    allEdges.forEach((edge) => {
      if (!outgoingEdges[edge.source]) outgoingEdges[edge.source] = []; // Defensive check
      if (!incomingEdges[edge.target]) incomingEdges[edge.target] = []; // Defensive check
      outgoingEdges[edge.source].push(edge);
      incomingEdges[edge.target].push(edge);
    });

    // Find start nodes
    const startNodes = allNodes.filter((node) => node.type === 'start');
    if (startNodes.length === 0) {
      console.warn('No Start Nodes found.');
      toast.warn('No Start Nodes found.');
      setLoading(false);
      return;
    }

    // Process each story from start to end using topological ordering
    startNodes.forEach((startNode) => {
      const storyName = startNode.data?.storyId || `Generated_Story_${startNode.id}`;

      // Perform topological sort from this start node
      const visited = new Set<string>(); // Typed
      const path: string[] = []; // Will store node IDs in topological order, Typed
      const onStack = new Set<string>(); // For cycle detection, Typed
      let hasCycle = false;

      function dfs(nodeId: string) {
        if (!nodeMap[nodeId]) {
          console.warn(`Node ID ${nodeId} not found in nodeMap during DFS for story ${storyName}`);
          hasCycle = true; // Treat missing node as an issue
          return;
        }
        if (hasCycle || nodeMap[nodeId].type === 'end') {
          return;
        }

        visited.add(nodeId);
        onStack.add(nodeId);

        for (const edge of outgoingEdges[nodeId] || []) {
          const nextId = edge.target;

          if (!visited.has(nextId)) {
            dfs(nextId);
          } else if (onStack.has(nextId)) {
            // Cycle detected
            hasCycle = true;
            console.warn(`Loop detected in story '${storyName}' at ${nextId}.`);
            toast.warn(`Loop in story '${storyName}'.`);
            return;
          }
        }

        onStack.delete(nodeId);
        path.unshift(nodeId); // Add to front for reverse topological order
      }

      // Start DFS from the start node
      dfs(startNode.id);

      if (hasCycle) {
        return; // Skip this story due to cycle or error
      }

      // Convert topological order to story steps (skip start node)
      const steps: StoryStep[] = []; // Typed

      for (let i = 0; i < path.length; i++) {
        const nodeId = path[i];
        const node = nodeMap[nodeId];

        // Skip start and end nodes in the steps
        if (node.type === 'start' || node.type === 'end') {
          continue;
        }

        if (node.type === 'intent' && node.data?.intentId) {
          steps.push({ node: 'intent', name: node.data.intentId });
        } else if (node.type === 'action' && node.data?.name) {
          steps.push({ node: 'action', name: node.data.name });
        } else if (node.type === 'form' && node.data?.formId) { // Handle form steps
            steps.push({ node: 'form', name: node.data.formId });
            // Rasa convention: Follow form with action_deactivate_loop and active_loop: null
            // Add these if your backend expects them. For now, just adding the form itself.
            // steps.push({ node: 'action', name: 'action_deactivate_loop' });
            // steps.push({ node: 'form', name: null }); // Represents active_loop: null - adjust format as needed
        }
      }

      if (steps.length > 0) {
        stories.push({ name: storyName, steps });
      } else {
        console.warn(`Story '${storyName}' has no valid steps.`);
      }
    });

    // 5. Format entities (Now includes entities from forms)
    const formattedEntities = Array.from(entitiesSet).map((name) => ({
      name,
    }));

    // 6. Assemble Final JSON (with forms)
    const exportData: any = {
      intents: formattedIntents,
      actions: formattedActions,
      entities: formattedEntities,
      stories: stories,
    };
    if (Object.keys(formattedForms).length > 0) {
        exportData.forms = formattedForms; // Add forms section if not empty
    }

    console.log('Export Data Payload:', JSON.stringify(exportData, null, 2));

    // 7. Send to Backend API
    if (stories.length === 0) {
      toast.error('No valid stories generated.');
      setLoading(false);
      return;
    }

    try {
      await toast.promise(
        fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/train`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exportData),
        })
          .then((response) => {
            if (!response.ok) {
              setIsTrained(false);
              return response.json().then(err => { // Try to parse error body
                   throw new Error(err?.message || `API Error ${response.status}`);
              }).catch(() => { // Fallback if error body parsing fails
                   throw new Error(`API Error ${response.status}`);
              })
            }
            return response.json();
          })
          .then((data) => {
            console.log('✅ API response:', data);
            setIsTrained(true); // Set trained state on success
            return data; // Return data for success message
          })
          .catch((error) => {
            setIsTrained(false); // Set trained state to false on error
            console.error('❌ Error sending data to API:', error);
            throw error; // Re-throw error for toast.promise
          }),
        {
          pending: 'Training model...',
          success: 'Model training started!',
          error: {
            render({ data }) { // data here is the error object re-thrown
              console.error('Training Error Render:', data);
              // Ensure data is an error object before accessing message
              const message = data instanceof Error ? data.message : 'Unknown training error';
              return `Training failed: ${message}`;
            },
          },
        },
        { autoClose: 3000 } // Options object for toast.promise
      );
    } catch (error) {
      // Catch errors not handled by toast.promise (e.g., network issues before fetch)
      console.error('Export Error:', error);
      // Potentially show a generic error toast here if needed
    } finally {
      setLoading(false);
    }
  }, [intents, definedActions, getNodes, getEdges, setLoading, setIsTrained]); // Added setIsTrained


  // --- useEffects & Chatbot ---
  useEffect(() => {
    // Click outside FAB
    const handleClickOutside = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) setIsFabMenuOpen(false);
    };
    if (isFabMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFabMenuOpen]);

  const saveNodesToLocalStorage = useDebouncedCallback((nodesToSave: Node[]) => {
    try {
      // Ensure data is serializable (especially functions if they were ever stored in data)
      const serializableNodes = nodesToSave.map(n => ({...n, data: {...n.data}}));
      localStorage.setItem('nodes', JSON.stringify(serializableNodes));
      console.log('Saved nodes:', serializableNodes.length);
    } catch (e) {
      console.error('LS Node Save Error:', e);
      toast.error("Could not save nodes to local storage.")
    }
  }, 1000);
  useEffect(() => {
    if (nodes.length > 0) saveNodesToLocalStorage(nodes);
  }, [nodes, saveNodesToLocalStorage]);

  const saveEdgesToLocalStorage = useDebouncedCallback((edgesToSave: Edge[]) => {
    try {
       const serializableEdges = edgesToSave.map(e => ({...e, data: e.data ? {...e.data} : undefined}));
      localStorage.setItem('edges', JSON.stringify(serializableEdges));
      console.log('Saved edges:', serializableEdges.length);
    } catch (e) {
      console.error('LS Edge Save Error:', e);
       toast.error("Could not save edges to local storage.")
    }
  }, 1000);
  useEffect(() => {
    if (edges.length > 0) saveEdgesToLocalStorage(edges);
  }, [edges, saveEdgesToLocalStorage]);

  const handleNewMessage = (text: string) => {
      const userMessage = { role: 'user', content: text };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
  };
  const onBotResponse = (response: string) => {
    const botMessage = { role: 'assistant', content: response };
    setMessages((prevMessages) => [...prevMessages, botMessage]);
  };

  const callPredictApi = useCallback(async (message: string): Promise<string> => {
    if (!isTrained) {
        return "The bot hasn't been trained yet. Please train the model first.";
    }
    setLoading(true); // Indicate loading during prediction
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          model_name: 'default_model.tar.gz', // Make dynamic if needed
          sender_id: 'user_flow_tester', // Use a consistent or dynamic sender ID
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({})); // Try parsing error JSON
        throw new Error(err.message || `Predict API Error: ${response.statusText} (${response.status})`);
      }
      const data = await response.json();
      // Handle potentially complex responses (multiple messages, buttons etc.)
      // For now, join text from all responses. Adjust as needed.
      return data.response?.map((r: any) => r.text).join('\n') || 'Sorry, I received an empty response.';
    } catch (error) {
      console.error('Predict API Error:', error);
      toast.error(error instanceof Error ? error.message : 'Prediction request failed.');
      return error instanceof Error ? `Error: ${error.message}` : 'Sorry, the prediction request failed.';
    } finally {
        setLoading(false); // Stop loading indicator
    }
  }, [isTrained, setLoading]); // Depend on isTrained state

  // --- Animation Variants ---
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
          onPaneClick={clearSelectionAndCloseSidebar}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          className="bg-gradient-to-br from-indigo-50 via-white to-blue-50"
          deleteKeyCode={['Backspace', 'Delete']}
          // connectionMode={ConnectionMode.Loose} // Optional: makes connecting easier
        >
          <Controls /> <Background />
        </ReactFlow>

        {/* Top Right Buttons */}
        <div className="absolute top-4 right-6 z-10 flex gap-3">
          {' '}
          {isLoading ? (
            <motion.button
              className="btn btn-sm btn-disabled gap-1"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {' '}
              Loading... <Bot size={16} className="animate-spin" />{' '}
            </motion.button>
          ) : (
            <motion.button
              onClick={exportFlowData}
              className="btn btn-sm btn-primary gap-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {' '}
              Train Model <Bot size={16} />{' '}
            </motion.button>
          )}{' '}
        </div>

        {/* Configure Button */}
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
                onClick={() => setIsSidebarOpen(true)}
                className="btn btn-circle btn-neutral shadow-xl"
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

        {/* FAB */}
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
                {[ // Added Form Node to FAB
                  { type: 'start', Icon: PlayCircle, color: 'purple', title: 'Add Start' },
                  { type: 'intent', Icon: Bot, color: 'blue', title: 'Add Intent' },
                  { type: 'action', Icon: Zap, color: 'green', title: 'Add Action' },
                  { type: 'form', Icon: ClipboardList, color: 'teal', title: 'Add Form' }, // Added Form
                  { type: 'end', Icon: FlagOff, color: 'red', title: 'Add End' },
                ].map((nodeInfo) => {
                  const bg = colorClasses[nodeInfo.color]?.bg || 'bg-gray-500';
                  const hoverBg = colorClasses[nodeInfo.color]?.hoverBg || 'hover:bg-gray-600';
                  return (
                    <motion.button
                      key={nodeInfo.type}
                      variants={fabItemVariants}
                      onClick={() => handleAddNode(nodeInfo.type as any)}
                      className={`btn btn-circle btn-sm ${bg} text-white shadow-lg ${hoverBg} transform hover:scale-110`}
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
            className="btn btn-circle btn-primary shadow-xl"
            title={isFabMenuOpen ? 'Close Menu' : 'Add Node'}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{ rotate: isFabMenuOpen ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 15 }}
          >
            {' '}
            <Plus size={28} />{' '}
          </motion.button>{' '}
        </div>
        {/* Conditionally render ChatBotWidget based on isTrained state */}
        {isTrained ? (
          <Suspense fallback={<div className='absolute bottom-5 left-5 text-gray-500'>Loading Chat...</div>}>
            <ChatBotWidget
              callApi={callPredictApi} // Use the memoized predict function
              handleNewMessage={handleNewMessage} // Pass message handlers
              onBotResponse={onBotResponse}
              messages={messages}
              primaryColor="#4F46E5" // Example color
            />
          </Suspense>
        ) : (
           <div className="absolute bottom-6 left-6 p-3 bg-yellow-100 text-yellow-800 text-xs rounded-md shadow border border-yellow-300 z-10">
               Train the model to enable the chat widget.
           </div>
        )}
      </div>

      {/* Sidebar (No Animation Wrapper) */}
      {/* Conditionally render based on selectedNode and isConfigurableNode */}
       {isSidebarOpen && selectedNode && isConfigurableNode(selectedNode) && (
        <div
          // Use selectedNode.id + type as key to force re-render on node change
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
            onUpdateForm={updateFormNode} // Pass form update handler
            onAddNewIntentDefinition={handleAddNewIntentDefinition}
            onAddNewActionDefinition={handleAddNewActionDefinition}
            onClose={clearSelectionAndCloseSidebar}
          />
        </div>
      )}
    </div>
  );
}

function Flow() {
  return (
    <ReactFlowProvider>
      {' '}
      <FlowContent />{' '}
    </ReactFlowProvider>
  );
}

export default Flow;

// Helper CSS classes used in Sidebar/Flow (can be in index.css or here)
const css = `
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 0.375rem; border: 1px solid transparent; font-weight: 600; transition: background-color 0.2s; cursor: pointer; }
.btn-sm { padding: 0.25rem 0.75rem; font-size: 0.875rem; }
.btn-xs { padding: 0.1rem 0.5rem; font-size: 0.75rem; }
.btn-circle { border-radius: 9999px; width: 3.5rem; height: 3.5rem; padding: 0; } /* Adjusted size for FAB */
.btn-primary { background-color: #4f46e5; color: white; } .btn-primary:hover { background-color: #4338ca; } .btn-primary:disabled { background-color: #a5b4fc; cursor: not-allowed; }
.btn-secondary { background-color: #e5e7eb; color: #374151; border-color: #d1d5db; } .btn-secondary:hover { background-color: #d1d5db; }
.btn-neutral { background-color: #404040; color: white; } .btn-neutral:hover { background-color: #262626; }
.btn-ghost { background-color: transparent; border: none; } .btn-ghost:hover { background-color: rgba(0,0,0,0.05); }
.btn-disabled { opacity: 0.5; cursor: not-allowed; }
.btn-toggle { background-color: white; border: 1px solid #d1d5db; color: #4b5563; } .btn-toggle:hover { background-color: #f9fafb; }
.btn-toggle.active { background-color: #eff6ff; border-color: #93c5fd; color: #2563eb; font-weight: 600; }
/* Added teal active state */
.btn-toggle.teal-active { background-color: #ccfbf1; border-color: #5eead4; color: #0f766e; font-weight: 500; }

.input, .textarea, .select { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; font-size: 0.875rem; line-height: 1.25rem; box-shadow: inset 0 1px 2px 0 rgb(0 0 0 / 0.05); }
.input:focus, .textarea:focus, .select:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #60a5fa; box-shadow: 0 0 0 2px #bfdbfe; }
.input-sm, .textarea-sm, .select-sm { padding-top: 0.25rem; padding-bottom: 0.25rem; font-size: 0.875rem; line-height: 1.25rem; }
.textarea-xs { font-size: 0.75rem; line-height: 1rem; padding: 0.25rem 0.5rem; }
.input-bordered, .textarea-bordered, .select-bordered { /* Add specific border styles if needed */ }
`;
// Inject styles (consider moving to index.css)
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = css;
document.head.appendChild(styleSheet);