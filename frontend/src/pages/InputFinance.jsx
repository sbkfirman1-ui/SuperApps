import React, { useState, useEffect, useRef } from 'react';
import { Save, ChevronDown, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getMasterData, DEFAULT_FINANCE_CATEGORIES } from '../utils/masterData';

const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === '') return 'Rp.0';
  return 'Rp.' + Number(number).toLocaleString('id-ID');
};

const SearchableSelect = ({ options, value, onChange, placeholder = "Pilih..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }} className="searchable-select">
      <div 
        className="form-control" 
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', minHeight: '42px' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={16} style={{ opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      
      {isOpen && (
        <div className="glass-panel" style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, 
          marginTop: '0.5rem', maxHeight: '300px', display: 'flex', flexDirection: 'column',
          boxShadow: '0 10px 25px -5px var(--overlay-darker), 0 8px 10px -6px var(--overlay-darker)', 
          background: '#16181d', /* Solid background for contrast */
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-sm)'
        }}>
          <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-glass)', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Cari kategori..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{ paddingLeft: '2.5rem', background: 'var(--input-bg)' }}
              autoFocus
            />
          </div>
          <div style={{ overflowY: 'auto', padding: '0.5rem 0' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada hasil</div>
            ) : (
              filteredOptions.map((opt, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    padding: '0.75rem 1rem', 
                    cursor: 'pointer',
                    background: value === opt.value ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    color: value === opt.value ? 'var(--primary)' : 'var(--text-main)',
                    borderBottom: '1px solid var(--overlay-bg)',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => {
                    onChange({ target: { name: 'kategori_transaksi', value: opt.value } });
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  onMouseEnter={(e) => {
                    if (value !== opt.value) e.currentTarget.style.background = 'var(--overlay-bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (value !== opt.value) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const InputFinance = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  const financeCategories = getMasterData('financeCategories', DEFAULT_FINANCE_CATEGORIES);

  const [formData, setFormData] = useState({
    kategori_layanan: 'Wedding',
    tanggal: '',
    keterangan: '',
    metode_pembayaran: 'Transfer',
    kategori_transaksi: financeCategories.length > 0 ? financeCategories[0].name : '',
    arus_kas: financeCategories.length > 0 ? financeCategories[0].type : 'Pengeluaran',
    nominal: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleJenisChange = (e) => {
    const newJenis = e.target.value;
    const filteredCats = financeCategories.filter(c => c.type === newJenis);
    setFormData({
      ...formData,
      arus_kas: newJenis,
      kategori_transaksi: filteredCats.length > 0 ? filteredCats[0].name : ''
    });
  };

  const handleKategoriChange = (e) => {
    setFormData({ ...formData, kategori_transaksi: e.target.value });
  };

  const handleNominalChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, nominal: rawValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.from('finance').insert([{
      category: formData.kategori_layanan,
      tanggal: formData.tanggal,
      jenis: formData.arus_kas,
      kategoriFinance: formData.kategori_transaksi,
      nominal: Number(formData.nominal) || 0,
      keterangan: `[${formData.metode_pembayaran}] ${formData.keterangan}`,
    }]);

    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: `Gagal menyimpan: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Data Finance Berhasil Disimpan!' });
      
      // Reset form but keep selected jenis
      const filteredCats = financeCategories.filter(c => c.type === formData.arus_kas);
      setFormData({
        kategori_layanan: formData.kategori_layanan,
        tanggal: '',
        keterangan: '',
        metode_pembayaran: 'Transfer',
        kategori_transaksi: filteredCats.length > 0 ? filteredCats[0].name : '',
        arus_kas: formData.arus_kas,
        nominal: ''
      });
    }
  };

  const isPemasukan = formData.arus_kas === 'Pemasukan';
  const filteredCategories = financeCategories
    .filter(c => c.type === formData.arus_kas)
    .sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);

  const categoryOptions = filteredCategories.map(cat => ({
    value: cat.name,
    label: `${cat.name} (${cat.group})`
  }));

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', marginBottom: '4rem' }}>
      <div className="page-header">
        <h1 className="page-title">Input Finance</h1>
        <p className="page-subtitle">Pencatatan kas dan arus keuangan Wedding atau Studio</p>
      </div>

      {message && (
        <div style={{
          padding: '1rem 1.5rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          background: message.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
          border: `1px solid ${message.type === 'success' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(248, 113, 113, 0.4)'}`,
          color: message.type === 'success' ? 'var(--text-success)' : 'var(--text-danger)',
          fontWeight: '600'
        }}>
          {message.text}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'left' }}>
        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label className="form-label">Kategori Layanan</label>
            <select className="form-control" name="kategori_layanan" value={formData.kategori_layanan} onChange={handleChange} required>
              <option value="Wedding">Wedding</option>
              <option value="Studio">Studio</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input type="date" className="form-control" name="tanggal" value={formData.tanggal} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Metode Pembayaran</label>
              <select className="form-control" name="metode_pembayaran" value={formData.metode_pembayaran} onChange={handleChange} required>
                <option value="Transfer">Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Jenis Transaksi</label>
              <select
                className="form-control"
                name="arus_kas"
                value={formData.arus_kas}
                onChange={handleJenisChange}
                style={{ color: isPemasukan ? 'var(--text-success)' : 'var(--text-danger)', fontWeight: 'bold' }}
                required
              >
                <option value="Pemasukan" style={{ color: 'var(--text-success)' }}>Pemasukan</option>
                <option value="Pengeluaran" style={{ color: 'var(--text-danger)' }}>Pengeluaran</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Kategori Transaksi</label>
              <SearchableSelect 
                options={categoryOptions}
                value={formData.kategori_transaksi}
                onChange={handleKategoriChange}
                placeholder="Pilih Kategori Transaksi..."
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Keterangan</label>
            <input type="text" className="form-control" name="keterangan" placeholder="Contoh: Pembayaran DP Klien / Beli Properti..." value={formData.keterangan} onChange={handleChange} required />
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

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={18} />
              {loading ? 'Menyimpan...' : 'Simpan Data Finance'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default InputFinance;
