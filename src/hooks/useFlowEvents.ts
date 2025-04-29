import { useState, useCallback, useEffect, useRef } from 'react';
import { OnSelectionChangeParams, Node, Edge, useReactFlow } from 'reactflow';
import { useAtom } from 'jotai';
import { useDebouncedCallback } from 'use-debounce';
import { toast } from 'react-toastify';
import { NodesAtom, EdgesAtom } from '../store/flowAtom';

function isConfigurableNode(node: Node | null): boolean {
    if (!node) return false;
    return node.type === 'start' || node.type === 'intent' || node.type === 'action' || node.type === 'form';
}

/**
 * Hook for managing UI events, selection, and local storage saving.
 */
export function useFlowEvents() {
    const [nodes, setNodes] = useAtom(NodesAtom);
    const [edges, setEdges] = useAtom(EdgesAtom);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
    const fabRef = useRef<HTMLDivElement>(null); // Ref for FAB menu click outside
    const { setNodes: rfSetNodes, getNodes: rfGetNodes } = useReactFlow();

    // --- Selection Handling ---
    const onSelectionChange = useCallback(({ nodes: selectedNodes }: OnSelectionChangeParams) => {
        const newSelectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
        const isConfigurable = newSelectedNode && isConfigurableNode(newSelectedNode);
        setSelectedNode(newSelectedNode);
        setIsFabMenuOpen(false); // Close FAB on selection change
        setIsSidebarOpen(!!isConfigurable); // Open sidebar if the selected node is configurable
    }, [setIsSidebarOpen, setIsFabMenuOpen]); // Added dependencies

    const clearSelectionAndCloseSidebar = useCallback(() => {
        setSelectedNode(null);
        setIsFabMenuOpen(false);
        setIsSidebarOpen(false);
        // Also clear React Flow's internal selection state
        rfSetNodes(rfGetNodes().map((node) => ({ ...node, selected: false })));
    }, [rfSetNodes, rfGetNodes]); // Added dependencies

    // --- FAB Menu Logic ---
    const toggleFabMenu = useCallback(() => setIsFabMenuOpen((prev) => !prev), []);

    useEffect(() => {
        // Handle clicks outside the FAB menu to close it
        const handleClickOutside = (e: MouseEvent) => {
            if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
                setIsFabMenuOpen(false);
            }
        };
        if (isFabMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFabMenuOpen]);

    // --- Local Storage Saving (Debounced) ---
    const saveNodesToLocalStorage = useDebouncedCallback((nodesToSave: Node[]) => {
        try {
            const serializableNodes = nodesToSave.map(n => ({ ...n, data: { ...n.data } }));
            localStorage.setItem('nodes', JSON.stringify(serializableNodes));
            console.log('Saved nodes:', serializableNodes.length);
        } catch (e) {
            console.error('LS Node Save Error:', e);
            toast.error("Could not save nodes to local storage.");
        }
    }, 1000);

    useEffect(() => {
        // Only save if nodes array is not the initial empty array from load error/fallback
        if (nodes.length > 0 || localStorage.getItem('nodes')) {
           saveNodesToLocalStorage(nodes);
        }
    }, [nodes, saveNodesToLocalStorage]);

    const saveEdgesToLocalStorage = useDebouncedCallback((edgesToSave: Edge[]) => {
        try {
            const serializableEdges = edgesToSave.map(e => ({ ...e, data: e.data ? { ...e.data } : undefined }));
            localStorage.setItem('edges', JSON.stringify(serializableEdges));
            console.log('Saved edges:', serializableEdges.length);
        } catch (e) {
            console.error('LS Edge Save Error:', e);
            toast.error("Could not save edges to local storage.");
        }
    }, 1000);

    useEffect(() => {
         if (edges.length > 0 || localStorage.getItem('edges')) {
            saveEdgesToLocalStorage(edges);
         }
    }, [edges, saveEdgesToLocalStorage]);

    // --- Initialization Effect (Load from Local Storage) ---
    useEffect(() => {
        const storedNodes = localStorage.getItem('nodes');
        const storedEdges = localStorage.getItem('edges');

        if (storedNodes && storedNodes !== '[]') {
            console.log('Loading nodes from localStorage');
            try {
                setNodes(JSON.parse(storedNodes));
            } catch (e) {
                 console.error("Failed to parse nodes from localStorage", e);
                 toast.error("Failed to load nodes from storage.");
                 localStorage.removeItem('nodes'); // Clear invalid data
            }
        } else {
            // If no nodes stored, initialize with mock data (moved to initial state of atom)
            console.log('No valid nodes in localStorage, relying on initial atom state.');
        }

        if (storedEdges && storedEdges !== '[]') {
            console.log('Loading edges from localStorage');
             try {
                setEdges(JSON.parse(storedEdges));
             } catch (e) {
                 console.error("Failed to parse edges from localStorage", e);
                 toast.error("Failed to load edges from storage.");
                 localStorage.removeItem('edges'); // Clear invalid data
            }
        } else {
            console.log('No valid edges in localStorage, relying on initial atom state.');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount


    return {
        selectedNode,
        setSelectedNode, // Expose if needed externally
        isSidebarOpen,
        setIsSidebarOpen,
        isFabMenuOpen,
        setIsFabMenuOpen,
        fabRef,
        onSelectionChange,
        clearSelectionAndCloseSidebar,
        toggleFabMenu,
        isConfigurableNode, // Export helper function
    };
}