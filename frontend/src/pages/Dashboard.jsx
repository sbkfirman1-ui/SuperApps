import React, { useState, useEffect } from 'react';
import Loader from '../components/Loader';
import { 
  DollarSign, ShoppingCart, CreditCard, TrendingUp,
  PieChart as PieChartIcon, CheckCircle, Clock, XCircle, Calendar, Filter, X, RotateCcw
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

const getSavedFilter = (cat) => {
  try {
    const saved = localStorage.getItem(`dashboard_filter_${cat}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.startDate && parsed.endDate && parsed.isFilterApplied) {
        return {
          startDate: parsed.startDate,
          endDate: parsed.endDate,
          isFilterApplied: true
        };
      }
    }
  } catch (e) {
    console.error("Error reading saved dashboard filter:", e);
  }
  return { startDate: '', endDate: '', isFilterApplied: false };
};

const Dashboard = ({ category }) => {
  const storageKey = `dashboard_filter_${category}`;

  const [startDate, setStartDate] = useState(() => getSavedFilter(category).startDate);
  const [endDate, setEndDate] = useState(() => getSavedFilter(category).endDate);
  const [isFilterApplied, setIsFilterApplied] = useState(() => getSavedFilter(category).isFilterApplied);
  const [appliedStartDate, setAppliedStartDate] = useState(() => getSavedFilter(category).startDate);
  const [appliedEndDate, setAppliedEndDate] = useState(() => getSavedFilter(category).endDate);
  const [filterTrigger, setFilterTrigger] = useState(0);

  useEffect(() => {
    const saved = getSavedFilter(category);
    setStartDate(saved.startDate);
    setEndDate(saved.endDate);
    setIsFilterApplied(saved.isFilterApplied);
    setAppliedStartDate(saved.startDate);
    setAppliedEndDate(saved.endDate);
  }, [category]);

  const [stats, setStats] = useState({
    totalPendapatan: 0, totalTransaksi: 0, piutangBerjalan: 0,
    lunasCount: 0, lunasValue: 0, lunasTx: [],
    dpCount: 0, dpValue: 0, dpTx: [],
    belumLunasCount: 0, belumLunasValue: 0, belumLunasTx: [],
    topProducts: [], topRevenueProducts: [], dataSales: [],
    cashFlowSaldo: 0,
    labaBersihTotal: 0, netMarginTotal: 0
  });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, title: '', data: [] });
  const [financeCategories, setFinanceCategories] = useState([]);

  const openModal = (title, data) => setModal({ isOpen: true, title, data });
  const closeModal = () => setModal({ ...modal, isOpen: false });



  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      
      let queryTx = supabase.from('transactions').select('*');
      if (category === 'Wedding') queryTx = queryTx.eq('category', 'Wedding');
      else if (category === 'Studio') queryTx = queryTx.eq('category', 'Studio');

      let queryFin = supabase.from('finance').select('*');
      if (category === 'Wedding') queryFin = queryFin.eq('category', 'Wedding');
      else if (category === 'Studio') queryFin = queryFin.eq('category', 'Studio');

      if (isFilterApplied && appliedStartDate && appliedEndDate) {
        queryTx = queryTx.gte('dDayDate', appliedStartDate).lte('dDayDate', appliedEndDate);
        queryFin = queryFin.gte('tanggal', appliedStartDate).lte('tanggal', appliedEndDate);
      }

      let queryCats = supabase.from('finance_categories').select('*').order('id', { ascending: true });

      const [txRes, finRes, catRes] = await Promise.all([queryTx, queryFin, queryCats]);
      const transactions = txRes.data || [];
      const financeData = finRes.data || [];
      const cats = catRes.data || [];

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

      // Calculate Transaction Stats
      let tPend = 0, piutang = 0;
      let lunas = 0, dp = 0, blm = 0;
      let lunasVal = 0, dpValTotal = 0, blmVal = 0;
      const lunasArr = [], dpArr = [], blmArr = [];
      
      const prodCounts = {}, prodRevenues = {};
      const monthlyTxData = {};

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

        const dateString = tx.dDayDate || tx.tglBooking || tx.created_at;
        if (dateString) {
          const date = new Date(dateString);
          if (!isNaN(date)) {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const key = `${yyyy}-${mm}`;
            if (!monthlyTxData[key]) {
              monthlyTxData[key] = { pendapatan: 0, jumlahJob: 0 };
            }
            monthlyTxData[key].pendapatan += price;
            monthlyTxData[key].jumlahJob += 1;
          }
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

      const sortedTxMonths = Object.keys(monthlyTxData).sort();
      const chartTxData = sortedTxMonths.map(key => {
        const data = monthlyTxData[key];
        const [y, m] = key.split('-');
        const label = `${MONTHS[parseInt(m) - 1]} ${y}`;
        return { name: label, pendapatan: data.pendapatan, jumlahJob: data.jumlahJob };
      });
      if (chartTxData.length === 0) {
        chartTxData.push({ name: 'Belum ada data', pendapatan: 0, jumlahJob: 0 });
      }

      // Calculate Finance Stats
      let totalPemasukan = 0;
      let totalPengeluaran = 0;
      let totalTransfer = 0;
      let totalCash = 0;
      let totalTransferOut = 0;
      let totalCashOut = 0;
      
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
        const isPengeluaran = f.jenis === 'Pengeluaran';
        
        if (ket.startsWith('[Cash] ')) {
          if (isPemasukan) totalCash += nom;
          if (isPengeluaran) totalCashOut += nom;
        } else {
          // Default to transfer for older records and explicitly marked ones
          if (isPemasukan) totalTransfer += nom;
          if (isPengeluaran) totalTransferOut += nom;
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
           if (category === 'Wedding' && lowerName.includes('studio')) includePendapatan = false;
           if (category === 'Studio' && lowerName.includes('wedding')) includePendapatan = false;
        }

        if (group === 'Pendapatan' && includePendapatan) totalPendapatanFinance += nom;
        else if (group === 'COGS') totalBebanOpFinance += nom;
        else if (group === 'Fixed Cost') totalBebanTetapFinance += nom;
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

        if (group === 'Pendapatan' && includePendapatan) monthlyData[key].pendapatan += nom;
        else if (group === 'COGS') monthlyData[key].bebanOp += nom;
        else if (group === 'Fixed Cost') monthlyData[key].bebanTetap += nom;
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
        dataTransaksiKurva: chartTxData,
        dataSales: chartData,
        cashFlowSaldo,
        labaBersihTotal,
        netMarginTotal,
        totalTransfer,
        totalCash,
        totalTransferOut,
        totalCashOut,
        totalPemasukan,
        totalPengeluaran
      });
      setLoading(false);
    };
    fetchStats();
  }, [category, filterTrigger, isFilterApplied, appliedStartDate, appliedEndDate]);

  const handleApplyFilter = () => {
    if (startDate && endDate) {
      if (startDate > endDate) {
        alert('Tanggal mulai tidak boleh lebih besar dari tanggal sampai!');
        return;
      }
      setIsFilterApplied(true);
      setAppliedStartDate(startDate);
      setAppliedEndDate(endDate);
      localStorage.setItem(storageKey, JSON.stringify({
        startDate,
        endDate,
        isFilterApplied: true
      }));
      setFilterTrigger(prev => prev + 1);
    }
  };

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setIsFilterApplied(false);
    setAppliedStartDate('');
    setAppliedEndDate('');
    localStorage.removeItem(storageKey);
    setFilterTrigger(prev => prev + 1);
  };

  const COLORS = ['var(--text-primary)', 'var(--text-success)', 'var(--text-warning)', 'var(--text-danger)', '#a78bfa'];
  const { totalPendapatan, totalTransaksi, piutangBerjalan, lunasCount, lunasValue, lunasTx, dpCount, dpValue, dpTx, belumLunasCount, belumLunasValue, belumLunasTx, topProducts, topRevenueProducts, dataTransaksiKurva, dataSales, cashFlowSaldo, totalTransfer, totalCash, totalTransferOut, totalCashOut, totalPemasukan, totalPengeluaran, labaBersihTotal, netMarginTotal } = stats;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Dashboard {category}</h1>
            {isFilterApplied && appliedStartDate && appliedEndDate && (
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 600, 
                padding: '0.2rem 0.65rem', 
                borderRadius: '9999px', 
                backgroundColor: 'rgba(14, 165, 233, 0.12)', 
                color: '#38bdf8', 
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <Filter size={12} /> Filter Aktif: {appliedStartDate} s/d {appliedEndDate}
              </span>
            )}
          </div>
          <p className="page-subtitle">Ringkasan performa bisnis dan penjualan</p>
        </div>
        
        {/* Date Filter UI */}
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mulai (Tgl Acara)</label>
            <input 
              type="date" 
              className="form-control" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              style={{ padding: '0.4rem', fontSize: '0.9rem' }} 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sampai (Tgl Acara)</label>
            <input 
              type="date" 
              className="form-control" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              style={{ padding: '0.4rem', fontSize: '0.9rem' }} 
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleApplyFilter} 
              disabled={!startDate || !endDate} 
              style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Filter size={14} /> Terapkan
            </button>
            <button 
              className="btn" 
              onClick={handleResetFilter} 
              disabled={!isFilterApplied && !startDate && !endDate}
              style={{ 
                padding: '0.4rem 1rem', 
                background: isFilterApplied 
                  ? 'rgba(239, 68, 68, 0.15)' 
                  : (startDate || endDate ? 'var(--overlay-border)' : 'transparent'),
                color: isFilterApplied 
                  ? '#ef4444' 
                  : (startDate || endDate ? 'var(--text-main)' : 'var(--text-muted)'),
                border: isFilterApplied 
                  ? '1px solid rgba(239, 68, 68, 0.3)' 
                  : '1px solid var(--border-glass)',
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.35rem',
                cursor: (!isFilterApplied && !startDate && !endDate) ? 'not-allowed' : 'pointer',
                opacity: (!isFilterApplied && !startDate && !endDate) ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
              title="Reset Filter"
            >
              <RotateCcw size={14} /> Reset Filter
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <Loader text="Memuat data dari database..." />
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
                <div className="summary-value" style={{ fontSize: '1.4rem', color: (netMarginTotal || 0) >= 15 ? 'var(--text-success)' : 'var(--text-danger)' }}>
                  {formatRupiah(labaBersihTotal)} ({(netMarginTotal || 0).toFixed(1)}%)
                </div>
                <div className="summary-change" style={{ color: (netMarginTotal || 0) >= 15 ? 'var(--text-success)' : 'var(--text-danger)' }}>
                  <TrendingUp size={16} style={{ transform: (netMarginTotal || 0) < 15 ? 'scaleY(-1)' : 'none' }} /> 
                  Target 15%
                </div>
                <PieChartIcon className="summary-card-icon" size={32} style={{ opacity: 0.2 }} />
              </div>
              
              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.2s' }}>
                <div className="summary-title">Cash Flow (Sisa Saldo)</div>
                <div className="summary-value" style={{ fontSize: '1.75rem', color: cashFlowSaldo >= 0 ? 'var(--text-success)' : 'var(--text-danger)' }}>
                  {formatRupiah(cashFlowSaldo)}
                </div>
                <div className="summary-change" style={{ color: cashFlowSaldo >= 0 ? 'var(--text-success)' : 'var(--text-danger)' }}>
                  <TrendingUp size={16} style={{ transform: cashFlowSaldo < 0 ? 'scaleY(-1)' : 'none' }} /> 
                  {isFilterApplied ? 'Bulan Terpilih' : 'Total Saldo Finance'}
                </div>
                <CreditCard className="summary-card-icon" size={32} style={{ opacity: 0.2 }} />
              </div>

              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.25s' }}>
                <div className="summary-title">Total Pemasukan (Finance)</div>
                <div className="summary-value" style={{ fontSize: '1.75rem', color: 'var(--text-success)' }}>
                  {formatRupiah(totalPemasukan)}
                </div>
                <div className="summary-change change-positive">
                  <TrendingUp size={16} /> Total Dana Masuk
                </div>
                <DollarSign className="summary-card-icon" size={32} style={{ opacity: 0.2 }} />
              </div>

              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.3s' }}>
                <div className="summary-title">Total Pengeluaran (Finance)</div>
                <div className="summary-value" style={{ fontSize: '1.75rem', color: 'var(--text-danger)' }}>
                  {formatRupiah(totalPengeluaran)}
                </div>
                <div className="summary-change change-negative">
                  <TrendingUp size={16} style={{ transform: 'scaleY(-1)' }} /> Total Dana Keluar
                </div>
                <CreditCard className="summary-card-icon" size={32} style={{ opacity: 0.2 }} />
              </div>

              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.35s' }}>
                <div className="summary-title">Total Uang Transfer (Pemasukan)</div>
                <div className="summary-value" style={{ fontSize: '1.75rem', color: totalTransfer >= 0 ? '#3b82f6' : 'var(--text-danger)' }}>
                  {formatRupiah(totalTransfer)}
                </div>
                <div className="summary-change" style={{ color: totalTransfer >= 0 ? '#3b82f6' : 'var(--text-danger)' }}>
                  <TrendingUp size={16} style={{ transform: totalTransfer < 0 ? 'scaleY(-1)' : 'none' }} /> 
                  Pemasukan Transfer
                </div>
                <CreditCard className="summary-card-icon" size={32} style={{ opacity: 0.2 }} />
              </div>

              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.4s' }}>
                <div className="summary-title">Total Uang Cash (Pemasukan)</div>
                <div className="summary-value" style={{ fontSize: '1.75rem', color: totalCash >= 0 ? '#10b981' : 'var(--text-danger)' }}>
                  {formatRupiah(totalCash)}
                </div>
                <div className="summary-change" style={{ color: totalCash >= 0 ? '#10b981' : 'var(--text-danger)' }}>
                  <TrendingUp size={16} style={{ transform: totalCash < 0 ? 'scaleY(-1)' : 'none' }} /> 
                  Pemasukan Tunai
                </div>
                <DollarSign className="summary-card-icon" size={32} style={{ opacity: 0.2 }} />
              </div>

              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.45s' }}>
                <div className="summary-title">Total Uang Transfer (Pengeluaran)</div>
                <div className="summary-value" style={{ fontSize: '1.75rem', color: 'var(--text-danger)' }}>
                  {formatRupiah(totalTransferOut)}
                </div>
                <div className="summary-change change-negative">
                  <TrendingUp size={16} style={{ transform: 'scaleY(-1)' }} /> 
                  Pengeluaran Transfer
                </div>
                <CreditCard className="summary-card-icon" size={32} style={{ opacity: 0.2 }} />
              </div>

              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.5s' }}>
                <div className="summary-title">Total Uang Cash (Pengeluaran)</div>
                <div className="summary-value" style={{ fontSize: '1.75rem', color: 'var(--text-danger)' }}>
                  {formatRupiah(totalCashOut)}
                </div>
                <div className="summary-change change-negative">
                  <TrendingUp size={16} style={{ transform: 'scaleY(-1)' }} /> 
                  Pengeluaran Tunai
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
                <div className="summary-value" style={{ fontSize: '1.4rem', color: 'var(--text-success)' }}>{formatRupiah(lunasValue)}</div>
                <div className="summary-change" style={{ color: 'var(--text-success)' }}>{lunasCount} Transaksi Selesai</div>
                <CheckCircle className="summary-card-icon" size={32} />
              </div>
              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.7s', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} onClick={() => openModal('Daftar Transaksi: DP', dpTx)} title="Klik untuk melihat detail">
                <div className="summary-title">Status: DP</div>
                <div className="summary-value" style={{ fontSize: '1.4rem', color: 'var(--text-warning)' }}>{formatRupiah(dpValue)}</div>
                <div className="summary-change" style={{ color: 'var(--text-warning)' }}>{dpCount} Transaksi Berjalan</div>
                <Clock className="summary-card-icon" size={32} />
              </div>
              <div className="summary-card glass-card animate-stagger" style={{ animationDelay: '0.75s', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} onClick={() => openModal('Daftar Transaksi: Belum Lunas', belumLunasTx)} title="Klik untuk melihat detail">
                <div className="summary-title">Status: Belum Lunas</div>
                <div className="summary-value" style={{ fontSize: '1.4rem', color: 'var(--text-danger)' }}>{formatRupiah(belumLunasValue)}</div>
                <div className="summary-change" style={{ color: 'var(--text-danger)' }}>{belumLunasCount} Transaksi Menunggu</div>
                <XCircle className="summary-card-icon" size={32} />
              </div>
            </div>
            
            {/* NEW CHART: Tren Pendapatan Transaksi */}
            <div className="chart-card glass-panel animate-stagger" style={{ marginTop: '2rem', animationDelay: '0.8s' }}>
              <div className="chart-header"><TrendingUp size={20} className="text-primary" /> Kurva Tren Pendapatan (Berdasarkan Transaksi)</div>
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <AreaChart data={dataTransaksiKurva || []} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--text-primary)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--text-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" width={70} tickFormatter={(v) => `Rp${(v / 1000000).toFixed(1)}M`} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--overlay-border)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}
                      itemStyle={{ color: 'var(--text-main)' }}
                      formatter={(value, name) => {
                        if (name === 'pendapatan') return [formatRupiah(value), 'Total Pendapatan'];
                        return [value, name];
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Area type="monotone" dataKey="pendapatan" name="Pendapatan Transaksi" stroke="var(--text-primary)" fillOpacity={1} fill="url(#colorPendapatan)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="chart-card glass-panel animate-stagger" style={{ marginBottom: '2rem', animationDelay: '0.85s' }}>
            <div className="chart-header"><TrendingUp size={20} className="text-primary" /> Arus Kas (Pemasukan vs Pengeluaran)</div>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <LineChart data={dataSales} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" width={70} tickFormatter={(v) => `Rp${(v / 1000000).toFixed(1)}M`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--overlay-border)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}
                    itemStyle={{ color: 'var(--text-main)' }}
                    formatter={(value) => formatRupiah(value)}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="pemasukan" name="Total Pemasukan" stroke="var(--text-success)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="pengeluaran" name="Total Pengeluaran" stroke="var(--text-danger)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card glass-panel animate-stagger" style={{ animationDelay: '0.85s' }}>
              <div className="chart-header"><TrendingUp size={20} className="text-primary" /> Growth Sales (Net Profit / Laba Bersih)</div>
              <div style={{ width: '100%', height: 380 }}>
                <ResponsiveContainer>
                  <AreaChart data={dataSales} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" width={70} tickFormatter={(v) => `Rp${(v / 1000000).toFixed(1)}M`} />
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
              <div style={{ width: '100%', height: 380 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie 
                      data={topProducts} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={30} 
                      outerRadius={75} 
                      paddingAngle={5} 
                      dataKey="value" 
                      stroke="none"
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        if (percent < 0.05) return null;
                        return (
                          <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                    >
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
                    <Legend 
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      wrapperStyle={{ fontSize: '11px', lineHeight: '20px', width: '50%', right: 0 }} 
                    />
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
                          <td style={{ padding: '0.75rem', color: sisa > 0 ? 'var(--text-danger)' : 'var(--text-main)', textAlign: 'right', fontWeight: sisa > 0 ? 'bold' : 'normal' }}>
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
