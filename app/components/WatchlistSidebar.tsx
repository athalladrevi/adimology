'use client';

import { useEffect, useState } from 'react';
import type { WatchlistItem, WatchlistGroup } from '@/lib/types';

interface WatchlistSidebarProps {
  onSelect?: (symbol: string) => void;
}

export default function WatchlistSidebar({ onSelect }: WatchlistSidebarProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [groups, setGroups] = useState<WatchlistGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch('/api/watchlist/groups');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setGroups(json.data);
          // Select default or first group
          const defaultG = json.data.find((g: WatchlistGroup) => g.is_default) || json.data[0];
          setSelectedGroupId(defaultG?.watchlist_id || null);
        }
      } catch (err) {
        console.error('Error fetching groups:', err);
      }
    };
    fetchGroups();
  }, []);

  // Fetch watchlist items when group changes
  useEffect(() => {
    if (!selectedGroupId) return;

    const fetchWatchlist = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/watchlist?groupId=${selectedGroupId}`);
        const json = await response.json();

        if (!json.success) {
          throw new Error(json.error || 'Failed to fetch watchlist');
        }

        const payload = json.data;
        const data = payload?.data?.result || payload?.data || [];
        setWatchlist(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching watchlist:', err);
        setError(err instanceof Error ? err.message : 'Failed to load watchlist');
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [selectedGroupId]);

  const selectedGroup = groups.find(g => g.watchlist_id === selectedGroupId);

  if (loading && groups.length === 0) {
    return (
      <div style={{ padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Watchlist</h3>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Watchlist</h3>
        <div style={{ color: 'var(--accent-warning)', fontSize: '0.875rem' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header with Group Selector */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '0.5rem'
        }}>
          <h3 style={{ 
            margin: 0,
            color: 'var(--text-secondary)', 
            textTransform: 'uppercase', 
            letterSpacing: '1px', 
            fontSize: '0.75rem' 
          }}>
            Watchlist
          </h3>
          <span style={{ 
            fontSize: '0.7rem', 
            color: 'var(--text-muted)',
            background: 'rgba(255,255,255,0.1)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {watchlist.length}
          </span>
        </div>
        
        {groups.length > 1 && (
          <select
            value={selectedGroupId || ''}
            onChange={(e) => setSelectedGroupId(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '0.8rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {groups.map(g => (
              <option key={g.watchlist_id} value={g.watchlist_id} style={{ background: '#1a1a1a' }}>
                {g.emoji ? `${g.emoji} ` : ''}{g.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Loading indicator when switching groups */}
      {loading && (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>
          Loading...
        </div>
      )}

      {/* Watchlist Items */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {watchlist.map((item, index) => {
            const percentValue = parseFloat(item.percent) || 0;
            const isPositive = percentValue >= 0;
            
            return (
              <div 
                key={item.company_id || index} 
                className="watchlist-item"
                onClick={() => onSelect?.(item.symbol || item.company_code)}
                style={{ padding: '0.65rem 0.75rem' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.symbol || item.company_code}</div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: '#999', 
                    marginTop: '2px', 
                    maxWidth: '140px', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                  }}>
                    {item.sector || item.company_name}
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {item.formatted_price || item.last_price?.toLocaleString() || '-'}
                  </div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: isPositive ? 'var(--accent-success)' : 'var(--accent-warning)',
                    marginTop: '1px',
                    fontWeight: 500
                  }}>
                    {isPositive ? '+' : ''}{item.percent}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
