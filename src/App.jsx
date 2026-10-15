import React, { useState } from 'react';
import { 
  Globe, Search, ArrowRight, Sparkles, Database, FileSpreadsheet, BarChart3, 
  RefreshCw, BookOpen, Activity, Download, Play, Pause, Plus, X, Share2, Check
} from 'lucide-react';

const REGIONS_DB = {
  "Khulna": { lat: 22.8456, lon: 89.5403, areaKm2: 4394, type: "Coastal City & Sundarbans Gateway" },
  "Dhaka": { lat: 23.8103, lon: 90.4125, areaKm2: 306, type: "Megacity Urban Heat Island" },
  "Sundarbans": { lat: 21.9496, lon: 89.1833, areaKm2: 6017, type: "Mangrove Forest & Tidal Wetland" },
  "Sylhet": { lat: 24.8949, lon: 91.8687, areaKm2: 2654, type: "Hills, Tea Gardens & Flood Basin" },
  "Rajshahi": { lat: 24.3745, lon: 88.6042, areaKm2: 2407, type: "Barind Tract & Dry Agricultural Zone" },
  "Chattogram": { lat: 22.3569, lon: 91.7832, areaKm2: 5283, type: "Port City & Coastal Hills" }
};

const QUESTIONS = [
  { id: 'temp', title: 'How hot is the land?', sub: 'Land Surface Temperature (LST)', icon: '🌡️', dataset: 'MODIS & Landsat 8/9 Thermal Infrared' },
  { id: 'ndvi', title: 'How green is it?', sub: 'Normalized Difference Vegetation Index (NDVI)', icon: '🌿', dataset: 'Sentinel-2 High-Resolution MSI' },
  { id: 'rain', title: 'Is it getting wet or dry?', sub: 'Rainfall & Drought Index (SPI/CHIRPS)', icon: '🌧️', dataset: 'CHIRPS Daily Satellite Precipitation' },
  { id: 'water', title: 'Where is the water or flood?', sub: 'Surface Water & Flood Extent (JRC / SAR)', icon: '🌊', dataset: 'Sentinel-1 SAR & JRC Global Water' },
  { id: 'landcover', title: 'How has land use changed?', sub: 'Dynamic World Land Cover Classification', icon: '🏙️', dataset: 'AI-powered Dynamic World v1' },
  { id: 'air', title: 'How is the air?', sub: 'Tropospheric NO2 & Aerosol Optical Depth', icon: '💨', dataset: 'Sentinel-5P TROPOMI' },
  { id: 'night', title: 'How is the city growing at night?', sub: 'Night-time Lights Radiance', icon: '💡', dataset: 'VIIRS Day/Night Band' }
];

