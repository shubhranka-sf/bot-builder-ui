import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion'; // Import motion
import { IntentDefinition } from '../../types'; // Import type

// Keep intents definition or import/fetch - Now includes examples
const intents: IntentDefinition[] = [
  { id: 'intent_greet', label: 'Greeting', examples: ["hello", "hi", "hey there"] },
  { id: 'intent_order', label: 'Place Order', examples: ["I want to order a pizza", "place an order", "can I get food?"] },
  { id: 'intent_support', label: 'Request Support', examples: ["help me", "I need support", "agent please"] },
  { id: 'intent_goodbye', label: 'Goodbye', examples: ["bye", "see you later", "farewell"] },
  { id: 'intent_faq_shipping', label: 'FAQ - Shipping', examples: ["shipping cost", "how long does shipping take?", "track my package"] },
  { id: 'intent_faq_returns', label: 'FAQ - Returns', examples: ["return policy", "how to return item", "I want a refund"] },
];

interface IntentNodeData {
  intentId: string;
}

const IntentNode: React.FC<NodeProps<IntentNodeData>> = ({ data, selected }) => {
  // Find the intent label based on the ID stored in the node's data
  // The lookup still works the same way, we just don't display examples here.
  const currentIntent = intents.find(intent => intent.id === data.intentId) || { id: data.intentId || 'unknown', label: data.intentId || 'Unknown Intent', examples: [] };

  return (
    <motion.div
      className={`bg-white border-2 ${selected ? 'border-blue-500 shadow-lg' : 'border-blue-300'} rounded-lg shadow-md p-4 w-60 transition-colors duration-150 ease-in-out`}
      initial={{ scale: 1 }}
      animate={{ scale: selected ? 1.03 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-blue-500 !border-white !border-2 rounded-full -left-2 top-1/2 transform -translate-y-1/2" />
      <div className="flex items-center mb-3 pb-2 border-b border-blue-200">
        <div className="p-1.5 bg-blue-100 rounded-full mr-2">
           <Bot className="w-4 h-4 text-blue-600" />
        </div>
        <strong className="text-blue-800 font-semibold">Intent</strong>
      </div>
      <div className="text-sm mb-1 text-gray-600">
        Selected Intent:
      </div>
      <div className="text-sm font-medium text-blue-700 mb-2 truncate" title={currentIntent.label}>
        {currentIntent.label}
      </div>
      <div className="text-xs text-gray-500">
        ID: <code className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{currentIntent.id}</code>
      </div>
      {/* Examples are part of the definition but not displayed on the node */}
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-blue-500 !border-white !border-2 rounded-full -right-2 top-1/2 transform -translate-y-1/2" />
    </motion.div>
  );
};

export default IntentNode;
