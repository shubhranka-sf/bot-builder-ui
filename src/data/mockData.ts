// File: src/data/mockData.ts
import { Node, Edge, MarkerType } from 'reactflow';
import { ActionDefinition, IntentDefinition, AvailableFunction } from '../types';

// --- React Flow Initial State ---

export const initialNodes: Node[] = [
  { id: "0", type: "start", position: { x: 50, y: 200 }, data: {} },
  {
    id: "1",
    type: "intent",
    position: { x: 300, y: 200 },
    data: { intentId: "intent_greet", examples: ["hello", "hi", "hey"] },
  },
  {
    id: "2",
    type: "action",
    position: { x: 550, y: 200 },
    data: {
      title: "Send Greeting",
      name: "utter_message",
      value: "Hello! How can I help you today?",
      valueType: "text",
    },
  },
  { id: "3", type: "end", position: { x: 800, y: 200 }, data: {} },
];

export const initialEdges: Edge[] = [
  {
    id: "e0-1",
    source: "0",
    target: "1",
    animated: true,
    style: { strokeWidth: 2 },
  },
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
    style: { strokeWidth: 2 },
  },
  { id: "e2-3", source: "2", target: "3", style: { strokeWidth: 2 } },
];

// --- Mock Definitions ---

export const mockIntents: IntentDefinition[] = [
  { id: 'intent_greet', label: 'Greeting' , examples: ['hello', 'hi', 'hey']},
  { id: 'intent_order', label: 'Place Order' , examples: ['order', 'buy', 'purchase']},
  { id: 'intent_support', label: 'Request Support' , examples: ['support', 'help', 'assist']},
  { id: 'intent_goodbye', label: 'Goodbye' , examples: ['bye', 'goodbye', 'see you']},
  { id: 'intent_faq_shipping', label: 'FAQ - Shipping' , examples: ['shipping', 'delivery', 'ship']},
  { id: 'intent_faq_returns', label: 'FAQ - Returns' , examples: ['return', 'exchange', 'refund']},
];

export const mockDefinedActions: ActionDefinition[] = [
    {
      title: "Send Message",
      name: "utter_message",
      value: "Default message text...",
      valueType: "text",
    },
    {
      title: "API Call",
      name: "api_call",
      value: "https://api.example.com/data",
      valueType: "text",
    },
    {
      title: "Transfer to Agent",
      name: "transfer_to_agent",
      value: "support_queue",
      valueType: "text",
    },
    {
      title: "Update Context",
      name: "update_context",
      value: '{ "user_status": "verified" }',
      valueType: "text",
    },
    {
      title: "Get User Data",
      name: "get_user_data",
      value: "getUserData", // Matches a name in mockAvailableFunctions
      valueType: "function",
    },
];

export const mockAvailableFunctions: AvailableFunction[] = [
  { name: 'getUserData', description: 'Fetches current user data' },
  { name: 'createSupportTicket', description: 'Creates a new support ticket' },
  { name: 'lookupOrder', description: 'Looks up an order by ID' },
  { name: 'sendConfirmationEmail', description: 'Sends a confirmation email' },
];

// --- React Flow Config ---

export const defaultEdgeOptions = {
  style: { stroke: "#9ca3af" },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#9ca3af",
    width: 20,
    height: 20,
  },
};

// Helper Function
export const getId = () => `dndnode_${+new Date()}`;