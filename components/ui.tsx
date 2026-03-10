"use client";
import React from 'react';

export const Badge = ({ children, color = "indigo" }: any) => {
  const colors: any = {
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

export const StatCard = ({ label, value, sub, color="slate", highlight=false }: any) => {
  const colors: any = {
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