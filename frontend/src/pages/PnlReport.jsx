import React, { useState, useEffect } from 'react';
import Loader from '../components/Loader';
import { supabase } from '../lib/supabase';
import { getMasterData, DEFAULT_FINANCE_CATEGORIES } from '../utils/masterData';

const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === '') return 'Rp0';
  return 'Rp' + Number(number).toLocaleString('id-ID');
};

const formatPercent = (number) => {
  if (isNaN(number) || number === null || !isFinite(number)) return '0,00%';
  return Number(number).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
};

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const PnlReport = ({ category }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  const financeCategories = getMasterData('financeCategories', DEFAULT_FINANCE_CATEGORIES);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch all finance data for this category and year
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;

      const { data: financeData, error } = await supabase
        .from('finance')
        .select('*')
        .eq('category', category)
        .gte('tanggal', startOfYear)
        .lte('tanggal', endOfYear);

      if (!error && financeData) {
        setData(financeData);
      }
      setLoading(false);
    };
    fetchData();
  }, [category, year]);

  // Matrix construction:
  // Data structure: matrix[categoryName][monthIndex] = nominal (0-11)
  const buildMatrix = () => {
    const matrix = {};
    financeCategories.forEach(cat => {
      matrix[cat.name] = Array(12).fill(0);
    });

    data.forEach(item => {
      const date = new Date(item.tanggal);
      const month = date.getMonth(); // 0-11
      const catName = item.kategoriFinance;
      if (matrix[catName] !== undefined) {
        matrix[catName][month] += Number(item.nominal);
      }
    });

    return matrix;
  };

  const matrix = buildMatrix();

  const renderGroup = (groupName) => {
    let groupCats = financeCategories.filter(cat => cat.group === groupName);

    // Khusus untuk Pendapatan, filter berdasarkan awalan nama (Wedding/Studio)
    if (groupName === 'Pendapatan') {
      groupCats = groupCats.filter(cat => {
        const lowerName = cat.name.toLowerCase();
        if (category === 'Wedding') {
          return lowerName.startsWith('wedding');
        } else if (category === 'Studio') {
          return lowerName.startsWith('studio');
        }
        return true;
      });
    }

    if (groupCats.length === 0) return null;

    const totals = Array(12).fill(0);
    groupCats.forEach(cat => {
      for (let i = 0; i < 12; i++) {
        totals[i] += matrix[cat.name][i];
      }
    });

    return (
      <React.Fragment key={groupName}>
        <tr>
          <td colSpan={13} style={{ fontWeight: 'bold', background: 'var(--overlay-bg-hover)', paddingTop: '1.5rem', paddingBottom: '0.5rem', color: 'var(--text-main)' }}>
            {groupName}
          </td>
        </tr>
        {groupCats.map(cat => (
          <tr key={cat.name}>
            <td style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>{cat.name}</td>
            {matrix[cat.name].map((val, idx) => (
              <td key={idx} style={{ textAlign: 'right' }}>{formatRupiah(val)}</td>
            ))}
          </tr>
        ))}
        <tr style={{ background: '#3b82f6', color: 'white', fontWeight: 'bold' }}>
          <td>Total {groupName}</td>
          {totals.map((val, idx) => (
            <td key={idx} style={{ textAlign: 'right' }}>{formatRupiah(val)}</td>
          ))}
        </tr>
      </React.Fragment>
    );
  };

  // Calculate totals
  const pendapatanTotals = Array(12).fill(0);
  const operasionalTotals = Array(12).fill(0);
  const tetapTotals = Array(12).fill(0);

  financeCategories.forEach(cat => {
    const lowerName = cat.name.toLowerCase();
    
    // Check if this category should be included based on PNL type
    let includePendapatan = true;
    if (cat.group === 'Pendapatan') {
      if (category === 'Wedding' && !lowerName.startsWith('wedding')) includePendapatan = false;
      if (category === 'Studio' && !lowerName.startsWith('studio')) includePendapatan = false;
    }

    for (let i = 0; i < 12; i++) {
      if (cat.group === 'Pendapatan' && includePendapatan) pendapatanTotals[i] += matrix[cat.name][i];
      else if (cat.group === 'Beban Operasional') operasionalTotals[i] += matrix[cat.name][i];
      else if (cat.group === 'Beban Tetap') tetapTotals[i] += matrix[cat.name][i];
    }
  });

  const totalBeban = Array(12).fill(0);
  const labaBersih = Array(12).fill(0);
  const netMargin = Array(12).fill(0);

  for (let i = 0; i < 12; i++) {
    totalBeban[i] = operasionalTotals[i] + tetapTotals[i];
    labaBersih[i] = pendapatanTotals[i] - totalBeban[i];
    netMargin[i] = pendapatanTotals[i] > 0 ? (labaBersih[i] / pendapatanTotals[i]) * 100 : 0;
  }

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Profit and Loss - {category}</h1>
          <p className="page-subtitle">Laporan Laba Rugi bulanan divisi {category}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ fontWeight: 600 }}>Tahun</label>
          <select className="form-control" style={{ width: '100px' }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {getYearOptions().map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, overflowX: 'auto', padding: '1rem' }}>
        {loading ? (
          <Loader text="Memuat data..." />
        ) : (
          <table className="data-table pnl-table" style={{ whiteSpace: 'nowrap', minWidth: '1200px' }}>
            <thead>
              <tr style={{ background: '#2563eb', color: 'white' }}>
                <th style={{ width: '250px' }}>Akun</th>
                {MONTHS.map(m => <th key={m} style={{ textAlign: 'right', minWidth: '110px' }}>{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {renderGroup('Pendapatan')}
              
              {/* Spacer */}
              <tr><td colSpan={13} style={{ height: '20px' }}></td></tr>
              
              {renderGroup('Beban Operasional')}
              
              {/* Spacer */}
              <tr><td colSpan={13} style={{ height: '20px' }}></td></tr>
              
              {renderGroup('Beban Tetap')}

              {/* Spacer */}
              <tr><td colSpan={13} style={{ height: '20px' }}></td></tr>
              
              {/* Final Totals */}
              <tr style={{ background: 'var(--overlay-bg-hover)', fontWeight: 'bold' }}>
                <td style={{ color: 'var(--text-main)' }}>Total Beban</td>
                {totalBeban.map((val, idx) => (
                  <td key={idx} style={{ textAlign: 'right', color: 'var(--text-main)' }}>{formatRupiah(val)}</td>
                ))}
              </tr>
              <tr style={{ background: '#22c55e', color: 'white', fontWeight: 'bold' }}>
                <td>Laba Bersih</td>
                {labaBersih.map((val, idx) => (
                  <td key={idx} style={{ textAlign: 'right' }}>{formatRupiah(val)}</td>
                ))}
              </tr>
              <tr style={{ background: '#3b82f6', color: 'white', fontWeight: 'bold' }}>
                <td>Net Margin</td>
                {netMargin.map((val, idx) => (
                  <td key={idx} style={{ textAlign: 'right' }}>{formatPercent(val)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PnlReport;
