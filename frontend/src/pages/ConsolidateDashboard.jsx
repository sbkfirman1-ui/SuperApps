import React, { useState, useEffect } from 'react';
import Loader from '../components/Loader';
import { supabase } from '../lib/supabase';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Activity, Scale } from 'lucide-react';
import { getMasterData, DEFAULT_FINANCE_CATEGORIES } from '../utils/masterData';

const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === '') return 'Rp0';
  return 'Rp' + Number(number).toLocaleString('id-ID');
};

const formatPercent = (number) => {
  if (isNaN(number) || number === null || !isFinite(number)) return '0,00%';
  return Number(number).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
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
  
  const [stats, setStats] = useState({
    wedding: { grossProfit: 0, netProfit: 0, netMargin: 0, cashFlow: 0 },
    studio: { grossProfit: 0, netProfit: 0, netMargin: 0, cashFlow: 0 }
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
      
      const financeCategories = getMasterData('financeCategories', DEFAULT_FINANCE_CATEGORIES);
      
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;

      const { data: financeData, error } = await supabase
        .from('finance')
        .select('*')
        .gte('tanggal', startOfYear)
        .lte('tanggal', endOfYear);

      if (!error && financeData) {
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

            const catDef = financeCategories.find(c => c.name === f.kategoriFinance);
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

          return { grossProfit, netProfit, netMargin, cashFlow };
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
          StudioMargin: 0
        }));

        const processMonthlyTrend = (categoryFilter) => {
          financeData.filter(f => f.category === categoryFilter).forEach(f => {
            const nom = Number(f.nominal) || 0;
            const isPemasukan = f.jenis === 'Pemasukan';
            const m = new Date(f.tanggal).getMonth();

            const catDef = financeCategories.find(c => c.name === f.kategoriFinance);
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
            <select className="form-control" style={{ width: '120px' }} value={month} onChange={e => setMonth(e.target.value)}>
              <option value="Semua">Semua</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontWeight: 600 }}>Tahun</label>
            <select className="form-control" style={{ width: '100px' }} value={year} onChange={e => setYear(Number(e.target.value))}>
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
          <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginBottom: '2rem' }}>
            {/* GROSS PROFIT */}
            <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.1s' }}>
              <div className="summary-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Scale size={18}/> Gross Profit</div>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Wedding</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{formatRupiah(stats.wedding.grossProfit)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Studio</span>
                  <span style={{ fontWeight: 'bold', color: '#10b981' }}>{formatRupiah(stats.studio.grossProfit)}</span>
                </div>
              </div>
            </div>

            {/* NET PROFIT */}
            <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.2s' }}>
              <div className="summary-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={18}/> Net Profit</div>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Wedding</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{formatRupiah(stats.wedding.netProfit)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Studio</span>
                  <span style={{ fontWeight: 'bold', color: '#10b981' }}>{formatRupiah(stats.studio.netProfit)}</span>
                </div>
              </div>
            </div>

            {/* NET MARGIN */}
            <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.3s' }}>
              <div className="summary-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={18}/> Net Margin</div>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Wedding</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{formatPercent(stats.wedding.netMargin)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Studio</span>
                  <span style={{ fontWeight: 'bold', color: '#10b981' }}>{formatPercent(stats.studio.netMargin)}</span>
                </div>
              </div>
            </div>

            {/* CASH FLOW */}
            <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.4s' }}>
              <div className="summary-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><DollarSign size={18}/> Cash Flow Saldo</div>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Wedding</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{formatRupiah(stats.wedding.cashFlow)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Studio</span>
                  <span style={{ fontWeight: 'bold', color: '#10b981' }}>{formatRupiah(stats.studio.cashFlow)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="charts-grid" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
            <div className="chart-card glass-panel animate-stagger" style={{ animationDelay: '0.5s' }}>
              <div className="chart-header">Perbandingan Keuangan (Rupiah)</div>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--overlay-border)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" tickFormatter={(v) => `Rp${(v / 1000000).toFixed(0)}M`} />
                    <Tooltip 
                      formatter={(value) => formatRupiah(value)}
                      contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}
                    />
                    <Legend />
                    <Bar dataKey="Wedding" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Studio" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="chart-card glass-panel animate-stagger" style={{ animationDelay: '0.6s' }}>
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
          </div>

          <div className="chart-card glass-panel animate-stagger" style={{ animationDelay: '0.7s', marginTop: '2rem' }}>
            <div className="chart-header">Trend Keuntungan (Net Profit) Month to Month</div>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--overlay-border)" />
                  <XAxis dataKey="month" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" tickFormatter={(v) => `Rp${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip 
                    formatter={(value) => formatRupiah(value)}
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Wedding" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Studio" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
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
