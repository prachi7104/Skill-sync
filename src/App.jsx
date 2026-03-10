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
