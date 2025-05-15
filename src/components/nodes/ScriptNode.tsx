import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow, Node } from 'reactflow';
import Editor, { Monaco, loader } from '@monaco-editor/react';
import { FileCode } from 'lucide-react'; // Removed ChevronsUpDown, CodeIcon, PlusCircle
import { ScriptNodeData } from '../../types';
// Removed mockScriptUtilityFunctions and motion imports as utilities panel is gone
// import { mockScriptUtilityFunctions } from '../../data/mockData';
// import { AnimatePresence, motion } from 'framer-motion';

loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs' } });

const ScriptNode: React.FC<NodeProps<ScriptNodeData>> = ({ data, selected, id }) => {
  const { setNodes, getNode } = useReactFlow();
  const [scriptContent, setScriptContent] = useState(data.scriptContent || '');
  // Removed isUtilitiesVisible state
  const editorRef = useRef<any>(null);
  // Removed monacoRef as it's not strictly needed without complex interactions

  const updateNodeScriptContent = useCallback((newContent: string) => {
    setScriptContent(newContent);
    const node = getNode(id);
    if (node) {
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          scriptContent: newContent,
        },
      };
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? updatedNode : n))
      );
    }
  }, [id, getNode, setNodes]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    updateNodeScriptContent(value || '');
  }, [updateNodeScriptContent]);

  const handleEditorDidMount = (editor: any /*, monacoInstance: Monaco */) => {
    editorRef.current = editor;
    // monacoRef.current = monacoInstance; // Not strictly needed now
  };

  // Removed insertSnippetIntoEditor and UtilityItem component

  const nodeName = data.name || 'Python Script Node';
  const nodeDescription = data.description || 'Edit Python code for Rasa custom actions.';

  useEffect(() => {
    if (data.scriptContent !== undefined && data.scriptContent !== scriptContent) {
      setScriptContent(data.scriptContent);
    }
  }, [data.scriptContent, scriptContent]);

  return (
    <div // Changed from motion.div to div
      className={`bg-slate-800 border-2 ${selected ? 'border-purple-500 shadow-2xl scale-[1.01]' : 'border-slate-700 shadow-lg'} 
                  rounded-lg p-0 w-96 text-slate-100 transition-all duration-150 ease-in-out relative`}
      key={id}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-purple-500 !border-slate-800 !border-2 rounded-full -left-[7px] top-1/2 transform -translate-y-1/2 z-10"
      />
      {/* Node Header */}
      <div className="flex items-center justify-between p-3 bg-slate-900 rounded-t-lg border-b border-slate-700">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1.5 bg-purple-700 rounded-md flex-shrink-0">
            <FileCode className="w-4 h-4 text-purple-300" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <strong className="text-purple-300 font-semibold text-sm truncate" title={nodeName}>{nodeName}</strong>
            <p className="text-xs text-slate-400 truncate" title={nodeDescription}>{nodeDescription}</p>
          </div>
        </div>
        {/* Removed Utilities Toggle Button */}
      </div>

      {/* Main Content Area: Editor ONLY */}
      <div className="flex">
        <div className="flex-grow h-72">
          <Editor
            height="100%"
            defaultLanguage="python"
            value={scriptContent}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: true, scale: 2, side: 'right' },
              fontSize: 13,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              insertSpaces: true,
              renderWhitespace: "boundary",
              scrollbar: {
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
              }
            }}
          />
        </div>
        {/* Removed Utilities Sidebar Section */}
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-purple-500 !border-slate-800 !border-2 rounded-full -right-[7px] top-1/2 transform -translate-y-1/2 z-10"
      />
    </div> // Changed from motion.div to div
  );
};

export default ScriptNode;