export interface ActionDefinition {
  id?: string; // Optional ID, might be added when stored
  title: string;
  name: string; // Unique identifier (e.g., utter_greet, action_lookup_db)
  valueType: 'text' | 'function';
  value?: string;
  variations?: string[];
}

export interface AvailableFunction {
  name: string;
  description: string;
}

export interface IntentDefinition {
  id: string;
  label: string;
  examples?: string[];
  entities?: string[];
}

export interface StartNodeData {
  storyName?: string;
  storyId?: string;
  label?: string;
}

export interface IntentNodeData {
  intentId: string;
  examples?: string[];
  entities?: string[];
  label?: string;
}

export interface ActionNodeData extends Omit<ActionDefinition, 'id'> {}

export interface FormNodeData {
    name: string;
    formId: string;
    slots: string[];
}

export interface ScriptUtilityFunction {
  id: string;
  name: string;
  description: string;
  codeSnippet: (params?: any) => string;
  icon?: React.ElementType;
}

export interface ScriptNodeData {
  name?: string;
  scriptContent?: string;
  description?: string;
}

// --- ADDED: IfNodeData definition ---
export interface IfNodeData {
  name?: string; // Name/label for the if node
  condition?: string; // Python expression to be evaluated
  description?: string;
  scriptContent?: string; // Holds the Rasa action template for this If node
}

export interface EndNodeData {}

export interface ChatbotVersion {
  version: string;
  timestamp: string;
  exportJson: any;
  nodes: any[];
  edges: any[];
}

// Generic Node data type
// export type FlowNodeData = StartNodeData | IntentNodeData | ActionNodeData | EndNodeData | ScriptNodeData | IfNodeData | {};