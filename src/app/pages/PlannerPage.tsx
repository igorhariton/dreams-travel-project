import React, { useState } from 'react';
import { Plus, Trash2, MapPin, Calendar, Plane, Hotel, Utensils, Camera, Music, ChevronDown, ChevronUp, GripVertical, Download, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { destinations } from '../data/travelData';

type ActivityType = 'flight' | 'hotel' | 'food' | 'sightseeing' | 'entertainment' | 'other';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  time: string;
  notes: string;
  cost: number;
}

interface PlanDay {
  id: string;
  date: string;
  location: string;
  activities: Activity[];
  collapsed: boolean;
}

const activityConfig: Record<ActivityType, { icon: React.ReactNode; color: string; bg: string }> = {
  flight: { icon: <Plane size={14} />, color: 'text-blue-600', bg: 'bg-blue-100' },
  hotel: { icon: <Hotel size={14} />, color: 'text-purple-600', bg: 'bg-purple-100' },
  food: { icon: <Utensils size={14} />, color: 'text-orange-600', bg: 'bg-orange-100' },
  sightseeing: { icon: <Camera size={14} />, color: 'text-green-600', bg: 'bg-green-100' },
  entertainment: { icon: <Music size={14} />, color: 'text-pink-600', bg: 'bg-pink-100' },
  other: { icon: <MapPin size={14} />, color: 'text-gray-600', bg: 'bg-gray-100' },
};

const suggestedActivities: Record<string, { type: ActivityType; title: string; cost: number }[]> = {
  santorini: [
    { type: 'flight', title: 'Arrive at Santorini Airport', cost: 0 },
    { type: 'hotel', title: 'Check-in at Oia Sunset Palace', cost: 380 },
    { type: 'sightseeing', title: 'Oia Sunset Walk', cost: 0 },
    { type: 'food', title: 'Seafood dinner at Amoudi Bay', cost: 65 },
  ],
  bali: [
    { type: 'flight', title: 'Arrive at Ngurah Rai Airport', cost: 0 },
    { type: 'hotel', title: 'Check-in at Ubud Jungle Resort', cost: 220 },
    { type: 'sightseeing', title: 'Tegallalang Rice Terraces', cost: 10 },
    { type: 'food', title: 'Warung local lunch', cost: 12 },
  ],
  paris: [
    { type: 'flight', title: 'Arrive at Charles de Gaulle', cost: 0 },
    { type: 'hotel', title: 'Check-in at Le Marais Boutique', cost: 295 },
    { type: 'sightseeing', title: 'Eiffel Tower visit', cost: 28 },
    { type: 'food', title: 'Bistro dinner in Saint-Germain', cost: 55 },
  ],
};

let dayIdCounter = 1;
let activityIdCounter = 1;

const createDay = (date: string, location: string): PlanDay => ({
  id: `day-${dayIdCounter++}`,
  date,
  location,
  activities: [],
  collapsed: false,
});

const createActivity = (type: ActivityType = 'other', title = '', time = '', notes = '', cost = 0): Activity => ({
  id: `act-${activityIdCounter++}`,
  type,
  title,
  time,
  notes,
  cost,
});

