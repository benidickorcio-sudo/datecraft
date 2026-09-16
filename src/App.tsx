import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Heart, Calendar, MapPin, Plus, Shirt, CheckSquare, ExternalLink,
  Navigation, Search, Sparkles, Check, Trash2, Camera, LogOut, User,
  Pencil, CloudSun, Dices, Clock, History, BookmarkPlus,
  DollarSign, Music, Star, ArrowRight, CheckCircle2, Copy, Users
} from 'lucide-react';
import './utils/leafletIcons';
import { supabase } from './supabase';

interface BudgetItem {
  id: number;
  item: string;
  cost: number;
  paidBy: 'You' | 'Partner' | '50/50';
}

interface DatePlan {
  id: string;
  couple_id?: string;
  title: string;
  date: string;
  vibe: string;
  locationName: string;
  lat: number;
  lng: number;
  dressCode: string;
  tasks: { id: number; text: string; done: boolean }[];
  completed?: boolean;
  rating?: number;
  bestMemory?: string;
  budgetItems?: BudgetItem[];
  spotifyTrackId?: string;
}

interface BucketItem {
  id: string;
  title: string;
  vibe: string;
  notes: string;
}

const opmSoundtracks = [
  { id: '0uZFcsx96wzbixsULmrg8o', title: 'Pasilyo', artist: 'SunKissed Lola' },
  { id: '4rG58514iT0bF3x7mH6F07', title: 'Palagi', artist: 'TJ Monterde' },
  { id: '2LBqCSwhJGxFQejeMVTm6Q', title: 'Raining in Manila', artist: 'Lola Amour' },
  { id: '1a50c82iF0r8X1l2XWf0Zt', title: 'Tahanan', artist: 'Adie' },
  { id: '3qwbYz5q4vRls49KE2Sjgm', title: 'Paninindigan Kita', artist: 'Ben&Ben' },
];

const outfitPresets = [
  {
    id: 'casual',
    label: 'Casual & Comfy',
    desc: 'Sneakers, shirts & denim',
    palette: ['#E2E8F0', '#94A3B8', '#38BDF8'],
    defaultImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'smart',
    label: 'Smart Casual',
    desc: 'Polo, chic dress or trousers',
    palette: ['#FEF3C7', '#D97706', '#78350F'],
    defaultImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'formal',
    label: 'Dress Up / Formal',
    desc: 'Blazer, elegant evening fit',
    palette: ['#FCE7F3', '#DB2777', '#1E293B'],
    defaultImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'streetwear',
    label: 'Streetwear & Chill',
    desc: 'Oversized tees & cargos',
    palette: ['#E0E7FF', '#6366F1', '#0F172A'],
    defaultImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'outdoor',
    label: 'Outdoor / Active',
    desc: 'Breathable & trail shoes',
    palette: ['#DCFCE7', '#16A34A', '#14532D'],
    defaultImage: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&auto=format&fit=crop&q=80'
  },
];

const rouletteIdeas = [
  'Sunset Picnic & Board Games',
  'Art Museum & Matcha Crawl',
  'Late Night Arcade & Ramen',
  'Scenic Roadtrip & Street Food',
  'Thrift Shopping & Film Photography',
  'Cozy Bookstore & Coffee Date'
];

