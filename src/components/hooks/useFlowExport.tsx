import { useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";
import { useReactFlow, Node as FlowNode } from "reactflow"; // Renamed Node to avoid conflict
import { toast } from "react-toastify";
import { isLoadingAtom, isBotTrainedAtom, AddBotVersionAtom } from "../../store/flowAtom";
import { IntentDefinition, ActionDefinition, IfNodeData, ScriptNodeData } from "../../types";

interface FlowExportProps {
  projectId: string;
  intents: IntentDefinition[];
  definedActions: ActionDefinition[];
}

interface ActionScriptDetails {
  actionName: string | null;
  className: string | null;
}

// Helper function to extract action name and class name from Rasa script content
const extractActionDetailsFromScript = (scriptContent: string | undefined): ActionScriptDetails => {
  if (!scriptContent) return { actionName: null, className: null };
  // Regex to capture class name (group 1) and action name (group 2)
  const detailsRegex = /class\s+([a-zA-Z_][a-zA-Z0-9_]*)\(Action\):(?:.|\n|\r)*?def\s+name\(self\)\s*->\s*Text:\s*return\s*"([a-zA-Z_][a-zA-Z0-9_]*)"/;
  const match = scriptContent.match(detailsRegex);
  return {
    className: match && match[1] ? match[1] : null,
    actionName: match && match[2] ? match[2] : null,
  };
};

// --- Template for IfNode script with FollowupAction (remains the same) ---
const createRasaIfFollowupActionScript = (
  baseActionName: string, 
  condition: string,
  trueActionName: string | null,
  falseActionName: string | null
): string => {
  // Extract a base for the class name from the action name (e.g., action_if_user_is_vip -> IfUserIsVip)
  let classNameBase = baseActionName
    .replace(/^action_if_/, "if_") // prefer 'if_xxx' for class name base
    .replace(/^action_/, "")      // fallback for other action_ prefixes
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  if (!classNameBase) classNameBase = "IfConditionGenerated"; // Ultimate fallback
  
  const className = `Action${classNameBase.replace(/[^a-zA-Z0-9]/g, '')}`;

  const trueActionFollowup = trueActionName ? `FollowupAction("${trueActionName}")` : 'None';
  const falseActionFollowup = falseActionName ? `FollowupAction("${falseActionName}")` : 'None';
  const sanitizedCondition = condition.replace(/;/g, '');

  return `from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import FollowupAction
# import logging
import datetime

# logger = logging.getLogger(__name__)

class ${className}(Action):
    def name(self) -> Text:
        return "${baseActionName}"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        condition_to_evaluate = """${sanitizedCondition}"""
        evaluation_result = False
        followup_event = None

        try:
            evaluation_result = eval(condition_to_evaluate, {"tracker": tracker, "datetime": datetime}, {})
        except Exception as e:
            # logger.error(f"Error evaluating condition '{{condition_to_evaluate}}' in action ${baseActionName}: {{e}}")
            dispatcher.utter_message(text=f"Error evaluating condition in action ${baseActionName}.")
            if ${falseActionFollowup} is not None:
                followup_event = ${falseActionFollowup}
            else:
                 dispatcher.utter_message(text="No action defined for the error/false path for ${baseActionName}.")
                 return [] 
            return [followup_event]

        if evaluation_result:
            if ${trueActionFollowup} is not None:
                followup_event = ${trueActionFollowup}
            else:
                 dispatcher.utter_message(text="Condition was TRUE for ${baseActionName}, but no action defined for the true path.")
                 return [] 
        else:
            if ${falseActionFollowup} is not None:
                followup_event = ${falseActionFollowup}
            else:
                 dispatcher.utter_message(text="Condition was FALSE for ${baseActionName}, but no action defined for the false path.")
                 return [] 
            
        return [followup_event]
`;
};


// Hash utility (remains the same)
async function computeHash(obj: any): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(obj));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const normalizeNodes = (nodes: any[]) =>
  nodes.map(({ id, type, data }) => ({ id, type, data }));

