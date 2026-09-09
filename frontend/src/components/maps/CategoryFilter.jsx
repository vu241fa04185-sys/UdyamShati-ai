import React from 'react';

export default function CategoryFilter({
  categories = [],
  selectedCategory = 'ALL',
  onSelectCategory,
  placeCounts = {}
}) {
  const defaultCategories = [
    { id: 'ALL', name: 'All Categories', icon: '🌐', color: '#059669' },
    { id: 'DAIRY', name: 'Dairy & Milk', icon: '🐄', color: '#2563eb' },
    { id: 'POULTRY', name: 'Poultry & Broiler', icon: '🐔', color: '#ea580c' },
    { id: 'AGRICULTURE', name: 'Agri & Seeds', icon: '🌾', color: '#16a34a' },
    { id: 'FOOD', name: 'Food Processing', icon: '📦', color: '#d97706' },
    { id: 'RETAIL', name: 'Retail & Kirana', icon: '🏪', color: '#7c3aed' },
    { id: 'HEALTHCARE', name: 'Healthcare & Vet', icon: '🏥', color: '#dc2626' },
    { id: 'TRANSPORT', name: 'Fuel & Logistics', icon: '⛽', color: '#0891b2' },
    { id: 'SERVICES', name: 'Banking & Machinery', icon: '🚜', color: '#475569' }
  ];

  const items = categories && categories.length > 0 ? categories : defaultCategories;

  return (
    <div className="flex items-center space-x-2 overflow-x-auto py-2 px-1 no-scrollbar">
      {items.map((cat) => {
        const isSelected = (selectedCategory || 'ALL').toUpperCase() === cat.id.toUpperCase();
        const count = placeCounts[cat.id] ?? (cat.id === 'ALL' ? Object.values(placeCounts).reduce((a, b) => a + b, 0) : null);

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 shrink-0 border ${
              isSelected
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-105'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <span className="text-sm">{cat.icon}</span>
            <span>{cat.name}</span>
            {count !== null && count !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
