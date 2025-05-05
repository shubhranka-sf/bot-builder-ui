import { Node, Edge, MarkerType } from 'reactflow';
import {
  ActionDefinition,
  IntentDefinition,
  AvailableFunction,
  StartNodeData,
  IntentNodeData,
  ActionNodeData,
  EndNodeData,
  FormNodeData, // Import FormNodeData
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
    examples: ['support needed', 'I need help with my [order](support_topic)', 'assist me please', 'my name is [Alice](user_name)'] // Added user_name entity
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
        'My email is [test@example.com](email_address)', // Added email_address entity
        'account [ACC1001](account_number)',
        'it is [Bob](user_name) with email [bob@mail.com](email_address)' // Added example with name and email
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
   // Add utterances for potential form slots (Rasa convention)
   // You might generate these dynamically or define them as needed by your NLU/dialogue engine
   { title: 'Ask for User Name', name: 'utter_ask_user_name', valueType: 'text', variations: ['What is your name?', 'May I have your name please?'], value: 'What is your name?' },
   { title: 'Ask for Email Address', name: 'utter_ask_email_address', valueType: 'text', variations: ['What is your email address?', 'Please provide your email.'], value: 'What is your email address?' },
   { title: 'Ask for Account Number', name: 'utter_ask_account_number', valueType: 'text', variations: ['What is your account number?'], value: 'What is your account number?' },
   { title: 'Ask for Phone Number', name: 'utter_ask_phone_number', valueType: 'text', variations: ['What is your phone number?'], value: 'What is your phone number?' },
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

// Type for the union of all possible node data types
type FlowNodeDataType = StartNodeData | IntentNodeData | ActionNodeData | FormNodeData | EndNodeData;


export const initialNodes: Node<FlowNodeDataType>[] = [
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
    id: 'start_form', type: 'start', position: { x: 50, y: 400 },
    data: { storyName: 'User Info Form Flow', storyId: 'story_user_info_form', label: 'User Info Form Flow' },
  },
  { // Example using the new form node
    id: 'form_user_info', type: 'form', position: { x: 300, y: 400 },
    data: {
        name: 'Collect User Details',
        formId: 'user_info_form', // This ID will be used in export
        slots: ['user_name', 'email_address'] // Slots the form requires
    },
  },
   {
    id: 'action_form_ack', type: 'action', position: { x: 550, y: 400 },
    // This action would typically run *after* the form successfully completes
    data: getActionNodeData('utter_acknowledge_info'),
  },
  {
    id: 'end_form', type: 'end', position: { x: 800, y: 400 }, data: {},
  },
];


// Define initial edges separately
export const initialEdgesData: Omit<Edge, 'id' | 'markerEnd' | 'style' | 'animated'>[] = [
  // Greeting Flow Edges
  { source: '0', target: '1' },
  { source: '1', target: '2' },
  { source: '2', target: '3' },

  // Form Flow Edges
   { source: 'start_form', target: 'form_user_info' }, // Start -> Form
   { source: 'form_user_info', target: 'action_form_ack' }, // Form -> Action (runs after form)
   { source: 'action_form_ack', target: 'end_form' }, // Action -> End
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
    markerEnd: { ...defaultEdgeOptions.markerEnd } as any // Cast to any to satisfy strict type if needed
}));


// Helper Function
export const getId = () => `dndnode_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`; // More robust ID