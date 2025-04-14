import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const StartNode: React.FC<NodeProps> = ({ selected }) => {
  return (
    <motion.div
      className={`bg-white border-2 ${selected ? 'border-indigo-500 shadow-lg' : 'border-indigo-300'} rounded-full shadow-md p-4 w-28 h-28 flex flex-col items-center justify-center transition-colors duration-150 ease-in-out`}
      initial={{ scale: 1 }}
      animate={{ scale: selected ? 1.03 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 !bg-indigo-500 !border-white !border-2 rounded-full -right-2 top-1/2 transform -translate-y-1/2" 
      />
      <div className="p-1.5 bg-indigo-100 rounded-full mb-1">
         <PlayCircle className="w-5 h-5 text-indigo-600" />
      </div>
      <strong className="text-indigo-800 text-sm font-semibold">Start Flow</strong>
    </motion.div>
  );
};

export default StartNode;
