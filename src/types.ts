// File: src/types.ts

// Define shared types

export interface ActionDefinition {
  id?: string; // Optional ID, might be added when stored
  title: string;
  name: string; // Unique identifier
  value: string; // Text content or function name
  valueType: 'text' | 'function';
}

export interface AvailableFunction {
  name: string;
  description: string;
}

export interface IntentDefinition {
  id: string;
  label: string;
  examples?: string[]; // Added optional examples array
}

// --- Node Data Types ---
export interface StartNodeData {
  story_id?: string; // Optional initially, will be added
  label?: string;
}

export interface IntentNodeData {
  intentId: string;
  examples?: string[];
}

export interface ActionNodeData extends Omit<ActionDefinition, 'id'> {} // Action node data IS the definition

export interface EndNodeData {
  // Currently no specific data needed for EndNode
}

// Generic Node data type (useful if needed, though specific types are better)
// export type FlowNodeData = StartNodeData | IntentNodeData | ActionNodeData | EndNodeData | {};