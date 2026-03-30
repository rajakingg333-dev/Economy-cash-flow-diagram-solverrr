import React, { useState } from 'react';
import { Calculator, TrendingUp, Coins, Percent, ListPlus, Trash2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('custom');

  const tabs = [
    { id: 'single', label: 'Single Payment', icon: <Coins className="w-4 h-4 mr-2" /> },
    { id: 'uniform', label: 'Uniform Series', icon: <Calculator className="w-4 h-4 mr-2" /> },
    { id: 'gradient', label: 'Gradients', icon: <TrendingUp className="w-4 h-4 mr-2" /> },
    { id: 'interest', label: 'Effective Interest', icon: <Percent className="w-4 h-4 mr-2" /> },
    { id: 'custom', label: 'Custom Builder', icon: <ListPlus className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Engineering Economy Solver</h1>
            <p className="text-slate-500 text-sm mt-1">Based on Tarquin's Basics of Engineering Economy</p>
          </div>
          <div className="hidden md:flex p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calculator className="w-6 h-6" />
          </div>
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
              {tab.icon}
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

// --- Custom Builder Component ---

function CustomBuilder() {
  const [globalI, setGlobalI] = useState('10');
  const [globalN, setGlobalN] = useState('10');
  const [targetT, setTargetT] = useState('0');
  const [flows, setFlows] = useState([]);
  const [newFlow, setNewFlow] = useState({ type: 'single', amount: '', tStart: '0', tEnd: '5', g: '' });

  const parsedI = parseFloat(globalI) / 100;
  const parsedN = Math.floor(parseFloat(globalN));
  const parsedTargetT = parseInt(targetT);
  const validTargetT = !isNaN(parsedTargetT) && parsedTargetT >= 0 && parsedTargetT <= parsedN ? parsedTargetT : 0;
  const isValid = !isNaN(parsedI) && !isNaN(parsedN) && parsedN > 0;

  const handleAdd = () => {
    if (!newFlow.amount || isNaN(parseFloat(newFlow.amount))) return;
    setFlows([...flows, { ...newFlow, id: Date.now() }]);
    setNewFlow({ ...newFlow, amount: '', g: '' }); // Reset amounts, keep times
  };

  const handleRemove = (id) => {
    setFlows(flows.filter(f => f.id !== id));
  };

  // Calculate net cash flows per period
  let netCashFlows = [];
  let npv = 0;
  let fv = 0;
  let targetWorth = 0;
  let aw = 0;

  if (isValid) {
    netCashFlows = new Array(parsedN + 1).fill(0);
    
    flows.forEach(f => {
      const a = parseFloat(f.amount) || 0;
      const tStart = parseInt(f.tStart) || 0;
      const tEnd = parseInt(f.tEnd) || 0;
      const g = parseFloat(f.g) || 0;

      if (f.type === 'single') {
        if (tStart >= 0 && tStart <= parsedN) netCashFlows[tStart] += a;
      } else if (f.type === 'uniform') {
        for (let t = tStart; t <= tEnd; t++) {
          if (t >= 0 && t <= parsedN) netCashFlows[t] += a;
        }
      } else if (f.type === 'gradient') {
        for (let t = tStart; t <= tEnd; t++) {
          if (t >= 0 && t <= parsedN) netCashFlows[t] += a + (t - tStart) * g;
        }
      }
    });

    // Calculate Present Worth and Future Worth
    netCashFlows.forEach((val, t) => {
      npv += val / Math.pow(1 + parsedI, t);
    });
    fv = npv * Math.pow(1 + parsedI, parsedN);
    targetWorth = npv * Math.pow(1 + parsedI, validTargetT);
    
    // Calculate Annual Worth (A) over n periods
    if (parsedI === 0) {
      aw = npv / parsedN;
    } else {
      aw = npv * (parsedI * Math.pow(1 + parsedI, parsedN)) / (Math.pow(1 + parsedI, parsedN) - 1);
    }
  }

  // Format flows for the diagram
  const diagramFlows = netCashFlows.map((val, t) => {
    if (Math.abs(val) < 0.0001) return null; // Ignore zeros
    return {
      t,
      val: Math.abs(val),
      direction: val > 0 ? 'up' : 'down',
      isUnknown: false
    };
  }).filter(Boolean);

  if (isValid && Math.abs(targetWorth) > 0.0001) {
    diagramFlows.push({
      t: validTargetT,
      val: Math.abs(targetWorth),
      direction: targetWorth > 0 ? 'up' : 'down',
      isUnknown: true,
      label: `W`
    });
  }

  // Helper formatting function for exact signs
  const formatValueWithSign = (val) => {
    const isNeg = val < 0;
    const absValStr = Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${isNeg ? '-' : '+'}$${absValStr}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-lg font-semibold mb-2">Custom Cash Flow Builder</h2>
        <p className="text-sm text-slate-500 mb-6">Build a complex timeline by stacking multiple cash flows. The diagram and totals calculate automatically.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-slate-100">
          <InputField label="Global Interest Rate (i) % per period" value={globalI} onChange={(e) => setGlobalI(e.target.value)} />
          <InputField label="Total Project Periods (n)" value={globalN} onChange={(e) => setGlobalN(e.target.value)} />
          <InputField label="Evaluate Worth at Period (t)" value={targetT} onChange={(e) => setTargetT(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Add Flow */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h3 className="text-md font-medium text-slate-700 mb-4">Add Cash Flow Series</h3>
          
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-600 mb-1">Cash Flow Type</label>
              <select 
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                value={newFlow.type}
                onChange={(e) => setNewFlow({...newFlow, type: e.target.value})}
              >
                <option value="single">Single Payment</option>
                <option value="uniform">Uniform Series (A)</option>
                <option value="gradient">Arithmetic Gradient (G)</option>
              </select>
            </div>

            <InputField 
              label={newFlow.type === 'gradient' ? "Base Amount in Year 1 (A₁) $" : "Amount $ (+ for receipt, - for cost)"} 
              value={newFlow.amount} 
              onChange={(e) => setNewFlow({...newFlow, amount: e.target.value})} 
            />

            {newFlow.type === 'gradient' && (
              <InputField label="Gradient Amount (G) $" value={newFlow.g} onChange={(e) => setNewFlow({...newFlow, g: e.target.value})} />
            )}

            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label={newFlow.type === 'single' ? "At Period (t)" : "Start Period (t₁)"} 
                value={newFlow.tStart} 
                onChange={(e) => setNewFlow({...newFlow, tStart: e.target.value})} 
              />
              {newFlow.type !== 'single' && (
                <InputField label="End Period (t₂)" value={newFlow.tEnd} onChange={(e) => setNewFlow({...newFlow, tEnd: e.target.value})} />
              )}
            </div>

            <button 
              onClick={handleAdd}
              disabled={!newFlow.amount}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <ListPlus className="w-4 h-4 mr-2" />
              Add to Timeline
            </button>
          </div>
        </div>

        {/* Right Column: List of Flows */}
        <div>
          <h3 className="text-md font-medium text-slate-700 mb-4">Current Cash Flows</h3>
          {flows.length === 0 ? (
            <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">
              No cash flows added yet. Use the form to build your timeline.
            </div>
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2">
              {flows.map((flow) => {
                const amt = parseFloat(flow.amount);
                const gAmt = parseFloat(flow.g || '0');
                return (
                  <div key={flow.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded mr-2">
                        {flow.type}
                      </span>
                      <span className={`font-medium ${amt < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {amt < 0 ? '-' : '+'}${Math.abs(amt).toLocaleString()}
                      </span>
                      {flow.type === 'gradient' && (
                        <span className={`text-sm ml-1 ${gAmt < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                           {gAmt < 0 ? '-' : '+'} ${Math.abs(gAmt).toLocaleString()} /per
                        </span>
                      )}
                      <div className="text-xs text-slate-500 mt-1">
                        {flow.type === 'single' ? `Occurs at t = ${flow.tStart}` : `From t = ${flow.tStart} to ${flow.tEnd}`}
                      </div>
                    </div>
                    <button onClick={() => handleRemove(flow.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Results and Diagram */}
      {isValid && flows.length > 0 && (
        <div className="mt-8 pt-8 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={`p-6 bg-slate-50 border rounded-xl ${npv < 0 ? 'border-red-200' : 'border-emerald-200'}`}>
              <p className="text-sm font-medium text-slate-600 mb-1">Present Worth (P) at t=0</p>
              <p className={`text-2xl font-bold ${npv < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                {formatValueWithSign(npv)}
              </p>
            </div>
            <div className={`p-6 bg-slate-50 border rounded-xl ${fv < 0 ? 'border-red-200' : 'border-indigo-200'}`}>
              <p className="text-sm font-medium text-slate-600 mb-1">Future Worth (F) at t={parsedN}</p>
              <p className={`text-2xl font-bold ${fv < 0 ? 'text-red-600' : 'text-indigo-700'}`}>
                {formatValueWithSign(fv)}
              </p>
            </div>
            <div className={`p-6 bg-slate-50 border rounded-xl ${aw < 0 ? 'border-red-200' : 'border-amber-200'}`}>
              <p className="text-sm font-medium text-slate-600 mb-1">Annual Worth (A) for 1 to {parsedN}</p>
              <p className={`text-2xl font-bold ${aw < 0 ? 'text-red-600' : 'text-amber-700'}`}>
                {formatValueWithSign(aw)}
              </p>
            </div>
            <div className={`p-6 bg-slate-50 border-2 border-dashed shadow-sm rounded-xl ${targetWorth < 0 ? 'border-red-300' : 'border-pink-300'}`}>
              <p className="text-sm font-medium text-slate-600 mb-1">Equivalent Worth (W) at t={validTargetT}</p>
              <p className={`text-2xl font-bold ${targetWorth < 0 ? 'text-red-600' : 'text-pink-700'}`}>
                {formatValueWithSign(targetWorth)}
              </p>
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Consolidated Net Cash Flow Diagram</h3>
            </div>
            <div className="w-full overflow-x-auto">
              <CashFlowDiagram flows={diagramFlows} n={parsedN} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Calculators Components ---

function SinglePayment() {
  const [mode, setMode] = useState('findF');
  const [inputs, setInputs] = useState({ p: '', f: '', i: '', n: '' });

  const calculate = () => {
    const i = parseFloat(inputs.i) / 100;
    const n = parseFloat(inputs.n);
    const p = parseFloat(inputs.p);
    const f = parseFloat(inputs.f);

    if (isNaN(i) || isNaN(n)) return null;

    let value, formula, factor, flows = [];

    if (mode === 'findF' && !isNaN(p)) {
      value = p * Math.pow(1 + i, n);
      formula = 'F = P(1 + i)ⁿ';
      factor = '(F/P, i, n)';
      flows.push({ t: 0, val: p, isUnknown: false, label: 'P', direction: p < 0 ? 'down' : 'up' });
      flows.push({ t: n, val: value, isUnknown: true, label: 'F', direction: value < 0 ? 'down' : 'up' });
      return { value, formula, factor, flows, n };
    }
    
    if (mode === 'findP' && !isNaN(f)) {
      value = f / Math.pow(1 + i, n);
      formula = 'P = F / (1 + i)ⁿ';
      factor = '(P/F, i, n)';
      flows.push({ t: 0, val: value, isUnknown: true, label: 'P', direction: value < 0 ? 'down' : 'up' });
      flows.push({ t: n, val: f, isUnknown: false, label: 'F', direction: f < 0 ? 'down' : 'up' });
      return { value, formula, factor, flows, n };
    }
    return null;
  };

  const result = calculate();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-lg font-semibold mb-4">Single Payment Factors</h2>
        <div className="flex gap-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="radio" checked={mode === 'findF'} onChange={() => setMode('findF')} className="text-blue-600" />
            <span>Find Future Worth (F) given Present Worth (P)</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="radio" checked={mode === 'findP'} onChange={() => setMode('findP')} className="text-blue-600" />
            <span>Find Present Worth (P) given Future Worth (F)</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mode === 'findF' ? (
          <InputField label="Present Worth (P) $" value={inputs.p} onChange={(e) => setInputs({...inputs, p: e.target.value})} />
        ) : (
          <InputField label="Future Worth (F) $" value={inputs.f} onChange={(e) => setInputs({...inputs, f: e.target.value})} />
        )}
        <InputField label="Interest Rate (i) % per period" value={inputs.i} onChange={(e) => setInputs({...inputs, i: e.target.value})} />
        <InputField label="Number of periods (n)" value={inputs.n} onChange={(e) => setInputs({...inputs, n: e.target.value})} />
      </div>

      <ResultDisplay result={result} symbol={mode === 'findF' ? 'F' : 'P'} />
    </div>
  );
}

function UniformSeries() {
  const [mode, setMode] = useState('findPgivenA');
  const [inputs, setInputs] = useState({ p: '', f: '', a: '', i: '', n: '' });

  const calculate = () => {
    const i = parseFloat(inputs.i) / 100;
    const n = Math.floor(parseFloat(inputs.n));
    const a = parseFloat(inputs.a);
    const p = parseFloat(inputs.p);
    const f = parseFloat(inputs.f);

    if (isNaN(i) || isNaN(n) || n <= 0 || i === 0) return null;

    let value, formula, factor, flows = [];

    if (mode === 'findPgivenA' && !isNaN(a)) {
      value = a * (Math.pow(1 + i, n) - 1) / (i * Math.pow(1 + i, n));
      formula = 'P = A[((1+i)ⁿ - 1) / (i(1+i)ⁿ)]';
      factor = '(P/A, i, n)';
      flows.push({ t: 0, val: value, isUnknown: true, label: 'P', direction: value < 0 ? 'down' : 'up' });
      for(let j=1; j<=n; j++) flows.push({ t: j, val: a, isUnknown: false, label: j===1?'A':'', direction: a < 0 ? 'down' : 'up' });
      return { value, formula, factor, flows, n };
    }
    if (mode === 'findFgivenA' && !isNaN(a)) {
      value = a * (Math.pow(1 + i, n) - 1) / i;
      formula = 'F = A[((1+i)ⁿ - 1) / i]';
      factor = '(F/A, i, n)';
      for(let j=1; j<=n; j++) flows.push({ t: j, val: a, isUnknown: false, label: j===1?'A':'', direction: a < 0 ? 'down' : 'up' });
      flows.push({ t: n, val: value, isUnknown: true, label: 'F', direction: value < 0 ? 'down' : 'up' });
      return { value, formula, factor, flows, n };
    }
    if (mode === 'findAgivenP' && !isNaN(p)) {
      value = p * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
      formula = 'A = P[(i(1+i)ⁿ) / ((1+i)ⁿ - 1)]';
      factor = '(A/P, i, n)';
      flows.push({ t: 0, val: p, isUnknown: false, label: 'P', direction: p < 0 ? 'down' : 'up' });
      for(let j=1; j<=n; j++) flows.push({ t: j, val: value, isUnknown: true, label: j===1?'A':'', direction: value < 0 ? 'down' : 'up' });
      return { value, formula, factor, flows, n };
    }
    if (mode === 'findAgivenF' && !isNaN(f)) {
      value = f * i / (Math.pow(1 + i, n) - 1);
      formula = 'A = F[i / ((1+i)ⁿ - 1)]';
      factor = '(A/F, i, n)';
      for(let j=1; j<=n; j++) flows.push({ t: j, val: value, isUnknown: true, label: j===1?'A':'', direction: value < 0 ? 'down' : 'up' });
      flows.push({ t: n, val: f, isUnknown: false, label: 'F', direction: f < 0 ? 'down' : 'up' });
      return { value, formula, factor, flows, n };
    }
    return null;
  };

  const result = calculate();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <h2 className="text-lg font-semibold mb-4">Uniform Series Factors</h2>
       <select 
          className="w-full md:w-1/2 p-2 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={mode} 
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="findPgivenA">Find Present Worth (P) given Uniform Series (A)</option>
          <option value="findFgivenA">Find Future Worth (F) given Uniform Series (A)</option>
          <option value="findAgivenP">Find Uniform Series (A) given Present Worth (P) - Capital Recovery</option>
          <option value="findAgivenF">Find Uniform Series (A) given Future Worth (F) - Sinking Fund</option>
       </select>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mode.includes('givenA') && <InputField label="Annual Series (A) $" value={inputs.a} onChange={(e) => setInputs({...inputs, a: e.target.value})} />}
        {mode === 'findAgivenP' && <InputField label="Present Worth (P) $" value={inputs.p} onChange={(e) => setInputs({...inputs, p: e.target.value})} />}
        {mode === 'findAgivenF' && <InputField label="Future Worth (F) $" value={inputs.f} onChange={(e) => setInputs({...inputs, f: e.target.value})} />}
        
        <InputField label="Interest Rate (i) % per period" value={inputs.i} onChange={(e) => setInputs({...inputs, i: e.target.value})} />
        <InputField label="Number of periods (n)" value={inputs.n} onChange={(e) => setInputs({...inputs, n: e.target.value})} />
      </div>

      <ResultDisplay result={result} symbol={mode.startsWith('findP') ? 'P' : mode.startsWith('findF') ? 'F' : 'A'} />
    </div>
  );
}

function Gradients() {
  const [mode, setMode] = useState('arithmetic');
  const [inputs, setInputs] = useState({ base: '', g: '', i: '', n: '' });

  const calculate = () => {
    const i = parseFloat(inputs.i) / 100;
    const n = Math.floor(parseFloat(inputs.n));
    const base = parseFloat(inputs.base) || 0; 
    let g = parseFloat(inputs.g);

    if (isNaN(i) || isNaN(n) || isNaN(g) || i === 0 || n <= 0) return null;

    let value, formula, factor, flows = [];

    if (mode === 'arithmetic') {
      const p_base = base * (Math.pow(1 + i, n) - 1) / (i * Math.pow(1 + i, n));
      const p_grad = (g / i) * (((Math.pow(1 + i, n) - 1) / (i * Math.pow(1 + i, n))) - (n / Math.pow(1 + i, n)));
      value = p_base + p_grad;
      formula = 'P = A₁(P/A, i, n) + G(P/G, i, n)';
      factor = 'Arithmetic Gradient';
      
      flows.push({ t: 0, val: value, isUnknown: true, label: 'P', direction: value < 0 ? 'down' : 'up' });
      for(let j=1; j<=n; j++) {
        const amt = base + (j-1)*g;
        flows.push({ t: j, val: amt, isUnknown: false, label: j===1?'A₁':'', direction: amt < 0 ? 'down' : 'up' });
      }
      return { value, formula, factor, flows, n };
    } else {
      g = g / 100; 
      let p_geom = 0;
      if (g === i) {
        p_geom = base * (n / (1 + i));
      } else {
        p_geom = base * (1 - Math.pow((1 + g)/(1 + i), n)) / (i - g);
      }
      value = p_geom;
      formula = 'P = A₁[1 - ((1+g)/(1+i))ⁿ] / (i - g)';
      factor = 'Geometric Gradient';

      flows.push({ t: 0, val: value, isUnknown: true, label: 'P', direction: value < 0 ? 'down' : 'up' });
      for(let j=1; j<=n; j++) {
        const amt = base * Math.pow(1+g, j-1);
        flows.push({ t: j, val: amt, isUnknown: false, label: j===1?'A₁':'', direction: amt < 0 ? 'down' : 'up' });
      }
      return { value, formula, factor, flows, n };
    }
  };

  const result = calculate();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-lg font-semibold mb-4">Gradient Series to Present Worth (P)</h2>
        <div className="flex gap-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="radio" checked={mode === 'arithmetic'} onChange={() => setMode('arithmetic')} className="text-blue-600" />
            <span>Arithmetic Gradient (G) - constant amount</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="radio" checked={mode === 'geometric'} onChange={() => setMode('geometric')} className="text-blue-600" />
            <span>Geometric Gradient (g) - constant percentage</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Base Amount in Year 1 (A₁) $" value={inputs.base} onChange={(e) => setInputs({...inputs, base: e.target.value})} />
        {mode === 'arithmetic' ? (
          <InputField label="Gradient Amount (G) $" value={inputs.g} onChange={(e) => setInputs({...inputs, g: e.target.value})} />
        ) : (
          <InputField label="Percentage Gradient (g) %" value={inputs.g} onChange={(e) => setInputs({...inputs, g: e.target.value})} />
        )}
        <InputField label="Interest Rate (i) % per period" value={inputs.i} onChange={(e) => setInputs({...inputs, i: e.target.value})} />
        <InputField label="Number of periods (n)" value={inputs.n} onChange={(e) => setInputs({...inputs, n: e.target.value})} />
      </div>

      <ResultDisplay result={result} symbol="P" />
    </div>
  );
}

function InterestRates() {
  const [inputs, setInputs] = useState({ r: '', m: '' });

  const r = parseFloat(inputs.r) / 100;
  const m = parseFloat(inputs.m);

  let effectiveRate = null;
  let continuousRate = null;

  if (!isNaN(r)) {
    if (!isNaN(m) && m > 0) {
      effectiveRate = (Math.pow(1 + (r / m), m) - 1) * 100;
    }
    continuousRate = (Math.exp(r) - 1) * 100;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h2 className="text-lg font-semibold mb-4">Nominal to Effective Interest Rate Converter</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Nominal Rate (r) % per year" value={inputs.r} onChange={(e) => setInputs({...inputs, r: e.target.value})} />
        <InputField label="Compounding periods per year (m)" value={inputs.m} onChange={(e) => setInputs({...inputs, m: e.target.value})} placeholder="e.g., 12 for monthly" />
      </div>

      {effectiveRate !== null && (
        <div className="mt-6 p-6 bg-blue-50 border border-blue-100 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-blue-200 pb-4">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Effective Annual Rate (i)</p>
              <p className="text-3xl font-bold text-slate-800">{effectiveRate.toFixed(4)} %</p>
            </div>
            <div className="text-right text-sm text-blue-500 font-mono">
              i = (1 + r/m)ᵐ - 1
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Effective Continuous Compounding Rate</p>
              <p className="text-2xl font-bold text-slate-700">{continuousRate.toFixed(4)} %</p>
            </div>
            <div className="text-right text-sm text-blue-500 font-mono">
              i = eʳ - 1
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// --- Utility Components ---

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
  if (!result) {
    return (
      <div className="mt-8 p-6 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
        <Calculator className="w-8 h-8 mb-2 opacity-50" />
        <p>Enter values above to calculate</p>
      </div>
    );
  }

  // Formatting strings explicitly based on sign
  const isMoney = symbol !== 'i' && symbol !== 'n';
  const isNegative = result.value < 0;
  const absValue = Math.abs(result.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const displayString = isMoney
    ? `${isNegative ? '-' : '+'}$${absValue}`
    : `${isNegative ? '-' : ''}${absValue}`;
    
  const colorClass = isNegative && isMoney ? 'text-red-600' : 'text-slate-800';

  return (
    <div className="mt-8 space-y-6">
      {/* Result Card */}
      <div className={`p-6 bg-slate-50 border rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2 ${isNegative && isMoney ? 'border-red-200 bg-red-50' : 'border-emerald-100 bg-emerald-50'}`}>
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">Calculated Result</p>
          <p className={`text-4xl font-bold flex items-baseline gap-2 ${colorClass}`}>
            {symbol} = {displayString}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm text-slate-600 font-medium mb-1">Standard Notation</p>
          <p className="font-mono bg-white px-3 py-1 rounded text-slate-700 text-sm shadow-sm border border-slate-200">{result.factor}</p>
          <p className="text-xs text-slate-500 mt-2 font-mono">{result.formula}</p>
        </div>
      </div>

      {/* Cash Flow Diagram */}
      {result.flows && result.flows.length > 0 && (
        <div className="p-6 bg-white border border-slate-200 rounded-xl animate-in fade-in shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Cash Flow Diagram</h3>
            <div className="flex gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-slate-800 inline-block"></span> Given</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t-2 border-dashed border-pink-500 inline-block"></span> Find</span>
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <CashFlowDiagram flows={result.flows} n={result.n} />
          </div>
        </div>
      )}
    </div>
  );
}

// --- Cash Flow Diagram SVG Component ---
function CashFlowDiagram({ flows, n }) {
  const width = 640;
  const height = 240;
  const paddingX = 40;
  const paddingY = 40;
  const baselineY = height / 2;
  const maxArrowHeight = (height / 2) - paddingY;

  // Ensure val properties are absolute to scale arrow lengths correctly 
  const displayFlows = flows.map(f => {
    return { ...f, absoluteVal: Math.abs(f.val) };
  });

  const maxVal = Math.max(...displayFlows.map(f => f.absoluteVal)) || 1;
  const isLargeN = n > 15;

  // Map "t" to an X coordinate
  const getX = (t) => {
    const usableWidth = width - (paddingX * 2);
    if (!isLargeN) {
      return paddingX + (t / n) * usableWidth;
    } else {
      // Create a visual break. Map t onto 7 segments: 0, 1, 2, 3, [break], n-1, n
      if (t <= 3) return paddingX + (t / 7) * usableWidth;
      if (t === n - 1) return paddingX + (5 / 7) * usableWidth;
      if (t === n) return paddingX + (6 / 7) * usableWidth;
      return -100; // hide others
    }
  };

  // Only render flows that fit into our abbreviated timeline
  const visibleFlows = displayFlows.filter(f => !isLargeN || f.t <= 3 || f.t >= n - 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-2xl mx-auto drop-shadow-sm font-sans">
      
      {/* Timeline Base */}
      {isLargeN ? (
        <>
          <line x1={paddingX} y1={baselineY} x2={getX(3.5)} y2={baselineY} stroke="#94a3b8" strokeWidth="2" />
          <text x={getX(4)} y={baselineY + 4} textAnchor="middle" fill="#94a3b8" fontSize="16" letterSpacing="2">...</text>
          <line x1={getX(4.5)} y1={baselineY} x2={getX(n)} y2={baselineY} stroke="#94a3b8" strokeWidth="2" />
        </>
      ) : (
        <line x1={paddingX} y1={baselineY} x2={width - paddingX} y2={baselineY} stroke="#94a3b8" strokeWidth="2" />
      )}

      {/* Ticks and time labels */}
      {Array.from({ length: n + 1 }).map((_, t) => {
        if (isLargeN && t > 3 && t < n - 1) return null;
        const x = getX(t);
        return (
          <g key={`tick-${t}`}>
            <line x1={x} y1={baselineY - 4} x2={x} y2={baselineY + 4} stroke="#94a3b8" strokeWidth="2" />
            <text x={x} y={baselineY + 20} textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="500">{t}</text>
          </g>
        );
      })}

      {/* Cash Flow Arrows */}
      {visibleFlows.map((flow, i) => {
        const flowsAtT = visibleFlows.filter(f => f.t === flow.t);
        let xOffset = 0;
        if (flowsAtT.length > 1) {
          if (flow.isUnknown) xOffset = 8;
          else xOffset = -8;
        }

        const x = getX(flow.t) + xOffset;
        const arrowHeight = (flow.absoluteVal / maxVal) * maxArrowHeight;
        
        // Ensure a minimum height so zero/tiny arrows are still vaguely visible as blips
        const h = Math.max(arrowHeight, 2); 
        
        const isUp = flow.direction === 'up';
        const startY = baselineY;
        const endY = isUp ? baselineY - h : baselineY + h;
        
        const color = flow.isUnknown ? '#ec4899' : (isUp ? '#059669' : '#dc2626');
        const strokeDasharray = flow.isUnknown ? "4 4" : "none";

        // Polygon points for arrow head
        const arrowHead = isUp 
          ? `${x-4},${endY+6} ${x},${endY} ${x+4},${endY+6}`
          : `${x-4},${endY-6} ${x},${endY} ${x+4},${endY-6}`;

        // Explicit label formatting
        const explicitSign = isUp ? '+' : '-';
        const displayValNum = flow.absoluteVal >= 1000 ? (flow.absoluteVal/1000).toFixed(1)+'k' : flow.absoluteVal.toFixed(0);

        return (
          <g key={`flow-${i}`}>
            {/* Arrow line */}
            <line 
              x1={x} y1={startY} x2={x} y2={endY} 
              stroke={color} 
              strokeWidth="2.5" 
              strokeDasharray={strokeDasharray} 
            />
            {/* Arrow head */}
            <polygon points={arrowHead} fill={color} />
            
            {/* Labels */}
            <text 
              x={x} 
              y={isUp ? endY - 10 : endY + 20} 
              textAnchor="middle" 
              fill={color} 
              fontSize="12" 
              fontWeight={flow.isUnknown ? "bold" : "normal"}
            >
              {flow.label ? `${flow.label}=` : ''}{explicitSign}{displayValNum}
            </text>
          </g>
        );
      })}
    </svg>
  );
}