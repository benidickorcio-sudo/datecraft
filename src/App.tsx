import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Heart, Calendar, MapPin, Plus, Shirt, CheckSquare, ExternalLink,
  Navigation, Sparkles, Trash2, Camera, LogOut, User,
  Pencil, CloudSun, Dices, Clock, History, BookmarkPlus,
  DollarSign, Star, ArrowRight, CheckCircle2, Copy, Users, X, Loader2, ImagePlus, KeyRound, Radio, Wand2, Download, BookOpen, ChevronLeft, ChevronRight, ChevronDown, Crown, Palette, Bell, Wallet, Check, AlertCircle
} from 'lucide-react';
import './utils/leafletIcons';
import { supabase } from './supabase';

interface Member {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  updated_at?: string;
}

interface BudgetItem {
  id: number;
  item: string;
  cost: number;
  paidBy: string;
}

interface DatePlan {
  id: string;
  couple_id?: string;
  title: string;
  date: string;
  vibe: string;
  locationName: string;
  meetupName?: string;
  lat: number;
  lng: number;
  dressCode: string;
  call_time?: string;
  outfit_photos?: Record<string, string | null>;
  memory_photo?: string | null;
  gallery_photos?: string[];
  tasks: { id: number; text: string; done: boolean }[];
  completed?: boolean;
  rating?: number;
  bestMemory?: string;
  budgetItems?: BudgetItem[];
}

interface BucketItem {
  id: string;
  couple_id?: string;
  title: string;
  vibe: string;
  notes: string;
}

interface ThemeOption {
  id: string;
  name: string;
  bg: string;
  card: string;
  text: string;
  subText: string;
  border: string;
  accent: string;
  radius: string;
  shadowStyle: string;
}

const aestheticThemes: ThemeOption[] = [
  {
    id: 'sakura',
    name: 'Sakura Petal 🌸',
    bg: 'linear-gradient(135deg, #FFE6ED 0%, #FFD1DC 50%, #FFC0CB 100%)',
    card: 'rgba(255, 255, 255, 0.75)',
    text: '#5B3742',
    subText: '#9A737D',
    border: 'rgba(255, 255, 255, 0.95)',
    accent: '#F43F5E',
    radius: '2rem',
    shadowStyle: '0 12px 40px 0 rgba(244, 63, 94, 0.12)'
  },
  {
    id: 'oceanic',
    name: 'Deep Oceanic 🌊',
    bg: '#0F172A',
    card: '#1E293B',
    text: '#F8FAFC',
    subText: '#94A3B8',
    border: '#334155',
    accent: '#38BDF8',
    radius: '1rem',
    shadowStyle: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
  },
  {
    id: 'forest',
    name: 'Forest Canopy 🌲',
    bg: '#F3F6F4',
    card: '#EAEDE9',
    text: '#1B2E23',
    subText: '#4A6B5D',
    border: '#D2DDD5',
    accent: '#315C42',
    radius: '0.875rem',
    shadowStyle: '0 10px 25px -5px rgba(27, 46, 35, 0.06)'
  },
  {
    id: 'space',
    name: 'Cosmic Space 🌌',
    bg: '#08080C',
    card: '#12131C',
    text: '#E2E8F0',
    subText: '#64748B',
    border: '#1E2030',
    accent: '#A855F7',
    radius: '0.75rem',
    shadowStyle: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
  }
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

const memberColors = ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#ea580c', '#4f46e5'];

function decodeWeather(code: number): string {
  if (code === 0) return 'Clear Sky ☀️';
  if (code === 1) return 'Mainly Clear 🌤️';
  if (code === 2) return 'Partly Cloudy ⛅';
  if (code === 3) return 'Overcast ☁️';
  if (code >= 45 && code <= 48) return 'Foggy 🌫️';
  if (code >= 51 && code <= 55) return 'Light Drizzle 🌧️';
  if (code >= 61 && code <= 65) return 'Rain Showers 🌧️';
  if (code >= 71 && code <= 77) return 'Snowy ❄️';
  if (code >= 80 && code <= 82) return 'Heavy Showers ⛈️';
  if (code >= 95 && code <= 99) return 'Thunderstorm ⚡';
  return 'Cloudy ⛅';
}

const createUserIcon = (name: string, colorHex: string) => L.divIcon({
  className: 'custom-live-pin',
  html: `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
      <div style="background: white; border: 1.5px solid ${colorHex}; border-radius: 9999px; padding: 2px 8px; font-size: 10px; font-weight: 700; color: ${colorHex}; box-shadow: 0 2px 6px rgba(0,0,0,0.15); margin-bottom: 3px; white-space: nowrap;">
        ${name}
      </div>
      <div style="position: relative; width: 20px; height: 20px;">
        <span style="position: absolute; inset: 0; border-radius: 9999px; background-color: ${colorHex}; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <span style="position: relative; display: block; width: 20px; height: 20px; border-radius: 9999px; background-color: ${colorHex}; border: 2.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></span>
      </div>
    </div>
  `,
  iconSize: [70, 45],
  iconAnchor: [35, 40],
});

function MapFlyToController({ centerCoords }: { centerCoords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (centerCoords) map.flyTo(centerCoords, 14, { duration: 1.2 });
  }, [centerCoords, map]);
  return null;
}

function LocationPicker({ position, setPosition }: { position: [number, number] | null; setPosition: (pos: [number, number]) => void; }) {
  useMapEvents({ click(e) { setPosition([e.latlng.lat, e.latlng.lng]); } });
  return position ? <Marker position={position} /> : null;
}

async function compressImageFile(file: File, maxWidth = 1280, maxHeight = 1280, quality = 0.75): Promise<Blob | File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else resolve(file);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

