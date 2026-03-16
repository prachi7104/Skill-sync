"use client";

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#050B14] text-slate-200 p-6 md:p-12 relative overflow-hidden">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-[-10%] left-[20%] w-[50%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

            <div className="max-w-3xl mx-auto space-y-8 relative z-10">
                {/* Main Content Area */}
                <div className="bg-[#0B1221] rounded-3xl border border-white/5 p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    {/* Subtle inner card glow */}
                    <div className="absolute top-[-20%] right-[-10%] w-[30%] h-[40%] bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10">
                        {children}
                    </div>
                </div>

            </div>
        </div>
    );
}