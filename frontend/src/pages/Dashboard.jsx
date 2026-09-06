import React, { useMemo } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  CreditCard,
  TrendingUp,
  PieChart as PieChartIcon,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { 
  AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === '') return 'Rp.0';
  return 'Rp.' + Number(number).toLocaleString('id-ID');
};

const Dashboard = ({ category }) => {

  const { 
    totalPendapatan, totalTransaksi, piutangBerjalan,
    lunasCount, dpCount, belumLunasCount,
    topProducts, topRevenueProducts, dataSales 
  } = useMemo(() => {
    const weddingTx = JSON.parse(localStorage.getItem('transaksi_wedding') || '[]');
    const studioTx = JSON.parse(localStorage.getItem('transaksi_studio') || '[]');

    let transactions = [];
    if (category === 'Wedding') transactions = weddingTx;
    else if (category === 'Studio') transactions = studioTx;
    else transactions = [...weddingTx, ...studioTx];

    let tPend = 0;
    let piutang = 0;
    let lunas = 0;
    let dp = 0;
    let blm = 0;
    const prodCounts = {};
    const prodRevenues = {};

    transactions.forEach(tx => {
      const price = Number(tx.productPrice) || 0;
      const dpVal = Number(tx.dp) || 0;
      const sisa = Math.max(0, price - dpVal);

      tPend += price;
      piutang += sisa;

      if (dpVal === 0) blm++;
      else if (dpVal >= price) lunas++;
      else dp++;

      if (tx.productName) {
        prodCounts[tx.productName] = (prodCounts[tx.productName] || 0) + 1;
        prodRevenues[tx.productName] = (prodRevenues[tx.productName] || 0) + price;
      }
    });

    const tProd = Object.entries(prodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    const tRev = Object.entries(prodRevenues)
      .sort((a, b) => b[1] - a[1])
      .map(([name, revenue]) => ({
        name,
        revenue,
        percentage: tPend > 0 ? ((revenue / tPend) * 100).toFixed(1) : 0
      }));

    // Mock historical data for the area chart to look good, ending with actual current revenue
    const mockSales = [
      { name: 'Bulan 1', total: tPend * 0.4 },
      { name: 'Bulan 2', total: tPend * 0.6 },
      { name: 'Bulan 3', total: tPend * 0.5 },
      { name: 'Bulan 4', total: tPend * 0.8 },
      { name: 'Bulan 5', total: tPend * 0.7 },
      { name: 'Bulan 6', total: tPend },
    ];

    return {
      totalPendapatan: tPend,
      totalTransaksi: transactions.length,
      piutangBerjalan: piutang,
      lunasCount: lunas,
      dpCount: dp,
      belumLunasCount: blm,
      topProducts: tProd.length ? tProd : [{ name: 'Belum ada data', value: 1 }],
      topRevenueProducts: tRev,
      dataSales: mockSales
    };
  }, [category]);

  const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard {category}</h1>
        <p className="page-subtitle">Ringkasan performa bisnis dan penjualan</p>
      </div>

      <div className="summary-grid">
        <div className="summary-card glass-card">
          <div className="summary-title">Total Pendapatan</div>
          <div className="summary-value" style={{ fontSize: '1.75rem' }}>{formatRupiah(totalPendapatan)}</div>
          <div className="summary-change change-positive">
            <TrendingUp size={16} /> Data Real-time
          </div>
          <DollarSign className="summary-card-icon" size={48} />
        </div>

        <div className="summary-card glass-card">
          <div className="summary-title">Total Transaksi</div>
          <div className="summary-value" style={{ fontSize: '1.75rem' }}>{totalTransaksi} Job</div>
          <div className="summary-change change-positive">
            <TrendingUp size={16} /> Total Pesanan Masuk
          </div>
          <ShoppingCart className="summary-card-icon" size={48} />
        </div>

        <div className="summary-card glass-card">
          <div className="summary-title">Piutang Berjalan</div>
          <div className="summary-value" style={{ fontSize: '1.75rem' }}>{formatRupiah(piutangBerjalan)}</div>
          <div className="summary-change change-negative">
            <TrendingUp size={16} style={{transform: 'scaleY(-1)'}} /> Sisa Pembayaran
          </div>
          <CreditCard className="summary-card-icon" size={48} />
        </div>

        <div className="summary-card glass-card">
          <div className="summary-title">Status: Lunas</div>
          <div className="summary-value" style={{ fontSize: '1.75rem', color: '#34d399' }}>{lunasCount} Transaksi</div>
          <div className="summary-change" style={{ color: '#34d399' }}>Pembayaran Penuh</div>
          <CheckCircle className="summary-card-icon" size={48} />
        </div>

        <div className="summary-card glass-card">
          <div className="summary-title">Status: DP</div>
          <div className="summary-value" style={{ fontSize: '1.75rem', color: '#fbbf24' }}>{dpCount} Transaksi</div>
          <div className="summary-change" style={{ color: '#fbbf24' }}>Uang Muka Diterima</div>
          <Clock className="summary-card-icon" size={48} />
        </div>

        <div className="summary-card glass-card">
          <div className="summary-title">Status: Belum Lunas</div>
          <div className="summary-value" style={{ fontSize: '1.75rem', color: '#f87171' }}>{belumLunasCount} Transaksi</div>
          <div className="summary-change" style={{ color: '#f87171' }}>Menunggu Pembayaran</div>
          <XCircle className="summary-card-icon" size={48} />
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card glass-panel">
          <div className="chart-header">
            <TrendingUp size={20} className="text-primary" />
            Kurva Penjualan (Ilustrasi 6 Bulan Terakhir)
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={dataSales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" tickFormatter={(value) => `Rp${value/1000000}M`} />
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

        <div className="chart-card glass-panel">
          <div className="chart-header">
            <PieChartIcon size={20} className="text-primary" />
            Produk Paling Laris
          </div>
          <div style={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topProducts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}
                  itemStyle={{ color: 'var(--text-main)' }}
                  formatter={(value, name) => [`${value} Transaksi`, name]}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="chart-card glass-panel" style={{ marginTop: '2rem' }}>
        <div className="chart-header">
          <TrendingUp size={20} className="text-primary" />
          Kontribusi Penjualan Berdasarkan Produk
        </div>
        
        {topRevenueProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data penjualan</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {topRevenueProducts.map((prod, index) => (
              <div key={index} style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-main)' }}>{prod.name}</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{formatRupiah(prod.revenue)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Menyumbang {prod.percentage}% dari total sales</div>
                  </div>
                </div>
                
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${prod.percentage}%`, 
                    background: 'var(--primary)',
                    borderRadius: '4px',
                    transition: 'width 1s ease-in-out'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
