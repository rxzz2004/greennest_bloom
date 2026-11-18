import re

with open('frontend/src/components/AdminConsole.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove DatabaseInspectorView import
content = re.sub(r"import DatabaseInspectorView from './DatabaseInspectorView';\n?", "", content)

# 2. Remove Database from lucide-react
content = re.sub(r"\s*Database,\n?", "\n", content)

# 3. Remove db_inspector nav button
pattern = r"\s*<button\s+onClick=\{[^}]*setActiveTab\('db_inspector'\)[^}]*\}[\s\S]*?<\/button>"
content = re.sub(pattern, "", content)

# 4. Remove db_inspector from breadcrumbs if present
content = content.replace(": activeTab === 'db_inspector' ? 'Database' ", "")
content = content.replace("activeTab === 'db_inspector' ? 'Database' : ", "")

# 5. Remove any subtitles in 4 KPI cards
content = re.sub(r'\s*<span className="text-white/70 text-\[10px\] font-medium block">Current Quarter</span>', '', content)

# 6. Remove subtitle in Product Sales
content = re.sub(r'\s*<p className="text-xs text-stone-500">Monthly Revenue</p>', '', content)

# 7. Remove subtitle in Order Overview
content = re.sub(r'\s*<p className="text-xs text-stone-500 mb-6">Total Orders</p>', '', content)

# 8. Simplify titles to simple words
content = content.replace('Cold-Chain Delivery Fleet & Live GPS Tracking', 'Delivery')
content = content.replace('Seasonal Demand & Festive Sales Forecast', 'Sales Forecast')
content = content.replace('Commercial Event Staging Quotations', 'Quotes')
content = content.replace('Monthly Surprise Box Feedback & Curation', 'Subscriptions')
content = content.replace('Registered Client Directory', 'Customers')

# 9. Remove db_inspector tab panel if still present
panel_pattern = r"\s*\{\/\* Tab 8:[^\*]*\*\/\}\s*\{activeTab === 'db_inspector'[\s\S]*?\}\s*\}"
content = re.sub(panel_pattern, "", content)
panel_pattern2 = r"\s*\{activeTab === 'db_inspector'[\s\S]*?\}\s*\}"
content = re.sub(panel_pattern2, "", content)

# 10. Replace any remaining ✕ with &times;
content = content.replace('>✕<', '>&times;<')

with open('frontend/src/components/AdminConsole.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("AdminConsole cleanup done successfully!")