export default function PlannerPage() {
  const { t } = useApp();
  const [tripName, setTripName] = useState('My Dream Trip');
  const [selectedDest, setSelectedDest] = useState('santorini');
  const [startDate, setStartDate] = useState('2026-04-15');
  const [days, setDays] = useState<PlanDay[]>([
    {
      id: 'day-0',
      date: '2026-04-15',
      location: 'Santorini, Greece',
      activities: [
        createActivity('flight', 'Arrive at Santorini Airport', '14:00', 'Transfer to hotel', 0),
        createActivity('hotel', 'Check-in at Oia Sunset Palace', '15:30', '', 380),
        createActivity('sightseeing', 'Oia Village Exploration', '18:00', 'Wander the famous white-washed streets', 0),
        createActivity('food', 'Sunset Dinner at Ambrosia', '20:00', 'Caldera view restaurant', 75),
      ],
      collapsed: false,
    },
    {
      id: 'day-1',
      date: '2026-04-16',
      location: 'Santorini, Greece',
      activities: [
        createActivity('food', 'Greek breakfast at hotel', '08:00', '', 0),
        createActivity('sightseeing', 'Akrotiri Archaeological Site', '10:00', 'Minoan Bronze Age ruins', 15),
        createActivity('sightseeing', 'Red Beach Visit', '13:00', 'Iconic volcanic red sand', 0),
        createActivity('food', 'Fresh seafood at Amoudi Bay', '19:30', 'Best fish taverna', 65),
      ],
      collapsed: false,
    },
  ]);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [newActivity, setNewActivity] = useState({ type: 'other' as ActivityType, title: '', time: '', notes: '', cost: '' });

  const totalBudget = days.flatMap(d => d.activities).reduce((sum, a) => sum + a.cost, 0);

  const addDay = () => {
    const lastDate = days.length > 0 ? new Date(days[days.length - 1].date) : new Date(startDate);
    lastDate.setDate(lastDate.getDate() + 1);
    const dest = destinations.find(d => d.id === selectedDest);
    setDays(prev => [...prev, createDay(lastDate.toISOString().split('T')[0], dest ? `${dest.name}, ${dest.country}` : 'TBD')]);
  };

  const removeDay = (id: string) => setDays(prev => prev.filter(d => d.id !== id));

  const toggleDay = (id: string) => setDays(prev => prev.map(d => d.id === id ? { ...d, collapsed: !d.collapsed } : d));

  const addActivity = (dayId: string) => {
    if (!newActivity.title) return;
    setDays(prev => prev.map(d => d.id === dayId ? {
      ...d,
      activities: [...d.activities, createActivity(newActivity.type, newActivity.title, newActivity.time, newActivity.notes, Number(newActivity.cost) || 0)],
    } : d));
    setNewActivity({ type: 'other', title: '', time: '', notes: '', cost: '' });
    setEditingDay(null);
  };

  const removeActivity = (dayId: string, actId: string) => {
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, activities: d.activities.filter(a => a.id !== actId) } : d));
  };

  const loadSuggestions = (dayId: string) => {
    const suggestions = suggestedActivities[selectedDest] || [];
    setDays(prev => prev.map(d => d.id === dayId ? {
      ...d,
      activities: suggestions.map(s => createActivity(s.type, s.title, '', '', s.cost)),
    } : d));
  };

  const destOptions = destinations.find(d => d.id === selectedDest);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative h-48 overflow-hidden">
        <img src="/images/_site/hero-planner.jpg" alt="Planner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/80 to-indigo-900/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-16">
          <h1 className="text-4xl font-black text-white mb-2">{t('planner.title')}</h1>
          <p className="text-white/80">{t('planner.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-5">
            {/* Trip Settings */}
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-500" /> {t('planner.trip_settings')}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">{t('planner.trip_name')}</label>
                  <input type="text" value={tripName} onChange={e => setTripName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">{t('planner.destination')}</label>
                  <select value={selectedDest} onChange={e => setSelectedDest(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    {destinations.map(d => <option key={d.id} value={d.id}>{d.name}, {d.country}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">{t('planner.start_date')}</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>

            {/* Budget Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">💰 {t('planner.budget_summary')}</h3>
              <div className="space-y-2.5">
                {(['flight', 'hotel', 'food', 'sightseeing', 'entertainment', 'other'] as ActivityType[]).map(type => {
                  const total = days.flatMap(d => d.activities).filter(a => a.type === type).reduce((s, a) => s + a.cost, 0);
                  if (total === 0) return null;
                  const cfg = activityConfig[type];
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 text-sm ${cfg.color}`}>
                        <span className={`w-6 h-6 ${cfg.bg} rounded-lg flex items-center justify-center`}>{cfg.icon}</span>
                        <span className="capitalize">{type}</span>
                      </div>
                      <span className="font-semibold text-sm text-gray-700">${total}</span>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-gray-900">{t('planner.total_budget')}</span>
                  <span className="font-black text-xl text-indigo-600">${totalBudget}</span>
                </div>
              </div>
            </div>

            {/* Destination Info */}
            {destOptions && (
              <div className="bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-2xl p-5 text-white">
                <div className="text-sm font-semibold opacity-80 mb-1">{t('planner.planning_for')}</div>
                <div className="text-xl font-black mb-2">{destOptions.name}</div>
                <div className="text-sm opacity-80 mb-3">{destOptions.country} · {destOptions.continent}</div>
                <div className="flex items-center gap-2 mb-3">
                  <span>⭐</span>
                  <span className="font-semibold">{destOptions.rating}</span>
                  <span className="opacity-70">({destOptions.reviews.toLocaleString()} {t('common.reviews')})</span>
                </div>
                <div className="text-xs opacity-80">🗓️ {t('planner.best')}: {destOptions.bestSeason}</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Share2 size={14} /> {t('planner.share')}
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Download size={14} /> {t('planner.export')}
              </button>
            </div>
          </div>

          {/* Main Planner */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header actions */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{tripName}</h2>
                <p className="text-sm text-gray-500">{days.length} {t('planner.days')} · {startDate}</p>
              </div>
              <button onClick={addDay}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
                <Plus size={16} /> {t('planner.add_day')}
              </button>
            </div>

            {/* Day Cards */}
            <AnimatePresence>
              {days.map((day, dayIndex) => (
                <motion.div key={day.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Day Header */}
                  <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl text-white font-black flex items-center justify-center text-sm">
                        D{dayIndex + 1}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{t('planner.day')} {dayIndex + 1}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={10} /> {day.date}
                          <span className="mx-1">·</span>
                          <MapPin size={10} /> {day.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => loadSuggestions(day.id)}
                        className="text-xs px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium">
                        ✨ {t('planner.suggest')}
                      </button>
                      <button onClick={() => toggleDay(day.id)} className="p-1.5 hover:bg-white rounded-lg transition-colors text-gray-500">
                        {day.collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </button>
                      <button onClick={() => removeDay(day.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {!day.collapsed && (
                    <div className="p-4 space-y-2.5">
                      {/* Activities */}
                      {day.activities.map((activity, actIndex) => {
                        const cfg = activityConfig[activity.type];
                        return (
                          <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 group transition-colors">
                            <div className="flex items-center gap-2 mt-0.5">
                              <GripVertical size={14} className="text-gray-300 cursor-grab" />
                              <div className={`w-8 h-8 ${cfg.bg} rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                                {cfg.icon}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-gray-900">{activity.title}</span>
                                {activity.time && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{activity.time}</span>}
                                {activity.cost > 0 && <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full ml-auto">${activity.cost}</span>}
                              </div>
                              {activity.notes && <p className="text-xs text-gray-400 mt-0.5">{activity.notes}</p>}
                            </div>
                            <button onClick={() => removeActivity(day.id, activity.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg transition-all text-gray-400 hover:text-red-500 shrink-0">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })}

                      {/* Add Activity */}
                      {editingDay === day.id ? (
                        <div className="border-2 border-dashed border-indigo-200 rounded-xl p-4 bg-indigo-50/50 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <select value={newActivity.type} onChange={e => setNewActivity(p => ({ ...p, type: e.target.value as ActivityType }))}
                              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500">
                              {Object.keys(activityConfig).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                            <input type="time" value={newActivity.time} onChange={e => setNewActivity(p => ({ ...p, time: e.target.value }))}
                              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <input type="text" placeholder={t('planner.activity_title')} value={newActivity.title} onChange={e => setNewActivity(p => ({ ...p, title: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
                          
                          <div className="grid grid-cols-2 gap-3">
                            <input type="text" placeholder={t('planner.notes_optional')} value={newActivity.notes} onChange={e => setNewActivity(p => ({ ...p, notes: e.target.value }))}
                              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
                            <input type="number" placeholder={t('planner.cost')} value={newActivity.cost} onChange={e => setNewActivity(p => ({ ...p, cost: e.target.value }))}
                              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingDay(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">{t('common.cancel')}</button>
                            <button onClick={() => addActivity(day.id)} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">{t('planner.add_activity')}</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setEditingDay(day.id)}
                          className="w-full flex items-center gap-2 justify-center py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all">
                          <Plus size={16} /> {t('planner.add_activity')}
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            <button onClick={addDay}
              className="w-full flex items-center gap-2 justify-center py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
              <Plus size={18} /> {t('planner.add_day')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
