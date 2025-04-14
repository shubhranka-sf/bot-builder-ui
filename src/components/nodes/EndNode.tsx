import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FlagOff } from 'lucide-react';
import { motion } from 'framer-motion'; // Import motion

const EndNode: React.FC<NodeProps> = ({ selected }) => {
  return (
    <motion.div
      className={`bg-white border-2 ${selected ? 'border-red-500 shadow-lg' : 'border-red-300'} rounded-full shadow-md p-4 w-28 h-28 flex flex-col items-center justify-center transition-colors duration-150 ease-in-out`}
      initial={{ scale: 1 }}
      animate={{ scale: selected ? 1.03 : 1 }} // Scale up slightly when selected
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-red-500 !border-white !border-2 rounded-full -left-2 top-1/2 transform -translate-y-1/2" />
       <div className="p-1.5 bg-red-100 rounded-full mb-1">
         <FlagOff className="w-5 h-5 text-red-600" />
       </div>
      <strong className="text-red-800 text-sm font-semibold">End Flow</strong>
      {/* No source handle for the end node */}
    </motion.div>
  );
};

export default EndNode;
