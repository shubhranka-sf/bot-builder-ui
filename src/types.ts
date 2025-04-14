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

// You can add other shared types here, e.g., for Intent definitions
export interface IntentDefinition {
  id: string;
  label: string;
  examples?: string[]; // Added optional examples array
}
