import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Sparkles, 
  MapPin, 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Send, 
  RefreshCw,
  Camera,
  Compass,
  UploadCloud,
  SlidersHorizontal,
  Eye,
  FileDown,
  Box,
  Truck,
  ShieldCheck,
  Check,
  HelpCircle,
  Maximize2,
  ClipboardPaste,
  AlertTriangle,
  FileImage,
  ScanLine,
  X
} from 'lucide-react';
import { api } from '../api';
import { soundEffects } from '../utils/audio';

export default function EventStagingEngine({ user, onQuoteSubmitted, currentTheme = 'rose' }) {
  const [venues, setVenues] = useState([]);
  const [decorPricing, setDecorPricing] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('grand_stage');
  const [maskArea, setMaskArea] = useState('stage_backdrop');
  
  // Split Slider & Staging View Modes
  const [sliderPos, setSliderPos] = useState(50);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'side' | 'after' | 'before'
  const [customImage, setCustomImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadSource, setUploadSource] = useState(null); // 'file' | 'clipboard' | 'dragdrop'
  const [venueValidation, setVenueValidation] = useState({
    isAnalyzing: false,
    status: null, // null | 'analyzing' | 'verified' | 'non_venue' | 'error'
    result: null,
    override: false
  });
  const [pasteNotice, setPasteNotice] = useState(null);
  const [showBOMModal, setShowBOMModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [briefingData, setBriefingData] = useState(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [copiedPromptNotice, setCopiedPromptNotice] = useState(false);
  const fileInputRef = useRef(null);
  
  // Quotation Form State
  const [formData, setFormData] = useState({
    company_name: user?.company_name || 'The Leela Palace Bengaluru',
    event_type: 'wedding',
    event_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    guest_tier: 'medium_200',
    venue_address: 'Grand Ballroom, HAL Airport Road, Bengaluru',
    venue_latitude: 12.9602,
    venue_longitude: 77.6484,
    selected_modules: ['entrance_arch', 'stage_backdrop', 'table_centerpieces'],
    sentiment_prompt: 'A royal, enchanting wedding reception celebrating deep romantic passion, eternal joy, and regal grandeur.'
  });

  // Verification states
  const [dateStatus, setDateStatus] = useState({ checked: false, is_available: true, message: '' });
  const [radiusStatus, setRadiusStatus] = useState({ checked: false, is_valid: true, distance_km: 7.8, surcharge: 0.0, message: '' });
  const [nlpRecommendation, setNlpRecommendation] = useState(null);
  const [isNlpLoading, setIsNlpLoading] = useState(false);
  const [stagedPreview, setStagedPreview] = useState(null);
  const [isStagingLoading, setIsStagingLoading] = useState(false);
  const [stagingStep, setStagingStep] = useState('');
  const [stagingPrompt, setStagingPrompt] = useState(
    'Lush floral installation with ambient lighting, blush peonies, cascading wisteria, and luxury potted botanicals'
  );
  const [estimate, setEstimate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [inputApiKey, setInputApiKey] = useState('');
  const [apiKeyNotice, setApiKeyNotice] = useState(null);

  const handleSaveApiKey = async () => {
    if (!inputApiKey || inputApiKey.trim().length < 10) {
      alert('Please enter a valid Gemini API key.');
      return;
    }
    soundEffects.playClick();
    try {
      const res = await api.saveGeminiKey(inputApiKey.trim());
      if (res.success) {
        setApiKeyNotice('Gemini API key configured! Transforming your custom venue photo...');
        soundEffects.playSuccessChime();
        setInputApiKey('');
        setTimeout(() => setApiKeyNotice(null), 4000);
        handleRunInpainting();
      } else {
        alert(res.error || 'Failed to save API key.');
      }
    } catch (err) {
      console.error('Error saving API key:', err);
      alert('Could not save API key.');
    }
  };

  // Fetch dynamic floral procurement stem briefing for the finalized venue & decor
  const fetchFloralBriefing = async () => {
    soundEffects.playClick();
    setIsBriefingLoading(true);
    try {
      const res = await api.getFloralBriefing(
        selectedTemplate,
        formData.guest_tier,
        formData.selected_modules,
        stagingPrompt
      );
      setBriefingData(res);
      setShowBOMModal(true);
    } catch (err) {
      console.error('Failed to fetch floral briefing:', err);
      setShowBOMModal(true);
    } finally {
      setIsBriefingLoading(false);
    }
  };

  // Load venues & decor pricing
  useEffect(() => {
    async function loadVenues() {
      try {
        const res = await api.getVenueTemplates();
        if (res.templates) {
          setVenues(res.templates);
          setDecorPricing(res.decor_pricing);
        }
      } catch (err) {
        console.error('Failed to load venue templates:', err);
      }
    }
    loadVenues();
  }, []);

  // Check date availability whenever date changes
  useEffect(() => {
    async function verifyDate() {
      if (!formData.event_date) return;
      try {
        const res = await api.checkEventDate(formData.event_date);
        setDateStatus({
          checked: true,
          is_available: res.is_available,
          message: res.reason
        });
      } catch (err) {
        console.error('Date check error:', err);
      }
    }
    verifyDate();
  }, [formData.event_date]);

  // Check radius validation whenever coords change
  useEffect(() => {
    async function verifyRadius() {
      try {
        const res = await api.checkVenueRadius(formData.venue_latitude, formData.venue_longitude);
        setRadiusStatus({
          checked: true,
          is_valid: res.is_valid,
          distance_km: res.distance_km,
          surcharge: res.surcharge,
          message: res.message
        });
      } catch (err) {
        console.error('Radius check error:', err);
      }
    }
    verifyRadius();
  }, [formData.venue_latitude, formData.venue_longitude]);

  // Recalculate itemized estimate
  useEffect(() => {
    async function computeEstimate() {
      try {
        const res = await api.calculateEventEstimate(formData.guest_tier, formData.selected_modules);
        setEstimate(res);
      } catch (err) {
        console.error('Estimate computation error:', err);
      }
    }
    computeEstimate();
  }, [formData.guest_tier, formData.selected_modules]);

  // Handle DistilBERT NLP Floriography Analysis
  const handleAnalyzeSentiment = async () => {
    if (!formData.sentiment_prompt.trim()) return;
    soundEffects.playClick();
    setIsNlpLoading(true);
    try {
      const res = await api.recommendFloriography(formData.sentiment_prompt);
      setNlpRecommendation(res);
      soundEffects.playSuccessChime();
    } catch (err) {
      console.error('NLP analysis error:', err);
    } finally {
      setIsNlpLoading(false);
    }
  };

  // Handle Diffusion Inpainting Staging Generation
  const handleGenerateStaging = async () => {
    soundEffects.playClick();
    setIsStagingLoading(true);
    try {
      const res = await api.generateStagingPreview(selectedTemplate, formData.sentiment_prompt, maskArea, customImage);
      setStagedPreview(res);
      soundEffects.playSuccessChime();
    } catch (err) {
      console.error('Staging preview error:', err);
    } finally {
      setIsStagingLoading(false);
    }
  };

  // Unified image processor: handles Browse, Drag & Drop, and Clipboard Paste
  const processVenueImage = (input, source = 'Browse') => {
    setUploadSource(source);
    setPasteNotice(`Loaded photo via ${source}`);
    setTimeout(() => setPasteNotice(null), 3500);

    const handleDataUrl = async (dataUrl) => {
      setCustomImage(dataUrl);
      setStagedPreview(null);
      soundEffects.playStemSnip();
      
      // Trigger Computer Vision Venue Classification
      setVenueValidation({
        isAnalyzing: true,
        status: 'analyzing',
        result: null,
        override: false
      });

      try {
        const res = await api.validateVenueImage(dataUrl);
        if (res.is_venue) {
          setVenueValidation({
            isAnalyzing: false,
            status: 'verified',
            result: res,
            override: false
          });
          soundEffects.playSuccessChime();
        } else {
          setVenueValidation({
            isAnalyzing: false,
            status: 'non_venue',
            result: res,
            override: false
          });
        }
      } catch (err) {
        console.error('Venue validation error:', err);
        setVenueValidation({
          isAnalyzing: false,
          status: 'error',
          result: { message: 'Image analysis could not complete, but staging is available.' },
          override: true
        });
      }

      // Auto-trigger inpainting synthesis onto the uploaded photo
      setIsStagingLoading(true);
      setStagingStep('Synthesizing floral installation & ambient lighting on uploaded photo...');
      try {
        const inpaintRes = await api.generateStagingPreview(
          selectedTemplate,
          stagingPrompt,
          maskArea,
          dataUrl
        );
        if (inpaintRes && inpaintRes.staged_result_image) {
          setStagedPreview(inpaintRes);
          setViewMode('split');
          setSliderPos(50);
          soundEffects.playBloomChime();
        }
      } catch (err) {
        console.error('Auto-inpaint error:', err);
      } finally {
        setIsStagingLoading(false);
        setStagingStep('');
      }
    };

    if (typeof input === 'string') {
      handleDataUrl(input);
    } else if (input instanceof Blob || input instanceof File) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => handleDataUrl(uploadEvent.target.result);
      reader.readAsDataURL(input);
    }
  };

  // Handle standard file input selection
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processVenueImage(file, 'Browse File');
  };

  // Handle explicit Clipboard Paste button
  const handlePasteFromClipboard = async () => {
    soundEffects.playClick();
    try {
      if (!navigator.clipboard?.read) {
        alert('Please press ⌘V (or Ctrl+V) on your keyboard to paste the venue image from clipboard.');
        return;
      }
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          processVenueImage(blob, 'Clipboard Paste');
          return;
        }
      }
      alert('No image found on your clipboard. Please copy a venue image first, then click Paste (or press ⌘V / Ctrl+V).');
    } catch (err) {
      console.warn('Clipboard read error:', err);
      alert('To paste from clipboard, press ⌘V (or Ctrl+V) while viewing this section.');
    }
  };

  // Global window paste listener for ⌘V / Ctrl+V
  useEffect(() => {
    const handleWindowPaste = (e) => {
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      
      const items = e.clipboardData?.items;
      if (!items) return;

      const hasImage = Array.from(items).some((item) => item.type.startsWith('image/'));
      if (!hasImage) return;

      // If user is pasting an image, intercept even if focused
      e.preventDefault();
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            processVenueImage(file, 'Clipboard Paste (⌘V)');
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, []);

  // Drag handler for before/after comparison
  const handleSliderMove = (clientX, rect) => {
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPos(percent);
  };

  // Handle Quotation Submission
  const handleSubmitQuotation = async (e) => {
    e.preventDefault();
    if (!dateStatus.is_available) {
      alert('Selected date is locked by another confirmed booking. Please choose an alternate date.');
      return;
    }
    if (!radiusStatus.is_valid) {
      alert('Venue exceeds the 35km maximum freshness delivery boundary.');
      return;
    }
    if (!user?.email) {
      alert('Please sign in or create an account to submit your event staging quotation.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        user_email: user.email,
        company_name: formData.company_name,
        event_type: formData.event_type,
        event_date: formData.event_date,
        guest_tier: formData.guest_tier,
        venue_address: formData.venue_address,
        venue_latitude: formData.venue_latitude,
        venue_longitude: formData.venue_longitude,
        modules: formData.selected_modules,
        staged_image_url: stagedPreview?.staged_result_image || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
        sentiment_prompt: formData.sentiment_prompt
      };

      const res = await api.submitEventQuote(payload);
      soundEffects.playSuccessChime();
      setSuccessMessage(res.message);
      if (onQuoteSubmitted) onQuoteSubmitted(res.quote);
    } catch (err) {
      alert('Error registering event quotation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunInpainting = async () => {
    soundEffects.playClick();
    setIsStagingLoading(true);
    setStagingStep('Analyzing architectural perspective lines & spatial depth...');
    
    const stepTimer1 = setTimeout(() => setStagingStep('Segmenting targeted architectural decor zone...'), 400);
    const stepTimer2 = setTimeout(() => setStagingStep('Diffusing conditioned botanical textures & living potted plants...'), 900);
    const stepTimer3 = setTimeout(() => setStagingStep('Compositing ambient fairy lighting & specular highlights...'), 1400);

    try {
      const res = await api.generateStagingPreview(
        selectedTemplate,
        stagingPrompt,
        maskArea,
        customImage
      );

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      if (res && res.staged_result_image) {
        setStagedPreview(res);
        setViewMode('split');
        setSliderPos(50);
        soundEffects.playBloomChime();
      } else {
        alert('Staging pipeline encountered an unexpected response.');
      }
    } catch (err) {
      console.error('Inpainting error:', err);
      alert('Failed to generate staging preview. Please try again.');
    } finally {
      setIsStagingLoading(false);
      setStagingStep('');
    }
  };

  const activeVenueObj = venues.find((v) => v.id === selectedTemplate) || venues[0];
  const beforeImg = customImage || activeVenueObj?.base_image || '/venues/grand_stage_base.jpg';
  const afterImg = stagedPreview?.staged_result_image || (customImage ? customImage : activeVenueObj?.staged_preview) || '/venues/grand_stage_staged.jpg';

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Header Banner */}
      <div className="text-left pb-6 border-b border-stone-200">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Virtual Floral Venue Staging & Event Styling
        </h2>
      </div>

      {/* Important Alert Notice - Only displayed for critical booking notices */}
      {!dateStatus.is_available && dateStatus.checked && (
        <div className="flex items-center space-x-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Important Notice:</span> {dateStatus.message || 'Selected date has limited or reserved staging slots.'}
          </div>
        </div>
      )}

      {successMessage ? (
        <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-4 max-w-2xl mx-auto shadow-md">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="font-serif text-2xl font-bold text-emerald-950">Quotation Successfully Registered</h3>
          <p className="text-sm text-emerald-800 leading-relaxed">{successMessage}</p>
          <div className="p-3 bg-white rounded-xl border border-emerald-200/80 text-xs text-stone-600">
            Booking request confirmed and routed directly to our Head Florist for schedule reservation.
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="px-6 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-bold"
          >
            Create Another Staging Request
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Structured Quotation Inputs */}
          <div className="lg:col-span-6 space-y-6">
            <form onSubmit={handleSubmitQuotation} className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-sm space-y-5">
              <h3 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
                <span>1. Event Specifications & Booking Guards</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Company / Organization:</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Event Category:</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="wedding">Grand Wedding & Reception</option>
                    <option value="gala">Corporate Gala & Awards Night</option>
                    <option value="corporate_banquet">Executive VIP Banquet</option>
                    <option value="anniversary">Milestone Anniversary Showcase</option>
                  </select>
                </div>
              </div>

              {/* Date with Single-Event-Per-Day Collision Guard */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Scheduled Event Date (Single-Event-Per-Day Lock):
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-medium ${
                      dateStatus.is_available ? 'border-stone-300' : 'border-rose-400 bg-rose-50'
                    }`}
                    required
                  />
                </div>

                {dateStatus.checked && (
                  <div className={`mt-1.5 p-2 rounded-lg text-xs flex items-center gap-2 ${
                    dateStatus.is_available ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                  }`}>
                    {dateStatus.is_available ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="leading-tight">{dateStatus.message}</span>
                  </div>
                )}
              </div>

              {/* Guest Tier & Scale */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Guest Scale & Hospitality Tier:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'intimate_50', label: 'Intimate (50)', mult: '1.0x' },
                    { id: 'medium_200', label: 'Medium (200)', mult: '1.35x' },
                    { id: 'grand_500', label: 'Grand (500+)', mult: '1.85x' }
                  ].map((tier) => (
                    <button
                      type="button"
                      key={tier.id}
                      onClick={() => setFormData({ ...formData, guest_tier: tier.id })}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                        formData.guest_tier === tier.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 text-stone-600'
                      }`}
                    >
                      <div>{tier.label}</div>
                      <span className="text-[10px] text-stone-400 font-normal">{tier.mult} multiplier</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Venue Address & Haversine Radius Check */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Venue Address:</label>
                <input
                  type="text"
                  value={formData.venue_address}
                  onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                  required
                />

                <div className="mt-2 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Compass className="w-4 h-4 text-indigo-600" />
                    <span>
                      Delivery Distance: <strong className="text-stone-900">{radiusStatus.distance_km} km</strong> (Freshness Limit: 35.0 km)
                    </span>
                  </div>
                  {radiusStatus.is_valid ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                      Within Fresh Delivery Zone
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[11px]">
                      Outside Delivery Zone
                    </span>
                  )}
                </div>
              </div>

              {/* Decor Packages Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">Decor Modules Required:</label>
                <div className="space-y-2">
                  {decorPricing && Object.entries(decorPricing).map(([key, item]) => {
                    const isChecked = formData.selected_modules.includes(key);
                    return (
                      <div
                        key={key}
                        onClick={() => {
                          const updated = isChecked
                            ? formData.selected_modules.filter((m) => m !== key)
                            : [...formData.selected_modules, key];
                          setFormData({ ...formData, selected_modules: updated });
                        }}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked ? 'border-indigo-600 bg-indigo-50/50' : 'border-stone-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" checked={isChecked} readOnly className="rounded-sm text-indigo-600" />
                          <span className="text-xs font-semibold text-stone-900">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold text-indigo-900">Base ₹{item.base_price.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Itemized Estimate Summary with Detailed BOM Drawer */}
              {estimate && (
                <div className="p-4 bg-stone-900 text-white rounded-2xl space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Projected Stems</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">{estimate.total_stems} stems</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBOMModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-[11px] text-emerald-300 font-bold border border-stone-700 flex items-center gap-1"
                    >
                      <Box className="w-3 h-3" />
                      <span>View Setup & Floral Breakdown</span>
                    </button>
                  </div>

                  <div className="flex justify-between text-stone-300">
                    <span>Subtotal</span>
                    <span className="font-mono">₹{estimate.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-stone-300">
                    <span>GST (18% Commercial Event Staging)</span>
                    <span className="font-mono">₹{estimate.gst_18.toLocaleString()}</span>
                  </div>
                  {radiusStatus.surcharge > 0 && (
                    <div className="flex justify-between text-amber-300">
                      <span>Logistics Transit Surcharge (&gt;20km)</span>
                      <span className="font-mono">+₹{radiusStatus.surcharge.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-stone-800 text-white">
                    <span>Grand Total Estimate</span>
                    <span className="font-mono text-emerald-400">
                      ₹{(estimate.grand_total + radiusStatus.surcharge).toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowProposalModal(true)}
                      className="text-[11px] text-indigo-300 hover:text-indigo-200 flex items-center gap-1 font-semibold underline"
                    >
                      <FileDown className="w-3 h-3" />
                      <span>Preview Client Formal Quotation Sheet</span>
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !dateStatus.is_available || !radiusStatus.is_valid}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Event Request for Review</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: AI Staging Inpainting & NLP Floriography */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* DistilBERT Floriography NLP Analyzer */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>2. Floral Mood & Sentiment Matcher</span>
                </h3>
                <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  Smart Match
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Event Emotional Theme & Aesthetic Prompt:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.sentiment_prompt}
                    onChange={(e) => setFormData({ ...formData, sentiment_prompt: e.target.value })}
                    placeholder="e.g. Royal romantic love and joy, peaceful pure remembrance..."
                    className="flex-1 p-2.5 rounded-xl border border-stone-300 text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAnalyzeSentiment}
                    disabled={isNlpLoading}
                    className="px-4 py-2.5 rounded-xl bg-indigo-900 text-white text-xs font-bold shrink-0 hover:bg-indigo-800 transition-colors"
                  >
                    {isNlpLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Analyze'}
                  </button>
                </div>
              </div>

              {/* NLP Output Card */}
              {nlpRecommendation && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/70 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950">
                      {nlpRecommendation.floriography_profile.primary_emotion}
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-700">
                      {nlpRecommendation.confidence_percentage}% Confidence
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-stone-600">Recommended Palette:</span>
                    <div className="flex space-x-1">
                      {nlpRecommendation.floriography_profile.palette.map((color, i) => (
                        <span key={i} className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: color }}></span>
                      ))}
                    </div>
                    <span className="text-xs font-serif italic text-stone-800 font-medium">
                      ({nlpRecommendation.floriography_profile.palette_name})
                    </span>
                  </div>

                  <div className="space-y-1.5 border-t border-indigo-200/60 pt-2">
                    <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">Suggested Botanical Stems:</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {nlpRecommendation.floriography_profile.primary_flowers.map((fl, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-white border border-indigo-100">
                          <strong className="block text-indigo-950">{fl.name}</strong>
                          <span className="text-[10px] text-stone-500 italic block">{fl.botanical}</span>
                          <span className="text-[10px] text-stone-600 line-clamp-1">{fl.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generative Inpainting Venue Staging Canvas with Before / After Split Slider */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>3. Virtual Before & After Venue Staging</span>
                </h3>
                <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  AI Preview
                </span>
              </div>

              {/* Template Selector & Custom Upload Button */}
              <div className="grid grid-cols-2 gap-2">
                {venues.map((v) => (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => {
                      soundEffects.playClick();
                      setSelectedTemplate(v.id);
                      setCustomImage(null);
                      setStagedPreview(null);
                      if (v.default_palette) {
                        setStagingPrompt(`Lush floral installation with ambient lighting, ${v.default_palette.toLowerCase()} and luxury potted botanicals`);
                      }
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      selectedTemplate === v.id && !customImage
                        ? 'border-emerald-600 bg-emerald-50/60 font-bold shadow-xs ring-1 ring-emerald-500'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <span className="text-xs block text-stone-900 truncate">{v.name}</span>
                    <span className="text-[10px] text-stone-500">{v.category} • {v.default_palette}</span>
                  </button>
                ))}
              </div>

              {/* Custom Image Upload & Inpainting Intake Zone */}
              <div 
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  const file = e.dataTransfer?.files?.[0];
                  if (file && file.type.startsWith('image/')) {
                    processVenueImage(file, 'Drag & Drop');
                  }
                }}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                  isDraggingFile
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-md ring-4 ring-emerald-200/50'
                    : customImage
                    ? 'border-stone-300 bg-white shadow-xs'
                    : 'border-dashed border-stone-300 hover:border-emerald-500/70 bg-stone-50/70'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-stone-900 flex items-center space-x-1.5">
                        <span>{customImage ? 'Custom Client Venue Photo' : 'Upload, Drag, or Paste Venue Architecture'}</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                          AI Inpainting Ready
                        </span>
                      </h4>
                      <p className="text-[10px] text-stone-500">
                        Drag & drop, paste from clipboard (⌘V / Ctrl+V), or browse image file
                      </p>
                    </div>
                  </div>

                  {/* Actions: Browse & Paste Buttons */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 font-bold text-[11px] shadow-2xs flex items-center space-x-1.5 transition-all"
                    >
                      <FileImage className="w-3.5 h-3.5 text-stone-600" />
                      <span>{customImage ? 'Change File' : 'Browse'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm flex items-center space-x-1.5 transition-all active:scale-95"
                      title="Paste image from clipboard (⌘V / Ctrl+V)"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5 text-emerald-100" />
                      <span>Paste Image (⌘V)</span>
                    </button>

                    {customImage && (
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          setCustomImage(null);
                          setVenueValidation({ isAnalyzing: false, status: null, result: null, override: false });
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                        title="Remove custom photo and revert to template"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Prominent Visual Dropzone when no image is loaded */}
                {!customImage && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="py-5 px-4 text-center border-2 border-dashed border-emerald-300/80 rounded-xl bg-white/70 hover:bg-emerald-50/50 transition-all cursor-pointer group space-y-1.5"
                  >
                    <div className="flex justify-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 group-hover:scale-110 flex items-center justify-center text-emerald-700 transition-transform">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="font-bold text-xs text-stone-900">
                      Drag & Drop Venue Photo Here, or press <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 text-stone-800 rounded font-mono text-[10px] shadow-2xs font-semibold">⌘V</kbd> / <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 text-stone-800 rounded font-mono text-[10px] shadow-2xs font-semibold">Ctrl+V</kbd>
                    </div>
                    <p className="text-[11px] text-stone-500 max-w-md mx-auto">
                      Our Computer Vision heuristic model automatically validates spatial perspective lines, stage lighting, and architectural depth before inpainting.
                    </p>
                  </div>
                )}

                {/* Paste / Upload Toast Notification */}
                {pasteNotice && (
                  <div className="my-2 px-3 py-1.5 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-[11px] font-semibold flex items-center space-x-2 animate-in fade-in">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{pasteNotice}</span>
                  </div>
                )}

                {/* Venue Identification & Computer Vision Status Card */}
                {customImage && (
                  <div className="mt-2.5 pt-2.5 border-t border-stone-200/80 space-y-2">
                    {/* Analyzing Spinner State */}
                    {venueValidation.isAnalyzing && (
                      <div className="p-3 rounded-xl bg-stone-100/80 border border-stone-200 flex items-center space-x-2.5 text-xs text-stone-700 animate-pulse">
                        <ScanLine className="w-4 h-4 text-emerald-600 animate-spin" />
                        <div>
                          <strong className="block text-stone-900 text-xs font-semibold">
                            AI Venue Detection in progress...
                          </strong>
                          <span className="text-[11px] text-stone-500">
                            Analyzing architectural perspective lines, room depth, and lighting zones.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Verified Venue Badge */}
                    {venueValidation.status === 'verified' && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300/80 space-y-1.5 text-xs animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center space-x-1.5 font-bold text-emerald-900">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Verified Venue Architecture ({Math.round((venueValidation.result?.confidence || 0.9) * 100)}% Match)</span>
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-900 font-bold">
                            {venueValidation.result?.detected_type || 'Ballroom & Stage'}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          {venueValidation.result?.message || 'Venue spatial layout detected with optimal perspective depth for floral inpainting.'}
                        </p>
                        {venueValidation.result?.attributes && (
                          <div className="flex items-center space-x-3 text-[10px] text-emerald-700 pt-1 font-mono">
                            <span>Res: {venueValidation.result.attributes.dimensions}</span>
                            <span>•</span>
                            <span>Aspect: {venueValidation.result.attributes.aspect_ratio}</span>
                            <span>•</span>
                            <span>Depth: {venueValidation.result.attributes.lighting_depth}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Non-Venue Detected Warning Badge */}
                    {venueValidation.status === 'non_venue' && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 space-y-2 text-xs animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center space-x-1.5 font-bold text-amber-900">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span>Non-Venue Image Detected</span>
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">
                            {venueValidation.result?.detected_type || 'Non-Venue'}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          {venueValidation.result?.message || 'This photo does not appear to be an event hall, ballroom, or stage. Diffusion inpainting results may look distorted.'}
                        </p>
                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1 rounded-lg bg-amber-900 text-white font-bold text-[11px] hover:bg-amber-800 transition-colors"
                          >
                            Upload Venue Photo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              soundEffects.playClick();
                              setVenueValidation((prev) => ({ ...prev, override: true, status: 'verified' }));
                            }}
                            className="px-3 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold text-[11px] hover:bg-amber-100/50 transition-colors"
                          >
                            Override & Stage Anyway
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Generative Inpainting Action Controls */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-xs text-stone-900">
                      Conditioned Latent Diffusion Inpainting Controls
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-bold">
                    Resolution: 1200x800
                  </span>
                </div>

                {/* Target Architectural Zone Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1.5">
                    Target Architectural Zone to Inpaint:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: 'stage_backdrop', label: 'Stage Wall & Dais' },
                      { id: 'entrance_arch', label: 'Entrance Archway' },
                      { id: 'table_centerpieces', label: 'Tablescape Blooms' },
                      { id: 'aisle_runners', label: 'Aisle Petal Carpet' }
                    ].map((zone) => (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          setMaskArea(zone.id);
                        }}
                        className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all flex items-center justify-center ${
                          maskArea === zone.id
                            ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <span className="truncate text-[11px] text-center">{zone.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botanical Styling Presets & Customization Chips */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-stone-700">
                      Floral Palette & Theme Presets:
                    </label>
                    <span className="text-[10px] text-indigo-700 font-mono font-medium">1-Click Client Presets</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Crimson Roses & Imperial Orchids', prompt: 'Grand royal banquet backdrop with deep Dutch crimson velvet roses, imperial purple orchids, and golden chandelier warmth' },
                      { label: 'Ivory Calla Lilies & Golden Freesia', prompt: 'Royal wedding floral arch with pure ivory calla lilies, white orchids, golden freesia, and warm amber chandeliers' },
                      { label: 'Auspicious Saffron Marigolds', prompt: 'Opulent Indian royal wedding mandap stage with cascading golden yellow marigolds, brass lamps, and mango leaf swags' },
                      { label: 'Blush Peonies & Wisteria', prompt: 'Lush floral installation with ambient fairy lighting, blush peonies, cascading wisteria, and luxury potted botanicals' },
                      { label: 'Botanical Glasshouse & Monsteras', prompt: 'Botanical glasshouse aesthetic with potted monstera plants, fiddle leaf figs, silver eucalyptus, and white lilies' },
                      { label: 'Royal Violet Orchids', prompt: 'Opulent evening gala with violet vanda orchids, crystal tablescapes, and ambient candlelight glows' }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          setStagingPrompt(preset.prompt);
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                          stagingPrompt === preset.prompt
                            ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs'
                            : 'bg-white hover:bg-indigo-50 border-stone-200 text-stone-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Quick Accent Modifiers */}
                  <div className="flex items-center gap-1 text-[10px] text-stone-500 pt-1">
                    <span className="font-semibold text-stone-700">Quick Accents:</span>
                    {[
                      '+ Warm Chandelier Glow',
                      '+ Potted Monstera Urns',
                      '+ Cascading Wisteria',
                      '+ Fresh Rose Petal Carpet',
                      '+ Fairy Light Curtain'
                    ].map((accent, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          if (!stagingPrompt.includes(accent.replace('+ ', ''))) {
                            setStagingPrompt(`${stagingPrompt}, ${accent.replace('+ ', '')}`);
                          }
                        }}
                        className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium transition-colors"
                      >
                        {accent}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Input & Execute Button */}
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={stagingPrompt}
                      onChange={(e) => setStagingPrompt(e.target.value)}
                      placeholder="Describe custom floral stems, potted nursery plants, and lighting..."
                      className="w-full pl-3 pr-28 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-2xs"
                    />
                    <div className="absolute right-2 top-2 flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(stagingPrompt);
                          setCopiedPromptNotice(true);
                          setTimeout(() => setCopiedPromptNotice(false), 2000);
                          soundEffects.playClick();
                        }}
                        className="px-2 py-1 rounded bg-stone-100 hover:bg-indigo-100 text-stone-700 hover:text-indigo-800 text-[10px] font-bold transition-colors"
                        title="Copy this customization prompt for your client"
                      >
                        {copiedPromptNotice ? 'Copied' : 'Copy Prompt'}
                      </button>
                    </div>
                  </div>

                  {/* Dual Action Buttons: Render Staging & View Floral Quantity Briefing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      id="btn-run-inpainting"
                      disabled={isStagingLoading}
                      onClick={handleRunInpainting}
                      className={`py-3 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 ${
                        isStagingLoading
                          ? 'bg-indigo-400 cursor-wait'
                          : 'bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 hover:from-indigo-600 hover:to-indigo-800 active:scale-[0.99] shadow-indigo-900/30'
                      }`}
                    >
                      {isStagingLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>{stagingStep || 'Synthesizing Realistic Staging...'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Render Realistic Floral Staging</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isBriefingLoading}
                      onClick={fetchFloralBriefing}
                      className="py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 active:scale-[0.99]"
                    >
                      {isBriefingLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Box className="w-4 h-4 text-emerald-300" />
                      )}
                      <span>View Venue Floral Quantity Briefing</span>
                    </button>
                  </div>

                  {/* Status Banner when API Key is Required for Custom Photo Transformation */}
                  {stagedPreview?.pipeline_status === 'api_key_required' && !isStagingLoading && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs space-y-3 shadow-xs">
                      <div className="flex items-start space-x-2.5">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-xs text-amber-950">Google Gemini Generative AI Transformation Ready</p>
                          <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                            To transform your custom venue photo directly into a decorated venue with genuine generative florals, enter your Gemini API key below:
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                        <input
                          type="password"
                          placeholder="Paste GEMINI_API_KEY..."
                          value={inputApiKey}
                          onChange={(e) => setInputApiKey(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={handleSaveApiKey}
                          className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shrink-0 transition-colors shadow-xs"
                        >
                          Save & Transform
                        </button>
                      </div>
                      <p className="text-[10px] text-amber-700/80">
                        Keys are saved securely in your local environment. Free keys available at aistudio.google.com
                      </p>
                    </div>
                  )}

                  {apiKeyNotice && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold animate-in fade-in flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{apiKeyNotice}</span>
                    </div>
                  )}

                  {/* Status Toast when inpainting complete */}
                  {stagedPreview?.pipeline_status === 'success' && !isStagingLoading && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-[11px]">
                          {stagedPreview.status_message || 'Photorealistic Staging Rendered: Botanical installations & living plants synthesized on venue.'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                        {stagedPreview.mask_target || maskArea}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* View Mode Controls */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-600">Interactive Staging View:</span>
                <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl">
                  {[
                    { id: 'split', label: '50/50 Slider' },
                    { id: 'side', label: 'Side-by-Side' },
                    { id: 'after', label: 'Staged (After)' },
                    { id: 'before', label: 'Raw (Before)' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setViewMode(mode.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        viewMode === mode.id
                          ? 'bg-stone-900 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Before / After Split Screen Container */}
              {viewMode === 'split' && (
                <div 
                  className="relative aspect-16/10 rounded-2xl overflow-hidden bg-stone-950 border border-stone-200 shadow-md select-none cursor-ew-resize group"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    const file = e.dataTransfer?.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      processVenueImage(file, 'Canvas Drop');
                    }
                  }}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    handleSliderMove(e.clientX, rect);
                  }}
                  onTouchMove={(e) => {
                    if (e.touches.length > 0) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      handleSliderMove(e.touches[0].clientX, rect);
                    }
                  }}
                >
                  {/* Base Image (Before: Raw Architecture) */}
                  <img
                    src={beforeImg}
                    alt="Raw Venue Architecture"
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Staged Image (After: Generative Diffusion Floral Installation with Pixel-Perfect ClipPath) */}
                  <div 
                    className="absolute inset-0 pointer-events-none select-none"
                    style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                  >
                    <img
                      src={afterImg}
                      alt="Generative Floral Staging"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    {/* Badge on Staged side */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 font-bold text-[10px] backdrop-blur-xs border border-emerald-500/30">
                      Floral Staged Preview
                    </div>
                  </div>

                  {/* Badge on Raw Architecture side */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-stone-950/80 text-stone-300 font-bold text-[10px] backdrop-blur-xs border border-white/20">
                    Original Venue
                  </div>

                  {/* Loading Overlay during inpainting */}
                  {isStagingLoading && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-white shadow-xl">
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-white font-bold text-sm">Synthesizing Inpainting...</h4>
                        <p className="text-emerald-300 text-xs font-mono">{stagingStep || 'Diffusing conditioned botanical installation...'}</p>
                      </div>
                    </div>
                  )}

                  {/* Vertical Drag Line Divider & Handle */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl pointer-events-none"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-stone-900 font-bold flex items-center justify-center shadow-xl border-2 border-emerald-600 text-xs">
                      ↔
                    </div>
                  </div>

                  {/* Bottom Info Banner */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex justify-between items-end text-white text-[11px]">
                    <div>
                      <span className="font-serif font-bold text-emerald-200 block text-xs">
                        {customImage ? 'Client Custom Architecture' : activeVenueObj?.name}
                      </span>
                      <span className="text-stone-300 text-[10px]">
                        Drag slider to inspect structural floral transformation
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-400 bg-black/50 px-2 py-0.5 rounded">
                      {sliderPos}% Split
                    </span>
                  </div>
                </div>
              )}

              {/* Side-by-side mode */}
              {viewMode === 'side' && (
                <div className="grid grid-cols-2 gap-2 aspect-16/10 rounded-2xl overflow-hidden bg-stone-900 border border-stone-200 shadow-md">
                  <div className="relative h-full overflow-hidden">
                    <img src={beforeImg} alt="Before" className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-stone-200 text-[10px] font-bold">
                      Before (Raw)
                    </span>
                  </div>
                  <div className="relative h-full overflow-hidden">
                    <img src={afterImg} alt="After" className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 text-[10px] font-bold">
                      After (AI Staged)
                    </span>
                  </div>
                </div>
              )}

              {/* Single Image Modes */}
              {(viewMode === 'after' || viewMode === 'before') && (
                <div className="relative aspect-16/10 rounded-2xl overflow-hidden bg-stone-900 border border-stone-200 shadow-md">
                  <img
                    src={viewMode === 'after' ? afterImg : beforeImg}
                    alt="Venue View"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 text-white font-bold text-xs backdrop-blur-xs">
                    {viewMode === 'after' ? 'AI Staged Floral Architecture' : 'Raw Venue Architecture'}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleRunInpainting}
                disabled={isStagingLoading}
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-2"
              >
                {isStagingLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Re-Synthesize Venue Inpainting Preview</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Dynamic Venue Floral Procurement & Stem Quantity Briefing Modal */}
      {showBOMModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 text-xs max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-200">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                      Venue Floral Quantity & Procurement Briefing
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Itemized stem counts, botanical species, and cold-chain logistics for finalized stage decoration
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowBOMModal(false)} 
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-800 font-bold text-base transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Venue & Staging Context Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <div>
                <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">Target Venue & Space</span>
                <strong className="text-stone-900 block text-xs mt-0.5">
                  {briefingData?.venue_name || activeVenueObj?.name}
                </strong>
                <span className="text-[11px] text-stone-500 font-mono">
                  {briefingData?.venue_capacity || activeVenueObj?.capacity}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">Guest Tier & Scale</span>
                <strong className="text-stone-900 block text-xs mt-0.5">
                  {briefingData?.guest_tier_label || formData.guest_tier.replace('_', ' ').toUpperCase()}
                </strong>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  {formData.selected_modules.length} Decor Modules Selected
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">Theme & Color Harmony</span>
                <strong className="text-stone-900 block text-xs mt-0.5">
                  {briefingData?.palette_name || activeVenueObj?.default_palette}
                </strong>
                <span className="text-[10px] text-stone-500 line-clamp-1 italic">
                  "{stagingPrompt}"
                </span>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-stone-900 text-white">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">Total Cut Stems</span>
                <span className="font-mono text-xl font-bold text-emerald-400">
                  {briefingData?.total_estimated_stems || estimate?.total_stems || 850}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">Fresh A-Grade Stems</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-900 text-white">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">Foliage Fronds</span>
                <span className="font-mono text-xl font-bold text-teal-400">
                  {briefingData?.total_foliage_bunches || 45} Bunches
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">10 stems per bunch</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-900 text-white">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">Living Nursery Plants</span>
                <span className="font-mono text-xl font-bold text-amber-400">
                  {briefingData?.living_potted_plants || 6} Pots
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">Returnable Ceramic Planters</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-900 text-white">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">Petal Carpet</span>
                <span className="font-mono text-xl font-bold text-rose-400">
                  {briefingData?.fresh_petals_kg || 21.5} kg
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">Fresh Hand-Picked Petals</span>
              </div>
            </div>

            {/* Itemized Botanical Stem Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                  Itemized Procurement Breakdown
                </h4>
                <span className="text-[10px] font-mono text-stone-500">
                  Calculated from Decor Modules & Stage Customization
                </span>
              </div>

              <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left divide-y divide-stone-200 text-xs">
                  <thead className="bg-stone-50 text-[10px] text-stone-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Role / Category</th>
                      <th className="py-2.5 px-3">Botanical Species</th>
                      <th className="py-2.5 px-3 font-mono text-right">Required Quantity</th>
                      <th className="py-2.5 px-3 hidden sm:table-cell">Florist Conditioning Protocol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {(briefingData?.procurement_breakdown || [
                      {
                        item_category: "Focal Blooms (Primary)",
                        botanical_name: "Dutch Velvet Crimson Roses",
                        stem_count: 382,
                        unit: "Stems",
                        conditioning: "Hydration dip in Chrysal flower food 6 hrs prior"
                      },
                      {
                        item_category: "Harmony Stems (Secondary)",
                        botanical_name: "Imperial Purple Orchids",
                        stem_count: 238,
                        unit: "Stems",
                        conditioning: "Stem recut at 45° in cold refrigerated transit"
                      },
                      {
                        item_category: "Texture & Filler Accents",
                        botanical_name: "Baby's Breath (Gypsophila)",
                        stem_count: 144,
                        unit: "Stems",
                        conditioning: "Fine-mist spray with botanical preservative"
                      },
                      {
                        item_category: "Fresh Cut Foliage",
                        botanical_name: "Silver Dollar Eucalyptus & Ruscus",
                        stem_count: 45,
                        unit: "Bunches (10 stems/bunch)",
                        conditioning: "Submerged hydration to maintain lush turgidity"
                      },
                      {
                        item_category: "Living Potted Plant Accents",
                        botanical_name: "Potted Monstera Deliciosa & Kentia Palms",
                        stem_count: 6,
                        unit: "Living Pots (10-12in ceramic)",
                        conditioning: "Nursery-direct pre-potted, returnable post-event"
                      },
                      {
                        item_category: "Petal Carpet & Scattering",
                        botanical_name: "Fresh Hand-Picked Rose Petals",
                        stem_count: 21.5,
                        unit: "Kilograms (kg)",
                        conditioning: "Chilled dry-box packaging until ceremonial walk"
                      }
                    ]).map((row, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-stone-800">
                          <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px]">
                            {row.item_category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-emerald-950">
                          {row.botanical_name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                          {row.stem_count} <span className="text-[10px] text-stone-500 font-normal">{row.unit}</span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-stone-500 hidden sm:table-cell">
                          {row.conditioning}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Logistics & Cold-Chain Specs */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
              <span className="font-bold text-stone-900 block text-xs uppercase tracking-wider">
                Logistics & Freshness Protocol
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-700">
                <div className="flex items-start space-x-2">
                  <Truck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-900 text-xs">Climate-Controlled Dispatch</strong>
                    <span className="text-[11px] text-stone-500">14°C - 16°C cold-chain van direct from Kalmane Mother Nursery</span>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-900 text-xs">Zero-Wilt Guarantee</strong>
                    <span className="text-[11px] text-stone-500">Conditioned with Chrysal floral nutrients for 24+ hour bloom peak</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold flex items-center gap-1.5 transition-colors"
              >
                <FileDown className="w-4 h-4 text-stone-600" />
                <span>Print Briefing for Master Florist</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBOMModal(false)}
                className="px-6 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold transition-colors"
              >
                Close Briefing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formal Client Proposal Quotation Sheet Modal */}
      {showProposalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-stone-200 space-y-6 text-xs print:m-0 print:p-6">
            <div className="flex justify-between items-start border-b border-stone-200 pb-4">
              <div>
                <span className="font-serif text-2xl font-bold text-emerald-950 block">Green Nest Bloom</span>
                <span className="text-[11px] text-stone-500">Commercial Floriculture & Event Architecture Pvt. Ltd.</span>
                <span className="text-[10px] text-stone-400 block font-mono">GSTIN: 29AABCG1234F1Z5</span>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-900 font-bold font-mono text-[11px]">
                  PROPOSAL #{formData.event_date?.replace(/-/g, '')}-EST
                </span>
                <span className="text-[10px] text-stone-400 block mt-1">Date: {new Date().toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-bold block">Client Organization</span>
                <strong className="text-stone-900 block text-sm">{formData.company_name}</strong>
                <span className="text-stone-500">{formData.venue_address}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-bold block">Event Logistics</span>
                <span className="block font-medium text-stone-800">Date: {formData.event_date}</span>
                <span className="text-stone-600 block">Tier: {formData.guest_tier.replace('_', ' ').toUpperCase()}</span>
                <span className="text-emerald-700 font-bold">Delivery Distance: {radiusStatus.distance_km} km (Verified)</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-stone-900 block text-xs">Included Staging Architecture:</span>
              <ul className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                {formData.selected_modules.map((m) => (
                  <li key={m} className="p-2.5 flex justify-between bg-white text-stone-700">
                    <span>{decorPricing[m]?.name || m}</span>
                    <span className="font-mono font-bold">₹{decorPricing[m]?.base_price.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-stone-900 text-white rounded-2xl space-y-1.5 font-mono">
              <div className="flex justify-between text-stone-300">
                <span>Subtotal:</span>
                <span>₹{estimate?.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>GST (18% Event Decor Services):</span>
                <span>₹{estimate?.gst_18?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-emerald-400 pt-2 border-t border-stone-800">
                <span>Formal Estimated Total:</span>
                <span>₹{((estimate?.grand_total || 0) + radiusStatus.surcharge).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center gap-1.5"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Print Quotation</span>
              </button>
              <button
                onClick={() => setShowProposalModal(false)}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
