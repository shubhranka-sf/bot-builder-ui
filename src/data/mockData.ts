// File: src/data/mockData.ts
import { Node, Edge, MarkerType } from 'reactflow';
import {
  ActionDefinition,
  IntentDefinition,
  AvailableFunction,
  StartNodeData,
  IntentNodeData,
  ActionNodeData,
  EndNodeData,
} from '../types'; // Import specific data types
import { parseEntitiesFromExamples } from '../utils/entityParser'; // Import helper

// --- React Flow Initial State ---

// Helper to populate entities in initial mock data based on examples
const populateInitialEntities = (intents: Omit<IntentDefinition, 'entities'>[]): IntentDefinition[] => {
  return intents.map(intent => ({
    ...intent,
    entities: parseEntitiesFromExamples(intent.examples || [])
  }));
};


// Define intents first
const baseMockIntents: Omit<IntentDefinition, 'entities'>[] = [
  { id: 'intent_greet', label: 'Greeting', examples: ['hello', 'hi', 'hey', 'good morning'] },
  {
    id: 'intent_order',
    label: 'Place Order',
    examples: [
      'I want to order a [pizza](food_item)',
      'buy one [large soda](drink_item)',
      'purchase the [special combo](menu_item)',
      'can I get a [cheeseburger](food_item)?'
    ]
  },
  {
    id: 'intent_support',
    label: 'Request Support',
    examples: ['support needed', 'I need help with my [order](support_topic)', 'assist me please']
  },
  { id: 'intent_goodbye', label: 'Goodbye', examples: ['bye', 'goodbye', 'see you later', 'take care'] },
  {
    id: 'intent_faq_shipping',
    label: 'FAQ - Shipping',
    examples: ['shipping cost', 'delivery time to [London](location)', 'track my [shipment](support_topic)']
  },
  { id: 'intent_faq_returns', label: 'FAQ - Returns', examples: ['return policy', 'exchange process', 'refund status'] },
  {
    id: 'intent_provide_info',
    label: 'Provide Info',
    examples: [
        'My account number is [123456789](account_number)',
        'Use phone [9876543210](phone_number)',
        'My email is [test@example.com](email_address)',
        'account [ACC1001](account_number) and phone [555-1212](phone_number)'
    ]
  }
];

// Populate entities for the final export
export const mockIntents: IntentDefinition[] = populateInitialEntities(baseMockIntents);


// --- Action Definitions (with Variations) ---
export const mockDefinedActions: ActionDefinition[] = [
   {
    title: 'Send Greeting Response',
    name: 'utter_greet_response',
    valueType: 'text',
    // Use variations array for text types
    variations: [
        'Hello there! What can I do for you?',
        'Hi! How may I help?',
        'Hey, need assistance with anything?'
    ],
    value: 'Hello there! What can I do for you?' // Keep value as first variation maybe? Or remove? Let's keep for now.
  },
  {
    title: 'Acknowledge Provided Info',
    name: 'utter_acknowledge_info',
     valueType: 'text',
    variations: [
        'Got it, thanks for the details!',
        'Okay, I\'ve noted that down.',
        'Thanks for providing the information.'
    ],
     value: 'Got it, thanks for the details!',
  },
  {
    title: 'Ask for Order Details',
    name: 'utter_ask_order_details',
    valueType: 'text',
    variations: [ 'Sure, what would you like to order?' ], // Single variation
    value: 'Sure, what would you like to order?',
  },
  {
    title: 'Provide Shipping Info',
    name: 'utter_shipping_info',
    valueType: 'text',
    variations: [ 'Standard shipping takes 3-5 business days.' ],
    value: 'Standard shipping takes 3-5 business days.',
  },
  {
    title: 'API Call - Check Order',
    name: 'action_check_order_api',
    valueType: 'function',
    value: 'checkOrderStatus', // Function name goes in value
    // variations: undefined // No variations for functions
  },
  {
    title: 'Transfer to Agent',
    name: 'action_transfer_to_agent',
    valueType: 'function',
    value: 'transferToSupportQueue',
    // variations: undefined
  },
   {
    title: 'Send Goodbye Message',
    name: 'utter_goodbye',
    valueType: 'text',
    variations: [
        'Goodbye! Have a great day.',
        'See you later!',
        'Take care!'
    ],
    value: 'Goodbye! Have a great day.',
  },
];


