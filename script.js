const { useState, useEffect } = React;

// --- Icon Wrapper (Since we aren't using NPM imports) ---
const Icon = ({ name, className }) => {
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, [name]);
  return <i data-lucide={name} className={className}></i>;
};

// --- Main App ---
function App() {
  const [activeTab, setActiveTab] = useState('custom');

  const tabs = [
    { id: 'single', label: 'Single Payment', icon: 'coins' },
    { id: 'uniform', label: 'Uniform Series', icon: 'calculator' },
    { id: 'gradient', label: 'Gradients', icon: 'trending-up' },
    { id: 'interest', label: 'Effective Interest', icon: 'percent' },
    { id: 'custom', label: 'Custom Builder', icon: 'list-plus' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Engineering Economy Solver</h1>
            <p className="text-slate-500 text-sm">UET Taxila - Mechanical Engineering Edition</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Icon name="calculator" className="w-6 h-6" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
              <Icon name={tab.icon} className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          {activeTab === 'single' && <SinglePayment />}
          {activeTab === 'uniform' && <UniformSeries />}
          {activeTab === 'gradient' && <Gradients />}
          {activeTab === 'interest' && <InterestRates />}
          {activeTab === 'custom' && <CustomBuilder />}
        </div>
      </div>
    </div>
  );
}

// --- Custom Builder (Full Version) ---
function CustomBuilder() {
  const [globalI, setGlobalI] = useState('10');
  const [globalN, setGlobalN] = useState('10');
  const [targetT, setTargetT] = useState('0');
  const [flows, setFlows] = useState([]);
  const [newFlow, setNewFlow] = useState({ type: 'single', amount: '', tStart: '0', tEnd: '5', g: '' });

  const i = parseFloat(globalI) / 100, n = parseInt(globalN), target = parseInt(targetT);
  const isValid = !isNaN(i) && !isNaN(n) && n > 0;

  const handleAdd = () => {
    if (!newFlow.amount) return;
    setFlows([...flows, { ...newFlow, id: Date.now() }]);
    setNewFlow({ ...newFlow, amount: '', g: '' });
  };

  let netFlows = new Array(n + 1).fill(0), npv = 0;
  if (isValid) {
    flows.forEach(f => {
      const amt = parseFloat(f.amount) || 0, tS = parseInt(f.tStart), tE = parseInt(f.tEnd), g = parseFloat(f.g) || 0;
      if (f.type === 'single' && tS <= n) netFlows[tS] += amt;
      else if (f.type === 'uniform') for (let t = tS; t <= tE && t <= n; t++) netFlows[t] += amt;
      else if (f.type === 'gradient') for (let t = tS; t <= tE && t <= n; t++) netFlows[t] += amt + (t - tS) * g;
    });
    netFlows.forEach((v, t) => npv += v / Math.pow(1 + i, t));
  }

  const fv = npv * Math.pow(1 + i, n);
  const aw = i === 0 ? npv / n : npv * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
  const tw = npv * Math.pow(1 + i, target);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-6">
        <InputField label="Interest Rate (i) %" value={globalI} onChange={e => setGlobalI(e.target.value)} />
        <InputField label="Total Periods (n)" value={globalN} onChange={e => setGlobalN(e.target.value)} />
        <InputField label="Evaluate at Time (t)" value={targetT} onChange={e => setTargetT(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
          <h3 className="font-medium text-slate-700">Add Cash Flow</h3>
          <select className="w-full p-2 border rounded-lg bg-white" value={newFlow.type} onChange={e => setNewFlow({...newFlow, type: e.target.value})}>
            <option value="single">Single Payment</option>
            <option value="uniform">Uniform Series (A)</option>
            <option value="gradient">Arithmetic Gradient (G)</option>
          </select>
          <InputField label="Amount $" value={newFlow.amount} onChange={e => setNewFlow({...newFlow, amount: e.target.value})} />
          {newFlow.type === 'gradient' && <InputField label="Gradient G $" value={newFlow.g} onChange={e => setNewFlow({...newFlow, g: e.target.value})} />}
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Start t" value={newFlow.tStart} onChange={e => setNewFlow({...newFlow, tStart: e.target.value})} />
            {newFlow.type !== 'single' && <InputField label="End t" value={newFlow.tEnd} onChange={e => setNewFlow({...newFlow, tEnd: e.target.value})} />}
          </div>
          <button onClick={handleAdd} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium flex items-center justify-center">
            <Icon name="list-plus" className="w-4 h-4 mr-2" /> Add to Timeline
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-slate-700">Timeline List</h3>
          {flows.map(f => (
            <div key={f.id} className="p-3 bg-white border rounded-lg flex justify-between items-center shadow-sm">
              <div className="text-sm">
                <span className="font-bold text-blue-600 uppercase text-xs bg-blue-50 px-2 py-1 rounded mr-2">{f.type}</span>
                <span className={f.amount < 0 ? 'text-red-600' : 'text-emerald-600'}>${f.amount}</span>
                <p className="text-slate-500 text-xs mt-1">t={f.tStart}{f.type !== 'single' ? ` to ${f.tEnd}` : ''}</p>
              </div>
              <button onClick={() => setFlows(flows.filter(x => x.id !== f.id))} className="text-slate-400 hover:text-red-500 transition">
                <Icon name="trash-2" className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {isValid && flows.length > 0 && (
        <div className="pt-6 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatBox label="Present Worth (P)" val={npv} color="emerald" />
          <StatBox label="Future Worth (F)" val={fv} color="indigo" />
          <StatBox label="Annual Worth (A)" val={aw} color="amber" />
          <StatBox label="Target Worth (W)" val={tw} color="pink" />
        </div>
      )}
    </div>
  );
}

// --- Formula Components (Single, Uniform, Gradient) ---
function SinglePayment() {
  const [mode, setMode] = useState('findF');
  const [inputs, setInputs] = useState({ p: '', f: '', i: '', n: '' });
  const i = parseFloat(inputs.i)/100, n = parseFloat(inputs.n), p = parseFloat(inputs.p), f = parseFloat(inputs.f);
  let res = null;
  if (!isNaN(i) && !isNaN(n)) {
    if (mode === 'findF' && !isNaN(p)) res = { value: p * Math.pow(1+i, n), formula: 'F = P(1+i)ⁿ', factor: '(F/P, i, n)', n, flows: [{t:0, val:p, dir:'up'}, {t:n, val: p*Math.pow(1+i,n), isU:true, dir:'up'}] };
    else if (mode === 'findP' && !isNaN(f)) res = { value: f / Math.pow(1+i, n), formula: 'P = F/(1+i)ⁿ', factor: '(P/F, i, n)', n, flows: [{t:0, val: f/Math.pow(1+i,n), isU:true, dir:'up'}, {t:n, val:f, dir:'up'}] };
  }
  return <div className="space-y-6">
    <div className="flex gap-4">
      <Radio label="Find F given P" active={mode==='findF'} onClick={()=>setMode('findF')} />
      <Radio label="Find P given F" active={mode==='findP'} onClick={()=>setMode('findP')} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <InputField label={mode==='findF'?'Present Worth P':'Future Worth F'} value={mode==='findF'?inputs.p:inputs.f} onChange={e=>setInputs({...inputs, [mode==='findF'?'p':'f']:e.target.value})} />
      <InputField label="Interest i %" value={inputs.i} onChange={e=>setInputs({...inputs, i:e.target.value})} />
      <InputField label="Periods n" value={inputs.n} onChange={e=>setInputs({...inputs, n:e.target.value})} />
    </div>
    <ResultCard result={res} symbol={mode==='findF'?'F':'P'} />
  </div>;
}

function UniformSeries() {
  const [mode, setMode] = useState('findPgivenA');
  const [inputs, setInputs] = useState({ a: '', p: '', f: '', i: '', n: '' });
  const i = parseFloat(inputs.i)/100, n = parseInt(inputs.n), a = parseFloat(inputs.a);
  let res = null;
  if (i > 0 && n > 0 && !isNaN(a)) {
    if (mode === 'findPgivenA') res = { value: a*(Math.pow(1+i,n)-1)/(i*Math.pow(1+i,n)), formula: 'P = A[(1+i)ⁿ-1]/[i(1+i)ⁿ]', factor: '(P/A, i, n)', n };
    else if (mode === 'findFgivenA') res = { value: a*(Math.pow(1+i,n)-1)/i, formula: 'F = A[(1+i)ⁿ-1]/i', factor: '(F/A, i, n)', n };
  }
  return <div className="space-y-6">
    <select className="p-2 border rounded-lg" value={mode} onChange={e=>setMode(e.target.value)}>
        <option value="findPgivenA">Find P given A</option>
        <option value="findFgivenA">Find F given A</option>
    </select>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <InputField label="Annual Amount A" value={inputs.a} onChange={e=>setInputs({...inputs, a:e.target.value})} />
      <InputField label="Interest i %" value={inputs.i} onChange={e=>setInputs({...inputs, i:e.target.value})} />
      <InputField label="Periods n" value={inputs.n} onChange={e=>setInputs({...inputs, n:e.target.value})} />
    </div>
    <ResultCard result={res} symbol={mode.includes('findP')?'P':'F'} />
  </div>;
}

function Gradients() {
  const [mode, setMode] = useState('arithmetic');
  const [inputs, setInputs] = useState({ base: '', g: '', i: '', n: '' });
  const i = parseFloat(inputs.i)/100, n = parseInt(inputs.n), a1 = parseFloat(inputs.base), g = parseFloat(inputs.g);
  let res = null;
  if (i > 0 && n > 0 && !isNaN(a1)) {
    const p_base = a1 * (Math.pow(1 + i, n) - 1) / (i * Math.pow(1 + i, n));
    const p_grad = (g / i) * (((Math.pow(1 + i, n) - 1) / (i * Math.pow(1 + i, n))) - (n / Math.pow(1 + i, n)));
    res = { value: p_base + p_grad, formula: 'P = A₁(P/A) + G(P/G)', factor: 'Arithmetic Gradient', n };
  }
  return <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InputField label="Base Amount A1" value={inputs.base} onChange={e=>setInputs({...inputs, base:e.target.value})} />
      <InputField label="Gradient G" value={inputs.g} onChange={e=>setInputs({...inputs, g:e.target.value})} />
      <InputField label="Interest i %" value={inputs.i} onChange={e=>setInputs({...inputs, i:e.target.value})} />
      <InputField label="Periods n" value={inputs.n} onChange={e=>setInputs({...inputs, n:e.target.value})} />
    </div>
    <ResultCard result={res} symbol="P" />
  </div>;
}

function InterestRates() {
  const [inputs, setInputs] = useState({ r: '', m: '' });
  const r = parseFloat(inputs.r)/100, m = parseFloat(inputs.m);
  const eff = (Math.pow(1 + r/m, m) - 1) * 100;
  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <InputField label="Nominal Rate r %" value={inputs.r} onChange={e=>setInputs({...inputs, r:e.target.value})} />
      <InputField label="Compounding Periods m" value={inputs.m} onChange={e=>setInputs({...inputs, m:e.target.value})} />
    </div>
    {eff > 0 && <div className="p-6 bg-blue-50 border rounded-xl text-center">
      <p className="text-blue-600 text-sm font-medium">Effective Annual Rate</p>
      <p className="text-4xl font-bold">{eff.toFixed(4)}%</p>
    </div>}
  </div>;
}

// --- UI Components ---
function InputField({ label, value, onChange }) {
  return <div className="flex flex-col"><label className="text-sm font-medium text-slate-600 mb-1">{label}</label>
  <input type="number" className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={value} onChange={onChange} placeholder="0.00" /></div>;
}

function StatBox({ label, val, color }) {
  const colors = { emerald: 'border-emerald-200 text-emerald-700 bg-emerald-50', indigo: 'border-indigo-200 text-indigo-700 bg-indigo-50', amber: 'border-amber-200 text-amber-700 bg-amber-50', pink: 'border-pink-200 text-pink-700 bg-pink-50' };
  return <div className={`p-4 border rounded-xl ${colors[color]}`}><p className="text-xs font-medium opacity-80">{label}</p><p className="text-xl font-bold">${val.toLocaleString(undefined, {maximumFractionDigits:2})}</p></div>;
}

function ResultCard({ result, symbol }) {
  if (!result) return <div className="p-6 border-2 border-dashed rounded-xl text-center text-slate-400">Enter values to calculate</div>;
  return <div className="p-6 bg-slate-50 border rounded-xl flex justify-between items-center">
    <div><p className="text-sm text-slate-600">Result</p><p className="text-4xl font-bold">{symbol} = ${result.value.toLocaleString(undefined, {maximumFractionDigits:2})}</p></div>
    <div className="text-right text-xs font-mono text-slate-400"><p>{result.factor}</p><p>{result.formula}</p></div>
  </div>;
}

function Radio({ label, active, onClick }) {
  return <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" checked={active} onChange={onClick} className="text-blue-600" /><span>{label}</span></label>;
}

function CashFlowDiagram({ flows, n }) {
  const width = 640, height = 200, padding = 40, baseY = 100;
  if (!flows || flows.length === 0) return null;
  const max = Math.max(...flows.map(f => Math.abs(f.val))) || 1;
  const getX = (t) => padding + (t / n) * (width - padding * 2);
  return <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
    <line x1={padding} y1={baseY} x2={width-padding} y2={baseY} stroke="#94a3b8" strokeWidth="2" />
    {flows.map((f, i) => {
        const x = getX(f.t), h = (Math.abs(f.val)/max)*60 + 5;
        const color = f.isU ? '#ec4899' : (f.val >= 0 ? '#10b981' : '#ef4444');
        return <g key={i}>
            <line x1={x} y1={baseY} x2={x} y2={f.val >=0 ? baseY-h : baseY+h} stroke={color} strokeWidth="2" strokeDasharray={f.isU ? "4 4" : "0"} />
            <circle cx={x} cy={baseY} r="3" fill="#94a3b8" />
            <text x={x} y={baseY+20} textAnchor="middle" fontSize="10" fill="#64748b">{f.t}</text>
        </g>
    })}
  </svg>;
}

// --- Render ---
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);