import { useCallback } from "react";
import { useAtom } from "jotai";
import { useReactFlow, Node, XYPosition } from "reactflow";
import { toast } from "react-toastify";
import { NodesAtom } from "../../store/flowAtom";
import {
  StartNodeData,
  IntentNodeData,
  ActionNodeData,
  FormNodeData,
  ScriptNodeData,
  IfNodeData, // --- IMPORT IfNodeData ---
  IntentDefinition,
  ActionDefinition,
} from "../../types";
import { parseEntitiesFromExamples } from "../../utils/entityParser";
import { getId } from "../../data/mockData";
// import { slugify } from "../../utils/slugify"; // Keep if used

const generateRandomSuffix = () => Math.random().toString(36).substring(2, 7).toUpperCase();

const createRasaActionTemplate = (baseName: string): string => {
  const randomSuffix = generateRandomSuffix();
  const className = `Action${baseName.replace(/[^a-zA-Z0-9_]/g, '')}${randomSuffix}`;
  const actionName = `action_${baseName.toLowerCase().replace(/\s+/g, '_')}_${randomSuffix.toLowerCase()}`;

  return `from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
# from rasa_sdk.events import SlotSet
# import logging

# logger = logging.getLogger(__name__)

class ${className}(Action):
    def name(self) -> Text:
        return "${actionName}"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Your custom Python code goes here
        dispatcher.utter_message(text="Hello from the ${actionName} action!")
        return []
`;
};

// --- ADDED: Helper function to create Rasa If Condition Action Template ---
const createRasaIfConditionActionTemplate = (baseName: string, condition: string): string => {
    const randomSuffix = generateRandomSuffix();
    const className = `ActionIf${baseName.replace(/[^a-zA-Z0-9_]/g, '')}${randomSuffix}`;
    const actionName = `action_if_${baseName.toLowerCase().replace(/\s+/g, '_')}_${randomSuffix.toLowerCase()}`;
    const trueSlot = `if_cond_${randomSuffix.toLowerCase()}_true`;
    const falseSlot = `if_cond_${randomSuffix.toLowerCase()}_false`;

    // Basic sanitization for the condition to prevent trivial script injection if used insecurely elsewhere.
    // For Rasa, this condition is Python code executed server-side.
    const sanitizedCondition = condition.replace(/;/g, ''); // Remove semicolons as a basic measure

    return `from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
# import logging

# logger = logging.getLogger(__name__)

class ${className}(Action):
    def name(self) -> Text:
        return "${actionName}"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        condition_to_evaluate = """${sanitizedCondition}"""
        evaluation_result = False
        slots_to_set = []

        # IMPORTANT: The 'tracker' object is available in the eval context.
        # You can use tracker.get_slot("slot_name"), tracker.latest_message, etc.
        # Be cautious with eval if the condition string can be manipulated by users.
        try:
            # logger.debug(f"Evaluating condition: {condition_to_evaluate}")
            evaluation_result = eval(condition_to_evaluate, {"tracker": tracker}, {})
            # logger.debug(f"Condition evaluated to: {evaluation_result}")
        except Exception as e:
            # logger.error(f"Error evaluating condition '{condition_to_evaluate}': {e}")
            dispatcher.utter_message(text=f"Error evaluating condition in action ${actionName}.")
            # Default to false path or handle error appropriately
            slots_to_set.append(SlotSet("${falseSlot}", True))
            slots_to_set.append(SlotSet("${trueSlot}", False)) # Ensure only one is true
            return slots_to_set

        if evaluation_result:
            # dispatcher.utter_message(text="Condition was TRUE.") # Optional debug message
            slots_to_set.append(SlotSet("${trueSlot}", True))
            slots_to_set.append(SlotSet("${falseSlot}", False))
        else:
            # dispatcher.utter_message(text="Condition was FALSE.") # Optional debug message
            slots_to_set.append(SlotSet("${falseSlot}", True))
            slots_to_set.append(SlotSet("${trueSlot}", False))
            
        return slots_to_set
`;
};


