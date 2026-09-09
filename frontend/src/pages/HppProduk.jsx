import React, { useState, useEffect, useCallback } from 'react';
import Loader from '../components/Loader';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Edit2, Check, X, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { confirmDelete, showAlert } from '../utils/swal';

const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === '') return 'Rp.0';
  return 'Rp.' + Number(number).toLocaleString('id-ID');
};

const formatPercent = (decimal) => {
  if (!isFinite(decimal) || isNaN(decimal)) return '0.00%';
  return (decimal * 100).toFixed(2) + '%';
};

const CustomSelect = ({ value, placeholder, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = React.useRef(null);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0, width: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      let topPos = rect.bottom + 4;
      let maxH = 300;
      
      if (spaceBelow < 250 && spaceAbove > spaceBelow) {
        maxH = Math.min(300, spaceAbove - 10);
        topPos = rect.top - 4 - maxH;
      } else {
        maxH = Math.min(300, spaceBelow - 10);
      }

      setMenuCoords({
        top: topPos,
        left: rect.left,
        width: rect.width,
        maxHeight: maxH
      });
      setSearchQuery(''); // Reset search on open
    }
    setIsOpen(!isOpen);
  };

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div 
        ref={triggerRef}
        onClick={handleToggle}
        style={{ 
          display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between',
          padding: '0.75rem 1rem', background: 'transparent',
          cursor: 'pointer', fontSize: '0.9rem', color: value ? 'var(--text-main)' : 'var(--text-muted)'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedLabel}</span>
        <ChevronDown size={14} style={{ flexShrink: 0 }} />
      </div>

      {isOpen && createPortal(
        <div style={{ position: 'relative', zIndex: 9999 }}>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setIsOpen(false)} />
          <div style={{ 
            position: 'fixed', top: menuCoords.top, left: menuCoords.left, width: menuCoords.width,
            background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)',
            borderRadius: '0.5rem', padding: '0.5rem', zIndex: 50,
            maxHeight: `${menuCoords.maxHeight}px`, display: 'flex', flexDirection: 'column',
            boxShadow: '0 10px 25px -5px var(--overlay-darker)'
          }}>
            <div style={{ padding: '0.25rem 0.5rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '0.5rem' }}>
              <input
                type="text"
                autoFocus
                placeholder="Cari bahan baku..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '0.5rem', background: 'var(--input-bg)',
                  border: '1px solid var(--border-glass)', borderRadius: '0.25rem',
                  color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none'
                }}
              />
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filteredOptions.length > 0 ? filteredOptions.map(o => (
                <div 
                  key={o.value}
                  onClick={() => { onChange(o.value); setIsOpen(false); }}
                  style={{
                    padding: '0.6rem 1rem', cursor: 'pointer', borderRadius: '0.3rem',
                    background: o.value === value ? 'var(--primary)' : 'transparent',
                    color: o.value === value ? '#fff' : 'var(--text-main)',
                    transition: 'background 0.2s',
                    marginBottom: '0.1rem',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={e => { if (o.value !== value) e.target.style.background = 'var(--overlay-bg-hover)' }}
                  onMouseLeave={e => { if (o.value !== value) e.target.style.background = 'transparent' }}
                >
                  {o.label}
                </div>
              )) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Tidak ditemukan
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const QtyInput = ({ initialQty, onSave }) => {
  const [qty, setQty] = useState(initialQty);
  
  useEffect(() => { setQty(initialQty); }, [initialQty]);

  const handleBlur = () => {
    if (Number(qty) !== Number(initialQty)) {
      onSave(qty);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <input 
      type="number" 
      className="form-control" 
      style={{ width: '50px', padding: '0.2rem', textAlign: 'center', margin: '0 auto' }} 
      value={qty} 
      onChange={(e) => setQty(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
};

const HppProduk = ({ category }) => {
  const [packages, setPackages] = useState([]);
  const [bahanBaku, setBahanBaku] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgHarga, setNewPkgHarga] = useState('');
  const [editPkgId, setEditPkgId] = useState(null);
  const [editPkgForm, setEditPkgForm] = useState({ name: '', hargaJual: '' });

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [{ data: pkgData }, { data: bbData }] = await Promise.all([
      supabase.from('hpp_packages').select('*, hpp_package_items(*, hpp_bahan_baku(*))').eq('category', category).order('created_at', { ascending: true }),
      supabase.from('hpp_bahan_baku').select('*').eq('category', category).order('created_at', { ascending: true }),
    ]);

    if (pkgData) {
      const normalized = pkgData.map(pkg => ({
        ...pkg,
        items: (pkg.hpp_package_items || []).map(item => ({
          id: item.id,
          bahanBakuId: item.bahan_baku_id,
          qty: item.qty,
          bb: item.hpp_bahan_baku
        }))
      }));
      setPackages(normalized);
    }
    if (bbData) setBahanBaku(bbData);
    setLoading(false);
  }, [category]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const calculateSummary = (pkg) => {
    const totalHpp = pkg.items.reduce((sum, item) => {
      return sum + (item.bb ? Number(item.bb.price) * item.qty : 0);
    }, 0);
    const margin = pkg.hargaJual - totalHpp;
    const hppPersen = pkg.hargaJual > 0 ? totalHpp / pkg.hargaJual : 0;
    const marginPersen = pkg.hargaJual > 0 ? margin / pkg.hargaJual : 0;
    return { totalHpp, margin, hppPersen, marginPersen };
  };

  const handleAddPackage = async () => {
    if (!newPkgName || !newPkgHarga) return;
    await supabase.from('hpp_packages').insert([{
      category,
      name: newPkgName,
      hargaJual: Number(newPkgHarga),
    }]);
    setNewPkgName('');
    setNewPkgHarga('');
    fetchData(true);
  };

  const handleDeletePackage = async (id) => {
    if (await confirmDelete('Hapus paket ini beserta isinya?')) {
      await supabase.from('hpp_packages').delete().eq('id', id);
      fetchData(true);
    }
  };

  const saveEditPkg = async (id) => {
    try {
      const { error } = await supabase.from('hpp_packages').update({
        name: editPkgForm.name,
        hargaJual: Number(editPkgForm.hargaJual)
      }).eq('id', id);
      if (error) throw error;
      setEditPkgId(null);
      fetchData(true);
    } catch (err) {
      showAlert("Gagal menyimpan: " + err.message, 'error');
    }
  };

  const handleAddItem = async (pkgId, bahanBakuId) => {
    if (!bahanBakuId) return;
    await supabase.from('hpp_package_items').insert([{
      package_id: pkgId,
      bahan_baku_id: bahanBakuId,
      qty: 1,
    }]);
    fetchData(true);
  };

  const handleUpdateItemQty = async (itemId, newQty) => {
    await supabase.from('hpp_package_items').update({ qty: Number(newQty) }).eq('id', itemId);
    fetchData(true);
  };

  const handleDeleteItem = async (itemId) => {
    await supabase.from('hpp_package_items').delete().eq('id', itemId);
    fetchData(true);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('startsWith');
  const [variantFilter, setVariantFilter] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const getGroupName = (name) => {
    if (!name) return 'Lainnya';
    const lowerName = name.toLowerCase();
    if (lowerName.startsWith('intimate wedding')) return 'Intimate Wedding';
    if (lowerName.startsWith('prewedding') || lowerName.startsWith('prewed')) return 'Prewedding';
    if (lowerName.startsWith('wedding')) return 'Wedding';
    if (lowerName.startsWith('engagement') || lowerName.startsWith('lamaran')) return 'Engagement / Lamaran';
    if (lowerName.startsWith('siraman')) return 'Siraman';
    if (lowerName.startsWith('akad')) return 'Akad';
    if (lowerName.startsWith('resepsi')) return 'Resepsi';
    
    const firstWord = name.trim().split(' ')[0];
    return firstWord ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase() : 'Lainnya';
  };

  const filteredPackages = packages.filter(pkg => {
    // Filter by Variant first
    const pkgNameLower = pkg.name.toLowerCase();
    if (variantFilter === 'no_video' && !pkgNameLower.includes('-vidio') && !pkgNameLower.includes('- vidio')) {
      return false;
    }
    if (variantFilter === 'with_video' && !pkgNameLower.includes('+vidio') && !pkgNameLower.includes('+ vidio')) {
      return false;
    }

    // Filter by Search Term
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (filterType === 'startsWith') {
      return pkgNameLower.startsWith(term);
    }
    return pkgNameLower.includes(term);
  });

  const groupedPackages = filteredPackages.reduce((acc, pkg) => {
    const group = getGroupName(pkg.name);
    if (!acc[group]) acc[group] = [];
    acc[group].push(pkg);
    return acc;
  }, {});

  const isSearching = searchTerm.length > 0;

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">HPP Produk - {category}</h1>
          <p className="page-subtitle">Desain HPP dan penentuan Harga Jual Paket {category}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--surface-dark)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-glass)' }}>
          <select 
            className="form-control" 
            style={{ width: 'auto', border: 'none', background: 'transparent', padding: '0.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}
            value={variantFilter}
            onChange={(e) => setVariantFilter(e.target.value)}
          >
            <option value="all">Semua Varian</option>
            <option value="no_video">Tanpa Vidio (-Vidio)</option>
            <option value="with_video">Dengan Vidio (+Vidio)</option>
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
            placeholder="Cari nama paket/produk..." 
            style={{ border: 'none', background: 'transparent', width: '250px', outline: 'none' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Kalkulasi HPP Produk</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Menampilkan {filteredPackages.length} Paket</span>
        </div>

        <div className="table-container" style={{ marginBottom: '2rem', overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: '1000px', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th style={{ width: '200px' }}>Nama Paket</th>
                <th style={{ width: '200px' }}>Isi Paket</th>
                <th style={{ width: '60px', textAlign: 'center' }}>Qty</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Cost</th>
                <th style={{ width: '80px', textAlign: 'right' }}>Persen</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Total HPP</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Harga Jual</th>
                <th style={{ width: '80px', textAlign: 'right' }}>HPP %</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Margin</th>
                <th style={{ width: '80px', textAlign: 'right' }}>Margin %</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" style={{ padding: 0 }}><Loader text="Memuat data dari database..." /></td></tr>
              ) : Object.entries(groupedPackages).map(([groupName, pkgs]) => {
                const isExpanded = expandedGroups[groupName] || isSearching;
                
                return (
                  <React.Fragment key={groupName}>
                    {/* Accordion Header */}
                    <tr 
                      onClick={() => toggleGroup(groupName)} 
                      style={{ cursor: 'pointer', background: 'var(--surface-dark)', borderTop: '2px solid var(--border-glass)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--overlay-bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-dark)'}
                    >
                      <td colSpan="11" style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)', fontSize: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)', transition: 'transform 0.2s' }}>
                            {isExpanded ? <ChevronDown size={16} /> : <Plus size={16} />}
                          </span>
                          <span>{groupName}</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)', background: 'var(--overlay-bg)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                            {pkgs.length} Paket
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Accordion Body */}
                    {isExpanded && pkgs.map((pkg) => {
                      const summary = calculateSummary(pkg);
                      const rowCount = Math.max(pkg.items.length, 1);
                      return (
                        <React.Fragment key={pkg.id}>
                          <tr style={{ borderTop: '1px solid var(--border-glass)' }}>
                            <td rowSpan={rowCount + 1} style={{ verticalAlign: 'top', background: 'var(--overlay-dark)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {editPkgId === pkg.id ? (
                                  <>
                                    <input type="text" className="form-control" style={{ padding: '0.3rem' }} value={editPkgForm.name} onChange={e => setEditPkgForm({ ...editPkgForm, name: e.target.value })} />
                                    <input type="text" className="form-control" style={{ padding: '0.3rem' }} value={editPkgForm.hargaJual ? formatRupiah(editPkgForm.hargaJual) : ''} onChange={e => {
                                      const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                      setEditPkgForm({ ...editPkgForm, hargaJual: rawValue });
                                    }} />
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                      <button className="btn btn-primary" style={{ padding: '0.3rem', flex: 1 }} onClick={() => saveEditPkg(pkg.id)}><Check size={14} /></button>
                                      <button className="btn" style={{ padding: '0.3rem', flex: 1, background: 'var(--overlay-border)' }} onClick={() => setEditPkgId(null)}><X size={14} /></button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{pkg.name}</strong>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                      <button className="btn" onClick={() => { setEditPkgId(pkg.id); setEditPkgForm({ name: pkg.name, hargaJual: pkg.hargaJual }); }} style={{ padding: '0.3rem', color: 'var(--text-primary)', background: 'var(--overlay-light)' }}><Edit2 size={12} /> Edit</button>
                                      <button className="btn" onClick={() => handleDeletePackage(pkg.id)} style={{ padding: '0.3rem', color: 'var(--text-danger)', background: 'rgba(239, 68, 68, 0.1)' }}><Trash2 size={12} /> Hapus</button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>

                            {pkg.items.length > 0 ? (() => {
                              const item = pkg.items[0];
                              const cost = item.bb ? Number(item.bb.price) * item.qty : 0;
                              const persen = summary.totalHpp > 0 ? cost / summary.totalHpp : 0;
                              return (
                                <>
                                  <td>{item.bb ? item.bb.name : 'Unknown'}</td>
                                  <td style={{ textAlign: 'center' }}>
                                    <QtyInput initialQty={item.qty} onSave={(val) => handleUpdateItemQty(item.id, val)} />
                                  </td>
                                  <td style={{ textAlign: 'right' }}>{formatRupiah(cost)}</td>
                                  <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatPercent(persen)}</td>
                                </>
                              );
                            })() : (
                              <td colSpan="4" style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>Belum ada isi paket</td>
                            )}

                            <td rowSpan={rowCount + 1} style={{ verticalAlign: 'top', textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(summary.totalHpp)}</td>
                            <td rowSpan={rowCount + 1} style={{ verticalAlign: 'top', textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(pkg.hargaJual)}</td>
                            <td rowSpan={rowCount + 1} style={{ verticalAlign: 'top', textAlign: 'right', color: summary.hppPersen > 0.6 ? 'var(--text-danger)' : 'var(--text-success)' }}>{formatPercent(summary.hppPersen)}</td>
                            <td rowSpan={rowCount + 1} style={{ verticalAlign: 'top', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatRupiah(summary.margin)}</td>
                            <td rowSpan={rowCount + 1} style={{ verticalAlign: 'top', textAlign: 'right', color: summary.marginPersen < 0.4 ? 'var(--text-danger)' : 'var(--text-success)' }}>{formatPercent(summary.marginPersen)}</td>
                            {pkg.items.length > 0 ? (
                              <td style={{ textAlign: 'center' }}>
                                <button className="btn" onClick={() => handleDeleteItem(pkg.items[0].id)} style={{ padding: '0.3rem', color: 'var(--text-danger)', background: 'transparent' }}><X size={14} /></button>
                              </td>
                            ) : <td></td>}
                          </tr>

                          {pkg.items.slice(1).map(item => {
                            const cost = item.bb ? Number(item.bb.price) * item.qty : 0;
                            const persen = summary.totalHpp > 0 ? cost / summary.totalHpp : 0;
                            return (
                              <tr key={item.id}>
                                <td>{item.bb ? item.bb.name : 'Unknown'}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <QtyInput initialQty={item.qty} onSave={(val) => handleUpdateItemQty(item.id, val)} />
                                </td>
                                <td style={{ textAlign: 'right' }}>{formatRupiah(cost)}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatPercent(persen)}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <button className="btn" onClick={() => handleDeleteItem(item.id)} style={{ padding: '0.3rem', color: 'var(--text-danger)', background: 'transparent' }}><X size={14} /></button>
                                </td>
                              </tr>
                            );
                          })}

                          <tr style={{ background: 'var(--overlay-bg)' }}>
                            <td style={{ padding: 0, minWidth: '300px' }}>
                              <CustomSelect 
                                value=""
                                placeholder="+ Tambah Bahan Baku..."
                                options={bahanBaku.map(bb => ({ value: bb.id, label: `${bb.name} - ${formatRupiah(bb.price)}` }))}
                                onChange={(val) => handleAddItem(pkg.id, val)}
                              />
                            </td>
                            <td></td><td></td><td></td><td></td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              {!loading && packages.length === 0 && (
                <tr><td colSpan="11" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Belum ada HPP Produk. Buat paket baru di bawah.</td></tr>
              )}
              {!loading && packages.length > 0 && filteredPackages.length === 0 && (
                <tr><td colSpan="11" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada paket yang sesuai dengan pencarian Anda.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ background: 'var(--surface-dark)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px dashed var(--border-glass)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Buat Paket / Produk Baru</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Nama Paket</label>
              <input type="text" className="form-control" placeholder="Cth: Paket Wedding Silver" value={newPkgName} onChange={(e) => setNewPkgName(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Harga Jual Paket (Rp)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Rp.0"
                value={newPkgHarga ? formatRupiah(newPkgHarga) : ''}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/[^0-9]/g, '');
                  setNewPkgHarga(rawValue);
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleAddPackage} style={{ padding: '0.6rem 2rem' }}>
              <Plus size={18} /> Tambah Paket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HppProduk;
