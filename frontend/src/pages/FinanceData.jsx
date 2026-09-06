import React, { useState, useEffect } from 'react';
import FinanceTable from '../components/FinanceTable';

const DUMMY_DATA_WEDDING = [
  {
    tanggal: '2026-05-01',
    keterangan: 'DP Nazwa & Randi',
    kategori: 'Pemasukan',
    jenisPembayaran: 'Transfer',
    pemasukan: 2000000,
    pengeluaran: 0,
    saldo: 2000000
  },
  {
    tanggal: '2026-05-03',
    keterangan: 'Sewa Lensa Tambahan',
    kategori: 'Pengeluaran',
    jenisPembayaran: 'Cash',
    pemasukan: 0,
    pengeluaran: 500000,
    saldo: 1500000
  },
  {
    tanggal: '2026-05-15',
    keterangan: 'Pelunasan Nazwa & Randi',
    kategori: 'Pemasukan',
    jenisPembayaran: 'Transfer',
    pemasukan: 3500000,
    pengeluaran: 0,
    saldo: 5000000
  }
];

const DUMMY_DATA_STUDIO = [
  {
    tanggal: '2026-04-05',
    keterangan: 'Family Portrait Keluarga Bpk. Santoso',
    kategori: 'Pemasukan',
    jenisPembayaran: 'Cash',
    pemasukan: 1200000,
    pengeluaran: 0,
    saldo: 1200000
  },
  {
    tanggal: '2026-04-06',
    keterangan: 'Beli Properti Background',
    kategori: 'Pengeluaran',
    jenisPembayaran: 'Transfer',
    pemasukan: 0,
    pengeluaran: 300000,
    saldo: 900000
  }
];

const FinanceData = ({ category }) => {
  const initialData = category === 'Wedding' ? DUMMY_DATA_WEDDING : DUMMY_DATA_STUDIO;
  const [data, setData] = useState(initialData);

  // When category switches (if they use same component instance), update dummy data
  useEffect(() => {
    setData(category === 'Wedding' ? DUMMY_DATA_WEDDING : DUMMY_DATA_STUDIO);
  }, [category]);

  return (
    <div className="page-container">
      <FinanceTable 
        category={category} 
        data={data} 
        onResetAll={() => setData([])}
      />
    </div>
  );
};

export default FinanceData;
