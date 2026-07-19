import React from 'react';
import { TrendingDown, TrendingUp, ChevronDown, X } from 'lucide-react';
import Gauge from './Gauge';

export default function DashboardPreview() {
  return (
    <div className="px-3 sm:px-4 mt-8 sm:mt-12 w-full">
      <div className="bg-[#f5f2ee] rounded-3xl p-4 sm:p-6 w-full max-w-[880px] mx-auto text-left shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          
          {/* Card 1 — Clicks */}
          <div className="bg-white rounded-2xl p-5 flex flex-col shadow-sm">
            <div className="flex justify-between items-center text-[13px] mb-2 font-medium">
              <span className="text-[#ef4d23]">Clicks</span>
              <span className="text-neutral-500">This Month</span>
            </div>
            
            <div className="flex items-end gap-2 mb-1">
              <span className="text-[28px] font-semibold leading-none text-neutral-900">6,896</span>
              <div className="bg-red-50 text-red-600 rounded-full px-2 py-0.5 flex items-center gap-1 text-[11px] font-medium mb-0.5">
                <TrendingDown className="w-3 h-3" strokeWidth={3} />
                -3,382 (33%)
              </div>
            </div>
            <p className="text-[12px] text-neutral-500 mb-6">Compared to yesterday</p>

            <div className="text-center text-[12px] font-medium text-neutral-700 mb-2">
              Month Target achieved
            </div>
            
            <div className="flex-1">
              <Gauge value={92} showLabels min="389K" max="425K" />
            </div>

            <div className="mt-6 bg-neutral-100 rounded-full p-1 flex text-[12px] font-medium">
              <button className="flex-1 py-1.5 px-3 bg-white rounded-full shadow-sm text-neutral-900">
                Impressions
              </button>
              <button className="flex-1 py-1.5 px-3 text-neutral-500 hover:text-neutral-700">
                Clicks
              </button>
            </div>
          </div>

          {/* Card 2 — Form */}
          <div className="bg-white rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-neutral-700 font-medium">Show figures for</label>
              <button className="flex items-center justify-between w-full border border-neutral-200 rounded-lg px-3 py-2 text-[13px] text-neutral-900 font-medium hover:bg-neutral-50 transition-colors">
                This month
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-neutral-700 font-medium">Compare period by</label>
              <button className="flex items-center justify-between w-full border border-neutral-200 rounded-lg px-3 py-2 text-[13px] text-neutral-900 font-medium hover:bg-neutral-50 transition-colors">
                Month-to-date (MTD)
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-neutral-700 font-medium">Ste targets (This month)</label>
              <div className="flex items-center w-full border border-neutral-200 rounded-lg px-3 py-2 text-[13px] text-neutral-900 font-medium focus-within:border-neutral-400 transition-colors">
                <span className="text-neutral-400 mr-2">#</span>
                <input type="text" defaultValue="10" className="w-full outline-none bg-transparent" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-neutral-700 font-medium">Ste targets (This year)</label>
              <div className="flex items-center w-full border border-neutral-200 rounded-lg px-3 py-2 text-[13px] text-neutral-900 font-medium focus-within:border-neutral-400 transition-colors">
                <span className="text-neutral-400 mr-2">#</span>
                <input type="text" defaultValue="100" className="w-full outline-none bg-transparent" />
              </div>
            </div>

            <div className="mt-auto pt-2 flex items-center gap-4">
              <button className="bg-[#ef4d23] text-white rounded-lg px-5 py-2 text-[13px] font-medium hover:opacity-90 transition-opacity">
                Save
              </button>
              <button className="text-[13px] text-neutral-600 font-medium hover:underline">
                Cancel
              </button>
              <button className="ml-auto text-neutral-400 hover:text-neutral-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Card 3 — Video Starts */}
          <div className="bg-white rounded-2xl p-5 flex flex-col shadow-sm">
            <div className="flex justify-between items-center text-[13px] mb-2 font-medium">
              <span className="text-[#ef4d23]">Video Starts</span>
              <span className="text-neutral-500">today</span>
            </div>
            
            <div className="flex items-end gap-2 mb-1">
              <span className="text-[28px] font-semibold leading-none text-neutral-900">0</span>
              <div className="bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5 flex items-center gap-1 text-[11px] font-medium mb-0.5">
                <TrendingUp className="w-3 h-3" strokeWidth={3} />
                0
              </div>
            </div>
            <p className="text-[12px] text-neutral-500 mb-10">Compared to yesterday</p>

            <div className="flex-1 mt-4">
              <Gauge value={68} color="#9ca3af" showLabels={false} />
            </div>

            <div className="mt-6 bg-neutral-100 rounded-full p-1 flex text-[12px] font-medium">
              <button className="flex-1 py-1.5 px-3 bg-white rounded-full shadow-sm text-neutral-900">
                Video Clicks
              </button>
              <button className="flex-1 py-1.5 px-3 text-neutral-500 hover:text-neutral-700">
                Video Starts
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
