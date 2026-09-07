import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ text = "Memuat data...", fullScreen = false }) => {
  const content = (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem', color: 'var(--primary)' }}>
      <Loader2 size={36} className="animate-spin" />
      <span className="animate-pulse" style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)' }}>{text}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{ display: 'flex', minHeight: '50vh', alignItems: 'center', justifyContent: 'center' }}>
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
