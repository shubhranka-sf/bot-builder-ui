// ./src/types.ts
// File: src/types.ts

// Define shared types

export interface ActionDefinition {
  id?: string; // Optional ID, might be added when stored
  title: string;
  name: string; // Unique identifier (e.g., utter_greet, action_lookup_db)
  valueType: 'text' | 'function';
  // Value is used for function name if valueType is 'function'
  // For text, 'variations' is preferred. 'value' might hold the first variation or be ignored.
  value?: string;
  variations?: string[]; // ADDED: For text responses
}

export interface AvailableFunction {
  name: string;
  description: string;
}

export interface IntentDefinition {
  id: string;
  label: string;
  examples?: string[];
  entities?: string[]; // Store unique entity names found in examples
}

// --- Node Data Types ---
export interface StartNodeData {
  storyName?: string; // Optional initially, will be added
  storyId?: string; // Optional story ID
  label?: string; // Keep label for potential display consistency if needed
}

export interface IntentNodeData {
  intentId: string;
  examples?: string[];
  entities?: string[]; // Reflect entities of the linked definition
  label?: string; // Display label from definition
}

// ActionNodeData mirrors ActionDefinition but omits 'id' as it's part of the Node itself
export interface ActionNodeData extends Omit<ActionDefinition, 'id'> {}

// ADDED: FormNodeData definition
export interface FormNodeData {
    name: string; // Display name (e.g., "Collect User Info")
    formId: string; // Unique ID for the form (e.g., "user_info_form")
    slots: string[]; // Array of entity names required by the form
}

export interface EndNodeData {
  // Currently no specific data needed for EndNode
}

export interface ChatbotVersion {
  version: string;
  timestamp: string;
  exportJson: any;
  nodes: any[];
  edges: any[];
}

// Generic Node data type (useful if needed, though specific types are better)
// export type FlowNodeData = StartNodeData | IntentNodeData | ActionNodeData | EndNodeData | {};