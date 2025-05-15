import React, { useState, useMemo, Suspense, useEffect } from "react";
import ReactFlow, {
  Controls,
  Background,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

// Node Components
import StartNode from "./components/nodes/StartNode";
import IntentNode from "./components/nodes/IntentNode";
import ActionNode from "./components/nodes/ActionNode";
import EndNode from "./components/nodes/EndNode";
import FormNode from "./components/nodes/FormNode";
import ScriptNode from "./components/nodes/ScriptNode";
import IfNode from "./components/nodes/IfNode"; // --- IMPORT IF NODE ---

// UI Components
import Sidebar from "./components/Sidebar";
import FlowFAB from "./components/flow_parts/FlowFAB";
import FlowTopBar from "./components/flow_parts/FlowTopBar";
const ChatBotWidget = React.lazy(() => import("./components/ChatBotWidget"));

// Hooks
import { useFlowCallbacks } from "./components/hooks/useFlowCallbacks";
import { useNodeManagement } from "./components/hooks/useNodeManagement";
import { useFlowEvents } from "./components/hooks/useFlowEvents";
import { useFlowExport } from "./components/hooks/useFlowExport";

// Data & Types
import {
  defaultEdgeOptions,
  mockDefinedActions,
  mockIntents,
  mockScriptUtilityFunctions,
} from "./data/mockData";
import { ActionDefinition, IntentDefinition, ScriptUtilityFunction, IfNodeData } from "./types"; // Added IfNodeData
import {
  NodesAtom,
  EdgesAtom,
  BotVersionsAtom,
  setSelectedBotVersionAtom,
} from "./store/flowAtom";

// Global State
import "react-toastify/dist/ReactToastify.css";
import DropdownButton from "./components/botversion/ChatbotVersion";
import { toast } from "react-toastify";

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';


function FlowContent() {
  const versions = useAtomValue(BotVersionsAtom);
  const setSelectedVersion = useSetAtom(setSelectedBotVersionAtom);
  const options = versions.map((v) => ({
    label: v.version,
    value: v.version,
  }));

  const [definedActions, setDefinedActions] = useState<ActionDefinition[]>(
    () => {
      const stored = localStorage.getItem("definedActions");
      try {
        return stored ? JSON.parse(stored) : mockDefinedActions;
      } catch {
        return mockDefinedActions;
      }
    }
  );
  const [intents, setIntents] = useState<IntentDefinition[]>(() => {
    const stored = localStorage.getItem("intents");
    try {
      return stored ? JSON.parse(stored) : mockIntents;
    } catch {
      return mockIntents;
    }
  });
  const [scriptUtilities] = useState<ScriptUtilityFunction[]>(mockScriptUtilityFunctions);


  const [nodes] = useAtom(NodesAtom);
  const [edges] = useAtom(EdgesAtom);

  const {
    selectedNode,
    setSelectedNode,
    isSidebarOpen,
    setIsSidebarOpen,
    isFabMenuOpen,
    fabRef,
    onSelectionChange,
    clearSelectionAndCloseSidebar,
    toggleFabMenu,
    isConfigurableNode,
  } = useFlowEvents();

  const { onNodesChange, onEdgesChange, onConnect } = useFlowCallbacks();

  const {
    updateStartNode,
    updateIntentNode,
    updateActionNode,
    updateFormNode,
    updateScriptNode,
    updateIfNode, // --- ADDED updateIfNode ---
    handleAddNode,
    handleAddNewIntentDefinition,
    handleAddNewActionDefinition,
  } = useNodeManagement({
    intents,
    setIntents,
    definedActions,
    setDefinedActions,
    setSelectedNode,
  });

  const { exportFlowData, isLoading, isTrained } = useFlowExport({
    projectId: "Flow1",
    intents,
    definedActions,
  });

  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);

  const handleNewMessage = (text: string) => {
    const userMessage = { role: "user", content: text };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
  };
  const onBotResponse = (response: string) => {
    const botMessage = { role: "assistant", content: response };
    setMessages((prevMessages) => [...prevMessages, botMessage]);
  };

  useEffect(() => {
    if (definedActions.length > 0 || localStorage.getItem("definedActions")) {
      localStorage.setItem("definedActions", JSON.stringify(definedActions));
    }
  }, [definedActions]);

  useEffect(() => {
    if (intents.length > 0 || localStorage.getItem("intents")) {
      localStorage.setItem("intents", JSON.stringify(intents));
    }
  }, [intents]);

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      start: StartNode,
      intent: IntentNode,
      action: ActionNode,
      end: EndNode,
      form: FormNode,
      script: ScriptNode,
      if: IfNode, // --- ADDED IF NODE TYPE ---
    }),
    []
  );

  const { fitView } = useReactFlow();
  useEffect(() => {
    if (nodes.length > 0) {
      const timeoutId = setTimeout(
        () => fitView({ duration: 300, padding: 0.1 }),
        50
      );
      return () => clearTimeout(timeoutId);
    }
  }, [nodes.length, fitView]);

  const callPredictApi = async (message: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/predict`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: message,
            sender_id: "user1",
            model_name: "default_model.tar.gz",
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Prediction API failed");
      }

      const data = await res.json();
      return data?.response?.[0]?.text || "No response";
    } catch (error) {
      console.error("Prediction API error:", error);
      return "Sorry, something went wrong!";
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gray-50 select-none">
      <div className="flex-grow h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          onPaneClick={clearSelectionAndCloseSidebar}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          className="bg-gradient-to-br from-indigo-50 via-white to-blue-50"
          deleteKeyCode={["Backspace", "Delete"]}
        >
          <Controls />
          <Background />
        </ReactFlow>

        <FlowTopBar onTrain={exportFlowData} isLoading={isLoading} />

        <AnimatePresence>
          {selectedNode &&
            isConfigurableNode(selectedNode) &&
            !isSidebarOpen && (
              <motion.div
                className="absolute bottom-24 right-6 z-30"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <motion.button
                  onClick={() => setIsSidebarOpen(true)}
                  className="btn btn-circle btn-neutral shadow-xl"
                  title="Configure Node"
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Settings size={28} />
                </motion.button>
              </motion.div>
            )}
        </AnimatePresence>

        <FlowFAB
          isOpen={isFabMenuOpen}
          toggleFabMenu={toggleFabMenu}
          onAddNode={handleAddNode}
          fabRef={fabRef}
        />

        {isTrained ? (
          <>
            <Suspense
              fallback={
                <div className="absolute bottom-5 left-5 text-gray-500">
                  Loading Chat...
                </div>
              }
            >
              <ChatBotWidget
                callApi={callPredictApi}
                handleNewMessage={handleNewMessage}
                onBotResponse={onBotResponse}
                messages={messages}
                primaryColor="#4F46E5"
              />
            </Suspense>
            <div className="absolute top-3 left-3 text-xs rounded-md shadow">
              <DropdownButton
                options={options}
                onSelect={(versionId) => setSelectedVersion(versionId)}
                buttonLabel="Bot Versions"
              />
            </div>
          </>
        ) : (
          <div className="absolute top-3 left-3 p-3 bg-yellow-100 text-yellow-800 text-xs rounded-md shadow border border-yellow-300 z-10">
            Train the model to enable the chat widget.
          </div>
        )}
      </div>
      {isTrained ? (
        <div className="absolute bottom-3 left-12 p-3 bg-yellow-50 text-yellow-700 text-xs rounded-md shadow border border-yellow-300">
          Recent Trained model will be use in preview bot.
        </div>
      ) : null}

      {isSidebarOpen && selectedNode && isConfigurableNode(selectedNode) && (
        <div
          key={`${selectedNode.id}-${selectedNode.type}`}
          className="w-80 h-full flex-shrink-0 bg-white shadow-lg border-l border-gray-200 flex flex-col"
        >
          <Sidebar
            selectedNode={selectedNode}
            intents={intents}
            definedActions={definedActions}
            scriptUtilities={scriptUtilities}
            onUpdateStartNode={updateStartNode}
            onUpdateIntent={updateIntentNode}
            onUpdateAction={updateActionNode}
            onUpdateForm={updateFormNode}
            onUpdateScriptNode={updateScriptNode}
            onUpdateIfNode={updateIfNode} // --- PASS updateIfNode ---
            onAddNewIntentDefinition={handleAddNewIntentDefinition}
            onAddNewActionDefinition={handleAddNewActionDefinition}
            onClose={clearSelectionAndCloseSidebar}
          />
        </div>
      )}
    </div>
  );
}

function Flow() {
  return (
    <DndProvider backend={HTML5Backend}>
      <ReactFlowProvider>
        <FlowContent />
      </ReactFlowProvider>
    </DndProvider>
  );
}

export default Flow;