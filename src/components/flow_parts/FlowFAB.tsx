import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Zap, FlagOff, Plus, PlayCircle, ClipboardList } from 'lucide-react';

interface FlowFABProps {
    isOpen: boolean;
    toggleFabMenu: () => void;
    onAddNode: (type: 'intent' | 'action' | 'end' | 'start' | 'form') => void;
    fabRef: React.RefObject<HTMLDivElement>;
}

const fabMenuVariants = {
    hidden: { opacity: 0, y: 20, transition: { staggerChildren: 0.05, staggerDirection: -1 } },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
    exit: { opacity: 0, y: 10, transition: { duration: 0.1, staggerChildren: 0.05, staggerDirection: -1 } },
};

const fabItemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.9, transition: { duration: 0.1 } },
};

// Define colors here or import from a shared constants file
const colorClasses: { [key: string]: { bg: string; hoverBg: string } } = {
    purple: { bg: 'bg-purple-500', hoverBg: 'hover:bg-purple-600' },
    blue: { bg: 'bg-blue-500', hoverBg: 'hover:bg-blue-600' },
    green: { bg: 'bg-green-500', hoverBg: 'hover:bg-green-600' },
    teal: { bg: 'bg-teal-500', hoverBg: 'hover:bg-teal-600' },
    red: { bg: 'bg-red-500', hoverBg: 'hover:bg-red-600' },
    gray: { bg: 'bg-gray-500', hoverBg: 'hover:bg-gray-600' },
};

const nodeTypesToAdd = [
    { type: 'start', Icon: PlayCircle, color: 'purple', title: 'Add Start' },
    { type: 'intent', Icon: Bot, color: 'blue', title: 'Add Intent' },
    { type: 'action', Icon: Zap, color: 'green', title: 'Add Action' },
    { type: 'form', Icon: ClipboardList, color: 'teal', title: 'Add Form' },
    { type: 'end', Icon: FlagOff, color: 'red', title: 'Add End' },
] as const; // Use 'as const' for stricter typing of 'type'

const FlowFAB: React.FC<FlowFABProps> = ({ isOpen, toggleFabMenu, onAddNode, fabRef }) => {
    return (
        <div ref={fabRef} className="absolute bottom-6 right-6 z-20">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="flex flex-col items-end space-y-3 mb-3"
                        variants={fabMenuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {nodeTypesToAdd.map((nodeInfo) => {
                            const bg = colorClasses[nodeInfo.color]?.bg || 'bg-gray-500';
                            const hoverBg = colorClasses[nodeInfo.color]?.hoverBg || 'hover:bg-gray-600';
                            return (
                                <motion.button
                                    key={nodeInfo.type}
                                    variants={fabItemVariants}
                                    onClick={() => onAddNode(nodeInfo.type)}
                                    className={`btn btn-circle btn-sm ${bg} text-white shadow-lg ${hoverBg} transform hover:scale-110`}
                                    title={nodeInfo.title}
                                >
                                    <nodeInfo.Icon size={22} />
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.button
                onClick={toggleFabMenu}
                className="btn btn-circle btn-primary shadow-xl"
                title={isOpen ? 'Close Menu' : 'Add Node'}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 15 }}
            >
                <Plus size={28} />
            </motion.button>
        </div>
    );
};

export default FlowFAB;