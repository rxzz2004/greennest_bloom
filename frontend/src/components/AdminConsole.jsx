import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  FileText, 
  Truck, 
  RefreshCw, 
  Mail, 
  Users, 
  Plus, 
  ExternalLink, 
  Check, 
  MapPin, 
  BatteryCharging, 
  Phone, 
  Navigation, 
  Radio, 
  UserCheck,
  LayoutDashboard,
  ChevronRight,
  Menu,
  Search,
  Bell,
  ChevronDown,
  ShoppingCart,
  IndianRupee,
  Heart,
  Trash2,
  Edit3,
  Eye,
  AlertTriangle,
  KeyRound,
  ShieldAlert,
  Leaf,
  Image,
  Upload,
  Tag,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import { api } from '../api';
import { soundEffects } from '../utils/audio';
import CourierPortal from './CourierPortal';

export default function AdminConsole({ onOpenLiveTrackingModal, onProductsUpdated, currentTheme = 'rose' }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCourierPortal, setShowCourierPortal] = useState(false);
  const [courierModalDriverId, setCourierModalDriverId] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [salesTimeRange, setSalesTimeRange] = useState('month');
  const [todoList, setTodoList] = useState([
    { id: 1, text: 'Check morning fresh flower shipments', completed: false },
    { id: 2, text: 'Verify active delivery routes', completed: true },
    { id: 3, text: 'Review subscription curations for Indiranagar', completed: false },
    { id: 4, text: 'Update clearance prices on mature batches', completed: true },
  ]);
  const [newTodoInput, setNewTodoInput] = useState('');

  const handleToggleTodo = (id) => {
    soundEffects.playClick();
    setTodoList(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTodo = (id) => {
    soundEffects.playClick();
    setTodoList(prev => prev.filter(t => t.id !== id));
  };

  const handleAddTodo = (e) => {
    if (e.key === 'Enter' && newTodoInput.trim()) {
      soundEffects.playSuccessChime();
      setTodoList(prev => [...prev, { id: Date.now(), text: newTodoInput.trim(), completed: false }]);
      setNewTodoInput('');
    }
  };

  const [batches, setBatches] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [curationMetrics, setCurationMetrics] = useState(null);
  const [inventoryHealth, setInventoryHealth] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Delivery State
  const [drivers, setDrivers] = useState([]);
  const [fleetSummary, setFleetSummary] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [autoSimulateFleet, setAutoSimulateFleet] = useState(false);
  const [isTicking, setIsTicking] = useState(false);
  const [driverUpdatingId, setDriverUpdatingId] = useState(null);

  // Customers Directory State
  const [usersList, setUsersList] = useState([]);
  const [userFilter, setUserFilter] = useState('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Map DOM & Instance Refs
  const fleetMapContainerRef = useRef(null);
  const fleetMapInstanceRef = useRef(null);
  const driverMarkersRef = useRef({});
  const depotMarkerRef = useRef(null);

  // Manual override state
  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideDiscount, setOverrideDiscount] = useState(25);

  // Log incoming harvest modal
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [harvestSubmitting, setHarvestSubmitting] = useState(false);
  const [harvestForm, setHarvestForm] = useState({
    product_id: 1,
    batch_code: `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-OOTY`,
    harvest_date: new Date().toISOString().slice(0, 10),
    quantity: 250,
    vase_life_days: 5,
    farm_origin: 'Nilgiris High-Altitude Polyhouse #3'
  });

  // Edit Batch state
  const [editingBatch, setEditingBatch] = useState(null);
  const [editBatchForm, setEditBatchForm] = useState({
    batch_code: '',
    harvest_date: '',
    remaining_quantity: 0,
    initial_quantity: 0,
    vase_life_days: 5,
    discount_percent: 0,
    status: 'fresh'
  });
  const [batchActionSubmitting, setBatchActionSubmitting] = useState(false);

  // Selected email alert preview modal & filtering
  const [selectedAlertModal, setSelectedAlertModal] = useState(null);
  const [alertFilter, setAlertFilter] = useState('all');

  // Stems & Plants Inventory Management State
  const [newPlantName, setNewPlantName] = useState('');
  const [newBotanicalName, setNewBotanicalName] = useState('');
  const [newPlantCategory, setNewPlantCategory] = useState('Living Nursery Plants');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [newIsPerishable, setNewIsPerishable] = useState(false);
  const [newPlantPrice, setNewPlantPrice] = useState('');
  const [newPlantStock, setNewPlantStock] = useState('50');
  const [newPlantImages, setNewPlantImages] = useState(['/pink_lily_bloom.jpg']);
  const [newPlantImageUrlInput, setNewPlantImageUrlInput] = useState('');
  const [newPlantDescription, setNewPlantDescription] = useState('');
  const [newSunlight, setNewSunlight] = useState('Bright Indirect Light');
  const [newWatering, setNewWatering] = useState('Water when topsoil feels dry');
  const [newVaseLife, setNewVaseLife] = useState('7');
  const [isSubmittingPlant, setIsSubmittingPlant] = useState(false);
  const [plantFeedbackMsg, setPlantFeedbackMsg] = useState(null);
  const [plantSearchQuery, setPlantSearchQuery] = useState('');
  const [plantCategoryFilter, setPlantCategoryFilter] = useState('all');
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    botanical_name: '',
    category: '',
    is_perishable: false,
    base_price: '',
    stock_quantity: '50',
    image_url: '',
    images: [],
    floriography_meaning: '',
    sunlight_requirement: '',
    watering_frequency: '',
    vase_life_days: '5'
  });
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [editProductImageUrlInput, setEditProductImageUrlInput] = useState('');

  // Sync adminSearchQuery with plantSearchQuery & userSearchQuery
  useEffect(() => {
    if (adminSearchQuery) {
      setPlantSearchQuery(adminSearchQuery);
      setUserSearchQuery(adminSearchQuery);
    }
  }, [adminSearchQuery]);

  // Cross-module search match counts across all modules
  const moduleMatchCounts = useMemo(() => {
    if (!adminSearchQuery.trim()) return null;
    const q = adminSearchQuery.trim().toLowerCase();

    const deliveryCount = drivers.filter(d => 
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.vanNumber && d.vanNumber.toLowerCase().includes(q)) ||
      (d.phone && d.phone.toLowerCase().includes(q)) ||
      (d.status && d.status.toLowerCase().includes(q)) ||
      (d.operatingZone && d.operatingZone.toLowerCase().includes(q)) ||
      (d.currentHub && d.currentHub.toLowerCase().includes(q)) ||
      (d.currentParcels && d.currentParcels.some(p => 
        (p.customerName && p.customerName.toLowerCase().includes(q)) ||
        (p.destination && p.destination.toLowerCase().includes(q)) ||
        (p.orderId && String(p.orderId).toLowerCase().includes(q)) ||
        (p.trackingId && p.trackingId.toLowerCase().includes(q))
      ))
    ).length;

    const quotesCount = quotations.filter(item =>
      (item.company_name && item.company_name.toLowerCase().includes(q)) ||
      (item.client_name && item.client_name.toLowerCase().includes(q)) ||
      (item.contact_email && item.contact_email.toLowerCase().includes(q)) ||
      (item.event_type && item.event_type.toLowerCase().includes(q)) ||
      (item.venue_address && item.venue_address.toLowerCase().includes(q)) ||
      (item.status && item.status.toLowerCase().includes(q)) ||
      (item.id && String(item.id).includes(q)) ||
      (item.estimated_amount && String(item.estimated_amount).includes(q))
    ).length;

    const usersCount = usersList.filter(u =>
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.company_name && u.company_name.toLowerCase().includes(q)) ||
      (u.gstin && u.gstin.toLowerCase().includes(q)) ||
      (u.user_type && u.user_type.toLowerCase().includes(q))
    ).length;

    const alertsCount = alerts.filter(a =>
      (a.subject && a.subject.toLowerCase().includes(q)) ||
      (a.body && a.body.toLowerCase().includes(q)) ||
      (a.alert_type && a.alert_type.toLowerCase().includes(q)) ||
      (a.recipient && a.recipient.toLowerCase().includes(q)) ||
      (a.id && String(a.id).includes(q))
    ).length;

    const plantsCount = products.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.botanical_name && p.botanical_name.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.floriography_meaning && p.floriography_meaning.toLowerCase().includes(q)) ||
      (p.id && String(p.id).includes(q))
    ).length;

    const batchesCount = batches.filter(b =>
      (b.batch_code && b.batch_code.toLowerCase().includes(q)) ||
      (b.product_name && b.product_name.toLowerCase().includes(q)) ||
      (b.status && b.status.toLowerCase().includes(q)) ||
      (b.farm_origin && b.farm_origin.toLowerCase().includes(q)) ||
      (b.id && String(b.id).includes(q))
    ).length;

    return {
      delivery_fleet: deliveryCount,
      quotations: quotesCount,
      user_accounts: usersCount,
      system_alerts: alertsCount,
      stems_and_plants: plantsCount,
      decay_batches: batchesCount
    };
  }, [adminSearchQuery, drivers, quotations, usersList, alerts, products, batches]);

  // Module-specific filtered datasets
  const filteredDrivers = useMemo(() => {
    if (!adminSearchQuery.trim()) return drivers;
    const q = adminSearchQuery.trim().toLowerCase();
    return drivers.filter(d => 
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.vanNumber && d.vanNumber.toLowerCase().includes(q)) ||
      (d.phone && d.phone.toLowerCase().includes(q)) ||
      (d.status && d.status.toLowerCase().includes(q)) ||
      (d.operatingZone && d.operatingZone.toLowerCase().includes(q)) ||
      (d.currentHub && d.currentHub.toLowerCase().includes(q)) ||
      (d.currentParcels && d.currentParcels.some(p => 
        (p.customerName && p.customerName.toLowerCase().includes(q)) ||
        (p.destination && p.destination.toLowerCase().includes(q)) ||
        (p.orderId && String(p.orderId).toLowerCase().includes(q)) ||
        (p.trackingId && p.trackingId.toLowerCase().includes(q))
      ))
    );
  }, [drivers, adminSearchQuery]);

  const filteredQuotations = useMemo(() => {
    if (!adminSearchQuery.trim()) return quotations;
    const q = adminSearchQuery.trim().toLowerCase();
    return quotations.filter(item =>
      (item.company_name && item.company_name.toLowerCase().includes(q)) ||
      (item.client_name && item.client_name.toLowerCase().includes(q)) ||
      (item.contact_email && item.contact_email.toLowerCase().includes(q)) ||
      (item.event_type && item.event_type.toLowerCase().includes(q)) ||
      (item.venue_address && item.venue_address.toLowerCase().includes(q)) ||
      (item.city && item.city.toLowerCase().includes(q)) ||
      (item.status && item.status.toLowerCase().includes(q)) ||
      (item.id && String(item.id).includes(q)) ||
      (item.estimated_amount && String(item.estimated_amount).includes(q))
    );
  }, [quotations, adminSearchQuery]);

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter(alert => {
        if (alertFilter === 'security') return alert.alert_type === 'admin_login';
        if (alertFilter === 'accounts') return alert.alert_type === 'new_user_registration' || alert.alert_type === 'registration_otp';
        if (alertFilter === 'perishables') return alert.alert_type === 'critical_decay' || alert.alert_type === 'event_lead' || alert.alert_type === 'event_quote';
        return true;
      })
      .filter(alert => {
        if (!adminSearchQuery.trim()) return true;
        const q = adminSearchQuery.trim().toLowerCase();
        return (
          (alert.subject && alert.subject.toLowerCase().includes(q)) ||
          (alert.body && alert.body.toLowerCase().includes(q)) ||
          (alert.alert_type && alert.alert_type.toLowerCase().includes(q)) ||
          (alert.recipient && alert.recipient.toLowerCase().includes(q)) ||
          (alert.id && String(alert.id).includes(q))
        );
      });
  }, [alerts, alertFilter, adminSearchQuery]);

  const filteredBatches = useMemo(() => {
    if (!adminSearchQuery.trim()) return batches;
    const q = adminSearchQuery.trim().toLowerCase();
    return batches.filter(b =>
      (b.batch_code && b.batch_code.toLowerCase().includes(q)) ||
      (b.product_name && b.product_name.toLowerCase().includes(q)) ||
      (b.status && b.status.toLowerCase().includes(q)) ||
      (b.farm_origin && b.farm_origin.toLowerCase().includes(q)) ||
      (b.id && String(b.id).includes(q))
    );
  }, [batches, adminSearchQuery]);

  const BOTANICAL_PHOTO_PRESETS = [
    { label: 'Pink Oriental Lily', url: '/pink_lily_bloom.jpg' },
    { label: 'Monstera Deliciosa', url: '/monstera_plant_pot.jpg' },
    { label: 'Fiddle Leaf Fig', url: '/fiddle_fig_pot.jpg' },
    { label: 'Snake Plant', url: '/snake_plant_pot.jpg' },
    { label: 'Rose Bouquet', url: '/rose_flower_bouquet.jpg' },
    { label: 'Pink Peonies', url: '/pink_peonies_hero.jpg' }
  ];

  const PREDEFINED_CATEGORIES = [
    'Living Nursery Plants',
    'Cut Flowers & Stems',
    'Exotic Lilies',
    'Indoor Foliage & Palms',
    'Aromatic & Ayurvedic Herbs',
    'Fruit Plants & Trees',
    'Kitchen Veggies',
    'Bonsai & Terrariums',
    'Designer Planters & Pots'
  ];

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewPlantImages((prev) => {
          const updated = [...prev, event.target.result];
          return updated;
        });
        soundEffects.playClick();
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    const trimmed = newPlantImageUrlInput.trim();
    if (!trimmed) return;
    setNewPlantImages((prev) => [...prev, trimmed]);
    setNewPlantImageUrlInput('');
    soundEffects.playClick();
  };

  const handleRemovePlantImage = (indexToRemove) => {
    soundEffects.playClick();
    setNewPlantImages((prev) => {
      const filtered = prev.filter((_, idx) => idx !== indexToRemove);
      return filtered.length > 0 ? filtered : ['/pink_lily_bloom.jpg'];
    });
  };

  const handleSetPrimaryImage = (indexToPrimary) => {
    soundEffects.playClick();
    setNewPlantImages((prev) => {
      const target = prev[indexToPrimary];
      const remaining = prev.filter((_, idx) => idx !== indexToPrimary);
      return [target, ...remaining];
    });
  };

  const handleCreatePlantSubmit = async (e) => {
    e.preventDefault();
    if (!newPlantName.trim()) {
      setPlantFeedbackMsg({ type: 'error', text: 'Please enter the plant or stem name.' });
      return;
    }
    const finalCategory = isCustomCategory ? customCategoryInput.trim() : newPlantCategory.trim();
    if (!finalCategory) {
      setPlantFeedbackMsg({ type: 'error', text: 'Please specify a category for this botanical item.' });
      return;
    }
    const priceNum = parseFloat(newPlantPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setPlantFeedbackMsg({ type: 'error', text: 'Please enter a valid price in ₹.' });
      return;
    }

    setIsSubmittingPlant(true);
    setPlantFeedbackMsg(null);
    try {
      const imagesList = newPlantImages.filter(Boolean);
      const payload = {
        name: newPlantName.trim(),
        botanical_name: newBotanicalName.trim() || undefined,
        category: finalCategory,
        is_perishable: newIsPerishable,
        base_price: priceNum,
        price: priceNum,
        stock_quantity: parseInt(newPlantStock, 10) || 50,
        image_url: imagesList[0] || '/pink_lily_bloom.jpg',
        images: imagesList.length > 0 ? imagesList : ['/pink_lily_bloom.jpg'],
        description: newPlantDescription.trim(),
        sunlight_requirement: !newIsPerishable ? newSunlight : undefined,
        watering_frequency: !newIsPerishable ? newWatering : undefined,
        vase_life_days: newIsPerishable ? parseInt(newVaseLife, 10) || 7 : undefined
      };

      const res = await api.createProduct(payload);
      if (res.error) {
        setPlantFeedbackMsg({ type: 'error', text: res.error });
        soundEffects.playClick();
      } else {
        soundEffects.playSuccessChime();
        setPlantFeedbackMsg({ type: 'success', text: `"${newPlantName}" successfully added to the catalog under category "${finalCategory}"!` });
        setTimeout(() => {
          setPlantFeedbackMsg(null);
        }, 5000);
        const pRes = await api.getProducts();
        if (pRes.products) setProducts(pRes.products);
        if (onProductsUpdated) onProductsUpdated();
        setNewPlantName('');
        setNewBotanicalName('');
        setNewPlantPrice('');
        setNewPlantDescription('');
        setNewPlantImages(['/pink_lily_bloom.jpg']);
        setNewPlantImageUrlInput('');
        if (isCustomCategory) {
          setIsCustomCategory(false);
          setCustomCategoryInput('');
        }
      }
    } catch (err) {
      setPlantFeedbackMsg({ type: 'error', text: 'Failed to add plant. Connection error.' });
    } finally {
      setIsSubmittingPlant(false);
    }
  };

  const handleDeletePlant = async (product) => {
    if (!window.confirm(`Are you sure you want to remove "${product.name}" from the catalog?`)) {
      return;
    }
    soundEffects.playClick();
    try {
      const res = await api.deleteProduct(product.id);
      if (res.error) {
        alert(res.error);
      } else {
        soundEffects.playSuccessChime();
        const pRes = await api.getProducts();
        if (pRes.products) setProducts(pRes.products);
        if (onProductsUpdated) onProductsUpdated();
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleOpenEditProduct = (p) => {
    soundEffects.playClick();
    setEditingProduct(p);
    const existingImages = p.images && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : ['/pink_lily_bloom.jpg']);
    setEditProductForm({
      name: p.name || '',
      botanical_name: p.botanical_name || '',
      category: p.category || 'Living Nursery Plants',
      is_perishable: !!p.is_perishable,
      base_price: String(p.base_price || p.price || ''),
      stock_quantity: String(p.stock_quantity ?? 50),
      image_url: p.image_url || '/pink_lily_bloom.jpg',
      images: existingImages,
      floriography_meaning: p.floriography_meaning || p.description || '',
      sunlight_requirement: p.sunlight_requirement || 'Bright Indirect Light',
      watering_frequency: p.watering_frequency || 'Water when topsoil feels dry',
      vase_life_days: String(p.vase_life_days || 5)
    });
    setEditProductImageUrlInput('');
  };

  const handleUpdateProductSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsUpdatingProduct(true);
    try {
      const payload = {
        name: editProductForm.name.trim(),
        botanical_name: editProductForm.botanical_name.trim() || undefined,
        category: editProductForm.category.trim(),
        is_perishable: editProductForm.is_perishable,
        base_price: parseFloat(editProductForm.base_price) || 0,
        price: parseFloat(editProductForm.base_price) || 0,
        stock_quantity: parseInt(editProductForm.stock_quantity, 10) || 0,
        images: editProductForm.images,
        image_url: editProductForm.images[0] || editProductForm.image_url || '/pink_lily_bloom.jpg',
        floriography_meaning: editProductForm.floriography_meaning.trim(),
        description: editProductForm.floriography_meaning.trim(),
        sunlight_requirement: !editProductForm.is_perishable ? editProductForm.sunlight_requirement : undefined,
        watering_frequency: !editProductForm.is_perishable ? editProductForm.watering_frequency : undefined,
        vase_life_days: editProductForm.is_perishable ? parseInt(editProductForm.vase_life_days, 10) || 5 : undefined
      };

      const res = await api.updateProduct(editingProduct.id, payload);
      if (res.error) {
        alert(res.error);
      } else {
        soundEffects.playSuccessChime();
        setEditingProduct(null);
        alert(res.message || 'Product updated successfully in the database.');
        const pRes = await api.getProducts();
        if (pRes.products) setProducts(pRes.products);
        if (onProductsUpdated) onProductsUpdated();
      }
    } catch (err) {
      alert('Failed to update product: ' + (err.message || 'Server error'));
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  const handleClearAllDataset = async () => {
    if (!window.confirm('CAUTION: This will delete ALL current products, stems, and batches from the database for a clean fresh start. Continue?')) {
      return;
    }
    setIsClearingAll(true);
    soundEffects.playClick();
    try {
      const res = await api.clearAllProducts();
      if (res.error) {
        alert(res.error);
      } else {
        soundEffects.playSuccessChime();
        setProducts([]);
        if (onProductsUpdated) onProductsUpdated();
      }
    } catch (err) {
      console.error('Failed to clear all products:', err);
    } finally {
      setIsClearingAll(false);
    }
  };

  const formatAlertTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr.split('.')[0].replace('T', ' ');
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const getAlertMeta = (type) => {
    switch (type) {
      case 'admin_login':
        return {
          label: 'Admin Security',
          icon: ShieldAlert,
          badgeColor: currentTheme === 'rose'
            ? 'bg-rose-100 text-rose-850 border-rose-300'
            : currentTheme === 'dark'
            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
        };
      case 'registration_otp':
        return {
          label: 'Email OTP',
          icon: KeyRound,
          badgeColor: currentTheme === 'rose'
            ? 'bg-pink-100 text-pink-900 border-pink-300'
            : currentTheme === 'dark'
            ? 'bg-indigo-950/70 text-indigo-300 border-indigo-800'
            : 'bg-indigo-100 text-indigo-800 border-indigo-300'
        };
      case 'new_user_registration':
        return {
          label: 'Client Registered',
          icon: UserCheck,
          badgeColor: currentTheme === 'rose'
            ? 'bg-rose-100 text-rose-900 border-rose-300'
            : currentTheme === 'dark'
            ? 'bg-sky-950/70 text-sky-300 border-sky-800'
            : 'bg-sky-100 text-sky-800 border-sky-300'
        };
      case 'critical_decay':
        return {
          label: 'Freshness Markdown',
          icon: AlertTriangle,
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
        };
      case 'event_lead':
      case 'event_quote':
        return {
          label: 'Commercial Quote',
          icon: FileText,
          badgeColor: currentTheme === 'rose'
            ? 'bg-rose-100 text-rose-900 border-rose-300'
            : 'bg-purple-100 text-purple-900 border-purple-300'
        };
      default:
        return {
          label: type ? type.replace(/_/g, ' ') : 'System Notice',
          icon: Bell,
          badgeColor: 'bg-stone-100 text-stone-700 border-stone-200'
        };
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  async function loadAllAdminData() {
    setLoading(true);
    try {
      const [bRes, fRes, aRes, qRes, cRes, hRes, pRes, dRes, uRes] = await Promise.all([
        api.getBatches(),
        api.getProphetForecast(45),
        api.getSystemAlerts(),
        api.getQuotations(),
        api.getCurationMetrics(),
        api.getInventoryHealth(),
        api.getProducts(),
        api.getDeliveryDrivers(),
        api.getAllUsers()
      ]);
      if (bRes.batches) setBatches(bRes.batches);
      if (fRes) setForecastData(fRes);
      if (aRes.alerts) setAlerts(aRes.alerts);
      if (qRes.quotations) setQuotations(qRes.quotations);
      if (cRes) setCurationMetrics(cRes);
      if (hRes) setInventoryHealth(hRes);
      if (pRes.products) setProducts(pRes.products);
      if (dRes?.drivers) {
        setDrivers(dRes.drivers);
        setFleetSummary(dRes.fleet_summary);
      }
      if (uRes?.users) setUsersList(uRes.users);
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleEvaluateDecay = async () => {
    soundEffects.playClick();
    try {
      const res = await api.evaluateBatches();
      soundEffects.playSuccessChime();
      alert(`Daily Price Update: ${res.results.evaluated_batches} flower batches checked. ${res.results.critical_alerts_sent} freshness notices logged.`);
      loadAllAdminData();
    } catch (err) {
      alert('Error updating inventory freshness tiers');
    }
  };

  const handleApplyOverride = async (e) => {
    e.preventDefault();
    if (!overrideModal) return;
    try {
      await api.overrideBatchDiscount(overrideModal.id, overrideDiscount, 'Manual clearance override');
      soundEffects.playSuccessChime();
      setOverrideModal(null);
      loadAllAdminData();
    } catch (err) {
      alert('Error applying override');
    }
  };

  const handleLogHarvest = async (e) => {
    e.preventDefault();
    setHarvestSubmitting(true);
    try {
      const res = await api.createBatch({
        product_id: Number(harvestForm.product_id),
        batch_code: harvestForm.batch_code,
        harvest_date: harvestForm.harvest_date,
        quantity: Number(harvestForm.quantity),
        vase_life_days: Number(harvestForm.vase_life_days)
      });
      soundEffects.playSuccessChime();
      setShowHarvestModal(false);
      alert(res.message || 'New farm harvest batch recorded successfully.');
      loadAllAdminData();
    } catch (err) {
      alert('Error logging farm harvest batch.');
    } finally {
      setHarvestSubmitting(false);
    }
  };

  const handleOpenEditBatch = (b) => {
    soundEffects.playClick();
    setEditingBatch(b);
    setEditBatchForm({
      batch_code: b.batch_code || '',
      harvest_date: b.harvest_date || '',
      remaining_quantity: b.remaining_quantity || 0,
      initial_quantity: b.initial_quantity || 0,
      vase_life_days: b.vase_life_days || 5,
      discount_percent: b.discount_percent || 0,
      status: b.status || 'fresh'
    });
  };

  const handleUpdateBatch = async (e) => {
    e.preventDefault();
    if (!editingBatch) return;
    setBatchActionSubmitting(true);
    try {
      const res = await api.updateBatch(editingBatch.id, {
        batch_code: editBatchForm.batch_code,
        harvest_date: editBatchForm.harvest_date,
        remaining_quantity: Number(editBatchForm.remaining_quantity),
        initial_quantity: Number(editBatchForm.initial_quantity),
        vase_life_days: Number(editBatchForm.vase_life_days),
        discount_percent: Number(editBatchForm.discount_percent),
        status: editBatchForm.status
      });
      soundEffects.playSuccessChime();
      setEditingBatch(null);
      alert(res.message || 'Batch details updated successfully in database.');
      loadAllAdminData();
    } catch (err) {
      alert('Failed to update batch: ' + (err.message || 'Server error'));
    } finally {
      setBatchActionSubmitting(false);
    }
  };

  const handleDeleteBatch = async (batch) => {
    soundEffects.playClick();
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete batch "${batch.batch_code}" (${batch.product_name})?\n\nThis will remove it from the database and adjust inventory stock.`
    );
    if (!confirmed) return;

    try {
      const res = await api.deleteBatch(batch.id);
      soundEffects.playSuccessChime();
      alert(res.message || `Batch ${batch.batch_code} successfully removed.`);
      loadAllAdminData();
    } catch (err) {
      alert('Failed to delete batch: ' + (err.message || 'Server error'));
    }
  };

  // ----------------------------------------------------
  // Delivery & Live Tracking Handlers
  // ----------------------------------------------------
  useEffect(() => {
    if (activeTab === 'delivery_fleet') {
      initOrUpdateFleetMap();
    } else {
      if (fleetMapInstanceRef.current) {
        fleetMapInstanceRef.current.remove();
        fleetMapInstanceRef.current = null;
        driverMarkersRef.current = {};
        depotMarkerRef.current = null;
      }
    }
    return () => {
      if (fleetMapInstanceRef.current) {
        fleetMapInstanceRef.current.remove();
        fleetMapInstanceRef.current = null;
        driverMarkersRef.current = {};
        depotMarkerRef.current = null;
      }
    };
  }, [activeTab, drivers]);

  // Auto-simulation periodic ticker
  useEffect(() => {
    let interval = null;
    if (autoSimulateFleet && activeTab === 'delivery_fleet') {
      interval = setInterval(async () => {
        try {
          const res = await api.simulateFleetTick();
          if (res.drivers) {
            setDrivers(res.drivers);
          }
          if (res.fleet_summary) {
            setFleetSummary(res.fleet_summary);
          }
        } catch (err) {
          console.error('Delivery tick error:', err);
        }
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoSimulateFleet, activeTab]);

  const handleManualFleetTick = async () => {
    soundEffects.playClick();
    setIsTicking(true);
    try {
      const res = await api.simulateFleetTick();
      soundEffects.playSuccessChime();
      if (res.drivers) {
        setDrivers(res.drivers);
      }
      if (res.fleet_summary) {
        setFleetSummary(res.fleet_summary);
      }
    } catch (err) {
      console.error('Delivery tick error:', err);
    } finally {
      setIsTicking(false);
    }
  };

  const handleUpdateDriverStatus = async (driverId, newStatus) => {
    soundEffects.playClick();
    setDriverUpdatingId(driverId);
    try {
      await api.updateDriverDuty(driverId, newStatus);
      soundEffects.playSuccessChime();
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: newStatus } : d));
      if (selectedDriver && selectedDriver.id === driverId) {
        setSelectedDriver(prev => ({ ...prev, status: newStatus }));
      }
      loadAllAdminData();
    } catch (err) {
      alert('Error updating courier duty status');
    } finally {
      setDriverUpdatingId(null);
    }
  };

  function initOrUpdateFleetMap() {
    if (!fleetMapContainerRef.current) return;
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = () => setupFleetMap();
      document.head.appendChild(script);
    } else {
      setupFleetMap();
    }
  }

  function setupFleetMap() {
    const L = window.L;
    if (!L || !fleetMapContainerRef.current) return;

    const depotLat = fleetSummary?.depot?.lat || 13.6934;
    const depotLng = fleetSummary?.depot?.lng || 75.2448;

    // Reset container if Leaflet previously initialized a map on it
    if (fleetMapContainerRef.current._leaflet_id && !fleetMapInstanceRef.current) {
      fleetMapContainerRef.current._leaflet_id = null;
    }

    if (!fleetMapInstanceRef.current) {
      try {
        const map = L.map(fleetMapContainerRef.current).setView([depotLat, depotLng], 9);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Depot Marker without emojis
        const depotIcon = L.divIcon({
          className: 'custom-depot-marker',
          html: `<div style="background: #064e3b; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px; display: flex; align-items: center; gap: 4px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); white-space: nowrap;">Kalmane Hub (577432)</div>`,
          iconSize: [140, 26],
          iconAnchor: [70, 13]
        });
        depotMarkerRef.current = L.marker([depotLat, depotLng], { icon: depotIcon })
          .addTo(map)
          .bindPopup(`<strong>${fleetSummary?.depot?.name || 'Green Nest Mother Nursery & Packing Hub'}</strong><br/>${fleetSummary?.depot?.address || 'Kalmane, Thirthahalli, Karnataka 577432'}<br/><span style="color: #047857; font-size: 11px;">Origin Mother Nursery, Greenhouse & Nationwide Line-Haul Depot</span>`);

        fleetMapInstanceRef.current = map;
      } catch (err) {
        console.warn('Map initialization warning:', err);
      }
    } else {
      setTimeout(() => {
        fleetMapInstanceRef.current?.invalidateSize();
      }, 100);
    }

    const map = fleetMapInstanceRef.current;
    if (!map) return;

    // Update / create courier markers without emojis
    drivers.forEach((driver) => {
      const isEnRoute = driver.status === 'en_route';
      const isBreak = driver.status === 'on_break';
      const colorBg = isEnRoute ? '#be123c' : isBreak ? '#2563eb' : '#047857';
      const statusLabel = isEnRoute ? 'En Route' : isBreak ? 'On Break' : 'Available';

      const customHtml = `
        <div style="background: ${colorBg}; color: white; padding: 3px 8px; border-radius: 8px; font-weight: bold; font-size: 10px; display: flex; align-items: center; gap: 4px; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.35); white-space: nowrap;">
          <span>${(driver.full_name || 'Driver').split(' ')[0]}</span>
          <span style="background: rgba(255,255,255,0.25); padding: 1px 4px; border-radius: 4px; font-size: 9px;">${driver.battery_level || 100}%</span>
        </div>
      `;

      const driverIcon = L.divIcon({
        className: `custom-driver-${driver.id}`,
        html: customHtml,
        iconSize: [100, 24],
        iconAnchor: [50, 12]
      });

      if (driverMarkersRef.current[driver.id]) {
        driverMarkersRef.current[driver.id]
          .setLatLng([driver.current_lat, driver.current_lng])
          .setIcon(driverIcon);
      } else {
        const marker = L.marker([driver.current_lat, driver.current_lng], { icon: driverIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
              <strong>${driver.full_name}</strong> (${driver.vehicle_type || driver.vehicle_number})<br/>
              Status: <strong>${statusLabel}</strong><br/>
              Battery: ${driver.battery_level}% | Speed: ${driver.speed_kmh} km/h<br/>
              Route: ${driver.zone || 'Central Hub Corridor'}<br/>
              Phone: ${driver.phone}
            </div>
          `);
        driverMarkersRef.current[driver.id] = marker;
      }
    });
  }

  const handleToggleDriverDuty = async (driverId, currentStatus) => {
    soundEffects.playClick();
    setDriverUpdatingId(driverId);
    try {
      const nextStatus = currentStatus === 'on_duty' ? 'off_duty' : 'on_duty';
      await api.updateDriverDuty(driverId, nextStatus);
      soundEffects.playSuccessChime();
      loadAllAdminData();
    } catch (err) {
      alert('Error updating courier duty status');
    } finally {
      setDriverUpdatingId(null);
    }
  };

  const handleFocusDriver = (driver) => {
    soundEffects.playClick();
    setSelectedDriver(driver);
    if (fleetMapInstanceRef.current) {
      fleetMapInstanceRef.current.flyTo([driver.current_lat, driver.current_lng], 14, { duration: 1 });
      if (driverMarkersRef.current[driver.id]) {
        driverMarkersRef.current[driver.id].openPopup();
      }
    }
  };

  const handleQuoteAction = async (quoteId, status) => {
    soundEffects.playClick();
    try {
      await api.updateQuoteStatus(quoteId, status);
      soundEffects.playSuccessChime();
      loadAllAdminData();
    } catch (err) {
      alert('Error updating quote status');
    }
  };

  return (
    <div className={`min-h-screen flex overflow-x-hidden font-sans w-full transition-colors duration-300 ${
      currentTheme === 'dark' 
        ? 'bg-[#0b0f19] text-slate-100' 
        : currentTheme === 'rose' 
        ? 'bg-[#fff8f9] text-rose-950' 
        : 'bg-[#fcfbf9] text-stone-800'
    }`}>
      
      {/* GreenNest Bloom Left Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-stone-200 transition-all duration-300 flex flex-col shrink-0 z-40 select-none shadow-xs`}>
        {/* Brand Header - GreenNest Bloom Theme */}
        <div className="h-16 bg-emerald-950 border-b border-emerald-900 flex items-center justify-between px-5 text-white shadow-xs">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-xs">
              G
            </div>
            {sidebarOpen && (
              <span className="font-serif font-bold text-lg tracking-tight text-white truncate">
                GreenNest Bloom
              </span>
            )}
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6 text-xs font-semibold text-stone-600">
          
          {/* Section: DASHBOARD */}
          <div>
            {sidebarOpen && (
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 mb-2">
                Dashboard
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('dashboard');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Dashboard"
              >
                <div className="flex items-center space-x-3">
                  <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Dashboard</span>}
                </div>
                {sidebarOpen && <ChevronRight className="w-3.5 h-3.5 text-stone-400" />}
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('prophet_forecasting');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'prophet_forecasting'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Sales Forecast"
              >
                <div className="flex items-center space-x-3">
                  <TrendingUp className={`w-4 h-4 shrink-0 ${activeTab === 'prophet_forecasting' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Sales Forecast</span>}
                </div>
                {sidebarOpen && <ChevronRight className="w-3.5 h-3.5 text-stone-400" />}
              </button>
            </div>
          </div>

          {/* Section: OPERATIONS */}
          <div>
            {sidebarOpen && (
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 mb-2">
                Operations
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('stems_and_plants');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'stems_and_plants'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Stems & Plants"
              >
                <div className="flex items-center space-x-3">
                  <Leaf className={`w-4 h-4 shrink-0 ${activeTab === 'stems_and_plants' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Stems &amp; Plants</span>}
                </div>
                {sidebarOpen && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-mono font-bold">
                    {products.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('decay_batches');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'decay_batches'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Fresh Flowers"
              >
                <div className="flex items-center space-x-3">
                  <Clock className={`w-4 h-4 shrink-0 ${activeTab === 'decay_batches' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Fresh Flowers</span>}
                </div>
                {sidebarOpen && (
                  <span className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded-md font-mono">
                    {batches.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('delivery_fleet');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'delivery_fleet'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Delivery"
              >
                <div className="flex items-center space-x-3">
                  <Truck className={`w-4 h-4 shrink-0 ${activeTab === 'delivery_fleet' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Delivery</span>}
                </div>
                {sidebarOpen && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-mono">
                    {drivers.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('quotations');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'quotations'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Quotes"
              >
                <div className="flex items-center space-x-3">
                  <FileText className={`w-4 h-4 shrink-0 ${activeTab === 'quotations' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Quotes</span>}
                </div>
                {sidebarOpen && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-mono">
                    {quotations.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('curation_metrics');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'curation_metrics'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Subscriptions"
              >
                <div className="flex items-center space-x-3">
                  <Users className={`w-4 h-4 shrink-0 ${activeTab === 'curation_metrics' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Subscriptions</span>}
                </div>
                {sidebarOpen && <ChevronRight className="w-3.5 h-3.5 text-stone-400" />}
              </button>
            </div>
          </div>

          {/* Section: MANAGEMENT */}
          <div>
            {sidebarOpen && (
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 mb-2">
                Management
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('user_accounts');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'user_accounts'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Customers"
              >
                <div className="flex items-center space-x-3">
                  <UserCheck className={`w-4 h-4 shrink-0 ${activeTab === 'user_accounts' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Customers</span>}
                </div>
                {sidebarOpen && (
                  <span className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded-md font-mono">
                    {usersList.filter(u => u.user_type !== 'admin').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('system_alerts');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'system_alerts'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Alerts"
              >
                <div className="flex items-center space-x-3">
                  <Mail className={`w-4 h-4 shrink-0 ${activeTab === 'system_alerts' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Alerts</span>}
                </div>
                {sidebarOpen && (
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-mono font-bold">
                    {alerts.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-stone-200 bg-stone-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
              VR
            </div>
            {sidebarOpen && (
              <div className="truncate">
                <div className="text-xs font-bold text-stone-800 truncate">Venisha Dsouza</div>
                <div className="text-[10px] text-emerald-700 font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                  <span>Store Manager</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Navbar */}
        <header className="h-16 bg-white border-b border-stone-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Search Dashboard & Modules with Action Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                soundEffects.playClick();
              }}
              className="flex items-center gap-1.5"
            >
              <div className="relative w-52 sm:w-72 md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'delivery_fleet'
                      ? 'Search couriers, vans, routes...'
                      : activeTab === 'quotations'
                      ? 'Search quotes, clients, venues...'
                      : activeTab === 'user_accounts'
                      ? 'Search customers, emails, companies...'
                      : activeTab === 'system_alerts'
                      ? 'Search audit logs, alerts, events...'
                      : activeTab === 'stems_and_plants'
                      ? 'Search stems, plants, species...'
                      : activeTab === 'decay_batches'
                      ? 'Search flower batches, codes...'
                      : 'Search delivery, orders, users, logs...'
                  }
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-stone-800"
                />
                {adminSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setAdminSearchQuery('');
                      setUserSearchQuery('');
                      setPlantSearchQuery('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1 shrink-0 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </form>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick action button: Update Prices */}
            <button
              onClick={handleEvaluateDecay}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Update Prices</span>
            </button>

            {/* Refresh Data */}
            <button
              onClick={loadAllAdminData}
              title="Refresh Data"
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Notification Bell */}
            <div
              onClick={() => setActiveTab('system_alerts')}
              className="relative cursor-pointer p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
              title="Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {alerts.length || 3}
              </span>
            </div>

            {/* Language Selector */}
            <div className="hidden md:flex items-center space-x-1 text-xs text-stone-600 font-semibold px-2 py-1 hover:bg-stone-100 rounded-lg cursor-pointer">
              <span>English</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </div>

            {/* User Profile Avatar */}
            <div className="flex items-center space-x-2.5 pl-2 border-l border-stone-200">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  VR
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></span>
              </div>
            </div>
          </div>
        </header>

        {/* View Router */}
        <main className="p-6 space-y-6 flex-1">
          {/* Breadcrumb indicator when inside non-dashboard tab */}
          {activeTab !== 'dashboard' && (
            <div className="flex items-center space-x-2 text-xs text-stone-500 pb-2">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className="hover:text-emerald-800 font-semibold flex items-center gap-1"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
              <span>/</span>
              <span className="font-bold text-stone-800 capitalize">
                {activeTab === 'stems_and_plants' ? 'Stems & Plants' : activeTab === 'decay_batches' ? 'Fresh Flowers' : activeTab === 'delivery_fleet' ? 'Delivery' : activeTab === 'quotations' ? 'Quotes' : activeTab === 'curation_metrics' ? 'Subscriptions' : activeTab === 'user_accounts' ? 'Customers' : activeTab === 'system_alerts' ? 'Alerts' : activeTab.replace('_', ' ')}
              </span>
            </div>
          )}

          {/* Active Search Filter Banner & Module Switcher */}
          {adminSearchQuery.trim() && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 shadow-2xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span className="text-emerald-950">
                    Active Search: <strong>"{adminSearchQuery}"</strong>
                  </span>
                  <span className="text-emerald-700 font-medium text-[11px] hidden sm:inline">
                    • Live filtering current view and cross-module records
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setAdminSearchQuery('');
                    setUserSearchQuery('');
                    setPlantSearchQuery('');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Search Filter</span>
                </button>
              </div>

              {moduleMatchCounts && (
                <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-bold text-emerald-900 mr-1">Matches by Module:</span>
                  {[
                    { id: 'delivery_fleet', label: 'Delivery', count: moduleMatchCounts.delivery_fleet },
                    { id: 'quotations', label: 'Quotes & Orders', count: moduleMatchCounts.quotations },
                    { id: 'user_accounts', label: 'Users', count: moduleMatchCounts.user_accounts },
                    { id: 'system_alerts', label: 'Audit Logs', count: moduleMatchCounts.system_alerts },
                    { id: 'stems_and_plants', label: 'Stems & Plants', count: moduleMatchCounts.stems_and_plants },
                    { id: 'decay_batches', label: 'Flower Batches', count: moduleMatchCounts.decay_batches }
                  ].map(mod => (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setActiveTab(mod.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                        activeTab === mod.id
                          ? 'bg-emerald-800 text-white shadow-2xs ring-2 ring-emerald-600/30'
                          : mod.count > 0
                          ? 'bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-white/60 text-stone-400 border border-stone-200 hover:text-stone-700'
                      }`}
                    >
                      <span>{mod.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        activeTab === mod.id ? 'bg-emerald-950 text-emerald-200' : mod.count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-400'
                      }`}>
                        {mod.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MAIN DASHBOARD VIEW - GREENNEST BLOOM PALETTE */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* ROW 1: 4 Vibrant Gradient Metric Cards (Botanical Palette, NO EMOJIS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Card 1: Products Sold (Emerald Botanical) */}
                <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-2xl p-6 text-white shadow-xs flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-white/85 text-xs font-semibold tracking-wide">Products Sold</span>
                    <div className="text-3xl font-extrabold tracking-tight">4,565</div>
                  </div>
                  <div className="z-10 p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                    <ShoppingCart className="w-8 h-8 text-white/90" />
                  </div>
                  <ShoppingCart className="w-32 h-32 text-white/10 absolute -right-4 -bottom-6 pointer-events-none" />
                </div>

                {/* Card 2: Net Profit (Rose Floral) */}
                <div className="bg-gradient-to-r from-rose-800 to-rose-600 rounded-2xl p-6 text-white shadow-xs flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-white/85 text-xs font-semibold tracking-wide">Net Profit</span>
                    <div className="text-3xl font-extrabold tracking-tight">
                      ₹ {inventoryHealth ? inventoryHealth.estimated_spoilage_salvaged_inr.toLocaleString() : '8,541'}
                    </div>
                  </div>
                  <div className="z-10 p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                    <IndianRupee className="w-8 h-8 text-white/90" />
                  </div>
                  <IndianRupee className="w-32 h-32 text-white/10 absolute -right-4 -bottom-6 pointer-events-none" />
                </div>

                {/* Card 3: New Customers (Amber Harvest) */}
                <div className="bg-gradient-to-r from-amber-700 to-amber-600 rounded-2xl p-6 text-white shadow-xs flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-white/85 text-xs font-semibold tracking-wide">New Customers</span>
                    <div className="text-3xl font-extrabold tracking-tight">4,565</div>
                  </div>
                  <div className="z-10 p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                    <Users className="w-8 h-8 text-white/90" />
                  </div>
                  <Users className="w-32 h-32 text-white/10 absolute -right-4 -bottom-6 pointer-events-none" />
                </div>

                {/* Card 4: Customer Satisfaction (Deep Teal) */}
                <div className="bg-gradient-to-r from-teal-800 to-emerald-700 rounded-2xl p-6 text-white shadow-xs flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-white/85 text-xs font-semibold tracking-wide">Customer Satisfaction</span>
                    <div className="text-3xl font-extrabold tracking-tight">99%</div>
                  </div>
                  <div className="z-10 p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                    <Heart className="w-8 h-8 text-white/90" />
                  </div>
                  <Heart className="w-32 h-32 text-white/10 absolute -right-4 -bottom-6 pointer-events-none" />
                </div>

              </div>

              {/* ROW 2: Product Sales Large Wave Area Chart */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Product Sales</h3>
                    <div className="text-2xl font-black text-stone-900 mt-2">₹ 1,12,555</div>
                  </div>
                  <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold text-stone-600">
                    {['day', 'week', 'month'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setSalesTimeRange(range)}
                        className={`px-3 py-1 rounded-lg capitalize transition-all ${
                          salesTimeRange === range
                            ? 'bg-emerald-800 text-white font-bold shadow-xs'
                            : 'hover:text-stone-900'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dual Spline Wave SVG Chart (Rose & Emerald) */}
                <div className="w-full h-64 relative pt-4 overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 900 240" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#047857" stopOpacity="0.60" />
                        <stop offset="100%" stopColor="#047857" stopOpacity="0.02" />
                      </linearGradient>
                      <linearGradient id="roseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>

                    {/* Rose Wave (Online Orders) */}
                    <path
                      d="M 0,190 Q 90,140 180,165 T 360,110 T 540,150 T 720,130 T 900,160 L 900,240 L 0,240 Z"
                      fill="url(#roseGrad)"
                    />
                    <path
                      d="M 0,190 Q 90,140 180,165 T 360,110 T 540,150 T 720,130 T 900,160"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="3.5"
                    />

                    {/* Emerald Wave (Store Orders) */}
                    <path
                      d="M 0,205 Q 120,200 240,155 T 480,165 T 620,40 T 780,155 T 900,90 L 900,240 L 0,240 Z"
                      fill="url(#emeraldGrad)"
                    />
                    <path
                      d="M 0,205 Q 120,200 240,155 T 480,165 T 620,40 T 780,155 T 900,90"
                      fill="none"
                      stroke="#047857"
                      strokeWidth="3.5"
                    />

                    {/* Peak marker dots for Rose Wave */}
                    <circle cx="180" cy="165" r="4.5" fill="#ffffff" stroke="#f43f5e" strokeWidth="3" />
                    <circle cx="360" cy="110" r="4.5" fill="#ffffff" stroke="#f43f5e" strokeWidth="3" />
                    <circle cx="720" cy="130" r="4.5" fill="#ffffff" stroke="#f43f5e" strokeWidth="3" />

                    {/* Peak marker dots for Emerald Wave */}
                    <circle cx="240" cy="155" r="4.5" fill="#ffffff" stroke="#047857" strokeWidth="3" />
                    <circle cx="620" cy="40" r="5" fill="#ffffff" stroke="#047857" strokeWidth="3.5" />
                  </svg>
                </div>

                {/* Footer comparison bars */}
                <div className="pt-3 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-stone-700">
                      <span>Online Orders</span>
                      <span className="text-stone-400">45%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-stone-700">
                      <span>Store Orders</span>
                      <span className="text-stone-400">70%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-700 h-1.5 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 3: Three Cards (Order Summary, Order Overview, Tasks) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Card 1: Order Summary (Dual Bar Chart) */}
                <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 mb-6">Order Summary</h3>
                    
                    <div className="flex items-end justify-between h-48 pt-4 pb-2 px-2">
                      {/* Y-axis labels */}
                      <div className="flex flex-col justify-between h-full text-[10px] text-stone-400 pr-2 select-none">
                        <span>100</span>
                        <span>75</span>
                        <span>50</span>
                        <span>25</span>
                        <span>0</span>
                      </div>

                      {/* 7 Grouped Bar Pairs */}
                      <div className="flex-1 flex justify-around items-end h-full">
                        {[
                          { pink: 88, purple: 68 },
                          { pink: 62, purple: 52 },
                          { pink: 40, purple: 32 },
                          { pink: 65, purple: 55 },
                          { pink: 42, purple: 36 },
                          { pink: 60, purple: 50 },
                          { pink: 82, purple: 74 },
                        ].map((group, idx) => (
                          <div key={idx} className="flex items-end space-x-1 group">
                            {/* Rose bar */}
                            <div
                              style={{ height: `${group.pink}%` }}
                              className="w-2.5 bg-rose-500 rounded-t-sm transition-all duration-300 group-hover:brightness-105"
                            ></div>
                            {/* Emerald bar */}
                            <div
                              style={{ height: `${group.purple}%` }}
                              className="w-2.5 bg-emerald-700 rounded-t-sm transition-all duration-300 group-hover:brightness-105"
                            ></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center items-center space-x-6 pt-4 border-t border-stone-100 text-xs font-semibold text-stone-600">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span>Online Orders</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-700"></span>
                      <span>Store Orders</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Order Overview */}
                <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Order Overview</h3>
                    <div className="text-3xl font-black text-stone-900 mt-3">5,680</div>

                    <div className="space-y-5">
                      {/* Item 1 */}
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <div>
                            <span className="font-bold text-stone-900 text-sm">30</span>
                            <span className="text-stone-500 text-xs ml-2">Online Orders</span>
                          </div>
                          <span className="text-xs font-bold text-stone-700">30%</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-700 h-1.5 rounded-full" style={{ width: '30%' }}></div>
                        </div>
                      </div>

                      {/* Item 2 */}
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <div>
                            <span className="font-bold text-stone-900 text-sm">50</span>
                            <span className="text-stone-500 text-xs ml-2">Store Orders</span>
                          </div>
                          <span className="text-xs font-bold text-stone-700">50%</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: '50%' }}></div>
                        </div>
                      </div>

                      {/* Item 3 */}
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <div>
                            <span className="font-bold text-stone-900 text-sm">20</span>
                            <span className="text-stone-500 text-xs ml-2">Cash On Delivery</span>
                          </div>
                          <span className="text-xs font-bold text-stone-700">20%</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: '20%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
                    <span>Target Fulfillment: 100%</span>
                    <span className="text-emerald-700 font-bold">On Schedule</span>
                  </div>
                </div>

                {/* Card 3: Tasks List */}
                <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 mb-4">Tasks</h3>

                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {todoList.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 transition-colors group"
                        >
                          <label className="flex items-center space-x-3 cursor-pointer select-none flex-1">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => handleToggleTodo(item.id)}
                              className="w-4 h-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-500/30"
                            />
                            <span className={`text-xs font-medium ${item.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                              {item.text}
                            </span>
                          </label>
                          <button
                            onClick={() => handleDeleteTodo(item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-500 rounded transition-all"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100">
                    <input
                      type="text"
                      placeholder="Add new task and press Enter..."
                      value={newTodoInput}
                      onChange={(e) => setNewTodoInput(e.target.value)}
                      onKeyDown={handleAddTodo}
                      className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>
                </div>

              </div>

            </div>
          )}


{/* TAB: Stems & Plants Inventory Management */}
      {activeTab === 'stems_and_plants' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Leaf className="w-5 h-5" />
                </span>
                <h3 className="font-serif text-2xl font-bold text-stone-900">
                  Stems &amp; Plants Management
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-1 max-w-2xl">
                Add new stems, living plants, authentic photos, and care guides. All items added here immediately appear in your store catalog for customers to browse, search, and checkout.
              </p>
            </div>
          </div>

          {/* Feedback Alerts - Shown only when a new plant is added or validation occurs */}
          {plantFeedbackMsg && (
            <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between animate-in fade-in ${
              plantFeedbackMsg.type === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}>
              <div className="flex items-center space-x-2">
                {plantFeedbackMsg.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span className="font-semibold">{plantFeedbackMsg.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setPlantFeedbackMsg(null)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {/* Stems & Plants: Clean Stacked 2-Frame Layout */}
          <div className="space-y-8">
            
            {/* FRAME 1: Add New Plant, Bouquet, or Floral Stem (Full Width Frame) */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-stone-900">Enter New Plant, Bouquet, or Floral Stem</h4>
                    <p className="text-xs text-stone-500">Register new nursery inventory, living potted plants, or handcrafted bouquets into the live database.</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100 self-start sm:self-center">
                  Catalog Entry Form
                </span>
              </div>

              <form onSubmit={handleCreatePlantSubmit} className="space-y-6 text-xs">
                {/* Botanical Classification Toggle (3 Types) */}
                <div>
                  <label className="block font-bold text-stone-700 mb-2">Botanical Product Classification</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-stone-100 p-1.5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setNewIsPerishable(false);
                        if (!isCustomCategory) {
                          setNewPlantCategory('Living Nursery Plants');
                        }
                      }}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                        !newIsPerishable && newPlantCategory === 'Living Nursery Plants'
                          ? 'bg-white text-emerald-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Leaf className="w-4 h-4 text-emerald-600" />
                      <span>Living Nursery Plant</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setNewIsPerishable(true);
                        if (!isCustomCategory) {
                          setNewPlantCategory('Curated Bouquets');
                        }
                      }}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                        newIsPerishable && newPlantCategory === 'Curated Bouquets'
                          ? 'bg-white text-rose-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-rose-600" />
                      <span>Curated Bouquet</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setNewIsPerishable(true);
                        if (!isCustomCategory) {
                          setNewPlantCategory('Cut Flowers & Stems');
                        }
                      }}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                        newIsPerishable && newPlantCategory === 'Cut Flowers & Stems'
                          ? 'bg-white text-amber-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Tag className="w-4 h-4 text-amber-600" />
                      <span>Cut Stem / Bloom</span>
                    </button>
                  </div>
                </div>

                {/* Row 1: Name, Botanical Name, Category (3 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Plant / Product Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newPlantName}
                      onChange={(e) => setNewPlantName(e.target.value)}
                      placeholder="e.g. Pink Oriental Stargazer Lily or Golden Money Plant"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Botanical / Scientific Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={newBotanicalName}
                      onChange={(e) => setNewBotanicalName(e.target.value)}
                      placeholder="e.g. Lilium orientalis or Epipremnum aureum"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 italic"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-stone-700">
                        Storefront Category <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          setIsCustomCategory(!isCustomCategory);
                        }}
                        className="text-[11px] text-emerald-800 font-bold hover:underline cursor-pointer"
                      >
                        {isCustomCategory ? 'Use Preset' : '+ Custom'}
                      </button>
                    </div>

                    {!isCustomCategory ? (
                      <select
                        value={newPlantCategory}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomCategory(true);
                          } else {
                            setNewPlantCategory(e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 font-medium bg-white"
                      >
                        {PREDEFINED_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="__custom__">+ Enter Custom Category...</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        placeholder="Type custom category name..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500 ring-2 ring-emerald-500/20 text-stone-800 font-medium"
                      />
                    )}
                  </div>
                </div>

                {/* Row 2: Price, Stock, Vase Life / Care (3 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Retail Price (₹ INR) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold">₹</span>
                      <input
                        type="number"
                        required
                        min="1"
                        step="1"
                        value={newPlantPrice}
                        onChange={(e) => setNewPlantPrice(e.target.value)}
                        placeholder="499"
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Initial Stock Units</label>
                    <input
                      type="number"
                      min="1"
                      value={newPlantStock}
                      onChange={(e) => setNewPlantStock(e.target.value)}
                      placeholder="50"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    {newIsPerishable ? (
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">Expected Vase Life (Days)</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={newVaseLife}
                          onChange={(e) => setNewVaseLife(e.target.value)}
                          placeholder="7"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-800 font-mono font-bold"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">Sunlight Requirement</label>
                        <input
                          type="text"
                          value={newSunlight}
                          onChange={(e) => setNewSunlight(e.target.value)}
                          placeholder="e.g. Bright Indirect Light"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-800"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 3: Product Photos & Gallery (Multiple Photos Support) */}
                <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-bold text-stone-800">Product Photos Gallery</label>
                      <p className="text-[11px] text-stone-500">Add multiple photos so customers can view different angles of the plant or bouquet.</p>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full font-bold">
                      {newPlantImages.length} {newPlantImages.length === 1 ? 'photo' : 'photos'} added
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={newPlantImageUrlInput}
                      onChange={(e) => setNewPlantImageUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImageUrl();
                        }
                      }}
                      placeholder="Paste image URL (e.g. /monstera_plant_pot.jpg)..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition-colors shrink-0"
                    >
                      + Add Photo URL
                    </button>
                    <label className="cursor-pointer inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-2xs shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photos</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Preset Photos Quick Buttons */}
                  <div>
                    <span className="text-[11px] font-bold text-stone-600 block mb-1.5">Quick Presets from Nursery Gallery:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Monstera Albo', url: '/monstera_plant_pot.jpg' },
                        { label: 'Snake Plant', url: '/snake_plant_pot.jpg' },
                        { label: 'Fiddle Leaf Fig', url: '/fiddle_fig_pot.jpg' },
                        { label: 'ZZ Plant', url: '/zz_plant.jpg' },
                        { label: 'Krishna Tulsi', url: '/krishna_tulsi.jpg' },
                        { label: 'Areca Palm', url: '/arecanut_palm.jpg' },
                        { label: 'Bridal Bouquet', url: '/lily_bouquet_realistic.jpg' },
                        { label: 'Rose Bouquet', url: '/rose_bouquet_realistic.jpg' },
                        { label: 'Wildflower Medley', url: '/sunflower_bouquet.jpg' },
                        { label: 'Orchid Stem', url: '/orchid_bouquet_realistic.jpg' },
                        { label: 'Peony Bouquet', url: '/peony_bouquet_realistic.jpg' },
                        { label: 'Saffron Marigold', url: '/saffron_marigold.jpg' }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleAddPresetImage(preset.url)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200 text-stone-700 text-[11px] font-medium transition-colors"
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Photo Thumbnail Badges */}
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {newPlantImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-stone-200 hover:border-emerald-500 bg-white shadow-2xs transition-all"
                      >
                        <img
                          src={img}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = '/pink_lily_bloom.jpg'; }}
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 bg-emerald-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          title="Remove Photo"
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-[11px] font-bold shadow-xs transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 4: Care and Description (2 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Watering &amp; Hydration Care Instructions
                    </label>
                    <input
                      type="text"
                      value={newWatering}
                      onChange={(e) => setNewWatering(e.target.value)}
                      placeholder="e.g. Water every 2-3 days or change cold vase water daily"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Botanical Description &amp; Floriography Meaning
                    </label>
                    <textarea
                      rows={2}
                      value={newPlantDescription}
                      onChange={(e) => setNewPlantDescription(e.target.value)}
                      placeholder="Describe foliage, bloom aroma, floriography meaning, or decorative staging..."
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 leading-relaxed text-xs"
                    />
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isSubmittingPlant}
                  className="w-full py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white font-bold text-sm shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmittingPlant ? 'Saving to Catalog...' : 'Add Plant / Bouquet to Storefront Catalog'}</span>
                </button>
              </form>
            </div>

            {/* FRAME 2: Active Inventory & Product Catalog Management (Full Width Frame) */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
                <div>
                  <h4 className="font-serif text-xl font-bold text-stone-900">Live Nursery Inventory &amp; Product Catalog</h4>
                  <p className="text-xs text-stone-500">Real-time inventory view with direct edit and remove database controls.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs">
                    Total: <strong className="text-emerald-900 font-mono">{products.length}</strong> Products
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      loadAllAdminData();
                    }}
                    className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
                    title="Refresh Catalog"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    soundEffects.playClick();
                    setAdminSearchQuery(plantSearchQuery);
                  }}
                  className="relative"
                >
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={plantSearchQuery}
                    onChange={(e) => {
                      setPlantSearchQuery(e.target.value);
                      setAdminSearchQuery(e.target.value);
                    }}
                    placeholder="Search active plants by name, botanical species, or category..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-stone-50/50"
                  />
                  {plantSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setPlantSearchQuery('');
                        setAdminSearchQuery('');
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </form>

                {/* Category Filter Pills */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                  <button
                    type="button"
                    onClick={() => setPlantCategoryFilter('all')}
                    className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                      plantCategoryFilter === 'all'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    All ({products.length})
                  </button>
                  {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map((cat) => {
                    const count = products.filter(p => p.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setPlantCategoryFilter(cat)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                          plantCategoryFilter === cat
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Products List (Full Width Cards) */}
              <div className="space-y-3 pt-2">
                {products
                  .filter((p) => {
                    const matchesCategory = plantCategoryFilter === 'all' || p.category === plantCategoryFilter;
                    const q = plantSearchQuery.trim().toLowerCase();
                    const matchesQuery = !q || 
                      p.name.toLowerCase().includes(q) || 
                      (p.botanical_name && p.botanical_name.toLowerCase().includes(q)) ||
                      (p.category && p.category.toLowerCase().includes(q)) ||
                      (p.floriography_meaning && p.floriography_meaning.toLowerCase().includes(q));
                    return matchesCategory && matchesQuery;
                  })
                  .map((p) => (
                    <div
                      key={p.id}
                      className="bg-stone-50/70 hover:bg-white rounded-2xl border border-stone-200 hover:border-emerald-300 p-4 shadow-xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <div className="w-20 h-20 rounded-2xl border border-stone-200 overflow-hidden bg-white shrink-0 shadow-2xs">
                          <img
                            src={p.image_url || '/pink_lily_bloom.jpg'}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/pink_lily_bloom.jpg'; }}
                          />
                        </div>

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm sm:text-base">{p.name}</span>
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {p.category}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold ${
                              p.is_perishable ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                            }`}>
                              {p.is_perishable ? 'Perishable Bloom' : 'Living Plant'}
                            </span>
                            {p.images && p.images.length > 1 && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1">
                                <Image className="w-3 h-3" />
                                <span>{p.images.length} Photos</span>
                              </span>
                            )}
                          </div>

                          {p.botanical_name && (
                            <p className="text-xs text-stone-500 italic">{p.botanical_name}</p>
                          )}

                          {p.floriography_meaning && (
                            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                              {p.floriography_meaning}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 font-mono pt-0.5">
                            <span className="font-bold text-stone-700">Stock: {p.stock_quantity ?? 50} units</span>
                            {p.sunlight_requirement && <span>{p.sunlight_requirement}</span>}
                            {p.vase_life_days > 0 && <span>Vase life: {p.vase_life_days}d</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right: Pricing and Action Buttons */}
                      <div className="flex sm:flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-200">
                        <span className="text-lg font-bold font-mono text-emerald-900">
                          ₹{p.base_price || p.price}
                        </span>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(p)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                            title="Edit product details in database"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePlant(p)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                            title="Delete from database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {products.length === 0 && (
                  <div className="text-center py-16 px-4 bg-stone-50 rounded-3xl border border-dashed border-stone-300 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <Leaf className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-stone-900 text-sm">
                      No Plants or Stems in Catalog Yet
                    </h4>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Use the entry form above to add your first plant or fresh flower bouquet to the storefront catalog.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

{/* TAB 1: Perishable Flower Batches */}
      {activeTab === 'decay_batches' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Fresh Flowers ({filteredBatches.length})
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  soundEffects.playClick();
                }}
                className="flex items-center gap-1.5"
              >
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                    placeholder="Search batch code, species..."
                    className="pl-8 pr-7 py-1.5 rounded-xl border border-stone-200 text-xs w-44 sm:w-56 focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                  {adminSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setAdminSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer shadow-xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
              </form>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setShowHarvestModal(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Shipment</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 uppercase tracking-wider font-bold border-b border-stone-200">
                <tr>
                  <th className="p-3">Batch Code</th>
                  <th className="p-3">Flower Species</th>
                  <th className="p-3">Harvest Date</th>
                  <th className="p-3">Age / Vase Life</th>
                  <th className="p-3">Stock Available</th>
                  <th className="p-3">Markdown Tier</th>
                  <th className="p-3">Effective Price</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-stone-900">{b.batch_code}</td>
                    <td className="p-3 font-medium text-stone-800">{b.product_name}</td>
                    <td className="p-3 text-stone-600">{b.harvest_date}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-stone-900">Day {b.current_age_days}</span>
                        <span className="text-stone-400">/ {b.vase_life_days}d max</span>
                      </div>
                      <div className="w-24 bg-stone-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full ${
                            b.current_age_days >= 4 ? 'bg-rose-500' : b.current_age_days >= 3 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min((b.current_age_days / b.vase_life_days) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-stone-800">
                      {b.remaining_quantity} / {b.initial_quantity}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        b.discount_percent >= 75
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : b.discount_percent >= 45
                          ? 'bg-orange-100 text-orange-800 border border-orange-300'
                          : b.discount_percent >= 20
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        {b.discount_percent > 0 ? `-${b.discount_percent}% ${b.status}` : 'Fresh (0%)'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-900">
                      ₹{b.effective_price} <span className="text-[10px] text-stone-400 line-through">₹{b.base_price}</span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => {
                            soundEffects.playClick();
                            setOverrideModal(b);
                            setOverrideDiscount(b.discount_percent);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[11px] transition-colors"
                          title="Override Markdown"
                        >
                          Override
                        </button>
                        <button
                          onClick={() => handleOpenEditBatch(b)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold transition-colors"
                          title="Edit Batch Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBatch(b)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition-colors"
                          title="Delete Batch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Delivery & Live Tracking */}
      {activeTab === 'delivery_fleet' && (
        <div className="space-y-6">
          {/* Fleet Header & Metrics */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <Truck className="w-5 h-5" />
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-stone-900">
                    Delivery
                  </h3>
                </div>
              </div>

              {/* Simulation Controls */}
              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => setAutoSimulateFleet(!autoSimulateFleet)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    autoSimulateFleet
                      ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${autoSimulateFleet ? 'animate-spin' : ''}`} />
                  <span>{autoSimulateFleet ? 'Live Ticker Active (4s)' : 'Auto-Simulate Live GPS'}</span>
                </button>

                <button
                  onClick={handleManualFleetTick}
                  disabled={isTicking}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isTicking ? 'animate-spin' : ''}`} />
                  <span>{isTicking ? 'Simulating...' : 'Simulate GPS Step'}</span>
                </button>

                <button
                  onClick={() => {
                    soundEffects.playClick();
                    loadAllAdminData();
                  }}
                  className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600"
                  title="Refresh Telemetry"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Fleet KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  Active Couriers
                </span>
                <div className="text-2xl font-bold font-serif text-stone-900">
                  {drivers.length} <span className="text-xs font-normal text-stone-500">Fleet</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold">100% Cold-Chain Equipped</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  En Route Dispatches
                </span>
                <div className="text-2xl font-bold font-serif text-emerald-900">
                  {drivers.filter(d => d.status === 'en_route').length}
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold">Live GPS Telemetry</span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
                  Available at Hub
                </span>
                <div className="text-2xl font-bold font-serif text-blue-900">
                  {drivers.filter(d => d.status === 'available').length}
                </div>
                <span className="text-[10px] text-blue-700 font-semibold">Ready for Dispatch</span>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block mb-1">
                  Fleet EV Battery Avg
                </span>
                <div className="text-2xl font-bold font-serif text-teal-900">
                  {fleetSummary?.avg_battery || 85}%
                </div>
                <span className="text-[10px] text-teal-700 font-semibold">Eco-Fleet Preserved</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                  Deliveries Completed
                </span>
                <div className="text-2xl font-bold font-serif text-amber-900">
                  {fleetSummary?.total_deliveries || 783}
                </div>
                <span className="text-[10px] text-amber-700 font-semibold">4.91 Avg Rating</span>
              </div>
            </div>

            {/* Interactive Live Leaflet Map & Selected Courier Spotlight */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2">
              {/* Left 2 Cols: Live Map */}
              <div className="lg:col-span-2 relative rounded-3xl overflow-hidden border border-stone-200 shadow-inner">
                <div 
                  ref={fleetMapContainerRef} 
                  className="w-full h-[450px] bg-stone-100 z-10"
                  style={{ minHeight: '450px' }}
                />

                {/* Floating Map Controls & Legend Overlay */}
                <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-stone-200 shadow-md text-[11px] space-y-1.5 max-w-[210px]">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>Bengaluru Live Fleet</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  </div>
                  <div className="space-y-1 text-stone-600 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#be123c]"></span>
                      <span>En Route ({drivers.filter(d => d.status === 'en_route').length})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>
                      <span>Available ({drivers.filter(d => d.status === 'available').length})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></span>
                      <span>On Break ({drivers.filter(d => d.status === 'on_break').length})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#064e3b]"></span>
                      <span>Kalmane Nursery Hub (577432)</span>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-stone-200">
                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        fleetMapInstanceRef.current?.setView([13.6934, 75.2448], 9);
                      }}
                      className="w-full py-1 text-center bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 font-bold text-[10px]"
                    >
                      Reset Fleet View
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 1 Col: Selected Courier Spotlight & Quick Actions */}
              <div className="bg-stone-50 rounded-3xl border border-stone-200 p-5 flex flex-col justify-between space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <span className="font-serif text-base font-bold text-stone-900">
                      {selectedDriver ? 'Courier Spotlight' : 'Fleet Active Spotlight'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 font-mono text-[10px] font-bold">
                      {selectedDriver ? selectedDriver.vehicle_number : 'SELECT DRIVER'}
                    </span>
                  </div>

                  {selectedDriver ? (
                    <div className="space-y-4 pt-3">
                      <div>
                        <h4 className="text-base font-bold text-stone-900">{selectedDriver.full_name}</h4>
                        <p className="text-stone-500 text-[11px]">{selectedDriver.vehicle_type}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                          <span className="text-[10px] text-stone-400 block">Battery Level</span>
                          <span className="text-sm font-bold text-teal-800">{selectedDriver.battery_level}%</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                          <span className="text-[10px] text-stone-400 block">Current Speed</span>
                          <span className="text-sm font-bold text-stone-800">{selectedDriver.speed_kmh} km/h</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 p-3 rounded-xl bg-white border border-stone-200 text-[11px]">
                        <div><strong>Assigned Zone:</strong> {selectedDriver.zone}</div>
                        <div><strong>Shift:</strong> {selectedDriver.shift_start} - {selectedDriver.shift_end}</div>
                        <div><strong>Phone:</strong> {selectedDriver.phone}</div>
                        <div><strong>Trips Completed:</strong> {selectedDriver.completed_deliveries}</div>
                        {selectedDriver.active_order_number && (
                          <div className="text-emerald-800 font-semibold">
                            <strong>Active Order:</strong> #{selectedDriver.active_order_number}
                          </div>
                        )}
                      </div>

                      {/* Change Status Dropdown */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-stone-700">Update Duty Status:</label>
                        <select
                          value={selectedDriver.status}
                          disabled={driverUpdatingId === selectedDriver.id}
                          onChange={(e) => handleUpdateDriverStatus(selectedDriver.id, e.target.value)}
                          className="w-full p-2 rounded-xl border border-stone-300 bg-white font-bold text-xs"
                        >
                          <option value="available">Available for Dispatch</option>
                          <option value="en_route">En Route to Destination</option>
                          <option value="on_break">On Scheduled Break</option>
                          <option value="offline">Off Duty / Offline</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-stone-400 space-y-2">
                      <Truck className="w-10 h-10 mx-auto text-stone-300" />
                      <p className="text-xs">Click on any courier marker on the map or select from the roster below to view live telemetry.</p>
                    </div>
                  )}
                </div>

                {selectedDriver && (
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setCourierModalDriverId(selectedDriver.id);
                        setShowCourierPortal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Launch Courier Driver UI</span>
                    </button>
                    <a
                      href={`tel:${selectedDriver.phone}`}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Courier ({selectedDriver.phone})</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Courier Personnel Roster Table */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-stone-100">
              <div>
                <h4 className="font-serif text-lg font-bold text-stone-900">
                  Registered Courier Personnel ({filteredDrivers.length})
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    soundEffects.playClick();
                  }}
                  className="flex items-center gap-1.5"
                >
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={adminSearchQuery}
                      onChange={(e) => setAdminSearchQuery(e.target.value)}
                      placeholder="Search courier, van, route, zone..."
                      className="pl-8 pr-7 py-1.5 rounded-xl border border-stone-200 text-xs w-48 sm:w-64 focus:ring-2 focus:ring-emerald-600 outline-none"
                    />
                    {adminSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setAdminSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer shadow-xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                </form>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                    <th className="p-3">Courier Name</th>
                    <th className="p-3">Vehicle & Reg</th>
                    <th className="p-3">Duty Status</th>
                    <th className="p-3">EV Battery</th>
                    <th className="p-3">Speed</th>
                    <th className="p-3">Operating Zone</th>
                    <th className="p-3">Rating / Trips</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredDrivers.map((driver) => {
                    const isEnRoute = driver.status === 'en_route';
                    const isBreak = driver.status === 'on_break';
                    return (
                      <tr 
                        key={driver.id} 
                        className={`hover:bg-stone-50/80 transition-colors ${
                          selectedDriver?.id === driver.id ? 'bg-emerald-50/50' : ''
                        }`}
                      >
                        <td className="p-3">
                          <div className="font-bold text-stone-900">{driver.full_name}</div>
                          <div className="text-[11px] text-stone-500">{driver.phone}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-stone-800">{driver.vehicle_type}</div>
                          <span className="font-mono text-[10px] text-stone-500 font-bold">{driver.vehicle_number}</span>
                        </td>
                        <td className="p-3">
                          <select
                            value={driver.status}
                            disabled={driverUpdatingId === driver.id}
                            onChange={(e) => handleUpdateDriverStatus(driver.id, e.target.value)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                              isEnRoute
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : isBreak
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            <option value="available">Available</option>
                            <option value="en_route">En Route</option>
                            <option value="on_break">On Break</option>
                            <option value="offline">Offline</option>
                          </select>
                        </td>
                        <td className="p-3 font-semibold">
                          <div className="flex items-center gap-1 text-teal-800">
                            <BatteryCharging className="w-3.5 h-3.5" />
                            <span>{driver.battery_level}%</span>
                          </div>
                          <div className="w-16 bg-stone-100 h-1.5 rounded-full overflow-hidden mt-1">
                            <div 
                              className={`h-full ${
                                driver.battery_level > 60 ? 'bg-emerald-500' : driver.battery_level > 25 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${driver.battery_level}%` }}
                            />
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-stone-700">
                          {driver.speed_kmh} km/h
                        </td>
                        <td className="p-3 text-stone-600 text-[11px]">
                          {driver.zone}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-stone-900">{driver.rating}</div>
                          <div className="text-[10px] text-stone-400">{driver.completed_deliveries} deliveries</div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                soundEffects.playClick();
                                setCourierModalDriverId(driver.id);
                                setShowCourierPortal(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Open Driver Mobile App"
                            >
                              <Truck className="w-3 h-3 text-emerald-700" />
                              <span>Driver UI</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFocusDriver(driver)}
                              className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold text-[10px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>Locate</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDrivers.length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-stone-400 space-y-2">
                        <Truck className="w-8 h-8 mx-auto text-stone-300" />
                        <p className="font-bold text-stone-700 text-xs">No delivery personnel or routes matching "{adminSearchQuery}"</p>
                        <button
                          type="button"
                          onClick={() => setAdminSearchQuery('')}
                          className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs rounded-lg font-semibold cursor-pointer"
                        >
                          Clear Search
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Seasonal Demand & Sales Forecast */}
      {activeTab === 'prophet_forecasting' && forecastData && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Sales Forecast & Festive Demand Engine
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Dynamic System Sync (2026-11-22)
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Past 60 days actuals (including last week's Diwali surge) &rarr; Next 45 days projections (Christmas & New Year peak)
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-600"></span> Actual Sales</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400"></span> Festive Shock Days</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-indigo-600"></span> Projected Demand</span>
            </div>
          </div>

          {/* Forecasting KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
              <span className="text-xs text-indigo-900 font-bold block mb-1">Projected 45-Day Stem Demand</span>
              <div className="text-2xl font-bold font-serif text-indigo-950">
                {forecastData.metrics?.total_projected_stems?.toLocaleString()} stems
              </div>
              <span className="text-[11px] text-indigo-700">Baseline consumer, event & holiday uptake</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <span className="text-xs text-emerald-900 font-bold block mb-1">Recommended Stem Procurement</span>
              <div className="text-2xl font-bold font-serif text-emerald-950">
                {forecastData.metrics?.recommended_procurement_stems?.toLocaleString()} stems
              </div>
              <span className="text-[11px] text-emerald-700">+15% safety buffer against festive stockouts</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50/50 border border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-900 font-bold block mb-1">Predicted Peak Festive Shock</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">Next Month</span>
              </div>
              <div className="text-lg font-bold font-serif text-amber-950 leading-snug">
                {forecastData.metrics?.peak_event}
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                Peak: {forecastData.metrics?.peak_projected_date} ({Math.round(forecastData.metrics?.peak_projected_stems)} stems/day)
              </span>
            </div>
          </div>

          {/* UPCOMING FESTIVE SPOTLIGHT: Christmas & Holiday Season Demand Breakdown */}
          {forecastData.target_peak_insights && (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50/70 via-emerald-50/30 to-stone-50 border border-amber-200/80 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white tracking-wide uppercase">
                      Upcoming Peak: December 2026
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {forecastData.target_peak_insights.demand_surge_multiplier}
                    </span>
                  </div>
                  <h4 className="font-serif text-lg font-bold text-stone-900">
                    {forecastData.target_peak_insights.event_name}
                  </h4>
                  <p className="text-xs text-stone-600">
                    Surge Window: <strong>{forecastData.target_peak_insights.peak_window}</strong> (Projected Peak: {forecastData.target_peak_insights.peak_date} &bull; {forecastData.target_peak_insights.projected_peak_stems} stems/day)
                  </p>
                </div>
                {forecastData.recent_concluded_festivals?.[0] && (
                  <div className="bg-white/90 p-2.5 rounded-2xl border border-stone-200/80 text-xs text-left md:text-right">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Recently Concluded</span>
                    <span className="font-bold text-emerald-800">{forecastData.recent_concluded_festivals[0].event_name}</span>
                    <span className="text-[11px] text-stone-500 block">Celebrated last week (Nov 8&ndash;14 in 60d actuals)</span>
                  </div>
                )}
              </div>

              {/* Top 5 High-Demand Botanical Species Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    High-Demand Flowers & Plants Forecasted for Christmas
                  </span>
                  <span className="text-[11px] text-amber-900 font-semibold bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-200/60">
                    Lead Time: {forecastData.target_peak_insights.lead_time_days} days &bull; Pre-order by {forecastData.target_peak_insights.recommended_procurement_date}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {forecastData.target_peak_insights.high_demand_products?.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs space-y-2 hover:border-amber-400 hover:shadow-xs transition-all">
                      <div className="flex items-start justify-between gap-1">
                        <h5 className="font-bold text-stone-900 text-xs leading-snug">{item.name}</h5>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 shrink-0">
                          {item.expected_demand_multiplier}
                        </span>
                      </div>
                      <div className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                        {item.category}
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        <strong>Use:</strong> {item.primary_use}
                      </p>
                      <div className="text-[10px] text-stone-700 bg-stone-50 p-2 rounded-xl border border-stone-200/60">
                        <span className="font-bold text-stone-800">Nursery Strategy: </span>
                        {item.procurement_guidance}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-white/95 rounded-2xl border border-amber-200/70 text-xs text-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-amber-950 shrink-0">Procurement Action Plan:</span>
                <span className="text-stone-600 text-[11px]">{forecastData.target_peak_insights.procurement_action_plan}</span>
              </div>
            </div>
          )}

          {/* Forecast Chart Representation */}
          <div className="p-5 bg-stone-900 text-white rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs text-stone-400">
              <span>Sales & Demand Timeline (Past 60 Days Actuals &rarr; Next 45 Days Projected Demand)</span>
              <span className="text-xs text-emerald-400 font-semibold">Seasonal Trend Decomposition</span>
            </div>

            {/* Visual SVG Sparkline Trend with Festival Badges & Tooltips */}
            <div className="h-48 w-full flex items-end space-x-1 pt-6 pb-2 overflow-x-auto">
              {forecastData.historical_sample?.map((pt, idx) => (
                <div key={`h_${idx}`} className="group relative flex-1 min-w-[7px] h-full flex items-end">
                  <div 
                    className={`w-full rounded-t-xs transition-all ${
                      pt.holiday_flag
                        ? 'bg-amber-400 hover:bg-amber-300 ring-2 ring-amber-300 shadow-sm'
                        : 'bg-emerald-600 hover:bg-emerald-400'
                    }`}
                    style={{ height: `${Math.min((pt.y / 500) * 100, 100)}%` }}
                  ></div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                    <div className="bg-stone-950 text-white text-[10px] px-2.5 py-1 rounded-md shadow-xl border border-stone-700 whitespace-nowrap text-center">
                      <div className="font-bold text-emerald-300">{pt.ds} (Actual)</div>
                      <div>Sales: <strong>{pt.y}</strong> stems</div>
                      {pt.holiday_flag && (
                        <div className="text-amber-300 font-semibold mt-0.5">{pt.holiday_flag}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="w-1.5 h-full bg-rose-500 mx-1 shrink-0 flex items-center justify-center relative group" title="Today Boundary (2026-11-22)">
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-rose-950 text-rose-200 text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap font-bold">
                  TODAY (2026-11-22)
                </div>
              </div>
              {forecastData.forecast_points?.map((pt, idx) => (
                <div key={`f_${idx}`} className="group relative flex-1 min-w-[7px] h-full flex items-end">
                  <div 
                    className={`w-full rounded-t-xs transition-all ${
                      pt.holiday_flag 
                        ? 'bg-amber-400 hover:bg-amber-300 ring-2 ring-amber-300 shadow-sm' 
                        : 'bg-indigo-500 hover:bg-indigo-400 opacity-80'
                    }`}
                    style={{ height: `${Math.min((pt.yhat / 500) * 100, 100)}%` }}
                  ></div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                    <div className="bg-stone-950 text-white text-[10px] px-2.5 py-1 rounded-md shadow-xl border border-stone-700 whitespace-nowrap text-center">
                      <div className="font-bold text-indigo-300">{pt.ds} (Forecast)</div>
                      <div>Projected: <strong>{Math.round(pt.yhat)}</strong> stems</div>
                      <div className="text-stone-400 text-[9px]">Procure: {pt.recommended_procurement} stems</div>
                      {pt.holiday_flag && (
                        <div className="text-amber-300 font-bold mt-0.5">{pt.holiday_flag}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-between items-center text-[11px] text-stone-400 font-mono border-t border-stone-800 pt-2 gap-2">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Actual Sales (Past 60d)</span>
              <span className="text-rose-400 font-bold flex items-center gap-1"><span className="w-1.5 h-3 bg-rose-500 rounded"></span> TODAY CUTOFF</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-400"></span> Festive Shock Days (Diwali actual / Christmas projected)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500"></span> Standard Demand (Next 45d)</span>
            </div>
          </div>

          {/* Indian & Universal Festive Calendar & Botanical Demand Multipliers */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                  <span>Festive Calendar & Seasonal Demand Engine</span>
                </h4>
                <p className="text-xs text-stone-500">
                  Prioritized by chronological proximity to current system date (Upcoming &rarr; Recent &rarr; Annual)
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-200">
                {forecastData.supported_festivals?.length || 16} Festivals Tagged
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(forecastData.supported_festivals || []).map((fest) => {
                const isUpcoming = fest.timeline_status === 'upcoming';
                const isRecent = fest.timeline_status === 'recent';
                return (
                  <div 
                    key={fest.id} 
                    className={`p-3.5 rounded-2xl border transition-all space-y-1.5 ${
                      isUpcoming 
                        ? 'border-amber-400 bg-amber-50/40 hover:bg-amber-50/70 shadow-2xs' 
                        : isRecent
                          ? 'border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/60'
                          : 'border-stone-200 bg-stone-50/70 hover:bg-stone-100/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h5 className="font-bold text-stone-900 text-xs">{fest.name}</h5>
                        {fest.relative_label && (
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-md mt-0.5 ${
                            isUpcoming ? 'bg-amber-200 text-amber-900' : isRecent ? 'bg-emerald-200 text-emerald-900' : 'bg-stone-200 text-stone-700'
                          }`}>
                            {fest.relative_label}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                        {fest.demand_spike_multiplier}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-1">
                      <span>{fest.season}</span>
                      <span>&bull;</span>
                      <span className="text-stone-600">{fest.category}</span>
                    </div>
                    <div className="text-[11px] text-stone-700 bg-white/90 p-2 rounded-xl border border-stone-200/60 space-y-1">
                      <p><strong>Flowers:</strong> {fest.traditional_flowers}</p>
                      <p className="text-[10px] text-stone-500 italic">{fest.sacred_significance}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    {/* TAB 3: Event Quotations Manager */}
      {activeTab === 'quotations' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Corporate Orders & Quotes ({filteredQuotations.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  soundEffects.playClick();
                }}
                className="flex items-center gap-1.5"
              >
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                    placeholder="Search quote, client, company, venue..."
                    className="pl-8 pr-7 py-1.5 rounded-xl border border-stone-200 text-xs w-48 sm:w-64 focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                  {adminSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setAdminSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer shadow-xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            {filteredQuotations.map((q) => (
              <div key={q.id} className="p-5 rounded-2xl border border-stone-200 bg-stone-50/60 flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-serif font-bold text-lg text-stone-900">{q.company_name}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      q.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {q.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-stone-600">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">Event Type</span>
                      <strong className="text-stone-800 capitalize">{q.event_type}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">Target Date</span>
                      <strong className="text-stone-800">{q.event_date}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">Guest Scale</span>
                      <strong className="text-stone-800 capitalize">{q.guest_tier?.replace('_', ' ')}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">Delivery Distance</span>
                      <strong className="text-emerald-700 font-mono">{q.haversine_distance_km} km (Within Service Zone)</strong>
                    </div>
                  </div>

                  <div className="text-xs text-stone-600">
                    <span className="text-stone-400 font-bold">Venue Address:</span> {q.venue_address}
                  </div>

                  {q.staged_image_url && (
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="text-[11px] text-stone-400">Staged Venue Preview:</span>
                      <a href={q.staged_image_url} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-bold">
                        <span>View 3D Staged Venue</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between items-end gap-3 min-w-[200px]">
                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">Estimated Value</span>
                    <span className="font-serif text-2xl font-bold text-stone-900">
                      ₹{q.estimated_amount?.toLocaleString()}
                    </span>
                  </div>

                  {q.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleQuoteAction(q.id, 'rejected')}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-100 font-bold text-xs"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleQuoteAction(q.id, 'approved')}
                        className="px-4 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs"
                      >
                        Approve & Lock Date
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredQuotations.length === 0 && (
              <div className="p-8 text-center bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                <FileText className="w-8 h-8 mx-auto text-stone-400" />
                <h4 className="font-bold text-stone-700 text-sm">No corporate quotes matching "{adminSearchQuery}"</h4>
                <p className="text-xs text-stone-500">Try searching for company name, event type, or venue address.</p>
                <button
                  type="button"
                  onClick={() => setAdminSearchQuery('')}
                  className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Subscription Curation Insights */}
      {activeTab === 'curation_metrics' && curationMetrics && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Subscriptions
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <span className="text-xs text-emerald-900 font-bold block mb-1">Average Scent Satisfaction</span>
              <div className="text-3xl font-bold font-serif text-emerald-950">
                {curationMetrics.average_scent_satisfaction} / 5.0
              </div>
              <span className="text-[11px] text-emerald-700">Fragrance strength score</span>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
              <span className="text-xs text-indigo-900 font-bold block mb-1">Average Freshness Longevity</span>
              <div className="text-3xl font-bold font-serif text-indigo-950">
                {curationMetrics.average_freshness_satisfaction} / 5.0
              </div>
              <span className="text-[11px] text-indigo-700">Post-arrival vase-life feedback</span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-xs text-stone-700 font-bold block mb-1">Total Deliveries Evaluated</span>
              <div className="text-3xl font-bold font-serif text-stone-900">
                {curationMetrics.total_feedback_submissions}
              </div>
              <span className="text-[11px] text-stone-500">Customer feedback submissions</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
            <span className="font-bold text-stone-900 block">Customer Preference Insight:</span>
            <p className="text-stone-700 leading-relaxed">{curationMetrics.actionable_curation_insight}</p>
          </div>
        </div>
      )}

      {/* TAB: Customers */}
      {activeTab === 'user_accounts' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-sky-100 text-sky-800">
                  <UserCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-stone-900">
                    Customers ({usersList.filter(u => u.user_type !== 'admin').length})
                  </h3>
                  <p className="text-xs text-stone-500">Registered retail consumers and verified corporate clients</p>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-2">
              {[
                { id: 'all', label: `All (${usersList.filter(u => u.user_type !== 'admin').length})` },
                { id: 'individual', label: `Individual (${usersList.filter(u => u.user_type === 'individual').length})` },
                { id: 'corporate', label: `Corporate (${usersList.filter(u => u.user_type === 'corporate').length})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    soundEffects.playClick();
                    setUserFilter(f.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    userFilter === f.id
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar & Search Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              soundEffects.playClick();
              setAdminSearchQuery(userSearchQuery);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  setAdminSearchQuery(e.target.value);
                }}
                placeholder="Search clients by name, email, company or GSTIN..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-stone-900 outline-none"
              />
              <Users className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              {(userSearchQuery || adminSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setUserSearchQuery('');
                    setAdminSearchQuery('');
                  }}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center space-x-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </form>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                  <th className="p-3">Client Name</th>
                  <th className="p-3">Email & Contact</th>
                  <th className="p-3">Account Tier</th>
                  <th className="p-3">Company & GSTIN</th>
                  <th className="p-3">Registered On</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {usersList
                  .filter(u => u.user_type !== 'admin')
                  .filter(u => userFilter === 'all' || u.user_type === userFilter)
                  .filter(u => {
                    const q = (userSearchQuery || adminSearchQuery).trim().toLowerCase();
                    if (!q) return true;
                    return (
                      u.full_name?.toLowerCase().includes(q) ||
                      u.email?.toLowerCase().includes(q) ||
                      u.phone?.toLowerCase().includes(q) ||
                      u.company_name?.toLowerCase().includes(q) ||
                      u.gstin?.toLowerCase().includes(q) ||
                      String(u.id).includes(q)
                    );
                  })
                  .map((user) => {
                    const isCorporate = user.user_type === 'corporate';
                    const isAdmin = user.user_type === 'admin';
                    return (
                      <tr key={user.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-stone-900">{user.full_name}</div>
                          <div className="text-[11px] text-stone-400">ID: #{user.id}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-stone-800">{user.email}</div>
                          <div className="text-[11px] text-stone-500">{user.phone || 'No phone'}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isAdmin
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : isCorporate
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {user.user_type}
                          </span>
                        </td>
                        <td className="p-3">
                          {isCorporate ? (
                            <div>
                              <div className="font-bold text-stone-900">{user.company_name}</div>
                              <span className="font-mono text-[10px] text-indigo-700 font-bold">GSTIN: {user.gstin}</span>
                            </div>
                          ) : (
                            <span className="text-stone-400">Retail Consumer</span>
                          )}
                        </td>
                        <td className="p-3 text-stone-600 font-mono text-[11px]">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                {usersList
                  .filter(u => u.user_type !== 'admin')
                  .filter(u => userFilter === 'all' || u.user_type === userFilter)
                  .filter(u => {
                    const q = (userSearchQuery || adminSearchQuery).trim().toLowerCase();
                    if (!q) return true;
                    return (
                      u.full_name?.toLowerCase().includes(q) ||
                      u.email?.toLowerCase().includes(q) ||
                      u.phone?.toLowerCase().includes(q) ||
                      u.company_name?.toLowerCase().includes(q) ||
                      u.gstin?.toLowerCase().includes(q) ||
                      String(u.id).includes(q)
                    );
                  }).length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-stone-400 space-y-2">
                        <UserCheck className="w-8 h-8 mx-auto text-stone-300" />
                        <p className="font-bold text-stone-700 text-xs">No client accounts matching "{userSearchQuery || adminSearchQuery}"</p>
                        <button
                          type="button"
                          onClick={() => {
                            setUserSearchQuery('');
                            setAdminSearchQuery('');
                          }}
                          className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs rounded-lg font-semibold cursor-pointer"
                        >
                          Clear Search
                        </button>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Automated Activity & Alerts Log */}
      {activeTab === 'system_alerts' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className={`p-2 rounded-xl shrink-0 ${
                  currentTheme === 'rose'
                    ? 'bg-rose-100 text-rose-700'
                    : currentTheme === 'dark'
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  <Bell className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-stone-900">
                    System Alerts & Audit Log
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Real-time transactional notices, security checkpoints, and customer communications
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border ${
                currentTheme === 'rose'
                  ? 'bg-rose-50 text-rose-900 border-rose-200'
                  : currentTheme === 'dark'
                  ? 'bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {alerts.length} Dispatched
              </span>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  loadAllAdminData();
                }}
                className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
                title="Refresh Alerts"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Filter Bar */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Alerts' },
              { id: 'security', label: 'Security & Access' },
              { id: 'accounts', label: 'Client Accounts & OTPs' },
              { id: 'perishables', label: 'Freshness & Quotes' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => {
                  soundEffects.playClick();
                  setAlertFilter(f.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                  alertFilter === f.id
                    ? currentTheme === 'rose'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : currentTheme === 'dark'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Audit Logs Search Bar & Search Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              soundEffects.playClick();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                placeholder="Search audit logs by subject, body text, recipient, or event type..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-emerald-700 outline-none"
              />
              {adminSearchQuery && (
                <button
                  type="button"
                  onClick={() => setAdminSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center space-x-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </form>

          {/* Alerts List */}
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
                const meta = getAlertMeta(alert.alert_type);
                const MetaIcon = meta.icon;
                const cleanBody = alert.body.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
                const preview = cleanBody.slice(0, 160) + (cleanBody.length > 160 ? '...' : '');

                return (
                  <div 
                    key={alert.id} 
                    onClick={() => {
                      soundEffects.playClick();
                      setSelectedAlertModal(alert);
                    }}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md space-y-2 group ${
                      currentTheme === 'rose'
                        ? 'bg-white hover:bg-rose-50/40 border-rose-200/80 hover:border-rose-300'
                        : currentTheme === 'dark'
                        ? 'bg-[#131b2e] hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                        : 'bg-white hover:bg-stone-50 border-stone-200/90 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Left: Badge + Subject */}
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-[11px] shrink-0 ${meta.badgeColor}`}>
                          <MetaIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{meta.label}</span>
                        </span>
                        <h4 className={`font-bold text-xs sm:text-sm truncate transition-colors ${
                          currentTheme === 'rose'
                            ? 'text-stone-900 group-hover:text-rose-700'
                            : currentTheme === 'dark'
                            ? 'text-slate-100 group-hover:text-indigo-400'
                            : 'text-stone-900 group-hover:text-emerald-800'
                        }`}>
                          {alert.subject}
                        </h4>
                      </div>

                      {/* Right: Clean Date + Themed "View" Button */}
                      <div className="flex items-center space-x-3 shrink-0 self-end sm:self-auto">
                        <div className="flex items-center space-x-1.5 text-[11px] text-stone-500 font-medium">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>{formatAlertTime(alert.dispatched_at)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundEffects.playClick();
                            setSelectedAlertModal(alert);
                          }}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${
                            currentTheme === 'rose'
                              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 hover:shadow-md'
                              : currentTheme === 'dark'
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                              : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-emerald-800/20'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>

                    {/* Preview Line */}
                    <p className="text-xs text-stone-600 pl-1 line-clamp-2 leading-relaxed">
                      {preview}
                    </p>
                  </div>
                );
              })}

            {filteredAlerts.length === 0 && (
              <div className="p-8 text-center bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                <Bell className="w-8 h-8 mx-auto text-stone-400" />
                <h4 className="font-bold text-stone-700 text-sm">No audit logs matching "{adminSearchQuery}"</h4>
                <p className="text-xs text-stone-500">Try searching for keywords like 'login', 'registration', 'decay', or 'quote'.</p>
                <button
                  type="button"
                  onClick={() => setAdminSearchQuery('')}
                  className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        </div>
      )}



        </main>
      </div>

{/* Modal 1: Log Incoming Farm Harvest Batch */}
      {showHarvestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form onSubmit={handleLogHarvest} className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-700" />
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Log New Farm Harvest Shipment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHarvestModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Floral Species / Product:</label>
              <select
                value={harvestForm.product_id}
                onChange={(e) => setHarvestForm({ ...harvestForm, product_id: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                {products.filter(p => p.is_perishable).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.botanical_name})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Batch Tracking Code:</label>
                <input
                  type="text"
                  value={harvestForm.batch_code}
                  onChange={(e) => setHarvestForm({ ...harvestForm, batch_code: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300 font-mono text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Harvest Cut Date:</label>
                <input
                  type="date"
                  value={harvestForm.harvest_date}
                  onChange={(e) => setHarvestForm({ ...harvestForm, harvest_date: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300 text-xs font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Stem Quantity:</label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={harvestForm.quantity}
                  onChange={(e) => setHarvestForm({ ...harvestForm, quantity: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-stone-300 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Expected Vase Life (Days):</label>
                <input
                  type="number"
                  min="2"
                  max="14"
                  value={harvestForm.vase_life_days}
                  onChange={(e) => setHarvestForm({ ...harvestForm, vase_life_days: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-stone-300 text-xs font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Farm Origin & Polyhouse Source:</label>
              <input
                type="text"
                value={harvestForm.farm_origin}
                onChange={(e) => setHarvestForm({ ...harvestForm, farm_origin: e.target.value })}
                className="w-full p-2 rounded-xl border border-stone-300 text-xs"
                placeholder="e.g. Nilgiris High-Altitude Greenhouse #3"
              />
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800">
              Automatically registers harvest freshness at full price and calculates scheduled daily freshness pricing.
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowHarvestModal(false)}
                className="px-4 py-2 rounded-xl text-stone-600 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={harvestSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                {harvestSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Register Harvest Batch</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 1B: Edit Existing Farm Harvest Batch Details */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form onSubmit={handleUpdateBatch} className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-emerald-700" />
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Edit Harvest Batch Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingBatch(null)}
                className="text-stone-400 hover:text-stone-700 font-bold text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">
                Floral Species
              </span>
              <span className="text-sm font-bold text-stone-900">
                {editingBatch.product_name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Batch Tracking Code:</label>
                <input
                  type="text"
                  value={editBatchForm.batch_code}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, batch_code: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300 font-mono text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Harvest Cut Date:</label>
                <input
                  type="date"
                  value={editBatchForm.harvest_date}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, harvest_date: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300 text-xs font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Remaining Stock (Available):</label>
                <input
                  type="number"
                  min="0"
                  max="5000"
                  value={editBatchForm.remaining_quantity}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, remaining_quantity: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-stone-300 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Initial Inward Quantity:</label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={editBatchForm.initial_quantity}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, initial_quantity: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-stone-300 text-xs font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Vase Life (Days):</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={editBatchForm.vase_life_days}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, vase_life_days: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-stone-300 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Markdown (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={editBatchForm.discount_percent}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, discount_percent: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-stone-300 text-xs font-bold text-emerald-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Freshness Status:</label>
                <select
                  value={editBatchForm.status}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, status: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-300 text-xs font-semibold"
                >
                  <option value="fresh">Fresh (0%)</option>
                  <option value="prime">Prime (20%)</option>
                  <option value="clearance">Clearance</option>
                  <option value="expired">Expired (90%)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingBatch(null)}
                className="px-4 py-2 rounded-xl text-stone-600 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={batchActionSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                {batchActionSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Changes in Database</span>
              </button>
            </div>
          </form>
        </div>
      )}

            {/* Modal 1C: Edit Existing Product / Botanical Item */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <form onSubmit={handleUpdateProductSubmit} className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5 text-xs my-8">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    Edit Product in Database
                  </h3>
                  <p className="text-[11px] text-stone-500">ID: #{editingProduct.id} • Updates live across all storefront customers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-stone-400 hover:text-stone-700 font-bold text-2xl leading-none px-2 py-1"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={editProductForm.name}
                  onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Botanical Name (Optional)</label>
                <input
                  type="text"
                  value={editProductForm.botanical_name}
                  onChange={(e) => setEditProductForm({ ...editProductForm, botanical_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 italic text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Category *</label>
                <input
                  type="text"
                  required
                  value={editProductForm.category}
                  onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Retail Price (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={editProductForm.base_price}
                    onChange={(e) => setEditProductForm({ ...editProductForm, base_price: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-xs text-emerald-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={editProductForm.stock_quantity}
                  onChange={(e) => setEditProductForm({ ...editProductForm, stock_quantity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <label className="block font-bold text-stone-800">Product Images</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editProductImageUrlInput}
                  onChange={(e) => setEditProductImageUrlInput(e.target.value)}
                  placeholder="Image path (e.g. /monstera_plant_pot.jpg)..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (editProductImageUrlInput.trim()) {
                      setEditProductForm(prev => ({
                        ...prev,
                        images: [...(prev.images || []), editProductImageUrlInput.trim()]
                      }));
                      setEditProductImageUrlInput('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs"
                >
                  + Add URL
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {(editProductForm.images || []).map((img, idx) => (
                  <div key={idx} className="relative group w-14 h-14 rounded-xl overflow-hidden border border-stone-300 bg-white">
                    <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.src = '/pink_lily_bloom.jpg'; }} />
                    <button
                      type="button"
                      onClick={() => {
                        setEditProductForm(prev => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== idx)
                        }));
                      }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Sunlight Requirement</label>
                <input
                  type="text"
                  value={editProductForm.sunlight_requirement}
                  onChange={(e) => setEditProductForm({ ...editProductForm, sunlight_requirement: e.target.value })}
                  placeholder="e.g. Bright Indirect Light"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Watering Instructions</label>
                <input
                  type="text"
                  value={editProductForm.watering_frequency}
                  onChange={(e) => setEditProductForm({ ...editProductForm, watering_frequency: e.target.value })}
                  placeholder="e.g. Water every 2-3 days"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Botanical Description & Floriography</label>
              <textarea
                rows={2}
                value={editProductForm.floriography_meaning}
                onChange={(e) => setEditProductForm({ ...editProductForm, floriography_meaning: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 rounded-xl text-stone-600 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingProduct}
                className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                {isUpdatingProduct ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Changes in Database</span>
              </button>
            </div>
          </form>
        </div>
      )}

{/* Modal 2: Rendered Transactional Email Preview */}
      {selectedAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 space-y-4 text-xs">
            {/* Email Client Header Bar */}
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2.5">
                <span className={`p-2 rounded-xl shrink-0 ${
                  currentTheme === 'rose'
                    ? 'bg-rose-100 text-rose-700'
                    : currentTheme === 'dark'
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  <Mail className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Store Email Dispatch
                  </h3>
                  <p className="text-[11px] text-stone-500">Official transactional message record</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlertModal(null)}
                className="text-stone-400 hover:text-stone-700 font-bold text-2xl leading-none px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Email Meta Info Card */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 text-[11px]">
              <div className="flex items-center">
                <span className="w-16 font-bold text-stone-500">From:</span>
                <span className="font-semibold text-stone-900">Green Nest Bloom Logistics &lt;alerts@greennestbloom.com&gt;</span>
              </div>
              <div className="flex items-center">
                <span className="w-16 font-bold text-stone-500">To:</span>
                <span className={`font-mono font-bold ${
                  currentTheme === 'rose'
                    ? 'text-rose-700'
                    : currentTheme === 'dark'
                    ? 'text-indigo-600'
                    : 'text-emerald-800'
                }`}>
                  {selectedAlertModal.recipient_email || selectedAlertModal.recipient || 'admin@greennestbloom.com'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-16 font-bold text-stone-500">Subject:</span>
                <span className="font-bold text-stone-900">{selectedAlertModal.subject}</span>
              </div>
              <div className="flex items-center">
                <span className="w-16 font-bold text-stone-500">Date:</span>
                <span className="font-medium text-stone-600">{formatAlertTime(selectedAlertModal.dispatched_at)}</span>
              </div>
            </div>

            {/* Rendered HTML Email Body */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-inner max-h-72 overflow-y-auto">
              <div 
                className="prose prose-sm max-w-none font-sans"
                dangerouslySetInnerHTML={{ __html: selectedAlertModal.body }}
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-stone-100">
              <span className="text-[10px] text-stone-400 font-mono">Reference: GNB-NOTIF-SECURE</span>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setSelectedAlertModal(null);
                }}
                className={`px-5 py-2 rounded-xl text-white font-bold transition-all shadow-xs cursor-pointer ${
                  currentTheme === 'rose'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : currentTheme === 'dark'
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                    : 'bg-emerald-800 hover:bg-emerald-900 shadow-emerald-800/20'
                }`}
              >
                Acknowledge Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Manual Markdown Override */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form onSubmit={handleApplyOverride} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 text-xs">
            <h3 className="font-serif text-xl font-bold text-stone-900">Manual Markdown Override</h3>
            <p className="text-stone-500">
              Override dynamic pricing markdown for batch: <strong className="text-stone-900">{overrideModal.batch_code}</strong> ({overrideModal.product_name}).
            </p>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Discount Percentage (0 - 90%):</label>
              <input
                type="number"
                min="0"
                max="90"
                value={overrideDiscount}
                onChange={(e) => setOverrideDiscount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-bold"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
                className="px-4 py-2 rounded-xl text-stone-600 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
              >
                Apply Override
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 4: Interactive Courier Mobile Driver App */}
      {showCourierPortal && (
        <CourierPortal
          initialDriverId={courierModalDriverId}
          currentTheme={currentTheme}
          onClose={() => {
            setShowCourierPortal(false);
            loadAllAdminData();
          }}
        />
      )}

    </div>
  );
}
