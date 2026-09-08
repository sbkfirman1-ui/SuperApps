import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getMasterData } from '../utils/masterData';

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

  const handleProductChange = (e) => {
    const selectedId = e.target.value;
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
            <div className="form-group">
              <label className="form-label">Pilihan Produk</label>
              <select className="form-control" name="productId" value={formData.productId} onChange={handleProductChange} required>
                <option value="" disabled>-- Pilih Paket {formData.category} --</option>
                {activeProducts.map(prod => (
                  <option key={prod.id} value={prod.id}>{prod.name}</option>
                ))}
              </select>
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
