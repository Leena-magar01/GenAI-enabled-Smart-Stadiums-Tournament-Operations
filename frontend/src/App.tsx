import React, { useState, useEffect } from 'react';
import {
  Shield,
  User,
  LogOut,
  MapPin,
  Flame,
  Plus,
  Compass,
  FileText,
  Volume2,
  Sparkles,
  Globe,
  Bell,
  Sun,
  Moon,
  Send,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Dashboard3D } from './components/Dashboard3D';
import { QueueStatus } from './components/QueueStatus';
import { Button } from './components/UI/Button';
import { Input } from './components/UI/Input';

// Define static translations
const translations: Record<string, Record<string, string>> = {
  en: {
    dashboardTitle: "Ops Console",
    crowdFlow: "Crowd Flow Dynamics",
    incidentDesk: "Incident Control Desk",
    reportIssue: "Quick AI Report",
    placeholderReport: "Describe issue (e.g. 'spilled drink on ramp at Gate 4B, people slipping')",
    parseButton: "Generate Structured Ticket",
    activeIncidents: "Active Dispatch Board",
    themeToggle: "Theme",
    langToggle: "Language",
    loginAs: "Login context:",
    logout: "Log Out",
    emergencyBroadcast: "Emergency AI Broadcaster",
    broadcastPlaceholder: "Enter urgent alert (e.g., 'Evacuate sector B immediately')",
    sendBroadcast: "Publish Multi-lingual Signage",
    severity: "Severity",
    status: "Status"
  },
  es: {
    dashboardTitle: "Consola de Ops",
    crowdFlow: "Dinámica de Flujo",
    incidentDesk: "Panel de Incidentes",
    reportIssue: "Reporte rápido con IA",
    placeholderReport: "Describa el problema (ej. 'bebida derramada en rampa en Gate 4B, gente resbalando')",
    parseButton: "Generar Ticket de Estructurado",
    activeIncidents: "Despacho Activo",
    themeToggle: "Tema",
    langToggle: "Idioma",
    loginAs: "Usuario:",
    logout: "Cerrar Sesión",
    emergencyBroadcast: "Transmisor IA de Emergencia",
    broadcastPlaceholder: "Escriba alerta urgente (ej., 'Evacuar sector B inmediatamente')",
    sendBroadcast: "Publicar en Pantallas",
    severity: "Gravedad",
    status: "Estado"
  }
};

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lang, setLang] = useState<string>('en');
  const [user, setUser] = useState<{ email: string; name: string; role: string } | null>({
    email: "admin@auravenue.com",
    name: "Alex Mercer",
    role: "SuperAdmin"
  });

  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Zone State (Dynamic)
  const [zones, setZones] = useState([
    { id: "Gate_1A", name: "Gate 1A VIP North entrance", capacity: 800, occupancy_count: 320, inflow_rate: 15, outflow_rate: 18, wait_time_seconds: 90 },
    { id: "Gate_2A", name: "Gate 2A North Plaza", capacity: 1500, occupancy_count: 650, inflow_rate: 22, outflow_rate: 20, wait_time_seconds: 140 },
    { id: "Gate_3B", name: "Gate 3B East Concourse", capacity: 1800, occupancy_count: 1520, inflow_rate: 35, outflow_rate: 12, wait_time_seconds: 410 },
    { id: "Gate_4B", name: "Gate 4B East Sector Turnstile", capacity: 1200, occupancy_count: 1080, inflow_rate: 42, outflow_rate: 10, wait_time_seconds: 480 },
    { id: "Gate_5C", name: "Gate 5C West Food Court Plaza", capacity: 2500, occupancy_count: 1100, inflow_rate: 25, outflow_rate: 24, wait_time_seconds: 180 },
    { id: "Gate_6C", name: "Gate 6C South Wing Exit", capacity: 1400, occupancy_count: 580, inflow_rate: 18, outflow_rate: 22, wait_time_seconds: 110 }
  ]);

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>("Gate_4B");

  // Incidents board
  const [incidents, setIncidents] = useState([
    { id: "inc-01", title: "Power outage at turnstiles", zone_id: "Gate_4B", severity: "High", status: "Dispatched", description: "Turnstiles offline, manually validating VIP barcodes.", time: "10 mins ago" },
    { id: "inc-02", title: "Slippery wet spill", zone_id: "Gate_5C", severity: "Medium", status: "Open", description: "Soda spill near concessions sector C, hazard for runners.", time: "4 mins ago" },
    { id: "inc-03", title: "Visual barrier blocker", zone_id: "Gate_2A", severity: "Low", status: "Resolved", description: "Signage blocking safety camera. Volunteer relocated banner.", time: "30 mins ago" }
  ]);

  // AI Prompt input
  const [rawReportText, setRawReportText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [parsedAlertResult, setParsedAlertResult] = useState<any>(null);

  // Broadcast text
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastTranslations, setBroadcastTranslations] = useState<any>(null);

  // Real-time toast notifications
  const [notifications, setNotifications] = useState<string[]>([]);

  // Simulation daemon
  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuate stats
      setZones(prev => prev.map(zone => {
        const delta = Math.floor(Math.random() * 25) - 11;
        const nextOcc = Math.max(20, Math.min(zone.capacity, zone.occupancy_count + delta));
        
        let infl = Math.max(2, zone.inflow_rate + Math.floor(Math.random() * 7) - 3);
        let outfl = Math.max(2, zone.outflow_rate + Math.floor(Math.random() * 5) - 2);

        // Turnstile Gate_4B bottleneck simulation trigger
        if (zone.id === "Gate_4B") {
          infl = 48;
          outfl = 8;
        }

        const util = nextOcc / zone.capacity;
        const nextWait = Math.round(util * 540);

        return {
          ...zone,
          occupancy_count: nextOcc,
          inflow_rate: infl,
          outflow_rate: outfl,
          wait_time_seconds: nextWait
        };
      }));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Trigger alert checks
  useEffect(() => {
    const criticalZones = zones.filter(z => (z.occupancy_count / z.capacity) > 0.85);
    if (criticalZones.length > 0) {
      const msg = `ALERT: Critical density at Sector ${criticalZones[0].id.split('_')[-1]} Turnstile (${Math.round(criticalZones[0].occupancy_count / criticalZones[0].capacity * 100)}% capacity).`;
      if (!notifications.includes(msg)) {
        setNotifications(prev => [msg, ...prev.slice(0, 2)]);
      }
    }
  }, [zones]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput === "volunteer@auravenue.com" && passInput === "volunteer123") {
      setUser({ email: emailInput, name: "Elena Rostova", role: "Volunteer" });
      setLoginError('');
    } else if (emailInput === "admin@auravenue.com" && passInput === "admin123") {
      setUser({ email: emailInput, name: "Alex Mercer", role: "SuperAdmin" });
      setLoginError('');
    } else {
      setLoginError("Invalid tournament credentials. Use admin@auravenue.com/admin123");
    }
  };

  // Mock parsing text via local AI logic
  const handleAiParse = async () => {
    if (!rawReportText.trim()) return;
    setAiParsing(true);
    
    // Call local endpoint or resolve via mock
    try {
      const response = await fetch("http://localhost:8000/api/v1/ai/parse-report", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer mock-token" },
        body: JSON.stringify({ report: rawReportText })
      }).then(r => r.json()).catch(() => {
        // High fidelity fallback matching our python AI class logic
        const lower = rawReportText.toLowerCase();
        let severity = "Medium";
        let title = "Staff Assistance Required";
        let action = "Dispatch nearby sector supervisor.";
        
        if (lower.includes("slip") || lower.includes("spill") || lower.includes("wet")) {
          severity = "Medium";
          title = "Liquid Spill Hazard";
          action = "Janitorial crew dispatched with hazard caution sign.";
        } else if (lower.includes("fight") || lower.includes("security") || lower.includes("steal")) {
          severity = "High";
          title = "Security Altercation";
          action = "Dispatch Section 3 Security team.";
        } else if (lower.includes("medical") || lower.includes("faint") || lower.includes("breath")) {
          severity = "Critical";
          title = "Medical Incident";
          action = "Red Cross EMT unit routed; Sector volunteers notified to guide stretcher.";
        }
        return { title, severity, category: "AI Classified", action_plan: action };
      });

      setParsedAlertResult(response);
      
      // Inject directly into dispatch list
      const newInc = {
        id: `inc-${Date.now()}`,
        title: response.title || "Reported Issue",
        zone_id: selectedZoneId || "Gate_3B",
        severity: response.severity || "Medium",
        status: "Open",
        description: `${rawReportText} | Plan: ${response.action_plan}`,
        time: "Just now"
      };
      setIncidents(prev => [newInc, ...prev]);
      setRawReportText('');
    } catch (e) {
      console.error(e);
    } finally {
      setAiParsing(false);
    }
  };

  // Dispatch redirection strategies (Signage updates)
  const triggerRedirection = (zoneId: string) => {
    // Redirect logic: alters local state metrics instantly representing crowds dispersals
    setZones(prev => prev.map(z => {
      if (z.id === zoneId) {
        // Disperse crowd from Gate_4B to adjacent Gate_3B and Gate_5C
        return {
          ...z,
          occupancy_count: Math.round(z.occupancy_count * 0.65),
          inflow_rate: Math.round(z.inflow_rate * 0.4),
          wait_time_seconds: Math.round(z.wait_time_seconds * 0.5)
        };
      }
      if (z.id === "Gate_3B" || z.id === "Gate_2A") {
        return {
          ...z,
          occupancy_count: z.occupancy_count + 120,
          inflow_rate: z.inflow_rate + 8
        };
      }
      return z;
    }));

    setNotifications(prev => [
      `AI ACTION: Rerouted Gate 4B flow to 3B. Dynamic signage updated.`,
      ...prev
    ]);
  };

  const handleBroadcast = () => {
    if (!broadcastText.trim()) return;
    
    // Simulate translations
    const target = {
      es: `ALERTA: ${broadcastText} (Español)`,
      fr: `ALERTE: ${broadcastText} (Français)`,
      ar: `تنبيه: ${broadcastText} (العربية)`,
      ja: `警告: ${broadcastText} (日本語)`
    };
    setBroadcastTranslations(target);
    setNotifications(prev => [`Signage Broadcast: Published alert to stadium displays.`, ...prev]);
    setBroadcastText('');
  };

  const t = translations[lang] || translations.en;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Skip to Content for Screen Readers */}
      <a href="#main-dashboard" className="skip-link">Skip to Main Content</a>

      {/* Global Safety alert banners */}
      {notifications.length > 0 && (
        <div style={{ backgroundColor: 'var(--density-high)', color: 'white', padding: '10px 24px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} />
            <span>{notifications[0]}</span>
          </div>
          <button
            onClick={() => setNotifications([])}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
            aria-label="Dismiss Alert"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header bar */}
      <header style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <Shield size={18} style={{ color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', color: 'white' }}>AuraVenue</h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>COGNITIVE VENUE ORCHESTRATOR</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Quick Stats overview */}
          <div className="sr-only" aria-live="polite">
            Status: Platform Online. Standard mode active.
          </div>
          
          {/* Language Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Globe size={15} className="text-secondary" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Switch Language"
              style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <option value="en" style={{ background: 'var(--bg-secondary)' }}>EN (English)</option>
              <option value="es" style={{ background: 'var(--bg-secondary)' }}>ES (Español)</option>
            </select>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle High Contrast Theme"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.75rem' }}>
                <span style={{ fontWeight: 'bold', color: 'white' }}>{user.name}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{user.role}</span>
              </div>
              <button
                onClick={() => setUser(null)}
                aria-label="Log out"
                style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Demo Logged Out</span>
          )}
        </div>
      </header>

      {/* Main Container */}
      {!user ? (
        <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'var(--spacing-xl)' }} id="main-dashboard">
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <Shield size={36} className="text-accent-primary" style={{ margin: '0 auto 8px' }} />
              <h2>Ops Security Portal</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Authorize credentials to access cognitive controls</p>
            </div>
            
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <Input
                label="Operations Email"
                type="email"
                placeholder="admin@auravenue.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
              />
              <Input
                label="Security Password"
                type="password"
                placeholder="••••••••"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                required
              />
              {loginError && <p style={{ color: 'var(--density-high)', fontSize: '0.8rem' }}>{loginError}</p>}
              
              <Button type="submit">Sign In to Dashboard</Button>
            </form>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              <p>Demo accounts:</p>
              <p>• admin@auravenue.com / admin123 (Administrator)</p>
              <p>• volunteer@auravenue.com / volunteer123 (Volunteer)</p>
            </div>
          </div>
        </main>
      ) : (
        <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)' }} id="main-dashboard">
          {/* Dashboard Main Grid Layout */}
          <div className="grid-dashboard">
            
            {/* Left Side: interactive spatial dashboard */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <Dashboard3D
                zones={zones}
                onZoneSelect={setSelectedZoneId}
                selectedZoneId={selectedZoneId}
                triggerRedirection={triggerRedirection}
              />

              {/* Dynamic Incident Dispatcher Panel */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} className="text-accent-primary" /> {t.incidentDesk}
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-md)' }}>
                  
                  {/* Left block: Speech to Incident Parser */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.reportIssue}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <textarea
                        value={rawReportText}
                        onChange={(e) => setRawReportText(e.target.value)}
                        placeholder={t.placeholderReport}
                        style={{
                          flex: 1,
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--border-radius-sm)',
                          padding: '10px',
                          fontSize: '0.9rem',
                          outline: 'none',
                          minHeight: '60px',
                          resize: 'none'
                        }}
                      />
                    </div>
                    <Button onClick={handleAiParse} disabled={aiParsing} size="sm">
                      {aiParsing ? "Analyzing Speech Pattern..." : t.parseButton}
                    </Button>
                  </div>

                  {/* Right block: Live Feed */}
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                      {t.activeIncidents}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                      {incidents.map((inc) => (
                        <div
                          key={inc.id}
                          style={{
                            padding: '10px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '4px',
                            borderLeft: inc.severity === 'High' ? '3px solid var(--density-high)' : inc.severity === 'Medium' ? '3px solid var(--density-medium)' : '3px solid var(--density-low)',
                            fontSize: '0.85rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ color: 'white' }}>{inc.title}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{inc.time}</span>
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '6px' }}>{inc.description}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Zone: {inc.zone_id.replace('_', ' ')}</span>
                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{inc.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Right Side: stats panel & emergency broadcast console */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              
              <QueueStatus
                zones={zones}
                selectedZoneId={selectedZoneId}
                onZoneSelect={setSelectedZoneId}
              />

              {/* Dynamic Signage emergency broadcast */}
              {user.role === "SuperAdmin" && (
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1rem' }}>
                    <Volume2 size={16} className="text-density-high" /> {t.emergencyBroadcast}
                  </h3>
                  <textarea
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder={t.broadcastPlaceholder}
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-sm)',
                      padding: '8px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      minHeight: '50px',
                      resize: 'none'
                    }}
                  />
                  <Button onClick={handleBroadcast} size="sm">
                    {t.sendBroadcast}
                  </Button>

                  {/* Render translation previews */}
                  {broadcastTranslations && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                        LIVE SIGNAGE TRANSLATIONS BROADCASTED:
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
                        <div>🇪🇸 <span style={{ color: 'white' }}>{broadcastTranslations.es}</span></div>
                        <div>🇫🇷 <span style={{ color: 'white' }}>{broadcastTranslations.fr}</span></div>
                        <div>🇸🇦 <span style={{ color: 'white' }}>{broadcastTranslations.ar}</span></div>
                        <div>🇯🇵 <span style={{ color: 'white' }}>{broadcastTranslations.ja}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </main>
      )}

      {/* Footer copyright */}
      <footer style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', padding: '0.75rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'auto' }}>
        AuraVenue Cognitive Platform &copy; 2026. WCAG 2.2 AAA Compliant. Powered by Real-Time Telemetry.
      </footer>
    </div>
  );
}
