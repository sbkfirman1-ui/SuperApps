import React, { useState, useEffect } from 'react';
import { 
  DollarSign, ShoppingCart, CreditCard, TrendingUp,
  PieChart as PieChartIcon, CheckCircle, Clock, XCircle, Calendar, Filter, X
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line
} from 'recharts';
import { supabase } from '../lib/supabase';
import { getMasterData, DEFAULT_FINANCE_CATEGORIES } from '../utils/masterData';

const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === '') return 'Rp.0';
  return 'Rp.' + Number(number).toLocaleString('id-ID');
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const Dashboard = ({ category }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [filterTrigger, setFilterTrigger] = useState(0);

  const [stats, setStats] = useState({
    totalPendapatan: 0, totalTransaksi: 0, piutangBerjalan: 0,
    lunasCount: 0, lunasValue: 0, lunasTx: [],
    dpCount: 0, dpValue: 0, dpTx: [],
    belumLunasCount: 0, belumLunasValue: 0, belumLunasTx: [],
    topProducts: [], topRevenueProducts: [], dataSales: [],
    cashFlowSaldo: 0
  });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, title: '', data: [] });

  const openModal = (title, data) => setModal({ isOpen: true, title, data });
  const closeModal = () => setModal({ ...modal, isOpen: false });

  const financeCategories = getMasterData('financeCategories', DEFAULT_FINANCE_CATEGORIES);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      
      let queryTx = supabase.from('transactions').select('*');
      if (category === 'Wedding') queryTx = queryTx.eq('category', 'Wedding');
      else if (category === 'Studio') queryTx = queryTx.eq('category', 'Studio');

      let queryFin = supabase.from('finance').select('*');
      if (category === 'Wedding') queryFin = queryFin.eq('category', 'Wedding');
      else if (category === 'Studio') queryFin = queryFin.eq('category', 'Studio');

      if (isFilterApplied && startDate && endDate) {
        queryTx = queryTx.gte('dDayDate', startDate).lte('dDayDate', endDate);
        queryFin = queryFin.gte('tanggal', startDate).lte('tanggal', endDate);
      }

      const [txRes, finRes] = await Promise.all([queryTx, queryFin]);
      const transactions = txRes.data || [];
      const financeData = finRes.data || [];

      // Calculate Transaction Stats
      let tPend = 0, piutang = 0;
      let lunas = 0, dp = 0, blm = 0;
      let lunasVal = 0, dpValTotal = 0, blmVal = 0;
      const lunasArr = [], dpArr = [], blmArr = [];
      
      const prodCounts = {}, prodRevenues = {};

      transactions.forEach(tx => {
        const price = Number(tx.productPrice) || 0;
        const dpVal = Number(tx.dp) || 0;
        tPend += price;
        piutang += Math.max(0, price - dpVal);
        
        if (dpVal === 0) {
          blm++;
          blmVal += price;
          blmArr.push(tx);
        } else if (dpVal >= price) {
          lunas++;
          lunasVal += price;
          lunasArr.push(tx);
        } else {
          dp++;
          dpValTotal += price;
          dpArr.push(tx);
        }
        
        if (tx.productName) {
          prodCounts[tx.productName] = (prodCounts[tx.productName] || 0) + 1;
          prodRevenues[tx.productName] = (prodRevenues[tx.productName] || 0) + price;
        }
      });

      const totalTopTx = Object.values(prodCounts).reduce((a, b) => a + b, 0);
      const tProd = Object.entries(prodCounts)
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([name, value]) => ({ 
          name, 
          value,
          percentage: totalTopTx > 0 ? ((value / totalTopTx) * 100).toFixed(1) : 0 
        }));

      const tRev = Object.entries(prodRevenues)
        .sort((a, b) => b[1] - a[1])
        .map(([name, revenue]) => ({
          name, revenue,
          percentage: tPend > 0 ? ((revenue / tPend) * 100).toFixed(1) : 0
        }));

      // Calculate Finance Stats
      let totalPemasukan = 0;
      let totalPengeluaran = 0;
      let totalTransfer = 0;
      let totalCash = 0;
      
      let totalPendapatanFinance = 0;
      let totalBebanOpFinance = 0;
      let totalBebanTetapFinance = 0;

      const monthlyData = {}; // { 'YYYY-MM': { pendapatan: 0, bebanOp: 0, bebanTetap: 0 } }

      financeData.forEach(f => {
        const nom = Number(f.nominal) || 0;
        const isPemasukan = f.jenis === 'Pemasukan';
        
        if (isPemasukan) totalPemasukan += nom;
        if (f.jenis === 'Pengeluaran') totalPengeluaran += nom;

        // Breakdown Transfer/Cash
        const ket = f.keterangan || '';
        if (ket.startsWith('[Cash] ')) {
          if (isPemasukan) totalCash += nom; else totalCash -= nom;
        } else {
          // Default to transfer for older records and explicitly marked ones
          if (isPemasukan) totalTransfer += nom; else totalTransfer -= nom;
        }

        const catDef = financeCategories.find(c => c.name === f.kategoriFinance);
        if (catDef) {
          if (catDef.group === 'Pendapatan') totalPendapatanFinance += nom;
          else if (catDef.group === 'Beban Operasional') totalBebanOpFinance += nom;
          else if (catDef.group === 'Beban Tetap') totalBebanTetapFinance += nom;
        } else {
           // Fallback
           if (isPemasukan) totalPendapatanFinance += nom;
           else totalBebanOpFinance += nom;
        }

        // For Laba Bersih Chart
        const date = new Date(f.tanggal);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const key = `${yyyy}-${mm}`;
        
        if (!monthlyData[key]) {
          monthlyData[key] = { pendapatan: 0, bebanOp: 0, bebanTetap: 0, pemasukan: 0, pengeluaran: 0 };
        }
        
        if (isPemasukan) monthlyData[key].pemasukan += nom;
        if (f.jenis === 'Pengeluaran') monthlyData[key].pengeluaran += nom;

        if (catDef) {
          if (catDef.group === 'Pendapatan') monthlyData[key].pendapatan += nom;
          else if (catDef.group === 'Beban Operasional') monthlyData[key].bebanOp += nom;
          else if (catDef.group === 'Beban Tetap') monthlyData[key].bebanTetap += nom;
        } else {
           // Fallback if category deleted from master data
           if (isPemasukan) monthlyData[key].pendapatan += nom;
           else monthlyData[key].bebanOp += nom;
        }
      });

      // Cash flow sisa saldo
      const cashFlowSaldo = totalPemasukan - totalPengeluaran;
      
      // Net Margin Calculation
      const labaBersihTotal = totalPendapatanFinance - (totalBebanOpFinance + totalBebanTetapFinance);
      const netMarginTotal = totalPendapatanFinance > 0 ? (labaBersihTotal / totalPendapatanFinance) * 100 : 0;

      // Prepare Chart Data
      const sortedMonths = Object.keys(monthlyData).sort();
      const chartData = sortedMonths.map(key => {
        const data = monthlyData[key];
        const labaBersih = data.pendapatan - (data.bebanOp + data.bebanTetap);
        const [y, m] = key.split('-');
        const label = `${MONTHS[parseInt(m) - 1]} ${y}`;
        return { name: label, total: labaBersih, pemasukan: data.pemasukan, pengeluaran: data.pengeluaran };
      });

      // If chartData is empty, show empty mock to keep UI
      if (chartData.length === 0) {
        chartData.push({ name: 'Belum ada data', total: 0, pemasukan: 0, pengeluaran: 0 });
      }

      setStats({
        totalPendapatan: tPend,
        totalTransaksi: transactions.length,
        piutangBerjalan: piutang,
        lunasCount: lunas, lunasValue: lunasVal, lunasTx: lunasArr,
        dpCount: dp, dpValue: dpValTotal, dpTx: dpArr,
        belumLunasCount: blm, belumLunasValue: blmVal, belumLunasTx: blmArr,
        topProducts: tProd.length ? tProd : [{ name: 'Belum ada data', value: 1 }],
        topRevenueProducts: tRev,
        dataSales: chartData,
        cashFlowSaldo,
        totalTransfer,
        totalCash,
        totalPemasukan,
        totalPengeluaran,
        labaBersihTotal,
        netMarginTotal
      });
      setLoading(false);
    };
    fetchStats();
  }, [category, filterTrigger]); // ONLY run when category or filterTrigger changes

  const handleApplyFilter = () => {
    if (startDate && endDate) {
      setIsFilterApplied(true);
      setFilterTrigger(prev => prev + 1);
    }
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setIsFilterApplied(false);
    setFilterTrigger(prev => prev + 1);
  };

  const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];
  const { totalPendapatan, totalTransaksi, piutangBerjalan, lunasCount, lunasValue, lunasTx, dpCount, dpValue, dpTx, belumLunasCount, belumLunasValue, belumLunasTx, topProducts, topRevenueProducts, dataSales, cashFlowSaldo, totalTransfer, totalCash, totalPemasukan, totalPengeluaran, labaBersihTotal, netMarginTotal } = stats;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Dashboard {category}</h1>
          <p className="page-subtitle">Ringkasan performa bisnis dan penjualan</p>
        </div>
        
        {/* Date Filter UI */}
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mulai (Tgl Acara)</label>
            <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.9rem' }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sampai (Tgl Acara)</label>
            <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.9rem' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleApplyFilter} disabled={!startDate || !endDate} style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Filter size={14} /> Terapkan
            </button>
            {isFilterApplied && (
              <button className="btn" onClick={handleClearFilter} style={{ padding: '0.4rem 1rem', background: 'var(--danger-bg)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <X size={14} /> Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>⏳ Memuat data dari database...</div>
      ) : (
        <>
          {/* SECTION: PERFORMA KEUANGAN */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 className="animate-stagger" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', animationDelay: '0.1s' }}>
              <DollarSign className="text-primary" /> Performa Keuangan (Finance)
            </h2>
            <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              
              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.15s' }}>
                <div className="summary-title">Net Margin</div>
                <div className="summary-value" style={{ fontSize: '1.4rem', color: netMarginTotal >= 15 ? '#34d399' : '#f87171' }}>
                  {formatRupiah(labaBersihTotal)} ({netMarginTotal.toFixed(1)}%)
                </div>
                <div className="summary-change" style={{ color: netMarginTotal >= 15 ? '#34d399' : '#f87171' }}>
                  <TrendingUp size={16} style={{ transform: netMarginTotal < 15 ? 'scaleY(-1)' : 'none' }} /> 
                  Target 15%
                </div>
                <PieChartIcon className="summary-card-icon" size={32} style={{ opacity: 0.2 }} />
              </div>
              
              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.2s' }}>
                <div className="summary-title">Cash Flow (Sisa Saldo)</div>
                <div className="summary-value" style={{ fontSize: '1.75rem', color: cashFlowSaldo >= 0 ? '#34d399' : '#f87171' }}>
                  {formatRupiah(cashFlowSaldo)}
                </div>
                <div className="summary-change" style={{ color: cashFlowSaldo >= 0 ? '#34d399' : '#f87171' }}>
                  <TrendingUp size={16} style={{ transform: cashFlowSaldo < 0 ? 'scaleY(-1)' : 'none' }} /> 
                  {isFilterApplied ? 'Bulan Terpilih' : 'Total Saldo Finance'}
                </div>
                <CreditCard className="summary-card-icon" size={32} style={{ opacity: 0.2 }} />
              </div>

              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.25s' }}>
                <div className="summary-title">Total Pemasukan (Finance)</div>
                <div className="summary-value" style={{ fontSize: '1.75rem', color: '#34d399' }}>
                  {formatRupiah(totalPemasukan)}
                </div>
                <div className="summary-change change-positive">
                  <TrendingUp size={16} /> Total Dana Masuk
                </div>
                <DollarSign className="summary-card-icon" size={32} style={{ opacity: 0.2 }} />
              </div>

              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.3s' }}>
                <div className="summary-title">Total Pengeluaran (Finance)</div>
                <div className="summary-value" style={{ fontSize: '1.75rem', color: '#f87171' }}>
                  {formatRupiah(totalPengeluaran)}
                </div>
                <div className="summary-change change-negative">
                  <TrendingUp size={16} style={{ transform: 'scaleY(-1)' }} /> Total Dana Keluar
                </div>
                <CreditCard className="summary-card-icon" size={32} style={{ opacity: 0.2 }} />
              </div>

              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.35s' }}>
                <div className="summary-title">Total Uang Transfer</div>
                <div className="summary-value" style={{ fontSize: '1.75rem', color: totalTransfer >= 0 ? '#3b82f6' : '#f87171' }}>
                  {formatRupiah(totalTransfer)}
                </div>
                <div className="summary-change" style={{ color: totalTransfer >= 0 ? '#3b82f6' : '#f87171' }}>
                  <TrendingUp size={16} style={{ transform: totalTransfer < 0 ? 'scaleY(-1)' : 'none' }} /> 
                  Saldo Transfer
                </div>
                <CreditCard className="summary-card-icon" size={32} style={{ opacity: 0.2 }} />
              </div>

              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.4s' }}>
                <div className="summary-title">Total Uang Cash</div>
                <div className="summary-value" style={{ fontSize: '1.75rem', color: totalCash >= 0 ? '#10b981' : '#f87171' }}>
                  {formatRupiah(totalCash)}
                </div>
                <div className="summary-change" style={{ color: totalCash >= 0 ? '#10b981' : '#f87171' }}>
                  <TrendingUp size={16} style={{ transform: totalCash < 0 ? 'scaleY(-1)' : 'none' }} /> 
                  Saldo Tunai
                </div>
                <DollarSign className="summary-card-icon" size={32} style={{ opacity: 0.2 }} />
              </div>
            </div>
          </div>

          {/* SECTION: PERFORMA TRANSAKSI */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 className="animate-stagger" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', animationDelay: '0.45s' }}>
              <ShoppingCart className="text-primary" /> Performa Transaksi (Sales)
            </h2>
            <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              
              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.5s' }}>
                <div className="summary-title">Total Pendapatan (Transaksi)</div>
                <div className="summary-value" style={{ fontSize: '1.75rem' }}>{formatRupiah(totalPendapatan)}</div>
                <div className="summary-change change-positive"><TrendingUp size={16} /> {isFilterApplied ? 'Periode Terpilih' : 'Semua Waktu'}</div>
                <DollarSign className="summary-card-icon" size={32} />
              </div>

              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.55s' }}>
                <div className="summary-title">Total Job</div>
                <div className="summary-value" style={{ fontSize: '1.75rem' }}>{totalTransaksi} Job</div>
                <div className="summary-change change-positive"><ShoppingCart size={16} /> Total Pesanan Masuk</div>
                <ShoppingCart className="summary-card-icon" size={32} />
              </div>

              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.6s' }}>
                <div className="summary-title">Piutang Berjalan</div>
                <div className="summary-value" style={{ fontSize: '1.75rem' }}>{formatRupiah(piutangBerjalan)}</div>
                <div className="summary-change change-negative"><TrendingUp size={16} style={{ transform: 'scaleY(-1)' }} /> Sisa Pembayaran</div>
                <CreditCard className="summary-card-icon" size={32} />
              </div>

              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.65s', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} onClick={() => openModal('Daftar Transaksi: Lunas', lunasTx)} title="Klik untuk melihat detail">
                <div className="summary-title">Status: Lunas</div>
                <div className="summary-value" style={{ fontSize: '1.4rem', color: '#34d399' }}>{formatRupiah(lunasValue)}</div>
                <div className="summary-change" style={{ color: '#34d399' }}>{lunasCount} Transaksi Selesai</div>
                <CheckCircle className="summary-card-icon" size={32} />
              </div>
              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.7s', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} onClick={() => openModal('Daftar Transaksi: DP', dpTx)} title="Klik untuk melihat detail">
                <div className="summary-title">Status: DP</div>
                <div className="summary-value" style={{ fontSize: '1.4rem', color: '#fbbf24' }}>{formatRupiah(dpValue)}</div>
                <div className="summary-change" style={{ color: '#fbbf24' }}>{dpCount} Transaksi Berjalan</div>
                <Clock className="summary-card-icon" size={32} />
              </div>
              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.75s', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} onClick={() => openModal('Daftar Transaksi: Belum Lunas', belumLunasTx)} title="Klik untuk melihat detail">
                <div className="summary-title">Status: Belum Lunas</div>
                <div className="summary-value" style={{ fontSize: '1.4rem', color: '#f87171' }}>{formatRupiah(belumLunasValue)}</div>
                <div className="summary-change" style={{ color: '#f87171' }}>{belumLunasCount} Transaksi Menunggu</div>
                <XCircle className="summary-card-icon" size={32} />
              </div>
            </div>
          </div>

          <div className="chart-card glass-panel animate-stagger" style={{ marginBottom: '2rem', animationDelay: '0.8s' }}>
            <div className="chart-header"><TrendingUp size={20} className="text-primary" /> Arus Kas (Pemasukan vs Pengeluaran)</div>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <LineChart data={dataSales} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" tickFormatter={(v) => `Rp${(v / 1000000).toFixed(1)}M`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--overlay-border)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}
                    itemStyle={{ color: 'var(--text-main)' }}
                    formatter={(value) => formatRupiah(value)}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="pemasukan" name="Total Pemasukan" stroke="#34d399" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="pengeluaran" name="Total Pengeluaran" stroke="#f87171" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card glass-panel animate-stagger" style={{ animationDelay: '0.85s' }}>
              <div className="chart-header"><TrendingUp size={20} className="text-primary" /> Growth Sales (Laba Bersih)</div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={dataSales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" tickFormatter={(v) => `Rp${(v / 1000000).toFixed(1)}M`} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}
                      itemStyle={{ color: 'var(--text-main)' }}
                      formatter={(value) => formatRupiah(value)}
                    />
                    <Area type="monotone" dataKey="total" stroke="var(--primary)" fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card glass-panel animate-stagger" style={{ animationDelay: '0.9s' }}>
              <div className="chart-header"><PieChartIcon size={20} className="text-primary" /> Produk Paling Laris</div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={topProducts} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {topProducts.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}
                      itemStyle={{ color: 'var(--text-main)' }}
                      formatter={(value, name, props) => {
                         const percent = props.payload.payload?.percentage || 0;
                         return [`${value} Transaksi (${percent}%)`, name];
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="chart-card glass-panel animate-stagger" style={{ marginTop: '2rem', animationDelay: '0.95s' }}>
            <div className="chart-header"><TrendingUp size={20} className="text-primary" /> Kontribusi Penjualan Berdasarkan Produk</div>
            {topRevenueProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data penjualan</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {topRevenueProducts.map((prod, index) => (
                  <div key={index} style={{ background: 'var(--overlay-dark)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-main)' }}>{prod.name}</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{formatRupiah(prod.revenue)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Menyumbang {prod.percentage}% dari total sales</div>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--overlay-bg-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${prod.percentage}%`, background: 'var(--primary)', borderRadius: '4px', transition: 'width 1s ease-in-out' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Transaction Details Modal */}
      {modal.isOpen && (
        <div className="modal-backdrop" onClick={closeModal} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay-darker)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-main)', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', borderRadius: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{modal.title}</h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex' }}>
                <X size={24} />
              </button>
            </div>
            
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--overlay-bg-hover)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>Tanggal Acara</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>Nama Klien</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>Produk / Vendor</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid var(--border-glass)' }}>Total Harga</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid var(--border-glass)' }}>DP Dibayar</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid var(--border-glass)' }}>Sisa Piutang</th>
                  </tr>
                </thead>
                <tbody>
                  {modal.data.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Tidak ada transaksi</td>
                    </tr>
                  ) : (
                    modal.data.map(tx => {
                      const price = Number(tx.productPrice) || 0;
                      const dp = Number(tx.dp) || 0;
                      const sisa = Math.max(0, price - dp);
                      return (
                        <tr key={tx.id} style={{ borderBottom: '1px solid var(--overlay-bg-hover)' }}>
                          <td style={{ padding: '0.75rem', color: 'var(--text-main)' }}>{tx.dDayDate ? new Date(tx.dDayDate).toLocaleDateString('id-ID') : '-'}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-main)' }}>{tx.clientName}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-main)' }}>{tx.productName}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'right' }}>{formatRupiah(price)}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-main)', textAlign: 'right' }}>{formatRupiah(dp)}</td>
                          <td style={{ padding: '0.75rem', color: sisa > 0 ? '#f87171' : 'var(--text-main)', textAlign: 'right', fontWeight: sisa > 0 ? 'bold' : 'normal' }}>
                            {formatRupiah(sisa)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={closeModal} style={{ padding: '0.5rem 1.5rem' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
