import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Zap, GitBranch, MessageSquarePlus } from 'lucide-react'; // Import icons
import { motion } from 'framer-motion';
import { ActionNodeData } from '../../types'; // Import the specific data type

const ActionNode: React.FC<NodeProps<ActionNodeData>> = ({ data, selected, id }) => {
  const isFunction = data.valueType === 'function';
  const variationsCount = data.variations?.length || 0;
  // Determine display value: function name or first variation/fallback
  const displayValue = isFunction
    ? data.value // Show function name if it exists
    : data.variations?.[0] || '(No variations)'; // Show first variation or a placeholder

  const titleText = data.title || data.name || '(Untitled)';
  const nameText = data.name || '(No Name)';

  return (
    <motion.div
      className={`bg-white border-2 ${selected ? 'border-green-500 shadow-lg scale-[1.02]' : 'border-green-300'} rounded-lg shadow-md p-4 w-60 transition-all duration-150 ease-in-out`}
      key={id} // Add key for potential animation on node change
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-green-500 !border-white !border-2 rounded-full -left-[7px] top-1/2 transform -translate-y-1/2"
      />
      {/* Node Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-green-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-100 rounded-full">
            <Zap className="w-4 h-4 text-green-600" />
          </div>
          <strong className="text-green-800 font-semibold text-sm">Action</strong>
        </div>
        {/* Indicator: Function or Variations Count */}
        <div className="flex items-center gap-1 text-xs text-gray-500" title={isFunction ? `Function: ${data.value || 'Not set'}` : `${variationsCount} variations`}>
            {isFunction ? (
                <GitBranch className="w-3 h-3" />
            ) : (
                 <>
                    <MessageSquarePlus className="w-3 h-3" />
                    <span>{variationsCount}</span>
                 </>
            )}
        </div>
      </div>
      {/* Display Title */}
      <div className="text-sm mb-1 text-gray-600">
        Title: <span className="font-medium text-gray-800 truncate" title={titleText}>{titleText}</span>
      </div>
      {/* Display Name */}
      <div className="text-sm mb-2 text-gray-600">
        Name: <code className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded truncate inline-block max-w-full" title={nameText}>{nameText}</code>
      </div>
       {/* Display Preview Value */}
       <div className="text-xs text-gray-500">
            {isFunction ? 'Function:' : 'Preview:'}
       </div>
       <div
            className="block bg-green-50 border border-green-200 text-green-800 px-1.5 py-1 rounded text-xs break-words mt-1 max-h-16 overflow-hidden text-ellipsis whitespace-pre-wrap" // Allow wrapping
            title={displayValue} // Show full value on hover
       >
         {displayValue}
       </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-green-500 !border-white !border-2 rounded-full -right-[7px] top-1/2 transform -translate-y-1/2"
      />
    </motion.div>
  );
};

export default ActionNode;