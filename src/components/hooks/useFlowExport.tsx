import { useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";
import { useReactFlow } from "reactflow";
import { toast } from "react-toastify";
import { isLoadingAtom, isBotTrainedAtom } from "../../store/flowAtom";
import { IntentDefinition, ActionDefinition } from "../../types";
import { AddBotVersionAtom } from "../../store/flowAtom";
interface FlowExportProps {
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

// Normalize nodes (remove position, width, etc.)
const normalizeNodes = (nodes: any[]) =>
  nodes.map(({ id, type, data }) => ({ id, type, data }));

// Normalize edges (remove style, position info)
const normalizeEdges = (edges: any[]) =>
  edges.map(({ id, source, target, label }) => ({ id, source, target, label }));

// Utility to manage versioning
const getNextStoryVersion = (storyName: string): string => {
  const key = `chatbot_version__${storyName}`;
  const current = localStorage.getItem(key);
  const nextVersion = current ? parseInt(current) + 1 : 1;
  return `${storyName}__${nextVersion}`;
};

const saveStoryVersion = (storyName: string, version: number) => {
  localStorage.setItem(`chatbot_version__${storyName}`, version.toString());
};

export function useFlowExport({ intents, definedActions }: FlowExportProps) {
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
    if (!startNodes.length) {
      toast.warn("No Start Nodes found.");
      setLoading(false);
      return;
    }

    const stories = [];

    startNodes.forEach((startNode) => {
      const storyName =
        startNode.data?.storyId || `Generated_Story_${startNode.id}`;
      const visited = new Set<string>();
      const path: string[] = [];
      const onStack = new Set<string>();
      let hasCycle = false;

      function dfs(nodeId: string) {
        if (hasCycle || nodeMap[nodeId].type === "end") return;
        visited.add(nodeId);
        onStack.add(nodeId);

        for (const edge of outgoingEdges[nodeId] || []) {
          const nextId = edge.target;
          if (!visited.has(nextId)) {
            dfs(nextId);
          } else if (onStack.has(nextId)) {
            hasCycle = true;
            toast.warn(`Loop in story '${storyName}'.`);
            return;
          }
        }

        onStack.delete(nodeId);
        path.unshift(nodeId);
      }

      dfs(startNode.id);
      if (hasCycle) return;

      const steps = path
        .filter(
          (id) => nodeMap[id]?.type !== "start" && nodeMap[id]?.type !== "end"
        )
        .map((id) => {
          const node = nodeMap[id];
          if (node.type === "intent" && node.data?.intentId) {
            return { node: "intent", name: node.data.intentId };
          }
          if (node.type === "action" && node.data?.name) {
            return { node: "action", name: node.data.name };
          }
          if (node.type === "form" && node.data?.formId) {
            return { node: "action", name: node.data.formId, type: "form" };
          }
          return null;
        })
        .filter(Boolean);

      if (steps.length) {
        stories.push({ name: storyName, steps });
      } else {
        console.warn(`Story '${storyName}' has no steps.`);
      }
    });

    const formattedEntities = Array.from(entitiesSet).map((name) => ({ name }));
    const slots = formattedEntities.map((entity) => ({
      name: entity.name,
      type: "text",
      influence_conversation: true,
      mappings: [{ type: "from_entity", entity: entity.name }],
      initial_value: null,
    }));

    const formattedForms: { name: string; required_slots: string[] }[] = [];
    const form_rules: { name: string; form: string; next_action: string }[] =
      [];

    allNodes.forEach((node) => {
      if (node.type === "form" && node.data?.formId) {
        const validSlots = Array.isArray(node.data.slots)
          ? node.data.slots.filter(
              (s: any): s is string => typeof s === "string"
            )
          : [];

        if (validSlots.length > 0) {
          formattedForms.push({
            name: node.data.formId,
            required_slots: validSlots,
          });
          validSlots.forEach((slot) => entitiesSet.add(slot));
        }

        // --- Rule extraction ---
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

    const primaryStoryName = stories[0]?.name || "story";
    const versionCountKey = `chatbot_version__${primaryStoryName}`;
    const currentVersion = parseInt(
      localStorage.getItem(versionCountKey) || "0"
    );
    const nextVersion = currentVersion + 1;
    const chatbotVersion = `${primaryStoryName}__${nextVersion}`;

    const exportData = {
      metadata: [{ chatbotVersion }],
      intents: formattedIntents,
      forms: formattedForms,
      actions: formattedActions,
      stories,
      entities: formattedEntities,
      slots,
      form_rules, // <-- newly added rules array
    };

    console.log(JSON.stringify(exportData, null, 2));

    // Hash comparison
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

    const hashKey = `chatbot_hash__${primaryStoryName}`;
    const previousHash = localStorage.getItem(hashKey);
    const currentHash = await computeHash(normalized);

    if (previousHash === currentHash) {
      toast.info("No changes detected — skipping training.", {
        autoClose: 2000,
      });
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
          saveStoryVersion(primaryStoryName, nextVersion);
          localStorage.setItem(hashKey, currentHash);
          addBotVersion({
            version: chatbotVersion,
            timestamp: new Date().toISOString(),
            exportJson: exportData,
            nodes: allNodes,
            edges: allEdges,
          });
          console.log(addBotVersion);
          
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
  }, [intents, definedActions, getNodes, getEdges, setIsTrained, setLoading]);

  return {
    exportFlowData,
    isLoading,
    isTrained,
  };
}
