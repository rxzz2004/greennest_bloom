import re
import os

def update_ui():
    filepath = "frontend/src/components/AdminConsole.jsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    start_marker = "{/* TAB 2: Seasonal Demand & Sales Forecast */}"
    end_marker = "{/* TAB 3: Event Quotations Manager */}"

    if start_marker not in content or end_marker not in content:
        print("Error: Could not find markers in AdminConsole.jsx")
        return False

    old_section = content.split(start_marker)[1].split(end_marker)[0]

    new_section = """
      {activeTab === 'prophet_forecasting' && forecastData && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Sales Forecast & Festive Demand Engine
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Dynamic System Sync (2026-11-22)
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Past 60 days actuals (including last week's Diwali surge) &rarr; Next 45 days projections (Christmas & New Year peak)
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-600"></span> Actual Sales</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400"></span> Festive Shock Days</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-indigo-600"></span> Projected Demand</span>
            </div>
          </div>

          {/* Forecasting KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
              <span className="text-xs text-indigo-900 font-bold block mb-1">Projected 45-Day Stem Demand</span>
              <div className="text-2xl font-bold font-serif text-indigo-950">
                {forecastData.metrics?.total_projected_stems?.toLocaleString()} stems
              </div>
              <span className="text-[11px] text-indigo-700">Baseline consumer, event & holiday uptake</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <span className="text-xs text-emerald-900 font-bold block mb-1">Recommended Stem Procurement</span>
              <div className="text-2xl font-bold font-serif text-emerald-950">
                {forecastData.metrics?.recommended_procurement_stems?.toLocaleString()} stems
              </div>
              <span className="text-[11px] text-emerald-700">+15% safety buffer against festive stockouts</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50/50 border border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-900 font-bold block mb-1">Predicted Peak Festive Shock</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">Next Month</span>
              </div>
              <div className="text-lg font-bold font-serif text-amber-950 leading-snug">
                {forecastData.metrics?.peak_event}
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                Peak: {forecastData.metrics?.peak_projected_date} ({Math.round(forecastData.metrics?.peak_projected_stems)} stems/day)
              </span>
            </div>
          </div>

          {/* UPCOMING FESTIVE SPOTLIGHT: Christmas & Holiday Season Demand Breakdown */}
          {forecastData.target_peak_insights && (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50/70 via-emerald-50/30 to-stone-50 border border-amber-200/80 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white tracking-wide uppercase">
                      Upcoming Peak: December 2026
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {forecastData.target_peak_insights.demand_surge_multiplier}
                    </span>
                  </div>
                  <h4 className="font-serif text-lg font-bold text-stone-900">
                    {forecastData.target_peak_insights.event_name}
                  </h4>
                  <p className="text-xs text-stone-600">
                    Surge Window: <strong>{forecastData.target_peak_insights.peak_window}</strong> (Projected Peak: {forecastData.target_peak_insights.peak_date} &bull; {forecastData.target_peak_insights.projected_peak_stems} stems/day)
                  </p>
                </div>
                {forecastData.recent_concluded_festivals?.[0] && (
                  <div className="bg-white/90 p-2.5 rounded-2xl border border-stone-200/80 text-xs text-left md:text-right">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Recently Concluded</span>
                    <span className="font-bold text-emerald-800">{forecastData.recent_concluded_festivals[0].event_name}</span>
                    <span className="text-[11px] text-stone-500 block">Celebrated last week (Nov 8&ndash;14 in 60d actuals)</span>
                  </div>
                )}
              </div>

              {/* Top 5 High-Demand Botanical Species Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    High-Demand Flowers & Plants Forecasted for Christmas
                  </span>
                  <span className="text-[11px] text-amber-900 font-semibold bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-200/60">
                    Lead Time: {forecastData.target_peak_insights.lead_time_days} days &bull; Pre-order by {forecastData.target_peak_insights.recommended_procurement_date}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {forecastData.target_peak_insights.high_demand_products?.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs space-y-2 hover:border-amber-400 hover:shadow-xs transition-all">
                      <div className="flex items-start justify-between gap-1">
                        <h5 className="font-bold text-stone-900 text-xs leading-snug">{item.name}</h5>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 shrink-0">
                          {item.expected_demand_multiplier}
                        </span>
                      </div>
                      <div className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                        {item.category}
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        <strong>Use:</strong> {item.primary_use}
                      </p>
                      <div className="text-[10px] text-stone-700 bg-stone-50 p-2 rounded-xl border border-stone-200/60">
                        <span className="font-bold text-stone-800">Nursery Strategy: </span>
                        {item.procurement_guidance}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-white/95 rounded-2xl border border-amber-200/70 text-xs text-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-amber-950 shrink-0">Procurement Action Plan:</span>
                <span className="text-stone-600 text-[11px]">{forecastData.target_peak_insights.procurement_action_plan}</span>
              </div>
            </div>
          )}

          {/* Forecast Chart Representation */}
          <div className="p-5 bg-stone-900 text-white rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs text-stone-400">
              <span>Sales & Demand Timeline (Past 60 Days Actuals &rarr; Next 45 Days Projected Demand)</span>
              <span className="text-xs text-emerald-400 font-semibold">Seasonal Trend Decomposition</span>
            </div>

            {/* Visual SVG Sparkline Trend with Festival Badges & Tooltips */}
            <div className="h-48 w-full flex items-end space-x-1 pt-6 pb-2 overflow-x-auto">
              {forecastData.historical_sample?.map((pt, idx) => (
                <div key={`h_${idx}`} className="group relative flex-1 min-w-[7px] h-full flex items-end">
                  <div 
                    className={`w-full rounded-t-xs transition-all ${
                      pt.holiday_flag
                        ? 'bg-amber-400 hover:bg-amber-300 ring-2 ring-amber-300 shadow-sm'
                        : 'bg-emerald-600 hover:bg-emerald-400'
                    }`}
                    style={{ height: `${Math.min((pt.y / 500) * 100, 100)}%` }}
                  ></div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                    <div className="bg-stone-950 text-white text-[10px] px-2.5 py-1 rounded-md shadow-xl border border-stone-700 whitespace-nowrap text-center">
                      <div className="font-bold text-emerald-300">{pt.ds} (Actual)</div>
                      <div>Sales: <strong>{pt.y}</strong> stems</div>
                      {pt.holiday_flag && (
                        <div className="text-amber-300 font-semibold mt-0.5">{pt.holiday_flag}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="w-1.5 h-full bg-rose-500 mx-1 shrink-0 flex items-center justify-center relative group" title="Today Boundary (2026-11-22)">
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-rose-950 text-rose-200 text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap font-bold">
                  TODAY (2026-11-22)
                </div>
              </div>
              {forecastData.forecast_points?.map((pt, idx) => (
                <div key={`f_${idx}`} className="group relative flex-1 min-w-[7px] h-full flex items-end">
                  <div 
                    className={`w-full rounded-t-xs transition-all ${
                      pt.holiday_flag 
                        ? 'bg-amber-400 hover:bg-amber-300 ring-2 ring-amber-300 shadow-sm' 
                        : 'bg-indigo-500 hover:bg-indigo-400 opacity-80'
                    }`}
                    style={{ height: `${Math.min((pt.yhat / 500) * 100, 100)}%` }}
                  ></div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                    <div className="bg-stone-950 text-white text-[10px] px-2.5 py-1 rounded-md shadow-xl border border-stone-700 whitespace-nowrap text-center">
                      <div className="font-bold text-indigo-300">{pt.ds} (Forecast)</div>
                      <div>Projected: <strong>{Math.round(pt.yhat)}</strong> stems</div>
                      <div className="text-stone-400 text-[9px]">Procure: {pt.recommended_procurement} stems</div>
                      {pt.holiday_flag && (
                        <div className="text-amber-300 font-bold mt-0.5">{pt.holiday_flag}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-between items-center text-[11px] text-stone-400 font-mono border-t border-stone-800 pt-2 gap-2">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Actual Sales (Past 60d)</span>
              <span className="text-rose-400 font-bold flex items-center gap-1"><span className="w-1.5 h-3 bg-rose-500 rounded"></span> TODAY CUTOFF</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-400"></span> Festive Shock Days (Diwali actual / Christmas projected)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500"></span> Standard Demand (Next 45d)</span>
            </div>
          </div>

          {/* Indian & Universal Festive Calendar & Botanical Demand Multipliers */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                  <span>Festive Calendar & Seasonal Demand Engine</span>
                </h4>
                <p className="text-xs text-stone-500">
                  Prioritized by chronological proximity to current system date (Upcoming &rarr; Recent &rarr; Annual)
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-200">
                {forecastData.supported_festivals?.length || 16} Festivals Tagged
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(forecastData.supported_festivals || []).map((fest) => {
                const isUpcoming = fest.timeline_status === 'upcoming';
                const isRecent = fest.timeline_status === 'recent';
                return (
                  <div 
                    key={fest.id} 
                    className={`p-3.5 rounded-2xl border transition-all space-y-1.5 ${
                      isUpcoming 
                        ? 'border-amber-400 bg-amber-50/40 hover:bg-amber-50/70 shadow-2xs' 
                        : isRecent
                          ? 'border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/60'
                          : 'border-stone-200 bg-stone-50/70 hover:bg-stone-100/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h5 className="font-bold text-stone-900 text-xs">{fest.name}</h5>
                        {fest.relative_label && (
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-md mt-0.5 ${
                            isUpcoming ? 'bg-amber-200 text-amber-900' : isRecent ? 'bg-emerald-200 text-emerald-900' : 'bg-stone-200 text-stone-700'
                          }`}>
                            {fest.relative_label}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                        {fest.demand_spike_multiplier}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-1">
                      <span>{fest.season}</span>
                      <span>&bull;</span>
                      <span className="text-stone-600">{fest.category}</span>
                    </div>
                    <div className="text-[11px] text-stone-700 bg-white/90 p-2 rounded-xl border border-stone-200/60 space-y-1">
                      <p><strong>Flowers:</strong> {fest.traditional_flowers}</p>
                      <p className="text-[10px] text-stone-500 italic">{fest.sacred_significance}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    """

    content = content.replace(start_marker + old_section, start_marker + new_section)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully updated AdminConsole.jsx with updated Sales Forecast module!")
    return True

if __name__ == "__main__":
    update_ui()
