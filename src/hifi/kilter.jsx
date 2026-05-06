// hifi-kilter.jsx — V4: Kilter companion screen.
//
// Mock-only by design. Three-state flow on a single screen:
//   1. DISCONNECTED — "Pair board" intro
//   2. SCANNING     — fake BLE scan (1.6s)
//   3. CONNECTED    — climb library + interactive hold grid + action row
//
// IP posture: this is a *companion* surface, not a Kilter clone.
//   • No Kilter logo, no Kilter wordmark in chrome (only nominative ref in copy).
//   • Hand-authored boulders. We do NOT ship Aurora's climb DB.
//   • Our own visual treatment of a hold grid; not a copy of their app UI.
//   • Bluetooth is faked. No real BLE writes. Adding Web Bluetooth later would
//     fall under DMCA §1201(f) interoperability anyway, but for now it's mocked.

const KILTER_GRID = { cols: 11, rows: 12 }; // typical home spray-wall layout
const KILTER_ROLES = {
  start:  { color: '#3ad07a', label: 'START',  ring: '#1f8a4a' },
  hand:   { color: '#3aa9ff', label: 'HAND',   ring: '#1f6ec0' },
  foot:   { color: '#ffd24a', label: 'FOOT',   ring: '#b9881d' },
  finish: { color: '#b96bff', label: 'FINISH', ring: '#7d33d6' },
};

// Hand-authored boulders. Each `holds` cell is [row, col, role].
// Rows are numbered top→bottom (0 at top). 6 climbs across V0–V8.
const KILTER_CLIMBS = [
  {
    id: 'kc1', name: 'Warm-up Walk',     grade: 'V0', setter: 'house',  ascents: 412, holdsCount: 8,
    angle: 40, style: 'JUGS · POSITIVE',
    holds: [
      [10, 5, 'start'], [10, 6, 'start'],
      [8, 4, 'hand'], [7, 6, 'hand'], [5, 5, 'hand'], [3, 4, 'hand'],
      [11, 3, 'foot'], [11, 7, 'foot'],
      [1, 5, 'finish'],
    ],
  },
  {
    id: 'kc2', name: 'Pebble Crusher',   grade: 'V3', setter: '@mara',  ascents: 184, holdsCount: 9,
    angle: 40, style: 'CRIMPS',
    holds: [
      [10, 4, 'start'], [10, 7, 'start'],
      [8, 3, 'hand'], [8, 8, 'hand'], [6, 4, 'hand'], [5, 7, 'hand'], [3, 5, 'hand'],
      [11, 5, 'foot'],
      [1, 6, 'finish'],
    ],
  },
  {
    id: 'kc3', name: 'Slab Sermon',      grade: 'V4', setter: '@jules', ascents: 96,  holdsCount: 8,
    angle: 25, style: 'SLAB · BALANCY',
    holds: [
      [10, 3, 'start'], [10, 8, 'start'],
      [7, 5, 'hand'], [5, 4, 'hand'], [4, 7, 'hand'],
      [11, 4, 'foot'], [9, 7, 'foot'],
      [1, 6, 'finish'],
    ],
  },
  {
    id: 'kc4', name: 'Blood Orange',     grade: 'V6', setter: '@mara',  ascents: 38,  holdsCount: 9,
    angle: 50, style: 'DYNO · POWER',
    holds: [
      [10, 2, 'start'], [10, 9, 'start'],
      [8, 5, 'hand'], [6, 7, 'hand'], [5, 3, 'hand'], [3, 6, 'hand'],
      [11, 5, 'foot'], [9, 8, 'foot'],
      [1, 4, 'finish'],
    ],
  },
  {
    id: 'kc5', name: 'Crimp Capital',    grade: 'V7', setter: '@hari',  ascents: 12,  holdsCount: 10,
    angle: 50, style: 'CRIMPS · TENSION',
    holds: [
      [10, 5, 'start'], [10, 6, 'start'],
      [8, 7, 'hand'], [7, 4, 'hand'], [6, 8, 'hand'], [5, 3, 'hand'], [4, 6, 'hand'], [3, 8, 'hand'],
      [11, 6, 'foot'],
      [1, 5, 'finish'],
    ],
  },
  {
    id: 'kc6', name: 'Slopey Sermon',    grade: 'V8', setter: 'house',  ascents: 4,   holdsCount: 9,
    angle: 60, style: 'SLOPERS · COMPRESSION',
    holds: [
      [10, 4, 'start'], [10, 7, 'start'],
      [8, 3, 'hand'], [7, 8, 'hand'], [5, 4, 'hand'], [4, 7, 'hand'], [3, 5, 'hand'],
      [11, 5, 'foot'],
      [1, 6, 'finish'],
    ],
  },
];