async function uploadToSupabaseStorage(file: File): Promise<string | null> {
  try {
    const compressedBlob = await compressImageFile(file);
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
    const filePath = `outfits/${fileName}`;

    const { error } = await supabase.storage.from('outfits').upload(filePath, compressedBlob, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: true
    });
    if (error) throw error;

    const { data } = supabase.storage.from('outfits').getPublicUrl(filePath);
    return data.publicUrl;
  } catch {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c);
}

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch {
    // Audio context prevented by browser autoplay policy if un-interacted
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'planner' | 'history' | 'bucket' | 'budget'>('planner');

  // Space Membership State
  const [coupleId, setCoupleId] = useState<string | null>(() => localStorage.getItem('dc_couple_id'));
  const [spaceCode, setSpaceCode] = useState<string | null>(() => localStorage.getItem('dc_space_code'));
  const [currentUserId, setCurrentUserId] = useState<string>(() => localStorage.getItem('dc_user_id') || '');
  const [currentUserName, setCurrentUserName] = useState<string>(() => localStorage.getItem('dc_user_name') || '');
  const [creatorName, setCreatorName] = useState<string>(() => localStorage.getItem('dc_creator_name') || '');
  const [isCreator, setIsCreator] = useState<boolean>(() => localStorage.getItem('dc_is_creator') === 'true');
  const [members, setMembers] = useState<Member[]>([]);
  const [maxCapacity, setMaxCapacity] = useState<number>(2);

  // Auth Inputs
  const [authMode, setAuthMode] = useState<'create' | 'join'>('create');
  const [createNameInput, setCreateNameInput] = useState(() => localStorage.getItem('dc_remembered_name') || '');
  const [customCodeInput, setCustomCodeInput] = useState('');
  const [maxMembersInput, setMaxMembersInput] = useState<number>(2);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinNameInput, setJoinNameInput] = useState(() => localStorage.getItem('dc_remembered_name') || '');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const rememberedName = localStorage.getItem('dc_remembered_name');

  // Plans & Items
  const [plans, setPlans] = useState<DatePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [bucketList, setBucketList] = useState<BucketItem[]>([]);
  const [newBucketTitle, setNewBucketTitle] = useState('');
  const [newBucketNotes, setNewBucketNotes] = useState('');
  const [newBucketVibe, setNewBucketVibe] = useState('Cozy & Romantic');

  // Wallet Budgets for members
  const [memberWallets, setMemberWallets] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('dc_member_wallets') || '{}');
    } catch {
      return {};
    }
  });

  const [topUpInputs, setTopUpInputs] = useState<Record<string, string>>({});
  const [remainingEditMode, setRemainingEditMode] = useState<Record<string, boolean>>({});
  const [tempRemainingInputs, setTempRemainingInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    localStorage.setItem('dc_member_wallets', JSON.stringify(memberWallets));
  }, [memberWallets]);

  // Wishlist Editing State
  const [editingBucketItem, setEditingBucketItem] = useState<BucketItem | null>(null);

  // Expense Editing State
  const [editingBudgetItemId, setEditingBudgetItemId] = useState<number | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemCost, setEditItemCost] = useState('');
  const [editItemPaidBy, setEditItemPaidBy] = useState('50/50');

  // GPS Live State
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Notifications & Alert Ref for sound throttle
  const [arrivedMembers, setArrivedMembers] = useState<string[]>([]);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);
  const lastAlertRef = useRef<string | null>(null);

  // Weather & Extra
  const [weatherInfo, setWeatherInfo] = useState<{ temp: number; description: string } | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [pickedIdea, setPickedIdea] = useState<string | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [finishingPlanTargetId, setFinishingPlanTargetId] = useState<string | null>(null);

  // Interactive Storybook Flip-Book State
  const [isStorybookModalOpen, setIsStorybookModalOpen] = useState(false);
  const [activeStoryPage, setActiveStoryPage] = useState<number>(0);

  // Form states
  const todayString = new Date().toISOString().split('T')[0];
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(todayString);
  const [newVibe, setNewVibe] = useState('Cozy & Romantic');
  const [newLocName, setNewLocName] = useState('');
  const [newMeetupName, setNewMeetupName] = useState('');
  const [newCallTime, setNewCallTime] = useState('10:00');
  const [pinnedCoords, setPinnedCoords] = useState<[number, number]>([14.5995, 120.9842]);
  const [selectedOutfitType] = useState(outfitPresets[0].label);

  // Date Multi-Photos uploader state
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const [modalTasks] = useState<string[]>([
    'Visit Church & Pray together',
    'Try cute cafe / coffee date'
  ]);
  const [inlineTaskInput, setInlineTaskInput] = useState('');

  // Edit Date Form State
  const [editPlanId, setEditPlanId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editVibe, setEditVibe] = useState('Cozy & Romantic');
  const [editLocName, setEditLocName] = useState('');
  const [editMeetupName, setEditMeetupName] = useState('');
  const [editCallTime, setEditCallTime] = useState('10:00');
  const [editCoords, setEditCoords] = useState<[number, number] | null>(null);
  const [editOutfitType, setEditOutfitType] = useState(outfitPresets[0].label);

  // Finish Memory Modal State
  const [finishRating, setFinishRating] = useState(5);
  const [finishMemory, setFinishMemory] = useState('');
  const [finishMemoryPhoto, setFinishMemoryPhoto] = useState<string | null>(null);
  const [isUploadingMemoryPhoto, setIsUploadingMemoryPhoto] = useState(false);

  // Budget
  const [newBudgetItem, setNewBudgetItem] = useState('');
  const [newBudgetCost, setNewBudgetCost] = useState('');
  const [newBudgetPaidBy, setNewBudgetPaidBy] = useState('50/50');

  // Search Map
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenterTarget, setMapCenterTarget] = useState<[number, number] | null>(null);

  // Theme State
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('dc_theme') || 'sakura');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const activeThemeObj = aestheticThemes.find((t) => t.id === currentTheme) || aestheticThemes[0];

  const upcomingPlans = plans.filter((p) => !p.completed);
  const historyPlans = plans.filter((p) => Boolean(p.completed));
  const currentPlan = upcomingPlans.find((p) => p.id === selectedPlanId) || upcomingPlans[0] || null;

  const currentBudget = currentPlan?.budgetItems || [];
  const totalCost = currentBudget.reduce((acc, curr) => acc + curr.cost, 0);

  const boyName = currentUserName || (members[0]?.name) || 'Boy';
  const partnerMember = members.find((m) => m.name.toLowerCase() !== boyName.toLowerCase());
  const girlName = partnerMember?.name || (members[1]?.name) || 'Girl';

  const boyShare = currentBudget.reduce((acc, curr) => {
    if (curr.paidBy === boyName) return acc + curr.cost;
    if (curr.paidBy === '50/50') {
      const count = members.length > 0 ? members.length : 2;
      return acc + (curr.cost / count);
    }
    return acc;
  }, 0);

  const girlShare = currentBudget.reduce((acc, curr) => {
    if (curr.paidBy === girlName) return acc + curr.cost;
    if (curr.paidBy === '50/50') {
      const count = members.length > 0 ? members.length : 2;
      return acc + (curr.cost / count);
    }
    return acc;
  }, 0);

  const otherMember = members.find((m) => m.id !== currentUserId && m.lat && m.lng);
  const coupleDistanceKm = (userCoords && otherMember && otherMember.lat && otherMember.lng)
    ? getDistanceKm(userCoords[0], userCoords[1], otherMember.lat, otherMember.lng)
    : null;

  const isScrapbookReady = historyPlans.length >= 2;
  const sortedBudgetItems = [...currentBudget].sort((a: BudgetItem, b: BudgetItem) => b.cost - a.cost);
  const albumDates = historyPlans.slice(0, 2);

  const handleMemoryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, planId?: string) => {
    if (!e.target.files || !e.target.files[0]) return;
    setIsUploadingMemoryPhoto(true);
    const permanentUrl = await uploadToSupabaseStorage(e.target.files[0]);
    setIsUploadingMemoryPhoto(false);

    if (permanentUrl) {
      if (planId) {
        setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, memory_photo: permanentUrl } : p)));
        supabase.from('date_plans').update({ memory_photo: permanentUrl }).eq('id', planId).then(({ error }) => {
          if (error) alert(`Error saving photo: ${error.message}`);
        });
      } else {
        setFinishMemoryPhoto(permanentUrl);
      }
    }
  };

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const newPos: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setPinnedCoords(newPos);
        setMapCenterTarget(newPos);
        if (!newLocName) setNewLocName(data[0].display_name.split(',')[0]);
      }
    } catch {
      alert('Error searching for location.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam && !coupleId) {
      setAuthMode('join');
      setJoinCodeInput(codeParam.toUpperCase());
    }
  }, [coupleId]);

  const generateRandomCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setCustomCodeInput(`LOVE-${randomNum}`);
  };

  const broadcastLocation = async (lat: number, lng: number) => {
    if (!coupleId || !currentUserId) return;
    const nowIso = new Date().toISOString();

    const { data } = await supabase.from('couples').select('members').eq('id', coupleId).single();
    if (!data) return;

    const currentMembers: Member[] = data.members || [];
    const updated = currentMembers.map((m) =>
      m.id === currentUserId ? { ...m, lat, lng, updated_at: nowIso } : m
    );

    await supabase.from('couples').update({ members: updated }).eq('id', coupleId);
  };

  const startLiveTracking = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserCoords(coords);
        setIsLocating(false);
        broadcastLocation(coords[0], coords[1]);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
  };

  const fetchSpaceDetails = async (cId: string) => {
    const { data } = await supabase.from('couples').select('*').eq('id', cId).single();
    if (data) {
      const memberList: Member[] = data.members || [];
      const spaceCreator = data.user1_name || '';

      setMembers(memberList);
      setMaxCapacity(data.max_members || 2);
      setCreatorName(spaceCreator);
      localStorage.setItem('dc_creator_name', spaceCreator);

      const myName = localStorage.getItem('dc_user_name') || currentUserName;
      const amICreator = spaceCreator.trim().toLowerCase() === myName.trim().toLowerCase();
      setIsCreator(amICreator);
      localStorage.setItem('dc_is_creator', amICreator ? 'true' : 'false');

      const stillInSpace = memberList.some((m) => m.id === currentUserId || m.name.toLowerCase() === myName.toLowerCase());
      if (!stillInSpace && currentUserId && !amICreator) {
        alert('You have been removed from this space by the creator.');
        handleLogout();
      }
    }
  };

  const fetchDatePlans = async (cId: string) => {
    const { data, error: fetchErr } = await supabase.from('date_plans').select('*').eq('couple_id', cId).order('date', { ascending: true });
    if (!fetchErr && data) {
      setPlans(data.map((d: any) => ({
        id: d.id,
        couple_id: d.couple_id,
        title: d.title,
        date: d.date,
        vibe: d.vibe,
        locationName: d.location_name,
        meetupName: d.meetup_name || '',
        lat: d.lat,
        lng: d.lng,
        dressCode: d.dress_code,
        call_time: d.call_time || '10:00',
        outfit_photos: d.outfit_photos || {},
        memory_photo: d.memory_photo || null,
        gallery_photos: d.gallery_photos || [],
        tasks: d.tasks || [],
        completed: Boolean(d.completed),
        rating: d.rating,
        bestMemory: d.best_memory,
        budgetItems: d.budget_items || [],
      })));
    }
  };

  const fetchBucketList = async (cId: string) => {
    const { data } = await supabase.from('bucket_items').select('*').eq('couple_id', cId).order('created_at', { ascending: false });
    if (data) setBucketList(data);
  };

  useEffect(() => {
    if (!coupleId) return;

    fetchDatePlans(coupleId);
    fetchBucketList(coupleId);
    fetchSpaceDetails(coupleId);
    startLiveTracking();

    const syncInterval = setInterval(() => {
      fetchSpaceDetails(coupleId);
      fetchDatePlans(coupleId);
    }, 4000);

    const channel = supabase
      .channel(`space_live_${coupleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'date_plans', filter: `couple_id=eq.${coupleId}` }, () => fetchDatePlans(coupleId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bucket_items', filter: `couple_id=eq.${coupleId}` }, () => fetchBucketList(coupleId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` }, (payload: any) => {
        const updatedMembers: Member[] = payload.new.members || [];
        const spaceCreator = payload.new.user1_name || creatorName;

        setMembers(updatedMembers);
        setMaxCapacity(payload.new.max_members || 2);
        setCreatorName(spaceCreator);

        const myName = localStorage.getItem('dc_user_name') || currentUserName;
        const amICreator = spaceCreator.trim().toLowerCase() === myName.trim().toLowerCase();
        setIsCreator(amICreator);

        const stillInSpace = updatedMembers.some((m) => m.id === currentUserId || m.name.toLowerCase() === myName.toLowerCase());
        if (!stillInSpace && currentUserId && !amICreator) {
          alert('You have been removed from this space by the creator.');
          handleLogout();
        }
      })
      .subscribe();

    return () => {
      clearInterval(syncInterval);
      supabase.removeChannel(channel);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [coupleId]);

  useEffect(() => {
    if (!currentPlan) return;
    setIsWeatherLoading(true);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${currentPlan.lat}&longitude=${currentPlan.lng}&current=temperature_2m,weather_code&timezone=auto`)
      .then((res) => res.json())
      .then((data) => {
        if (data.current) {
          const temp = Math.round(data.current.temperature_2m);
          const weatherDesc = decodeWeather(data.current.weather_code);
          setWeatherInfo({ temp, description: weatherDesc });
        }
      })
      .catch(() => setWeatherInfo(null))
      .finally(() => setIsWeatherLoading(false));
  }, [currentPlan?.lat, currentPlan?.lng]);

  useEffect(() => {
    if (!currentPlan) return;
    members.forEach((m) => {
      if (m.lat && m.lng && currentPlan.lat && currentPlan.lng) {
        const distKm = getDistanceKm(m.lat, m.lng, currentPlan.lat, currentPlan.lng);
        if (distKm <= 0.05 && !arrivedMembers.includes(m.name)) {
          setArrivedMembers((prev) => [...prev, m.name]);
          setNotificationBanner(`${m.name} has arrived at ${currentPlan.meetupName || currentPlan.locationName}.`);
          playNotificationSound();
          setTimeout(() => setNotificationBanner(null), 8000);
        }
      }
    });

    const today = new Date().toISOString().split('T')[0];
    const dateDiff = Math.ceil((new Date(currentPlan.date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
    if (dateDiff === 1) {
      setNotificationBanner(`Next date: "${currentPlan.title}" is tomorrow.`);
    }

    if (currentPlan.call_time) {
      const now = new Date();
      const [callHour, callMinute] = currentPlan.call_time.split(':').map(Number);
      const callDate = new Date();
      callDate.setHours(callHour, callMinute, 0, 0);

      const diffMinutes = (callDate.getTime() - now.getTime()) / (1000 * 60);
      if (diffMinutes > 0 && diffMinutes <= 5) {
        setNotificationBanner(`Call time is in ${Math.round(diffMinutes)} minute(s).`);
      }
    }
  }, [members, currentPlan, arrivedMembers]);

  // Robust 15% Low Cash & Out of Cash Alert with individual naming and sound notifications
  useEffect(() => {
    const boyWallet = memberWallets[boyName] ?? 5000;
    const girlWallet = memberWallets[girlName] ?? 5000;
    const boyRemaining = boyWallet - boyShare;
    const girlRemaining = girlWallet - girlShare;

    const isBoyOut = boyWallet > 0 && boyRemaining <= 0;
    const isGirlOut = girlWallet > 0 && girlRemaining <= 0;

    const isBoyLow = boyWallet > 0 && boyRemaining > 0 && boyRemaining <= Math.max(10, boyWallet * 0.15);
    const isGirlLow = girlWallet > 0 && girlRemaining > 0 && girlRemaining <= Math.max(10, girlWallet * 0.15);

    let alertMsg: string | null = null;

    if (isBoyOut && isGirlOut) {
      alertMsg = `⚠️ Out of Cash Alert: Both ${boyName} and ${girlName} have run out of cash (₱0 remaining)!`;
    } else if (isBoyOut && isGirlLow) {
      alertMsg = `⚠️ Cash Alert: ${boyName} is out of cash (₱0), and ${girlName} is almost out of cash (₱${girlRemaining.toLocaleString()} left)!`;
    } else if (isGirlOut && isBoyLow) {
      alertMsg = `⚠️ Cash Alert: ${girlName} is out of cash (₱0), and ${boyName} is almost out of cash (₱${boyRemaining.toLocaleString()} left)!`;
    } else if (isBoyOut) {
      alertMsg = `⚠️ Out of Cash Alert: ${boyName} has completely run out of cash (₱0 remaining)!`;
    } else if (isGirlOut) {
      alertMsg = `⚠️ Out of Cash Alert: ${girlName} has completely run out of cash (₱0 remaining)!`;
    } else if (isBoyLow && isGirlLow) {
      alertMsg = `⚠️ Low Cash Alert: Both ${boyName} and ${girlName} are almost out of cash!`;
    } else if (isBoyLow) {
      alertMsg = `⚠️ Low Cash Alert: ${boyName} is almost out of cash (Remaining: ₱${boyRemaining.toLocaleString()})!`;
    } else if (isGirlLow) {
      alertMsg = `⚠️ Low Cash Alert: ${girlName} is almost out of cash (Remaining: ₱${girlRemaining.toLocaleString()})!`;
    }

    if (alertMsg) {
      if (lastAlertRef.current !== alertMsg) {
        playNotificationSound();
        lastAlertRef.current = alertMsg;
      }
      setNotificationBanner(alertMsg);
    } else {
      lastAlertRef.current = null;
    }
  }, [boyShare, girlShare, memberWallets, boyName, girlName]);

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createNameInput.trim()) return;

    setIsAuthLoading(true);
    const rawCode = customCodeInput.trim() || `LOVE-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalCode = rawCode.toUpperCase().replace(/\s+/g, '-');

    const myId = 'usr_' + Date.now();
    const myName = createNameInput.trim();
    const initialMembers: Member[] = [{ id: myId, name: myName, updated_at: new Date().toISOString() }];

    const { data, error: insertErr } = await supabase.from('couples').insert([{
      space_code: finalCode,
      max_members: maxMembersInput,
      members: initialMembers,
      user1_name: myName,
      user2_name: ''
    }]).select().single();

    setIsAuthLoading(false);

    if (insertErr) {
      if (insertErr.code === '23505') {
        alert(`The space code "${finalCode}" is already taken! Please pick a different code.`);
      } else {
        alert(`Error creating space: ${insertErr.message}`);
      }
      return;
    }

    if (data) {
      localStorage.setItem('dc_couple_id', data.id);
      localStorage.setItem('dc_space_code', data.space_code);
      localStorage.setItem('dc_user_id', myId);
      localStorage.setItem('dc_user_name', myName);
      localStorage.setItem('dc_remembered_name', myName);
      localStorage.setItem('dc_creator_name', myName);
      localStorage.setItem('dc_is_creator', 'true');

      setCoupleId(data.id);
      setSpaceCode(data.space_code);
      setCurrentUserId(myId);
      setCurrentUserName(myName);
      setCreatorName(myName);
      setIsCreator(true);
      setMembers(initialMembers);
      setMaxCapacity(maxMembersInput);
    }
  };

  const handleJoinSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setIsAuthLoading(true);
    const cleanCode = joinCodeInput.trim().toUpperCase();

    const { data, error: joinErr } = await supabase.from('couples').select('*').eq('space_code', cleanCode).single();
    setIsAuthLoading(false);

    if (joinErr || !data) {
      alert('Space code not found! Please check the code.');
      return;
    }

    const currentMemberList: Member[] = data.members || [];
    const roomLimit = data.max_members || 2;
    const spaceCreator = data.user1_name || '';
    const storedUserId = localStorage.getItem('dc_user_id');
    const existingMemberByStoredId = currentMemberList.find((m) => m.id === storedUserId);
    const savedName = rememberedName || joinNameInput.trim();
    const existingMemberByName = currentMemberList.find((m) => m.name.toLowerCase() === savedName.toLowerCase());

    let activeUserId = storedUserId;
    let activeUserName = savedName;

    if (existingMemberByStoredId) {
      activeUserId = existingMemberByStoredId.id;
      activeUserName = existingMemberByStoredId.name;
    } else if (existingMemberByName) {
      activeUserId = existingMemberByName.id;
      activeUserName = existingMemberByName.name;
    } else {
      if (!savedName) {
        alert('Please enter your name to join this space for the first time!');
        return;
      }
      if (currentMemberList.length >= roomLimit) {
        alert(`This space is full! Maximum limit is ${roomLimit} people.`);
        return;
      }

      activeUserId = 'usr_' + Date.now();
      activeUserName = savedName;
      const updatedMemberList = [...currentMemberList, { id: activeUserId, name: activeUserName, updated_at: new Date().toISOString() }];
      await supabase.from('couples').update({ members: updatedMemberList }).eq('id', data.id);
      setMembers(updatedMemberList);
    }

    const amICreator = spaceCreator.trim().toLowerCase() === activeUserName.trim().toLowerCase();

    localStorage.setItem('dc_couple_id', data.id);
    localStorage.setItem('dc_space_code', data.space_code);
    localStorage.setItem('dc_user_id', activeUserId || '');
    localStorage.setItem('dc_user_name', activeUserName);
    localStorage.setItem('dc_remembered_name', activeUserName);
    localStorage.setItem('dc_creator_name', spaceCreator);
    localStorage.setItem('dc_is_creator', amICreator ? 'true' : 'false');

    setCoupleId(data.id);
    setSpaceCode(data.space_code);
    setCurrentUserId(activeUserId || '');
    setCurrentUserName(activeUserName);
    setCreatorName(spaceCreator);
    setIsCreator(amICreator);
    setMaxCapacity(roomLimit);
    setMembers(data.members || []);
  };

  const handleRemoveMember = async (memberToRemove: Member) => {
    if (!coupleId || !isCreator) {
      alert('Only the creator can remove members.');
      return;
    }

    const isTargetCreator = memberToRemove.name.trim().toLowerCase() === creatorName.trim().toLowerCase();
    if (isTargetCreator) {
      alert('You cannot remove the space creator.');
      return;
    }

    const confirmKick = window.confirm(`Are you sure you want to remove "${memberToRemove.name}" from this space?`);
    if (!confirmKick) return;

    const updated = members.filter((m) => m.id !== memberToRemove.id && m.name !== memberToRemove.name);
    setMembers(updated);

    await supabase.from('couples').update({ members: updated }).eq('id', coupleId);
  };

  const handleLogout = () => {
    const savedName = localStorage.getItem('dc_remembered_name');
    localStorage.clear();
    if (savedName) localStorage.setItem('dc_remembered_name', savedName);

    setCoupleId(null);
    setSpaceCode(null);
    setCurrentUserId('');
    setCurrentUserName('');
    setCreatorName('');
    setIsCreator(false);
    setMembers([]);
    setPlans([]);
    setBucketList([]);
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
  };

  const handleMultipleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>, planId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const targetPlan = plans.find((p) => p.id === planId);
    const existing = targetPlan?.gallery_photos || [];

    if (existing.length >= 15) {
      alert('You have already reached the maximum of 15 pictures for this date!');
      return;
    }

    const availableSlots = 15 - existing.length;
    const selectedFiles = Array.from(e.target.files).slice(0, availableSlots);

    setIsUploadingGallery(true);

    try {
      const uploadPromises = selectedFiles.map((file) => uploadToSupabaseStorage(file));
      const results = await Promise.all(uploadPromises);
      const uploadedUrls = results.filter(Boolean) as string[];

      if (uploadedUrls.length > 0) {
        const updatedList = [...existing, ...uploadedUrls];
        setPlans((prev) => prev.map((p) => p.id === planId ? { ...p, gallery_photos: updatedList } : p));
        supabase.from('date_plans').update({ gallery_photos: updatedList }).eq('id', planId).then(({ error }) => {
          if (error) alert(`Error saving photos: ${error.message}`);
        });
      }
    } catch {
      alert('Error uploading some photos. Please try again.');
    } finally {
      setIsUploadingGallery(false);
      e.target.value = '';
    }
  };

  const handleDeleteGalleryPhoto = async (planId: string, photoUrl: string) => {
    const targetPlan = plans.find((p) => p.id === planId);
    if (!targetPlan) return;
    const updated = (targetPlan.gallery_photos || []).filter((url) => url !== photoUrl);
    setPlans((prev) => prev.map((p) => p.id === planId ? { ...p, gallery_photos: updated } : p));
    supabase.from('date_plans').update({ gallery_photos: updated }).eq('id', planId).then(({ error }) => {
      if (error) alert(`Error deleting photo: ${error.message}`);
    });
  };

  const handleCreateDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate || !coupleId) return;

    const formattedTasks = modalTasks.map((t, idx) => ({ id: Date.now() + idx, text: t, done: false }));
    const coords = pinnedCoords || [14.5995, 120.9842];

    const tempId = 'temp_' + Date.now();
    const newPlanObj: DatePlan = {
      id: tempId,
      couple_id: coupleId,
      title: newTitle.trim(),
      date: newDate,
      vibe: newVibe,
      locationName: newLocName.trim() || 'Pinned Destination',
      meetupName: newMeetupName.trim() || '',
      lat: coords[0],
      lng: coords[1],
      dressCode: selectedOutfitType,
      call_time: newCallTime,
      outfit_photos: {},
      completed: false,
      tasks: formattedTasks,
      gallery_photos: [],
      budgetItems: [],
    };

    setPlans((prev) => [...prev, newPlanObj]);
    setSelectedPlanId(tempId);
    setIsModalOpen(false);
    setNewTitle('');
    setNewLocName('');
    setNewMeetupName('');

    supabase.from('date_plans').insert([{
      couple_id: coupleId,
      title: newPlanObj.title,
      date: newPlanObj.date,
      vibe: newPlanObj.vibe,
      location_name: newPlanObj.locationName,
      meetup_name: newPlanObj.meetupName,
      lat: newPlanObj.lat,
      lng: newPlanObj.lng,
      dress_code: newPlanObj.dressCode,
      call_time: newPlanObj.call_time,
      outfit_photos: {},
      completed: false,
      tasks: formattedTasks,
      gallery_photos: [],
      budget_items: [],
    }]).select().single().then(({ data, error }) => {
      if (error) {
        alert(`Error saving date plan: ${error.message}`);
      } else if (data) {
        setPlans((prev) => prev.map((p) => p.id === tempId ? {
          id: data.id,
          couple_id: data.couple_id,
          title: data.title,
          date: data.date,
          vibe: data.vibe,
          locationName: data.location_name,
          meetupName: data.meetup_name || '',
          lat: data.lat,
          lng: data.lng,
          dressCode: data.dress_code || data.dressCode || selectedOutfitType,
          call_time: data.call_time || '10:00',
          outfit_photos: data.outfit_photos || {},
          memory_photo: data.memory_photo || null,
          gallery_photos: data.gallery_photos || [],
          tasks: data.tasks || formattedTasks,
          completed: Boolean(data.completed),
          rating: data.rating,
          bestMemory: data.best_memory,
          budgetItems: data.budget_items || [],
        } : p));
        setSelectedPlanId(data.id);
      }
    });
  };

  const handleOpenEditModal = (planToEdit: DatePlan) => {
    setEditPlanId(planToEdit.id);
    setEditTitle(planToEdit.title);
    setEditDate(planToEdit.date);
    setEditVibe(planToEdit.vibe);
    setEditLocName(planToEdit.locationName);
    setEditMeetupName(planToEdit.meetupName || '');
    setEditCallTime(planToEdit.call_time || '10:00');
    setEditCoords([planToEdit.lat, planToEdit.lng]);
    setEditOutfitType(planToEdit.dressCode);
    setMapCenterTarget([planToEdit.lat, planToEdit.lng]);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle || !editDate || !editCoords || !editPlanId) return;

    setPlans((prev) =>
      prev.map((p) =>
        p.id === editPlanId
          ? { ...p, title: editTitle, date: editDate, vibe: editVibe, locationName: editLocName || 'Pinned Destination', meetupName: editMeetupName, lat: editCoords[0], lng: editCoords[1], dressCode: editOutfitType, call_time: editCallTime }
          : p
      )
    );
    setIsEditModalOpen(false);

    supabase.from('date_plans').update({
      title: editTitle,
      date: editDate,
      vibe: editVibe,
      location_name: editLocName || 'Pinned Destination',
      meetup_name: editMeetupName,
      lat: editCoords[0],
      lng: editCoords[1],
      dress_code: editOutfitType,
      call_time: editCallTime,
    }).eq('id', editPlanId).then(({ error }) => {
      if (error) alert(`Error updating date: ${error.message}`);
    });
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this date?')) return;
    setPlans((prev) => prev.filter((p) => p.id !== id));
    setIsEditModalOpen(false);
    supabase.from('date_plans').delete().eq('id', id).then(({ error }) => {
      if (error) alert(`Error deleting date: ${error.message}`);
    });
  };

  const handleCompleteDate = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = finishingPlanTargetId || currentPlan?.id;
    if (!targetId) return;

    const planToFinish = plans.find((p) => p.id === targetId);
    const photoToSave = finishMemoryPhoto || planToFinish?.outfit_photos?.[planToFinish?.dressCode || ''] || null;

    setPlans((prev) =>
      prev.map((p) =>
        p.id === targetId
          ? { ...p, completed: true, rating: finishRating, bestMemory: finishMemory || 'Memorable hangout! ✨', memory_photo: photoToSave }
          : p
      )
    );

    setIsFinishModalOpen(false);
    setFinishMemory('');
    setFinishMemoryPhoto(null);
    setFinishingPlanTargetId(null);
    setActiveTab('history');

    supabase.from('date_plans').update({
      completed: true,
      rating: finishRating,
      best_memory: finishMemory || 'Memorable hangout! ✨',
      memory_photo: photoToSave,
    }).eq('id', targetId).then(({ error }) => {
      if (error) alert(`Error completing date: ${error.message}`);
    });
  };

  const toggleTask = async (taskId: number) => {
    if (!currentPlan) return;
    const updated = currentPlan.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));
    setPlans((prev) => prev.map((p) => (p.id === currentPlan.id ? { ...p, tasks: updated } : p)));
    supabase.from('date_plans').update({ tasks: updated }).eq('id', currentPlan.id).then(({ error }) => {
      if (error) alert(`Error updating task: ${error.message}`);
    });
  };

  const handleAddInlineTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTaskInput.trim() || !currentPlan) return;
    const updated = [...currentPlan.tasks, { id: Date.now(), text: inlineTaskInput.trim(), done: false }];
    setInlineTaskInput('');
    setPlans((prev) => prev.map((p) => (p.id === currentPlan.id ? { ...p, tasks: updated } : p)));
    supabase.from('date_plans').update({ tasks: updated }).eq('id', currentPlan.id).then(({ error }) => {
      if (error) alert(`Error adding task: ${error.message}`);
    });
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!currentPlan) return;
    const updated = currentPlan.tasks.filter((t) => t.id !== taskId);
    setPlans((prev) => prev.map((p) => (p.id === currentPlan.id ? { ...p, tasks: updated } : p)));
    supabase.from('date_plans').update({ tasks: updated }).eq('id', currentPlan.id).then(({ error }) => {
      if (error) alert(`Error deleting task: ${error.message}`);
    });
  };

  const handleAddBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetItem || !newBudgetCost || !currentPlan) return;
    const costNum = parseFloat(newBudgetCost);
    if (isNaN(costNum)) return;

    const updated = [...(currentPlan.budgetItems || []), { id: Date.now(), item: newBudgetItem, cost: costNum, paidBy: newBudgetPaidBy }];
    setNewBudgetItem('');
    setNewBudgetCost('');
    setPlans((prev) => prev.map((p) => (p.id === currentPlan.id ? { ...p, budgetItems: updated } : p)));
    supabase.from('date_plans').update({ budget_items: updated }).eq('id', currentPlan.id).then(({ error }) => {
      if (error) alert(`Error adding expense: ${error.message}`);
    });
  };

  const handleDeleteBudgetItem = async (itemId: number) => {
    if (!currentPlan) return;
    const updated = (currentPlan.budgetItems || []).filter((b) => b.id !== itemId);
    setPlans((prev) => prev.map((p) => (p.id === currentPlan.id ? { ...p, budgetItems: updated } : p)));
    supabase.from('date_plans').update({ budget_items: updated }).eq('id', currentPlan.id).then(({ error }) => {
      if (error) alert(`Error deleting expense: ${error.message}`);
    });
  };

  const handleSaveExpenseEdit = async (itemId: number) => {
    if (!currentPlan || !editItemName.trim() || !editItemCost) return;
    const costNum = parseFloat(editItemCost);
    if (isNaN(costNum)) return;

    const updated = (currentPlan.budgetItems || []).map((b) =>
      b.id === itemId ? { ...b, item: editItemName.trim(), cost: costNum, paidBy: editItemPaidBy } : b
    );
    setEditingBudgetItemId(null);
    setPlans((prev) => prev.map((p) => (p.id === currentPlan.id ? { ...p, budgetItems: updated } : p)));
    supabase.from('date_plans').update({ budget_items: updated }).eq('id', currentPlan.id).then(({ error }) => {
      if (error) alert(`Error updating expense: ${error.message}`);
    });
  };

  const handleAddBucketItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketTitle.trim() || !coupleId) return;
    const tempId = 'temp_b_' + Date.now();
    const newItem = { id: tempId, couple_id: coupleId, title: newBucketTitle.trim(), vibe: newBucketVibe, notes: newBucketNotes.trim() };

    setBucketList((prev) => [newItem, ...prev]);
    setNewBucketTitle('');
    setNewBucketNotes('');

    supabase.from('bucket_items').insert([{ couple_id: coupleId, title: newItem.title, vibe: newItem.vibe, notes: newItem.notes }]).select().single().then(({ data, error }) => {
      if (error) {
        alert(`Error adding wishlist item: ${error.message}`);
      } else if (data) {
        setBucketList((prev) => prev.map((b) => b.id === tempId ? data : b));
      }
    });
  };

  const handleUpdateBucketItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBucketItem) return;

    setBucketList((prev) => prev.map((item) => item.id === editingBucketItem.id ? editingBucketItem : item));
    const itemToUpdate = editingBucketItem;
    setEditingBucketItem(null);

    supabase.from('bucket_items').update({
      title: itemToUpdate.title,
      vibe: itemToUpdate.vibe,
      notes: itemToUpdate.notes
    }).eq('id', itemToUpdate.id).then(({ error }) => {
      if (error) alert(`Error updating wishlist: ${error.message}`);
    });
  };

  const handleDeleteBucketItem = async (id: string) => {
    setBucketList((prev) => prev.filter((b) => b.id !== id));
    supabase.from('bucket_items').delete().eq('id', id).then(({ error }) => {
      if (error) alert(`Error deleting wishlist item: ${error.message}`);
    });
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

  // LOGIN SCREEN
  if (!coupleId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500" style={{ background: activeThemeObj.bg, color: activeThemeObj.text }}>
        <div className="w-full max-w-md backdrop-blur-md p-6 sm:p-8 border shadow-2xl transition-all duration-300 hover:scale-[1.01]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
          <div className="text-center mb-6">
            <div className="inline-flex p-3.5 rounded-full text-white mb-3 shadow-md animate-pulse" style={{ backgroundColor: activeThemeObj.accent }}>
              <Heart size={28} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">DateCraft</h1>
            <p className="text-xs mt-1 opacity-80" style={{ color: activeThemeObj.subText }}>Real-time couple & group date planner</p>
          </div>

          <div className="flex p-1 rounded-2xl mb-6 border shadow-inner" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border }}>
            <button
              type="button"
              onClick={() => setAuthMode('create')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${authMode === 'create' ? 'shadow-xs' : 'opacity-65'}`}
              style={authMode === 'create' ? { backgroundColor: activeThemeObj.id === 'sakura' ? '#FFFFFF' : '#334155', color: activeThemeObj.text } : { color: activeThemeObj.subText }}
            >
              Create Room
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('join')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${authMode === 'join' ? 'shadow-xs' : 'opacity-65'}`}
              style={authMode === 'join' ? { backgroundColor: activeThemeObj.id === 'sakura' ? '#FFFFFF' : '#334155', color: activeThemeObj.text } : { color: activeThemeObj.subText }}
            >
              Join Room
            </button>
          </div>

          {authMode === 'create' ? (
            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: activeThemeObj.text }}>Your Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3" style={{ color: activeThemeObj.subText }} />
                  <input
                    type="text"
                    placeholder="e.g. Benidick"
                    value={createNameInput}
                    onChange={(e) => setCreateNameInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border text-sm focus:outline-hidden focus:ring-2 shadow-2xs transition-all"
                    style={{ backgroundColor: activeThemeObj.id === 'sakura' ? 'rgba(255,255,255,0.9)' : activeThemeObj.bg, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold" style={{ color: activeThemeObj.text }}>Custom Space Code</label>
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="text-[11px] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    style={{ color: activeThemeObj.accent }}
                  >
                    <Wand2 size={11} /> Auto-generate
                  </button>
                </div>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-3" style={{ color: activeThemeObj.subText }} />
                  <input
                    type="text"
                    placeholder="e.g. KEN or KEN-2020"
                    value={customCodeInput}
                    onChange={(e) => setCustomCodeInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border text-sm font-mono uppercase tracking-wider focus:outline-hidden focus:ring-2 shadow-2xs transition-all"
                    style={{ backgroundColor: activeThemeObj.id === 'sakura' ? 'rgba(255,255,255,0.9)' : activeThemeObj.bg, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: activeThemeObj.text }}>Max Room Capacity</label>
                <select
                  value={maxMembersInput}
                  onChange={(e) => setMaxMembersInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-2xl border text-sm font-semibold cursor-pointer focus:outline-hidden focus:ring-2 shadow-2xs"
                  style={{ backgroundColor: activeThemeObj.id === 'sakura' ? 'rgba(255,255,255,0.9)' : activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num} style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>
                      {num} People {num === 2 ? '' : num === 4 ? '' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full mt-2 py-3 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: activeThemeObj.accent }}
              >
                {isAuthLoading ? 'Creating Room...' : 'Create Space with Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinSpace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: activeThemeObj.text }}>Space Code</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-3" style={{ color: activeThemeObj.subText }} />
                  <input
                    type="text"
                    placeholder="e.g. BEN-LOR-2026"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border text-sm font-mono uppercase tracking-wider focus:outline-hidden focus:ring-2 shadow-2xs transition-all"
                    style={{ backgroundColor: activeThemeObj.id === 'sakura' ? 'rgba(255,255,255,0.9)' : activeThemeObj.bg, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {rememberedName ? (
                <div className="p-3.5 border rounded-2xl flex items-center justify-between shadow-xs transition-all" style={{ backgroundColor: activeThemeObj.id === 'sakura' ? '#FFFFFF' : activeThemeObj.card, borderColor: activeThemeObj.border, color: activeThemeObj.text }}>
                  <div className="flex items-center gap-2.5">
                    <User size={16} style={{ color: activeThemeObj.accent }} />
                    <span className="text-xs font-medium" style={{ color: activeThemeObj.subText }}>
                      Joining as <strong style={{ color: activeThemeObj.text, fontWeight: '700', fontSize: '13px' }}>{rememberedName}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('dc_remembered_name');
                      setJoinNameInput('');
                    }}
                    className="text-xs hover:underline font-bold cursor-pointer px-2 py-1 rounded-lg"
                    style={{ color: activeThemeObj.accent }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: activeThemeObj.text }}>Your Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3" style={{ color: activeThemeObj.subText }} />
                    <input
                      type="text"
                      placeholder="e.g. Loraine"
                      value={joinNameInput}
                      onChange={(e) => setJoinNameInput(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border text-sm focus:outline-hidden focus:ring-2 shadow-2xs transition-all"
                      style={{ backgroundColor: activeThemeObj.id === 'sakura' ? 'rgba(255,255,255,0.9)' : activeThemeObj.bg, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full mt-2 py-3 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: activeThemeObj.accent }}
              >
                {isAuthLoading ? 'Connecting...' : 'Connect to Space'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3.5 sm:p-6 md:p-8 transition-colors duration-500" style={{ background: activeThemeObj.bg, color: activeThemeObj.text }}>
      {/* FLOATING NOTIFICATION BANNER */}
      {notificationBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl z-[999999] flex items-center gap-3 border border-stone-700 animate-bounce">
          <Bell size={18} className="text-amber-400 animate-pulse" />
          <span className="text-xs font-bold">{notificationBanner}</span>
          <button onClick={() => setNotificationBanner(null)} className="text-stone-400 hover:text-white cursor-pointer ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Navbar */}
      <header className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between pb-4 sm:pb-6 border-b gap-3 backdrop-blur-md" style={{ borderColor: activeThemeObj.border }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl text-white flex-shrink-0 shadow-md transition-transform duration-300 hover:scale-105" style={{ backgroundColor: activeThemeObj.accent }}>
              <Heart size={18} fill="currentColor" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">DateCraft</h1>
                <span className="text-[11px] font-semibold px-3 py-1 rounded-full border flex items-center gap-1 shadow-2xs" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.accent, borderColor: activeThemeObj.border }}>
                  <Users size={11} /> {members.length}/{maxCapacity} Members
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] mt-0.5 flex-wrap" style={{ color: activeThemeObj.subText }}>
                <span>Code: <strong style={{ color: activeThemeObj.text }} className="font-mono">{spaceCode}</strong></span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(spaceCode || '');
                    alert(`Copied Space Code: ${spaceCode}`);
                  }}
                  className="p-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ color: activeThemeObj.accent }}
                  title="Copy code"
                >
                  <Copy size={11} />
                </button>
                <span>•</span>
                <span className="font-medium px-2.5 py-0.5 rounded-xl inline-flex items-center gap-1 border shadow-2xs" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, color: activeThemeObj.text }}>
                  <Crown size={11} className="text-amber-500" /> Creator: <strong>{creatorName || 'Admin'}</strong>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="sm:hidden p-2.5 rounded-2xl transition-all duration-200 hover:scale-105 cursor-pointer border shadow-2xs"
            style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, color: activeThemeObj.text }}
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-medium text-xs shadow-sm cursor-pointer border transition-all duration-300 hover:scale-105 backdrop-blur-sm"
            style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
          >
            <Palette size={13} style={{ color: activeThemeObj.accent }} />
            <span>Theme</span>
          </button>

          <button
            onClick={startLiveTracking}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-medium text-xs shadow-sm cursor-pointer border transition-all duration-300 hover:scale-105 backdrop-blur-sm"
            style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
          >
            <Navigation size={13} className={isLocating ? 'animate-spin text-blue-500' : 'text-blue-600'} />
            {isLocating ? 'Locating...' : 'My GPS'}
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-1.5 text-white px-4.5 py-2 rounded-2xl font-semibold text-xs shadow-md cursor-pointer whitespace-nowrap transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ backgroundColor: activeThemeObj.accent }}
          >
            <Plus size={15} /> Plan date
          </button>

          <button
            onClick={handleLogout}
            className="hidden sm:block p-2.5 rounded-2xl transition-all duration-200 hover:scale-105 cursor-pointer border shadow-2xs"
            style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, color: activeThemeObj.text }}
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Connected Members Badges */}
      <div className="max-w-5xl mx-auto mt-3 flex items-center gap-2 overflow-x-auto py-1">
        <span className="text-[11px] font-semibold mr-0.5" style={{ color: activeThemeObj.subText }}>In this space:</span>
        {members.map((m, idx) => {
          const isTargetCreator = m.name.trim().toLowerCase() === creatorName.trim().toLowerCase();
          const isSelf = m.id === currentUserId || m.name.toLowerCase() === currentUserName.toLowerCase();

          return (
            <span
              key={m.id}
              className="px-3.5 py-1.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 shadow-2xs backdrop-blur-sm transition-transform duration-200 hover:scale-105"
              style={{ borderColor: activeThemeObj.border, color: activeThemeObj.text, backgroundColor: activeThemeObj.card }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: memberColors[idx % memberColors.length] }}></span>
              <span>
                {m.name} {isSelf ? '(You)' : ''} {isTargetCreator ? '👑' : ''}
              </span>

              {isCreator && !isTargetCreator && (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(m)}
                  className="p-0.5 hover:bg-rose-100 text-rose-500 rounded-full transition-colors cursor-pointer ml-1"
                  title={`Kick ${m.name}`}
                >
                  <X size={12} />
                </button>
              )}
            </span>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-5xl mx-auto mt-3 flex items-center gap-2.5 border-b pb-3 overflow-x-auto no-scrollbar" style={{ borderColor: activeThemeObj.border }}>
        <button
          onClick={() => setActiveTab('planner')}
          className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-300 hover:scale-105 cursor-pointer shadow-sm backdrop-blur-sm ${activeTab === 'planner'
            ? 'text-white shadow-md'
            : 'border hover:opacity-80'
            }`}
          style={activeTab === 'planner' ? { backgroundColor: activeThemeObj.accent } : { backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
        >
          <Calendar size={13} /> Active ({upcomingPlans.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-300 hover:scale-105 cursor-pointer shadow-sm backdrop-blur-sm ${activeTab === 'history'
            ? 'text-white shadow-md'
            : 'border hover:opacity-80'
            }`}
          style={activeTab === 'history' ? { backgroundColor: activeThemeObj.accent } : { backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
        >
          <History size={13} /> Scrapbook & Album ({historyPlans.length})
        </button>

        <button
          onClick={() => setActiveTab('bucket')}
          className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-300 hover:scale-105 cursor-pointer shadow-sm backdrop-blur-sm ${activeTab === 'bucket'
            ? 'text-white shadow-md'
            : 'border hover:opacity-80'
            }`}
          style={activeTab === 'bucket' ? { backgroundColor: activeThemeObj.accent } : { backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
        >
          <BookmarkPlus size={13} /> Bucketlist ({bucketList.length})
        </button>

        <button
          onClick={() => setActiveTab('budget')}
          className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-300 hover:scale-105 cursor-pointer shadow-sm backdrop-blur-sm ${activeTab === 'budget'
            ? 'text-white shadow-md'
            : 'border hover:opacity-80'
            }`}
          style={activeTab === 'budget' ? { backgroundColor: activeThemeObj.accent } : { backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
        >
          <DollarSign size={13} /> Bill Splitter
        </button>
      </div>

      {/* PLANNER TAB */}
      {activeTab === 'planner' && (
        <div className="max-w-5xl mx-auto mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {upcomingPlans.length === 0 ? (
            <div className="max-w-xl mx-auto my-12 backdrop-blur-md p-8 sm:p-10 text-center border shadow-xl transition-all duration-300 hover:scale-[1.01]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
              <div className="inline-flex p-4 rounded-full mb-4 shadow-sm animate-bounce" style={{ backgroundColor: `${activeThemeObj.accent}20`, color: activeThemeObj.accent }}>
                <Calendar size={32} />
              </div>
              <h2 className="text-base sm:text-lg font-bold" style={{ color: activeThemeObj.text }}>No active date planned right now!</h2>
              <p className="text-xs mt-1 mb-5" style={{ color: activeThemeObj.subText }}>
                Plan a new date to unlock memories and photo albums together!
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2.5 text-white rounded-2xl text-xs font-bold shadow-md inline-flex items-center gap-2 cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95"
                style={{ backgroundColor: activeThemeObj.accent }}
              >
                <Plus size={15} /> Plan a New Date
              </button>
            </div>
          ) : (
            <>
              {upcomingPlans.length > 1 && (
                <div className="p-4 rounded-3xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md transition-all duration-300 hover:scale-[1.01]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
                  <div className="flex items-center gap-2">
                    <Calendar size={15} style={{ color: activeThemeObj.accent }} />
                    <span className="text-xs font-bold">Select Planned Date:</span>
                  </div>

                  <div className="relative w-full sm:w-auto">
                    <select
                      value={currentPlan?.id || ''}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full sm:w-80 appearance-none font-bold text-xs py-2.5 pl-4 pr-10 rounded-2xl border cursor-pointer focus:outline-hidden focus:ring-2 transition-colors shadow-2xs"
                      style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                    >
                      {upcomingPlans.map((plan, i) => (
                        <option key={plan.id} value={plan.id} style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>
                          Date #{i + 1}: {plan.title} ({plan.date})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3.5 top-3 pointer-events-none" style={{ color: activeThemeObj.accent }} />
                  </div>
                </div>
              )}

              <main className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-4 sm:space-y-6">
                  {currentPlan && (
                    <>
                      <div
                        onClick={() => handleOpenEditModal(currentPlan)}
                        className="p-5 sm:p-6 border shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group relative backdrop-blur-md"
                        style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] px-3.5 py-1 rounded-full font-semibold shadow-2xs" style={{ backgroundColor: `${activeThemeObj.accent}20`, color: activeThemeObj.accent }}>
                            {currentPlan.vibe}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePlan(currentPlan.id);
                              }}
                              className="p-1.5 rounded-xl transition-colors cursor-pointer hover:opacity-80"
                              style={{ color: activeThemeObj.subText }}
                              title="Delete this date"
                            >
                              <Trash2 size={14} />
                            </button>
                            <span className="flex items-center gap-1 text-xs font-semibold transition-colors" style={{ color: activeThemeObj.subText }}>
                              <Pencil size={12} />
                              <span>Edit</span>
                            </span>
                          </div>
                        </div>

                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: activeThemeObj.text }}>
                          {currentPlan.title}
                        </h2>

                        <div className="flex items-center justify-between text-xs mt-3" style={{ color: activeThemeObj.subText }}>
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar size={14} style={{ color: activeThemeObj.accent }} />
                            <span>{currentPlan.date}</span>
                          </div>
                          <span className="text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs" style={{ backgroundColor: `${activeThemeObj.accent}20`, color: activeThemeObj.accent }}>
                            <Clock size={11} />
                            {calculateDaysUntil(currentPlan.date)}
                          </span>
                        </div>

                        {/* Call Time Display Added Here */}
                        {currentPlan.call_time && (
                          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold" style={{ color: activeThemeObj.text }}>
                            <Clock size={14} style={{ color: activeThemeObj.accent }} />
                            <span>Call Time: <span style={{ color: activeThemeObj.accent }}>{currentPlan.call_time}</span></span>
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t space-y-2 text-xs" style={{ borderColor: activeThemeObj.border, color: activeThemeObj.subText }}>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="flex-shrink-0" style={{ color: activeThemeObj.accent }} />
                            <span className="truncate">Destination: <strong style={{ color: activeThemeObj.text }}>{currentPlan.locationName}</strong></span>
                          </div>
                          {currentPlan.meetupName && (
                            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-semibold border shadow-2xs mt-1.5" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.accent, borderColor: activeThemeObj.border }}>
                              <MapPin size={13} className="flex-shrink-0" />
                              <span className="truncate">Meet-up Spot: {currentPlan.meetupName}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t flex items-center justify-between gap-2 flex-wrap" style={{ borderColor: activeThemeObj.border }}>
                          <div className="flex items-center gap-3 text-xs font-semibold">
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${currentPlan.lat},${currentPlan.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline"
                              style={{ color: activeThemeObj.accent }}
                            >
                              Dest Map <ExternalLink size={11} className="inline" />
                            </a>
                            {currentPlan.meetupName && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentPlan.meetupName)}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-400 hover:underline"
                              >
                                Meetup Map <ExternalLink size={11} className="inline" />
                              </a>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFinishingPlanTargetId(currentPlan.id);
                              setIsFinishModalOpen(true);
                            }}
                            className="px-4.5 py-2 text-white rounded-2xl text-xs font-semibold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1 shadow-md cursor-pointer"
                            style={{ backgroundColor: activeThemeObj.accent }}
                          >
                            <CheckCircle2 size={13} /> Mark Done
                          </button>
                        </div>
                      </div>

                      {/* Multi-Photos Upload Section */}
                      <div className="p-5 border shadow-xl space-y-3.5 backdrop-blur-md transition-all duration-300 hover:scale-[1.01]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-xs sm:text-sm" style={{ color: activeThemeObj.text }}>Date Pictures</h3>
                            <p className="text-[10px]" style={{ color: activeThemeObj.subText }}>Upload up to 15 pictures</p>
                          </div>
                          <span className="text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs" style={{ backgroundColor: `${activeThemeObj.accent}20`, color: activeThemeObj.accent }}>
                            {(currentPlan.gallery_photos || []).length}/15
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          {(currentPlan.gallery_photos || []).map((imgUrl, i) => (
                            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border group shadow-sm transition-transform duration-200 hover:scale-105" style={{ borderColor: activeThemeObj.border }}>
                              <img src={imgUrl} alt="Date memory" className="w-full h-full object-cover" />
                              <button
                                onClick={() => handleDeleteGalleryPhoto(currentPlan.id, imgUrl)}
                                className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          ))}

                          {(currentPlan.gallery_photos || []).length < 15 && (
                            <label className="aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-2xs" style={{ borderColor: activeThemeObj.border, backgroundColor: activeThemeObj.card }}>
                              <ImagePlus size={18} className="mb-1" style={{ color: activeThemeObj.accent }} />
                              <span className="text-[10px] font-bold" style={{ color: activeThemeObj.subText }}>+ Add Pic</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleMultipleGalleryUpload(e, currentPlan.id)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Checklist */}
                      <div className="p-5 border shadow-xl space-y-3 backdrop-blur-md transition-all duration-300 hover:scale-[1.01]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckSquare size={16} style={{ color: activeThemeObj.accent }} />
                            <h3 className="font-bold text-xs sm:text-sm" style={{ color: activeThemeObj.text }}>Where To Go & Checklist</h3>
                          </div>
                          <span className="text-[11px] font-semibold" style={{ color: activeThemeObj.subText }}>
                            {currentPlan.tasks.filter((t) => t.done).length}/{currentPlan.tasks.length} Done
                          </span>
                        </div>

                        <div className="space-y-2">
                          {currentPlan.tasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-2.5 rounded-2xl transition-all duration-200 hover:translate-x-1 group shadow-2xs border" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border }}>
                              <label className="flex items-center gap-2.5 text-xs cursor-pointer flex-1 min-w-0" style={{ color: activeThemeObj.text }}>
                                <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} className="rounded-lg w-4 h-4 cursor-pointer" style={{ accentColor: activeThemeObj.accent }} />
                                <span className={`truncate text-xs ${task.done ? 'line-through opacity-50' : 'font-medium'}`}>{task.text}</span>
                              </label>
                              <button onClick={() => handleDeleteTask(task.id)} className="p-1 cursor-pointer hover:opacity-80" style={{ color: activeThemeObj.subText }}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <form onSubmit={handleAddInlineTask} className="flex gap-2 pt-2 border-t" style={{ borderColor: activeThemeObj.border }}>
                          <input
                            type="text"
                            placeholder="Add stop or task..."
                            value={inlineTaskInput}
                            onChange={(e) => setInlineTaskInput(e.target.value)}
                            className="flex-1 px-4 py-2.5 rounded-2xl border text-xs focus:ring-2 shadow-2xs transition-all"
                            style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                          />
                          <button type="submit" className="px-4.5 py-2.5 text-white rounded-2xl text-xs font-semibold cursor-pointer shadow-md transition-all hover:scale-105 active:scale-95" style={{ backgroundColor: activeThemeObj.accent }}>Add</button>
                        </form>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Column: Weather, Roulette, Multi-User GPS Map */}
                {currentPlan && (
                  <div className="md:col-span-2 space-y-4 sm:space-y-5">
                    <div className="grid grid-cols-2 gap-3.5 sm:gap-5">
                      <div className="p-4 sm:p-5 border shadow-xl flex items-center gap-3 backdrop-blur-md transition-all duration-300 hover:scale-[1.02]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
                        <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl flex-shrink-0 shadow-sm transition-transform duration-300 hover:rotate-12">
                          <CloudSun size={22} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-wider font-semibold truncate" style={{ color: activeThemeObj.subText }}>Destination Forecast</p>
                          <p className="text-xs sm:text-sm font-bold truncate mt-0.5" style={{ color: activeThemeObj.text }}>
                            {isWeatherLoading ? 'Checking...' : weatherInfo ? `${weatherInfo.temp}°C • ${weatherInfo.description}` : '28°C • Clear Sky'}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 border shadow-xl flex items-center justify-between gap-2 backdrop-blur-md transition-all duration-300 hover:scale-[1.02]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-wider font-semibold truncate" style={{ color: activeThemeObj.subText }}>Date Roulette</p>
                          <p className="text-xs sm:text-sm font-bold truncate mt-0.5" style={{ color: activeThemeObj.text }}>{pickedIdea || 'Spin for idea!'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={spinRoulette}
                          disabled={isSpinning}
                          className="px-3.5 py-2.5 disabled:opacity-50 text-white rounded-2xl text-xs font-semibold flex items-center gap-1 shadow-md cursor-pointer flex-shrink-0 transition-all duration-300 hover:scale-105 active:scale-95"
                          style={{ backgroundColor: activeThemeObj.accent }}
                        >
                          <Dices size={15} className={isSpinning ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </div>

                    {/* LIVE GROUP MAP */}
                    <div className="p-4 sm:p-6 border shadow-xl flex flex-col h-[420px] sm:h-[510px] backdrop-blur-md transition-all duration-300 hover:scale-[1.01]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 px-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-xs sm:text-sm" style={{ color: activeThemeObj.text }}>Live GPS & Date Spot</h3>
                          {members.map((m, idx) => (
                            m.lat && m.lng ? (
                              <span key={m.id} className="flex items-center gap-1 text-[10px] px-3 py-1 rounded-full font-semibold border shadow-2xs" style={{ color: memberColors[idx % memberColors.length], borderColor: memberColors[idx % memberColors.length], backgroundColor: activeThemeObj.card }}>
                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: memberColors[idx % memberColors.length] }}></span>
                                {m.name}
                              </span>
                            ) : null
                          ))}
                        </div>

                        {coupleDistanceKm !== null && (
                          <div className="text-white px-3.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md" style={{ backgroundColor: activeThemeObj.accent }}>
                            <Radio size={10} className="animate-pulse" />
                            <span>{coupleDistanceKm < 1 ? `${Math.round(coupleDistanceKm * 1000)}m apart` : `${coupleDistanceKm.toFixed(1)} km apart`}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 w-full rounded-2xl overflow-hidden border relative z-0 shadow-inner" style={{ borderColor: activeThemeObj.border }}>
                        <MapContainer
                          center={userCoords || [currentPlan.lat, currentPlan.lng]}
                          zoom={13}
                          scrollWheelZoom={true}
                          style={{ height: '100%', width: '100%' }}
                          key={`main-map-${currentPlan.id}`}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <MapFlyToController centerCoords={userCoords} />

                          {members.map((m, idx) => {
                            if (!m.lat || !m.lng) return null;
                            return (
                              <Marker key={m.id} position={[m.lat, m.lng]} icon={createUserIcon(m.name, memberColors[idx % memberColors.length])}>
                                <Popup>
                                  <strong>{m.name}</strong><br />
                                  {m.updated_at ? `Active: ${new Date(m.updated_at).toLocaleTimeString()}` : 'Live now'}
                                </Popup>
                              </Marker>
                            );
                          })}

                          <Marker position={[currentPlan.lat, currentPlan.lng]}>
                            <Popup><strong>{currentPlan.title}</strong><br />{currentPlan.locationName}</Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    </div>
                  </div>
                )}
              </main>
            </>
          )}
        </div>
      )}

      {/* SCRAPBOOK & PHOTO ALBUMS */}
      {activeTab === 'history' && (
        <section className="max-w-5xl mx-auto mt-4 sm:mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-1.5" style={{ color: activeThemeObj.text }}>Our Date Scrapbook 💕</h2>
              <p className="text-[11px] sm:text-xs" style={{ color: activeThemeObj.subText }}>Every single date, preserved like polaroids of our story</p>
            </div>

            {isScrapbookReady && (
              <button
                onClick={() => {
                  setActiveStoryPage(0);
                  setIsStorybookModalOpen(true);
                }}
                className="text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md flex items-center gap-2 transition-transform duration-300 hover:scale-105 active:scale-95 cursor-pointer self-start sm:self-auto"
                style={{ backgroundColor: activeThemeObj.accent }}
              >
                <BookOpen size={16} />
                <span>Open Interactive Flip-Book Album ✨</span>
              </button>
            )}
          </div>

          {historyPlans.length === 1 && (
            <div className="p-4 rounded-3xl text-xs flex items-center justify-between border shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-[1.01]" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
              <span className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: activeThemeObj.accent }} />
                1 date completed! Complete 1 more date to automatically unlock your **Interactive Flip-Book Scrapbook Album**!
              </span>
              <span className="font-bold px-3.5 py-1 rounded-full shadow-2xs" style={{ backgroundColor: `${activeThemeObj.accent}20`, color: activeThemeObj.accent }}>1/2 Dates</span>
            </div>
          )}

          {historyPlans.length === 0 ? (
            <div className="rounded-3xl p-8 sm:p-12 text-center border shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-[1.01]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
              <History size={32} className="mx-auto text-stone-300 mb-2" />
              <h3 className="font-bold text-xs sm:text-sm" style={{ color: activeThemeObj.text }}>No date memories archived yet</h3>
              <p className="text-xs mt-1" style={{ color: activeThemeObj.subText }}>Complete dates to automatically assemble your interactive polaroid photo book!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {historyPlans.map((plan) => {
                const memoryDisplayPhoto = plan.memory_photo || (plan.gallery_photos && plan.gallery_photos[0]) || plan.outfit_photos?.[plan.dressCode] || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80';
                return (
                  <div key={plan.id} className="p-5 sm:p-6 border shadow-xl transition-all duration-300 hover:scale-[1.02] relative group flex flex-col justify-between backdrop-blur-md" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-amber-100/90 border border-amber-200/70 rounded-xs -rotate-2 shadow-sm pointer-events-none" />
                    <button onClick={() => handleDeletePlan(plan.id)} className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded-full transition-colors shadow-sm z-10 cursor-pointer">
                      <Trash2 size={13} />
                    </button>

                    <div>
                      <div className="p-4 pb-5 rounded-2xl border shadow-inner relative group/photo" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border }}>
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-200 shadow-sm">
                          <img src={memoryDisplayPhoto} alt={plan.title} className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-500" />
                          <label className="absolute bottom-2 right-2 p-2 bg-black/60 hover:bg-stone-900 text-white rounded-full transition-colors shadow backdrop-blur-xs cursor-pointer flex items-center justify-center">
                            {isUploadingMemoryPhoto ? <Loader2 size={13} className="animate-spin text-rose-400" /> : <Camera size={13} />}
                            <input type="file" accept="image/*" disabled={isUploadingMemoryPhoto} onChange={(e) => handleMemoryPhotoUpload(e, plan.id)} className="hidden" />
                          </label>
                        </div>

                        <div className="mt-3.5 text-center flex items-center justify-center gap-1.5 font-mono text-[11px]" style={{ color: activeThemeObj.subText }}>
                          <span>🗓️ {plan.date}</span>
                          <span>•</span>
                          <span className="font-semibold truncate" style={{ color: activeThemeObj.accent }}>{plan.locationName}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <h3 className="font-bold text-base sm:text-lg tracking-tight" style={{ color: activeThemeObj.text }}>{plan.title}</h3>
                        <div className="flex items-center text-amber-400">
                          {[...Array(plan.rating || 5)].map((_, i) => (
                            <Star key={i} size={14} fill="currentColor" />
                          ))}
                        </div>
                      </div>

                      <div className="mt-3.5 p-4 rounded-2xl border text-xs italic relative shadow-2xs" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, color: activeThemeObj.text }}>
                        <span className="font-serif text-base leading-none select-none mr-1" style={{ color: activeThemeObj.accent }}>“</span>
                        {plan.bestMemory || 'Loved every second together!'}
                        <span className="font-serif text-base leading-none select-none ml-1" style={{ color: activeThemeObj.accent }}>”</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3.5 border-t flex items-center justify-between text-[11px]" style={{ borderColor: activeThemeObj.border, color: activeThemeObj.subText }}>
                      <span className="inline-flex items-center gap-1.5 font-medium px-3.5 py-1.5 rounded-full border shadow-2xs" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, color: activeThemeObj.text }}>
                        <Shirt size={12} style={{ color: activeThemeObj.accent }} /> Outfit: <strong>{plan.dressCode}</strong>
                      </span>
                      <span className="font-semibold" style={{ color: activeThemeObj.accent }}>Special Memory ✨</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* WISHLIST TAB */}
      {activeTab === 'bucket' && (
        <section className="max-w-5xl mx-auto mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl border shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-[1.01]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
            <h3 className="text-sm sm:text-base font-bold mb-0.5" style={{ color: activeThemeObj.text }}>ADD NEW BUCKETLIST</h3>
            <p className="text-xs mb-4" style={{ color: activeThemeObj.subText }}>Places or activities to try together</p>

            <form onSubmit={handleAddBucketItem} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="e.g. Pottery Class, Stargazing"
                value={newBucketTitle}
                onChange={(e) => setNewBucketTitle(e.target.value)}
                className="px-4 py-2.5 rounded-2xl border text-xs focus:ring-2 sm:col-span-2 shadow-2xs transition-all"
                style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                required
              />
              <select
                value={newBucketVibe}
                onChange={(e) => setNewBucketVibe(e.target.value)}
                className="px-3.5 py-2.5 rounded-2xl border text-xs font-medium cursor-pointer shadow-2xs transition-all"
                style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
              >
                <option value="Cozy & Romantic" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Cozy & Romantic</option>
                <option value="Chill & Outdoor" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Chill & Outdoor</option>
                <option value="Fancy Dinner" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Fancy Dinner</option>
                <option value="Fun & Adventurous" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Fun & Adventurous</option>
              </select>
              <button type="submit" className="px-4.5 py-2.5 text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95" style={{ backgroundColor: activeThemeObj.accent }}>
                <Plus size={14} /> Add Idea
              </button>
              <input
                type="text"
                placeholder="Optional notes or must-try food..."
                value={newBucketNotes}
                onChange={(e) => setNewBucketNotes(e.target.value)}
                className="px-4 py-2.5 rounded-2xl border text-xs sm:col-span-4 shadow-2xs transition-all"
                style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
              />
            </form>
          </div>

          {bucketList.length === 0 ? (
            <div className="rounded-3xl p-8 sm:p-12 text-center border shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-[1.01]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
              <BookmarkPlus size={32} className="mx-auto text-stone-300 mb-2" />
              <h3 className="font-bold text-xs sm:text-sm" style={{ color: activeThemeObj.text }}>Your Bucket List is empty</h3>
              <p className="text-xs mt-1" style={{ color: activeThemeObj.subText }}>Add places or dream date ideas above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {bucketList.map((item) => (
                <div key={item.id} className="p-5 rounded-3xl border shadow-xl flex flex-col justify-between backdrop-blur-md transition-all duration-300 hover:scale-[1.02]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full shadow-2xs" style={{ backgroundColor: `${activeThemeObj.accent}20`, color: activeThemeObj.accent }}>{item.vibe}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingBucketItem(item)}
                          className="p-1.5 rounded-xl transition-colors cursor-pointer hover:opacity-80"
                          style={{ color: activeThemeObj.subText }}
                          title="Edit wishlist idea"
                        >
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => handleDeleteBucketItem(item.id)} className="text-stone-300 hover:text-rose-500 p-1.5 cursor-pointer" title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold text-sm tracking-tight" style={{ color: activeThemeObj.text }}>{item.title}</h4>
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: activeThemeObj.subText }}>{item.notes}</p>
                  </div>

                  <button
                    onClick={() => {
                      setNewTitle(item.title);
                      setNewVibe(item.vibe);
                      setNewLocName(item.title);
                      handleDeleteBucketItem(item.id);
                      setIsModalOpen(true);
                    }}
                    className="mt-4 w-full py-2.5 bg-stone-900 hover:bg-rose-500 text-white text-xs font-medium rounded-2xl flex items-center justify-center gap-1.5 transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-md"
                  >
                    Convert to Planned Date <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* BUDGET TAB */}
      {activeTab === 'budget' && (
        <section className="max-w-5xl mx-auto mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          <div className="p-4 sm:p-5 rounded-3xl border shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md transition-all duration-300 hover:scale-[1.01]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl shadow-sm" style={{ backgroundColor: `${activeThemeObj.accent}20`, color: activeThemeObj.accent }}>
                <DollarSign size={18} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold" style={{ color: activeThemeObj.text }}>Budget Splitter & Wallet</h3>
                <p className="text-[11px]" style={{ color: activeThemeObj.subText }}>Add cash in your wallet and watch it automatically decrease as you spend!</p>
              </div>
            </div>

            {upcomingPlans.length > 0 ? (
              <select
                value={currentPlan?.id || ''}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl border text-xs font-semibold cursor-pointer shadow-2xs"
                style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
              >
                {upcomingPlans.map((p) => (
                  <option key={p.id} value={p.id} style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>{p.title} ({p.date})</option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-stone-400 font-semibold">No active dates</span>
            )}
          </div>

          {!currentPlan ? (
            <div className="rounded-3xl p-8 sm:p-12 text-center border shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-[1.01]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
              <DollarSign size={32} className="mx-auto text-stone-300 mb-2" />
              <h3 className="font-bold text-xs sm:text-sm" style={{ color: activeThemeObj.text }}>No active date to calculate budget for</h3>
              <p className="text-xs mt-1" style={{ color: activeThemeObj.subText }}>Plan a date first in the Active tab!</p>
            </div>
          ) : (
            <>
              {/* WALLET / CASH BROUGHT INPUT & REMAINING CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Boy Wallet Card */}
                {(() => {
                  const boyTotalWallet = memberWallets[boyName] ?? 5000;
                  const boyRemaining = boyTotalWallet - boyShare;
                  const boyOverspent = boyRemaining < 0 ? Math.abs(boyRemaining) : 0;
                  return (
                    <div className="p-5 rounded-3xl border shadow-xl backdrop-blur-md space-y-3" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet size={16} className="text-blue-500" />
                          <h4 className="font-bold text-xs sm:text-sm text-blue-500">{boyName}'s Wallet</h4>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500">Cash Tracker</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs items-end">
                        <div>
                          <label className="block text-[10px] font-semibold mb-1 opacity-80" style={{ color: activeThemeObj.subText }}>Add Cash </label>
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              placeholder="+ Add cash"
                              value={topUpInputs[boyName] ?? ''}
                              onChange={(e) => setTopUpInputs({ ...topUpInputs, [boyName]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const addVal = parseFloat(topUpInputs[boyName]) || 0;
                                  if (addVal > 0) {
                                    setMemberWallets({ ...memberWallets, [boyName]: boyTotalWallet + addVal });
                                    setTopUpInputs({ ...topUpInputs, [boyName]: '' });
                                  }
                                }
                              }}
                              className="w-full px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs"
                              style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const addVal = parseFloat(topUpInputs[boyName]) || 0;
                                if (addVal > 0) {
                                  setMemberWallets({ ...memberWallets, [boyName]: boyTotalWallet + addVal });
                                  setTopUpInputs({ ...topUpInputs, [boyName]: '' });
                                }
                              }}
                              className="px-3 py-1.5 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm flex items-center justify-center"
                              style={{ backgroundColor: activeThemeObj.accent }}
                              title="Add cash"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold opacity-80" style={{ color: activeThemeObj.subText }}>Remaining Cash</span>
                            {remainingEditMode[boyName] ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const correctedRemaining = parseFloat(tempRemainingInputs[boyName]) || 0;
                                  setMemberWallets({ ...memberWallets, [boyName]: correctedRemaining + boyShare });
                                  setRemainingEditMode({ ...remainingEditMode, [boyName]: false });
                                }}
                                className="text-[10px] font-bold text-emerald-500 hover:underline cursor-pointer"
                              >
                                Save
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setTempRemainingInputs({ ...tempRemainingInputs, [boyName]: String(Math.max(0, boyRemaining)) });
                                  setRemainingEditMode({ ...remainingEditMode, [boyName]: true });
                                }}
                                className="text-[10px] font-bold hover:underline cursor-pointer"
                                style={{ color: activeThemeObj.accent }}
                              >
                                Edit
                              </button>
                            )}
                          </div>

                          {remainingEditMode[boyName] ? (
                            <input
                              type="number"
                              value={tempRemainingInputs[boyName] ?? ''}
                              onChange={(e) => setTempRemainingInputs({ ...tempRemainingInputs, [boyName]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const correctedRemaining = parseFloat(tempRemainingInputs[boyName]) || 0;
                                  setMemberWallets({ ...memberWallets, [boyName]: correctedRemaining + boyShare });
                                  setRemainingEditMode({ ...remainingEditMode, [boyName]: false });
                                }
                              }}
                              className="w-full px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs"
                              style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                              autoFocus
                            />
                          ) : (
                            <div className="px-3 py-2 rounded-xl border text-xs font-black text-blue-500 flex items-center bg-blue-500/5 h-[34px]" style={{ borderColor: activeThemeObj.border }}>
                              ₱{Math.max(0, boyRemaining).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {boyOverspent > 0 && (
                        <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-1.5 text-rose-500 text-[11px] font-bold animate-pulse">
                          <AlertCircle size={13} />
                          <span>Labis na nagastos: ₱{boyOverspent.toLocaleString()}!</span>
                        </div>
                      )}

                      <p className="text-[10px] opacity-70" style={{ color: activeThemeObj.subText }}>

                      </p>
                    </div>
                  );
                })()}

                {/* Girl Wallet Card */}
                {(() => {
                  const girlTotalWallet = memberWallets[girlName] ?? 5000;
                  const girlRemaining = girlTotalWallet - girlShare;
                  const girlOverspent = girlRemaining < 0 ? Math.abs(girlRemaining) : 0;
                  return (
                    <div className="p-5 rounded-3xl border shadow-xl backdrop-blur-md space-y-3" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet size={16} className="text-rose-500" />
                          <h4 className="font-bold text-xs sm:text-sm text-rose-500">{girlName}'s Wallet</h4>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500">Cash Tracker</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs items-end">
                        <div>
                          <label className="block text-[10px] font-semibold mb-1 opacity-80" style={{ color: activeThemeObj.subText }}>Add Cash</label>
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              placeholder="+ Add cash"
                              value={topUpInputs[girlName] ?? ''}
                              onChange={(e) => setTopUpInputs({ ...topUpInputs, [girlName]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const addVal = parseFloat(topUpInputs[girlName]) || 0;
                                  if (addVal > 0) {
                                    setMemberWallets({ ...memberWallets, [girlName]: girlTotalWallet + addVal });
                                    setTopUpInputs({ ...topUpInputs, [girlName]: '' });
                                  }
                                }
                              }}
                              className="w-full px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs"
                              style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const addVal = parseFloat(topUpInputs[girlName]) || 0;
                                if (addVal > 0) {
                                  setMemberWallets({ ...memberWallets, [girlName]: girlTotalWallet + addVal });
                                  setTopUpInputs({ ...topUpInputs, [girlName]: '' });
                                }
                              }}
                              className="px-3 py-1.5 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm flex items-center justify-center"
                              style={{ backgroundColor: activeThemeObj.accent }}
                              title="Add cash"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold opacity-80" style={{ color: activeThemeObj.subText }}>Remaining Cash</span>
                            {remainingEditMode[girlName] ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const correctedRemaining = parseFloat(tempRemainingInputs[girlName]) || 0;
                                  setMemberWallets({ ...memberWallets, [girlName]: correctedRemaining + girlShare });
                                  setRemainingEditMode({ ...remainingEditMode, [girlName]: false });
                                }}
                                className="text-[10px] font-bold text-emerald-500 hover:underline cursor-pointer"
                              >
                                Save
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setTempRemainingInputs({ ...tempRemainingInputs, [girlName]: String(Math.max(0, girlRemaining)) });
                                  setRemainingEditMode({ ...remainingEditMode, [girlName]: true });
                                }}
                                className="text-[10px] font-bold hover:underline cursor-pointer"
                                style={{ color: activeThemeObj.accent }}
                              >
                                Edit
                              </button>
                            )}
                          </div>

                          {remainingEditMode[girlName] ? (
                            <input
                              type="number"
                              value={tempRemainingInputs[girlName] ?? ''}
                              onChange={(e) => setTempRemainingInputs({ ...tempRemainingInputs, [girlName]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const correctedRemaining = parseFloat(tempRemainingInputs[girlName]) || 0;
                                  setMemberWallets({ ...memberWallets, [girlName]: correctedRemaining + girlShare });
                                  setRemainingEditMode({ ...remainingEditMode, [girlName]: false });
                                }
                              }}
                              className="w-full px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs"
                              style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                              autoFocus
                            />
                          ) : (
                            <div className="px-3 py-2 rounded-xl border text-xs font-black text-rose-500 flex items-center bg-rose-500/5 h-[34px]" style={{ borderColor: activeThemeObj.border }}>
                              ₱{Math.max(0, girlRemaining).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {girlOverspent > 0 && (
                        <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-1.5 text-rose-500 text-[11px] font-bold animate-pulse">
                          <AlertCircle size={13} />
                          <span>Labis na nagastos: ₱{girlOverspent.toLocaleString()}!</span>
                        </div>
                      )}

                      <p className="text-[10px] opacity-70" style={{ color: activeThemeObj.subText }}>

                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl border shadow-xl text-center backdrop-blur-md transition-all duration-300 hover:scale-[1.02]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: activeThemeObj.subText }}>Total Spent</p>
                  <p className="text-2xl sm:text-3xl font-black mt-1" style={{ color: activeThemeObj.text }}>₱{totalCost.toLocaleString()}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: activeThemeObj.subText }}>{currentBudget.length} expense item(s)</p>
                </div>

                <div className="p-5 rounded-3xl border shadow-xl text-center relative overflow-hidden backdrop-blur-md transition-all duration-300 hover:scale-[1.02]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-500" />
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">{boyName} SPent</p>
                  <p className="text-2xl sm:text-3xl font-black text-blue-500 mt-1">₱{boyShare.toLocaleString()}</p>
                  <p className="text-[11px] opacity-80 mt-0.5" style={{ color: activeThemeObj.subText }}>

                  </p>
                </div>

                <div className="p-5 rounded-3xl border shadow-xl text-center relative overflow-hidden backdrop-blur-md transition-all duration-300 hover:scale-[1.02]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />
                  <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">{girlName} Spent</p>
                  <p className="text-2xl sm:text-3xl font-black text-rose-500 mt-1">₱{girlShare.toLocaleString()}</p>
                  <p className="text-[11px] opacity-80 mt-0.5" style={{ color: activeThemeObj.subText }}>

                  </p>
                </div>
              </div>

              {/* ADD EXPENSE SECTION */}
              <div className="p-5 sm:p-6 rounded-3xl border shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-[1.01]" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, borderRadius: activeThemeObj.radius, boxShadow: activeThemeObj.shadowStyle }}>
                <h3 className="font-bold text-xs sm:text-sm mb-3.5" style={{ color: activeThemeObj.text }}>Add Expense for "{currentPlan.title}"</h3>
                <form onSubmit={handleAddBudgetItem} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Item (e.g. Dinner, Cinema)"
                    value={newBudgetItem}
                    onChange={(e) => setNewBudgetItem(e.target.value)}
                    className="px-4 py-2.5 rounded-2xl border text-xs shadow-2xs transition-all"
                    style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Cost in ₱"
                    value={newBudgetCost}
                    onChange={(e) => setNewBudgetCost(e.target.value)}
                    className="px-4 py-2.5 rounded-2xl border text-xs shadow-2xs transition-all"
                    style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                    required
                  />

                  <select
                    value={newBudgetPaidBy}
                    onChange={(e) => setNewBudgetPaidBy(e.target.value)}
                    className="px-4 py-2.5 rounded-2xl border text-xs cursor-pointer font-semibold shadow-2xs transition-all"
                    style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                  >
                    <option value="50/50" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}> Split 50 / 50 (Equally)</option>
                    <option value={boyName} style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Treated / Paid by {boyName}</option>
                    <option value={girlName} style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Treated / Paid by {girlName}</option>
                  </select>

                  <button type="submit" className="py-2.5 text-white rounded-2xl text-xs font-semibold cursor-pointer shadow-md transition-all duration-300 hover:scale-105 active:scale-95" style={{ backgroundColor: activeThemeObj.accent }}>
                    Add Expense
                  </button>
                </form>

                <div className="mt-6 border rounded-2xl overflow-hidden shadow-2xs" style={{ borderColor: activeThemeObj.border }}>
                  <div className="px-4 py-3 border-b flex justify-between items-center" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border }}>
                    <span className="text-xs font-bold" style={{ color: activeThemeObj.text }}>
                      Expense Breakdown (Sorted: Highest to Lowest)
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: activeThemeObj.subText }}>All figures in PHP (₱)</span>
                  </div>

                  {sortedBudgetItems.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-8">No expenses added yet for this date.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b font-semibold text-[11px]" style={{ borderColor: activeThemeObj.border, backgroundColor: activeThemeObj.card, color: activeThemeObj.subText }}>
                            <th className="py-3 px-4">Expense Item</th>
                            <th className="py-3 px-4">Cost</th>
                            <th className="py-3 px-4">Payment Mode</th>
                            <th className="py-3 px-4 text-blue-500 font-bold">{boyName} Pays</th>
                            <th className="py-3 px-4 text-rose-500 font-bold">{girlName} Pays</th>
                            <th className="py-3 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: activeThemeObj.border, color: activeThemeObj.text }}>
                          {sortedBudgetItems.map((b: BudgetItem) => {
                            const isEditingThis = editingBudgetItemId === b.id;
                            let itemBoyCost = 0;
                            let itemGirlCost = 0;

                            if (b.paidBy === boyName) {
                              itemBoyCost = b.cost;
                            } else if (b.paidBy === girlName) {
                              itemGirlCost = b.cost;
                            } else {
                              itemBoyCost = b.cost / 2;
                              itemGirlCost = b.cost / 2;
                            }

                            return (
                              <tr key={b.id} className="transition-colors hover:opacity-80">
                                <td className="py-3 px-4 font-semibold">
                                  {isEditingThis ? (
                                    <input
                                      type="text"
                                      value={editItemName}
                                      onChange={(e) => setEditItemName(e.target.value)}
                                      className="px-2 py-1 rounded border text-xs w-full"
                                      style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                                    />
                                  ) : b.item}
                                </td>
                                <td className="py-3 px-4 font-bold">
                                  {isEditingThis ? (
                                    <input
                                      type="number"
                                      value={editItemCost}
                                      onChange={(e) => setEditItemCost(e.target.value)}
                                      className="px-2 py-1 rounded border text-xs w-24"
                                      style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                                    />
                                  ) : `₱${b.cost.toLocaleString()}`}
                                </td>
                                <td className="py-3 px-4">
                                  {isEditingThis ? (
                                    <select
                                      value={editItemPaidBy}
                                      onChange={(e) => setEditItemPaidBy(e.target.value)}
                                      className="px-2 py-1 rounded border text-xs"
                                      style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                                    >
                                      <option value="50/50">Split 50/50</option>
                                      <option value={boyName}>{boyName}</option>
                                      <option value={girlName}>{girlName}</option>
                                    </select>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shadow-2xs" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, color: activeThemeObj.text }}>
                                      {b.paidBy === '50/50' ? ' Split 50/50' : b.paidBy}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-bold text-blue-500">₱{itemBoyCost.toLocaleString()}</td>
                                <td className="py-3 px-4 font-bold text-rose-500">₱{itemGirlCost.toLocaleString()}</td>
                                <td className="py-3 px-3 text-right flex items-center justify-end gap-1.5">
                                  {isEditingThis ? (
                                    <>
                                      <button onClick={() => handleSaveExpenseEdit(b.id)} className="p-1 text-emerald-500 hover:text-emerald-700 cursor-pointer" title="Save">
                                        <Check size={14} />
                                      </button>
                                      <button onClick={() => setEditingBudgetItemId(null)} className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer" title="Cancel">
                                        <X size={14} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => {
                                        setEditingBudgetItemId(b.id);
                                        setEditItemName(b.item);
                                        setEditItemCost(String(b.cost));
                                        setEditItemPaidBy(b.paidBy);
                                      }} className="p-1 text-stone-400 hover:text-blue-500 cursor-pointer" title="Edit expense">
                                        <Pencil size={13} />
                                      </button>
                                      <button onClick={() => handleDeleteBudgetItem(b.id)} className="p-1 text-stone-400 hover:text-rose-500 cursor-pointer" title="Delete expense">
                                        <Trash2 size={13} />
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* INTERACTIVE CUTE FLIP-BOOK SCRAPBOOK */}
      {isStorybookModalOpen && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-[99999]" onClick={() => setIsStorybookModalOpen(false)}>
          <div
            className="w-full max-w-4xl bg-[#F5EFE6] rounded-3xl shadow-2xl border-4 border-[#E8DFD1] p-5 sm:p-8 relative overflow-hidden flex flex-col pointer-events-auto text-stone-800"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundImage: 'radial-gradient(#E8DFD1 1px, transparent 0)', backgroundSize: '24px 24px' }}
          >
            {/* Top Toolbar */}
            <div className="flex justify-between items-center pb-4 border-b border-stone-300">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-rose-500 rounded-full text-white shadow-sm">
                  <BookOpen size={18} />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-800">Our Interactive Date Album</h2>
                  <p className="text-[11px] text-stone-500 font-mono">
                    Chapter {activeStoryPage + 1} of {albumDates.length}: {albumDates[activeStoryPage]?.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-stone-800 hover:bg-rose-500 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Download size={13} /> Download / Print Book
                </button>
                <button onClick={() => setIsStorybookModalOpen(false)} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Interactive Binder Page */}
            {albumDates[activeStoryPage] && (
              <div className="py-6 flex-1 overflow-y-auto max-h-[70vh] relative px-2 sm:px-6">
                <div className="w-24 h-6 bg-rose-200/80 border border-rose-300/60 rounded-xs -rotate-2 mx-auto shadow-2xs mb-2" />

                <div className="text-center mb-6">
                  <span className="text-[10px] font-mono tracking-widest text-rose-500 uppercase bg-white px-3 py-1 rounded-full border border-rose-200 shadow-2xs">
                    CHAPTER 0{activeStoryPage + 1} • {albumDates[activeStoryPage].date}
                  </span>
                  <h3 className="text-2xl font-black text-stone-900 mt-2 tracking-tight">
                    {albumDates[activeStoryPage].title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5 flex items-center justify-center gap-1">
                    <MapPin size={12} className="text-rose-500" />
                    {albumDates[activeStoryPage].locationName}
                  </p>

                  {albumDates[activeStoryPage].bestMemory && (
                    <div className="mt-3 max-w-md mx-auto p-3 bg-amber-50/90 rounded-2xl border border-amber-200 text-xs italic text-stone-700 shadow-2xs">
                      “{albumDates[activeStoryPage].bestMemory}”
                    </div>
                  )}
                </div>

                {/* Cute Polaroid Grid */}
                {(() => {
                  const pics = [
                    albumDates[activeStoryPage].memory_photo,
                    ...(albumDates[activeStoryPage].gallery_photos || [])
                  ].filter(Boolean) as string[];

                  if (pics.length === 0) {
                    return (
                      <div className="p-12 text-center bg-white/70 rounded-3xl border border-stone-300 text-stone-400 text-xs">
                        No polaroid snapshots uploaded for this chapter yet.
                      </div>
                    );
                  }

                  const rotations = ['rotate-1', '-rotate-2', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-3'];

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-2">
                      {pics.map((picUrl, idx) => (
                        <div
                          key={idx}
                          className={`bg-white p-3 pb-6 rounded-lg shadow-md hover:shadow-xl transition-all hover:scale-105 duration-300 border border-stone-200/80 relative ${rotations[idx % rotations.length]}`}
                        >
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-amber-100/90 border border-amber-200/70 rounded-2xs shadow-2xs" />

                          <div className="aspect-[4/3] rounded overflow-hidden bg-stone-100 border border-stone-200 shadow-inner">
                            <img src={picUrl} alt="Memory" className="w-full h-full object-cover" />
                          </div>

                          <div className="mt-3 text-center">
                            <p className="text-[10px] font-mono font-bold text-stone-500 tracking-wider uppercase">
                              MEMORY #{idx + 1}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Interactive Page Navigation */}
            <div className="pt-4 border-t border-stone-300 flex items-center justify-between">
              <button
                onClick={() => setActiveStoryPage((prev) => Math.max(0, prev - 1))}
                disabled={activeStoryPage === 0}
                className="px-4 py-2 bg-white hover:bg-stone-50 disabled:opacity-30 border border-stone-300 text-stone-700 rounded-2xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
              >
                <ChevronLeft size={16} /> Prev Date
              </button>

              <div className="flex gap-1.5">
                {albumDates.map((_, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveStoryPage(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${activeStoryPage === i ? 'bg-rose-500 scale-125' : 'bg-stone-300'
                      }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setActiveStoryPage((prev) => Math.min(albumDates.length - 1, prev + 1))}
                disabled={activeStoryPage === albumDates.length - 1}
                className="px-4 py-2 bg-white hover:bg-stone-50 disabled:opacity-30 border border-stone-300 text-stone-700 rounded-2xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
              >
                Next Date <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT WISHLIST MODAL */}
      {editingBucketItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-[9999]" onClick={() => setEditingBucketItem(null)}>
          <div className="w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border pointer-events-auto transition-all" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, color: activeThemeObj.text }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold" style={{ color: activeThemeObj.text }}>Edit Bucketlist Idea</h2>
              <button onClick={() => setEditingBucketItem(null)} className="p-1 rounded-full cursor-pointer hover:opacity-80" style={{ color: activeThemeObj.subText }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateBucketItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Title</label>
                <input
                  type="text"
                  value={editingBucketItem.title}
                  onChange={(e) => setEditingBucketItem({ ...editingBucketItem, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs focus:ring-2"
                  style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Theme / Vibe</label>
                <select
                  value={editingBucketItem.vibe}
                  onChange={(e) => setEditingBucketItem({ ...editingBucketItem, vibe: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs cursor-pointer"
                  style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                >
                  <option value="Cozy & Romantic" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Cozy & Romantic</option>
                  <option value="Chill & Outdoor" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Chill & Outdoor</option>
                  <option value="Fancy Dinner" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Fancy Dinner</option>
                  <option value="Fun & Adventurous" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Fun & Adventurous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Notes</label>
                <textarea
                  value={editingBucketItem.notes}
                  onChange={(e) => setEditingBucketItem({ ...editingBucketItem, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs h-20 focus:ring-2"
                  style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                  placeholder="Optional notes or must-try food..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingBucketItem(null)} className="px-3.5 py-1.5 text-xs cursor-pointer hover:opacity-80" style={{ color: activeThemeObj.subText }}>Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-white rounded-full text-xs font-bold shadow-xs cursor-pointer" style={{ backgroundColor: activeThemeObj.accent }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-[9999]" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border max-h-[90vh] overflow-y-auto relative z-[10000] pointer-events-auto transition-all" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, color: activeThemeObj.text }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold" style={{ color: activeThemeObj.text }}>Plan a new date</h2>
                <p className="text-[11px]" style={{ color: activeThemeObj.subText }}>Destination, vibe, outfit & stops</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-full transition-colors cursor-pointer hover:opacity-80" style={{ color: activeThemeObj.subText }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Date Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sunday Blessing & Sunset Dinner"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-hidden focus:ring-2"
                  style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-hidden focus:ring-2"
                    style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Call Time</label>
                  <input
                    type="time"
                    value={newCallTime}
                    onChange={(e) => setNewCallTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-hidden focus:ring-2 cursor-pointer"
                    style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Theme / Vibe</label>
                <select
                  value={newVibe}
                  onChange={(e) => setNewVibe(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-hidden focus:ring-2 cursor-pointer"
                  style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                >
                  <option value="Cozy & Romantic" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Cozy & Romantic</option>
                  <option value="Fancy Dinner" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Fancy Dinner</option>
                  <option value="Chill & Outdoor" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Chill & Outdoor</option>
                  <option value="Street Food Walk" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Street Food Walk</option>
                  <option value="Church & Coffee" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Church & Coffee</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Main Destination</label>
                  <input
                    type="text"
                    placeholder="e.g. Tagaytay City"
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden focus:ring-2"
                    style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Meet-up Spot (Assembly)</label>
                  <input
                    type="text"
                    placeholder="e.g. Petron SLEX"
                    value={newMeetupName}
                    onChange={(e) => setNewMeetupName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden focus:ring-2"
                    style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Pin Location</label>
                <div className="flex gap-1.5 mb-1.5">
                  <input
                    type="text"
                    placeholder="Search place..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border text-xs focus:outline-hidden focus:ring-2"
                    style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}
                  />
                  <button type="button" onClick={handleSearchLocation} className="px-3.5 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-medium rounded-xl cursor-pointer">
                    {isSearching ? '...' : 'Find'}
                  </button>
                </div>
                <div className="h-36 w-full rounded-2xl overflow-hidden border" style={{ borderColor: activeThemeObj.border }}>
                  <MapContainer center={pinnedCoords} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapFlyToController centerCoords={mapCenterTarget} />
                    <LocationPicker position={pinnedCoords} setPosition={setPinnedCoords} />
                  </MapContainer>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-3.5 py-2 text-xs hover:opacity-80 rounded-xl cursor-pointer" style={{ color: activeThemeObj.subText }}>Cancel</button>
                <button type="submit" disabled={isUploadingGallery} className="px-5 py-2 disabled:opacity-50 text-white rounded-full text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer" style={{ backgroundColor: activeThemeObj.accent }}>
                  Save Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DATE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-[9999]" onClick={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false); }}>
          <div className="w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border max-h-[90vh] overflow-y-auto relative z-[10000] pointer-events-auto transition-all" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, color: activeThemeObj.text }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base sm:text-lg font-bold" style={{ color: activeThemeObj.text }}>Edit Date Details</h2>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-1.5 rounded-full transition-colors cursor-pointer hover:opacity-80" style={{ color: activeThemeObj.subText }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Date Title</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-hidden focus:ring-2" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }} required />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Date</label>
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-hidden focus:ring-2" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Theme</label>
                  <select value={editVibe} onChange={(e) => setEditVibe(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-hidden focus:ring-2 cursor-pointer" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }}>
                    <option value="Cozy & Romantic" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Cozy & Romantic</option>
                    <option value="Fancy Dinner" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Fancy Dinner</option>
                    <option value="Chill & Outdoor" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Chill & Outdoor</option>
                    <option value="Street Food Walk" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Street Food Walk</option>
                    <option value="Church & Coffee" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text }}>Church & Coffee</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Destination</label>
                  <input type="text" value={editLocName} onChange={(e) => setEditLocName(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-hidden focus:ring-2" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Meet-up Spot</label>
                  <input type="text" value={editMeetupName} onChange={(e) => setEditMeetupName(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-hidden focus:ring-2" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t" style={{ borderColor: activeThemeObj.border }}>
                <button type="button" onClick={() => handleDeletePlan(editPlanId)} className="text-xs text-rose-500 font-semibold flex items-center gap-1 hover:opacity-80 p-2 rounded-lg cursor-pointer">
                  <Trash2 size={13} /> Delete Date
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-3.5 py-1.5 text-xs hover:opacity-80 cursor-pointer" style={{ color: activeThemeObj.subText }}>Cancel</button>
                  <button type="submit" className="px-4 py-1.5 text-white rounded-full text-xs font-medium cursor-pointer shadow-sm" style={{ backgroundColor: activeThemeObj.accent }}>Save Changes</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MARK DONE MODAL */}
      {isFinishModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-[9999]" onClick={(e) => { if (e.target === e.currentTarget) setIsFinishModalOpen(false); }}>
          <div className="w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border relative z-[10000] pointer-events-auto transition-all" style={{ backgroundColor: activeThemeObj.card, borderColor: activeThemeObj.border, color: activeThemeObj.text }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-base sm:text-lg font-bold" style={{ color: activeThemeObj.text }}>Mark Date as Done! 💕</h2>
              <button type="button" onClick={() => setIsFinishModalOpen(false)} className="p-1.5 rounded-full transition-colors cursor-pointer hover:opacity-80" style={{ color: activeThemeObj.subText }}>
                <X size={18} />
              </button>
            </div>
            <p className="text-xs mb-3.5" style={{ color: activeThemeObj.subText }}>Archive this memory into your scrapbook</p>

            <form onSubmit={handleCompleteDate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Rate this Date</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setFinishRating(star)} className="p-1 text-amber-400 cursor-pointer">
                      <Star size={22} fill={star <= finishRating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Upload Cover Photo (Polaroid Memory)</label>
                {finishMemoryPhoto ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-[16/9] border group" style={{ borderColor: activeThemeObj.border }}>
                    <img src={finishMemoryPhoto} alt="Memory preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setFinishMemoryPhoto(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all shadow-2xs" style={{ borderColor: activeThemeObj.border, backgroundColor: activeThemeObj.card }}>
                    {isUploadingMemoryPhoto ? <Loader2 size={22} className="animate-spin" style={{ color: activeThemeObj.accent }} /> : (
                      <>
                        <ImagePlus size={22} className="mb-1" style={{ color: activeThemeObj.accent }} />
                        <span className="text-xs font-bold" style={{ color: activeThemeObj.text }}>Add cover selfie or photo!</span>
                        <span className="text-[10px] mt-0.5" style={{ color: activeThemeObj.subText }}>Click to choose image</span>
                      </>
                    )}
                    <input type="file" accept="image/*" disabled={isUploadingMemoryPhoto} onChange={(e) => handleMemoryPhotoUpload(e)} className="hidden" />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: activeThemeObj.text }}>Our Favorite Memory / Note</label>
                <textarea value={finishMemory} onChange={(e) => setFinishMemory(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-xs h-20 focus:outline-hidden focus:ring-2" style={{ backgroundColor: activeThemeObj.card, color: activeThemeObj.text, borderColor: activeThemeObj.border }} placeholder="What was the highlight of our date?" required />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsFinishModalOpen(false)} className="px-3.5 py-1.5 text-xs hover:opacity-80 cursor-pointer" style={{ color: activeThemeObj.subText }}>Cancel</button>
                <button type="submit" disabled={isUploadingMemoryPhoto} className="px-5 py-2 disabled:opacity-50 text-white rounded-full text-xs font-bold shadow-xs cursor-pointer" style={{ backgroundColor: activeThemeObj.accent }}>
                  Save to Scrapbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* THEME SELECTOR MODAL */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[99999]" onClick={() => setIsThemeModalOpen(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border text-stone-800" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2"><Palette size={18} className="text-rose-500" /> Choose Aesthetic Theme</h2>
            <div className="space-y-2.5">
              {aestheticThemes.map((theme) => {
                const isSelected = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => { setCurrentTheme(theme.id); localStorage.setItem('dc_theme', theme.id); setIsThemeModalOpen(false); }}
                    className={`w-full p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${isSelected
                      ? 'border-rose-500 bg-rose-50/60 text-rose-700 shadow-xs ring-1 ring-rose-400'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700 bg-white'
                      }`}
                  >
                    <span className="text-left">{theme.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}