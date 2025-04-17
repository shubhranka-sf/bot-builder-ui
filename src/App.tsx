import Flow from './Flow';
import './index.css'; // Ensure Tailwind is loaded

function App() {
  console.log(import.meta.env.VITE_BACKEND_BASE_URL);

  return (
    // The Flow component now includes the Sidebar internally
    <Flow />
  );
}

export default App;
