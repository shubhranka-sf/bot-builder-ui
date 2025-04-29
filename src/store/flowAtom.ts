import { atom } from 'jotai';
import { Node, Edge } from 'reactflow';

// Load nodes and edges from localStorage or use initial data
const loadFromLocalStorage = (key: string, fallback: any) => {
  const storedData = localStorage.getItem(key);
  return storedData ? JSON.parse(storedData) : fallback;
};

// Initial nodes and edges
const initialNodes: Node[] = loadFromLocalStorage('nodes', []);
const initialEdges: Edge[] = loadFromLocalStorage('edges', []);

// Atoms
export const NodesAtom = atom<Node[]>(initialNodes);
export const EdgesAtom = atom<Edge[]>(initialEdges);
export const isLoadingAtom = atom<boolean>(false);

// Optional: selected node/edge atom
export const selectedNodeAtom = atom<Node | null>(null);
export const selectedEdgeAtom = atom<Edge | null>(null);
