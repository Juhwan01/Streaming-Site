import React, { useState } from 'react';
import { Users, PlusCircle } from 'lucide-react';

const RoomList = ({ rooms, onRoomSelect, onCreateRoom }) => {
  const [newRoomName, setNewRoomName] = useState('');

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      onCreateRoom(newRoomName);
      setNewRoomName('');
    }
  };

  return (
    <div className="bg-white border-r border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-6">Rooms</h2>
      <div className="mb-4">
        <input
          type="text"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="New room name"
          className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleCreateRoom}
          className="w-full px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center"
        >
          <PlusCircle className="mr-2" size={18} />
          Create Room
        </button>
      </div>
      <ul className="space-y-2">
        {rooms.map((room) => (
          <li
            key={room}
            onClick={() => onRoomSelect(room)}
            className="px-4 py-2 rounded-lg cursor-pointer transition-all hover:bg-gray-100"
          >
            <div className="flex items-center">
              <Users className="mr-2" size={18} />
              {room}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoomList;