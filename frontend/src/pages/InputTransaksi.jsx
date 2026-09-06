import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { getMasterData } from '../utils/masterData';

const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === '') return 'Rp.0';
  return 'Rp.' + Number(number).toLocaleString('id-ID');
};

const InputTransaksi = () => {
  const [weddingProducts, setWeddingProducts] = useState([]);
  const [studioProducts, setStudioProducts] = useState([]);

  useEffect(() => {
    try {
      const savedWedding = localStorage.getItem('hppPackages_Wedding');
      setWeddingProducts(savedWedding ? JSON.parse(savedWedding) : []);
      
      const savedStudio = localStorage.getItem('hppPackages_Studio');
      setStudioProducts(savedStudio ? JSON.parse(savedStudio) : []);
    } catch (e) {
      console.error('Failed to load packages', e);
    }
  }, []);

  const [formData, setFormData] = useState({
    category: 'Wedding',
    clientName: '',
    bookingDate: '',
    dDayDate: '',
    vendorName: '',
    productId: '',
    productPrice: 0,
    dp: ''
  });

  const handleCategoryChange = (e) => {
    setFormData({
      ...formData,
      category: e.target.value,
      productId: '', // reset pilihan produk
      productPrice: 0
    });
  };

  const handleProductChange = (e) => {
    const selectedId = e.target.value;
    const activeProducts = formData.category === 'Wedding' ? weddingProducts : studioProducts;
    
    // Fallback comparison for string vs int id depending on how Date.now() is handled vs string ids
    const product = activeProducts.find(p => String(p.id) === String(selectedId));
    
    setFormData({
      ...formData,
      productId: selectedId,
      productPrice: product ? Number(product.hargaJual) : 0
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`Submitting data for ${formData.category}:`, formData);
    alert('Data Transaksi Berhasil Disimpan!');
  };

  const activeProducts = formData.category === 'Wedding' ? weddingProducts : studioProducts;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', marginBottom: '4rem' }}>
      <div className="page-header">
        <h1 className="page-title">Input Transaksi Baru</h1>
        <p className="page-subtitle">Pencatatan pesanan untuk klien Wedding atau Studio</p>
      </div>

      <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'left' }}>
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label className="form-label">Kategori Layanan</label>
            <select 
              className="form-control" 
              name="category"
              value={formData.category}
              onChange={handleCategoryChange}
              required
            >
              <option value="Wedding">Wedding</option>
              <option value="Studio">Studio</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Klien</label>
            <input 
              type="text" 
              className="form-control" 
              name="clientName"
              placeholder="Masukkan nama lengkap klien"
              value={formData.clientName}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tgl Booking</label>
              <input 
                type="date" 
                className="form-control" 
                name="bookingDate"
                value={formData.bookingDate}
                onChange={handleChange}
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Tgl Hari H</label>
              <input 
                type="date" 
                className="form-control" 
                name="dDayDate"
                value={formData.dDayDate}
                onChange={handleChange}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Vendor</label>
            <input 
              type="text" 
              className="form-control" 
              name="vendorName"
              placeholder="Contoh: Budi (Fotografer), Andi (Videografer)"
              value={formData.vendorName}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pilihan Produk</label>
              <select 
                className="form-control" 
                name="productId"
                value={formData.productId}
                onChange={handleProductChange}
                required
              >
                <option value="" disabled>-- Pilih Paket {formData.category} --</option>
                {activeProducts.filter(p => p.isActive !== false).map(prod => (
                  <option key={prod.id} value={prod.id}>{prod.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Harga Produk</label>
              <input 
                type="text" 
                className="form-control" 
                value={formatRupiah(formData.productPrice)}
                readOnly
                disabled
              />
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
                  setFormData({...formData, dp: rawValue});
                }}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Sisa Tagihan / Selisih</label>
              <input 
                type="text" 
                className="form-control" 
                value={formatRupiah(Math.max(0, (formData.productPrice || 0) - (Number(formData.dp) || 0)))}
                readOnly
                disabled
              />
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={18} />
              Simpan Transaksi
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default InputTransaksi;