// Helper: build a Set of "row:col" → role for fast cell lookup.
function buildHoldMap(climb) {
  const m = new Map();
  if (!climb) return m;
  climb.holds.forEach(([r, c, role]) => m.set(`${r}:${c}`, role));
  return m;
}

function HFKilterScreen() {
  const [phase, setPhase] = React.useState('disconnected'); // disconnected | scanning | connected
  const [selectedClimbId, setSelectedClimbId] = React.useState('kc4');
  const [filter, setFilter] = React.useState('ALL'); // ALL | V0 | V3 | V6
  const [boardLit, setBoardLit] = React.useState(true);

  const me = OFC.useStoreSlice(s => s.me);
  const climb = KILTER_CLIMBS.find(c => c.id === selectedClimbId) || KILTER_CLIMBS[0];
  const holdMap = React.useMemo(() => buildHoldMap(climb), [climb]);

  const filtered = React.useMemo(() => {
    if (filter === 'ALL') return KILTER_CLIMBS;
    const n = parseInt(filter.replace('V', ''), 10);
    return KILTER_CLIMBS.filter(c => parseInt(c.grade.replace('V', ''), 10) === n);
  }, [filter]);

  const startScan = () => {
    setPhase('scanning');
    setTimeout(() => setPhase('connected'), 1600);
  };

  const lightUp = () => {
    setBoardLit(true);
    window.UC.toast(`✓ LIT · ${climb.name.toUpperCase()}`, { accent: true });
  };

  const logSend = () => {
    // Handoff to composer with the climb pre-stamped.
    if (window.UC && window.UC.navigate) {
      window.UC.navigate('composer', {
        prefill: { name: climb.name, grade: climb.grade, gym: 'BOARD · KILTER', style: climb.style.split(' · ')[0] },
      });
    }
    window.UC.toast('STARTED LOG · BOARD CLIMB', { accent: true });
  };

  // ─── DISCONNECTED ───
  if (phase === 'disconnected' || phase === 'scanning') {
    const scanning = phase === 'scanning';
    return (
      <HFPhone dark>
        <div style={{ position: 'absolute', top: 54, left: 0, right: 0, bottom: 80, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div onClick={() => window.UC.navigate('me')} style={{ cursor: 'pointer' }}>
              <HFIconBtn size={32} dark>{HFIcon.back(14, '#fff')}</HFIconBtn>
            </div>
            <div style={{ fontFamily: HF.display, fontSize: 18, letterSpacing: -0.4, textTransform: 'uppercase' }}>BOARD</div>
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: HF.mono, fontSize: 9, fontWeight: 800, letterSpacing: 1.3, padding: '4px 7px', background: '#2a2521', color: '#aa9d86', textTransform: 'uppercase' }}>BETA</span>
          </div>
          <div style={{ padding: '24px 22px 0', textAlign: 'left' }}>
            <div style={{ fontFamily: HF.display, fontSize: 38, lineHeight: 0.95, letterSpacing: -1, textTransform: 'uppercase', color: '#f4ede0' }}>
              CONNECT YOUR<br/><span style={{ color: HF.accent }}>KILTER BOARD.</span>
            </div>
            <div style={{ fontFamily: HF.serif || HF.sans, fontSize: 14, color: '#aa9d86', marginTop: 14, lineHeight: 1.5, maxWidth: 320 }}>
              OFC pairs over Bluetooth, lights up your problem, and logs the send straight into your feed when you top out. Works with Kilter, Tension, and Decoy spray walls.
            </div>
          </div>
          <div style={{ margin: '28px 16px 0', display: 'flex', flexDirection: 'column', gap: 1, background: '#1f1c19' }}>
            {[
              ['BLE', 'Bluetooth pairing — no account, no cloud'],
              ['LIGHT', 'Color-coded holds: start · hand · foot · top'],
              ['LOG',   'One-tap log to your feed when you send'],
              ['LOCAL', 'Your library stays on this device'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#13110e' }}>
                <div style={{ fontFamily: HF.mono, fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: HF.accent, width: 48 }}>{k}</div>
                <div style={{ fontFamily: HF.sans, fontSize: 12, color: '#e8e0d2', flex: 1 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '24px 16px 28px' }}>
            <button onClick={startScan} disabled={scanning} style={{
              width: '100%', padding: '16px 0',
              background: HF.accent, color: '#fff', border: 'none',
              fontFamily: HF.mono, fontSize: 13, fontWeight: 800, letterSpacing: 1.6,
              textTransform: 'uppercase', cursor: scanning ? 'default' : 'pointer',
              boxShadow: `4px 4px 0 #c43c0c`,
              opacity: scanning ? 0.7 : 1,
            }}>
              {scanning ? 'SCANNING…  ◐' : 'PAIR BOARD →'}
            </button>
            <div style={{ fontFamily: HF.mono, fontSize: 9, color: '#7a7060', letterSpacing: 1.4, marginTop: 14, textAlign: 'center', textTransform: 'uppercase' }}>
              MOCK MODE · NO REAL BLE WRITES
            </div>
          </div>
        </div>
        <HFTabBar active="me" />
      </HFPhone>
    );
  }

  // ─── CONNECTED ───
  return (
    <HFPhone dark>
      <div style={{ position: 'absolute', top: 54, left: 0, right: 0, bottom: 80, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
        {/* Header */}
        <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div onClick={() => window.UC.navigate('me')} style={{ cursor: 'pointer' }}>
            <HFIconBtn size={32} dark>{HFIcon.back(14, '#fff')}</HFIconBtn>
          </div>
          <div>
            <div style={{ fontFamily: HF.display, fontSize: 16, letterSpacing: -0.3, textTransform: 'uppercase', color: '#f4ede0' }}>SPRAY WALL · HOME</div>
            <div style={{ fontFamily: HF.mono, fontSize: 9, fontWeight: 800, letterSpacing: 1.3, color: '#3ad07a', marginTop: 2, textTransform: 'uppercase' }}>● CONNECTED · 11×12 · 40°</div>
          </div>
          <span style={{ flex: 1 }} />
          <button onClick={() => setPhase('disconnected')} style={{ background: 'transparent', border: '1px solid #2c2823', color: '#aa9d86', padding: '5px 8px', fontFamily: HF.mono, fontSize: 9, fontWeight: 800, letterSpacing: 1.2, cursor: 'pointer', textTransform: 'uppercase' }}>UNPAIR</button>
        </div>

        {/* Board (hold grid) */}
        <div style={{ margin: '8px 16px 0', position: 'relative', background: '#0a0908', border: '1px solid #2c2823', padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: HF.display, fontSize: 22, letterSpacing: -0.6, textTransform: 'uppercase', color: '#f4ede0' }}>{climb.name}</div>
              <div style={{ fontFamily: HF.mono, fontSize: 10, color: '#aa9d86', marginTop: 4, letterSpacing: 1, fontWeight: 700, textTransform: 'uppercase' }}>{climb.grade} · {climb.style} · {climb.setter}</div>
            </div>
            <div style={{ fontFamily: HF.mono, fontSize: 9, color: '#7a7060', letterSpacing: 1.2, fontWeight: 700, textTransform: 'uppercase' }}>{climb.holdsCount} HOLDS · {climb.ascents} ASCENTS</div>
          </div>
          <HoldGrid holdMap={holdMap} lit={boardLit} />
          {/* Role legend */}
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            {Object.entries(KILTER_ROLES).map(([k, r]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, boxShadow: `0 0 6px ${r.color}` }} />
                <span style={{ fontFamily: HF.mono, fontSize: 9, color: '#aa9d86', letterSpacing: 1.2, fontWeight: 700 }}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: 8, margin: '12px 16px 0' }}>
          <button onClick={lightUp} style={{ flex: 1, padding: '12px 0', background: HF.accent, color: '#fff', border: 'none', fontFamily: HF.mono, fontSize: 11, fontWeight: 800, letterSpacing: 1.4, cursor: 'pointer', textTransform: 'uppercase', boxShadow: '3px 3px 0 #c43c0c' }}>LIGHT UP →</button>
          <button onClick={() => setBoardLit(b => !b)} style={{ flex: 1, padding: '12px 0', background: 'transparent', color: '#f4ede0', border: '1.5px solid #2c2823', fontFamily: HF.mono, fontSize: 11, fontWeight: 800, letterSpacing: 1.4, cursor: 'pointer', textTransform: 'uppercase' }}>{boardLit ? 'BLANK BOARD' : 'PREVIEW HOLDS'}</button>
          <button onClick={logSend} style={{ flex: 1, padding: '12px 0', background: '#13110e', color: '#3ad07a', border: '1.5px solid #3ad07a', fontFamily: HF.mono, fontSize: 11, fontWeight: 800, letterSpacing: 1.4, cursor: 'pointer', textTransform: 'uppercase' }}>LOG SEND</button>
        </div>

        {/* Climb library */}
        <div style={{ marginTop: 22, padding: '0 16px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: HF.mono, fontSize: 9, fontWeight: 800, letterSpacing: 2, color: '#aa9d86', textTransform: 'uppercase' }}>— Library ({KILTER_CLIMBS.length}) —</div>
          <span style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 4 }}>
            {['ALL', 'V0', 'V3', 'V6'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                fontFamily: HF.mono, fontSize: 9, fontWeight: 800, letterSpacing: 1,
                padding: '4px 7px',
                background: filter === f ? HF.accent : 'transparent',
                color: filter === f ? '#fff' : '#aa9d86',
                border: `1px solid ${filter === f ? HF.accent : '#2c2823'}`,
                cursor: 'pointer', textTransform: 'uppercase',
              }}>{f}+</button>
            ))}
          </div>
        </div>
        <div style={{ margin: '0 16px 16px' }}>
          {filtered.map(c => {
            const isActive = c.id === selectedClimbId;
            return (
              <div key={c.id} onClick={() => setSelectedClimbId(c.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px',
                background: isActive ? '#1f1c19' : '#13110e',
                border: `1px solid ${isActive ? HF.accent : '#2c2823'}`,
                marginBottom: 6, cursor: 'pointer',
                boxShadow: isActive ? `3px 3px 0 ${HF.accent}` : 'none',
              }}>
                <div style={{ width: 38, height: 38, background: '#0a0908', border: `1.5px solid ${isActive ? HF.accent : '#2c2823'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HF.display, fontSize: 13, color: isActive ? HF.accent : '#f4ede0', flexShrink: 0 }}>{c.grade}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: HF.display, fontSize: 14, letterSpacing: -0.2, textTransform: 'uppercase', color: '#f4ede0' }}>{c.name}</div>
                  <div style={{ fontFamily: HF.mono, fontSize: 9, color: '#7a7060', letterSpacing: 1, marginTop: 3, fontWeight: 700, textTransform: 'uppercase' }}>{c.style} · {c.setter} · {c.ascents}↑</div>
                </div>
                <span style={{ fontFamily: HF.mono, fontSize: 14, color: isActive ? HF.accent : '#7a7060', fontWeight: 800 }}>{isActive ? '●' : '→'}</span>
              </div>
            );
          })}
        </div>
      </div>
      <HFTabBar active="me" />
    </HFPhone>
  );
}

// 11×12 hold grid. Cells without a role render as a faint dot. Cells with a
// role render as a colored circle with a glow when `lit` is true.
function HoldGrid({ holdMap, lit }) {
  const { rows, cols } = KILTER_GRID;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const role = holdMap.get(`${r}:${c}`);
      cells.push({ r, c, role });
    }
  }
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 4,
      background: '#0a0908',
      padding: 6,
      border: '1px solid #1f1c19',
      aspectRatio: `${cols} / ${rows}`,
      width: '100%',
    }}>
      {cells.map(({ r, c, role }) => {
        const r_ = role && KILTER_ROLES[role];
        const showRole = !!r_ && lit;
        return (
          <div key={`${r}:${c}`} style={{
            position: 'relative',
            aspectRatio: '1 / 1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Base hold (always present, faint) */}
            <span style={{
              position: 'absolute', inset: '20%',
              borderRadius: '50%',
              background: showRole ? r_.color : '#1f1c19',
              border: showRole ? `1.5px solid ${r_.ring}` : '1px solid #2c2823',
              boxShadow: showRole ? `0 0 10px ${r_.color}, 0 0 18px ${r_.color}55` : 'none',
              transition: 'all 200ms ease',
            }} />
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { HFKilterScreen, KILTER_CLIMBS, KILTER_ROLES });
