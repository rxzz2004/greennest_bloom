#!/usr/bin/env python3
"""Patch AdminConsole.jsx: replace old banner+KPI+tabbar with Quixlab sidebar layout."""
import re

filepath = "frontend/src/components/AdminConsole.jsx"

with open(filepath, "r") as f:
    lines = f.readlines()

# Find the main return( line (line 337, index 336)
# and the first tab content line "TAB 1: Perishable Flower Batches" (line 451, index 450)
return_line_idx = None
tab1_line_idx = None

for i, line in enumerate(lines):
    if i > 100 and "return (" in line and return_line_idx is None:
        return_line_idx = i
    if "TAB 1: Perishable Flower Batches" in line:
        tab1_line_idx = i

print(f"return( is at line {return_line_idx + 1}")
print(f"TAB 1 is at line {tab1_line_idx + 1}")

# ---- Build the new header block (replaces lines return_line_idx+1 thru tab1_line_idx-1) ----
NEW_HEADER = '''  return (
    <div className="min-h-screen bg-[#f3f4f9] text-slate-800 flex overflow-x-hidden font-sans w-full">

      {/* ======== QUIXLAB LEFT SIDEBAR ======== */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shrink-0 z-40 shadow-sm`}>
        {/* Brand */}
        <div className="h-16 bg-[#7c5cfc] flex items-center px-5 text-white">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-lg">Q</div>
            {sidebarOpen && <span className="font-extrabold text-xl tracking-tight truncate">Quixlab</span>}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6 text-xs font-semibold text-slate-600">

          {/* DASHBOARD */}
          <div>
            {sidebarOpen && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Dashboard</p>}
            <div className="space-y-1">
              {[
                { id: 'dashboard',           label: 'Dashboard',        Icon: LayoutDashboard },
                { id: 'prophet_forecasting', label: 'Layouts & Trends', Icon: TrendingUp },
              ].map(({ id, label, Icon }) => (
                <button key={id} onClick={() => { soundEffects.playClick(); setActiveTab(id); }}
                  className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${activeTab === id ? 'bg-[#7c5cfc]/10 text-[#7c5cfc] font-bold' : 'hover:bg-slate-100'}`}>
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 shrink-0 ${activeTab === id ? 'text-[#7c5cfc]' : 'text-slate-400'}`} />
                    {sidebarOpen && <span>{label}</span>}
                  </div>
                  {sidebarOpen && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* APPS & OPERATIONS */}
          <div>
            {sidebarOpen && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Apps & Operations</p>}
            <div className="space-y-1">
              {[
                { id: 'decay_batches',    label: 'Fresh Batches',  Icon: Clock,     badge: batches.length },
                { id: 'delivery_fleet',   label: 'Delivery Fleet', Icon: Truck,     badge: drivers.length },
                { id: 'quotations',       label: 'Event Quotes',   Icon: FileText,  badge: quotations.length },
                { id: 'curation_metrics', label: 'Subscriptions',  Icon: Users,     badge: null },
              ].map(({ id, label, Icon, badge }) => (
                <button key={id} onClick={() => { soundEffects.playClick(); setActiveTab(id); }}
                  className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${activeTab === id ? 'bg-[#7c5cfc]/10 text-[#7c5cfc] font-bold' : 'hover:bg-slate-100'}`}>
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 shrink-0 ${activeTab === id ? 'text-[#7c5cfc]' : 'text-slate-400'}`} />
                    {sidebarOpen && <span>{label}</span>}
                  </div>
                  {sidebarOpen && badge !== null && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-mono">{badge}</span>
                  )}
                  {sidebarOpen && badge === null && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* MANAGEMENT */}
          <div>
            {sidebarOpen && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Management & Data</p>}
            <div className="space-y-1">
              {[
                { id: 'user_accounts',  label: 'Client Accounts', Icon: UserCheck, badge: usersList.length },
                { id: 'system_alerts',  label: 'Activity Alerts', Icon: Mail,      badge: alerts.length },
                { id: 'db_inspector',   label: 'DB Inspector',     Icon: Database,  badge: null },
              ].map(({ id, label, Icon, badge }) => (
                <button key={id} onClick={() => { soundEffects.playClick(); setActiveTab(id); }}
                  className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${activeTab === id ? 'bg-[#7c5cfc]/10 text-[#7c5cfc] font-bold' : 'hover:bg-slate-100'}`}>
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 shrink-0 ${activeTab === id ? 'text-[#7c5cfc]' : 'text-slate-400'}`} />
                    {sidebarOpen && <span>{label}</span>}
                  </div>
                  {sidebarOpen && badge !== null && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-mono">{badge}</span>
                  )}
                  {sidebarOpen && badge === null && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#7c5cfc] text-white flex items-center justify-center font-bold text-xs shrink-0">VR</div>
          {sidebarOpen && (
            <div className="truncate">
              <div className="text-xs font-bold text-slate-800">Venisha Dsouza</div>
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />Active Manager
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ======== MAIN CONTENT AREA ======== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(p => !p)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search Dashboard" value={adminSearchQuery}
                onChange={e => setAdminSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/30 focus:border-[#7c5cfc]" />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleEvaluateDecay}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#7c5cfc] hover:bg-[#6848f0] text-white font-bold text-xs shadow-sm transition-colors">
              <Clock className="w-3.5 h-3.5" /><span>Update Markdowns</span>
            </button>
            <button onClick={loadAllAdminData} title="Refresh" className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setActiveTab('system_alerts')}
              className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {alerts.length || 3}
              </span>
            </button>
            <div className="hidden md:flex items-center space-x-1 text-xs text-slate-600 font-semibold px-2 py-1 hover:bg-slate-100 rounded-lg cursor-pointer">
              <span>English</span><ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
            <div className="pl-2 border-l border-slate-200">
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                VR
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Breadcrumb for non-dashboard tabs */}
          {activeTab !== 'dashboard' && (
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <button onClick={() => setActiveTab('dashboard')} className="hover:text-[#7c5cfc] font-semibold flex items-center gap-1">
                <LayoutDashboard className="w-3.5 h-3.5" /><span>Dashboard</span>
              </button>
              <span>/</span>
              <span className="font-bold text-slate-800 capitalize">{activeTab.replace(/_/g, ' ')}</span>
            </div>
          )}

          {/* ============ DASHBOARD VIEW ============ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">

              {/* 4 KPI Gradient Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-gradient-to-r from-[#7064f5] to-[#5a8dee] rounded-2xl p-6 text-white shadow-sm flex items-center justify-between relative overflow-hidden">
                  <div className="z-10 space-y-1">
                    <p className="text-white/80 text-xs font-semibold">Products Sold</p>
                    <div className="text-3xl font-extrabold">4565</div>
                    <p className="text-white/70 text-[10px]">Jan - March 2026</p>
                  </div>
                  <div className="z-10 p-2 rounded-xl bg-white/10"><ShoppingCart className="w-8 h-8 text-white/90" /></div>
                  <ShoppingCart className="w-32 h-32 text-white/10 absolute -right-4 -bottom-6 pointer-events-none" />
                </div>
                <div className="bg-gradient-to-r from-[#ff6b8b] to-[#ff8e71] rounded-2xl p-6 text-white shadow-sm flex items-center justify-between relative overflow-hidden">
                  <div className="z-10 space-y-1">
                    <p className="text-white/80 text-xs font-semibold">Net Profit</p>
                    <div className="text-3xl font-extrabold">
                      ₹{inventoryHealth ? inventoryHealth.estimated_spoilage_salvaged_inr.toLocaleString() : '8541'}
                    </div>
                    <p className="text-white/70 text-[10px]">Jan - March 2026</p>
                  </div>
                  <div className="z-10 p-2 rounded-xl bg-white/10"><DollarSign className="w-8 h-8 text-white/90" /></div>
                  <DollarSign className="w-32 h-32 text-white/10 absolute -right-4 -bottom-6 pointer-events-none" />
                </div>
                <div className="bg-gradient-to-r from-[#ff9b44] to-[#f9b16e] rounded-2xl p-6 text-white shadow-sm flex items-center justify-between relative overflow-hidden">
                  <div className="z-10 space-y-1">
                    <p className="text-white/80 text-xs font-semibold">New Customers</p>
                    <div className="text-3xl font-extrabold">{usersList.length || 4565}</div>
                    <p className="text-white/70 text-[10px]">Jan - March 2026</p>
                  </div>
                  <div className="z-10 p-2 rounded-xl bg-white/10"><Users className="w-8 h-8 text-white/90" /></div>
                  <Users className="w-32 h-32 text-white/10 absolute -right-4 -bottom-6 pointer-events-none" />
                </div>
                <div className="bg-gradient-to-r from-[#2475fc] to-[#43b9ff] rounded-2xl p-6 text-white shadow-sm flex items-center justify-between relative overflow-hidden">
                  <div className="z-10 space-y-1">
                    <p className="text-white/80 text-xs font-semibold">Customer Satisfaction</p>
                    <div className="text-3xl font-extrabold">99%</div>
                    <p className="text-white/70 text-[10px]">Jan - March 2026</p>
                  </div>
                  <div className="z-10 p-2 rounded-xl bg-white/10"><Heart className="w-8 h-8 text-white/90" /></div>
                  <Heart className="w-32 h-32 text-white/10 absolute -right-4 -bottom-6 pointer-events-none" />
                </div>
              </div>

              {/* Product Sales Wave Chart */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Product Sales</h3>
                    <p className="text-xs text-slate-400">Total Earnings of the Month</p>
                    <div className="text-2xl font-black text-slate-900 mt-1">$ 12,555</div>
                  </div>
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-500">
                    {['day', 'week', 'month'].map(r => (
                      <button key={r} onClick={() => setSalesTimeRange(r)}
                        className={`px-3 py-1 rounded-lg capitalize transition-all ${salesTimeRange === r ? 'bg-white text-slate-900 font-bold shadow-sm' : 'hover:text-slate-800'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-full h-56 overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 900 220" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="purpleWave" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#7c5cfc" stopOpacity="0.02" />
                      </linearGradient>
                      <linearGradient id="pinkWave" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ff758c" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#ff758c" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    {/* Pink area */}
                    <path d="M 0,175 Q 90,135 180,155 T 360,100 T 540,140 T 720,120 T 900,150 L 900,220 L 0,220 Z" fill="url(#pinkWave)" />
                    <path d="M 0,175 Q 90,135 180,155 T 360,100 T 540,140 T 720,120 T 900,150" fill="none" stroke="#ff758c" strokeWidth="3" />
                    {/* Purple area */}
                    <path d="M 0,190 Q 120,185 240,145 T 480,155 T 620,30 T 780,145 T 900,80 L 900,220 L 0,220 Z" fill="url(#purpleWave)" />
                    <path d="M 0,190 Q 120,185 240,145 T 480,155 T 620,30 T 780,145 T 900,80" fill="none" stroke="#7c5cfc" strokeWidth="3" />
                    {/* Dots */}
                    <circle cx="360" cy="100" r="4" fill="#fff" stroke="#ff758c" strokeWidth="2.5" />
                    <circle cx="720" cy="120" r="4" fill="#fff" stroke="#ff758c" strokeWidth="2.5" />
                    <circle cx="620" cy="30"  r="5" fill="#fff" stroke="#7c5cfc" strokeWidth="3" />
                    <circle cx="240" cy="145" r="4" fill="#fff" stroke="#7c5cfc" strokeWidth="2.5" />
                  </svg>
                </div>
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-600"><span>Pixel 2</span><span className="text-slate-400">45%</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#ff758c] h-1.5 rounded-full" style={{width:'45%'}} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-600"><span>iPhone X</span><span className="text-slate-400">70%</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#7c5cfc] h-1.5 rounded-full" style={{width:'70%'}} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Bottom Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Order Summary Bar Chart */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-4">Order Summary</h3>
                  <div className="flex items-end justify-between gap-1 h-44">
                    <div className="flex flex-col justify-between h-full text-[10px] text-slate-400 pr-1 select-none pb-0.5">
                      {['100','75','50','25','0'].map(v => <span key={v}>{v}</span>)}
                    </div>
                    {[{p:88,q:68},{p:62,q:52},{p:40,q:32},{p:65,q:55},{p:42,q:36},{p:60,q:50},{p:82,q:74}].map((g,i) => (
                      <div key={i} className="flex items-end space-x-0.5 group flex-1 justify-center">
                        <div style={{height:`${g.p}%`}} className="w-2.5 bg-[#ff758c] rounded-t-sm" />
                        <div style={{height:`${g.q}%`}} className="w-2.5 bg-[#7c5cfc] rounded-t-sm" />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center space-x-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500 mt-2">
                    <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ff758c]" /><span>Online</span></div>
                    <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#7c5cfc]" /><span>Offline</span></div>
                  </div>
                </div>

                {/* Order Overview */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800">Order Overview</h3>
                  <div className="text-3xl font-black text-slate-900 mt-2">5680</div>
                  <p className="text-xs text-slate-400 mb-5">Total Revenue</p>
                  <div className="space-y-4">
                    {[
                      {label:'Online Order',      val:30, color:'#7c5cfc'},
                      {label:'Offline Order',     val:50, color:'#20c997'},
                      {label:'Cash On Delivery',  val:20, color:'#f89b29'},
                    ].map(({label,val,color}) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold text-slate-800">{val} <span className="text-slate-400 font-normal">{label}</span></span>
                          <span className="font-bold text-slate-600">{val}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div style={{width:`${val}%`, backgroundColor:color}} className="h-1.5 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Todo */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
                  <h3 className="text-base font-bold text-slate-800 mb-4">Todo</h3>
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {todoList.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 group">
                        <label className="flex items-center space-x-3 cursor-pointer flex-1">
                          <input type="checkbox" checked={item.completed} onChange={() => handleToggleTodo(item.id)}
                            className="w-4 h-4 rounded text-[#7c5cfc] focus:ring-[#7c5cfc]/30" />
                          <span className={`text-xs font-medium ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</span>
                        </label>
                        <button onClick={() => handleDeleteTodo(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-slate-100 mt-3">
                    <input type="text" placeholder="Write new item and hit Enter..." value={newTodoInput}
                      onChange={e => setNewTodoInput(e.target.value)} onKeyDown={handleAddTodo}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/30 focus:border-[#7c5cfc]" />
                  </div>
                </div>
              </div>
            </div>
          )}

'''

