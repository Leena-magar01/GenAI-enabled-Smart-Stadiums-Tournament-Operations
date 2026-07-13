import React, { useRef, useEffect, useState } from 'react';
import { ShieldAlert, Play, Users, Clock, ArrowRight } from 'lucide-react';

interface ZoneData {
  id: string;
  name: string;
  capacity: number;
  occupancy_count: number;
  inflow_rate: number;
  outflow_rate: number;
  wait_time_seconds: number;
}

interface Dashboard3DProps {
  zones: ZoneData[];
  onZoneSelect: (zoneId: string) => void;
  selectedZoneId: string | null;
  triggerRedirection: (zoneId: string) => void;
}

export const Dashboard3D: React.FC<Dashboard3DProps> = ({
  zones,
  onZoneSelect,
  selectedZoneId,
  triggerRedirection
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [animationTick, setAnimationTick] = useState(0);

  // Trigger animation loop
  useEffect(() => {
    let animId: number;
    const tick = () => {
      setAnimationTick(prev => (prev + 1) % 360);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Custom Isometric Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear Canvas
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // Grid coordinates
    const centerX = width / 2;
    const centerY = height / 2 + 30;
    
    // Isometric Draw Helper
    const drawIsometricElipse = (x: number, y: number, rx: number, ry: number, fillStyle: string, strokeStyle: string, lineWidth = 1) => {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = fillStyle;
      ctx.fill();
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = strokeStyle;
      ctx.stroke();
    };

    // Draw grid background
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(width, j);
      ctx.stroke();
    }

    // Coordinates for the 6 sectors in our database (Gate_1A to Gate_6C)
    // We map them to specific layout slices of our isometric stadium
    const sectorAngles = [
      { id: 'Gate_1A', start: 0, end: Math.PI / 3, name: 'VIP North' },
      { id: 'Gate_2A', start: Math.PI / 3, end: (2 * Math.PI) / 3, name: 'North Plaza' },
      { id: 'Gate_3B', start: (2 * Math.PI) / 3, end: Math.PI, name: 'East path' },
      { id: 'Gate_4B', start: Math.PI, end: (4 * Math.PI) / 3, name: 'East Turnstile' },
      { id: 'Gate_5C', start: (4 * Math.PI) / 3, end: (5 * Math.PI) / 3, name: 'West Plaza' },
      { id: 'Gate_6C', start: (5 * Math.PI) / 3, end: 2 * Math.PI, name: 'South Exit' },
    ];

    // Stadium ring dimensions
    const outerRx = 190;
    const outerRy = 110;
    const innerRx = 100;
    const innerRy = 55;

    // Draw field / pitch center
    drawIsometricElipse(centerX, centerY, 80, 44, '#1b2d42', 'rgba(99, 102, 241, 0.4)', 2);
    // Draw center circle
    drawIsometricElipse(centerX, centerY, 20, 11, 'transparent', 'rgba(255, 255, 255, 0.25)', 1);

    // Draw sectors
    sectorAngles.forEach((sec) => {
      const zoneData = zones.find(z => z.id === sec.id);
      const capacityUtil = zoneData ? (zoneData.occupancy_count / zoneData.capacity) : 0.4;
      
      // Determine density color
      let baseColor = 'rgba(6, 182, 212, 0.3)'; // Cyan (Low)
      let strokeColor = 'rgba(6, 182, 212, 0.8)';
      if (capacityUtil > 0.82) {
        baseColor = 'rgba(239, 68, 68, 0.4)'; // Red (High)
        strokeColor = 'rgba(239, 68, 68, 0.9)';
      } else if (capacityUtil > 0.6) {
        baseColor = 'rgba(245, 158, 11, 0.3)'; // Amber (Medium)
        strokeColor = 'rgba(245, 158, 11, 0.8)';
      }

      const isSelected = selectedZoneId === sec.id;
      const isHovered = hoveredZoneId === sec.id;
      
      if (isSelected) {
        baseColor = baseColor.replace('0.3', '0.6').replace('0.4', '0.7');
        strokeColor = '#ffffff';
      } else if (isHovered) {
        baseColor = baseColor.replace('0.3', '0.5').replace('0.4', '0.6');
      }

      // Draw 3D sector wedge
      ctx.beginPath();
      // Outer arc
      ctx.ellipse(centerX, centerY, outerRx, outerRy, 0, sec.start, sec.end);
      // Line to inner arc
      const innerX2 = centerX + Math.cos(sec.end) * innerRx;
      const innerY2 = centerY + Math.sin(sec.end) * innerRy;
      ctx.lineTo(innerX2, innerY2);
      // Inner arc (reverse)
      ctx.ellipse(centerX, centerY, innerRx, innerRy, 0, sec.end, sec.start, true);
      // Close wedge
      ctx.closePath();
      
      ctx.fillStyle = baseColor;
      ctx.fill();
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeStyle = strokeColor;
      ctx.stroke();

      // Draw Sector Label
      const midAngle = (sec.start + sec.end) / 2;
      const labelRx = (outerRx + innerRx) / 2 + 10;
      const labelRy = (outerRy + innerRy) / 2 + 10;
      const labelX = centerX + Math.cos(midAngle) * labelRx;
      const labelY = centerY + Math.sin(midAngle) * labelRy;

      ctx.fillStyle = isSelected ? '#ffffff' : 'var(--text-secondary)';
      ctx.font = isSelected ? 'bold 11px var(--font-sans)' : '10px var(--font-sans)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sec.name, labelX, labelY);

      // Draw small warning pulse indicator on critical sectors
      if (capacityUtil > 0.82) {
        const pulse = 10 + Math.sin(animationTick * 0.1) * 4;
        ctx.beginPath();
        ctx.arc(labelX, labelY - 12, pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(labelX, labelY - 12, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
      }

      // Draw simulated crowd flowing particles (animated points)
      const particleCount = Math.floor(capacityUtil * 12);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let p = 0; p < particleCount; p++) {
        // Place particles randomly within the wedge boundaries
        const pAngle = sec.start + ((p + animationTick * 0.05) % 1) * (sec.end - sec.start);
        const pDist = innerRx + 10 + ((p * 7 + animationTick) % (outerRx - innerRx - 20));
        const px = centerX + Math.cos(pAngle) * pDist;
        const py = centerY + Math.sin(pAngle) * (pDist * 0.55); // Isometric ratio
        
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw active volunteers (rendered as green dots moving near gates)
    const volunteerSpots = [
      { x: centerX - 120, y: centerY - 60 },
      { x: centerX + 110, y: centerY + 45 },
      { x: centerX + 40, y: centerY - 70 }
    ];
    volunteerSpots.forEach((spot, idx) => {
      // Small hover fluctuation
      const vy = spot.y + Math.sin((animationTick + idx * 45) * 0.08) * 3;
      
      // Outer glow
      ctx.beginPath();
      ctx.arc(spot.x, vy, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(spot.x, vy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#22c55e';
      ctx.fill();
    });

  }, [zones, selectedZoneId, hoveredZoneId, animationTick]);

  // Click coordinator detection
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2 + 30;

    // Detect click angle and distance to match which sector wedge was clicked
    const dx = clickX - centerX;
    const dy = clickY - centerY;
    // Map coordinate to isometric circle space (stretch height by 1.8 to approximate circle)
    const angle = (Math.atan2(dy * 1.8, dx) + Math.PI * 2) % (Math.PI * 2);
    const dist = Math.sqrt(dx * dx + (dy * 1.8) * (dy * 1.8));

    // If within our rings
    if (dist >= 90 && dist <= 210) {
      // Find sector matching angle
      const sectorAngles = [
        { id: 'Gate_1A', start: 0, end: Math.PI / 3 },
        { id: 'Gate_2A', start: Math.PI / 3, end: (2 * Math.PI) / 3 },
        { id: 'Gate_3B', start: (2 * Math.PI) / 3, end: Math.PI },
        { id: 'Gate_4B', start: Math.PI, end: (4 * Math.PI) / 3 },
        { id: 'Gate_5C', start: (4 * Math.PI) / 3, end: (5 * Math.PI) / 3 },
        { id: 'Gate_6C', start: (5 * Math.PI) / 3, end: 2 * Math.PI },
      ];

      const clickedSec = sectorAngles.find(sec => angle >= sec.start && angle < sec.end);
      if (clickedSec) {
        onZoneSelect(clickedSec.id);
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2 + 30;

    const dx = clickX - centerX;
    const dy = clickY - centerY;
    const angle = (Math.atan2(dy * 1.8, dx) + Math.PI * 2) % (Math.PI * 2);
    const dist = Math.sqrt(dx * dx + (dy * 1.8) * (dy * 1.8));

    if (dist >= 90 && dist <= 210) {
      const sectorAngles = [
        { id: 'Gate_1A', start: 0, end: Math.PI / 3 },
        { id: 'Gate_2A', start: Math.PI / 3, end: (2 * Math.PI) / 3 },
        { id: 'Gate_3B', start: (2 * Math.PI) / 3, end: Math.PI },
        { id: 'Gate_4B', start: Math.PI, end: (4 * Math.PI) / 3 },
        { id: 'Gate_5C', start: (4 * Math.PI) / 3, end: (5 * Math.PI) / 3 },
        { id: 'Gate_6C', start: (5 * Math.PI) / 3, end: 2 * Math.PI },
      ];

      const clickedSec = sectorAngles.find(sec => angle >= sec.start && angle < sec.end);
      if (clickedSec) {
        setHoveredZoneId(clickedSec.id);
        return;
      }
    }
    setHoveredZoneId(null);
  };

  // Extract selected details
  const activeZone = zones.find(z => z.id === selectedZoneId);
  const activeUtilization = activeZone ? (activeZone.occupancy_count / activeZone.capacity) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
        <div style={{ padding: 'var(--spacing-md)', position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
          <h3 style={{ color: 'white', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={18} className="text-accent-secondary" /> Spatial Chrono-Telemetry Map
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Real-time occupancy gradients & predicted queues
          </span>
        </div>

        {/* Dynamic Canvas */}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredZoneId(null)}
          style={{ width: '100%', height: '340px', display: 'block', cursor: 'crosshair' }}
          aria-label="Interactive 3D isometric representation of the stadium sectors. Select a sector to see detailed metrics."
        />

        <div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--density-low)' }} /> Low (&lt;60%)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--density-medium)' }} /> Medium (60%-80%)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--density-high)' }} /> Critical (&gt;80%)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} /> Active Volunteers
          </div>
        </div>
      </div>

      {/* Dynamic Action Center for Selected Zone */}
      {activeZone && (
        <div className="glass-panel" style={{ borderLeft: activeUtilization > 0.82 ? '4px solid var(--density-high)' : '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
            <div>
              <h4 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.1rem' }}>
                {activeZone.name} <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{activeZone.id}</span>
              </h4>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} className="text-secondary" />
                  <span style={{ fontSize: '0.85rem' }}>
                    <strong>{activeZone.occupancy_count}</strong> / {activeZone.capacity} ({Math.round(activeUtilization * 100)}%)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} className="text-secondary" />
                  <span style={{ fontSize: '0.85rem' }}>
                    Queue wait: <strong>{Math.round(activeZone.wait_time_seconds / 60)} min</strong>
                  </span>
                </div>
              </div>
            </div>

            {activeUtilization > 0.82 ? (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 'var(--spacing-md)', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)', width: '100%', marginTop: '4px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <ShieldAlert className="text-density-high" size={20} style={{ flexShrink: 0 }} />
                  <div>
                    <h5 style={{ color: 'var(--density-high)', marginBottom: '4px' }}>Chrono-Prediction: Turnstile Bottleneck Warning</h5>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      Inflow ({activeZone.inflow_rate}/min) exceeds outflow capacity. Predict queue wait times to hit 12 minutes in the next 15 minutes.
                    </p>
                    <button
                      onClick={() => triggerRedirection(activeZone.id)}
                      style={{
                        backgroundColor: 'var(--density-high)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      className="btn-danger"
                    >
                      <Play size={12} /> Execute AI Redirection Strategy <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'rgba(6, 182, 212, 0.08)', padding: '8px 12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                <Users size={16} className="text-accent-secondary" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Sector operating within safe thresholds. Flow redirection unlocked.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
