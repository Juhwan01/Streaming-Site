import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const App = () => {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserInfo(token);
    } else {
      setLoading(false);
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.iamport.kr/v1/iamport.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchUserInfo = async (token) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setBalance(response.data.account.balance);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
  
      const response = await axios.post(`${API_URL}/login`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      await fetchUserInfo(access_token);
    } catch (error) {
      console.error('Login failed:', error);
      alert('로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setBalance(0);
  };

  const requestPay = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    const { IMP } = window;
    IMP.init('imp80571156');

    IMP.request_pay(
      {
        pg: 'kcp',
        pay_method: 'card',
        merchant_uid: `qwe${new Date().getTime()}`,
        name: '계정 충전',
        amount: 1000,
        buyer_email: user.email,
        buyer_name: user.full_name,
        buyer_tel: '010-1234-5678',
      },
      async (rsp) => {
        if (rsp.success) {
          try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/charge`, {
              amount: rsp.paid_amount,
              imp_uid: rsp.imp_uid,
              merchant_uid: rsp.merchant_uid
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            alert('충전이 완료되었습니다.');
            setBalance(response.data.new_balance);
          } catch (error) {
            console.error('Charge failed:', error);
            alert('충전 처리 중 오류가 발생했습니다.');
          }
        } else {
          alert(`결제 실패: ${rsp.error_msg}`);
        }
      }
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div>
        <h2>로그인</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button type="submit">로그인</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1>사용자 프로필</h1>
      <div>
        <p>이름: {user.full_name}</p>
        <p>이메일: {user.email}</p>
        <p>잔액: {balance}원</p>
      </div>
      <button onClick={requestPay}>충전하기</button>
      <button onClick={handleLogout}>로그아웃</button>
    </div>
  );
};

export default App;