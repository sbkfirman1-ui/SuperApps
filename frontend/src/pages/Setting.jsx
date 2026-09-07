import React, { useState, useEffect } from 'react';
import Loader from '../components/Loader';
import { Plus, Trash2, Edit2, Save, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  DEFAULT_FINANCE_CATEGORIES, 
  getMasterData, 
  setMasterData 
} from '../utils/masterData';

const Setting = () => {
  const [financeCategories, setFinanceCategories] = useState(() => getMasterData('financeCategories', DEFAULT_FINANCE_CATEGORIES));
  useEffect(() => { setMasterData('financeCategories', financeCategories); }, [financeCategories]);

  // Theme state
  const [theme, setTheme] = useState(() => getMasterData('app_theme', 'dark'));

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    setMasterData('app_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Form states for adding new items
  const [newFinance, setNewFinance] = useState({ name: '', type: 'Pengeluaran', group: 'Beban Operasional' });

  // Filter & Sort states
  const [financeSort, setFinanceSort] = useState('asc'); // 'asc' or 'desc'
  const [financeFilter, setFinanceFilter] = useState('Semua'); // 'Semua', 'Pemasukan', 'Pengeluaran'

  // Edit states
  const [editFinanceId, setEditFinanceId] = useState(null);
  const [editFinanceForm, setEditFinanceForm] = useState({ name: '', type: '', group: '' });

  // Handle Finance Categories
  const addFinanceCategory = () => {
    if (!newFinance.name) return;
    setFinanceCategories([...financeCategories, { id: Date.now(), name: newFinance.name, type: newFinance.type, group: newFinance.group }]);
    setNewFinance({ name: '', type: 'Pengeluaran', group: 'Beban Operasional' });
  };
  const deleteFinanceCategory = (id) => { setFinanceCategories(financeCategories.filter(c => c.id !== id)); };
  const startEditFinance = (c) => { setEditFinanceId(c.id); setEditFinanceForm({ name: c.name, type: c.type, group: c.group || 'Beban Operasional' }); };
  const saveEditFinance = (id) => {
    setFinanceCategories(financeCategories.map(c => c.id === id ? { ...c, name: editFinanceForm.name, type: editFinanceForm.type, group: editFinanceForm.group } : c));
    setEditFinanceId(null);
  };

  // Price Book states
  const [packages, setPackages] = useState([]);
  const [hiddenPackages, setHiddenPackages] = useState(() => getMasterData('hiddenPackages', []));
  const [loadingPackages, setLoadingPackages] = useState(true);

  useEffect(() => { setMasterData('hiddenPackages', hiddenPackages); }, [hiddenPackages]);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoadingPackages(true);
      const { data } = await supabase.from('hpp_packages').select('*').order('created_at', { ascending: true });
      if (data) setPackages(data);
      setLoadingPackages(false);
    };
    fetchPackages();
  }, []);

  const toggleHidePackage = (pkgId) => {
    setHiddenPackages(prev => 
      prev.includes(pkgId) ? prev.filter(id => id !== pkgId) : [...prev, pkgId]
    );
  };

  const weddingPackages = packages.filter(p => p.category === 'Wedding');
  const studioPackages = packages.filter(p => p.category === 'Studio');

  const renderPriceBookTable = (title, data) => (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-main)' }}>{title}</h2>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama Paket</th>
              <th style={{ textAlign: 'right' }}>Harga Jual</th>
              <th style={{ textAlign: 'center', width: '120px' }}>Status</th>
              <th style={{ textAlign: 'center', width: '120px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loadingPackages ? (
              <tr><td colSpan="4" style={{ padding: 0 }}><Loader text="Memuat data..." /></td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada paket</td></tr>
            ) : data.map(pkg => {
              const isHidden = hiddenPackages.includes(pkg.id);
              return (
                <tr key={pkg.id} style={{ opacity: isHidden ? 0.6 : 1 }}>
                  <td style={{ fontWeight: 500, color: isHidden ? 'var(--text-muted)' : '#60a5fa' }}>{pkg.name}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Rp.{Number(pkg.hargaJual).toLocaleString('id-ID')}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${isHidden ? 'bg-danger' : 'bg-success'}`}>
                      {isHidden ? 'Disembunyikan' : 'Aktif'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn" 
                      onClick={() => toggleHidePackage(pkg.id)}
                      style={{ 
                        padding: '0.4rem 0.8rem', 
                        fontSize: '0.85rem',
                        background: isHidden ? 'rgba(52, 211, 153, 0.15)' : 'var(--danger-bg)',
                        color: isHidden ? '#34d399' : '#f87171'
                      }}
                    >
                      {isHidden ? 'Tampilkan' : 'Sembunyikan'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
        * Paket yang disembunyikan tidak akan muncul sebagai pilihan di halaman Input Transaksi.
      </p>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="page-header">
        <h1 className="page-title">Master Data Settings</h1>
        <p className="page-subtitle">Kelola daftar kategori keuangan aplikasi dan visibilitas Price Book</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* SECTION: PREFERENSI TEMA */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Preferensi Tampilan</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className={`btn ${theme === 'dark' ? 'btn-primary' : ''}`}
              onClick={() => toggleTheme('dark')}
              style={{ padding: '0.8rem 2rem', background: theme === 'dark' ? 'var(--primary)' : 'var(--overlay-bg)', color: theme === 'dark' ? '#fff' : 'var(--text-main)' }}
            >
              Mode Gelap
            </button>
            <button 
              className={`btn ${theme === 'light' ? 'btn-primary' : ''}`}
              onClick={() => toggleTheme('light')}
              style={{ padding: '0.8rem 2rem', background: theme === 'light' ? 'var(--primary)' : 'var(--overlay-bg)', color: theme === 'light' ? '#fff' : 'var(--text-main)' }}
            >
              Mode Terang
            </button>
          </div>
        </div>
        
        {/* SECTION: PRICE BOOK WEDDING */}
        {renderPriceBookTable('Price Book - Wedding', weddingPackages)}

        {/* SECTION: PRICE BOOK STUDIO */}
        {renderPriceBookTable('Price Book - Studio', studioPackages)}

        {/* SECTION: FINANCE CATEGORIES */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>Kategori Transaksi Finance</h2>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select className="form-control" style={{ padding: '0.4rem 2rem 0.4rem 0.5rem', fontSize: '0.9rem' }} value={financeFilter} onChange={e => setFinanceFilter(e.target.value)}>
                  <option value="Semua">Semua Tipe (Filter)</option>
                  <option value="Pemasukan">Pemasukan</option>
                  <option value="Pengeluaran">Pengeluaran</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select className="form-control" style={{ padding: '0.4rem 2rem 0.4rem 0.5rem', fontSize: '0.9rem' }} value={financeSort} onChange={e => setFinanceSort(e.target.value)}>
                  <option value="asc">A - Z (Sort)</option>
                  <option value="desc">Z - A (Sort)</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="table-container" style={{ marginBottom: '1.5rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>No</th>
                  <th>Nama Kategori</th>
                  <th>Tipe Arus Kas</th>
                  <th>Grup Laporan PNL</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {financeCategories
                  .filter(c => financeFilter === 'Semua' || c.type === financeFilter)
                  .sort((a, b) => {
                    const nameA = a.name.toLowerCase();
                    const nameB = b.name.toLowerCase();
                    if (financeSort === 'asc') return nameA < nameB ? -1 : 1;
                    if (financeSort === 'desc') return nameA > nameB ? -1 : 1;
                    return 0;
                  })
                  .map((c, idx) => (
                  <tr key={c.id}>
                    <td>{idx + 1}</td>
                    <td>
                      {editFinanceId === c.id ? 
                        <input type="text" className="form-control" style={{ padding: '0.3rem' }} value={editFinanceForm.name} onChange={e => setEditFinanceForm({...editFinanceForm, name: e.target.value})} /> 
                        : <span style={{ fontWeight: 500 }}>{c.name}</span>}
                    </td>
                    <td>
                      {editFinanceId === c.id ? (
                        <select className="form-control" style={{ padding: '0.3rem' }} value={editFinanceForm.type} onChange={e => setEditFinanceForm({...editFinanceForm, type: e.target.value, group: e.target.value === 'Pemasukan' ? 'Pendapatan' : 'Beban Operasional'})}>
                          <option value="Pemasukan">Pemasukan</option>
                          <option value="Pengeluaran">Pengeluaran</option>
                        </select>
                      ) : (
                        <span style={{ color: c.type === 'Pemasukan' ? '#34d399' : '#f87171', fontWeight: 600 }}>
                          {c.type}
                        </span>
                      )}
                    </td>
                    <td>
                      {editFinanceId === c.id ? (
                        <select className="form-control" style={{ padding: '0.3rem' }} value={editFinanceForm.group} onChange={e => setEditFinanceForm({...editFinanceForm, group: e.target.value})}>
                          {editFinanceForm.type === 'Pemasukan' ? (
                            <option value="Pendapatan">Pendapatan</option>
                          ) : (
                            <>
                              <option value="Beban Operasional">Beban Operasional</option>
                              <option value="Beban Tetap">Beban Tetap</option>
                            </>
                          )}
                        </select>
                      ) : (
                        <span style={{ color: c.type === 'Pemasukan' ? '#34d399' : '#f87171', fontWeight: 600 }}>
                          {c.group || c.type}
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
              <select className="form-control" value={newFinance.type} onChange={(e) => setNewFinance({...newFinance, type: e.target.value, group: e.target.value === 'Pemasukan' ? 'Pendapatan' : 'Beban Operasional'})}>
                <option value="Pengeluaran">Pengeluaran</option>
                <option value="Pemasukan">Pemasukan</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Grup PNL</label>
              <select className="form-control" value={newFinance.group} onChange={(e) => setNewFinance({...newFinance, group: e.target.value})}>
                {newFinance.type === 'Pemasukan' ? (
                  <option value="Pendapatan">Pendapatan</option>
                ) : (
                  <>
                    <option value="Beban Operasional">Beban Operasional</option>
                    <option value="Beban Tetap">Beban Tetap</option>
                  </>
                )}
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
