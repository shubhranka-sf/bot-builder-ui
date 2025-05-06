import { atom } from 'jotai';
import { Node, Edge } from 'reactflow';
import { ChatbotVersion } from '../types';

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
  }
  return fallback; // Return fallback if nothing valid is stored or error occurs
};


// Initial nodes and edges - Use [] as fallback if loading fails or is empty
const initialNodes: Node[] = loadFromLocalStorage('nodes', []);
const initialEdges: Edge[] = loadFromLocalStorage('edges', []);
const initialVersions: ChatbotVersion[] = loadFromLocalStorage('chatbot_versions_history', []);

//atoms
export const BotVersionsAtom = atom<ChatbotVersion[]>(initialVersions);
export const NodesAtom = atom<Node[]>(initialNodes);
export const EdgesAtom = atom<Edge[]>(initialEdges);
// export const BotVersion = atom(initialVersions);
export const isLoadingAtom = atom<boolean>(false);
export const isBotTrainedAtom = atom<boolean>(true); // Keep track of training status

// Optional: selected node/edge atom - Consider if needed globally
// export const selectedNodeAtom = atom<Node | null>(null);
// export const selectedEdgeAtom = atom<Edge | null>(null);

export const AddBotVersionAtom = atom(null, (get, set, newVersion: ChatbotVersion) => {
    const currentVersions = get(BotVersionsAtom);
    const updatedVersions = [...currentVersions, newVersion];
    localStorage.setItem('chatbot_versions_history', JSON.stringify(updatedVersions));
    set(BotVersionsAtom, updatedVersions);
  });

  export const selectedBotVersionAtom = atom<ChatbotVersion | null>(
    (get) => {
      const versions = get(BotVersionsAtom);
      return versions[versions.length - 1] ?? null;
    },
    (get, set, selectedVersion: ChatbotVersion) => {
      set(NodesAtom, selectedVersion.nodes);
      set(EdgesAtom, selectedVersion.edges);
      set(_selectedBotVersionWritableAtom, selectedVersion); // Write to a base atom
    }
  );
  
  // Internal writable atom to hold actual selected version
  const _selectedBotVersionWritableAtom = atom<ChatbotVersion | null>(null);
  
  
export const setSelectedBotVersionAtom = atom(
  null,
  (get, set, versionId: string) => {
    const allVersions = get(BotVersionsAtom);
    const selected = allVersions.find((v) => v.version === versionId);
    if (selected) {
      set(selectedBotVersionAtom, selected); // This will now work
    }
  }
);

  
  