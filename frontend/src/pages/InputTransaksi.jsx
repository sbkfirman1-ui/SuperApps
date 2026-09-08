import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Save, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getMasterData } from '../utils/masterData';

const CustomSelect = ({ value, placeholder, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0, width: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
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
            maxHeight: '300px', display: 'flex', flexDirection: 'column',
            boxShadow: '0 10px 25px -5px var(--overlay-darker)'
          }}>
            <div style={{ padding: '0.25rem 0.5rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '0.5rem' }}>
              <input
                type="text"
                autoFocus
                placeholder="Cari paket produk..."
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

const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === '') return 'Rp.0';
  return 'Rp.' + Number(number).toLocaleString('id-ID');
};

const InputTransaksi = () => {
  const [weddingProducts, setWeddingProducts] = useState([]);
  const [studioProducts, setStudioProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      const { data, error } = await supabase
        .from('hpp_packages')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        const hiddenPackages = getMasterData('hiddenPackages', []);
        const visiblePackages = data.filter(p => !hiddenPackages.includes(p.id));
        
        setWeddingProducts(visiblePackages.filter(p => p.category === 'Wedding'));
        setStudioProducts(visiblePackages.filter(p => p.category === 'Studio'));
      }
    };
    fetchPackages();
  }, []);

  const [formData, setFormData] = useState({
    category: 'Wedding',
    clientName: '',
    bookingDate: '',
    dDayDate: '',
    vendorName: '',
    productId: '',
    productName: '',
    productPrice: 0,
    dp: '',
    catatan: ''
  });

  const handleCategoryChange = (e) => {
    setFormData({
      ...formData,
      category: e.target.value,
      productId: '',
      productName: '',
      productPrice: 0
    });
  };

  const handleProductChange = (selectedId) => {
    const activeProducts = formData.category === 'Wedding' ? weddingProducts : studioProducts;
    const product = activeProducts.find(p => String(p.id) === String(selectedId));

    setFormData({
      ...formData,
      productId: selectedId,
      productName: product ? product.name : '',
      productPrice: product ? Number(product.hargaJual) : 0
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const dpVal = Number(formData.dp) || 0;
    const price = Number(formData.productPrice) || 0;

    const { error } = await supabase.from('transactions').insert([{
      category: formData.category,
      clientName: formData.clientName,
      phone: formData.vendorName,
      productName: formData.productName,
      productPrice: price,
      dp: dpVal,
      bookingDate: formData.bookingDate || null,
      dDayDate: formData.dDayDate || null,
      catatan: formData.catatan || null
    }]);

    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: `Gagal menyimpan: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Data Transaksi Berhasil Disimpan!' });
      setFormData({
        category: formData.category,
        clientName: '',
        bookingDate: '',
        dDayDate: '',
        vendorName: '',
        productId: '',
        productName: '',
        productPrice: 0,
        dp: '',
        catatan: ''
      });
    }
  };

  const activeProducts = formData.category === 'Wedding' ? weddingProducts : studioProducts;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', marginBottom: '4rem' }}>
      <div className="page-header">
        <h1 className="page-title">Input Transaksi Baru</h1>
        <p className="page-subtitle">Pencatatan pesanan untuk klien Wedding atau Studio</p>
      </div>

      {message && (
        <div style={{
          padding: '1rem 1.5rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          background: message.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
          border: `1px solid ${message.type === 'success' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(248, 113, 113, 0.4)'}`,
          color: message.type === 'success' ? '#34d399' : '#f87171',
          fontWeight: '600'
        }}>
          {message.text}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'left' }}>
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label className="form-label">Kategori Layanan</label>
            <select className="form-control" name="category" value={formData.category} onChange={handleCategoryChange} required>
              <option value="Wedding">Wedding</option>
              <option value="Studio">Studio</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Klien</label>
            <input type="text" className="form-control" name="clientName" placeholder="Masukkan nama lengkap klien" value={formData.clientName} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tgl Booking</label>
              <input type="date" className="form-control" name="bookingDate" value={formData.bookingDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Tgl Hari H</label>
              <input type="date" className="form-control" name="dDayDate" value={formData.dDayDate} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Vendor</label>
            <input type="text" className="form-control" name="vendorName" placeholder="Contoh: Budi (Fotografer), Andi (Videografer)" value={formData.vendorName} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Pilihan Produk</label>
              <div className="form-control" style={{ padding: 0 }}>
                <CustomSelect 
                  value={formData.productId}
                  placeholder={`-- Pilih Paket ${formData.category} --`}
                  options={activeProducts.map(p => ({ value: p.id, label: p.name }))}
                  onChange={handleProductChange}
                />
              </div>
              {!formData.productId && (
                <input type="text" required style={{ opacity: 0, position: 'absolute', pointerEvents: 'none', top: '50%' }} value="" onChange={() => {}} />
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Harga Produk</label>
              <input type="text" className="form-control" value={formatRupiah(formData.productPrice)} readOnly disabled />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Down Payment (DP)</label>
              <input
                type="text"
                className="form-control"
                name="dp"
                placeholder="Rp 0"
                value={formData.dp ? formatRupiah(formData.dp) : ''}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, dp: rawValue });
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sisa Tagihan / Selisih</label>
              <input type="text" className="form-control" value={formatRupiah(Math.max(0, (formData.productPrice || 0) - (Number(formData.dp) || 0)))} readOnly disabled />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Catatan</label>
            <textarea 
              className="form-control" 
              name="catatan" 
              placeholder="Tambahkan catatan khusus terkait pesanan ini (Opsional)" 
              value={formData.catatan} 
              onChange={handleChange} 
              rows="3"
            />
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={18} />
              {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default InputTransaksi;
