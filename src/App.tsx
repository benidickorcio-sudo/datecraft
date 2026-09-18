import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Heart, Calendar, MapPin, Plus, Shirt, CheckSquare, ExternalLink,
  Navigation, Sparkles, Trash2, Camera, LogOut, User,
  Pencil, CloudSun, Dices, Clock, History, BookmarkPlus,
  DollarSign, Star, ArrowRight, CheckCircle2, Copy, Users, X, Loader2, ImagePlus, KeyRound, Radio, Wand2, Download, BookOpen, ChevronLeft, ChevronRight, ChevronDown, UserMinus, Crown
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
  lat: number;
  lng: number;
  dressCode: string;
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

  // Wishlist Editing State
  const [editingBucketItem, setEditingBucketItem] = useState<BucketItem | null>(null);

  // GPS Live State
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const watchIdRef = useRef<number | null>(null);

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
  const [pinnedCoords, setPinnedCoords] = useState<[number, number]>([14.5995, 120.9842]);
  const [selectedOutfitType] = useState(outfitPresets[0].label);

  // Date Multi-Photos uploader state
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');

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

      // Verify creator role accurately
      const myName = localStorage.getItem('dc_user_name') || currentUserName;
      const amICreator = spaceCreator.trim().toLowerCase() === myName.trim().toLowerCase();
      setIsCreator(amICreator);
      localStorage.setItem('dc_is_creator', amICreator ? 'true' : 'false');

      // Check if current user was kicked out
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
        lat: d.lat,
        lng: d.lng,
        dressCode: d.dress_code,
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
    const { data, error } = await supabase.from('bucket_items').select('*').eq('couple_id', cId).order('created_at', { ascending: false });
    if (data) setBucketList(data);
  };

  useEffect(() => {
    if (!coupleId) return;

    fetchDatePlans(coupleId);
    fetchBucketList(coupleId);
    fetchSpaceDetails(coupleId);
    startLiveTracking();

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

        // Real-time kick detection
        const stillInSpace = updatedMembers.some((m) => m.id === currentUserId || m.name.toLowerCase() === myName.toLowerCase());
        if (!stillInSpace && currentUserId && !amICreator) {
          alert('You have been removed from this space by the creator.');
          handleLogout();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [coupleId]);

  const upcomingPlans = plans.filter((p) => !p.completed);
  const historyPlans = plans.filter((p) => Boolean(p.completed));
  const currentPlan = upcomingPlans.find((p) => p.id === selectedPlanId) || upcomingPlans[0] || null;

  // Accurate Live Weather Fetching using WMO code
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

    // Determine if joining user is the creator
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

  // Creator kick/remove member function
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
    setUploadProgressText(`Uploading ${selectedFiles.length} photo(s)...`);

    try {
      const uploadPromises = selectedFiles.map((file) => uploadToSupabaseStorage(file));
      const results = await Promise.all(uploadPromises);
      const uploadedUrls = results.filter(Boolean) as string[];

      if (uploadedUrls.length > 0) {
        const updatedList = [...existing, ...uploadedUrls];
        setPlans((prev) => prev.map((p) => p.id === planId ? { ...p, gallery_photos: updatedList } : p));
        await supabase.from('date_plans').update({ gallery_photos: updatedList }).eq('id', planId);
      }
    } catch {
      alert('Error uploading some photos. Please try again.');
    } finally {
      setIsUploadingGallery(false);
      setUploadProgressText('');
      e.target.value = '';
    }
  };

  const handleDeleteGalleryPhoto = async (planId: string, photoUrl: string) => {
    const targetPlan = plans.find((p) => p.id === planId);
    if (!targetPlan) return;
    const updated = (targetPlan.gallery_photos || []).filter((url) => url !== photoUrl);
    setPlans((prev) => prev.map((p) => p.id === planId ? { ...p, gallery_photos: updated } : p));
    await supabase.from('date_plans').update({ gallery_photos: updated }).eq('id', planId);
  };

  const handleCreateDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate || !coupleId) return;

    const formattedTasks = modalTasks.map((t, idx) => ({ id: Date.now() + idx, text: t, done: false }));
    const coords = pinnedCoords || [14.5995, 120.9842];

    const { data } = await supabase.from('date_plans').insert([{
      couple_id: coupleId,
      title: newTitle.trim(),
      date: newDate,
      vibe: newVibe,
      location_name: newLocName.trim() || 'Pinned Destination',
      lat: coords[0],
      lng: coords[1],
      dress_code: selectedOutfitType,
      outfit_photos: {},
      completed: false,
      tasks: formattedTasks,
      gallery_photos: [],
      budget_items: [],
    }]).select().single();

    if (data) {
      setPlans((prev) => [...prev, { ...data, completed: false, tasks: formattedTasks, gallery_photos: [], budgetItems: [] }]);
      setSelectedPlanId(data.id);
      setIsModalOpen(false);
      setNewTitle('');
      setNewLocName('');
    }
  };

  const handleOpenEditModal = (planToEdit: DatePlan) => {
    setEditPlanId(planToEdit.id);
    setEditTitle(planToEdit.title);
    setEditDate(planToEdit.date);
    setEditVibe(planToEdit.vibe);
    setEditLocName(planToEdit.locationName);
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
          ? { ...p, title: editTitle, date: editDate, vibe: editVibe, locationName: editLocName || 'Pinned Destination', lat: editCoords[0], lng: editCoords[1], dressCode: editOutfitType }
          : p
      )
    );
    setIsEditModalOpen(false);

    await supabase.from('date_plans').update({
      title: editTitle,
      date: editDate,
      vibe: editVibe,
      location_name: editLocName || 'Pinned Destination',
      lat: editCoords[0],
      lng: editCoords[1],
      dress_code: editOutfitType,
    }).eq('id', editPlanId);
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this date?')) return;
    setPlans((prev) => prev.filter((p) => p.id !== id));
    setIsEditModalOpen(false);
    await supabase.from('date_plans').delete().eq('id', id);
  };

  const handleMemoryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, planId?: string) => {
    if (!e.target.files || !e.target.files[0]) return;
    setIsUploadingMemoryPhoto(true);
    const permanentUrl = await uploadToSupabaseStorage(e.target.files[0]);
    setIsUploadingMemoryPhoto(false);

    if (permanentUrl) {
      if (planId) {
        setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, memory_photo: permanentUrl } : p)));
        await supabase.from('date_plans').update({ memory_photo: permanentUrl }).eq('id', planId);
      } else {
        setFinishMemoryPhoto(permanentUrl);
      }
    }
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

    await supabase.from('date_plans').update({
      completed: true,
      rating: finishRating,
      best_memory: finishMemory || 'Memorable hangout! ✨',
      memory_photo: photoToSave,
    }).eq('id', targetId);
  };

  const toggleTask = async (taskId: number) => {
    if (!currentPlan) return;
    const updated = currentPlan.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));
    setPlans((prev) => prev.map((p) => (p.id === currentPlan.id ? { ...p, tasks: updated } : p)));
    await supabase.from('date_plans').update({ tasks: updated }).eq('id', currentPlan.id);
  };

  const handleAddInlineTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTaskInput.trim() || !currentPlan) return;
    const updated = [...currentPlan.tasks, { id: Date.now(), text: inlineTaskInput.trim(), done: false }];
    setInlineTaskInput('');
    setPlans((prev) => prev.map((p) => (p.id === currentPlan.id ? { ...p, tasks: updated } : p)));
    await supabase.from('date_plans').update({ tasks: updated }).eq('id', currentPlan.id);
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!currentPlan) return;
    const updated = currentPlan.tasks.filter((t) => t.id !== taskId);
    setPlans((prev) => prev.map((p) => (p.id === currentPlan.id ? { ...p, tasks: updated } : p)));
    await supabase.from('date_plans').update({ tasks: updated }).eq('id', currentPlan.id);
  };

  // 50/50 Bill Splitter Logic
  const handleAddBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetItem || !newBudgetCost || !currentPlan) return;
    const costNum = parseFloat(newBudgetCost);
    if (isNaN(costNum)) return;

    const updated = [...(currentPlan.budgetItems || []), { id: Date.now(), item: newBudgetItem, cost: costNum, paidBy: newBudgetPaidBy }];
    setNewBudgetItem('');
    setNewBudgetCost('');
    setPlans((prev) => prev.map((p) => (p.id === currentPlan.id ? { ...p, budgetItems: updated } : p)));
    await supabase.from('date_plans').update({ budget_items: updated }).eq('id', currentPlan.id);
  };

  const handleDeleteBudgetItem = async (itemId: number) => {
    if (!currentPlan) return;
    const updated = (currentPlan.budgetItems || []).filter((b) => b.id !== itemId);
    setPlans((prev) => prev.map((p) => (p.id === currentPlan.id ? { ...p, budgetItems: updated } : p)));
    await supabase.from('date_plans').update({ budget_items: updated }).eq('id', currentPlan.id);
  };

  // Wishlist Handling
  const handleAddBucketItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketTitle.trim() || !coupleId) return;
    const { data } = await supabase.from('bucket_items').insert([{ couple_id: coupleId, title: newBucketTitle.trim(), vibe: newBucketVibe, notes: newBucketNotes.trim() }]).select().single();
    if (data) setBucketList((prev) => [data, ...prev]);
    setNewBucketTitle('');
    setNewBucketNotes('');
  };

  const handleUpdateBucketItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBucketItem) return;

    setBucketList((prev) => prev.map((item) => item.id === editingBucketItem.id ? editingBucketItem : item));
    await supabase.from('bucket_items').update({
      title: editingBucketItem.title,
      vibe: editingBucketItem.vibe,
      notes: editingBucketItem.notes
    }).eq('id', editingBucketItem.id);

    setEditingBucketItem(null);
  };

  const handleDeleteBucketItem = async (id: string) => {
    setBucketList((prev) => prev.filter((b) => b.id !== id));
    await supabase.from('bucket_items').delete().eq('id', id);
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

  // Boy & Girl Bill Calculations
  const currentBudget = currentPlan?.budgetItems || [];
  const totalCost = currentBudget.reduce((acc, curr) => acc + curr.cost, 0);
  const sortedBudgetItems = [...currentBudget].sort((a, b) => b.cost - a.cost);

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
  const albumDates = historyPlans.slice(0, 2);

  // LOGIN SCREEN
  if (!coupleId) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-rose-500 rounded-full text-white mb-3 shadow-md">
              <Heart size={28} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">DateCraft</h1>
            <p className="text-xs text-stone-500 mt-1">Real-time couple & group date planner (Customizable up to 8)</p>
          </div>

          <div className="flex bg-stone-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setAuthMode('create')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${authMode === 'create' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
                }`}
            >
              Create Room
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('join')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${authMode === 'join' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
                }`}
            >
              Join Room
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
                    placeholder="e.g. Benidick"
                    value={createNameInput}
                    onChange={(e) => setCreateNameInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-700">Custom Space Code</label>
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Wand2 size={11} /> Auto-generate
                  </button>
                </div>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-3 text-stone-400" />
                  <input
                    type="text"
                    placeholder="e.g. BEN-LOR-2026 (or leave empty)"
                    value={customCodeInput}
                    onChange={(e) => setCustomCodeInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-mono uppercase tracking-wider text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Type your preferred secret code or click auto-generate.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Max Room Capacity</label>
                <select
                  value={maxMembersInput}
                  onChange={(e) => setMaxMembersInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num} People {num === 2 ? '(Couples only)' : num === 4 ? '(Double Date)' : '(Group Hangout)'}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full mt-2 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAuthLoading ? 'Creating Room...' : 'Create Space with Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinSpace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Space Code</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-3 text-stone-400" />
                  <input
                    type="text"
                    placeholder="e.g. BEN-LOR-2026"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-mono uppercase tracking-wider text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {rememberedName ? (
                <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={15} className="text-rose-500" />
                    <span className="text-xs text-stone-700">
                      Joining as <strong className="text-stone-900">{rememberedName}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('dc_remembered_name');
                      setJoinNameInput('');
                    }}
                    className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">Your Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3 text-stone-400" />
                    <input
                      type="text"
                      placeholder="e.g. Loraine"
                      value={joinNameInput}
                      onChange={(e) => setJoinNameInput(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full mt-2 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
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
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 p-3.5 sm:p-6 md:p-8">
      {/* Navbar */}
      <header className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between pb-4 sm:pb-6 border-b border-stone-200 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500 rounded-full text-white flex-shrink-0">
              <Heart size={18} fill="currentColor" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">DateCraft</h1>
                <span className="text-[11px] bg-rose-50 text-rose-600 font-semibold px-2.5 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
                  <Users size={11} /> {members.length}/{maxCapacity} Members
                </span>
              </div>

              {/* Creator display & Space Code */}
              <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5 flex-wrap">
                <span>Code: <strong className="font-mono text-stone-800">{spaceCode}</strong></span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(spaceCode || '');
                    alert(`Copied Space Code: ${spaceCode}`);
                  }}
                  className="hover:text-rose-500 p-0.5 cursor-pointer"
                  title="Copy code"
                >
                  <Copy size={11} />
                </button>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-stone-600 font-medium bg-stone-100 px-2 py-0.5 rounded-md">
                  <Crown size={11} className="text-amber-500" />
                  Creator: <strong className="text-stone-800">{creatorName || 'Admin'}</strong>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="sm:hidden p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={startLiveTracking}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 px-3 py-2 rounded-xl sm:rounded-full font-medium text-xs shadow-2xs cursor-pointer"
          >
            <Navigation size={13} className={isLocating ? 'animate-spin text-blue-500' : 'text-blue-600'} />
            {isLocating ? 'Locating...' : 'My GPS'}
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl sm:rounded-full font-medium text-xs shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus size={15} /> Plan date
          </button>

          <button
            onClick={handleLogout}
            className="hidden sm:block p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Connected Members Badges with Direct Kick / Remove Button */}
      <div className="max-w-5xl mx-auto mt-2.5 flex items-center gap-2 overflow-x-auto py-1">
        <span className="text-[11px] text-stone-400 font-semibold mr-0.5">In this space:</span>
        {members.map((m, idx) => {
          const isTargetCreator = m.name.trim().toLowerCase() === creatorName.trim().toLowerCase();
          const isSelf = m.id === currentUserId || m.name.toLowerCase() === currentUserName.toLowerCase();

          return (
            <span
              key={m.id}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 shadow-2xs"
              style={{ borderColor: memberColors[idx % memberColors.length], color: memberColors[idx % memberColors.length], backgroundColor: '#fff' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: memberColors[idx % memberColors.length] }}></span>
              <span>
                {m.name} {isSelf ? '(You)' : ''} {isTargetCreator ? '👑' : ''}
              </span>

              {/* KICK BUTTON: Only the Creator can see and click this for other members */}
              {isCreator && !isTargetCreator && (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(m)}
                  className="p-0.5 hover:bg-rose-100 text-rose-500 rounded-full transition-colors cursor-pointer ml-1"
                  title={`Kick / Remove ${m.name} from space`}
                >
                  <X size={12} />
                </button>
              )}
            </span>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-5xl mx-auto mt-3 flex items-center gap-2 border-b border-stone-200 pb-2.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('planner')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'planner'
            ? 'bg-rose-500 text-white shadow-xs'
            : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
        >
          <Calendar size={13} /> Active ({upcomingPlans.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'history'
            ? 'bg-rose-500 text-white shadow-xs'
            : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
        >
          <History size={13} /> Scrapbook & Album ({historyPlans.length})
        </button>

        <button
          onClick={() => setActiveTab('bucket')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'bucket'
            ? 'bg-rose-500 text-white shadow-xs'
            : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
        >
          <BookmarkPlus size={13} /> Wishlist ({bucketList.length})
        </button>

        <button
          onClick={() => setActiveTab('budget')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'budget'
            ? 'bg-rose-500 text-white shadow-xs'
            : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
        >
          <DollarSign size={13} /> Bill Splitter (50/50)
        </button>
      </div>

      {/* PLANNER TAB */}
      {activeTab === 'planner' && (
        <div className="max-w-5xl mx-auto mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {upcomingPlans.length === 0 ? (
            <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 sm:p-10 text-center border border-stone-200 shadow-sm">
              <div className="inline-flex p-4 bg-rose-50 rounded-full text-rose-500 mb-4">
                <Calendar size={32} />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">No active date planned right now!</h2>
              <p className="text-xs text-stone-500 mt-1 mb-5">
                Plan a new date to unlock memories and photo albums together!
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus size={15} /> Plan a New Date
              </button>
            </div>
          ) : (
            <>
              {/* Dropdown with arrow down for multiple dates */}
              {upcomingPlans.length > 1 && (
                <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-rose-500" />
                    <span className="text-xs font-bold text-stone-800">Select Planned Date:</span>
                  </div>

                  <div className="relative w-full sm:w-auto">
                    <select
                      value={currentPlan?.id || ''}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full sm:w-80 appearance-none bg-rose-50/70 hover:bg-rose-100/70 text-rose-700 font-bold text-xs py-2 pl-3.5 pr-10 rounded-xl border border-rose-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-rose-400 transition-colors"
                    >
                      {upcomingPlans.map((plan, i) => (
                        <option key={plan.id} value={plan.id}>
                          Date #{i + 1}: {plan.title} ({plan.date})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-2.5 text-rose-500 pointer-events-none" />
                  </div>
                </div>
              )}

              <main className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-4 sm:space-y-6">
                  {currentPlan && (
                    <>
                      <div
                        onClick={() => handleOpenEditModal(currentPlan)}
                        className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group relative"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-block bg-rose-100 text-rose-700 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">
                            {currentPlan.vibe}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePlan(currentPlan.id);
                              }}
                              className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete this date"
                            >
                              <Trash2 size={14} />
                            </button>
                            <span className="flex items-center gap-1 text-xs font-semibold text-stone-400 group-hover:text-rose-500 transition-colors">
                              <Pencil size={12} />
                              <span>Edit</span>
                            </span>
                          </div>
                        </div>

                        <h2 className="text-xl sm:text-2xl font-bold text-stone-900 group-hover:text-rose-600 transition-colors">
                          {currentPlan.title}
                        </h2>

                        <div className="flex items-center justify-between text-xs text-stone-600 mt-2">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-rose-500" />
                            <span>{currentPlan.date}</span>
                          </div>
                          <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Clock size={11} />
                            {calculateDaysUntil(currentPlan.date)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-1">
                          <MapPin size={14} className="text-rose-500 flex-shrink-0" />
                          <span className="truncate">{currentPlan.locationName}</span>
                        </div>

                        <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${currentPlan.lat},${currentPlan.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                          >
                            Directions <ExternalLink size={11} />
                          </a>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFinishingPlanTargetId(currentPlan.id);
                              setIsFinishModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-semibold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <CheckCircle2 size={13} /> Mark Done
                          </button>
                        </div>
                      </div>

                      {/* Multi-Photos Upload Section */}
                      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-xs sm:text-sm text-stone-900">Date Pictures</h3>
                            <p className="text-[10px] text-stone-400">
                              {uploadProgressText || 'Upload up to 15 pictures (Auto-compressed)'}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                            {(currentPlan.gallery_photos || []).length}/15
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {(currentPlan.gallery_photos || []).map((imgUrl, i) => (
                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 group">
                              <img src={imgUrl} alt="Date memory" className="w-full h-full object-cover" />
                              <button
                                onClick={() => handleDeleteGalleryPhoto(currentPlan.id, imgUrl)}
                                className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          ))}

                          {(currentPlan.gallery_photos || []).length < 15 && (
                            <label className="aspect-square border-2 border-dashed border-stone-200 hover:border-rose-400 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-stone-50/50 hover:bg-rose-50/20 transition-all">
                              {isUploadingGallery ? (
                                <Loader2 size={16} className="animate-spin text-rose-500" />
                              ) : (
                                <>
                                  <ImagePlus size={18} className="text-rose-400 mb-0.5" />
                                  <span className="text-[9px] font-bold text-stone-600">+ Add Pic</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={isUploadingGallery}
                                onChange={(e) => handleMultipleGalleryUpload(e, currentPlan.id)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Checklist */}
                      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <CheckSquare size={16} className="text-rose-500" />
                            <h3 className="font-bold text-xs sm:text-sm">Where To Go & Checklist</h3>
                          </div>
                          <span className="text-[10px] text-stone-400 font-semibold">
                            {currentPlan.tasks.filter((t) => t.done).length}/{currentPlan.tasks.length} Done
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {currentPlan.tasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-1.5 rounded-xl hover:bg-stone-50 group">
                              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer flex-1 min-w-0">
                                <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} className="accent-rose-500 rounded w-4 h-4 cursor-pointer" />
                                <span className={`truncate text-xs ${task.done ? 'line-through text-stone-400' : 'font-medium text-stone-800'}`}>{task.text}</span>
                              </label>
                              <button onClick={() => handleDeleteTask(task.id)} className="text-stone-300 hover:text-rose-500 p-1 cursor-pointer">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <form onSubmit={handleAddInlineTask} className="flex gap-1.5 pt-1.5 border-t border-stone-100">
                          <input
                            type="text"
                            placeholder="Add stop or task..."
                            value={inlineTaskInput}
                            onChange={(e) => setInlineTaskInput(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-400"
                          />
                          <button type="submit" className="px-3.5 py-1.5 bg-stone-900 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold cursor-pointer">Add</button>
                        </form>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Column: Weather, Roulette, Multi-User GPS Map */}
                {currentPlan && (
                  <div className="md:col-span-2 space-y-3.5 sm:space-y-4">
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                      <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm flex items-center gap-2 sm:gap-3">
                        <div className="p-2 sm:p-2.5 bg-amber-50 text-amber-500 rounded-xl sm:rounded-2xl flex-shrink-0">
                          <CloudSun size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-wider font-semibold text-stone-400 truncate">Destination Forecast</p>
                          <p className="text-xs sm:text-sm font-bold text-stone-800 truncate">
                            {isWeatherLoading ? 'Checking...' : weatherInfo ? `${weatherInfo.temp}°C • ${weatherInfo.description}` : '28°C • Clear Sky'}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-wider font-semibold text-stone-400 truncate">Date Roulette</p>
                          <p className="text-xs font-bold text-stone-800 truncate">{pickedIdea || 'Spin for idea!'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={spinRoulette}
                          disabled={isSpinning}
                          className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer flex-shrink-0"
                        >
                          <Dices size={13} className={isSpinning ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </div>

                    {/* LIVE GROUP MAP */}
                    <div className="bg-white p-3 sm:p-4 rounded-3xl border border-stone-200 shadow-sm flex flex-col h-[400px] sm:h-[480px]">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5 px-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-xs sm:text-sm">Live GPS & Date Spot</h3>
                          {members.map((m, idx) => (
                            m.lat && m.lng ? (
                              <span key={m.id} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border" style={{ color: memberColors[idx % memberColors.length], borderColor: memberColors[idx % memberColors.length] }}>
                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: memberColors[idx % memberColors.length] }}></span>
                                {m.name}
                              </span>
                            ) : null
                          ))}
                        </div>

                        {coupleDistanceKm !== null && (
                          <div className="bg-rose-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                            <Radio size={10} className="animate-pulse" />
                            <span>{coupleDistanceKm < 1 ? `${Math.round(coupleDistanceKm * 1000)}m apart` : `${coupleDistanceKm.toFixed(1)} km apart`}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 w-full rounded-2xl overflow-hidden border border-stone-200 relative z-0">
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
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-1.5">Our Date Scrapbook 💕</h2>
              <p className="text-[11px] sm:text-xs text-stone-500">Every single date, preserved like polaroids of our story</p>
            </div>

            {isScrapbookReady && (
              <button
                onClick={() => {
                  setActiveStoryPage(0);
                  setIsStorybookModalOpen(true);
                }}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer self-start sm:self-auto"
              >
                <BookOpen size={16} />
                <span>Open Interactive Flip-Book Album ✨</span>
              </button>
            )}
          </div>

          {historyPlans.length === 1 && (
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles size={16} className="text-rose-500" />
                1 date completed! Complete 1 more date to automatically unlock your **Interactive Flip-Book Scrapbook Album**!
              </span>
              <span className="font-bold text-rose-600">1/2 Dates</span>
            </div>
          )}

          {historyPlans.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-stone-200 shadow-sm">
              <History size={32} className="mx-auto text-stone-300 mb-2" />
              <h3 className="font-bold text-xs sm:text-sm text-stone-800">No date memories archived yet</h3>
              <p className="text-xs text-stone-500 mt-1">Complete dates to automatically assemble your interactive polaroid photo book!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {historyPlans.map((plan) => {
                const memoryDisplayPhoto = plan.memory_photo || (plan.gallery_photos && plan.gallery_photos[0]) || plan.outfit_photos?.[plan.dressCode] || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80';
                return (
                  <div key={plan.id} className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200/90 shadow-md hover:shadow-xl transition-all duration-300 relative group flex flex-col justify-between">
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-5 sm:h-6 bg-amber-100/80 border border-amber-200/60 rounded-xs -rotate-2 shadow-2xs pointer-events-none" />
                    <button onClick={() => handleDeletePlan(plan.id)} className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-rose-50 text-stone-300 hover:text-rose-600 rounded-full transition-colors shadow-2xs z-10 cursor-pointer">
                      <Trash2 size={13} />
                    </button>

                    <div>
                      <div className="bg-stone-50 p-3 sm:p-4 pb-4 sm:pb-6 rounded-2xl border border-stone-200/80 shadow-inner relative group/photo">
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-200">
                          <img src={memoryDisplayPhoto} alt={plan.title} className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-500" />
                          <label className="absolute bottom-2 right-2 p-1.5 sm:p-2 bg-black/60 hover:bg-stone-900 text-white rounded-full transition-colors shadow backdrop-blur-xs cursor-pointer flex items-center justify-center">
                            {isUploadingMemoryPhoto ? <Loader2 size={13} className="animate-spin text-rose-400" /> : <Camera size={13} />}
                            <input type="file" accept="image/*" disabled={isUploadingMemoryPhoto} onChange={(e) => handleMemoryPhotoUpload(e, plan.id)} className="hidden" />
                          </label>
                        </div>

                        <div className="mt-2.5 text-center flex items-center justify-center gap-1.5 text-stone-500 font-mono text-[10px] sm:text-[11px]">
                          <span>🗓️ {plan.date}</span>
                          <span>•</span>
                          <span className="text-rose-600 font-semibold truncate">{plan.locationName}</span>
                        </div>
                      </div>

                      <div className="mt-3.5 flex items-center justify-between">
                        <h3 className="font-bold text-base sm:text-lg text-stone-900 tracking-tight">{plan.title}</h3>
                        <div className="flex items-center text-amber-400">
                          {[...Array(plan.rating || 5)].map((_, i) => (
                            <Star key={i} size={14} fill="currentColor" />
                          ))}
                        </div>
                      </div>

                      <div className="mt-2.5 p-3 bg-rose-50/60 rounded-2xl border border-rose-100 text-xs text-stone-700 italic relative">
                        <span className="text-rose-400 font-serif text-base leading-none select-none">“</span>
                        {plan.bestMemory || 'Loved every second together!'}
                        <span className="text-rose-400 font-serif text-base leading-none select-none">”</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[10px] sm:text-[11px] text-stone-400">
                      <span className="inline-flex items-center gap-1 font-medium bg-stone-50 px-2 py-0.5 rounded-full border border-stone-200/60">
                        <Shirt size={11} className="text-rose-500" /> Outfit: <strong className="text-stone-700">{plan.dressCode}</strong>
                      </span>
                      <span className="text-rose-500 font-semibold">Special Memory ✨</span>
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
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200 shadow-sm">
            <h3 className="text-sm sm:text-base font-bold text-stone-900 mb-0.5">Add to Date Wishlist</h3>
            <p className="text-xs text-stone-500 mb-3 sm:mb-4">Places or activities to try together</p>

            <form onSubmit={handleAddBucketItem} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                placeholder="e.g. Pottery Class, Stargazing"
                value={newBucketTitle}
                onChange={(e) => setNewBucketTitle(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-400 sm:col-span-2"
                required
              />
              <select
                value={newBucketVibe}
                onChange={(e) => setNewBucketVibe(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-medium"
              >
                <option>Cozy & Romantic</option>
                <option>Chill & Outdoor</option>
                <option>Fancy Dinner</option>
                <option>Fun & Adventurous</option>
              </select>
              <button type="submit" className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer">
                <Plus size={14} /> Add Idea
              </button>
              <input
                type="text"
                placeholder="Optional notes or must-try food..."
                value={newBucketNotes}
                onChange={(e) => setNewBucketNotes(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:col-span-4"
              />
            </form>
          </div>

          {bucketList.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-stone-200 shadow-sm">
              <BookmarkPlus size={32} className="mx-auto text-stone-300 mb-2" />
              <h3 className="font-bold text-xs sm:text-sm text-stone-800">Your Bucket List is empty</h3>
              <p className="text-xs text-stone-500 mt-1">Add places or dream date ideas above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
              {bucketList.map((item) => (
                <div key={item.id} className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">{item.vibe}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingBucketItem(item)}
                          className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                          title="Edit wishlist idea"
                        >
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => handleDeleteBucketItem(item.id)} className="text-stone-300 hover:text-rose-500 p-1 cursor-pointer" title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold text-sm text-stone-900">{item.title}</h4>
                    <p className="text-xs text-stone-500 mt-1">{item.notes}</p>
                  </div>

                  <button
                    onClick={() => {
                      setNewTitle(item.title);
                      setNewVibe(item.vibe);
                      setNewLocName(item.title);
                      handleDeleteBucketItem(item.id);
                      setIsModalOpen(true);
                    }}
                    className="mt-3.5 w-full py-2 bg-stone-900 hover:bg-rose-500 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    Convert to Planned Date <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* BILL SPLITTER TAB */}
      {activeTab === 'budget' && (
        <section className="max-w-5xl mx-auto mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-rose-500" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900">Couple Bill & Budget Splitter</h3>
                <p className="text-[10px] text-stone-500">Breakdown of how much {boyName} and {girlName} will pay or bring</p>
              </div>
            </div>

            {upcomingPlans.length > 0 ? (
              <select
                value={currentPlan?.id || ''}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold focus:ring-2 focus:ring-rose-400 cursor-pointer"
              >
                {upcomingPlans.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} ({p.date})</option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-stone-400 font-semibold">No active dates</span>
            )}
          </div>

          {!currentPlan ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-stone-200">
              <DollarSign size={32} className="mx-auto text-stone-300 mb-2" />
              <h3 className="font-bold text-xs sm:text-sm text-stone-800">No active date to calculate budget for</h3>
              <p className="text-xs text-stone-500 mt-1">Plan a date first in the Active tab!</p>
            </div>
          ) : (
            <>
              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm text-center">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Spent</p>
                  <p className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">₱{totalCost.toLocaleString()}</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">{currentBudget.length} expense item(s)</p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-blue-100 shadow-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{boyName} will bring / pay</p>
                  <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">₱{boyShare.toLocaleString()}</p>
                  <p className="text-[11px] text-blue-400 mt-0.5">
                    {totalCost > 0 ? `${Math.round((boyShare / totalCost) * 100)}% of total budget` : '0%'}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">{girlName} will bring / pay</p>
                  <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">₱{girlShare.toLocaleString()}</p>
                  <p className="text-[11px] text-rose-400 mt-0.5">
                    {totalCost > 0 ? `${Math.round((girlShare / totalCost) * 100)}% of total budget` : '0%'}
                  </p>
                </div>
              </div>

              {/* ADD EXPENSE SECTION */}
              <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200 shadow-sm">
                <h3 className="font-bold text-xs sm:text-sm text-stone-900 mb-3">Add Expense for "{currentPlan.title}"</h3>
                <form onSubmit={handleAddBudgetItem} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    placeholder="Item (e.g. Dinner, Cinema)"
                    value={newBudgetItem}
                    onChange={(e) => setNewBudgetItem(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-stone-200 text-xs"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Cost in ₱"
                    value={newBudgetCost}
                    onChange={(e) => setNewBudgetCost(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-stone-200 text-xs"
                    required
                  />

                  <select
                    value={newBudgetPaidBy}
                    onChange={(e) => setNewBudgetPaidBy(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-stone-200 text-xs cursor-pointer font-semibold"
                  >
                    <option value="50/50">🤝 Split 50 / 50 (Equally)</option>
                    <option value={boyName}>Treated / Paid by {boyName}</option>
                    <option value={girlName}>Treated / Paid by {girlName}</option>
                  </select>

                  <button type="submit" className="py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold cursor-pointer">
                    Add Expense
                  </button>
                </form>

                <div className="mt-6 border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="bg-stone-50 px-4 py-2.5 border-b border-stone-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-stone-800">
                      Expense Breakdown (Sorted: Highest to Lowest)
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium">All figures in PHP (₱)</span>
                  </div>

                  {sortedBudgetItems.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-6">No expenses added yet for this date.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-stone-100 bg-stone-50/60 text-stone-500 font-semibold text-[11px]">
                            <th className="py-2.5 px-3.5">Expense Item</th>
                            <th className="py-2.5 px-3.5">Cost</th>
                            <th className="py-2.5 px-3.5">Payment Mode</th>
                            <th className="py-2.5 px-3.5 text-blue-600 font-bold">{boyName} Pays</th>
                            <th className="py-2.5 px-3.5 text-rose-600 font-bold">{girlName} Pays</th>
                            <th className="py-2.5 px-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-stone-700">
                          {sortedBudgetItems.map((b) => {
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
                              <tr key={b.id} className="hover:bg-stone-50/80 transition-colors">
                                <td className="py-2.5 px-3.5 font-semibold text-stone-900">{b.item}</td>
                                <td className="py-2.5 px-3.5 font-bold">₱{b.cost.toLocaleString()}</td>
                                <td className="py-2.5 px-3.5">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${b.paidBy === '50/50'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : b.paidBy === boyName
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}>
                                    {b.paidBy === '50/50' ? '🤝 Split 50/50' : b.paidBy}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3.5 font-bold text-blue-600">₱{itemBoyCost.toLocaleString()}</td>
                                <td className="py-2.5 px-3.5 font-bold text-rose-600">₱{itemGirlCost.toLocaleString()}</td>
                                <td className="py-2.5 px-2 text-right">
                                  <button onClick={() => handleDeleteBudgetItem(b.id)} className="text-stone-300 hover:text-rose-600 p-1 cursor-pointer">
                                    <Trash2 size={13} />
                                  </button>
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
            className="w-full max-w-4xl bg-[#F5EFE6] rounded-3xl shadow-2xl border-4 border-[#E8DFD1] p-5 sm:p-8 relative overflow-hidden flex flex-col pointer-events-auto"
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
                {albumDates.map((_, i) => (
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
          <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-stone-900">Edit Wishlist Idea</h2>
              <button onClick={() => setEditingBucketItem(null)} className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateBucketItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editingBucketItem.title}
                  onChange={(e) => setEditingBucketItem({ ...editingBucketItem, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Theme / Vibe</label>
                <select
                  value={editingBucketItem.vibe}
                  onChange={(e) => setEditingBucketItem({ ...editingBucketItem, vibe: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs cursor-pointer"
                >
                  <option>Cozy & Romantic</option>
                  <option>Chill & Outdoor</option>
                  <option>Fancy Dinner</option>
                  <option>Fun & Adventurous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Notes</label>
                <textarea
                  value={editingBucketItem.notes}
                  onChange={(e) => setEditingBucketItem({ ...editingBucketItem, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs h-20 focus:ring-2 focus:ring-rose-500"
                  placeholder="Optional notes or must-try food..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingBucketItem(null)} className="px-3.5 py-1.5 text-xs text-stone-600 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-rose-500 text-white rounded-full text-xs font-bold shadow-xs cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-[9999]" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto relative z-[10000] pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">Plan a new date</h2>
                <p className="text-[11px] text-stone-500">Destination, vibe, outfit & stops</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Date Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sunday Blessing & Sunset Dinner"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Theme / Vibe</label>
                  <select
                    value={newVibe}
                    onChange={(e) => setNewVibe(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
                  >
                    <option>Cozy & Romantic</option>
                    <option>Fancy Dinner</option>
                    <option>Chill & Outdoor</option>
                    <option>Street Food Walk</option>
                    <option>Church & Coffee</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Pin Location</label>
                <div className="flex gap-1.5 mb-1.5">
                  <input
                    type="text"
                    placeholder="Search place..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                  <button type="button" onClick={handleSearchLocation} className="px-3.5 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-medium rounded-xl cursor-pointer">
                    {isSearching ? '...' : 'Find'}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Custom name for place (e.g. Skyline Cafe)"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white mb-1.5 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
                <div className="h-36 w-full rounded-2xl overflow-hidden border border-stone-200">
                  <MapContainer center={pinnedCoords} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapFlyToController centerCoords={mapCenterTarget} />
                    <LocationPicker position={pinnedCoords} setPosition={setPinnedCoords} />
                  </MapContainer>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-3.5 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" disabled={isUploadingGallery} className="px-5 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-full text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer">
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
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto relative z-[10000] pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base sm:text-lg font-bold text-stone-900">Edit Date Details</h2>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Date Title</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500" required />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Date</label>
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Theme</label>
                  <select value={editVibe} onChange={(e) => setEditVibe(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer">
                    <option>Cozy & Romantic</option>
                    <option>Fancy Dinner</option>
                    <option>Chill & Outdoor</option>
                    <option>Street Food Walk</option>
                    <option>Church & Coffee</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-stone-100">
                <button type="button" onClick={() => handleDeletePlan(editPlanId)} className="text-xs text-rose-600 font-semibold flex items-center gap-1 hover:bg-rose-50 p-2 rounded-lg cursor-pointer">
                  <Trash2 size={13} /> Delete Date
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-3.5 py-1.5 text-xs text-stone-600 cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-rose-500 text-white rounded-full text-xs font-medium cursor-pointer">Save Changes</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MARK DONE MODAL */}
      {isFinishModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-[9999]" onClick={(e) => { if (e.target === e.currentTarget) setIsFinishModalOpen(false); }}>
          <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 relative z-[10000] pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-base sm:text-lg font-bold text-stone-900">Mark Date as Done! 💕</h2>
              <button type="button" onClick={() => setIsFinishModalOpen(false)} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-stone-500 mb-3.5">Archive this memory into your scrapbook</p>

            <form onSubmit={handleCompleteDate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Rate this Date</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setFinishRating(star)} className="p-1 text-amber-400 cursor-pointer">
                      <Star size={22} fill={star <= finishRating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Upload Cover Photo (Polaroid Memory)</label>
                {finishMemoryPhoto ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-[16/9] border border-stone-200 group">
                    <img src={finishMemoryPhoto} alt="Memory preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setFinishMemoryPhoto(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-stone-200 hover:border-rose-400 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-stone-50/50 hover:bg-rose-50/30 transition-all">
                    {isUploadingMemoryPhoto ? <Loader2 size={22} className="animate-spin text-rose-500" /> : (
                      <>
                        <ImagePlus size={22} className="text-rose-400 mb-1" />
                        <span className="text-xs font-bold text-stone-700">Add cover selfie or photo!</span>
                        <span className="text-[10px] text-stone-400 mt-0.5">Click to choose image</span>
                      </>
                    )}
                    <input type="file" accept="image/*" disabled={isUploadingMemoryPhoto} onChange={(e) => handleMemoryPhotoUpload(e)} className="hidden" />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Our Favorite Memory / Note</label>
                <textarea value={finishMemory} onChange={(e) => setFinishMemory(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white h-20 focus:outline-hidden focus:ring-2 focus:ring-rose-500" placeholder="What was the highlight of our date?" required />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsFinishModalOpen(false)} className="px-3.5 py-1.5 text-xs text-stone-600 cursor-pointer">Cancel</button>
                <button type="submit" disabled={isUploadingMemoryPhoto} className="px-5 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-full text-xs font-bold shadow-xs cursor-pointer">
                  Save to Scrapbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}