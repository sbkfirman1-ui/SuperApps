import React, { useState, useEffect } from 'react';
import Loader from '../components/Loader';
import { supabase } from '../lib/supabase';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Activity, Scale, Wallet, ShoppingCart } from 'lucide-react';
import { getMasterData, DEFAULT_FINANCE_CATEGORIES } from '../utils/masterData';

const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === '') return 'Rp0';
  return 'Rp' + Number(number).toLocaleString('id-ID');
};

const formatPercent = (number) => {
  if (isNaN(number) || number === null || !isFinite(number)) return '0,00%';
  return Number(number).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const totalEntry = payload.find(e => e.name === 'Total');
    const total = totalEntry ? totalEntry.value : payload.reduce((sum, entry) => sum + entry.value, 0);

    return (
      <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', padding: '10px', borderRadius: '4px', fontSize: '0.875rem' }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>{label}</p>
        {payload.map((entry, index) => {
          const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
          return (
            <div key={`item-${index}`} style={{ color: entry.color, marginBottom: '4px' }}>
              <span style={{ fontWeight: 600 }}>{entry.name} :</span> {formatRupiah(entry.value)} 
              <span style={{ marginLeft: '4px', opacity: 0.8 }}>({percentage}%)</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const ConsolidateDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(() => {
    const saved = localStorage.getItem('consolidate_year');
    return saved ? Number(saved) : new Date().getFullYear();
  });
  const [month, setMonth] = useState(() => {
    return localStorage.getItem('consolidate_month') || 'Semua';
  });
  
  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const [financeCategories, setFinanceCategories] = useState([]);
  const [stats, setStats] = useState({
    wedding: { grossProfit: 0, netProfit: 0, netMargin: 0, cashFlow: 0, totalPendapatan: 0 },
    studio: { grossProfit: 0, netProfit: 0, netMargin: 0, cashFlow: 0, totalPendapatan: 0 }
  });
  const [omzetTx, setOmzetTx] = useState({
    wedding: 0,
    studio: 0,
    laki: 0,
    total: 0
  });
  const [trendData, setTrendData] = useState([]);

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  };

  useEffect(() => {
    localStorage.setItem('consolidate_year', year);
  }, [year]);

  useEffect(() => {
    localStorage.setItem('consolidate_month', month);
  }, [month]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;

      const [{ data: cats }, { data: financeData, error }, { data: txData }] = await Promise.all([
        supabase.from('finance_categories').select('*').order('id', { ascending: true }),
        supabase.from('finance').select('*').gte('tanggal', startOfYear).lte('tanggal', endOfYear),
        supabase.from('transactions').select('*')
      ]);

      if (!error && financeData) {
        let baseCats = cats || [];
        financeData.forEach(item => {
          if (!baseCats.find(c => c.name === item.kategoriFinance)) {
            baseCats.push({
              id: `dyn_${Math.random()}`,
              name: item.kategoriFinance,
              type: item.jenis,
              group: item.jenis === 'Pemasukan' ? 'Pendapatan' : 'COGS'
            });
          }
        });
        setFinanceCategories([...baseCats]);

        const processData = (categoryFilter) => {
          let totalPendapatan = 0;
          let totalCogs = 0;
          let totalFixed = 0;
          let totalPemasukan = 0;
          let totalPengeluaran = 0;

          const filterByMonth = (f) => {
            if (month === 'Semua') return true;
            const m = new Date(f.tanggal).getMonth();
            return m === Number(month);
          };

          financeData.filter(f => f.category === categoryFilter && filterByMonth(f)).forEach(f => {
            const nom = Number(f.nominal) || 0;
            const isPemasukan = f.jenis === 'Pemasukan';
            
            if (isPemasukan) totalPemasukan += nom;
            if (f.jenis === 'Pengeluaran') totalPengeluaran += nom;

            const catDef = baseCats.find(c => c.name === f.kategoriFinance);
            let group = '';
            if (catDef) {
              group = catDef.group;
            } else {
              group = isPemasukan ? 'Pendapatan' : 'COGS';
            }

            // Exclude studio categories from wedding pendapatan, and vice versa
            let includePendapatan = true;
            if (group === 'Pendapatan') {
               const lowerName = f.kategoriFinance.toLowerCase();
               if (categoryFilter === 'Wedding' && lowerName.includes('studio')) includePendapatan = false;
               if (categoryFilter === 'Studio' && lowerName.includes('wedding')) includePendapatan = false;
            }

            if (group === 'Pendapatan' && includePendapatan) totalPendapatan += nom;
            else if (group === 'COGS') totalCogs += nom;
            else if (group === 'Fixed Cost') totalFixed += nom;
          });

          const grossProfit = totalPendapatan - totalCogs;
          const totalBeban = totalCogs + totalFixed;
          const netProfit = totalPendapatan - totalBeban;
          const netMargin = totalPendapatan > 0 ? (netProfit / totalPendapatan) * 100 : 0;
          const cashFlow = totalPemasukan - totalPengeluaran;

          return { grossProfit, netProfit, netMargin, cashFlow, totalPendapatan };
        };

        const wedStats = processData('Wedding');
        const stuStats = processData('Studio');
        
        setStats({ wedding: wedStats, studio: stuStats });

        const monthlyTrend = Array(12).fill(0).map((_, i) => ({
          month: MONTHS[i].slice(0, 3), // e.g., 'Jan', 'Feb'
          Wedding: 0,
          Studio: 0,
          WeddingPendapatan: 0,
          StudioPendapatan: 0,
          WeddingMargin: 0,
          StudioMargin: 0,
          WeddingCashflow: 0,
          StudioCashflow: 0,
          TotalCashflow: 0
        }));

        const processMonthlyTrend = (categoryFilter) => {
          financeData.filter(f => f.category === categoryFilter).forEach(f => {
            const nom = Number(f.nominal) || 0;
            const isPemasukan = f.jenis === 'Pemasukan';
            const m = new Date(f.tanggal).getMonth();

            // Cashflow Calculation
            if (isPemasukan) {
              monthlyTrend[m][`${categoryFilter}Cashflow`] += nom;
              monthlyTrend[m].TotalCashflow += nom;
            } else if (f.jenis === 'Pengeluaran') {
              monthlyTrend[m][`${categoryFilter}Cashflow`] -= nom;
              monthlyTrend[m].TotalCashflow -= nom;
            }

            const catDef = baseCats.find(c => c.name === f.kategoriFinance);
            let group = '';
            if (catDef) {
              group = catDef.group;
            } else {
              group = isPemasukan ? 'Pendapatan' : 'COGS';
            }

            let includePendapatan = true;
            if (group === 'Pendapatan') {
               const lowerName = f.kategoriFinance.toLowerCase();
               if (categoryFilter === 'Wedding' && lowerName.includes('studio')) includePendapatan = false;
               if (categoryFilter === 'Studio' && lowerName.includes('wedding')) includePendapatan = false;
            }

            if (group === 'Pendapatan' && includePendapatan) {
              monthlyTrend[m][categoryFilter] += nom;
              monthlyTrend[m][`${categoryFilter}Pendapatan`] += nom;
            }
            else if (group === 'COGS') monthlyTrend[m][categoryFilter] -= nom;
            else if (group === 'Fixed Cost') monthlyTrend[m][categoryFilter] -= nom;
          });
        };

        processMonthlyTrend('Wedding');
        processMonthlyTrend('Studio');
        
        monthlyTrend.forEach(m => {
          m.WeddingMargin = m.WeddingPendapatan > 0 ? (m.Wedding / m.WeddingPendapatan) * 100 : 0;
          m.StudioMargin = m.StudioPendapatan > 0 ? (m.Studio / m.StudioPendapatan) * 100 : 0;
        });

        setTrendData(monthlyTrend);
      }

      if (txData) {
        let txWed = 0;
        let txStu = 0;
        let txLak = 0;

        txData.filter(t => {
          const dateStr = t.dDayDate || t.bookingDate || t.created_at;
          if (!dateStr) return false;
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return false;
          if (d.getFullYear() !== year) return false;
          if (month !== 'Semua' && d.getMonth() !== Number(month)) return false;
          return true;
        }).forEach(t => {
          const price = Number(t.productPrice) || 0;
          if (t.category === 'Wedding') txWed += price;
          else if (t.category === 'Studio') txStu += price;
          else if (t.category === 'Laki') txLak += price;
        });

        setOmzetTx({
          wedding: txWed,
          studio: txStu,
          laki: txLak,
          total: txWed + txStu + txLak
        });
      }

      setLoading(false);
    };
    
    fetchData();
  }, [year, month]);

  const comparisonData = [
    {
      name: 'Gross Profit',
      Wedding: stats.wedding.grossProfit,
      Studio: stats.studio.grossProfit,
    },
    {
      name: 'Net Profit',
      Wedding: stats.wedding.netProfit,
      Studio: stats.studio.netProfit,
    },
    {
      name: 'Cash Flow Saldo',
      Wedding: stats.wedding.cashFlow,
      Studio: stats.studio.cashFlow,
    }
  ];

  const totalPendapatanAll = stats.wedding.totalPendapatan + stats.studio.totalPendapatan;
  const totalNetProfitAll = stats.wedding.netProfit + stats.studio.netProfit;
  const totalNetMarginAll = totalPendapatanAll > 0 ? (totalNetProfitAll / totalPendapatanAll) * 100 : 0;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Dashboard Konsolidasi</h1>
          <p className="page-subtitle">Perbandingan Performa Wedding vs Studio</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontWeight: 600 }}>Bulan</label>
            <select className="form-control" style={{ minWidth: '150px', width: 'auto' }} value={month} onChange={e => setMonth(e.target.value)}>
              <option value="Semua">Semua</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontWeight: 600 }}>Tahun</label>
            <select className="form-control" style={{ minWidth: '105px', width: 'auto' }} value={year} onChange={e => setYear(Number(e.target.value))}>
              {getYearOptions().map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <Loader text="Memuat data konsolidasi..." />
      ) : (
        <>
          <div className="consolidate-summary-grid">
            {/* OMZET JOB LAKI */}
            <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.0s' }}>
              <div className="summary-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={18}/> Omzet Job Laki
              </div>
              <div style={{ marginTop: '1rem' }}>
                {omzetTx.laki > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
                    <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Laki</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: '#f59e0b', whiteSpace: 'nowrap' }}>{formatRupiah(omzetTx.laki)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#f59e0b', opacity: 0.8, marginTop: '2px', whiteSpace: 'nowrap' }}>
                        {formatPercent(omzetTx.total ? (omzetTx.laki / omzetTx.total) * 100 : 0)}
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Wedding</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary)', whiteSpace: 'nowrap' }}>{formatRupiah(omzetTx.wedding)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', opacity: 0.8, marginTop: '2px', whiteSpace: 'nowrap' }}>
                      {formatPercent(omzetTx.total ? (omzetTx.wedding / omzetTx.total) * 100 : 0)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Studio</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#10b981', whiteSpace: 'nowrap' }}>{formatRupiah(omzetTx.studio)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', opacity: 0.8, marginTop: '2px', whiteSpace: 'nowrap' }}>
                      {formatPercent(omzetTx.total ? (omzetTx.studio / omzetTx.total) * 100 : 0)}
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '0.25rem', gap: '1rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Total Gabungan</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{formatRupiah(omzetTx.total)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', opacity: 0.8, marginTop: '2px', whiteSpace: 'nowrap' }}>100.0%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* TOTAL PENDAPATAN AKTUAL */}
            <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.1s' }}>
              <div className="summary-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><DollarSign size={18}/> Total Pendapatan Aktual</div>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Wedding</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary)', whiteSpace: 'nowrap' }}>{formatRupiah(stats.wedding.totalPendapatan)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', opacity: 0.8, marginTop: '2px', whiteSpace: 'nowrap' }}>{formatPercent(totalPendapatanAll ? (stats.wedding.totalPendapatan / totalPendapatanAll) * 100 : 0)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Studio</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#10b981', whiteSpace: 'nowrap' }}>{formatRupiah(stats.studio.totalPendapatan)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', opacity: 0.8, marginTop: '2px', whiteSpace: 'nowrap' }}>{formatPercent(totalPendapatanAll ? (stats.studio.totalPendapatan / totalPendapatanAll) * 100 : 0)}</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '0.25rem', gap: '1rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Total</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{formatRupiah(totalPendapatanAll)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', opacity: 0.8, marginTop: '2px', whiteSpace: 'nowrap' }}>100.0%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* GROSS PROFIT */}
            <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.2s' }}>
              <div className="summary-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Scale size={18}/> Gross Profit</div>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Wedding</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary)', whiteSpace: 'nowrap' }}>{formatRupiah(stats.wedding.grossProfit)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', opacity: 0.8, marginTop: '2px', whiteSpace: 'nowrap' }}>{formatPercent((stats.wedding.grossProfit + stats.studio.grossProfit) ? (stats.wedding.grossProfit / (stats.wedding.grossProfit + stats.studio.grossProfit)) * 100 : 0)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Studio</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#10b981', whiteSpace: 'nowrap' }}>{formatRupiah(stats.studio.grossProfit)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', opacity: 0.8, marginTop: '2px', whiteSpace: 'nowrap' }}>{formatPercent((stats.wedding.grossProfit + stats.studio.grossProfit) ? (stats.studio.grossProfit / (stats.wedding.grossProfit + stats.studio.grossProfit)) * 100 : 0)}</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '0.25rem', gap: '1rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Total</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{formatRupiah(stats.wedding.grossProfit + stats.studio.grossProfit)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', opacity: 0.8, marginTop: '2px', whiteSpace: 'nowrap' }}>100.0%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* NET PROFIT */}
            <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.3s' }}>
              <div className="summary-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={18}/> Net Profit</div>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Wedding</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary)', whiteSpace: 'nowrap' }}>{formatRupiah(stats.wedding.netProfit)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', opacity: 0.8, marginTop: '2px', whiteSpace: 'nowrap' }}>{formatPercent((stats.wedding.netProfit + stats.studio.netProfit) ? (stats.wedding.netProfit / (stats.wedding.netProfit + stats.studio.netProfit)) * 100 : 0)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Studio</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#10b981', whiteSpace: 'nowrap' }}>{formatRupiah(stats.studio.netProfit)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', opacity: 0.8, marginTop: '2px', whiteSpace: 'nowrap' }}>{formatPercent((stats.wedding.netProfit + stats.studio.netProfit) ? (stats.studio.netProfit / (stats.wedding.netProfit + stats.studio.netProfit)) * 100 : 0)}</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '0.25rem', gap: '1rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Total</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{formatRupiah(stats.wedding.netProfit + stats.studio.netProfit)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', opacity: 0.8, marginTop: '2px', whiteSpace: 'nowrap' }}>100.0%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* NET MARGIN */}
            <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.4s' }}>
              <div className="summary-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={18}/> Net Margin</div>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Wedding</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)', whiteSpace: 'nowrap' }}>{formatPercent(stats.wedding.netMargin)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Studio</span>
                  <span style={{ fontWeight: 'bold', color: '#10b981', whiteSpace: 'nowrap' }}>{formatPercent(stats.studio.netMargin)}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', gap: '1rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Rata-rata</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{formatPercent(totalNetMarginAll)}</span>
                </div>
              </div>
            </div>

            {/* CASH FLOW */}
            <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.5s' }}>
              <div className="summary-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Wallet size={18}/> Cash Flow Saldo</div>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Wedding</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary)', whiteSpace: 'nowrap' }}>{formatRupiah(stats.wedding.cashFlow)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', opacity: 0.8, marginTop: '2px', whiteSpace: 'nowrap' }}>{formatPercent((stats.wedding.cashFlow + stats.studio.cashFlow) ? (stats.wedding.cashFlow / (stats.wedding.cashFlow + stats.studio.cashFlow)) * 100 : 0)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Studio</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#10b981', whiteSpace: 'nowrap' }}>{formatRupiah(stats.studio.cashFlow)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', opacity: 0.8, marginTop: '2px', whiteSpace: 'nowrap' }}>{formatPercent((stats.wedding.cashFlow + stats.studio.cashFlow) ? (stats.studio.cashFlow / (stats.wedding.cashFlow + stats.studio.cashFlow)) * 100 : 0)}</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '0.25rem', gap: '1rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Total</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{formatRupiah(stats.wedding.cashFlow + stats.studio.cashFlow)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', opacity: 0.8, marginTop: '2px', whiteSpace: 'nowrap' }}>100.0%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            {/* PIE CHART PENDAPATAN AKTUAL */}
            <div className="chart-card glass-panel animate-stagger" style={{ animationDelay: '0.4s' }}>
              <div className="chart-header">Komposisi Pendapatan Aktual</div>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Wedding', value: stats.wedding.totalPendapatan },
                        { name: 'Studio', value: stats.studio.totalPendapatan }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={true}
                      label={({ cx, cy, midAngle, outerRadius, percent, name, value }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius * 1.15;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        const textAnchor = x > cx ? 'start' : 'end';
                        return (
                          <text x={x} y={y} fill="var(--text-main)" textAnchor={textAnchor} dominantBaseline="central" fontSize="0.75rem">
                            <tspan x={x} dy="-0.6em" fontWeight="bold">{name}</tspan>
                            <tspan x={x} dy="1.2em">{formatRupiah(value)} ({(percent * 100).toFixed(1)}%)</tspan>
                          </text>
                        );
                      }}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip formatter={(value) => formatRupiah(value)} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card glass-panel animate-stagger" style={{ animationDelay: '0.5s' }}>
              <div className="chart-header">Perbandingan Keuangan (Rupiah)</div>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--overlay-border)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" tickFormatter={(v) => `Rp${(v / 1000000).toFixed(0)}M`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="Wedding" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Studio" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="chart-card glass-panel animate-stagger" style={{ animationDelay: '0.6s', marginTop: '2rem', padding: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
              <h3 style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500, fontSize: '1.1rem' }}>Trend Cash Flow</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                <h2 style={{ fontSize: '3rem', margin: 0, color: 'var(--text-main)', letterSpacing: '-1px' }}>
                  {formatRupiah(stats.wedding.cashFlow + stats.studio.cashFlow)}
                </h2>
                <span style={{ color: 'var(--text-success)', fontSize: '0.9rem', fontWeight: 600, background: 'var(--success-bg)', padding: '0.2rem 0.6rem', borderRadius: '99px' }}>
                  Saldo di tahun {year}
                </span>
              </div>
            </div>
            
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorWedding" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorStudio" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="var(--text-muted)" axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="var(--text-muted)" axisLine={false} tickLine={false} width={70} tickFormatter={(v) => `Rp${(v / 1000000).toFixed(0)}M`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--overlay-border)" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '20px' }}/>
                  <Area type="monotone" dataKey="TotalCashflow" name="Total" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" dataKey="WeddingCashflow" name="Wedding" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorWedding)" />
                  <Area type="monotone" dataKey="StudioCashflow" name="Studio" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorStudio)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card glass-panel animate-stagger" style={{ animationDelay: '0.7s', marginTop: '2rem' }}>
            <div className="chart-header">Trend Keuntungan (Net Profit) Month to Month</div>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--overlay-border)" />
                  <XAxis dataKey="month" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" tickFormatter={(v) => `Rp${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="Wedding" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Studio" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card glass-panel animate-stagger" style={{ animationDelay: '0.8s', marginTop: '2rem' }}>
            <div className="chart-header">Trend Net Margin (%) Month to Month</div>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--overlay-border)" />
                  <XAxis dataKey="month" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    formatter={(value) => `${Number(value).toFixed(2)}%`}
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="WeddingMargin" name="Wedding" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="StudioMargin" name="Studio" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ConsolidateDashboard;
