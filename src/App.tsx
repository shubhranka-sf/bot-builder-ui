import { Route, Routes } from 'react-router-dom'
import './index.css'; 
import Home from './pages/Home';
import Flow from './Flow';

function App() {
return (

    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/flow" element={<Flow />} />
    </Routes>
  );
}

export default App;
