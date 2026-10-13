import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Edit2, Check, X, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Loader from '../components/Loader';
import { confirmDelete, showAlert } from '../utils/swal';

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
  const [copyModal, setCopyModal] = useState({
    isOpen: false,
    item: null,
    packages: [],
    selectedIds: new Set(),
    originalIds: new Set(),
    isSaving: false
  });
  const [exceptionFilter, setExceptionFilter] = useState('none');
  const [startsWithFilter, setStartsWithFilter] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('startsWith');
  const [sortOrder, setSortOrder] = useState('A-Z');

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from('hpp_bahan_baku')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      showAlert('Error fetching data: ' + error.message, 'error');
    }

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
      fetchData(true);
    }
  };

  const handleDelete = async (id) => {
    if (await confirmDelete('Hapus bahan baku ini?')) {
      await supabase.from('hpp_bahan_baku').delete().eq('id', id);
      fetchData(true);
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
    fetchData(true);
  };

  const openCopyModal = async (item) => {
    setLoading(true);
    const { data: pkgs } = await supabase.from('hpp_packages').select('id, name').eq('category', category).order('name', { ascending: true });
    
    const { data: existingItems } = await supabase
      .from('hpp_package_items')
      .select('package_id')
      .eq('bahan_baku_id', item.id);
      
    const existingIds = new Set(existingItems?.map(e => e.package_id) || []);
    
    setCopyModal({
      isOpen: true,
      item,
      packages: pkgs || [],
      selectedIds: new Set(existingIds),
      originalIds: new Set(existingIds),
      isSaving: false
    });
    setLoading(false);
  };

  const handleTogglePackage = (pkgId) => {
    const nextIds = new Set(copyModal.selectedIds);
    if (nextIds.has(pkgId)) nextIds.delete(pkgId);
    else nextIds.add(pkgId);
    setCopyModal(prev => ({ ...prev, selectedIds: nextIds }));
  };



  const saveCopyModal = async () => {
    setCopyModal(prev => ({ ...prev, isSaving: true }));
    const toAdd = [];
    const toRemove = [];
    
    for (const id of copyModal.selectedIds) {
      if (!copyModal.originalIds.has(id)) {
        toAdd.push({ package_id: id, bahan_baku_id: copyModal.item.id, qty: 1 });
      }
    }
    for (const id of copyModal.originalIds) {
      if (!copyModal.selectedIds.has(id)) {
        toRemove.push(id);
      }
    }
    
    if (toAdd.length > 0) {
      await supabase.from('hpp_package_items').insert(toAdd);
    }
    if (toRemove.length > 0) {
      await supabase.from('hpp_package_items').delete().eq('bahan_baku_id', copyModal.item.id).in('package_id', toRemove);
    }
    
    showAlert('Berhasil memperbarui produk terkait!', 'success');
    setCopyModal({ isOpen: false, item: null, packages: [], selectedIds: new Set(), originalIds: new Set(), isSaving: false });
  };

  const filteredAndSortedBahanBaku = [...bahanBaku]
    .filter(item => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const lowerName = item.name.toLowerCase();
      if (filterType === 'startsWith') {
        return lowerName.startsWith(term);
      }
      return lowerName.includes(term);
    })
    .sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (sortOrder === 'A-Z') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

  const totalCost = filteredAndSortedBahanBaku.reduce((acc, curr) => acc + Number(curr.price), 0);

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Bahan Baku Utama - {category}</h1>
          <p className="page-subtitle">Kelola daftar komponen dasar HPP untuk divisi {category}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--surface-dark)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-glass)' }}>
          <select 
            className="form-control" 
            style={{ width: 'auto', border: 'none', background: 'transparent', padding: '0.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="A-Z">A - Z</option>
            <option value="Z-A">Z - A</option>
          </select>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-glass)' }}></div>
          <select 
            className="form-control" 
            style={{ width: 'auto', border: 'none', background: 'transparent', padding: '0.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="startsWith">Berawal dari kata...</option>
            <option value="contains">Mengandung kata...</option>
          </select>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-glass)' }}></div>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Cari bahan baku..." 
            style={{ border: 'none', background: 'transparent', width: '200px', outline: 'none' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>Master Data Bahan Baku</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Menampilkan {filteredAndSortedBahanBaku.length} Item</span>
        </div>

        <div className="table-container" style={{ marginBottom: '1.5rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>No</th>
                <th>Bahan Baku</th>
                <th style={{ width: '100px' }}>Unit</th>
                <th style={{ width: '200px' }}>Cost</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: 0 }}><Loader text="Memuat data dari database..." /></td></tr>
              ) : filteredAndSortedBahanBaku.map((item, idx) => (
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
                        <button className="btn" onClick={() => saveEdit(item.id)} style={{ padding: '0.4rem', color: 'var(--text-success)', background: 'transparent' }} title="Simpan"><Check size={16} /></button>
                        <button className="btn" onClick={() => setEditId(null)} style={{ padding: '0.4rem', color: 'var(--text-muted)', background: 'transparent' }} title="Batal"><X size={16} /></button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="btn" onClick={() => openCopyModal(item)} style={{ padding: '0.4rem', color: 'var(--text-success)', background: 'transparent' }} title="Copy ke Produk"><Copy size={16} /></button>
                        <button className="btn" onClick={() => startEdit(item)} style={{ padding: '0.4rem', color: 'var(--text-primary)', background: 'transparent' }} title="Edit"><Edit2 size={16} /></button>
                        <button className="btn" onClick={() => handleDelete(item.id)} style={{ padding: '0.4rem', color: 'var(--text-danger)', background: 'transparent' }} title="Hapus"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filteredAndSortedBahanBaku.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Tidak ada bahan baku yang sesuai.</td></tr>
              )}
            </tbody>
            {filteredAndSortedBahanBaku.length > 0 && (
              <tfoot>
                <tr style={{ background: 'var(--overlay-bg-hover)', fontWeight: 'bold' }}>
                  <td colSpan="3" style={{ textAlign: 'right' }}>Total Estimasi Cost:</td>
                  <td colSpan="2" style={{ color: 'var(--text-success)' }}>{formatRupiah(totalCost)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div style={{ background: 'var(--surface-dark)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px dashed var(--border-glass)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>Tambah Bahan Baku Baru</h3>
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

      {/* COPY MODAL */}
      {copyModal.isOpen && createPortal(
        (() => {
          const displayPackages = copyModal.packages.filter(p => {
            const lowerName = p.name.toLowerCase();
            if (exceptionFilter === 'min_vidio' && (lowerName.includes('-vidio') || lowerName.includes('- vidio'))) return false;
            if (exceptionFilter === 'plus_vidio' && (lowerName.includes('+vidio') || lowerName.includes('+ vidio'))) return false;
            if (startsWithFilter && !lowerName.startsWith(startsWithFilter.toLowerCase())) return false;
            return true;
          });
          const isAllDisplayedSelected = displayPackages.length > 0 && displayPackages.every(p => copyModal.selectedIds.has(p.id));

          return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setCopyModal(prev => ({ ...prev, isOpen: false }))}></div>
          <div className="glass-panel" style={{ position: 'relative', width: '90%', maxWidth: '800px', padding: '2rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Tambahkan "{copyModal.item?.name}" ke Produk</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Centang produk yang ingin Anda tambahkan bahan baku ini.</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input 
                    type="checkbox" 
                    checked={isAllDisplayedSelected}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setCopyModal(prev => {
                        const nextIds = new Set(prev.selectedIds);
                        if (checked) {
                          displayPackages.forEach(p => nextIds.add(p.id));
                        } else {
                          displayPackages.forEach(p => nextIds.delete(p.id));
                        }
                        return { ...prev, selectedIds: nextIds };
                      });
                    }}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                  Pilih Semua (Filter)
                </label>

                <div style={{ width: '1px', height: '20px', background: 'var(--border-glass)' }}></div>

                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Berawal dari kata..." 
                  style={{ width: '160px', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                  value={startsWithFilter}
                  onChange={(e) => setStartsWithFilter(e.target.value)}
                />

                <select 
                  className="form-control" 
                  style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                  value={exceptionFilter}
                  onChange={(e) => setExceptionFilter(e.target.value)}
                >
                  <option value="none">Tanpa Pengecualian</option>
                  <option value="min_vidio">Kecuali (-Vidio)</option>
                  <option value="plus_vidio">Kecuali (+Vidio)</option>
                </select>
              </div>

              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{copyModal.selectedIds.size} / {copyModal.packages.length} dipilih</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', paddingRight: '0.5rem', margin: '0 -0.5rem 1.5rem 0' }}>
              {displayPackages.map(pkg => (
                <label 
                  key={pkg.id} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
                    border: '1px solid', borderColor: copyModal.selectedIds.has(pkg.id) ? 'var(--primary)' : 'var(--border-glass)', 
                    borderRadius: '0.5rem', cursor: 'pointer',
                    background: copyModal.selectedIds.has(pkg.id) ? 'rgba(56, 189, 248, 0.05)' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={copyModal.selectedIds.has(pkg.id)}
                    onChange={() => handleTogglePackage(pkg.id)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: copyModal.selectedIds.has(pkg.id) ? 'var(--text-main)' : 'var(--text-muted)' }}>{pkg.name}</span>
                </label>
              ))}
              {displayPackages.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Tidak ada produk yang sesuai dengan filter.</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
              <button className="btn" onClick={() => setCopyModal(prev => ({ ...prev, isOpen: false }))} disabled={copyModal.isSaving}>Batal</button>
              <button className="btn btn-primary" onClick={saveCopyModal} disabled={copyModal.isSaving}>
                {copyModal.isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
          );
        })(),
        document.body
      )}
    </div>
  );
};

export default HppBahanBaku;
