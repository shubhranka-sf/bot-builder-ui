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
  IntentDefinition,
  ActionDefinition,
} from "../../types";
import { parseEntitiesFromExamples } from "../../utils/entityParser";
import { getId } from "../../data/mockData";
import { slugify } from "../../utils/slugify";

interface NodeManagementProps {
  intents: IntentDefinition[];
  setIntents: React.Dispatch<React.SetStateAction<IntentDefinition[]>>;
  definedActions: ActionDefinition[];
  setDefinedActions: React.Dispatch<React.SetStateAction<ActionDefinition[]>>;
  setSelectedNode: React.Dispatch<React.SetStateAction<Node | null>>;
}

export function useNodeManagement({
  intents,
  setIntents,
  definedActions,
  setDefinedActions,
  setSelectedNode,
}: NodeManagementProps) {
  const [, setNodes] = useAtom(NodesAtom);
  const { addNodes, screenToFlowPosition, getNode, getNodes } = useReactFlow();

  // --- Generic Node Update ---
  const updateNode = useCallback(
    <T extends StartNodeData | IntentNodeData | ActionNodeData | FormNodeData>(
      nodeId: string,
      nodeType: string,
      updateData: Partial<T>
    ) => {
      let updatedNode: Node | null = null;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId && node.type === nodeType) {
            updatedNode = { ...node, data: { ...node.data, ...updateData } };
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

  // --- Specific Node Update Callbacks ---
  const updateStartNode = useCallback(
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

  const updateIntentNode = useCallback(
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
            console.log(
              "Updated intent definition:",
              updatedIntents[intentIndex]
            );
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

  const updateActionNode = useCallback(
    (nodeId: string, actionData: Partial<ActionNodeData>) => {
        const nodeToUpdate = getNode(nodeId);
        if (!nodeToUpdate || nodeToUpdate.type !== 'action') {
            toast.error("Cannot update: Node not found or not an action node.");
            return;
        }

        const isChangingWhichAction =
            actionData.name &&
            Object.keys(actionData).length === 1 && // Only 'name' is provided
            actionData.name !== nodeToUpdate.data?.name;

        let finalActionData: ActionNodeData;

        if (isChangingWhichAction && actionData.name) {
            // Changing the linked definition
            const newActionDefinition = definedActions.find((a) => a.name === actionData.name);
            if (newActionDefinition) {
                finalActionData = { ...newActionDefinition }; // Use a copy of the definition
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
            // Editing the properties of the current action (potentially updating definition too)
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

             // If editing (not just changing definition), update the global definition too
             if (finalActionData.name) {
                 setDefinedActions((prevActions) => {
                     const index = prevActions.findIndex((a) => a.name === finalActionData.name);
                     const definitionToUpdate: ActionDefinition = {
                         ...finalActionData, // Use the merged/final data
                         id: index > -1 ? prevActions[index].id : `action_${Date.now()}`, // Preserve or create ID
                     };

                     if (index > -1) {
                         const updated = [...prevActions];
                         updated[index] = definitionToUpdate;
                         console.log('Updated action definition:', definitionToUpdate);
                         return updated;
                     } else {
                         console.warn(`Action definition "${finalActionData.name}" not found during edit. Adding as new.`);
                         toast.info(`Defined new action: ${finalActionData.name}`);
                         return [...prevActions, definitionToUpdate];
                     }
                 });
             }
        }
         updateNode<ActionNodeData>(nodeId, 'action', finalActionData); // Update the node itself

    },
    [getNode, definedActions, setDefinedActions, updateNode]
);

  const updateFormNode = useCallback(
    (nodeId: string, formData: Partial<FormNodeData>) => {
      updateNode<FormNodeData>(nodeId, "form", formData);
    },
    [updateNode]
  );

  // --- Add Node ---
  const getCenterPosition = useCallback((): XYPosition => {
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
    (type: "intent" | "action" | "end" | "start" | "form") => {
      const position = getCenterPosition();
      let newNodeData: any = {};

      if (type === "start") {
        newNodeData = {
          storyName: `New Story`,
          storyId: `story_${getId().slice(-4)}`,
          label: `New Story`,
        };
      } else if (type === "intent") {
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
      } else if (type === "action") {
        const defaultAction = definedActions[0] || {
          title: "New Action",
          name: `action_new_${getId().slice(-4)}`,
          valueType: "text",
          variations: ["Configure me..."],
        };

        const baseTitle = defaultAction.title || "new-action";
        let baseSlug = slugify(baseTitle);
        let idSlug = `utter_${baseSlug}`;

        newNodeData = {
          title: defaultAction.title,
          name: idSlug,
          valueType: defaultAction.valueType,
          value:
            defaultAction.valueType === "function"
              ? defaultAction.value
              : defaultAction.variations?.[0],
          variations:
            defaultAction.valueType === "text"
              ? [...(defaultAction.variations || [""])]
              : undefined,
        };
      } else if (type === "form") {
        newNodeData = {
          name: "New Form",
          formId: `form_${getId().slice(-4)}`,
          slots: [],
        };
      } else if (type === "end") {
        newNodeData = {};
      }

      const newNode: Node = { id: getId(), type, position, data: newNodeData };
      addNodes(newNode);
    },
    [addNodes, getCenterPosition, definedActions, intents]
  );

  // --- Add Definitions ---
  const handleAddNewIntentDefinition = useCallback(
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

  const handleAddNewActionDefinition = useCallback(
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
        if (completeAction.valueType === "text") delete completeAction.value;
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
    handleAddNode,
    handleAddNewIntentDefinition,
    handleAddNewActionDefinition,
  };
}