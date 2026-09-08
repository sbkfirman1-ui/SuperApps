import React, { useState, useEffect, useCallback } from 'react';
import Loader from '../components/Loader';
import { supabase } from '../lib/supabase';
import { Plus, ChevronDown } from 'lucide-react';

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

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('startsWith');
  const [variantFilter, setVariantFilter] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const getGroupName = (name) => {
    if (!name) return 'Lainnya';
    const lowerName = name.toLowerCase();
    if (lowerName.startsWith('intimate wedding')) return 'Intimate Wedding';
    if (lowerName.startsWith('prewedding') || lowerName.startsWith('prewed')) return 'Prewedding';
    if (lowerName.startsWith('wedding')) return 'Wedding';
    if (lowerName.startsWith('engagement') || lowerName.startsWith('lamaran')) return 'Engagement / Lamaran';
    if (lowerName.startsWith('siraman')) return 'Siraman';
    if (lowerName.startsWith('akad')) return 'Akad';
    if (lowerName.startsWith('resepsi')) return 'Resepsi';
    
    const firstWord = name.trim().split(' ')[0];
    return firstWord ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase() : 'Lainnya';
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader text={`Memuat Price Book ${category}...`} />
      </div>
    );
  }

  const filteredPackages = packages.filter(pkg => {
    const pkgNameLower = pkg.name.toLowerCase();
    
    // Filter by Variant first
    if (variantFilter === 'no_video' && !pkgNameLower.includes('-vidio') && !pkgNameLower.includes('- vidio')) {
      return false;
    }
    if (variantFilter === 'with_video' && !pkgNameLower.includes('+vidio') && !pkgNameLower.includes('+ vidio')) {
      return false;
    }

    // Filter by Search Term
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (filterType === 'startsWith') {
      return pkgNameLower.startsWith(term);
    }
    return pkgNameLower.includes(term);
  });

  const groupedPackages = filteredPackages.reduce((acc, pkg) => {
    const group = getGroupName(pkg.name);
    if (!acc[group]) acc[group] = [];
    acc[group].push(pkg);
    return acc;
  }, {});

  const isSearching = searchTerm.length > 0;

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Price Book - {category}</h1>
          <p className="page-subtitle">Rangkuman HPP, Harga Jual, dan Margin untuk seluruh paket {category}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--surface-dark)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-glass)' }}>
          <select 
            className="form-control" 
            style={{ width: 'auto', border: 'none', background: 'transparent', padding: '0.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}
            value={variantFilter}
            onChange={(e) => setVariantFilter(e.target.value)}
          >
            <option value="all">Semua Varian</option>
            <option value="no_video">Tanpa Vidio (-Vidio)</option>
            <option value="with_video">Dengan Vidio (+Vidio)</option>
          </select>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-glass)' }}></div>
          <select 
            className="form-control" 
            style={{ width: 'auto', border: 'none', background: 'transparent', padding: '0.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="startsWith">Berawal dari kata...</option>
            <option value="contains">Mengandung kata...</option>
          </select>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-glass)' }}></div>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Cari nama paket/produk..." 
            style={{ border: 'none', background: 'transparent', width: '250px', outline: 'none' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Daftar Price Book</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Menampilkan {filteredPackages.length} Paket</span>
        </div>
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
            {Object.entries(groupedPackages).map(([groupName, pkgs]) => {
              const isExpanded = expandedGroups[groupName] || isSearching;
              
              return (
                <React.Fragment key={groupName}>
                  {/* Accordion Header */}
                  <tr 
                    onClick={() => toggleGroup(groupName)} 
                    style={{ cursor: 'pointer', background: 'var(--surface-dark)', borderTop: '2px solid var(--border-glass)', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--overlay-bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-dark)'}
                  >
                    <td colSpan="8" style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)', fontSize: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)', transition: 'transform 0.2s' }}>
                          {isExpanded ? <ChevronDown size={16} /> : <Plus size={16} />}
                        </span>
                        <span>{groupName}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)', background: 'var(--overlay-bg)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                          {pkgs.length} Paket
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Accordion Body */}
                  {isExpanded && pkgs.map((pkg, i) => {
                    const currentDiscount = discounts[pkg.id] ?? 20;
                    // Harga Coret = Harga Jual / (1 - Diskon/100)
                    const calculatedHargaCoret = pkg.hargaJual > 0 && currentDiscount < 100 
                      ? pkg.hargaJual / (1 - (currentDiscount / 100)) 
                      : pkg.hargaJual;
                    
                    // Bulatkan ke ratusan ribu terdekat agar rapi (opsional, tapi disarankan)
                    const roundedHargaCoret = Math.ceil(calculatedHargaCoret / 100000) * 100000;

                    return (
                      <tr key={pkg.id} style={{ background: i % 2 === 0 ? 'var(--overlay-bg)' : 'transparent', borderTop: '1px solid var(--border-glass)' }}>
                        <td style={{ paddingLeft: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)', borderRight: '1px solid var(--border-glass)' }}>{pkg.name}</td>
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
                </React.Fragment>
              );
            })}
            {packages.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Belum ada paket HPP Produk.
                </td>
              </tr>
            )}
            {packages.length > 0 && filteredPackages.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Tidak ada paket yang sesuai dengan pencarian Anda.
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