# ---- Find the closing </div> of the wrapper and the closing ); of the return ----
# Everything from tab1_line_idx onwards (tab panels + modals) stays unchanged
# We need to wrap them in </main></div> before the modals block
# Find "Modal 1" line
modal1_line_idx = None
for i, line in enumerate(lines):
    if "Modal 1: Log Incoming Farm Harvest Batch" in line:
        modal1_line_idx = i
        break

# Find the LAST two closing lines: </div>\n  );\n}
last_closing_idx = len(lines) - 1
while last_closing_idx >= 0 and "})" not in lines[last_closing_idx] and ")" not in lines[last_closing_idx]:
    last_closing_idx -= 1

print(f"Modal 1 is at line {modal1_line_idx + 1}")
print(f"Last tab content ends before modals at line {modal1_line_idx}")

# Build replacement:
# Lines 0..return_line_idx  ->  unchanged (up to and including the old `return (` line)
# Lines return_line_idx+1 .. tab1_line_idx-1 -> REPLACED with NEW_HEADER
# Lines tab1_line_idx .. modal1_line_idx-1   -> unchanged tab panels
# Lines modal1_line_idx .. end               -> add </main></div> before first modal, then rest unchanged

# Actually, we close the <main> and outer <div> before the modals
INSERT_CLOSE = "        </main>\n      </div>\n\n"

new_lines = (
    lines[:return_line_idx]
    + [NEW_HEADER]
    + lines[tab1_line_idx:modal1_line_idx]
    + [INSERT_CLOSE]
    + lines[modal1_line_idx:]
)

# Fix the final </div>\n  );\n} to close just the outer wrapper div
# The old code ends: \n    </div>\n  );\n}
# We need to keep that as-is since we already have our own closing structure.
# But the modals now sit inside the outer wrapper div, so we just keep the final closing.
with open(filepath, "w") as f:
    f.writelines(new_lines)

print(f"Done! Written {len(new_lines)} lines to {filepath}")

# Quick sanity check
with open(filepath) as f:
    text = f.read()
assert "Quixlab" in text, "ERROR: Quixlab not found in output!"
assert "Order Summary" in text, "ERROR: Order Summary not found!"
print("Sanity check PASSED - Quixlab code is present.")