export function useNodeManagement({
  intents,
  setIntents,
  definedActions,
  setDefinedActions,
  setSelectedNode,
}: NodeManagementProps) {
  const [, setNodes] = useAtom(NodesAtom);
  const { addNodes, screenToFlowPosition, getNode, getNodes } = useReactFlow();

  const updateNode = useCallback(
    <T extends StartNodeData | IntentNodeData | ActionNodeData | FormNodeData | ScriptNodeData | IfNodeData>( // Added IfNodeData
      nodeId: string,
      nodeType: string,
      updateData: Partial<T>
    ) => {
      let updatedNode: Node | null = null;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId && node.type === nodeType) {
            // If updating condition for 'if' node, regenerate scriptContent
            if (nodeType === 'if' && 'condition' in updateData && typeof updateData.condition === 'string') {
                const currentData = node.data as IfNodeData;
                const baseName = currentData.name || "Condition";
                const newScriptContent = createRasaIfConditionActionTemplate(baseName, updateData.condition);
                updatedNode = {
                    ...node,
                    data: { ...currentData, ...updateData, scriptContent: newScriptContent }
                };
            } else {
                 updatedNode = { ...node, data: { ...node.data, ...updateData } };
            }
            return updatedNode;
          }
          return node;
        })
      );
      if (updatedNode) {
        setSelectedNode((prev) =>
          prev && prev.id === nodeId && prev.type === nodeType
            ? updatedNode
            : prev
        );
      }
    },
    [setNodes, setSelectedNode]
  );

  const updateStartNode = useCallback( /* ... (no change) ... */
    (nodeId: string, newStoryName: string, newStoryId?: string) => {
      const updateData: Partial<StartNodeData> = {
        storyName: newStoryName,
        label: newStoryName,
      };
      if (newStoryId !== undefined) updateData.storyId = newStoryId;
      updateNode<StartNodeData>(nodeId, "start", updateData);
    },
    [updateNode]
  );

  const updateIntentNode = useCallback( /* ... (no change) ... */
    (nodeId: string, newIntentId: string, newExamples?: string[]) => {
      const intentDefinition = intents.find((i) => i.id === newIntentId);
      const finalExamples = newExamples ?? intentDefinition?.examples ?? [];
      const parsedEntities = parseEntitiesFromExamples(finalExamples);
      const nodeUpdateData: Partial<IntentNodeData> = {
        intentId: newIntentId,
        examples: finalExamples,
        entities: parsedEntities,
        label: intentDefinition?.label,
      };
      updateNode<IntentNodeData>(nodeId, "intent", nodeUpdateData);

      if (newExamples !== undefined) {
        setIntents((prevIntents) => {
          const intentIndex = prevIntents.findIndex(
            (i) => i.id === newIntentId
          );
          if (intentIndex > -1) {
            const updatedIntents = [...prevIntents];
            updatedIntents[intentIndex] = {
              ...updatedIntents[intentIndex],
              examples: finalExamples,
              entities: parsedEntities,
            };
            return updatedIntents;
          } else {
            console.warn(
              `Intent definition "${newIntentId}" not found during example update.`
            );
          }
          return prevIntents;
        });
      }
    },
    [updateNode, intents, setIntents]
  );

  const updateActionNode = useCallback( /* ... (no change) ... */
    (nodeId: string, actionData: Partial<ActionNodeData>) => {
        const nodeToUpdate = getNode(nodeId);
        if (!nodeToUpdate || nodeToUpdate.type !== 'action') {
            toast.error("Cannot update: Node not found or not an action node.");
            return;
        }

        const isChangingWhichAction =
            actionData.name &&
            Object.keys(actionData).length === 1 &&
            actionData.name !== nodeToUpdate.data?.name;

        let finalActionData: ActionNodeData;

        if (isChangingWhichAction && actionData.name) {
            const newActionDefinition = definedActions.find((a) => a.name === actionData.name);
            if (newActionDefinition) {
                finalActionData = { ...newActionDefinition };
            } else {
                console.warn(`Selected action definition "${actionData.name}" not found.`);
                toast.warn(`Definition for "${actionData.name}" not found. Creating basic.`);
                finalActionData = {
                    name: actionData.name,
                    title: actionData.name,
                    valueType: 'text',
                    variations: ['Configure me...'],
                };
            }
        } else {
            const baseData = nodeToUpdate.data || {};
            const determinedType = actionData.valueType || baseData.valueType || 'text';
            const mergedVariations = determinedType === 'text'
                ? (actionData.variations ?? baseData.variations ?? [''])
                : undefined;

            finalActionData = {
                name: actionData.name || baseData.name || `action_${nodeId.slice(0, 4)}`,
                title: actionData.title || baseData.title || actionData.name || baseData.name || 'Untitled Action',
                valueType: determinedType,
                value: determinedType === 'function'
                    ? (actionData.value ?? baseData.value ?? '')
                    : (mergedVariations?.[0] ?? ''),
                variations: mergedVariations,
            };

             if (finalActionData.name) {
                 setDefinedActions((prevActions) => {
                     const index = prevActions.findIndex((a) => a.name === finalActionData.name);
                     const definitionToUpdate: ActionDefinition = {
                         ...finalActionData,
                         id: index > -1 ? prevActions[index].id : `action_${Date.now()}`,
                     };

                     if (index > -1) {
                         const updated = [...prevActions];
                         updated[index] = definitionToUpdate;
                         return updated;
                     } else {
                         console.warn(`Action definition "${finalActionData.name}" not found during edit. Adding as new.`);
                         toast.info(`Defined new action: ${finalActionData.name}`);
                         return [...prevActions, definitionToUpdate];
                     }
                 });
             }
        }
         updateNode<ActionNodeData>(nodeId, 'action', finalActionData);

    },
    [getNode, definedActions, setDefinedActions, updateNode]
  );

  const updateFormNode = useCallback( /* ... (no change) ... */
    (nodeId: string, formData: Partial<FormNodeData>) => {
      updateNode<FormNodeData>(nodeId, "form", formData);
    },
    [updateNode]
  );

  const updateScriptNode = useCallback( /* ... (no change) ... */
    (nodeId: string, scriptData: Partial<ScriptNodeData>) => {
      updateNode<ScriptNodeData>(nodeId, "script", scriptData);
    },
    [updateNode]
  );

  // --- ADDED: updateIfNode ---
  const updateIfNode = useCallback(
    (nodeId: string, ifData: Partial<IfNodeData>) => {
      // If the condition changes, the scriptContent also needs to be regenerated
      if (ifData.condition !== undefined) {
          const node = getNode(nodeId);
          if (node && node.type === 'if') {
              const currentData = node.data as IfNodeData;
              const baseName = ifData.name || currentData.name || "Condition";
              const newScriptContent = createRasaIfConditionActionTemplate(baseName, ifData.condition);
              updateNode<IfNodeData>(nodeId, "if", { ...ifData, scriptContent: newScriptContent });
              return;
          }
      }
      updateNode<IfNodeData>(nodeId, "if", ifData);
    },
    [updateNode, getNode]
  );


  const getCenterPosition = useCallback((): XYPosition => { /* ... (no change) ... */
    const flowPane = document.querySelector(".react-flow__pane");
    if (flowPane) {
      const bounds = flowPane.getBoundingClientRect();
      const xOffset = 100;
      const yOffset = 50;
      return screenToFlowPosition({
        x: bounds.width / 2 - xOffset,
        y: bounds.height / 3 - yOffset,
      });
    }
    const nodesCount = getNodes().length;
    return {
      x: 250 + (nodesCount % 5) * 50,
      y: 150 + Math.floor(nodesCount / 5) * 50,
    };
  }, [screenToFlowPosition, getNodes]);

  const handleAddNode = useCallback(
    (type: "intent" | "action" | "end" | "start" | "form" | "script" | "if") => { // --- Added "if" ---
      const position = getCenterPosition();
      let newNodeData: any = {};
      const baseNodeId = getId();

      if (type === "start") { /* ... (no change) ... */
        newNodeData = {
          storyName: `New Story`,
          storyId: `story_${baseNodeId.slice(-6)}`,
          label: `New Story`,
        };
      } else if (type === "intent") { /* ... (no change) ... */
        const defaultIntent = intents[0] || {
          id: "intent_new",
          label: "New Intent",
          examples: [],
          entities: [],
        };
        newNodeData = {
          intentId: defaultIntent.id,
          examples: [...(defaultIntent.examples || [])],
          entities: [...(defaultIntent.entities || [])],
          label: defaultIntent.label,
        };
      } else if (type === "action") { /* ... (no change) ... */
        const defaultAction = definedActions[0] || {
          title: "New Action",
          name: `action_new_${baseNodeId.slice(-6)}`,
          valueType: "text",
          variations: ["Configure me..."],
        };
        newNodeData = {
          title: defaultAction.title,
          name: defaultAction.name,
          valueType: defaultAction.valueType,
          value: defaultAction.valueType === "function" ? defaultAction.value : defaultAction.variations?.[0],
          variations: defaultAction.valueType === "text" ? [...(defaultAction.variations || [""])] : undefined,
        };
      } else if (type === "form") { /* ... (no change) ... */
        newNodeData = {
          name: "New Form",
          formId: `form_${baseNodeId.slice(-6)}`,
          slots: [],
        };
      } else if (type === "script") { /* ... (no change) ... */
        const scriptBaseName = "MyCustomScript";
        newNodeData = {
            name: `Custom Script ${generateRandomSuffix()}`,
            description: 'A Rasa custom action script.',
            scriptContent: createRasaActionTemplate(scriptBaseName)
        };
      } else if (type === "if") { // --- ADDED IF NODE DATA ---
        const ifBaseName = "ConditionCheck";
        const defaultCondition = 'tracker.get_slot("some_slot") == "expected_value"';
        newNodeData = {
            name: `If Condition ${generateRandomSuffix()}`,
            description: 'Evaluates a Python condition to branch the flow.',
            condition: defaultCondition,
            scriptContent: createRasaIfConditionActionTemplate(ifBaseName, defaultCondition)
        };
      } else if (type === "end") { /* ... (no change) ... */
        newNodeData = {};
      }

      const newNode: Node = { id: baseNodeId, type, position, data: newNodeData };
      addNodes(newNode);
    },
    [addNodes, getCenterPosition, definedActions, intents]
  );

  const handleAddNewIntentDefinition = useCallback( /* ... (no change) ... */
    (newIntent: IntentDefinition) => {
      setIntents((prev) => {
        if (prev.some((i) => i.id === newIntent.id)) {
          toast.error(`Intent ID "${newIntent.id}" already exists.`);
          return prev;
        }
        toast.success(`Intent "${newIntent.label}" defined.`);
        return [...prev, newIntent];
      });
    },
    [setIntents]
  );

  const handleAddNewActionDefinition = useCallback( /* ... (no change) ... */
    (newAction: ActionDefinition) => {
      setDefinedActions((prev) => {
        if (prev.some((a) => a.name === newAction.name)) {
          toast.error(`Action Name "${newAction.name}" already exists.`);
          return prev;
        }
        toast.success(`Action "${newAction.title || newAction.name}" defined.`);
        const completeAction: ActionDefinition = {
          id: `action_${Date.now()}`,
          ...newAction,
          value:
            newAction.valueType === "function"
              ? newAction.value || ""
              : newAction.variations?.[0] || "",
          variations:
            newAction.valueType === "text"
              ? newAction.variations && newAction.variations.length > 0
                ? newAction.variations
                : [""]
              : undefined,
        };
        if (completeAction.valueType === "text" && completeAction.variations && completeAction.variations.length > 0) {
            completeAction.value = completeAction.variations[0];
        } else if (completeAction.valueType === 'text') {
            delete completeAction.value;
        }

        if (completeAction.valueType === "function")
          delete completeAction.variations;

        return [...prev, completeAction];
      });
    },
    [setDefinedActions]
  );

  return {
    updateNode,
    updateStartNode,
    updateIntentNode,
    updateActionNode,
    updateFormNode,
    updateScriptNode,
    updateIfNode, // --- EXPORT updateIfNode ---
    handleAddNode,
    handleAddNewIntentDefinition,
    handleAddNewActionDefinition,
  };
}