import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === '') return 'Rp.0';
  return 'Rp.' + Number(number).toLocaleString('id-ID');
};

const formatPercent = (decimal) => {
  if (!isFinite(decimal) || isNaN(decimal)) return '0.00%';
  return (decimal * 100).toFixed(2) + '%';
};

const HppProduk = ({ category }) => {
  const [packages, setPackages] = useState([]);
  const [bahanBaku, setBahanBaku] = useState([]);

  // Load data
  useEffect(() => {
    try {
      const savedPackages = localStorage.getItem(`hppPackages_${category}`);
      if (savedPackages) setPackages(JSON.parse(savedPackages));
      
      const savedBahanBaku = localStorage.getItem(`hppBahanBaku_${category}`);
      if (savedBahanBaku) setBahanBaku(JSON.parse(savedBahanBaku));
    } catch (e) {
      console.error(e);
    }
  }, [category]);

  // Save packages
  useEffect(() => {
    localStorage.setItem(`hppPackages_${category}`, JSON.stringify(packages));
  }, [packages, category]);

  // Calculate package summary
  const calculateSummary = (pkg) => {
    const totalHpp = pkg.items.reduce((sum, item) => {
      const bb = bahanBaku.find(b => b.id === item.bahanBakuId);
      return sum + (bb ? bb.price * item.qty : 0);
    }, 0);

    const margin = pkg.hargaJual - totalHpp;
    const hppPersen = pkg.hargaJual > 0 ? totalHpp / pkg.hargaJual : 0;
    const marginPersen = pkg.hargaJual > 0 ? margin / pkg.hargaJual : 0;

    return { totalHpp, margin, hppPersen, marginPersen };
  };

  // Add new package
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgHarga, setNewPkgHarga] = useState('');

  const handleAddPackage = () => {
    if (!newPkgName || !newPkgHarga) return;
    setPackages([
      ...packages,
      {
        id: Date.now(),
        name: newPkgName,
        hargaJual: Number(newPkgHarga),
        isActive: true,
        items: []
      }
    ]);
    setNewPkgName('');
    setNewPkgHarga('');
  };

  const handleDeletePackage = (id) => {
    if (window.confirm('Hapus paket ini beserta isinya?')) {
      setPackages(packages.filter(p => p.id !== id));
    }
  };

  // Package Edit
  const [editPkgId, setEditPkgId] = useState(null);
  const [editPkgForm, setEditPkgForm] = useState({ name: '', hargaJual: '' });
  
  const startEditPkg = (pkg) => {
    setEditPkgId(pkg.id);
    setEditPkgForm({ name: pkg.name, hargaJual: pkg.hargaJual });
  };
  const saveEditPkg = (id) => {
    setPackages(packages.map(p => p.id === id ? { ...p, name: editPkgForm.name, hargaJual: Number(editPkgForm.hargaJual) } : p));
    setEditPkgId(null);
  };

  // Add Item to Package
  const handleAddItem = (pkgId, bahanBakuId) => {
    if (!bahanBakuId) return;
    setPackages(packages.map(pkg => {
      if (pkg.id === pkgId) {
        return {
          ...pkg,
          items: [...pkg.items, { id: Date.now(), bahanBakuId: Number(bahanBakuId), qty: 1 }]
        };
      }
      return pkg;
    }));
  };

  // Update Item Qty
  const handleUpdateItemQty = (pkgId, itemId, newQty) => {
    setPackages(packages.map(pkg => {
      if (pkg.id === pkgId) {
        return {
          ...pkg,
          items: pkg.items.map(item => item.id === itemId ? { ...item, qty: Number(newQty) } : item)
        };
      }
      return pkg;
    }));
  };

  // Delete Item from Package
  const handleDeleteItem = (pkgId, itemId) => {
    setPackages(packages.map(pkg => {
      if (pkg.id === pkgId) {
        return { ...pkg, items: pkg.items.filter(i => i.id !== itemId) };
      }
      return pkg;
    }));
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="page-header">
        <h1 className="page-title">HPP Produk - {category}</h1>
        <p className="page-subtitle">Desain HPP dan penentuan Harga Jual Paket {category}</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Kalkulasi HPP Produk</h2>
        
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
              {packages.map((pkg) => {
                const summary = calculateSummary(pkg);
                const rowCount = Math.max(pkg.items.length, 1);
                
                return (
                  <React.Fragment key={pkg.id}>
                    {/* Render first row which contains the rowSpan cells */}
                    <tr style={{ borderTop: '2px solid var(--border-glass)' }}>
                      <td rowSpan={rowCount + 1} style={{ verticalAlign: 'top', background: 'rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {editPkgId === pkg.id ? (
                            <>
                              <input type="text" className="form-control" style={{ padding: '0.3rem' }} value={editPkgForm.name} onChange={e => setEditPkgForm({...editPkgForm, name: e.target.value})} />
                              <input type="text" className="form-control" style={{ padding: '0.3rem' }} value={editPkgForm.hargaJual ? formatRupiah(editPkgForm.hargaJual) : ''} onChange={e => {
                                const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                setEditPkgForm({...editPkgForm, hargaJual: rawValue});
                              }} />
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button className="btn btn-primary" style={{ padding: '0.3rem', flex: 1 }} onClick={() => saveEditPkg(pkg.id)}><Check size={14} /></button>
                                <button className="btn" style={{ padding: '0.3rem', flex: 1, background: 'rgba(255,255,255,0.1)' }} onClick={() => setEditPkgId(null)}><X size={14} /></button>
                              </div>
                            </>
                          ) : (
                            <>
                              <strong style={{ fontSize: '1rem', color: '#60a5fa' }}>{pkg.name}</strong>
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button className="btn" onClick={() => startEditPkg(pkg)} style={{ padding: '0.3rem', color: '#60a5fa', background: 'rgba(96, 165, 250, 0.1)' }} title="Edit Paket"><Edit2 size={12} /> Edit</button>
                                <button className="btn" onClick={() => handleDeletePackage(pkg.id)} style={{ padding: '0.3rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }} title="Hapus Paket"><Trash2 size={12} /> Hapus</button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {pkg.items.length > 0 ? (
                        <>
                          {/* Item 0 */}
                          {(() => {
                            const item = pkg.items[0];
                            const bb = bahanBaku.find(b => b.id === item.bahanBakuId);
                            const cost = bb ? bb.price * item.qty : 0;
                            const persen = summary.totalHpp > 0 ? cost / summary.totalHpp : 0;
                            return (
                              <>
                                <td>{bb ? bb.name : 'Unknown'}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <input type="number" className="form-control" style={{ width: '50px', padding: '0.2rem', textAlign: 'center', margin: '0 auto' }} value={item.qty} onChange={(e) => handleUpdateItemQty(pkg.id, item.id, e.target.value)} />
                                </td>
                                <td style={{ textAlign: 'right' }}>{formatRupiah(cost)}</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatPercent(persen)}</td>
                              </>
                            );
                          })()}
                        </>
                      ) : (
                        <>
                          <td colSpan="4" style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>Belum ada isi paket</td>
                        </>
                      )}

                      <td rowSpan={rowCount + 1} style={{ verticalAlign: 'top', textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(summary.totalHpp)}</td>
                      <td rowSpan={rowCount + 1} style={{ verticalAlign: 'top', textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(pkg.hargaJual)}</td>
                      <td rowSpan={rowCount + 1} style={{ verticalAlign: 'top', textAlign: 'right', color: summary.hppPersen > 0.6 ? '#f87171' : '#34d399' }}>{formatPercent(summary.hppPersen)}</td>
                      <td rowSpan={rowCount + 1} style={{ verticalAlign: 'top', textAlign: 'right', fontWeight: 'bold', color: '#60a5fa' }}>{formatRupiah(summary.margin)}</td>
                      <td rowSpan={rowCount + 1} style={{ verticalAlign: 'top', textAlign: 'right', color: summary.marginPersen < 0.4 ? '#f87171' : '#34d399' }}>{formatPercent(summary.marginPersen)}</td>
                      
                      {pkg.items.length > 0 ? (
                        <td style={{ textAlign: 'center' }}>
                           <button className="btn" onClick={() => handleDeleteItem(pkg.id, pkg.items[0].id)} style={{ padding: '0.3rem', color: '#ef4444', background: 'transparent' }}><X size={14} /></button>
                        </td>
                      ) : (
                        <td></td>
                      )}
                    </tr>

                    {/* Render remaining items */}
                    {pkg.items.slice(1).map(item => {
                      const bb = bahanBaku.find(b => b.id === item.bahanBakuId);
                      const cost = bb ? bb.price * item.qty : 0;
                      const persen = summary.totalHpp > 0 ? cost / summary.totalHpp : 0;
                      return (
                        <tr key={item.id}>
                          <td>{bb ? bb.name : 'Unknown'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <input type="number" className="form-control" style={{ width: '50px', padding: '0.2rem', textAlign: 'center', margin: '0 auto' }} value={item.qty} onChange={(e) => handleUpdateItemQty(pkg.id, item.id, e.target.value)} />
                          </td>
                          <td style={{ textAlign: 'right' }}>{formatRupiah(cost)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatPercent(persen)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn" onClick={() => handleDeleteItem(pkg.id, item.id)} style={{ padding: '0.3rem', color: '#ef4444', background: 'transparent' }}><X size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Render Add Item Row for this package */}
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: 0 }}>
                        <select 
                          className="form-control" 
                          style={{ border: 'none', background: 'transparent', width: '100%', height: '100%', padding: '0.5rem', outline: 'none' }} 
                          value="" 
                          onChange={(e) => handleAddItem(pkg.id, e.target.value)}
                        >
                          <option value="" disabled>+ Tambah Bahan Baku...</option>
                          {bahanBaku.map(bb => (
                            <option key={bb.id} value={bb.id}>{bb.name} - {formatRupiah(bb.price)}</option>
                          ))}
                        </select>
                      </td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  </React.Fragment>
                );
              })}

              {packages.length === 0 && (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Belum ada HPP Produk. Buat paket baru di bawah.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add New Package Form */}
        <div style={{ background: 'var(--surface-dark)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px dashed var(--border-glass)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1.25rem', color: '#60a5fa' }}>Buat Paket / Produk Baru</h3>
          
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
