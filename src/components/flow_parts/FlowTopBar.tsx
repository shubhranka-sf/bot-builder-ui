import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

interface FlowTopBarProps {
    onTrain: () => void;
    isLoading: boolean;
}

const FlowTopBar: React.FC<FlowTopBarProps> = ({ onTrain, isLoading }) => {
    return (
        <div className="absolute top-4 right-6 z-10 flex gap-3">
            {isLoading ? (
                <motion.button
                    className="btn btn-sm btn-disabled gap-1"
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    disabled // Ensure button is actually disabled
                >
                    Loading... <Bot size={16} className="animate-spin" />
                </motion.button>
            ) : (
                <motion.button
                    onClick={onTrain}
                    className="btn btn-sm btn-primary gap-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Train Model <Bot size={16} />
                </motion.button>
            )}
        </div>
    );
};

export default FlowTopBar;