const userLocationIcon = L.divIcon({
  className: 'custom-live-pin',
  html: `
    <div style="position: relative; width: 22px; height: 22px;">
      <span style="position: absolute; inset: 0; border-radius: 9999px; background-color: #3b82f6; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
      <span style="relative; display: block; width: 22px; height: 22px; border-radius: 9999px; background-color: #2563eb; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></span>
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function MapFlyToController({ centerCoords }: { centerCoords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (centerCoords) {
      map.flyTo(centerCoords, 14, { duration: 1.2 });
    }
  }, [centerCoords, map]);
  return null;
}

function LocationPicker({
  position,
  setPosition,
}: {
  position: [number, number] | null;
  setPosition: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'planner' | 'history' | 'bucket' | 'budget'>('planner');

  // Multi-Couple Auth State
  const [coupleId, setCoupleId] = useState<string | null>(() => localStorage.getItem('dc_couple_id'));
  const [spaceCode, setSpaceCode] = useState<string | null>(() => localStorage.getItem('dc_space_code'));
  const [currentUser, setCurrentUser] = useState<string>(() => localStorage.getItem('dc_current_user') || '');
  const [partnerName, setPartnerName] = useState<string>(() => localStorage.getItem('dc_partner_name') || 'Partner');

  // Auth UI mode
  const [authMode, setAuthMode] = useState<'create' | 'join'>('create');
  const [yourNameInput, setYourNameInput] = useState('');
  const [partnerNameInput, setPartnerNameInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Date plans from Supabase
  const [plans, setPlans] = useState<DatePlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string>('');

  // Location & App state
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Weather state
  const [weatherInfo, setWeatherInfo] = useState<{ temp: number; code: number } | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  // Roulette
  const [isSpinning, setIsSpinning] = useState(false);
  const [pickedIdea, setPickedIdea] = useState<string | null>(null);

  // Bucket list
  const [bucketList, setBucketList] = useState<BucketItem[]>([
    { id: 'b1', title: 'Stargazing Camp in Tanay', vibe: 'Chill & Outdoor', notes: 'Rent a clear tent and bring warm jackets' },
    { id: 'b2', title: 'Pottery Making Class', vibe: 'Cozy & Romantic', notes: 'Try making matching coffee mugs' },
  ]);
  const [newBucketTitle, setNewBucketTitle] = useState('');
  const [newBucketNotes, setNewBucketNotes] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isEditHistoryModalOpen, setIsEditHistoryModalOpen] = useState(false);
  const [isEditBucketModalOpen, setIsEditBucketModalOpen] = useState(false);
  const [isEditBudgetModalOpen, setIsEditBudgetModalOpen] = useState(false);

  // New Date form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newVibe, setNewVibe] = useState('Cozy & Romantic');
  const [newLocName, setNewLocName] = useState('');
  const [pinnedCoords, setPinnedCoords] = useState<[number, number] | null>([14.025, 120.733]);
  const [selectedOutfitType, setSelectedOutfitType] = useState(outfitPresets[0].label);

  // Edit Date form state
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editVibe, setEditVibe] = useState('Cozy & Romantic');
  const [editLocName, setEditLocName] = useState('');
  const [editCoords, setEditCoords] = useState<[number, number] | null>(null);
  const [editOutfitType, setEditOutfitType] = useState(outfitPresets[0].label);
  const [editSpotify, setEditSpotify] = useState('');

  // Finish memory state
  const [finishRating, setFinishRating] = useState(5);
  const [finishMemory, setFinishMemory] = useState('');
  const [selectedHistoryPlanId, setSelectedHistoryPlanId] = useState<string | null>(null);

  // Edit Bucket item state
  const [editingBucketId, setEditingBucketId] = useState<string | null>(null);
  const [editBucketTitle, setEditBucketTitle] = useState('');
  const [editBucketNotes, setEditBucketNotes] = useState('');

  // Budget states
  const [newBudgetItem, setNewBudgetItem] = useState('');
  const [newBudgetCost, setNewBudgetCost] = useState('');
  const [newBudgetPaidBy, setNewBudgetPaidBy] = useState<'You' | 'Partner' | '50/50'>('50/50');
  const [editingBudgetItemId, setEditingBudgetItemId] = useState<number | null>(null);
  const [editBudgetItemName, setEditBudgetItemName] = useState('');
  const [editBudgetItemCost, setEditBudgetItemCost] = useState('');
  const [editBudgetItemPaidBy, setEditBudgetItemPaidBy] = useState<'You' | 'Partner' | '50/50'>('50/50');

  // Search states for map
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenterTarget, setMapCenterTarget] = useState<[number, number] | null>(null);

  // Load Date Plans from Supabase & Subscribe to Realtime Updates
  const fetchDatePlans = async (cId: string) => {
    const { data, error } = await supabase
      .from('date_plans')
      .select('*')
      .eq('couple_id', cId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formatted: DatePlan[] = data.map((d: any) => ({
        id: d.id,
        couple_id: d.couple_id,
        title: d.title,
        date: d.date,
        vibe: d.vibe,
        locationName: d.location_name,
        lat: d.lat,
        lng: d.lng,
        dressCode: d.dress_code,
        tasks: d.tasks || [],
        completed: d.completed,
        rating: d.rating,
        bestMemory: d.best_memory,
        budgetItems: d.budget_items || [],
        spotifyTrackId: d.spotify_track_id,
      }));
      setPlans(formatted);
      if (formatted.length > 0 && !activePlanId) {
        setActivePlanId(formatted[0].id);
      }
    }
  };

  useEffect(() => {
    if (!coupleId) return;

    fetchDatePlans(coupleId);

    // Setup Realtime Subscription
    const channel = supabase
      .channel('realtime_date_plans')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'date_plans', filter: `couple_id=eq.${coupleId}` },
        () => {
          fetchDatePlans(coupleId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  const upcomingPlans = plans.filter(p => !p.completed);
  const historyPlans = plans.filter(p => p.completed);
  const currentPlan = plans.find((p) => p.id === activePlanId) || upcomingPlans[0] || plans[0];

  const activeOutfitPreset = outfitPresets.find(p => p.label === currentPlan?.dressCode) || outfitPresets[0];
  const activeOutfitImage = activeOutfitPreset.defaultImage;

  // Real-time Weather fetch
  useEffect(() => {
    if (!currentPlan) return;
    setIsWeatherLoading(true);
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${currentPlan.lat}&longitude=${currentPlan.lng}&current=temperature_2m,weather_code`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.current) {
          setWeatherInfo({
            temp: Math.round(data.current.temperature_2m),
            code: data.current.weather_code,
          });
        }
      })
      .catch(() => setWeatherInfo(null))
      .finally(() => setIsWeatherLoading(false));
  }, [currentPlan?.lat, currentPlan?.lng]);

  const locateUser = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (coupleId) locateUser();
  }, [coupleId]);

  // Handle Space Creation
  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yourNameInput.trim() || !partnerNameInput.trim()) return;

    setIsAuthLoading(true);
    const generatedCode = 'LOVE-' + Math.floor(1000 + Math.random() * 9000);

    const { data, error } = await supabase
      .from('couples')
      .insert([
        {
          space_code: generatedCode,
          user1_name: yourNameInput.trim(),
          user2_name: partnerNameInput.trim(),
        }
      ])
      .select()
      .single();

    setIsAuthLoading(false);

    if (error) {
      alert('Error creating space. Please check your Supabase keys.');
      return;
    }

    if (data) {
      localStorage.setItem('dc_couple_id', data.id);
      localStorage.setItem('dc_space_code', data.space_code);
      localStorage.setItem('dc_current_user', data.user1_name);
      localStorage.setItem('dc_partner_name', data.user2_name);

      setCoupleId(data.id);
      setSpaceCode(data.space_code);
      setCurrentUser(data.user1_name);
      setPartnerName(data.user2_name);

      // Add default starter date plan
      await supabase.from('date_plans').insert([
        {
          couple_id: data.id,
          title: 'Sunset Coffee & City Stroll',
          date: '2026-09-20',
          vibe: 'Cozy & Romantic',
          location_name: 'Skyline Overlook Cafe',
          lat: 14.025,
          lng: 120.733,
          dress_code: 'Casual & Comfy',
          tasks: [
            { id: 1, text: 'Confirm outdoor seating', done: true },
            { id: 2, text: 'Charge camera & powerbank', done: false },
          ],
          budget_items: [
            { id: 1, item: 'Specialty Coffee & Pastries', cost: 650, paidBy: 'You' },
            { id: 2, item: 'Gas & Toll', cost: 400, paidBy: '50/50' },
          ],
          spotify_track_id: opmSoundtracks[0].id,
        }
      ]);
    }
  };

  // Handle Joining Existing Space with Code
  const handleJoinSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim() || !yourNameInput.trim()) return;

    setIsAuthLoading(true);
    const cleanCode = joinCodeInput.trim().toUpperCase();

    const { data, error } = await supabase
      .from('couples')
      .select('*')
      .eq('space_code', cleanCode)
      .single();

    setIsAuthLoading(false);

    if (error || !data) {
      alert('Space code not found! Please check the code with your partner.');
      return;
    }

    const partner = data.user1_name.toLowerCase() === yourNameInput.trim().toLowerCase()
      ? data.user2_name
      : data.user1_name;

    localStorage.setItem('dc_couple_id', data.id);
    localStorage.setItem('dc_space_code', data.space_code);
    localStorage.setItem('dc_current_user', yourNameInput.trim());
    localStorage.setItem('dc_partner_name', partner);

    setCoupleId(data.id);
    setSpaceCode(data.space_code);
    setCurrentUser(yourNameInput.trim());
    setPartnerName(partner);
  };

  const handleLogout = () => {
    localStorage.clear();
    setCoupleId(null);
    setSpaceCode(null);
    setPlans([]);
  };

  const handleCreateDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate || !pinnedCoords || !coupleId) return;

    const { error } = await supabase.from('date_plans').insert([
      {
        couple_id: coupleId,
        title: newTitle,
        date: newDate,
        vibe: newVibe,
        location_name: newLocName || 'Pinned Destination',
        lat: pinnedCoords[0],
        lng: pinnedCoords[1],
        dress_code: selectedOutfitType,
        completed: false,
        tasks: [
          { id: 1, text: 'Confirm reservation time', done: false },
          { id: 2, text: 'Check weather before leaving', done: false },
        ],
        budget_items: [],
        spotify_track_id: opmSoundtracks[0].id,
      }
    ]);

    if (!error) {
      setIsModalOpen(false);
      setActiveTab('planner');
      setNewTitle('');
      setNewDate('');
      setNewLocName('');
      setSearchQuery('');
    }
  };

  const handleOpenEditModal = () => {
    if (!currentPlan) return;
    setEditTitle(currentPlan.title);
    setEditDate(currentPlan.date);
    setEditVibe(currentPlan.vibe);
    setEditLocName(currentPlan.locationName);
    setEditCoords([currentPlan.lat, currentPlan.lng]);
    setEditOutfitType(currentPlan.dressCode);
    setEditSpotify(currentPlan.spotifyTrackId || opmSoundtracks[0].id);
    setMapCenterTarget([currentPlan.lat, currentPlan.lng]);
    setSearchQuery('');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle || !editDate || !editCoords || !currentPlan) return;

    await supabase
      .from('date_plans')
      .update({
        title: editTitle,
        date: editDate,
        vibe: editVibe,
        location_name: editLocName || 'Pinned Destination',
        lat: editCoords[0],
        lng: editCoords[1],
        dress_code: editOutfitType,
        spotify_track_id: editSpotify,
      })
      .eq('id', currentPlan.id);

    setIsEditModalOpen(false);
  };

  const handleDeletePlan = async () => {
    if (plans.length <= 1) {
      alert('You must have at least one date plan!');
      return;
    }
    if (!currentPlan) return;

    await supabase.from('date_plans').delete().eq('id', currentPlan.id);
    setIsEditModalOpen(false);
  };

  const handleCompleteDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlan) return;

    await supabase
      .from('date_plans')
      .update({
        completed: true,
        rating: finishRating,
        best_memory: finishMemory || 'Had an amazing day together! 💕',
      })
      .eq('id', currentPlan.id);

    setIsFinishModalOpen(false);
    setActiveTab('history');
  };

  const toggleTask = async (taskId: number) => {
    if (!currentPlan) return;
    const updatedTasks = currentPlan.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);

    await supabase
      .from('date_plans')
      .update({ tasks: updatedTasks })
      .eq('id', currentPlan.id);
  };

  const handleAddBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetItem || !newBudgetCost || !currentPlan) return;

    const costNum = parseFloat(newBudgetCost);
    if (isNaN(costNum)) return;

    const updated = [
      ...(currentPlan.budgetItems || []),
      { id: Date.now(), item: newBudgetItem, cost: costNum, paidBy: newBudgetPaidBy }
    ];

    await supabase
      .from('date_plans')
      .update({ budget_items: updated })
      .eq('id', currentPlan.id);

    setNewBudgetItem('');
    setNewBudgetCost('');
  };

  const handleDeleteBudgetItem = async (itemId: number) => {
    if (!currentPlan) return;
    const updated = (currentPlan.budgetItems || []).filter(b => b.id !== itemId);
    await supabase.from('date_plans').update({ budget_items: updated }).eq('id', currentPlan.id);
  };

  const handleSaveEditBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudgetItemId || !editBudgetItemName.trim() || !editBudgetItemCost || !currentPlan) return;

    const costNum = parseFloat(editBudgetItemCost);
    if (isNaN(costNum)) return;

    const updated = (currentPlan.budgetItems || []).map(b =>
      b.id === editingBudgetItemId ? { ...b, item: editBudgetItemName, cost: costNum, paidBy: editBudgetItemPaidBy } : b
    );

    await supabase.from('date_plans').update({ budget_items: updated }).eq('id', currentPlan.id);
    setIsEditBudgetModalOpen(false);
  };

  const handleSelectSpotifySong = async (trackId: string) => {
    if (!currentPlan) return;
    await supabase.from('date_plans').update({ spotify_track_id: trackId }).eq('id', currentPlan.id);
  };

  const handleSelectOutfitType = async (label: string) => {
    if (!currentPlan) return;
    await supabase.from('date_plans').update({ dress_code: label }).eq('id', currentPlan.id);
  };

  const handleSearchLocation = async (e: React.FormEvent, isEditMode: boolean = false) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const newPos: [number, number] = [lat, lon];

        if (isEditMode) {
          setEditCoords(newPos);
          if (!editLocName) setEditLocName(data[0].display_name.split(',')[0]);
        } else {
          setPinnedCoords(newPos);
          if (!newLocName) setNewLocName(data[0].display_name.split(',')[0]);
        }
        setMapCenterTarget(newPos);
      } else {
        alert('Location not found. Try typing a town or landmark!');
      }
    } catch {
      alert('Error searching for location.');
    } finally {
      setIsSearching(false);
    }
  };

  const spinRoulette = () => {
    setIsSpinning(true);
    let counter = 0;
    const interval = setInterval(() => {
      setPickedIdea(rouletteIdeas[Math.floor(Math.random() * rouletteIdeas.length)]);
      counter++;
      if (counter > 12) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  const calculateDaysUntil = (targetDate: string) => {
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Date passed 💕';
    if (days === 0) return 'Today is the day! ✨';
    return `${days} day${days > 1 ? 's' : ''} to go!`;
  };

  const currentBudget = currentPlan?.budgetItems || [];
  const totalCost = currentBudget.reduce((acc, curr) => acc + curr.cost, 0);
  const myShare = currentBudget.reduce((acc, curr) => {
    if (curr.paidBy === 'You') return acc + curr.cost;
    if (curr.paidBy === '50/50') return acc + curr.cost / 2;
    return acc;
  }, 0);
  const partnerShare = totalCost - myShare;

  // LOGIN SCREEN (MULTI-COUPLE SPACE SYSTEM)
  if (!coupleId) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-stone-200 shadow-xl">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-rose-500 rounded-full text-white mb-3 shadow-md">
              <Heart size={28} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">DateCraft</h1>
            <p className="text-xs text-stone-500 mt-1">Real-time couple planner with synced spaces</p>
          </div>

          <div className="flex bg-stone-100 p-1 rounded-2xl mb-6">
            <button
              onClick={() => setAuthMode('create')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${authMode === 'create' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
                }`}
            >
              Create Couple Space
            </button>
            <button
              onClick={() => setAuthMode('join')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${authMode === 'join' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
                }`}
            >
              Join Partner's Code
            </button>
          </div>

          {authMode === 'create' ? (
            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Your Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-stone-400" />
                  <input
                    type="text"
                    placeholder="e.g. Liam"
                    value={yourNameInput}
                    onChange={(e) => setYourNameInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-rose-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Partner's Name</label>
                <div className="relative">
                  <Heart size={16} className="absolute left-3.5 top-3 text-rose-400" />
                  <input
                    type="text"
                    placeholder="e.g. Sophia"
                    value={partnerNameInput}
                    onChange={(e) => setPartnerNameInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-rose-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full mt-4 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isAuthLoading ? 'Creating Couple Space...' : 'Create Space & Generate Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinSpace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Couple Space Code</label>
                <input
                  type="text"
                  placeholder="e.g. LOVE-8421"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-mono uppercase tracking-wider focus:ring-2 focus:ring-rose-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Your Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-stone-400" />
                  <input
                    type="text"
                    placeholder="e.g. Sophia"
                    value={yourNameInput}
                    onChange={(e) => setYourNameInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-rose-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full mt-4 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isAuthLoading ? 'Connecting...' : 'Connect to Our Space'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 p-4 md:p-8">
      {/* Navbar */}
      <header className="max-w-5xl mx-auto flex items-center justify-between pb-6 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500 rounded-full text-white">
            <Heart size={20} fill="currentColor" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">DateCraft</h1>
              <span className="text-xs bg-rose-50 text-rose-600 font-medium px-2.5 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
                <Users size={12} /> {currentUser} & {partnerName}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
              <span>Space Code: <strong className="font-mono text-stone-800">{spaceCode}</strong></span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(spaceCode || '');
                  alert(`Copied Space Code: ${spaceCode}`);
                }}
                className="hover:text-rose-500"
                title="Copy code to share with partner"
              >
                <Copy size={12} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={locateUser}
            className="flex items-center gap-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 px-3.5 py-2 rounded-full font-medium text-xs shadow-sm"
          >
            <Navigation size={14} className={isLocating ? 'animate-spin text-blue-500' : 'text-blue-600'} />
            {isLocating ? 'Locating...' : 'My Live Location'}
          </button>

          <button
            onClick={() => {
              const startCoords = userCoords || [currentPlan?.lat || 14.025, currentPlan?.lng || 120.733];
              setPinnedCoords(startCoords);
              setMapCenterTarget(startCoords);
              setSelectedOutfitType(currentPlan?.dressCode || outfitPresets[0].label);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-full font-medium text-xs shadow-sm"
          >
            <Plus size={16} /> Plan a new date
          </button>

          <button
            onClick={handleLogout}
            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full transition-colors"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto mt-4 flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('planner')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'planner'
            ? 'bg-rose-500 text-white shadow-xs'
            : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
        >
          <Calendar size={14} /> Active Date Planner
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'history'
            ? 'bg-rose-500 text-white shadow-xs'
            : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
        >
          <History size={14} /> Date Archive & Memories ({historyPlans.length})
        </button>

        <button
          onClick={() => setActiveTab('bucket')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'bucket'
            ? 'bg-rose-500 text-white shadow-xs'
            : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
        >
          <BookmarkPlus size={14} /> Bucket List ({bucketList.length})
        </button>

        <button
          onClick={() => setActiveTab('budget')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'budget'
            ? 'bg-rose-500 text-white shadow-xs'
            : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
        >
          <DollarSign size={14} /> Budget & Bill Splitter
        </button>
      </div>

      {/* PLANNER TAB */}
      {activeTab === 'planner' && currentPlan && (
        <main className="max-w-5xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div
              onClick={handleOpenEditModal}
              className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-block bg-rose-100 text-rose-700 text-xs px-3 py-1 rounded-full font-semibold">
                  {currentPlan.vibe}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-stone-400 group-hover:text-rose-500 transition-colors">
                  <Pencil size={13} />
                  <span>Edit</span>
                </span>
              </div>

              <h2 className="text-2xl font-bold text-stone-900 group-hover:text-rose-600 transition-colors">
                {currentPlan.title}
              </h2>

              <div className="flex items-center justify-between text-sm text-stone-600 mt-2">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-rose-500" />
                  <span>{currentPlan.date}</span>
                </div>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Clock size={12} />
                  {calculateDaysUntil(currentPlan.date)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-stone-600 mt-1">
                <MapPin size={15} className="text-rose-500" />
                <span>{currentPlan.locationName}</span>
              </div>

              <div className="mt-4 p-2.5 bg-stone-50 rounded-2xl border border-stone-100 flex items-center gap-3">
                <img
                  src={activeOutfitImage}
                  alt={currentPlan.dressCode}
                  className="w-12 h-12 rounded-xl object-cover border border-stone-200 flex-shrink-0 shadow-2xs"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">Chosen Outfit</p>
                  <p className="text-xs font-bold text-stone-800 truncate">{currentPlan.dressCode}</p>
                </div>
                <span className="p-1 bg-white rounded-full text-rose-500 shadow-2xs">
                  <Sparkles size={12} />
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${currentPlan.lat},${currentPlan.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                >
                  Get Directions <ExternalLink size={12} />
                </a>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFinishModalOpen(true);
                  }}
                  className="px-3 py-1 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white rounded-full text-xs font-semibold transition-all flex items-center gap-1"
                >
                  <CheckCircle2 size={13} /> Mark Done
                </button>
              </div>
            </div>

            {/* OPM Soundtrack */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music size={18} className="text-rose-500" />
                  <h4 className="text-xs font-bold text-stone-900">OPM Date Soundtrack 🇵🇭</h4>
                </div>
                <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                  Tagalog Hits
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {opmSoundtracks.map((song) => {
                  const isPlaying = (currentPlan.spotifyTrackId || opmSoundtracks[0].id) === song.id;
                  return (
                    <button
                      key={song.id}
                      type="button"
                      onClick={() => handleSelectSpotifySong(song.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${isPlaying
                        ? 'bg-rose-500 text-white border-rose-500 shadow-2xs font-semibold'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                    >
                      🎵 {song.title} - {song.artist}
                    </button>
                  );
                })}
              </div>

              <iframe
                src={`https://open.spotify.com/embed/track/${currentPlan.spotifyTrackId || opmSoundtracks[0].id}?utm_source=generator&theme=0`}
                width="100%"
                height="80"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-2xl shadow-2xs"
              />
            </div>

            {/* Checklist */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare size={18} className="text-rose-500" />
                <h3 className="font-bold text-sm">Prep Checklist</h3>
              </div>
              <div className="space-y-2">
                {currentPlan.tasks.map((task) => (
                  <label key={task.id} className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                      className="accent-rose-500 rounded"
                    />
                    <span className={task.done ? 'line-through text-stone-400' : ''}>{task.text}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
                    <CloudSun size={24} />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-400">Destination Weather</p>
                    <p className="text-base font-bold text-stone-800">
                      {isWeatherLoading ? 'Checking...' : weatherInfo ? `${weatherInfo.temp}°C • Pleasant` : '28°C • Clear Sky'}
                    </p>
                    <p className="text-[11px] text-stone-500">Perfect for {currentPlan.dressCode}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-400">Can't Decide What To Do?</p>
                  <p className="text-xs font-bold text-stone-800 truncate mt-0.5">
                    {pickedIdea || 'Spin for a spontaneous idea!'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={spinRoulette}
                  disabled={isSpinning}
                  className="px-3 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 flex-shrink-0"
                >
                  <Dices size={15} className={isSpinning ? 'animate-spin' : ''} />
                  {isSpinning ? 'Spinning...' : 'Spin'}
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex flex-col h-[480px]">
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">Live Location & Date Spot</h3>
                  {userCoords && (
                    <span className="flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                      Live GPS
                    </span>
                  )}
                </div>
                <span className="text-xs text-stone-400">
                  Pin: {currentPlan.lat.toFixed(3)}, {currentPlan.lng.toFixed(3)}
                </span>
              </div>

              <div className="flex-1 w-full rounded-2xl overflow-hidden border border-stone-200 relative z-0">
                <MapContainer
                  center={userCoords || [currentPlan.lat, currentPlan.lng]}
                  zoom={13}
                  scrollWheelZoom={true}
                  style={{ height: '100%', width: '100%' }}
                  key={`main-map-${currentPlan.id}-${currentPlan.lat}`}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapFlyToController centerCoords={userCoords} />
                  {userCoords && (
                    <Marker position={userCoords} icon={userLocationIcon}>
                      <Popup>📍 You are here right now!</Popup>
                    </Marker>
                  )}
                  <Marker position={[currentPlan.lat, currentPlan.lng]}>
                    <Popup>
                      <strong>{currentPlan.title}</strong>
                      <br />
                      {currentPlan.locationName}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ARCHIVE TAB */}
      {activeTab === 'history' && (
        <section className="max-w-5xl mx-auto mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {historyPlans.map((plan) => (
              <div key={plan.id} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-stone-900">{plan.title}</h3>
                  <div className="flex items-center text-amber-400">
                    {[...Array(plan.rating || 5)].map((_, i) => (
                      <Star key={i} size={15} fill="currentColor" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-stone-500">Date: {plan.date} • {plan.locationName}</p>
                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-xs text-stone-700 italic">
                  "{plan.bestMemory || 'Loved every second together!'}"
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BUDGET TAB */}
      {activeTab === 'budget' && (
        <section className="max-w-5xl mx-auto mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
              <p className="text-xs font-bold text-stone-400 uppercase">Total Date Budget</p>
              <p className="text-2xl font-black text-stone-900 mt-1">₱{totalCost.toLocaleString()}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
              <p className="text-xs font-bold text-rose-500 uppercase">{currentUser}'s Share</p>
              <p className="text-2xl font-black text-rose-600 mt-1">₱{myShare.toLocaleString()}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
              <p className="text-xs font-bold text-stone-600 uppercase">{partnerName}'s Share</p>
              <p className="text-2xl font-black text-stone-800 mt-1">₱{partnerShare.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
            <h3 className="font-bold text-sm text-stone-900 mb-3">Add Expense Item</h3>
            <form onSubmit={handleAddBudgetItem} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Item (e.g. Dinner, Cinema)"
                value={newBudgetItem}
                onChange={(e) => setNewBudgetItem(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs"
                required
              />
              <input
                type="number"
                placeholder="Cost in ₱"
                value={newBudgetCost}
                onChange={(e) => setNewBudgetCost(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs"
                required
              />
              <select
                value={newBudgetPaidBy}
                onChange={(e) => setNewBudgetPaidBy(e.target.value as any)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs"
              >
                <option value="50/50">Split 50 / 50</option>
                <option value="You">Treated by {currentUser}</option>
                <option value="Partner">Treated by {partnerName}</option>
              </select>
              <button
                type="submit"
                className="py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold"
              >
                Add to Expense
              </button>
            </form>

            <div className="mt-6 divide-y divide-stone-100">
              {currentBudget.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-6">No expenses added yet for this date.</p>
              ) : (
                currentBudget.map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between text-xs px-2 hover:bg-stone-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-stone-800 text-sm">{b.item}</p>
                      <span className="text-[11px] text-stone-400">
                        Paid by: {b.paidBy === 'You' ? currentUser : b.paidBy === 'Partner' ? partnerName : '50/50'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-stone-900 text-sm">₱{b.cost.toLocaleString()}</span>
                      <button onClick={() => handleDeleteBudgetItem(b.id)} className="text-stone-400 hover:text-rose-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* CREATE DATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-xl border border-stone-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-stone-900">Plan a new date</h2>
              <button onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateDate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Date Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sunset Dinner at Tagaytay"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Theme</label>
                  <select
                    value={newVibe}
                    onChange={(e) => setNewVibe(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
                  >
                    <option>Cozy & Romantic</option>
                    <option>Fancy Dinner</option>
                    <option>Chill & Outdoor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Search & Pin Location</label>
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    placeholder="Search place..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleSearchLocation(e, false)}
                    className="px-3.5 py-2 bg-stone-800 text-white text-xs font-medium rounded-xl"
                  >
                    {isSearching ? '...' : 'Find'}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Custom name for place"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs mb-2"
                />
                <div className="h-44 w-full rounded-2xl overflow-hidden border border-stone-200">
                  <MapContainer center={pinnedCoords || [14.025, 120.733]} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapFlyToController centerCoords={mapCenterTarget} />
                    <LocationPicker position={pinnedCoords} setPosition={setPinnedCoords} />
                  </MapContainer>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-500 text-white rounded-full text-xs font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MARK DONE MODAL */}
      {isFinishModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-stone-200">
            <h2 className="text-lg font-bold text-stone-900">Mark Date as Done! 💕</h2>
            <form onSubmit={handleCompleteDate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Our Favorite Memory</label>
                <textarea
                  value={finishMemory}
                  onChange={(e) => setFinishMemory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs h-24"
                  placeholder="How was the date?"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsFinishModalOpen(false)} className="px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-500 text-white rounded-full text-xs font-medium">Save Memory</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}