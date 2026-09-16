import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Heart, Calendar, MapPin, Plus, Shirt, CheckSquare, ExternalLink,
  Navigation, Search, Sparkles, Check, Trash2, Camera, LogOut, Lock, User,
  Pencil, CloudSun, Dices, Clock, History, BookmarkPlus,
  DollarSign, Music, Star, ArrowRight, CheckCircle2
} from 'lucide-react';
import './utils/leafletIcons';

interface BudgetItem {
  id: number;
  item: string;
  cost: number;
  paidBy: 'You' | 'Partner' | '50/50';
}

interface DatePlan {
  id: string;
  title: string;
  date: string;
  vibe: string;
  locationName: string;
  lat: number;
  lng: number;
  dressCode: string;
  outfitPhotos: Record<string, string | null>;
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
      <span style="position: relative; display: block; width: 22px; height: 22px; border-radius: 9999px; background-color: #2563eb; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></span>
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

  // Auth state
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('datecraft_user'));
  const [partnerName, setPartnerName] = useState<string>(() => localStorage.getItem('datecraft_partner') || 'My Love');
  const [anniversaryDate] = useState<string>('2025-02-14');

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPartner, setLoginPartner] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Location & App state
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Weather state
  const [weatherInfo, setWeatherInfo] = useState<{ temp: number; code: number } | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  // Roulette
  const [isSpinning, setIsSpinning] = useState(false);
  const [pickedIdea, setPickedIdea] = useState<string | null>(null);

  const [customStylePhotos, setCustomStylePhotos] = useState<Record<string, string | null>>(() => {
    return outfitPresets.reduce((acc, curr) => {
      acc[curr.label] = curr.defaultImage;
      return acc;
    }, {} as Record<string, string | null>);
  });

  // Date Plans State
  const [plans, setPlans] = useState<DatePlan[]>([
    {
      id: '1',
      title: 'Sunset Coffee & City Stroll',
      date: '2026-09-20',
      vibe: 'Cozy & Romantic',
      locationName: 'Skyline Overlook Cafe',
      lat: 14.025,
      lng: 120.733,
      dressCode: 'Casual & Comfy',
      completed: false,
      outfitPhotos: {
        'Casual & Comfy': outfitPresets[0].defaultImage,
        'Smart Casual': outfitPresets[1].defaultImage,
        'Dress Up / Formal': outfitPresets[2].defaultImage,
        'Streetwear & Chill': outfitPresets[3].defaultImage,
        'Outdoor / Active': outfitPresets[4].defaultImage,
      },
      tasks: [
        { id: 1, text: 'Confirm outdoor seating', done: true },
        { id: 2, text: 'Charge camera & powerbank', done: false },
      ],
      budgetItems: [
        { id: 1, item: 'Specialty Coffee & Pastries', cost: 650, paidBy: 'You' },
        { id: 2, item: 'Gas & Toll', cost: 400, paidBy: '50/50' },
      ],
      spotifyTrackId: opmSoundtracks[0].id,
    },
    {
      id: '2',
      title: 'Tagaytay Picnic by the Ridge',
      date: '2026-08-14',
      vibe: 'Chill & Outdoor',
      locationName: 'People’s Park in the Sky',
      lat: 14.1435,
      lng: 120.9934,
      dressCode: 'Outdoor / Active',
      completed: true,
      rating: 5,
      bestMemory: 'Watching the clouds together while eating warm strawberry taho! ❤️',
      outfitPhotos: {
        'Outdoor / Active': outfitPresets[4].defaultImage,
      },
      tasks: [
        { id: 1, text: 'Pack picnic blanket', done: true },
        { id: 2, text: 'Buy snacks', done: true },
      ],
      budgetItems: [
        { id: 1, item: 'Picnic Basket & Snacks', cost: 1200, paidBy: 'Partner' },
        { id: 2, item: 'Park Entrance Fee', cost: 200, paidBy: '50/50' },
      ],
      spotifyTrackId: opmSoundtracks[1].id,
    }
  ]);

  const [activePlanId, setActivePlanId] = useState<string>(plans[0]?.id || '1');

  // Bucket List State
  const [bucketList, setBucketList] = useState<BucketItem[]>([
    { id: 'b1', title: 'Stargazing Camp in Tanay', vibe: 'Chill & Outdoor', notes: 'Rent a clear tent and bring warm jackets' },
    { id: 'b2', title: 'Pottery Making Class', vibe: 'Cozy & Romantic', notes: 'Try making matching coffee mugs' },
    { id: 'b3', title: 'Late Night Binondo Food Crawl', vibe: 'Streetwear & Chill', notes: 'Fried dumplings, fried siopao & milk tea' },
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

  // Finish & Edit Memory state
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

  // Edit Budget Item Modal state
  const [editingBudgetItemId, setEditingBudgetItemId] = useState<number | null>(null);
  const [editBudgetItemName, setEditBudgetItemName] = useState('');
  const [editBudgetItemCost, setEditBudgetItemCost] = useState('');
  const [editBudgetItemPaidBy, setEditBudgetItemPaidBy] = useState<'You' | 'Partner' | '50/50'>('50/50');

  // Search states for modal map
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenterTarget, setMapCenterTarget] = useState<[number, number] | null>(null);

  const upcomingPlans = plans.filter(p => !p.completed);
  const historyPlans = plans.filter(p => p.completed);

  const currentPlan = plans.find((p) => p.id === activePlanId) || upcomingPlans[0] || plans[0];

  const activeOutfitImage =
    currentPlan?.outfitPhotos?.[currentPlan?.dressCode] ??
    customStylePhotos[currentPlan?.dressCode] ??
    null;

  const daysTogether = Math.max(
    1,
    Math.floor((new Date().getTime() - new Date(anniversaryDate).getTime()) / (1000 * 60 * 60 * 24))
  );

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
    if (currentUser) locateUser();
  }, [currentUser]);

  const calculateDaysUntil = (targetDate: string) => {
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Date passed 💕';
    if (days === 0) return 'Today is the day! ✨';
    return `${days} day${days > 1 ? 's' : ''} to go!`;
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) return;

    const partner = loginPartner.trim() || 'My Favorite Person';
    localStorage.setItem('datecraft_user', loginUsername.trim());
    localStorage.setItem('datecraft_partner', partner);
    setCurrentUser(loginUsername.trim());
    setPartnerName(partner);
  };

  const handleLogout = () => {
    localStorage.removeItem('datecraft_user');
    localStorage.removeItem('datecraft_partner');
    setCurrentUser(null);
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

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle || !editDate || !editCoords) return;

    setPlans(
      plans.map((p) => {
        if (p.id === activePlanId) {
          return {
            ...p,
            title: editTitle,
            date: editDate,
            vibe: editVibe,
            locationName: editLocName || 'Pinned Destination',
            lat: editCoords[0],
            lng: editCoords[1],
            dressCode: editOutfitType,
            spotifyTrackId: editSpotify.trim() || opmSoundtracks[0].id,
          };
        }
        return p;
      })
    );
    setIsEditModalOpen(false);
  };

  const handleOpenEditHistoryModal = (plan: DatePlan) => {
    setSelectedHistoryPlanId(plan.id);
    setFinishRating(plan.rating || 5);
    setFinishMemory(plan.bestMemory || '');
    setIsEditHistoryModalOpen(true);
  };

  const handleSaveEditHistory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHistoryPlanId) return;

    setPlans(
      plans.map((p) => {
        if (p.id === selectedHistoryPlanId) {
          return {
            ...p,
            rating: finishRating,
            bestMemory: finishMemory,
          };
        }
        return p;
      })
    );
    setIsEditHistoryModalOpen(false);
  };

  const handleOpenEditBucketModal = (item: BucketItem) => {
    setEditingBucketId(item.id);
    setEditBucketTitle(item.title);
    setEditBucketNotes(item.notes);
    setIsEditBucketModalOpen(true);
  };

  const handleSaveEditBucket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBucketId || !editBucketTitle.trim()) return;

    setBucketList(
      bucketList.map((b) =>
        b.id === editingBucketId ? { ...b, title: editBucketTitle, notes: editBucketNotes } : b
      )
    );
    setIsEditBucketModalOpen(false);
  };

  const handleCompleteDate = (e: React.FormEvent) => {
    e.preventDefault();
    setPlans(
      plans.map((p) => {
        if (p.id === activePlanId) {
          return {
            ...p,
            completed: true,
            rating: finishRating,
            bestMemory: finishMemory || 'Had an amazing day together! 💕',
          };
        }
        return p;
      })
    );
    setIsFinishModalOpen(false);
    setActiveTab('history');
  };

  const handleDeletePlan = () => {
    if (plans.length <= 1) {
      alert('You must have at least one date plan!');
      return;
    }
    const remaining = plans.filter((p) => p.id !== activePlanId);
    setPlans(remaining);
    setActivePlanId(remaining[0].id);
    setIsEditModalOpen(false);
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

  const handleCreateDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate || !pinnedCoords) return;

    const newEntry: DatePlan = {
      id: Date.now().toString(),
      title: newTitle,
      date: newDate,
      vibe: newVibe,
      locationName: newLocName || 'Pinned Destination',
      lat: pinnedCoords[0],
      lng: pinnedCoords[1],
      dressCode: selectedOutfitType,
      completed: false,
      outfitPhotos: { ...customStylePhotos },
      tasks: [
        { id: 1, text: 'Confirm reservation time', done: false },
        { id: 2, text: 'Check weather before leaving', done: false },
      ],
      budgetItems: [],
      spotifyTrackId: opmSoundtracks[0].id,
    };

    setPlans([...plans, newEntry]);
    setActivePlanId(newEntry.id);
    setIsModalOpen(false);
    setActiveTab('planner');
    setNewTitle('');
    setNewDate('');
    setNewLocName('');
    setSearchQuery('');
  };

  const handleConvertBucketToPlan = (bucket: BucketItem) => {
    setNewTitle(bucket.title);
    setNewVibe(bucket.vibe);
    setNewLocName(bucket.title);
    setBucketList(bucketList.filter(b => b.id !== bucket.id));
    setIsModalOpen(true);
  };

  const handleAddBucketItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketTitle.trim()) return;

    const newItem: BucketItem = {
      id: Date.now().toString(),
      title: newBucketTitle,
      vibe: 'Cozy & Romantic',
      notes: newBucketNotes || 'Excited for this one!',
    };
    setBucketList([...bucketList, newItem]);
    setNewBucketTitle('');
    setNewBucketNotes('');
  };

  // BUDGET HANDLERS
  const handleAddBudgetItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetItem || !newBudgetCost || !currentPlan) return;

    const costNum = parseFloat(newBudgetCost);
    if (isNaN(costNum)) return;

    const updatedPlans = plans.map(p => {
      if (p.id === currentPlan.id) {
        const items = p.budgetItems || [];
        return {
          ...p,
          budgetItems: [...items, { id: Date.now(), item: newBudgetItem, cost: costNum, paidBy: newBudgetPaidBy }]
        };
      }
      return p;
    });

    setPlans(updatedPlans);
    setNewBudgetItem('');
    setNewBudgetCost('');
  };

  const handleOpenEditBudgetItem = (item: BudgetItem) => {
    setEditingBudgetItemId(item.id);
    setEditBudgetItemName(item.item);
    setEditBudgetItemCost(item.cost.toString());
    setEditBudgetItemPaidBy(item.paidBy);
    setIsEditBudgetModalOpen(true);
  };

  const handleSaveEditBudgetItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudgetItemId || !editBudgetItemName.trim() || !editBudgetItemCost) return;

    const costNum = parseFloat(editBudgetItemCost);
    if (isNaN(costNum)) return;

    const updatedPlans = plans.map(p => {
      if (p.id === currentPlan.id) {
        return {
          ...p,
          budgetItems: (p.budgetItems || []).map(b =>
            b.id === editingBudgetItemId ? { ...b, item: editBudgetItemName, cost: costNum, paidBy: editBudgetItemPaidBy } : b
          )
        };
      }
      return p;
    });

    setPlans(updatedPlans);
    setIsEditBudgetModalOpen(false);
  };

  const handleDeleteBudgetItem = (itemId: number) => {
    const updatedPlans = plans.map(p => {
      if (p.id === currentPlan.id) {
        return {
          ...p,
          budgetItems: (p.budgetItems || []).filter(b => b.id !== itemId)
        };
      }
      return p;
    });
    setPlans(updatedPlans);
  };

  const currentBudget = currentPlan?.budgetItems || [];
  const totalCost = currentBudget.reduce((acc, curr) => acc + curr.cost, 0);
  const myShare = currentBudget.reduce((acc, curr) => {
    if (curr.paidBy === 'You') return acc + curr.cost;
    if (curr.paidBy === '50/50') return acc + curr.cost / 2;
    return acc;
  }, 0);
  const partnerShare = totalCost - myShare;

  const toggleTask = (taskId: number) => {
    setPlans(
      plans.map((p) => {
        if (p.id === activePlanId) {
          return {
            ...p,
            tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
          };
        }
        return p;
      })
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      const activeStyle = currentPlan.dressCode;

      setCustomStylePhotos((prev) => ({
        ...prev,
        [activeStyle]: url,
      }));

      setPlans(
        plans.map((p) => {
          if (p.id === activePlanId) {
            return {
              ...p,
              outfitPhotos: {
                ...p.outfitPhotos,
                [activeStyle]: url,
              },
            };
          }
          return p;
        })
      );
    }
  };

  const handleDeleteImage = () => {
    const activeStyle = currentPlan.dressCode;

    setCustomStylePhotos((prev) => ({
      ...prev,
      [activeStyle]: null,
    }));

    setPlans(
      plans.map((p) => {
        if (p.id === activePlanId) {
          return {
            ...p,
            outfitPhotos: {
              ...p.outfitPhotos,
              [activeStyle]: null,
            },
          };
        }
        return p;
      })
    );
  };

  const handleSelectOutfitType = (label: string) => {
    setPlans(
      plans.map((p) => (p.id === activePlanId ? { ...p, dressCode: label } : p))
    );
  };

  const handleSelectSpotifySong = (trackId: string) => {
    setPlans(
      plans.map((p) => (p.id === activePlanId ? { ...p, spotifyTrackId: trackId } : p))
    );
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-stone-200 shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-rose-500 rounded-full text-white mb-3 shadow-md">
              <Heart size={28} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">DateCraft</h1>
            <p className="text-sm text-stone-500 mt-1">Our shared date and outfit space</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Your Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="e.g. Liam"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
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
                  value={loginPartner}
                  onChange={(e) => setLoginPartner(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Passcode (Optional)</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              Enter Date Planner <Heart size={16} fill="currentColor" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 p-4 md:p-8">
      {/* Top Navbar */}
      <header className="max-w-5xl mx-auto flex items-center justify-between pb-6 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500 rounded-full text-white">
            <Heart size={20} fill="currentColor" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">DateCraft</h1>
              <span className="text-xs bg-rose-50 text-rose-600 font-medium px-2.5 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
                <Heart size={10} fill="currentColor" /> {currentUser} & {partnerName}
              </span>
            </div>
            <p className="text-xs text-stone-500">Together for {daysTogether} days 💕</p>
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

      {/* LOVE STATS BAR */}
      <div className="max-w-5xl mx-auto mt-4 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-around text-center text-xs">
        <div>
          <p className="text-[10px] uppercase font-bold text-stone-400">Total Dates</p>
          <p className="text-base font-extrabold text-stone-800">{plans.length}</p>
        </div>
        <div className="w-px h-6 bg-stone-200" />
        <div>
          <p className="text-[10px] uppercase font-bold text-stone-400">Past Memories</p>
          <p className="text-base font-extrabold text-rose-500">{historyPlans.length} Finished</p>
        </div>
        <div className="w-px h-6 bg-stone-200" />
        <div>
          <p className="text-[10px] uppercase font-bold text-stone-400">Bucket List</p>
          <p className="text-base font-extrabold text-amber-500">{bucketList.length} Ideas</p>
        </div>
        <div className="w-px h-6 bg-stone-200" />
        <div>
          <p className="text-[10px] uppercase font-bold text-stone-400">Days Together</p>
          <p className="text-base font-extrabold text-indigo-500">{daysTogether} Days</p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
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

      {/* TAB 1: ACTIVE DATE PLANNER */}
      {activeTab === 'planner' && currentPlan && (
        <main className="max-w-5xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div
              onClick={handleOpenEditModal}
              className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group relative"
              title="Click to view & edit date details"
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
                {activeOutfitImage ? (
                  <img
                    src={activeOutfitImage}
                    alt={currentPlan.dressCode}
                    className="w-12 h-12 rounded-xl object-cover border border-stone-200 flex-shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 flex-shrink-0">
                    <Shirt size={20} />
                  </div>
                )}
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

            {/* OPM SOUNDTRACK PLAYER */}
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

            {/* OUTFIT GALLERY */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shirt size={18} className="text-rose-500" />
                  <h3 className="font-bold text-sm text-stone-900">Outfit Gallery</h3>
                </div>
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={11} />
                  {currentPlan.dressCode}
                </span>
              </div>

              {activeOutfitImage ? (
                <div className="relative overflow-hidden rounded-2xl border border-stone-200 aspect-[4/3] bg-stone-100 group">
                  <img
                    src={activeOutfitImage}
                    alt={currentPlan.dressCode}
                    className="w-full h-full object-cover transition-all duration-300"
                  />

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <label
                      className="p-2 bg-black/60 hover:bg-stone-900 text-white rounded-full transition-colors backdrop-blur-xs shadow cursor-pointer"
                      title="Change or upload custom photo"
                    >
                      <Camera size={14} />
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>

                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      className="p-2 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors backdrop-blur-xs shadow"
                      title="Delete outfit photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-stone-200 hover:border-rose-300 rounded-2xl h-44 flex flex-col items-center justify-center cursor-pointer bg-stone-50/50 hover:bg-rose-50/30 transition-all">
                  <div className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center mb-1 text-stone-400">
                    <Shirt size={20} />
                  </div>
                  <span className="text-xs font-medium text-stone-700">Upload Photo for {currentPlan.dressCode}</span>
                  <span className="text-[10px] text-stone-400 mt-0.5">Click to choose image</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}

              <div>
                <p className="text-[11px] font-medium text-stone-400 mb-2 uppercase tracking-wider">
                  Change Outfit Style (Click to switch pic)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {outfitPresets.map((preset) => {
                    const isSelected = currentPlan.dressCode === preset.label;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectOutfitType(preset.label)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${isSelected
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                          }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: preset.palette[1] }}
                        />
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
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

          {/* Right Column: Live Map & Widgets */}
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

      {/* TAB 2: DATE ARCHIVE */}
      {activeTab === 'history' && (
        <section className="max-w-5xl mx-auto mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-stone-900">Our Past Date Memories</h2>
              <p className="text-xs text-stone-500">Every single date, captured like polaroids with ratings & memories</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-rose-100 text-rose-700 rounded-full">
              {historyPlans.length} Dates Completed
            </span>
          </div>

          {historyPlans.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
              <History size={36} className="mx-auto text-stone-300 mb-2" />
              <h3 className="font-bold text-sm text-stone-800">No completed dates yet</h3>
              <p className="text-xs text-stone-500 mt-1">When you finish a date, click "Mark Done" in the planner to archive it here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {historyPlans.map((plan) => {
                const photo = plan.outfitPhotos[plan.dressCode] || outfitPresets[0].defaultImage;
                return (
                  <div key={plan.id} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-3 relative group">
                    <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 shadow-inner">
                      <img
                        src={photo || ''}
                        alt={plan.title}
                        className="w-full h-56 object-cover rounded-xl shadow-xs"
                      />
                      <div className="mt-2 text-center">
                        <span className="text-[11px] font-mono text-stone-400">Captured on {plan.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-stone-900">{plan.title}</h3>
                      <div className="flex items-center text-amber-400">
                        {[...Array(plan.rating || 5)].map((_, i) => (
                          <Star key={i} size={15} fill="currentColor" />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <MapPin size={13} className="text-rose-500" />
                      <span>{plan.locationName}</span>
                      <span>•</span>
                      <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-medium">
                        {plan.dressCode}
                      </span>
                    </div>

                    <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-xs text-stone-700 italic">
                      "{plan.bestMemory || 'Loved every second together!'}"
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenEditHistoryModal(plan)}
                        className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-full transition-colors"
                      >
                        <Pencil size={12} /> Edit Memory & Rating
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: BUCKET LIST */}
      {activeTab === 'bucket' && (
        <section className="max-w-5xl mx-auto mt-6 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
            <h3 className="text-base font-bold text-stone-900 mb-1">Add to Our Date Wishlist</h3>
            <p className="text-xs text-stone-500 mb-4">Places or activities we want to try together someday</p>
            <form onSubmit={handleAddBucketItem} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="e.g. Star gazing camp in Tanay..."
                value={newBucketTitle}
                onChange={(e) => setNewBucketTitle(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
                required
              />
              <input
                type="text"
                placeholder="Any special notes or must-try food?"
                value={newBucketNotes}
                onChange={(e) => setNewBucketNotes(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Add Idea
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {bucketList.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      {item.vibe}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditBucketModal(item)}
                        className="text-stone-400 hover:text-stone-700 p-1"
                        title="Edit Wishlist Item"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setBucketList(bucketList.filter(b => b.id !== item.id))}
                        className="text-stone-300 hover:text-rose-500 p-1"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-stone-900">{item.title}</h4>
                  <p className="text-xs text-stone-500 mt-1">{item.notes}</p>
                </div>

                <button
                  onClick={() => handleConvertBucketToPlan(item)}
                  className="mt-4 w-full py-2 bg-stone-900 hover:bg-rose-500 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  Convert to Planned Date <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 4: BUDGET & BILL SPLITTER */}
      {activeTab === 'budget' && (
        <section className="max-w-5xl mx-auto mt-6 space-y-6">
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <DollarSign size={20} className="text-rose-500" />
              <div>
                <h3 className="text-sm font-bold text-stone-900">Budget Tracker for Date</h3>
                <p className="text-xs text-stone-500">Pick which date you want to calculate and split expenses for</p>
              </div>
            </div>
            <select
              value={activePlanId}
              onChange={(e) => setActivePlanId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold focus:ring-2 focus:ring-rose-400"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.date})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
              <p className="text-xs font-bold text-stone-400 uppercase">Total Date Budget</p>
              <p className="text-2xl font-black text-stone-900 mt-1">₱{totalCost.toLocaleString()}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">For {currentPlan?.title}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
              <p className="text-xs font-bold text-rose-500 uppercase">{currentUser}'s Share</p>
              <p className="text-2xl font-black text-rose-600 mt-1">₱{myShare.toLocaleString()}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Expenses covered</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
              <p className="text-xs font-bold text-stone-600 uppercase">{partnerName}'s Share</p>
              <p className="text-2xl font-black text-stone-800 mt-1">₱{partnerShare.toLocaleString()}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Expenses covered</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
            <h3 className="font-bold text-sm text-stone-900 mb-3">Add New Expense Item</h3>
            <form onSubmit={handleAddBudgetItem} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Item (e.g. Dinner, Cinema tickets, Gas)"
                value={newBudgetItem}
                onChange={(e) => setNewBudgetItem(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-400"
                required
              />
              <input
                type="number"
                placeholder="Cost in ₱ (e.g. 850)"
                value={newBudgetCost}
                onChange={(e) => setNewBudgetCost(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-400"
                required
              />
              <select
                value={newBudgetPaidBy}
                onChange={(e) => setNewBudgetPaidBy(e.target.value as any)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-400"
              >
                <option value="50/50">Split 50 / 50</option>
                <option value="You">Treated by {currentUser}</option>
                <option value="Partner">Treated by {partnerName}</option>
              </select>
              <button
                type="submit"
                className="py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Add to Expense
              </button>
            </form>

            <div className="mt-6 divide-y divide-stone-100">
              <div className="py-2 flex items-center justify-between text-[11px] font-bold uppercase text-stone-400 px-2">
                <span>Expense Item</span>
                <span>Details & Actions</span>
              </div>
              {currentBudget.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-6">No expenses added yet for this date.</p>
              ) : (
                currentBudget.map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between text-xs px-2 hover:bg-stone-50 rounded-xl transition-colors">
                    <div>
                      <p className="font-semibold text-stone-800 text-sm">{b.item}</p>
                      <span className="text-[11px] text-stone-400">
                        Paid by: <strong className="text-stone-600">{b.paidBy === 'You' ? currentUser : b.paidBy === 'Partner' ? partnerName : '50/50 Split'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-stone-900 text-sm">₱{b.cost.toLocaleString()}</span>

                      <button
                        type="button"
                        onClick={() => handleOpenEditBudgetItem(b)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
                        title="Edit expense"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBudgetItem(b.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete expense"
                      >
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

      {/* EDIT BUDGET ITEM MODAL */}
      {isEditBudgetModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-stone-200">
            <h2 className="text-lg font-bold text-stone-900">Edit Expense Item</h2>
            <p className="text-xs text-stone-500 mt-0.5">Modify price, item name, or who treats</p>

            <form onSubmit={handleSaveEditBudgetItem} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Item Description</label>
                <input
                  type="text"
                  value={editBudgetItemName}
                  onChange={(e) => setEditBudgetItemName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Cost in ₱</label>
                <input
                  type="number"
                  value={editBudgetItemCost}
                  onChange={(e) => setEditBudgetItemCost(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Split Option</label>
                <select
                  value={editBudgetItemPaidBy}
                  onChange={(e) => setEditBudgetItemPaidBy(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-400"
                >
                  <option value="50/50">Split 50 / 50</option>
                  <option value="You">Treated by {currentUser}</option>
                  <option value="Partner">Treated by {partnerName}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditBudgetModalOpen(false)}
                  className="px-4 py-2 text-xs text-stone-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-medium shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PAST MEMORY MODAL */}
      {isEditHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-stone-200">
            <h2 className="text-lg font-bold text-stone-900">Edit Date Memory ✨</h2>
            <p className="text-xs text-stone-500 mt-0.5">Update your thoughts and rating for this past date</p>

            <form onSubmit={handleSaveEditHistory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFinishRating(star)}
                      className="p-1 text-amber-400"
                    >
                      <Star size={24} fill={star <= finishRating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Our Favorite Memory / Note</label>
                <textarea
                  value={finishMemory}
                  onChange={(e) => setFinishMemory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-400 h-24"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditHistoryModalOpen(false)}
                  className="px-4 py-2 text-xs text-stone-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BUCKET LIST ITEM MODAL */}
      {isEditBucketModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-stone-200">
            <h2 className="text-lg font-bold text-stone-900">Edit Wishlist Idea</h2>
            <p className="text-xs text-stone-500 mt-0.5">Make changes to this future date dream</p>

            <form onSubmit={handleSaveEditBucket} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Activity / Place</label>
                <input
                  type="text"
                  value={editBucketTitle}
                  onChange={(e) => setEditBucketTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Notes or Specifics</label>
                <textarea
                  value={editBucketNotes}
                  onChange={(e) => setEditBucketNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-400 h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditBucketModalOpen(false)}
                  className="px-4 py-2 text-xs text-stone-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-medium"
                >
                  Save Idea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MARK AS COMPLETED MODAL */}
      {isFinishModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-stone-200">
            <h2 className="text-lg font-bold text-stone-900">Mark Date as Done! 💕</h2>
            <p className="text-xs text-stone-500 mt-0.5">Save this memory in your couple's scrapbook archive</p>

            <form onSubmit={handleCompleteDate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">How was the date?</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFinishRating(star)}
                      className="p-1 text-amber-400"
                    >
                      <Star size={24} fill={star <= finishRating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Our Favorite Memory / Highlight</label>
                <textarea
                  placeholder="e.g. The sunset view was breathtaking and the iced coffee was perfect..."
                  value={finishMemory}
                  onChange={(e) => setFinishMemory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-400 h-24"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFinishModalOpen(false)}
                  className="px-4 py-2 text-xs text-stone-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-medium"
                >
                  Save to Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DATE PLAN MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-xl border border-stone-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Edit Date Details</h2>
                <p className="text-xs text-stone-500">Update title, schedule, outfit, or re-pin destination</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Date Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Vibe / Theme</label>
                  <select
                    value={editVibe}
                    onChange={(e) => setEditVibe(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <option>Cozy & Romantic</option>
                    <option>Fancy Dinner</option>
                    <option>Chill & Outdoor</option>
                    <option>Museum & Art Walk</option>
                  </select>
                </div>
              </div>

              {/* OUTFIT SELECTOR IN EDIT MODAL */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Change Outfit Type for This Date
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {outfitPresets.map((preset) => {
                    const isSelected = editOutfitType === preset.label;
                    const displayPhoto = currentPlan.outfitPhotos?.[preset.label] || customStylePhotos[preset.label] || preset.defaultImage;

                    return (
                      <div
                        key={preset.id}
                        onClick={() => setEditOutfitType(preset.label)}
                        className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${isSelected
                          ? 'border-rose-500 bg-rose-50/50 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300'
                          }`}
                      >
                        {displayPhoto ? (
                          <img
                            src={displayPhoto}
                            alt={preset.label}
                            className="w-11 h-11 rounded-lg object-cover border border-stone-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 flex-shrink-0">
                            <Shirt size={18} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-stone-800 truncate">{preset.label}</p>
                          <p className="text-[10px] text-stone-500 truncate">{preset.desc}</p>
                        </div>
                        {isSelected && (
                          <span className="p-0.5 bg-rose-500 text-white rounded-full flex-shrink-0">
                            <Check size={12} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* OPM SOUNDTRACK SELECTOR IN EDIT MODAL */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Choose OPM Date Soundtrack
                </label>
                <select
                  value={editSpotify}
                  onChange={(e) => setEditSpotify(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-400"
                >
                  {opmSoundtracks.map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.title} - {song.artist}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Location Search & Re-pin
                </label>
                <div className="flex gap-1.5 mb-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-3 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search new place or landmark..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleSearchLocation(e, true)}
                    disabled={isSearching}
                    className="px-3.5 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-medium rounded-xl disabled:opacity-50"
                  >
                    {isSearching ? 'Searching...' : 'Find'}
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Location Name"
                  value={editLocName}
                  onChange={(e) => setEditLocName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 mb-2"
                />

                <div className="h-44 w-full rounded-2xl overflow-hidden border border-stone-200 relative z-0">
                  <MapContainer
                    center={editCoords || [currentPlan.lat, currentPlan.lng]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapFlyToController centerCoords={mapCenterTarget} />
                    <LocationPicker position={editCoords} setPosition={setEditCoords} />
                  </MapContainer>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleDeletePlan}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <Trash2 size={14} /> Delete Date Plan
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-full text-xs font-medium text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full text-xs font-medium bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLAN A NEW DATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-xl border border-stone-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Plan a new date</h2>
                <p className="text-xs text-stone-500">Pick destination, vibe, and matching outfit</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Date Title</label>
                <input
                  type="text"
                  placeholder="e.g. Tagaytay Overlook & Sunset Dinner"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
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
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Vibe / Theme</label>
                  <select
                    value={newVibe}
                    onChange={(e) => setNewVibe(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <option>Cozy & Romantic</option>
                    <option>Fancy Dinner</option>
                    <option>Chill & Outdoor</option>
                    <option>Museum & Art Walk</option>
                  </select>
                </div>
              </div>

              {/* OUTFIT PRESET CARDS */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Choose Outfit Type for You Both
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {outfitPresets.map((preset) => {
                    const isSelected = selectedOutfitType === preset.label;
                    const displayPhoto = customStylePhotos[preset.label] || preset.defaultImage;

                    return (
                      <div
                        key={preset.id}
                        onClick={() => setSelectedOutfitType(preset.label)}
                        className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${isSelected
                          ? 'border-rose-500 bg-rose-50/50 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300'
                          }`}
                      >
                        {displayPhoto ? (
                          <img
                            src={displayPhoto}
                            alt={preset.label}
                            className="w-11 h-11 rounded-lg object-cover border border-stone-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 flex-shrink-0">
                            <Shirt size={18} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-stone-800 truncate">{preset.label}</p>
                          <p className="text-[10px] text-stone-500 truncate">{preset.desc}</p>
                        </div>
                        {isSelected && (
                          <span className="p-0.5 bg-rose-500 text-white rounded-full flex-shrink-0">
                            <Check size={12} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Search Bar for Map */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Search & Pin Location
                </label>
                <div className="flex gap-1.5 mb-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-3 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Type a town or place (e.g. Tuy Batangas, Sky Ranch)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleSearchLocation(e, false)}
                    disabled={isSearching}
                    className="px-3.5 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-medium rounded-xl disabled:opacity-50"
                  >
                    {isSearching ? 'Searching...' : 'Find on Map'}
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Custom name for this place (e.g. Tagaytay Cafe)"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 mb-2"
                />

                <div className="h-44 w-full rounded-2xl overflow-hidden border border-stone-200 relative z-0">
                  <MapContainer
                    center={pinnedCoords || userCoords || [14.025, 120.733]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapFlyToController centerCoords={mapCenterTarget} />
                    <LocationPicker position={pinnedCoords} setPosition={setPinnedCoords} />
                  </MapContainer>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-medium bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
                >
                  Save Date Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}