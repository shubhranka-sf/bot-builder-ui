import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow, Node } from 'reactflow';
import Editor, { Monaco, loader } from '@monaco-editor/react';
import { GitMerge, HelpCircle } from 'lucide-react'; // Using GitMerge for conditional split
import { IfNodeData } from '../../types';

loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs' } });

const IfNode: React.FC<NodeProps<IfNodeData>> = ({ data, selected, id }) => {
  const { setNodes, getNode } = useReactFlow();
  const [condition, setCondition] = useState(data.condition || 'tracker.get_slot("some_slot") == "some_value"');
  const editorRef = useRef<any>(null);

  // This callback updates the node data when the condition in the editor changes.
  const handleConditionChange = useCallback((value: string | undefined) => {
    const newCondition = value || '';
    setCondition(newCondition); // Update local state for editor
    
    const node = getNode(id);
    if (node) {
      // The scriptContent should also be updated if the condition changes,
      // as the condition is embedded in the script.
      // This logic would typically be in useNodeManagement.updateIfNode if called from sidebar,
      // but here we can regenerate it or simply update the condition part.
      // For simplicity now, just updating the condition in data.
      // A more robust solution would regenerate data.scriptContent based on newCondition.
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          condition: newCondition,
          // Potentially regenerate scriptContent here if its template depends on the condition directly
          // For now, assuming the generic scriptContent template is sufficient and condition is passed to it.
        },
      };
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? updatedNode : n))
      );
    }
  }, [id, getNode, setNodes]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    // Sync local condition with data from props if it changes
    if (data.condition !== undefined && data.condition !== condition) {
      setCondition(data.condition);
    }
  }, [data.condition, condition]);

  const nodeName = data.name || 'If Condition';
  const nodeDescription = data.description || 'Evaluates a Python condition.';

  return (
    <div
      className={`bg-sky-700 border-2 ${selected ? 'border-sky-400 shadow-2xl scale-[1.01]' : 'border-sky-600 shadow-lg'} 
                  rounded-lg p-0 w-80 text-slate-100 transition-all duration-150 ease-in-out relative`}
      key={id}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-sky-400 !border-sky-700 !border-2 rounded-full -left-[7px] top-1/2 transform -translate-y-1/2 z-10"
      />
      
      {/* Node Header */}
      <div className="flex items-center justify-between p-3 bg-sky-800 rounded-t-lg border-b border-sky-600">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1.5 bg-sky-600 rounded-md flex-shrink-0">
            <GitMerge className="w-4 h-4 text-sky-200" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <strong className="text-sky-200 font-semibold text-sm truncate" title={nodeName}>{nodeName}</strong>
            <p className="text-xs text-sky-400 truncate" title={nodeDescription}>{nodeDescription}</p>
          </div>
        </div>
         <div title="The script for this node (visible in sidebar edit) evaluates this condition and sets a slot. Your Rasa stories will branch based on that slot." className="cursor-help">
            <HelpCircle size={16} className="text-sky-400" />
        </div>
      </div>

      {/* Condition Editor */}
      <div className="p-2 bg-sky-700">
        <label htmlFor={`condition-editor-${id}`} className="text-xs text-sky-300 mb-1 block px-1">
          Condition (Python expression):
        </label>
        <div className="h-20 rounded-md overflow-hidden border border-sky-600"> {/* Fixed height for condition editor */}
          <Editor
            height="100%"
            defaultLanguage="python"
            value={condition}
            onChange={handleConditionChange}
            onMount={handleEditorDidMount}
            theme="vs-dark" // Using vs-dark, can be customized
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              insertSpaces: true,
              lineNumbers: 'off',
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
              renderLineHighlight: 'none',
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              }
            }}
          />
        </div>
      </div>
      
      {/* Source Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: '35%', background: '#34D399', borderColor: '#059669' }} // Green for True
        className="w-3 h-3 !border-2 rounded-full -right-[7px]"
      />
      <div className="absolute right-[-35px] top-[calc(35%-8px)] text-xs text-green-400 font-semibold">True</div>

      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: '65%', background: '#F87171', borderColor: '#DC2626' }} // Red for False
        className="w-3 h-3 !border-2 rounded-full -right-[7px]"
      />
      <div className="absolute right-[-40px] top-[calc(65%-8px)] text-xs text-red-400 font-semibold">False</div>
    </div>
  );
};

export default IfNode;