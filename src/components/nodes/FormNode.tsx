import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ClipboardList, CheckSquare } from 'lucide-react'; // Using ClipboardList for form
import { motion } from 'framer-motion';
import { FormNodeData } from '../../types'; // Import the specific data type

const FormNode: React.FC<NodeProps<FormNodeData>> = ({ data, selected, id }) => {
  const nameText = data.name || '(Untitled Form)';
  const formIdText = data.formId || '(No ID)';
  const slots = data.slots || [];
  const slotCount = slots.length;

  return (
    <motion.div
      className={`bg-white border-2 ${selected ? 'border-teal-500 shadow-lg scale-[1.02]' : 'border-teal-300'} rounded-lg shadow-md p-4 w-60 transition-all duration-150 ease-in-out`}
      key={id} // Add key for potential animation on node change
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-teal-500 !border-white !border-2 rounded-full -left-[7px] top-1/2 transform -translate-y-1/2"
      />
      {/* Node Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-teal-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-100 rounded-full">
            <ClipboardList className="w-4 h-4 text-teal-600" />
          </div>
          <strong className="text-teal-800 font-semibold text-sm">Form</strong>
        </div>
         {/* Slot Count Indicator */}
         <div className="flex items-center gap-1 text-xs text-gray-500" title={`${slotCount} required slots`}>
             <CheckSquare className="w-3 h-3" />
             <span>{slotCount}</span>
         </div>
      </div>
      {/* Display Name */}
      <div className="text-sm mb-1 text-gray-600">
        Name: <span className="font-medium text-gray-800 truncate" title={nameText}>{nameText}</span>
      </div>
      {/* Display Form ID */}
      <div className="text-sm mb-2 text-gray-600">
        Form ID: <code className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded truncate inline-block max-w-full" title={formIdText}>{formIdText}</code>
      </div>
       {/* Display Slots (Limited View) */}
       <div className="text-xs text-gray-500 mt-1">
         Slots: {slots.length > 0 ? (
             <div className="flex flex-wrap gap-1 mt-1 max-h-10 overflow-hidden">
                 {slots.slice(0, 3).map((slot, i) => ( // Show first 3
                     <span key={i} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-normal px-1.5 py-0.5 rounded-full border border-gray-300">
                        {slot}
                     </span>
                 ))}
                 {slots.length > 3 && <span className="text-xs text-gray-400 self-center">...</span>}
             </div>
         ) : (
             <span className="text-gray-400 italic">(None selected)</span>
         )}
       </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-teal-500 !border-white !border-2 rounded-full -right-[7px] top-1/2 transform -translate-y-1/2"
      />
    </motion.div>
  );
};

export default FormNode;