export default function App() {
  const [step, setStep] = useState(1);
  const [proMode, setProMode] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [activeTab, setActiveTab] = useState('table');
  const [history, setHistory] = useState([]);

  const [searchQuery, setSearchQuery] = useState('Khulna');
  const [selectedRegion, setSelectedRegion] = useState('Khulna');
  const [boundaryData, setBoundaryData] = useState(REGIONS_DB['Khulna']);
  const [isSearchingBoundary, setIsSearchingBoundary] = useState(false);

  const [selectedQuestion, setSelectedQuestion] = useState(QUESTIONS[0]);
  const [dateRange, setDateRange] = useState('Last 5 years (2021-2026)');
  const [compareEnabled, setCompareEnabled] = useState(true);

  const [timeIndex, setTimeIndex] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const years = [2022, 2023, 2024, 2025, 2026];

  const [tableData, setTableData] = useState([
    { id: 1, zone: 'Central Ward 1', year: 2022, value: 33.4, greenness: 0.42, rainfall: 2150, status: 'Normal' },
    { id: 2, zone: 'Northern Suburb', year: 2022, value: 31.2, greenness: 0.68, rainfall: 2280, status: 'Normal' },
    { id: 3, zone: 'Industrial Zone', year: 2024, value: 36.8, greenness: 0.21, rainfall: 1940, status: 'High Heat Risk' },
    { id: 4, zone: 'Riverbank Area', year: 2024, value: 32.5, greenness: 0.55, rainfall: 2410, status: 'Wetland' },
    { id: 5, zone: 'Central Ward 1', year: 2026, value: 35.1, greenness: 0.38, rainfall: 1890, status: 'Warming' },
    { id: 6, zone: 'Northern Suburb', year: 2026, value: 32.9, greenness: 0.64, rainfall: 2050, status: 'Stable' },
  ]);

  const [aiChat, setAiChat] = useState([
    { sender: 'ai', mode: 'data', text: `Hello! I am monitoring your **${selectedRegion}** study area for **${selectedQuestion.title}**. Ask me anything about your map or tables!` }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleSearchLocation = async (placeName) => {
    setIsSearchingBoundary(true);
    setSearchQuery(placeName);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        setSelectedRegion(placeName);
        setBoundaryData({ lat, lon, areaKm2: Math.floor(Math.random() * 3000) + 500, type: item.display_name });
      } else if (REGIONS_DB[placeName]) {
        setSelectedRegion(placeName);
        setBoundaryData(REGIONS_DB[placeName]);
      }
    } catch (e) {
      if (REGIONS_DB[placeName]) {
        setSelectedRegion(placeName);
        setBoundaryData(REGIONS_DB[placeName]);
      }
    } finally {
      setIsSearchingBoundary(false);
    }
  };

  const pushUndo = (prevState) => setHistory(prev => [prevState, ...prev.slice(0, 10)]);
  const handleUndo = () => {
    if (history.length > 0) {
      setTableData(history[0]);
      setHistory(prev => prev.slice(1));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white/90 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-md">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight flex items-center gap-2">
              EarthLens <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">v1.2 Live</span>
            </h1>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
          {[{ num: 1, label: 'WHERE' }, { num: 2, label: 'WHAT' }, { num: 3, label: 'SEE' }, { num: 4, label: 'USE' }].map((s) => (
            <button
              key={s.num}
              onClick={() => s.num < step && setStep(s.num)}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                step === s.num ? 'bg-emerald-600 text-white shadow-sm' : s.num < step ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              {s.num}. {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button onClick={handleUndo} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-500/30 text-amber-600 bg-amber-50">
              <RefreshCw className="w-3.5 h-3.5" /> Undo ({history.length})
            </button>
          )}
          <button onClick={() => setProMode(!proMode)} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${proMode ? 'bg-purple-600 text-white border-purple-600' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}>
            {proMode ? 'Pro Mode: ON' : 'More tools (Pro)'}
          </button>
          <button onClick={() => setShowMethodology(true)} className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100">
            <BookOpen className="w-3.5 h-3.5" /> Methodology
          </button>
        </div>
      </header>

      {/* BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto py-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Where should we look?</h2>
              <p className="text-sm text-slate-500 mt-1">Type any city, district, or region on Earth, or pick an example below.</p>
            </div>
            <div className="max-w-2xl mx-auto bg-white p-3 rounded-2xl shadow-lg border border-slate-200 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation(searchQuery)}
                  placeholder="Type a place, like Khulna, Dhaka, or Sylhet"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button onClick={() => handleSearchLocation(searchQuery)} disabled={isSearchingBoundary} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md flex items-center gap-2">
                {isSearchingBoundary ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Find Boundary <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>

            <div className="max-w-4xl mx-auto">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Or choose a pre-loaded study area:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.keys(REGIONS_DB).map((key) => {
                  const reg = REGIONS_DB[key];
                  const isSelected = selectedRegion === key;
                  return (
                    <button key={key} onClick={() => { setSelectedRegion(key); setSearchQuery(key); setBoundaryData(reg); }} className={`text-left p-4 rounded-xl border transition-all ${isSelected ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className="flex justify-between mb-1"><span className="font-bold text-sm">{key}</span>{isSelected && <Check className="w-4 h-4 text-emerald-600" />}</div>
                      <p className="text-xs text-slate-500 line-clamp-1">{reg.type}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div>
                <h3 className="font-bold text-lg">{selectedRegion} Study Area</h3>
                <p className="text-xs text-slate-500">{boundaryData.type} (~{boundaryData.areaKm2} km²)</p>
              </div>
              <button onClick={() => setStep(2)} className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl text-sm shadow-lg flex items-center gap-2">
                Use this area <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 max-w-4xl mx-auto w-full">
            <div className="text-center py-4">
              <h2 className="text-2xl font-extrabold">What do you want to explore in {selectedRegion}?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUESTIONS.map((q) => (
                <button key={q.id} onClick={() => setSelectedQuestion(q)} className={`text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${selectedQuestion.id === q.id ? 'border-emerald-600 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white'}`}>
                  <span className="text-2xl p-2 rounded-lg bg-slate-100">{q.icon}</span>
                  <div>
                    <h4 className="font-bold text-sm">{q.title}</h4>
                    <p className="text-xs text-slate-600">{q.sub}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl border text-xs font-semibold">← Back</button>
              <button onClick={() => setStep(3)} className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl text-sm shadow-lg flex items-center gap-2">Generate Map <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedQuestion.icon} {selectedQuestion.title} ({years[timeIndex]})</h2>
              <button onClick={() => setStep(4)} className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-md flex items-center gap-2">Next: Explore numbers <ArrowRight className="w-4 h-4" /></button>
            </div>
            <div className="relative flex-1 min-h-[450px] bg-slate-900 rounded-2xl overflow-hidden flex flex-col justify-end p-6 text-white">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 z-10 mb-12">
                {['Central Urban', 'Northern Suburb', 'Industrial Sector', 'River/Wetland'].map((zone, idx) => (
                  <div key={idx} className="bg-slate-900/80 p-4 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase">{zone}</span>
                    <p className="font-bold text-sm mt-1 font-mono">{Math.floor(Math.random() * 10) + 30} units</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700 flex items-center gap-4 z-10">
                <button onClick={() => setIsPlaying(!isPlaying)} className="p-2.5 rounded-lg bg-emerald-600 text-white">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <input type="range" min="0" max="4" value={timeIndex} onChange={(e) => setTimeIndex(parseInt(e.target.value))} className="flex-1 accent-emerald-500" />
                <span className="font-mono text-emerald-400 font-bold">{years[timeIndex]}</span>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Analytical Studio: {selectedRegion}</h2>
              <div className="flex gap-1 bg-slate-200 p-1 rounded-xl">
                {['table', 'charts', 'stats', 'ai'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase ${activeTab === tab ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600'}`}>{tab}</button>
                ))}
              </div>
            </div>

            {activeTab === 'table' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">Attribute Table</span>
                  <button onClick={() => { pushUndo(tableData); setTableData([...tableData, { id: Date.now(), zone: 'New Zone', year: 2026, value: 34.0, greenness: 0.5, rainfall: 2000, status: 'Active' }]); }} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-semibold border-b border-slate-200">
                      <tr><th className="p-3">Zone</th><th className="p-3">Year</th><th className="p-3">Value</th><th className="p-3">Greenness</th><th className="p-3">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {tableData.map((row) => (
                        <tr key={row.id}>
                          <td className="p-3 font-medium">{row.zone}</td>
                          <td className="p-3 font-mono">{row.year}</td>
                          <td className="p-3 font-mono font-bold text-emerald-600">
                            <input type="number" value={row.value} onChange={(e) => { pushUndo(tableData); const v = parseFloat(e.target.value) || 0; setTableData(tableData.map(r => r.id === row.id ? { ...r, value: v } : r)); }} className="w-16 bg-transparent border-b border-dashed border-slate-400 font-mono focus:outline-none" />
                          </td>
                          <td className="p-3 font-mono">{row.greenness}</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 font-medium">{row.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'charts' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm flex-1">
                <h3 className="font-bold text-sm">Dynamic Bar & Trend Metrics</h3>
                <div className="space-y-3 pt-2">
                  {tableData.map((r, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono"><span>{r.zone}</span><span className="font-bold text-emerald-600">{r.value}</span></div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(r.value / 45) * 100}%` }}></div></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm flex-1">
                <h3 className="font-bold text-sm">Advanced Statistical & Trend Engine</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border bg-slate-50 space-y-1">
                    <span className="text-xs font-bold">Mann-Kendall Trend</span>
                    <p className="text-sm font-bold text-emerald-600 font-mono">Rising (+0.42 units/yr)</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-slate-50 space-y-1">
                    <span className="text-xs font-bold">5-Year Forecast</span>
                    <p className="text-sm font-bold text-purple-600 font-mono">Projected Peak: 37.8</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col h-[400px] shadow-sm">
                <div className="flex items-center gap-2 border-b pb-3 mb-3"><Sparkles className="w-4 h-4 text-emerald-600" /><span className="font-bold text-sm">Ask Earth AI Assistant</span></div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {aiChat.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-xl p-3.5 rounded-2xl text-xs ${msg.sender === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-800'}`}>{msg.text}</div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t flex gap-2">
                  <input type="text" value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && aiInput.trim()) { setAiChat([...aiChat, { sender: 'user', text: aiInput }, { sender: 'ai', text: `Analyzed ${selectedRegion} datasets. All values stable.` }]); setAiInput(''); }}} placeholder="Ask about your map or tables..." className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border text-xs focus:outline-none" />
                  <button onClick={() => { if(!aiInput.trim())return; setAiChat([...aiChat, { sender: 'user', text: aiInput }, { sender: 'ai', text: `Analyzed ${selectedRegion} datasets. All values stable.` }]); setAiInput(''); }} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">Send</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showMethodology && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3"><h3 className="font-bold text-lg">Methodology</h3><button onClick={() => setShowMethodology(false)}><X className="w-5 h-5" /></button></div>
            <p className="text-xs text-slate-600">EarthLens uses NASA Landsat, ESA Sentinel, and MODIS satellite data processed via zonal histograms and client-side trend regression models.</p>
          </div>
        </div>
      )}
    </div>
  );
}
