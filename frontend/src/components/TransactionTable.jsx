import React, { useState } from 'react';
import { Download, Trash2, Edit2, Check, X } from 'lucide-react';
import { confirmDelete } from '../utils/swal';

const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === '') return 'Rp.0';
  return 'Rp.' + Number(number).toLocaleString('id-ID');
};

const TransactionTable = ({ category, data, onResetAll, onUpdateRow, onDeleteRow }) => {
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [tempProduct, setTempProduct] = useState('');
  
  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem(`tx_sort_${category}`) || 'newest');

  const [activeStartDate, setActiveStartDate] = useState('');
  const [activeEndDate, setActiveEndDate] = useState('');
  const [activeProduct, setActiveProduct] = useState('');

  const [editRowId, setEditRowId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const uniqueProducts = [...new Set(data.map(item => item.produk))];

  const handleApplyFilter = () => {
    setActiveStartDate(tempStartDate);
    setActiveEndDate(tempEndDate);
    setActiveProduct(tempProduct);
  };

  const handleResetFilter = () => {
    setTempStartDate('');
    setTempEndDate('');
    setTempProduct('');
    setActiveStartDate('');
    setActiveEndDate('');
    setActiveProduct('');
  };
  
  const handleResetAllData = async () => {
    if (await confirmDelete('Yakin ingin menghapus semua data? Aksi ini tidak dapat dibatalkan.')) {
      if (onResetAll) onResetAll();
    }
  };

  const filteredData = data.filter(row => {
    let matches = true;
    if (activeStartDate || activeEndDate) {
      const rowDate = new Date(row.tglBooking);
      const start = activeStartDate ? new Date(activeStartDate) : new Date(-8640000000000000);
      const end = activeEndDate ? new Date(activeEndDate) : new Date(8640000000000000);
      if (rowDate < start || rowDate > end) matches = false;
    }
    if (activeProduct && row.produk !== activeProduct) {
      matches = false;
    }
    return matches;
  });

  const handleSortChange = (e) => {
    const val = e.target.value;
    setSortOrder(val);
    localStorage.setItem(`tx_sort_${category}`, val);
  };

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortOrder === 'az') {
      return new Date(a.tglHariH || 0) - new Date(b.tglHariH || 0);
    }
    if (sortOrder === 'za') {
      return new Date(b.tglHariH || 0) - new Date(a.tglHariH || 0);
    }
    return 0; // 'newest' relies on the original array order passed from parent
  });

  const exportToCSV = () => {
    const headers = ["No", "Nama Client", "Tanggal Booking", "Tanggal Hari H", "Vendor", "Produk", "Kategori", "Down Payment", "Harga Produk", "Selisih", "Catatan", "Status"];
    const csvRows = [headers.join(',')];
    
    sortedData.forEach((row, index) => {
      const selisih = row.harga - row.dp;
      const values = [
        index + 1,
        `"${row.client}"`,
        `"${row.tglBooking}"`,
        `"${row.tglHariH}"`,
        `"${row.vendor}"`,
        `"${row.produk}"`,
        `"${row.kategori}"`,
        row.dp,
        row.harga,
        selisih,
        `"${row.catatan}"`,
        `"${row.status}"`
      ];
      csvRows.push(values.join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_Transaksi_${category}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <h1 className="page-title">Data {category}</h1>
        <p className="page-subtitle">Tabel pencatatan transaksi untuk divisi {category}</p>
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
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Produk</label>
                <select className="form-control" style={{ padding: '0.5rem', width: '180px' }} value={tempProduct} onChange={(e) => setTempProduct(e.target.value)}>
                  <option value="">Semua Produk</option>
                  {uniqueProducts.map((prod, idx) => (
                    <option key={idx} value={prod}>{prod}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Urutkan</label>
                <select className="form-control" style={{ padding: '0.5rem', width: '130px' }} value={sortOrder} onChange={handleSortChange}>
                  <option value="newest">Terbaru</option>
                  <option value="az">Tgl Hari H (A-Z)</option>
                  <option value="za">Tgl Hari H (Z-A)</option>
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
                Total: {sortedData.length} Data
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
                <th>No</th>
                <th>Nama Client</th>
                <th>Tanggal Booking</th>
                <th>Tanggal Hari H</th>
                <th>Vendor</th>
                <th>Produk</th>
                <th>Kategori</th>
                <th>Down Payment</th>
                <th>Harga Produk</th>
                <th>Selisih</th>
                <th>Catatan</th>
                <th>Status</th>
                <th>Check 1</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, index) => {
                const selisih = row.harga - row.dp;
                const statusColor = row.status === 'LUNAS' ? 'bg-success' : (row.status === 'DP' ? 'bg-warning' : 'bg-danger');

                return (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                      {editRowId === row.id ? (
                        <input type="text" className="form-control" style={{ width: '130px', padding: '0.3rem' }} 
                          value={editForm.client || ''} 
                          onChange={e => setEditForm({...editForm, client: e.target.value})} 
                        />
                      ) : (
                        row.client
                      )}
                    </td>
                    <td>{row.tglBooking}</td>
                    <td>{row.tglHariH}</td>
                    <td>{row.vendor}</td>
                    <td><span className="badge badge-product">{row.produk}</span></td>
                    <td>{row.kategori}</td>
                    
                    {editRowId === row.id ? (
                      <>
                        <td>
                          <input type="text" className="form-control" style={{ width: '110px', padding: '0.3rem' }} 
                            value={editForm.dp ? formatRupiah(editForm.dp) : ''} 
                            onChange={e => setEditForm({...editForm, dp: e.target.value.replace(/[^0-9]/g, '')})} 
                          />
                        </td>
                        <td>
                          <input type="text" className="form-control" style={{ width: '110px', padding: '0.3rem' }} 
                            value={editForm.harga ? formatRupiah(editForm.harga) : ''} 
                            onChange={e => setEditForm({...editForm, harga: e.target.value.replace(/[^0-9]/g, '')})} 
                          />
                        </td>
                        <td>{formatRupiah(Math.max(0, Number(editForm.harga || 0) - Number(editForm.dp || 0)))}</td>
                        <td>
                          <input type="text" className="form-control" style={{ width: '150px', padding: '0.3rem' }} 
                            value={editForm.catatan} onChange={e => setEditForm({...editForm, catatan: e.target.value})} 
                          />
                        </td>
                        <td>
                          <span className={`status-badge ${Number(editForm.dp || 0) >= Number(editForm.harga || 0) ? 'bg-success' : (Number(editForm.dp || 0) === 0 ? 'bg-danger' : 'bg-warning')}`}>
                            {Number(editForm.dp || 0) >= Number(editForm.harga || 0) ? 'LUNAS' : (Number(editForm.dp || 0) === 0 ? 'BELUM LUNAS' : 'DP')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" defaultChecked={row.check1} className="custom-checkbox" disabled />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button className="btn" onClick={() => {
                              if (onUpdateRow) {
                                onUpdateRow(row.id, { clientName: editForm.client, dp: Number(editForm.dp), productPrice: Number(editForm.harga), catatan: editForm.catatan });
                                setEditRowId(null);
                              }
                            }} style={{ padding: '0.3rem', color: 'var(--text-success)', background: 'transparent' }}><Check size={16} /></button>
                            <button className="btn" onClick={() => setEditRowId(null)} style={{ padding: '0.3rem', color: 'var(--text-muted)', background: 'transparent' }}><X size={16} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{formatRupiah(row.dp)}</td>
                        <td>{formatRupiah(row.harga)}</td>
                        <td>{formatRupiah(selisih)}</td>
                        <td>{row.catatan}</td>
                        <td>
                          <span className={`status-badge ${statusColor}`}>
                            {row.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" defaultChecked={row.check1} className="custom-checkbox" />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button className="btn" onClick={() => {
                              setEditRowId(row.id);
                              setEditForm({ client: row.client, dp: row.dp, harga: row.harga, catatan: row.catatan || '' });
                            }} style={{ padding: '0.3rem', color: 'var(--text-primary)', background: 'transparent' }} title="Edit Data">
                              <Edit2 size={16} />
                            </button>
                            <button className="btn" onClick={async () => {
                              if (await confirmDelete('Yakin ingin menghapus transaksi ini?')) {
                                if (onDeleteRow) onDeleteRow(row.id);
                              }
                            }} style={{ padding: '0.3rem', color: 'var(--text-danger)', background: 'transparent' }} title="Hapus Data">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
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

export default TransactionTable;
