import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { DEFAULT_FINANCE_CATEGORIES, getMasterData } from '../utils/masterData';

const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === '') return 'Rp.0';
  return 'Rp.' + Number(number).toLocaleString('id-ID');
};

const InputFinance = () => {
  const [financeCategories, setFinanceCategories] = useState([]);

  useEffect(() => {
    setFinanceCategories(getMasterData('financeCategories', DEFAULT_FINANCE_CATEGORIES));
  }, []);

  const [formData, setFormData] = useState({
    kategori_layanan: 'Wedding',
    tanggal: '',
    keterangan: '',
    kategori_transaksi: '',
    arus_kas: 'Pemasukan',
    jenis_transaksi: 'Transfer',
    nominal: ''
  });

  // Set default initial value once categories load
  useEffect(() => {
    if (financeCategories.length > 0 && !formData.kategori_transaksi) {
      setFormData(prev => ({
        ...prev,
        kategori_transaksi: financeCategories[0].name,
        arus_kas: financeCategories[0].type
      }));
    }
  }, [financeCategories]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleKategoriChange = (e) => {
    const selectedName = e.target.value;
    const cat = financeCategories.find(c => c.name === selectedName);
    setFormData({
      ...formData,
      kategori_transaksi: selectedName,
      arus_kas: cat ? cat.type : 'Pemasukan'
    });
  };

  const handleNominalChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setFormData({...formData, nominal: rawValue});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`Submitting Finance data:`, formData);
    alert('Data Finance Berhasil Disimpan!');
  };

  const isPemasukan = formData.arus_kas === 'Pemasukan';
  const selectStyle = {
    color: isPemasukan ? '#34d399' : '#f87171',
    fontWeight: 'bold'
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', marginBottom: '4rem' }}>
      <div className="page-header">
        <h1 className="page-title">Input Finance</h1>
        <p className="page-subtitle">Pencatatan kas dan arus keuangan Wedding atau Studio</p>
      </div>

      <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'left' }}>
        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label className="form-label">Kategori Layanan</label>
            <select 
              className="form-control" 
              name="kategori_layanan"
              value={formData.kategori_layanan}
              onChange={handleChange}
              required
            >
              <option value="Wedding">Wedding</option>
              <option value="Studio">Studio</option>
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input 
                type="date" 
                className="form-control" 
                name="tanggal"
                value={formData.tanggal}
                onChange={handleChange}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Jenis Transaksi</label>
              <select 
                className="form-control" 
                name="jenis_transaksi"
                value={formData.jenis_transaksi}
                onChange={handleChange}
                required
              >
                <option value="Transfer">Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Keterangan</label>
            <input 
              type="text" 
              className="form-control" 
              name="keterangan"
              placeholder="Contoh: Pembayaran DP Klien / Beli Properti..."
              value={formData.keterangan}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Kategori Transaksi</label>
              <select 
                className="form-control" 
                name="kategori_transaksi"
                value={formData.kategori_transaksi}
                onChange={handleKategoriChange}
                style={selectStyle}
                required
              >
                {financeCategories.map((cat, idx) => (
                  <option 
                    key={idx} 
                    value={cat.name} 
                    style={{ color: cat.type === 'Pemasukan' ? '#34d399' : '#f87171' }}
                  >
                    {cat.name} ({cat.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Nominal {formData.arus_kas}</label>
              <input 
                type="text" 
                className="form-control" 
                name="nominal"
                placeholder="Rp 0"
                value={formData.nominal ? formatRupiah(formData.nominal) : ''}
                onChange={handleNominalChange}
                style={{ 
                  borderColor: isPemasukan ? 'rgba(52, 211, 153, 0.5)' : 'rgba(248, 113, 113, 0.5)',
                  backgroundColor: isPemasukan ? 'rgba(52, 211, 153, 0.05)' : 'rgba(248, 113, 113, 0.05)'
                }}
                required 
              />
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={18} />
              Simpan Data Finance
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default InputFinance;
