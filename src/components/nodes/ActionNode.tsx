import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Zap, GitBranch } from 'lucide-react'; // Import GitBranch icon
import { motion } from 'framer-motion';

// Updated data structure for Action Nodes
interface ActionNodeData {
  title: string; // User-friendly title
  name: string; // Action identifier (e.g., SendMessage, ApiCall)
  value: string; // The actual text value or the selected function name
  valueType: 'text' | 'function'; // Type indicator
}

const ActionNode: React.FC<NodeProps<ActionNodeData>> = ({ data, selected }) => {
  const isFunction = data.valueType === 'function';

  return (
    <motion.div
      className={`bg-white border-2 ${selected ? 'border-green-500 shadow-lg' : 'border-green-300'} rounded-lg shadow-md p-4 w-60 transition-colors duration-150 ease-in-out`}
      initial={{ scale: 1 }}
      animate={{ scale: selected ? 1.03 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-green-500 !border-white !border-2 rounded-full -left-2 top-1/2 transform -translate-y-1/2" />
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-green-200">
        <div className="flex items-center">
          <div className="p-1.5 bg-green-100 rounded-full mr-2">
            <Zap className="w-4 h-4 text-green-600" />
          </div>
          <strong className="text-green-800 font-semibold">Action</strong>
        </div>
        {/* Function Indicator - Using GitBranch icon */}
        {isFunction && (
          <div className="p-1 bg-gray-100 rounded-full" title="Uses a function">
            <GitBranch className="w-3 h-3 text-gray-600" />
          </div>
        )}
      </div>
      <div className="text-sm mb-1 text-gray-600">
        Title: <span className="font-medium text-gray-800">{data.title || data.name}</span>
      </div>
      <div className="text-sm mb-1 text-gray-600">
        Name: <span className="font-medium text-green-700">{data.name}</span>
      </div>
      <div className="text-sm text-gray-600">
        {isFunction ? 'Function:' : 'Value:'}
        {/* Consistent styling for value code block */}
        <code className="block bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs break-words mt-1" title={data.value}>
          {data.value}
        </code>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-green-500 !border-white !border-2 rounded-full -right-2 top-1/2 transform -translate-y-1/2" />
    </motion.div>
  );
};

export default ActionNode;
