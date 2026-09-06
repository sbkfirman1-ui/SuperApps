import React, { useState } from 'react';
import TransactionTable from '../components/TransactionTable';

const DUMMY_DATA = [
  {
    id: 1,
    client: 'Keluarga Bpk. Santoso',
    tglBooking: '2026-04-05',
    tglHariH: '2026-04-05',
    vendor: 'Studio Team',
    produk: 'Studio Family Portrait',
    kategori: 'Studio',
    dp: 1200000,
    harga: 1200000,
    catatan: 'Pakai background abu-abu',
    status: 'LUNAS',
    check1: true
  },
  {
    id: 2,
    client: 'Ayu Lestari',
    tglBooking: '2026-04-06',
    tglHariH: '2026-04-10',
    vendor: 'Joko',
    produk: 'Graduation Package',
    kategori: 'Studio',
    dp: 300000,
    harga: 850000,
    catatan: 'Bawa properti sendiri',
    status: 'DP',
    check1: false
  }
];

const Studio = () => {
  const [data, setData] = useState(DUMMY_DATA);

  return (
    <div className="page-container">
      <TransactionTable 
        category="Studio" 
        data={data} 
        onResetAll={() => setData([])}
      />
    </div>
  );
};

export default Studio;