const normalizeEdges = (edges: any[]) =>
  edges.map(({ id, source, target, label, sourceHandle }) => ({ id, source, target, label, sourceHandle }));

const saveStoryVersion = (key: string, version: number) => {
  localStorage.setItem(key, version.toString());
};

export function useFlowExport({ projectId, intents, definedActions }: FlowExportProps) {
  const addBotVersion = useSetAtom(AddBotVersionAtom);
  const [isLoading, setLoading] = useAtom(isLoadingAtom);
  const [isTrained, setIsTrained] = useAtom(isBotTrainedAtom);
  const { getNodes, getEdges } = useReactFlow();

  const exportFlowData = useCallback(async () => {
    setLoading(true);

    const allNodes = getNodes();
    const allEdges = getEdges();
    const nodeMap = Object.fromEntries(allNodes.map((node) => [node.id, node]));

    const formattedIntents = intents.map((i) => ({
      name: i.id,
      examples: i.examples || [],
      entities: i.entities || [],
    }));

    const entitiesSet = new Set<string>();
    intents.forEach((intent) => {
      intent.entities?.forEach((entity) => entitiesSet.add(entity));
    });

    const codes: { [key: string]: { className: string; fileContent: string } } = {};

    allNodes.forEach(node => {
      if (node.type === 'script') {
        const scriptNodeData = node.data as ScriptNodeData;
        if (scriptNodeData.scriptContent) {
          const { actionName, className } = extractActionDetailsFromScript(scriptNodeData.scriptContent);
          if (actionName && className) {
            codes[actionName] = { className, fileContent: scriptNodeData.scriptContent };
          } else {
            toast.warn(`Could not extract details for ScriptNode ${node.id}. ActionName: ${actionName}, ClassName: ${className}`);
          }
        } else {
          toast.warn(`ScriptNode ${node.id} is missing scriptContent.`);
        }
      } else if (node.type === 'if') {
        const ifNodeData = node.data as IfNodeData;
        // The storyActionName is from the original IfNode script (slot-setting type)
        const { actionName: storyActionName } = extractActionDetailsFromScript(ifNodeData.scriptContent);

        if (storyActionName && ifNodeData.condition) {
          let trueTargetActionName: string | null = null;
          let falseTargetActionName: string | null = null;

          const outgoing = allEdges.filter(edge => edge.source === node.id);
          const trueEdge = outgoing.find(edge => edge.sourceHandle === 'true');
          const falseEdge = outgoing.find(edge => edge.sourceHandle === 'false');

          const getTargetActionName = (targetNodeId: string): string | null => {
            const targetNode = nodeMap[targetNodeId];
            if (!targetNode) return null;
            if (targetNode.type === 'action') return targetNode.data.name;
            if (targetNode.type === 'form') return targetNode.data.formId;
            if ((targetNode.type === 'if' || targetNode.type === 'script') && targetNode.data.scriptContent) {
              return extractActionDetailsFromScript(targetNode.data.scriptContent).actionName;
            }
            return null;
          };

          if (trueEdge) trueTargetActionName = getTargetActionName(trueEdge.target);
          if (falseEdge) falseTargetActionName = getTargetActionName(falseEdge.target);
          
          const followupScriptContent = createRasaIfFollowupActionScript(
            storyActionName, 
            ifNodeData.condition, 
            trueTargetActionName, 
            falseTargetActionName
          );
          const { className: followupClassName, actionName: followupActionName } = extractActionDetailsFromScript(followupScriptContent);

          if (followupClassName && followupActionName === storyActionName) {
            codes[storyActionName] = { className: followupClassName, fileContent: followupScriptContent };
          } else {
            toast.warn(`Error generating or parsing followup script for IfNode ${node.id}. Key: ${storyActionName}, FollowupAction: ${followupActionName}, FollowupClass: ${followupClassName}`);
            // Fallback: store original script content if followup generation fails to parse correctly
            if(ifNodeData.scriptContent && storyActionName){
                const { className: originalClassName } = extractActionDetailsFromScript(ifNodeData.scriptContent);
                if(originalClassName) codes[storyActionName] = { className: originalClassName, fileContent: ifNodeData.scriptContent };
            }
          }
        } else {
          if (!storyActionName) toast.warn(`Could not extract base action name for IfNode ${node.id}.`);
          if (!ifNodeData.condition) toast.warn(`IfNode ${node.id} is missing condition.`);
        }
      }
    });

    let finalFormattedActions = definedActions.map((action) => {
      if (action.valueType === "function") {
        return { type: "action", name: action.name };
      }
      const value = action.variations?.length ? action.variations : [""];
      try {
        const parsed = JSON.parse(value[0]);
        const isButton =
          Array.isArray(parsed) &&
          parsed.every((item: any) => item?.title && item?.payload);
        if (isButton) {
          return { type: "button", name: action.name, value: parsed };
        }
      } catch {}
      return { type: "text", name: action.name, variations: value };
    });

    const existingActionNames = new Set(finalFormattedActions.map(a => a.name));
    allNodes.forEach(node => {
      if (node.type === 'form' && node.data?.formId) {
        const formId = node.data.formId;
        if (!existingActionNames.has(formId)) {
          finalFormattedActions.push({ type: "action", name: formId });
          existingActionNames.add(formId);
        }
      }
    });

    const outgoingEdgesMap: Record<string, any[]> = {};
    allNodes.forEach((node) => { outgoingEdgesMap[node.id] = []; });
    allEdges.forEach((edge) => {
      if (!outgoingEdgesMap[edge.source]) outgoingEdgesMap[edge.source] = [];
      outgoingEdgesMap[edge.source].push(edge);
    });

    const startNodes = allNodes.filter((node) => node.type === "start");
    const stories: ExportedStory[] = [];
    
    const traversePaths = (
      currentNodeId: string,
      path: string[] = [],
      visitedInPath = new Set<string>()
    ): string[][] => {
      if (visitedInPath.has(currentNodeId)) {
        return [path]; 
      }
      const newVisitedInPath = new Set(visitedInPath);
      newVisitedInPath.add(currentNodeId);
      const currentPath = [...path, currentNodeId];
      const node = nodeMap[currentNodeId];
      if (!node || node.type === "end") {
        return [currentPath];
      }
      const nextEdges = outgoingEdgesMap[currentNodeId] || [];
      if (nextEdges.length === 0 && node.type !== "end") {
         return [currentPath];
      }
      let allStoryPaths: string[][] = [];
      for (const edge of nextEdges) {
         const subPaths = traversePaths(edge.target, currentPath, newVisitedInPath);
         allStoryPaths.push(...subPaths);
      }
      return allStoryPaths.length > 0 ? allStoryPaths : [currentPath];
    };
        
    for (const startNode of startNodes) {
      const storyPathsNodeIds = traversePaths(startNode.id);
      for (const nodeIdPath of storyPathsNodeIds) {
        const steps = nodeIdPath
          .map((id) => {
            const node = nodeMap[id];
            if (!node || node.type === "start" || node.type === "end") return null;
            if (node.type === "intent" && node.data?.intentId) {
              return { node: "intent", name: node.data.intentId };
            }
            let actionName: string | null = null;
            if (node.type === "form" && node.data?.formId) actionName = node.data.formId;
            else if (node.type === "action" && node.data?.name) actionName = node.data.name;
            else if ((node.type === "if" || node.type === "script") && node.data?.scriptContent) {
                actionName = extractActionDetailsFromScript(node.data.scriptContent).actionName;
            }
            if(actionName){
                return { node: "action", name: actionName, type: node.type === "form" ? "form" : undefined };
            } else if (node.type === "if" || node.type === "script") {
                 if(node.data?.scriptContent) toast.warn(`Skipping ${node.type}Node ${node.id} in story: Could not extract action name from its script.`);
                 else toast.warn(`Skipping ${node.type}Node ${node.id} in story: Missing scriptContent.`);
            }
            return null;
          })
          .filter(Boolean) as ExportedStoryStep[];
        if (steps.length > 0) {
          stories.push({
            name: `${startNode.data?.name || "story"}_${stories.length + 1}`,
            steps: steps,
          });
        }
      }
    }

    const formattedEntities = Array.from(entitiesSet).map((name) => ({ name }));
    const slots = formattedEntities.map((entity) => ({
      name: entity.name,
      type: "text",
      influence_conversation: true,
      mappings: [{ type: "from_entity", entity: entity.name }],
      initial_value: null,
    }));

    const formattedForms: { name: string; required_slots: string[] }[] = [];
    const form_rules: { name: string; form: string; next_action: string }[] = [];
    allNodes.forEach((node) => {
      if (node.type === "form" && node.data?.formId) {
        const validSlots = Array.isArray(node.data.slots)
          ? node.data.slots.filter((s: any): s is string => typeof s === "string")
          : [];
        if (validSlots.length > 0) {
          formattedForms.push({
            name: node.data.formId,
            required_slots: validSlots,
          });
          validSlots.forEach((slot) => entitiesSet.add(slot));
        }
        const formNodeId = node.id;
        const formName = node.data.formId;
        const connectedActions = (outgoingEdgesMap[formNodeId] || [])
          .map((edge:any) => nodeMap[edge.target])
          .filter((n:any) => n?.type === "action" && n.data?.name);
        connectedActions.forEach((actionNode:any) => {
          form_rules.push({
            name: actionNode.data.name, 
            form: formName,
            next_action: actionNode.data.name, 
          });
        });
      }
    });

    const normalizedForHash = {
      nodes: normalizeNodes(allNodes),
      edges: normalizeEdges(allEdges),
      intents: formattedIntents,
      forms: formattedForms,
      actions: finalFormattedActions, 
      stories,
      entities: formattedEntities,
      slots,
      codes, 
    };

    const currentHash = await computeHash(normalizedForHash);
    const versionCountKey = `chatbot_version__${projectId}`;
    const hashKey = `chatbot_hash__${projectId}`;
    const previousHash = localStorage.getItem(hashKey);
    const currentVersion = parseInt(localStorage.getItem(versionCountKey) || "0") + 1;
    const chatbotVersion = `${projectId}__${currentVersion}`;

    const exportData = {
      project_id: projectId,
      metadata: [{ chatbotVersion }],
      intents: formattedIntents,
      forms: formattedForms,
      actions: finalFormattedActions, 
      stories,
      entities: formattedEntities,
      slots,
      form_rules,
      codes, 
    };
    console.log("Exporting Data:", JSON.stringify(exportData, null, 2));
    
    if (previousHash === currentHash && isTrained) {
      toast.info("No changes detected since last training — skipping.", { autoClose: 2000 });
      setLoading(false);
      return;
    }

    try {
      await toast.promise(
        fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/train`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(exportData),
        }).then(async (res) => {
          if (!res.ok) {
            setIsTrained(false);
            const errorData = await res.json().catch(() => ({})); 
            throw new Error(errorData.message || `Training API request failed: ${res.status}`);
          }
          const result = await res.json();
          setIsTrained(true);
          saveStoryVersion(versionCountKey, currentVersion);
          localStorage.setItem(hashKey, currentHash);
          addBotVersion({
            version: chatbotVersion,
            timestamp: new Date().toISOString(),
            exportJson: exportData,
            nodes: allNodes,
            edges: allEdges,
          });
          return result;
        }),
        {
          pending: "Training model...",
          success: "Model training started! Check logs for details.",
          error: {
            render({ data }) {
              return `Training failed: ${data?.message || "Unknown error"}`;
            },
          },
        },
        { autoClose: 3000 }
      );
    } catch (err:any) {
      setIsTrained(false);
      console.error("Training error:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, intents, definedActions, getNodes, getEdges, setIsTrained, setLoading, addBotVersion, isTrained]);

  return {
    exportFlowData,
    isLoading,
    isTrained,
  };
}

interface ExportedStoryStep {
    node: 'intent' | 'action';
    name: string;
    type?: string; 
}
interface ExportedStory {
    name: string;
    steps: ExportedStoryStep[];
}