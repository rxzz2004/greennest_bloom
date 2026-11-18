import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Edit2, 
  Trash2, 
  Plus, 
  RefreshCw, 
  X, 
  Check, 
  AlertCircle,
  Key,
  Layers,
  Table as TableIcon
} from 'lucide-react';
import { api } from '../api';
import { soundEffects } from '../utils/audio';

export default function DatabaseInspectorView({ currentTheme = 'light' }) {
  const isDark = currentTheme === 'dark';
  
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit & Insert Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadTables();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadTables = async () => {
    try {
      setLoading(true);
      const res = await api.getDbTables();
      if (res.status === 'success' && res.tables) {
        setTables(res.tables);
        if (!selectedTable && res.tables.length > 0) {
          loadTableData(res.tables[0].name);
        } else if (selectedTable) {
          loadTableData(selectedTable);
        }
      }
    } catch (err) {
      showToast('Failed to load database tables: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName, search = '') => {
    setSelectedTable(tableName);
    try {
      setLoading(true);
      const res = await api.getDbTableData(tableName, search);
      if (res.status === 'success') {
        setTableData(res);
      } else {
        showToast(res.message || 'Error loading table data', 'error');
      }
    } catch (err) {
      showToast('Failed to load records: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (selectedTable) {
      loadTableData(selectedTable, val);
    }
  };

  const handleOpenEdit = (row) => {
    soundEffects.playClick();
    setIsInserting(false);
    setActiveRow(row);
    setFormData({ ...row });
    setEditModalOpen(true);
  };

  const handleOpenInsert = () => {
    soundEffects.playClick();
    setIsInserting(true);
    setActiveRow(null);
    const initial = {};
    if (tableData?.columns) {
      tableData.columns.forEach(col => {
        if (!col.pk) {
          initial[col.name] = '';
        }
      });
    }
    setFormData(initial);
    setEditModalOpen(true);
  };

  const handleFieldChange = (colName, value) => {
    setFormData(prev => ({
      ...prev,
      [colName]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedTable) return;
    setSubmitting(true);
    soundEffects.playClick();

    try {
      if (isInserting) {
        // Insert
        const res = await api.insertDbTableRow(selectedTable, formData);
        if (res.status === 'success') {
          soundEffects.playSuccessChime();
          showToast(res.message || 'Record inserted successfully!');
          setEditModalOpen(false);
          loadTableData(selectedTable, searchQuery);
          loadTables();
        } else {
          showToast(res.message || 'Failed to insert record', 'error');
        }
      } else {
        // Update
        const pkCol = tableData.pk_column || 'id';
        const rowId = activeRow[pkCol];
        const res = await api.updateDbTableRow(selectedTable, rowId, formData);
        if (res.status === 'success') {
          soundEffects.playSuccessChime();
          showToast(res.message || `Record ${pkCol}=${rowId} updated!`);
          setEditModalOpen(false);
          loadTableData(selectedTable, searchQuery);
          loadTables();
        } else {
          showToast(res.message || 'Failed to update record', 'error');
        }
      }
    } catch (err) {
      showToast('Error saving data: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    const pkCol = tableData?.pk_column || 'id';
    const rowId = row[pkCol];
    if (!window.confirm(`Are you sure you want to delete row ${pkCol}=${rowId} from table '${selectedTable}'? This directly affects the database.`)) {
      return;
    }
    soundEffects.playClick();

    try {
      const res = await api.deleteDbTableRow(selectedTable, rowId);
      if (res.status === 'success') {
        soundEffects.playSuccessChime();
        showToast(res.message || 'Record deleted.');
        loadTableData(selectedTable, searchQuery);
        loadTables();
      } else {
        showToast(res.message || 'Failed to delete record', 'error');
      }
    } catch (err) {
      showToast('Error deleting record: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-4 text-stone-900 dark:text-slate-100">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center space-x-2 text-xs font-bold animate-in fade-in ${
          toast.type === 'error'
            ? 'bg-rose-900 border-rose-700 text-rose-200'
            : 'bg-emerald-900 border-emerald-700 text-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <Check className="w-4 h-4 text-emerald-400" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header Info Banner */}
      <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-stone-200 shadow-xs'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base sm:text-lg">
              Database Table Inspector & Live Editor
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => {
              soundEffects.playClick();
              loadTables();
              if (selectedTable) loadTableData(selectedTable, searchQuery);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 ${
              isDark ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200' : 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-700'
            }`}
            title="Refresh tables"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={handleOpenInsert}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all active:scale-95 flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Insert Record</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column View: Table Selector & Table Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: 17 Tables List */}
        <div className={`lg:col-span-3 p-3 rounded-3xl border transition-colors max-h-[720px] overflow-y-auto no-scrollbar ${
          isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-stone-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-stone-100 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Tables ({tables.length})</span>
            </span>
          </div>

          <div className="space-y-1">
            {tables.map(t => {
              const isSelected = selectedTable === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => {
                    soundEffects.playClick();
                    loadTableData(t.name);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-emerald-800 text-white font-bold shadow-xs'
                      : isDark
                      ? 'text-slate-300 hover:bg-slate-700/60'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span className="truncate pr-2 font-mono text-[11px]">{t.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    isSelected 
                      ? isDark ? 'bg-emerald-950 text-emerald-200' : 'bg-emerald-950 text-emerald-200'
                      : isDark ? 'bg-slate-700 text-slate-300' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {t.row_count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Table Records & Live Editor */}
        <div className={`lg:col-span-9 p-4 sm:p-6 rounded-3xl border transition-colors flex flex-col ${
          isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-stone-200 shadow-xs'
        }`}>
          
          {/* Table Header & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-slate-700">
            <div>
              <div className="flex items-center space-x-2">
                <TableIcon className="w-4 h-4 text-emerald-600" />
                <h4 className="font-mono font-bold text-sm sm:text-base text-emerald-800 dark:text-emerald-400">
                  {selectedTable || 'Select a Table'}
                </h4>
                {tableData && (
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800">
                    {tableData.total_rows} rows • PK: {tableData.pk_column}
                  </span>
                )}
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search across columns..."
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none font-medium transition-colors ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500' : 'bg-stone-50 border-stone-300 text-stone-900 focus:border-emerald-600'
                }`}
              />
            </div>
          </div>

          {/* Table Data View */}
          <div className="flex-1 overflow-x-auto mt-3 rounded-2xl border border-stone-100 dark:border-slate-700 max-h-[600px] overflow-y-auto">
            {!tableData || tableData.rows.length === 0 ? (
              <div className="py-16 text-center text-stone-400 dark:text-slate-500 text-xs">
                {loading ? 'Loading records...' : 'No records found in this table.'}
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-stone-100 dark:bg-slate-900 text-stone-700 dark:text-slate-300 font-bold border-b border-stone-200 dark:border-slate-700 select-none z-10">
                  <tr>
                    <th className="py-2.5 px-3 whitespace-nowrap text-center">Actions</th>
                    {tableData.columns.map(col => (
                      <th key={col.name} className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                        {col.name} {col.pk && <Key className="w-3 h-3 inline text-amber-500 ml-0.5" />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-slate-800 font-mono text-[11px]">
                  {tableData.rows.map((row, rIdx) => {
                    const pkCol = tableData.pk_column || 'id';
                    const rowId = row[pkCol];
                    return (
                      <tr 
                        key={rowId || rIdx} 
                        className="hover:bg-stone-50 dark:hover:bg-slate-700/40 transition-colors"
                      >
                        {/* Actions: Edit & Delete */}
                        <td className="py-2 px-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleOpenEdit(row)}
                              className="px-2 py-1 rounded-lg text-[10px] font-sans font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800 flex items-center space-x-1"
                              title="Edit Record"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(row)}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Column Cells */}
                        {tableData.columns.map(col => {
                          const val = row[col.name];
                          const isPrice = col.name.includes('price') || col.name.includes('amount');
                          return (
                            <td key={col.name} className="py-2 px-3 align-top max-w-xs truncate">
                              {val === null || val === undefined ? (
                                <span className="text-stone-300 dark:text-slate-600 italic font-sans text-[10px]">NULL</span>
                              ) : isPrice ? (
                                <strong className="text-emerald-700 dark:text-emerald-400 font-sans">
                                  ₹{typeof val === 'number' ? val.toLocaleString() : val}
                                </strong>
                              ) : typeof val === 'string' && val.length > 50 ? (
                                <span title={val}>{val.substring(0, 48)}...</span>
                              ) : (
                                <span>{String(val)}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-2 text-[10px] text-stone-400 dark:text-slate-500 flex justify-between items-center">
            <span>Showing up to 50 latest records per query.</span>
            <span>Changes made here are permanently committed to SQLite.</span>
          </div>

        </div>

      </div>

      {/* Edit / Insert Record Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-in fade-in">
          <div className={`rounded-3xl max-w-xl w-full p-6 border shadow-2xl relative max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-stone-200 text-stone-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800">
              <div>
                <h3 className="font-serif font-bold text-lg text-emerald-800 dark:text-emerald-400 flex items-center space-x-1.5">
                  <Edit2 className="w-4 h-4" />
                  <span>{isInserting ? `Insert into '${selectedTable}'` : `Edit '${selectedTable}' Record`}</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  {isInserting ? 'Provide column values for new record' : `Modifying ${tableData?.pk_column}=${activeRow?.[tableData?.pk_column]}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 mt-4 text-xs">
              {tableData?.columns.map(col => {
                const isPk = col.pk;
                const colName = col.name;
                const val = formData[colName] !== undefined && formData[colName] !== null ? formData[colName] : '';
                const isLongText = colName.includes('description') || colName.includes('meaning') || colName.includes('address');

                return (
                  <div key={colName}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-mono font-bold text-stone-700 dark:text-slate-300 text-[11px]">
                        {colName} {isPk && <span className="text-amber-500">(Primary Key)</span>}
                      </label>
                      <span className="text-[10px] text-stone-400 font-mono">{col.type}</span>
                    </div>

                    {isPk && !isInserting ? (
                      <input
                        type="text"
                        value={val}
                        disabled
                        className="w-full p-2.5 rounded-xl border bg-stone-100 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-500 font-mono opacity-60"
                      />
                    ) : isLongText ? (
                      <textarea
                        value={val}
                        onChange={(e) => handleFieldChange(colName, e.target.value)}
                        className={`w-full p-2.5 rounded-xl border font-sans text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                        }`}
                        rows={3}
                      />
                    ) : (
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleFieldChange(colName, e.target.value)}
                        className={`w-full p-2.5 rounded-xl border font-sans text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                        }`}
                      />
                    )}
                  </div>
                );
              })}

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-stone-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md active:scale-95 transition-all flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : 'Save to Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
