import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot, Tag } from 'lucide-react'; // Import Tag icon
import { motion } from 'framer-motion';
// Import the type, we don't need mockIntents here anymore
import { IntentNodeData } from '../../types';
// No need to import mockIntents here, data comes from props

const IntentNode: React.FC<NodeProps<IntentNodeData>> = ({ data, selected, id }) => {
  // Data should contain intentId, examples, and entities provided by Flow.tsx
  const displayLabel = data?.label || data?.intentId || '(Unknown)'; // Use label from definition if passed, else ID
  const displayId = data?.intentId || 'N/A';
  const entities = data?.entities || [];
  const examplesCount = data?.examples?.length || 0;

  return (
    <motion.div
      className={`bg-white border-2 ${selected ? 'border-blue-500 shadow-lg scale-[1.02]' : 'border-blue-300'} rounded-lg shadow-md p-4 w-60 transition-all duration-150 ease-in-out`}
      key={id} // Ensure motion reacts to node changes if needed
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 !border-white !border-2 rounded-full -left-[7px] top-1/2 transform -translate-y-1/2"
      />
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-blue-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-full">
            <Bot className="w-4 h-4 text-blue-600" />
          </div>
          <strong className="text-blue-800 font-semibold text-sm">Intent</strong>
        </div>
         {/* Show entity count */}
         {entities.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500" title={`${entities.length} entities: ${entities.join(', ')}`}>
                <Tag size={12} />
                <span>{entities.length}</span>
            </div>
         )}
      </div>
      <div className="text-sm font-medium text-blue-700 mb-1 truncate" title={displayLabel}>
        {displayLabel}
      </div>
      <div className="text-xs text-gray-500 mb-2">
        ID: <code className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{displayId}</code>
      </div>
       <div className="text-xs text-gray-400 mt-1 italic">
         {examplesCount} {examplesCount === 1 ? 'example' : 'examples'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 !border-white !border-2 rounded-full -right-[7px] top-1/2 transform -translate-y-1/2"
      />
    </motion.div>
  );
};

export default IntentNode;