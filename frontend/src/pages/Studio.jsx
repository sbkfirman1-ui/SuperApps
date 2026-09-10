import React, { useState, useEffect, useCallback } from 'react';
import Loader from '../components/Loader';
import { supabase } from '../lib/supabase';
import TransactionTable from '../components/TransactionTable';
import { getMasterData, setMasterData } from '../utils/masterData';

const Studio = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: txData, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('category', 'Studio')
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
        catatan: tx.catatan || allNotes[tx.id] || '',
        status: Number(tx.dp) === 0 ? 'BELUM LUNAS' : (Number(tx.dp) >= Number(tx.productPrice) ? 'LUNAS' : 'DP'),
      }));
      setData(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateRow = async (id, updates) => {
    // Save DP, Harga, and Catatan to Supabase
    await supabase.from('transactions').update({
      clientName: updates.clientName,
      dp: updates.dp,
      productPrice: updates.productPrice,
      catatan: updates.catatan
    }).eq('id', id);

    // Also update local storage for backward compatibility
    const allNotes = getMasterData('transaction_notes', {});
    allNotes[id] = updates.catatan;
    setMasterData('transaction_notes', allNotes);

    fetchData();
  };

  const handleResetAll = async () => {
    await supabase.from('transactions').delete().eq('category', 'Studio');
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
          <Loader text="Memuat data Studio..." />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <TransactionTable
        category="Studio"
        data={data}
        onResetAll={handleResetAll}
        onUpdateRow={handleUpdateRow}
        onDeleteRow={handleDeleteRow}
      />
    </div>
  );
};

export default Studio;
