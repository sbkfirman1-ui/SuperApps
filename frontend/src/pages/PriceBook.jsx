import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === '') return 'Rp.0';
  return 'Rp.' + Number(number).toLocaleString('id-ID');
};

const formatPercent = (decimal) => {
  if (!isFinite(decimal) || isNaN(decimal)) return '0.00%';
  return (decimal * 100).toFixed(2) + '%';
};

const PriceBook = ({ category }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discounts, setDiscounts] = useState({}); // Store simulated discounts by package id

  const handleDiscountChange = (id, value) => {
    const val = Number(value);
    setDiscounts(prev => {
      const newDiscounts = {
        ...prev,
        [id]: isNaN(val) ? 0 : val
      };
      localStorage.setItem('pricebook_discounts', JSON.stringify(newDiscounts));
      return newDiscounts;
    });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: pkgData }, { data: bbData }] = await Promise.all([
      supabase.from('hpp_packages').select('*, hpp_package_items(*, hpp_bahan_baku(*))').eq('category', category).order('created_at', { ascending: true }),
      supabase.from('hpp_bahan_baku').select('*').eq('category', category)
    ]);

    if (pkgData) {
      const normalized = pkgData.map(pkg => {
        const items = (pkg.hpp_package_items || []).map(item => ({
          ...item,
          bb: item.hpp_bahan_baku
        }));

        const totalHpp = items.reduce((sum, item) => sum + (item.bb ? Number(item.bb.price) * item.qty : 0), 0);
        const hargaJual = Number(pkg.hargaJual) || 0;
        const margin = hargaJual - totalHpp;
        const hppPersen = hargaJual > 0 ? totalHpp / hargaJual : 0;
        const marginPersen = hargaJual > 0 ? margin / hargaJual : 0;
        
        return {
          id: pkg.id,
          name: pkg.name,
          totalHpp,
          hargaJual,
          hppPersen,
          margin,
          marginPersen
        };
      });
      setPackages(normalized);
      
      // Initialize default 20% discount for all, or load from localStorage
      const savedDiscounts = JSON.parse(localStorage.getItem('pricebook_discounts') || '{}');
      const initialDiscounts = { ...savedDiscounts };
      normalized.forEach(pkg => {
        if (initialDiscounts[pkg.id] === undefined) {
          initialDiscounts[pkg.id] = 20;
        }
      });
      setDiscounts(initialDiscounts);
    }
    setLoading(false);
  }, [category]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '1.2rem' }}>⏳ Memuat Price Book {category}...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="page-header">
        <h1 className="page-title">Price Book - {category}</h1>
        <p className="page-subtitle">Rangkuman HPP, Harga Jual, dan Margin untuk seluruh paket {category}</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: '1000px', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: 'var(--primary)' }}>
              <th style={{ color: '#fff', borderRight: '1px solid var(--overlay-light)' }}>Nama Paket {category}</th>
              <th style={{ color: '#fff', textAlign: 'right' }}>HPP</th>
              <th style={{ color: '#fff', textAlign: 'right' }}>Harga Jual</th>
              <th style={{ color: '#fff', textAlign: 'right', borderRight: '1px solid var(--overlay-light)' }}>Persentase HPP</th>
              <th style={{ color: '#fff', textAlign: 'right' }}>Margin</th>
              <th style={{ color: '#fff', textAlign: 'right', borderRight: '1px solid var(--overlay-light)' }}>Persentase Margin</th>
              <th style={{ color: '#fff', textAlign: 'right' }}>Harga Coret</th>
              <th style={{ color: '#fff', textAlign: 'center' }}>Diskon</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg, i) => {
              const currentDiscount = discounts[pkg.id] ?? 20;
              // Harga Coret = Harga Jual / (1 - Diskon/100)
              const calculatedHargaCoret = pkg.hargaJual > 0 && currentDiscount < 100 
                ? pkg.hargaJual / (1 - (currentDiscount / 100)) 
                : pkg.hargaJual;
              
              // Bulatkan ke ratusan ribu terdekat agar rapi (opsional, tapi disarankan)
              const roundedHargaCoret = Math.ceil(calculatedHargaCoret / 100000) * 100000;

              return (
                <tr key={pkg.id} style={{ background: i % 2 === 0 ? 'var(--overlay-bg)' : 'transparent' }}>
                  <td style={{ fontWeight: 'bold', color: 'var(--text-main)', borderRight: '1px solid var(--border-glass)' }}>{pkg.name}</td>
                  <td style={{ textAlign: 'right' }}>{formatRupiah(pkg.totalHpp)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(pkg.hargaJual)}</td>
                  <td style={{ textAlign: 'right', borderRight: '1px solid var(--border-glass)', color: pkg.hppPersen > 0.6 ? '#f87171' : '#34d399', background: 'var(--overlay-bg)' }}>
                    {formatPercent(pkg.hppPersen)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#60a5fa', fontWeight: 'bold' }}>{formatRupiah(pkg.margin)}</td>
                  <td style={{ textAlign: 'right', borderRight: '1px solid var(--border-glass)', color: pkg.marginPersen < 0.4 ? '#f87171' : '#34d399', background: 'var(--overlay-bg)' }}>
                    {formatPercent(pkg.marginPersen)}
                  </td>
                  <td style={{ textAlign: 'right', textDecoration: 'line-through', color: 'var(--text-muted)' }}>{formatRupiah(roundedHargaCoret)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--input-bg)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-glass)' }}>
                      <span style={{ fontSize: '0.8rem', marginRight: '0.3rem', color: 'var(--text-muted)' }}>DISKON</span>
                      <input 
                        type="number" 
                        value={currentDiscount} 
                        onChange={(e) => handleDiscountChange(pkg.id, e.target.value)}
                        style={{ 
                          width: '40px', background: 'transparent', border: 'none', 
                          color: 'var(--text-main)', fontWeight: 'bold', textAlign: 'center',
                          outline: 'none'
                        }}
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {packages.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Belum ada paket HPP Produk.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PriceBook;
