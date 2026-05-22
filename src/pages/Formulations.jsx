import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import Modal from '../components/Modal.jsx';
import { addFormulation, deleteFormulation } from '../services/db.js';
import { safeJsonParse } from '../utils/helpers.js';
import { Edit, Trash2, Copy, Plus, X } from 'lucide-react';

export default function Formulations({ onMenuClick }) {
  const { state, updateState, getAppState } = useAppState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '', unit: '' }]);

  const CURRENCY_SYMBOL = '$';

  const handleOpenModal = (form = null, duplicate = false) => {
    if (form) {
      setEditingForm(duplicate ? null : form);
      setName(duplicate ? `${form.Name} (Copy)` : form.Name);
      setNotes(form.Notes || '');
      const parsedIngs = safeJsonParse(form.IngredientsJSON, [{ name: '', quantity: '', unit: '' }]);
      setIngredients(parsedIngs.length > 0 ? parsedIngs : [{ name: '', quantity: '', unit: '' }]);
    } else {
      setEditingForm(null);
      setName('');
      setNotes('');
      setIngredients([{ name: '', quantity: '', unit: '' }]);
    }
    setIsModalOpen(true);
  };

  const handleAddIngredientRow = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '' }]);
  };

  const handleRemoveIngredientRow = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngs = [...ingredients];
    newIngs[index][field] = value;

    // Auto-fill unit if ingredient is selected from list
    if (field === 'name') {
      const selectedLibIng = state.ingredients.find(i => i.Name === value);
      if (selectedLibIng) {
        newIngs[index].unit = selectedLibIng.Unit || '';
      }
    }
    setIngredients(newIngs);
  };

  // Estimate cost based on ingredient library
  const calculateEstimatedCost = () => {
    let total = 0;
    ingredients.forEach(ing => {
      if (ing.name && ing.quantity) {
        const libIng = state.ingredients.find(i => i.Name === ing.name);
        if (libIng && parseFloat(libIng.Cost)) {
          total += parseFloat(libIng.Cost) * parseFloat(ing.quantity);
        }
      }
    });
    return total;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const cleanIngs = ingredients.filter(i => i.name.trim() !== '');
    if (cleanIngs.length === 0) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'At least one ingredient is required', type: 'error' } }));
      return;
    }

    const payload = {
      ID: editingForm ? editingForm.ID : Date.now().toString(),
      Name: name,
      Notes: notes,
      IngredientsJSON: JSON.stringify(cleanIngs),
      EstimatedCost: calculateEstimatedCost(),
      CreatedAt: editingForm ? editingForm.CreatedAt : new Date().toISOString()
    };

    let newForms = [...state.formulations];
    if (editingForm) {
      newForms = newForms.map(f => f.ID === payload.ID ? payload : f);
    } else {
      newForms.push(payload);
    }
    updateState({ formulations: newForms });
    setIsModalOpen(false);

    try {
      await addFormulation(payload, getAppState);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Formulation saved', type: 'success' } }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Failed to save formulation', type: 'error' } }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this formulation?')) return;

    const newForms = state.formulations.filter(f => f.ID !== id);
    updateState({ formulations: newForms });

    try {
      await deleteFormulation({ ID: id }, getAppState);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Formulation deleted', type: 'success' } }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { msg: 'Failed to delete formulation', type: 'error' } }));
    }
  };

  const sortedFormulations = [...(state.formulations || [])].sort((a, b) => {
    const aTs = new Date(a.CreatedAt || 0).getTime() || 0;
    const bTs = new Date(b.CreatedAt || 0).getTime() || 0;
    return bTs - aTs;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title="Formulations" onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-slate-600 hidden md:block">
            Design and manage herbicide mixtures. Link ingredients from the library to auto-calculate costs.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary px-4 py-2 rounded-xl shadow-md flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> New Formulation
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedFormulations.length > 0 ? (
            sortedFormulations.map(form => {
              const ings = safeJsonParse(form.IngredientsJSON, []);
              return (
                <div key={form.ID} className="bg-white p-6 rounded-xl shadow-lg relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-emerald-500/50 flex flex-col h-full">
                  <div className="absolute top-4 right-4 flex gap-1 bg-white rounded-lg shadow-sm border p-1">
                    <button onClick={() => handleOpenModal(form, true)} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Duplicate"><Copy className="w-4 h-4" /></button>
                    <button onClick={() => handleOpenModal(form)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(form.ID)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>

                  <h3 className="font-bold text-lg text-slate-800 pr-24 truncate">{form.Name}</h3>

                  <div className="mt-4 flex-grow text-sm text-gray-600">
                    <p className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2">Ingredients</p>
                    <ul className="space-y-1">
                      {ings.map((ing, i) => (
                        <li key={i} className="flex justify-between bg-slate-50 px-2 py-1 rounded">
                          <span className="truncate">{ing.name}</span>
                          <span className="font-medium whitespace-nowrap ml-2">{ing.quantity} {ing.unit}</span>
                        </li>
                      ))}
                    </ul>
                    {form.Notes && (
                      <div className="mt-4 pt-3 border-t">
                        <p className="text-xs italic text-slate-500 line-clamp-3">{form.Notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-500">Est. Cost / ha</span>
                    <span className="font-bold text-emerald-700">{CURRENCY_SYMBOL}{parseFloat(form.EstimatedCost || 0).toFixed(2)}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full p-12 text-center text-slate-500 bg-white rounded-xl shadow-md">
              No formulations found. Create your first mixture.
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingForm && !name.includes('(Copy)') ? 'Edit Formulation' : 'New Formulation'}
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Formulation Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g., Trial Mix A"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-700">Ingredients</label>
              <button
                type="button"
                onClick={handleAddIngredientRow}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded"
              >
                + Add Row
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto p-1">
              {ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border">
                  <div className="flex-1">
                    <input
                      type="text"
                      list="ingredient-lib-list"
                      required
                      value={ing.name}
                      onChange={e => handleIngredientChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      placeholder="Ingredient name"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={ing.quantity}
                      onChange={e => handleIngredientChange(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      placeholder="Qty"
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="text"
                      required
                      value={ing.unit}
                      onChange={e => handleIngredientChange(index, 'unit', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      placeholder="Unit"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredientRow(index)}
                    disabled={ingredients.length === 1}
                    className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <datalist id="ingredient-lib-list">
              {state.ingredients.map(i => <option key={i.ID} value={i.Name} />)}
            </datalist>
          </div>

          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 flex justify-between items-center">
            <span className="text-sm font-semibold text-emerald-800">Estimated Total Cost:</span>
            <span className="font-bold text-emerald-700 text-lg">{CURRENCY_SYMBOL}{calculateEstimatedCost().toFixed(2)}</span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Preparation instructions, mixing order..."
              rows={3}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2 rounded-xl"
            >
              Save Formulation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
