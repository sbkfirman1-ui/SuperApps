import React, { useState } from 'react';
import TransactionTable from '../components/TransactionTable';

const DUMMY_DATA = [
  {
    id: 1,
    client: 'Nazwa & Randi',
    tglBooking: '2026-04-02',
    tglHariH: '2026-05-15',
    vendor: 'Budi, Andi',
    produk: 'Prewedding Cinematic',
    kategori: 'Wedding',
    dp: 2000000,
    harga: 5500000,
    catatan: 'Konsep outdoor pantai',
    status: 'DP',
    check1: false
  },
  {
    id: 2,
    client: 'Sinta & Rama',
    tglBooking: '2026-04-10',
    tglHariH: '2026-06-20',
    vendor: 'Tim A',
    produk: 'Wedding Full Package Premium',
    kategori: 'Wedding',
    dp: 15000000,
    harga: 15000000,
    catatan: '',
    status: 'LUNAS',
    check1: true
  }
];

const Wedding = () => {
  const [data, setData] = useState(DUMMY_DATA);

  return (
    <div className="page-container">
      <TransactionTable 
        category="Wedding" 
        data={data} 
        onResetAll={() => setData([])} 
      />
    </div>
  );
};

export default Wedding;
