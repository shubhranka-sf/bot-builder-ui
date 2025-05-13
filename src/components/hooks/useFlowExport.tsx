import { useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";
import { useReactFlow } from "reactflow";
import { toast } from "react-toastify";
import { isLoadingAtom, isBotTrainedAtom, AddBotVersionAtom } from "../../store/flowAtom";
import { IntentDefinition, ActionDefinition } from "../../types";

interface FlowExportProps {
  projectId: string;
  intents: IntentDefinition[];
  definedActions: ActionDefinition[];
}

// Hash utility using SHA-256
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
  edges.map(({ id, source, target, label }) => ({ id, source, target, label }));

const saveStoryVersion = (key: string, version: number) => {
  console.log("KEY", key);
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

    const formattedIntents = intents.map((i) => ({
      name: i.id,
      examples: i.examples || [],
      entities: i.entities || [],
    }));

    const entitiesSet = new Set<string>();
    intents.forEach((intent) => {
      intent.entities?.forEach((entity) => entitiesSet.add(entity));
    });

    const formattedActions = definedActions.map((action) => {
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

    const nodeMap = Object.fromEntries(allNodes.map((node) => [node.id, node]));
    const outgoingEdges: Record<string, any[]> = {};
    const incomingEdges: Record<string, any[]> = {};

    allNodes.forEach((node) => {
      outgoingEdges[node.id] = [];
      incomingEdges[node.id] = [];
    });

    allEdges.forEach((edge) => {
      outgoingEdges[edge.source].push(edge);
      incomingEdges[edge.target].push(edge);
    });

    const startNodes = allNodes.filter((node) => node.type === "start");
    const stories: ExportedStory[] = [];
    
    const traversePaths = (
      nodeId: string,
      path: string[] = [],
      visited = new Set<string>()
    ): string[][] => {
      if (visited.has(nodeId)) {
        toast.warn(`Loop detected at node ${nodeId}`);
        return [];
      }
    
      const newVisited = new Set(visited);
      newVisited.add(nodeId);
      const currentPath = [...path, nodeId];
    
      const nextEdges = outgoingEdges[nodeId] || [];
      if (nextEdges.length === 0 || nodeMap[nodeId]?.type === "end") {
        return [currentPath];
      }
    
      let allPaths: string[][] = [];
      for (const edge of nextEdges) {
        const subPaths = traversePaths(edge.target, currentPath, newVisited);
        allPaths.push(...subPaths);
      }
    
      return allPaths;
    };
    
    for (const startNode of startNodes) {
      const paths = traversePaths(startNode.id);
    
      for (const path of paths) {
        const steps = path
          .filter(
            (id) => nodeMap[id]?.type !== "start" && nodeMap[id]?.type !== "end"
          )
          .map((id) => {
            const node = nodeMap[id];
            if (node.type === "intent" && node.data?.intentId) {
              return { node: "intent", name: node.data.intentId };
            } else if (node.type === "form" && node.data?.formId) {
              return { node: "action", name: node.data.formId, type: "form" };
            } else if (node.type === "action" && node.data?.name) {
              return { node: "action", name: node.data.name };
            }
            return null;
          })
          .filter(Boolean);
    
        if (steps.length) {
          stories.push({
            name: `${startNode.data?.name || "story"}_${Math.random()
              .toString(36)
              .substring(2, 7)}`,
            steps,
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

        const formId = node.id;
        const formName = node.data.formId;

        const connectedActions = outgoingEdges[formId]
          .map((edge) => nodeMap[edge.target])
          .filter((n) => n?.type === "action" && n.data?.name);

        connectedActions.forEach((actionNode) => {
          form_rules.push({
            name: actionNode.data.name,
            form: formName,
            next_action: actionNode.data.name,
          });
        });
      }
    });

    const normalized = {
      nodes: normalizeNodes(allNodes),
      edges: normalizeEdges(allEdges),
      intents: formattedIntents,
      forms: formattedForms,
      actions: formattedActions,
      stories,
      entities: formattedEntities,
      slots,
    };

    const currentHash = await computeHash(normalized);
    const versionCountKey = `chatbot_version__${projectId}`;
    const hashKey = `chatbot_hash__${projectId}`;
    const previousHash = localStorage.getItem(hashKey);
    const currentVersion = parseInt(localStorage.getItem(versionCountKey) || "0") + 1;
    const chatbotVersion = `${projectId}__${currentVersion}`;

    const exportData = {
      metadata: [{ chatbotVersion }],
      intents: formattedIntents,
      forms: formattedForms,
      actions: formattedActions,
      stories,
      entities: formattedEntities,
      slots,
      form_rules,
    };
    console.log(JSON.stringify(exportData, null, 2));
    console.log("Previous hash", previousHash);
    console.log("current hash", currentHash);
    

    if (previousHash === currentHash) {
      toast.info("No changes detected — skipping training.", { autoClose: 2000 });
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
            throw new Error("Failed to train model");
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
          success: "Model training started!",
          error: {
            render({ data }) {
              return `Training failed: ${data?.message || "Unknown error"}`;
            },
          },
        },
        { autoClose: 3000 }
      );
    } catch (err) {
      setIsTrained(false);
      console.error("Training error:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, intents, definedActions, getNodes, getEdges, setIsTrained, setLoading]);

  return {
    exportFlowData,
    isLoading,
    isTrained,
  };
}
