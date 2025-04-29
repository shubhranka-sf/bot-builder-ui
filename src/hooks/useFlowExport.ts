import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { useReactFlow } from 'reactflow';
import { toast } from 'react-toastify';
import { isLoadingAtom, isBotTrainedAtom } from '../store/flowAtom';
import { IntentDefinition, ActionDefinition, StoryStep } from '../types';

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

        // 1. Format Intents
        const formattedIntents = intents.map((i) => ({
            name: i.id,
            examples: i.examples || [],
            entities: i.entities || [],
        }));

        const entitiesSet = new Set<string>();
        intents.forEach((intent) => {
            intent.entities?.forEach((entity) => entitiesSet.add(entity));
        });

        // 2. Format Actions
        const formattedActions = definedActions.map((action) => {
            if (action.valueType === 'function') {
                return { type: 'action', name: action.name };
            } else {
                const value = action.variations && action.variations.length > 0 ? action.variations : [''];
                let isButtonFormat = false;
                if (value.length === 1 && typeof value[0] === 'string' && value[0].trim().startsWith('[') && value[0].includes('"title"')) {
                    try {
                        const parsed = JSON.parse(value[0]);
                        isButtonFormat = Array.isArray(parsed) && parsed.every((item) => typeof item === 'object' && item !== null && 'title' in item && 'payload' in item);
                        if (isButtonFormat) return { type: 'button', name: action.name, value: parsed };
                    } catch (e) { /* Ignore parsing error */ }
                }
                return { type: 'text', name: action.name, variations: value };
            }
        });

        // 3. Format Forms
        const formattedForms: { [formId: string]: { required_slots: string[] } } = {};
        allNodes.forEach(node => {
            if (node.type === 'form' && node.data?.formId) {
                const validSlots = Array.isArray(node.data.slots) ? node.data.slots.filter((s: any): s is string => typeof s === 'string') : [];
                if (validSlots.length > 0) {
                    formattedForms[node.data.formId] = { required_slots: validSlots };
                    validSlots.forEach(slot => entitiesSet.add(slot));
                } else {
                    console.warn(`Form node ${node.id} (ID: ${node.data.formId}) has no valid slots.`);
                }
            }
        });

        // 4. Generate Stories
        const stories: { name: string; steps: StoryStep[] }[] = [];
        const nodeMap = Object.fromEntries(allNodes.map((node) => [node.id, node]));
        const outgoingEdges: { [key: string]: ReturnType<typeof getEdges> } = {};
        const incomingEdges: { [key: string]: ReturnType<typeof getEdges> } = {};

        allNodes.forEach((node) => {
            outgoingEdges[node.id] = [];
            incomingEdges[node.id] = [];
        });
        allEdges.forEach((edge) => {
            if (!outgoingEdges[edge.source]) outgoingEdges[edge.source] = [];
            if (!incomingEdges[edge.target]) incomingEdges[edge.target] = [];
            outgoingEdges[edge.source].push(edge);
            incomingEdges[edge.target].push(edge);
        });

        const startNodes = allNodes.filter((node) => node.type === 'start');
        if (startNodes.length === 0) {
            toast.warn('No Start Nodes found.');
            setLoading(false);
            return;
        }

        startNodes.forEach((startNode) => {
            const storyName = startNode.data?.storyId || `Generated_Story_${startNode.id}`;
            const visited = new Set<string>();
            const path: string[] = [];
            const onStack = new Set<string>();
            let hasCycle = false;

            function dfs(nodeId: string) {
                 if (!nodeMap[nodeId]) {
                     console.warn(`DFS Error: Node ${nodeId} not found in story ${storyName}`);
                     hasCycle = true; // Treat as error
                     return;
                 }
                if (hasCycle || nodeMap[nodeId].type === 'end') return;
                visited.add(nodeId);
                onStack.add(nodeId);
                for (const edge of outgoingEdges[nodeId] || []) {
                    const nextId = edge.target;
                    if (!visited.has(nextId)) {
                        dfs(nextId);
                    } else if (onStack.has(nextId)) {
                        hasCycle = true;
                        console.warn(`Loop detected in story '${storyName}' at ${nextId}.`);
                        toast.warn(`Loop in story '${storyName}'.`);
                        return;
                    }
                }
                onStack.delete(nodeId);
                path.unshift(nodeId);
            }

            dfs(startNode.id);

            if (hasCycle) return;

            const steps: StoryStep[] = [];
            for (const nodeId of path) {
                 const node = nodeMap[nodeId];
                 if (node.type === 'start' || node.type === 'end') continue;

                 if (node.type === 'intent' && node.data?.intentId) steps.push({ node: 'intent', name: node.data.intentId });
                 else if (node.type === 'action' && node.data?.name) steps.push({ node: 'action', name: node.data.name });
                 else if (node.type === 'form' && node.data?.formId) steps.push({ node: 'form', name: node.data.formId });
             }

             if (steps.length > 0) stories.push({ name: storyName, steps });
             else console.warn(`Story '${storyName}' has no valid steps.`);
         });

        // 5. Format Entities
        const formattedEntities = Array.from(entitiesSet).map((name) => ({ name }));

        // 6. Assemble Final JSON
        const exportData: any = {
            intents: formattedIntents,
            actions: formattedActions,
            entities: formattedEntities,
            stories: stories,
        };
        if (Object.keys(formattedForms).length > 0) {
            exportData.forms = formattedForms;
        }
        console.log('Export Data Payload:', JSON.stringify(exportData, null, 2));

        // 7. Send to Backend API
        if (stories.length === 0 && Object.keys(formattedForms).length === 0 && formattedIntents.length === 0) {
             toast.error('No valid data to train (no stories, forms, or intents found).');
             setLoading(false);
             return;
        }
        if (stories.length === 0) {
             toast.warn('No stories generated, but proceeding with training intents/actions/forms.');
        }


        try {
            await toast.promise(
                fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/train`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(exportData),
                })
                .then(async (response) => { // Make async to await error parsing
                    if (!response.ok) {
                        setIsTrained(false);
                        const err = await response.json().catch(() => ({}));
                        throw new Error(err?.message || `API Error ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    console.log('✅ API response:', data);
                    setIsTrained(true);
                    return data;
                })
                .catch((error) => {
                    setIsTrained(false);
                    console.error('❌ Error sending data to API:', error);
                    throw error; // Re-throw for toast.promise
                }),
                {
                    pending: 'Training model...',
                    success: 'Model training started!',
                    error: {
                        render({ data }) {
                             console.error('Training Error Render:', data);
                             const message = data instanceof Error ? data.message : 'Unknown training error';
                            return `Training failed: ${message}`;
                        },
                    },
                },
                { autoClose: 3000 }
            );
        } catch (error) {
            console.error('Export Error:', error);
            // Generic error handled by toast.promise's catch
        } finally {
            setLoading(false);
        }
    }, [intents, definedActions, getNodes, getEdges, setLoading, setIsTrained]); // Added dependencies

    const callPredictApi = useCallback(async (message: string): Promise<string> => {
        if (!isTrained) {
            return "The bot hasn't been trained yet. Please train the model first.";
        }
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: message,
                    model_name: 'default_model.tar.gz',
                    sender_id: 'user_flow_tester',
                }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || `Predict API Error: ${response.statusText} (${response.status})`);
            }
            const data = await response.json();
            return data.response?.map((r: any) => r.text).join('\n') || 'Sorry, I received an empty response.';
        } catch (error) {
            console.error('Predict API Error:', error);
            const errorMsg = error instanceof Error ? error.message : 'Prediction request failed.';
            toast.error(errorMsg);
            return `Error: ${errorMsg}`;
        } finally {
            setLoading(false);
        }
    }, [isTrained, setLoading]); // Dependencies

    return {
        exportFlowData,
        callPredictApi,
        isLoading, // Expose loading state if needed by UI
        isTrained, // Expose trained state
    };
}