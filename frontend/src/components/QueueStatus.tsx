import React from 'react';
import { Clock, Flame, AlertCircle } from 'lucide-react';

interface ZoneData {
  id: string;
  name: string;
  capacity: number;
  occupancy_count: number;
  inflow_rate: number;
  outflow_rate: number;
  wait_time_seconds: number;
}

interface QueueStatusProps {
  zones: ZoneData[];
  selectedZoneId: string | null;
  onZoneSelect: (zoneId: string) => void;
}

export const QueueStatus: React.FC<QueueStatusProps> = ({
  zones,
  selectedZoneId,
  onZoneSelect
}) => {
  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={18} className="text-accent-primary" /> Sector Queue Metrics
        </h3>
        <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
          {zones.length} Gate Feeds
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
              <th style={{ padding: '8px 4px' }}>SECTOR / GATE</th>
              <th style={{ padding: '8px 4px', textAlign: 'center' }}>FLOW (IN/OUT)</th>
              <th style={{ padding: '8px 4px', textAlign: 'center' }}>OCCUPANCY</th>
              <th style={{ padding: '8px 4px', textAlign: 'right' }}>WAIT TIME</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => {
              const util = zone.occupancy_count / zone.capacity;
              const isSelected = selectedZoneId === zone.id;
              
              // Define tag color
              let utilColor = 'var(--density-low)';
              if (util > 0.82) utilColor = 'var(--density-high)';
              else if (util > 0.6) utilColor = 'var(--density-medium)';

              return (
                <tr
                  key={zone.id}
                  onClick={() => onZoneSelect(zone.id)}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                    transition: 'background-color 0.2s',
                  }}
                  className="queue-row"
                >
                  <td style={{ padding: '12px 4px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600', color: isSelected ? 'white' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {zone.id.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {zone.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 4px', textAlign: 'center', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--accent-secondary)' }}>+{zone.inflow_rate}</span>
                    <span style={{ color: 'var(--text-tertiary)', margin: '0 4px' }}>/</span>
                    <span style={{ color: 'var(--text-secondary)' }}>-{zone.outflow_rate}</span>
                  </td>
                  <td style={{ padding: '12px 4px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                        {Math.round(util * 100)}%
                      </span>
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: utilColor,
                          boxShadow: util > 0.82 ? '0 0 8px var(--density-high)' : 'none'
                        }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '12px 4px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontWeight: '600', color: util > 0.82 ? 'var(--density-high)' : 'white', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {util > 0.82 && <Flame size={12} className="text-density-high" />}
                        {Math.round(zone.wait_time_seconds / 60)}m
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                        {zone.wait_time_seconds % 60}s left
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {zones.some(z => (z.occupancy_count / z.capacity) > 0.82) && (
        <div style={{ display: 'flex', gap: '8px', padding: '10px', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '6px', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)', alignItems: 'center' }}>
          <AlertCircle size={14} className="text-density-medium" style={{ flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            Elevated wait times detected in Sector B. AI flow recommendation active.
          </span>
        </div>
      )}
    </div>
  );
};

// Build Sync: July 15, 2026
