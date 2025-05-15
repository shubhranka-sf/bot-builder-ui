import { Node, Edge, MarkerType } from 'reactflow';
import {
  ActionDefinition,
  IntentDefinition,
  AvailableFunction,
  StartNodeData,
  IntentNodeData,
  ActionNodeData,
  EndNodeData,
  FormNodeData,
  ScriptNodeData,
  IfNodeData, // --- IMPORT IfNodeData ---
  ScriptUtilityFunction,
} from '../types';
import { parseEntitiesFromExamples } from '../utils/entityParser';
import { Code, Clock, MessageCircle, Server, Zap as ZapIcon } from 'lucide-react';

// --- Helper to create Rasa If Condition Action Template (copied from useNodeManagement for consistency if needed standalone) ---
// This is generally better placed in useNodeManagement or a dedicated utils file,
// but placing a simplified version here for initial node data.
const generateRandomSuffixForMock = () => Math.random().toString(36).substring(2, 5).toUpperCase();
const createRasaIfConditionActionTemplateForMock = (baseName: string, condition: string): string => {
    const randomSuffix = generateRandomSuffixForMock();
    const className = `ActionIf${baseName.replace(/[^a-zA-Z0-9_]/g, '')}${randomSuffix}`;
    const actionName = `action_if_${baseName.toLowerCase().replace(/\s+/g, '_')}_${randomSuffix.toLowerCase()}`;
    const trueSlot = `if_cond_${randomSuffix.toLowerCase()}_true`;
    const falseSlot = `if_cond_${randomSuffix.toLowerCase()}_false`;
    const sanitizedCondition = condition.replace(/;/g, '');

    return `from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import datetime

class ${className}(Action):
    def name(self) -> Text:
        return "${actionName}"
    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        condition_to_evaluate = """${sanitizedCondition}"""
        evaluation_result = False; slots_to_set = []
        try:
            evaluation_result = eval(condition_to_evaluate, {"tracker": tracker}, {})
        except Exception as e:
            print(f"Error evaluating condition \$\{condition_to_evaluate\}": {e}") # Simple print for mock
            slots_to_set.append(SlotSet("${falseSlot}", True)); slots_to_set.append(SlotSet("${trueSlot}", False))
            return slots_to_set
        if evaluation_result:
            slots_to_set.append(SlotSet("${trueSlot}", True)); slots_to_set.append(SlotSet("${falseSlot}", False))
        else:
            slots_to_set.append(SlotSet("${falseSlot}", True)); slots_to_set.append(SlotSet("${trueSlot}", False))
        return slots_to_set`;
};


const populateInitialEntities = (intents: Omit<IntentDefinition, 'entities'>[]): IntentDefinition[] => {
  return intents.map(intent => ({
    ...intent,
    entities: parseEntitiesFromExamples(intent.examples || [])
  }));
};

const baseMockIntents: Omit<IntentDefinition, 'entities'>[] = [ /* ... (no change) ... */
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
    examples: ['support needed', 'I need help with my [order](support_topic)', 'assist me please', 'my name is [Alice](user_name)']
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
        'My email is [test@example.com](email_address)',
        'account [ACC1001](account_number)',
        'it is [Bob](user_name) with email [bob@mail.com](email_address)'
    ]
  }
];
export const mockIntents: IntentDefinition[] = populateInitialEntities(baseMockIntents);

