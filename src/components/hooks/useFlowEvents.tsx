import { useState, useCallback, useEffect, useRef } from 'react';
import { OnSelectionChangeParams, Node, Edge, useReactFlow } from 'reactflow';
import { useAtom } from 'jotai';
import { useDebouncedCallback } from 'use-debounce';
import { toast } from 'react-toastify';
import { NodesAtom, EdgesAtom } from '../../store/flowAtom';

function isConfigurableNode(node: Node | null): boolean {
    if (!node) return false;
    // Add 'if' to configurable nodes
    return ['start', 'intent', 'action', 'form', 'script', 'if'].includes(node.type || '');
}

export function useFlowEvents() {
    const [nodes, setNodes] = useAtom(NodesAtom);
    const [edges, setEdges] = useAtom(EdgesAtom);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
    const fabRef = useRef<HTMLDivElement>(null); 
    const { setNodes: rfSetNodes, getNodes: rfGetNodes } = useReactFlow();

    const onSelectionChange = useCallback(({ nodes: selectedNodes }: OnSelectionChangeParams) => {
        const newSelectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
        const isConfigurable = newSelectedNode && isConfigurableNode(newSelectedNode);
        
        // If the newly selected node is different from the current, or if no node is selected
        // and sidebar was open, close sidebar first.
        // This prevents sidebar "jumping" content if it was already open for another node.
        if (selectedNode?.id !== newSelectedNode?.id || (!newSelectedNode && isSidebarOpen)) {
            setIsSidebarOpen(false); // Close first
             // Then, if new node is configurable, open it after a short delay
             if (isConfigurable) {
                setTimeout(() => {
                    setSelectedNode(newSelectedNode);
                    setIsSidebarOpen(true);
                }, 50); // Small delay for smoother transition if needed
            } else {
                setSelectedNode(newSelectedNode);
            }
        } else { // Same node selected or sidebar was closed
            setSelectedNode(newSelectedNode);
            if (isConfigurable) {
                setIsSidebarOpen(true);
            }
        }
        setIsFabMenuOpen(false);
    }, [setIsSidebarOpen, setIsFabMenuOpen, selectedNode, isSidebarOpen]); 

    const clearSelectionAndCloseSidebar = useCallback(() => {
        setSelectedNode(null);
        setIsFabMenuOpen(false);
        setIsSidebarOpen(false);
        rfSetNodes(rfGetNodes().map((node) => ({ ...node, selected: false })));
    }, [rfSetNodes, rfGetNodes]); 

    const toggleFabMenu = useCallback(() => setIsFabMenuOpen((prev) => !prev), []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (fabRef.current && !fabRef.current.contains(e.target as HTMLElement)) {
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

    const saveNodesToLocalStorage = useDebouncedCallback((nodesToSave: Node[]) => {
        try {
            const serializableNodes = nodesToSave.map(n => ({ ...n, data: { ...n.data } }));
            localStorage.setItem('nodes', JSON.stringify(serializableNodes));
        } catch (e) {
            console.error('LS Node Save Error:', e);
            toast.error("Could not save nodes to local storage.");
        }
    }, 1000);

    useEffect(() => {
        if (nodes.length > 0 || localStorage.getItem('nodes')) {
           saveNodesToLocalStorage(nodes);
        }
    }, [nodes, saveNodesToLocalStorage]);

    const saveEdgesToLocalStorage = useDebouncedCallback((edgesToSave: Edge[]) => {
        try {
            const serializableEdges = edgesToSave.map(e => ({ ...e, data: e.data ? { ...e.data } : undefined }));
            localStorage.setItem('edges', JSON.stringify(serializableEdges));
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

    useEffect(() => {
        const storedNodes = localStorage.getItem('nodes');
        const storedEdges = localStorage.getItem('edges');

        if (storedNodes && storedNodes !== '[]') {
            try {
                setNodes(JSON.parse(storedNodes));
            } catch (e) {
                 console.error("Failed to parse nodes from localStorage", e);
                 toast.error("Failed to load nodes from storage.");
                 localStorage.removeItem('nodes'); 
            }
        } else {
            // console.log('No valid nodes in localStorage, relying on initial atom state.');
        }

        if (storedEdges && storedEdges !== '[]') {
             try {
                setEdges(JSON.parse(storedEdges));
             } catch (e) {
                 console.error("Failed to parse edges from localStorage", e);
                 toast.error("Failed to load edges from storage.");
                 localStorage.removeItem('edges'); 
            }
        } else {
            // console.log('No valid edges in localStorage, relying on initial atom state.');
        }
    }, [setNodes, setEdges]);


    return {
        selectedNode,
        setSelectedNode, 
        isSidebarOpen,
        setIsSidebarOpen,
        isFabMenuOpen,
        setIsFabMenuOpen,
        fabRef,
        onSelectionChange,
        clearSelectionAndCloseSidebar,
        toggleFabMenu,
        isConfigurableNode, 
    };
}