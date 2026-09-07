import React, { useState, useEffect, useCallback } from 'react';
import Loader from '../components/Loader';
import { supabase } from '../lib/supabase';
import FinanceTable from '../components/FinanceTable';

const FinanceData = ({ category }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: finData, error } = await supabase
      .from('finance')
      .select('*')
      .eq('category', category)
      .order('tanggal', { ascending: true });

    if (!error && finData) {
      // Calculate running saldo
      let runningTotal = 0;
      const mapped = finData.map(row => {
        const nominal = Number(row.nominal) || 0;
        const isPemasukan = row.jenis === 'Pemasukan';
        runningTotal += isPemasukan ? nominal : -nominal;
        
        let jenisPembayaran = '-';
        let ket = row.keterangan || '';
        if (ket.startsWith('[Transfer] ')) {
          jenisPembayaran = 'Transfer';
          ket = ket.substring(11);
        } else if (ket.startsWith('[Cash] ')) {
          jenisPembayaran = 'Cash';
          ket = ket.substring(7);
        }

        return {
          id: row.id,
          tanggal: row.tanggal,
          keterangan: ket,
          kategori: row.jenis,
          jenisPembayaran,
          pemasukan: isPemasukan ? nominal : 0,
          pengeluaran: !isPemasukan ? nominal : 0,
          saldo: runningTotal,
        };
      });
      setData(mapped);
    }
    setLoading(false);
  }, [category]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleResetAll = async () => {
    await supabase.from('finance').delete().eq('category', category);
    fetchData();
  };

  const handleDeleteRow = async (id) => {
    await supabase.from('finance').delete().eq('id', id);
    fetchData();
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader text="Memuat data Finance {category}..." />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <FinanceTable
        category={category}
        data={data}
        onResetAll={handleResetAll}
        onDeleteRow={handleDeleteRow}
      />
    </div>
  );
};

export default FinanceData;
