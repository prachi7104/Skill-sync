// // import React, { useState } from 'react';
// // import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
// // import { 
// //   UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
// //   Users, Code, LogOut, Search, Play, FileText, TrendingUp, AlertTriangle, 
// //   Briefcase, Bell
// // } from 'lucide-react';

// // // ==========================================
// // // 1. MODULE B: STUDENT COCKPIT [cite: 30-50]
// // // ==========================================

// // const StudentDashboard = () => {
// //   return (
// //     <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
// //       {/* HEADER */}
// //       <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
// //         <div className="flex items-center gap-2">
// //           <div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-4 h-4 fill-current"/></div>
// //           <span className="font-bold text-xl tracking-tight">SkillSync</span>
// //         </div>
// //         <div className="flex items-center gap-6">
// //            <Link to="/sandbox" className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">Simulation Lab</Link>
// //            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700 text-xs">SB</div>
// //         </div>
// //       </nav>

// //       <div className="max-w-6xl mx-auto p-8">
        
// //         {/* TOP BANNER: HUB SCORE & PROFILE METER [cite: 33-39] */}
// //         <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white mb-8 shadow-xl relative overflow-hidden">
// //           <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
// //             <div>
// //               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Live Coding Rank</p>
// //               <div className="flex items-baseline gap-4">
// //                 <h1 className="text-5xl font-black text-white">1450</h1>
// //                 <span className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full text-sm">Rank #452</span>
// //               </div>
// //               <p className="text-slate-400 mt-2 text-sm">Top 15% of Batch 2026</p>
// //             </div>
            
// //             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
// //               <div className="flex justify-between mb-2">
// //                 <span className="text-sm font-bold">Profile Completeness</span>
// //                 <span className="text-sm font-bold text-indigo-400">70%</span>
// //               </div>
// //               <div className="w-full bg-slate-700 h-2 rounded-full mb-3">
// //                 <div className="bg-indigo-500 h-2 rounded-full w-[70%]"></div>
// //               </div>
// //               <div className="flex items-center gap-2 text-xs text-amber-300">
// //                 <AlertTriangle size={12} />
// //                 <span>Nudge: Add Project Link to reach 80%</span>
// //               </div>
// //             </div>
// //           </div>
          
// //           {/* Decorative Pattern */}
// //           <div className="absolute top-0 right-0 opacity-10">
// //             <TrendingUp size={300} />
// //           </div>
// //         </div>

// //         {/* INSTITUTIONAL STATUS & ACTION CARDS [cite: 42-53] */}
// //         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
// //           {/* Card 1: Institutional Status */}
// //           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
// //             <div className="flex items-center gap-3 mb-4">
// //               <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Briefcase size={20}/></div>
// //               <h3 className="font-bold text-slate-800">Placement Status</h3>
// //             </div>
// //             <div className="space-y-3">
// //                <div className="flex justify-between text-sm">
// //                  <span className="text-slate-500">Batch Category</span>
// //                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">Alpha Batch</span>
// //                </div>
// //                <div className="flex justify-between text-sm">
// //                  <span className="text-slate-500">AMCAT Quant</span>
// //                  <span className="font-bold text-emerald-600">Top 10%</span>
// //                </div>
// //             </div>
// //           </div>

// //           {/* Card 2: Pending Actions */}
// //           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50">
// //              <div className="flex items-center justify-between mb-4">
// //                <div className="flex items-center gap-3">
// //                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Bell size={20}/></div>
// //                  <h3 className="font-bold text-slate-800">Pending Actions</h3>
// //                </div>
// //                <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-1 rounded-full">1 Urgent</span>
// //              </div>
// //              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
// //                 <p className="text-sm font-bold text-slate-900 mb-1">Amazon SDE Drive</p>
// //                 <p className="text-xs text-slate-500 mb-3">Shortlisted! Upload Resume by 5 PM.</p>
// //                 <button className="w-full py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">Upload Now</button>
// //              </div>
// //           </div>

// //           {/* Card 3: Quick Links */}
// //           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center gap-3">
// //              <Link to="/sandbox" className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
// //                 <span className="font-bold text-slate-700">Open Sandbox</span>
// //                 <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600"/>
// //              </Link>
// //              <button className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
// //                 <span className="font-bold text-slate-700">View Company Vault</span>
// //                 <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600"/>
// //              </button>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // // ==========================================
// // // 2. SANDBOX (SIMULATION LAB) 
// // // ==========================================

// // const Sandbox = () => {
// //   const [analyzing, setAnalyzing] = useState(false);
// //   const [result, setResult] = useState(null);

// //   const runSimulation = () => {
// //     setAnalyzing(true);
// //     // Fake AI Delay
// //     setTimeout(() => {
// //         setAnalyzing(false);
// //         setResult(true);
// //     }, 2000);
// //   };

// //   return (
// //     <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
// //        {/* LEFT PANEL: INPUT [cite: 84-86] */}
// //        <div className="w-1/2 p-8 flex flex-col border-r border-slate-200 bg-white">
// //           <div className="mb-8">
// //             <Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link>
// //             <h1 className="text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1>
// //             <p className="text-slate-500">Test yourself against past drives to identify gaps.</p>
// //           </div>

// //           <div className="flex-1 flex flex-col gap-6">
// //              <div>
// //                 <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Target Drive</label>
// //                 <select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
// //                    <option>Amazon SDE - 2024</option>
// //                    <option>Google STEP Intern</option>
// //                    <option>Microsoft IDC</option>
// //                 </select>
// //              </div>
             
// //              <div className="flex-1 flex flex-col">
// //                 <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Job Description / Context</label>
// //                 <textarea 
// //                   className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
// //                   defaultValue={`Role: SDE-1
// // Requirements:
// // - Strong knowledge of Data Structures & Algorithms (Java/C++)
// // - Experience with AWS or Cloud Platforms
// // - Understanding of Scalable System Design
// // - Good grasp of OS and DBMS concepts`}
// //                 />
// //              </div>

// //              <button 
// //                 onClick={runSimulation}
// //                 className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
// //              >
// //                 {analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>}
// //                 {analyzing ? "AI is Analyzing..." : "Run Simulation"}
// //              </button>
// //           </div>
// //        </div>

// //        {/* RIGHT PANEL: AI ANALYSIS [cite: 88-90] */}
// //        <div className="w-1/2 bg-slate-50 p-8 overflow-y-auto">
// //           {!result && !analyzing && (
// //              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
// //                 <LayoutDashboard size={64} className="mb-4"/>
// //                 <p className="font-bold text-lg">Waiting for Input...</p>
// //              </div>
// //           )}

// //           {result && (
// //              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
// //                 <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-8 text-center">
// //                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p>
// //                    <div className="relative w-40 h-40 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600">
// //                       <span className="text-4xl font-black text-slate-900">65%</span>
// //                    </div>
// //                    <p className="mt-4 text-slate-500 font-medium">You are a moderate match.</p>
// //                 </div>

// //                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
// //                    <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div>
// //                    <table className="w-full text-left text-sm">
// //                       <tbody className="divide-y divide-slate-100">
// //                          <tr className="bg-emerald-50/50">
// //                             <td className="p-4 font-bold text-slate-700">DSA (Java/C++)</td>
// //                             <td className="p-4 font-bold text-emerald-600"><span className="flex items-center gap-2"><CheckCircle size={16}/> Found</span></td>
// //                             <td className="p-4 text-slate-500">Strong LeetCode rating detected.</td>
// //                          </tr>
// //                          <tr className="bg-rose-50/50">
// //                             <td className="p-4 font-bold text-slate-700">AWS / Cloud</td>
// //                             <td className="p-4 font-bold text-rose-600"><span className="flex items-center gap-2"><AlertTriangle size={16}/> Missing</span></td>
// //                             <td className="p-4 text-slate-500">No cloud projects found in GitHub. <br/><span className="text-indigo-600 font-bold cursor-pointer hover:underline">Add a deployed project.</span></td>
// //                          </tr>
// //                          <tr className="bg-amber-50/50">
// //                             <td className="p-4 font-bold text-slate-700">System Design</td>
// //                             <td className="p-4 font-bold text-amber-600">Weak Signal</td>
// //                             <td className="p-4 text-slate-500">Mention 'Scalability' in descriptions.</td>
// //                          </tr>
// //                       </tbody>
// //                    </table>
// //                 </div>
// //              </div>
// //           )}
// //        </div>
// //     </div>
// //   );
// // };

// // // ==========================================
// // // 3. FACULTY COMMAND CENTER 
// // // ==========================================

// // const FacultyDashboard = () => {
// //   return (
// //     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
// //       <aside className="w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex flex-col p-6 border-r border-slate-800">
// //         <div className="flex items-center gap-3 mb-10 text-white">
// //           <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
// //           <span className="text-xl font-bold tracking-tight">SkillSync</span>
// //         </div>
// //         <nav className="space-y-2">
// //            <div className="flex items-center gap-3 px-3 py-2 bg-slate-800 text-white rounded-lg font-medium"><LayoutDashboard size={18}/> Command Center</div>
// //            <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors"><Users size={18}/> Students</button>
// //            <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors"><Briefcase size={18}/> Drives</button>
// //         </nav>
// //         <div className="mt-auto pt-6 border-t border-slate-800">
// //            <Link to="/" className="flex items-center gap-2 text-sm hover:text-white"><LogOut size={16}/> Sign Out</Link>
// //         </div>
// //       </aside>

// //       <main className="ml-64 flex-1 p-8">
// //         <header className="flex justify-between items-center mb-8">
// //            <div>
// //               <h1 className="text-2xl font-bold text-slate-900">Command Center</h1>
// //               <p className="text-slate-500 text-sm">Overview of Placement Season 2026</p>
// //            </div>
// //            <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2">
// //              + Create Drive
// //            </button>
// //         </header>

// //         {/* HIGH LEVEL STATS [cite: 126-137] */}
// //         <div className="grid grid-cols-4 gap-6 mb-8">
// //            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
// //               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Students</p>
// //               <h3 className="text-4xl font-black text-slate-900">500</h3>
// //               <p className="text-xs text-slate-400 mt-1">Across all programs</p>
// //            </div>
// //            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
// //               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Placed</p>
// //               <h3 className="text-4xl font-black text-emerald-600">350</h3>
// //               <p className="text-xs text-emerald-600/70 mt-1 font-bold">70% Success Rate</p>
// //            </div>
// //            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
// //               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unplaced</p>
// //               <h3 className="text-4xl font-black text-rose-500">150</h3>
// //               <p className="text-xs text-rose-400 mt-1">Actively seeking</p>
// //            </div>
// //            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50">
// //               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Active Drives</p>
// //               <h3 className="text-4xl font-black text-indigo-600">12</h3>
// //               <p className="text-xs text-indigo-400 mt-1">Open opportunities</p>
// //            </div>
// //         </div>

// //         {/* RECENT ACTIVITY FEED [cite: 138-139] */}
// //         <div className="grid grid-cols-3 gap-8">
// //             <div className="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
// //                <h3 className="font-bold text-slate-800 mb-4">Live Activity Feed</h3>
// //                <div className="space-y-4">
// //                   {[1,2,3].map((i) => (
// //                     <div key={i} className="flex items-start gap-4 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
// //                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-xs text-slate-500">US</div>
// //                        <div>
// //                           <p className="text-sm text-slate-800"><span className="font-bold">Rahul Verma</span> uploaded resume for <span className="font-bold text-indigo-600">Amazon SDE</span></p>
// //                           <p className="text-xs text-slate-400">2 mins ago</p>
// //                        </div>
// //                     </div>
// //                   ))}
// //                </div>
// //             </div>
            
// //             {/* Quick Actions */}
// //             <div className="bg-indigo-900 rounded-2xl p-6 text-white relative overflow-hidden">
// //                <div className="relative z-10">
// //                  <h3 className="font-bold text-lg mb-2">Intelligence Hub</h3>
// //                  <p className="text-indigo-200 text-sm mb-6">Search specific skills across the unplaced batch.</p>
// //                  <button className="w-full py-3 bg-white text-indigo-900 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors">Open Search</button>
// //                </div>
// //                <Zap size={100} className="absolute -bottom-4 -right-4 text-indigo-800 opacity-50"/>
// //             </div>
// //         </div>
// //       </main>
// //     </div>
// //   );
// // };

// // // ==========================================
// // // 4. LANDING & ROUTING
// // // ==========================================

// // const LandingPage = () => (
// //   <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 font-sans">
// //     <div className="text-center mb-12">
// //        <h1 className="text-7xl font-black mb-4 tracking-tight">SkillSync.</h1>
// //        <p className="text-slate-400 text-xl max-w-lg mx-auto">The AI-Native Placement Ecosystem.</p>
// //     </div>
// //     <div className="flex gap-6">
// //       <Link to="/student" className="group p-10 bg-slate-800 rounded-3xl border border-slate-700 hover:bg-slate-700 hover:border-indigo-500 transition-all w-72 text-left relative overflow-hidden">
// //         <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-indigo-400 transition-colors">Student</h3>
// //         <p className="text-slate-400 text-sm">Access Cockpit</p>
// //         <ArrowRight className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all text-indigo-500"/>
// //       </Link>
// //       <Link to="/faculty" className="group p-10 bg-slate-800 rounded-3xl border border-slate-700 hover:bg-slate-700 hover:border-emerald-500 transition-all w-72 text-left relative overflow-hidden">
// //         <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-emerald-400 transition-colors">Faculty</h3>
// //         <p className="text-slate-400 text-sm">Command Center</p>
// //         <ArrowRight className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all text-emerald-500"/>
// //       </Link>
// //     </div>
// //   </div>
// // );

// // function App() {
// //   return (
// //     <Router>
// //       <Routes>
// //         <Route path="/" element={<LandingPage />} />
// //         <Route path="/student" element={<StudentDashboard />} />
// //         <Route path="/faculty" element={<FacultyDashboard />} />
// //         <Route path="/sandbox" element={<Sandbox />} />
// //       </Routes>
// //     </Router>
// //   );
// // }

// // export default App;



















































// // import React, { useState } from 'react';
// // import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
// // import { 
// //   UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
// //   Users, Code, LogOut, Search, Play, FileText, TrendingUp, AlertTriangle, 
// //   Briefcase, Bell, Menu, X
// // } from 'lucide-react';

// // // ==========================================
// // // 1. MODULE B: STUDENT COCKPIT [Responsive + Fixed Buttons]
// // // ==========================================

// // const StudentDashboard = () => {
// //   const navigate = useNavigate();
// //   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

// //   return (
// //     <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      
// //       {/* RESPONSIVE NAV: Works on Mobile & Desktop */}
// //       <nav className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-50">
// //         <div className="flex items-center gap-2">
// //           {/* Mobile Menu Button */}
// //           <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600">
// //             {mobileMenuOpen ? <X /> : <Menu />}
// //           </button>
// //           <div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-4 h-4 fill-current"/></div>
// //           <span className="font-bold text-xl tracking-tight">SkillSync</span>
// //         </div>
        
// //         {/* Desktop Links */}
// //         <div className="hidden md:flex items-center gap-6">
// //            <Link to="/sandbox" className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">Simulation Lab</Link>
// //            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700 text-xs">SB</div>
// //         </div>
// //       </nav>

// //       {/* Mobile Menu Dropdown */}
// //       {mobileMenuOpen && (
// //         <div className="md:hidden bg-white border-b border-slate-200 p-4 flex flex-col gap-4 shadow-lg">
// //           <Link to="/sandbox" className="font-semibold text-slate-600">Simulation Lab</Link>
// //           <Link to="/" className="font-semibold text-slate-600">Log Out</Link>
// //         </div>
// //       )}

// //       {/* MAIN CONTAINER: FIXED (max-w-7xl ensures it fits laptop screens perfectly) */}
// //       <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
        
// //         {/* TOP BANNER: Responsive Grid (1 col on mobile, 2 on desktop) */}
// //         <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white mb-8 shadow-xl relative overflow-hidden">
// //           <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
// //             <div>
// //               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Live Coding Rank</p>
// //               <div className="flex flex-wrap items-baseline gap-4">
// //                 <h1 className="text-4xl md:text-5xl font-black text-white">1450</h1>
// //                 <span className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full text-sm">Rank #452</span>
// //               </div>
// //               <p className="text-slate-400 mt-2 text-sm">Top 15% of Batch 2026</p>
// //             </div>
            
// //             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
// //               <div className="flex justify-between mb-2">
// //                 <span className="text-sm font-bold">Profile Completeness</span>
// //                 <span className="text-sm font-bold text-indigo-400">70%</span>
// //               </div>
// //               <div className="w-full bg-slate-700 h-2 rounded-full mb-3">
// //                 <div className="bg-indigo-500 h-2 rounded-full w-[70%]"></div>
// //               </div>
// //               <div className="flex items-center gap-2 text-xs text-amber-300">
// //                 <AlertTriangle size={12} />
// //                 <span>Nudge: Add Project Link to reach 80%</span>
// //               </div>
// //             </div>
// //           </div>
          
// //           <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
// //             <TrendingUp size={300} />
// //           </div>
// //         </div>

// //         {/* CARDS GRID: FIXED (Stacks on mobile, 3 cols on desktop) */}
// //         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
// //           {/* Card 1: Status */}
// //           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
// //             <div className="flex items-center gap-3 mb-4">
// //               <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Briefcase size={20}/></div>
// //               <h3 className="font-bold text-slate-800">Placement Status</h3>
// //             </div>
// //             <div className="space-y-3">
// //                <div className="flex justify-between text-sm">
// //                  <span className="text-slate-500">Batch Category</span>
// //                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">Alpha Batch</span>
// //                </div>
// //                <div className="flex justify-between text-sm">
// //                  <span className="text-slate-500">AMCAT Quant</span>
// //                  <span className="font-bold text-emerald-600">Top 10%</span>
// //                </div>
// //             </div>
// //           </div>

// //           {/* Card 2: Actions - BUTTON FIXED */}
// //           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50">
// //              <div className="flex items-center justify-between mb-4">
// //                <div className="flex items-center gap-3">
// //                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Bell size={20}/></div>
// //                  <h3 className="font-bold text-slate-800">Pending Actions</h3>
// //                </div>
// //                <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-1 rounded-full animate-pulse">1 Urgent</span>
// //              </div>
// //              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
// //                 <p className="text-sm font-bold text-slate-900 mb-1">Amazon SDE Drive</p>
// //                 <p className="text-xs text-slate-500 mb-3">Shortlisted! Upload Resume by 5 PM.</p>
                
// //                 {/* ⚡ FIXED: Navigates to upload page */}
// //                 <button 
// //                   onClick={() => navigate('/student/upload')}
// //                   className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 hover:shadow-md transition-all"
// //                 >
// //                   Upload Now
// //                 </button>
// //              </div>
// //           </div>

// //           {/* Card 3: Quick Links - VAULT FIXED */}
// //           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center gap-3">
// //              <Link to="/sandbox" className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group cursor-pointer">
// //                 <span className="font-bold text-slate-700">Open Sandbox</span>
// //                 <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1"/>
// //              </Link>
             
// //              {/* ⚡ FIXED: Navigates to vault page */}
// //              <button 
// //                 onClick={() => navigate('/student/vault')}
// //                 className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group w-full"
// //              >
// //                 <span className="font-bold text-slate-700">View Company Vault</span>
// //                 <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1"/>
// //              </button>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // // ==========================================
// // // 2. NEW COMPONENT: COMPANY VAULT
// // // ==========================================
// // const CompanyVault = () => (
// //   <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center">
// //     <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
// //       <Briefcase className="w-10 h-10 text-indigo-600" />
// //     </div>
// //     <h1 className="text-3xl font-black text-slate-900 mb-2">Company Vault</h1>
// //     <p className="text-slate-500 max-w-md mb-8">Access previous year questions, interview experiences, and salary breakdowns.</p>
// //     <Link to="/student" className="text-indigo-600 font-bold hover:underline">← Back to Cockpit</Link>
// //   </div>
// // );

// // // ==========================================
// // // 3. STUDENT UPLOAD PAGE
// // // ==========================================
// // const StudentUpload = () => {
// //   const [step, setStep] = useState('upload'); 
// //   const navigate = useNavigate();

// //   const handleUpload = () => {
// //     setStep('processing');
// //     setTimeout(() => setStep('done'), 2000); 
// //   };

// //   return (
// //     <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans text-slate-900">
// //       <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden">
// //         {step === 'upload' && (
// //           <>
// //             <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><UploadCloud className="w-8 h-8 text-indigo-600" /></div>
// //             <h2 className="text-2xl font-bold mb-2">Amazon SDE Drive</h2>
// //             <p className="text-slate-500 mb-8">Upload your resume to confirm participation.</p>
// //             <div onClick={handleUpload} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors">
// //               <span className="font-bold text-indigo-600">Click to Upload PDF</span>
// //             </div>
// //           </>
// //         )}
// //         {step === 'processing' && (
// //           <div className="py-10">
// //             <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
// //             <h3 className="text-lg font-bold">Verifying Resume...</h3>
// //           </div>
// //         )}
// //         {step === 'done' && (
// //           <div className="py-6">
// //             <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div>
// //             <h3 className="text-2xl font-bold">Application Sent!</h3>
// //             <p className="text-slate-500 mb-6">Faculty has been notified.</p>
// //             <button onClick={() => navigate('/student')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full hover:bg-indigo-700">Back to Cockpit</button>
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// // // ==========================================
// // // 4. SANDBOX (SIMULATION LAB)
// // // ==========================================
// // const Sandbox = () => {
// //   const [analyzing, setAnalyzing] = useState(false);
// //   const [result, setResult] = useState(null);

// //   const runSimulation = () => {
// //     setAnalyzing(true);
// //     setTimeout(() => { setAnalyzing(false); setResult(true); }, 2000);
// //   };

// //   return (
// //     <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden">
// //        {/* LEFT PANEL */}
// //        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-r border-slate-200 bg-white h-1/2 md:h-full overflow-y-auto">
// //           <div className="mb-6">
// //             <Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link>
// //             <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1>
// //             <p className="text-slate-500 text-sm">Test yourself against past drives.</p>
// //           </div>
// //           <div className="flex-1 flex flex-col gap-4">
// //              <div>
// //                 <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Target Drive</label>
// //                 <select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700">
// //                    <option>Amazon SDE - 2024</option>
// //                 </select>
// //              </div>
// //              <div className="flex-1 flex flex-col">
// //                 <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Job Description</label>
// //                 <textarea className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none" defaultValue={`Role: SDE-1...`} />
// //              </div>
// //              <button onClick={runSimulation} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
// //                 {analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} {analyzing ? "Analyzing..." : "Run Simulation"}
// //              </button>
// //           </div>
// //        </div>
// //        {/* RIGHT PANEL */}
// //        <div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto h-1/2 md:h-full">
// //           {!result && !analyzing && (
// //              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
// //                 <LayoutDashboard size={48} className="mb-4"/><p className="font-bold">Waiting for Input...</p>
// //              </div>
// //           )}
// //           {result && (
// //              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
// //                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center">
// //                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p>
// //                    <div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600">
// //                       <span className="text-3xl font-black text-slate-900">65%</span>
// //                    </div>
// //                 </div>
// //                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
// //                    <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div>
// //                    <table className="w-full text-left text-sm">
// //                       <tbody className="divide-y divide-slate-100">
// //                          <tr className="bg-emerald-50/50"><td className="p-4 font-bold text-slate-700">DSA</td><td className="p-4 font-bold text-emerald-600">Found</td></tr>
// //                          <tr className="bg-rose-50/50"><td className="p-4 font-bold text-slate-700">AWS</td><td className="p-4 font-bold text-rose-600">Missing</td></tr>
// //                       </tbody>
// //                    </table>
// //                 </div>
// //              </div>
// //           )}
// //        </div>
// //     </div>
// //   );
// // };

// // // ==========================================
// // // 5. FACULTY DASHBOARD [Responsive]
// // // ==========================================
// // const FacultyDashboard = () => {
// //   return (
// //     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
// //       {/* SIDEBAR: Hidden on Mobile */}
// //       <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col p-6 border-r border-slate-800">
// //         <div className="flex items-center gap-3 mb-10 text-white">
// //           <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
// //           <span className="text-xl font-bold tracking-tight">SkillSync</span>
// //         </div>
// //         <nav className="space-y-2">
// //            <div className="flex items-center gap-3 px-3 py-2 bg-slate-800 text-white rounded-lg font-medium"><LayoutDashboard size={18}/> Command Center</div>
// //            <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors"><Users size={18}/> Students</button>
// //         </nav>
// //         <div className="mt-auto pt-6 border-t border-slate-800">
// //            <Link to="/" className="flex items-center gap-2 text-sm hover:text-white"><LogOut size={16}/> Sign Out</Link>
// //         </div>
// //       </aside>

// //       {/* MAIN CONTENT */}
// //       <main className="w-full md:ml-64 flex-1 p-4 md:p-8">
// //         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
// //            <div>
// //               <h1 className="text-2xl font-bold text-slate-900">Command Center</h1>
// //               <p className="text-slate-500 text-sm">Overview of Placement Season 2026</p>
// //            </div>
// //            <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2">
// //              + Create Drive
// //            </button>
// //         </header>

// //         {/* HIGH LEVEL STATS */}
// //         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
// //            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
// //               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Students</p>
// //               <h3 className="text-4xl font-black text-slate-900">500</h3>
// //            </div>
// //            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
// //               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Placed</p>
// //               <h3 className="text-4xl font-black text-emerald-600">350</h3>
// //            </div>
// //            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
// //               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unplaced</p>
// //               <h3 className="text-4xl font-black text-rose-500">150</h3>
// //            </div>
// //            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50">
// //               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Active Drives</p>
// //               <h3 className="text-4xl font-black text-indigo-600">12</h3>
// //            </div>
// //         </div>
// //       </main>
// //     </div>
// //   );
// // };

// // // ==========================================
// // // 6. LANDING & ROUTING
// // // ==========================================
// // const LandingPage = () => (
// //   <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 font-sans">
// //     <div className="text-center mb-12">
// //        <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight">SkillSync.</h1>
// //        <p className="text-slate-400 text-lg md:text-xl max-w-lg mx-auto">The AI-Native Placement Ecosystem.</p>
// //     </div>
// //     <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
// //       <Link to="/student" className="group p-8 md:p-10 bg-slate-800 rounded-3xl border border-slate-700 hover:bg-slate-700 hover:border-indigo-500 transition-all flex-1 text-left relative overflow-hidden">
// //         <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-indigo-400 transition-colors">Student</h3>
// //         <p className="text-slate-400 text-sm">Access Cockpit</p>
// //         <ArrowRight className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all text-indigo-500"/>
// //       </Link>
// //       <Link to="/faculty" className="group p-8 md:p-10 bg-slate-800 rounded-3xl border border-slate-700 hover:bg-slate-700 hover:border-emerald-500 transition-all flex-1 text-left relative overflow-hidden">
// //         <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-emerald-400 transition-colors">Faculty</h3>
// //         <p className="text-slate-400 text-sm">Command Center</p>
// //         <ArrowRight className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all text-emerald-500"/>
// //       </Link>
// //     </div>
// //   </div>
// // );

// // function App() {
// //   return (
// //     <Router>
// //       <Routes>
// //         <Route path="/" element={<LandingPage />} />
// //         <Route path="/student" element={<StudentDashboard />} />
// //         <Route path="/student/upload" element={<StudentUpload />} />
// //         <Route path="/student/vault" element={<CompanyVault />} />
// //         <Route path="/faculty" element={<FacultyDashboard />} />
// //         <Route path="/sandbox" element={<Sandbox />} />
// //       </Routes>
// //     </Router>
// //   );
// // }

// // export default App;

















































// // import React, { useState } from 'react';
// // import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
// // import { 
// //   UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
// //   Users, Code, LogOut, Search, Play, TrendingUp, AlertTriangle, 
// //   Briefcase, Bell, Menu, X, BookOpen, Star, Target, ChevronDown, User
// // } from 'lucide-react';

// // // ==========================================
// // // 1. MODULE B: STUDENT COCKPIT [FULLY UPDATED UI]
// // // ==========================================

// // const StudentDashboard = () => {
// //   const navigate = useNavigate();
// //   const location = useLocation();
// //   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

// //   // Helper to check active link
// //   const isActive = (path) => location.pathname === path ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50";

// //   return (
// //     <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      
// //       {/* --- ENHANCED NAVIGATION BAR --- */}
// //       <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
// //         <div className="max-w-7xl mx-auto px-4 md:px-8">
// //           <div className="flex justify-between items-center h-16">
            
// //             {/* Left: Logo & Mobile Toggle */}
// //             <div className="flex items-center gap-3">
// //               <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
// //                 {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
// //               </button>
// //               <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
// //                 <div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-5 h-5 fill-current"/></div>
// //                 <span className="font-bold text-xl tracking-tight hidden sm:block">SkillSync</span>
// //               </div>
// //             </div>

// //             {/* Center: Main Navigation (Desktop) */}
// //             <div className="hidden md:flex items-center gap-1">
// //               <Link to="/student" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student')}`}>
// //                 <LayoutDashboard size={16} /> Dashboard
// //               </Link>
// //               <Link to="/student/drives" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student/drives')}`}>
// //                 <Briefcase size={16} /> Drives
// //               </Link>
// //               <Link to="/sandbox" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/sandbox')}`}>
// //                 <Code size={16} /> Arena
// //               </Link>
// //               <Link to="/student/leaderboard" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student/leaderboard')}`}>
// //                 <TrophyIcon /> Leaderboard
// //               </Link>
// //             </div>

// //             {/* Right: Actions & Profile */}
// //             <div className="flex items-center gap-4">
// //               {/* Notification Bell */}
// //               <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
// //                 <Bell size={20} />
// //                 <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
// //               </button>

// //               {/* Profile Dropdown Trigger */}
// //               <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
// //                 <div className="text-right hidden lg:block">
// //                   <p className="text-sm font-bold text-slate-700 leading-tight">Saksham B.</p>
// //                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Alpha Batch</p>
// //                 </div>
// //                 <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white cursor-pointer hover:ring-indigo-100 transition-all">
// //                   SB
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Mobile Menu Dropdown */}
// //         {mobileMenuOpen && (
// //           <div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl">
// //             <div className="p-4 space-y-2">
// //               <MobileLink to="/student" icon={<LayoutDashboard size={18}/>} label="Dashboard" active />
// //               <MobileLink to="/student/drives" icon={<Briefcase size={18}/>} label="Placement Drives" />
// //               <MobileLink to="/sandbox" icon={<Code size={18}/>} label="Coding Arena" />
// //               <MobileLink to="/student/leaderboard" icon={<TrophyIcon size={18}/>} label="Leaderboard" />
// //               <div className="h-px bg-slate-100 my-2"></div>
// //               <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">
// //                 <LogOut size={18} /> Sign Out
// //               </button>
// //             </div>
// //           </div>
// //         )}
// //       </nav>

// //       {/* --- MAIN CONTENT --- */}
// //       <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
        
// //         {/* HERO SECTION */}
// //         <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl relative overflow-hidden">
// //           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
// //             <div>
// //               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider mb-4">
// //                 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live System
// //               </div>
// //               <h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back, Saksham</h1>
// //               <p className="text-slate-400 text-lg mb-6">Your placement probability has increased by <span className="text-emerald-400 font-bold">12%</span> this week.</p>
              
// //               <div className="flex gap-4">
// //                 <div className="flex flex-col">
// //                   <span className="text-slate-500 text-xs font-bold uppercase">Current Rank</span>
// //                   <span className="text-3xl font-black">1450</span>
// //                 </div>
// //                 <div className="w-px bg-white/10 h-10 self-center"></div>
// //                 <div className="flex flex-col">
// //                   <span className="text-slate-500 text-xs font-bold uppercase">Hub Score</span>
// //                   <span className="text-3xl font-black text-indigo-400">850</span>
// //                 </div>
// //               </div>
// //             </div>
            
// //             {/* Profile Meter Card */}
// //             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm lg:max-w-md ml-auto w-full">
// //               <div className="flex justify-between items-end mb-4">
// //                 <div>
// //                   <h3 className="font-bold text-lg">Profile Strength</h3>
// //                   <p className="text-slate-400 text-sm">Resume & Portfolio</p>
// //                 </div>
// //                 <span className="text-2xl font-bold text-indigo-400">70%</span>
// //               </div>
// //               <div className="w-full bg-slate-700 h-3 rounded-full mb-4 overflow-hidden">
// //                 <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[70%] rounded-full relative">
// //                     <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
// //                 </div>
// //               </div>
// //               <div className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
// //                 <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
// //                 <div>
// //                   <p className="text-amber-200 text-xs font-bold mb-1">Action Required</p>
// //                   <p className="text-amber-100/70 text-xs">Add a GitHub project link to reach 80% completeness.</p>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
          
// //           {/* Background Decor */}
// //           <div className="absolute -top-24 -right-24 text-white/5 rotate-12">
// //             <TrendingUp size={400} />
// //           </div>
// //         </div>

// //         {/* DASHBOARD WIDGETS */}
// //         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
// //           {/* 1. Placement Status */}
// //           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
// //             <div className="flex items-center gap-3 mb-6">
// //               <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Target size={20}/></div>
// //               <div>
// //                 <h3 className="font-bold text-slate-800">Your Status</h3>
// //                 <p className="text-xs text-slate-500 font-bold uppercase">Academic & Skill</p>
// //               </div>
// //             </div>
// //             <div className="space-y-4">
// //                <StatusRow label="Batch Category" value="Alpha Batch" badge="bg-indigo-100 text-indigo-700" />
// //                <StatusRow label="AMCAT Quant" value="Top 10%" badge="bg-emerald-100 text-emerald-700" />
// //                <StatusRow label="AMCAT Logical" value="Top 15%" badge="bg-emerald-100 text-emerald-700" />
// //             </div>
// //           </div>

// //           {/* 2. Urgent Actions */}
// //           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50 relative overflow-hidden">
// //              <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">URGENT</div>
// //              <div className="flex items-center gap-3 mb-6">
// //                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Bell size={20}/></div>
// //                <div>
// //                  <h3 className="font-bold text-slate-800">Pending Actions</h3>
// //                  <p className="text-xs text-slate-500 font-bold uppercase">1 Deadline Today</p>
// //                </div>
// //              </div>
             
// //              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
// //                 <div className="flex justify-between items-start mb-2">
// //                     <p className="text-sm font-bold text-slate-900">Amazon SDE Drive</p>
// //                     <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Ends 5 PM</span>
// //                 </div>
// //                 <p className="text-xs text-slate-500 mb-3">You have been shortlisted. Verify resume to confirm seat.</p>
// //                 <button 
// //                   onClick={() => navigate('/student/upload')}
// //                   className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
// //                 >
// //                   Upload Resume
// //                 </button>
// //              </div>
// //           </div>

// //           {/* 3. Quick Links */}
// //           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
// //              <div className="mb-2">
// //                 <h3 className="font-bold text-slate-800">Quick Access</h3>
// //                 <p className="text-xs text-slate-500 font-bold uppercase">Tools & Resources</p>
// //              </div>
             
// //              <QuickLink 
// //                icon={<Code size={18} className="text-indigo-600"/>} 
// //                title="Open Sandbox" 
// //                desc="Practice coding problems"
// //                onClick={() => navigate('/sandbox')}
// //              />
// //              <QuickLink 
// //                icon={<BookOpen size={18} className="text-emerald-600"/>} 
// //                title="Company Vault" 
// //                desc="Read interview experiences"
// //                onClick={() => navigate('/student/vault')}
// //              />
// //              <QuickLink 
// //                icon={<Star size={18} className="text-amber-500"/>} 
// //                title="My Certificates" 
// //                desc="View earned badges"
// //                onClick={() => {}}
// //              />
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // // --- HELPER COMPONENTS FOR DASHBOARD ---
// // const MobileLink = ({ to, icon, label, active }) => (
// //   <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${active ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"}`}>
// //     {icon} {label}
// //   </Link>
// // );

// // const StatusRow = ({ label, value, badge }) => (
// //   <div className="flex justify-between items-center text-sm">
// //     <span className="text-slate-500 font-medium">{label}</span>
// //     <span className={`px-2.5 py-0.5 rounded-md font-bold text-xs ${badge}`}>{value}</span>
// //   </div>
// // );

// // const QuickLink = ({ icon, title, desc, onClick }) => (
// //   <button onClick={onClick} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left">
// //     <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
// //       {icon}
// //     </div>
// //     <div className="flex-1">
// //       <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{title}</h4>
// //       <p className="text-[10px] text-slate-400">{desc}</p>
// //     </div>
// //     <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"/>
// //   </button>
// // );

// // const TrophyIcon = ({size=16}) => (
// //   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
// // );


// // // ==========================================
// // // 2. COMPANY VAULT PAGE
// // // ==========================================
// // const CompanyVault = () => (
// //   <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center">
// //     <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center mb-6 animate-bounce">
// //       <Briefcase className="w-10 h-10 text-indigo-600" />
// //     </div>
// //     <h1 className="text-3xl font-black text-slate-900 mb-2">Company Vault</h1>
// //     <p className="text-slate-500 max-w-md mb-8">Access previous year questions, interview experiences, and salary breakdowns.</p>
// //     <div className="flex gap-4">
// //       <Link to="/student" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">← Back</Link>
// //       <button className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700">Explore Data</button>
// //     </div>
// //   </div>
// // );


// // // ==========================================
// // // 3. STUDENT UPLOAD PAGE
// // // ==========================================
// // const StudentUpload = () => {
// //   const [step, setStep] = useState('upload'); 
// //   const navigate = useNavigate();

// //   const handleUpload = () => {
// //     setStep('processing');
// //     setTimeout(() => setStep('done'), 2000); 
// //   };

// //   return (
// //     <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans text-slate-900">
// //       <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden">
// //         {step === 'upload' && (
// //           <>
// //             <button onClick={() => navigate('/student')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600"><ArrowRight className="rotate-180"/></button>
// //             <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><UploadCloud className="w-8 h-8 text-indigo-600" /></div>
// //             <h2 className="text-2xl font-bold mb-2">Amazon SDE Drive</h2>
// //             <p className="text-slate-500 mb-8">Upload your resume to confirm participation.</p>
// //             <div onClick={handleUpload} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors group">
// //               <span className="font-bold text-indigo-600 group-hover:scale-105 transition-transform">Click to Upload PDF</span>
// //             </div>
// //           </>
// //         )}
// //         {step === 'processing' && (
// //           <div className="py-10">
// //             <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
// //             <h3 className="text-lg font-bold">Verifying Resume...</h3>
// //             <p className="text-sm text-slate-400 mt-2">Checking ATS Compatibility</p>
// //           </div>
// //         )}
// //         {step === 'done' && (
// //           <div className="py-6 animate-in zoom-in duration-300">
// //             <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div>
// //             <h3 className="text-2xl font-bold">Application Sent!</h3>
// //             <p className="text-slate-500 mb-6">Faculty has been notified.</p>
// //             <button onClick={() => navigate('/student')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full hover:bg-indigo-700 shadow-lg shadow-indigo-100">Back to Cockpit</button>
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };


// // // ==========================================
// // // 4. SANDBOX (SIMULATION LAB)
// // // ==========================================
// // const Sandbox = () => {
// //   const [analyzing, setAnalyzing] = useState(false);
// //   const [result, setResult] = useState(null);

// //   const runSimulation = () => {
// //     setAnalyzing(true);
// //     setTimeout(() => { setAnalyzing(false); setResult(true); }, 2000);
// //   };

// //   return (
// //     <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden">
// //        {/* LEFT PANEL */}
// //        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-r border-slate-200 bg-white h-1/2 md:h-full overflow-y-auto">
// //           <div className="mb-6">
// //             <Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link>
// //             <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1>
// //             <p className="text-slate-500 text-sm">Paste a JD below to simulate how the AI matches you.</p>
// //           </div>
// //           <div className="flex-1 flex flex-col gap-4">
// //              <div>
// //                 <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Target Drive</label>
// //                 <select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
// //                    <option>Amazon SDE - 2024</option>
// //                    <option>Microsoft IDC</option>
// //                    <option>Zomato Backend</option>
// //                 </select>
// //              </div>
// //              <div className="flex-1 flex flex-col">
// //                 <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Job Description</label>
// //                 <textarea className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={`Role: SDE-1...`} />
// //              </div>
// //              <button onClick={runSimulation} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all">
// //                 {analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} {analyzing ? "AI is Analyzing..." : "Run Simulation"}
// //              </button>
// //           </div>
// //        </div>
// //        {/* RIGHT PANEL */}
// //        <div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto h-1/2 md:h-full">
// //           {!result && !analyzing && (
// //              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
// //                 <LayoutDashboard size={48} className="mb-4"/><p className="font-bold">Waiting for Input...</p>
// //              </div>
// //           )}
// //           {result && (
// //              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
// //                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center">
// //                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p>
// //                    <div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600">
// //                       <span className="text-3xl font-black text-slate-900">65%</span>
// //                    </div>
// //                    <p className="text-slate-500 mt-4 text-sm font-medium">You are in the <span className="text-indigo-600 font-bold">Top 30%</span> of applicants.</p>
// //                 </div>
// //                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
// //                    <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div>
// //                    <table className="w-full text-left text-sm">
// //                       <tbody className="divide-y divide-slate-100">
// //                          <tr className="bg-emerald-50/50"><td className="p-4 font-bold text-slate-700">DSA</td><td className="p-4 font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> Found</td></tr>
// //                          <tr className="bg-rose-50/50"><td className="p-4 font-bold text-slate-700">AWS</td><td className="p-4 font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={14}/> Missing</td></tr>
// //                       </tbody>
// //                    </table>
// //                 </div>
// //              </div>
// //           )}
// //        </div>
// //     </div>
// //   );
// // };


// // // ==========================================
// // // 5. FACULTY DASHBOARD 
// // // ==========================================
// // const FacultyDashboard = () => {
// //   return (
// //     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
// //       {/* SIDEBAR: Hidden on Mobile */}
// //       <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col p-6 border-r border-slate-800">
// //         <div className="flex items-center gap-3 mb-10 text-white">
// //           <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
// //           <span className="text-xl font-bold tracking-tight">SkillSync</span>
// //         </div>
// //         <nav className="space-y-2">
// //            <div className="flex items-center gap-3 px-3 py-2 bg-slate-800 text-white rounded-lg font-medium"><LayoutDashboard size={18}/> Command Center</div>
// //            <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors"><Users size={18}/> Students</button>
// //            <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors"><Briefcase size={18}/> Drives</button>
// //         </nav>
// //         <div className="mt-auto pt-6 border-t border-slate-800">
// //            <Link to="/" className="flex items-center gap-2 text-sm hover:text-white"><LogOut size={16}/> Sign Out</Link>
// //         </div>
// //       </aside>

// //       {/* MAIN CONTENT */}
// //       <main className="w-full md:ml-64 flex-1 p-4 md:p-8">
// //         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
// //            <div>
// //               <h1 className="text-2xl font-bold text-slate-900">Command Center</h1>
// //               <p className="text-slate-500 text-sm">Overview of Placement Season 2026</p>
// //            </div>
// //            <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all">
// //              + Create Drive
// //            </button>
// //         </header>

// //         {/* HIGH LEVEL STATS */}
// //         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
// //            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
// //               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Students</p>
// //               <h3 className="text-4xl font-black text-slate-900">500</h3>
// //            </div>
// //            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
// //               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Placed</p>
// //               <h3 className="text-4xl font-black text-emerald-600">350</h3>
// //            </div>
// //            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
// //               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unplaced</p>
// //               <h3 className="text-4xl font-black text-rose-500">150</h3>
// //            </div>
// //            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50">
// //               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Active Drives</p>
// //               <h3 className="text-4xl font-black text-indigo-600">12</h3>
// //            </div>
// //         </div>
// //       </main>
// //     </div>
// //   );
// // };


// // // ==========================================
// // // 6. LANDING PAGE
// // // ==========================================
// // const LandingPage = () => (
// //   <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 font-sans">
// //     <div className="text-center mb-12 animate-in slide-in-from-bottom-8 duration-700">
// //        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-sm font-bold mb-6">
// //          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> v2.0 Live Now
// //        </div>
// //        <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight">SkillSync.</h1>
// //        <p className="text-slate-400 text-lg md:text-xl max-w-lg mx-auto">The AI-Native Placement Ecosystem.</p>
// //     </div>
// //     <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl animate-in fade-in duration-1000 delay-300">
// //       <Link to="/student" className="group p-8 md:p-10 bg-slate-800 rounded-3xl border border-slate-700 hover:bg-slate-700 hover:border-indigo-500 transition-all flex-1 text-left relative overflow-hidden">
// //         <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-indigo-400 transition-colors">Student</h3>
// //         <p className="text-slate-400 text-sm">Access Cockpit</p>
// //         <ArrowRight className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all text-indigo-500 translate-y-4 group-hover:translate-y-0"/>
// //       </Link>
// //       <Link to="/faculty" className="group p-8 md:p-10 bg-slate-800 rounded-3xl border border-slate-700 hover:bg-slate-700 hover:border-emerald-500 transition-all flex-1 text-left relative overflow-hidden">
// //         <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-emerald-400 transition-colors">Faculty</h3>
// //         <p className="text-slate-400 text-sm">Command Center</p>
// //         <ArrowRight className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all text-emerald-500 translate-y-4 group-hover:translate-y-0"/>
// //       </Link>
// //     </div>
// //   </div>
// // );

// // // ==========================================
// // // 7. APP ROUTER
// // // ==========================================
// // function App() {
// //   return (
// //     <Router>
// //       <Routes>
// //         <Route path="/" element={<LandingPage />} />
        
// //         {/* Student Routes */}
// //         <Route path="/student" element={<StudentDashboard />} />
// //         <Route path="/student/upload" element={<StudentUpload />} />
// //         <Route path="/student/vault" element={<CompanyVault />} />
// //         <Route path="/student/drives" element={<div className="p-10 text-center font-bold text-slate-500">Drives Page (Coming Soon)</div>} />
// //         <Route path="/student/leaderboard" element={<div className="p-10 text-center font-bold text-slate-500">Leaderboard (Coming Soon)</div>} />
        
// //         <Route path="/faculty" element={<FacultyDashboard />} />
// //         <Route path="/sandbox" element={<Sandbox />} />
// //       </Routes>
// //     </Router>
// //   );
// // }

// // export default App;









































































// // import React, { useState } from 'react';
// // import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
// // import { 
// //   UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
// //   Users, Code, LogOut, Search, Play, TrendingUp, AlertTriangle, 
// //   Briefcase, Bell, Menu, X, BookOpen, Star, Target, ChevronDown, 
// //   MoreHorizontal, Filter, Calendar, FileText
// // } from 'lucide-react';

// // // ==========================================
// // // 1. SHARED COMPONENTS (Professional UI)
// // // ==========================================

// // const Badge = ({ children, color = "indigo" }) => {
// //   const colors = {
// //     indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
// //     emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
// //     rose: "bg-rose-50 text-rose-700 border-rose-100",
// //     amber: "bg-amber-50 text-amber-700 border-amber-100",
// //     slate: "bg-slate-100 text-slate-600 border-slate-200",
// //   };
// //   return (
// //     <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[color] || colors.slate}`}>
// //       {children}
// //     </span>
// //   );
// // };

// // const UserDropdown = ({ name, role, avatar }) => (
// //   <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
// //     <div className="text-right hidden lg:block">
// //       <p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{name}</p>
// //       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role}</p>
// //     </div>
// //     <div className="w-9 h-9 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">
// //       {avatar}
// //     </div>
// //     <ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600" />
// //   </div>
// // );

// // // ==========================================
// // // 2. STUDENT MODULE (Enhanced UI)
// // // ==========================================

// // const StudentDashboard = () => {
// //   const navigate = useNavigate();
// //   const location = useLocation();
// //   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

// //   const isActive = (path) => location.pathname === path ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50";

// //   return (
// //     <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      
// //       {/* PROFESSIONAL NAVBAR */}
// //       <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
// //         <div className="max-w-7xl mx-auto px-4 md:px-8">
// //           <div className="flex justify-between items-center h-16">
            
// //             <div className="flex items-center gap-3">
// //               <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
// //                 {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
// //               </button>
// //               <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
// //                 <div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-5 h-5 fill-current"/></div>
// //                 <span className="font-bold text-xl tracking-tight hidden sm:block">SkillSync</span>
// //               </div>
// //             </div>

// //             <div className="hidden md:flex items-center gap-1">
// //               <Link to="/student" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student')}`}>
// //                 <LayoutDashboard size={16} /> Cockpit
// //               </Link>
// //               <Link to="/student/drives" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student/drives')}`}>
// //                 <Briefcase size={16} /> Drives
// //               </Link>
// //               <Link to="/sandbox" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/sandbox')}`}>
// //                 <Code size={16} /> Arena
// //               </Link>
// //             </div>

// //             <div className="flex items-center gap-4">
// //               <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
// //                 <Bell size={20} />
// //                 <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
// //               </button>
// //               <UserDropdown name="Saksham B." role="Alpha Batch" avatar="SB" />
// //             </div>
// //           </div>
// //         </div>

// //         {/* Mobile Menu */}
// //         {mobileMenuOpen && (
// //           <div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl z-50">
// //             <div className="p-4 space-y-2">
// //               <Link to="/student" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-indigo-50 text-indigo-600"><LayoutDashboard size={18}/> Cockpit</Link>
// //               <Link to="/student/drives" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Briefcase size={18}/> Drives</Link>
// //               <Link to="/sandbox" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Code size={18}/> Arena</Link>
// //               <div className="h-px bg-slate-100 my-2"></div>
// //               <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"><LogOut size={18} /> Sign Out</button>
// //             </div>
// //           </div>
// //         )}
// //       </nav>

// //       {/* DASHBOARD CONTENT */}
// //       <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
        
// //         {/* HERO CARD */}
// //         <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl relative overflow-hidden">
// //           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
// //             <div>
// //               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider mb-4">
// //                 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live System
// //               </div>
// //               <h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back, Saksham</h1>
// //               <p className="text-slate-400 text-lg mb-6">Your placement probability has increased by <span className="text-emerald-400 font-bold">12%</span> this week.</p>
              
// //               <div className="flex gap-4">
// //                 <div className="flex flex-col">
// //                   <span className="text-slate-500 text-xs font-bold uppercase">Current Rank</span>
// //                   <span className="text-3xl font-black">1450</span>
// //                 </div>
// //                 <div className="w-px bg-white/10 h-10 self-center"></div>
// //                 <div className="flex flex-col">
// //                   <span className="text-slate-500 text-xs font-bold uppercase">Hub Score</span>
// //                   <span className="text-3xl font-black text-indigo-400">850</span>
// //                 </div>
// //               </div>
// //             </div>
            
// //             {/* Profile Meter */}
// //             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm lg:max-w-md ml-auto w-full">
// //               <div className="flex justify-between items-end mb-4">
// //                 <div>
// //                   <h3 className="font-bold text-lg">Profile Strength</h3>
// //                   <p className="text-slate-400 text-sm">Resume & Portfolio</p>
// //                 </div>
// //                 <span className="text-2xl font-bold text-indigo-400">70%</span>
// //               </div>
// //               <div className="w-full bg-slate-700 h-3 rounded-full mb-4 overflow-hidden">
// //                 <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[70%] rounded-full relative"></div>
// //               </div>
// //               <div className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
// //                 <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
// //                 <div>
// //                   <p className="text-amber-200 text-xs font-bold mb-1">Action Required</p>
// //                   <p className="text-amber-100/70 text-xs">Add a GitHub project link to reach 80% completeness.</p>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //           <div className="absolute -top-24 -right-24 text-white/5 rotate-12"><TrendingUp size={400} /></div>
// //         </div>

// //         {/* WIDGET GRID */}
// //         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
// //           {/* Status Card */}
// //           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
// //             <div className="flex items-center gap-3 mb-6">
// //               <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Target size={20}/></div>
// //               <div>
// //                 <h3 className="font-bold text-slate-800">Your Status</h3>
// //                 <p className="text-xs text-slate-500 font-bold uppercase">Academic & Skill</p>
// //               </div>
// //             </div>
// //             <div className="space-y-4">
// //                <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Batch Category</span><Badge color="indigo">Alpha Batch</Badge></div>
// //                <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">AMCAT Quant</span><Badge color="emerald">Top 10%</Badge></div>
// //                <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Logical Ability</span><Badge color="emerald">Top 15%</Badge></div>
// //             </div>
// //           </div>

// //           {/* Urgent Action Card */}
// //           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50 relative overflow-hidden">
// //              <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">URGENT</div>
// //              <div className="flex items-center gap-3 mb-6">
// //                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Bell size={20}/></div>
// //                <div>
// //                  <h3 className="font-bold text-slate-800">Pending Actions</h3>
// //                  <p className="text-xs text-slate-500 font-bold uppercase">1 Deadline Today</p>
// //                </div>
// //              </div>
             
// //              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
// //                 <div className="flex justify-between items-start mb-2">
// //                     <p className="text-sm font-bold text-slate-900">Amazon SDE Drive</p>
// //                     <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Ends 5 PM</span>
// //                 </div>
// //                 <p className="text-xs text-slate-500 mb-3">You have been shortlisted. Verify resume to confirm seat.</p>
// //                 <button onClick={() => navigate('/student/upload')} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Upload Resume</button>
// //              </div>
// //           </div>

// //           {/* Quick Links */}
// //           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
// //              <div className="mb-2">
// //                 <h3 className="font-bold text-slate-800">Quick Access</h3>
// //                 <p className="text-xs text-slate-500 font-bold uppercase">Tools & Resources</p>
// //              </div>
// //              <button onClick={() => navigate('/sandbox')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left">
// //                 <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Code size={18} className="text-indigo-600"/></div>
// //                 <div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Open Sandbox</h4><p className="text-[10px] text-slate-400">Practice coding</p></div>
// //                 <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/>
// //              </button>
// //              <button onClick={() => navigate('/student/vault')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left">
// //                 <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><BookOpen size={18} className="text-emerald-600"/></div>
// //                 <div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Company Vault</h4><p className="text-[10px] text-slate-400">Read experiences</p></div>
// //                 <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/>
// //              </button>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // // ==========================================
// // // 3. FACULTY DASHBOARD (Command Center + Drive Monitor)
// // // ==========================================

// // const FacultyDashboard = () => {
// //   const navigate = useNavigate();
// //   return (
// //     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
// //       {/* SIDEBAR */}
// //       <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col border-r border-slate-800">
// //         <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
// //           <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
// //           <span className="text-xl font-bold tracking-tight">SkillSync</span>
// //         </div>
// //         <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
// //            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</div>
// //            <button className="w-full flex items-center gap-3 px-3 py-2 bg-slate-800 text-white rounded-lg font-medium shadow-inner"><LayoutDashboard size={18}/> Command Center</button>
// //            <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800/50 rounded-lg transition-colors"><Users size={18}/> Students Database</button>
// //            <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800/50 rounded-lg transition-colors"><Briefcase size={18}/> Manage Drives</button>
// //            <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800/50 rounded-lg transition-colors"><FileText size={18}/> Reports & Analytics</button>

// //            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Recent Activity</div>
// //            <div className="px-3 space-y-4">
// //               {[
// //                 { u: "Rahul V.", a: "applied for Amazon", t: "2m ago" },
// //                 { u: "Priya S.", a: "completed Mock Test", t: "15m ago" },
// //                 { u: "System", a: "Synced LeetCode data", t: "1h ago" }
// //               ].map((item, i) => (
// //                 <div key={i} className="flex gap-3 items-start">
// //                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
// //                    <div>
// //                       <p className="text-xs text-slate-300"><span className="font-bold text-white">{item.u}</span> {item.a}</p>
// //                       <p className="text-[10px] text-slate-600">{item.t}</p>
// //                    </div>
// //                 </div>
// //               ))}
// //            </div>
// //         </nav>
// //         <div className="p-4 border-t border-slate-800">
// //            <Link to="/" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><LogOut size={16}/> Sign Out</Link>
// //         </div>
// //       </aside>

// //       {/* MAIN CONTENT */}
// //       <main className="w-full md:ml-64 flex-1 p-4 md:p-8">
        
// //         {/* HEADER */}
// //         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
// //            <div>
// //               <h1 className="text-2xl font-bold text-slate-900">Command Center</h1>
// //               <p className="text-slate-500 text-sm">Real-time overview of Placement Season 2026</p>
// //            </div>
// //            <div className="flex items-center gap-4">
// //              <div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2 text-sm text-slate-500">
// //                 <Search size={16}/> <span className="text-xs">Search students, skills...</span>
// //              </div>
// //              <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all">
// //                + Create Drive
// //              </button>
// //              <div className="w-10 h-10 bg-slate-200 rounded-full md:hidden"></div>
// //            </div>
// //         </header>

// //         {/* HIGH LEVEL STATS */}
// //         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
// //            <StatCard label="Total Students" value="500" sub="Across 4 branches" />
// //            <StatCard label="Placed" value="350" sub="70% Success Rate" color="emerald" />
// //            <StatCard label="Unplaced" value="150" sub="Actively seeking" color="rose" />
// //            <StatCard label="Active Drives" value="12" sub="Open opportunities" color="indigo" highlight />
// //         </div>

// //         {/* DRIVE MONITOR (THE NEW FEATURE) */}
// //         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
// //           <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
// //              <div>
// //                <h3 className="font-bold text-slate-800">Live Drive Monitor</h3>
// //                <p className="text-xs text-slate-500">Real-time tracking of active recruitment processes</p>
// //              </div>
// //              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Filter size={18}/></button>
// //           </div>
// //           <div className="overflow-x-auto">
// //             <table className="w-full text-left text-sm">
// //               <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
// //                 <tr>
// //                   <th className="px-6 py-3">Company Name</th>
// //                   <th className="px-6 py-3">Role Profile</th>
// //                   <th className="px-6 py-3">Timeline</th>
// //                   <th className="px-6 py-3">Applicants</th>
// //                   <th className="px-6 py-3">Status</th>
// //                   <th className="px-6 py-3 text-right">Action</th>
// //                 </tr>
// //               </thead>
// //               <tbody className="divide-y divide-slate-100">
// //                 {[
// //                   { c: "Amazon", r: "SDE-1", d: "Ends Today, 5 PM", a: 142, s: "Live", cl: "emerald" },
// //                   { c: "Google", r: "STEP Intern", d: "Starts Tomorrow", a: 89, s: "Upcoming", cl: "indigo" },
// //                   { c: "Microsoft", r: "Software Eng.", d: "Closed Yesterday", a: 312, s: "Processing", cl: "amber" },
// //                   { c: "Zomato", r: "Backend Dev", d: "Draft Mode", a: 0, s: "Draft", cl: "slate" },
// //                 ].map((drive, i) => (
// //                   <tr key={i} className="hover:bg-slate-50 transition-colors group">
// //                     <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
// //                       <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">{drive.c[0]}</div>
// //                       {drive.c}
// //                     </td>
// //                     <td className="px-6 py-4 text-slate-600">{drive.r}</td>
// //                     <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-2"><Calendar size={12}/> {drive.d}</td>
// //                     <td className="px-6 py-4 font-mono font-bold text-slate-700">{drive.a}</td>
// //                     <td className="px-6 py-4"><Badge color={drive.cl}>{drive.s}</Badge></td>
// //                     <td className="px-6 py-4 text-right">
// //                       <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Manage <ArrowRight size={12}/></button>
// //                     </td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </div>
// //           <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-center">
// //              <button className="text-xs font-bold text-slate-500 hover:text-indigo-600">View All 12 Drives</button>
// //           </div>
// //         </div>
// //       </main>
// //     </div>
// //   );
// // };

// // const StatCard = ({ label, value, sub, color="slate", highlight=false }) => {
// //   const colors = {
// //     emerald: "text-emerald-600",
// //     rose: "text-rose-500",
// //     indigo: "text-indigo-600",
// //     slate: "text-slate-900"
// //   };
// //   return (
// //     <div className={`bg-white p-6 rounded-2xl border ${highlight ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-200'} shadow-sm`}>
// //       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
// //       <h3 className={`text-4xl font-black ${colors[color]}`}>{value}</h3>
// //       <p className={`text-xs mt-1 font-medium opacity-80 ${colors[color]}`}>{sub}</p>
// //     </div>
// //   );
// // };

// // // ==========================================
// // // 4. OTHER PAGES (Sandbox, Vault, Upload)
// // // ==========================================

// // const Sandbox = () => {
// //   const [analyzing, setAnalyzing] = useState(false);
// //   const [result, setResult] = useState(null);
// //   const runSimulation = () => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setResult(true); }, 2000); };

// //   return (
// //     <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden">
// //        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-r border-slate-200 bg-white h-1/2 md:h-full overflow-y-auto">
// //           <div className="mb-6"><Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link><h1 className="text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1><p className="text-slate-500 text-sm">Paste a JD below to simulate how the AI matches you.</p></div>
// //           <div className="flex-1 flex flex-col gap-4">
// //              <select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"><option>Amazon SDE - 2024</option><option>Microsoft IDC</option></select>
// //              <textarea className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={`Role: SDE-1...`} />
// //              <button onClick={runSimulation} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all">{analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} {analyzing ? "AI is Analyzing..." : "Run Simulation"}</button>
// //           </div>
// //        </div>
// //        <div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto h-1/2 md:h-full">
// //           {!result && !analyzing && (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><LayoutDashboard size={48} className="mb-4"/><p className="font-bold">Waiting for Input...</p></div>)}
// //           {result && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p><div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600"><span className="text-3xl font-black text-slate-900">65%</span></div></div><div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100"><tr className="bg-emerald-50/50"><td className="p-4 font-bold text-slate-700">DSA</td><td className="p-4 font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> Found</td></tr><tr className="bg-rose-50/50"><td className="p-4 font-bold text-slate-700">AWS</td><td className="p-4 font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={14}/> Missing</td></tr></tbody></table></div></div>)}
// //        </div>
// //     </div>
// //   );
// // };

// // const StudentUpload = () => {
// //   const [step, setStep] = useState('upload'); 
// //   const navigate = useNavigate();
// //   const handleUpload = () => { setStep('processing'); setTimeout(() => setStep('done'), 2000); };
// //   return (
// //     <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans text-slate-900">
// //       <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden">
// //         {step === 'upload' && (<><button onClick={() => navigate('/student')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600"><ArrowRight className="rotate-180"/></button><div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><UploadCloud className="w-8 h-8 text-indigo-600" /></div><h2 className="text-2xl font-bold mb-2">Amazon SDE Drive</h2><p className="text-slate-500 mb-8">Upload your resume to confirm participation.</p><div onClick={handleUpload} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors group"><span className="font-bold text-indigo-600 group-hover:scale-105 transition-transform">Click to Upload PDF</span></div></>)}
// //         {step === 'processing' && (<div className="py-10"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" /><h3 className="text-lg font-bold">Verifying Resume...</h3><p className="text-sm text-slate-400 mt-2">Checking ATS Compatibility</p></div>)}
// //         {step === 'done' && (<div className="py-6 animate-in zoom-in duration-300"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div><h3 className="text-2xl font-bold">Application Sent!</h3><p className="text-slate-500 mb-6">Faculty has been notified.</p><button onClick={() => navigate('/student')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full hover:bg-indigo-700 shadow-lg shadow-indigo-100">Back to Cockpit</button></div>)}
// //       </div>
// //     </div>
// //   );
// // };

// // const CompanyVault = () => (
// //   <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center">
// //     <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center mb-6 animate-bounce"><Briefcase className="w-10 h-10 text-indigo-600" /></div>
// //     <h1 className="text-3xl font-black text-slate-900 mb-2">Company Vault</h1>
// //     <p className="text-slate-500 max-w-md mb-8">Access previous year questions, interview experiences, and salary breakdowns.</p>
// //     <div className="flex gap-4"><Link to="/student" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">← Back</Link><button className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700">Explore Data</button></div>
// //   </div>
// // );

// // const LandingPage = () => (
// //   <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 font-sans">
// //     <div className="text-center mb-12 animate-in slide-in-from-bottom-8 duration-700"><div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-sm font-bold mb-6"><span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> v2.0 Live Now</div><h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight">SkillSync.</h1><p className="text-slate-400 text-lg md:text-xl max-w-lg mx-auto">The AI-Native Placement Ecosystem.</p></div>
// //     <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl animate-in fade-in duration-1000 delay-300">
// //       <Link to="/student" className="group p-8 md:p-10 bg-slate-800 rounded-3xl border border-slate-700 hover:bg-slate-700 hover:border-indigo-500 transition-all flex-1 text-left relative overflow-hidden"><h3 className="text-2xl font-bold mb-2 text-white group-hover:text-indigo-400 transition-colors">Student</h3><p className="text-slate-400 text-sm">Access Cockpit</p><ArrowRight className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all text-indigo-500 translate-y-4 group-hover:translate-y-0"/></Link>
// //       <Link to="/faculty" className="group p-8 md:p-10 bg-slate-800 rounded-3xl border border-slate-700 hover:bg-slate-700 hover:border-emerald-500 transition-all flex-1 text-left relative overflow-hidden"><h3 className="text-2xl font-bold mb-2 text-white group-hover:text-emerald-400 transition-colors">Faculty</h3><p className="text-slate-400 text-sm">Command Center</p><ArrowRight className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all text-emerald-500 translate-y-4 group-hover:translate-y-0"/></Link>
// //     </div>
// //   </div>
// // );

// // // ==========================================
// // // 5. APP ROUTER
// // // ==========================================
// // function App() {
// //   return (
// //     <Router>
// //       <Routes>
// //         <Route path="/" element={<LandingPage />} />
// //         <Route path="/student" element={<StudentDashboard />} />
// //         <Route path="/student/upload" element={<StudentUpload />} />
// //         <Route path="/student/vault" element={<CompanyVault />} />
// //         <Route path="/student/drives" element={<div className="p-10 text-center font-bold text-slate-500">Drives Page (Coming Soon)</div>} />
// //         <Route path="/faculty" element={<FacultyDashboard />} />
// //         <Route path="/sandbox" element={<Sandbox />} />
// //       </Routes>
// //     </Router>
// //   );
// // }

// // export default App;




























































// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
// import { 
//   UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
//   Users, Code, LogOut, Search, Play, TrendingUp, AlertTriangle, 
//   Briefcase, Bell, Menu, X, BookOpen, Star, Target, ChevronDown, 
//   MoreHorizontal, Filter, Calendar, FileText, Plus, Download, Mail
// } from 'lucide-react';

// // ==========================================
// // 1. SHARED COMPONENTS
// // ==========================================
// const Badge = ({ children, color = "indigo" }) => {
//   const colors = {
//     indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
//     emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
//     rose: "bg-rose-50 text-rose-700 border-rose-100",
//     amber: "bg-amber-50 text-amber-700 border-amber-100",
//     slate: "bg-slate-100 text-slate-600 border-slate-200",
//   };
//   return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[color] || colors.slate}`}>{children}</span>;
// };

// // ==========================================
// // 2. FACULTY SUB-SCREENS (New!)
// // ==========================================

// // A. COMMAND CENTER (The default view you already have)
// const CommandCenter = ({ setActiveTab }) => (
//   <>
//     {/* HIGH LEVEL STATS */}
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
//        <StatCard label="Total Students" value="500" sub="Across 4 branches" />
//        <StatCard label="Placed" value="350" sub="70% Success Rate" color="emerald" />
//        <StatCard label="Unplaced" value="150" sub="Actively seeking" color="rose" />
//        <StatCard label="Active Drives" value="12" sub="Open opportunities" color="indigo" highlight />
//     </div>

//     {/* DRIVE MONITOR */}
//     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//       <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
//          <div>
//            <h3 className="font-bold text-slate-800">Live Drive Monitor</h3>
//            <p className="text-xs text-slate-500">Real-time tracking of active recruitment processes</p>
//          </div>
//          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Filter size={18}/></button>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full text-left text-sm">
//           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//             <tr>
//               <th className="px-6 py-3">Company Name</th>
//               <th className="px-6 py-3">Role Profile</th>
//               <th className="px-6 py-3">Timeline</th>
//               <th className="px-6 py-3">Applicants</th>
//               <th className="px-6 py-3">Status</th>
//               <th className="px-6 py-3 text-right">Action</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {[
//               { c: "Amazon", r: "SDE-1", d: "Ends Today, 5 PM", a: 142, s: "Live", cl: "emerald" },
//               { c: "Google", r: "STEP Intern", d: "Starts Tomorrow", a: 89, s: "Upcoming", cl: "indigo" },
//               { c: "Microsoft", r: "Software Eng.", d: "Closed Yesterday", a: 312, s: "Processing", cl: "amber" },
//               { c: "Zomato", r: "Backend Dev", d: "Draft Mode", a: 0, s: "Draft", cl: "slate" },
//             ].map((drive, i) => (
//               <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setActiveTab('drives')}>
//                 <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">{drive.c[0]}</div>
//                   {drive.c}
//                 </td>
//                 <td className="px-6 py-4 text-slate-600">{drive.r}</td>
//                 <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-2"><Calendar size={12}/> {drive.d}</td>
//                 <td className="px-6 py-4 font-mono font-bold text-slate-700">{drive.a}</td>
//                 <td className="px-6 py-4"><Badge color={drive.cl}>{drive.s}</Badge></td>
//                 <td className="px-6 py-4 text-right">
//                   <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Manage <ArrowRight size={12}/></button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   </>
// );

// // B. STUDENTS DATABASE (New Screen)
// const StudentsDatabase = () => (
//   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
//     <div className="p-6 border-b border-slate-100 flex justify-between items-center">
//        <div>
//          <h2 className="text-lg font-bold text-slate-900">Students Database</h2>
//          <p className="text-sm text-slate-500">View and filter all registered students</p>
//        </div>
//        <div className="flex gap-2">
//          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"><Filter size={16}/> Filter</button>
//          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Download size={16}/> Export CSV</button>
//        </div>
//     </div>
    
//     <table className="w-full text-left text-sm">
//        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//           <tr>
//              <th className="px-6 py-3">Student Name</th>
//              <th className="px-6 py-3">Branch</th>
//              <th className="px-6 py-3">CGPA</th>
//              <th className="px-6 py-3">Hub Score</th>
//              <th className="px-6 py-3">Status</th>
//              <th className="px-6 py-3 text-right">Actions</th>
//           </tr>
//        </thead>
//        <tbody className="divide-y divide-slate-100">
//           {[
//             { n: "Saksham Bhardwaj", b: "CSE AIML", c: "9.2", h: "1850", s: "Unplaced", sc: "rose" },
//             { n: "Aditya Sharma", b: "CSE Core", c: "8.8", h: "1620", s: "Placed (Amazon)", sc: "emerald" },
//             { n: "Priya Singh", b: "IT", c: "8.5", h: "1450", s: "Unplaced", sc: "rose" },
//             { n: "Rahul Verma", b: "ECE", c: "7.9", h: "1200", s: "Unplaced", sc: "rose" },
//           ].map((s, i) => (
//              <tr key={i} className="hover:bg-slate-50">
//                 <td className="px-6 py-4 font-bold text-slate-900">{s.n}</td>
//                 <td className="px-6 py-4 text-slate-600">{s.b}</td>
//                 <td className="px-6 py-4 font-mono">{s.c}</td>
//                 <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{s.h}</td>
//                 <td className="px-6 py-4"><Badge color={s.sc}>{s.s}</Badge></td>
//                 <td className="px-6 py-4 text-right"><button className="text-indigo-600 hover:underline font-bold text-xs">View Profile</button></td>
//              </tr>
//           ))}
//        </tbody>
//     </table>
//   </div>
// );

// // C. MANAGE DRIVES (New Screen)
// const ManageDrives = () => (
//   <div className="space-y-6">
//     <div className="flex justify-between items-center">
//        <h2 className="text-xl font-bold text-slate-900">Manage Recruitment Drives</h2>
//        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Create New Drive</button>
//     </div>
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//        {[
//          { c: "Amazon", r: "SDE-1", s: "Live", a: 142 },
//          { c: "Google", r: "STEP Intern", s: "Upcoming", a: 89 },
//          { c: "Microsoft", r: "SWE", s: "Processing", a: 312 },
//          { c: "Zomato", r: "Backend", s: "Draft", a: 0 },
//        ].map((d, i) => (
//          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
//             <div className="flex justify-between items-start mb-4">
//                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">{d.c[0]}</div>
//                <Badge color={d.s === 'Live' ? 'emerald' : d.s === 'Upcoming' ? 'indigo' : 'slate'}>{d.s}</Badge>
//             </div>
//             <h3 className="font-bold text-lg text-slate-900">{d.c}</h3>
//             <p className="text-slate-500 text-sm mb-4">{d.r}</p>
//             <div className="flex justify-between items-center pt-4 border-t border-slate-100">
//                <span className="text-xs font-bold text-slate-500">{d.a} Applicants</span>
//                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors"/>
//             </div>
//          </div>
//        ))}
//     </div>
//   </div>
// );

// // D. REPORTS (New Screen)
// const ReportsAnalytics = () => (
//   <div className="flex flex-col items-center justify-center h-[500px] text-center bg-white rounded-2xl border border-slate-200 border-dashed">
//      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><FileText size={32} className="text-indigo-600"/></div>
//      <h3 className="text-xl font-bold text-slate-900">Reports & Analytics</h3>
//      <p className="text-slate-500 max-w-sm mb-6">Detailed placement statistics and downloadable reports will appear here.</p>
//      <button className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Download Summary Report</button>
//   </div>
// );


// // ==========================================
// // 3. FACULTY DASHBOARD (Main Wrapper)
// // ==========================================

// const FacultyDashboard = () => {
//   const [activeTab, setActiveTab] = useState('dashboard'); // State to switch screens
//   const navigate = useNavigate();

//   // Helper to render the correct content based on activeTab
//   const renderContent = () => {
//     switch(activeTab) {
//       case 'dashboard': return <CommandCenter setActiveTab={setActiveTab} />;
//       case 'students': return <StudentsDatabase />;
//       case 'drives': return <ManageDrives />;
//       case 'reports': return <ReportsAnalytics />;
//       default: return <CommandCenter />;
//     }
//   };

//   // Helper for Sidebar Buttons
//   const SidebarBtn = ({ id, icon: Icon, label }) => (
//     <button 
//       onClick={() => setActiveTab(id)}
//       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
//     >
//       <Icon size={18}/> {label}
//     </button>
//   );

//   return (
//     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
//       {/* SIDEBAR */}
//       <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col border-r border-slate-800">
//         <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
//           <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
//           <span className="text-xl font-bold tracking-tight">SkillSync</span>
//         </div>
        
//         <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</div>
           
//            {/* INTERACTIVE BUTTONS */}
//            <SidebarBtn id="dashboard" icon={LayoutDashboard} label="Command Center" />
//            <SidebarBtn id="students" icon={Users} label="Students Database" />
//            <SidebarBtn id="drives" icon={Briefcase} label="Manage Drives" />
//            <SidebarBtn id="reports" icon={FileText} label="Reports & Analytics" />

//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Recent Activity</div>
//            <div className="px-3 space-y-4">
//               {[
//                 { u: "Rahul V.", a: "applied for Amazon", t: "2m ago" },
//                 { u: "Priya S.", a: "completed Mock Test", t: "15m ago" },
//                 { u: "System", a: "Synced LeetCode data", t: "1h ago" }
//               ].map((item, i) => (
//                 <div key={i} className="flex gap-3 items-start">
//                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
//                    <div>
//                       <p className="text-xs text-slate-300"><span className="font-bold text-white">{item.u}</span> {item.a}</p>
//                       <p className="text-[10px] text-slate-600">{item.t}</p>
//                    </div>
//                 </div>
//               ))}
//            </div>
//         </nav>
        
//         <div className="p-4 border-t border-slate-800">
//            <Link to="/" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><LogOut size={16}/> Sign Out</Link>
//         </div>
//       </aside>

//       {/* MAIN CONTENT AREA */}
//       <main className="w-full md:ml-64 flex-1 p-4 md:p-8 overflow-y-auto">
        
//         {/* HEADER */}
//         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//            <div>
//               <h1 className="text-2xl font-bold text-slate-900">
//                 {activeTab === 'dashboard' ? 'Command Center' : 
//                  activeTab === 'students' ? 'Students Database' :
//                  activeTab === 'drives' ? 'Recruitment Drives' : 'Analytics'}
//               </h1>
//               <p className="text-slate-500 text-sm">Placement Season 2026 • Term 2</p>
//            </div>
           
//            <div className="flex items-center gap-4">
//              {activeTab === 'students' && (
//                 <div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2 text-sm text-slate-500">
//                   <Search size={16}/> <input placeholder="Search students..." className="outline-none text-xs w-40"/>
//                 </div>
//              )}
             
//              {/* CREATE DRIVE BUTTON (Opens the 'drives' tab) */}
//              <button 
//                 onClick={() => setActiveTab('drives')}
//                 className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all"
//              >
//                <Plus size={18}/> Create Drive
//              </button>
//            </div>
//         </header>

//         {/* DYNAMIC CONTENT SWITCHER */}
//         <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
//           {renderContent()}
//         </div>

//       </main>
//     </div>
//   );
// };

// const StatCard = ({ label, value, sub, color="slate", highlight=false }) => {
//   const colors = {
//     emerald: "text-emerald-600",
//     rose: "text-rose-500",
//     indigo: "text-indigo-600",
//     slate: "text-slate-900"
//   };
//   return (
//     <div className={`bg-white p-6 rounded-2xl border ${highlight ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-200'} shadow-sm`}>
//       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
//       <h3 className={`text-4xl font-black ${colors[color]}`}>{value}</h3>
//       <p className={`text-xs mt-1 font-medium opacity-80 ${colors[color]}`}>{sub}</p>
//     </div>
//   );
// };


// // ==========================================
// // 4. STUDENT & OTHER PAGES (Keep these as is)
// // ==========================================

// // ... (KEEP STUDENT DASHBOARD, LANDING PAGE, ETC. SAME AS BEFORE) ...
// // (I will paste the FULL file below including the student parts so you can copy-paste easily)

// const UserDropdown = ({ name, role, avatar }) => (
//   <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
//     <div className="text-right hidden lg:block"><p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role}</p></div><div className="w-9 h-9 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">{avatar}</div><ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600" />
//   </div>
// );

// const StudentDashboard = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const isActive = (path) => location.pathname === path ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50";

//   return (
//     <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
//       <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 md:px-8"><div className="flex justify-between items-center h-16"><div className="flex items-center gap-3"><button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button><div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}><div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-5 h-5 fill-current"/></div><span className="font-bold text-xl tracking-tight hidden sm:block">SkillSync</span></div></div><div className="hidden md:flex items-center gap-1"><Link to="/student" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student')}`}><LayoutDashboard size={16} /> Cockpit</Link><Link to="/student/drives" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student/drives')}`}><Briefcase size={16} /> Drives</Link><Link to="/sandbox" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/sandbox')}`}><Code size={16} /> Arena</Link></div><div className="flex items-center gap-4"><button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span></button><UserDropdown name="Saksham B." role="Alpha Batch" avatar="SB" /></div></div></div>
//         {mobileMenuOpen && (<div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl z-50"><div className="p-4 space-y-2"><Link to="/student" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-indigo-50 text-indigo-600"><LayoutDashboard size={18}/> Cockpit</Link><Link to="/student/drives" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Briefcase size={18}/> Drives</Link><Link to="/sandbox" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Code size={18}/> Arena</Link><div className="h-px bg-slate-100 my-2"></div><button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"><LogOut size={18} /> Sign Out</button></div></div>)}
//       </nav>
//       <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
//         <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl relative overflow-hidden"><div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"><div><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider mb-4"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live System</div><h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back, Saksham</h1><p className="text-slate-400 text-lg mb-6">Your placement probability has increased by <span className="text-emerald-400 font-bold">12%</span> this week.</p><div className="flex gap-4"><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Current Rank</span><span className="text-3xl font-black">1450</span></div><div className="w-px bg-white/10 h-10 self-center"></div><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Hub Score</span><span className="text-3xl font-black text-indigo-400">850</span></div></div></div><div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm lg:max-w-md ml-auto w-full"><div className="flex justify-between items-end mb-4"><div><h3 className="font-bold text-lg">Profile Strength</h3><p className="text-slate-400 text-sm">Resume & Portfolio</p></div><span className="text-2xl font-bold text-indigo-400">70%</span></div><div className="w-full bg-slate-700 h-3 rounded-full mb-4 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[70%] rounded-full relative"></div></div><div className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20"><AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" /><div><p className="text-amber-200 text-xs font-bold mb-1">Action Required</p><p className="text-amber-100/70 text-xs">Add a GitHub project link to reach 80% completeness.</p></div></div></div></div><div className="absolute -top-24 -right-24 text-white/5 rotate-12"><TrendingUp size={400} /></div></div>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Target size={20}/></div><div><h3 className="font-bold text-slate-800">Your Status</h3><p className="text-xs text-slate-500 font-bold uppercase">Academic & Skill</p></div></div><div className="space-y-4"><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Batch Category</span><Badge color="indigo">Alpha Batch</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">AMCAT Quant</span><Badge color="emerald">Top 10%</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Logical Ability</span><Badge color="emerald">Top 15%</Badge></div></div></div><div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50 relative overflow-hidden"><div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">URGENT</div><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Bell size={20}/></div><div><h3 className="font-bold text-slate-800">Pending Actions</h3><p className="text-xs text-slate-500 font-bold uppercase">1 Deadline Today</p></div></div><div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4"><div className="flex justify-between items-start mb-2"><p className="text-sm font-bold text-slate-900">Amazon SDE Drive</p><span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Ends 5 PM</span></div><p className="text-xs text-slate-500 mb-3">You have been shortlisted. Verify resume to confirm seat.</p><button onClick={() => navigate('/student/upload')} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Upload Resume</button></div></div><div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4"><div className="mb-2"><h3 className="font-bold text-slate-800">Quick Access</h3><p className="text-xs text-slate-500 font-bold uppercase">Tools & Resources</p></div><button onClick={() => navigate('/sandbox')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Code size={18} className="text-indigo-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Open Sandbox</h4><p className="text-[10px] text-slate-400">Practice coding</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button><button onClick={() => navigate('/student/vault')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><BookOpen size={18} className="text-emerald-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Company Vault</h4><p className="text-[10px] text-slate-400">Read experiences</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button></div></div>
//       </div>
//     </div>
//   );
// };

// // ... (Rest of Sandbox, Vault, Upload, Landing Page components - kept compact)

// const Sandbox = () => {
//   const [analyzing, setAnalyzing] = useState(false);
//   const [result, setResult] = useState(null);
//   const runSimulation = () => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setResult(true); }, 2000); };
//   return (<div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden"><div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-r border-slate-200 bg-white h-1/2 md:h-full overflow-y-auto"><div className="mb-6"><Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link><h1 className="text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1><p className="text-slate-500 text-sm">Paste a JD below to simulate how the AI matches you.</p></div><div className="flex-1 flex flex-col gap-4"><select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"><option>Amazon SDE - 2024</option><option>Microsoft IDC</option></select><textarea className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={`Role: SDE-1...`} /><button onClick={runSimulation} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all">{analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} {analyzing ? "AI is Analyzing..." : "Run Simulation"}</button></div></div><div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto h-1/2 md:h-full">{!result && !analyzing && (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><LayoutDashboard size={48} className="mb-4"/><p className="font-bold">Waiting for Input...</p></div>)}{result && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p><div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600"><span className="text-3xl font-black text-slate-900">65%</span></div></div><div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100"><tr className="bg-emerald-50/50"><td className="p-4 font-bold text-slate-700">DSA</td><td className="p-4 font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> Found</td></tr><tr className="bg-rose-50/50"><td className="p-4 font-bold text-slate-700">AWS</td><td className="p-4 font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={14}/> Missing</td></tr></tbody></table></div></div>)}</div></div>);
// };

// const StudentUpload = () => {
//   const [step, setStep] = useState('upload'); const navigate = useNavigate(); const handleUpload = () => { setStep('processing'); setTimeout(() => setStep('done'), 2000); };
//   return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans text-slate-900"><div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden">{step === 'upload' && (<><button onClick={() => navigate('/student')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600"><ArrowRight className="rotate-180"/></button><div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><UploadCloud className="w-8 h-8 text-indigo-600" /></div><h2 className="text-2xl font-bold mb-2">Amazon SDE Drive</h2><p className="text-slate-500 mb-8">Upload your resume to confirm participation.</p><div onClick={handleUpload} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors group"><span className="font-bold text-indigo-600 group-hover:scale-105 transition-transform">Click to Upload PDF</span></div></>)}{step === 'processing' && (<div className="py-10"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" /><h3 className="text-lg font-bold">Verifying Resume...</h3></div>)}{step === 'done' && (<div className="py-6 animate-in zoom-in duration-300"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div><h3 className="text-2xl font-bold">Application Sent!</h3><button onClick={() => navigate('/student')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full mt-6">Back to Cockpit</button></div>)}</div></div>);
// };

// const CompanyVault = () => (<div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center"><h1 className="text-3xl font-black text-slate-900 mb-2">Company Vault</h1><p className="text-slate-500 max-w-md mb-8">Access previous year questions.</p><Link to="/student" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">← Back</Link></div>);

// const LandingPage = () => (<div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 font-sans"><h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight">SkillSync.</h1><p className="text-slate-400 text-lg md:text-xl max-w-lg mx-auto mb-12">The AI-Native Placement Ecosystem.</p><div className="flex gap-6"><Link to="/student" className="p-8 bg-slate-800 rounded-3xl border border-slate-700 hover:bg-slate-700 hover:border-indigo-500 transition-all w-64 text-center font-bold">Student</Link><Link to="/faculty" className="p-8 bg-slate-800 rounded-3xl border border-slate-700 hover:bg-slate-700 hover:border-emerald-500 transition-all w-64 text-center font-bold">Faculty</Link></div></div>);

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<LandingPage />} />
//         <Route path="/student" element={<StudentDashboard />} />
//         <Route path="/student/upload" element={<StudentUpload />} />
//         <Route path="/student/vault" element={<CompanyVault />} />
//         <Route path="/student/drives" element={<div className="p-10 text-center font-bold text-slate-500">Drives Page (Coming Soon)</div>} />
//         <Route path="/faculty" element={<FacultyDashboard />} />
//         <Route path="/sandbox" element={<Sandbox />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;


















































// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
// import { 
//   UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
//   Users, Code, LogOut, Search, Play, TrendingUp, AlertTriangle, 
//   Briefcase, Bell, Menu, X, BookOpen, Star, Target, ChevronDown, 
//   Filter, Calendar, FileText, Plus, Download
// } from 'lucide-react';

// // ==========================================
// // 1. SHARED COMPONENTS
// // ==========================================

// const Badge = ({ children, color = "indigo" }) => {
//   const colors = {
//     indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
//     emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
//     rose: "bg-rose-50 text-rose-700 border-rose-100",
//     amber: "bg-amber-50 text-amber-700 border-amber-100",
//     slate: "bg-slate-100 text-slate-600 border-slate-200",
//   };
//   return (
//     <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[color] || colors.slate}`}>
//       {children}
//     </span>
//   );
// };

// const StatCard = ({ label, value, sub, color="slate", highlight=false }) => {
//   const colors = {
//     emerald: "text-emerald-600",
//     rose: "text-rose-500",
//     indigo: "text-indigo-600",
//     slate: "text-slate-900"
//   };
//   return (
//     <div className={`bg-white p-6 rounded-2xl border ${highlight ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-200'} shadow-sm transition-all hover:shadow-md`}>
//       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
//       <h3 className={`text-4xl font-black ${colors[color]}`}>{value}</h3>
//       <p className={`text-xs mt-1 font-medium opacity-80 ${colors[color]}`}>{sub}</p>
//     </div>
//   );
// };

// // ==========================================
// // 2. FACULTY SUB-SCREENS
// // ==========================================

// const CommandCenter = ({ setActiveTab }) => (
//   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
//        <StatCard label="Total Students" value="500" sub="Across 4 branches" />
//        <StatCard label="Placed" value="350" sub="70% Success Rate" color="emerald" />
//        <StatCard label="Unplaced" value="150" sub="Actively seeking" color="rose" />
//        <StatCard label="Active Drives" value="12" sub="Open opportunities" color="indigo" highlight />
//     </div>

//     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//       <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
//          <div>
//            <h3 className="font-bold text-slate-800">Live Drive Monitor</h3>
//            <p className="text-xs text-slate-500">Real-time tracking of active recruitment processes</p>
//          </div>
//          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Filter size={18}/></button>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full text-left text-sm">
//           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//             <tr>
//               <th className="px-6 py-3">Company Name</th>
//               <th className="px-6 py-3">Role Profile</th>
//               <th className="px-6 py-3">Timeline</th>
//               <th className="px-6 py-3">Applicants</th>
//               <th className="px-6 py-3">Status</th>
//               <th className="px-6 py-3 text-right">Action</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {[
//               { c: "Amazon", r: "SDE-1", d: "Ends Today, 5 PM", a: 142, s: "Live", cl: "emerald" },
//               { c: "Google", r: "STEP Intern", d: "Starts Tomorrow", a: 89, s: "Upcoming", cl: "indigo" },
//               { c: "Microsoft", r: "Software Eng.", d: "Closed Yesterday", a: 312, s: "Processing", cl: "amber" },
//               { c: "Zomato", r: "Backend Dev", d: "Draft Mode", a: 0, s: "Draft", cl: "slate" },
//             ].map((drive, i) => (
//               <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setActiveTab('drives')}>
//                 <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">{drive.c[0]}</div>
//                   {drive.c}
//                 </td>
//                 <td className="px-6 py-4 text-slate-600">{drive.r}</td>
//                 <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-2"><Calendar size={12}/> {drive.d}</td>
//                 <td className="px-6 py-4 font-mono font-bold text-slate-700">{drive.a}</td>
//                 <td className="px-6 py-4"><Badge color={drive.cl}>{drive.s}</Badge></td>
//                 <td className="px-6 py-4 text-right">
//                   <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Manage <ArrowRight size={12}/></button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   </div>
// );

// const StudentsDatabase = () => (
//   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] animate-in fade-in zoom-in duration-300">
//     <div className="p-6 border-b border-slate-100 flex justify-between items-center">
//        <div>
//          <h2 className="text-lg font-bold text-slate-900">Students Database</h2>
//          <p className="text-sm text-slate-500">View and filter all registered students</p>
//        </div>
//        <div className="flex gap-2">
//          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"><Filter size={16}/> Filter</button>
//          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Download size={16}/> Export CSV</button>
//        </div>
//     </div>
//     <table className="w-full text-left text-sm">
//        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//           <tr>
//              <th className="px-6 py-3">Student Name</th>
//              <th className="px-6 py-3">Branch</th>
//              <th className="px-6 py-3">CGPA</th>
//              <th className="px-6 py-3">Hub Score</th>
//              <th className="px-6 py-3">Status</th>
//              <th className="px-6 py-3 text-right">Actions</th>
//           </tr>
//        </thead>
//        <tbody className="divide-y divide-slate-100">
//           {[
//             { n: "Saksham Bhardwaj", b: "CSE AIML", c: "9.2", h: "1850", s: "Unplaced", sc: "rose" },
//             { n: "Aditya Sharma", b: "CSE Core", c: "8.8", h: "1620", s: "Placed (Amazon)", sc: "emerald" },
//             { n: "Priya Singh", b: "IT", c: "8.5", h: "1450", s: "Unplaced", sc: "rose" },
//             { n: "Rahul Verma", b: "ECE", c: "7.9", h: "1200", s: "Unplaced", sc: "rose" },
//           ].map((s, i) => (
//              <tr key={i} className="hover:bg-slate-50">
//                 <td className="px-6 py-4 font-bold text-slate-900">{s.n}</td>
//                 <td className="px-6 py-4 text-slate-600">{s.b}</td>
//                 <td className="px-6 py-4 font-mono">{s.c}</td>
//                 <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{s.h}</td>
//                 <td className="px-6 py-4"><Badge color={s.sc}>{s.s}</Badge></td>
//                 <td className="px-6 py-4 text-right"><button className="text-indigo-600 hover:underline font-bold text-xs">View Profile</button></td>
//              </tr>
//           ))}
//        </tbody>
//     </table>
//   </div>
// );

// const ManageDrives = () => (
//   <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
//     <div className="flex justify-between items-center">
//        <h2 className="text-xl font-bold text-slate-900">Manage Recruitment Drives</h2>
//        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Create New Drive</button>
//     </div>
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//        {[
//          { c: "Amazon", r: "SDE-1", s: "Live", a: 142 },
//          { c: "Google", r: "STEP Intern", s: "Upcoming", a: 89 },
//          { c: "Microsoft", r: "SWE", s: "Processing", a: 312 },
//          { c: "Zomato", r: "Backend", s: "Draft", a: 0 },
//        ].map((d, i) => (
//          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
//             <div className="flex justify-between items-start mb-4">
//                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">{d.c[0]}</div>
//                <Badge color={d.s === 'Live' ? 'emerald' : d.s === 'Upcoming' ? 'indigo' : 'slate'}>{d.s}</Badge>
//             </div>
//             <h3 className="font-bold text-lg text-slate-900">{d.c}</h3>
//             <p className="text-slate-500 text-sm mb-4">{d.r}</p>
//             <div className="flex justify-between items-center pt-4 border-t border-slate-100">
//                <span className="text-xs font-bold text-slate-500">{d.a} Applicants</span>
//                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors"/>
//             </div>
//          </div>
//        ))}
//     </div>
//   </div>
// );

// const ReportsAnalytics = () => (
//   <div className="flex flex-col items-center justify-center h-[500px] text-center bg-white rounded-2xl border border-slate-200 border-dashed animate-in fade-in zoom-in duration-300">
//      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><FileText size={32} className="text-indigo-600"/></div>
//      <h3 className="text-xl font-bold text-slate-900">Reports & Analytics</h3>
//      <p className="text-slate-500 max-w-sm mb-6">Detailed placement statistics and downloadable reports will appear here.</p>
//      <button className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Download Summary Report</button>
//   </div>
// );

// // ==========================================
// // 3. FACULTY DASHBOARD (Main Wrapper)
// // ==========================================

// const FacultyDashboard = () => {
//   const [activeTab, setActiveTab] = useState('dashboard'); 
  
//   const renderContent = () => {
//     switch(activeTab) {
//       case 'dashboard': return <CommandCenter setActiveTab={setActiveTab} />;
//       case 'students': return <StudentsDatabase />;
//       case 'drives': return <ManageDrives />;
//       case 'reports': return <ReportsAnalytics />;
//       default: return <CommandCenter />;
//     }
//   };

//   const SidebarBtn = ({ id, icon: Icon, label }) => (
//     <button 
//       onClick={() => setActiveTab(id)}
//       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
//     >
//       <Icon size={18}/> {label}
//     </button>
//   );

//   return (
//     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
//       <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col border-r border-slate-800">
//         <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
//           <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
//           <span className="text-xl font-bold tracking-tight">SkillSync</span>
//         </div>
//         <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</div>
//            <SidebarBtn id="dashboard" icon={LayoutDashboard} label="Command Center" />
//            <SidebarBtn id="students" icon={Users} label="Students Database" />
//            <SidebarBtn id="drives" icon={Briefcase} label="Manage Drives" />
//            <SidebarBtn id="reports" icon={FileText} label="Reports & Analytics" />
           
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Recent Activity</div>
//            <div className="px-3 space-y-4">
//               {[{ u: "Rahul V.", a: "applied for Amazon", t: "2m ago" }, { u: "Priya S.", a: "completed Mock Test", t: "15m ago" }].map((item, i) => (
//                 <div key={i} className="flex gap-3 items-start">
//                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
//                    <div><p className="text-xs text-slate-300"><span className="font-bold text-white">{item.u}</span> {item.a}</p><p className="text-[10px] text-slate-600">{item.t}</p></div>
//                 </div>
//               ))}
//            </div>
//         </nav>
//         <div className="p-4 border-t border-slate-800"><Link to="/" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><LogOut size={16}/> Sign Out</Link></div>
//       </aside>

//       <main className="w-full md:ml-64 flex-1 p-4 md:p-8 overflow-y-auto">
//         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//            <div>
//               <h1 className="text-2xl font-bold text-slate-900">{activeTab === 'dashboard' ? 'Command Center' : activeTab === 'students' ? 'Students Database' : activeTab === 'drives' ? 'Recruitment Drives' : 'Analytics'}</h1>
//               <p className="text-slate-500 text-sm">Placement Season 2026 • Term 2</p>
//            </div>
//            <div className="flex items-center gap-4">
//              {activeTab === 'students' && (<div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2 text-sm text-slate-500"><Search size={16}/> <input placeholder="Search students..." className="outline-none text-xs w-40"/></div>)}
//              <button onClick={() => setActiveTab('drives')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all"><Plus size={18}/> Create Drive</button>
//            </div>
//         </header>
//         {renderContent()}
//       </main>
//     </div>
//   );
// };

// // ==========================================
// // 4. STUDENT MODULE (Dashboard, Sandbox, Vault, Upload)
// // ==========================================

// const UserDropdown = ({ name, role, avatar }) => (
//   <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
//     <div className="text-right hidden lg:block"><p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role}</p></div><div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">{avatar}</div><ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600" />
//   </div>
// );

// const StudentDashboard = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const isActive = (path) => location.pathname === path ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50";

//   return (
//     <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
//       <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center gap-3">
//               <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
//               <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}><div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-5 h-5 fill-current"/></div><span className="font-bold text-xl tracking-tight hidden sm:block">SkillSync</span></div>
//             </div>
//             <div className="hidden md:flex items-center gap-1">
//               <Link to="/student" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student')}`}><LayoutDashboard size={16} /> Cockpit</Link>
//               <Link to="/student/drives" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student/drives')}`}><Briefcase size={16} /> Drives</Link>
//               <Link to="/sandbox" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/sandbox')}`}><Code size={16} /> Arena</Link>
//             </div>
//             <div className="flex items-center gap-4">
//               <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span></button>
//               <UserDropdown name="Saksham B." role="Alpha Batch" avatar="SB" />
//             </div>
//           </div>
//         </div>
//         {mobileMenuOpen && (<div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl z-50"><div className="p-4 space-y-2"><Link to="/student" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-indigo-50 text-indigo-600"><LayoutDashboard size={18}/> Cockpit</Link><Link to="/student/drives" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Briefcase size={18}/> Drives</Link><Link to="/sandbox" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Code size={18}/> Arena</Link><div className="h-px bg-slate-100 my-2"></div><button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"><LogOut size={18} /> Sign Out</button></div></div>)}
//       </nav>

//       <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
//         <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl relative overflow-hidden">
//           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
//             <div>
//               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider mb-4"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live System</div>
//               <h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back, Saksham</h1>
//               <p className="text-slate-400 text-lg mb-6">Your placement probability has increased by <span className="text-emerald-400 font-bold">12%</span> this week.</p>
//               <div className="flex gap-4"><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Current Rank</span><span className="text-3xl font-black">1450</span></div><div className="w-px bg-white/10 h-10 self-center"></div><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Hub Score</span><span className="text-3xl font-black text-indigo-400">850</span></div></div>
//             </div>
//             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm lg:max-w-md ml-auto w-full">
//               <div className="flex justify-between items-end mb-4"><div><h3 className="font-bold text-lg">Profile Strength</h3><p className="text-slate-400 text-sm">Resume & Portfolio</p></div><span className="text-2xl font-bold text-indigo-400">70%</span></div>
//               <div className="w-full bg-slate-700 h-3 rounded-full mb-4 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[70%] rounded-full relative"></div></div>
//               <div className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20"><AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" /><div><p className="text-amber-200 text-xs font-bold mb-1">Action Required</p><p className="text-amber-100/70 text-xs">Add a GitHub project link to reach 80% completeness.</p></div></div>
//             </div>
//           </div>
//           <div className="absolute -top-24 -right-24 text-white/5 rotate-12"><TrendingUp size={400} /></div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Target size={20}/></div><div><h3 className="font-bold text-slate-800">Your Status</h3><p className="text-xs text-slate-500 font-bold uppercase">Academic & Skill</p></div></div><div className="space-y-4"><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Batch Category</span><Badge color="indigo">Alpha Batch</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">AMCAT Quant</span><Badge color="emerald">Top 10%</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Logical Ability</span><Badge color="emerald">Top 15%</Badge></div></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50 relative overflow-hidden"><div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">URGENT</div><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Bell size={20}/></div><div><h3 className="font-bold text-slate-800">Pending Actions</h3><p className="text-xs text-slate-500 font-bold uppercase">1 Deadline Today</p></div></div><div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4"><div className="flex justify-between items-start mb-2"><p className="text-sm font-bold text-slate-900">Amazon SDE Drive</p><span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Ends 5 PM</span></div><p className="text-xs text-slate-500 mb-3">You have been shortlisted. Verify resume to confirm seat.</p><button onClick={() => navigate('/student/upload')} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Upload Resume</button></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4"><div className="mb-2"><h3 className="font-bold text-slate-800">Quick Access</h3><p className="text-xs text-slate-500 font-bold uppercase">Tools & Resources</p></div><button onClick={() => navigate('/sandbox')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Code size={18} className="text-indigo-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Open Sandbox</h4><p className="text-[10px] text-slate-400">Practice coding</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button><button onClick={() => navigate('/student/vault')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><BookOpen size={18} className="text-emerald-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Company Vault</h4><p className="text-[10px] text-slate-400">Read experiences</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button></div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Sandbox = () => {
//   const [analyzing, setAnalyzing] = useState(false); const [result, setResult] = useState(null); const runSimulation = () => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setResult(true); }, 2000); };
//   return (<div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden"><div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-r border-slate-200 bg-white h-1/2 md:h-full overflow-y-auto"><div className="mb-6"><Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link><h1 className="text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1><p className="text-slate-500 text-sm">Paste a JD below to simulate how the AI matches you.</p></div><div className="flex-1 flex flex-col gap-4"><select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"><option>Amazon SDE - 2024</option><option>Microsoft IDC</option></select><textarea className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={`Role: SDE-1...`} /><button onClick={runSimulation} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all">{analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} {analyzing ? "AI is Analyzing..." : "Run Simulation"}</button></div></div><div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto h-1/2 md:h-full">{!result && !analyzing && (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><LayoutDashboard size={48} className="mb-4"/><p className="font-bold">Waiting for Input...</p></div>)}{result && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p><div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600"><span className="text-3xl font-black text-slate-900">65%</span></div></div><div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100"><tr className="bg-emerald-50/50"><td className="p-4 font-bold text-slate-700">DSA</td><td className="p-4 font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> Found</td></tr><tr className="bg-rose-50/50"><td className="p-4 font-bold text-slate-700">AWS</td><td className="p-4 font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={14}/> Missing</td></tr></tbody></table></div></div>)}</div></div>);
// };

// const StudentUpload = () => {
//   const [step, setStep] = useState('upload'); const navigate = useNavigate(); const handleUpload = () => { setStep('processing'); setTimeout(() => setStep('done'), 2000); };
//   return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans text-slate-900"><div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden">{step === 'upload' && (<><button onClick={() => navigate('/student')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600"><ArrowRight className="rotate-180"/></button><div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><UploadCloud className="w-8 h-8 text-indigo-600" /></div><h2 className="text-2xl font-bold mb-2">Amazon SDE Drive</h2><p className="text-slate-500 mb-8">Upload your resume to confirm participation.</p><div onClick={handleUpload} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors group"><span className="font-bold text-indigo-600 group-hover:scale-105 transition-transform">Click to Upload PDF</span></div></>)}{step === 'processing' && (<div className="py-10"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" /><h3 className="text-lg font-bold">Verifying Resume...</h3></div>)}{step === 'done' && (<div className="py-6 animate-in zoom-in duration-300"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div><h3 className="text-2xl font-bold">Application Sent!</h3><button onClick={() => navigate('/student')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full mt-6">Back to Cockpit</button></div>)}</div></div>);
// };

// const CompanyVault = () => (<div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center"><h1 className="text-3xl font-black text-slate-900 mb-2">Company Vault</h1><p className="text-slate-500 max-w-md mb-8">Access previous year questions.</p><Link to="/student" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">← Back</Link></div>);

// // // ==========================================
// // // 5. LANDING PAGE (UPGRADED VISUALS)
// // // ==========================================
// // const LandingPage = () => (
// //   // Use h-screen w-screen to lock to viewport and avoid scrollbars
// //   <div className="h-screen w-screen bg-slate-900 font-sans overflow-hidden flex flex-col lg:flex-row">
    
// //     {/* LEFT CONTENT PANEL */}
// //     <div className="w-full lg:w-[45%] h-full flex flex-col justify-center p-12 lg:p-20 relative z-20 bg-slate-900 border-r border-slate-800/50">
       
// //        {/* Background Glow */}
// //        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
// //           <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]"></div>
// //        </div>

// //        <div className="relative z-10">
// //          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold w-fit mb-6 animate-[fade-in-up_1s]">
// //            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span> 
// //            UPES Placement Season 2026
// //          </div>
// //          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
// //            Skill<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Sync.</span>
// //          </h1>
// //          <p className="text-slate-400 text-lg lg:text-xl max-w-lg mb-10 leading-relaxed">
// //            The AI-Native Placement Ecosystem. Bridging the gap between talent and opportunity with 
// //            <span className="text-white font-bold"> intelligent matching.</span>
// //          </p>
         
// //          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
// //             <Link to="/student" className="flex-1 group relative p-px rounded-2xl overflow-hidden shadow-2xl shadow-indigo-900/20 hover:shadow-indigo-500/20 transition-all duration-300">
// //               <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
// //               <div className="relative h-full bg-slate-900 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900/90 transition-colors">
// //                  <div><Users className="text-indigo-400 mb-3" size={24}/><h3 className="text-xl font-bold text-white">Student</h3></div>
// //                  <div className="flex justify-between items-end mt-4"><span className="text-xs text-slate-400 font-medium group-hover:text-indigo-300">Login to Cockpit</span><ArrowRight size={18} className="text-indigo-400 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all"/></div>
// //               </div>
// //             </Link>
// //             <Link to="/faculty" className="flex-1 group relative p-px rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/20 hover:shadow-emerald-500/20 transition-all duration-300">
// //               <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
// //               <div className="relative h-full bg-slate-900 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900/90 transition-colors">
// //                  <div><LayoutDashboard className="text-emerald-400 mb-3" size={24}/><h3 className="text-xl font-bold text-white">Faculty</h3></div>
// //                  <div className="flex justify-between items-end mt-4"><span className="text-xs text-slate-400 font-medium group-hover:text-emerald-300">Admin Dashboard</span><ArrowRight size={18} className="text-emerald-400 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all"/></div>
// //               </div>
// //             </Link>
// //          </div>
// //        </div>
// //     </div>

// //     {/* RIGHT VISUALS - PREMIUM CAMPUS VIEW */}
// //     <div className="hidden lg:block w-[55%] h-full relative overflow-hidden">
       
// //        {/* 1. BRIGHTER CAMPUS IMAGE */}
// //        <img 
// //          src="https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1986&auto=format&fit=crop" 
// //          alt="Campus" 
// //          className="absolute inset-0 w-full h-full object-cover"
// //        />
       
// //        {/* 2. GRADIENT FADE (Left to Right) - Ensures text is readable but image is bright */}
// //        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent"></div>

// //        {/* 3. GLASS CARDS - FROSTED EFFECT */}
// //        <div className="absolute top-24 right-24 bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl animate-[bounce_6s_infinite] hover:scale-105 transition-transform cursor-default">
// //           <div className="flex items-center gap-4">
// //             <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">95%</div>
// //             <div>
// //                 <p className="text-white text-lg font-bold leading-none">Placement Rate</p>
// //                 <p className="text-indigo-100 text-xs mt-1 font-medium">CSE Batch 2025</p>
// //             </div>
// //           </div>
// //        </div>

// //        <div className="absolute bottom-32 left-20 bg-slate-900/60 backdrop-blur-md border border-emerald-500/30 p-5 rounded-2xl shadow-xl animate-[bounce_8s_infinite] delay-1000 max-w-xs hover:scale-105 transition-transform cursor-default">
// //           <div className="flex items-start gap-4">
// //              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30"><CheckCircle size={20}/></div>
// //              <div>
// //                 <p className="text-white font-bold mb-1">Resume Verified</p>
// //                 <p className="text-slate-300 text-xs leading-relaxed">AI has optimized your profile for <span className="text-emerald-400 font-bold">Amazon SDE</span> role.</p>
// //              </div>
// //           </div>
// //        </div>
// //     </div>
// //   </div>
// // );






// // ==========================================
// // 6. LANDING PAGE (Final "Real World" Polish)
// // ==========================================
// const LandingPage = () => (
//   <div className="h-screen w-screen bg-[#0f172a] font-sans overflow-hidden flex flex-col lg:flex-row">
    
//     {/* LEFT SIDE: Content & Branding */}
//     <div className="w-full lg:w-[45%] h-full flex flex-col justify-center p-12 lg:p-20 relative z-20 bg-[#0f172a] border-r border-slate-800">
       
//        {/* Subtle Background Glow */}
//        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

//        <div className="relative z-10">
//          {/* Badge */}
//          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-bold w-fit mb-8 animate-[fade-in-up_1s]">
//            <span className="relative flex h-2 w-2">
//               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
//               <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
//            </span>
//            Placement Season 2026 Live
//          </div>
         
//          {/* Headline */}
//          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
//            Skill<span className="text-indigo-500">Sync.</span>
//          </h1>
         
//          {/* Subheadline */}
//          <p className="text-slate-400 text-lg lg:text-xl max-w-lg mb-10 leading-relaxed font-medium">
//            The AI-Native Placement Ecosystem. We bridge the gap between talent and opportunity with 
//            <span className="text-white font-bold"> intelligent matching.</span>
//          </p>
         
//          {/* Action Buttons */}
//          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
//             {/* Student Card */}
//             <Link to="/student" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-500/50 to-indigo-900/10 hover:to-indigo-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4">
//                     <div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-400"><Users size={24}/></div>
//                     <div>
//                        <h3 className="text-lg font-bold text-white">Student</h3>
//                        <p className="text-xs text-slate-400">Login to Cockpit</p>
//                     </div>
//                  </div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
//                     <div className="w-2/3 h-full bg-indigo-500 group-hover:w-full transition-all duration-500"></div>
//                  </div>
//               </div>
//             </Link>

//             {/* Faculty Card */}
//             <Link to="/faculty" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-500/50 to-emerald-900/10 hover:to-emerald-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4">
//                     <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400"><LayoutDashboard size={24}/></div>
//                     <div>
//                        <h3 className="text-lg font-bold text-white">Faculty</h3>
//                        <p className="text-xs text-slate-400">Admin Dashboard</p>
//                     </div>
//                  </div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
//                     <div className="w-2/3 h-full bg-emerald-500 group-hover:w-full transition-all duration-500"></div>
//                  </div>
//               </div>
//             </Link>
//          </div>

//          {/* Trust Footer */}
//          <div className="mt-12 pt-8 border-t border-slate-800/50 flex items-center gap-6">
//             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Powered By</p>
//             <div className="flex gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
//                 <span className="text-white font-bold text-lg">Google Gemini</span>
//                 <span className="text-white font-bold text-lg">Microsoft</span>
//             </div>
//          </div>
//        </div>
//     </div>

//     {/* RIGHT SIDE: Real World Visuals */}
//     <div className="hidden lg:block w-[55%] h-full relative overflow-hidden bg-slate-950">
       
//        {/* --- OPTION 1: Modern Tech Architecture (Clean, Professional) --- */}
//        <img 
//          src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop" 
//          alt="Modern Campus" 
//          className="absolute inset-0 w-full h-full object-cover opacity-80"
//        />

//        {/* --- OPTION 2: Use your own UPES Image (Uncomment to use) --- */}
//        {/* <img 
//          src="/campus.jpeg" 
//          alt="UPES Campus" 
//          className="absolute inset-0 w-full h-full object-cover opacity-90"
//        /> 
//        */}
       
//        {/* Gradient Overlay for Text Readability */}
//        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-900/20 to-[#0f172a]"></div>
//        <div className="absolute inset-0 bg-blue-900/10 mix-blend-multiply"></div>

//        {/* --- REALISTIC UI CARDS (No floating blurs) --- */}
       
//        {/* Card 1: Success Notification */}
//        <div className="absolute top-1/4 right-20 animate-[fade-in_1s_ease-out_0.5s_both]">
//           <div className="bg-white p-4 pr-8 rounded-xl shadow-2xl shadow-black/50 border-l-4 border-emerald-500 flex items-center gap-4">
//              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
//                 <CheckCircle size={24} fill="currentColor" className="text-emerald-100 stroke-emerald-600"/>
//              </div>
//              <div>
//                 <h4 className="font-bold text-slate-800 text-sm">Resume Verified</h4>
//                 <p className="text-slate-500 text-xs">Ready for Amazon Drive</p>
//              </div>
//           </div>
//        </div>

//        {/* Card 2: Placement Stats */}
//        <div className="absolute bottom-1/4 right-32 animate-[fade-in_1s_ease-out_1s_both]">
//           <div className="bg-slate-800 p-5 rounded-2xl shadow-2xl shadow-black/50 border border-slate-700 w-64">
//              <div className="flex justify-between items-center mb-4">
//                 <span className="text-slate-400 text-xs font-bold uppercase">Placement Rate</span>
//                 <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">2026 Batch</span>
//              </div>
//              <div className="flex items-end gap-2">
//                 <span className="text-4xl font-black text-white">94%</span>
//                 <span className="text-emerald-400 text-sm font-bold mb-1">▲ 12%</span>
//              </div>
//              {/* Tiny Chart Graphic */}
//              <div className="flex items-end gap-1 h-8 mt-4 opacity-50">
//                 <div className="w-1/5 bg-indigo-400 h-4 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-6 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-5 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-8 rounded-t"></div>
//                 <div className="w-1/5 bg-emerald-400 h-full rounded-t"></div>
//              </div>
//           </div>
//        </div>

//     </div>
//   </div>
// );




// // ==========================================
// // 6. APP ROUTER
// // ==========================================
// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<LandingPage />} />
//         <Route path="/student" element={<StudentDashboard />} />
//         <Route path="/student/upload" element={<StudentUpload />} />
//         <Route path="/student/vault" element={<CompanyVault />} />
//         <Route path="/student/drives" element={<div className="p-10 text-center font-bold text-slate-500">Drives Page (Coming Soon)</div>} />
//         <Route path="/faculty" element={<FacultyDashboard />} />
//         <Route path="/sandbox" element={<Sandbox />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;























































































// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
// import { 
//   UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
//   Users, Code, LogOut, Search, Play, TrendingUp, AlertTriangle, 
//   Briefcase, Bell, Menu, X, BookOpen, Star, Target, ChevronDown, 
//   Filter, Calendar, FileText, Plus, Download, Building2
// } from 'lucide-react';

// // ==========================================
// // 1. SHARED COMPONENTS
// // ==========================================

// const Badge = ({ children, color = "indigo" }) => {
//   const colors = {
//     indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
//     emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
//     rose: "bg-rose-50 text-rose-700 border-rose-100",
//     amber: "bg-amber-50 text-amber-700 border-amber-100",
//     slate: "bg-slate-100 text-slate-600 border-slate-200",
//   };
//   return (
//     <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[color] || colors.slate}`}>
//       {children}
//     </span>
//   );
// };

// const StatCard = ({ label, value, sub, color="slate", highlight=false }) => {
//   const colors = {
//     emerald: "text-emerald-600",
//     rose: "text-rose-500",
//     indigo: "text-indigo-600",
//     slate: "text-slate-900"
//   };
//   return (
//     <div className={`bg-white p-6 rounded-2xl border ${highlight ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-200'} shadow-sm transition-all hover:shadow-md`}>
//       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
//       <h3 className={`text-4xl font-black ${colors[color]}`}>{value}</h3>
//       <p className={`text-xs mt-1 font-medium opacity-80 ${colors[color]}`}>{sub}</p>
//     </div>
//   );
// };

// // ==========================================
// // 2. FACULTY SUB-SCREENS
// // ==========================================

// const CommandCenter = ({ setActiveTab }) => (
//   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
//        <StatCard label="Total Students" value="500" sub="Across 4 branches" />
//        <StatCard label="Placed" value="350" sub="70% Success Rate" color="emerald" />
//        <StatCard label="Unplaced" value="150" sub="Actively seeking" color="rose" />
//        <StatCard label="Active Drives" value="12" sub="Open opportunities" color="indigo" highlight />
//     </div>

//     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//       <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
//          <div>
//            <h3 className="font-bold text-slate-800">Live Drive Monitor</h3>
//            <p className="text-xs text-slate-500">Real-time tracking of active recruitment processes</p>
//          </div>
//          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Filter size={18}/></button>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full text-left text-sm">
//           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//             <tr>
//               <th className="px-6 py-3">Company Name</th>
//               <th className="px-6 py-3">Role Profile</th>
//               <th className="px-6 py-3">Timeline</th>
//               <th className="px-6 py-3">Applicants</th>
//               <th className="px-6 py-3">Status</th>
//               <th className="px-6 py-3 text-right">Action</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {[
//               { c: "Amazon", r: "SDE-1", d: "Ends Today, 5 PM", a: 142, s: "Live", cl: "emerald" },
//               { c: "Google", r: "STEP Intern", d: "Starts Tomorrow", a: 89, s: "Upcoming", cl: "indigo" },
//               { c: "Microsoft", r: "Software Eng.", d: "Closed Yesterday", a: 312, s: "Processing", cl: "amber" },
//               { c: "Zomato", r: "Backend Dev", d: "Draft Mode", a: 0, s: "Draft", cl: "slate" },
//             ].map((drive, i) => (
//               <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setActiveTab('drives')}>
//                 <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">{drive.c[0]}</div>
//                   {drive.c}
//                 </td>
//                 <td className="px-6 py-4 text-slate-600">{drive.r}</td>
//                 <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-2"><Calendar size={12}/> {drive.d}</td>
//                 <td className="px-6 py-4 font-mono font-bold text-slate-700">{drive.a}</td>
//                 <td className="px-6 py-4"><Badge color={drive.cl}>{drive.s}</Badge></td>
//                 <td className="px-6 py-4 text-right">
//                   <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Manage <ArrowRight size={12}/></button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   </div>
// );

// const StudentsDatabase = () => (
//   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] animate-in fade-in zoom-in duration-300">
//     <div className="p-6 border-b border-slate-100 flex justify-between items-center">
//        <div>
//          <h2 className="text-lg font-bold text-slate-900">Students Database</h2>
//          <p className="text-sm text-slate-500">View and filter all registered students</p>
//        </div>
//        <div className="flex gap-2">
//          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"><Filter size={16}/> Filter</button>
//          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Download size={16}/> Export CSV</button>
//        </div>
//     </div>
//     <table className="w-full text-left text-sm">
//        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//           <tr>
//              <th className="px-6 py-3">Student Name</th>
//              <th className="px-6 py-3">Branch</th>
//              <th className="px-6 py-3">CGPA</th>
//              <th className="px-6 py-3">Hub Score</th>
//              <th className="px-6 py-3">Status</th>
//              <th className="px-6 py-3 text-right">Actions</th>
//           </tr>
//        </thead>
//        <tbody className="divide-y divide-slate-100">
//           {[
//             { n: "Saksham Bhardwaj", b: "CSE AIML", c: "9.2", h: "1850", s: "Unplaced", sc: "rose" },
//             { n: "Aditya Sharma", b: "CSE Core", c: "8.8", h: "1620", s: "Placed (Amazon)", sc: "emerald" },
//             { n: "Priya Singh", b: "IT", c: "8.5", h: "1450", s: "Unplaced", sc: "rose" },
//             { n: "Rahul Verma", b: "ECE", c: "7.9", h: "1200", s: "Unplaced", sc: "rose" },
//           ].map((s, i) => (
//              <tr key={i} className="hover:bg-slate-50">
//                 <td className="px-6 py-4 font-bold text-slate-900">{s.n}</td>
//                 <td className="px-6 py-4 text-slate-600">{s.b}</td>
//                 <td className="px-6 py-4 font-mono">{s.c}</td>
//                 <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{s.h}</td>
//                 <td className="px-6 py-4"><Badge color={s.sc}>{s.s}</Badge></td>
//                 <td className="px-6 py-4 text-right"><button className="text-indigo-600 hover:underline font-bold text-xs">View Profile</button></td>
//              </tr>
//           ))}
//        </tbody>
//     </table>
//   </div>
// );

// const ManageDrives = () => (
//   <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
//     <div className="flex justify-between items-center">
//        <h2 className="text-xl font-bold text-slate-900">Manage Recruitment Drives</h2>
//        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Create New Drive</button>
//     </div>
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//        {[
//          { c: "Amazon", r: "SDE-1", s: "Live", a: 142 },
//          { c: "Google", r: "STEP Intern", s: "Upcoming", a: 89 },
//          { c: "Microsoft", r: "SWE", s: "Processing", a: 312 },
//          { c: "Zomato", r: "Backend", s: "Draft", a: 0 },
//        ].map((d, i) => (
//          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
//             <div className="flex justify-between items-start mb-4">
//                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">{d.c[0]}</div>
//                <Badge color={d.s === 'Live' ? 'emerald' : d.s === 'Upcoming' ? 'indigo' : 'slate'}>{d.s}</Badge>
//             </div>
//             <h3 className="font-bold text-lg text-slate-900">{d.c}</h3>
//             <p className="text-slate-500 text-sm mb-4">{d.r}</p>
//             <div className="flex justify-between items-center pt-4 border-t border-slate-100">
//                <span className="text-xs font-bold text-slate-500">{d.a} Applicants</span>
//                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors"/>
//             </div>
//          </div>
//        ))}
//     </div>
//   </div>
// );

// const ReportsAnalytics = () => (
//   <div className="flex flex-col items-center justify-center h-[500px] text-center bg-white rounded-2xl border border-slate-200 border-dashed animate-in fade-in zoom-in duration-300">
//      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><FileText size={32} className="text-indigo-600"/></div>
//      <h3 className="text-xl font-bold text-slate-900">Reports & Analytics</h3>
//      <p className="text-slate-500 max-w-sm mb-6">Detailed placement statistics and downloadable reports will appear here.</p>
//      <button className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Download Summary Report</button>
//   </div>
// );

// // ==========================================
// // 3. FACULTY DASHBOARD (Main Wrapper)
// // ==========================================

// const FacultyDashboard = () => {
//   const [activeTab, setActiveTab] = useState('dashboard'); 
  
//   const renderContent = () => {
//     switch(activeTab) {
//       case 'dashboard': return <CommandCenter setActiveTab={setActiveTab} />;
//       case 'students': return <StudentsDatabase />;
//       case 'drives': return <ManageDrives />;
//       case 'reports': return <ReportsAnalytics />;
//       default: return <CommandCenter />;
//     }
//   };

//   const SidebarBtn = ({ id, icon: Icon, label }) => (
//     <button 
//       onClick={() => setActiveTab(id)}
//       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
//     >
//       <Icon size={18}/> {label}
//     </button>
//   );

//   return (
//     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
//       <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col border-r border-slate-800">
//         <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
//           <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
//           <span className="text-xl font-bold tracking-tight">SkillSync</span>
//         </div>
//         <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</div>
//            <SidebarBtn id="dashboard" icon={LayoutDashboard} label="Command Center" />
//            <SidebarBtn id="students" icon={Users} label="Students Database" />
//            <SidebarBtn id="drives" icon={Briefcase} label="Manage Drives" />
//            <SidebarBtn id="reports" icon={FileText} label="Reports & Analytics" />
           
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Recent Activity</div>
//            <div className="px-3 space-y-4">
//               {[{ u: "Rahul V.", a: "applied for Amazon", t: "2m ago" }, { u: "Priya S.", a: "completed Mock Test", t: "15m ago" }].map((item, i) => (
//                 <div key={i} className="flex gap-3 items-start">
//                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
//                    <div><p className="text-xs text-slate-300"><span className="font-bold text-white">{item.u}</span> {item.a}</p><p className="text-[10px] text-slate-600">{item.t}</p></div>
//                 </div>
//               ))}
//            </div>
//         </nav>
//         <div className="p-4 border-t border-slate-800"><Link to="/" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><LogOut size={16}/> Sign Out</Link></div>
//       </aside>

//       <main className="w-full md:ml-64 flex-1 p-4 md:p-8 overflow-y-auto">
//         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//            <div>
//               <h1 className="text-2xl font-bold text-slate-900">{activeTab === 'dashboard' ? 'Command Center' : activeTab === 'students' ? 'Students Database' : activeTab === 'drives' ? 'Recruitment Drives' : 'Analytics'}</h1>
//               <p className="text-slate-500 text-sm">Placement Season 2026 • Term 2</p>
//            </div>
//            <div className="flex items-center gap-4">
//              {activeTab === 'students' && (<div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2 text-sm text-slate-500"><Search size={16}/> <input placeholder="Search students..." className="outline-none text-xs w-40"/></div>)}
//              <button onClick={() => setActiveTab('drives')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all"><Plus size={18}/> Create Drive</button>
//            </div>
//         </header>
//         {renderContent()}
//       </main>
//     </div>
//   );
// };

// // ==========================================
// // 4. STUDENT MODULE (Dashboard, Sandbox, Vault, Upload)
// // ==========================================

// const UserDropdown = ({ name, role, avatar }) => (
//   <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
//     <div className="text-right hidden lg:block"><p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role}</p></div><div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">{avatar}</div><ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600" />
//   </div>
// );

// const StudentDashboard = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const isActive = (path) => location.pathname === path ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50";

//   return (
//     <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
//       <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center gap-3">
//               <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
//               <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}><div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-5 h-5 fill-current"/></div><span className="font-bold text-xl tracking-tight hidden sm:block">SkillSync</span></div>
//             </div>
//             <div className="hidden md:flex items-center gap-1">
//               <Link to="/student" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student')}`}><LayoutDashboard size={16} /> Cockpit</Link>
//               <Link to="/student/drives" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student/drives')}`}><Briefcase size={16} /> Drives</Link>
//               <Link to="/sandbox" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/sandbox')}`}><Code size={16} /> Arena</Link>
//             </div>
//             <div className="flex items-center gap-4">
//               <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span></button>
//               <UserDropdown name="Saksham B." role="Alpha Batch" avatar="SB" />
//             </div>
//           </div>
//         </div>
//         {mobileMenuOpen && (<div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl z-50"><div className="p-4 space-y-2"><Link to="/student" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-indigo-50 text-indigo-600"><LayoutDashboard size={18}/> Cockpit</Link><Link to="/student/drives" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Briefcase size={18}/> Drives</Link><Link to="/sandbox" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Code size={18}/> Arena</Link><div className="h-px bg-slate-100 my-2"></div><button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"><LogOut size={18} /> Sign Out</button></div></div>)}
//       </nav>

//       <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
//         <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl relative overflow-hidden">
//           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
//             <div>
//               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider mb-4"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live System</div>
//               <h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back, Saksham</h1>
//               <p className="text-slate-400 text-lg mb-6">Your placement probability has increased by <span className="text-emerald-400 font-bold">12%</span> this week.</p>
//               <div className="flex gap-4"><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Current Rank</span><span className="text-3xl font-black">1450</span></div><div className="w-px bg-white/10 h-10 self-center"></div><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Hub Score</span><span className="text-3xl font-black text-indigo-400">850</span></div></div>
//             </div>
//             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm lg:max-w-md ml-auto w-full">
//               <div className="flex justify-between items-end mb-4"><div><h3 className="font-bold text-lg">Profile Strength</h3><p className="text-slate-400 text-sm">Resume & Portfolio</p></div><span className="text-2xl font-bold text-indigo-400">70%</span></div>
//               <div className="w-full bg-slate-700 h-3 rounded-full mb-4 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[70%] rounded-full relative"></div></div>
//               <div className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20"><AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" /><div><p className="text-amber-200 text-xs font-bold mb-1">Action Required</p><p className="text-amber-100/70 text-xs">Add a GitHub project link to reach 80% completeness.</p></div></div>
//             </div>
//           </div>
//           <div className="absolute -top-24 -right-24 text-white/5 rotate-12"><TrendingUp size={400} /></div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Target size={20}/></div><div><h3 className="font-bold text-slate-800">Your Status</h3><p className="text-xs text-slate-500 font-bold uppercase">Academic & Skill</p></div></div><div className="space-y-4"><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Batch Category</span><Badge color="indigo">Alpha Batch</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">AMCAT Quant</span><Badge color="emerald">Top 10%</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Logical Ability</span><Badge color="emerald">Top 15%</Badge></div></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50 relative overflow-hidden"><div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">URGENT</div><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Bell size={20}/></div><div><h3 className="font-bold text-slate-800">Pending Actions</h3><p className="text-xs text-slate-500 font-bold uppercase">1 Deadline Today</p></div></div><div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4"><div className="flex justify-between items-start mb-2"><p className="text-sm font-bold text-slate-900">Amazon SDE Drive</p><span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Ends 5 PM</span></div><p className="text-xs text-slate-500 mb-3">You have been shortlisted. Verify resume to confirm seat.</p><button onClick={() => navigate('/student/upload')} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Upload Resume</button></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4"><div className="mb-2"><h3 className="font-bold text-slate-800">Quick Access</h3><p className="text-xs text-slate-500 font-bold uppercase">Tools & Resources</p></div><button onClick={() => navigate('/sandbox')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Code size={18} className="text-indigo-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Open Sandbox</h4><p className="text-[10px] text-slate-400">Practice coding</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button><button onClick={() => navigate('/student/vault')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><BookOpen size={18} className="text-emerald-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Company Vault</h4><p className="text-[10px] text-slate-400">Read experiences</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button></div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Sandbox = () => {
//   const [analyzing, setAnalyzing] = useState(false); const [result, setResult] = useState(null); const runSimulation = () => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setResult(true); }, 2000); };
//   return (<div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden"><div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-r border-slate-200 bg-white h-1/2 md:h-full overflow-y-auto"><div className="mb-6"><Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link><h1 className="text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1><p className="text-slate-500 text-sm">Paste a JD below to simulate how the AI matches you.</p></div><div className="flex-1 flex flex-col gap-4"><select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"><option>Amazon SDE - 2024</option><option>Microsoft IDC</option></select><textarea className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={`Role: SDE-1...`} /><button onClick={runSimulation} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all">{analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} {analyzing ? "AI is Analyzing..." : "Run Simulation"}</button></div></div><div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto h-1/2 md:h-full">{!result && !analyzing && (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><LayoutDashboard size={48} className="mb-4"/><p className="font-bold">Waiting for Input...</p></div>)}{result && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p><div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600"><span className="text-3xl font-black text-slate-900">65%</span></div></div><div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100"><tr className="bg-emerald-50/50"><td className="p-4 font-bold text-slate-700">DSA</td><td className="p-4 font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> Found</td></tr><tr className="bg-rose-50/50"><td className="p-4 font-bold text-slate-700">AWS</td><td className="p-4 font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={14}/> Missing</td></tr></tbody></table></div></div>)}</div></div>);
// };

// const StudentUpload = () => {
//   const [step, setStep] = useState('upload'); const navigate = useNavigate(); const handleUpload = () => { setStep('processing'); setTimeout(() => setStep('done'), 2000); };
//   return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans text-slate-900"><div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden">{step === 'upload' && (<><button onClick={() => navigate('/student')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600"><ArrowRight className="rotate-180"/></button><div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><UploadCloud className="w-8 h-8 text-indigo-600" /></div><h2 className="text-2xl font-bold mb-2">Amazon SDE Drive</h2><p className="text-slate-500 mb-8">Upload your resume to confirm participation.</p><div onClick={handleUpload} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors group"><span className="font-bold text-indigo-600 group-hover:scale-105 transition-transform">Click to Upload PDF</span></div></>)}{step === 'processing' && (<div className="py-10"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" /><h3 className="text-lg font-bold">Verifying Resume...</h3></div>)}{step === 'done' && (<div className="py-6 animate-in zoom-in duration-300"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div><h3 className="text-2xl font-bold">Application Sent!</h3><button onClick={() => navigate('/student')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full mt-6">Back to Cockpit</button></div>)}</div></div>);
// };

// const CompanyVault = () => (<div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center"><h1 className="text-3xl font-black text-slate-900 mb-2">Company Vault</h1><p className="text-slate-500 max-w-md mb-8">Access previous year questions.</p><Link to="/student" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">← Back</Link></div>);

// // ==========================================
// // 5. LANDING PAGE (With Local Image Logic)
// // ==========================================
// const LandingPage = () => (
//   <div className="h-screen w-screen bg-[#0f172a] font-sans overflow-hidden flex flex-col lg:flex-row">
    
//     {/* LEFT SIDE */}
//     <div className="w-full lg:w-[45%] h-full flex flex-col justify-center p-12 lg:p-20 relative z-20 bg-[#0f172a] border-r border-slate-800">
//        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
//        <div className="relative z-10">
//          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-bold w-fit mb-8 animate-[fade-in-up_1s]">
//            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
//            Placement Season 2026 Live
//          </div>
//          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">Skill<span className="text-indigo-500">Sync.</span></h1>
//          <p className="text-slate-400 text-lg lg:text-xl max-w-lg mb-10 leading-relaxed font-medium">The AI-Native Placement Ecosystem. We bridge the gap between talent and opportunity with <span className="text-white font-bold"> intelligent matching.</span></p>
//          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
//             <Link to="/student" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-500/50 to-indigo-900/10 hover:to-indigo-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-400"><Users size={24}/></div><div><h3 className="text-lg font-bold text-white">Student</h3><p className="text-xs text-slate-400">Login to Cockpit</p></div></div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-indigo-500 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//             <Link to="/faculty" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-500/50 to-emerald-900/10 hover:to-emerald-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400"><LayoutDashboard size={24}/></div><div><h3 className="text-lg font-bold text-white">Faculty</h3><p className="text-xs text-slate-400">Admin Dashboard</p></div></div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-emerald-500 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//          </div>
//        </div>
//     </div>

//     {/* RIGHT SIDE - REAL WORLD UPES IMAGE */}
//     <div className="hidden lg:block w-[55%] h-full relative overflow-hidden bg-slate-950">
       
//        {/* THIS TRIES TO LOAD 'upes.jpg' FROM PUBLIC FOLDER. IF FAILS, LOADS FALLBACK */}
//        <img 
//          src="/upes.jpg" 
//          onError={(e) => {e.target.onerror = null; e.target.src="https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1986&auto=format&fit=crop"}}
//          alt="UPES Campus" 
//          className="absolute inset-0 w-full h-full object-cover opacity-80"
//        />
       
//        {/* Gradient Overlay */}
//        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-900/20 to-[#0f172a]"></div>
//        <div className="absolute inset-0 bg-blue-900/10 mix-blend-multiply"></div>

//        {/* Realistic Cards */}
//        <div className="absolute top-1/4 right-20 animate-[fade-in_1s_ease-out_0.5s_both]">
//           <div className="bg-white p-4 pr-8 rounded-xl shadow-2xl shadow-black/50 border-l-4 border-emerald-500 flex items-center gap-4">
//              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><CheckCircle size={24} fill="currentColor" className="text-emerald-100 stroke-emerald-600"/></div>
//              <div><h4 className="font-bold text-slate-800 text-sm">Resume Verified</h4><p className="text-slate-500 text-xs">Ready for Amazon Drive</p></div>
//           </div>
//        </div>

//        <div className="absolute bottom-1/4 right-32 animate-[fade-in_1s_ease-out_1s_both]">
//           <div className="bg-slate-800 p-5 rounded-2xl shadow-2xl shadow-black/50 border border-slate-700 w-64">
//              <div className="flex justify-between items-center mb-4"><span className="text-slate-400 text-xs font-bold uppercase">Placement Rate</span><span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">2026 Batch</span></div>
//              <div className="flex items-end gap-2"><span className="text-4xl font-black text-white">94%</span><span className="text-emerald-400 text-sm font-bold mb-1">▲ 12%</span></div>
//              <div className="flex items-end gap-1 h-8 mt-4 opacity-50">
//                 <div className="w-1/5 bg-indigo-400 h-4 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-6 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-5 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-8 rounded-t"></div>
//                 <div className="w-1/5 bg-emerald-400 h-full rounded-t"></div>
//              </div>
//           </div>
//        </div>
//     </div>
//   </div>
// );

// // ==========================================
// // 6. APP ROUTER
// // ==========================================
// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<LandingPage />} />
//         <Route path="/student" element={<StudentDashboard />} />
//         <Route path="/student/upload" element={<StudentUpload />} />
//         <Route path="/student/vault" element={<CompanyVault />} />
//         <Route path="/student/drives" element={<div className="p-10 text-center font-bold text-slate-500">Drives Page (Coming Soon)</div>} />
//         <Route path="/faculty" element={<FacultyDashboard />} />
//         <Route path="/sandbox" element={<Sandbox />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;






































































// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
// import { 
//   UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
//   Users, Code, LogOut, Search, Play, TrendingUp, AlertTriangle, 
//   Briefcase, Bell, Menu, X, BookOpen, Star, Target, ChevronDown, 
//   Filter, Calendar, FileText, Plus, Download, Building2
// } from 'lucide-react';

// // ==========================================
// // 1. SHARED COMPONENTS
// // ==========================================

// const Badge = ({ children, color = "indigo" }) => {
//   const colors = {
//     indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
//     emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
//     rose: "bg-rose-50 text-rose-700 border-rose-100",
//     amber: "bg-amber-50 text-amber-700 border-amber-100",
//     slate: "bg-slate-100 text-slate-600 border-slate-200",
//   };
//   return (
//     <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[color] || colors.slate}`}>
//       {children}
//     </span>
//   );
// };

// const StatCard = ({ label, value, sub, color="slate", highlight=false }) => {
//   const colors = {
//     emerald: "text-emerald-600",
//     rose: "text-rose-500",
//     indigo: "text-indigo-600",
//     slate: "text-slate-900"
//   };
//   return (
//     <div className={`bg-white p-6 rounded-2xl border ${highlight ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-200'} shadow-sm transition-all hover:shadow-md`}>
//       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
//       <h3 className={`text-4xl font-black ${colors[color]}`}>{value}</h3>
//       <p className={`text-xs mt-1 font-medium opacity-80 ${colors[color]}`}>{sub}</p>
//     </div>
//   );
// };

// // ==========================================
// // 2. FACULTY SUB-SCREENS
// // ==========================================

// const CommandCenter = ({ setActiveTab }) => (
//   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
//        <StatCard label="Total Students" value="500" sub="Across 4 branches" />
//        <StatCard label="Placed" value="350" sub="70% Success Rate" color="emerald" />
//        <StatCard label="Unplaced" value="150" sub="Actively seeking" color="rose" />
//        <StatCard label="Active Drives" value="12" sub="Open opportunities" color="indigo" highlight />
//     </div>

//     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//       <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
//          <div>
//            <h3 className="font-bold text-slate-800">Live Drive Monitor</h3>
//            <p className="text-xs text-slate-500">Real-time tracking of active recruitment processes</p>
//          </div>
//          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Filter size={18}/></button>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full text-left text-sm">
//           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//             <tr>
//               <th className="px-6 py-3">Company Name</th>
//               <th className="px-6 py-3">Role Profile</th>
//               <th className="px-6 py-3">Timeline</th>
//               <th className="px-6 py-3">Applicants</th>
//               <th className="px-6 py-3">Status</th>
//               <th className="px-6 py-3 text-right">Action</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {[
//               { c: "Amazon", r: "SDE-1", d: "Ends Today, 5 PM", a: 142, s: "Live", cl: "emerald" },
//               { c: "Google", r: "STEP Intern", d: "Starts Tomorrow", a: 89, s: "Upcoming", cl: "indigo" },
//               { c: "Microsoft", r: "Software Eng.", d: "Closed Yesterday", a: 312, s: "Processing", cl: "amber" },
//               { c: "Zomato", r: "Backend Dev", d: "Draft Mode", a: 0, s: "Draft", cl: "slate" },
//             ].map((drive, i) => (
//               <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setActiveTab('drives')}>
//                 <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">{drive.c[0]}</div>
//                   {drive.c}
//                 </td>
//                 <td className="px-6 py-4 text-slate-600">{drive.r}</td>
//                 <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-2"><Calendar size={12}/> {drive.d}</td>
//                 <td className="px-6 py-4 font-mono font-bold text-slate-700">{drive.a}</td>
//                 <td className="px-6 py-4"><Badge color={drive.cl}>{drive.s}</Badge></td>
//                 <td className="px-6 py-4 text-right">
//                   <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Manage <ArrowRight size={12}/></button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   </div>
// );

// const StudentsDatabase = () => (
//   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] animate-in fade-in zoom-in duration-300">
//     <div className="p-6 border-b border-slate-100 flex justify-between items-center">
//        <div>
//          <h2 className="text-lg font-bold text-slate-900">Students Database</h2>
//          <p className="text-sm text-slate-500">View and filter all registered students</p>
//        </div>
//        <div className="flex gap-2">
//          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"><Filter size={16}/> Filter</button>
//          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Download size={16}/> Export CSV</button>
//        </div>
//     </div>
//     <table className="w-full text-left text-sm">
//        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//           <tr>
//              <th className="px-6 py-3">Student Name</th>
//              <th className="px-6 py-3">Branch</th>
//              <th className="px-6 py-3">CGPA</th>
//              <th className="px-6 py-3">Hub Score</th>
//              <th className="px-6 py-3">Status</th>
//              <th className="px-6 py-3 text-right">Actions</th>
//           </tr>
//        </thead>
//        <tbody className="divide-y divide-slate-100">
//           {[
//             { n: "Saksham Bhardwaj", b: "CSE AIML", c: "9.2", h: "1850", s: "Unplaced", sc: "rose" },
//             { n: "Aditya Sharma", b: "CSE Core", c: "8.8", h: "1620", s: "Placed (Amazon)", sc: "emerald" },
//             { n: "Priya Singh", b: "IT", c: "8.5", h: "1450", s: "Unplaced", sc: "rose" },
//             { n: "Rahul Verma", b: "ECE", c: "7.9", h: "1200", s: "Unplaced", sc: "rose" },
//           ].map((s, i) => (
//              <tr key={i} className="hover:bg-slate-50">
//                 <td className="px-6 py-4 font-bold text-slate-900">{s.n}</td>
//                 <td className="px-6 py-4 text-slate-600">{s.b}</td>
//                 <td className="px-6 py-4 font-mono">{s.c}</td>
//                 <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{s.h}</td>
//                 <td className="px-6 py-4"><Badge color={s.sc}>{s.s}</Badge></td>
//                 <td className="px-6 py-4 text-right"><button className="text-indigo-600 hover:underline font-bold text-xs">View Profile</button></td>
//              </tr>
//           ))}
//        </tbody>
//     </table>
//   </div>
// );

// const ManageDrives = () => (
//   <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
//     <div className="flex justify-between items-center">
//        <h2 className="text-xl font-bold text-slate-900">Manage Recruitment Drives</h2>
//        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Create New Drive</button>
//     </div>
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//        {[
//          { c: "Amazon", r: "SDE-1", s: "Live", a: 142 },
//          { c: "Google", r: "STEP Intern", s: "Upcoming", a: 89 },
//          { c: "Microsoft", r: "SWE", s: "Processing", a: 312 },
//          { c: "Zomato", r: "Backend", s: "Draft", a: 0 },
//        ].map((d, i) => (
//          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
//             <div className="flex justify-between items-start mb-4">
//                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">{d.c[0]}</div>
//                <Badge color={d.s === 'Live' ? 'emerald' : d.s === 'Upcoming' ? 'indigo' : 'slate'}>{d.s}</Badge>
//             </div>
//             <h3 className="font-bold text-lg text-slate-900">{d.c}</h3>
//             <p className="text-slate-500 text-sm mb-4">{d.r}</p>
//             <div className="flex justify-between items-center pt-4 border-t border-slate-100">
//                <span className="text-xs font-bold text-slate-500">{d.a} Applicants</span>
//                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors"/>
//             </div>
//          </div>
//        ))}
//     </div>
//   </div>
// );

// const ReportsAnalytics = () => (
//   <div className="flex flex-col items-center justify-center h-[500px] text-center bg-white rounded-2xl border border-slate-200 border-dashed animate-in fade-in zoom-in duration-300">
//      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><FileText size={32} className="text-indigo-600"/></div>
//      <h3 className="text-xl font-bold text-slate-900">Reports & Analytics</h3>
//      <p className="text-slate-500 max-w-sm mb-6">Detailed placement statistics and downloadable reports will appear here.</p>
//      <button className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Download Summary Report</button>
//   </div>
// );

// // ==========================================
// // 3. FACULTY DASHBOARD (Main Wrapper)
// // ==========================================

// const FacultyDashboard = () => {
//   const [activeTab, setActiveTab] = useState('dashboard'); 
  
//   const renderContent = () => {
//     switch(activeTab) {
//       case 'dashboard': return <CommandCenter setActiveTab={setActiveTab} />;
//       case 'students': return <StudentsDatabase />;
//       case 'drives': return <ManageDrives />;
//       case 'reports': return <ReportsAnalytics />;
//       default: return <CommandCenter />;
//     }
//   };

//   const SidebarBtn = ({ id, icon: Icon, label }) => (
//     <button 
//       onClick={() => setActiveTab(id)}
//       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
//     >
//       <Icon size={18}/> {label}
//     </button>
//   );

//   return (
//     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
//       <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col border-r border-slate-800">
//         <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
//           <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
//           <span className="text-xl font-bold tracking-tight">SkillSync</span>
//         </div>
//         <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</div>
//            <SidebarBtn id="dashboard" icon={LayoutDashboard} label="Command Center" />
//            <SidebarBtn id="students" icon={Users} label="Students Database" />
//            <SidebarBtn id="drives" icon={Briefcase} label="Manage Drives" />
//            <SidebarBtn id="reports" icon={FileText} label="Reports & Analytics" />
           
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Recent Activity</div>
//            <div className="px-3 space-y-4">
//               {[{ u: "Rahul V.", a: "applied for Amazon", t: "2m ago" }, { u: "Priya S.", a: "completed Mock Test", t: "15m ago" }].map((item, i) => (
//                 <div key={i} className="flex gap-3 items-start">
//                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
//                    <div><p className="text-xs text-slate-300"><span className="font-bold text-white">{item.u}</span> {item.a}</p><p className="text-[10px] text-slate-600">{item.t}</p></div>
//                 </div>
//               ))}
//            </div>
//         </nav>
//         <div className="p-4 border-t border-slate-800"><Link to="/" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><LogOut size={16}/> Sign Out</Link></div>
//       </aside>

//       <main className="w-full md:ml-64 flex-1 p-4 md:p-8 overflow-y-auto">
//         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//            <div>
//               <h1 className="text-2xl font-bold text-slate-900">{activeTab === 'dashboard' ? 'Command Center' : activeTab === 'students' ? 'Students Database' : activeTab === 'drives' ? 'Recruitment Drives' : 'Analytics'}</h1>
//               <p className="text-slate-500 text-sm">Placement Season 2026 • Term 2</p>
//            </div>
//            <div className="flex items-center gap-4">
//              {activeTab === 'students' && (<div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2 text-sm text-slate-500"><Search size={16}/> <input placeholder="Search students..." className="outline-none text-xs w-40"/></div>)}
//              <button onClick={() => setActiveTab('drives')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all"><Plus size={18}/> Create Drive</button>
//            </div>
//         </header>
//         {renderContent()}
//       </main>
//     </div>
//   );
// };

// // ==========================================
// // 4. STUDENT MODULE (Dashboard, Sandbox, Vault, Upload)
// // ==========================================

// const UserDropdown = ({ name, role, avatar }) => (
//   <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
//     <div className="text-right hidden lg:block"><p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role}</p></div><div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">{avatar}</div><ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600" />
//   </div>
// );

// const StudentDashboard = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const isActive = (path) => location.pathname === path ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50";

//   return (
//     <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
//       <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center gap-3">
//               <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
//               <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}><div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-5 h-5 fill-current"/></div><span className="font-bold text-xl tracking-tight hidden sm:block">SkillSync</span></div>
//             </div>
//             <div className="hidden md:flex items-center gap-1">
//               <Link to="/student" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student')}`}><LayoutDashboard size={16} /> Cockpit</Link>
//               <Link to="/student/drives" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student/drives')}`}><Briefcase size={16} /> Drives</Link>
//               <Link to="/sandbox" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/sandbox')}`}><Code size={16} /> Arena</Link>
//             </div>
//             <div className="flex items-center gap-4">
//               <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span></button>
//               <UserDropdown name="Saksham B." role="Alpha Batch" avatar="SB" />
//             </div>
//           </div>
//         </div>
//         {mobileMenuOpen && (<div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl z-50"><div className="p-4 space-y-2"><Link to="/student" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-indigo-50 text-indigo-600"><LayoutDashboard size={18}/> Cockpit</Link><Link to="/student/drives" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Briefcase size={18}/> Drives</Link><Link to="/sandbox" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Code size={18}/> Arena</Link><div className="h-px bg-slate-100 my-2"></div><button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"><LogOut size={18} /> Sign Out</button></div></div>)}
//       </nav>

//       <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
//         <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl relative overflow-hidden">
//           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
//             <div>
//               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider mb-4"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live System</div>
//               <h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back, Saksham</h1>
//               <p className="text-slate-400 text-lg mb-6">Your placement probability has increased by <span className="text-emerald-400 font-bold">12%</span> this week.</p>
//               <div className="flex gap-4"><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Current Rank</span><span className="text-3xl font-black">1450</span></div><div className="w-px bg-white/10 h-10 self-center"></div><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Hub Score</span><span className="text-3xl font-black text-indigo-400">850</span></div></div>
//             </div>
//             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm lg:max-w-md ml-auto w-full">
//               <div className="flex justify-between items-end mb-4"><div><h3 className="font-bold text-lg">Profile Strength</h3><p className="text-slate-400 text-sm">Resume & Portfolio</p></div><span className="text-2xl font-bold text-indigo-400">70%</span></div>
//               <div className="w-full bg-slate-700 h-3 rounded-full mb-4 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[70%] rounded-full relative"></div></div>
//               <div className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20"><AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" /><div><p className="text-amber-200 text-xs font-bold mb-1">Action Required</p><p className="text-amber-100/70 text-xs">Add a GitHub project link to reach 80% completeness.</p></div></div>
//             </div>
//           </div>
//           <div className="absolute -top-24 -right-24 text-white/5 rotate-12"><TrendingUp size={400} /></div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Target size={20}/></div><div><h3 className="font-bold text-slate-800">Your Status</h3><p className="text-xs text-slate-500 font-bold uppercase">Academic & Skill</p></div></div><div className="space-y-4"><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Batch Category</span><Badge color="indigo">Alpha Batch</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">AMCAT Quant</span><Badge color="emerald">Top 10%</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Logical Ability</span><Badge color="emerald">Top 15%</Badge></div></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50 relative overflow-hidden"><div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">URGENT</div><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Bell size={20}/></div><div><h3 className="font-bold text-slate-800">Pending Actions</h3><p className="text-xs text-slate-500 font-bold uppercase">1 Deadline Today</p></div></div><div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4"><div className="flex justify-between items-start mb-2"><p className="text-sm font-bold text-slate-900">Amazon SDE Drive</p><span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Ends 5 PM</span></div><p className="text-xs text-slate-500 mb-3">You have been shortlisted. Verify resume to confirm seat.</p><button onClick={() => navigate('/student/upload')} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Upload Resume</button></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4"><div className="mb-2"><h3 className="font-bold text-slate-800">Quick Access</h3><p className="text-xs text-slate-500 font-bold uppercase">Tools & Resources</p></div><button onClick={() => navigate('/sandbox')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Code size={18} className="text-indigo-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Open Sandbox</h4><p className="text-[10px] text-slate-400">Practice coding</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button><button onClick={() => navigate('/student/vault')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><BookOpen size={18} className="text-emerald-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Company Vault</h4><p className="text-[10px] text-slate-400">Read experiences</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button></div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Sandbox = () => {
//   const [analyzing, setAnalyzing] = useState(false); const [result, setResult] = useState(null); const runSimulation = () => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setResult(true); }, 2000); };
//   return (<div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden"><div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-r border-slate-200 bg-white h-1/2 md:h-full overflow-y-auto"><div className="mb-6"><Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link><h1 className="text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1><p className="text-slate-500 text-sm">Paste a JD below to simulate how the AI matches you.</p></div><div className="flex-1 flex flex-col gap-4"><select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"><option>Amazon SDE - 2024</option><option>Microsoft IDC</option></select><textarea className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={`Role: SDE-1...`} /><button onClick={runSimulation} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all">{analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} {analyzing ? "AI is Analyzing..." : "Run Simulation"}</button></div></div><div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto h-1/2 md:h-full">{!result && !analyzing && (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><LayoutDashboard size={48} className="mb-4"/><p className="font-bold">Waiting for Input...</p></div>)}{result && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p><div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600"><span className="text-3xl font-black text-slate-900">65%</span></div></div><div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100"><tr className="bg-emerald-50/50"><td className="p-4 font-bold text-slate-700">DSA</td><td className="p-4 font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> Found</td></tr><tr className="bg-rose-50/50"><td className="p-4 font-bold text-slate-700">AWS</td><td className="p-4 font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={14}/> Missing</td></tr></tbody></table></div></div>)}</div></div>);
// };

// const StudentUpload = () => {
//   const [step, setStep] = useState('upload'); const navigate = useNavigate(); const handleUpload = () => { setStep('processing'); setTimeout(() => setStep('done'), 2000); };
//   return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans text-slate-900"><div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden">{step === 'upload' && (<><button onClick={() => navigate('/student')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600"><ArrowRight className="rotate-180"/></button><div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><UploadCloud className="w-8 h-8 text-indigo-600" /></div><h2 className="text-2xl font-bold mb-2">Amazon SDE Drive</h2><p className="text-slate-500 mb-8">Upload your resume to confirm participation.</p><div onClick={handleUpload} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors group"><span className="font-bold text-indigo-600 group-hover:scale-105 transition-transform">Click to Upload PDF</span></div></>)}{step === 'processing' && (<div className="py-10"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" /><h3 className="text-lg font-bold">Verifying Resume...</h3></div>)}{step === 'done' && (<div className="py-6 animate-in zoom-in duration-300"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div><h3 className="text-2xl font-bold">Application Sent!</h3><button onClick={() => navigate('/student')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full mt-6">Back to Cockpit</button></div>)}</div></div>);
// };

// const CompanyVault = () => (<div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center"><h1 className="text-3xl font-black text-slate-900 mb-2">Company Vault</h1><p className="text-slate-500 max-w-md mb-8">Access previous year questions.</p><Link to="/student" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">← Back</Link></div>);

// // ==========================================
// // 5. LANDING PAGE (With Local Image Logic)
// // ==========================================
// const LandingPage = () => (
//   <div className="h-screen w-screen bg-[#0f172a] font-sans overflow-hidden flex flex-col lg:flex-row">
    
//     {/* LEFT SIDE */}
//     <div className="w-full lg:w-[45%] h-full flex flex-col justify-center p-12 lg:p-20 relative z-20 bg-[#0f172a] border-r border-slate-800">
//        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
//        <div className="relative z-10">
//          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-bold w-fit mb-8 animate-[fade-in-up_1s]">
//            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
//            Placement Season 2026 Live
//          </div>
//          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">Skill<span className="text-indigo-500">Sync.</span></h1>
//          <p className="text-slate-400 text-lg lg:text-xl max-w-lg mb-10 leading-relaxed font-medium">The AI-Native Placement Ecosystem. We bridge the gap between talent and opportunity with <span className="text-white font-bold"> intelligent matching.</span></p>
//          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
//             <Link to="/student" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-500/50 to-indigo-900/10 hover:to-indigo-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-400"><Users size={24}/></div><div><h3 className="text-lg font-bold text-white">Student</h3><p className="text-xs text-slate-400">Login to Cockpit</p></div></div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-indigo-500 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//             <Link to="/faculty" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-500/50 to-emerald-900/10 hover:to-emerald-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400"><LayoutDashboard size={24}/></div><div><h3 className="text-lg font-bold text-white">Faculty</h3><p className="text-xs text-slate-400">Admin Dashboard</p></div></div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-emerald-500 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//          </div>
//        </div>
//     </div>

//     {/* RIGHT SIDE - REAL WORLD UPES IMAGE */}
//     <div className="hidden lg:block w-[55%] h-full relative overflow-hidden bg-slate-950">
       
//        {/* THIS TRIES TO LOAD 'upes.jpg' FROM PUBLIC FOLDER. IF FAILS, LOADS FALLBACK */}
//        <img 
//          src="/upes.jpg" 
//          onError={(e) => {e.target.onerror = null; e.target.src="https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1986&auto=format&fit=crop"}}
//          alt="UPES Campus" 
//          className="absolute inset-0 w-full h-full object-cover opacity-80"
//        />
       
//        {/* Gradient Overlay */}
//        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-900/20 to-[#0f172a]"></div>
//        <div className="absolute inset-0 bg-blue-900/10 mix-blend-multiply"></div>

//        {/* Realistic Cards */}
//        <div className="absolute top-1/4 right-20 animate-[fade-in_1s_ease-out_0.5s_both]">
//           <div className="bg-white p-4 pr-8 rounded-xl shadow-2xl shadow-black/50 border-l-4 border-emerald-500 flex items-center gap-4">
//              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><CheckCircle size={24} fill="currentColor" className="text-emerald-100 stroke-emerald-600"/></div>
//              <div><h4 className="font-bold text-slate-800 text-sm">Resume Verified</h4><p className="text-slate-500 text-xs">Ready for Amazon Drive</p></div>
//           </div>
//        </div>

//        <div className="absolute bottom-1/4 right-32 animate-[fade-in_1s_ease-out_1s_both]">
//           <div className="bg-slate-800 p-5 rounded-2xl shadow-2xl shadow-black/50 border border-slate-700 w-64">
//              <div className="flex justify-between items-center mb-4"><span className="text-slate-400 text-xs font-bold uppercase">Placement Rate</span><span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">2026 Batch</span></div>
//              <div className="flex items-end gap-2"><span className="text-4xl font-black text-white">94%</span><span className="text-emerald-400 text-sm font-bold mb-1">▲ 12%</span></div>
//              <div className="flex items-end gap-1 h-8 mt-4 opacity-50">
//                 <div className="w-1/5 bg-indigo-400 h-4 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-6 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-5 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-8 rounded-t"></div>
//                 <div className="w-1/5 bg-emerald-400 h-full rounded-t"></div>
//              </div>
//           </div>
//        </div>
//     </div>
//   </div>
// );

// // ==========================================
// // 6. APP ROUTER
// // ==========================================
// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<LandingPage />} />
//         <Route path="/student" element={<StudentDashboard />} />
//         <Route path="/student/upload" element={<StudentUpload />} />
//         <Route path="/student/vault" element={<CompanyVault />} />
//         <Route path="/student/drives" element={<div className="p-10 text-center font-bold text-slate-500">Drives Page (Coming Soon)</div>} />
//         <Route path="/faculty" element={<FacultyDashboard />} />
//         <Route path="/sandbox" element={<Sandbox />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;





























































// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
// import { 
//   UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
//   Users, Code, LogOut, Search, Play, TrendingUp, AlertTriangle, 
//   Briefcase, Bell, Menu, X, BookOpen, Star, Target, ChevronDown, 
//   Filter, Calendar, FileText, Plus, Download, Building2
// } from 'lucide-react';

// // ==========================================
// // 1. SHARED COMPONENTS
// // ==========================================

// const Badge = ({ children, color = "indigo" }) => {
//   const colors = {
//     indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
//     emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
//     rose: "bg-rose-50 text-rose-700 border-rose-100",
//     amber: "bg-amber-50 text-amber-700 border-amber-100",
//     slate: "bg-slate-100 text-slate-600 border-slate-200",
//   };
//   return (
//     <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[color] || colors.slate}`}>
//       {children}
//     </span>
//   );
// };

// const StatCard = ({ label, value, sub, color="slate", highlight=false }) => {
//   const colors = {
//     emerald: "text-emerald-600",
//     rose: "text-rose-500",
//     indigo: "text-indigo-600",
//     slate: "text-slate-900"
//   };
//   return (
//     <div className={`bg-white p-6 rounded-2xl border ${highlight ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-200'} shadow-sm transition-all hover:shadow-md`}>
//       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
//       <h3 className={`text-4xl font-black ${colors[color]}`}>{value}</h3>
//       <p className={`text-xs mt-1 font-medium opacity-80 ${colors[color]}`}>{sub}</p>
//     </div>
//   );
// };

// // ==========================================
// // 2. FACULTY SUB-SCREENS
// // ==========================================

// const CommandCenter = ({ setActiveTab }) => (
//   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
//        <StatCard label="Total Students" value="500" sub="Across 4 branches" />
//        <StatCard label="Placed" value="350" sub="70% Success Rate" color="emerald" />
//        <StatCard label="Unplaced" value="150" sub="Actively seeking" color="rose" />
//        <StatCard label="Active Drives" value="12" sub="Open opportunities" color="indigo" highlight />
//     </div>

//     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//       <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
//          <div>
//            <h3 className="font-bold text-slate-800">Live Drive Monitor</h3>
//            <p className="text-xs text-slate-500">Real-time tracking of active recruitment processes</p>
//          </div>
//          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Filter size={18}/></button>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full text-left text-sm">
//           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//             <tr>
//               <th className="px-6 py-3">Company Name</th>
//               <th className="px-6 py-3">Role Profile</th>
//               <th className="px-6 py-3">Timeline</th>
//               <th className="px-6 py-3">Applicants</th>
//               <th className="px-6 py-3">Status</th>
//               <th className="px-6 py-3 text-right">Action</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {[
//               { c: "Amazon", r: "SDE-1", d: "Ends Today, 5 PM", a: 142, s: "Live", cl: "emerald" },
//               { c: "Google", r: "STEP Intern", d: "Starts Tomorrow", a: 89, s: "Upcoming", cl: "indigo" },
//               { c: "Microsoft", r: "Software Eng.", d: "Closed Yesterday", a: 312, s: "Processing", cl: "amber" },
//               { c: "Zomato", r: "Backend Dev", d: "Draft Mode", a: 0, s: "Draft", cl: "slate" },
//             ].map((drive, i) => (
//               <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setActiveTab('drives')}>
//                 <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">{drive.c[0]}</div>
//                   {drive.c}
//                 </td>
//                 <td className="px-6 py-4 text-slate-600">{drive.r}</td>
//                 <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-2"><Calendar size={12}/> {drive.d}</td>
//                 <td className="px-6 py-4 font-mono font-bold text-slate-700">{drive.a}</td>
//                 <td className="px-6 py-4"><Badge color={drive.cl}>{drive.s}</Badge></td>
//                 <td className="px-6 py-4 text-right">
//                   <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Manage <ArrowRight size={12}/></button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   </div>
// );

// const StudentsDatabase = () => (
//   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] animate-in fade-in zoom-in duration-300">
//     <div className="p-6 border-b border-slate-100 flex justify-between items-center">
//        <div>
//          <h2 className="text-lg font-bold text-slate-900">Students Database</h2>
//          <p className="text-sm text-slate-500">View and filter all registered students</p>
//        </div>
//        <div className="flex gap-2">
//          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"><Filter size={16}/> Filter</button>
//          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Download size={16}/> Export CSV</button>
//        </div>
//     </div>
//     <table className="w-full text-left text-sm">
//        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//           <tr>
//              <th className="px-6 py-3">Student Name</th>
//              <th className="px-6 py-3">Branch</th>
//              <th className="px-6 py-3">CGPA</th>
//              <th className="px-6 py-3">Hub Score</th>
//              <th className="px-6 py-3">Status</th>
//              <th className="px-6 py-3 text-right">Actions</th>
//           </tr>
//        </thead>
//        <tbody className="divide-y divide-slate-100">
//           {[
//             { n: "Saksham Bhardwaj", b: "CSE AIML", c: "9.2", h: "1850", s: "Unplaced", sc: "rose" },
//             { n: "Aditya Sharma", b: "CSE Core", c: "8.8", h: "1620", s: "Placed (Amazon)", sc: "emerald" },
//             { n: "Priya Singh", b: "IT", c: "8.5", h: "1450", s: "Unplaced", sc: "rose" },
//             { n: "Rahul Verma", b: "ECE", c: "7.9", h: "1200", s: "Unplaced", sc: "rose" },
//           ].map((s, i) => (
//              <tr key={i} className="hover:bg-slate-50">
//                 <td className="px-6 py-4 font-bold text-slate-900">{s.n}</td>
//                 <td className="px-6 py-4 text-slate-600">{s.b}</td>
//                 <td className="px-6 py-4 font-mono">{s.c}</td>
//                 <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{s.h}</td>
//                 <td className="px-6 py-4"><Badge color={s.sc}>{s.s}</Badge></td>
//                 <td className="px-6 py-4 text-right"><button className="text-indigo-600 hover:underline font-bold text-xs">View Profile</button></td>
//              </tr>
//           ))}
//        </tbody>
//     </table>
//   </div>
// );

// const ManageDrives = () => (
//   <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
//     <div className="flex justify-between items-center">
//        <h2 className="text-xl font-bold text-slate-900">Manage Recruitment Drives</h2>
//        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Create New Drive</button>
//     </div>
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//        {[
//          { c: "Amazon", r: "SDE-1", s: "Live", a: 142 },
//          { c: "Google", r: "STEP Intern", s: "Upcoming", a: 89 },
//          { c: "Microsoft", r: "SWE", s: "Processing", a: 312 },
//          { c: "Zomato", r: "Backend", s: "Draft", a: 0 },
//        ].map((d, i) => (
//          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
//             <div className="flex justify-between items-start mb-4">
//                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">{d.c[0]}</div>
//                <Badge color={d.s === 'Live' ? 'emerald' : d.s === 'Upcoming' ? 'indigo' : 'slate'}>{d.s}</Badge>
//             </div>
//             <h3 className="font-bold text-lg text-slate-900">{d.c}</h3>
//             <p className="text-slate-500 text-sm mb-4">{d.r}</p>
//             <div className="flex justify-between items-center pt-4 border-t border-slate-100">
//                <span className="text-xs font-bold text-slate-500">{d.a} Applicants</span>
//                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors"/>
//             </div>
//          </div>
//        ))}
//     </div>
//   </div>
// );

// const ReportsAnalytics = () => (
//   <div className="flex flex-col items-center justify-center h-[500px] text-center bg-white rounded-2xl border border-slate-200 border-dashed animate-in fade-in zoom-in duration-300">
//      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><FileText size={32} className="text-indigo-600"/></div>
//      <h3 className="text-xl font-bold text-slate-900">Reports & Analytics</h3>
//      <p className="text-slate-500 max-w-sm mb-6">Detailed placement statistics and downloadable reports will appear here.</p>
//      <button className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Download Summary Report</button>
//   </div>
// );

// // ==========================================
// // 3. FACULTY DASHBOARD
// // ==========================================

// const FacultyDashboard = () => {
//   const [activeTab, setActiveTab] = useState('dashboard'); 
  
//   const renderContent = () => {
//     switch(activeTab) {
//       case 'dashboard': return <CommandCenter setActiveTab={setActiveTab} />;
//       case 'students': return <StudentsDatabase />;
//       case 'drives': return <ManageDrives />;
//       case 'reports': return <ReportsAnalytics />;
//       default: return <CommandCenter />;
//     }
//   };

//   const SidebarBtn = ({ id, icon: Icon, label }) => (
//     <button 
//       onClick={() => setActiveTab(id)}
//       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
//     >
//       <Icon size={18}/> {label}
//     </button>
//   );

//   return (
//     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
//       <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col border-r border-slate-800">
//         <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
//           <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
//           <span className="text-xl font-bold tracking-tight">SkillSync</span>
//         </div>
//         <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</div>
//            <SidebarBtn id="dashboard" icon={LayoutDashboard} label="Command Center" />
//            <SidebarBtn id="students" icon={Users} label="Students Database" />
//            <SidebarBtn id="drives" icon={Briefcase} label="Manage Drives" />
//            <SidebarBtn id="reports" icon={FileText} label="Reports & Analytics" />
           
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Recent Activity</div>
//            <div className="px-3 space-y-4">
//               {[{ u: "Rahul V.", a: "applied for Amazon", t: "2m ago" }, { u: "Priya S.", a: "completed Mock Test", t: "15m ago" }].map((item, i) => (
//                 <div key={i} className="flex gap-3 items-start">
//                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
//                    <div><p className="text-xs text-slate-300"><span className="font-bold text-white">{item.u}</span> {item.a}</p><p className="text-[10px] text-slate-600">{item.t}</p></div>
//                 </div>
//               ))}
//            </div>
//         </nav>
//         <div className="p-4 border-t border-slate-800"><Link to="/" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><LogOut size={16}/> Sign Out</Link></div>
//       </aside>

//       <main className="w-full md:ml-64 flex-1 p-4 md:p-8 overflow-y-auto">
//         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//            <div>
//               <h1 className="text-2xl font-bold text-slate-900">{activeTab === 'dashboard' ? 'Command Center' : activeTab === 'students' ? 'Students Database' : activeTab === 'drives' ? 'Recruitment Drives' : 'Analytics'}</h1>
//               <p className="text-slate-500 text-sm">Placement Season 2026 • Term 2</p>
//            </div>
//            <div className="flex items-center gap-4">
//              {activeTab === 'students' && (<div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2 text-sm text-slate-500"><Search size={16}/> <input placeholder="Search students..." className="outline-none text-xs w-40"/></div>)}
//              <button onClick={() => setActiveTab('drives')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all"><Plus size={18}/> Create Drive</button>
//            </div>
//         </header>
//         {renderContent()}
//       </main>
//     </div>
//   );
// };

// // ==========================================
// // 4. STUDENT MODULE
// // ==========================================

// const UserDropdown = ({ name, role, avatar }) => (
//   <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
//     <div className="text-right hidden lg:block"><p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role}</p></div><div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">{avatar}</div><ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600" />
//   </div>
// );

// const StudentDashboard = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const isActive = (path) => location.pathname === path ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50";

//   return (
//     <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
//       <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center gap-3">
//               <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
//               <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}><div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-5 h-5 fill-current"/></div><span className="font-bold text-xl tracking-tight hidden sm:block">SkillSync</span></div>
//             </div>
//             <div className="hidden md:flex items-center gap-1">
//               <Link to="/student" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student')}`}><LayoutDashboard size={16} /> Cockpit</Link>
//               <Link to="/student/drives" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student/drives')}`}><Briefcase size={16} /> Drives</Link>
//               <Link to="/sandbox" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/sandbox')}`}><Code size={16} /> Arena</Link>
//             </div>
//             <div className="flex items-center gap-4">
//               <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span></button>
//               <UserDropdown name="Saksham B." role="Alpha Batch" avatar="SB" />
//             </div>
//           </div>
//         </div>
//         {mobileMenuOpen && (<div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl z-50"><div className="p-4 space-y-2"><Link to="/student" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-indigo-50 text-indigo-600"><LayoutDashboard size={18}/> Cockpit</Link><Link to="/student/drives" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Briefcase size={18}/> Drives</Link><Link to="/sandbox" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Code size={18}/> Arena</Link><div className="h-px bg-slate-100 my-2"></div><button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"><LogOut size={18} /> Sign Out</button></div></div>)}
//       </nav>

//       <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
//         <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl relative overflow-hidden">
//           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
//             <div>
//               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider mb-4"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live System</div>
//               <h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back, Saksham</h1>
//               <p className="text-slate-400 text-lg mb-6">Your placement probability has increased by <span className="text-emerald-400 font-bold">12%</span> this week.</p>
//               <div className="flex gap-4"><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Current Rank</span><span className="text-3xl font-black">1450</span></div><div className="w-px bg-white/10 h-10 self-center"></div><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Hub Score</span><span className="text-3xl font-black text-indigo-400">850</span></div></div>
//             </div>
//             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm lg:max-w-md ml-auto w-full">
//               <div className="flex justify-between items-end mb-4"><div><h3 className="font-bold text-lg">Profile Strength</h3><p className="text-slate-400 text-sm">Resume & Portfolio</p></div><span className="text-2xl font-bold text-indigo-400">70%</span></div>
//               <div className="w-full bg-slate-700 h-3 rounded-full mb-4 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[70%] rounded-full relative"></div></div>
//               <div className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20"><AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" /><div><p className="text-amber-200 text-xs font-bold mb-1">Action Required</p><p className="text-amber-100/70 text-xs">Add a GitHub project link to reach 80% completeness.</p></div></div>
//             </div>
//           </div>
//           <div className="absolute -top-24 -right-24 text-white/5 rotate-12"><TrendingUp size={400} /></div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Target size={20}/></div><div><h3 className="font-bold text-slate-800">Your Status</h3><p className="text-xs text-slate-500 font-bold uppercase">Academic & Skill</p></div></div><div className="space-y-4"><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Batch Category</span><Badge color="indigo">Alpha Batch</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">AMCAT Quant</span><Badge color="emerald">Top 10%</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Logical Ability</span><Badge color="emerald">Top 15%</Badge></div></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50 relative overflow-hidden"><div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">URGENT</div><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Bell size={20}/></div><div><h3 className="font-bold text-slate-800">Pending Actions</h3><p className="text-xs text-slate-500 font-bold uppercase">1 Deadline Today</p></div></div><div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4"><div className="flex justify-between items-start mb-2"><p className="text-sm font-bold text-slate-900">Amazon SDE Drive</p><span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Ends 5 PM</span></div><p className="text-xs text-slate-500 mb-3">You have been shortlisted. Verify resume to confirm seat.</p><button onClick={() => navigate('/student/upload')} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Upload Resume</button></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4"><div className="mb-2"><h3 className="font-bold text-slate-800">Quick Access</h3><p className="text-xs text-slate-500 font-bold uppercase">Tools & Resources</p></div><button onClick={() => navigate('/sandbox')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Code size={18} className="text-indigo-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Open Sandbox</h4><p className="text-[10px] text-slate-400">Practice coding</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button><button onClick={() => navigate('/student/vault')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><BookOpen size={18} className="text-emerald-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Company Vault</h4><p className="text-[10px] text-slate-400">Read experiences</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button></div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Sandbox = () => {
//   const [analyzing, setAnalyzing] = useState(false); const [result, setResult] = useState(null); const runSimulation = () => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setResult(true); }, 2000); };
//   return (<div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden"><div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-r border-slate-200 bg-white h-1/2 md:h-full overflow-y-auto"><div className="mb-6"><Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link><h1 className="text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1><p className="text-slate-500 text-sm">Paste a JD below to simulate how the AI matches you.</p></div><div className="flex-1 flex flex-col gap-4"><select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"><option>Amazon SDE - 2024</option><option>Microsoft IDC</option></select><textarea className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={`Role: SDE-1...`} /><button onClick={runSimulation} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all">{analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} {analyzing ? "AI is Analyzing..." : "Run Simulation"}</button></div></div><div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto h-1/2 md:h-full">{!result && !analyzing && (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><LayoutDashboard size={48} className="mb-4"/><p className="font-bold">Waiting for Input...</p></div>)}{result && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p><div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600"><span className="text-3xl font-black text-slate-900">65%</span></div></div><div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100"><tr className="bg-emerald-50/50"><td className="p-4 font-bold text-slate-700">DSA</td><td className="p-4 font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> Found</td></tr><tr className="bg-rose-50/50"><td className="p-4 font-bold text-slate-700">AWS</td><td className="p-4 font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={14}/> Missing</td></tr></tbody></table></div></div>)}</div></div>);
// };

// const StudentUpload = () => {
//   const [step, setStep] = useState('upload'); const navigate = useNavigate(); const handleUpload = () => { setStep('processing'); setTimeout(() => setStep('done'), 2000); };
//   return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans text-slate-900"><div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden">{step === 'upload' && (<><button onClick={() => navigate('/student')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600"><ArrowRight className="rotate-180"/></button><div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><UploadCloud className="w-8 h-8 text-indigo-600" /></div><h2 className="text-2xl font-bold mb-2">Amazon SDE Drive</h2><p className="text-slate-500 mb-8">Upload your resume to confirm participation.</p><div onClick={handleUpload} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors group"><span className="font-bold text-indigo-600 group-hover:scale-105 transition-transform">Click to Upload PDF</span></div></>)}{step === 'processing' && (<div className="py-10"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" /><h3 className="text-lg font-bold">Verifying Resume...</h3></div>)}{step === 'done' && (<div className="py-6 animate-in zoom-in duration-300"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div><h3 className="text-2xl font-bold">Application Sent!</h3><button onClick={() => navigate('/student')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full mt-6">Back to Cockpit</button></div>)}</div></div>);
// };

// const CompanyVault = () => (<div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center"><h1 className="text-3xl font-black text-slate-900 mb-2">Company Vault</h1><p className="text-slate-500 max-w-md mb-8">Access previous year questions.</p><Link to="/student" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">← Back</Link></div>);

// // ==========================================
// // 5. LANDING PAGE (Final Polish)
// // ==========================================
// const LandingPage = () => (
//   <div className="h-screen w-screen bg-[#0f172a] font-sans overflow-hidden flex flex-col lg:flex-row">
    
//     {/* LEFT SIDE: Content & Branding */}
//     <div className="w-full lg:w-[45%] h-full flex flex-col justify-center p-12 lg:p-20 relative z-20 bg-[#0f172a] border-r border-slate-800">
       
//        {/* Background Glow */}
//        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

//        <div className="relative z-10">
//          {/* Badge */}
//          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-bold w-fit mb-8 animate-[fade-in-up_1s]">
//            <span className="relative flex h-2 w-2">
//               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
//               <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
//            </span>
//            Placement Season 2026 Live
//          </div>
         
//          {/* Headline */}
//          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
//            Skill<span className="text-indigo-500">Sync.</span>
//          </h1>
         
//          {/* Subheadline */}
//          <p className="text-slate-400 text-lg lg:text-xl max-w-lg mb-10 leading-relaxed font-medium">
//            The AI-Native Placement Ecosystem. We bridge the gap between talent and opportunity with 
//            <span className="text-white font-bold"> intelligent matching.</span>
//          </p>
         
//          {/* Action Buttons */}
//          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
//             {/* Student Card */}
//             <Link to="/student" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-500/50 to-indigo-900/10 hover:to-indigo-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4">
//                     <div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-400"><Users size={24}/></div>
//                     <div>
//                        <h3 className="text-lg font-bold text-white">Student</h3>
//                        <p className="text-xs text-slate-400">Login to Cockpit</p>
//                     </div>
//                  </div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
//                     <div className="w-2/3 h-full bg-indigo-500 group-hover:w-full transition-all duration-500"></div>
//                  </div>
//               </div>
//             </Link>

//             {/* Faculty Card */}
//             <Link to="/faculty" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-500/50 to-emerald-900/10 hover:to-emerald-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4">
//                     <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400"><LayoutDashboard size={24}/></div>
//                     <div>
//                        <h3 className="text-lg font-bold text-white">Faculty</h3>
//                        <p className="text-xs text-slate-400">Admin Dashboard</p>
//                     </div>
//                  </div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
//                     <div className="w-2/3 h-full bg-emerald-500 group-hover:w-full transition-all duration-500"></div>
//                  </div>
//               </div>
//             </Link>
//          </div>

//          {/* Trust Footer */}
//          <div className="mt-12 pt-8 border-t border-slate-800/50 flex items-center gap-6">
//             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Powered By</p>
//             <div className="flex gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
//                 <span className="text-white font-bold text-lg">Google Gemini</span>
//                 <span className="text-white font-bold text-lg">Microsoft</span>
//             </div>
//          </div>
//        </div>
//     </div>

//     {/* RIGHT SIDE: Real World Visuals */}
//     <div className="hidden lg:block w-[55%] h-full relative overflow-hidden bg-slate-950">
       
//        {/* 1. UPES IMAGE - DIRECT WIKIMEDIA LINK
//           This URL is a direct, public link to the high-res UPES campus photo.
//           It will work instantly without any local file setup.
//        */}
//        <img 
//          src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/UPES_Campus.jpg/1280px-UPES_Campus.jpg" 
//          alt="UPES Campus" 
//          className="absolute inset-0 w-full h-full object-contain bg-black"
//        />
       
//        {/* Gradient Overlay for Text Readability - Adjusted for contain mode */}
//        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-900/10 to-[#0f172a]"></div>

//        {/* --- REALISTIC UI CARDS (No floating blurs, just clean solid UI) --- */}
       
//        {/* Card 1: Success Notification */}
//        <div className="absolute top-1/4 right-20 animate-[fade-in_1s_ease-out_0.5s_both]">
//           <div className="bg-white p-4 pr-8 rounded-xl shadow-2xl shadow-black/50 border-l-4 border-emerald-500 flex items-center gap-4">
//              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
//                 <CheckCircle size={24} fill="currentColor" className="text-emerald-100 stroke-emerald-600"/>
//              </div>
//              <div>
//                 <h4 className="font-bold text-slate-800 text-sm">Resume Verified</h4>
//                 <p className="text-slate-500 text-xs">Ready for Amazon Drive</p>
//              </div>
//           </div>
//        </div>

//        {/* Card 2: Placement Stats */}
//        <div className="absolute bottom-1/4 right-32 animate-[fade-in_1s_ease-out_1s_both]">
//           <div className="bg-[#1e293b] p-5 rounded-2xl shadow-2xl shadow-black/50 border border-slate-700 w-64">
//              <div className="flex justify-between items-center mb-4">
//                 <span className="text-slate-400 text-xs font-bold uppercase">Placement Rate</span>
//                 <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">2026 Batch</span>
//              </div>
//              <div className="flex items-end gap-2">
//                 <span className="text-4xl font-black text-white">94%</span>
//                 <span className="text-emerald-400 text-sm font-bold mb-1">▲ 12%</span>
//              </div>
//              {/* Tiny Chart Graphic */}
//              <div className="flex items-end gap-1 h-8 mt-4 opacity-50">
//                 <div className="w-1/5 bg-indigo-400 h-4 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-6 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-5 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-8 rounded-t"></div>
//                 <div className="w-1/5 bg-emerald-400 h-full rounded-t"></div>
//              </div>
//           </div>
//        </div>

//     </div>
//   </div>
// );

// // ==========================================
// // 6. APP ROUTER
// // ==========================================
// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<LandingPage />} />
//         <Route path="/student" element={<StudentDashboard />} />
//         <Route path="/student/upload" element={<StudentUpload />} />
//         <Route path="/student/vault" element={<CompanyVault />} />
//         <Route path="/student/drives" element={<div className="p-10 text-center font-bold text-slate-500">Drives Page (Coming Soon)</div>} />
//         <Route path="/faculty" element={<FacultyDashboard />} />
//         <Route path="/sandbox" element={<Sandbox />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;












































































// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
// import { 
//   UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
//   Users, Code, LogOut, Search, Play, TrendingUp, AlertTriangle, 
//   Briefcase, Bell, Menu, X, BookOpen, Star, Target, ChevronDown, 
//   Filter, Calendar, FileText, Plus, Download, Building2
// } from 'lucide-react';

// // ==========================================
// // 1. SHARED COMPONENTS
// // ==========================================

// const Badge = ({ children, color = "indigo" }) => {
//   const colors = {
//     indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
//     emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
//     rose: "bg-rose-50 text-rose-700 border-rose-100",
//     amber: "bg-amber-50 text-amber-700 border-amber-100",
//     slate: "bg-slate-100 text-slate-600 border-slate-200",
//   };
//   return (
//     <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[color] || colors.slate}`}>
//       {children}
//     </span>
//   );
// };

// const StatCard = ({ label, value, sub, color="slate", highlight=false }) => {
//   const colors = {
//     emerald: "text-emerald-600",
//     rose: "text-rose-500",
//     indigo: "text-indigo-600",
//     slate: "text-slate-900"
//   };
//   return (
//     <div className={`bg-white p-6 rounded-2xl border ${highlight ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-200'} shadow-sm transition-all hover:shadow-md`}>
//       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
//       <h3 className={`text-4xl font-black ${colors[color]}`}>{value}</h3>
//       <p className={`text-xs mt-1 font-medium opacity-80 ${colors[color]}`}>{sub}</p>
//     </div>
//   );
// };

// // ==========================================
// // 2. FACULTY SUB-SCREENS
// // ==========================================

// const CommandCenter = ({ setActiveTab }) => (
//   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
//        <StatCard label="Total Students" value="500" sub="Across 4 branches" />
//        <StatCard label="Placed" value="350" sub="70% Success Rate" color="emerald" />
//        <StatCard label="Unplaced" value="150" sub="Actively seeking" color="rose" />
//        <StatCard label="Active Drives" value="12" sub="Open opportunities" color="indigo" highlight />
//     </div>

//     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//       <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
//          <div>
//            <h3 className="font-bold text-slate-800">Live Drive Monitor</h3>
//            <p className="text-xs text-slate-500">Real-time tracking of active recruitment processes</p>
//          </div>
//          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Filter size={18}/></button>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full text-left text-sm">
//           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//             <tr>
//               <th className="px-6 py-3">Company Name</th>
//               <th className="px-6 py-3">Role Profile</th>
//               <th className="px-6 py-3">Timeline</th>
//               <th className="px-6 py-3">Applicants</th>
//               <th className="px-6 py-3">Status</th>
//               <th className="px-6 py-3 text-right">Action</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {[
//               { c: "Amazon", r: "SDE-1", d: "Ends Today, 5 PM", a: 142, s: "Live", cl: "emerald" },
//               { c: "Google", r: "STEP Intern", d: "Starts Tomorrow", a: 89, s: "Upcoming", cl: "indigo" },
//               { c: "Microsoft", r: "Software Eng.", d: "Closed Yesterday", a: 312, s: "Processing", cl: "amber" },
//               { c: "Zomato", r: "Backend Dev", d: "Draft Mode", a: 0, s: "Draft", cl: "slate" },
//             ].map((drive, i) => (
//               <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setActiveTab('drives')}>
//                 <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">{drive.c[0]}</div>
//                   {drive.c}
//                 </td>
//                 <td className="px-6 py-4 text-slate-600">{drive.r}</td>
//                 <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-2"><Calendar size={12}/> {drive.d}</td>
//                 <td className="px-6 py-4 font-mono font-bold text-slate-700">{drive.a}</td>
//                 <td className="px-6 py-4"><Badge color={drive.cl}>{drive.s}</Badge></td>
//                 <td className="px-6 py-4 text-right">
//                   <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Manage <ArrowRight size={12}/></button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   </div>
// );

// const StudentsDatabase = () => (
//   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] animate-in fade-in zoom-in duration-300">
//     <div className="p-6 border-b border-slate-100 flex justify-between items-center">
//        <div>
//          <h2 className="text-lg font-bold text-slate-900">Students Database</h2>
//          <p className="text-sm text-slate-500">View and filter all registered students</p>
//        </div>
//        <div className="flex gap-2">
//          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"><Filter size={16}/> Filter</button>
//          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Download size={16}/> Export CSV</button>
//        </div>
//     </div>
//     <table className="w-full text-left text-sm">
//        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//           <tr>
//              <th className="px-6 py-3">Student Name</th>
//              <th className="px-6 py-3">Branch</th>
//              <th className="px-6 py-3">CGPA</th>
//              <th className="px-6 py-3">Hub Score</th>
//              <th className="px-6 py-3">Status</th>
//              <th className="px-6 py-3 text-right">Actions</th>
//           </tr>
//        </thead>
//        <tbody className="divide-y divide-slate-100">
//           {[
//             { n: "Saksham Bhardwaj", b: "CSE AIML", c: "9.2", h: "1850", s: "Unplaced", sc: "rose" },
//             { n: "Aditya Sharma", b: "CSE Core", c: "8.8", h: "1620", s: "Placed (Amazon)", sc: "emerald" },
//             { n: "Priya Singh", b: "IT", c: "8.5", h: "1450", s: "Unplaced", sc: "rose" },
//             { n: "Rahul Verma", b: "ECE", c: "7.9", h: "1200", s: "Unplaced", sc: "rose" },
//           ].map((s, i) => (
//              <tr key={i} className="hover:bg-slate-50">
//                 <td className="px-6 py-4 font-bold text-slate-900">{s.n}</td>
//                 <td className="px-6 py-4 text-slate-600">{s.b}</td>
//                 <td className="px-6 py-4 font-mono">{s.c}</td>
//                 <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{s.h}</td>
//                 <td className="px-6 py-4"><Badge color={s.sc}>{s.s}</Badge></td>
//                 <td className="px-6 py-4 text-right"><button className="text-indigo-600 hover:underline font-bold text-xs">View Profile</button></td>
//              </tr>
//           ))}
//        </tbody>
//     </table>
//   </div>
// );

// const ManageDrives = () => (
//   <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
//     <div className="flex justify-between items-center">
//        <h2 className="text-xl font-bold text-slate-900">Manage Recruitment Drives</h2>
//        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Create New Drive</button>
//     </div>
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//        {[
//          { c: "Amazon", r: "SDE-1", s: "Live", a: 142 },
//          { c: "Google", r: "STEP Intern", s: "Upcoming", a: 89 },
//          { c: "Microsoft", r: "SWE", s: "Processing", a: 312 },
//          { c: "Zomato", r: "Backend", s: "Draft", a: 0 },
//        ].map((d, i) => (
//          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
//             <div className="flex justify-between items-start mb-4">
//                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">{d.c[0]}</div>
//                <Badge color={d.s === 'Live' ? 'emerald' : d.s === 'Upcoming' ? 'indigo' : 'slate'}>{d.s}</Badge>
//             </div>
//             <h3 className="font-bold text-lg text-slate-900">{d.c}</h3>
//             <p className="text-slate-500 text-sm mb-4">{d.r}</p>
//             <div className="flex justify-between items-center pt-4 border-t border-slate-100">
//                <span className="text-xs font-bold text-slate-500">{d.a} Applicants</span>
//                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors"/>
//             </div>
//          </div>
//        ))}
//     </div>
//   </div>
// );

// const ReportsAnalytics = () => (
//   <div className="flex flex-col items-center justify-center h-[500px] text-center bg-white rounded-2xl border border-slate-200 border-dashed animate-in fade-in zoom-in duration-300">
//      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><FileText size={32} className="text-indigo-600"/></div>
//      <h3 className="text-xl font-bold text-slate-900">Reports & Analytics</h3>
//      <p className="text-slate-500 max-w-sm mb-6">Detailed placement statistics and downloadable reports will appear here.</p>
//      <button className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Download Summary Report</button>
//   </div>
// );

// // ==========================================
// // 3. FACULTY DASHBOARD (Main Wrapper)
// // ==========================================

// const FacultyDashboard = () => {
//   const [activeTab, setActiveTab] = useState('dashboard'); 
  
//   const renderContent = () => {
//     switch(activeTab) {
//       case 'dashboard': return <CommandCenter setActiveTab={setActiveTab} />;
//       case 'students': return <StudentsDatabase />;
//       case 'drives': return <ManageDrives />;
//       case 'reports': return <ReportsAnalytics />;
//       default: return <CommandCenter />;
//     }
//   };

//   const SidebarBtn = ({ id, icon: Icon, label }) => (
//     <button 
//       onClick={() => setActiveTab(id)}
//       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
//     >
//       <Icon size={18}/> {label}
//     </button>
//   );

//   return (
//     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
//       <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col border-r border-slate-800">
//         <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
//           <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
//           <span className="text-xl font-bold tracking-tight">SkillSync</span>
//         </div>
//         <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</div>
//            <SidebarBtn id="dashboard" icon={LayoutDashboard} label="Command Center" />
//            <SidebarBtn id="students" icon={Users} label="Students Database" />
//            <SidebarBtn id="drives" icon={Briefcase} label="Manage Drives" />
//            <SidebarBtn id="reports" icon={FileText} label="Reports & Analytics" />
           
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Recent Activity</div>
//            <div className="px-3 space-y-4">
//               {[{ u: "Rahul V.", a: "applied for Amazon", t: "2m ago" }, { u: "Priya S.", a: "completed Mock Test", t: "15m ago" }].map((item, i) => (
//                 <div key={i} className="flex gap-3 items-start">
//                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
//                    <div><p className="text-xs text-slate-300"><span className="font-bold text-white">{item.u}</span> {item.a}</p><p className="text-[10px] text-slate-600">{item.t}</p></div>
//                 </div>
//               ))}
//            </div>
//         </nav>
//         <div className="p-4 border-t border-slate-800"><Link to="/" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><LogOut size={16}/> Sign Out</Link></div>
//       </aside>

//       <main className="w-full md:ml-64 flex-1 p-4 md:p-8 overflow-y-auto">
//         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//            <div>
//               <h1 className="text-2xl font-bold text-slate-900">{activeTab === 'dashboard' ? 'Command Center' : activeTab === 'students' ? 'Students Database' : activeTab === 'drives' ? 'Recruitment Drives' : 'Analytics'}</h1>
//               <p className="text-slate-500 text-sm">Placement Season 2026 • Term 2</p>
//            </div>
//            <div className="flex items-center gap-4">
//              {activeTab === 'students' && (<div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2 text-sm text-slate-500"><Search size={16}/> <input placeholder="Search students..." className="outline-none text-xs w-40"/></div>)}
//              <button onClick={() => setActiveTab('drives')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all"><Plus size={18}/> Create Drive</button>
//            </div>
//         </header>
//         {renderContent()}
//       </main>
//     </div>
//   );
// };

// // ==========================================
// // 4. STUDENT MODULE (Dashboard, Sandbox, Vault, Upload)
// // ==========================================

// const UserDropdown = ({ name, role, avatar }) => (
//   <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
//     <div className="text-right hidden lg:block"><p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role}</p></div><div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">{avatar}</div><ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600" />
//   </div>
// );

// const StudentDashboard = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const isActive = (path) => location.pathname === path ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50";

//   return (
//     <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
//       <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center gap-3">
//               <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
//               <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}><div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-5 h-5 fill-current"/></div><span className="font-bold text-xl tracking-tight hidden sm:block">SkillSync</span></div>
//             </div>
//             <div className="hidden md:flex items-center gap-1">
//               <Link to="/student" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student')}`}><LayoutDashboard size={16} /> Cockpit</Link>
//               <Link to="/student/drives" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student/drives')}`}><Briefcase size={16} /> Drives</Link>
//               <Link to="/sandbox" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/sandbox')}`}><Code size={16} /> Arena</Link>
//             </div>
//             <div className="flex items-center gap-4">
//               <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span></button>
//               <UserDropdown name="Saksham B." role="Alpha Batch" avatar="SB" />
//             </div>
//           </div>
//         </div>
//         {mobileMenuOpen && (<div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl z-50"><div className="p-4 space-y-2"><Link to="/student" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-indigo-50 text-indigo-600"><LayoutDashboard size={18}/> Cockpit</Link><Link to="/student/drives" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Briefcase size={18}/> Drives</Link><Link to="/sandbox" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Code size={18}/> Arena</Link><div className="h-px bg-slate-100 my-2"></div><button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"><LogOut size={18} /> Sign Out</button></div></div>)}
//       </nav>

//       <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
//         <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl relative overflow-hidden">
//           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
//             <div>
//               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider mb-4"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live System</div>
//               <h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back, Saksham</h1>
//               <p className="text-slate-400 text-lg mb-6">Your placement probability has increased by <span className="text-emerald-400 font-bold">12%</span> this week.</p>
//               <div className="flex gap-4"><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Current Rank</span><span className="text-3xl font-black">1450</span></div><div className="w-px bg-white/10 h-10 self-center"></div><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Hub Score</span><span className="text-3xl font-black text-indigo-400">850</span></div></div>
//             </div>
//             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm lg:max-w-md ml-auto w-full">
//               <div className="flex justify-between items-end mb-4"><div><h3 className="font-bold text-lg">Profile Strength</h3><p className="text-slate-400 text-sm">Resume & Portfolio</p></div><span className="text-2xl font-bold text-indigo-400">70%</span></div>
//               <div className="w-full bg-slate-700 h-3 rounded-full mb-4 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[70%] rounded-full relative"></div></div>
//               <div className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20"><AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" /><div><p className="text-amber-200 text-xs font-bold mb-1">Action Required</p><p className="text-amber-100/70 text-xs">Add a GitHub project link to reach 80% completeness.</p></div></div>
//             </div>
//           </div>
//           <div className="absolute -top-24 -right-24 text-white/5 rotate-12"><TrendingUp size={400} /></div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Target size={20}/></div><div><h3 className="font-bold text-slate-800">Your Status</h3><p className="text-xs text-slate-500 font-bold uppercase">Academic & Skill</p></div></div><div className="space-y-4"><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Batch Category</span><Badge color="indigo">Alpha Batch</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">AMCAT Quant</span><Badge color="emerald">Top 10%</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Logical Ability</span><Badge color="emerald">Top 15%</Badge></div></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50 relative overflow-hidden"><div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">URGENT</div><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Bell size={20}/></div><div><h3 className="font-bold text-slate-800">Pending Actions</h3><p className="text-xs text-slate-500 font-bold uppercase">1 Deadline Today</p></div></div><div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4"><div className="flex justify-between items-start mb-2"><p className="text-sm font-bold text-slate-900">Amazon SDE Drive</p><span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Ends 5 PM</span></div><p className="text-xs text-slate-500 mb-3">You have been shortlisted. Verify resume to confirm seat.</p><button onClick={() => navigate('/student/upload')} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Upload Resume</button></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4"><div className="mb-2"><h3 className="font-bold text-slate-800">Quick Access</h3><p className="text-xs text-slate-500 font-bold uppercase">Tools & Resources</p></div><button onClick={() => navigate('/sandbox')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Code size={18} className="text-indigo-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Open Sandbox</h4><p className="text-[10px] text-slate-400">Practice coding</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button><button onClick={() => navigate('/student/vault')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><BookOpen size={18} className="text-emerald-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Company Vault</h4><p className="text-[10px] text-slate-400">Read experiences</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button></div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Sandbox = () => {
//   const [analyzing, setAnalyzing] = useState(false); const [result, setResult] = useState(null); const runSimulation = () => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setResult(true); }, 2000); };
//   return (<div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden"><div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-r border-slate-200 bg-white h-1/2 md:h-full overflow-y-auto"><div className="mb-6"><Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link><h1 className="text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1><p className="text-slate-500 text-sm">Paste a JD below to simulate how the AI matches you.</p></div><div className="flex-1 flex flex-col gap-4"><select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"><option>Amazon SDE - 2024</option><option>Microsoft IDC</option></select><textarea className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={`Role: SDE-1...`} /><button onClick={runSimulation} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all">{analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} {analyzing ? "AI is Analyzing..." : "Run Simulation"}</button></div></div><div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto h-1/2 md:h-full">{!result && !analyzing && (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><LayoutDashboard size={48} className="mb-4"/><p className="font-bold">Waiting for Input...</p></div>)}{result && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p><div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600"><span className="text-3xl font-black text-slate-900">65%</span></div></div><div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100"><tr className="bg-emerald-50/50"><td className="p-4 font-bold text-slate-700">DSA</td><td className="p-4 font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> Found</td></tr><tr className="bg-rose-50/50"><td className="p-4 font-bold text-slate-700">AWS</td><td className="p-4 font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={14}/> Missing</td></tr></tbody></table></div></div>)}</div></div>);
// };

// const StudentUpload = () => {
//   const [step, setStep] = useState('upload'); const navigate = useNavigate(); const handleUpload = () => { setStep('processing'); setTimeout(() => setStep('done'), 2000); };
//   return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans text-slate-900"><div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden">{step === 'upload' && (<><button onClick={() => navigate('/student')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600"><ArrowRight className="rotate-180"/></button><div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><UploadCloud className="w-8 h-8 text-indigo-600" /></div><h2 className="text-2xl font-bold mb-2">Amazon SDE Drive</h2><p className="text-slate-500 mb-8">Upload your resume to confirm participation.</p><div onClick={handleUpload} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors group"><span className="font-bold text-indigo-600 group-hover:scale-105 transition-transform">Click to Upload PDF</span></div></>)}{step === 'processing' && (<div className="py-10"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" /><h3 className="text-lg font-bold">Verifying Resume...</h3></div>)}{step === 'done' && (<div className="py-6 animate-in zoom-in duration-300"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div><h3 className="text-2xl font-bold">Application Sent!</h3><button onClick={() => navigate('/student')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full mt-6">Back to Cockpit</button></div>)}</div></div>);
// };

// const CompanyVault = () => (<div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center"><h1 className="text-3xl font-black text-slate-900 mb-2">Company Vault</h1><p className="text-slate-500 max-w-md mb-8">Access previous year questions.</p><Link to="/student" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">← Back</Link></div>);

// // ==========================================
// // 5. LANDING PAGE (With Local Image Logic)
// // ==========================================
// const LandingPage = () => (
//   <div className="h-screen w-screen bg-[#0f172a] font-sans overflow-hidden flex flex-col lg:flex-row">
    
//     {/* LEFT SIDE */}
//     <div className="w-full lg:w-[45%] h-full flex flex-col justify-center p-12 lg:p-20 relative z-20 bg-[#0f172a] border-r border-slate-800">
//        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
//        <div className="relative z-10">
//          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-bold w-fit mb-8 animate-[fade-in-up_1s]">
//            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
//            Placement Season 2026 Live
//          </div>
//          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">Skill<span className="text-indigo-500">Sync.</span></h1>
//          <p className="text-slate-400 text-lg lg:text-xl max-w-lg mb-10 leading-relaxed font-medium">The AI-Native Placement Ecosystem. We bridge the gap between talent and opportunity with <span className="text-white font-bold"> intelligent matching.</span></p>
//          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
//             <Link to="/student" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-500/50 to-indigo-900/10 hover:to-indigo-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-400"><Users size={24}/></div><div><h3 className="text-lg font-bold text-white">Student</h3><p className="text-xs text-slate-400">Login to Cockpit</p></div></div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-indigo-500 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//             <Link to="/faculty" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-500/50 to-emerald-900/10 hover:to-emerald-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400"><LayoutDashboard size={24}/></div><div><h3 className="text-lg font-bold text-white">Faculty</h3><p className="text-xs text-slate-400">Admin Dashboard</p></div></div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-emerald-500 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//          </div>
//        </div>
//     </div>

//     {/* RIGHT SIDE - REAL WORLD UPES IMAGE */}
//     <div className="hidden lg:block w-[55%] h-full relative overflow-hidden bg-slate-950">
       
//        {/* THIS TRIES TO LOAD 'upes.jpg' FROM PUBLIC FOLDER. IF FAILS, LOADS FALLBACK */}
//        <img 
//          src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/UPES_Campus.jpg/1280px-UPES_Campus.jpg" 
//          alt="UPES Campus" 
//          className="absolute inset-0 w-full h-full object-contain bg-black"
//        />
       
//        {/* Gradient Overlay */}
//        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-900/20 to-[#0f172a]"></div>
//        <div className="absolute inset-0 bg-blue-900/10 mix-blend-multiply"></div>

//        {/* Realistic Cards */}
//        <div className="absolute top-1/4 right-20 animate-[fade-in_1s_ease-out_0.5s_both]">
//           <div className="bg-white p-4 pr-8 rounded-xl shadow-2xl shadow-black/50 border-l-4 border-emerald-500 flex items-center gap-4">
//              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><CheckCircle size={24} fill="currentColor" className="text-emerald-100 stroke-emerald-600"/></div>
//              <div><h4 className="font-bold text-slate-800 text-sm">Resume Verified</h4><p className="text-slate-500 text-xs">Ready for Amazon Drive</p></div>
//           </div>
//        </div>

//        <div className="absolute bottom-1/4 right-32 animate-[fade-in_1s_ease-out_1s_both]">
//           <div className="bg-slate-800 p-5 rounded-2xl shadow-2xl shadow-black/50 border border-slate-700 w-64">
//              <div className="flex justify-between items-center mb-4"><span className="text-slate-400 text-xs font-bold uppercase">Placement Rate</span><span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">2026 Batch</span></div>
//              <div className="flex items-end gap-2"><span className="text-4xl font-black text-white">94%</span><span className="text-emerald-400 text-sm font-bold mb-1">▲ 12%</span></div>
//              <div className="flex items-end gap-1 h-8 mt-4 opacity-50">
//                 <div className="w-1/5 bg-indigo-400 h-4 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-6 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-5 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-8 rounded-t"></div>
//                 <div className="w-1/5 bg-emerald-400 h-full rounded-t"></div>
//              </div>
//           </div>
//        </div>
//     </div>
//   </div>
// );

// // ==========================================
// // 6. APP ROUTER
// // ==========================================
// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<LandingPage />} />
//         <Route path="/student" element={<StudentDashboard />} />
//         <Route path="/student/upload" element={<StudentUpload />} />
//         <Route path="/student/vault" element={<CompanyVault />} />
//         <Route path="/student/drives" element={<div className="p-10 text-center font-bold text-slate-500">Drives Page (Coming Soon)</div>} />
//         <Route path="/faculty" element={<FacultyDashboard />} />
//         <Route path="/sandbox" element={<Sandbox />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;




























































































// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
// import { 
//   UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
//   Users, Code, LogOut, Search, Play, TrendingUp, AlertTriangle, 
//   Briefcase, Bell, Menu, X, BookOpen, Star, Target, ChevronDown, 
//   Filter, Calendar, FileText, Plus, Download, Building2
// } from 'lucide-react';

// // ==========================================
// // 1. SHARED COMPONENTS
// // ==========================================

// const Badge = ({ children, color = "indigo" }) => {
//   const colors = {
//     indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
//     emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
//     rose: "bg-rose-50 text-rose-700 border-rose-100",
//     amber: "bg-amber-50 text-amber-700 border-amber-100",
//     slate: "bg-slate-100 text-slate-600 border-slate-200",
//   };
//   return (
//     <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[color] || colors.slate}`}>
//       {children}
//     </span>
//   );
// };

// const StatCard = ({ label, value, sub, color="slate", highlight=false }) => {
//   const colors = {
//     emerald: "text-emerald-600",
//     rose: "text-rose-500",
//     indigo: "text-indigo-600",
//     slate: "text-slate-900"
//   };
//   return (
//     <div className={`bg-white p-6 rounded-2xl border ${highlight ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-200'} shadow-sm transition-all hover:shadow-md`}>
//       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
//       <h3 className={`text-4xl font-black ${colors[color]}`}>{value}</h3>
//       <p className={`text-xs mt-1 font-medium opacity-80 ${colors[color]}`}>{sub}</p>
//     </div>
//   );
// };

// // ==========================================
// // 2. FACULTY SUB-SCREENS
// // ==========================================

// const CommandCenter = ({ setActiveTab }) => (
//   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
//        <StatCard label="Total Students" value="500" sub="Across 4 branches" />
//        <StatCard label="Placed" value="350" sub="70% Success Rate" color="emerald" />
//        <StatCard label="Unplaced" value="150" sub="Actively seeking" color="rose" />
//        <StatCard label="Active Drives" value="12" sub="Open opportunities" color="indigo" highlight />
//     </div>

//     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//       <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
//          <div>
//            <h3 className="font-bold text-slate-800">Live Drive Monitor</h3>
//            <p className="text-xs text-slate-500">Real-time tracking of active recruitment processes</p>
//          </div>
//          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Filter size={18}/></button>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full text-left text-sm">
//           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//             <tr>
//               <th className="px-6 py-3">Company Name</th>
//               <th className="px-6 py-3">Role Profile</th>
//               <th className="px-6 py-3">Timeline</th>
//               <th className="px-6 py-3">Applicants</th>
//               <th className="px-6 py-3">Status</th>
//               <th className="px-6 py-3 text-right">Action</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {[
//               { c: "Amazon", r: "SDE-1", d: "Ends Today, 5 PM", a: 142, s: "Live", cl: "emerald" },
//               { c: "Google", r: "STEP Intern", d: "Starts Tomorrow", a: 89, s: "Upcoming", cl: "indigo" },
//               { c: "Microsoft", r: "Software Eng.", d: "Closed Yesterday", a: 312, s: "Processing", cl: "amber" },
//               { c: "Zomato", r: "Backend Dev", d: "Draft Mode", a: 0, s: "Draft", cl: "slate" },
//             ].map((drive, i) => (
//               <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setActiveTab('drives')}>
//                 <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">{drive.c[0]}</div>
//                   {drive.c}
//                 </td>
//                 <td className="px-6 py-4 text-slate-600">{drive.r}</td>
//                 <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-2"><Calendar size={12}/> {drive.d}</td>
//                 <td className="px-6 py-4 font-mono font-bold text-slate-700">{drive.a}</td>
//                 <td className="px-6 py-4"><Badge color={drive.cl}>{drive.s}</Badge></td>
//                 <td className="px-6 py-4 text-right">
//                   <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Manage <ArrowRight size={12}/></button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   </div>
// );

// const StudentsDatabase = () => (
//   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] animate-in fade-in zoom-in duration-300">
//     <div className="p-6 border-b border-slate-100 flex justify-between items-center">
//        <div>
//          <h2 className="text-lg font-bold text-slate-900">Students Database</h2>
//          <p className="text-sm text-slate-500">View and filter all registered students</p>
//        </div>
//        <div className="flex gap-2">
//          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"><Filter size={16}/> Filter</button>
//          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Download size={16}/> Export CSV</button>
//        </div>
//     </div>
//     <table className="w-full text-left text-sm">
//        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//           <tr>
//              <th className="px-6 py-3">Student Name</th>
//              <th className="px-6 py-3">Branch</th>
//              <th className="px-6 py-3">CGPA</th>
//              <th className="px-6 py-3">Hub Score</th>
//              <th className="px-6 py-3">Status</th>
//              <th className="px-6 py-3 text-right">Actions</th>
//           </tr>
//        </thead>
//        <tbody className="divide-y divide-slate-100">
//           {[
//             { n: "Saksham Bhardwaj", b: "CSE AIML", c: "9.2", h: "1850", s: "Unplaced", sc: "rose" },
//             { n: "Aditya Sharma", b: "CSE Core", c: "8.8", h: "1620", s: "Placed (Amazon)", sc: "emerald" },
//             { n: "Priya Singh", b: "IT", c: "8.5", h: "1450", s: "Unplaced", sc: "rose" },
//             { n: "Rahul Verma", b: "ECE", c: "7.9", h: "1200", s: "Unplaced", sc: "rose" },
//           ].map((s, i) => (
//              <tr key={i} className="hover:bg-slate-50">
//                 <td className="px-6 py-4 font-bold text-slate-900">{s.n}</td>
//                 <td className="px-6 py-4 text-slate-600">{s.b}</td>
//                 <td className="px-6 py-4 font-mono">{s.c}</td>
//                 <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{s.h}</td>
//                 <td className="px-6 py-4"><Badge color={s.sc}>{s.s}</Badge></td>
//                 <td className="px-6 py-4 text-right"><button className="text-indigo-600 hover:underline font-bold text-xs">View Profile</button></td>
//              </tr>
//           ))}
//        </tbody>
//     </table>
//   </div>
// );

// const ManageDrives = () => (
//   <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
//     <div className="flex justify-between items-center">
//        <h2 className="text-xl font-bold text-slate-900">Manage Recruitment Drives</h2>
//        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Create New Drive</button>
//     </div>
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//        {[
//          { c: "Amazon", r: "SDE-1", s: "Live", a: 142 },
//          { c: "Google", r: "STEP Intern", s: "Upcoming", a: 89 },
//          { c: "Microsoft", r: "SWE", s: "Processing", a: 312 },
//          { c: "Zomato", r: "Backend", s: "Draft", a: 0 },
//        ].map((d, i) => (
//          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
//             <div className="flex justify-between items-start mb-4">
//                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">{d.c[0]}</div>
//                <Badge color={d.s === 'Live' ? 'emerald' : d.s === 'Upcoming' ? 'indigo' : 'slate'}>{d.s}</Badge>
//             </div>
//             <h3 className="font-bold text-lg text-slate-900">{d.c}</h3>
//             <p className="text-slate-500 text-sm mb-4">{d.r}</p>
//             <div className="flex justify-between items-center pt-4 border-t border-slate-100">
//                <span className="text-xs font-bold text-slate-500">{d.a} Applicants</span>
//                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors"/>
//             </div>
//          </div>
//        ))}
//     </div>
//   </div>
// );

// const ReportsAnalytics = () => (
//   <div className="flex flex-col items-center justify-center h-[500px] text-center bg-white rounded-2xl border border-slate-200 border-dashed animate-in fade-in zoom-in duration-300">
//      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><FileText size={32} className="text-indigo-600"/></div>
//      <h3 className="text-xl font-bold text-slate-900">Reports & Analytics</h3>
//      <p className="text-slate-500 max-w-sm mb-6">Detailed placement statistics and downloadable reports will appear here.</p>
//      <button className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Download Summary Report</button>
//   </div>
// );

// // ==========================================
// // 3. FACULTY DASHBOARD (Main Wrapper)
// // ==========================================

// const FacultyDashboard = () => {
//   const [activeTab, setActiveTab] = useState('dashboard'); 
  
//   const renderContent = () => {
//     switch(activeTab) {
//       case 'dashboard': return <CommandCenter setActiveTab={setActiveTab} />;
//       case 'students': return <StudentsDatabase />;
//       case 'drives': return <ManageDrives />;
//       case 'reports': return <ReportsAnalytics />;
//       default: return <CommandCenter />;
//     }
//   };

//   const SidebarBtn = ({ id, icon: Icon, label }) => (
//     <button 
//       onClick={() => setActiveTab(id)}
//       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
//     >
//       <Icon size={18}/> {label}
//     </button>
//   );

//   return (
//     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
//       <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col border-r border-slate-800">
//         <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
//           <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
//           <span className="text-xl font-bold tracking-tight">SkillSync</span>
//         </div>
//         <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</div>
//            <SidebarBtn id="dashboard" icon={LayoutDashboard} label="Command Center" />
//            <SidebarBtn id="students" icon={Users} label="Students Database" />
//            <SidebarBtn id="drives" icon={Briefcase} label="Manage Drives" />
//            <SidebarBtn id="reports" icon={FileText} label="Reports & Analytics" />
           
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Recent Activity</div>
//            <div className="px-3 space-y-4">
//               {[{ u: "Rahul V.", a: "applied for Amazon", t: "2m ago" }, { u: "Priya S.", a: "completed Mock Test", t: "15m ago" }].map((item, i) => (
//                 <div key={i} className="flex gap-3 items-start">
//                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
//                    <div><p className="text-xs text-slate-300"><span className="font-bold text-white">{item.u}</span> {item.a}</p><p className="text-[10px] text-slate-600">{item.t}</p></div>
//                 </div>
//               ))}
//            </div>
//         </nav>
//         <div className="p-4 border-t border-slate-800"><Link to="/" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><LogOut size={16}/> Sign Out</Link></div>
//       </aside>

//       <main className="w-full md:ml-64 flex-1 p-4 md:p-8 overflow-y-auto">
//         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//            <div>
//               <h1 className="text-2xl font-bold text-slate-900">{activeTab === 'dashboard' ? 'Command Center' : activeTab === 'students' ? 'Students Database' : activeTab === 'drives' ? 'Recruitment Drives' : 'Analytics'}</h1>
//               <p className="text-slate-500 text-sm">Placement Season 2026 • Term 2</p>
//            </div>
//            <div className="flex items-center gap-4">
//              {activeTab === 'students' && (<div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2 text-sm text-slate-500"><Search size={16}/> <input placeholder="Search students..." className="outline-none text-xs w-40"/></div>)}
//              <button onClick={() => setActiveTab('drives')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all"><Plus size={18}/> Create Drive</button>
//            </div>
//         </header>
//         {renderContent()}
//       </main>
//     </div>
//   );
// };

// // ==========================================
// // 4. STUDENT MODULE (Dashboard, Sandbox, Vault, Upload)
// // ==========================================

// const UserDropdown = ({ name, role, avatar }) => (
//   <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
//     <div className="text-right hidden lg:block"><p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role}</p></div><div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">{avatar}</div><ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600" />
//   </div>
// );

// const StudentDashboard = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const isActive = (path) => location.pathname === path ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50";

//   return (
//     <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
//       <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center gap-3">
//               <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
//               <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}><div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-5 h-5 fill-current"/></div><span className="font-bold text-xl tracking-tight hidden sm:block">SkillSync</span></div>
//             </div>
//             <div className="hidden md:flex items-center gap-1">
//               <Link to="/student" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student')}`}><LayoutDashboard size={16} /> Cockpit</Link>
//               <Link to="/student/drives" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student/drives')}`}><Briefcase size={16} /> Drives</Link>
//               <Link to="/sandbox" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/sandbox')}`}><Code size={16} /> Arena</Link>
//             </div>
//             <div className="flex items-center gap-4">
//               <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span></button>
//               <UserDropdown name="Saksham B." role="Alpha Batch" avatar="SB" />
//             </div>
//           </div>
//         </div>
//         {mobileMenuOpen && (<div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl z-50"><div className="p-4 space-y-2"><Link to="/student" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-indigo-50 text-indigo-600"><LayoutDashboard size={18}/> Cockpit</Link><Link to="/student/drives" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Briefcase size={18}/> Drives</Link><Link to="/sandbox" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Code size={18}/> Arena</Link><div className="h-px bg-slate-100 my-2"></div><button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"><LogOut size={18} /> Sign Out</button></div></div>)}
//       </nav>

//       <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
//         <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl relative overflow-hidden">
//           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
//             <div>
//               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider mb-4"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live System</div>
//               <h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back, Saksham</h1>
//               <p className="text-slate-400 text-lg mb-6">Your placement probability has increased by <span className="text-emerald-400 font-bold">12%</span> this week.</p>
//               <div className="flex gap-4"><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Current Rank</span><span className="text-3xl font-black">1450</span></div><div className="w-px bg-white/10 h-10 self-center"></div><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Hub Score</span><span className="text-3xl font-black text-indigo-400">850</span></div></div>
//             </div>
//             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm lg:max-w-md ml-auto w-full">
//               <div className="flex justify-between items-end mb-4"><div><h3 className="font-bold text-lg">Profile Strength</h3><p className="text-slate-400 text-sm">Resume & Portfolio</p></div><span className="text-2xl font-bold text-indigo-400">70%</span></div>
//               <div className="w-full bg-slate-700 h-3 rounded-full mb-4 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[70%] rounded-full relative"></div></div>
//               <div className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20"><AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" /><div><p className="text-amber-200 text-xs font-bold mb-1">Action Required</p><p className="text-amber-100/70 text-xs">Add a GitHub project link to reach 80% completeness.</p></div></div>
//             </div>
//           </div>
//           <div className="absolute -top-24 -right-24 text-white/5 rotate-12"><TrendingUp size={400} /></div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Target size={20}/></div><div><h3 className="font-bold text-slate-800">Your Status</h3><p className="text-xs text-slate-500 font-bold uppercase">Academic & Skill</p></div></div><div className="space-y-4"><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Batch Category</span><Badge color="indigo">Alpha Batch</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">AMCAT Quant</span><Badge color="emerald">Top 10%</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Logical Ability</span><Badge color="emerald">Top 15%</Badge></div></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50 relative overflow-hidden"><div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">URGENT</div><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Bell size={20}/></div><div><h3 className="font-bold text-slate-800">Pending Actions</h3><p className="text-xs text-slate-500 font-bold uppercase">1 Deadline Today</p></div></div><div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4"><div className="flex justify-between items-start mb-2"><p className="text-sm font-bold text-slate-900">Amazon SDE Drive</p><span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Ends 5 PM</span></div><p className="text-xs text-slate-500 mb-3">You have been shortlisted. Verify resume to confirm seat.</p><button onClick={() => navigate('/student/upload')} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Upload Resume</button></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4"><div className="mb-2"><h3 className="font-bold text-slate-800">Quick Access</h3><p className="text-xs text-slate-500 font-bold uppercase">Tools & Resources</p></div><button onClick={() => navigate('/sandbox')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Code size={18} className="text-indigo-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Open Sandbox</h4><p className="text-[10px] text-slate-400">Practice coding</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button><button onClick={() => navigate('/student/vault')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><BookOpen size={18} className="text-emerald-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Company Vault</h4><p className="text-[10px] text-slate-400">Read experiences</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button></div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Sandbox = () => {
//   const [analyzing, setAnalyzing] = useState(false); const [result, setResult] = useState(null); const runSimulation = () => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setResult(true); }, 2000); };
//   return (<div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden"><div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-r border-slate-200 bg-white h-1/2 md:h-full overflow-y-auto"><div className="mb-6"><Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link><h1 className="text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1><p className="text-slate-500 text-sm">Paste a JD below to simulate how the AI matches you.</p></div><div className="flex-1 flex flex-col gap-4"><select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"><option>Amazon SDE - 2024</option><option>Microsoft IDC</option></select><textarea className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={`Role: SDE-1...`} /><button onClick={runSimulation} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all">{analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} {analyzing ? "AI is Analyzing..." : "Run Simulation"}</button></div></div><div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto h-1/2 md:h-full">{!result && !analyzing && (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><LayoutDashboard size={48} className="mb-4"/><p className="font-bold">Waiting for Input...</p></div>)}{result && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p><div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600"><span className="text-3xl font-black text-slate-900">65%</span></div></div><div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100"><tr className="bg-emerald-50/50"><td className="p-4 font-bold text-slate-700">DSA</td><td className="p-4 font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> Found</td></tr><tr className="bg-rose-50/50"><td className="p-4 font-bold text-slate-700">AWS</td><td className="p-4 font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={14}/> Missing</td></tr></tbody></table></div></div>)}</div></div>);
// };

// const StudentUpload = () => {
//   const [step, setStep] = useState('upload'); const navigate = useNavigate(); const handleUpload = () => { setStep('processing'); setTimeout(() => setStep('done'), 2000); };
//   return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans text-slate-900"><div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden">{step === 'upload' && (<><button onClick={() => navigate('/student')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600"><ArrowRight className="rotate-180"/></button><div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><UploadCloud className="w-8 h-8 text-indigo-600" /></div><h2 className="text-2xl font-bold mb-2">Amazon SDE Drive</h2><p className="text-slate-500 mb-8">Upload your resume to confirm participation.</p><div onClick={handleUpload} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors group"><span className="font-bold text-indigo-600 group-hover:scale-105 transition-transform">Click to Upload PDF</span></div></>)}{step === 'processing' && (<div className="py-10"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" /><h3 className="text-lg font-bold">Verifying Resume...</h3></div>)}{step === 'done' && (<div className="py-6 animate-in zoom-in duration-300"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div><h3 className="text-2xl font-bold">Application Sent!</h3><button onClick={() => navigate('/student')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full mt-6">Back to Cockpit</button></div>)}</div></div>);
// };

// const CompanyVault = () => (<div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center"><h1 className="text-3xl font-black text-slate-900 mb-2">Company Vault</h1><p className="text-slate-500 max-w-md mb-8">Access previous year questions.</p><Link to="/student" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">← Back</Link></div>);

// // ==========================================
// // 5. LANDING PAGE (Final Fit)
// // ==========================================
// const LandingPage = () => (
//   <div className="h-screen w-screen bg-[#0f172a] font-sans overflow-hidden flex flex-col lg:flex-row">
    
//     {/* LEFT SIDE: Content */}
//     <div className="w-full lg:w-[45%] h-full flex flex-col justify-center p-12 lg:p-20 relative z-20 bg-[#0f172a] border-r border-slate-800">
//        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
//        <div className="relative z-10">
//          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-bold w-fit mb-8 animate-[fade-in-up_1s]">
//            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
//            Placement Season 2026 Live
//          </div>
//          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">Skill<span className="text-indigo-500">Sync.</span></h1>
//          <p className="text-slate-400 text-lg lg:text-xl max-w-lg mb-10 leading-relaxed font-medium">The AI-Native Placement Ecosystem. We bridge the gap between talent and opportunity with <span className="text-white font-bold"> intelligent matching.</span></p>
//          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
//             <Link to="/student" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-500/50 to-indigo-900/10 hover:to-indigo-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-400"><Users size={24}/></div><div><h3 className="text-lg font-bold text-white">Student</h3><p className="text-xs text-slate-400">Login to Cockpit</p></div></div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-indigo-500 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//             <Link to="/faculty" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-500/50 to-emerald-900/10 hover:to-emerald-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400"><LayoutDashboard size={24}/></div><div><h3 className="text-lg font-bold text-white">Faculty</h3><p className="text-xs text-slate-400">Admin Dashboard</p></div></div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-emerald-500 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//          </div>
//        </div>
//     </div>

//     {/* RIGHT SIDE: UPES Image (No Crop) */}
//     <div className="hidden lg:block w-[55%] h-full relative bg-slate-950 flex items-center justify-center">
       
//        {/* PRIMARY: DIRECT URL (Guaranteed to work) */}
//        <img 
//          src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/UPES_Campus.jpg/1280px-UPES_Campus.jpg" 
//          onError={(e) => {e.target.onerror = null; e.target.src="/upes.jpg"}}
//          alt="UPES Campus" 
//          className="w-full h-full object-contain"
//        />
       
//        {/* Background Overlay for seamless look */}
//        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0f172a] opacity-50 pointer-events-none"></div>

//        {/* Floating Cards */}
//        <div className="absolute top-1/4 right-20 animate-[fade-in_1s_ease-out_0.5s_both]">
//           <div className="bg-white p-4 pr-8 rounded-xl shadow-2xl shadow-black/50 border-l-4 border-emerald-500 flex items-center gap-4">
//              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><CheckCircle size={24} fill="currentColor" className="text-emerald-100 stroke-emerald-600"/></div>
//              <div><h4 className="font-bold text-slate-800 text-sm">Resume Verified</h4><p className="text-slate-500 text-xs">Ready for Amazon Drive</p></div>
//           </div>
//        </div>

//        <div className="absolute bottom-1/4 right-32 animate-[fade-in_1s_ease-out_1s_both]">
//           <div className="bg-slate-800 p-5 rounded-2xl shadow-2xl shadow-black/50 border border-slate-700 w-64">
//              <div className="flex justify-between items-center mb-4"><span className="text-slate-400 text-xs font-bold uppercase">Placement Rate</span><span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">2026 Batch</span></div>
//              <div className="flex items-end gap-2"><span className="text-4xl font-black text-white">94%</span><span className="text-emerald-400 text-sm font-bold mb-1">▲ 12%</span></div>
//              <div className="flex items-end gap-1 h-8 mt-4 opacity-50">
//                 <div className="w-1/5 bg-indigo-400 h-4 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-6 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-5 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-8 rounded-t"></div>
//                 <div className="w-1/5 bg-emerald-400 h-full rounded-t"></div>
//              </div>
//           </div>
//        </div>
//     </div>
//   </div>
// );

// // ==========================================
// // 6. APP ROUTER
// // ==========================================
// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<LandingPage />} />
//         <Route path="/student" element={<StudentDashboard />} />
//         <Route path="/student/upload" element={<StudentUpload />} />
//         <Route path="/student/vault" element={<CompanyVault />} />
//         <Route path="/student/drives" element={<div className="p-10 text-center font-bold text-slate-500">Drives Page (Coming Soon)</div>} />
//         <Route path="/faculty" element={<FacultyDashboard />} />
//         <Route path="/sandbox" element={<Sandbox />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;














































// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
// import { 
//   UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
//   Users, Code, LogOut, Search, Play, TrendingUp, AlertTriangle, 
//   Briefcase, Bell, Menu, X, BookOpen, Star, Target, ChevronDown, 
//   Filter, Calendar, FileText, Plus, Download, Building2
// } from 'lucide-react';

// // ==========================================
// // 1. SHARED COMPONENTS
// // ==========================================

// const Badge = ({ children, color = "indigo" }) => {
//   const colors = {
//     indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
//     emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
//     rose: "bg-rose-50 text-rose-700 border-rose-100",
//     amber: "bg-amber-50 text-amber-700 border-amber-100",
//     slate: "bg-slate-100 text-slate-600 border-slate-200",
//   };
//   return (
//     <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[color] || colors.slate}`}>
//       {children}
//     </span>
//   );
// };

// const StatCard = ({ label, value, sub, color="slate", highlight=false }) => {
//   const colors = {
//     emerald: "text-emerald-600",
//     rose: "text-rose-500",
//     indigo: "text-indigo-600",
//     slate: "text-slate-900"
//   };
//   return (
//     <div className={`bg-white p-6 rounded-2xl border ${highlight ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-200'} shadow-sm transition-all hover:shadow-md`}>
//       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
//       <h3 className={`text-4xl font-black ${colors[color]}`}>{value}</h3>
//       <p className={`text-xs mt-1 font-medium opacity-80 ${colors[color]}`}>{sub}</p>
//     </div>
//   );
// };

// // ==========================================
// // 2. FACULTY SUB-SCREENS
// // ==========================================

// const CommandCenter = ({ setActiveTab }) => (
//   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
//        <StatCard label="Total Students" value="500" sub="Across 4 branches" />
//        <StatCard label="Placed" value="350" sub="70% Success Rate" color="emerald" />
//        <StatCard label="Unplaced" value="150" sub="Actively seeking" color="rose" />
//        <StatCard label="Active Drives" value="12" sub="Open opportunities" color="indigo" highlight />
//     </div>

//     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//       <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
//          <div>
//            <h3 className="font-bold text-slate-800">Live Drive Monitor</h3>
//            <p className="text-xs text-slate-500">Real-time tracking of active recruitment processes</p>
//          </div>
//          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Filter size={18}/></button>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full text-left text-sm">
//           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//             <tr>
//               <th className="px-6 py-3">Company Name</th>
//               <th className="px-6 py-3">Role Profile</th>
//               <th className="px-6 py-3">Timeline</th>
//               <th className="px-6 py-3">Applicants</th>
//               <th className="px-6 py-3">Status</th>
//               <th className="px-6 py-3 text-right">Action</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {[
//               { c: "Amazon", r: "SDE-1", d: "Ends Today, 5 PM", a: 142, s: "Live", cl: "emerald" },
//               { c: "Google", r: "STEP Intern", d: "Starts Tomorrow", a: 89, s: "Upcoming", cl: "indigo" },
//               { c: "Microsoft", r: "Software Eng.", d: "Closed Yesterday", a: 312, s: "Processing", cl: "amber" },
//               { c: "Zomato", r: "Backend Dev", d: "Draft Mode", a: 0, s: "Draft", cl: "slate" },
//             ].map((drive, i) => (
//               <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setActiveTab('drives')}>
//                 <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">{drive.c[0]}</div>
//                   {drive.c}
//                 </td>
//                 <td className="px-6 py-4 text-slate-600">{drive.r}</td>
//                 <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-2"><Calendar size={12}/> {drive.d}</td>
//                 <td className="px-6 py-4 font-mono font-bold text-slate-700">{drive.a}</td>
//                 <td className="px-6 py-4"><Badge color={drive.cl}>{drive.s}</Badge></td>
//                 <td className="px-6 py-4 text-right">
//                   <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Manage <ArrowRight size={12}/></button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   </div>
// );

// const StudentsDatabase = () => (
//   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] animate-in fade-in zoom-in duration-300">
//     <div className="p-6 border-b border-slate-100 flex justify-between items-center">
//        <div>
//          <h2 className="text-lg font-bold text-slate-900">Students Database</h2>
//          <p className="text-sm text-slate-500">View and filter all registered students</p>
//        </div>
//        <div className="flex gap-2">
//          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"><Filter size={16}/> Filter</button>
//          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Download size={16}/> Export CSV</button>
//        </div>
//     </div>
//     <table className="w-full text-left text-sm">
//        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//           <tr>
//              <th className="px-6 py-3">Student Name</th>
//              <th className="px-6 py-3">Branch</th>
//              <th className="px-6 py-3">CGPA</th>
//              <th className="px-6 py-3">Hub Score</th>
//              <th className="px-6 py-3">Status</th>
//              <th className="px-6 py-3 text-right">Actions</th>
//           </tr>
//        </thead>
//        <tbody className="divide-y divide-slate-100">
//           {[
//             { n: "Saksham Bhardwaj", b: "CSE AIML", c: "9.2", h: "1850", s: "Unplaced", sc: "rose" },
//             { n: "Aditya Sharma", b: "CSE Core", c: "8.8", h: "1620", s: "Placed (Amazon)", sc: "emerald" },
//             { n: "Priya Singh", b: "IT", c: "8.5", h: "1450", s: "Unplaced", sc: "rose" },
//             { n: "Rahul Verma", b: "ECE", c: "7.9", h: "1200", s: "Unplaced", sc: "rose" },
//           ].map((s, i) => (
//              <tr key={i} className="hover:bg-slate-50">
//                 <td className="px-6 py-4 font-bold text-slate-900">{s.n}</td>
//                 <td className="px-6 py-4 text-slate-600">{s.b}</td>
//                 <td className="px-6 py-4 font-mono">{s.c}</td>
//                 <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{s.h}</td>
//                 <td className="px-6 py-4"><Badge color={s.sc}>{s.s}</Badge></td>
//                 <td className="px-6 py-4 text-right"><button className="text-indigo-600 hover:underline font-bold text-xs">View Profile</button></td>
//              </tr>
//           ))}
//        </tbody>
//     </table>
//   </div>
// );

// const ManageDrives = () => (
//   <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
//     <div className="flex justify-between items-center">
//        <h2 className="text-xl font-bold text-slate-900">Manage Recruitment Drives</h2>
//        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Create New Drive</button>
//     </div>
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//        {[
//          { c: "Amazon", r: "SDE-1", s: "Live", a: 142 },
//          { c: "Google", r: "STEP Intern", s: "Upcoming", a: 89 },
//          { c: "Microsoft", r: "SWE", s: "Processing", a: 312 },
//          { c: "Zomato", r: "Backend", s: "Draft", a: 0 },
//        ].map((d, i) => (
//          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
//             <div className="flex justify-between items-start mb-4">
//                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">{d.c[0]}</div>
//                <Badge color={d.s === 'Live' ? 'emerald' : d.s === 'Upcoming' ? 'indigo' : 'slate'}>{d.s}</Badge>
//             </div>
//             <h3 className="font-bold text-lg text-slate-900">{d.c}</h3>
//             <p className="text-slate-500 text-sm mb-4">{d.r}</p>
//             <div className="flex justify-between items-center pt-4 border-t border-slate-100">
//                <span className="text-xs font-bold text-slate-500">{d.a} Applicants</span>
//                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors"/>
//             </div>
//          </div>
//        ))}
//     </div>
//   </div>
// );

// const ReportsAnalytics = () => (
//   <div className="flex flex-col items-center justify-center h-[500px] text-center bg-white rounded-2xl border border-slate-200 border-dashed animate-in fade-in zoom-in duration-300">
//      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><FileText size={32} className="text-indigo-600"/></div>
//      <h3 className="text-xl font-bold text-slate-900">Reports & Analytics</h3>
//      <p className="text-slate-500 max-w-sm mb-6">Detailed placement statistics and downloadable reports will appear here.</p>
//      <button className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Download Summary Report</button>
//   </div>
// );

// // ==========================================
// // 3. FACULTY DASHBOARD (Main Wrapper)
// // ==========================================

// const FacultyDashboard = () => {
//   const [activeTab, setActiveTab] = useState('dashboard'); 
  
//   const renderContent = () => {
//     switch(activeTab) {
//       case 'dashboard': return <CommandCenter setActiveTab={setActiveTab} />;
//       case 'students': return <StudentsDatabase />;
//       case 'drives': return <ManageDrives />;
//       case 'reports': return <ReportsAnalytics />;
//       default: return <CommandCenter />;
//     }
//   };

//   const SidebarBtn = ({ id, icon: Icon, label }) => (
//     <button 
//       onClick={() => setActiveTab(id)}
//       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
//     >
//       <Icon size={18}/> {label}
//     </button>
//   );

//   return (
//     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
//       <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col border-r border-slate-800">
//         <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
//           <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
//           <span className="text-xl font-bold tracking-tight">SkillSync</span>
//         </div>
//         <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</div>
//            <SidebarBtn id="dashboard" icon={LayoutDashboard} label="Command Center" />
//            <SidebarBtn id="students" icon={Users} label="Students Database" />
//            <SidebarBtn id="drives" icon={Briefcase} label="Manage Drives" />
//            <SidebarBtn id="reports" icon={FileText} label="Reports & Analytics" />
           
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Recent Activity</div>
//            <div className="px-3 space-y-4">
//               {[{ u: "Rahul V.", a: "applied for Amazon", t: "2m ago" }, { u: "Priya S.", a: "completed Mock Test", t: "15m ago" }].map((item, i) => (
//                 <div key={i} className="flex gap-3 items-start">
//                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
//                    <div><p className="text-xs text-slate-300"><span className="font-bold text-white">{item.u}</span> {item.a}</p><p className="text-[10px] text-slate-600">{item.t}</p></div>
//                 </div>
//               ))}
//            </div>
//         </nav>
//         <div className="p-4 border-t border-slate-800"><Link to="/" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><LogOut size={16}/> Sign Out</Link></div>
//       </aside>

//       <main className="w-full md:ml-64 flex-1 p-4 md:p-8 overflow-y-auto">
//         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//            <div>
//               <h1 className="text-2xl font-bold text-slate-900">{activeTab === 'dashboard' ? 'Command Center' : activeTab === 'students' ? 'Students Database' : activeTab === 'drives' ? 'Recruitment Drives' : 'Analytics'}</h1>
//               <p className="text-slate-500 text-sm">Placement Season 2026 • Term 2</p>
//            </div>
//            <div className="flex items-center gap-4">
//              {activeTab === 'students' && (<div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2 text-sm text-slate-500"><Search size={16}/> <input placeholder="Search students..." className="outline-none text-xs w-40"/></div>)}
//              <button onClick={() => setActiveTab('drives')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all"><Plus size={18}/> Create Drive</button>
//            </div>
//         </header>
//         {renderContent()}
//       </main>
//     </div>
//   );
// };

// // ==========================================
// // 4. STUDENT MODULE (Dashboard, Sandbox, Vault, Upload)
// // ==========================================

// const UserDropdown = ({ name, role, avatar }) => (
//   <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
//     <div className="text-right hidden lg:block"><p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role}</p></div><div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">{avatar}</div><ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600" />
//   </div>
// );

// const StudentDashboard = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const isActive = (path) => location.pathname === path ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50";

//   return (
//     <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
//       <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center gap-3">
//               <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
//               <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}><div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-5 h-5 fill-current"/></div><span className="font-bold text-xl tracking-tight hidden sm:block">SkillSync</span></div>
//             </div>
//             <div className="hidden md:flex items-center gap-1">
//               <Link to="/student" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student')}`}><LayoutDashboard size={16} /> Cockpit</Link>
//               <Link to="/student/drives" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student/drives')}`}><Briefcase size={16} /> Drives</Link>
//               <Link to="/sandbox" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/sandbox')}`}><Code size={16} /> Arena</Link>
//             </div>
//             <div className="flex items-center gap-4">
//               <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span></button>
//               <UserDropdown name="Saksham B." role="Alpha Batch" avatar="SB" />
//             </div>
//           </div>
//         </div>
//         {mobileMenuOpen && (<div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl z-50"><div className="p-4 space-y-2"><Link to="/student" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-indigo-50 text-indigo-600"><LayoutDashboard size={18}/> Cockpit</Link><Link to="/student/drives" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Briefcase size={18}/> Drives</Link><Link to="/sandbox" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Code size={18}/> Arena</Link><div className="h-px bg-slate-100 my-2"></div><button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"><LogOut size={18} /> Sign Out</button></div></div>)}
//       </nav>

//       <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
//         <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl relative overflow-hidden">
//           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
//             <div>
//               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider mb-4"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live System</div>
//               <h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back, Saksham</h1>
//               <p className="text-slate-400 text-lg mb-6">Your placement probability has increased by <span className="text-emerald-400 font-bold">12%</span> this week.</p>
//               <div className="flex gap-4"><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Current Rank</span><span className="text-3xl font-black">1450</span></div><div className="w-px bg-white/10 h-10 self-center"></div><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Hub Score</span><span className="text-3xl font-black text-indigo-400">850</span></div></div>
//             </div>
//             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm lg:max-w-md ml-auto w-full">
//               <div className="flex justify-between items-end mb-4"><div><h3 className="font-bold text-lg">Profile Strength</h3><p className="text-slate-400 text-sm">Resume & Portfolio</p></div><span className="text-2xl font-bold text-indigo-400">70%</span></div>
//               <div className="w-full bg-slate-700 h-3 rounded-full mb-4 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[70%] rounded-full relative"></div></div>
//               <div className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20"><AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" /><div><p className="text-amber-200 text-xs font-bold mb-1">Action Required</p><p className="text-amber-100/70 text-xs">Add a GitHub project link to reach 80% completeness.</p></div></div>
//             </div>
//           </div>
//           <div className="absolute -top-24 -right-24 text-white/5 rotate-12"><TrendingUp size={400} /></div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Target size={20}/></div><div><h3 className="font-bold text-slate-800">Your Status</h3><p className="text-xs text-slate-500 font-bold uppercase">Academic & Skill</p></div></div><div className="space-y-4"><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Batch Category</span><Badge color="indigo">Alpha Batch</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">AMCAT Quant</span><Badge color="emerald">Top 10%</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Logical Ability</span><Badge color="emerald">Top 15%</Badge></div></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50 relative overflow-hidden"><div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">URGENT</div><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Bell size={20}/></div><div><h3 className="font-bold text-slate-800">Pending Actions</h3><p className="text-xs text-slate-500 font-bold uppercase">1 Deadline Today</p></div></div><div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4"><div className="flex justify-between items-start mb-2"><p className="text-sm font-bold text-slate-900">Amazon SDE Drive</p><span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Ends 5 PM</span></div><p className="text-xs text-slate-500 mb-3">You have been shortlisted. Verify resume to confirm seat.</p><button onClick={() => navigate('/student/upload')} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Upload Resume</button></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4"><div className="mb-2"><h3 className="font-bold text-slate-800">Quick Access</h3><p className="text-xs text-slate-500 font-bold uppercase">Tools & Resources</p></div><button onClick={() => navigate('/sandbox')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Code size={18} className="text-indigo-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Open Sandbox</h4><p className="text-[10px] text-slate-400">Practice coding</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button><button onClick={() => navigate('/student/vault')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><BookOpen size={18} className="text-emerald-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Company Vault</h4><p className="text-[10px] text-slate-400">Read experiences</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button></div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Sandbox = () => {
//   const [analyzing, setAnalyzing] = useState(false); const [result, setResult] = useState(null); const runSimulation = () => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setResult(true); }, 2000); };
//   return (<div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden"><div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-r border-slate-200 bg-white h-1/2 md:h-full overflow-y-auto"><div className="mb-6"><Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link><h1 className="text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1><p className="text-slate-500 text-sm">Paste a JD below to simulate how the AI matches you.</p></div><div className="flex-1 flex flex-col gap-4"><select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"><option>Amazon SDE - 2024</option><option>Microsoft IDC</option></select><textarea className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={`Role: SDE-1...`} /><button onClick={runSimulation} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all">{analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} {analyzing ? "AI is Analyzing..." : "Run Simulation"}</button></div></div><div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto h-1/2 md:h-full">{!result && !analyzing && (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><LayoutDashboard size={48} className="mb-4"/><p className="font-bold">Waiting for Input...</p></div>)}{result && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p><div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600"><span className="text-3xl font-black text-slate-900">65%</span></div></div><div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100"><tr className="bg-emerald-50/50"><td className="p-4 font-bold text-slate-700">DSA</td><td className="p-4 font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> Found</td></tr><tr className="bg-rose-50/50"><td className="p-4 font-bold text-slate-700">AWS</td><td className="p-4 font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={14}/> Missing</td></tr></tbody></table></div></div>)}</div></div>);
// };

// const StudentUpload = () => {
//   const [step, setStep] = useState('upload'); const navigate = useNavigate(); const handleUpload = () => { setStep('processing'); setTimeout(() => setStep('done'), 2000); };
//   return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans text-slate-900"><div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden">{step === 'upload' && (<><button onClick={() => navigate('/student')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600"><ArrowRight className="rotate-180"/></button><div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><UploadCloud className="w-8 h-8 text-indigo-600" /></div><h2 className="text-2xl font-bold mb-2">Amazon SDE Drive</h2><p className="text-slate-500 mb-8">Upload your resume to confirm participation.</p><div onClick={handleUpload} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors group"><span className="font-bold text-indigo-600 group-hover:scale-105 transition-transform">Click to Upload PDF</span></div></>)}{step === 'processing' && (<div className="py-10"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" /><h3 className="text-lg font-bold">Verifying Resume...</h3></div>)}{step === 'done' && (<div className="py-6 animate-in zoom-in duration-300"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div><h3 className="text-2xl font-bold">Application Sent!</h3><button onClick={() => navigate('/student')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full mt-6">Back to Cockpit</button></div>)}</div></div>);
// };

// const CompanyVault = () => (<div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center"><h1 className="text-3xl font-black text-slate-900 mb-2">Company Vault</h1><p className="text-slate-500 max-w-md mb-8">Access previous year questions.</p><Link to="/student" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">← Back</Link></div>);

// // ==========================================
// // 5. LANDING PAGE (Final Fit for Local Image)
// // ==========================================
// const LandingPage = () => (
//   <div className="h-screen w-screen bg-[#0f172a] font-sans overflow-hidden flex flex-col lg:flex-row">
    
//     {/* LEFT SIDE: Content */}
//     <div className="w-full lg:w-[45%] h-full flex flex-col justify-center p-12 lg:p-20 relative z-20 bg-[#0f172a] border-r border-slate-800">
//        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
//        <div className="relative z-10">
//          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-bold w-fit mb-8 animate-[fade-in-up_1s]">
//            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
//            Placement Season 2026 Live
//          </div>
//          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">Skill<span className="text-indigo-500">Sync.</span></h1>
//          <p className="text-slate-400 text-lg lg:text-xl max-w-lg mb-10 leading-relaxed font-medium">The AI-Native Placement Ecosystem. We bridge the gap between talent and opportunity with <span className="text-white font-bold"> intelligent matching.</span></p>
//          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
//             <Link to="/student" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-500/50 to-indigo-900/10 hover:to-indigo-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-400"><Users size={24}/></div><div><h3 className="text-lg font-bold text-white">Student</h3><p className="text-xs text-slate-400">Login to Cockpit</p></div></div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-indigo-500 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//             <Link to="/faculty" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-500/50 to-emerald-900/10 hover:to-emerald-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400"><LayoutDashboard size={24}/></div><div><h3 className="text-lg font-bold text-white">Faculty</h3><p className="text-xs text-slate-400">Admin Dashboard</p></div></div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-emerald-500 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//          </div>
//        </div>
//     </div>

//     {/* RIGHT SIDE - REAL WORLD VISUALS - UPDATED! */}
//     <div className="hidden lg:block w-[55%] h-full relative overflow-hidden bg-slate-950">
       
//        {/* 1. BACKGROUND BLUR (Fills the black bars) */}
//        <div 
//          className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl scale-110"
//          style={{ backgroundImage: "url('/upes.jpg')" }}
//        ></div>

//        {/* 2. MAIN IMAGE (Centered & Complete) */}
//        <div className="absolute inset-0 flex items-center justify-center p-8">
//           <img 
//             src="/upes.jpg" 
//             onError={(e) => {e.target.onerror = null; e.target.src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/UPES_Campus.jpg/1280px-UPES_Campus.jpg"}}
//             alt="UPES Campus" 
//             className="w-full h-auto max-h-full object-contain rounded-2xl shadow-2xl border border-slate-700/50 relative z-10"
//           />
//        </div>

//        {/* 3. Gradient Overlay */}
//        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-900/20 to-[#0f172a] z-20 pointer-events-none"></div>

//        {/* 4. Realistic Cards (Overlaid on top) */}
//        <div className="absolute top-1/4 right-20 animate-[fade-in_1s_ease-out_0.5s_both] z-30">
//           <div className="bg-white p-4 pr-8 rounded-xl shadow-2xl shadow-black/50 border-l-4 border-emerald-500 flex items-center gap-4">
//              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><CheckCircle size={24} fill="currentColor" className="text-emerald-100 stroke-emerald-600"/></div>
//              <div><h4 className="font-bold text-slate-800 text-sm">Resume Verified</h4><p className="text-slate-500 text-xs">Ready for Amazon Drive</p></div>
//           </div>
//        </div>

//        <div className="absolute bottom-1/4 right-32 animate-[fade-in_1s_ease-out_1s_both] z-30">
//           <div className="bg-slate-800 p-5 rounded-2xl shadow-2xl shadow-black/50 border border-slate-700 w-64">
//              <div className="flex justify-between items-center mb-4"><span className="text-slate-400 text-xs font-bold uppercase">Placement Rate</span><span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">2026 Batch</span></div>
//              <div className="flex items-end gap-2"><span className="text-4xl font-black text-white">94%</span><span className="text-emerald-400 text-sm font-bold mb-1">▲ 12%</span></div>
//              <div className="flex items-end gap-1 h-8 mt-4 opacity-50">
//                 <div className="w-1/5 bg-indigo-400 h-4 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-6 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-5 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-8 rounded-t"></div>
//                 <div className="w-1/5 bg-emerald-400 h-full rounded-t"></div>
//              </div>
//           </div>
//        </div>
//     </div>
//   </div>
// );

// // ==========================================
// // 6. APP ROUTER
// // ==========================================
// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<LandingPage />} />
//         <Route path="/student" element={<StudentDashboard />} />
//         <Route path="/student/upload" element={<StudentUpload />} />
//         <Route path="/student/vault" element={<CompanyVault />} />
//         <Route path="/student/drives" element={<div className="p-10 text-center font-bold text-slate-500">Drives Page (Coming Soon)</div>} />
//         <Route path="/faculty" element={<FacultyDashboard />} />
//         <Route path="/sandbox" element={<Sandbox />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;


































// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
// import { 
//   UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
//   Users, Code, LogOut, Search, Play, TrendingUp, AlertTriangle, 
//   Briefcase, Bell, Menu, X, BookOpen, Star, Target, ChevronDown, 
//   Filter, Calendar, FileText, Plus, Download, Building2
// } from 'lucide-react';

// // ==========================================
// // 1. SHARED COMPONENTS
// // ==========================================

// const Badge = ({ children, color = "indigo" }) => {
//   const colors = {
//     indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
//     emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
//     rose: "bg-rose-50 text-rose-700 border-rose-100",
//     amber: "bg-amber-50 text-amber-700 border-amber-100",
//     slate: "bg-slate-100 text-slate-600 border-slate-200",
//   };
//   return (
//     <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[color] || colors.slate}`}>
//       {children}
//     </span>
//   );
// };

// const StatCard = ({ label, value, sub, color="slate", highlight=false }) => {
//   const colors = {
//     emerald: "text-emerald-600",
//     rose: "text-rose-500",
//     indigo: "text-indigo-600",
//     slate: "text-slate-900"
//   };
//   return (
//     <div className={`bg-white p-6 rounded-2xl border ${highlight ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-200'} shadow-sm transition-all hover:shadow-md`}>
//       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
//       <h3 className={`text-4xl font-black ${colors[color]}`}>{value}</h3>
//       <p className={`text-xs mt-1 font-medium opacity-80 ${colors[color]}`}>{sub}</p>
//     </div>
//   );
// };

// // ==========================================
// // 2. FACULTY SUB-SCREENS
// // ==========================================

// const CommandCenter = ({ setActiveTab }) => (
//   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
//        <StatCard label="Total Students" value="500" sub="Across 4 branches" />
//        <StatCard label="Placed" value="350" sub="70% Success Rate" color="emerald" />
//        <StatCard label="Unplaced" value="150" sub="Actively seeking" color="rose" />
//        <StatCard label="Active Drives" value="12" sub="Open opportunities" color="indigo" highlight />
//     </div>

//     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//       <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
//          <div>
//            <h3 className="font-bold text-slate-800">Live Drive Monitor</h3>
//            <p className="text-xs text-slate-500">Real-time tracking of active recruitment processes</p>
//          </div>
//          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Filter size={18}/></button>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full text-left text-sm">
//           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//             <tr>
//               <th className="px-6 py-3">Company Name</th>
//               <th className="px-6 py-3">Role Profile</th>
//               <th className="px-6 py-3">Timeline</th>
//               <th className="px-6 py-3">Applicants</th>
//               <th className="px-6 py-3">Status</th>
//               <th className="px-6 py-3 text-right">Action</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {[
//               { c: "Amazon", r: "SDE-1", d: "Ends Today, 5 PM", a: 142, s: "Live", cl: "emerald" },
//               { c: "Google", r: "STEP Intern", d: "Starts Tomorrow", a: 89, s: "Upcoming", cl: "indigo" },
//               { c: "Microsoft", r: "Software Eng.", d: "Closed Yesterday", a: 312, s: "Processing", cl: "amber" },
//               { c: "Zomato", r: "Backend Dev", d: "Draft Mode", a: 0, s: "Draft", cl: "slate" },
//             ].map((drive, i) => (
//               <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setActiveTab('drives')}>
//                 <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">{drive.c[0]}</div>
//                   {drive.c}
//                 </td>
//                 <td className="px-6 py-4 text-slate-600">{drive.r}</td>
//                 <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-2"><Calendar size={12}/> {drive.d}</td>
//                 <td className="px-6 py-4 font-mono font-bold text-slate-700">{drive.a}</td>
//                 <td className="px-6 py-4"><Badge color={drive.cl}>{drive.s}</Badge></td>
//                 <td className="px-6 py-4 text-right">
//                   <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Manage <ArrowRight size={12}/></button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   </div>
// );

// const StudentsDatabase = () => (
//   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] animate-in fade-in zoom-in duration-300">
//     <div className="p-6 border-b border-slate-100 flex justify-between items-center">
//        <div>
//          <h2 className="text-lg font-bold text-slate-900">Students Database</h2>
//          <p className="text-sm text-slate-500">View and filter all registered students</p>
//        </div>
//        <div className="flex gap-2">
//          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"><Filter size={16}/> Filter</button>
//          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Download size={16}/> Export CSV</button>
//        </div>
//     </div>
//     <table className="w-full text-left text-sm">
//        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//           <tr>
//              <th className="px-6 py-3">Student Name</th>
//              <th className="px-6 py-3">Branch</th>
//              <th className="px-6 py-3">CGPA</th>
//              <th className="px-6 py-3">Hub Score</th>
//              <th className="px-6 py-3">Status</th>
//              <th className="px-6 py-3 text-right">Actions</th>
//           </tr>
//        </thead>
//        <tbody className="divide-y divide-slate-100">
//           {[
//             { n: "Saksham Bhardwaj", b: "CSE AIML", c: "9.2", h: "1850", s: "Unplaced", sc: "rose" },
//             { n: "Aditya Sharma", b: "CSE Core", c: "8.8", h: "1620", s: "Placed (Amazon)", sc: "emerald" },
//             { n: "Priya Singh", b: "IT", c: "8.5", h: "1450", s: "Unplaced", sc: "rose" },
//             { n: "Rahul Verma", b: "ECE", c: "7.9", h: "1200", s: "Unplaced", sc: "rose" },
//           ].map((s, i) => (
//              <tr key={i} className="hover:bg-slate-50">
//                 <td className="px-6 py-4 font-bold text-slate-900">{s.n}</td>
//                 <td className="px-6 py-4 text-slate-600">{s.b}</td>
//                 <td className="px-6 py-4 font-mono">{s.c}</td>
//                 <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{s.h}</td>
//                 <td className="px-6 py-4"><Badge color={s.sc}>{s.s}</Badge></td>
//                 <td className="px-6 py-4 text-right"><button className="text-indigo-600 hover:underline font-bold text-xs">View Profile</button></td>
//              </tr>
//           ))}
//        </tbody>
//     </table>
//   </div>
// );

// const ManageDrives = () => (
//   <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
//     <div className="flex justify-between items-center">
//        <h2 className="text-xl font-bold text-slate-900">Manage Recruitment Drives</h2>
//        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Create New Drive</button>
//     </div>
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//        {[
//          { c: "Amazon", r: "SDE-1", s: "Live", a: 142 },
//          { c: "Google", r: "STEP Intern", s: "Upcoming", a: 89 },
//          { c: "Microsoft", r: "SWE", s: "Processing", a: 312 },
//          { c: "Zomato", r: "Backend", s: "Draft", a: 0 },
//        ].map((d, i) => (
//          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
//             <div className="flex justify-between items-start mb-4">
//                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">{d.c[0]}</div>
//                <Badge color={d.s === 'Live' ? 'emerald' : d.s === 'Upcoming' ? 'indigo' : 'slate'}>{d.s}</Badge>
//             </div>
//             <h3 className="font-bold text-lg text-slate-900">{d.c}</h3>
//             <p className="text-slate-500 text-sm mb-4">{d.r}</p>
//             <div className="flex justify-between items-center pt-4 border-t border-slate-100">
//                <span className="text-xs font-bold text-slate-500">{d.a} Applicants</span>
//                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors"/>
//             </div>
//          </div>
//        ))}
//     </div>
//   </div>
// );

// const ReportsAnalytics = () => (
//   <div className="flex flex-col items-center justify-center h-[500px] text-center bg-white rounded-2xl border border-slate-200 border-dashed animate-in fade-in zoom-in duration-300">
//      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><FileText size={32} className="text-indigo-600"/></div>
//      <h3 className="text-xl font-bold text-slate-900">Reports & Analytics</h3>
//      <p className="text-slate-500 max-w-sm mb-6">Detailed placement statistics and downloadable reports will appear here.</p>
//      <button className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Download Summary Report</button>
//   </div>
// );

// // ==========================================
// // 3. FACULTY DASHBOARD (Main Wrapper)
// // ==========================================

// const FacultyDashboard = () => {
//   const [activeTab, setActiveTab] = useState('dashboard'); 
  
//   const renderContent = () => {
//     switch(activeTab) {
//       case 'dashboard': return <CommandCenter setActiveTab={setActiveTab} />;
//       case 'students': return <StudentsDatabase />;
//       case 'drives': return <ManageDrives />;
//       case 'reports': return <ReportsAnalytics />;
//       default: return <CommandCenter />;
//     }
//   };

//   const SidebarBtn = ({ id, icon: Icon, label }) => (
//     <button 
//       onClick={() => setActiveTab(id)}
//       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
//     >
//       <Icon size={18}/> {label}
//     </button>
//   );

//   return (
//     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
//       <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col border-r border-slate-800">
//         <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
//           <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
//           <span className="text-xl font-bold tracking-tight">SkillSync</span>
//         </div>
//         <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</div>
//            <SidebarBtn id="dashboard" icon={LayoutDashboard} label="Command Center" />
//            <SidebarBtn id="students" icon={Users} label="Students Database" />
//            <SidebarBtn id="drives" icon={Briefcase} label="Manage Drives" />
//            <SidebarBtn id="reports" icon={FileText} label="Reports & Analytics" />
           
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Recent Activity</div>
//            <div className="px-3 space-y-4">
//               {[{ u: "Rahul V.", a: "applied for Amazon", t: "2m ago" }, { u: "Priya S.", a: "completed Mock Test", t: "15m ago" }].map((item, i) => (
//                 <div key={i} className="flex gap-3 items-start">
//                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
//                    <div><p className="text-xs text-slate-300"><span className="font-bold text-white">{item.u}</span> {item.a}</p><p className="text-[10px] text-slate-600">{item.t}</p></div>
//                 </div>
//               ))}
//            </div>
//         </nav>
//         <div className="p-4 border-t border-slate-800"><Link to="/" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><LogOut size={16}/> Sign Out</Link></div>
//       </aside>

//       <main className="w-full md:ml-64 flex-1 p-4 md:p-8 overflow-y-auto">
//         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//            <div>
//               <h1 className="text-2xl font-bold text-slate-900">{activeTab === 'dashboard' ? 'Command Center' : activeTab === 'students' ? 'Students Database' : activeTab === 'drives' ? 'Recruitment Drives' : 'Analytics'}</h1>
//               <p className="text-slate-500 text-sm">Placement Season 2026 • Term 2</p>
//            </div>
//            <div className="flex items-center gap-4">
//              {activeTab === 'students' && (<div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2 text-sm text-slate-500"><Search size={16}/> <input placeholder="Search students..." className="outline-none text-xs w-40"/></div>)}
//              <button onClick={() => setActiveTab('drives')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all"><Plus size={18}/> Create Drive</button>
//            </div>
//         </header>
//         {renderContent()}
//       </main>
//     </div>
//   );
// };

// // ==========================================
// // 4. STUDENT MODULE (Dashboard, Sandbox, Vault, Upload)
// // ==========================================

// const UserDropdown = ({ name, role, avatar }) => (
//   <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
//     <div className="text-right hidden lg:block"><p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role}</p></div><div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">{avatar}</div><ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600" />
//   </div>
// );

// const StudentDashboard = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const isActive = (path) => location.pathname === path ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50";

//   return (
//     <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
//       <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center gap-3">
//               <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
//               <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}><div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-5 h-5 fill-current"/></div><span className="font-bold text-xl tracking-tight hidden sm:block">SkillSync</span></div>
//             </div>
//             <div className="hidden md:flex items-center gap-1">
//               <Link to="/student" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student')}`}><LayoutDashboard size={16} /> Cockpit</Link>
//               <Link to="/student/drives" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student/drives')}`}><Briefcase size={16} /> Drives</Link>
//               <Link to="/sandbox" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/sandbox')}`}><Code size={16} /> Arena</Link>
//             </div>
//             <div className="flex items-center gap-4">
//               <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span></button>
//               <UserDropdown name="Saksham B." role="Alpha Batch" avatar="SB" />
//             </div>
//           </div>
//         </div>
//         {mobileMenuOpen && (<div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl z-50"><div className="p-4 space-y-2"><Link to="/student" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-indigo-50 text-indigo-600"><LayoutDashboard size={18}/> Cockpit</Link><Link to="/student/drives" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Briefcase size={18}/> Drives</Link><Link to="/sandbox" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Code size={18}/> Arena</Link><div className="h-px bg-slate-100 my-2"></div><button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"><LogOut size={18} /> Sign Out</button></div></div>)}
//       </nav>

//       <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
//         <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl relative overflow-hidden">
//           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
//             <div>
//               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider mb-4"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live System</div>
//               <h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back, Saksham</h1>
//               <p className="text-slate-400 text-lg mb-6">Your placement probability has increased by <span className="text-emerald-400 font-bold">12%</span> this week.</p>
//               <div className="flex gap-4"><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Current Rank</span><span className="text-3xl font-black">1450</span></div><div className="w-px bg-white/10 h-10 self-center"></div><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Hub Score</span><span className="text-3xl font-black text-indigo-400">850</span></div></div>
//             </div>
//             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm lg:max-w-md ml-auto w-full">
//               <div className="flex justify-between items-end mb-4"><div><h3 className="font-bold text-lg">Profile Strength</h3><p className="text-slate-400 text-sm">Resume & Portfolio</p></div><span className="text-2xl font-bold text-indigo-400">70%</span></div>
//               <div className="w-full bg-slate-700 h-3 rounded-full mb-4 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[70%] rounded-full relative"></div></div>
//               <div className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20"><AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" /><div><p className="text-amber-200 text-xs font-bold mb-1">Action Required</p><p className="text-amber-100/70 text-xs">Add a GitHub project link to reach 80% completeness.</p></div></div>
//             </div>
//           </div>
//           <div className="absolute -top-24 -right-24 text-white/5 rotate-12"><TrendingUp size={400} /></div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Target size={20}/></div><div><h3 className="font-bold text-slate-800">Your Status</h3><p className="text-xs text-slate-500 font-bold uppercase">Academic & Skill</p></div></div><div className="space-y-4"><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Batch Category</span><Badge color="indigo">Alpha Batch</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">AMCAT Quant</span><Badge color="emerald">Top 10%</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Logical Ability</span><Badge color="emerald">Top 15%</Badge></div></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50 relative overflow-hidden"><div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">URGENT</div><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Bell size={20}/></div><div><h3 className="font-bold text-slate-800">Pending Actions</h3><p className="text-xs text-slate-500 font-bold uppercase">1 Deadline Today</p></div></div><div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4"><div className="flex justify-between items-start mb-2"><p className="text-sm font-bold text-slate-900">Amazon SDE Drive</p><span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Ends 5 PM</span></div><p className="text-xs text-slate-500 mb-3">You have been shortlisted. Verify resume to confirm seat.</p><button onClick={() => navigate('/student/upload')} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Upload Resume</button></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4"><div className="mb-2"><h3 className="font-bold text-slate-800">Quick Access</h3><p className="text-xs text-slate-500 font-bold uppercase">Tools & Resources</p></div><button onClick={() => navigate('/sandbox')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Code size={18} className="text-indigo-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Open Sandbox</h4><p className="text-[10px] text-slate-400">Practice coding</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button><button onClick={() => navigate('/student/vault')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><BookOpen size={18} className="text-emerald-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Company Vault</h4><p className="text-[10px] text-slate-400">Read experiences</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button></div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Sandbox = () => {
//   const [analyzing, setAnalyzing] = useState(false); const [result, setResult] = useState(null); const runSimulation = () => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setResult(true); }, 2000); };
//   return (<div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden"><div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-r border-slate-200 bg-white h-1/2 md:h-full overflow-y-auto"><div className="mb-6"><Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link><h1 className="text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1><p className="text-slate-500 text-sm">Paste a JD below to simulate how the AI matches you.</p></div><div className="flex-1 flex flex-col gap-4"><select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"><option>Amazon SDE - 2024</option><option>Microsoft IDC</option></select><textarea className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={`Role: SDE-1...`} /><button onClick={runSimulation} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all">{analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} {analyzing ? "AI is Analyzing..." : "Run Simulation"}</button></div></div><div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto h-1/2 md:h-full">{!result && !analyzing && (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><LayoutDashboard size={48} className="mb-4"/><p className="font-bold">Waiting for Input...</p></div>)}{result && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p><div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600"><span className="text-3xl font-black text-slate-900">65%</span></div></div><div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100"><tr className="bg-emerald-50/50"><td className="p-4 font-bold text-slate-700">DSA</td><td className="p-4 font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> Found</td></tr><tr className="bg-rose-50/50"><td className="p-4 font-bold text-slate-700">AWS</td><td className="p-4 font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={14}/> Missing</td></tr></tbody></table></div></div>)}</div></div>);
// };

// const StudentUpload = () => {
//   const [step, setStep] = useState('upload'); const navigate = useNavigate(); const handleUpload = () => { setStep('processing'); setTimeout(() => setStep('done'), 2000); };
//   return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans text-slate-900"><div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden">{step === 'upload' && (<><button onClick={() => navigate('/student')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600"><ArrowRight className="rotate-180"/></button><div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><UploadCloud className="w-8 h-8 text-indigo-600" /></div><h2 className="text-2xl font-bold mb-2">Amazon SDE Drive</h2><p className="text-slate-500 mb-8">Upload your resume to confirm participation.</p><div onClick={handleUpload} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors group"><span className="font-bold text-indigo-600 group-hover:scale-105 transition-transform">Click to Upload PDF</span></div></>)}{step === 'processing' && (<div className="py-10"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" /><h3 className="text-lg font-bold">Verifying Resume...</h3></div>)}{step === 'done' && (<div className="py-6 animate-in zoom-in duration-300"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div><h3 className="text-2xl font-bold">Application Sent!</h3><button onClick={() => navigate('/student')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full mt-6">Back to Cockpit</button></div>)}</div></div>);
// };

// const CompanyVault = () => (<div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center"><h1 className="text-3xl font-black text-slate-900 mb-2">Company Vault</h1><p className="text-slate-500 max-w-md mb-8">Access previous year questions.</p><Link to="/student" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">← Back</Link></div>);

// // ==========================================
// // 5. LANDING PAGE (With Local Image Logic)
// // ==========================================
// const LandingPage = () => (
//   <div className="h-screen w-screen bg-[#0f172a] font-sans overflow-hidden flex flex-col lg:flex-row">
    
//     {/* LEFT SIDE: Content */}
//     <div className="w-full lg:w-[45%] h-full flex flex-col justify-center p-12 lg:p-20 relative z-20 bg-[#0f172a] border-r border-slate-800">
//        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
//        <div className="relative z-10">
//          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-bold w-fit mb-8 animate-[fade-in-up_1s]">
//            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
//            Placement Season 2026 Live
//          </div>
//          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">Skill<span className="text-indigo-500">Sync.</span></h1>
//          <p className="text-slate-400 text-lg lg:text-xl max-w-lg mb-10 leading-relaxed font-medium">The AI-Native Placement Ecosystem. We bridge the gap between talent and opportunity with <span className="text-white font-bold"> intelligent matching.</span></p>
//          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
//             <Link to="/student" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-500/50 to-indigo-900/10 hover:to-indigo-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-400"><Users size={24}/></div><div><h3 className="text-lg font-bold text-white">Student</h3><p className="text-xs text-slate-400">Login to Cockpit</p></div></div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-indigo-500 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//             <Link to="/faculty" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-500/50 to-emerald-900/10 hover:to-emerald-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400"><LayoutDashboard size={24}/></div><div><h3 className="text-lg font-bold text-white">Faculty</h3><p className="text-xs text-slate-400">Admin Dashboard</p></div></div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-emerald-500 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//          </div>
//        </div>
//     </div>

//     {/* RIGHT SIDE - REAL WORLD UPES IMAGE FIX */}
//     <div className="hidden lg:block w-[55%] h-full relative overflow-hidden bg-slate-950">
       
//        {/* 1. BLURRED BACKGROUND (Fills the black bars) */}
//        <div 
//          className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-125"
//          style={{ backgroundImage: "url('/upes.jpg')" }}
//        ></div>

//        {/* 2. MAIN IMAGE (Centered & Framed) */}
//        <div className="absolute inset-0 flex items-center justify-center p-8">
//           <img 
//             src="/upes.jpg" 
//             onError={(e) => {e.target.onerror = null; e.target.src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/UPES_Campus.jpg/1280px-UPES_Campus.jpg"}}
//             alt="UPES Campus" 
//             className="w-full max-w-4xl h-auto object-contain rounded-2xl shadow-2xl border border-slate-700/50 relative z-10"
//           />
//        </div>

//        {/* 3. Gradient Overlay */}
//        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-900/10 to-[#0f172a] z-20 pointer-events-none"></div>

//        {/* 4. Realistic Cards (Overlaid on top, positioned relative to image) */}
//        <div className="absolute top-1/3 right-16 animate-[fade-in_1s_ease-out_0.5s_both] z-30">
//           <div className="bg-white/90 backdrop-blur-sm p-4 pr-8 rounded-xl shadow-2xl shadow-black/50 border-l-4 border-emerald-500 flex items-center gap-4">
//              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><CheckCircle size={24} fill="currentColor" className="text-emerald-100 stroke-emerald-600"/></div>
//              <div><h4 className="font-bold text-slate-800 text-sm">Resume Verified</h4><p className="text-slate-500 text-xs">Ready for Amazon Drive</p></div>
//           </div>
//        </div>

//        <div className="absolute bottom-1/4 right-32 animate-[fade-in_1s_ease-out_1s_both] z-30">
//           <div className="bg-slate-900/90 backdrop-blur-sm p-5 rounded-2xl shadow-2xl shadow-black/50 border border-slate-700 w-64">
//              <div className="flex justify-between items-center mb-4"><span className="text-slate-400 text-xs font-bold uppercase">Placement Rate</span><span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">2026 Batch</span></div>
//              <div className="flex items-end gap-2"><span className="text-4xl font-black text-white">94%</span><span className="text-emerald-400 text-sm font-bold mb-1">▲ 12%</span></div>
//              <div className="flex items-end gap-1 h-8 mt-4 opacity-50">
//                 <div className="w-1/5 bg-indigo-400 h-4 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-6 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-5 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-8 rounded-t"></div>
//                 <div className="w-1/5 bg-emerald-400 h-full rounded-t"></div>
//              </div>
//           </div>
//        </div>
//     </div>
//   </div>
// );

// // ==========================================
// // 6. APP ROUTER
// // ==========================================
// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<LandingPage />} />
//         <Route path="/student" element={<StudentDashboard />} />
//         <Route path="/student/upload" element={<StudentUpload />} />
//         <Route path="/student/vault" element={<CompanyVault />} />
//         <Route path="/student/drives" element={<div className="p-10 text-center font-bold text-slate-500">Drives Page (Coming Soon)</div>} />
//         <Route path="/faculty" element={<FacultyDashboard />} />
//         <Route path="/sandbox" element={<Sandbox />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;























































// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
// import { 
//   UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
//   Users, Code, LogOut, Search, Play, TrendingUp, AlertTriangle, 
//   Briefcase, Bell, Menu, X, BookOpen, Star, Target, ChevronDown, 
//   Filter, Calendar, FileText, Plus, Download
// } from 'lucide-react';

// // ==========================================
// // 1. SHARED COMPONENTS
// // ==========================================

// const Badge = ({ children, color = "indigo" }) => {
//   const colors = {
//     indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
//     emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
//     rose: "bg-rose-50 text-rose-700 border-rose-100",
//     amber: "bg-amber-50 text-amber-700 border-amber-100",
//     slate: "bg-slate-100 text-slate-600 border-slate-200",
//   };
//   return (
//     <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[color] || colors.slate}`}>
//       {children}
//     </span>
//   );
// };

// const StatCard = ({ label, value, sub, color="slate", highlight=false }) => {
//   const colors = {
//     emerald: "text-emerald-600",
//     rose: "text-rose-500",
//     indigo: "text-indigo-600",
//     slate: "text-slate-900"
//   };
//   return (
//     <div className={`bg-white p-6 rounded-2xl border ${highlight ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-200'} shadow-sm transition-all hover:shadow-md`}>
//       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
//       <h3 className={`text-4xl font-black ${colors[color]}`}>{value}</h3>
//       <p className={`text-xs mt-1 font-medium opacity-80 ${colors[color]}`}>{sub}</p>
//     </div>
//   );
// };

// // ==========================================
// // 2. FACULTY SUB-SCREENS
// // ==========================================

// const CommandCenter = ({ setActiveTab }) => (
//   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
//        <StatCard label="Total Students" value="500" sub="Across 4 branches" />
//        <StatCard label="Placed" value="350" sub="70% Success Rate" color="emerald" />
//        <StatCard label="Unplaced" value="150" sub="Actively seeking" color="rose" />
//        <StatCard label="Active Drives" value="12" sub="Open opportunities" color="indigo" highlight />
//     </div>

//     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//       <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
//          <div>
//            <h3 className="font-bold text-slate-800">Live Drive Monitor</h3>
//            <p className="text-xs text-slate-500">Real-time tracking of active recruitment processes</p>
//          </div>
//          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Filter size={18}/></button>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full text-left text-sm">
//           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//             <tr>
//               <th className="px-6 py-3">Company Name</th>
//               <th className="px-6 py-3">Role Profile</th>
//               <th className="px-6 py-3">Timeline</th>
//               <th className="px-6 py-3">Applicants</th>
//               <th className="px-6 py-3">Status</th>
//               <th className="px-6 py-3 text-right">Action</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {[
//               { c: "Amazon", r: "SDE-1", d: "Ends Today, 5 PM", a: 142, s: "Live", cl: "emerald" },
//               { c: "Google", r: "STEP Intern", d: "Starts Tomorrow", a: 89, s: "Upcoming", cl: "indigo" },
//               { c: "Microsoft", r: "Software Eng.", d: "Closed Yesterday", a: 312, s: "Processing", cl: "amber" },
//               { c: "Zomato", r: "Backend Dev", d: "Draft Mode", a: 0, s: "Draft", cl: "slate" },
//             ].map((drive, i) => (
//               <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setActiveTab('drives')}>
//                 <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">{drive.c[0]}</div>
//                   {drive.c}
//                 </td>
//                 <td className="px-6 py-4 text-slate-600">{drive.r}</td>
//                 <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-2"><Calendar size={12}/> {drive.d}</td>
//                 <td className="px-6 py-4 font-mono font-bold text-slate-700">{drive.a}</td>
//                 <td className="px-6 py-4"><Badge color={drive.cl}>{drive.s}</Badge></td>
//                 <td className="px-6 py-4 text-right">
//                   <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Manage <ArrowRight size={12}/></button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   </div>
// );

// const StudentsDatabase = () => (
//   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] animate-in fade-in zoom-in duration-300">
//     <div className="p-6 border-b border-slate-100 flex justify-between items-center">
//        <div>
//          <h2 className="text-lg font-bold text-slate-900">Students Database</h2>
//          <p className="text-sm text-slate-500">View and filter all registered students</p>
//        </div>
//        <div className="flex gap-2">
//          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"><Filter size={16}/> Filter</button>
//          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Download size={16}/> Export CSV</button>
//        </div>
//     </div>
//     <table className="w-full text-left text-sm">
//        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//           <tr>
//              <th className="px-6 py-3">Student Name</th>
//              <th className="px-6 py-3">Branch</th>
//              <th className="px-6 py-3">CGPA</th>
//              <th className="px-6 py-3">Hub Score</th>
//              <th className="px-6 py-3">Status</th>
//              <th className="px-6 py-3 text-right">Actions</th>
//           </tr>
//        </thead>
//        <tbody className="divide-y divide-slate-100">
//           {[
//             { n: "Saksham Bhardwaj", b: "CSE AIML", c: "9.2", h: "1850", s: "Unplaced", sc: "rose" },
//             { n: "Aditya Sharma", b: "CSE Core", c: "8.8", h: "1620", s: "Placed (Amazon)", sc: "emerald" },
//             { n: "Priya Singh", b: "IT", c: "8.5", h: "1450", s: "Unplaced", sc: "rose" },
//             { n: "Rahul Verma", b: "ECE", c: "7.9", h: "1200", s: "Unplaced", sc: "rose" },
//           ].map((s, i) => (
//              <tr key={i} className="hover:bg-slate-50">
//                 <td className="px-6 py-4 font-bold text-slate-900">{s.n}</td>
//                 <td className="px-6 py-4 text-slate-600">{s.b}</td>
//                 <td className="px-6 py-4 font-mono">{s.c}</td>
//                 <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{s.h}</td>
//                 <td className="px-6 py-4"><Badge color={s.sc}>{s.s}</Badge></td>
//                 <td className="px-6 py-4 text-right"><button className="text-indigo-600 hover:underline font-bold text-xs">View Profile</button></td>
//              </tr>
//           ))}
//        </tbody>
//     </table>
//   </div>
// );

// const ManageDrives = () => (
//   <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
//     <div className="flex justify-between items-center">
//        <h2 className="text-xl font-bold text-slate-900">Manage Recruitment Drives</h2>
//        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Create New Drive</button>
//     </div>
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//        {[
//          { c: "Amazon", r: "SDE-1", s: "Live", a: 142 },
//          { c: "Google", r: "STEP Intern", s: "Upcoming", a: 89 },
//          { c: "Microsoft", r: "SWE", s: "Processing", a: 312 },
//          { c: "Zomato", r: "Backend", s: "Draft", a: 0 },
//        ].map((d, i) => (
//          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
//             <div className="flex justify-between items-start mb-4">
//                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">{d.c[0]}</div>
//                <Badge color={d.s === 'Live' ? 'emerald' : d.s === 'Upcoming' ? 'indigo' : 'slate'}>{d.s}</Badge>
//             </div>
//             <h3 className="font-bold text-lg text-slate-900">{d.c}</h3>
//             <p className="text-slate-500 text-sm mb-4">{d.r}</p>
//             <div className="flex justify-between items-center pt-4 border-t border-slate-100">
//                <span className="text-xs font-bold text-slate-500">{d.a} Applicants</span>
//                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors"/>
//             </div>
//          </div>
//        ))}
//     </div>
//   </div>
// );

// const ReportsAnalytics = () => (
//   <div className="flex flex-col items-center justify-center h-[500px] text-center bg-white rounded-2xl border border-slate-200 border-dashed animate-in fade-in zoom-in duration-300">
//      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><FileText size={32} className="text-indigo-600"/></div>
//      <h3 className="text-xl font-bold text-slate-900">Reports & Analytics</h3>
//      <p className="text-slate-500 max-w-sm mb-6">Detailed placement statistics and downloadable reports will appear here.</p>
//      <button className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Download Summary Report</button>
//   </div>
// );

// // ==========================================
// // 3. FACULTY DASHBOARD (Main Wrapper)
// // ==========================================

// const FacultyDashboard = () => {
//   const [activeTab, setActiveTab] = useState('dashboard'); 
  
//   const renderContent = () => {
//     switch(activeTab) {
//       case 'dashboard': return <CommandCenter setActiveTab={setActiveTab} />;
//       case 'students': return <StudentsDatabase />;
//       case 'drives': return <ManageDrives />;
//       case 'reports': return <ReportsAnalytics />;
//       default: return <CommandCenter />;
//     }
//   };

//   const SidebarBtn = ({ id, icon: Icon, label }) => (
//     <button 
//       onClick={() => setActiveTab(id)}
//       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
//     >
//       <Icon size={18}/> {label}
//     </button>
//   );

//   return (
//     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
//       <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col border-r border-slate-800">
//         <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
//           <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
//           <span className="text-xl font-bold tracking-tight">SkillSync</span>
//         </div>
//         <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</div>
//            <SidebarBtn id="dashboard" icon={LayoutDashboard} label="Command Center" />
//            <SidebarBtn id="students" icon={Users} label="Students Database" />
//            <SidebarBtn id="drives" icon={Briefcase} label="Manage Drives" />
//            <SidebarBtn id="reports" icon={FileText} label="Reports & Analytics" />
           
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Recent Activity</div>
//            <div className="px-3 space-y-4">
//               {[{ u: "Rahul V.", a: "applied for Amazon", t: "2m ago" }, { u: "Priya S.", a: "completed Mock Test", t: "15m ago" }].map((item, i) => (
//                 <div key={i} className="flex gap-3 items-start">
//                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
//                    <div><p className="text-xs text-slate-300"><span className="font-bold text-white">{item.u}</span> {item.a}</p><p className="text-[10px] text-slate-600">{item.t}</p></div>
//                 </div>
//               ))}
//            </div>
//         </nav>
//         <div className="p-4 border-t border-slate-800"><Link to="/" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><LogOut size={16}/> Sign Out</Link></div>
//       </aside>

//       <main className="w-full md:ml-64 flex-1 p-4 md:p-8 overflow-y-auto">
//         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//            <div>
//               <h1 className="text-2xl font-bold text-slate-900">{activeTab === 'dashboard' ? 'Command Center' : activeTab === 'students' ? 'Students Database' : activeTab === 'drives' ? 'Recruitment Drives' : 'Analytics'}</h1>
//               <p className="text-slate-500 text-sm">Placement Season 2026 • Term 2</p>
//            </div>
//            <div className="flex items-center gap-4">
//              {activeTab === 'students' && (<div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2 text-sm text-slate-500"><Search size={16}/> <input placeholder="Search students..." className="outline-none text-xs w-40"/></div>)}
//              <button onClick={() => setActiveTab('drives')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all"><Plus size={18}/> Create Drive</button>
//            </div>
//         </header>
//         {renderContent()}
//       </main>
//     </div>
//   );
// };

// // ==========================================
// // 4. STUDENT MODULE (Dashboard, Sandbox, Vault, Upload)
// // ==========================================

// const UserDropdown = ({ name, role, avatar }) => (
//   <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
//     <div className="text-right hidden lg:block"><p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role}</p></div><div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">{avatar}</div><ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600" />
//   </div>
// );

// const StudentDashboard = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const isActive = (path) => location.pathname === path ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50";

//   return (
//     <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
//       <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center gap-3">
//               <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
//               <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}><div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-5 h-5 fill-current"/></div><span className="font-bold text-xl tracking-tight hidden sm:block">SkillSync</span></div>
//             </div>
//             <div className="hidden md:flex items-center gap-1">
//               <Link to="/student" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student')}`}><LayoutDashboard size={16} /> Cockpit</Link>
//               <Link to="/student/drives" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student/drives')}`}><Briefcase size={16} /> Drives</Link>
//               <Link to="/sandbox" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/sandbox')}`}><Code size={16} /> Arena</Link>
//             </div>
//             <div className="flex items-center gap-4">
//               <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span></button>
//               <UserDropdown name="Saksham B." role="Alpha Batch" avatar="SB" />
//             </div>
//           </div>
//         </div>
//         {mobileMenuOpen && (<div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl z-50"><div className="p-4 space-y-2"><Link to="/student" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-indigo-50 text-indigo-600"><LayoutDashboard size={18}/> Cockpit</Link><Link to="/student/drives" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Briefcase size={18}/> Drives</Link><Link to="/sandbox" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Code size={18}/> Arena</Link><div className="h-px bg-slate-100 my-2"></div><button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"><LogOut size={18} /> Sign Out</button></div></div>)}
//       </nav>

//       <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
//         <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl relative overflow-hidden">
//           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
//             <div>
//               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider mb-4"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live System</div>
//               <h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back, Saksham</h1>
//               <p className="text-slate-400 text-lg mb-6">Your placement probability has increased by <span className="text-emerald-400 font-bold">12%</span> this week.</p>
//               <div className="flex gap-4"><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Current Rank</span><span className="text-3xl font-black">1450</span></div><div className="w-px bg-white/10 h-10 self-center"></div><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Hub Score</span><span className="text-3xl font-black text-indigo-400">850</span></div></div>
//             </div>
//             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm lg:max-w-md ml-auto w-full">
//               <div className="flex justify-between items-end mb-4"><div><h3 className="font-bold text-lg">Profile Strength</h3><p className="text-slate-400 text-sm">Resume & Portfolio</p></div><span className="text-2xl font-bold text-indigo-400">70%</span></div>
//               <div className="w-full bg-slate-700 h-3 rounded-full mb-4 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[70%] rounded-full relative"></div></div>
//               <div className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20"><AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" /><div><p className="text-amber-200 text-xs font-bold mb-1">Action Required</p><p className="text-amber-100/70 text-xs">Add a GitHub project link to reach 80% completeness.</p></div></div>
//             </div>
//           </div>
//           <div className="absolute -top-24 -right-24 text-white/5 rotate-12"><TrendingUp size={400} /></div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Target size={20}/></div><div><h3 className="font-bold text-slate-800">Your Status</h3><p className="text-xs text-slate-500 font-bold uppercase">Academic & Skill</p></div></div><div className="space-y-4"><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Batch Category</span><Badge color="indigo">Alpha Batch</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">AMCAT Quant</span><Badge color="emerald">Top 10%</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Logical Ability</span><Badge color="emerald">Top 15%</Badge></div></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50 relative overflow-hidden"><div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">URGENT</div><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Bell size={20}/></div><div><h3 className="font-bold text-slate-800">Pending Actions</h3><p className="text-xs text-slate-500 font-bold uppercase">1 Deadline Today</p></div></div><div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4"><div className="flex justify-between items-start mb-2"><p className="text-sm font-bold text-slate-900">Amazon SDE Drive</p><span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Ends 5 PM</span></div><p className="text-xs text-slate-500 mb-3">You have been shortlisted. Verify resume to confirm seat.</p><button onClick={() => navigate('/student/upload')} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Upload Resume</button></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4"><div className="mb-2"><h3 className="font-bold text-slate-800">Quick Access</h3><p className="text-xs text-slate-500 font-bold uppercase">Tools & Resources</p></div><button onClick={() => navigate('/sandbox')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Code size={18} className="text-indigo-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Open Sandbox</h4><p className="text-[10px] text-slate-400">Practice coding</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button><button onClick={() => navigate('/student/vault')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><BookOpen size={18} className="text-emerald-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Company Vault</h4><p className="text-[10px] text-slate-400">Read experiences</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button></div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Sandbox = () => {
//   const [analyzing, setAnalyzing] = useState(false); const [result, setResult] = useState(null); const runSimulation = () => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setResult(true); }, 2000); };
//   return (<div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden"><div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-r border-slate-200 bg-white h-1/2 md:h-full overflow-y-auto"><div className="mb-6"><Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link><h1 className="text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1><p className="text-slate-500 text-sm">Paste a JD below to simulate how the AI matches you.</p></div><div className="flex-1 flex flex-col gap-4"><select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"><option>Amazon SDE - 2024</option><option>Microsoft IDC</option></select><textarea className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={`Role: SDE-1...`} /><button onClick={runSimulation} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all">{analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} {analyzing ? "AI is Analyzing..." : "Run Simulation"}</button></div></div><div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto h-1/2 md:h-full">{!result && !analyzing && (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><LayoutDashboard size={48} className="mb-4"/><p className="font-bold">Waiting for Input...</p></div>)}{result && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p><div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600"><span className="text-3xl font-black text-slate-900">65%</span></div></div><div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100"><tr className="bg-emerald-50/50"><td className="p-4 font-bold text-slate-700">DSA</td><td className="p-4 font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> Found</td></tr><tr className="bg-rose-50/50"><td className="p-4 font-bold text-slate-700">AWS</td><td className="p-4 font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={14}/> Missing</td></tr></tbody></table></div></div>)}</div></div>);
// };

// const StudentUpload = () => {
//   const [step, setStep] = useState('upload'); const navigate = useNavigate(); const handleUpload = () => { setStep('processing'); setTimeout(() => setStep('done'), 2000); };
//   return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans text-slate-900"><div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden">{step === 'upload' && (<><button onClick={() => navigate('/student')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600"><ArrowRight className="rotate-180"/></button><div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><UploadCloud className="w-8 h-8 text-indigo-600" /></div><h2 className="text-2xl font-bold mb-2">Amazon SDE Drive</h2><p className="text-slate-500 mb-8">Upload your resume to confirm participation.</p><div onClick={handleUpload} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors group"><span className="font-bold text-indigo-600 group-hover:scale-105 transition-transform">Click to Upload PDF</span></div></>)}{step === 'processing' && (<div className="py-10"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" /><h3 className="text-lg font-bold">Verifying Resume...</h3></div>)}{step === 'done' && (<div className="py-6 animate-in zoom-in duration-300"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div><h3 className="text-2xl font-bold">Application Sent!</h3><button onClick={() => navigate('/student')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full mt-6">Back to Cockpit</button></div>)}</div></div>);
// };

// const CompanyVault = () => (<div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center"><h1 className="text-3xl font-black text-slate-900 mb-2">Company Vault</h1><p className="text-slate-500 max-w-md mb-8">Access previous year questions.</p><Link to="/student" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">← Back</Link></div>);

// // ==========================================
// // 5. LANDING PAGE (Final Fit for Local Image)
// // ==========================================
// const LandingPage = () => (
//   <div className="h-screen w-screen bg-[#0f172a] font-sans overflow-hidden flex flex-col lg:flex-row">
    
//     {/* LEFT SIDE: Content */}
//     <div className="w-full lg:w-[45%] h-full flex flex-col justify-center p-12 lg:p-20 relative z-20 bg-[#0f172a] border-r border-slate-800">
//        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
//        <div className="relative z-10">
//          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-bold w-fit mb-8 animate-[fade-in-up_1s]">
//            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
//            Placement Season 2026 Live
//          </div>
//          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">Skill<span className="text-indigo-500">Sync.</span></h1>
//          <p className="text-slate-400 text-lg lg:text-xl max-w-lg mb-10 leading-relaxed font-medium">The AI-Native Placement Ecosystem. We bridge the gap between talent and opportunity with <span className="text-white font-bold"> intelligent matching.</span></p>
//          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
//             <Link to="/student" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-500/50 to-indigo-900/10 hover:to-indigo-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-400"><Users size={24}/></div><div><h3 className="text-lg font-bold text-white">Student</h3><p className="text-xs text-slate-400">Login to Cockpit</p></div></div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-indigo-500 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//             <Link to="/faculty" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-500/50 to-emerald-900/10 hover:to-emerald-500/50 transition-all duration-300">
//               <div className="relative h-full bg-slate-900/90 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400"><LayoutDashboard size={24}/></div><div><h3 className="text-lg font-bold text-white">Faculty</h3><p className="text-xs text-slate-400">Admin Dashboard</p></div></div>
//                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-emerald-500 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//          </div>
//        </div>
//     </div>

//     {/* RIGHT SIDE - REAL WORLD UPES IMAGE FIX */}
//     <div className="hidden lg:block w-[55%] h-full relative overflow-hidden bg-slate-950">
       
//        {/* 1. BLURRED BACKGROUND (Fills the black bars) */}
//        <div 
//          className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-125"
//          style={{ backgroundImage: "url('/upes.jpg')" }}
//        ></div>

//        {/* 2. MAIN IMAGE (Centered & Framed) */}
//        <div className="absolute inset-0 flex items-center justify-center p-8">
//           <img 
//             src="/upes.jpg" 
//             onError={(e) => {e.target.onerror = null; e.target.src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/UPES_Campus.jpg/1280px-UPES_Campus.jpg"}}
//             alt="UPES Campus" 
//             className="w-full max-w-4xl h-auto object-contain rounded-2xl shadow-2xl border border-slate-700/50 relative z-10"
//           />
//        </div>

//        {/* 3. Gradient Overlay */}
//        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-900/10 to-[#0f172a] z-20 pointer-events-none"></div>

//        {/* 4. Realistic Cards (Overlaid on top, positioned relative to image) */}
//        <div className="absolute top-1/3 right-16 animate-[fade-in_1s_ease-out_0.5s_both] z-30">
//           <div className="bg-white/90 backdrop-blur-sm p-4 pr-8 rounded-xl shadow-2xl shadow-black/50 border-l-4 border-emerald-500 flex items-center gap-4">
//              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><CheckCircle size={24} fill="currentColor" className="text-emerald-100 stroke-emerald-600"/></div>
//              <div><h4 className="font-bold text-slate-800 text-sm">Resume Verified</h4><p className="text-slate-500 text-xs">Ready for Amazon Drive</p></div>
//           </div>
//        </div>

//        <div className="absolute bottom-1/4 right-32 animate-[fade-in_1s_ease-out_1s_both] z-30">
//           <div className="bg-slate-900/90 backdrop-blur-sm p-5 rounded-2xl shadow-2xl shadow-black/50 border border-slate-700 w-64">
//              <div className="flex justify-between items-center mb-4"><span className="text-slate-400 text-xs font-bold uppercase">Placement Rate</span><span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">2026 Batch</span></div>
//              <div className="flex items-end gap-2"><span className="text-4xl font-black text-white">94%</span><span className="text-emerald-400 text-sm font-bold mb-1">▲ 12%</span></div>
//              <div className="flex items-end gap-1 h-8 mt-4 opacity-50">
//                 <div className="w-1/5 bg-indigo-400 h-4 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-6 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-5 rounded-t"></div>
//                 <div className="w-1/5 bg-indigo-400 h-8 rounded-t"></div>
//                 <div className="w-1/5 bg-emerald-400 h-full rounded-t"></div>
//              </div>
//           </div>
//        </div>
//     </div>
//   </div>
// );

// // ==========================================
// // 6. APP ROUTER
// // ==========================================
// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<LandingPage />} />
//         <Route path="/student" element={<StudentDashboard />} />
//         <Route path="/student/upload" element={<StudentUpload />} />
//         <Route path="/student/vault" element={<CompanyVault />} />
//         <Route path="/student/drives" element={<div className="p-10 text-center font-bold text-slate-500">Drives Page (Coming Soon)</div>} />
//         <Route path="/faculty" element={<FacultyDashboard />} />
//         <Route path="/sandbox" element={<Sandbox />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

















































// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
// import { 
//   UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
//   Users, Code, LogOut, Search, Play, TrendingUp, AlertTriangle, 
//   Briefcase, Bell, Menu, X, BookOpen, Star, Target, ChevronDown, 
//   Filter, Calendar, FileText, Plus, Download, Building2
// } from 'lucide-react';

// // ==========================================
// // 1. SHARED COMPONENTS
// // ==========================================

// const Badge = ({ children, color = "indigo" }) => {
//   const colors = {
//     indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
//     emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
//     rose: "bg-rose-50 text-rose-700 border-rose-100",
//     amber: "bg-amber-50 text-amber-700 border-amber-100",
//     slate: "bg-slate-100 text-slate-600 border-slate-200",
//   };
//   return (
//     <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[color] || colors.slate}`}>
//       {children}
//     </span>
//   );
// };

// const StatCard = ({ label, value, sub, color="slate", highlight=false }) => {
//   const colors = {
//     emerald: "text-emerald-600",
//     rose: "text-rose-500",
//     indigo: "text-indigo-600",
//     slate: "text-slate-900"
//   };
//   return (
//     <div className={`bg-white p-6 rounded-2xl border ${highlight ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-200'} shadow-sm transition-all hover:shadow-md`}>
//       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
//       <h3 className={`text-4xl font-black ${colors[color]}`}>{value}</h3>
//       <p className={`text-xs mt-1 font-medium opacity-80 ${colors[color]}`}>{sub}</p>
//     </div>
//   );
// };

// // ==========================================
// // 2. FACULTY SUB-SCREENS
// // ==========================================

// const CommandCenter = ({ setActiveTab }) => (
//   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
//        <StatCard label="Total Students" value="500" sub="Across 4 branches" />
//        <StatCard label="Placed" value="350" sub="70% Success Rate" color="emerald" />
//        <StatCard label="Unplaced" value="150" sub="Actively seeking" color="rose" />
//        <StatCard label="Active Drives" value="12" sub="Open opportunities" color="indigo" highlight />
//     </div>

//     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//       <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
//          <div>
//            <h3 className="font-bold text-slate-800">Live Drive Monitor</h3>
//            <p className="text-xs text-slate-500">Real-time tracking of active recruitment processes</p>
//          </div>
//          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Filter size={18}/></button>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full text-left text-sm">
//           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//             <tr>
//               <th className="px-6 py-3">Company Name</th>
//               <th className="px-6 py-3">Role Profile</th>
//               <th className="px-6 py-3">Timeline</th>
//               <th className="px-6 py-3">Applicants</th>
//               <th className="px-6 py-3">Status</th>
//               <th className="px-6 py-3 text-right">Action</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {[
//               { c: "Amazon", r: "SDE-1", d: "Ends Today, 5 PM", a: 142, s: "Live", cl: "emerald" },
//               { c: "Google", r: "STEP Intern", d: "Starts Tomorrow", a: 89, s: "Upcoming", cl: "indigo" },
//               { c: "Microsoft", r: "Software Eng.", d: "Closed Yesterday", a: 312, s: "Processing", cl: "amber" },
//               { c: "Zomato", r: "Backend Dev", d: "Draft Mode", a: 0, s: "Draft", cl: "slate" },
//             ].map((drive, i) => (
//               <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setActiveTab('drives')}>
//                 <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">{drive.c[0]}</div>
//                   {drive.c}
//                 </td>
//                 <td className="px-6 py-4 text-slate-600">{drive.r}</td>
//                 <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-2"><Calendar size={12}/> {drive.d}</td>
//                 <td className="px-6 py-4 font-mono font-bold text-slate-700">{drive.a}</td>
//                 <td className="px-6 py-4"><Badge color={drive.cl}>{drive.s}</Badge></td>
//                 <td className="px-6 py-4 text-right">
//                   <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Manage <ArrowRight size={12}/></button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   </div>
// );

// const StudentsDatabase = () => (
//   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] animate-in fade-in zoom-in duration-300">
//     <div className="p-6 border-b border-slate-100 flex justify-between items-center">
//        <div>
//          <h2 className="text-lg font-bold text-slate-900">Students Database</h2>
//          <p className="text-sm text-slate-500">View and filter all registered students</p>
//        </div>
//        <div className="flex gap-2">
//          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"><Filter size={16}/> Filter</button>
//          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Download size={16}/> Export CSV</button>
//        </div>
//     </div>
//     <table className="w-full text-left text-sm">
//        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//           <tr>
//              <th className="px-6 py-3">Student Name</th>
//              <th className="px-6 py-3">Branch</th>
//              <th className="px-6 py-3">CGPA</th>
//              <th className="px-6 py-3">Hub Score</th>
//              <th className="px-6 py-3">Status</th>
//              <th className="px-6 py-3 text-right">Actions</th>
//           </tr>
//        </thead>
//        <tbody className="divide-y divide-slate-100">
//           {[
//             { n: "Saksham Bhardwaj", b: "CSE AIML", c: "9.2", h: "1850", s: "Unplaced", sc: "rose" },
//             { n: "Aditya Sharma", b: "CSE Core", c: "8.8", h: "1620", s: "Placed (Amazon)", sc: "emerald" },
//             { n: "Priya Singh", b: "IT", c: "8.5", h: "1450", s: "Unplaced", sc: "rose" },
//             { n: "Rahul Verma", b: "ECE", c: "7.9", h: "1200", s: "Unplaced", sc: "rose" },
//           ].map((s, i) => (
//              <tr key={i} className="hover:bg-slate-50">
//                 <td className="px-6 py-4 font-bold text-slate-900">{s.n}</td>
//                 <td className="px-6 py-4 text-slate-600">{s.b}</td>
//                 <td className="px-6 py-4 font-mono">{s.c}</td>
//                 <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{s.h}</td>
//                 <td className="px-6 py-4"><Badge color={s.sc}>{s.s}</Badge></td>
//                 <td className="px-6 py-4 text-right"><button className="text-indigo-600 hover:underline font-bold text-xs">View Profile</button></td>
//              </tr>
//           ))}
//        </tbody>
//     </table>
//   </div>
// );

// const ManageDrives = () => (
//   <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
//     <div className="flex justify-between items-center">
//        <h2 className="text-xl font-bold text-slate-900">Manage Recruitment Drives</h2>
//        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Create New Drive</button>
//     </div>
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//        {[
//          { c: "Amazon", r: "SDE-1", s: "Live", a: 142 },
//          { c: "Google", r: "STEP Intern", s: "Upcoming", a: 89 },
//          { c: "Microsoft", r: "SWE", s: "Processing", a: 312 },
//          { c: "Zomato", r: "Backend", s: "Draft", a: 0 },
//        ].map((d, i) => (
//          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
//             <div className="flex justify-between items-start mb-4">
//                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">{d.c[0]}</div>
//                <Badge color={d.s === 'Live' ? 'emerald' : d.s === 'Upcoming' ? 'indigo' : 'slate'}>{d.s}</Badge>
//             </div>
//             <h3 className="font-bold text-lg text-slate-900">{d.c}</h3>
//             <p className="text-slate-500 text-sm mb-4">{d.r}</p>
//             <div className="flex justify-between items-center pt-4 border-t border-slate-100">
//                <span className="text-xs font-bold text-slate-500">{d.a} Applicants</span>
//                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors"/>
//             </div>
//          </div>
//        ))}
//     </div>
//   </div>
// );

// const ReportsAnalytics = () => (
//   <div className="flex flex-col items-center justify-center h-[500px] text-center bg-white rounded-2xl border border-slate-200 border-dashed animate-in fade-in zoom-in duration-300">
//      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><FileText size={32} className="text-indigo-600"/></div>
//      <h3 className="text-xl font-bold text-slate-900">Reports & Analytics</h3>
//      <p className="text-slate-500 max-w-sm mb-6">Detailed placement statistics and downloadable reports will appear here.</p>
//      <button className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Download Summary Report</button>
//   </div>
// );

// // ==========================================
// // 3. FACULTY DASHBOARD (Main Wrapper)
// // ==========================================

// const FacultyDashboard = () => {
//   const [activeTab, setActiveTab] = useState('dashboard'); 
  
//   const renderContent = () => {
//     switch(activeTab) {
//       case 'dashboard': return <CommandCenter setActiveTab={setActiveTab} />;
//       case 'students': return <StudentsDatabase />;
//       case 'drives': return <ManageDrives />;
//       case 'reports': return <ReportsAnalytics />;
//       default: return <CommandCenter />;
//     }
//   };

//   const SidebarBtn = ({ id, icon: Icon, label }) => (
//     <button 
//       onClick={() => setActiveTab(id)}
//       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
//     >
//       <Icon size={18}/> {label}
//     </button>
//   );

//   return (
//     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
//       <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col border-r border-slate-800">
//         <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
//           <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
//           <span className="text-xl font-bold tracking-tight">SkillSync</span>
//         </div>
//         <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</div>
//            <SidebarBtn id="dashboard" icon={LayoutDashboard} label="Command Center" />
//            <SidebarBtn id="students" icon={Users} label="Students Database" />
//            <SidebarBtn id="drives" icon={Briefcase} label="Manage Drives" />
//            <SidebarBtn id="reports" icon={FileText} label="Reports & Analytics" />
           
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Recent Activity</div>
//            <div className="px-3 space-y-4">
//               {[{ u: "Rahul V.", a: "applied for Amazon", t: "2m ago" }, { u: "Priya S.", a: "completed Mock Test", t: "15m ago" }].map((item, i) => (
//                 <div key={i} className="flex gap-3 items-start">
//                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
//                    <div><p className="text-xs text-slate-300"><span className="font-bold text-white">{item.u}</span> {item.a}</p><p className="text-[10px] text-slate-600">{item.t}</p></div>
//                 </div>
//               ))}
//            </div>
//         </nav>
//         <div className="p-4 border-t border-slate-800"><Link to="/" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><LogOut size={16}/> Sign Out</Link></div>
//       </aside>

//       <main className="w-full md:ml-64 flex-1 p-4 md:p-8 overflow-y-auto">
//         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//            <div>
//               <h1 className="text-2xl font-bold text-slate-900">{activeTab === 'dashboard' ? 'Command Center' : activeTab === 'students' ? 'Students Database' : activeTab === 'drives' ? 'Recruitment Drives' : 'Analytics'}</h1>
//               <p className="text-slate-500 text-sm">Placement Season 2026 • Term 2</p>
//            </div>
//            <div className="flex items-center gap-4">
//              {activeTab === 'students' && (<div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2 text-sm text-slate-500"><Search size={16}/> <input placeholder="Search students..." className="outline-none text-xs w-40"/></div>)}
//              <button onClick={() => setActiveTab('drives')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all"><Plus size={18}/> Create Drive</button>
//            </div>
//         </header>
//         {renderContent()}
//       </main>
//     </div>
//   );
// };

// // ==========================================
// // 4. STUDENT MODULE (Dashboard, Sandbox, Vault, Upload)
// // ==========================================

// const UserDropdown = ({ name, role, avatar }) => (
//   <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
//     <div className="text-right hidden lg:block"><p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role}</p></div><div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">{avatar}</div><ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600" />
//   </div>
// );

// const StudentDashboard = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const isActive = (path) => location.pathname === path ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50";

//   return (
//     <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
//       <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center gap-3">
//               <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
//               <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}><div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-5 h-5 fill-current"/></div><span className="font-bold text-xl tracking-tight hidden sm:block">SkillSync</span></div>
//             </div>
//             <div className="hidden md:flex items-center gap-1">
//               <Link to="/student" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student')}`}><LayoutDashboard size={16} /> Cockpit</Link>
//               <Link to="/student/drives" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student/drives')}`}><Briefcase size={16} /> Drives</Link>
//               <Link to="/sandbox" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/sandbox')}`}><Code size={16} /> Arena</Link>
//             </div>
//             <div className="flex items-center gap-4">
//               <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span></button>
//               <UserDropdown name="Saksham B." role="Alpha Batch" avatar="SB" />
//             </div>
//           </div>
//         </div>
//         {mobileMenuOpen && (<div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl z-50"><div className="p-4 space-y-2"><Link to="/student" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-indigo-50 text-indigo-600"><LayoutDashboard size={18}/> Cockpit</Link><Link to="/student/drives" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Briefcase size={18}/> Drives</Link><Link to="/sandbox" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Code size={18}/> Arena</Link><div className="h-px bg-slate-100 my-2"></div><button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"><LogOut size={18} /> Sign Out</button></div></div>)}
//       </nav>

//       <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
//         <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl relative overflow-hidden">
//           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
//             <div>
//               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider mb-4"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live System</div>
//               <h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back, Saksham</h1>
//               <p className="text-slate-400 text-lg mb-6">Your placement probability has increased by <span className="text-emerald-400 font-bold">12%</span> this week.</p>
//               <div className="flex gap-4"><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Current Rank</span><span className="text-3xl font-black">1450</span></div><div className="w-px bg-white/10 h-10 self-center"></div><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Hub Score</span><span className="text-3xl font-black text-indigo-400">850</span></div></div>
//             </div>
//             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm lg:max-w-md ml-auto w-full">
//               <div className="flex justify-between items-end mb-4"><div><h3 className="font-bold text-lg">Profile Strength</h3><p className="text-slate-400 text-sm">Resume & Portfolio</p></div><span className="text-2xl font-bold text-indigo-400">70%</span></div>
//               <div className="w-full bg-slate-700 h-3 rounded-full mb-4 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[70%] rounded-full relative"></div></div>
//               <div className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20"><AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" /><div><p className="text-amber-200 text-xs font-bold mb-1">Action Required</p><p className="text-amber-100/70 text-xs">Add a GitHub project link to reach 80% completeness.</p></div></div>
//             </div>
//           </div>
//           <div className="absolute -top-24 -right-24 text-white/5 rotate-12"><TrendingUp size={400} /></div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Target size={20}/></div><div><h3 className="font-bold text-slate-800">Your Status</h3><p className="text-xs text-slate-500 font-bold uppercase">Academic & Skill</p></div></div><div className="space-y-4"><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Batch Category</span><Badge color="indigo">Alpha Batch</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">AMCAT Quant</span><Badge color="emerald">Top 10%</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Logical Ability</span><Badge color="emerald">Top 15%</Badge></div></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50 relative overflow-hidden"><div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">URGENT</div><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Bell size={20}/></div><div><h3 className="font-bold text-slate-800">Pending Actions</h3><p className="text-xs text-slate-500 font-bold uppercase">1 Deadline Today</p></div></div><div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4"><div className="flex justify-between items-start mb-2"><p className="text-sm font-bold text-slate-900">Amazon SDE Drive</p><span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Ends 5 PM</span></div><p className="text-xs text-slate-500 mb-3">You have been shortlisted. Verify resume to confirm seat.</p><button onClick={() => navigate('/student/upload')} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Upload Resume</button></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4"><div className="mb-2"><h3 className="font-bold text-slate-800">Quick Access</h3><p className="text-xs text-slate-500 font-bold uppercase">Tools & Resources</p></div><button onClick={() => navigate('/sandbox')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Code size={18} className="text-indigo-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Open Sandbox</h4><p className="text-[10px] text-slate-400">Practice coding</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button><button onClick={() => navigate('/student/vault')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><BookOpen size={18} className="text-emerald-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Company Vault</h4><p className="text-[10px] text-slate-400">Read experiences</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button></div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Sandbox = () => {
//   const [analyzing, setAnalyzing] = useState(false); const [result, setResult] = useState(null); const runSimulation = () => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setResult(true); }, 2000); };
//   return (<div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden"><div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-r border-slate-200 bg-white h-1/2 md:h-full overflow-y-auto"><div className="mb-6"><Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link><h1 className="text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1><p className="text-slate-500 text-sm">Paste a JD below to simulate how the AI matches you.</p></div><div className="flex-1 flex flex-col gap-4"><select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"><option>Amazon SDE - 2024</option><option>Microsoft IDC</option></select><textarea className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={`Role: SDE-1...`} /><button onClick={runSimulation} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all">{analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} {analyzing ? "AI is Analyzing..." : "Run Simulation"}</button></div></div><div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto h-1/2 md:h-full">{!result && !analyzing && (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><LayoutDashboard size={48} className="mb-4"/><p className="font-bold">Waiting for Input...</p></div>)}{result && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p><div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600"><span className="text-3xl font-black text-slate-900">65%</span></div></div><div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100"><tr className="bg-emerald-50/50"><td className="p-4 font-bold text-slate-700">DSA</td><td className="p-4 font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> Found</td></tr><tr className="bg-rose-50/50"><td className="p-4 font-bold text-slate-700">AWS</td><td className="p-4 font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={14}/> Missing</td></tr></tbody></table></div></div>)}</div></div>);
// };

// const StudentUpload = () => {
//   const [step, setStep] = useState('upload'); const navigate = useNavigate(); const handleUpload = () => { setStep('processing'); setTimeout(() => setStep('done'), 2000); };
//   return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans text-slate-900"><div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden">{step === 'upload' && (<><button onClick={() => navigate('/student')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600"><ArrowRight className="rotate-180"/></button><div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><UploadCloud className="w-8 h-8 text-indigo-600" /></div><h2 className="text-2xl font-bold mb-2">Amazon SDE Drive</h2><p className="text-slate-500 mb-8">Upload your resume to confirm participation.</p><div onClick={handleUpload} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors group"><span className="font-bold text-indigo-600 group-hover:scale-105 transition-transform">Click to Upload PDF</span></div></>)}{step === 'processing' && (<div className="py-10"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" /><h3 className="text-lg font-bold">Verifying Resume...</h3></div>)}{step === 'done' && (<div className="py-6 animate-in zoom-in duration-300"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div><h3 className="text-2xl font-bold">Application Sent!</h3><button onClick={() => navigate('/student')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full mt-6">Back to Cockpit</button></div>)}</div></div>);
// };

// const CompanyVault = () => (<div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center"><h1 className="text-3xl font-black text-slate-900 mb-2">Company Vault</h1><p className="text-slate-500 max-w-md mb-8">Access previous year questions.</p><Link to="/student" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">← Back</Link></div>);

// // ==========================================
// // 5. LANDING PAGE (FULL-SCREEN BACKGROUND LAYOUT)
// // ==========================================
// const LandingPage = () => (
//   <div className="h-screen w-screen bg-[#0f172a] font-sans overflow-hidden relative">
    
//     {/* 1. BACKGROUND IMAGE (Covers Entire Screen) */}
//     <img 
//       src="/upes.jpg" 
//       onError={(e) => {e.target.onerror = null; e.target.src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/UPES_Campus.jpg/1280px-UPES_Campus.jpg"}}
//       alt="UPES Campus" 
//       className="absolute inset-0 w-full h-full object-cover"
//     />

//     {/* 2. GRADIENT OVERLAY (Darkens left side for text readability) */}
//     <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900/40"></div>

//     {/* 3. CONTENT CONTAINER (Flex Layout) */}
//     <div className="absolute inset-0 flex flex-col lg:flex-row max-w-7xl mx-auto px-6 lg:px-12">
      
//       {/* LEFT CONTENT (Text & Buttons) */}
//       <div className="w-full lg:w-1/2 h-full flex flex-col justify-center relative z-20">
//          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-indigo-300 text-xs font-bold w-fit mb-8 backdrop-blur-md animate-[fade-in-up_1s]">
//            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
//            Placement Season 2026 Live
//          </div>
         
//          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight drop-shadow-lg">
//            Skill<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Sync.</span>
//          </h1>
         
//          <p className="text-slate-300 text-lg lg:text-xl max-w-lg mb-10 leading-relaxed font-medium drop-shadow-md">
//            The AI-Native Placement Ecosystem. We bridge the gap between talent and opportunity with <span className="text-white font-bold">intelligent matching.</span>
//          </p>
         
//          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
//             <Link to="/student" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-500/80 to-indigo-900/40 hover:to-indigo-500/80 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30">
//               <div className="relative h-full bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900/60 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-indigo-500/30 text-indigo-300"><Users size={24}/></div><div><h3 className="text-lg font-bold text-white">Student</h3><p className="text-xs text-slate-300">Login to Cockpit</p></div></div>
//                  <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-indigo-400 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//             <Link to="/faculty" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-500/80 to-emerald-900/40 hover:to-emerald-500/80 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30">
//               <div className="relative h-full bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900/60 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-emerald-500/30 text-emerald-300"><LayoutDashboard size={24}/></div><div><h3 className="text-lg font-bold text-white">Faculty</h3><p className="text-xs text-slate-300">Admin Dashboard</p></div></div>
//                  <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-emerald-400 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//          </div>
//       </div>

//       {/* RIGHT SIDE: Floating Stats (Optional, keeps focus on image) */}
//       <div className="hidden lg:flex w-1/2 h-full flex-col justify-center items-end relative z-20 pointer-events-none">
//          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl animate-[float_6s_infinite] mb-8 mr-12">
//             <div className="flex items-center gap-4">
//                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">94%</div>
//                <div><p className="text-white font-bold">Placement Rate</p><p className="text-indigo-300 text-xs">CSE Batch 2026</p></div>
//             </div>
//          </div>
//          <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-4 rounded-xl shadow-2xl animate-[float_7s_infinite_reverse] mr-32">
//             <div className="flex items-center gap-3">
//                <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><CheckCircle size={20}/></div>
//                <div><p className="text-slate-900 font-bold text-sm">Resume Verified</p><p className="text-slate-500 text-xs">Ready for Amazon Drive</p></div>
//             </div>
//          </div>
//       </div>

//     </div>
//   </div>
// );

// // ==========================================
// // 6. APP ROUTER
// // ==========================================
// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<LandingPage />} />
//         <Route path="/student" element={<StudentDashboard />} />
//         <Route path="/student/upload" element={<StudentUpload />} />
//         <Route path="/student/vault" element={<CompanyVault />} />
//         <Route path="/student/drives" element={<div className="p-10 text-center font-bold text-slate-500">Drives Page (Coming Soon)</div>} />
//         <Route path="/faculty" element={<FacultyDashboard />} />
//         <Route path="/sandbox" element={<Sandbox />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;






























































// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
// import { 
//   UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
//   Users, Code, LogOut, Search, Play, TrendingUp, AlertTriangle, 
//   Briefcase, Bell, Menu, X, BookOpen, Star, Target, ChevronDown, 
//   Filter, Calendar, FileText, Plus, Download, Building2
// } from 'lucide-react';

// // ==========================================
// // 1. SHARED COMPONENTS
// // ==========================================

// const Badge = ({ children, color = "indigo" }) => {
//   const colors = {
//     indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
//     emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
//     rose: "bg-rose-50 text-rose-700 border-rose-100",
//     amber: "bg-amber-50 text-amber-700 border-amber-100",
//     slate: "bg-slate-100 text-slate-600 border-slate-200",
//   };
//   return (
//     <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[color] || colors.slate}`}>
//       {children}
//     </span>
//   );
// };

// const StatCard = ({ label, value, sub, color="slate", highlight=false }) => {
//   const colors = {
//     emerald: "text-emerald-600",
//     rose: "text-rose-500",
//     indigo: "text-indigo-600",
//     slate: "text-slate-900"
//   };
//   return (
//     <div className={`bg-white p-6 rounded-2xl border ${highlight ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-200'} shadow-sm transition-all hover:shadow-md`}>
//       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
//       <h3 className={`text-4xl font-black ${colors[color]}`}>{value}</h3>
//       <p className={`text-xs mt-1 font-medium opacity-80 ${colors[color]}`}>{sub}</p>
//     </div>
//   );
// };

// // ==========================================
// // 2. FACULTY SUB-SCREENS
// // ==========================================

// const CommandCenter = ({ setActiveTab }) => (
//   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
//        <StatCard label="Total Students" value="500" sub="Across 4 branches" />
//        <StatCard label="Placed" value="350" sub="70% Success Rate" color="emerald" />
//        <StatCard label="Unplaced" value="150" sub="Actively seeking" color="rose" />
//        <StatCard label="Active Drives" value="12" sub="Open opportunities" color="indigo" highlight />
//     </div>

//     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//       <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
//          <div>
//            <h3 className="font-bold text-slate-800">Live Drive Monitor</h3>
//            <p className="text-xs text-slate-500">Real-time tracking of active recruitment processes</p>
//          </div>
//          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Filter size={18}/></button>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full text-left text-sm">
//           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//             <tr>
//               <th className="px-6 py-3">Company Name</th>
//               <th className="px-6 py-3">Role Profile</th>
//               <th className="px-6 py-3">Timeline</th>
//               <th className="px-6 py-3">Applicants</th>
//               <th className="px-6 py-3">Status</th>
//               <th className="px-6 py-3 text-right">Action</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {[
//               { c: "Amazon", r: "SDE-1", d: "Ends Today, 5 PM", a: 142, s: "Live", cl: "emerald" },
//               { c: "Google", r: "STEP Intern", d: "Starts Tomorrow", a: 89, s: "Upcoming", cl: "indigo" },
//               { c: "Microsoft", r: "Software Eng.", d: "Closed Yesterday", a: 312, s: "Processing", cl: "amber" },
//               { c: "Zomato", r: "Backend Dev", d: "Draft Mode", a: 0, s: "Draft", cl: "slate" },
//             ].map((drive, i) => (
//               <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setActiveTab('drives')}>
//                 <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">{drive.c[0]}</div>
//                   {drive.c}
//                 </td>
//                 <td className="px-6 py-4 text-slate-600">{drive.r}</td>
//                 <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-2"><Calendar size={12}/> {drive.d}</td>
//                 <td className="px-6 py-4 font-mono font-bold text-slate-700">{drive.a}</td>
//                 <td className="px-6 py-4"><Badge color={drive.cl}>{drive.s}</Badge></td>
//                 <td className="px-6 py-4 text-right">
//                   <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Manage <ArrowRight size={12}/></button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   </div>
// );

// const StudentsDatabase = () => (
//   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] animate-in fade-in zoom-in duration-300">
//     <div className="p-6 border-b border-slate-100 flex justify-between items-center">
//        <div>
//          <h2 className="text-lg font-bold text-slate-900">Students Database</h2>
//          <p className="text-sm text-slate-500">View and filter all registered students</p>
//        </div>
//        <div className="flex gap-2">
//          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"><Filter size={16}/> Filter</button>
//          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Download size={16}/> Export CSV</button>
//        </div>
//     </div>
//     <table className="w-full text-left text-sm">
//        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//           <tr>
//              <th className="px-6 py-3">Student Name</th>
//              <th className="px-6 py-3">Branch</th>
//              <th className="px-6 py-3">CGPA</th>
//              <th className="px-6 py-3">Hub Score</th>
//              <th className="px-6 py-3">Status</th>
//              <th className="px-6 py-3 text-right">Actions</th>
//           </tr>
//        </thead>
//        <tbody className="divide-y divide-slate-100">
//           {[
//             { n: "Saksham Bhardwaj", b: "CSE AIML", c: "9.2", h: "1850", s: "Unplaced", sc: "rose" },
//             { n: "Aditya Sharma", b: "CSE Core", c: "8.8", h: "1620", s: "Placed (Amazon)", sc: "emerald" },
//             { n: "Priya Singh", b: "IT", c: "8.5", h: "1450", s: "Unplaced", sc: "rose" },
//             { n: "Rahul Verma", b: "ECE", c: "7.9", h: "1200", s: "Unplaced", sc: "rose" },
//           ].map((s, i) => (
//              <tr key={i} className="hover:bg-slate-50">
//                 <td className="px-6 py-4 font-bold text-slate-900">{s.n}</td>
//                 <td className="px-6 py-4 text-slate-600">{s.b}</td>
//                 <td className="px-6 py-4 font-mono">{s.c}</td>
//                 <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{s.h}</td>
//                 <td className="px-6 py-4"><Badge color={s.sc}>{s.s}</Badge></td>
//                 <td className="px-6 py-4 text-right"><button className="text-indigo-600 hover:underline font-bold text-xs">View Profile</button></td>
//              </tr>
//           ))}
//        </tbody>
//     </table>
//   </div>
// );

// const ManageDrives = () => (
//   <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
//     <div className="flex justify-between items-center">
//        <h2 className="text-xl font-bold text-slate-900">Manage Recruitment Drives</h2>
//        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Create New Drive</button>
//     </div>
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//        {[
//          { c: "Amazon", r: "SDE-1", s: "Live", a: 142 },
//          { c: "Google", r: "STEP Intern", s: "Upcoming", a: 89 },
//          { c: "Microsoft", r: "SWE", s: "Processing", a: 312 },
//          { c: "Zomato", r: "Backend", s: "Draft", a: 0 },
//        ].map((d, i) => (
//          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
//             <div className="flex justify-between items-start mb-4">
//                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">{d.c[0]}</div>
//                <Badge color={d.s === 'Live' ? 'emerald' : d.s === 'Upcoming' ? 'indigo' : 'slate'}>{d.s}</Badge>
//             </div>
//             <h3 className="font-bold text-lg text-slate-900">{d.c}</h3>
//             <p className="text-slate-500 text-sm mb-4">{d.r}</p>
//             <div className="flex justify-between items-center pt-4 border-t border-slate-100">
//                <span className="text-xs font-bold text-slate-500">{d.a} Applicants</span>
//                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors"/>
//             </div>
//          </div>
//        ))}
//     </div>
//   </div>
// );

// const ReportsAnalytics = () => (
//   <div className="flex flex-col items-center justify-center h-[500px] text-center bg-white rounded-2xl border border-slate-200 border-dashed animate-in fade-in zoom-in duration-300">
//      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><FileText size={32} className="text-indigo-600"/></div>
//      <h3 className="text-xl font-bold text-slate-900">Reports & Analytics</h3>
//      <p className="text-slate-500 max-w-sm mb-6">Detailed placement statistics and downloadable reports will appear here.</p>
//      <button className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Download Summary Report</button>
//   </div>
// );

// // ==========================================
// // 3. FACULTY DASHBOARD (Main Wrapper)
// // ==========================================

// const FacultyDashboard = () => {
//   const [activeTab, setActiveTab] = useState('dashboard'); 
  
//   const renderContent = () => {
//     switch(activeTab) {
//       case 'dashboard': return <CommandCenter setActiveTab={setActiveTab} />;
//       case 'students': return <StudentsDatabase />;
//       case 'drives': return <ManageDrives />;
//       case 'reports': return <ReportsAnalytics />;
//       default: return <CommandCenter />;
//     }
//   };

//   const SidebarBtn = ({ id, icon: Icon, label }) => (
//     <button 
//       onClick={() => setActiveTab(id)}
//       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
//     >
//       <Icon size={18}/> {label}
//     </button>
//   );

//   return (
//     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
//       <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col border-r border-slate-800">
//         <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
//           <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
//           <span className="text-xl font-bold tracking-tight">SkillSync</span>
//         </div>
//         <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</div>
//            <SidebarBtn id="dashboard" icon={LayoutDashboard} label="Command Center" />
//            <SidebarBtn id="students" icon={Users} label="Students Database" />
//            <SidebarBtn id="drives" icon={Briefcase} label="Manage Drives" />
//            <SidebarBtn id="reports" icon={FileText} label="Reports & Analytics" />
           
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Recent Activity</div>
//            <div className="px-3 space-y-4">
//               {[{ u: "Rahul V.", a: "applied for Amazon", t: "2m ago" }, { u: "Priya S.", a: "completed Mock Test", t: "15m ago" }].map((item, i) => (
//                 <div key={i} className="flex gap-3 items-start">
//                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
//                    <div><p className="text-xs text-slate-300"><span className="font-bold text-white">{item.u}</span> {item.a}</p><p className="text-[10px] text-slate-600">{item.t}</p></div>
//                 </div>
//               ))}
//            </div>
//         </nav>
//         <div className="p-4 border-t border-slate-800"><Link to="/" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><LogOut size={16}/> Sign Out</Link></div>
//       </aside>

//       <main className="w-full md:ml-64 flex-1 p-4 md:p-8 overflow-y-auto">
//         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//            <div>
//               <h1 className="text-2xl font-bold text-slate-900">{activeTab === 'dashboard' ? 'Command Center' : activeTab === 'students' ? 'Students Database' : activeTab === 'drives' ? 'Recruitment Drives' : 'Analytics'}</h1>
//               <p className="text-slate-500 text-sm">Placement Season 2026 • Term 2</p>
//            </div>
//            <div className="flex items-center gap-4">
//              {activeTab === 'students' && (<div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2 text-sm text-slate-500"><Search size={16}/> <input placeholder="Search students..." className="outline-none text-xs w-40"/></div>)}
//              <button onClick={() => setActiveTab('drives')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all"><Plus size={18}/> Create Drive</button>
//            </div>
//         </header>
//         {renderContent()}
//       </main>
//     </div>
//   );
// };

// // ==========================================
// // 4. STUDENT MODULE (Dashboard, Sandbox, Vault, Upload)
// // ==========================================

// const UserDropdown = ({ name, role, avatar }) => (
//   <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
//     <div className="text-right hidden lg:block"><p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role}</p></div><div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">{avatar}</div><ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600" />
//   </div>
// );

// const StudentDashboard = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const isActive = (path) => location.pathname === path ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50";

//   return (
//     <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
//       <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center gap-3">
//               <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
//               <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}><div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-5 h-5 fill-current"/></div><span className="font-bold text-xl tracking-tight hidden sm:block">SkillSync</span></div>
//             </div>
//             <div className="hidden md:flex items-center gap-1">
//               <Link to="/student" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student')}`}><LayoutDashboard size={16} /> Cockpit</Link>
//               <Link to="/student/drives" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student/drives')}`}><Briefcase size={16} /> Drives</Link>
//               <Link to="/sandbox" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/sandbox')}`}><Code size={16} /> Arena</Link>
//             </div>
//             <div className="flex items-center gap-4">
//               <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span></button>
//               <UserDropdown name="Saksham B." role="Alpha Batch" avatar="SB" />
//             </div>
//           </div>
//         </div>
//         {mobileMenuOpen && (<div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl z-50"><div className="p-4 space-y-2"><Link to="/student" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-indigo-50 text-indigo-600"><LayoutDashboard size={18}/> Cockpit</Link><Link to="/student/drives" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Briefcase size={18}/> Drives</Link><Link to="/sandbox" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Code size={18}/> Arena</Link><div className="h-px bg-slate-100 my-2"></div><button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"><LogOut size={18} /> Sign Out</button></div></div>)}
//       </nav>

//       <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
//         <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl relative overflow-hidden">
//           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
//             <div>
//               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider mb-4"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live System</div>
//               <h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back, Saksham</h1>
//               <p className="text-slate-400 text-lg mb-6">Your placement probability has increased by <span className="text-emerald-400 font-bold">12%</span> this week.</p>
//               <div className="flex gap-4"><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Current Rank</span><span className="text-3xl font-black">1450</span></div><div className="w-px bg-white/10 h-10 self-center"></div><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Hub Score</span><span className="text-3xl font-black text-indigo-400">850</span></div></div>
//             </div>
//             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm lg:max-w-md ml-auto w-full">
//               <div className="flex justify-between items-end mb-4"><div><h3 className="font-bold text-lg">Profile Strength</h3><p className="text-slate-400 text-sm">Resume & Portfolio</p></div><span className="text-2xl font-bold text-indigo-400">70%</span></div>
//               <div className="w-full bg-slate-700 h-3 rounded-full mb-4 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[70%] rounded-full relative"></div></div>
//               <div className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20"><AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" /><div><p className="text-amber-200 text-xs font-bold mb-1">Action Required</p><p className="text-amber-100/70 text-xs">Add a GitHub project link to reach 80% completeness.</p></div></div>
//             </div>
//           </div>
//           <div className="absolute -top-24 -right-24 text-white/5 rotate-12"><TrendingUp size={400} /></div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Target size={20}/></div><div><h3 className="font-bold text-slate-800">Your Status</h3><p className="text-xs text-slate-500 font-bold uppercase">Academic & Skill</p></div></div><div className="space-y-4"><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Batch Category</span><Badge color="indigo">Alpha Batch</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">AMCAT Quant</span><Badge color="emerald">Top 10%</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Logical Ability</span><Badge color="emerald">Top 15%</Badge></div></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50 relative overflow-hidden"><div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">URGENT</div><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Bell size={20}/></div><div><h3 className="font-bold text-slate-800">Pending Actions</h3><p className="text-xs text-slate-500 font-bold uppercase">1 Deadline Today</p></div></div><div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4"><div className="flex justify-between items-start mb-2"><p className="text-sm font-bold text-slate-900">Amazon SDE Drive</p><span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Ends 5 PM</span></div><p className="text-xs text-slate-500 mb-3">You have been shortlisted. Verify resume to confirm seat.</p><button onClick={() => navigate('/student/upload')} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Upload Resume</button></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4"><div className="mb-2"><h3 className="font-bold text-slate-800">Quick Access</h3><p className="text-xs text-slate-500 font-bold uppercase">Tools & Resources</p></div><button onClick={() => navigate('/sandbox')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Code size={18} className="text-indigo-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Open Sandbox</h4><p className="text-[10px] text-slate-400">Practice coding</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button><button onClick={() => navigate('/student/vault')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><BookOpen size={18} className="text-emerald-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Company Vault</h4><p className="text-[10px] text-slate-400">Read experiences</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button></div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Sandbox = () => {
//   const [analyzing, setAnalyzing] = useState(false); const [result, setResult] = useState(null); const runSimulation = () => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setResult(true); }, 2000); };
//   return (<div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden"><div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-r border-slate-200 bg-white h-1/2 md:h-full overflow-y-auto"><div className="mb-6"><Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link><h1 className="text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1><p className="text-slate-500 text-sm">Paste a JD below to simulate how the AI matches you.</p></div><div className="flex-1 flex flex-col gap-4"><select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"><option>Amazon SDE - 2024</option><option>Microsoft IDC</option></select><textarea className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={`Role: SDE-1...`} /><button onClick={runSimulation} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all">{analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} {analyzing ? "AI is Analyzing..." : "Run Simulation"}</button></div></div><div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto h-1/2 md:h-full">{!result && !analyzing && (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><LayoutDashboard size={48} className="mb-4"/><p className="font-bold">Waiting for Input...</p></div>)}{result && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p><div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600"><span className="text-3xl font-black text-slate-900">65%</span></div></div><div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100"><tr className="bg-emerald-50/50"><td className="p-4 font-bold text-slate-700">DSA</td><td className="p-4 font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> Found</td></tr><tr className="bg-rose-50/50"><td className="p-4 font-bold text-slate-700">AWS</td><td className="p-4 font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={14}/> Missing</td></tr></tbody></table></div></div>)}</div></div>);
// };

// const StudentUpload = () => {
//   const [step, setStep] = useState('upload'); const navigate = useNavigate(); const handleUpload = () => { setStep('processing'); setTimeout(() => setStep('done'), 2000); };
//   return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans text-slate-900"><div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden">{step === 'upload' && (<><button onClick={() => navigate('/student')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600"><ArrowRight className="rotate-180"/></button><div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><UploadCloud className="w-8 h-8 text-indigo-600" /></div><h2 className="text-2xl font-bold mb-2">Amazon SDE Drive</h2><p className="text-slate-500 mb-8">Upload your resume to confirm participation.</p><div onClick={handleUpload} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors group"><span className="font-bold text-indigo-600 group-hover:scale-105 transition-transform">Click to Upload PDF</span></div></>)}{step === 'processing' && (<div className="py-10"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" /><h3 className="text-lg font-bold">Verifying Resume...</h3></div>)}{step === 'done' && (<div className="py-6 animate-in zoom-in duration-300"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div><h3 className="text-2xl font-bold">Application Sent!</h3><button onClick={() => navigate('/student')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full mt-6">Back to Cockpit</button></div>)}</div></div>);
// };

// const CompanyVault = () => (<div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center"><h1 className="text-3xl font-black text-slate-900 mb-2">Company Vault</h1><p className="text-slate-500 max-w-md mb-8">Access previous year questions.</p><Link to="/student" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">← Back</Link></div>);

// // ==========================================
// // 5. LANDING PAGE (FULL SCREEN IMMERSIVE)
// // ==========================================
// const LandingPage = () => (
//   // "relative" allows us to layer the image behind everything
//   <div className="relative h-screen w-screen bg-slate-900 font-sans overflow-hidden">
    
//     {/* 1. BACKGROUND IMAGE LAYER */}
//     <div className="absolute inset-0 z-0">
//         <img 
//           src="/upes.jpg" 
//           onError={(e) => {e.target.onerror = null; e.target.src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/UPES_Campus.jpg/1280px-UPES_Campus.jpg"}}
//           alt="UPES Campus" 
//           className="w-full h-full object-cover" 
//         />
//         {/* Dark Gradient Overlay: Keeps text readable on the left */}
//         <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent"></div>
//     </div>

//     {/* 2. CONTENT CONTAINER */}
//     <div className="relative z-10 h-full w-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center">
      
//       {/* LEFT CONTENT (Text & Buttons) */}
//       <div className="w-full lg:w-1/2 flex flex-col justify-center h-full">
//          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-indigo-300 text-xs font-bold w-fit mb-8 backdrop-blur-md animate-[fade-in-up_1s]">
//            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
//            Placement Season 2026 Live
//          </div>
         
//          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight drop-shadow-lg">
//            Skill<span className="text-indigo-500">Sync.</span>
//          </h1>
         
//          <p className="text-slate-300 text-lg lg:text-xl max-w-lg mb-10 leading-relaxed font-medium drop-shadow-md">
//            The AI-Native Placement Ecosystem. We bridge the gap between talent and opportunity with <span className="text-white font-bold">intelligent matching.</span>
//          </p>
         
//          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
//             <Link to="/student" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-500/80 to-indigo-900/40 hover:to-indigo-500/80 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30">
//               <div className="relative h-full bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900/60 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-indigo-500/30 text-indigo-300"><Users size={24}/></div><div><h3 className="text-lg font-bold text-white">Student</h3><p className="text-xs text-slate-300">Login to Cockpit</p></div></div>
//                  <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-indigo-400 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//             <Link to="/faculty" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-500/80 to-emerald-900/40 hover:to-emerald-500/80 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30">
//               <div className="relative h-full bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900/60 transition-colors">
//                  <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-emerald-500/30 text-emerald-300"><LayoutDashboard size={24}/></div><div><h3 className="text-lg font-bold text-white">Faculty</h3><p className="text-xs text-slate-300">Admin Dashboard</p></div></div>
//                  <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-emerald-400 group-hover:w-full transition-all duration-500"></div></div>
//               </div>
//             </Link>
//          </div>
//       </div>

//       {/* RIGHT SIDE: Floating Stats (Subtle, so they don't block the view) */}
//       <div className="hidden lg:flex w-1/2 h-full flex-col justify-center items-end pointer-events-none">
//          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl animate-[float_6s_infinite] mb-8 mr-12">
//             <div className="flex items-center gap-4">
//                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">94%</div>
//                <div><p className="text-white font-bold">Placement Rate</p><p className="text-indigo-300 text-xs">CSE Batch 2026</p></div>
//             </div>
//          </div>
//          <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-4 rounded-xl shadow-2xl animate-[float_7s_infinite_reverse] mr-32">
//             <div className="flex items-center gap-3">
//                <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><CheckCircle size={20}/></div>
//                <div><p className="text-slate-900 font-bold text-sm">Resume Verified</p><p className="text-slate-500 text-xs">Ready for Amazon Drive</p></div>
//             </div>
//          </div>
//       </div>

//     </div>
//   </div>
// );

// // ==========================================
// // 6. APP ROUTER
// // ==========================================
// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<LandingPage />} />
//         <Route path="/student" element={<StudentDashboard />} />
//         <Route path="/student/upload" element={<StudentUpload />} />
//         <Route path="/student/vault" element={<CompanyVault />} />
//         <Route path="/student/drives" element={<div className="p-10 text-center font-bold text-slate-500">Drives Page (Coming Soon)</div>} />
//         <Route path="/faculty" element={<FacultyDashboard />} />
//         <Route path="/sandbox" element={<Sandbox />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;































































// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
// import { 
//   UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
//   Users, Code, LogOut, Search, Play, TrendingUp, AlertTriangle, 
//   Briefcase, Bell, Menu, X, BookOpen, Star, Target, ChevronDown, 
//   Filter, Calendar, FileText, Plus, Download, Building2,
//   GraduationCap, ShieldCheck
// } from 'lucide-react';

// // ==========================================
// // 1. SHARED COMPONENTS
// // ==========================================

// const Badge = ({ children, color = "indigo" }) => {
//   const colors = {
//     indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
//     emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
//     rose: "bg-rose-50 text-rose-700 border-rose-100",
//     amber: "bg-amber-50 text-amber-700 border-amber-100",
//     slate: "bg-slate-100 text-slate-600 border-slate-200",
//   };
//   return (
//     <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[color] || colors.slate}`}>
//       {children}
//     </span>
//   );
// };

// const StatCard = ({ label, value, sub, color="slate", highlight=false }) => {
//   const colors = {
//     emerald: "text-emerald-600",
//     rose: "text-rose-500",
//     indigo: "text-indigo-600",
//     slate: "text-slate-900"
//   };
//   return (
//     <div className={`bg-white p-6 rounded-2xl border ${highlight ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-200'} shadow-sm transition-all hover:shadow-md`}>
//       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
//       <h3 className={`text-4xl font-black ${colors[color]}`}>{value}</h3>
//       <p className={`text-xs mt-1 font-medium opacity-80 ${colors[color]}`}>{sub}</p>
//     </div>
//   );
// };

// // ==========================================
// // 2. FACULTY SUB-SCREENS
// // ==========================================

// const CommandCenter = ({ setActiveTab }) => (
//   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
//        <StatCard label="Total Students" value="500" sub="Across 4 branches" />
//        <StatCard label="Placed" value="350" sub="70% Success Rate" color="emerald" />
//        <StatCard label="Unplaced" value="150" sub="Actively seeking" color="rose" />
//        <StatCard label="Active Drives" value="12" sub="Open opportunities" color="indigo" highlight />
//     </div>

//     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//       <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
//          <div>
//            <h3 className="font-bold text-slate-800">Live Drive Monitor</h3>
//            <p className="text-xs text-slate-500">Real-time tracking of active recruitment processes</p>
//          </div>
//          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Filter size={18}/></button>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full text-left text-sm">
//           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//             <tr>
//               <th className="px-6 py-3">Company Name</th>
//               <th className="px-6 py-3">Role Profile</th>
//               <th className="px-6 py-3">Timeline</th>
//               <th className="px-6 py-3">Applicants</th>
//               <th className="px-6 py-3">Status</th>
//               <th className="px-6 py-3 text-right">Action</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {[
//               { c: "Amazon", r: "SDE-1", d: "Ends Today, 5 PM", a: 142, s: "Live", cl: "emerald" },
//               { c: "Google", r: "STEP Intern", d: "Starts Tomorrow", a: 89, s: "Upcoming", cl: "indigo" },
//               { c: "Microsoft", r: "Software Eng.", d: "Closed Yesterday", a: 312, s: "Processing", cl: "amber" },
//               { c: "Zomato", r: "Backend Dev", d: "Draft Mode", a: 0, s: "Draft", cl: "slate" },
//             ].map((drive, i) => (
//               <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setActiveTab('drives')}>
//                 <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">{drive.c[0]}</div>
//                   {drive.c}
//                 </td>
//                 <td className="px-6 py-4 text-slate-600">{drive.r}</td>
//                 <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-2"><Calendar size={12}/> {drive.d}</td>
//                 <td className="px-6 py-4 font-mono font-bold text-slate-700">{drive.a}</td>
//                 <td className="px-6 py-4"><Badge color={drive.cl}>{drive.s}</Badge></td>
//                 <td className="px-6 py-4 text-right">
//                   <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Manage <ArrowRight size={12}/></button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   </div>
// );

// const StudentsDatabase = () => (
//   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] animate-in fade-in zoom-in duration-300">
//     <div className="p-6 border-b border-slate-100 flex justify-between items-center">
//        <div>
//          <h2 className="text-lg font-bold text-slate-900">Students Database</h2>
//          <p className="text-sm text-slate-500">View and filter all registered students</p>
//        </div>
//        <div className="flex gap-2">
//          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"><Filter size={16}/> Filter</button>
//          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Download size={16}/> Export CSV</button>
//        </div>
//     </div>
//     <table className="w-full text-left text-sm">
//        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
//           <tr>
//              <th className="px-6 py-3">Student Name</th>
//              <th className="px-6 py-3">Branch</th>
//              <th className="px-6 py-3">CGPA</th>
//              <th className="px-6 py-3">Hub Score</th>
//              <th className="px-6 py-3">Status</th>
//              <th className="px-6 py-3 text-right">Actions</th>
//           </tr>
//        </thead>
//        <tbody className="divide-y divide-slate-100">
//           {[
//             { n: "Saksham Bhardwaj", b: "CSE AIML", c: "9.2", h: "1850", s: "Unplaced", sc: "rose" },
//             { n: "Aditya Sharma", b: "CSE Core", c: "8.8", h: "1620", s: "Placed (Amazon)", sc: "emerald" },
//             { n: "Priya Singh", b: "IT", c: "8.5", h: "1450", s: "Unplaced", sc: "rose" },
//             { n: "Rahul Verma", b: "ECE", c: "7.9", h: "1200", s: "Unplaced", sc: "rose" },
//           ].map((s, i) => (
//              <tr key={i} className="hover:bg-slate-50">
//                 <td className="px-6 py-4 font-bold text-slate-900">{s.n}</td>
//                 <td className="px-6 py-4 text-slate-600">{s.b}</td>
//                 <td className="px-6 py-4 font-mono">{s.c}</td>
//                 <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{s.h}</td>
//                 <td className="px-6 py-4"><Badge color={s.sc}>{s.s}</Badge></td>
//                 <td className="px-6 py-4 text-right"><button className="text-indigo-600 hover:underline font-bold text-xs">View Profile</button></td>
//              </tr>
//           ))}
//        </tbody>
//     </table>
//   </div>
// );

// const ManageDrives = () => (
//   <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
//     <div className="flex justify-between items-center">
//        <h2 className="text-xl font-bold text-slate-900">Manage Recruitment Drives</h2>
//        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Create New Drive</button>
//     </div>
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//        {[
//          { c: "Amazon", r: "SDE-1", s: "Live", a: 142 },
//          { c: "Google", r: "STEP Intern", s: "Upcoming", a: 89 },
//          { c: "Microsoft", r: "SWE", s: "Processing", a: 312 },
//          { c: "Zomato", r: "Backend", s: "Draft", a: 0 },
//        ].map((d, i) => (
//          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
//             <div className="flex justify-between items-start mb-4">
//                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">{d.c[0]}</div>
//                <Badge color={d.s === 'Live' ? 'emerald' : d.s === 'Upcoming' ? 'indigo' : 'slate'}>{d.s}</Badge>
//             </div>
//             <h3 className="font-bold text-lg text-slate-900">{d.c}</h3>
//             <p className="text-slate-500 text-sm mb-4">{d.r}</p>
//             <div className="flex justify-between items-center pt-4 border-t border-slate-100">
//                <span className="text-xs font-bold text-slate-500">{d.a} Applicants</span>
//                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors"/>
//             </div>
//          </div>
//        ))}
//     </div>
//   </div>
// );

// const ReportsAnalytics = () => (
//   <div className="flex flex-col items-center justify-center h-[500px] text-center bg-white rounded-2xl border border-slate-200 border-dashed animate-in fade-in zoom-in duration-300">
//      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><FileText size={32} className="text-indigo-600"/></div>
//      <h3 className="text-xl font-bold text-slate-900">Reports & Analytics</h3>
//      <p className="text-slate-500 max-w-sm mb-6">Detailed placement statistics and downloadable reports will appear here.</p>
//      <button className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Download Summary Report</button>
//   </div>
// );

// // ==========================================
// // 3. FACULTY DASHBOARD (Main Wrapper)
// // ==========================================

// const FacultyDashboard = () => {
//   const [activeTab, setActiveTab] = useState('dashboard'); 
  
//   const renderContent = () => {
//     switch(activeTab) {
//       case 'dashboard': return <CommandCenter setActiveTab={setActiveTab} />;
//       case 'students': return <StudentsDatabase />;
//       case 'drives': return <ManageDrives />;
//       case 'reports': return <ReportsAnalytics />;
//       default: return <CommandCenter />;
//     }
//   };

//   const SidebarBtn = ({ id, icon: Icon, label }) => (
//     <button 
//       onClick={() => setActiveTab(id)}
//       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
//     >
//       <Icon size={18}/> {label}
//     </button>
//   );

//   return (
//     <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
//       <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col border-r border-slate-800">
//         <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
//           <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
//           <span className="text-xl font-bold tracking-tight">SkillSync</span>
//         </div>
//         <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</div>
//            <SidebarBtn id="dashboard" icon={LayoutDashboard} label="Command Center" />
//            <SidebarBtn id="students" icon={Users} label="Students Database" />
//            <SidebarBtn id="drives" icon={Briefcase} label="Manage Drives" />
//            <SidebarBtn id="reports" icon={FileText} label="Reports & Analytics" />
           
//            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Recent Activity</div>
//            <div className="px-3 space-y-4">
//               {[{ u: "Rahul V.", a: "applied for Amazon", t: "2m ago" }, { u: "Priya S.", a: "completed Mock Test", t: "15m ago" }].map((item, i) => (
//                 <div key={i} className="flex gap-3 items-start">
//                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
//                    <div><p className="text-xs text-slate-300"><span className="font-bold text-white">{item.u}</span> {item.a}</p><p className="text-[10px] text-slate-600">{item.t}</p></div>
//                 </div>
//               ))}
//            </div>
//         </nav>
//         <div className="p-4 border-t border-slate-800"><Link to="/" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><LogOut size={16}/> Sign Out</Link></div>
//       </aside>

//       <main className="w-full md:ml-64 flex-1 p-4 md:p-8 overflow-y-auto">
//         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//            <div>
//               <h1 className="text-2xl font-bold text-slate-900">{activeTab === 'dashboard' ? 'Command Center' : activeTab === 'students' ? 'Students Database' : activeTab === 'drives' ? 'Recruitment Drives' : 'Analytics'}</h1>
//               <p className="text-slate-500 text-sm">Placement Season 2026 • Term 2</p>
//            </div>
//            <div className="flex items-center gap-4">
//              {activeTab === 'students' && (<div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2 text-sm text-slate-500"><Search size={16}/> <input placeholder="Search students..." className="outline-none text-xs w-40"/></div>)}
//              <button onClick={() => setActiveTab('drives')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all"><Plus size={18}/> Create Drive</button>
//            </div>
//         </header>
//         {renderContent()}
//       </main>
//     </div>
//   );
// };

// // ==========================================
// // 4. STUDENT MODULE (Dashboard, Sandbox, Vault, Upload)
// // ==========================================

// const UserDropdown = ({ name, role, avatar }) => (
//   <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
//     <div className="text-right hidden lg:block"><p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role}</p></div><div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">{avatar}</div><ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600" />
//   </div>
// );

// const StudentDashboard = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const isActive = (path) => location.pathname === path ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50";

//   return (
//     <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
//       <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center gap-3">
//               <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
//               <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}><div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-5 h-5 fill-current"/></div><span className="font-bold text-xl tracking-tight hidden sm:block">SkillSync</span></div>
//             </div>
//             <div className="hidden md:flex items-center gap-1">
//               <Link to="/student" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student')}`}><LayoutDashboard size={16} /> Cockpit</Link>
//               <Link to="/student/drives" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student/drives')}`}><Briefcase size={16} /> Drives</Link>
//               <Link to="/sandbox" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/sandbox')}`}><Code size={16} /> Arena</Link>
//             </div>
//             <div className="flex items-center gap-4">
//               <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span></button>
//               <UserDropdown name="Saksham B." role="Alpha Batch" avatar="SB" />
//             </div>
//           </div>
//         </div>
//         {mobileMenuOpen && (<div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl z-50"><div className="p-4 space-y-2"><Link to="/student" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-indigo-50 text-indigo-600"><LayoutDashboard size={18}/> Cockpit</Link><Link to="/student/drives" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Briefcase size={18}/> Drives</Link><Link to="/sandbox" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Code size={18}/> Arena</Link><div className="h-px bg-slate-100 my-2"></div><button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"><LogOut size={18} /> Sign Out</button></div></div>)}
//       </nav>

//       <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
//         <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl relative overflow-hidden">
//           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
//             <div>
//               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider mb-4"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live System</div>
//               <h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back, Saksham</h1>
//               <p className="text-slate-400 text-lg mb-6">Your placement probability has increased by <span className="text-emerald-400 font-bold">12%</span> this week.</p>
//               <div className="flex gap-4"><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Current Rank</span><span className="text-3xl font-black">1450</span></div><div className="w-px bg-white/10 h-10 self-center"></div><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Hub Score</span><span className="text-3xl font-black text-indigo-400">850</span></div></div>
//             </div>
//             <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm lg:max-w-md ml-auto w-full">
//               <div className="flex justify-between items-end mb-4"><div><h3 className="font-bold text-lg">Profile Strength</h3><p className="text-slate-400 text-sm">Resume & Portfolio</p></div><span className="text-2xl font-bold text-indigo-400">70%</span></div>
//               <div className="w-full bg-slate-700 h-3 rounded-full mb-4 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[70%] rounded-full relative"></div></div>
//               <div className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20"><AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" /><div><p className="text-amber-200 text-xs font-bold mb-1">Action Required</p><p className="text-amber-100/70 text-xs">Add a GitHub project link to reach 80% completeness.</p></div></div>
//             </div>
//           </div>
//           <div className="absolute -top-24 -right-24 text-white/5 rotate-12"><TrendingUp size={400} /></div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Target size={20}/></div><div><h3 className="font-bold text-slate-800">Your Status</h3><p className="text-xs text-slate-500 font-bold uppercase">Academic & Skill</p></div></div><div className="space-y-4"><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Batch Category</span><Badge color="indigo">Alpha Batch</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">AMCAT Quant</span><Badge color="emerald">Top 10%</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Logical Ability</span><Badge color="emerald">Top 15%</Badge></div></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50 relative overflow-hidden"><div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">URGENT</div><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Bell size={20}/></div><div><h3 className="font-bold text-slate-800">Pending Actions</h3><p className="text-xs text-slate-500 font-bold uppercase">1 Deadline Today</p></div></div><div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4"><div className="flex justify-between items-start mb-2"><p className="text-sm font-bold text-slate-900">Amazon SDE Drive</p><span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Ends 5 PM</span></div><p className="text-xs text-slate-500 mb-3">You have been shortlisted. Verify resume to confirm seat.</p><button onClick={() => navigate('/student/upload')} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Upload Resume</button></div></div>
//           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4"><div className="mb-2"><h3 className="font-bold text-slate-800">Quick Access</h3><p className="text-xs text-slate-500 font-bold uppercase">Tools & Resources</p></div><button onClick={() => navigate('/sandbox')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Code size={18} className="text-indigo-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Open Sandbox</h4><p className="text-[10px] text-slate-400">Practice coding</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button><button onClick={() => navigate('/student/vault')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><BookOpen size={18} className="text-emerald-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Company Vault</h4><p className="text-[10px] text-slate-400">Read experiences</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button></div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Sandbox = () => {
//   const [analyzing, setAnalyzing] = useState(false); const [result, setResult] = useState(null); const runSimulation = () => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setResult(true); }, 2000); };
//   return (<div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden"><div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-r border-slate-200 bg-white h-1/2 md:h-full overflow-y-auto"><div className="mb-6"><Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link><h1 className="text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1><p className="text-slate-500 text-sm">Paste a JD below to simulate how the AI matches you.</p></div><div className="flex-1 flex flex-col gap-4"><select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"><option>Amazon SDE - 2024</option><option>Microsoft IDC</option></select><textarea className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={`Role: SDE-1...`} /><button onClick={runSimulation} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all">{analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} {analyzing ? "AI is Analyzing..." : "Run Simulation"}</button></div></div><div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto h-1/2 md:h-full">{!result && !analyzing && (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><LayoutDashboard size={48} className="mb-4"/><p className="font-bold">Waiting for Input...</p></div>)}{result && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p><div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600"><span className="text-3xl font-black text-slate-900">65%</span></div></div><div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100"><tr className="bg-emerald-50/50"><td className="p-4 font-bold text-slate-700">DSA</td><td className="p-4 font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> Found</td></tr><tr className="bg-rose-50/50"><td className="p-4 font-bold text-slate-700">AWS</td><td className="p-4 font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={14}/> Missing</td></tr></tbody></table></div></div>)}</div></div>);
// };

// const StudentUpload = () => {
//   const [step, setStep] = useState('upload'); const navigate = useNavigate(); const handleUpload = () => { setStep('processing'); setTimeout(() => setStep('done'), 2000); };
//   return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans text-slate-900"><div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden">{step === 'upload' && (<><button onClick={() => navigate('/student')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600"><ArrowRight className="rotate-180"/></button><div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><UploadCloud className="w-8 h-8 text-indigo-600" /></div><h2 className="text-2xl font-bold mb-2">Amazon SDE Drive</h2><p className="text-slate-500 mb-8">Upload your resume to confirm participation.</p><div onClick={handleUpload} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors group"><span className="font-bold text-indigo-600 group-hover:scale-105 transition-transform">Click to Upload PDF</span></div></>)}{step === 'processing' && (<div className="py-10"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" /><h3 className="text-lg font-bold">Verifying Resume...</h3></div>)}{step === 'done' && (<div className="py-6 animate-in zoom-in duration-300"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div><h3 className="text-2xl font-bold">Application Sent!</h3><button onClick={() => navigate('/student')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full mt-6">Back to Cockpit</button></div>)}</div></div>);
// };

// const CompanyVault = () => (<div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center"><h1 className="text-3xl font-black text-slate-900 mb-2">Company Vault</h1><p className="text-slate-500 max-w-md mb-8">Access previous year questions.</p><Link to="/student" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">← Back</Link></div>);

// // ==========================================
// // 5. LANDING PAGE (Final - Stats Moved to Left)
// // ==========================================
// const LandingPage = () => (
//   <div className="h-screen w-screen bg-[#0f172a] font-sans overflow-hidden flex flex-col lg:flex-row relative">
    
//     {/* 1. BACKGROUND IMAGE (Full Screen) */}
//     {/* 'object-[75%_center]' pans the image to reveal the building on the right side */}
//     <img 
//       src="/upes.jpg" 
//       onError={(e) => {e.target.onerror = null; e.target.src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/UPES_Campus.jpg/1280px-UPES_Campus.jpg"}}
//       alt="UPES Campus" 
//       className="absolute inset-0 w-full h-full object-cover object-[75%_center] opacity-100 z-0"
//     />

//     {/* 2. GRADIENT OVERLAY (Dark left, Transparent right) */}
//     <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/95 to-transparent z-10"></div>

//     {/* 3. CONTENT CONTAINER */}
//     <div className="relative z-20 h-full w-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row">
      
//       {/* LEFT CONTENT (Text & Stats) */}
//       <div className="w-full lg:w-[48%] h-full flex flex-col justify-center">
         
//          {/* Main Text */}
//          <div className="mb-12">
//             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-indigo-300 text-xs font-bold w-fit mb-8 backdrop-blur-md animate-[fade-in-up_1s]">
//               <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
//               Placement Season 2026 Live
//             </div>
            
//             <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight drop-shadow-xl">
//               Skill<span className="text-indigo-500">Sync.</span>
//             </h1>
            
//             <p className="text-slate-300 text-lg lg:text-xl max-w-lg mb-10 leading-relaxed font-medium drop-shadow-md">
//               The AI-Native Placement Ecosystem. We bridge the gap between talent and opportunity with <span className="text-white font-bold">intelligent matching.</span>
//             </p>
            
//             <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg mb-12">
//                <Link to="/student" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-500/80 to-indigo-900/40 hover:to-indigo-500/80 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30">
//                  <div className="relative h-full bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 flex flex-col justify-between hover:bg-slate-900/70 transition-colors">
//                     <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-indigo-500/30 text-indigo-300"><Users size={24}/></div><div><h3 className="text-lg font-bold text-white">Student</h3><p className="text-xs text-slate-300">Login to Cockpit</p></div></div>
//                     <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-indigo-400 group-hover:w-full transition-all duration-500"></div></div>
//                  </div>
//                </Link>
//                <Link to="/faculty" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-500/80 to-emerald-900/40 hover:to-emerald-500/80 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30">
//                  <div className="relative h-full bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 flex flex-col justify-between hover:bg-slate-900/70 transition-colors">
//                     <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-emerald-500/30 text-emerald-300"><LayoutDashboard size={24}/></div><div><h3 className="text-lg font-bold text-white">Faculty</h3><p className="text-xs text-slate-300">Admin Dashboard</p></div></div>
//                     <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-emerald-400 group-hover:w-full transition-all duration-500"></div></div>
//                  </div>
//                </Link>
//             </div>
//          </div>

//          {/* --- MOVED STATS HERE (Clean Bottom Section) --- */}
//          <div className="flex items-center gap-8 pt-8 border-t border-slate-800/50">
//             <div className="flex items-center gap-3">
//                <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30"><GraduationCap size={20}/></div>
//                <div><p className="text-2xl font-black text-white leading-none">94%</p><p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Placement Rate</p></div>
//             </div>
//             <div className="w-px h-10 bg-slate-800"></div>
//             <div className="flex items-center gap-3">
//                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30"><ShieldCheck size={20}/></div>
//                <div><p className="text-white font-bold leading-none">Verified</p><p className="text-xs text-slate-400 mt-1">Resume AI Check</p></div>
//             </div>
//          </div>

//       </div>

//       {/* RIGHT SIDE: Empty to let the image shine */}
//       <div className="w-full lg:w-[52%]"></div>

//     </div>
//   </div>
// );

// // ==========================================
// // 6. APP ROUTER
// // ==========================================
// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<LandingPage />} />
//         <Route path="/student" element={<StudentDashboard />} />
//         <Route path="/student/upload" element={<StudentUpload />} />
//         <Route path="/student/vault" element={<CompanyVault />} />
//         <Route path="/student/drives" element={<div className="p-10 text-center font-bold text-slate-500">Drives Page (Coming Soon)</div>} />
//         <Route path="/faculty" element={<FacultyDashboard />} />
//         <Route path="/sandbox" element={<Sandbox />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;
















































































import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  UploadCloud, CheckCircle, ArrowRight, Loader2, Zap, LayoutDashboard, 
  Users, Code, LogOut, Search, Play, TrendingUp, AlertTriangle, 
  Briefcase, Bell, Menu, X, BookOpen, Star, Target, ChevronDown, 
  Filter, Calendar, FileText, Plus, Download, Building2, 
  GraduationCap, ShieldCheck
} from 'lucide-react';

// ==========================================
// 1. SHARED COMPONENTS
// ==========================================

const Badge = ({ children, color = "indigo" }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
};

const StatCard = ({ label, value, sub, color="slate", highlight=false }) => {
  const colors = {
    emerald: "text-emerald-600",
    rose: "text-rose-500",
    indigo: "text-indigo-600",
    slate: "text-slate-900"
  };
  return (
    <div className={`bg-white p-6 rounded-2xl border ${highlight ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-200'} shadow-sm transition-all hover:shadow-md`}>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <h3 className={`text-4xl font-black ${colors[color]}`}>{value}</h3>
      <p className={`text-xs mt-1 font-medium opacity-80 ${colors[color]}`}>{sub}</p>
    </div>
  );
};

// ==========================================
// 2. FACULTY SUB-SCREENS
// ==========================================

const CommandCenter = ({ setActiveTab }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
       <StatCard label="Total Students" value="500" sub="Across 4 branches" />
       <StatCard label="Placed" value="350" sub="70% Success Rate" color="emerald" />
       <StatCard label="Unplaced" value="150" sub="Actively seeking" color="rose" />
       <StatCard label="Active Drives" value="12" sub="Open opportunities" color="indigo" highlight />
    </div>

    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
         <div>
           <h3 className="font-bold text-slate-800">Live Drive Monitor</h3>
           <p className="text-xs text-slate-500">Real-time tracking of active recruitment processes</p>
         </div>
         <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Filter size={18}/></button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-6 py-3">Company Name</th>
              <th className="px-6 py-3">Role Profile</th>
              <th className="px-6 py-3">Timeline</th>
              <th className="px-6 py-3">Applicants</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              { c: "Amazon", r: "SDE-1", d: "Ends Today, 5 PM", a: 142, s: "Live", cl: "emerald" },
              { c: "Google", r: "STEP Intern", d: "Starts Tomorrow", a: 89, s: "Upcoming", cl: "indigo" },
              { c: "Microsoft", r: "Software Eng.", d: "Closed Yesterday", a: 312, s: "Processing", cl: "amber" },
              { c: "Zomato", r: "Backend Dev", d: "Draft Mode", a: 0, s: "Draft", cl: "slate" },
            ].map((drive, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setActiveTab('drives')}>
                <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">{drive.c[0]}</div>
                  {drive.c}
                </td>
                <td className="px-6 py-4 text-slate-600">{drive.r}</td>
                <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-2"><Calendar size={12}/> {drive.d}</td>
                <td className="px-6 py-4 font-mono font-bold text-slate-700">{drive.a}</td>
                <td className="px-6 py-4"><Badge color={drive.cl}>{drive.s}</Badge></td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Manage <ArrowRight size={12}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const StudentsDatabase = () => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] animate-in fade-in zoom-in duration-300">
    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
       <div>
         <h2 className="text-lg font-bold text-slate-900">Students Database</h2>
         <p className="text-sm text-slate-500">View and filter all registered students</p>
       </div>
       <div className="flex gap-2">
         <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"><Filter size={16}/> Filter</button>
         <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Download size={16}/> Export CSV</button>
       </div>
    </div>
    <table className="w-full text-left text-sm">
       <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
          <tr>
             <th className="px-6 py-3">Student Name</th>
             <th className="px-6 py-3">Branch</th>
             <th className="px-6 py-3">CGPA</th>
             <th className="px-6 py-3">Hub Score</th>
             <th className="px-6 py-3">Status</th>
             <th className="px-6 py-3 text-right">Actions</th>
          </tr>
       </thead>
       <tbody className="divide-y divide-slate-100">
          {[
            { n: "Saksham Bhardwaj", b: "CSE AIML", c: "9.2", h: "1850", s: "Unplaced", sc: "rose" },
            { n: "Aditya Sharma", b: "CSE Core", c: "8.8", h: "1620", s: "Placed (Amazon)", sc: "emerald" },
            { n: "Priya Singh", b: "IT", c: "8.5", h: "1450", s: "Unplaced", sc: "rose" },
            { n: "Rahul Verma", b: "ECE", c: "7.9", h: "1200", s: "Unplaced", sc: "rose" },
          ].map((s, i) => (
             <tr key={i} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-900">{s.n}</td>
                <td className="px-6 py-4 text-slate-600">{s.b}</td>
                <td className="px-6 py-4 font-mono">{s.c}</td>
                <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{s.h}</td>
                <td className="px-6 py-4"><Badge color={s.sc}>{s.s}</Badge></td>
                <td className="px-6 py-4 text-right"><button className="text-indigo-600 hover:underline font-bold text-xs">View Profile</button></td>
             </tr>
          ))}
       </tbody>
    </table>
  </div>
);

const ManageDrives = () => (
  <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
    <div className="flex justify-between items-center">
       <h2 className="text-xl font-bold text-slate-900">Manage Recruitment Drives</h2>
       <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Create New Drive</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       {[
         { c: "Amazon", r: "SDE-1", s: "Live", a: 142 },
         { c: "Google", r: "STEP Intern", s: "Upcoming", a: 89 },
         { c: "Microsoft", r: "SWE", s: "Processing", a: 312 },
         { c: "Zomato", r: "Backend", s: "Draft", a: 0 },
       ].map((d, i) => (
         <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
               <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">{d.c[0]}</div>
               <Badge color={d.s === 'Live' ? 'emerald' : d.s === 'Upcoming' ? 'indigo' : 'slate'}>{d.s}</Badge>
            </div>
            <h3 className="font-bold text-lg text-slate-900">{d.c}</h3>
            <p className="text-slate-500 text-sm mb-4">{d.r}</p>
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
               <span className="text-xs font-bold text-slate-500">{d.a} Applicants</span>
               <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors"/>
            </div>
         </div>
       ))}
    </div>
  </div>
);

const ReportsAnalytics = () => (
  <div className="flex flex-col items-center justify-center h-[500px] text-center bg-white rounded-2xl border border-slate-200 border-dashed animate-in fade-in zoom-in duration-300">
     <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><FileText size={32} className="text-indigo-600"/></div>
     <h3 className="text-xl font-bold text-slate-900">Reports & Analytics</h3>
     <p className="text-slate-500 max-w-sm mb-6">Detailed placement statistics and downloadable reports will appear here.</p>
     <button className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Download Summary Report</button>
  </div>
);

// ==========================================
// 3. FACULTY DASHBOARD (Main Wrapper)
// ==========================================

const FacultyDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); 
  
  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <CommandCenter setActiveTab={setActiveTab} />;
      case 'students': return <StudentsDatabase />;
      case 'drives': return <ManageDrives />;
      case 'reports': return <ReportsAnalytics />;
      default: return <CommandCenter />;
    }
  };

  const SidebarBtn = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      <Icon size={18}/> {label}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
          <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
          <span className="text-xl font-bold tracking-tight">SkillSync</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
           <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</div>
           <SidebarBtn id="dashboard" icon={LayoutDashboard} label="Command Center" />
           <SidebarBtn id="students" icon={Users} label="Students Database" />
           <SidebarBtn id="drives" icon={Briefcase} label="Manage Drives" />
           <SidebarBtn id="reports" icon={FileText} label="Reports & Analytics" />
           
           <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Recent Activity</div>
           <div className="px-3 space-y-4">
              {[{ u: "Rahul V.", a: "applied for Amazon", t: "2m ago" }, { u: "Priya S.", a: "completed Mock Test", t: "15m ago" }].map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                   <div><p className="text-xs text-slate-300"><span className="font-bold text-white">{item.u}</span> {item.a}</p><p className="text-[10px] text-slate-600">{item.t}</p></div>
                </div>
              ))}
           </div>
        </nav>
        <div className="p-4 border-t border-slate-800"><Link to="/" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><LogOut size={16}/> Sign Out</Link></div>
      </aside>

      <main className="w-full md:ml-64 flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           <div>
              <h1 className="text-2xl font-bold text-slate-900">{activeTab === 'dashboard' ? 'Command Center' : activeTab === 'students' ? 'Students Database' : activeTab === 'drives' ? 'Recruitment Drives' : 'Analytics'}</h1>
              <p className="text-slate-500 text-sm">Placement Season 2026 • Term 2</p>
           </div>
           <div className="flex items-center gap-4">
             {activeTab === 'students' && (<div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2 text-sm text-slate-500"><Search size={16}/> <input placeholder="Search students..." className="outline-none text-xs w-40"/></div>)}
             <button onClick={() => setActiveTab('drives')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all"><Plus size={18}/> Create Drive</button>
           </div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
};

// ==========================================
// 4. STUDENT MODULE (Dashboard, Sandbox, Vault, Upload)
// ==========================================

const UserDropdown = ({ name, role, avatar }) => (
  <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
    <div className="text-right hidden lg:block"><p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role}</p></div><div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">{avatar}</div><ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600" />
  </div>
);

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isActive = (path) => location.pathname === path ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}><div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-5 h-5 fill-current"/></div><span className="font-bold text-xl tracking-tight hidden sm:block">SkillSync</span></div>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <Link to="/student" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student')}`}><LayoutDashboard size={16} /> Cockpit</Link>
              <Link to="/student/drives" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/student/drives')}`}><Briefcase size={16} /> Drives</Link>
              <Link to="/sandbox" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive('/sandbox')}`}><Code size={16} /> Arena</Link>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span></button>
              <UserDropdown name="Saksham B." role="Alpha Batch" avatar="SB" />
            </div>
          </div>
        </div>
        {mobileMenuOpen && (<div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl z-50"><div className="p-4 space-y-2"><Link to="/student" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-indigo-50 text-indigo-600"><LayoutDashboard size={18}/> Cockpit</Link><Link to="/student/drives" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Briefcase size={18}/> Drives</Link><Link to="/sandbox" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50"><Code size={18}/> Arena</Link><div className="h-px bg-slate-100 my-2"></div><button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"><LogOut size={18} /> Sign Out</button></div></div>)}
      </nav>

      <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
        <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider mb-4"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live System</div>
              <h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back, Saksham</h1>
              <p className="text-slate-400 text-lg mb-6">Your placement probability has increased by <span className="text-emerald-400 font-bold">12%</span> this week.</p>
              <div className="flex gap-4"><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Current Rank</span><span className="text-3xl font-black">1450</span></div><div className="w-px bg-white/10 h-10 self-center"></div><div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase">Hub Score</span><span className="text-3xl font-black text-indigo-400">850</span></div></div>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm lg:max-w-md ml-auto w-full">
              <div className="flex justify-between items-end mb-4"><div><h3 className="font-bold text-lg">Profile Strength</h3><p className="text-slate-400 text-sm">Resume & Portfolio</p></div><span className="text-2xl font-bold text-indigo-400">70%</span></div>
              <div className="w-full bg-slate-700 h-3 rounded-full mb-4 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[70%] rounded-full relative"></div></div>
              <div className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20"><AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" /><div><p className="text-amber-200 text-xs font-bold mb-1">Action Required</p><p className="text-amber-100/70 text-xs">Add a GitHub project link to reach 80% completeness.</p></div></div>
            </div>
          </div>
          <div className="absolute -top-24 -right-24 text-white/5 rotate-12"><TrendingUp size={400} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Target size={20}/></div><div><h3 className="font-bold text-slate-800">Your Status</h3><p className="text-xs text-slate-500 font-bold uppercase">Academic & Skill</p></div></div><div className="space-y-4"><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Batch Category</span><Badge color="indigo">Alpha Batch</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">AMCAT Quant</span><Badge color="emerald">Top 10%</Badge></div><div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Logical Ability</span><Badge color="emerald">Top 15%</Badge></div></div></div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-indigo-50 relative overflow-hidden"><div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">URGENT</div><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Bell size={20}/></div><div><h3 className="font-bold text-slate-800">Pending Actions</h3><p className="text-xs text-slate-500 font-bold uppercase">1 Deadline Today</p></div></div><div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4"><div className="flex justify-between items-start mb-2"><p className="text-sm font-bold text-slate-900">Amazon SDE Drive</p><span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Ends 5 PM</span></div><p className="text-xs text-slate-500 mb-3">You have been shortlisted. Verify resume to confirm seat.</p><button onClick={() => navigate('/student/upload')} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Upload Resume</button></div></div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4"><div className="mb-2"><h3 className="font-bold text-slate-800">Quick Access</h3><p className="text-xs text-slate-500 font-bold uppercase">Tools & Resources</p></div><button onClick={() => navigate('/sandbox')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Code size={18} className="text-indigo-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Open Sandbox</h4><p className="text-[10px] text-slate-400">Practice coding</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button><button onClick={() => navigate('/student/vault')} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"><div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><BookOpen size={18} className="text-emerald-600"/></div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Company Vault</h4><p className="text-[10px] text-slate-400">Read experiences</p></div><ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/></button></div>
        </div>
      </div>
    </div>
  );
};

const Sandbox = () => {
  const [analyzing, setAnalyzing] = useState(false); const [result, setResult] = useState(null); const runSimulation = () => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setResult(true); }, 2000); };
  return (<div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden"><div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-r border-slate-200 bg-white h-1/2 md:h-full overflow-y-auto"><div className="mb-6"><Link to="/student" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-4"><ArrowRight size={14} className="rotate-180"/> Back to Cockpit</Link><h1 className="text-3xl font-black text-slate-900 mb-2">Simulation Lab</h1><p className="text-slate-500 text-sm">Paste a JD below to simulate how the AI matches you.</p></div><div className="flex-1 flex flex-col gap-4"><select className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"><option>Amazon SDE - 2024</option><option>Microsoft IDC</option></select><textarea className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-600 resize-none outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={`Role: SDE-1...`} /><button onClick={runSimulation} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all">{analyzing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>} {analyzing ? "AI is Analyzing..." : "Run Simulation"}</button></div></div><div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto h-1/2 md:h-full">{!result && !analyzing && (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><LayoutDashboard size={48} className="mb-4"/><p className="font-bold">Waiting for Input...</p></div>)}{result && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Match Score</p><div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-8 border-indigo-100 border-t-indigo-600"><span className="text-3xl font-black text-slate-900">65%</span></div></div><div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Gap Analysis</div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100"><tr className="bg-emerald-50/50"><td className="p-4 font-bold text-slate-700">DSA</td><td className="p-4 font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={14}/> Found</td></tr><tr className="bg-rose-50/50"><td className="p-4 font-bold text-slate-700">AWS</td><td className="p-4 font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={14}/> Missing</td></tr></tbody></table></div></div>)}</div></div>);
};

const StudentUpload = () => {
  const [step, setStep] = useState('upload'); const navigate = useNavigate(); const handleUpload = () => { setStep('processing'); setTimeout(() => setStep('done'), 2000); };
  return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans text-slate-900"><div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden">{step === 'upload' && (<><button onClick={() => navigate('/student')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600"><ArrowRight className="rotate-180"/></button><div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><UploadCloud className="w-8 h-8 text-indigo-600" /></div><h2 className="text-2xl font-bold mb-2">Amazon SDE Drive</h2><p className="text-slate-500 mb-8">Upload your resume to confirm participation.</p><div onClick={handleUpload} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors group"><span className="font-bold text-indigo-600 group-hover:scale-105 transition-transform">Click to Upload PDF</span></div></>)}{step === 'processing' && (<div className="py-10"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" /><h3 className="text-lg font-bold">Verifying Resume...</h3></div>)}{step === 'done' && (<div className="py-6 animate-in zoom-in duration-300"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div><h3 className="text-2xl font-bold">Application Sent!</h3><button onClick={() => navigate('/student')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full mt-6">Back to Cockpit</button></div>)}</div></div>);
};

const CompanyVault = () => (<div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center"><h1 className="text-3xl font-black text-slate-900 mb-2">Company Vault</h1><p className="text-slate-500 max-w-md mb-8">Access previous year questions.</p><Link to="/student" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">← Back</Link></div>);

// ==========================================
// 5. LANDING PAGE (Final - Stats Moved to Left)
// ==========================================
const LandingPage = () => (
  <div className="h-screen w-screen bg-[#0f172a] font-sans overflow-hidden flex flex-col lg:flex-row relative">
    
    {/* 1. BACKGROUND IMAGE (Full Screen) */}
    {/* 'object-center' centers the image perfectly */}
    <img 
      src="/upes.jpg" 
      onError={(e) => {e.target.onerror = null; e.target.src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/UPES_Campus.jpg/1280px-UPES_Campus.jpg"}}
      alt="UPES Campus" 
      className="absolute inset-0 w-full h-full object-cover object-center opacity-100 z-0"
    />

    {/* 2. GRADIENT OVERLAY (Dark left, Transparent right) */}
    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/95 to-transparent z-10"></div>

    {/* 3. CONTENT CONTAINER */}
    <div className="relative z-20 h-full w-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row">
      
      {/* LEFT CONTENT (Text & Stats) */}
      <div className="w-full lg:w-[48%] h-full flex flex-col justify-center">
         
         {/* Main Text */}
         <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-indigo-300 text-xs font-bold w-fit mb-8 backdrop-blur-md animate-[fade-in-up_1s]">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
              Placement Season 2026 Live
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight drop-shadow-xl">
              Skill<span className="text-indigo-500">Sync.</span>
            </h1>
            
            <p className="text-slate-300 text-lg lg:text-xl max-w-lg mb-10 leading-relaxed font-medium drop-shadow-md">
              The AI-Native Placement Ecosystem. We bridge the gap between talent and opportunity with <span className="text-white font-bold">intelligent matching.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg mb-12">
               <Link to="/student" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-500/80 to-indigo-900/40 hover:to-indigo-500/80 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30">
                 <div className="relative h-full bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 flex flex-col justify-between hover:bg-slate-900/70 transition-colors">
                    <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-indigo-500/30 text-indigo-300"><Users size={24}/></div><div><h3 className="text-lg font-bold text-white">Student</h3><p className="text-xs text-slate-300">Login to Cockpit</p></div></div>
                    <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-indigo-400 group-hover:w-full transition-all duration-500"></div></div>
                 </div>
               </Link>
               <Link to="/faculty" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-500/80 to-emerald-900/40 hover:to-emerald-500/80 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30">
                 <div className="relative h-full bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 flex flex-col justify-between hover:bg-slate-900/70 transition-colors">
                    <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-emerald-500/30 text-emerald-300"><LayoutDashboard size={24}/></div><div><h3 className="text-lg font-bold text-white">Faculty</h3><p className="text-xs text-slate-300">Admin Dashboard</p></div></div>
                    <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-emerald-400 group-hover:w-full transition-all duration-500"></div></div>
                 </div>
               </Link>
            </div>
         </div>

         {/* --- MOVED STATS HERE (Clean Bottom Section) --- */}
         <div className="flex items-center gap-8 pt-8 border-t border-slate-800/50">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30"><GraduationCap size={20}/></div>
               <div><p className="text-2xl font-black text-white leading-none">94%</p><p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Placement Rate</p></div>
            </div>
            <div className="w-px h-10 bg-slate-800"></div>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30"><ShieldCheck size={20}/></div>
               <div><p className="text-white font-bold leading-none">Verified</p><p className="text-xs text-slate-400 mt-1">Resume AI Check</p></div>
            </div>
         </div>

      </div>

      {/* RIGHT SIDE: Empty to let the image shine */}
      <div className="w-full lg:w-[52%]"></div>

    </div>
  </div>
);

// ==========================================
// 6. APP ROUTER
// ==========================================
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/upload" element={<StudentUpload />} />
        <Route path="/student/vault" element={<CompanyVault />} />
        <Route path="/student/drives" element={<div className="p-10 text-center font-bold text-slate-500">Drives Page (Coming Soon)</div>} />
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/sandbox" element={<Sandbox />} />
      </Routes>
    </Router>
  );
}

export default App;