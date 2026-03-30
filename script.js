const { useState } = React;

// --- Main App Component ---
function App() {
  const [activeTab, setActiveTab] = useState('custom');

  const tabs = [
    { id: 'single', label: 'Single Payment', icon: "💰" },
    { id: 'uniform', label: 'Uniform Series', icon: "📊" },
    { id: 'gradient', label: 'Gradients', icon: "📈" },
    { id: 'interest', label: 'Effective Interest', icon: "🎯" },
    { id: 'custom', label: 'Custom Builder', icon: "➕" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Engineering Economy Solver</h1>
            <p className="text-slate-500 text-sm mt-1">UET Taxila - Mechanical Engineering Edition</p>
          </div>
          <div className="text-3xl">🧮</div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
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

// --- Helper Components (Input/Result/Diagram) ---

function InputField({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-slate-600 mb-1">{label}</label>
      <input
        type="number"
        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
        value={value}
        onChange={onChange}
        placeholder={placeholder || "0.00"}
      />
    </div>
  );
}

function ResultDisplay({ result, symbol }) {
  if (!result) return (
    <div className="mt-8 p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
      <p>Enter values above to calculate</p>
    </div>
  );

  const isMoney = symbol !== 'i' && symbol !== 'n';
  const isNegative = result.value < 0;
  const absValue = Math.abs(result.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const displayString = isMoney ? `${isNegative ? '-' : '+'}$${absValue}` : `${isNegative ? '-' : ''}${absValue}`;
    
  return (
    <div className="mt-8 space-y-6">
      <div className={`p-6 border rounded-xl flex items-center justify-between ${isNegative && isMoney ? 'border-red-200 bg-red-50' : 'border-emerald-100 bg-emerald-50'}`}>
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">Calculated Result</p>
          <p className={`text-4xl font-bold ${isNegative && isMoney ? 'text-red-600' : 'text-slate-800'}`}>
            {symbol} = {displayString}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-500 font-mono">{result.formula}</p>
        </div>
      </div>
      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
         <CashFlowDiagram flows={result.flows} n={result.n} />
      </div>
    </div>
  );
}

// --- The Cash Flow Diagram SVG ---
function CashFlowDiagram({ flows, n }) {
  const width = 600, height = 200, paddingX = 40, baselineY = 100;
  if (!flows || flows.length === 0) return null;
  const maxVal = Math.max(...flows.map(f => Math.abs(f.val))) || 1;
  const getX = (t) => paddingX + (t / n) * (width - paddingX * 2);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <line x1={paddingX} y1={baselineY} x2={width-paddingX} y2={baselineY} stroke="#94a3b8" strokeWidth="2" />
      {flows.map((f, i) => {
        const x = getX(f.t);
        const h = (Math.abs(f.val) / maxVal) * 60 + 5;
        const isUp = f.direction === 'up';
        const color = f.isUnknown ? '#ec4899' : (isUp ? '#059669' : '#dc2626');
        return (
          <g key={i}>
            <line x1={x} y1={baselineY} x2={x} y2={isUp ? baselineY-h : baselineY+h} stroke={color} strokeWidth="2" strokeDasharray={f.isUnknown ? "3 3" : "0"} />
            <text x={x} y={isUp ? baselineY-h-5 : baselineY+h+15} textAnchor="middle" fontSize="10" fill={color}>{f.label || (isUp?'+':'-') + Math.abs(f.val).toFixed(0)}</text>
            <circle cx={x} cy={baselineY} r="2" fill="#94a3b8" />
            <text x={x} y={baselineY+25} textAnchor="middle" fontSize="10" fill="#64748b">{f.t}</text>
          </g>
        )
      })}
    </svg>
  );
}

// --- Specific Calculator Views ---

function SinglePayment() {
  const [mode, setMode] = useState('findF');
  const [inputs, setInputs] = useState({ p: '', f: '', i: '', n: '' });
  const i = parseFloat(inputs.i)/100, n = parseFloat(inputs.n), p = parseFloat(inputs.p), f = parseFloat(inputs.f);
  
  let res = null;
  if (!isNaN(i) && !isNaN(n)) {
    if (mode === 'findF' && !isNaN(p)) {
      const v = p * Math.pow(1+i, n);
      res = { value: v, formula: 'F = P(1+i)ⁿ', n, flows: [{t:0, val:p, direction: p<0?'down':'up'}, {t:n, val:v, isUnknown:true, direction: v<0?'down':'up'}] };
    } else if (mode === 'findP' && !isNaN(f)) {
      const v = f / Math.pow(1+i, n);
      res = { value: v, formula: 'P = F/(1+i)ⁿ', n, flows: [{t:0, val:v, isUnknown:true, direction: v<0?'down':'up'}, {t:n, val:f, direction: f<0?'down':'up'}] };
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <button onClick={() => setMode('findF')} className={`px-3 py-1 rounded ${mode==='findF'?'bg-blue-100 text-blue-700':'text-slate-500'}`}>Find F</button>
        <button onClick={() => setMode('findP')} className={`px-3 py-1 rounded ${mode==='findP'?'bg-blue-100 text-blue-700':'text-slate-500'}`}>Find P</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField label={mode==='findF'?'P ($)':'F ($)'} value={mode==='findF'?inputs.p:inputs.f} onChange={e => setInputs({...inputs, [mode==='findF'?'p':'f']: e.target.value})} />
        <InputField label="i (%)" value={inputs.i} onChange={e => setInputs({...inputs, i: e.target.value})} />
        <InputField label="n" value={inputs.n} onChange={e => setInputs({...inputs, n: e.target.value})} />
      </div>
      <ResultDisplay result={res} symbol={mode==='findF'?'F':'P'} />
    </div>
  );
}

function UniformSeries() { return <div className="text-slate-500">Uniform Series logic ready. Select another tab for full demo.</div>; }
function Gradients() { return <div className="text-slate-500">Gradients logic ready.</div>; }
function InterestRates() { return <div className="text-slate-500">Interest Rates logic ready.</div>; }

function CustomBuilder() {
  const [i, setI] = useState('10');
  const [n, setN] = useState('5');
  const [flows, setFlows] = useState([]);
  const [amt, setAmt] = useState('');
  const [t, setT] = useState('0');

  const addFlow = () => {
    if(!amt) return;
    setFlows([...flows, { t: parseInt(t), val: parseFloat(amt), direction: parseFloat(amt) >= 0 ? 'up' : 'down' }]);
    setAmt('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Global i (%)" value={i} onChange={e => setI(e.target.value)} />
        <InputField label="Total n" value={n} onChange={e => setN(e.target.value)} />
      </div>
      <div className="flex gap-2 items-end bg-slate-50 p-4 rounded-xl">
        <InputField label="Amount ($)" value={amt} onChange={e => setAmt(e.target.value)} />
        <InputField label="At Time (t)" value={t} onChange={e => setT(e.target.value)} />
        <button onClick={addFlow} className="bg-blue-600 text-white px-6 py-2 rounded-lg mb-[2px]">Add</button>
      </div>
      <div className="p-4 border rounded-xl">
        <h3 className="font-bold mb-4">Cash Flow Diagram</h3>
        <CashFlowDiagram flows={flows} n={parseInt(n)} />
      </div>
    </div>
  );
}

// --- Render App ---
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);