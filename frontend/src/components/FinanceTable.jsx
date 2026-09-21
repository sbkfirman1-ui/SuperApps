import React, { useState } from 'react';
import { Download, Trash2, Edit2, Check, X } from 'lucide-react';
import { confirmDelete } from '../utils/swal';
import { getMasterData, DEFAULT_FINANCE_CATEGORIES } from '../utils/masterData';

const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === '') return 'Rp.0';
  return 'Rp.' + Number(number).toLocaleString('id-ID');
};

const FinanceTable = ({ category, data, onResetAll, onDeleteRow, onEditRow }) => {
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [tempPayment, setTempPayment] = useState('');

  const [activeStartDate, setActiveStartDate] = useState('');
  const [activeEndDate, setActiveEndDate] = useState('');
  const [activePayment, setActivePayment] = useState('');

  const financeCategories = getMasterData('financeCategories', DEFAULT_FINANCE_CATEGORIES);

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    tanggal: '',
    keterangan: '',
    kategori: 'Pemasukan',
    kategoriTransaksi: '',
    jenisPembayaran: 'Transfer',
    nominal: 0
  });

  const handleStartEdit = (row) => {
    setEditId(row.id);
    setEditForm({
      tanggal: row.tanggal,
      keterangan: row.keterangan,
      kategori: row.kategori,
      kategoriTransaksi: row.kategoriTransaksi,
      jenisPembayaran: row.jenisPembayaran,
      nominal: row.kategori === 'Pemasukan' ? row.pemasukan : row.pengeluaran
    });
  };

  const handleSaveEdit = async () => {
    if (onEditRow) {
      await onEditRow(editId, editForm);
    }
    setEditId(null);
  };

  const handleCancelEdit = () => {
    setEditId(null);
  };

  const handleApplyFilter = () => {
    setActiveStartDate(tempStartDate);
    setActiveEndDate(tempEndDate);
    setActivePayment(tempPayment);
  };

  const handleResetFilter = () => {
    setTempStartDate('');
    setTempEndDate('');
    setTempPayment('');
    setActiveStartDate('');
    setActiveEndDate('');
    setActivePayment('');
  };
  
  const handleResetAllData = async () => {
    if (await confirmDelete('Yakin ingin menghapus semua data? Aksi ini tidak dapat dibatalkan.')) {
      if (onResetAll) onResetAll();
    }
  };

  const filteredData = data.filter(row => {
    let matches = true;
    if (activeStartDate || activeEndDate) {
      const rowDate = new Date(row.tanggal);
      const start = activeStartDate ? new Date(activeStartDate) : new Date(-8640000000000000);
      const end = activeEndDate ? new Date(activeEndDate) : new Date(8640000000000000);
      if (rowDate < start || rowDate > end) matches = false;
    }
    if (activePayment && row.jenisPembayaran !== activePayment) {
      matches = false;
    }
    return matches;
  });

  const exportToCSV = () => {
    const headers = ["Tanggal", "Keterangan", "Arus Kas", "Kategori Transaksi", "Jenis Pembayaran", "Pemasukan", "Pengeluaran", "Saldo"];
    const csvRows = [headers.join(',')];
    
    filteredData.forEach((row) => {
      const values = [
        `"${row.tanggal}"`,
        `"${row.keterangan}"`,
        `"${row.kategori}"`,
        `"${row.kategoriTransaksi}"`,
        `"${row.jenisPembayaran}"`,
        row.pemasukan || 0,
        row.pengeluaran || 0,
        row.saldo || 0
      ];
      csvRows.push(values.join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Finance_${category}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <h1 className="page-title">INCOME / EXPENSE {category.toUpperCase()}</h1>
        <p className="page-subtitle">Tabel pencatatan arus kas keuangan divisi {category}</p>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            
            {/* LEFT SIDE: FILTER CONTROLS */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Dari Tanggal</label>
                <input type="date" className="form-control" style={{ padding: '0.5rem', width: '150px' }} value={tempStartDate} onChange={(e) => setTempStartDate(e.target.value)} />
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Sampai Tanggal</label>
                <input type="date" className="form-control" style={{ padding: '0.5rem', width: '150px' }} value={tempEndDate} onChange={(e) => setTempEndDate(e.target.value)} />
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Jenis Pembayaran</label>
                <select className="form-control" style={{ padding: '0.5rem', width: '150px' }} value={tempPayment} onChange={(e) => setTempPayment(e.target.value)}>
                  <option value="">Semua</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '0.2rem' }}>
                <button className="btn btn-primary" onClick={handleApplyFilter} style={{ padding: '0.5rem 1rem' }}>
                  Terapkan
                </button>
                <button className="btn" onClick={handleResetFilter} style={{ padding: '0.5rem 1rem', background: 'var(--overlay-border)', color: 'var(--text-main)' }}>
                  Reset
                </button>
              </div>
            </div>
            
            {/* RIGHT SIDE: ACTIONS */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', paddingBottom: '0.2rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem', marginRight: '0.5rem' }}>
                Total: {filteredData.length} Data
              </span>
              <button className="btn btn-primary" onClick={exportToCSV} style={{ padding: '0.5rem 1rem' }}>
                <Download size={16} /> Export
              </button>
              <button className="btn btn-danger" onClick={handleResetAllData} style={{ padding: '0.5rem 1rem', background: 'var(--text-danger)', color: 'white' }}>
                <Trash2 size={16} /> Reset Data
              </button>
            </div>
            
          </div>
        </div>
        
        <div className="table-container" style={{ overflowX: 'auto', flex: 1 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th>Arus Kas</th>
                <th>Kategori Transaksi</th>
                <th>Jenis Pembayaran</th>
                <th>Pemasukan</th>
                <th>Pengeluaran</th>
                <th>Saldo</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => {
                return (
                  <tr key={index}>
                    <td>
                      {editId === row.id ? (
                        <input type="date" className="form-control" style={{ padding: '0.3rem', width: '130px' }} value={editForm.tanggal} onChange={e => setEditForm({...editForm, tanggal: e.target.value})} />
                      ) : row.tanggal}
                    </td>
                    <td>
                      {editId === row.id ? (
                        <input type="text" className="form-control" style={{ padding: '0.3rem', minWidth: '150px' }} value={editForm.keterangan} onChange={e => setEditForm({...editForm, keterangan: e.target.value})} />
                      ) : row.keterangan}
                    </td>
                    <td>
                      {editId === row.id ? (
                        <select className="form-control" style={{ padding: '0.3rem' }} value={editForm.kategori} onChange={e => setEditForm({...editForm, kategori: e.target.value})}>
                          <option value="Pemasukan">Pemasukan</option>
                          <option value="Pengeluaran">Pengeluaran</option>
                        </select>
                      ) : (
                        <span style={{ 
                          color: row.kategori === 'Pemasukan' ? 'var(--text-success)' : 'var(--text-danger)',
                          fontWeight: 'bold',
                          padding: '0.25rem 0.5rem',
                          background: row.kategori === 'Pemasukan' ? 'var(--success-bg)' : 'var(--danger-bg)',
                          border: `1px solid ${row.kategori === 'Pemasukan' ? 'var(--success-border)' : 'var(--danger-border)'}`,
                          borderRadius: '999px',
                          fontSize: '0.8rem'
                        }}>
                          {row.kategori}
                        </span>
                      )}
                    </td>
                    <td>
                      {editId === row.id ? (
                        <select className="form-control" style={{ padding: '0.3rem', minWidth: '150px' }} value={editForm.kategoriTransaksi} onChange={e => setEditForm({...editForm, kategoriTransaksi: e.target.value})}>
                          <option value="">-- Pilih --</option>
                          {financeCategories
                            .filter(c => c.type === editForm.kategori)
                            .map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                      ) : (
                        <span style={{ color: 'var(--text-primary)' }}>{row.kategoriTransaksi}</span>
                      )}
                    </td>
                    <td>
                      {editId === row.id ? (
                        <select className="form-control" style={{ padding: '0.3rem' }} value={editForm.jenisPembayaran} onChange={e => setEditForm({...editForm, jenisPembayaran: e.target.value})}>
                          <option value="Transfer">Transfer</option>
                          <option value="Cash">Cash</option>
                        </select>
                      ) : row.jenisPembayaran}
                    </td>
                    {editId === row.id ? (
                      editForm.kategori === 'Pemasukan' ? (
                        <>
                          <td><input type="number" className="form-control" style={{ padding: '0.3rem', width: '120px' }} value={editForm.nominal} onChange={e => setEditForm({...editForm, nominal: e.target.value})} /></td>
                          <td>Rp.0</td>
                        </>
                      ) : (
                        <>
                          <td>Rp.0</td>
                          <td><input type="number" className="form-control" style={{ padding: '0.3rem', width: '120px' }} value={editForm.nominal} onChange={e => setEditForm({...editForm, nominal: e.target.value})} /></td>
                        </>
                      )
                    ) : (
                      <>
                        <td style={{ color: 'var(--text-success)' }}>{formatRupiah(row.pemasukan)}</td>
                        <td style={{ color: 'var(--text-danger)' }}>{formatRupiah(row.pengeluaran)}</td>
                      </>
                    )}
                    <td style={{ fontWeight: 'bold' }}>{formatRupiah(row.saldo)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {editId === row.id ? (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                          <button className="btn" onClick={handleSaveEdit} style={{ padding: '0.3rem', color: 'var(--text-success)', background: 'transparent' }} title="Simpan"><Check size={16} /></button>
                          <button className="btn" onClick={handleCancelEdit} style={{ padding: '0.3rem', color: 'var(--text-muted)', background: 'transparent' }} title="Batal"><X size={16} /></button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                          <button className="btn" onClick={() => handleStartEdit(row)} style={{ padding: '0.3rem', color: 'var(--text-primary)', background: 'transparent' }} title="Edit Data"><Edit2 size={16} /></button>
                          <button className="btn" onClick={async () => {
                            if (await confirmDelete('Yakin ingin menghapus data ini?')) {
                              if (onDeleteRow) onDeleteRow(row.id);
                            }
                          }} style={{ padding: '0.3rem', color: 'var(--text-danger)', background: 'transparent' }} title="Hapus Data">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceTable;