// Explicitly type initialNodes using the specific data types
// THIS SECTION BUILDS NODES BASED ON ABOVE DEFINITIONS - ENSURE CONSISTENCY
// Retrieve full definition data for nodes
const getIntentNodeData = (intentId: string): IntentNodeData => {
    const intent = mockIntents.find(i => i.id === intentId);
    return intent
        ? { intentId: intent.id, examples: intent.examples, entities: intent.entities, label: intent.label }
        : { intentId: intentId, examples: [], entities: [], label: intentId }; // Fallback
};

const getActionNodeData = (actionName: string): ActionNodeData => {
    const action = mockDefinedActions.find(a => a.name === actionName);
    return action
        ? { ...action } // Return copy of the definition
        : { name: actionName, title: actionName, valueType: 'text', variations: ['Action definition not found!'] }; // Fallback
};


export const initialNodes: Node<StartNodeData | IntentNodeData | ActionNodeData | EndNodeData>[] = [
  {
    id: '0', type: 'start', position: { x: 50, y: 200 },
    data: { storyName: 'Greeting Flow', storyId: 'story_greeting', label: 'Greeting Flow' },
  },
  {
    id: '1', type: 'intent', position: { x: 300, y: 150 },
    data: getIntentNodeData('intent_greet'),
  },
  {
    id: '2', type: 'action', position: { x: 550, y: 150 },
    data: getActionNodeData('utter_greet_response'),
  },
  {
    id: '3', type: 'end', position: { x: 800, y: 150 }, data: {},
  },
  {
    id: '4', type: 'intent', position: { x: 300, y: 300 },
    data: getIntentNodeData('intent_provide_info'),
  },
  {
    id: '5', type: 'action', position: { x: 550, y: 300 },
    data: getActionNodeData('utter_acknowledge_info'),
  },
  {
    id: '6', type: 'end', position: { x: 800, y: 300 }, data: {},
  },
  {
    id: '7', type: 'intent', position: { x: 550, y: 450 },
    data: getIntentNodeData('intent_goodbye'),
  },
  {
    id: '8', type: 'action', position: { x: 800, y: 450 },
    data: getActionNodeData('utter_goodbye'),
  },
  {
    id: '9', type: 'end', position: { x: 1050, y: 450 }, data: {},
  },
];


// Define initial edges separately
export const initialEdgesData: Omit<Edge, 'id' | 'markerEnd' | 'style' | 'animated'>[] = [
  { source: '0', target: '1' },
  { source: '1', target: '2' },
  { source: '2', target: '3' },
  { source: '2', target: '4', label: 'User provides info' }, // Example conditional path
  { source: '4', target: '5' },
  { source: '5', target: '6' },
  { source: '5', target: '7', label: 'User says bye' },
  { source: '7', target: '8' },
  { source: '8', target: '9' },
];

// --- Mock Functions (Unchanged) ---
export const mockAvailableFunctions: AvailableFunction[] = [
  { name: 'checkOrderStatus', description: 'Checks the status of an order via API' },
  { name: 'transferToSupportQueue', description: 'Transfers the chat to a human agent' },
  { name: 'createSupportTicket', description: 'Creates a new support ticket' },
  { name: 'lookupOrder', description: 'Looks up an order by ID' },
  { name: 'sendConfirmationEmail', description: 'Sends a confirmation email' },
];

// --- React Flow Config (apply defaultEdgeOptions to initialEdges) ---
export const defaultEdgeOptions: Partial<Edge> = {
  style: { stroke: '#9ca3af', strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#9ca3af',
    width: 15,
    height: 15,
  },
  animated: false, // Let's turn off default animation for clarity
};

// Apply default options and generate IDs for initial edges
export const processedInitialEdges: Edge[] = initialEdgesData.map((edge, index) => ({
    id: `e${edge.source}-${edge.target}-${index}`, // Generate unique ID
    ...defaultEdgeOptions, // Apply defaults
    ...edge, // Spread original edge data (source, target, label)
    // Ensure markerEnd is an object
    markerEnd: { ...defaultEdgeOptions.markerEnd }
}));


// Helper Function
export const getId = () => `dndnode_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`; // More robust ID