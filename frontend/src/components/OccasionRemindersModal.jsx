import React, { useState, useEffect } from 'react';
import { CalendarHeart, Plus, ShoppingBag, Sparkles, Check } from 'lucide-react';
import { api } from '../api';

export default function OccasionRemindersModal({ isOpen, onClose, onQuickReorder }) {
  const [reminders, setReminders] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    recipient_name: '',
    occasion_type: 'Birthday',
    occasion_date: '',
    preferred_flower_type: 'Dutch Red Velvet Roses',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadReminders();
    }
  }, [isOpen]);

  async function loadReminders() {
    try {
      const res = await api.getReminders();
      if (res.reminders) setReminders(res.reminders);
    } catch (err) {
      console.error('Error loading reminders:', err);
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.recipient_name || !form.occasion_date) return;
    try {
      await api.createReminder(form);
      loadReminders();
      setShowAddForm(false);
      setForm({
        recipient_name: '',
        occasion_type: 'Birthday',
        occasion_date: '',
        preferred_flower_type: 'Dutch Red Velvet Roses',
        notes: ''
      });
    } catch (err) {
      alert('Error adding reminder');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        <div className="flex items-start justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
              <CalendarHeart className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-900">Personal Occasion Reminders</h3>
              <p className="text-xs text-stone-500">Automated memory calendar with 1-tap celebratory reorder</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 font-bold p-1">
            ✕
          </button>
        </div>

        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {reminders.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-6">No occasion reminders configured yet.</p>
          ) : (
            reminders.map((rem) => (
              <div key={rem.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-stone-900">{rem.recipient_name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">
                      {rem.occasion_type}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Date: <strong className="text-stone-800">{rem.occasion_date}</strong>
                  </p>
                  <p className="text-xs text-emerald-800 font-medium">
                    Favorite: {rem.preferred_flower_type}
                  </p>
                </div>

                <button
                  onClick={() => {
                    onQuickReorder({
                      id: `reorder_${rem.id}`,
                      name: `${rem.preferred_flower_type} (${rem.occasion_type} Special)`,
                      base_price: 1100.0,
                      effective_price: 1100.0,
                      quantity: 1,
                      is_perishable: true,
                      category: 'cut_flower',
                      image_url: '/rose_bouquet_realistic.jpg'
                    });
                    onClose();
                  }}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:brightness-110 text-white text-xs font-bold shadow-sm shadow-rose-500/20 transition-all shrink-0"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>1-Tap Reorder</span>
                </button>
              </div>
            ))
          )}

          {showAddForm ? (
            <form onSubmit={handleAdd} className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-3 text-xs">
              <h4 className="font-bold text-stone-900">Add New Occasion Reminder</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-600 mb-1">Recipient Name:</label>
                  <input
                    type="text"
                    required
                    value={form.recipient_name}
                    onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                    className="w-full p-2 bg-white rounded-lg border border-stone-300 text-xs"
                    placeholder="e.g. Eleanor (Mom)"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Occasion Type:</label>
                  <select
                    value={form.occasion_type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const defaults = {
                        'Diwali & Lakshmi Pooja': 'Marigold (Genda Phool) Garlands & Sacred Lotus',
                        'Ganesh Chaturthi Pooja': 'Red Hibiscus (Jaswand), Durva Grass & Marigolds',
                        'Navratri & Durga Puja': 'Pink Lotus, Red Roses & Marigold Malas',
                        'Makar Sankranti & Pongal': 'Yellow Chrysanthemums, Marigolds & Turmeric foliage',
                        'Onam Pookkalam': 'Mixed Petals (Marigold, Chethi, Gomphrena, Balsam)',
                        'Holi Spring Celebration': 'Palash (Tesu Blooms) & Multi-hued Roses',
                        'Raksha Bandhan': 'Pastel Carnations, Orchids & Sweet Peach Roses',
                        'Karwa Chauth': 'Dutch Scarlet Roses & Crimson Petals',
                        'Gudi Padwa / Ugadi': 'Yellow Marigold Torans & Neem-Mango foliage',
                        'Maha Shivratri Pooja': 'White Jasmine (Mogra), Blue Lotus & Bael foliage',
                        'Eid Celebration': 'Fragrant Jasmine / Mogra Gajras & Damask Roses',
                        'Birthday': 'Pink Oriental Lilies & Peach Roses',
                        'Anniversary': 'Red Dutch Roses & White Carnations',
                        'Valentine': 'Long-Stem Scarlet Roses & Stargazer Lilies',
                        "Mother's Day": 'Pastel Pink Carnations & Lavender Hydrangeas'
                      };
                      setForm({
                        ...form,
                        occasion_type: newType,
                        preferred_flower_type: defaults[newType] || form.preferred_flower_type
                      });
                    }}
                    className="w-full p-2 bg-white rounded-lg border border-stone-300 text-xs font-medium"
                  >
                    <optgroup label="Major Indian Festivals">
                      <option value="Diwali & Lakshmi Pooja">Diwali & Lakshmi Pooja (Deepavali)</option>
                      <option value="Ganesh Chaturthi Pooja">Ganesh Chaturthi Pooja</option>
                      <option value="Navratri & Durga Puja">Navratri & Durga Puja</option>
                      <option value="Makar Sankranti & Pongal">Makar Sankranti & Pongal</option>
                      <option value="Onam Pookkalam">Onam Harvest Pookkalam</option>
                      <option value="Holi Spring Celebration">Holi Spring Celebration</option>
                      <option value="Raksha Bandhan">Raksha Bandhan</option>
                      <option value="Karwa Chauth">Karwa Chauth</option>
                      <option value="Gudi Padwa / Ugadi">Gudi Padwa / Ugadi New Year</option>
                      <option value="Maha Shivratri Pooja">Maha Shivratri Pooja</option>
                      <option value="Eid Celebration">Eid Celebration & Gifting</option>
                    </optgroup>
                    <optgroup label="Personal & Family Celebrations">
                      <option value="Birthday">Birthday</option>
                      <option value="Anniversary">Anniversary</option>
                      <option value="Valentine">Valentine's Day</option>
                      <option value="Mother's Day">Mother's Day</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-600 mb-1">Date:</label>
                  <input
                    type="date"
                    required
                    value={form.occasion_date}
                    onChange={(e) => setForm({ ...form, occasion_date: e.target.value })}
                    className="w-full p-2 bg-white rounded-lg border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Preferred Flowers:</label>
                  <input
                    type="text"
                    value={form.preferred_flower_type}
                    onChange={(e) => setForm({ ...form, preferred_flower_type: e.target.value })}
                    className="w-full p-2 bg-white rounded-lg border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-stone-300 hover:border-emerald-600 hover:text-emerald-800 text-stone-600 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Occasion Reminder</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
