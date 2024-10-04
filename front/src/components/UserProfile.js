import React, { useState, useEffect } from 'react';
import { DollarSign, LogOut } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';  // 백엔드 API URL을 적절히 설정해주세요

const UserProfile = ({ user, onLogout }) => {
  const [topupAmount, setTopupAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.iamport.kr/v1/iamport.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (!user || !user.account) {
    return <div>Loading user profile...</div>;
  }

  const balanceDisplay = user.account && typeof user.account.balance !== 'undefined'
    ? `₩${parseFloat(user.account.balance).toLocaleString()}`
    : 'N/A';

  const handleTopup = () => {
    if (!topupAmount || isNaN(topupAmount) || topupAmount <= 0) {
      alert('올바른 충전 금액을 입력해주세요.');
      return;
    }

    setLoading(true);

    const { IMP } = window;
    IMP.init('imp80571156');  // 여기에 실제 가맹점 식별코드를 넣어주세요

    IMP.request_pay(
      {
        pg: 'kakaopay',
        pay_method: 'card',
        merchant_uid: `charge_${new Date().getTime()}`,
        name: '계정 충전',
        amount: parseInt(topupAmount),
        buyer_email: user.email,
        buyer_name: user.full_name,
        buyer_tel: '010-1234-5678',  // 실제 사용자의 전화번호를 사용하거나, 입력 받도록 수정해주세요
      },
      async (rsp) => {
        console.log('결제 응답:', rsp); // 결제 응답 확인

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
            
            console.log('API 성공 응답:', response.data); // API 응답 확인
            alert('충전이 완료되었습니다.');

            // localStorage에 새로운 잔액 저장 (응답에서 new_balance를 받아와야 함)
            const newBalance = response.data.new_balance;  // API 응답에서 새로운 잔액 가져오기
            localStorage.setItem('balance', newBalance); // 잔액을 localStorage에 저장

            // 사용자 객체 업데이트 (반영을 위해)
            user.account.balance = newBalance;

            setTopupAmount('');
          } catch (error) {
            console.error('충전 실패:', error.response || error); // 전체 에러 로그 확인
            alert('충전 처리 중 오류가 발생했습니다.');
          }
        } else {
          console.error('결제 실패:', rsp.error_msg); // 결제 실패 로그
          alert(`결제 실패: ${rsp.error_msg}`);
        }
        setLoading(false);
      }
    );
  };

  return (
    <div className="p-6 bg-white border-t border-gray-200">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">User Info</h3>
      <p className="text-gray-600">Username: {user.username || 'N/A'}</p>
      <p className="text-gray-600">Balance: {balanceDisplay}</p>
      <div className="mt-4">
        <input
          type="number"
          value={topupAmount}
          onChange={(e) => setTopupAmount(e.target.value)}
          placeholder="충전 금액 (원)"
          className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          onClick={handleTopup}
          className="w-full px-4 py-2 text-white bg-yellow-500 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 flex items-center justify-center"
          disabled={loading}
        >
          <DollarSign className="mr-2" size={18} />
          {loading ? '처리 중...' : '카카오페이로 충전'}
        </button>
      </div>
      <button
        onClick={onLogout}
        className="w-full px-4 py-2 mt-4 text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center"
        disabled={loading}
      >
        <LogOut className="mr-2" size={18} />
        로그아웃
      </button>
    </div>
  );
};

export default UserProfile;
