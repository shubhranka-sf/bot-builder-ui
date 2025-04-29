import { atom } from 'jotai';
import { Node, Edge } from 'reactflow';

// Load nodes and edges from localStorage or use initial data
const loadFromLocalStorage = (key: string, fallback: any) => {
  try {
      const storedData = localStorage.getItem(key);
      // Add basic validation: Check if it's not just "[]" or null/undefined
      if (storedData && storedData !== '[]') {
          return JSON.parse(storedData);
      }
  } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      // Optionally clear the corrupted item
      // localStorage.removeItem(key);
  }
  return fallback; // Return fallback if nothing valid is stored or error occurs
};

// Initial nodes and edges - Use [] as fallback if loading fails or is empty
const initialNodes: Node[] = loadFromLocalStorage('nodes', []);
const initialEdges: Edge[] = loadFromLocalStorage('edges', []);

// Atoms
export const NodesAtom = atom<Node[]>(initialNodes);
export const EdgesAtom = atom<Edge[]>(initialEdges);
export const isLoadingAtom = atom<boolean>(false);
export const isBotTrainedAtom = atom<boolean>(false); // Keep track of training status

// Optional: selected node/edge atom - Consider if needed globally
// export const selectedNodeAtom = atom<Node | null>(null);
// export const selectedEdgeAtom = atom<Edge | null>(null);