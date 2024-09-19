import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const wsRef = useRef(null);
  const groupWsRef = useRef(null);

  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8000/ws/notice_board');
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, { ...data, type: 'notice' }]);
    };

    fetchGroups();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (groupWsRef.current) groupWsRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      groupWsRef.current = new WebSocket(`ws://localhost:8000/ws/${selectedGroup}`);
      groupWsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, { ...data, type: 'group' }]);
      };
    }
    return () => {
      if (groupWsRef.current) groupWsRef.current.close();
    };
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      const response = await axios.get('http://localhost:8000/get_group');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const createGroup = async () => {
    try {
      await axios.post('http://localhost:8000/create_group', { title: parseInt(newGroupTitle) });
      setNewGroupTitle('');
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const sendMessage = () => {
    if (input.trim()) {
      const message = {
        username: "사용자이름", // 실제 사용자 이름으로 대체해야 합니다
        message: input
      };
      if (selectedGroup) {
        groupWsRef.current.send(JSON.stringify(message));
      } else {
        wsRef.current.send(JSON.stringify(message));
      }
      setInput('');
    }
  };

  const renderMessage = (msg) => {
    if (msg.filter_result && msg.filter_result.category === '악플/욕설') {
      return "채팅이 관리자에 의해 가려졌습니다";
    }
    return msg.message;
  };

  return (
    <div className="App">
      <h1>Chat Application</h1>
      <div>
        <h2>Create Group</h2>
        <input
          type="number"
          value={newGroupTitle}
          onChange={(e) => setNewGroupTitle(e.target.value)}
          placeholder="Enter group title (number)"
        />
        <button onClick={createGroup}>Create Group</button>
      </div>
      <div>
        <h2>Join Group</h2>
        <select onChange={(e) => setSelectedGroup(e.target.value)}>
          <option value="">Select a group</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              Group {group}
            </option>
          ))}
        </select>
      </div>
      <div>
        <h2>{selectedGroup ? `Group ${selectedGroup} Chat` : 'Notice Board'}</h2>
        <div style={{ height: '300px', overflowY: 'scroll', border: '1px solid black' }}>
          {messages.map((msg, index) => (
            // 메시지 표시 부분
            <div key={index} style={{ 
              color: msg.filter_result && msg.filter_result.category === '악플/욕설' ? 'red' : 'black'
            }}>
              <strong>{msg.username}:</strong> {renderMessage(msg)}
            </div>
          ))}
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;