import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FilePlus, DollarSign, Settings, Camera, Plus, Minus, Calculator, Calendar, Download, CheckCircle } from 'lucide-react';
import { customSwal } from '../utils/swal';

const Sidebar = () => {
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isHppOpen, setIsHppOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running in standalone / PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isInstalled) {
      customSwal.fire({
        title: 'Aplikasi Terpasang',
        text: 'Super Apps Lakiphoto sudah terpasang di perangkat Anda.',
        icon: 'success',
        confirmButtonText: 'Tutup'
      });
    } else {
      customSwal.fire({
        title: 'Unduh / Pasang Aplikasi',
        html: `
          <div style="text-align: left; font-size: 0.95rem; line-height: 1.6;">
            <p>Untuk mengunduh dan memasang di <b>Google Chrome</b>:</p>
            <ol style="padding-left: 1.2rem; margin: 0.5rem 0;">
              <li>Klik ikon <b>Unduh / Instal</b> di kolom alamat URL (Omnibox Chrome) pada layar komputer/laptop, atau</li>
              <li>Klik menu titik tiga <b>(⋮)</b> di pojok kanan atas Chrome.</li>
              <li>Pilih menu <b>"Instal Super Apps Lakiphoto"</b> atau <b>"Tambahkan ke Layar Utama"</b>.</li>
            </ol>
            <p style="margin-top: 0.5rem; color: #0ea5e9; font-weight: 500;">Aplikasi akan langsung muncul di Desktop atau Layar Ponsel dengan logo resmi Lakiphoto!</p>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'Saya Mengerti'
      });
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '1rem auto 2.5rem', textAlign: 'center', gap: '0.75rem' }}>
        <img 
          src="/logo.png" 
          onError={(e) => { 
            e.currentTarget.onerror = null; 
            e.currentTarget.src = '/icon-192x192.png'; 
          }}
          alt="Lakiphoto Logo" 
          style={{ height: '55px', objectFit: 'contain', background: 'white', padding: '0.2rem', borderRadius: '0.5rem' }} 
        />
        <div style={{ fontSize: '1.1rem', lineHeight: '1.2', color: 'var(--text-main)' }}>Data Base<br /><span style={{ color: '#0ea5e9', fontSize: '1.2rem', fontWeight: 'bold' }}>Lakiphoto</span></div>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <NavLink to="/job-laki" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Calendar size={20} /> Job Laki
        </NavLink>
        <NavLink to="/dashboard/wedding" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} /> Dashboard Wedding
        </NavLink>
        <NavLink to="/dashboard/studio" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} /> Dashboard Studio
        </NavLink>
        <NavLink to="/dashboard/konsolidasi" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} /> Dashboard Konsolidasi
        </NavLink>

        <div className="nav-group">
          <div className="nav-link-wrapper">
            <div className="nav-link" style={{ flex: 1, cursor: 'pointer', paddingRight: 0 }} onClick={() => setIsInputOpen(!isInputOpen)}>
              <FilePlus size={20} /> Input Transaksi
            </div>
            <button className="toggle-btn" onClick={(e) => { e.preventDefault(); setIsInputOpen(!isInputOpen); }}>
              {isInputOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>
          
          <div className={`sub-menu-container ${isInputOpen ? 'open' : ''}`}>
            <div className="sub-menu-inner" style={{ gap: '0.5rem' }}>
              <NavLink to="/input" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`}>
                Form Transaksi
              </NavLink>

              <div style={{ padding: '0.5rem 1rem 0.2rem', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Riwayat</div>
              <NavLink to="/data/wedding" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                Wedding
              </NavLink>
              <NavLink to="/data/studio" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                Studio
              </NavLink>
            </div>
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-link-wrapper">
            <div className="nav-link" style={{ flex: 1, cursor: 'pointer', paddingRight: 0 }} onClick={() => setIsFinanceOpen(!isFinanceOpen)}>
              <DollarSign size={20} /> Finance
            </div>
            <button className="toggle-btn" onClick={(e) => { e.preventDefault(); setIsFinanceOpen(!isFinanceOpen); }}>
              {isFinanceOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>
          
          <div className={`sub-menu-container ${isFinanceOpen ? 'open' : ''}`}>
            <div className="sub-menu-inner" style={{ gap: '0.5rem' }}>
              
              <NavLink to="/finance" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`}>
                Input Finance (Form)
              </NavLink>

              <div style={{ padding: '0.5rem 1rem 0.2rem', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Wedding</div>
              <NavLink to="/finance/wedding/data" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                Data Finance
              </NavLink>
              <NavLink to="/finance/wedding/pnl" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                PNL Wedding
              </NavLink>

              <div style={{ padding: '0.5rem 1rem 0.2rem', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Studio</div>
              <NavLink to="/finance/studio/data" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                Data Finance
              </NavLink>
              <NavLink to="/finance/studio/pnl" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                PNL Studio
              </NavLink>

            </div>
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-link-wrapper">
            <div className="nav-link" style={{ flex: 1, cursor: 'pointer', paddingRight: 0 }} onClick={() => setIsHppOpen(!isHppOpen)}>
              <Calculator size={20} /> HPP Laki
            </div>
            <button className="toggle-btn" onClick={(e) => { e.preventDefault(); setIsHppOpen(!isHppOpen); }}>
              {isHppOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>
          
          <div className={`sub-menu-container ${isHppOpen ? 'open' : ''}`}>
            <div className="sub-menu-inner" style={{ gap: '0.5rem' }}>
              
              <div style={{ padding: '0.2rem 1rem', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Wedding</div>
              <NavLink to="/hpp/wedding/bahan-baku" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                Bahan Baku Utama
              </NavLink>
              <NavLink to="/hpp/wedding/produk" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                HPP Produk
              </NavLink>
              <NavLink to="/hpp/wedding/price-book" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                Price Book Wedding
              </NavLink>

              <div style={{ padding: '0.5rem 1rem 0.2rem', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Studio</div>
              <NavLink to="/hpp/studio/bahan-baku" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                Bahan Baku Utama
              </NavLink>
              <NavLink to="/hpp/studio/produk" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                HPP Produk
              </NavLink>
              <NavLink to="/hpp/studio/price-book" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                Price Book Studio
              </NavLink>

            </div>
          </div>
        </div>

        <NavLink to="/setting" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Settings size={20} /> Setting
        </NavLink>

        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button 
            type="button"
            onClick={handleInstallClick} 
            className="nav-link" 
            style={{ 
              width: '100%', 
              background: deferredPrompt ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: deferredPrompt ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              color: deferredPrompt ? '#38bdf8' : 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            title={isInstalled ? "Aplikasi sudah terpasang" : "Unduh aplikasi ke desktop atau perangkat mobile"}
          >
            {isInstalled ? <CheckCircle size={18} color="#10b981" /> : <Download size={18} color="#0ea5e9" />}
            <span style={{ flex: 1, textAlign: 'left' }}>{isInstalled ? 'Aplikasi Terpasang' : 'Unduh Aplikasi'}</span>
            {!isInstalled && deferredPrompt && (
              <span style={{ 
                background: '#0ea5e9', 
                color: '#fff', 
                fontSize: '0.65rem', 
                fontWeight: 700, 
                padding: '0.15rem 0.4rem', 
                borderRadius: '0.25rem',
                textTransform: 'uppercase'
              }}>
                Install
              </span>
            )}
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
