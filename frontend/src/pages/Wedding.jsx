import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import TransactionTable from '../components/TransactionTable';
import { getMasterData, setMasterData } from '../utils/masterData';

const Wedding = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: txData, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('category', 'Wedding')
      .order('created_at', { ascending: false });

    if (!error && txData) {
      const allNotes = getMasterData('transaction_notes', {});
      
      const mapped = txData.map(tx => ({
        id: tx.id,
        client: tx.clientName,
        tglBooking: tx.bookingDate,
        tglHariH: tx.dDayDate,
        vendor: tx.phone,
        produk: tx.productName,
        kategori: tx.category,
        dp: Number(tx.dp),
        harga: Number(tx.productPrice),
        catatan: allNotes[tx.id] || '',
        status: Number(tx.dp) === 0 ? 'BELUM LUNAS' : (Number(tx.dp) >= Number(tx.productPrice) ? 'LUNAS' : 'DP'),
      }));
      setData(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateRow = async (id, updates) => {
    // Save DP and Harga to Supabase
    await supabase.from('transactions').update({
      dp: updates.dp,
      productPrice: updates.productPrice
    }).eq('id', id);

    // Save Catatan to LocalStorage
    const allNotes = getMasterData('transaction_notes', {});
    allNotes[id] = updates.catatan;
    setMasterData('transaction_notes', allNotes);

    fetchData();
  };

  const handleResetAll = async () => {
    await supabase.from('transactions').delete().eq('category', 'Wedding');
    fetchData();
  };

  const handleDeleteRow = async (id) => {
    await supabase.from('transactions').delete().eq('id', id);
    fetchData();
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>⏳ Memuat data Wedding...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <TransactionTable
        category="Wedding"
        data={data}
        onResetAll={handleResetAll}
        onUpdateRow={handleUpdateRow}
        onDeleteRow={handleDeleteRow}
      />
    </div>
  );
};

export default Wedding;