export const mockDefinedActions: ActionDefinition[] = [ /* ... (no change) ... */
   {
    title: 'Send Greeting Response',
    name: 'utter_greet_response',
    valueType: 'text',
    variations: [
        'Hello there! What can I do for you?',
        'Hi! How may I help?',
        'Hey, need assistance with anything?'
    ],
    value: 'Hello there! What can I do for you?'
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
    variations: [ 'Sure, what would you like to order?' ],
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
    value: 'checkOrderStatus',
  },
  {
    title: 'Transfer to Agent',
    name: 'action_transfer_to_agent',
    valueType: 'function',
    value: 'transferToSupportQueue',
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
   { title: 'Ask for User Name', name: 'utter_ask_user_name', valueType: 'text', variations: ['What is your name?', 'May I have your name please?'], value: 'What is your name?' },
   { title: 'Ask for Email Address', name: 'utter_ask_email_address', valueType: 'text', variations: ['What is your email address?', 'Please provide your email.'], value: 'What is your email address?' },
   { title: 'Ask for Account Number', name: 'utter_ask_account_number', valueType: 'text', variations: ['What is your account number?'], value: 'What is your account number?' },
   { title: 'Ask for Phone Number', name: 'utter_ask_phone_number', valueType: 'text', variations: ['What is your phone number?'], value: 'What is your phone number?' },
];

const getIntentNodeData = (intentId: string): IntentNodeData => { /* ... (no change) ... */
    const intent = mockIntents.find(i => i.id === intentId);
    return intent
        ? { intentId: intent.id, examples: intent.examples, entities: intent.entities, label: intent.label }
        : { intentId: intentId, examples: [], entities: [], label: intentId };
};
const getActionNodeData = (actionName: string): ActionNodeData => { /* ... (no change) ... */
    const action = mockDefinedActions.find(a => a.name === actionName);
    return action
        ? { ...action }
        : { name: actionName, title: actionName, valueType: 'text', variations: ['Action definition not found!'] };
};

// Type for the union of all possible node data types, including IfNodeData
type FlowNodeDataType = StartNodeData | IntentNodeData | ActionNodeData | FormNodeData | ScriptNodeData | IfNodeData | EndNodeData;


export const initialNodes: Node<FlowNodeDataType>[] = [
  {
    id: '0', type: 'start', position: { x: 50, y: 50 }, // Adjusted Y for space
    data: { storyName: 'Main Flow', storyId: 'story_main', label: 'Main Flow' },
  },
  {
    id: '1', type: 'intent', position: { x: 300, y: 50 },
    data: getIntentNodeData('intent_greet'),
  },
  // --- ADDED EXAMPLE IF NODE ---
  {
    id: 'if_node_example',
    type: 'if',
    position: { x: 550, y: 150 },
    data: {
      name: 'Check User Type',
      description: 'Checks if user is admin.',
      condition: 'tracker.get_slot("user_role") == "admin"',
      scriptContent: createRasaIfConditionActionTemplateForMock("UserTypeCheck", 'tracker.get_slot("user_role") == "admin"')
    },
  },
  {
    id: 'action_admin_greet', type: 'action', position: { x: 800, y: 100 },
    data: { title: 'Admin Greeting', name: 'utter_admin_greet', valueType: 'text', variations: ['Hello Admin! Special access granted.'], value: 'Hello Admin! Special access granted.'},
  },
  {
    id: 'action_user_greet', type: 'action', position: { x: 800, y: 200 },
    data: getActionNodeData('utter_greet_response'), // Regular user greeting
  },
  {
    id: 'end_after_if', type: 'end', position: { x: 1050, y: 150 }, data: {},
  },
  // Existing nodes (adjust positions if needed due to new IfNode example)
  {
    id: 'start_form', type: 'start', position: { x: 50, y: 400 },
    data: { storyName: 'User Info Form Flow', storyId: 'story_user_info_form', label: 'User Info Form Flow' },
  },
  { 
    id: 'form_user_info', type: 'form', position: { x: 300, y: 400 },
    data: { name: 'Collect User Details', formId: 'user_info_form', slots: ['user_name', 'email_address'] },
  },
   {
    id: 'action_form_ack', type: 'action', position: { x: 550, y: 400 },
    data: getActionNodeData('utter_acknowledge_info'),
  },
  {
    id: 'end_form', type: 'end', position: { x: 800, y: 400 }, data: {},
  },
  {
    id: 'script_node_1', type: 'script', position: { x: 300, y: 550 },
    data: {
        name: 'Custom Logic Script',
        description: 'Executes a custom Python script for Rasa.',
        scriptContent: `from typing import Any, Text, Dict, List\nfrom rasa_sdk import Action, Tracker\n# ... (rest of script template)`
    },
  },
];

export const initialEdgesData: Omit<Edge, 'id' | 'markerEnd' | 'style' | 'animated'>[] = [
  { source: '0', target: '1' },
  { source: '1', target: 'if_node_example' }, // Greet intent goes to IfNode
  // Edges from IfNode
  { source: 'if_node_example', sourceHandle: 'true', target: 'action_admin_greet' },
  { source: 'if_node_example', sourceHandle: 'false', target: 'action_user_greet' },
  // Edges to end
  { source: 'action_admin_greet', target: 'end_after_if' },
  { source: 'action_user_greet', target: 'end_after_if' },

  { source: 'start_form', target: 'form_user_info' },
  { source: 'form_user_info', target: 'action_form_ack' },
  { source: 'action_form_ack', target: 'end_form' },
];

export const mockAvailableFunctions: AvailableFunction[] = [ /* ... (no change) ... */
  { name: 'checkOrderStatus', description: 'Checks the status of an order via API' },
  { name: 'transferToSupportQueue', description: 'Transfers the chat to a human agent' },
  { name: 'createSupportTicket', description: 'Creates a new support ticket' },
  { name: 'lookupOrder', description: 'Looks up an order by ID' },
  { name: 'sendConfirmationEmail', description: 'Sends a confirmation email' },
];
export const mockScriptUtilityFunctions: ScriptUtilityFunction[] = [ /* ... (no change, but not used by IfNode directly) ... */
  {
    id: 'util_api_call_py',
    name: 'API Call (Python)',
    description: 'Makes a GET request to a URL using Python requests.',
    icon: Server,
    codeSnippet: (params = { url: 'https://api.example.com/data', method: 'GET', payload_var: 'None', headers_var: 'None' }) =>
`# API Call Utility (Python for Rasa)
import requests
import logging
# logger = logging.getLogger(__name__)
def fetch_api_data(url="${params.url}", method="${params.method.upper()}", headers=${params.headers_var}, json_payload=${params.payload_var}):
    try:
        response = requests.request(method.upper(), url, headers=headers, json=json_payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        # logger.error(f"API Call Error to {url}: {e}")
        return None`
  },
  {
    id: 'util_log_message_py',
    name: 'Log Message (Python)',
    description: 'Logs a message using Python\'s logging module.',
    icon: MessageCircle,
    codeSnippet: (params = { message: 'Informative message from script', level: 'info' }) =>
`# Log Message Utility (Python for Rasa)
import logging
# logger = logging.getLogger(__name__)
log_message = "${params.message}"; log_level = "${params.level}".lower()
# Basic if/else for logger level, e.g., if log_level == "debug": logger.debug(log_message)`
  },
  {
    id: 'util_check_time_py',
    name: 'Get Current Time (Python)',
    description: 'Gets the current server time using Python\'s datetime.',
    icon: Clock,
    codeSnippet: () =>
`# Get Current Time Utility (Python for Rasa)
import datetime
current_datetime = datetime.datetime.now(); formatted_time = current_datetime.strftime("%Y-%m-%d %H:%M:%S")
# logger.info(f"Current server datetime: {formatted_time}")`
  },
  {
    id: 'util_custom_function_py',
    name: 'Custom Function Stub (Python)',
    description: 'A template for a custom Python function within a Rasa action.',
    icon: Code,
    codeSnippet: () =>
`# Custom Function Stub (Python for Rasa)
def my_custom_processing_function(data_from_slot, some_other_param=None):
    processed_result = str(data_from_slot).strip().upper()
    if some_other_param: processed_result += f" with {some_other_param}"
    return processed_result`
  },
  {
    id: 'util_set_slot_py',
    name: 'Set Slot (Python)',
    description: 'Generates code to set a slot in a Rasa custom action.',
    icon: ZapIcon,
    codeSnippet: (params = { slot_name: 'my_slot', slot_value_var: '"example_value"' }) =>
`# Set Slot Utility (Python for Rasa)
from rasa_sdk.events import SlotSet
slot_to_set = "${params.slot_name}"; value_for_slot = ${params.slot_value_var}
# return [SlotSet(slot_to_set, value_for_slot)]`
  },
];

export const defaultEdgeOptions: Partial<Edge> = { /* ... (no change) ... */
  style: { stroke: '#9ca3af', strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#9ca3af',
    width: 15,
    height: 15,
  },
  animated: false,
};
export const processedInitialEdges: Edge[] = initialEdgesData.map((edge, index) => ({ /* ... (no change) ... */
    id: `e${edge.source}-${edge.target}-${index}`,
    ...defaultEdgeOptions,
    ...edge,
    markerEnd: { ...defaultEdgeOptions.markerEnd } as any
}));
export const getId = () => `dndnode_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;