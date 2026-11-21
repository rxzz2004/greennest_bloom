import os

def update_admin_watering():
    path = "frontend/src/components/AdminConsole.jsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Add Droplets to imports if not already imported
    if "Droplets," not in content and "Droplets" not in content:
        content = content.replace("import {\n  ShieldCheck,", "import {\n  Droplets,\n  ShieldCheck,")
        content = content.replace("import { \n  ShieldCheck,", "import { \n  Droplets,\n  ShieldCheck,")

    # 2. Add state and handlers
    state_target = "  const [newWatering, setNewWatering] = useState('Water when topsoil feels dry');"
    new_state_and_handlers = """  const [newWatering, setNewWatering] = useState('Water when topsoil feels dry');

  // Dynamic Watering Care Options with localStorage persistence for future plants
  const DEFAULT_WATERING_OPTIONS = [
    'Water when topsoil feels dry',
    'Water 2-3 times a week',
    'Keep soil consistently moist',
    'Allow soil to dry out between waterings',
    'Water sparingly once a week',
    'Mist foliage daily (high humidity)',
    'Ensure pot has good drainage holes',
    'Bottom water to prevent leaf rot',
    'Reduce watering in winter months',
    'Change vase water every 48 hours (Cut blooms)',
    'Trim stem ends diagonally 1cm under running water',
    'Use room temperature chlorine-free water'
  ];

  const [wateringOptions, setWateringOptions] = useState(() => {
    try {
      const saved = localStorage.getItem('greennest_custom_watering_options');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.from(new Set([...DEFAULT_WATERING_OPTIONS, ...parsed]));
      }
    } catch (e) {
      console.warn('Could not load custom watering options:', e);
    }
    return DEFAULT_WATERING_OPTIONS;
  });

  const [selectedWateringOptions, setSelectedWateringOptions] = useState(['Water when topsoil feels dry']);
  const [showAddWateringInput, setShowAddWateringInput] = useState(false);
  const [customWateringInput, setCustomWateringInput] = useState('');

  const handleToggleWateringOption = (option) => {
    soundEffects.playClick();
    let updated;
    if (selectedWateringOptions.includes(option)) {
      updated = selectedWateringOptions.filter((item) => item !== option);
    } else {
      updated = [...selectedWateringOptions, option];
    }
    setSelectedWateringOptions(updated);
    setNewWatering(updated.join(' • '));
  };

  const handleAddCustomWateringOption = (e) => {
    e.preventDefault();
    const trimmed = customWateringInput.trim();
    if (!trimmed) return;
    soundEffects.playSuccessChime();

    let updatedOptions = wateringOptions;
    if (!wateringOptions.includes(trimmed)) {
      updatedOptions = [...wateringOptions, trimmed];
      setWateringOptions(updatedOptions);
      try {
        const existingCustom = JSON.parse(localStorage.getItem('greennest_custom_watering_options') || '[]');
        if (!existingCustom.includes(trimmed)) {
          localStorage.setItem('greennest_custom_watering_options', JSON.stringify([...existingCustom, trimmed]));
        }
      } catch (err) {
        console.warn('Failed to save custom watering option:', err);
      }
    }

    const updatedSelected = selectedWateringOptions.includes(trimmed)
      ? selectedWateringOptions
      : [...selectedWateringOptions, trimmed];
    setSelectedWateringOptions(updatedSelected);
    setNewWatering(updatedSelected.join(' • '));

    setCustomWateringInput('');
    setShowAddWateringInput(false);
  };"""

    if state_target not in content:
        print("Error: state_target not found")
        return False
    content = content.replace(state_target, new_state_and_handlers)

    # 3. Remove Quick Presets from Nursery Gallery
    presets_target = """                  {/* Preset Photos Quick Buttons */}
                  <div>
                    <span className="text-[11px] font-bold text-stone-600 block mb-1.5">Quick Presets from Nursery Gallery:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Monstera Albo', url: '/monstera_plant_pot.jpg' },
                        { label: 'Snake Plant', url: '/snake_plant_pot.jpg' },
                        { label: 'Fiddle Leaf Fig', url: '/fiddle_fig_pot.jpg' },
                        { label: 'ZZ Plant', url: '/zz_plant.jpg' },
                        { label: 'Krishna Tulsi', url: '/krishna_tulsi.jpg' },
                        { label: 'Areca Palm', url: '/arecanut_palm.jpg' },
                        { label: 'Bridal Bouquet', url: '/lily_bouquet_realistic.jpg' },
                        { label: 'Rose Bouquet', url: '/rose_bouquet_realistic.jpg' },
                        { label: 'Wildflower Medley', url: '/sunflower_bouquet.jpg' },
                        { label: 'Orchid Stem', url: '/orchid_bouquet_realistic.jpg' },
                        { label: 'Peony Bouquet', url: '/peony_bouquet_realistic.jpg' },
                        { label: 'Saffron Marigold', url: '/saffron_marigold.jpg' }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleAddPresetImage(preset.url)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200 text-stone-700 text-[11px] font-medium transition-colors"
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>"""

    if presets_target not in content:
        print("Error: presets_target not found")
        return False
    content = content.replace(presets_target + "\n\n", "")

    # 4. Replace Watering Input with interactive selectable pills + custom requirement input
    watering_field_target = """                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Watering &amp; Hydration Care Instructions
                    </label>
                    <input
                      type="text"
                      value={newWatering}
                      onChange={(e) => setNewWatering(e.target.value)}
                      placeholder="e.g. Water every 2-3 days or change cold vase water daily"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-800 text-xs"
                    />
                  </div>"""

    new_watering_field = """                  {/* Interactive Multi-Select Watering Care Options */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-stone-700 text-xs flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-blue-600" />
                        <span>Watering &amp; Hydration Instructions (Select Options)</span>
                      </label>
                      <span className="text-[10px] text-stone-400">
                        {selectedWateringOptions.length} selected
                      </span>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-2">
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {wateringOptions.map((opt) => {
                          const isSelected = selectedWateringOptions.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleToggleWateringOption(opt)}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all flex items-center space-x-1 cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                                  : 'bg-white text-stone-700 hover:bg-blue-50 hover:text-blue-900 border border-stone-200/80'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                              <span>{opt}</span>
                            </button>
                          );
                        })}

                        {/* Button or input to add a custom requirement for this and future plants */}
                        {!showAddWateringInput ? (
                          <button
                            type="button"
                            onClick={() => {
                              soundEffects.playClick();
                              setShowAddWateringInput(true);
                            }}
                            className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors flex items-center space-x-1 cursor-pointer"
                            title="Add a custom requirement that will be saved for this and future plants"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Add Custom Requirement</span>
                          </button>
                        ) : (
                          <form
                            onSubmit={handleAddCustomWateringOption}
                            className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-emerald-400 shadow-xs"
                          >
                            <input
                              type="text"
                              autoFocus
                              value={customWateringInput}
                              onChange={(e) => setCustomWateringInput(e.target.value)}
                              placeholder="e.g. Soak root ball every 4 days"
                              className="px-2 py-0.5 text-xs text-stone-800 outline-none w-48 font-medium"
                            />
                            <button
                              type="submit"
                              className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddWateringInput(false);
                                setCustomWateringInput('');
                              }}
                              className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </form>
                        )}
                      </div>

                      {/* Combined result saved to product */}
                      <div className="pt-1.5 border-t border-stone-200/60">
                        <span className="text-[10px] text-stone-400 block mb-1">
                          Care Instruction Preview (Auto-combined from selections):
                        </span>
                        <input
                          type="text"
                          value={newWatering}
                          onChange={(e) => setNewWatering(e.target.value)}
                          placeholder="Select options above or edit text..."
                          className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-stone-800 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>"""

    if watering_field_target not in content:
        print("Error: watering_field_target not found")
        return False
    content = content.replace(watering_field_target, new_watering_field)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

    print("Successfully updated AdminConsole.jsx with watering care multi-select & removed preset section!")
    return True

if __name__ == "__main__":
    update_admin_watering()
