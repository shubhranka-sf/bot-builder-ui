import React from 'react';
import { Search, ChevronLeft, GitBranch } from 'lucide-react';
import { IntentDefinition, ActionDefinition } from '../../types';

interface SidebarChangeDefinitionProps {
    nodeType: 'intent' | 'action';
    currentNodeId: string; // Used to disable selecting the current one
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    filteredIntents: IntentDefinition[];
    filteredActions: ActionDefinition[];
    onSelectIntent: (intentId: string) => void;
    onSelectAction: (actionName: string) => void;
    onCancel: () => void;
}

const SidebarChangeDefinition: React.FC<SidebarChangeDefinitionProps> = ({
    nodeType,
    currentNodeId,
    searchTerm,
    onSearchTermChange,
    filteredIntents,
    filteredActions,
    onSelectIntent,
    onSelectAction,
    onCancel,
}) => {
    const isIntent = nodeType === 'intent';
    const items = isIntent ? filteredIntents : filteredActions;
    const placeholder = isIntent ? 'Search intents...' : 'Search actions...';

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-semibold text-gray-700">Select New {isIntent ? 'Intent' : 'Action'}</h4>
                <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1" title="Cancel Change">
                    <ChevronLeft size={16} /> Cancel
                </button>
            </div>
            <div className="relative">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 pl-8 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                />
                <Search size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto border rounded-md p-1 bg-gray-50 scrollbar-thin">
                {items.length > 0 ? (
                    items.map((item) => {
                        const id = isIntent ? (item as IntentDefinition).id : (item as ActionDefinition).name;
                        const label = isIntent ? (item as IntentDefinition).label : ((item as ActionDefinition).title || (item as ActionDefinition).name);
                        const isDisabled = currentNodeId === id;
                        const type = isIntent ? 'intent' : (item as ActionDefinition).valueType;
                        const titleAttr = isIntent
                            ? `ID: ${id}\nEntities: ${(item as IntentDefinition).entities?.join(', ') || 'None'}`
                            : `Name: ${id}\nType: ${type}`;

                        return (
                            <button
                                key={id}
                                onClick={() => (isIntent ? onSelectIntent(id) : onSelectAction(id))}
                                disabled={isDisabled}
                                className={`w-full text-left px-3 py-1.5 rounded text-sm flex justify-between items-center transition-colors duration-100 ${
                                    isDisabled
                                        ? isIntent ? 'bg-blue-100 text-blue-800 font-medium cursor-not-allowed opacity-70' : 'bg-green-100 text-green-800 font-medium cursor-not-allowed opacity-70'
                                        : isIntent ? 'hover:bg-blue-50 text-gray-700 hover:text-blue-800' : 'hover:bg-green-50 text-gray-700 hover:text-green-800'
                                }`}
                                title={titleAttr}
                            >
                                <span className='truncate pr-2'>{label}</span>
                                {isIntent ? (
                                    <code className="text-xs text-gray-500 flex-shrink-0">{id}</code>
                                ) : (
                                    type === 'function' && <GitBranch size={14} className="text-gray-500 ml-2 flex-shrink-0" title="Function" />
                                )}
                            </button>
                        );
                    })
                ) : (
                    <p className="text-center text-xs text-gray-400 py-4">No matching {isIntent ? 'intents' : 'actions'}.</p>
                )}
            </div>
        </div>
    );
};

export default SidebarChangeDefinition;