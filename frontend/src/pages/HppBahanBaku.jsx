import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === '') return 'Rp.0';
  return 'Rp.' + Number(number).toLocaleString('id-ID');
};

const HppBahanBaku = ({ category }) => {
  const [bahanBaku, setBahanBaku] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ name: '', satuan: 'pcs', unit: 1, price: '' });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', satuan: '', unit: 1, price: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('hpp_bahan_baku')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: true });

    if (!error) setBahanBaku(data || []);
    setLoading(false);
  }, [category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    if (!newItem.name || !newItem.price) return;
    const { error } = await supabase.from('hpp_bahan_baku').insert([{
      category,
      name: newItem.name,
      unit: Number(newItem.unit) || 1,
      price: Number(newItem.price),
    }]);
    if (!error) {
      setNewItem({ name: '', satuan: 'pcs', unit: 1, price: '' });
      fetchData();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus bahan baku ini?')) {
      await supabase.from('hpp_bahan_baku').delete().eq('id', id);
      fetchData();
    }
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setEditForm({ name: item.name, satuan: item.satuan || '', unit: item.unit, price: item.price });
  };

  const saveEdit = async (id) => {
    await supabase.from('hpp_bahan_baku').update({
      name: editForm.name,
      unit: Number(editForm.unit) || 1,
      price: Number(editForm.price),
    }).eq('id', id);
    setEditId(null);
    fetchData();
  };

  const totalCost = bahanBaku.reduce((acc, curr) => acc + Number(curr.price), 0);

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="page-header">
        <h1 className="page-title">Bahan Baku Utama - {category}</h1>
        <p className="page-subtitle">Kelola daftar komponen dasar HPP untuk divisi {category}</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Master Data Bahan Baku</h2>

        <div className="table-container" style={{ marginBottom: '1.5rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>No</th>
                <th>Bahan Baku</th>
                <th style={{ width: '100px' }}>Unit</th>
                <th style={{ width: '200px' }}>Cost</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Memuat data dari database...</td></tr>
              ) : bahanBaku.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>
                    {editId === item.id
                      ? <input type="text" className="form-control" style={{ padding: '0.3rem' }} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                      : <span style={{ fontWeight: 500 }}>{item.name}</span>}
                  </td>
                  <td>
                    {editId === item.id
                      ? <input type="number" className="form-control" style={{ padding: '0.3rem' }} value={editForm.unit} onChange={e => setEditForm({ ...editForm, unit: e.target.value })} />
                      : item.unit}
                  </td>
                  <td>
                    {editId === item.id
                      ? <input type="text" className="form-control" style={{ padding: '0.3rem' }} value={editForm.price ? formatRupiah(editForm.price) : ''} onChange={e => {
                          const rawValue = e.target.value.replace(/[^0-9]/g, '');
                          setEditForm({ ...editForm, price: rawValue });
                        }} />
                      : formatRupiah(item.price)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {editId === item.id ? (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="btn" onClick={() => saveEdit(item.id)} style={{ padding: '0.4rem', color: '#34d399', background: 'transparent' }} title="Simpan"><Check size={16} /></button>
                        <button className="btn" onClick={() => setEditId(null)} style={{ padding: '0.4rem', color: 'var(--text-muted)', background: 'transparent' }} title="Batal"><X size={16} /></button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="btn" onClick={() => startEdit(item)} style={{ padding: '0.4rem', color: '#60a5fa', background: 'transparent' }} title="Edit"><Edit2 size={16} /></button>
                        <button className="btn" onClick={() => handleDelete(item.id)} style={{ padding: '0.4rem', color: '#ef4444', background: 'transparent' }} title="Hapus"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && bahanBaku.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data bahan baku.</td></tr>
              )}
            </tbody>
            {bahanBaku.length > 0 && (
              <tfoot>
                <tr style={{ background: 'var(--overlay-bg-hover)', fontWeight: 'bold' }}>
                  <td colSpan="3" style={{ textAlign: 'right' }}>Total Estimasi Cost:</td>
                  <td colSpan="2" style={{ color: '#34d399' }}>{formatRupiah(totalCost)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div style={{ background: 'var(--surface-dark)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px dashed var(--border-glass)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#60a5fa' }}>Tambah Bahan Baku Baru</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '4fr 2fr 3fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Bahan Baku</label>
              <input type="text" className="form-control" placeholder="Cth: Cetak Album" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Unit</label>
              <input type="number" className="form-control" placeholder="1" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Cost (Rp)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Rp.0"
                value={newItem.price ? formatRupiah(newItem.price) : ''}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/[^0-9]/g, '');
                  setNewItem({ ...newItem, price: rawValue });
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleAdd} style={{ padding: '0.6rem 2rem' }}>
              <Plus size={18} /> Tambah Bahan Baku
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HppBahanBaku;
