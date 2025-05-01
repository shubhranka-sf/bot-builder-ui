import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { useReactFlow } from 'reactflow';
import { toast } from 'react-toastify';
import { isLoadingAtom, isBotTrainedAtom } from '../../store/flowAtom';
import { IntentDefinition, ActionDefinition, StoryStep } from '../../types';

interface FlowExportProps {
    intents: IntentDefinition[];
    definedActions: ActionDefinition[];
}

/**
 * Hook for handling flow data export, training requests, and prediction calls.
 */
export function useFlowExport({ intents, definedActions }: FlowExportProps) {
    const [isLoading, setLoading] = useAtom(isLoadingAtom);
    const [isTrained, setIsTrained] = useAtom(isBotTrainedAtom);
    const { getNodes, getEdges } = useReactFlow();

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
        const entitiesSet = new Set();
        intents.forEach((intent) => {
          intent.entities?.forEach((entity) => entitiesSet.add(entity));
        });
    
        // 2. Format Actions (Unchanged)
        const formattedActions = definedActions.map((action) => {
          if (action.valueType === "function") {
            return { type: "action", name: action.name };
          } else {
            const value =
              action.variations && action.variations.length > 0
                ? action.variations
                : [""];
    
            // Check if the value looks like Rasa buttons JSON
            let isButtonFormat = false;
            if (
              value.length === 1 &&
              typeof value[0] === "string" &&
              value[0].trim().startsWith("[") &&
              value[0].includes('"title"')
            ) {
              try {
                const parsed = JSON.parse(value[0]);
                isButtonFormat =
                  Array.isArray(parsed) &&
                  parsed.every(
                    (item) =>
                      typeof item === "object" &&
                      item !== null &&
                      "title" in item &&
                      "payload" in item
                  );
                if (isButtonFormat) {
                  return { type: "button", name: action.name, value: parsed };
                }
              } catch (e) {
                /* Not JSON or not button format */
              }
            }
    
            return { type: "text", name: action.name, variations: value };
          }
        });
    
        // 3. Generate Stories using Topological Sort
        const stories = [];
    
        // Create efficient lookup maps
        const nodeMap = Object.fromEntries(allNodes.map((node) => [node.id, node]));
        const outgoingEdges: { [key: string]: Edge[] } = {};
        const incomingEdges: { [key: string]: Edge[] } = {};
    
        // Initialize edge tracking
        allNodes.forEach((node) => {
          outgoingEdges[node.id] = [];
          incomingEdges[node.id] = [];
        });
    
        // Populate edge maps
        allEdges.forEach((edge) => {
          outgoingEdges[edge.source].push(edge);
          incomingEdges[edge.target].push(edge);
        });
    
        // Find start nodes
        const startNodes = allNodes.filter((node) => node.type === "start");
        if (startNodes.length === 0) {
          console.warn("No Start Nodes found.");
          toast.warn("No Start Nodes found.");
          setLoading(false);
          return;
        }
    
        // Process each story from start to end using topological ordering
        startNodes.forEach((startNode) => {
          const storyName =
            startNode.data?.storyId || `Generated_Story_${startNode.id}`;
    
          // Perform topological sort from this start node
          const visited = new Set();
          const path = []; // Will store nodes in topological order
          const onStack = new Set(); // For cycle detection
          let hasCycle = false;
    
          function dfs(nodeId) {
            if (hasCycle || nodeMap[nodeId].type === "end") {
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
            return; // Skip this story due to cycle
          }
    
          // Convert topological order to story steps (skip start node)
          const steps = [];
    
          for (let i = 0; i < path.length; i++) {
            const nodeId = path[i];
            const node = nodeMap[nodeId];
    
            // Skip start nodes in the steps
            if (node.type === "start") {
              continue;
            }
    
            // Skip end nodes in the steps
            if (node.type === "end") {
              continue;
            }
    
            if (node.type === "intent" && node.data?.intentId) {
              steps.push({ node: "intent", name: node.data.intentId });
            } else if (node.type === "action" && node.data?.name) {
              steps.push({ node: "action", name: node.data.name });
            } else if (node.type === "form" && node.data?.name) {
            steps.push({ node: "action", name: node.data.formId, type:"form" });
            }
          }
    
          if (steps.length > 0) {
            stories.push({ name: storyName, steps });
          } else {
            console.warn(`Story '${storyName}' has no steps.`);
          }
        });
    
        // Format entities
        const formattedEntities = Array.from(entitiesSet).map((name) => ({
          name,
        }));
        // 4. Assemble Slots Dynamically based on Entities
        const slots = formattedEntities.map((entity) => {
          const baseSlot: any = {
            name: entity.name,
            type: "text",
            influence_conversation: true,
            mappings: [],
            initial_value: null,
          };
    
          if (entity.type === "bool") {
            baseSlot.mappings = [{ type: "custom" }];
            baseSlot.initial_value = false;
          } else {
            baseSlot.mappings = [{ type: "from_entity", entity: entity.name }];
            if (entity.type === "float") {
              baseSlot.initial_value = 1;
              baseSlot.min_value = 1;
              baseSlot.max_value = 10;
            } else if (entity.type === "categorical") {
              baseSlot.initial_value = entity.values?.[0] || null;
              baseSlot.values = entity.values || [];
            }
          }
    
          return baseSlot;
        });
        const formattedForms: { name: string; formId: string, required_slots: string[] }[] = [];
        allNodes.forEach(node => {
            if (node.type === 'form' && node.data?.formId) {
                const validSlots = Array.isArray(node.data.slots)
                    ? node.data.slots.filter((s: any): s is string => typeof s === 'string')
                    : [];
        
                if (validSlots.length > 0) {
                    formattedForms.push({
                        name: node.data.formId,
                        required_slots: validSlots,
                    });
                    validSlots.forEach(slot => entitiesSet.add(slot));
                } else {
                    console.warn(`Form node ${node.id} (ID: ${node.data.formId}) has no valid slots.`);
                }
            }
        });
        
    
        // 5. Assemble Final JSON
        const exportData = {
          intents: formattedIntents,
          forms: formattedForms,
          actions: formattedActions,
          stories: stories,
          entities: formattedEntities,
          slots: slots,
        };
        console.log("Export Data Payload:", JSON.stringify(exportData, null, 2));
    
        // 6. Send to Backend API
        if (stories.length === 0) {
          toast.error("No valid stories generated.");
          setLoading(false);
          return;
        }
    
        try {
          await toast.promise(
            fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/train`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(exportData),
            })
              .then((response) => {
                if (!response.ok) {
                  setIsTrained(false);
                  throw new Error("Failed to send data to the API");
                }
                return response.json();
              })
              .then((data) => {
                console.log("✅ API response:", data);
                setIsTrained(true);
                return data;
              })
              .catch((error) => {
                setIsTrained(false);
                console.error("❌ Error sending data to API:", error);
                throw error;
              }),
            {
              pending: "Training model...",
              success: "Model training started!",
              error: {
                render({ data }) {
                  console.log("Training Error:", data);
    
                  return `Training failed: ${data?.message || "Unknown error"}`;
                },
              },
            },
            { autoClose: 3000 }
          );
        } catch (error) {
          setIsTrained(false);
          console.error("Export Error:", error);
        } finally {
          setLoading(false);
        }
      }, [intents, definedActions, getNodes, getEdges, setLoading, setIsTrained]);

    
    return {
        exportFlowData,
        // callPredictApi,
        isLoading, // Expose loading state if needed by UI
        isTrained, // Expose trained state
    };
}