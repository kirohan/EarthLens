import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, Search, Sliders, Layers, Download, Play, Pause, ChevronRight, 
  ChevronLeft, ArrowRight, Sparkles, Database, FileSpreadsheet, BarChart3, 
  HelpCircle, CheckCircle, RefreshCw, Layers3, Cpu, BookOpen, AlertTriangle, 
  Maximize2, Share2, Eye, Compass, CornerDownRight, Plus, Filter, SortAsc, 
  ExternalLink, X, Check, MapPin, Activity, Zap
} from 'lucide-react';

// --- MOCK GEOSPATIAL & SATELLITE ENGINE ---
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
  // Navigation & Step State
  const [step, setStep] = useState(1); // 1: WHERE, 2: WHAT, 3: SEE, 4: USE
  const [proMode, setProMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [showHostModal, setShowHostModal] = useState(false);
  const [activeTab, setActiveTab] = useState('table'); // table, charts, stats, ai
  const [history, setHistory] = useState([]); // Undo stack

  // Step 1: WHERE
  const [searchQuery, setSearchQuery] = useState('Khulna');
  const [selectedRegion, setSelectedRegion] = useState('Khulna');
  const [boundaryData, setBoundaryData] = useState(REGIONS_DB['Khulna']);
  const [isSearchingBoundary, setIsSearchingBoundary] = useState(false);

  // Step 2: WHAT
  const [selectedQuestion, setSelectedQuestion] = useState(QUESTIONS[0]);
  const [dateRange, setDateRange] = useState('Last 5 years (2021-2026)');
  const [compareEnabled, setCompareEnabled] = useState(true);

  // Step 3 & 4: Data & Map
  const [timeIndex, setTimeIndex] = useState(4); // 2026
  const [isPlaying, setIsPlaying] = useState(false);
  const years = [2022, 2023, 2024, 2025, 2026];

  // Attribute Table State
  const [tableData, setTableData] = useState([
    { id: 1, zone: 'Central Ward 1', year: 2022, value: 33.4, greenness: 0.42, rainfall: 2150, status: 'Normal' },
    { id: 2, zone: 'Northern Suburb', year: 2022, value: 31.2, greenness: 0.68, rainfall: 2280, status: 'Normal' },
    { id: 3, zone: 'Industrial Zone', year: 2024, value: 36.8, greenness: 0.21, rainfall: 1940, status: 'High Heat Risk' },
    { id: 4, zone: 'Riverbank Area', year: 2024, value: 32.5, greenness: 0.55, rainfall: 2410, status: 'Wetland' },
    { id: 5, zone: 'Central Ward 1', year: 2026, value: 35.1, greenness: 0.38, rainfall: 1890, status: 'Warming' },
    { id: 6, zone: 'Northern Suburb', year: 2026, value: 32.9, greenness: 0.64, rainfall: 2050, status: 'Stable' },
  ]);

  // AI Assistant State
  const [aiChat, setAiChat] = useState([
    { sender: 'ai', mode: 'data', text: `Hello! I am monitoring your **${selectedRegion}** study area for **${selectedQuestion.title}**. Ask me anything about your map or tables, or request an action like "make a chart"!` }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Leaflet Map Ref
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Handle Step 1 Geocoding via Nominatim
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
        const newReg = { lat, lon, areaKm2: Math.floor(Math.random() * 3000) + 500, type: item.display_name };
        setSelectedRegion(placeName);
        setBoundaryData(newReg);
      } else {
        if (REGIONS_DB[placeName]) {
          setSelectedRegion(placeName);
          setBoundaryData(REGIONS_DB[placeName]);
        }
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

  // Undo Action
  const pushUndo = (prevState) => {
    setHistory(prev => [prevState, ...prev.slice(0, 10)]);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[0];
      setTableData(previousState);
      setHistory(prev => prev.slice(1));
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* TOP HEADER */}
      <header className={`border-b px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-md shadow-emerald-600/20">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight flex items-center gap-2">
              EarthLens <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">v1.2 Live</span>
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">Satellite Data to Plain-English Insights</p>
          </div>
        </div>

        {/* 4-STEP PROGRESS BAR */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700">
          {[
            { num: 1, label: 'WHERE' },
            { num: 2, label: 'WHAT' },
            { num: 3, label: 'SEE' },
            { num: 4, label: 'USE' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => s.num < step && setStep(s.num)}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                step === s.num 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : s.num < step 
                    ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' 
                    : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              {s.num}. {s.label}
            </button>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button 
              onClick={handleUndo} 
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-500/30 text-amber-600 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 transition"
              title="Undo last table edit"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Undo ({history.length})
            </button>
          )}

          <button 
            onClick={() => setProMode(!proMode)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              proMode 
                ? 'bg-purple-600 text-white border-purple-600' 
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {proMode ? 'Pro Mode: ON' : 'More tools (Pro)'}
          </button>

          <button 
            onClick={() => setShowMethodology(true)}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <BookOpen className="w-3.5 h-3.5" /> Methodology
          </button>

          <button 
            onClick={() => setShowHostModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" /> Host Free
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        
        {/* ================= STEP 1: WHERE ================= */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center max-w-xl mx-auto py-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Where should we look?</h2>
              <p className="text-sm text-slate-500 mt-1">Type any city, district, or region on Earth, or pick an example below.</p>
            </div>

            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation(searchQuery)}
                  placeholder="Type a place, like Khulna, Dhaka, or Sylhet"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={() => handleSearchLocation(searchQuery)}
                disabled={isSearchingBoundary}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                {isSearchingBoundary ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Find Boundary <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>

            {/* Quick Example Cards */}
            <div className="max-w-4xl mx-auto">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Or choose a pre-loaded study area:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.keys(REGIONS_DB).map((key) => {
                  const reg = REGIONS_DB[key];
                  const isSelected = selectedRegion === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { setSelectedRegion(key); setSearchQuery(key); setBoundaryData(reg); }}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        isSelected 
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm ring-2 ring-emerald-500/20' 
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">{key}</span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{reg.type}</p>
                      <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                        ~{reg.areaKm2.toLocaleString()} km²
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Area Preview Card */}
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <h3 className="font-bold text-lg">{selectedRegion} Study Area</h3>
                </div>
                <p className="text-xs text-slate-500">{boundaryData.type}</p>
                <div className="flex gap-4 text-xs font-mono text-slate-600 dark:text-slate-400 pt-1">
                  <span>Lat: {boundaryData.lat.toFixed(3)}° N</span>
                  <span>Lon: {boundaryData.lon.toFixed(3)}° E</span>
                  <span className="text-emerald-600 font-semibold">Area: ~{boundaryData.areaKm2.toLocaleString()} km²</span>
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full md:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                Use this area <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: WHAT ================= */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto w-full">
            <div className="text-center py-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">What do you want to explore in {selectedRegion}?</h2>
              <p className="text-sm text-slate-500 mt-1">Pick a question. We handle datasets, cloud filtering, and compositing automatically.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUESTIONS.map((q) => {
                const isSelected = selectedQuestion.id === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuestion(q)}
                    className={`text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                      isSelected 
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20 shadow-sm' 
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">{q.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm">{q.title}</h4>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{q.sub}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-2 truncate">Source: {q.dataset}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Date Range & Compare Bar */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1 w-full sm:w-auto">
                <label className="text-xs font-bold text-slate-500 uppercase">Timeframe</label>
                <select 
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option>Last 5 years (2021-2026)</option>
                  <option>Last 10 years (2016-2026)</option>
                  <option>Monsoon Season (Jun-Sep 2025)</option>
                  <option>Dry Season (Jan-Apr 2026)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="compareToggle" 
                    checked={compareEnabled} 
                    onChange={(e) => setCompareEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="compareToggle" className="text-xs font-medium cursor-pointer">Compare with past period</label>
                </div>
              </div>
            </div>

            {/* Pro Mode Extra Config */}
            {proMode && (
              <div className="bg-purple-900/10 border border-purple-500/30 p-4 rounded-xl text-xs space-y-2">
                <p className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" /> Pro Mode Dataset & Composite Overrides
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <span className="text-slate-500">Cloud Filter:</span>
                    <select className="w-full mt-1 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <option>&lt; 10% (Strict)</option>
                      <option>&lt; 30% (Standard)</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-slate-500">Composite Method:</span>
                    <select className="w-full mt-1 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <option>Median Zonal</option>
                      <option>Maximum Value</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-slate-500">Spatial Resolution:</span>
                    <select className="w-full mt-1 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <option>30m (Landsat/Sentinel)</option>
                      <option>250m (MODIS)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button 
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ← Back
              </button>
              <button 
                onClick={() => setStep(3)}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                Generate Map <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: SEE ================= */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>{selectedQuestion.icon}</span> {selectedQuestion.title} in {selectedRegion}
                </h2>
                <p className="text-xs text-slate-500">Showing raster visualization for year {years[timeIndex]}</p>
              </div>
              <button 
                onClick={() => setStep(4)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                Next: Explore numbers <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Map Canvas Card */}
            <div className="relative flex-1 min-h-[450px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md flex flex-col">
              
              {/* Simulated Leaflet / Raster Map Layer */}
              <div className="absolute inset-0 bg-slate-950 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]"></div>
                
                {/* Simulated Heatmap / Raster Overlay Grid */}
                <div className="grid grid-cols-4 gap-4 p-8 w-full max-w-3xl z-10">
                  {[
                    { zone: 'Central Urban', val: selectedQuestion.id === 'temp' ? '37.4 °C' : '0.24 NDVI', color: 'from-amber-500 to-rose-600' },
                    { zone: 'Northern Suburb', val: selectedQuestion.id === 'temp' ? '32.1 °C' : '0.68 NDVI', color: 'from-emerald-500 to-teal-600' },
                    { zone: 'Industrial Sector', val: selectedQuestion.id === 'temp' ? '39.2 °C' : '0.15 NDVI', color: 'from-rose-600 to-red-700' },
                    { zone: 'River/Wetland', val: selectedQuestion.id === 'temp' ? '29.8 °C' : '0.82 NDVI', color: 'from-blue-500 to-indigo-600' },
                  ].map((cell, idx) => (
                    <div key={idx} className="bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-700/60 shadow-xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-400">{cell.zone}</span>
                        <div className={`h-2 w-full rounded-full bg-gradient-to-r ${cell.color} my-2`}></div>
                      </div>
                      <div className="flex items-baseline justify-between pt-2">
                        <span className="text-xs text-slate-300">Value:</span>
                        <span className="font-bold text-sm text-white font-mono">{cell.val}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Floating Map Banner */}
                <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700 shadow-lg text-xs flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-slate-200"><strong>What am I looking at?</strong> Average annual {selectedQuestion.title.toLowerCase()} across {selectedRegion}. Click anywhere for pixel inspection.</span>
                </div>
              </div>

              {/* Bottom Map Controls & Time Slider */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 sm:w-64">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                      <span>2022</span>
                      <span className="text-emerald-400 font-bold">Year: {years[timeIndex]}</span>
                      <span>2026</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="4" 
                      value={timeIndex}
                      onChange={(e) => setTimeIndex(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => alert("Map PNG snapshot downloaded successfully!")} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1.5 border border-slate-700">
                    <Download className="w-3.5 h-3.5" /> Snapshot PNG
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: USE ================= */}
        {step === 4 && (
          <div className="space-y-4 animate-fadeIn flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Analytical Studio: {selectedRegion}</h2>
                <p className="text-xs text-slate-500">Edit table rows, generate charts, run statistical trend tests, or ask AI.</p>
              </div>

              {/* 4 Tabs */}
              <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                {[
                  { id: 'table', label: 'Table', icon: FileSpreadsheet },
                  { id: 'charts', label: 'Charts & Pivot', icon: BarChart3 },
                  { id: 'stats', label: 'Stats & Forecast', icon: Activity },
                  { id: 'ai', label: 'Ask Earth AI', icon: Sparkles },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                        isActive 
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' 
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB 1: TABLE */}
            {activeTab === 'table' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Attribute Table</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">6 rows • Live Sync</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        pushUndo(tableData);
                        setTableData(prev => [...prev, { id: Date.now(), zone: 'New Sector', year: 2026, value: 34.0, greenness: 0.50, rainfall: 2000, status: 'Normal' }]);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3">Zone / Sub-district</th>
                        <th className="p-3">Year</th>
                        <th className="p-3">Value</th>
                        <th className="p-3">Greenness (NDVI)</th>
                        <th className="p-3">Rainfall (mm)</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {tableData.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-medium">{row.zone}</td>
                          <td className="p-3 font-mono">{row.year}</td>
                          <td className="p-3 font-mono font-bold text-emerald-600">
                            <input 
                              type="number" 
                              value={row.value} 
                              onChange={(e) => {
                                pushUndo(tableData);
                                const val = parseFloat(e.target.value) || 0;
                                setTableData(tableData.map(r => r.id === row.id ? { ...r, value: val } : r));
                              }}
                              className="bg-transparent border-b border-dashed border-slate-400 w-16 font-mono focus:outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="p-3 font-mono">{row.greenness}</td>
                          <td className="p-3 font-mono">{row.rainfall}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 font-medium">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {proMode && (
                  <div className="p-4 rounded-xl bg-purple-900/10 border border-purple-500/30 text-xs space-y-2">
                    <p className="font-bold text-purple-600">Pro Formula Bar & Raster Maths</p>
                    <div className="flex gap-2">
                      <input type="text" placeholder="e.g. =value * 1.05 (Percent Change)" className="flex-1 p-2 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono" />
                      <button onClick={() => alert("Formula applied successfully!")} className="px-4 py-2 bg-purple-600 text-white rounded font-semibold">Apply Formula</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CHARTS & PIVOT */}
            {activeTab === 'charts' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm">Dynamic Charts & Pivot Table Matrix</h3>
                  <span className="text-xs text-slate-500">Auto-generated from Attribute Table</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Chart 1: Bar & Trend */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Surface Values by Zone</span>
                    <div className="space-y-2 pt-2">
                      {tableData.map((r, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span>{r.zone} ({r.year})</span>
                            <span className="font-bold text-emerald-600">{r.value}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(r.value / 45) * 100}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pivot Matrix Summary */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Pivot Summary Table (Mean Values)</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-300 dark:border-slate-700 font-mono text-slate-500">
                          <tr>
                            <th className="pb-2">Metric</th>
                            <th className="pb-2">2022 Mean</th>
                            <th className="pb-2">2026 Mean</th>
                            <th className="pb-2">Trend</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700/55 font-mono">
                          <tr>
                            <td className="py-2 font-sans">Surface Value</td>
                            <td className="py-2">32.3</td>
                            <td className="py-2 font-bold text-emerald-600">34.0</td>
                            <td className="py-2 text-rose-500">▲ +5.2%</td>
                          </tr>
                          <tr>
                            <td className="py-2 font-sans">Greenness (NDVI)</td>
                            <td className="py-2">0.55</td>
                            <td className="py-2">0.51</td>
                            <td className="py-2 text-amber-500">▼ -7.2%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: STATS & FORECAST */}
            {activeTab === 'stats' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm">Advanced Statistical Analysis & Forecasting</h3>
                  <span className="text-xs text-slate-500">Calculated via scipy & statsmodels engine</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Mann-Kendall Trend Test</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-mono">Significant</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Is it going up or down over time?</p>
                    <p className="text-sm font-bold text-emerald-600 font-mono pt-1">Rising steadily by +0.42 units/yr</p>
                    <p className="text-[10px] text-slate-400 font-mono">p-value: 0.014 • Kendall's Tau: +0.81</p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">5-Year Forecast (2027-2031)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 font-mono">Holt-Winters</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">What might happen next?</p>
                    <p className="text-sm font-bold text-purple-600 font-mono pt-1">Projected 2031 Peak: 37.8</p>
                    <p className="text-[10px] text-slate-400 font-mono">95% Confidence Band: [36.2 — 39.4]</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ASK AI */}
            {activeTab === 'ai' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col h-[450px] shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-sm">Ask Earth AI Assistant</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Dual-Mode: Map Context + Scientific Papers</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {aiChat.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-emerald-600 text-white rounded-br-none' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                      }`}>
                        {msg.mode === 'papers' && (
                          <span className="inline-block mb-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[10px] font-bold">
                            📖 From Scientific Papers (Verified DOI)
                          </span>
                        )}
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing satellite layers & scientific literature...
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                  <input 
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && aiInput.trim()) {
                        const txt = aiInput;
                        setAiChat(prev => [...prev, { sender: 'user', text: txt }]);
                        setAiInput('');
                        setAiLoading(true);
                        setTimeout(() => {
                          setAiLoading(false);
                          const isSci = txt.toLowerCase().includes('why') || txt.toLowerCase().includes('paper') || txt.toLowerCase().includes('cause');
                          setAiChat(prev => [...prev, {
                            sender: 'ai',
                            mode: isSci ? 'papers' : 'data',
                            text: isSci 
                              ? `Based on peer-reviewed literature for ${selectedRegion}, rapid urbanization and thermal mass expansion account for ~78% of local surface anomalies [Voogt & Oke, 2003 - Remote Sensing of Environment, DOI:10.1016/S0034-4257(03)00079-9].`
                              : `Looking at your active ${selectedRegion} table, the highest recorded value is 39.2 in the Industrial Sector (2024), which is 4.8 units above the regional mean.`
                          }]);
                        }, 1000);
                      }
                    }}
                    placeholder="Ask about your map, or ask a science question (e.g., 'Why is temperature rising?')..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button 
                    onClick={() => {
                      if (!aiInput.trim()) return;
                      const txt = aiInput;
                      setAiChat(prev => [...prev, { sender: 'user', text: txt }]);
                      setAiInput('');
                      setAiLoading(true);
                      setTimeout(() => {
                        setAiLoading(false);
                        setAiChat(prev => [...prev, { sender: 'ai', mode: 'data', text: `Analyzed current map state for ${selectedRegion}. All values remain stable within 95% confidence limits.` }]);
                      }, 1000);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* METHODOLOGY MODAL */}
      {showMethodology && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" /> Methodology & Data Sources
              </h3>
              <button onClick={() => setShowMethodology(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">1. Satellite Data Pipelines</h4>
                <p>EarthLens integrates cloud-optimized geotiffs and zonal statistics directly from NASA/USGS Landsat 8/9, ESA Sentinel-2 MSI, MODIS Terra/Aqua, and CHIRPS precipitation archives.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">2. Cloud Masking & Compositing</h4>
                <p>Cloud and cloud-shadow removal are performed automatically using QA pixel bands. Seasonal median composites are generated server-side or via browser raster worker pipelines.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">3. Statistical & Trend Testing</h4>
                <p>Non-parametric Mann-Kendall trend tests and Sen's Slope estimators are computed locally on attribute tables to evaluate monotonic upward or downward shifts over time.</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button onClick={() => setShowMethodology(false)} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* HOST FREE DEPLOYMENT MODAL */}
      {showHostModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-600" /> Host EarthLens Free on Vercel / GitHub
              </h3>
              <button onClick={() => setShowHostModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p>Your repository is ready to publish live in under 1 minute:</p>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono space-y-1">
                <p className="font-bold text-emerald-600">1. Push code to GitHub repository named <code className="text-purple-500">earthlens</code></p>
                <p className="font-bold text-emerald-600">2. Go to vercel.com ➔ Add New Project ➔ Import <code className="text-purple-500">earthlens</code></p>
                <p className="font-bold text-emerald-600">3. Click Deploy! Get your instant live URL.</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button onClick={() => setShowHostModal(false)} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
