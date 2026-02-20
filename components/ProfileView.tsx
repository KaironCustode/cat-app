'use client';

import { useState, useEffect } from 'react';
import { getProfile, updateProfile, exportAllData, clearAllData } from '@/lib/spark-storage';
import { UserProfile } from '@/lib/types';

export default function ProfileView() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [quitDate, setQuitDate] = useState('');
  const [whyIQuit, setWhyIQuit] = useState('');
  const [substanceHistory, setSubstanceHistory] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (p) {
      setProfile(p);
      setName(p.name);
      setQuitDate(p.quitDate);
      setWhyIQuit(p.whyIQuit);
      setSubstanceHistory(p.substanceHistory);
    }
  }, []);

  const handleSave = () => {
    const updated = updateProfile({ name, quitDate, whyIQuit, substanceHistory });
    if (updated) setProfile(updated);
    setEditing(false);
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spark-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    clearAllData();
    window.location.reload();
  };

  if (!profile) return null;

  return (
    <div className="container-app" style={{ paddingTop: '24px', paddingBottom: '100px' }}>
      <h1 className="text-heading" style={{ marginBottom: '24px' }}>Profile</h1>

      {!editing ? (
        <div className="animate-fadeIn">
          {/* Profile Info */}
          <div className="card-premium" style={{ padding: '20px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{profile.name}</h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
                  Quit date: {profile.quitDate || 'Not set'}
                </p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
                  {profile.primarySubstance} &middot; {profile.substanceHistory || 'No history shared'}
                </p>
              </div>
              <button className="btn-ghost" onClick={() => setEditing(true)} style={{ fontSize: '13px' }}>
                Edit
              </button>
            </div>
          </div>

          {/* Why I Quit */}
          <div className="card-accent" style={{ padding: '20px', marginBottom: '12px' }}>
            <p style={{ fontSize: '12px', color: 'var(--accent-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Why I quit
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.6', fontStyle: 'italic' }}>
              &ldquo;{profile.whyIQuit}&rdquo;
            </p>
          </div>

          {/* Known Triggers */}
          {profile.triggers.length > 0 && (
            <div className="card-premium" style={{ padding: '20px', marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Known triggers
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {profile.triggers.map((t, i) => (
                  <span key={i} className="tag">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* AI Notes */}
          {profile.aiNotes && (
            <div className="card-soft" style={{ padding: '20px', marginBottom: '24px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                SPARK observations
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                {profile.aiNotes}
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn-secondary" onClick={handleExport} style={{ width: '100%' }}>
              Export my data
            </button>

            {!showConfirmReset ? (
              <button
                className="btn-ghost"
                onClick={() => setShowConfirmReset(true)}
                style={{ color: 'var(--error)', width: '100%' }}
              >
                Reset all data
              </button>
            ) : (
              <div className="card-premium" style={{ padding: '16px', border: '1px solid var(--error)' }}>
                <p style={{ color: 'var(--error)', fontSize: '14px', marginBottom: '12px' }}>
                  This will delete everything. Are you sure?
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-ghost" onClick={() => setShowConfirmReset(false)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'var(--error)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Delete everything
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Editing Mode */
        <div className="animate-fadeIn">
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Name
          </label>
          <input
            className="input-premium"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginBottom: '16px' }}
          />

          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Quit date
          </label>
          <input
            className="input-premium"
            type="date"
            value={quitDate}
            onChange={(e) => setQuitDate(e.target.value)}
            style={{ marginBottom: '16px' }}
          />

          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Substance history
          </label>
          <textarea
            className="input-premium"
            value={substanceHistory}
            onChange={(e) => setSubstanceHistory(e.target.value)}
            rows={2}
            style={{ resize: 'vertical', marginBottom: '16px' }}
          />

          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Why I quit
          </label>
          <textarea
            className="input-premium"
            value={whyIQuit}
            onChange={(e) => setWhyIQuit(e.target.value)}
            rows={4}
            style={{ resize: 'vertical', marginBottom: '24px' }}
          />

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-ghost" onClick={() => setEditing(false)} style={{ flex: 1 }}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave} style={{ flex: 1 }}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
