import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { IntentDefinition } from '../../types'; // Import type
import { mockIntents } from '../../../data/mockData'; // Import mock data

// No longer define intents here

interface IntentNodeData {
  intentId: string;
  examples?: string[]; // Include examples in the data type
}

const IntentNode: React.FC<NodeProps<IntentNodeData>> = ({ data, selected }) => {
  // Find the intent label based on the ID stored in the node's data
  // Use the imported mockIntents for lookup
  const currentIntent = mockIntents.find(intent => intent.id === data.intentId);
  const displayLabel = currentIntent?.label || data.intentId || 'Unknown Intent';
  const displayId = data.intentId || 'N/A';

  return (
    <motion.div
      className={`bg-white border-2 ${selected ? 'border-blue-500 shadow-lg scale-[1.02]' : 'border-blue-300'} rounded-lg shadow-md p-4 w-60 transition-all duration-150 ease-in-out`}
      // Animate presence can be added if nodes are dynamically added/removed frequently
      // initial={{ opacity: 0, scale: 0.8 }}
      // animate={{ opacity: 1, scale: 1 }}
      // transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-blue-500 !border-white !border-2 rounded-full -left-[7px] top-1/2 transform -translate-y-1/2" />
      <div className="flex items-center mb-3 pb-2 border-b border-blue-200">
        <div className="p-1.5 bg-blue-100 rounded-full mr-2">
           <Bot className="w-4 h-4 text-blue-600" />
        </div>
        <strong className="text-blue-800 font-semibold">Intent</strong>
      </div>
      <div className="text-sm mb-1 text-gray-600">
        Selected Intent:
      </div>
      <div className="text-sm font-medium text-blue-700 mb-2 truncate" title={displayLabel}>
        {displayLabel}
      </div>
      <div className="text-xs text-gray-500">
        ID: <code className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{displayId}</code>
      </div>
      {/* Optional: Display a hint if examples exist but aren't shown */}
      {/* {data.examples && data.examples.length > 0 && (
          <div className="text-xs text-gray-400 mt-1 italic">(Has examples)</div>
      )} */}
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-blue-500 !border-white !border-2 rounded-full -right-[7px] top-1/2 transform -translate-y-1/2" />
    </motion.div>
  );
};

export default IntentNode;