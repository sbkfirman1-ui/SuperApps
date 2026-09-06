import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Check } from 'lucide-react';
import { 
  DEFAULT_FINANCE_CATEGORIES, 
  getMasterData, 
  setMasterData 
} from '../utils/masterData';

const Setting = () => {
  const [financeCategories, setFinanceCategories] = useState(() => getMasterData('financeCategories', DEFAULT_FINANCE_CATEGORIES));
  useEffect(() => { setMasterData('financeCategories', financeCategories); }, [financeCategories]);

  // Form states for adding new items
  const [newFinance, setNewFinance] = useState({ name: '', type: 'Pengeluaran' });

  // Edit states
  const [editFinanceId, setEditFinanceId] = useState(null);
  const [editFinanceForm, setEditFinanceForm] = useState({ name: '', type: '' });

  // Handle Finance Categories
  const addFinanceCategory = () => {
    if (!newFinance.name) return;
    setFinanceCategories([...financeCategories, { id: Date.now(), name: newFinance.name, type: newFinance.type }]);
    setNewFinance({ name: '', type: 'Pengeluaran' });
  };
  const deleteFinanceCategory = (id) => { setFinanceCategories(financeCategories.filter(c => c.id !== id)); };
  const startEditFinance = (c) => { setEditFinanceId(c.id); setEditFinanceForm({ name: c.name, type: c.type }); };
  const saveEditFinance = (id) => {
    setFinanceCategories(financeCategories.map(c => c.id === id ? { ...c, name: editFinanceForm.name, type: editFinanceForm.type } : c));
    setEditFinanceId(null);
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="page-header">
        <h1 className="page-title">Master Data Settings</h1>
        <p className="page-subtitle">Kelola daftar kategori keuangan aplikasi</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* SECTION: FINANCE CATEGORIES */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Kategori Transaksi Finance</h2>
          
          <div className="table-container" style={{ marginBottom: '1.5rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>No</th>
                  <th>Nama Kategori</th>
                  <th>Tipe Arus Kas</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {financeCategories.map((c, idx) => (
                  <tr key={c.id}>
                    <td>{idx + 1}</td>
                    <td>
                      {editFinanceId === c.id ? 
                        <input type="text" className="form-control" style={{ padding: '0.3rem' }} value={editFinanceForm.name} onChange={e => setEditFinanceForm({...editFinanceForm, name: e.target.value})} /> 
                        : <span style={{ fontWeight: 500 }}>{c.name}</span>}
                    </td>
                    <td>
                      {editFinanceId === c.id ? (
                        <select className="form-control" style={{ padding: '0.3rem' }} value={editFinanceForm.type} onChange={e => setEditFinanceForm({...editFinanceForm, type: e.target.value})}>
                          <option value="Pengeluaran">Pengeluaran</option>
                          <option value="Pemasukan">Pemasukan</option>
                        </select>
                      ) : (
                        <span style={{ color: c.type === 'Pemasukan' ? '#34d399' : '#f87171', fontWeight: 600 }}>
                          {c.type}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {editFinanceId === c.id ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button className="btn" onClick={() => saveEditFinance(c.id)} style={{ padding: '0.4rem', color: '#34d399', background: 'transparent' }} title="Simpan"><Check size={16} /></button>
                          <button className="btn" onClick={() => setEditFinanceId(null)} style={{ padding: '0.4rem', color: 'var(--text-muted)', background: 'transparent' }} title="Batal"><X size={16} /></button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button className="btn" onClick={() => startEditFinance(c)} style={{ padding: '0.4rem', color: '#60a5fa', background: 'transparent' }} title="Edit"><Edit2 size={16} /></button>
                          <button className="btn" onClick={() => deleteFinanceCategory(c.id)} style={{ padding: '0.4rem', color: '#ef4444', background: 'transparent' }} title="Hapus"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: 'var(--surface-dark)', padding: '1rem', borderRadius: '0.5rem', border: '1px dashed var(--border-glass)' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Kategori Finance Baru</label>
              <input type="text" className="form-control" placeholder="Cth: Biaya Makan Siang..." value={newFinance.name} onChange={(e) => setNewFinance({...newFinance, name: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Tipe Arus Kas</label>
              <select className="form-control" value={newFinance.type} onChange={(e) => setNewFinance({...newFinance, type: e.target.value})}>
                <option value="Pengeluaran">Pengeluaran</option>
                <option value="Pemasukan">Pemasukan</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={addFinanceCategory} style={{ padding: '0.6rem 1.5rem', height: '42px' }}>
              <Plus size={18} /> Tambah
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Setting;
