import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon, Clock, User, Phone, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

const CustomSelect = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label;

  return (
    <div style={{ position: 'relative' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between',
          padding: '0.5rem 1rem', border: '1px solid var(--border-glass)', 
          background: 'var(--surface-dark)', borderRadius: '0.5rem',
          cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', minWidth: '120px'
        }}
      >
        {selectedLabel}
        <ChevronDown size={16} />
      </div>

      {isOpen && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
            onClick={() => setIsOpen(false)} 
          />
          <div style={{ 
            position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)',
            borderRadius: '0.5rem', padding: '0.5rem', zIndex: 50,
            maxHeight: '300px', overflowY: 'auto', minWidth: '100%',
            boxShadow: '0 10px 25px -5px var(--overlay-darker)'
          }}>
            {options.map(o => (
              <div 
                key={o.value}
                onClick={() => { onChange(o.value); setIsOpen(false); }}
                style={{
                  padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '0.3rem',
                  background: o.value === value ? 'var(--primary)' : 'transparent',
                  color: o.value === value ? '#fff' : 'var(--text-main)',
                  transition: 'background 0.2s',
                  marginBottom: '0.1rem',
                  fontSize: '0.95rem'
                }}
                onMouseEnter={e => { if (o.value !== value) e.target.style.background = 'var(--overlay-bg-hover)' }}
                onMouseLeave={e => { if (o.value !== value) e.target.style.background = 'transparent' }}
              >
                {o.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const JobLaki = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [jobs, setJobs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .not('dDayDate', 'is', null);

      if (!error && data) {
        setJobs(data.filter(j => j.dDayDate));
      }
    };
    fetchJobs();
  }, []);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  // Group jobs by date string YYYY-MM-DD
  const jobsByDate = jobs.reduce((acc, job) => {
    if (!acc[job.dDayDate]) acc[job.dDayDate] = [];
    acc[job.dDayDate].push(job);
    return acc;
  }, {});

  const renderCells = () => {
    const cells = [];
    // Blank cells before 1st day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`blank-${i}`} className="calendar-cell empty" style={{ background: 'var(--overlay-bg)', border: '1px solid var(--border-glass)', minHeight: '100px' }}></div>);
    }

    // Days in month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayJobs = jobsByDate[dateStr] || [];
      const isToday = new Date().toISOString().split('T')[0] === dateStr;
      const isSelected = selectedDate === dateStr;

      cells.push(
        <div 
          key={d} 
          onClick={() => setSelectedDate(dateStr)}
          style={{ 
            background: isSelected ? 'var(--overlay-light)' : 'var(--surface-dark)', 
            border: `1px solid ${isSelected ? '#60a5fa' : 'var(--border-glass)'}`, 
            minHeight: '120px', 
            padding: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
          onMouseEnter={(e) => {
            if (!isSelected) e.currentTarget.style.background = 'var(--overlay-bg-hover)';
          }}
          onMouseLeave={(e) => {
            if (!isSelected) e.currentTarget.style.background = 'var(--surface-dark)';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              fontSize: '0.9rem',
              fontWeight: isToday ? 'bold' : 'normal',
              background: isToday ? 'var(--primary)' : 'transparent',
              color: isToday ? '#fff' : 'var(--text-main)'
            }}>
              {d}
            </span>
            {dayJobs.length > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--overlay-border)', padding: '0.1rem 0.4rem', borderRadius: '1rem' }}>
                {dayJobs.length} Job
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto' }}>
            {dayJobs.slice(0, 3).map(job => (
              <div key={job.id} style={{ 
                fontSize: '0.75rem', 
                padding: '0.2rem 0.4rem', 
                borderRadius: '0.25rem', 
                background: job.category === 'Wedding' ? 'var(--accent-wedding-bg)' : 'var(--success-bg)',
                color: job.category === 'Wedding' ? '#f472b6' : '#34d399',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {job.clientName || 'Klien'}
              </div>
            ))}
            {dayJobs.length > 3 && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                +{dayJobs.length - 3} lainnya
              </div>
            )}
          </div>
        </div>
      );
    }
    return cells;
  };

  const selectedJobs = selectedDate ? jobsByDate[selectedDate] || [] : [];

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Job Laki</h1>
          <p className="page-subtitle">Kalender Jadwal Transaksi / Hari H</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn" onClick={prevMonth} style={{ background: 'var(--surface-dark)', padding: '0.5rem' }}><ChevronLeft size={20} /></button>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <CustomSelect 
              value={month}
              options={monthNames.map((name, i) => ({ label: name, value: i }))}
              onChange={(val) => setCurrentDate(new Date(year, val, 1))}
            />
            
            <CustomSelect 
              value={year}
              options={Array.from({length: 10}, (_, i) => {
                const y = new Date().getFullYear() - 5 + i;
                return { label: y.toString(), value: y };
              })}
              onChange={(val) => setCurrentDate(new Date(val, month, 1))}
            />
          </div>

          <button className="btn" onClick={nextMonth} style={{ background: 'var(--surface-dark)', padding: '0.5rem' }}><ChevronRight size={20} /></button>
          <button className="btn btn-primary" onClick={goToToday} style={{ padding: '0.5rem 1rem', marginLeft: '1rem' }}>Hari Ini</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Calendar Grid */}
        <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {dayNames.map(day => (
              <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                {day}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
            {renderCells()}
          </div>
        </div>

        {/* Selected Date Details Panel */}
        <div className="glass-panel" style={{ width: '350px', padding: '1.5rem', flexShrink: 0, position: 'sticky', top: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon size={18} className="text-primary" />
            {selectedDate ? new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Pilih Tanggal'}
          </h2>
          
          {!selectedDate ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0', fontStyle: 'italic' }}>
              Klik salah satu tanggal di kalender untuk melihat detail job.
            </div>
          ) : selectedJobs.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>
              <div style={{ display: 'inline-flex', background: 'var(--overlay-bg-hover)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                <Clock size={32} />
              </div>
              <p>Tidak ada jadwal job di hari ini.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              
              {/* WEDDING SECTION */}
              {selectedJobs.filter(j => j.category === 'Wedding').length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#f472b6', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--accent-wedding-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                    Wedding ({selectedJobs.filter(j => j.category === 'Wedding').length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedJobs.filter(j => j.category === 'Wedding').map(job => (
                      <div key={job.id} style={{ background: 'var(--input-bg)', borderLeft: '3px solid #ec4899', borderRadius: '0.3rem', padding: '1rem' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{job.clientName || 'Tanpa Nama'}</h3>
                        <div style={{ color: '#60a5fa', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: '500' }}>{job.productName}</div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {job.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={12} /> {job.phone}</div>}
                          {job.waktu && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={12} /> {job.waktu}</div>}
                          {job.tempat && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={12} /> {job.tempat}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STUDIO SECTION */}
              {selectedJobs.filter(j => j.category === 'Studio').length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#34d399', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--success-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                    Studio ({selectedJobs.filter(j => j.category === 'Studio').length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedJobs.filter(j => j.category === 'Studio').map(job => (
                      <div key={job.id} style={{ background: 'var(--input-bg)', borderLeft: '3px solid #10b981', borderRadius: '0.3rem', padding: '1rem' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{job.clientName || 'Tanpa Nama'}</h3>
                        <div style={{ color: '#60a5fa', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: '500' }}>{job.productName}</div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {job.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={12} /> {job.phone}</div>}
                          {job.waktu && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={12} /> {job.waktu}</div>}
                          {job.tempat && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={12} /> {job.tempat}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobLaki;
