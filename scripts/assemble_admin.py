import os

# 1. Read existing tabs and modals from the file
with open('frontend/src/components/AdminConsole.jsx') as f:
    old_content = f.read()

# Locate where Tab 1 begins
tab1_start_marker = "{/* TAB 1: Perishable Flower Batches */}"
tab1_idx = old_content.find(tab1_start_marker)
if tab1_idx == -1:
    raise Exception("Could not find Tab 1 start")

# From tab1 onward until the modals:
modals_start_marker = "{/* Modal 1: Log Incoming Farm Harvest Batch */}"
modals_idx = old_content.find(modals_start_marker)
if modals_idx == -1:
    raise Exception("Could not find Modal 1 start")

tab_panels = old_content[tab1_idx:modals_idx]
# Clean up any trailing </main></div> inside tab_panels
tab_panels = tab_panels.replace("</main>", "").replace("</div>\n\n      {/* Tab 8", "{/* Tab 8")

# Ensure Tab 8 is included
if "{activeTab === 'db_inspector'" not in tab_panels:
    tab_panels += """
      {/* Tab 8: Interactive Database Tables Inspector & Live Editor */}
      {activeTab === 'db_inspector' && (
        <div className="animate-in fade-in duration-200">
          <DatabaseInspectorView currentTheme="light" />
        </div>
      )}
"""

# Modals block to end
modals_block = old_content[modals_idx:]
end_div_idx = modals_block.rfind("</div>\n  );\n}")
if end_div_idx != -1:
    modals_content = modals_block[:end_div_idx].strip()
else:
    # If not found, strip the last </div> and );}
    modals_content = modals_block.strip()
    if modals_content.endswith("}"):
        # remove closing ); }
        modals_content = modals_content[:modals_content.rfind("</div>")].strip()

# Write the header, Quixlab layout, tab panels, and modals
with open('scripts/quixlab_header.jsx') as f:
    quixlab_header = f.read()

final_code = quixlab_header + "\n" + tab_panels.strip() + "\n\n        </main>\n      </div>\n\n" + modals_content.strip() + "\n\n    </div>\n  );\n}\n"

with open('frontend/src/components/AdminConsole.jsx', 'w') as f:
    f.write(final_code)

print("Rebuilt AdminConsole.jsx! Total lines:", len(final_code.splitlines()))

