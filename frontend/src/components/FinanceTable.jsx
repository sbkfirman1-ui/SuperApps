import React, { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { confirmDelete } from '../utils/swal';

const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === '') return 'Rp.0';
  return 'Rp.' + Number(number).toLocaleString('id-ID');
};

const FinanceTable = ({ category, data, onResetAll, onDeleteRow }) => {
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [tempPayment, setTempPayment] = useState('');

  const [activeStartDate, setActiveStartDate] = useState('');
  const [activeEndDate, setActiveEndDate] = useState('');
  const [activePayment, setActivePayment] = useState('');

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
    const headers = ["Tanggal", "Keterangan", "Kategori", "Jenis Pembayaran", "Pemasukan", "Pengeluaran", "Saldo"];
    const csvRows = [headers.join(',')];
    
    filteredData.forEach((row) => {
      const values = [
        `"${row.tanggal}"`,
        `"${row.keterangan}"`,
        `"${row.kategori}"`,
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
              <button className="btn btn-danger" onClick={handleResetAllData} style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white' }}>
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
                <th>Kategori</th>
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
                    <td>{row.tanggal}</td>
                    <td>{row.keterangan}</td>
                    <td>
                      <span style={{ 
                        color: row.kategori === 'Pemasukan' ? '#34d399' : '#f87171',
                        fontWeight: 'bold'
                      }}>
                        {row.kategori}
                      </span>
                    </td>
                    <td>{row.jenisPembayaran}</td>
                    <td style={{ color: '#34d399' }}>{formatRupiah(row.pemasukan)}</td>
                    <td style={{ color: '#f87171' }}>{formatRupiah(row.pengeluaran)}</td>
                    <td style={{ fontWeight: 'bold' }}>{formatRupiah(row.saldo)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn" onClick={async () => {
                        if (await confirmDelete('Yakin ingin menghapus data ini?')) {
                          if (onDeleteRow) onDeleteRow(row.id);
                        }
                      }} style={{ padding: '0.3rem', color: '#ef4444', background: 'transparent' }} title="Hapus Data">
                        <Trash2 size={16} />
                      </button>
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
