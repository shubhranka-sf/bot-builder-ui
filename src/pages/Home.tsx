import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Bot Type
type Bot = {
  id: string;
  name: string;
  domain: string;
  date: string;
  initials: string;
};

// Individual Bot Card
const BotCard = ({ bot }: { bot: Bot }) => (
  <div className="rounded-lg shadow-md bg-white hover:shadow-xl cursor-pointer p-4 transition-all relative">
    <div className="flex items-center justify-between mb-2">
      <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center text-lg font-bold">
        {bot.initials}
      </div>
      <span className="text-xs text-gray-500">{bot.date}</span>
    </div>
    <h3 className="text-md font-semibold text-gray-900 truncate">{bot.name}</h3>
    <p className="text-sm text-gray-500">{bot.domain}</p>
  </div>
);

// Modal Component
const CreateBotModal = ({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (bot: Bot) => void;
}) => {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [initials, setInitials] = useState("");

  const handleSubmit = () => {
    const newBot: Bot = {
      id: Date.now().toString(),
      name,
      domain,
      initials: initials || name.slice(0, 2).toUpperCase(),
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };
    onCreate(newBot);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-30">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">Create New Bot</h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Bot Name"
            className="w-full border px-3 py-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Domain (e.g., Service)"
            className="w-full border px-3 py-2 rounded"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <input
            type="text"
            placeholder="Initials (optional)"
            className="w-full border px-3 py-2 rounded"
            value={initials}
            onChange={(e) => setInitials(e.target.value)}
          />
        </div>

        <div className="flex justify-end mt-6 space-x-3">
          <button
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={handleSubmit}
            disabled={!name || !domain}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard
const Home = () => {
  const [bots, setBots] = useState<Bot[]>([
    {
      id: "1",
      name: "Telecom Self-Serve Bot",
      domain: "Service",
      date: "Dec 2, 2024",
      initials: "TS",
    },
  ]);
  const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

  const handleCreate = (newBot: Bot) => {
    setBots((prev) => [newBot, ...prev]);
    setShowModal(false);
    navigate("/flow"); 
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Bots</h1>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          onClick={() => setShowModal(true)}
        >
          Create New Bot
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {bots.map((bot) => (
          <BotCard key={bot.id} bot={bot} />
        ))}
      </div>

      {showModal && (
        <CreateBotModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  );
};

export default Home;
