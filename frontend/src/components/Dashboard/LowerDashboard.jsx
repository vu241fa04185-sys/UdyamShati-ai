import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  PhoneCall
} from 'lucide-react';

export default function LowerDashboard() {
  return (
    <div className="space-y-6 mt-8">
      
      {/* 1. WHY UDYAMSAARTHI CARD */}
      <div className="bg-gradient-to-br from-[#0F3D2E]/5 via-[#0F3D2E]/10 to-amber-500/5 rounded-3xl p-6 border border-[#0F3D2E]/15 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#C28A17]" />
          <h3 className="text-base font-extrabold text-[#0F3D2E]">Why UdyamSaarthi?</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start space-x-2.5 bg-white/80 p-3 rounded-2xl border border-emerald-900/10">
            <CheckCircle2 className="w-4 h-4 text-[#0F3D2E] shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-stone-700 leading-snug">
              Personalized recommendations based on your location
            </span>
          </div>

          <div className="flex items-start space-x-2.5 bg-white/80 p-3 rounded-2xl border border-emerald-900/10">
            <CheckCircle2 className="w-4 h-4 text-[#0F3D2E] shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-stone-700 leading-snug">
              Access to government schemes & concessional loans
            </span>
          </div>

          <div className="flex items-start space-x-2.5 bg-white/80 p-3 rounded-2xl border border-emerald-900/10">
            <CheckCircle2 className="w-4 h-4 text-[#0F3D2E] shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-stone-700 leading-snug">
              Financial planning made simple
            </span>
          </div>

          <div className="flex items-start space-x-2.5 bg-white/80 p-3 rounded-2xl border border-emerald-900/10">
            <CheckCircle2 className="w-4 h-4 text-[#0F3D2E] shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-stone-700 leading-snug">
              Guidance you can trust step by step
            </span>
          </div>
        </div>
      </div>

      {/* 2. NEED HELP / HELPLINE CARD */}
      <div className="bg-gradient-to-r from-[#0F3D2E] to-[#165440] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-[#0F3D2E] flex items-center justify-center shadow-lg shrink-0">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
              Need Help?
            </span>
            <h4 className="text-base font-extrabold text-white">Call Our Helpline</h4>
            <p className="text-xs text-emerald-100">MoSJE Entrepreneur Advisory & Support</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-xl sm:text-2xl font-black text-amber-400 tracking-wider">
            1800-11-2001
          </span>
          <a 
            href="tel:1800112001"
            className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#0F3D2E] font-extrabold text-xs shadow-md transition"
          >
            Call Now
          </a>
        </div>
      </div>

    </div>
  );
}
