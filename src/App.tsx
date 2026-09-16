import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Heart, Calendar, MapPin, Plus, Shirt, CheckSquare, ExternalLink,
  Navigation, Sparkles, Trash2, Camera, LogOut, User,
  Pencil, CloudSun, Dices, Clock, History, BookmarkPlus,
  DollarSign, Star, ArrowRight, CheckCircle2, Copy, Users, Check, X, Loader2, ImagePlus, KeyRound
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
  outfit_photos?: Record<string, string | null>;
  memory_photo?: string | null;
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

async function uploadToSupabaseStorage(file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `outfits/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('outfits')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

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

export default function App() {
  const [activeTab, setActiveTab] = useState<'planner' | 'history' | 'bucket' | 'budget'>('planner');

  // Multi-Couple Auth State
  const [coupleId, setCoupleId] = useState<string | null>(() => localStorage.getItem('dc_couple_id'));
  const [spaceCode, setSpaceCode] = useState<string | null>(() => localStorage.getItem('dc_space_code'));
  const [currentUser, setCurrentUser] = useState<string>(() => localStorage.getItem('dc_current_user') || '');
  const [partnerName, setPartnerName] = useState<string>(() => localStorage.getItem('dc_partner_name') || 'Partner');

  // Auth UI mode
  const [authMode, setAuthMode] = useState<'create' | 'join'>('join');
  const [yourNameInput, setYourNameInput] = useState('');
  const [partnerNameInput, setPartnerNameInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Date plans & Bucket list
  const [plans, setPlans] = useState<DatePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [bucketList, setBucketList] = useState<BucketItem[]>([]);
  const [newBucketTitle, setNewBucketTitle] = useState('');
  const [newBucketNotes, setNewBucketNotes] = useState('');
  const [newBucketVibe, setNewBucketVibe] = useState('Cozy & Romantic');

  // Location & App state
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Weather state
  const [weatherInfo, setWeatherInfo] = useState<{ temp: number; code: number } | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  // Roulette
  const [isSpinning, setIsSpinning] = useState(false);
  const [pickedIdea, setPickedIdea] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [finishingPlanTargetId, setFinishingPlanTargetId] = useState<string | null>(null);

  // Date helper
  const todayString = new Date().toISOString().split('T')[0];

  // New Date form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(todayString);
  const [newVibe, setNewVibe] = useState('Cozy & Romantic');
  const [newLocName, setNewLocName] = useState('');
  const [pinnedCoords, setPinnedCoords] = useState<[number, number]>([14.5995, 120.9842]);
  const [selectedOutfitType, setSelectedOutfitType] = useState(outfitPresets[0].label);
  const [newOutfitPhotos, setNewOutfitPhotos] = useState<Record<string, string | null>>({});
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Custom checklist items inside modal
  const [modalTasks, setModalTasks] = useState<string[]>([
    'Visit Church & Pray together',
    'Try cute cafe / coffee date'
  ]);
  const [taskInput, setTaskInput] = useState('');
  const [inlineTaskInput, setInlineTaskInput] = useState('');

  // Edit Date form state
  const [editPlanId, setEditPlanId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editVibe, setEditVibe] = useState('Cozy & Romantic');
  const [editLocName, setEditLocName] = useState('');
  const [editCoords, setEditCoords] = useState<[number, number] | null>(null);
  const [editOutfitType, setEditOutfitType] = useState(outfitPresets[0].label);

  // Finish memory state
  const [finishRating, setFinishRating] = useState(5);
  const [finishMemory, setFinishMemory] = useState('');
  const [finishMemoryPhoto, setFinishMemoryPhoto] = useState<string | null>(null);
  const [isUploadingMemoryPhoto, setIsUploadingMemoryPhoto] = useState(false);

  // Budget states
  const [newBudgetItem, setNewBudgetItem] = useState('');
  const [newBudgetCost, setNewBudgetCost] = useState('');
  const [newBudgetPaidBy, setNewBudgetPaidBy] = useState<'You' | 'Partner' | '50/50'>('50/50');

  // Search states for map
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenterTarget, setMapCenterTarget] = useState<[number, number] | null>(null);

  // Fetch plans from Supabase
  const fetchDatePlans = async (cId: string) => {
    const { data, error } = await supabase
      .from('date_plans')
      .select('*')
      .eq('couple_id', cId)
      .order('date', { ascending: true });

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
        outfit_photos: d.outfit_photos || {},
        memory_photo: d.memory_photo || null,
        tasks: d.tasks || [],
        completed: Boolean(d.completed),
        rating: d.rating,
        bestMemory: d.best_memory,
        budgetItems: d.budget_items || [],
      }));
      setPlans(formatted);
    }
  };

  // Fetch bucket list
  const fetchBucketList = async (cId: string) => {
    const { data, error } = await supabase
      .from('bucket_items')
      .select('*')
      .eq('couple_id', cId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBucketList(data);
    }
  };

  useEffect(() => {
    if (!coupleId) return;

    fetchDatePlans(coupleId);
    fetchBucketList(coupleId);

    const channel = supabase
      .channel('realtime_all_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'date_plans', filter: `couple_id=eq.${coupleId}` },
        () => fetchDatePlans(coupleId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bucket_items', filter: `couple_id=eq.${coupleId}` },
        () => fetchBucketList(coupleId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  const upcomingPlans = plans.filter((p) => !p.completed);
  const historyPlans = plans.filter((p) => Boolean(p.completed));
  const currentPlan = upcomingPlans.find((p) => p.id === selectedPlanId) || upcomingPlans[0] || null;

  const activeOutfitPreset = outfitPresets.find((p) => p.label === currentPlan?.dressCode) || outfitPresets[0];
  const activeOutfitImage = currentPlan?.outfit_photos?.[currentPlan?.dressCode] || activeOutfitPreset.defaultImage;

  // Weather fetch
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
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserCoords(coords);
        setPinnedCoords(coords);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (coupleId) locateUser();
  }, [coupleId]);

  // Auth: Create Space
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
      alert('Error creating space. Please try again.');
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
      setPlans([]);
      setBucketList([]);
    }
  };

  // Auth: Join Space - JUST PASTE THE CODE (Automated Partner Name Resolution)
  const handleJoinSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

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

    // Assign Creator as Partner and the Joiner as Partner 2 automatically!
    const loggedInUser = data.user2_name; // e.g. Loraine
    const otherPartner = data.user1_name; // e.g. Benidick

    localStorage.setItem('dc_couple_id', data.id);
    localStorage.setItem('dc_space_code', data.space_code);
    localStorage.setItem('dc_current_user', loggedInUser);
    localStorage.setItem('dc_partner_name', otherPartner);

    setCoupleId(data.id);
    setSpaceCode(data.space_code);
    setCurrentUser(loggedInUser);
    setPartnerName(otherPartner);
  };

  const handleLogout = () => {
    localStorage.clear();
    setCoupleId(null);
    setSpaceCode(null);
    setPlans([]);
    setBucketList([]);
  };

  const handleModalPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsUploadingPhoto(true);
    const permanentUrl = await uploadToSupabaseStorage(file);
    setIsUploadingPhoto(false);

    if (permanentUrl) {
      setNewOutfitPhotos((prev) => ({
        ...prev,
        [selectedOutfitType]: permanentUrl,
      }));
    }
  };

  const handleAddModalTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    setModalTasks([...modalTasks, taskInput.trim()]);
    setTaskInput('');
  };

  const handleRemoveModalTask = (index: number) => {
    setModalTasks(modalTasks.filter((_, i) => i !== index));
  };

  const handleOpenCreateModal = () => {
    const defaultCoords = userCoords || [14.5995, 120.9842];
    setPinnedCoords(defaultCoords);
    setMapCenterTarget(defaultCoords);
    setNewTitle('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewLocName('');
    setSearchQuery('');
    setNewOutfitPhotos({});
    setModalTasks(['Visit Church & Pray together', 'Try cute cafe / coffee date']);
    setIsModalOpen(true);
  };

  const handleCreateDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate || !coupleId) {
      alert('Please provide a Date Title and Date!');
      return;
    }

    const formattedTasks = modalTasks.map((t, idx) => ({
      id: Date.now() + idx,
      text: t,
      done: false,
    }));

    const coordsToSave = pinnedCoords || [14.5995, 120.9842];

    const { data, error } = await supabase.from('date_plans').insert([
      {
        couple_id: coupleId,
        title: newTitle.trim(),
        date: newDate,
        vibe: newVibe,
        location_name: newLocName.trim() || 'Pinned Destination',
        lat: coordsToSave[0],
        lng: coordsToSave[1],
        dress_code: selectedOutfitType,
        outfit_photos: newOutfitPhotos,
        completed: false,
        tasks: formattedTasks,
        budget_items: [],
      }
    ]).select().single();

    if (!error && data) {
      const newPlanObj: DatePlan = {
        id: data.id,
        couple_id: data.couple_id,
        title: data.title,
        date: data.date,
        vibe: data.vibe,
        locationName: data.location_name,
        lat: data.lat,
        lng: data.lng,
        dressCode: data.dress_code,
        outfit_photos: data.outfit_photos || {},
        memory_photo: null,
        tasks: data.tasks || [],
        completed: false,
        rating: 5,
        budgetItems: [],
      };

      setPlans((prev) => [...prev, newPlanObj]);
      setSelectedPlanId(data.id);
      setIsModalOpen(false);
      setActiveTab('planner');
      setNewTitle('');
      setNewLocName('');
    } else if (error) {
      alert('Failed to save date. Please try again!');
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
    setSearchQuery('');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle || !editDate || !editCoords || !editPlanId) return;

    setPlans((prev) =>
      prev.map((p) =>
        p.id === editPlanId
          ? {
            ...p,
            title: editTitle,
            date: editDate,
            vibe: editVibe,
            locationName: editLocName || 'Pinned Destination',
            lat: editCoords[0],
            lng: editCoords[1],
            dressCode: editOutfitType,
          }
          : p
      )
    );
    setIsEditModalOpen(false);

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
      })
      .eq('id', editPlanId);
  };

  const handleDeletePlan = async (planIdToDelete?: string) => {
    const targetId = planIdToDelete || currentPlan?.id;
    if (!targetId) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this date?');
    if (!confirmDelete) return;

    setPlans((prev) => prev.filter((p) => p.id !== targetId));
    setIsEditModalOpen(false);

    await supabase.from('date_plans').delete().eq('id', targetId);
  };

  const handleMemoryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, planId?: string) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsUploadingMemoryPhoto(true);
    const permanentUrl = await uploadToSupabaseStorage(file);
    setIsUploadingMemoryPhoto(false);

    if (permanentUrl) {
      if (planId) {
        setPlans((prev) =>
          prev.map((p) => (p.id === planId ? { ...p, memory_photo: permanentUrl } : p))
        );
        await supabase.from('date_plans').update({ memory_photo: permanentUrl }).eq('id', planId);
      } else {
        setFinishMemoryPhoto(permanentUrl);
      }
    }
  };

  const handleOpenFinishModal = (planId: string) => {
    setFinishingPlanTargetId(planId);
    setIsFinishModalOpen(true);
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
          ? {
            ...p,
            completed: true,
            rating: finishRating,
            bestMemory: finishMemory || 'Had an amazing day together! 💕',
            memory_photo: photoToSave,
          }
          : p
      )
    );

    setIsFinishModalOpen(false);
    setFinishMemory('');
    setFinishMemoryPhoto(null);
    setFinishingPlanTargetId(null);
    setActiveTab('history');

    await supabase
      .from('date_plans')
      .update({
        completed: true,
        rating: finishRating,
        best_memory: finishMemory || 'Had an amazing day together! 💕',
        memory_photo: photoToSave,
      })
      .eq('id', targetId);
  };

  const toggleTask = async (taskId: number) => {
    if (!currentPlan) return;
    const updatedTasks = currentPlan.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));

    setPlans((prev) =>
      prev.map((p) => (p.id === currentPlan.id ? { ...p, tasks: updatedTasks } : p))
    );

    await supabase
      .from('date_plans')
      .update({ tasks: updatedTasks })
      .eq('id', currentPlan.id);
  };

  const handleAddInlineTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTaskInput.trim() || !currentPlan) return;

    const newTask = {
      id: Date.now(),
      text: inlineTaskInput.trim(),
      done: false,
    };

    const updatedTasks = [...currentPlan.tasks, newTask];
    setInlineTaskInput('');

    setPlans((prev) =>
      prev.map((p) => (p.id === currentPlan.id ? { ...p, tasks: updatedTasks } : p))
    );

    await supabase
      .from('date_plans')
      .update({ tasks: updatedTasks })
      .eq('id', currentPlan.id);
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!currentPlan) return;
    const updatedTasks = currentPlan.tasks.filter((t) => t.id !== taskId);

    setPlans((prev) =>
      prev.map((p) => (p.id === currentPlan.id ? { ...p, tasks: updatedTasks } : p))
    );

    await supabase
      .from('date_plans')
      .update({ tasks: updatedTasks })
      .eq('id', currentPlan.id);
  };

  const handleUploadOutfitPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentPlan || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsUploadingPhoto(true);
    const permanentUrl = await uploadToSupabaseStorage(file);
    setIsUploadingPhoto(false);

    if (permanentUrl) {
      const updatedPhotos = {
        ...(currentPlan.outfit_photos || {}),
        [currentPlan.dressCode]: permanentUrl,
      };

      setPlans((prev) =>
        prev.map((p) => (p.id === currentPlan.id ? { ...p, outfit_photos: updatedPhotos } : p))
      );

      await supabase
        .from('date_plans')
        .update({ outfit_photos: updatedPhotos })
        .eq('id', currentPlan.id);
    }
  };

  const handleDeleteOutfitPhoto = async () => {
    if (!currentPlan) return;
    const updatedPhotos = { ...(currentPlan.outfit_photos || {}) };
    delete updatedPhotos[currentPlan.dressCode];

    setPlans((prev) =>
      prev.map((p) => (p.id === currentPlan.id ? { ...p, outfit_photos: updatedPhotos } : p))
    );

    await supabase
      .from('date_plans')
      .update({ outfit_photos: updatedPhotos })
      .eq('id', currentPlan.id);
  };

  const handleSelectOutfitType = async (label: string) => {
    if (!currentPlan) return;
    setPlans((prev) =>
      prev.map((p) => (p.id === currentPlan.id ? { ...p, dressCode: label } : p))
    );

    await supabase
      .from('date_plans')
      .update({ dress_code: label })
      .eq('id', currentPlan.id);
  };

  const handleAddBucketItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketTitle.trim() || !coupleId) return;

    const tempId = String(Date.now());
    const newItem: BucketItem = {
      id: tempId,
      couple_id: coupleId,
      title: newBucketTitle.trim(),
      vibe: newBucketVibe,
      notes: newBucketNotes.trim() || 'Excited for this date!',
    };

    setBucketList((prev) => [newItem, ...prev]);
    setNewBucketTitle('');
    setNewBucketNotes('');

    const { data } = await supabase.from('bucket_items').insert([
      {
        couple_id: coupleId,
        title: newItem.title,
        vibe: newItem.vibe,
        notes: newItem.notes,
      }
    ]).select().single();

    if (data) {
      setBucketList((prev) => prev.map((item) => (item.id === tempId ? data : item)));
    }
  };

  const handleDeleteBucketItem = async (id: string) => {
    setBucketList((prev) => prev.filter((b) => b.id !== id));
    await supabase.from('bucket_items').delete().eq('id', id);
  };

  const handleConvertBucketToPlan = (bucket: BucketItem) => {
    setNewTitle(bucket.title);
    setNewVibe(bucket.vibe);
    setNewLocName(bucket.title);
    handleDeleteBucketItem(bucket.id);
    setIsModalOpen(true);
  };

  const handleAddBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetItem || !newBudgetCost || !currentPlan) return;

    const costNum = parseFloat(newBudgetCost);
    if (isNaN(costNum)) return;

    const updated = [
      ...(currentPlan.budgetItems || []),
      { id: Date.now(), item: newBudgetItem, cost: costNum, paidBy: newBudgetPaidBy },
    ];

    setPlans((prev) =>
      prev.map((p) => (p.id === currentPlan.id ? { ...p, budgetItems: updated } : p))
    );
    setNewBudgetItem('');
    setNewBudgetCost('');

    await supabase
      .from('date_plans')
      .update({ budget_items: updated })
      .eq('id', currentPlan.id);
  };

  const handleDeleteBudgetItem = async (itemId: number) => {
    if (!currentPlan) return;
    const updated = (currentPlan.budgetItems || []).filter((b) => b.id !== itemId);

    setPlans((prev) =>
      prev.map((p) => (p.id === currentPlan.id ? { ...p, budgetItems: updated } : p))
    );

    await supabase.from('date_plans').update({ budget_items: updated }).eq('id', currentPlan.id);
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
        alert('Location not found. Try typing a landmark or city!');
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

  // LOGIN SCREEN (SIMPLIFIED: JOINING ONLY REQUIRES THE CODE)
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
              type="button"
              onClick={() => setAuthMode('join')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${authMode === 'join' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
                }`}
            >
              Join Partner's Code
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('create')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${authMode === 'create' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
                }`}
            >
              Create Couple Space
            </button>
          </div>

          {authMode === 'join' ? (
            <form onSubmit={handleJoinSpace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Couple Space Code</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-3 text-stone-400" />
                  <input
                    type="text"
                    placeholder="e.g. LOVE-1964"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-mono uppercase tracking-wider text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1.5">
                  Paste the code from your partner. Names and memories will sync automatically!
                </p>
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full mt-2 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAuthLoading ? 'Connecting...' : 'Connect to Our Space'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Your Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-stone-400" />
                  <input
                    type="text"
                    placeholder="e.g. Benidick"
                    value={yourNameInput}
                    onChange={(e) => setYourNameInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
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
                    placeholder="e.g. Loraine"
                    value={partnerNameInput}
                    onChange={(e) => setPartnerNameInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full mt-2 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAuthLoading ? 'Creating Couple Space...' : 'Create Space & Generate Code'}
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
                className="hover:text-rose-500 cursor-pointer"
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
            className="flex items-center gap-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 px-3.5 py-2 rounded-full font-medium text-xs shadow-sm cursor-pointer"
          >
            <Navigation size={14} className={isLocating ? 'animate-spin text-blue-500' : 'text-blue-600'} />
            {isLocating ? 'Locating...' : 'My Live Location'}
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-full font-medium text-xs shadow-sm cursor-pointer"
          >
            <Plus size={16} /> Plan a new date
          </button>

          <button
            onClick={handleLogout}
            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Navigation Tabs with Dynamic Correct Counts */}
      <div className="max-w-5xl mx-auto mt-4 flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('planner')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'planner'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
        >
          <Calendar size={14} /> Active Dates ({upcomingPlans.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'history'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
        >
          <History size={14} /> Date Archive & Memories ({historyPlans.length})
        </button>

        <button
          onClick={() => setActiveTab('bucket')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'bucket'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
        >
          <BookmarkPlus size={14} /> Bucket List ({bucketList.length})
        </button>

        <button
          onClick={() => setActiveTab('budget')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'budget'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
        >
          <DollarSign size={14} /> Budget & Bill Splitter
        </button>
      </div>

      {/* ACTIVE DATE PLANNER TAB */}
      {activeTab === 'planner' && (
        <>
          {upcomingPlans.length === 0 ? (
            <div className="max-w-xl mx-auto my-16 bg-white rounded-3xl p-10 text-center border border-stone-200 shadow-sm">
              <div className="inline-flex p-4 bg-rose-50 rounded-full text-rose-500 mb-4">
                <Calendar size={32} />
              </div>
              <h2 className="text-lg font-bold text-stone-900">No active date planned right now!</h2>
              <p className="text-xs text-stone-500 mt-1 mb-6">
                You have finished all planned dates! Start by planning a new date together.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} /> Plan a New Date
              </button>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto mt-6 space-y-6">
              {upcomingPlans.length > 1 && (
                <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-stone-800">Your Active Dates ({upcomingPlans.length}):</span>
                    <p className="text-[11px] text-stone-400">Click any date to switch and view its details</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {upcomingPlans.map((plan) => {
                      const isSelected = (currentPlan?.id === plan.id);
                      return (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${isSelected
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                            }`}
                        >
                          <Calendar size={12} />
                          <span>{plan.title}</span>
                          <span className="text-[10px] opacity-80">({plan.date})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-6">
                  {currentPlan && (
                    <>
                      <div
                        onClick={() => handleOpenEditModal(currentPlan)}
                        className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group relative"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-block bg-rose-100 text-rose-700 text-xs px-3 py-1 rounded-full font-semibold">
                            {currentPlan.vibe}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePlan(currentPlan.id);
                              }}
                              className="text-stone-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete this date plan"
                            >
                              <Trash2 size={14} />
                            </button>
                            <span className="flex items-center gap-1 text-xs font-semibold text-stone-400 group-hover:text-rose-500 transition-colors">
                              <Pencil size={13} />
                              <span>Edit</span>
                            </span>
                          </div>
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
                            className="w-14 h-14 rounded-xl object-cover border border-stone-200 flex-shrink-0 shadow-2xs"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">Chosen Outfit For Date</p>
                            <p className="text-xs font-bold text-stone-800 truncate">{currentPlan.dressCode}</p>
                            <p className="text-[11px] text-stone-500 truncate">{activeOutfitPreset.desc}</p>
                          </div>
                          <span className="p-1.5 bg-white rounded-full text-rose-500 shadow-2xs">
                            <Sparkles size={14} />
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

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePlan(currentPlan.id);
                              }}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                              title="Delete Date Plan"
                            >
                              <Trash2 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFinishModal(currentPlan.id);
                              }}
                              className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-semibold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 size={14} /> Mark as Done
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* OUTFIT GALLERY */}
                      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shirt size={18} className="text-rose-500" />
                            <h3 className="font-bold text-sm text-stone-900">Outfit Inspiration</h3>
                          </div>
                          <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles size={11} />
                            {currentPlan.dressCode}
                          </span>
                        </div>

                        <div className="relative overflow-hidden rounded-2xl border border-stone-200 aspect-[4/3] bg-stone-100 group shadow-inner">
                          <img
                            src={activeOutfitImage}
                            alt={currentPlan.dressCode}
                            className="w-full h-full object-cover transition-all duration-300"
                          />

                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                            <label
                              className="p-2 bg-black/60 hover:bg-stone-900 text-white rounded-full transition-colors backdrop-blur-xs shadow cursor-pointer flex items-center justify-center"
                              title="Upload custom outfit photo permanently"
                            >
                              {isUploadingPhoto ? (
                                <Loader2 size={15} className="animate-spin text-rose-400" />
                              ) : (
                                <Camera size={15} />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isUploadingPhoto}
                                onChange={handleUploadOutfitPhoto}
                                className="hidden"
                              />
                            </label>

                            {currentPlan.outfit_photos?.[currentPlan.dressCode] && (
                              <button
                                type="button"
                                onClick={handleDeleteOutfitPhoto}
                                className="p-2 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors backdrop-blur-xs shadow cursor-pointer"
                                title="Revert to preset photo"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>

                          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-xl text-white text-[10px] font-medium flex items-center gap-1">
                            <Camera size={11} />
                            {currentPlan.outfit_photos?.[currentPlan.dressCode]
                              ? 'Permanent cloud photo'
                              : 'Preset Style'}
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-bold text-stone-400 mb-2 uppercase tracking-wider">
                            Switch Outfit Vibe
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {outfitPresets.map((preset) => {
                              const isSelected = currentPlan.dressCode === preset.label;
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => handleSelectOutfitType(preset.label)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${isSelected
                                      ? 'bg-rose-500 text-white border-rose-500 shadow-xs font-semibold'
                                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
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

                      {/* ITINERARY & PREP CHECKLIST */}
                      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckSquare size={18} className="text-rose-500" />
                            <h3 className="font-bold text-sm">Where To Go & Checklist</h3>
                          </div>
                          <span className="text-[11px] text-stone-400 font-semibold">
                            {currentPlan.tasks.filter((t) => t.done).length}/{currentPlan.tasks.length} Done
                          </span>
                        </div>

                        <div className="space-y-2">
                          {currentPlan.tasks.length === 0 ? (
                            <p className="text-xs text-stone-400 italic">No checklist items yet. Add one below!</p>
                          ) : (
                            currentPlan.tasks.map((task) => (
                              <div key={task.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 group">
                                <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={task.done}
                                    onChange={() => toggleTask(task.id)}
                                    className="accent-rose-500 rounded w-4 h-4 cursor-pointer"
                                  />
                                  <span className={`truncate ${task.done ? 'line-through text-stone-400 font-medium' : 'font-semibold text-stone-800'}`}>
                                    {task.text}
                                  </span>
                                </label>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-stone-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 p-1 transition-opacity cursor-pointer"
                                  title="Delete task"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        <form onSubmit={handleAddInlineTask} className="flex gap-2 pt-2 border-t border-stone-100">
                          <input
                            type="text"
                            placeholder="e.g. Visit Church, Cafe, Arcades..."
                            value={inlineTaskInput}
                            onChange={(e) => setInlineTaskInput(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-400"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-stone-900 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                        </form>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Column: Weather, Roulette, Map */}
                {currentPlan && (
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
                          className="px-3 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 flex-shrink-0 cursor-pointer"
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
                )}
              </main>
            </div>
          )}
        </>
      )}

      {/* ARCHIVE TAB (POLAROID COUPLE SCRAPBOOK) */}
      {activeTab === 'history' && (
        <section className="max-w-5xl mx-auto mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                Our Date Scrapbook 💕
              </h2>
              <p className="text-xs text-stone-500">Every single date, preserved like polaroids of our story</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-rose-100 text-rose-700 rounded-full">
              {historyPlans.length} Finished
            </span>
          </div>

          {historyPlans.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm">
              <History size={36} className="mx-auto text-stone-300 mb-2" />
              <h3 className="font-bold text-sm text-stone-800">No date memories archived yet</h3>
              <p className="text-xs text-stone-500 mt-1">When you finish a date, click "Mark as Done" in the planner to keep it in this scrapbook!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {historyPlans.map((plan) => {
                const memoryDisplayPhoto = plan.memory_photo ||
                  plan.outfit_photos?.[plan.dressCode] ||
                  'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80';

                return (
                  <div
                    key={plan.id}
                    className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-md hover:shadow-xl transition-all duration-300 relative group flex flex-col justify-between"
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-amber-100/80 border border-amber-200/60 rounded-xs -rotate-2 shadow-2xs pointer-events-none" />

                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-rose-50 text-stone-300 hover:text-rose-600 rounded-full transition-colors shadow-2xs z-10 cursor-pointer"
                      title="Delete archived memory"
                    >
                      <Trash2 size={15} />
                    </button>

                    <div>
                      <div className="bg-stone-50 p-4 pb-6 rounded-2xl border border-stone-200/80 shadow-inner relative group/photo">
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-200">
                          <img
                            src={memoryDisplayPhoto}
                            alt={plan.title}
                            className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-500"
                          />

                          <label
                            className="absolute bottom-2.5 right-2.5 p-2 bg-black/60 hover:bg-stone-900 text-white rounded-full transition-colors shadow backdrop-blur-xs cursor-pointer flex items-center justify-center"
                            title="Replace or upload date picture"
                          >
                            {isUploadingMemoryPhoto ? (
                              <Loader2 size={14} className="animate-spin text-rose-400" />
                            ) : (
                              <Camera size={14} />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingMemoryPhoto}
                              onChange={(e) => handleMemoryPhotoUpload(e, plan.id)}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div className="mt-3 text-center flex items-center justify-center gap-2 text-stone-500 font-mono text-[11px]">
                          <span>🗓️ {plan.date}</span>
                          <span>•</span>
                          <span className="text-rose-600 font-semibold">{plan.locationName}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <h3 className="font-bold text-lg text-stone-900 tracking-tight">{plan.title}</h3>
                        <div className="flex items-center text-amber-400">
                          {[...Array(plan.rating || 5)].map((_, i) => (
                            <Star key={i} size={15} fill="currentColor" />
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100 text-xs text-stone-700 italic relative">
                        <span className="text-rose-400 font-serif text-lg leading-none select-none">“</span>
                        {plan.bestMemory || 'Loved every second together!'}
                        <span className="text-rose-400 font-serif text-lg leading-none select-none">”</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                      <span className="inline-flex items-center gap-1 font-medium bg-stone-50 px-2.5 py-1 rounded-full border border-stone-200/60">
                        <Shirt size={12} className="text-rose-500" />
                        Outfit: <strong className="text-stone-700">{plan.dressCode}</strong>
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

      {/* BUCKET LIST TAB */}
      {activeTab === 'bucket' && (
        <section className="max-w-5xl mx-auto mt-6 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
            <h3 className="text-base font-bold text-stone-900 mb-1">Add to Our Date Wishlist</h3>
            <p className="text-xs text-stone-500 mb-4">Places or activities you want to try together someday</p>

            <form onSubmit={handleAddBucketItem} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="e.g. Pottery Class, Stargazing"
                value={newBucketTitle}
                onChange={(e) => setNewBucketTitle(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-400 sm:col-span-2"
                required
              />
              <select
                value={newBucketVibe}
                onChange={(e) => setNewBucketVibe(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-stone-200 text-xs font-medium"
              >
                <option>Cozy & Romantic</option>
                <option>Chill & Outdoor</option>
                <option>Fancy Dinner</option>
                <option>Fun & Adventurous</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} /> Add Idea
              </button>
              <input
                type="text"
                placeholder="Optional notes or must-try food..."
                value={newBucketNotes}
                onChange={(e) => setNewBucketNotes(e.target.value)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs sm:col-span-4"
              />
            </form>
          </div>

          {bucketList.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm">
              <BookmarkPlus size={36} className="mx-auto text-stone-300 mb-2" />
              <h3 className="font-bold text-sm text-stone-800">Your Bucket List is empty</h3>
              <p className="text-xs text-stone-500 mt-1">Add places or dream date ideas above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {bucketList.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                        {item.vibe}
                      </span>
                      <button
                        onClick={() => handleDeleteBucketItem(item.id)}
                        className="text-stone-300 hover:text-rose-500 p-1 cursor-pointer"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                    <h4 className="font-bold text-sm text-stone-900">{item.title}</h4>
                    <p className="text-xs text-stone-500 mt-1">{item.notes}</p>
                  </div>

                  <button
                    onClick={() => handleConvertBucketToPlan(item)}
                    className="mt-4 w-full py-2 bg-stone-900 hover:bg-rose-500 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    Convert to Planned Date <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* BUDGET & BILL SPLITTER TAB */}
      {activeTab === 'budget' && (
        <section className="max-w-5xl mx-auto mt-6 space-y-6">
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <DollarSign size={20} className="text-rose-500" />
              <div>
                <h3 className="text-sm font-bold text-stone-900">Select Date for Budget Tracking</h3>
                <p className="text-xs text-stone-500">Pick which planned date you are splitting expenses for</p>
              </div>
            </div>

            {upcomingPlans.length > 0 ? (
              <select
                value={currentPlan?.id || ''}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-semibold focus:ring-2 focus:ring-rose-400 cursor-pointer"
              >
                {upcomingPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.date})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-stone-400 font-semibold">No active dates available</span>
            )}
          </div>

          {!currentPlan ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
              <DollarSign size={36} className="mx-auto text-stone-300 mb-2" />
              <h3 className="font-bold text-sm text-stone-800">No active date to calculate budget for</h3>
              <p className="text-xs text-stone-500 mt-1">Please plan a date first in the Active Dates tab!</p>
            </div>
          ) : (
            <>
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
                <h3 className="font-bold text-sm text-stone-900 mb-3">Add Expense for "{currentPlan.title}"</h3>
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
                    className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs cursor-pointer"
                  >
                    <option value="50/50">Split 50 / 50</option>
                    <option value="You">Treated by {currentUser}</option>
                    <option value="Partner">Treated by {partnerName}</option>
                  </select>
                  <button
                    type="submit"
                    className="py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
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
                          <button onClick={() => handleDeleteBudgetItem(b.id)} className="text-stone-400 hover:text-rose-600 cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* CREATE DATE MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto relative z-[10000] pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Plan a new date</h2>
                <p className="text-xs text-stone-500">Pick destination, vibe, outfit, and places to visit</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Date Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sunday Blessing & Sunset Dinner"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Theme / Vibe</label>
                  <select
                    value={newVibe}
                    onChange={(e) => setNewVibe(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
                  >
                    <option>Cozy & Romantic</option>
                    <option>Fancy Dinner</option>
                    <option>Chill & Outdoor</option>
                    <option>Street Food Walk</option>
                    <option>Church & Coffee</option>
                  </select>
                </div>
              </div>

              {/* Visual Outfit Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-stone-700">
                    Choose Outfit Style for this Date
                  </label>
                  <label className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-full border border-rose-200 cursor-pointer">
                    {isUploadingPhoto ? (
                      <Loader2 size={12} className="animate-spin text-rose-500" />
                    ) : (
                      <Camera size={12} />
                    )}
                    <span>{isUploadingPhoto ? 'Uploading...' : 'Upload Custom Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingPhoto}
                      onChange={handleModalPhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1">
                  {outfitPresets.map((preset) => {
                    const isSelected = selectedOutfitType === preset.label;
                    const previewImage = newOutfitPhotos[preset.label] || preset.defaultImage;

                    return (
                      <div
                        key={preset.id}
                        onClick={() => setSelectedOutfitType(preset.label)}
                        className={`p-2 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${isSelected
                            ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                            : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                          }`}
                      >
                        <img
                          src={previewImage}
                          alt={preset.label}
                          className="w-12 h-12 rounded-xl object-cover border border-stone-200 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-stone-800 truncate">{preset.label}</p>
                          <p className="text-[10px] text-stone-500 truncate">{preset.desc}</p>
                          {newOutfitPhotos[preset.label] && (
                            <span className="text-[9px] text-rose-600 font-semibold">Custom uploaded</span>
                          )}
                        </div>
                        {isSelected && (
                          <span className="p-1 bg-rose-500 text-white rounded-full flex-shrink-0">
                            <Check size={12} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Checklist Stops */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-800">
                    Where To Go Checklist (Itinerary Stops)
                  </label>
                  <span className="text-[11px] text-stone-400">{modalTasks.length} stops planned</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {modalTasks.map((task, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 text-stone-700 text-xs rounded-xl shadow-2xs"
                    >
                      <CheckSquare size={13} className="text-rose-500" />
                      <span>{task}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveModalTask(idx)}
                        className="hover:text-rose-500 text-stone-400 ml-1 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Church, Milk tea, Arcade..."
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (taskInput.trim()) {
                          setModalTasks([...modalTasks, taskInput.trim()]);
                          setTaskInput('');
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddModalTask}
                    className="px-4 py-2 bg-stone-900 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    + Add Stop
                  </button>
                </div>
              </div>

              {/* Location search & Pin */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Search & Pin Location</label>
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    placeholder="Search place or landmark..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleSearchLocation(e, false)}
                    className="px-3.5 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-medium rounded-xl cursor-pointer"
                  >
                    {isSearching ? '...' : 'Find'}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Custom name for place (e.g. Skyline Cafe / Church)"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white mb-2 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
                <div className="h-44 w-full rounded-2xl overflow-hidden border border-stone-200">
                  <MapContainer center={pinnedCoords} zoom={12} style={{ height: '100%', width: '100%' }}>
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
                  className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingPhoto}
                  className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-full text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isUploadingPhoto ? 'Uploading Image...' : 'Save Date Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditModalOpen(false);
          }}
        >
          <div
            className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto relative z-[10000] pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-stone-900">Edit Date Details</h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Date Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
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
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Theme</label>
                  <select
                    value={editVibe}
                    onChange={(e) => setEditVibe(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
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
                <label className="block text-xs font-semibold text-stone-700 mb-1">Outfit Theme</label>
                <select
                  value={editOutfitType}
                  onChange={(e) => setEditOutfitType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium text-stone-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {outfitPresets.map((p) => (
                    <option key={p.id} value={p.label}>{p.label} - {p.desc}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => handleDeletePlan(editPlanId)}
                  className="text-xs text-rose-600 font-semibold flex items-center gap-1 hover:bg-rose-50 p-2 rounded-lg cursor-pointer"
                >
                  <Trash2 size={14} /> Delete Date
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-xs text-stone-600 cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-rose-500 text-white rounded-full text-xs font-medium cursor-pointer">Save Changes</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MARK DONE MODAL */}
      {isFinishModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFinishModalOpen(false);
          }}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-stone-200 relative z-[10000] pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg font-bold text-stone-900">Mark Date as Done! 💕</h2>
              <button
                type="button"
                onClick={() => setIsFinishModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-stone-500 mb-4">This will archive this date into your scrapbook</p>

            <form onSubmit={handleCompleteDate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Rate this Date</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFinishRating(star)}
                      className="p-1 text-amber-400 cursor-pointer"
                    >
                      <Star size={24} fill={star <= finishRating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Upload Our Date Photo (Polaroid Memory)
                </label>

                {finishMemoryPhoto ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-[16/9] border border-stone-200 group">
                    <img src={finishMemoryPhoto} alt="Memory preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFinishMemoryPhoto(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-stone-200 hover:border-rose-400 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer bg-stone-50/50 hover:bg-rose-50/30 transition-all">
                    {isUploadingMemoryPhoto ? (
                      <Loader2 size={24} className="animate-spin text-rose-500" />
                    ) : (
                      <>
                        <ImagePlus size={24} className="text-rose-400 mb-1" />
                        <span className="text-xs font-bold text-stone-700">Add a selfie or photo from the date!</span>
                        <span className="text-[10px] text-stone-400 mt-0.5">Click to choose image</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingMemoryPhoto}
                      onChange={(e) => handleMemoryPhotoUpload(e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Our Favorite Memory / Note</label>
                <textarea
                  value={finishMemory}
                  onChange={(e) => setFinishMemory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white h-20 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  placeholder="What was the most special highlight of our date?"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsFinishModalOpen(false)} className="px-4 py-2 text-xs text-stone-600 cursor-pointer">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingMemoryPhoto}
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-full text-xs font-bold shadow-xs cursor-pointer"
                >
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