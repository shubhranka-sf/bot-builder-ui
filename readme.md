# Overview
    Chatbot builder interface that uses React Flow to create a node-based visual editor.

## Core Components Overview
- ****Flow.tsx****
- ****Sidebar.tsx****

## Flow.tsx
This is the main component that manages the React Flow instance and all state related to the chatbot flow. Here's what it does:
### 1. State Management
- Manages nodes and edges that represent the chatbot flow
- Tracks the currently selected node
- Controls the visibility of the floating action button (FAB) menu and sidebar

### 2. Node Types
- StartNode: Beginning of a conversation flow
- IntentNode: Represents user intents like "greeting" or "order status"
- ActionNode: Actions the chatbot performs (send message, API calls, etc.)
- EndNode: Termination points in the flow

### 3. User Interface Elements:
- A React Flow canvas where the nodes and connections are displayed
- A floating action button (FAB) menu for adding new nodes
- A sidebar that appears when nodes are selected for configuration
- Animated transitions using Framer Motion

### 4. Node Operations
- Adding nodes through the FAB menu
- Updating node configurations (intent IDs, action details)
- Managing connections between nodes

## Sidebar 
This component provides the configuration interface for selected nodes:

### 1. Configuration Modes
- **view:** Default mode showing current node properties
- **edit:** Allows editing node properties
- **change:** Allows changing the node's intent or action type

### 2. Node Configuration
- **For IntentNodes:** Select and configure intent IDs and example phrases
- **For ActionNodes:** Configure title, name, value type (text or function)

### 3. Dialog Modals
- For defining new intent types
- For defining new action types

## Key Functionality

### Node and Edge Management
The code uses React Flow's built-in functions for:

- Adding and connecting nodes
- Applying changes to nodes and edges
- Handling selection changes
- Positioning nodes in the flow

### Node Configuration
For IntentNodes, you can:
- Select from predefined intents (greeting, order, support, etc.)
- Define new intents with example phrases

For ActionNodes, you can:
- Configure the action name, title, and value
- Choose between text values and function calls
- Define new action types

### UI/UX Features
1. **Floating Action Button (FAB):**
    - Toggles a radial menu for adding different node types
    - Uses Framer Motion for smooth animations

2. **Sidebar Configuration:**
    - Appears when nodes are selected
    - Animates in/out using Framer Motion
    - Provides context-specific configuration options


3. **Modal Dialogs:**
    - For more complex operations like defining new intents or actions
    - Form-based interfaces with validation

### Flow of Operation

1. User starts with a basic flow containing start, intent, action, and end nodes
2. User can add new nodes from the FAB menu
3. When selecting a node, they can:
    - View its current configuration in the sidebar
    - Edit its properties
    - Change its type (for intents/actions) to another predefined type
    - Define entirely new intent/action types