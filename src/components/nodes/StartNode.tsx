import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { StartNodeData } from '../../types'; // Import the specific data type

// Use NodeProps with the specific StartNodeData type
const StartNode: React.FC<NodeProps<StartNodeData>> = ({ data, selected }) => {
  const storyName = data?.storyName || "Start"; // Fallback name

  return (
    <motion.div
      className={`bg-white border-2 ${selected ? 'border-indigo-500 shadow-lg scale-[1.03]' : 'border-indigo-300'} rounded-lg shadow-md p-4 min-w-[180px] transition-all duration-150 ease-in-out`} // Use rounded-lg and min-width
      // Removed individual scale animation for simplicity, relying on border/shadow
    >
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-indigo-500 !border-white !border-2 rounded-full -right-[7px] top-1/2 transform -translate-y-1/2"
      />
      <div className="flex items-center mb-2 pb-2 border-b border-indigo-100">
        <div className="p-1.5 bg-indigo-100 rounded-full mr-2 flex-shrink-0">
           <PlayCircle className="w-4 h-4 text-indigo-600" />
        </div>
        {/* Display the Story Name */}
        <strong
           className="text-indigo-800 font-semibold text-sm truncate"
           title={storyName} // Show full name on hover
         >
           {storyName}
         </strong>
      </div>
       <p className="text-xs text-indigo-600 text-center">Start Flow</p> {/* Simple indicator */}

      {/* No target handle for the start node */}
    </motion.div>
  );
};

export default StartNode;