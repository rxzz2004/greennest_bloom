#!/usr/bin/env python3
"""
Rebuild AdminConsole.jsx with a clean, balanced Quixlab layout.
Keeps:
  - before: lines 0-179 (imports + all state + handlers)
  - tab_panels: lines 517-1423 (all tab panel JSX + </main></div>)
  - modals_and_close: lines 1424-end (modals + );}  )
Inserts new RETURN BLOCK between before and tab_panels.
"""

filepath = "frontend/src/components/AdminConsole.jsx"

with open(filepath) as f:
    lines = f.readlines()

before            = lines[:180]          # ends: "    }\n"
tab_panels        = lines[517:517+907]   # TAB1..TAB8 + </main></div>\n
modals_and_close  = lines[517+907:]      # Modal1..}

NEW_RETURN = '''\
  return (
    <div className="min-h-screen bg-[#f3f4f9] text-slate-800 flex overflow-x-hidden font-sans w-full">

      {/* =========== LEFT SIDEBAR =========== */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shrink-0 z-40 shadow-sm`}>

        {/* Brand header */}
        <div className="h-16 bg-[#7c5cfc] flex items-center px-5">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-white text-lg">Q</div>
            {sidebarOpen && <span className="font-extrabold text-xl tracking-tight text-white truncate">Quixlab</span>}
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6 text-xs font-semibold text-slate-600">

          <div>
            {sidebarOpen && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Dashboard</p>}
            <div className="space-y-1">
              <button onClick={() => { soundEffects.playClick(); setActiveTab('dashboard'); }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-[#7c5cfc]/10 text-[#7c5cfc] font-bold' : 'hover:bg-slate-100'}`}>
                <div className="flex items-center space-x-3">
                  <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-[#7c5cfc]' : 'text-slate-400'}`} />
                  {sidebarOpen && <span>Dashboard</span>}
                </div>
                {sidebarOpen && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>
              <button onClick={() => { soundEffects.playClick(); setActiveTab('prophet_forecasting'); }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${activeTab === 'prophet_forecasting' ? 'bg-[#7c5cfc]/10 text-[#7c5cfc] font-bold' : 'hover:bg-slate-100'}`}>
                <div className="flex items-center space-x-3">
                  <TrendingUp className={`w-4 h-4 shrink-0 ${activeTab === 'prophet_forecasting' ? 'text-[#7c5cfc]' : 'text-slate-400'}`} />
                  {sidebarOpen && <span>Layouts &amp; Trends</span>}
                </div>
                {sidebarOpen && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          </div>

          <div>
            {sidebarOpen && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Apps &amp; Operations</p>}
            <div className="space-y-1">
              <button onClick={() => { soundEffects.playClick(); setActiveTab('decay_batches'); }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${activeTab === 'decay_batches' ? 'bg-[#7c5cfc]/10 text-[#7c5cfc] font-bold' : 'hover:bg-slate-100'}`}>
                <div className="flex items-center space-x-3">
                  <Clock className={`w-4 h-4 shrink-0 ${activeTab === 'decay_batches' ? 'text-[#7c5cfc]' : 'text-slate-400'}`} />
                  {sidebarOpen && <span>Fresh Batches</span>}
                </div>
                {sidebarOpen && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-mono">{batches.length}</span>}
              </button>
              <button onClick={() => { soundEffects.playClick(); setActiveTab('delivery_fleet'); }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${activeTab === 'delivery_fleet' ? 'bg-[#7c5cfc]/10 text-[#7c5cfc] font-bold' : 'hover:bg-slate-100'}`}>
                <div className="flex items-center space-x-3">
                  <Truck className={`w-4 h-4 shrink-0 ${activeTab === 'delivery_fleet' ? 'text-[#7c5cfc]' : 'text-slate-400'}`} />
                  {sidebarOpen && <span>Delivery Fleet</span>}
                </div>
                {sidebarOpen && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-mono">{drivers.length}</span>}
              </button>
              <button onClick={() => { soundEffects.playClick(); setActiveTab('quotations'); }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${activeTab === 'quotations' ? 'bg-[#7c5cfc]/10 text-[#7c5cfc] font-bold' : 'hover:bg-slate-100'}`}>
                <div className="flex items-center space-x-3">
                  <FileText className={`w-4 h-4 shrink-0 ${activeTab === 'quotations' ? 'text-[#7c5cfc]' : 'text-slate-400'}`} />
                  {sidebarOpen && <span>Event Quotes</span>}
                </div>
                {sidebarOpen && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-mono">{quotations.length}</span>}
              </button>
              <button onClick={() => { soundEffects.playClick(); setActiveTab('curation_metrics'); }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${activeTab === 'curation_metrics' ? 'bg-[#7c5cfc]/10 text-[#7c5cfc] font-bold' : 'hover:bg-slate-100'}`}>
                <div className="flex items-center space-x-3">
                  <Users className={`w-4 h-4 shrink-0 ${activeTab === 'curation_metrics' ? 'text-[#7c5cfc]' : 'text-slate-400'}`} />
                  {sidebarOpen && <span>Subscriptions</span>}
                </div>
                {sidebarOpen && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          </div>

          <div>
            {sidebarOpen && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Management &amp; Data</p>}
            <div className="space-y-1">
              <button onClick={() => { soundEffects.playClick(); setActiveTab('user_accounts'); }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${activeTab === 'user_accounts' ? 'bg-[#7c5cfc]/10 text-[#7c5cfc] font-bold' : 'hover:bg-slate-100'}`}>
                <div className="flex items-center space-x-3">
                  <UserCheck className={`w-4 h-4 shrink-0 ${activeTab === 'user_accounts' ? 'text-[#7c5cfc]' : 'text-slate-400'}`} />
                  {sidebarOpen && <span>Client Accounts</span>}
                </div>
                {sidebarOpen && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-mono">{usersList.length}</span>}
              </button>
              <button onClick={() => { soundEffects.playClick(); setActiveTab('system_alerts'); }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${activeTab === 'system_alerts' ? 'bg-[#7c5cfc]/10 text-[#7c5cfc] font-bold' : 'hover:bg-slate-100'}`}>
                <div className="flex items-center space-x-3">
                  <Mail className={`w-4 h-4 shrink-0 ${activeTab === 'system_alerts' ? 'text-[#7c5cfc]' : 'text-slate-400'}`} />
                  {sidebarOpen && <span>Activity Alerts</span>}
                </div>
                {sidebarOpen && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md font-mono font-bold">{alerts.length}</span>}
              </button>
              <button onClick={() => { soundEffects.playClick(); setActiveTab('db_inspector'); }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${activeTab === 'db_inspector' ? 'bg-[#7c5cfc]/10 text-[#7c5cfc] font-bold' : 'hover:bg-slate-100'}`}>
                <div className="flex items-center space-x-3">
                  <Database className={`w-4 h-4 shrink-0 ${activeTab === 'db_inspector' ? 'text-[#7c5cfc]' : 'text-slate-400'}`} />
                  {sidebarOpen && <span>DB Inspector</span>}
                </div>
                {sidebarOpen && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Footer */}
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

      {/* =========== MAIN CONTENT =========== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(function(p) { return !p; })} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search Dashboard" value={adminSearchQuery}
                onChange={function(e) { setAdminSearchQuery(e.target.value); }}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400" />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleEvaluateDecay}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#7c5cfc] hover:bg-[#6848f0] text-white font-bold text-xs shadow-sm transition-colors">
              <Clock className="w-3.5 h-3.5" /><span>Update Markdowns</span>
            </button>
            <button onClick={loadAllAdminData} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={function() { setActiveTab('system_alerts'); }} className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">{alerts.length || 3}</span>
            </button>
            <div className="hidden md:flex items-center space-x-1 text-xs text-slate-600 font-semibold px-2 py-1 hover:bg-slate-100 rounded-lg cursor-pointer">
              <span>English</span><ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
            <div className="pl-2 border-l border-slate-200">
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                VR
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable main */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {activeTab !== 'dashboard' && (
            <div className="flex items-center space-x-2 text-xs text-slate-500 pb-1">
              <button onClick={function() { setActiveTab('dashboard'); }} className="hover:text-purple-600 font-semibold flex items-center gap-1">
                <LayoutDashboard className="w-3.5 h-3.5" /><span>Dashboard</span>
              </button>
              <span>/</span>
              <span className="font-bold text-slate-800 capitalize">{activeTab.replace(/_/g, ' ')}</span>
            </div>
          )}

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
                      {inventoryHealth ? '\u20B9' + inventoryHealth.estimated_spoilage_salvaged_inr.toLocaleString() : '\u20B98541'}
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
                    {['day', 'week', 'month'].map(function(r) {
                      return (
                        <button key={r} onClick={function() { setSalesTimeRange(r); }}
                          className={`px-3 py-1 rounded-lg capitalize transition-all ${salesTimeRange === r ? 'bg-white text-slate-900 font-bold shadow-sm' : 'hover:text-slate-800'}`}>
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="w-full h-52 overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 900 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gPurple" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#7c5cfc" stopOpacity="0.02" />
                      </linearGradient>
                      <linearGradient id="gPink" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ff758c" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#ff758c" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <path d="M 0,165 Q 90,125 180,145 T 360,95 T 540,130 T 720,115 T 900,140 L 900,200 L 0,200 Z" fill="url(#gPink)" />
                    <path d="M 0,165 Q 90,125 180,145 T 360,95 T 540,130 T 720,115 T 900,140" fill="none" stroke="#ff758c" strokeWidth="3" />
                    <path d="M 0,180 Q 120,175 240,140 T 480,148 T 620,28 T 780,140 T 900,78 L 900,200 L 0,200 Z" fill="url(#gPurple)" />
                    <path d="M 0,180 Q 120,175 240,140 T 480,148 T 620,28 T 780,140 T 900,78" fill="none" stroke="#7c5cfc" strokeWidth="3" />
                    <circle cx="360" cy="95"  r="4" fill="#fff" stroke="#ff758c" strokeWidth="2.5" />
                    <circle cx="720" cy="115" r="4" fill="#fff" stroke="#ff758c" strokeWidth="2.5" />
                    <circle cx="620" cy="28"  r="5" fill="#fff" stroke="#7c5cfc" strokeWidth="3" />
                    <circle cx="240" cy="140" r="4" fill="#fff" stroke="#7c5cfc" strokeWidth="2.5" />
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
                {/* Order Summary */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-4">Order Summary</h3>
                  <div className="flex items-end justify-between gap-1 h-44">
                    <div className="flex flex-col justify-between h-full text-[10px] text-slate-400 pr-1 pb-0.5 select-none">
                      {['100','75','50','25','0'].map(function(v) { return <span key={v}>{v}</span>; })}
                    </div>
                    {[{p:88,q:68},{p:62,q:52},{p:40,q:32},{p:65,q:55},{p:42,q:36},{p:60,q:50},{p:82,q:74}].map(function(g,i) {
                      return (
                        <div key={i} className="flex items-end space-x-0.5 flex-1 justify-center">
                          <div style={{height:g.p+'%'}} className="w-2.5 bg-[#ff758c] rounded-t-sm" />
                          <div style={{height:g.q+'%'}} className="w-2.5 bg-[#7c5cfc] rounded-t-sm" />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center space-x-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500 mt-2">
                    <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ff758c] inline-block" /><span>Online</span></div>
                    <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#7c5cfc] inline-block" /><span>Offline</span></div>
                  </div>
                </div>

                {/* Order Overview */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800">Order Overview</h3>
                  <div className="text-3xl font-black text-slate-900 mt-2">5680</div>
                  <p className="text-xs text-slate-400 mb-5">Total Revenue</p>
                  <div className="space-y-4">
                    {[
                      {label:'Online Order',     val:30, color:'#7c5cfc'},
                      {label:'Offline Order',    val:50, color:'#20c997'},
                      {label:'Cash On Delivery', val:20, color:'#f89b29'},
                    ].map(function(item) {
                      return (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold text-slate-800">{item.val} <span className="text-slate-400 font-normal">{item.label}</span></span>
                            <span className="font-bold text-slate-600">{item.val}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div style={{width:item.val+'%', backgroundColor:item.color}} className="h-1.5 rounded-full" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Todo */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
                  <h3 className="text-base font-bold text-slate-800 mb-4">Todo</h3>
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-52">
                    {todoList.map(function(item) {
                      return (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 group">
                          <label className="flex items-center space-x-3 cursor-pointer flex-1">
                            <input type="checkbox" checked={item.completed} onChange={function() { handleToggleTodo(item.id); }}
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-300" />
                            <span className={`text-xs font-medium ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</span>
                          </label>
                          <button onClick={function() { handleDeleteTodo(item.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-4 border-t border-slate-100 mt-3">
                    <input type="text" placeholder="Write new item and hit Enter..." value={newTodoInput}
                      onChange={function(e) { setNewTodoInput(e.target.value); }} onKeyDown={handleAddTodo}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

'''

new_lines = (
    before
    + [NEW_RETURN]
    + tab_panels     # includes </main>\n      </div>\n at the end
    + modals_and_close
)

# Quick count check before writing
text = ''.join(new_lines)
ob = text.count('{')
cb = text.count('}')
op = text.count('(')
cp = text.count(')')
print(f"Braces: {{ {ob}  }} {cb}  diff={ob-cb}")
print(f"Parens: ( {op}  ) {cp}  diff={op-cp}")

with open(filepath, 'w') as f:
    f.writelines(new_lines)
print(f"Wrote {len(new_lines)} lines to {filepath}")

# Verify on combined text
# NOTE: NEW_RETURN intentionally has 'return (' unclosed; it's closed by '  );\n' in modals_and_close
# So combined diff should be 0
if ob == cb and op == cp:
    print("SUCCESS: Perfectly balanced!")
else:
    print(f"WARNING: diff {{ {ob-cb}  ( {op-cp} — check file manually")
