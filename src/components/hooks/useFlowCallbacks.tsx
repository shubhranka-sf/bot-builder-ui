import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { applyNodeChanges, applyEdgeChanges, addEdge, Connection, NodeChange, EdgeChange, useReactFlow } from 'reactflow';
import { NodesAtom, EdgesAtom } from '../../store/flowAtom';
import { defaultEdgeOptions } from '../../data/mockData'; // Assuming defaultEdgeOptions is here
import { toast } from 'react-toastify';

/**
 * Hook providing memoized callbacks for React Flow core events.
 */
export function useFlowCallbacks() {
    const [nodes, setNodes] = useAtom(NodesAtom);
    const [edges, setEdges] = useAtom(EdgesAtom);
    const { setNodes: rfSetNodes, getNodes: rfGetNodes } = useReactFlow();

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes]
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges]
    );

    const onConnect = useCallback(
        (connection: Connection) => {
          const sourceNode = nodes.find((item) => item.id === connection.source);
          const targetNode = nodes.find((item) => item.id === connection.target);
      
          if (!sourceNode || !targetNode) return null;
      
          // Intent cannot connect to End
          if (sourceNode.type === "intent" && targetNode.type === "end") {
            toast.error("Intent cannot connect directly to end node", { autoClose: 2000 });
            return null;
          }
      
          // Intent can only have one outgoing connection
          if (sourceNode.type === "intent") {
            const existingOutgoing = edges.filter((edge) => edge.source === sourceNode.id);
            if (existingOutgoing.length > 0) {
              toast.error("An intent can only connect to one node", { autoClose: 2000 });
              return null;
            }
          }
      
          // Start node can only connect to intent
          if (sourceNode.type === "start" && targetNode.type !== "intent") {
            toast.error("Start node can only connect to intent", { autoClose: 2000 });
            return null;
          }
      
          setEdges((eds) => addEdge({ ...connection, ...defaultEdgeOptions }, eds));
        },
        [setEdges, nodes, edges]
      );
      
      
      

     // Clears node selection in React Flow state and closes sidebar/FAB
     const clearSelection = useCallback(() => {
        rfSetNodes(rfGetNodes().map((node) => ({ ...node, selected: false })));
        // Note: Closing sidebar/FAB is handled in the main Flow component's pane click handler
    }, [rfSetNodes, rfGetNodes]);

    return {
        onNodesChange,
        onEdgesChange,
        onConnect,
        clearSelection,
    };
}