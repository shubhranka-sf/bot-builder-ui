import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { applyNodeChanges, applyEdgeChanges, addEdge, Connection, NodeChange, EdgeChange, useReactFlow } from 'reactflow';
import { NodesAtom, EdgesAtom } from '../store/flowAtom';
import { defaultEdgeOptions } from '../data/mockData'; // Assuming defaultEdgeOptions is here

/**
 * Hook providing memoized callbacks for React Flow core events.
 */
export function useFlowCallbacks() {
    const [, setNodes] = useAtom(NodesAtom);
    const [, setEdges] = useAtom(EdgesAtom);
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
        (connection: Connection) =>
            setEdges((eds) => addEdge({ ...connection, ...defaultEdgeOptions }, eds)),
        [setEdges]
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