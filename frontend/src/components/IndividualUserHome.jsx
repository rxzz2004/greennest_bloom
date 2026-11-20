import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Bell,
  Heart,
  ChevronLeft,
  ChevronDown,
  Plus,
  Minus,
  Flower2,
  Sparkles,
  MapPin,
  User,
  Filter,
  Check,
  ShoppingBag,
  SlidersHorizontal,
  X,
  Clock,
  ArrowRight,
  ShieldCheck,
  Layers,
  LayoutGrid,
  LayoutList,
  Leaf,
  Droplets,
  Gift,
  PackageCheck,
  HeartHandshake,
  Star,
  ThumbsUp,
  Camera,
  MessageSquare
} from 'lucide-react';
import { soundEffects } from '../utils/audio';
import SubscriptionManager from './SubscriptionManager';
import { calculateDeliveryEstimate, POPULAR_DELIVERY_HUBS } from '../utils/deliveryCalculator';

export default function IndividualUserHome({
  products = [],
  currentUser,
  onAddToCart,
  onOpenLogin = () => { },
  onSwitchToBusiness = () => { },
  currentTheme = 'light',
  initialTab = 'home',
  onOpenBouquetCustomizer,
  onOpenCart,
  onOpenReminders,
  onOpenOrders,
  onOpenLiveTracking,
  searchQuery = '',
  setSearchQuery = () => { },
  cartCount = 0,
  favoritesList: propFavoritesList,
  onToggleFavorite: propToggleFavorite,
  userSubscription,
  onSubscriptionUpdated
}) {
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPromptAction, setAuthPromptAction] = useState('purchase'); // 'wishlist' | 'purchase'

  // Navigation tabs: 'home' | 'catalogue' | 'subscription'
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash.toLowerCase().includes('subscription')) {
      return 'subscription';
    }
    return initialTab;
  });

  // Sync tab with URL hash if changed or custom nav event dispatched
  React.useEffect(() => {
    const handleHash = () => {
      if (window.location.hash.toLowerCase().includes('subscription')) {
        setActiveTab('subscription');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    const handleNavSub = () => {
      setActiveTab('subscription');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('nav-subscription', handleNavSub);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('nav-subscription', handleNavSub);
    };
  }, []);

  // Catalogue category filter: 'everything' | 'potted_plants' | 'planters' | 'roses' | 'tulips' | 'peonies' | 'dahlias' | 'sunflowers'
  const [catalogueFilter, setCatalogueFilter] = useState('everything');

  // Home sub-tabs: 'popular' | 'bouquets' | 'compositions'
  const [homeSubTab, setHomeSubTab] = useState('popular');

  // Hero slide index
  const [heroIndex, setHeroIndex] = useState(0);

  // Pagination for catalogue ("View More" functionality)
  const [visibleCount, setVisibleCount] = useState(8);

  // Catalogue layout mode: 'auto' (phone = editorial menu, laptop = square grid) | 'editorial' | 'grid'
  const [catalogueLayout, setCatalogueLayout] = useState('auto');

  // Product Detail View state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [livingPlantFilter, setLivingPlantFilter] = useState('all');
  const [isFavorited, setIsFavorited] = useState(false);
  const [internalFavoritesList, setInternalFavoritesList] = useState([]);
  const favoritesList = propFavoritesList !== undefined ? propFavoritesList : internalFavoritesList;
  const [toastMessage, setToastMessage] = useState(null);

  // Product Reviews & Ratings state
  const [productReviews, setProductReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average_rating: 5.0, total_reviews: 0, customer_photos: [] });
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewPhotoUrl, setNewReviewPhotoUrl] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch reviews when a product is opened in the modal
  useEffect(() => {
    if (!selectedProduct) {
      setProductReviews([]);
      setReviewStats({ average_rating: 5.0, total_reviews: 0, customer_photos: [] });
      setIsAddingReview(false);
      return;
    }

    const fetchProductReviews = async () => {
      setIsLoadingReviews(true);
      try {
        const ref = selectedProduct.id;
        const res = await fetch(`/api/products/${ref}/reviews`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') {
            setProductReviews(data.reviews || []);
            setReviewStats({
              average_rating: data.average_rating || 5.0,
              total_reviews: data.total_reviews || 0,
              customer_photos: data.customer_photos || []
            });
          }
        }
      } catch (err) {
        console.error('Error fetching product reviews:', err);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchProductReviews();
  }, [selectedProduct]);

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReviewComment.trim() || !selectedProduct) return;
    setIsSubmittingReview(true);
    try {
      const ref = selectedProduct.id;
      const res = await fetch(`/api/products/${ref}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id || 1,
          customer_name: currentUser?.name || 'Verified Plant Parent',
          rating: Number(newRating),
          title: newReviewTitle || `${newRating}-Star Botanical Review`,
          comment: newReviewComment,
          photo_url: newReviewPhotoUrl.trim() || null
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        soundEffects.playStemSnip();
        setProductReviews(prev => [data.review, ...prev]);
        setReviewStats(prev => {
          const newTotal = prev.total_reviews + 1;
          const newAvg = Number((((prev.average_rating * prev.total_reviews) + Number(newRating)) / newTotal).toFixed(1));
          const updatedPhotos = data.review.photo_url ? [data.review.photo_url, ...prev.customer_photos] : prev.customer_photos;
          return {
            average_rating: newAvg,
            total_reviews: newTotal,
            customer_photos: updatedPhotos
          };
        });
        setNewReviewTitle('');
        setNewReviewComment('');
        setNewReviewPhotoUrl('');
        setIsAddingReview(false);
        setToastMessage('Thank you! Your verified customer review has been published.');
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        setToastMessage(data.error || 'Failed to submit review');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      setToastMessage('Network error submitting review.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleVoteHelpful = async (reviewId) => {
    soundEffects.playClick();
    try {
      const res = await fetch(`/api/reviews/${reviewId}/vote-helpful`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProductReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpful_votes: data.helpful_votes } : r));
      }
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  // Delivery address state with realistic location-based arrival calculator
  const [address, setAddress] = useState(currentUser?.address || 'Kavoor, Mangalore - 575015');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const deliveryEstimate = useMemo(() => calculateDeliveryEstimate(address), [address]);

  // Hero Card Carousel Items
  const heroItems = [
    {
      id: 'pink-peonies',
      name: 'Pink Peonies Bouquet',
      specs: '55-67 cm, fresh harvest',
      price: 30,
      inrPrice: 1499,
      image: '/pink_peonies_hero.jpg',
      tag: 'Bestseller',
      category: 'peonies',
      description: 'Lush hand-tied bouquet of fresh pink peonies cut at morning bloom. Wrapped with silk satin ribbon and conditioned with hydration sponge for 7-day vase life.',
      includes: [
        { name: 'Peonies', image: '/peonies_chip.jpg', bg: 'bg-[#fdf2ec]' },
        { name: 'Eucalyptus', image: '/eucalyptus_chip.jpg', bg: 'bg-[#edf8f2]' },
        { name: 'Pink Roses', image: '/rose_flower_bouquet.jpg', bg: 'bg-[#fdecef]' },
        { name: 'Satin Ribbon', image: '/pink_peonies_hero.jpg', bg: 'bg-[#fdf2ec]' }
      ]
    },
    {
      id: 'rose-bouquet',
      name: 'Artisan Rose Flower Bouquet',
      specs: '50-60 cm, selected stems',
      price: 24,
      inrPrice: 1299,
      image: '/rose_flower_bouquet.jpg',
      tag: 'Romantic',
      category: 'roses',
      description: 'Handcrafted bouquet of heirloom pink roses and delicate foliage arranged in a clear glass cylinder vase.',
      includes: [
        { name: 'Pink Roses', image: '/rose_flower_bouquet.jpg', bg: 'bg-[#fdecef]' },
        { name: 'Eucalyptus', image: '/eucalyptus_chip.jpg', bg: 'bg-[#edf8f2]' },
        { name: 'Glass Vase', image: '/rose_flower_bouquet.jpg', bg: 'bg-[#e0f2fe]' }
      ]
    },
    {
      id: 'sunflower-meadow',
      name: 'Sunflowers with Mountain Lilies',
      specs: '45-55 cm, bright bloom',
      price: 19,
      inrPrice: 999,
      image: '/sunflower_bouquet.jpg',
      tag: 'Sunny Bloom',
      category: 'sunflowers',
      description: 'Vibrant highland sunflowers wrapped in sky-blue artisan paper with starry baby’s breath and golden ribbon.',
      includes: [
        { name: 'Sunflowers', image: '/sunflower_bouquet.jpg', bg: 'bg-[#fef9c3]' },
        { name: 'Blue Wrap', image: '/sunflower_bouquet.jpg', bg: 'bg-[#e0f2fe]' },
        { name: 'Baby’s Breath', image: '/babys_breath.jpg', bg: 'bg-[#e0f2fe]' }
      ]
    },
    {
      id: 'tulips-chrysanthem',
      name: 'Tulips with Chrysanthemums',
      specs: '45-57 cm, selected stems',
      price: 24,
      inrPrice: 1250,
      image: '/tulips_chrysanthem.jpg',
      tag: 'Pastel Joy',
      category: 'tulips',
      description: 'Vibrant blend of orange tulips, pink spray roses, and yellow chrysanthemums tied with natural linen ribbon.',
      includes: [
        { name: 'Orange Tulips', image: '/tulips_chrysanthem.jpg', bg: 'bg-[#ffedd5]' },
        { name: 'Chrysanthemums', image: '/tulips_chrysanthem.jpg', bg: 'bg-[#fef9c3]' },
        { name: 'Linen Bow', image: '/tulips_chrysanthem.jpg', bg: 'bg-[#fdf2ec]' }
      ]
    }
  ];

  // Circular Vignette Items (Featuring both Cut Flowers & Living Potted Plants)
  const circularItems = [
    {
      id: 'circ-peonies-dahlias',
      name: 'Peonies with dahlias',
      image: '/peonies_chip.jpg',
      price: 32,
      inrPrice: 1550,
      specs: '57-64 cm, selected',
      category: 'peonies'
    },
    {
      id: 'circ-monstera',
      name: 'Monstera Deliciosa',
      image: '/monstera_plant_pot.jpg',
      price: 29,
      inrPrice: 890,
      specs: 'Living nursery potted, 60cm',
      category: 'potted_plants'
    },
    {
      id: 'circ-tulips-chrysanthem',
      name: 'Tulips with chrysanthem',
      image: '/tulips_chrysanthem.jpg',
      price: 24,
      inrPrice: 1250,
      specs: '45-57 cm, selected',
      category: 'tulips'
    },
    {
      id: 'circ-fiddle-fig',
      name: 'Fiddle Leaf Fig',
      image: '/fiddle_fig_pot.jpg',
      price: 45,
      inrPrice: 1450,
      specs: 'Architectural tree, 85cm',
      category: 'potted_plants'
    },
    {
      id: 'circ-coloured-roses',
      name: 'Coloured roses with tulips',
      image: '/angel_bouquet.jpg',
      price: 26,
      inrPrice: 1350,
      specs: '50-60 cm, selected',
      category: 'roses'
    },
    {
      id: 'circ-snake-plant',
      name: 'Sansevieria Snake Plant',
      image: '/snake_plant_pot.jpg',
      price: 18,
      inrPrice: 480,
      specs: 'NASA air purifier, 45cm',
      category: 'potted_plants'
    }
  ];

  // Base Curated Catalogue Items (Artisan Cut Blooms, Living Potted Plants & Planters)
  const baseCatalogueList = [
    {
      id: 'cat-monstera-deliciosa',
      name: 'Monstera Deliciosa (Swiss Cheese)',
      specs: '55-70 cm, Nursery Potted in Terracotta',
      price: 29,
      inrPrice: 890,
      category: 'potted_plants',
      image: '/monstera_plant_pot.jpg',
      tag: 'Air Purifying',
      description: 'Lush tropical Swiss Cheese plant potted in breathable terracotta with nutrient-rich compost. Thrives in indirect bright light and natural aeration.'
    },
    {
      id: 'cat-fiddle-leaf-fig',
      name: 'Ficus Lyrata (Fiddle Leaf Fig)',
      specs: '75-90 cm, Nursery Grown Specimen',
      price: 45,
      inrPrice: 1450,
      category: 'potted_plants',
      image: '/fiddle_fig_pot.jpg',
      tag: 'Architectural Tree',
      description: 'Statement indoor ornamental tree with iconic violin-shaped violin leaves. Acclimatized in nursery greenhouses with self-watering saucer.'
    },
    {
      id: 'cat-snake-plant',
      name: 'Sansevieria Laurentii (Snake Plant)',
      specs: '40-55 cm, Ceramic Planter Included',
      price: 18,
      inrPrice: 480,
      category: 'potted_plants',
      image: '/snake_plant_pot.jpg',
      tag: 'NASA Air Purifier',
      description: 'Resilient sword-shaped succulent foliage that filters airborne toxins and releases oxygen 24/7. Extremely low water and light requirement.'
    },
    {
      id: 'cat-zz-plant',
      name: 'Zamioculcas Zamiifolia (ZZ Plant)',
      specs: '45-60 cm, Living Specimen',
      price: 22,
      inrPrice: 620,
      category: 'potted_plants',
      image: '/monstera_plant_pot.jpg',
      tag: 'Zero Hassle',
      description: 'Glossy dark green feathered foliage that stores water in rhizomes. Thrives even in dim corridors or cubicles with monthly watering.'
    },
    {
      id: 'cat-nordic-fluted-planter',
      name: 'Nordic Fluted Ceramic Planter',
      specs: '20 cm diameter, Matte Forest Glaze',
      price: 25,
      inrPrice: 750,
      category: 'planters',
      image: '/fiddle_fig_pot.jpg',
      tag: 'Artisan Craft',
      description: 'Handcrafted stoneware ceramic planter with vertical ribbing, drainage hole, and matching moisture tray.'
    },
    {
      id: 'cat-blooming-peony',
      name: 'Blooming Peony Bouquet',
      specs: '55-67 cm, selected',
      price: 36,
      inrPrice: 1699,
      category: 'peonies',
      image: '/pink_peonies_hero.jpg',
      tag: 'Bestseller',
      description: 'Lush hand-tied bouquet of fresh pink peonies cut at morning bloom. Conditioned with hydration sponge for extended 7-day vase life.'
    },
    {
      id: 'cat-tulips-chrysanthem',
      name: 'Tulips with Chrysanthem',
      specs: '45-57 cm, selected',
      price: 24,
      inrPrice: 1250,
      category: 'tulips',
      image: '/tulips_chrysanthem.jpg',
      tag: 'Fresh Harvest',
      description: 'Vibrant blend of orange tulips, pink spray roses, and yellow chrysanthemums tied with natural linen ribbon.'
    },
    {
      id: 'cat-peonies-dahlias',
      name: 'Peonies with Dahlias',
      specs: '57-64 cm, selected',
      price: 32,
      inrPrice: 1550,
      category: 'peonies',
      image: '/peonies_chip.jpg',
      tag: 'Pastel Joy',
      description: 'Delicate blend of blush peonies, fluffy dahlias, and silver dollar eucalyptus stems in peach parchment wrap.'
    },
    {
      id: 'cat-angel-roses',
      name: 'Angel Coloured Roses',
      specs: '50-60 cm, selected',
      price: 24,
      inrPrice: 1299,
      category: 'roses',
      image: '/angel_bouquet.jpg',
      tag: 'Romantic',
      description: 'Soft pastel gradient roses arranged in an artisanal hand-tied spiral bouquet with satin bow.'
    },
    {
      id: 'cat-golden-sunflower',
      name: 'Golden Highland Sunflowers',
      specs: '45-55 cm, selected',
      price: 19,
      inrPrice: 999,
      category: 'sunflowers',
      image: '/sunflower_bouquet.jpg',
      tag: 'Sunny Bloom',
      description: 'Radiant highland sunflowers wrapped in sky-blue artisan paper with golden organza bow.'
    },
    {
      id: 'cat-red-roses',
      name: 'Dutch Red Velvet Roses',
      specs: '60-70 cm, premium',
      price: 28,
      inrPrice: 1350,
      category: 'roses',
      image: '/rose_bouquet_realistic.jpg',
      tag: 'Classic',
      description: 'Deep crimson velvet roses imported directly from Dutch cold-houses, conditioned for long vase life.'
    },
    {
      id: 'cat-blush-lily',
      name: 'Pink Lily Elegance',
      specs: '50-65 cm, selected',
      price: 34,
      inrPrice: 1599,
      category: 'peonies',
      image: '/pink_lily_bloom.jpg',
      tag: 'Fragrant',
      description: 'Heirloom Oriental lilies with delicate pink petals and sweet botanical fragrance.'
    },
    {
      id: 'cat-eucalyptus-rose',
      name: 'Eucalyptus & Spray Roses',
      specs: '45-55 cm, selected',
      price: 22,
      inrPrice: 1199,
      category: 'roses',
      image: '/eucalyptus_chip.jpg',
      tag: 'Aromatic',
      description: 'Fragrant baby blue eucalyptus clustered with miniature spray roses in parchment wrap.'
    },
    {
      id: 'cat-morning-dew-tulips',
      name: 'Morning Dew Dutch Tulips',
      specs: '40-50 cm, selected',
      price: 26,
      inrPrice: 1299,
      category: 'tulips',
      image: '/tulips_chrysanthem.jpg',
      tag: 'Spring Edit',
      description: 'Freshly cut pink and peach tulips with crisp foliage and natural paper wrap.'
    },
    {
      id: 'cat-sunset-dahlias',
      name: 'Sunset Coral Dahlias',
      specs: '50-60 cm, selected',
      price: 29,
      inrPrice: 1399,
      category: 'dahlias',
      image: '/peonies_chip.jpg',
      tag: 'Vibrant',
      description: 'Warm coral and peach dahlias paired with hypericum berries and seasonal greenery.'
    },
    {
      id: 'cat-white-cloud-peonies',
      name: 'White Cloud Peonies',
      specs: '55-65 cm, premium',
      price: 38,
      inrPrice: 1799,
      category: 'peonies',
      image: '/pink_peonies_hero.jpg',
      tag: 'Luxury',
      description: 'Pure porcelain white peonies cut at tight-marshmallow stage for a glorious blooming reveal.'
    },
    {
      id: 'cat-lavender-meadow',
      name: 'Lavender Fields Bouquet',
      specs: '45-55 cm, selected',
      price: 25,
      inrPrice: 1200,
      category: 'dahlias',
      image: '/angel_bouquet.jpg',
      tag: 'Calming',
      description: 'Wild lavender stems woven with white lisianthus and pale lilac spray roses.'
    },
    {
      id: 'cat-vintage-rose-trio',
      name: 'Vintage Rose & Foliage Trio',
      specs: '50-60 cm, selected',
      price: 27,
      inrPrice: 1349,
      category: 'roses',
      image: '/rose_flower_bouquet.jpg',
      tag: 'Heritage',
      description: 'Antique garden roses with fresh rosemary and mint sprigs in a bespoke jute wrapping.'
    },
    {
      id: 'cat-sunshine-burst',
      name: 'Sunshine Meadow Burst',
      specs: '45-55 cm, selected',
      price: 21,
      inrPrice: 1050,
      category: 'sunflowers',
      image: '/sunflower_bouquet.jpg',
      tag: 'Cheerful',
      description: 'Mini sunflowers, yellow solidago, and chamomile daisies in sunny kraft paper.'
    },
    {
      id: 'cat-blush-orchids',
      name: 'Cascading Blush Orchids',
      specs: '60-75 cm, premium',
      price: 42,
      inrPrice: 1999,
      category: 'peonies',
      image: '/pink_lily_bloom.jpg',
      tag: 'Exotic',
      description: 'Dramatic stem of phalaenopsis orchids with water reservoir vial and velvet ribbon.'
    },
    {
      id: 'cat-sweet-chrysanthemums',
      name: 'Pastel Chrysanthemums',
      specs: '50-60 cm, selected',
      price: 23,
      inrPrice: 1150,
      category: 'tulips',
      image: '/tulips_chrysanthem.jpg',
      tag: 'Long-Lasting',
      description: 'Hardy button mums and spider chrysanthemums guaranteed to bloom fresh for 10+ days.'
    }
  ];

  // Combine all backend products from database with static curated items
  const fullCatalogue = useMemo(() => {
    const backendItems = products.map((p) => {
      const isFruit = p.category === 'fruit_plant';
      const isVeg = p.category === 'vegetable_plant';
      const isHerb = p.category === 'herb';
      const isPlant = p.category === 'potted_plant' || p.category === 'plant';
      const isPlanter = p.category === 'planter' || p.category === 'accessory';
      const isCutFlower = p.category === 'cut_flower';
      const isMudBestSeller = isPlanter && p.name.toLowerCase().includes('terracotta mud') && p.name.toLowerCase().includes('standard quality');

      let itemCategory = 'potted_plants';
      if (isFruit) itemCategory = 'fruit_plants';
      else if (isVeg) itemCategory = 'vegetables';
      else if (isHerb) itemCategory = 'herbs';
      else if (isPlant) itemCategory = 'potted_plants';
      else if (isPlanter) itemCategory = 'planters';
      else if (isCutFlower) {
        const lower = p.name.toLowerCase();
        if (lower.includes('rose')) itemCategory = 'roses';
        else if (lower.includes('peon') || lower.includes('lili') || lower.includes('lily')) itemCategory = 'peonies';
        else if (lower.includes('tulip')) itemCategory = 'tulips';
        else if (lower.includes('marigold') || lower.includes('genda')) itemCategory = 'marigolds';
        else if (lower.includes('sunflower')) itemCategory = 'sunflowers';
        else itemCategory = 'cut_flowers';
      }

      const hasDecayDiscount = Boolean(p.decay_discount_percent && p.decay_discount_percent > 0);
      const originalPrice = Math.round(p.base_price) || 299;
      const discountedPrice = hasDecayDiscount
        ? Math.max(1, Math.round(p.effective_price != null ? p.effective_price : (p.base_price * (1.0 - p.decay_discount_percent / 100.0))))
        : originalPrice;

      const itemTag = hasDecayDiscount
        ? `${Math.round(p.decay_discount_percent)}% OFF • ${p.decay_status === 'clearance' ? 'Flash Clearance' : 'Prime Freshness'}`
        : isMudBestSeller ? '#1 Best Seller'
        : p.category === 'accessory' ? 'Organic Soil'
        : isPlanter ? (p.name.includes('Mud') ? 'Mud Pot' : p.name.includes('Plastic') ? 'Plastic Pot' : p.name.includes('Glass') ? 'Glass Pot' : 'Ceramic Pot')
        : isFruit ? 'Fruit Tree'
        : isVeg ? 'Kitchen Garden'
        : isHerb ? 'Ayurvedic Herb'
        : isPlant ? 'Living Nursery'
        : p.name.includes('Rose') ? 'Romantic'
        : p.name.includes('Peon') ? 'Bestseller'
        : p.name.includes('Marigold') ? 'Sacred Bloom'
        : 'Fresh Harvest';

      const inr = discountedPrice;

      return {
        id: p.id,
        backend_id: p.id,
        name: p.name,
        botanical_name: p.botanical_name,
        specs: (isPlant || isFruit || isVeg || isHerb)
          ? `${p.botanical_name || 'Living Nursery Specimen'} • ${p.sunlight_requirement || 'Bright Light'}`
          : isPlanter
            ? (p.botanical_name || (p.category === 'accessory' ? '5kg Fortified Potting Blend' : 'Designer Planter Pot'))
            : `${p.botanical_name || 'Artisan Fresh Harvest'} • Vase life: ${p.vase_life_days || 7} days`,
        price: inr,
        inrPrice: inr,
        originalPrice: hasDecayDiscount ? originalPrice : null,
        decayDiscountPercent: p.decay_discount_percent || 0,
        decayStatus: p.decay_status,
        hasDecayDiscount,
        category: itemCategory,
        raw_category: p.category,
        image: p.image_url || (isPlanter ? '/fiddle_fig_pot.jpg' : isPlant ? '/monstera_plant_pot.jpg' : '/rose_flower_bouquet.jpg'),
        image_url: p.image_url,
        tag: itemTag,
        description: p.floriography_meaning || p.description || `${p.name} (${p.botanical_name || 'Botanical specimen'}), conditioned for optimal health and vigor.`,
        sunlight: p.sunlight_requirement,
        watering: p.watering_frequency,
        stock_quantity: p.stock_quantity,
        is_perishable: p.is_perishable
      };
    });

    if (backendItems.length > 0) {
      return backendItems;
    }

    return baseCatalogueList;
  }, [products]);

  // Extract living nursery plants from fullCatalogue
  const livingNurseryPlants = useMemo(() => {
    return fullCatalogue.filter((item) => {
      const cat = item.category || '';
      const rawCat = item.raw_category || '';
      return (
        cat === 'potted_plants' ||
        cat === 'fruit_plants' ||
        cat === 'vegetables' ||
        cat === 'herbs' ||
        rawCat === 'potted_plant' ||
        rawCat === 'fruit_plant' ||
        rawCat === 'vegetable_plant' ||
        rawCat === 'herb' ||
        (item.specs && item.specs.toLowerCase().includes('live')) ||
        (item.tag && (
          item.tag.toLowerCase().includes('nursery') ||
          item.tag.toLowerCase().includes('tree') ||
          item.tag.toLowerCase().includes('herb') ||
          item.tag.toLowerCase().includes('garden')
        ))
      );
    });
  }, [fullCatalogue]);

  // Sliced or category-filtered living plants for the Living Nursery section
  const displayedLivingPlants = useMemo(() => {
    if (livingPlantFilter === 'indoor') {
      return livingNurseryPlants.filter(p => p.raw_category === 'potted_plant' || p.category === 'potted_plants');
    }
    if (livingPlantFilter === 'fruit') {
      return livingNurseryPlants.filter(p => p.raw_category === 'fruit_plant' || p.category === 'fruit_plants');
    }
    if (livingPlantFilter === 'veggies') {
      return livingNurseryPlants.filter(p => p.raw_category === 'vegetable_plant' || p.category === 'vegetables');
    }
    if (livingPlantFilter === 'herbs') {
      return livingNurseryPlants.filter(p => p.raw_category === 'herb' || p.category === 'herbs');
    }
    return livingNurseryPlants;
  }, [livingNurseryPlants, livingPlantFilter]);

  // Items with biological decay / freshness markdowns
  const discountedItems = useMemo(() => {
    return fullCatalogue.filter(item => Boolean(item.hasDecayDiscount));
  }, [fullCatalogue]);

  // Filtered catalogue items based on Category Pill and global Search Query
  const filteredCatalogue = useMemo(() => {
    return fullCatalogue.filter((item) => {
      // Category check
      let matchesCategory = false;
      if (catalogueFilter === 'everything') {
        matchesCategory = true;
      } else if (catalogueFilter === 'decay_markdowns') {
        matchesCategory = Boolean(item.hasDecayDiscount);
      } else if (catalogueFilter === 'potted_plants') {
        matchesCategory =
          item.category === 'potted_plants' ||
          item.raw_category === 'potted_plant' ||
          item.category === 'fruit_plants' ||
          item.category === 'vegetables' ||
          item.category === 'herbs' ||
          item.raw_category === 'fruit_plant' ||
          item.raw_category === 'vegetable_plant' ||
          item.raw_category === 'herb';
      } else if (catalogueFilter === 'indoor_foliage') {
        matchesCategory = item.category === 'potted_plants' || item.raw_category === 'potted_plant';
      } else if (catalogueFilter === 'fruit_plants') {
        matchesCategory = item.category === 'fruit_plants' || item.raw_category === 'fruit_plant';
      } else if (catalogueFilter === 'vegetables') {
        matchesCategory = item.category === 'vegetables' || item.raw_category === 'vegetable_plant';
      } else if (catalogueFilter === 'herbs') {
        matchesCategory = item.category === 'herbs' || item.raw_category === 'herb';
      } else if (catalogueFilter === 'cut_flowers') {
        matchesCategory = ['cut_flower', 'cut_flowers', 'roses', 'peonies', 'tulips', 'dahlias', 'sunflowers', 'marigolds'].includes(item.category) ||
          item.raw_category === 'cut_flower';
      } else if (catalogueFilter === 'roses') {
        matchesCategory = item.category === 'roses' || item.name.toLowerCase().includes('rose');
      } else if (catalogueFilter === 'marigolds') {
        matchesCategory = item.category === 'marigolds' || item.name.toLowerCase().includes('marigold') || item.name.toLowerCase().includes('genda');
      } else if (catalogueFilter === 'planters') {
        matchesCategory = item.category === 'planters' || item.raw_category === 'planter' || item.raw_category === 'accessory';
      } else {
        matchesCategory = item.category === catalogueFilter;
      }

      // Search query check
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.botanical_name && item.botanical_name.toLowerCase().includes(query)) ||
        (item.specs && item.specs.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.tag && item.tag.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [fullCatalogue, catalogueFilter, searchQuery]);

  // Dynamic price calculations
  const unitPriceInr = selectedProduct?.inrPrice || selectedProduct?.price || 0;
  const totalPriceInr = unitPriceInr * quantity;

  // Slice catalogue items based on visibleCount for "View More" pagination
  const displayedCatalogue = filteredCatalogue.slice(0, visibleCount);

  const handleQuickAdd = (item, e) => {
    if (e) e.stopPropagation();
    if (!currentUser) {
      soundEffects.playClick();
      setAuthPromptAction('purchase');
      setShowAuthPrompt(true);
      return;
    }
    soundEffects.playStemSnip();
    onAddToCart({
      id: item.id,
      name: item.name,
      base_price: item.originalPrice || item.inrPrice || item.price || 1299,
      effective_price: item.inrPrice || item.price || 1299,
      original_price: item.originalPrice || null,
      decay_discount_percent: item.decayDiscountPercent || 0,
      has_decay_discount: item.hasDecayDiscount || false,
      image_url: item.image || item.image_url || '/monstera_plant_pot.jpg',
      quantity: 1
    });
    setToastMessage(`Added 1 × ${item.name} (₹${item.inrPrice || item.price}) to Basket!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleOpenDetail = (item) => {
    soundEffects.playClick();
    setSelectedProduct(item);
    setQuantity(1);
    setIsFavorited(favoritesList.includes(item.id));
  };

  const handleToggleFavorite = (id) => {
    soundEffects.playClick();
    if (!currentUser) {
      setAuthPromptAction('wishlist');
      setShowAuthPrompt(true);
      return;
    }
    if (propToggleFavorite) {
      propToggleFavorite(id);
    } else {
      if (internalFavoritesList.includes(id)) {
        setInternalFavoritesList(internalFavoritesList.filter((f) => f !== id));
        setIsFavorited(false);
      } else {
        setInternalFavoritesList([...internalFavoritesList, id]);
        setIsFavorited(true);
      }
    }
  };

  const currentHero = heroItems[heroIndex] || heroItems[0];

  /* ----------------------------------------------------------------- */
  /* 1. EDITORIAL PHONE MENU CATALOGUE LAYOUT (Matches Reference Photo) */
  /* ----------------------------------------------------------------- */
  const renderEditorialMenuList = () => {
    const isDark = currentTheme === 'dark';
    const isLight = currentTheme === 'light';

    return (
      <div className={`relative rounded-[36px] border shadow-sm overflow-hidden animate-in fade-in transition-colors duration-300 ${isDark
          ? 'bg-[#111a2e] border-slate-800 text-slate-100 shadow-xl'
          : isLight
            ? 'bg-[#fcfbf9] border-stone-200 text-stone-900 shadow-sm'
            : 'bg-[#fffbfc] border-rose-200/80 text-[#37131e] shadow-sm'
        }`}>

        {/* Top Banner with Scalloped Flower Badge (Inspired by Reference Photo) */}
        <div className={`relative pt-9 pb-6 px-4 sm:px-6 border-b transition-colors ${isDark
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-slate-800'
            : isLight
              ? 'bg-gradient-to-r from-emerald-100/90 via-stone-100 to-emerald-50 border-stone-200'
              : 'bg-gradient-to-r from-pink-200/90 via-rose-100 to-pink-200/90 border-pink-200/60'
          }`}>

          {/* Scalloped Floral Emblem Overlapping the Header */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
            <div className={`relative w-15 h-15 rounded-full p-1 shadow-md border-2 flex items-center justify-center transition-colors ${isDark ? 'bg-slate-900 border-indigo-400/50' : 'bg-white border-pink-200'
              }`}>
              {/* Scalloped Petals Background */}
              <div className={`w-full h-full rounded-full flex items-center justify-center text-white shadow-inner ${isDark
                  ? 'bg-gradient-to-tr from-indigo-600 via-purple-500 to-pink-500'
                  : isLight
                    ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-700'
                    : 'bg-gradient-to-tr from-pink-400 via-rose-300 to-pink-500'
                }`}>
                <Flower2 className="w-7 h-7 text-white drop-shadow-xs" />
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${isDark ? 'bg-cyan-500' : isLight ? 'bg-emerald-600' : 'bg-pink-500'
                }`} />
            </div>
          </div>

          {/* Header Content Beneath Badge */}
          <div className="flex items-end justify-between pt-3 gap-2">
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-widest pb-0.5 border-b-2 inline-block ${isDark
                  ? 'text-cyan-300 border-cyan-500/60'
                  : isLight
                    ? 'text-emerald-800 border-emerald-400'
                    : 'text-pink-900/80 border-pink-300'
                }`}>
                Coleção Floral
              </span>
              <h3 className={`font-serif italic text-2xl sm:text-3xl font-bold tracking-tight mt-1 ${isDark ? 'text-white' : isLight ? 'text-stone-900' : 'text-[#37131e]'
                }`}>
                Morning Bloom
              </h3>
            </div>

            {/* Right Side: Informações / Botanical Standards Pill (from Reference Photo) */}
            <div className={`backdrop-blur-xs rounded-xl p-2 border shadow-2xs text-[10px] space-y-0.5 shrink-0 max-w-[150px] transition-colors ${isDark
                ? 'bg-slate-800/90 border-slate-700 text-slate-300'
                : isLight
                  ? 'bg-white/90 border-stone-200 text-stone-700'
                  : 'bg-white/90 border-pink-200/70 text-stone-700'
              }`}>
              <div className={`font-bold text-[9px] uppercase tracking-wider pb-0.5 border-b ${isDark
                  ? 'text-cyan-300 border-slate-700'
                  : isLight
                    ? 'text-emerald-700 border-stone-200'
                    : 'text-pink-700 border-pink-100'
                }`}>
                Informações
              </div>
              <div className="flex flex-col text-[10px] space-y-0.5 pt-0.5 font-medium">
                <span className="flex items-center space-x-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-cyan-400' : isLight ? 'bg-emerald-500' : 'bg-pink-400'}`} />
                  <span>7-Day Guarantee</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-indigo-400' : isLight ? 'bg-teal-500' : 'bg-rose-400'}`} />
                  <span>Hydration Pack</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-purple-400' : isLight ? 'bg-emerald-400' : 'bg-pink-300'}`} />
                  <span>Morning Cut</span>
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Editorial Menu Item List with Botanical Line-Art Watermark */}
        <div className={`relative px-3 sm:px-5 py-3 divide-y ${isDark ? 'divide-slate-800/80' : isLight ? 'divide-stone-200/80' : 'divide-pink-100/70'
          }`}>

          {/* Subtle Line-Art Botanical Floral Watermark (From Reference Photo) */}
          <svg
            className={`absolute right-0 top-16 w-56 sm:w-72 h-96 pointer-events-none -z-0 select-none ${isDark ? 'text-indigo-400/10' : isLight ? 'text-emerald-500/10' : 'text-pink-400/15'
              }`}
            viewBox="0 0 200 300"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <path d="M100 280 C110 210, 160 170, 185 120 C195 90, 180 50, 145 35 C115 20, 85 50, 75 80 C65 40, 35 30, 18 60 C5 90, 15 130, 45 170 C70 210, 95 245, 100 280 Z" />
            <path d="M100 280 C92 190, 65 140, 35 90" strokeDasharray="2 2" />
            <path d="M100 280 C112 180, 135 130, 165 80" strokeDasharray="2 2" />
            <circle cx="100" cy="80" r="12" strokeDasharray="3 3" />
            <path d="M85 75 Q100 60 115 75 Q100 90 85 75 Z" />
          </svg>

          {/* Item Rows */}
          {displayedCatalogue.map((item) => {
            const isFav = favoritesList.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item)}
                className={`py-3.5 flex items-center gap-3 sm:gap-4 relative z-10 cursor-pointer group rounded-2xl px-2 transition-colors ${isDark
                    ? 'hover:bg-slate-800/60'
                    : isLight
                      ? 'hover:bg-stone-100/70'
                      : 'hover:bg-pink-50/50'
                  }`}
              >
                {/* Left: Landscape Rounded Photo Card */}
                <div className={`w-28 sm:w-34 aspect-[4/3] rounded-2xl overflow-hidden shadow-xs border relative shrink-0 ${isDark ? 'bg-slate-800 border-slate-700' : isLight ? 'bg-stone-100 border-stone-200' : 'bg-pink-50 border-pink-100/90'
                  }`}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-300"
                  />
                  {item.tag && (
                    <span className={`absolute bottom-1 left-1 px-2 py-0.5 rounded-full backdrop-blur-xs text-[9px] font-bold border shadow-2xs ${isDark
                        ? 'bg-slate-900/90 text-cyan-300 border-slate-700'
                        : isLight
                          ? 'bg-white/90 text-emerald-800 border-stone-200'
                          : 'bg-white/90 text-pink-700 border-pink-100'
                      }`}>
                      {item.tag}
                    </span>
                  )}
                </div>

                {/* Right: Title, Stem Description, Specs, Price & Add */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-1">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className={`font-serif font-bold text-sm sm:text-base leading-snug transition-colors line-clamp-1 ${isDark
                          ? 'text-white group-hover:text-cyan-300'
                          : isLight
                            ? 'text-stone-900 group-hover:text-emerald-700'
                            : 'text-[#37131e] group-hover:text-rose-700'
                        }`}>
                        {item.name}
                      </h4>
                      {item.botanical_name && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 italic line-clamp-1 font-sans">
                          {item.botanical_name}
                        </p>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(item.id);
                        }}
                        className="text-stone-400 hover:text-rose-500 p-0.5 shrink-0 transition-colors"
                        title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>

                    <p className={`text-[11px] leading-snug line-clamp-2 mt-0.5 ${isDark ? 'text-slate-400' : 'text-stone-500'
                      }`}>
                      {item.description || item.specs}
                    </p>
                  </div>

                  {/* Botanical Specs & Tags */}
                  <div className={`flex items-center space-x-1.5 text-[10px] ${isDark ? 'text-slate-500' : 'text-stone-400'
                    }`}>
                    <span className={`inline-flex items-center space-x-0.5 font-medium ${isDark ? 'text-cyan-400' : isLight ? 'text-emerald-700' : 'text-pink-700'
                      }`}>
                      <Leaf className="w-2.5 h-2.5" />
                      <span>{item.specs?.split(',')[0] || 'Selected'}</span>
                    </span>
                    <span>•</span>
                    <span className={`inline-flex items-center space-x-0.5 font-medium ${isDark ? 'text-indigo-300' : isLight ? 'text-teal-600' : 'text-pink-600'
                      }`}>
                      <Droplets className="w-2.5 h-2.5" />
                      <span>Conditioned</span>
                    </span>
                  </div>

                  {/* Price & Quick Add Button */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-baseline space-x-1.5 flex-wrap">
                      <span className={`font-bold text-sm sm:text-base ${isDark ? 'text-white' : isLight ? 'text-stone-900' : 'text-[#37131e]'
                        }`}>
                        ₹{item.inrPrice || item.price}
                      </span>
                      {item.originalPrice && item.originalPrice > (item.inrPrice || item.price) && (
                        <span className="text-xs text-stone-400 line-through">
                          ₹{item.originalPrice}
                        </span>
                      )}
                      {item.hasDecayDiscount && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-900">
                          {Math.round(item.decayDiscountPercent)}% OFF
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleQuickAdd(item, e)}
                      className={`w-7 h-7 rounded-full font-bold flex items-center justify-center border transition-all active:scale-95 shadow-2xs ${isDark
                          ? 'bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border-slate-700'
                          : isLight
                            ? 'bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 border-emerald-200'
                            : 'bg-pink-50 hover:bg-pink-600 hover:text-white text-pink-700 border-pink-200'
                        }`}
                      title="Quick Add to Basket"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    );
  };

  /* ----------------------------------------------------------------- */
  /* 2. SQUARE BOX CARDS GRID LAYOUT (Laptop Standard)                 */
  /* ----------------------------------------------------------------- */
  const renderSquareBoxesGrid = () => {
    const isDark = currentTheme === 'dark';
    const isLight = currentTheme === 'light';

    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in">
        {displayedCatalogue.map((item) => {
          const isFav = favoritesList.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => handleOpenDetail(item)}
              className={`rounded-3xl p-3 sm:p-4 border transition-all duration-300 flex flex-col justify-between group cursor-pointer relative ${isDark
                  ? 'bg-[#131d31] border-slate-800 hover:border-cyan-500/40 text-slate-100 shadow-lg shadow-black/20 hover:shadow-cyan-950/30'
                  : isLight
                    ? 'bg-white border-stone-200 hover:border-emerald-400 text-stone-900 shadow-2xs hover:shadow-lg'
                    : 'bg-white border-rose-100 hover:border-rose-300 text-[#37131e] shadow-2xs hover:shadow-xl'
                }`}
            >
              {/* Top: Square Image Container Box */}
              <div className={`aspect-square w-full rounded-2xl overflow-hidden relative mb-3 ${isDark ? 'bg-slate-800/80' : isLight ? 'bg-stone-50' : 'bg-pink-50/50'
                }`}>
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                />

                {/* Floating Wishlist Heart */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(item.id);
                  }}
                  className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-xs transition-colors shadow-2xs ${isDark
                      ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-rose-400'
                      : 'bg-white/90 hover:bg-white text-stone-400 hover:text-rose-500'
                    }`}
                  title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : 'currentColor'}`} />
                </button>

                {/* Floating Tag */}
                {item.tag && (
                  <span className={`absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full backdrop-blur-xs text-[10px] font-bold border shadow-2xs ${isDark
                      ? 'bg-slate-900/90 text-cyan-300 border-slate-700'
                      : isLight
                        ? 'bg-white/90 text-emerald-800 border-stone-200'
                        : 'bg-white/90 text-pink-700 border-pink-100'
                    }`}>
                    {item.tag}
                  </span>
                )}
              </div>

              {/* Middle: Title & Specs */}
              <div className="space-y-1 mb-3">
                <h3 className={`font-bold text-xs sm:text-sm leading-snug transition-colors line-clamp-1 ${isDark
                    ? 'text-white group-hover:text-cyan-300'
                    : isLight
                      ? 'text-stone-900 group-hover:text-emerald-700'
                      : 'text-[#37131e] group-hover:text-rose-600'
                  }`}>
                  {item.name}
                </h3>
                {item.botanical_name && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 italic line-clamp-1 font-mono">
                    {item.botanical_name}
                  </p>
                )}
                <p className={`text-[11px] font-medium line-clamp-1 ${isDark ? 'text-slate-400' : 'text-stone-400'
                  }`}>
                  {item.specs}
                </p>
              </div>

              {/* Bottom: Price & Quick Add Button */}
              <div className={`flex items-center justify-between pt-2 border-t ${isDark ? 'border-slate-800' : isLight ? 'border-stone-100' : 'border-rose-50'
                }`}>
                <div className="flex flex-col">
                  <div className="flex items-baseline space-x-1.5">
                    <span className={`font-extrabold text-sm sm:text-base ${isDark ? 'text-white' : isLight ? 'text-stone-900' : 'text-[#37131e]'
                      }`}>
                      ₹{item.inrPrice || item.price}
                    </span>
                    {item.originalPrice && item.originalPrice > (item.inrPrice || item.price) && (
                      <span className="text-xs text-stone-400 line-through">
                        ₹{item.originalPrice}
                      </span>
                    )}
                  </div>
                  {item.hasDecayDiscount && (
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                      {Math.round(item.decayDiscountPercent)}% Freshness Markdown
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => handleQuickAdd(item, e)}
                  className={`px-3 py-1.5 rounded-full font-bold text-xs border transition-all active:scale-95 flex items-center space-x-1 ${isDark
                      ? 'bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border-slate-700'
                      : isLight
                        ? 'bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 border-emerald-200'
                        : 'bg-pink-50 hover:bg-pink-600 hover:text-white text-pink-700 border-pink-200'
                    }`}
                  title="Add to Basket"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${currentTheme === 'dark'
        ? 'bg-gradient-to-b from-[#090d16] via-[#0d1527] to-[#090d16] text-slate-100'
        : currentTheme === 'light'
          ? 'bg-gradient-to-b from-[#faf7f2] via-[#f4eee3] to-[#faf8f5] text-stone-800'
          : 'bg-gradient-to-b from-[#fff5f7] via-[#fff0f3] to-[#fdf2f5] text-[#37131e]'
      }`}>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-stone-900 text-white text-xs font-semibold shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-pink-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container - Automatically scales to laptop screen width */}
      <div className="max-w-7xl mx-auto space-y-6">


        {/* ----------------------------------------------------------- */}
        {/* TOP BAR: Delivery Location ETA & Notification Controls      */}
        {/* ----------------------------------------------------------- */}
        <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl backdrop-blur-md shadow-xs transition-colors ${currentTheme === 'dark'
            ? 'bg-slate-900/90 border border-slate-800 text-slate-100'
            : currentTheme === 'light'
              ? 'bg-white/95 border border-stone-200/90 text-stone-800 shadow-stone-900/5'
              : 'bg-white/95 border border-rose-200/80 text-[#37131e] shadow-rose-500/5'
          }`}>

          {/* Location & ETA */}
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${currentTheme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-cyan-400'
                : currentTheme === 'light'
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                  : 'bg-pink-50 border-pink-100 text-pink-600'
              }`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <button
                onClick={() => setIsEditingAddress(!isEditingAddress)}
                className={`flex items-center space-x-1.5 font-bold text-sm transition-colors text-left ${currentTheme === 'dark'
                    ? 'text-white hover:text-cyan-300'
                    : currentTheme === 'light'
                      ? 'text-stone-900 hover:text-emerald-800'
                      : 'text-[#37131e] hover:text-rose-700'
                  }`}
              >
                <span className="truncate max-w-[280px] sm:max-w-md">{address}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
              </button>
              <div className={`flex flex-wrap items-center gap-x-2 text-xs font-medium pt-0.5 ${currentTheme === 'dark' ? 'text-slate-400' : 'text-stone-500'
                }`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${currentTheme === 'dark' ? 'bg-cyan-400' : currentTheme === 'light' ? 'bg-emerald-500' : 'bg-pink-500'
                  }`} />
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  {deliveryEstimate.shortEta}
                </span>
                <span className="text-[11px] opacity-75">
                  • {deliveryEstimate.originNotice}
                </span>
              </div>
            </div>
          </div>

          {/* Action Quick Links */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => {
                soundEffects.playClick();
                onOpenBouquetCustomizer();
              }}
              className={`px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 ${currentTheme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-750 text-cyan-300 border-slate-700'
                  : currentTheme === 'light'
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200'
                }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${currentTheme === 'dark' ? 'text-cyan-400' : currentTheme === 'light' ? 'text-emerald-600' : 'text-pink-600'
                }`} />
              <span>7-Step Customizer Studio</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                onOpenReminders();
              }}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors relative shadow-2xs ${currentTheme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  : currentTheme === 'light'
                    ? 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                    : 'bg-white hover:bg-pink-50 border-pink-100 text-stone-700'
                }`}
              title="Personal Occasion Reminders"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500" />
            </button>
          </div>
        </div>

        {/* Address edit dropdown if active */}
        {isEditingAddress && (
          <div className={`p-4 rounded-3xl border shadow-lg text-xs space-y-3 animate-in fade-in ${currentTheme === 'dark'
              ? 'bg-slate-900 border-slate-700 text-slate-100'
              : 'bg-white border-emerald-200 text-stone-900'
            }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                Set Delivery Location & Calculate Arrival Date
              </span>
              <span className="text-[11px] text-stone-500 dark:text-slate-400">
                Dispatch Hub: Kalmane Mother Nursery, Thirthahalli 577432
              </span>
            </div>

            {/* Quick selection presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-stone-500">Popular Hubs:</span>
              {POPULAR_DELIVERY_HUBS.map((hub) => (
                <button
                  key={hub.address}
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setAddress(hub.address);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${address === hub.address
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                    }`}
                >
                  {hub.label}
                </button>
              ))}
            </div>

            {/* Address input & Confirm button */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter street address, locality or pincode..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={`flex-1 px-4 py-2.5 rounded-xl border text-xs outline-none ${currentTheme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-white focus:ring-2 focus:ring-cyan-500'
                    : 'bg-white border-stone-300 focus:ring-2 focus:ring-emerald-500'
                  }`}
              />
              <button
                onClick={() => setIsEditingAddress(false)}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all ${currentTheme === 'dark'
                    ? 'bg-indigo-600 hover:bg-indigo-500'
                    : currentTheme === 'light'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-pink-600 hover:bg-pink-700'
                  }`}
              >
                Confirm Address
              </button>
            </div>

            {/* Live Real-Time Delivery Date Estimate Preview Banner */}
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-emerald-950 dark:text-emerald-200">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  Calculated Delivery:
                </span>
                <span>{deliveryEstimate.etaText}</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 self-start sm:self-auto">
                {deliveryEstimate.transitSpeed}
              </span>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* SUBTAB NAVIGATION: Home Showcase, Catalogue, Subscription   */}
        {/* ----------------------------------------------------------- */}
        <div className={`flex flex-wrap items-center justify-between gap-3 backdrop-blur-md p-2 rounded-2xl shadow-xs transition-colors ${currentTheme === 'dark'
            ? 'bg-slate-900/90 border border-slate-800'
            : currentTheme === 'light'
              ? 'bg-white/95 border border-stone-200/90'
              : 'bg-white/95 border border-rose-200/80'
          }`}>
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full w-full sm:w-auto">
            <button
              id="tab-btn-home"
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('home');
              }}
              className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === 'home'
                  ? currentTheme === 'dark'
                    ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-md font-black'
                    : currentTheme === 'light'
                      ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20 font-black'
                      : 'bg-rose-600 text-white shadow-md shadow-rose-600/25 font-black'
                  : currentTheme === 'dark'
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : currentTheme === 'light'
                      ? 'text-stone-600 hover:text-emerald-800 hover:bg-emerald-50/70'
                      : 'text-stone-600 hover:text-rose-700 hover:bg-rose-50/70'
                }`}
            >
              <Flower2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Home Showcase</span>
              <span className="sm:hidden">Home</span>
            </button>

            <button
              id="tab-btn-catalogue"
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('catalogue');
              }}
              className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === 'catalogue'
                  ? currentTheme === 'dark'
                    ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-md font-black'
                    : currentTheme === 'light'
                      ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20 font-black'
                      : 'bg-rose-600 text-white shadow-md shadow-rose-600/25 font-black'
                  : currentTheme === 'dark'
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : currentTheme === 'light'
                      ? 'text-stone-600 hover:text-emerald-800 hover:bg-emerald-50/70'
                      : 'text-stone-600 hover:text-rose-700 hover:bg-rose-50/70'
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Curated Catalogue ({fullCatalogue.length})</span>
              <span className="sm:hidden">Catalogue ({fullCatalogue.length})</span>
            </button>

            <button
              id="tab-btn-subscription"
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('subscription');
              }}
              className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === 'subscription'
                  ? currentTheme === 'dark'
                    ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50 font-black'
                    : currentTheme === 'light'
                      ? 'bg-emerald-800 text-white shadow-md ring-2 ring-emerald-400/50 font-black'
                      : 'bg-rose-800 text-white shadow-md ring-2 ring-rose-400/50 font-black'
                  : currentTheme === 'dark'
                    ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800'
                    : currentTheme === 'light'
                      ? 'text-stone-600 hover:text-emerald-800 hover:bg-emerald-50/70'
                      : 'text-stone-600 hover:text-rose-800 hover:bg-rose-50/70'
                }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Monthly Flower Box Subscription</span>
              <span className="sm:hidden">Flower Box</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${currentTheme === 'dark'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : currentTheme === 'light'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-rose-100 text-rose-900'
                }`}>
                {userSubscription ? 'Active Plan' : 'Subscribe'}
              </span>
            </button>
          </div>

          <div className={`hidden lg:flex items-center space-x-2 text-xs font-medium ${currentTheme === 'dark' ? 'text-slate-400' : 'text-stone-500'
            }`}>
            <span>Farm-Fresh Mountain Blooms • Cold-Chain Delivery</span>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* SUBSCRIPTION VIEW: Rendered when Subscription tab is active  */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'subscription' && (
          <div className={`rounded-[36px] p-4 sm:p-6 shadow-sm animate-in fade-in duration-200 transition-colors ${currentTheme === 'dark'
              ? 'bg-slate-900/90 border border-slate-800'
              : currentTheme === 'light'
                ? 'bg-white/95 border border-stone-200/90'
                : 'bg-white/95 border border-rose-200/80 shadow-rose-500/5'
            }`}>
            <SubscriptionManager
              user={currentUser}
              currentTheme={currentTheme}
              userSubscription={userSubscription}
              onSubscriptionUpdated={onSubscriptionUpdated}
            />
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* HERO SHOWCASE SECTION: Carousel & Studio Spotlight          */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'home' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

              {/* Featured Hero Floral Arrangement (7 cols on laptop) */}
              <div className={`lg:col-span-7 rounded-[36px] border p-6 shadow-xs flex flex-col justify-between relative overflow-hidden transition-colors ${currentTheme === 'dark'
                  ? 'bg-[#111a2e] border-slate-800 text-slate-100 shadow-xl'
                  : currentTheme === 'light'
                    ? 'bg-white border-stone-200/90 text-stone-900 shadow-sm'
                    : 'bg-white border-rose-200/80 text-[#37131e] shadow-xs'
                }`}>

                {/* Top Carousel Navigation & Tag */}
                <div className="flex items-center justify-between mb-4 z-10">
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentTheme === 'dark'
                        ? 'bg-slate-800 text-cyan-300 border-slate-700'
                        : currentTheme === 'light'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                          : 'bg-pink-100 text-pink-800 border-pink-200'
                      }`}>
                      {currentHero.tag}
                    </span>
                    <span className={`text-xs font-medium ${currentTheme === 'dark' ? 'text-slate-400' : 'text-stone-400'
                      }`}>
                      {currentHero.specs}
                    </span>
                  </div>

                  {/* Carousel Indicators */}
                  <div className="flex items-center space-x-1.5">
                    {heroItems.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          soundEffects.playClick();
                          setHeroIndex(idx);
                        }}
                        className={`transition-all duration-300 rounded-full ${heroIndex === idx
                            ? currentTheme === 'dark' ? 'w-6 h-2 bg-cyan-400' : currentTheme === 'light' ? 'w-6 h-2 bg-emerald-600' : 'w-6 h-2 bg-pink-600'
                            : currentTheme === 'dark' ? 'w-2 h-2 bg-slate-700 hover:bg-slate-600' : currentTheme === 'light' ? 'w-2 h-2 bg-stone-200 hover:bg-stone-300' : 'w-2 h-2 bg-pink-200 hover:bg-pink-300'
                          }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Hero Visual Card */}
                <div
                  onClick={() => handleOpenDetail(currentHero)}
                  className={`relative w-full aspect-[16/10] max-h-[360px] rounded-3xl overflow-hidden cursor-pointer group mb-4 border ${currentTheme === 'dark' ? 'bg-slate-800 border-slate-700' : currentTheme === 'light' ? 'bg-stone-100 border-stone-200' : 'bg-pink-50 border-pink-100/60'
                    }`}
                >
                  <img
                    src={currentHero.image}
                    alt={currentHero.name}
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-700"
                  />

                  {/* Floating Bottom Card Banner */}
                  <div className={`absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between gap-3 backdrop-blur-md rounded-2xl p-3 sm:p-4 border shadow-md transition-colors ${currentTheme === 'dark'
                      ? 'bg-slate-900/90 border-slate-700 text-white'
                      : currentTheme === 'light'
                        ? 'bg-white/95 border-stone-200 text-stone-900'
                        : 'bg-white/90 border-white/80 text-[#37131e]'
                    }`}>
                    <div>
                      <h2 className={`font-bold text-base sm:text-lg ${currentTheme === 'dark' ? 'text-white' : currentTheme === 'light' ? 'text-stone-900' : 'text-[#37131e]'
                        }`}>
                        {currentHero.name}
                      </h2>
                      <p className={`text-xs font-medium ${currentTheme === 'dark' ? 'text-slate-400' : 'text-stone-500'
                        }`}>
                        Morning harvested fresh stems
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <span className={`text-lg font-extrabold ${currentTheme === 'dark' ? 'text-white' : currentTheme === 'light' ? 'text-stone-900' : 'text-[#37131e]'
                          }`}>₹{currentHero.inrPrice || currentHero.price}</span>
                      </div>
                      <button
                        onClick={(e) => handleQuickAdd(currentHero, e)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center space-x-1 ${currentTheme === 'dark'
                            ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                            : currentTheme === 'light'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-pink-600 hover:bg-pink-700 text-white'
                          }`}
                        title="Quick Add to Basket"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description note */}
                <p className={`text-xs leading-relaxed pt-1 ${currentTheme === 'dark' ? 'text-slate-400' : 'text-stone-500'
                  }`}>
                  {currentHero.description}
                </p>
              </div>

              {/* Right Spotlight: Bespoke Studio Card & Circular Vignettes (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">

                {/* Bespoke 7-Step Bouquet Studio Banner */}
                <div
                  onClick={() => {
                    soundEffects.playClick();
                    onOpenBouquetCustomizer();
                  }}
                  className={`rounded-[36px] p-6 text-white cursor-pointer shadow-md transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[190px] ${currentTheme === 'dark'
                      ? 'bg-gradient-to-tr from-slate-900 via-indigo-900 to-purple-900 border border-indigo-500/30 shadow-indigo-950/50 hover:shadow-indigo-900/60'
                      : currentTheme === 'light'
                        ? 'bg-gradient-to-tr from-emerald-700 via-teal-700 to-emerald-800 shadow-emerald-900/20 hover:shadow-emerald-900/30'
                        : 'bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-600 shadow-pink-500/15 hover:shadow-pink-500/25'
                    }`}
                >
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-bold tracking-wide uppercase mb-3">
                        <Sparkles className="w-3 h-3 text-pink-200" />
                        <span>Interactive Studio</span>
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold font-serif leading-snug">
                        7-Step Bouquet Studio
                      </h3>
                      <p className="text-xs text-pink-100 max-w-xs mt-1.5">
                        Select stems, wrapping paper, ribbons, and botanical fragrance cards.
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="relative z-10 pt-4 flex items-center space-x-2 text-xs font-bold text-white">
                    <span className="underline underline-offset-4">Launch Customizer</span>
                    <span>→</span>
                  </div>
                </div>

                {/* Variety Vignettes Strip */}
                <div className={`rounded-[36px] border p-5 shadow-xs flex-1 flex flex-col justify-center transition-colors ${currentTheme === 'dark'
                    ? 'bg-[#111a2e] border-slate-800 text-slate-100 shadow-xl'
                    : currentTheme === 'light'
                      ? 'bg-white border-stone-200/90 text-stone-900 shadow-sm'
                      : 'bg-white border-rose-200/80 text-[#37131e] shadow-xs'
                  }`}>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${currentTheme === 'dark' ? 'text-slate-200' : 'text-stone-700'
                      }`}>
                      Popular Flower Varieties
                    </span>
                    <span className={`text-[11px] font-semibold ${currentTheme === 'dark' ? 'text-cyan-400' : currentTheme === 'light' ? 'text-emerald-600' : 'text-pink-600'
                      }`}>
                      Tap to view
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {circularItems.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleOpenDetail(item)}
                        className={`flex flex-col items-center text-center cursor-pointer group p-2 rounded-2xl transition-colors ${currentTheme === 'dark'
                            ? 'hover:bg-slate-800/80'
                            : currentTheme === 'light'
                              ? 'hover:bg-emerald-50/70'
                              : 'hover:bg-pink-50/60'
                          }`}
                      >
                        <div className={`w-16 h-16 rounded-2xl overflow-hidden p-0.5 border-2 transition-colors shadow-2xs ${currentTheme === 'dark'
                            ? 'border-slate-700 group-hover:border-cyan-400'
                            : currentTheme === 'light'
                              ? 'border-stone-200 group-hover:border-emerald-500'
                              : 'border-pink-100 group-hover:border-pink-500'
                          }`}>
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-xl group-hover:scale-108 transition-transform duration-300"
                          />
                        </div>
                        <span className={`text-[11px] font-semibold line-clamp-1 mt-1.5 transition-colors ${currentTheme === 'dark'
                            ? 'text-slate-200 group-hover:text-cyan-300'
                            : currentTheme === 'light'
                              ? 'text-stone-700 group-hover:text-emerald-800'
                              : 'text-stone-700 group-hover:text-pink-700'
                          }`}>
                          {item.name}
                        </span>
                        <span className={`text-[10px] font-mono ${currentTheme === 'dark' ? 'text-slate-400' : 'text-stone-400'
                          }`}>
                          ₹{item.inrPrice || item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Monthly Surprise Flower Box Spotlight Card (Home Tab Feature) */}
            <div className={`rounded-[36px] p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden transition-all ${currentTheme === 'dark'
                ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-400/40 shadow-indigo-950/30'
                : currentTheme === 'light'
                  ? 'bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-900 border-2 border-emerald-400/40 shadow-emerald-950/25'
                  : 'bg-gradient-to-r from-[#4c0519] via-[#37131e] to-[#24030d] border-2 border-rose-400/40 shadow-rose-950/25'
              }`}>
              <div className="space-y-2 relative z-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border ${currentTheme === 'dark'
                      ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30'
                      : currentTheme === 'light'
                        ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
                        : 'bg-rose-400/20 text-rose-300 border-rose-400/30'
                    }`}>
                    B2C Recurring Subscription Service
                  </span>
                  <span className={`px-3 py-1 rounded-full font-bold text-[10px] ${currentTheme === 'dark' ? 'bg-indigo-400/20 text-indigo-300' : currentTheme === 'light' ? 'bg-teal-400/20 text-teal-300' : 'bg-pink-400/20 text-pink-300'
                    }`}>
                    Active Membership Renews Sep 15
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-bold">
                  Monthly Surprise Flower Box & Feedback Loop
                </h3>
                <p className="text-stone-300 text-xs sm:text-sm max-w-2xl font-light leading-relaxed">
                  Curated farm-fresh seasonal mountain blooms delivered to your doorstep every 30 days. Your post-delivery ratings and botanical flower preferences directly inform our master florist's next harvest procurement!
                </p>
                <div className={`flex flex-wrap items-center gap-4 text-xs pt-1 ${currentTheme === 'dark' ? 'text-cyan-300' : currentTheme === 'light' ? 'text-emerald-300' : 'text-rose-200'
                  }`}>
                  <span className="flex items-center space-x-1.5 font-semibold">
                    <Check className="w-4 h-4" />
                    <span>3 Tiers (₹999 to ₹2999/mo)</span>
                  </span>
                  <span className="flex items-center space-x-1.5 font-semibold">
                    <Check className="w-4 h-4" />
                    <span>Artisan Vase Included in 1st Month</span>
                  </span>
                  <span className="flex items-center space-x-1.5 font-semibold">
                    <Check className="w-4 h-4" />
                    <span>Rate Deliveries & Steer Harvests</span>
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-center sm:items-end gap-2 relative z-10">
                <button
                  id="btn-banner-subscribe"
                  onClick={() => {
                    soundEffects.playClick();
                    setActiveTab('subscription');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`px-6 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-lg transition-all active:scale-95 flex items-center space-x-2 cursor-pointer ${currentTheme === 'dark'
                      ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-400/20'
                      : currentTheme === 'light'
                        ? 'bg-emerald-400 hover:bg-emerald-300 text-stone-950 shadow-emerald-400/20'
                        : 'bg-rose-400 hover:bg-rose-300 text-stone-950 shadow-rose-400/20'
                    }`}
                >
                  <Gift className="w-4 h-4" />
                  <span>{userSubscription ? 'Manage Flower Box Subscription →' : 'Subscribe to Monthly Flower Box →'}</span>
                </button>
                <span className={`text-[11px] font-mono ${currentTheme === 'dark' ? 'text-cyan-300/80' : currentTheme === 'light' ? 'text-emerald-300/80' : 'text-rose-300/80'
                  }`}>
                  {userSubscription
                    ? `${currentUser?.full_name || 'Venisha Dsouza'} • ${userSubscription.tier?.toUpperCase()} Tier Active`
                    : '3 Curated Floral Tiers Available • Fresh Cold-Pack Deliveries'}
                </span>
              </div>
            </div>

            {/* Biological Freshness Markdown Clearance Deals Showcase */}
            {discountedItems.length > 0 && (
              <div className={`rounded-[36px] p-6 sm:p-7 border shadow-md space-y-4 transition-all ${
                currentTheme === 'dark'
                  ? 'bg-gradient-to-br from-slate-900 via-rose-950/30 to-slate-900 border-rose-500/30 text-white'
                  : currentTheme === 'light'
                  ? 'bg-gradient-to-br from-rose-50/80 via-white to-amber-50/50 border-rose-200 text-stone-900'
                  : 'bg-gradient-to-br from-rose-50/90 via-pink-50/50 to-white border-rose-200 text-[#37131e]'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                        Daily Freshness Markdowns
                      </span>
                      <span className="text-xs text-rose-700 dark:text-rose-400 font-bold">
                        Up to 50% Biological Decay Markdown
                      </span>
                    </div>
                    <h3 className={`font-serif text-xl sm:text-2xl font-bold ${
                      currentTheme === 'dark' ? 'text-rose-200' : 'text-rose-950'
                    }`}>
                      Prime Stems & Clearance Harvest Batches
                    </h3>
                    <p className={`text-xs max-w-2xl font-light leading-relaxed ${
                      currentTheme === 'dark' ? 'text-slate-300' : 'text-stone-600'
                    }`}>
                      Stems harvested 3–5 days ago under continuous 4°C micro-mist hydration. Fully opened and conditioned for immediate table centerpieces, events, or vase display at dynamic discounts!
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      setCatalogueFilter('decay_markdowns');
                      const catEl = document.getElementById('catalogue-section-root');
                      if (catEl) catEl.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="shrink-0 px-5 py-2.5 rounded-2xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer self-start md:self-auto"
                  >
                    <span>View All {discountedItems.length} Clearance Deals</span>
                    <span>→</span>
                  </button>
                </div>

                {/* Featured Markdown Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  {discountedItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleOpenDetail(item)}
                      className={`p-3.5 rounded-2xl border cursor-pointer group transition-all flex items-center space-x-3.5 ${
                        currentTheme === 'dark'
                          ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700'
                          : 'bg-white hover:shadow-md border-rose-100 hover:border-rose-300'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0 border border-stone-200 dark:border-slate-700">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-108 transition-transform" />
                        <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-600 text-white shadow-xs">
                          {Math.round(item.decayDiscountPercent)}% OFF
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-xs truncate transition-colors ${
                          currentTheme === 'dark' ? 'text-white group-hover:text-rose-300' : 'text-stone-900 group-hover:text-rose-700'
                        }`}>
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-stone-400 truncate mt-0.5">
                          {item.specs}
                        </p>
                        <div className="flex items-baseline space-x-2 mt-1">
                          <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                            ₹{item.inrPrice || item.price}
                          </span>
                          {item.originalPrice && (
                            <span className="text-xs text-stone-400 line-through">
                              ₹{item.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleQuickAdd(item, e)}
                        className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 flex items-center justify-center shrink-0 transition-all shadow-2xs"
                        title="Quick Add"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Living Potted Plants & Indoor Nursery Showcase Card */}
            <div className={`rounded-[36px] p-6 sm:p-8 border shadow-lg space-y-6 transition-all ${currentTheme === 'dark'
                ? 'bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-900 border-emerald-500/30 text-white'
                : currentTheme === 'light'
                  ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-stone-50 border-emerald-200 text-stone-900'
                  : 'bg-gradient-to-br from-rose-50/80 via-emerald-50/40 to-pink-50/80 border-rose-200 text-stone-900'
              }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                      Living Nursery Collection
                    </span>
                    <span className="text-xs text-stone-500 dark:text-slate-400 font-medium">
                      Not just cut flowers — living plants for your sanctuary
                    </span>
                  </div>
                  <h3 className={`font-serif text-2xl sm:text-3xl font-bold ${currentTheme === 'dark' ? 'text-emerald-200' : 'text-emerald-950'
                    }`}>
                    Living Potted Plants & Air-Purifying Nursery
                  </h3>
                  <p className={`text-xs sm:text-sm max-w-2xl font-light leading-relaxed ${currentTheme === 'dark' ? 'text-slate-300' : 'text-stone-600'
                    }`}>
                    Nurtured in our Bengaluru greenhouse nurseries and potted in breathable terracotta planters with fortified organic compost. Shipped fully established with self-watering saucers and guaranteed 365-day botanical guidance.
                  </p>
                </div>

                <button
                  id="explore-all-potted-plants-btn"
                  onClick={() => {
                    soundEffects.playClick();
                    setActiveTab('home');
                    setCatalogueFilter('potted_plants');
                    setVisibleCount(100);
                    setTimeout(() => {
                      const catEl = document.getElementById('catalogue-section-root');
                      if (catEl) {
                        catEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 60);
                  }}
                  className="shrink-0 px-5 py-2.5 rounded-2xl font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Explore All Potted Plants ({livingNurseryPlants.length || 50})</span>
                  <span>→</span>
                </button>
              </div>

              {/* Quick Category Filter Tabs for Living Nursery */}
              <div className="flex items-center gap-1.5 pt-3 pb-1 overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap">
                {[
                  { id: 'all', label: `All Living Nursery (${livingNurseryPlants.length})` },
                  { id: 'indoor', label: 'Indoor Foliage (6)' },
                  { id: 'fruit', label: 'Fruit Trees & Palms (25)' },
                  { id: 'veggies', label: 'Kitchen Veggies (13)' },
                  { id: 'herbs', label: 'Ayurvedic Herbs (6)' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setLivingPlantFilter(tab.id);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${livingPlantFilter === tab.id
                        ? currentTheme === 'dark'
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                          : 'bg-emerald-800 text-white font-bold shadow-xs'
                        : currentTheme === 'dark'
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                          : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Living Potted Plants Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
                {(displayedLivingPlants.length > 0 ? (livingPlantFilter === 'all' ? displayedLivingPlants.slice(0, 16) : displayedLivingPlants) : [
                  {
                    id: 13,
                    name: 'Monstera Deliciosa',
                    botanical_name: 'Monstera deliciosa',
                    image: '/monstera_plant_pot.jpg',
                    price: 29,
                    inrPrice: 890,
                    specs: '60 cm • Terracotta Planter',
                    tag: 'Air Purifying'
                  },
                  {
                    id: 14,
                    name: 'Ficus Lyrata',
                    botanical_name: 'Ficus lyrata',
                    image: '/fiddle_fig_pot.jpg',
                    price: 45,
                    inrPrice: 1450,
                    specs: '85 cm • Living Specimen',
                    tag: 'Architectural'
                  },
                  {
                    id: 15,
                    name: 'Sansevieria Laurentii',
                    botanical_name: 'Sansevieria trifasciata',
                    image: '/snake_plant_pot.jpg',
                    price: 18,
                    inrPrice: 480,
                    specs: '45 cm • Ceramic Pot',
                    tag: 'NASA Air Purifier'
                  }
                ]).map((plant) => (
                  <div
                    key={plant.id}
                    onClick={() => handleOpenDetail(plant)}
                    className={`group rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between ${currentTheme === 'dark'
                        ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 hover:border-emerald-500/50 shadow-md'
                        : 'bg-white hover:bg-emerald-50/50 border-stone-200 hover:border-emerald-400 shadow-xs'
                      }`}
                  >
                    <div className="space-y-2.5">
                      <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-stone-100 dark:bg-slate-900 border border-stone-200/60 dark:border-slate-700">
                        <img
                          src={plant.image || plant.image_url || '/monstera_plant_pot.jpg'}
                          alt={plant.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 font-mono text-[9px] font-bold backdrop-blur-xs border border-emerald-500/30">
                          {plant.tag || 'Living Plant'}
                        </span>
                      </div>

                      <div>
                        <h4 className={`text-xs font-bold line-clamp-1 ${currentTheme === 'dark' ? 'text-white' : 'text-stone-900'
                          }`}>
                          {plant.name}
                        </h4>
                        {plant.botanical_name && (
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 italic line-clamp-1">
                            {plant.botanical_name}
                          </p>
                        )}
                        <p className="text-[10px] text-stone-500 dark:text-slate-400 font-mono font-medium mt-0.5 line-clamp-1">
                          {plant.specs || (plant.sunlight ? `${plant.sunlight} • ${plant.watering || 'Keep moist'}` : 'Living Nursery Specimen')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-100 dark:border-slate-700">
                      <div>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                          ₹{plant.inrPrice || plant.price}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleQuickAdd(plant, e)}
                        className={`px-3.5 py-1.5 rounded-full font-bold text-xs shadow-xs flex items-center space-x-1 transition-all active:scale-95 cursor-pointer ${
                          currentTheme === 'dark'
                            ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                            : currentTheme === 'light'
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                              : 'bg-rose-700 hover:bg-rose-800 text-white'
                        }`}
                        title="Add to Basket"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ----------------------------------------------------------- */}
        {/* CATALOGUE SECTION: EDITORIAL MENU / SQUARE BOXES & "VIEW MORE" */}
        {/* ----------------------------------------------------------- */}
        {(activeTab === 'home' || activeTab === 'catalogue') && (
          <section id="catalogue-section-root" className={`rounded-[40px] border p-4 sm:p-8 shadow-xs space-y-6 transition-colors ${currentTheme === 'dark'
              ? 'bg-[#111a2e]/90 border-slate-800 text-slate-100 shadow-xl'
              : currentTheme === 'light'
                ? 'bg-white/95 border-stone-200/90 text-stone-800 shadow-xs'
                : 'bg-white/90 border-rose-200/80 text-[#37131e] shadow-xs'
            }`}>

            {/* Section Header: Title + Category Filter Pills + Layout Switcher */}
            <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5 ${currentTheme === 'dark' ? 'border-slate-800' : currentTheme === 'light' ? 'border-stone-200' : 'border-rose-100'
              }`}>
              <div>
                <div className="flex items-center space-x-2">
                  <Flower2 className={`w-5 h-5 ${currentTheme === 'dark' ? 'text-cyan-400' : currentTheme === 'light' ? 'text-emerald-600' : 'text-pink-600'
                    }`} />
                  <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${currentTheme === 'dark' ? 'text-white' : currentTheme === 'light' ? 'text-stone-900' : 'text-[#37131e]'
                    }`}>
                    Curated Floral & Living Nursery Catalogue
                  </h2>
                </div>
                <p className={`text-xs mt-1 ${currentTheme === 'dark' ? 'text-slate-400' : 'text-stone-500'
                  }`}>
                  Artisanal morning harvests, living nursery plants, fruit trees & Ayurvedic botanicals with 365-day care support.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Filter Category Pills */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar w-full sm:w-auto">
                  {[
                    { id: 'everything', label: `All Flora (${fullCatalogue.length})` },
                    ...(discountedItems.length > 0 ? [{ id: 'decay_markdowns', label: `Freshness Deals (${discountedItems.length})`, isMarkdown: true }] : []),
                    { id: 'potted_plants', label: `All Living Plants (${livingNurseryPlants.length})` },
                    { id: 'indoor_foliage', label: 'Indoor Foliage (6)' },
                    { id: 'fruit_plants', label: 'Fruit Trees & Palms (25)' },
                    { id: 'vegetables', label: 'Kitchen Veggies (13)' },
                    { id: 'herbs', label: 'Ayurvedic Herbs (6)' },
                    { id: 'cut_flowers', label: 'Fresh Cut Blooms (15)' },
                    { id: 'roses', label: 'Roses' },
                    { id: 'marigolds', label: 'Marigolds (Genda)' },
                    { id: 'planters', label: 'Planters & Pots (11)' }
                  ].map((pill) => (
                    <button
                      key={pill.id}
                      onClick={() => {
                        soundEffects.playClick();
                        setCatalogueFilter(pill.id);
                        setVisibleCount(pill.id === 'everything' ? 24 : 100);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${catalogueFilter === pill.id
                          ? pill.isMarkdown
                            ? 'bg-rose-600 text-white shadow-xs shadow-rose-600/30'
                            : currentTheme === 'dark'
                            ? 'bg-cyan-400 text-slate-950 shadow-xs shadow-cyan-400/25'
                            : currentTheme === 'light'
                              ? 'bg-emerald-700 text-white shadow-xs shadow-emerald-700/25'
                              : 'bg-rose-600 text-white shadow-xs shadow-rose-500/25'
                          : pill.isMarkdown
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 font-extrabold'
                          : currentTheme === 'dark'
                            ? 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                            : currentTheme === 'light'
                              ? 'bg-stone-100 hover:bg-emerald-50 text-stone-700 border border-stone-200'
                              : 'bg-pink-50 hover:bg-pink-100 text-stone-600 border border-pink-100'
                        }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                {/* Layout Switcher (Editorial Menu vs Square Grid) */}
                <div className={`flex items-center p-1 rounded-full border shrink-0 ${currentTheme === 'dark' ? 'bg-slate-800 border-slate-700' : currentTheme === 'light' ? 'bg-stone-100 border-stone-200' : 'bg-pink-50/80 border-pink-200/80'
                  }`}>
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      setCatalogueLayout('editorial');
                    }}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${catalogueLayout === 'editorial'
                        ? currentTheme === 'dark' ? 'bg-cyan-400 text-slate-950 shadow-xs' : currentTheme === 'light' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-pink-600 text-white shadow-xs'
                        : currentTheme === 'dark' ? 'text-slate-400 hover:text-white' : currentTheme === 'light' ? 'text-stone-600 hover:text-emerald-700' : 'text-stone-600 hover:text-pink-700'
                      }`}
                    title="Editorial Phone Menu Format (Matching Reference Photo)"
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Menu</span>
                  </button>

                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      setCatalogueLayout('grid');
                    }}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${catalogueLayout === 'grid'
                        ? currentTheme === 'dark' ? 'bg-cyan-400 text-slate-950 shadow-xs' : currentTheme === 'light' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-pink-600 text-white shadow-xs'
                        : currentTheme === 'dark' ? 'text-slate-400 hover:text-white' : currentTheme === 'light' ? 'text-stone-600 hover:text-emerald-700' : 'text-stone-600 hover:text-pink-700'
                      }`}
                    title="Square Box Cards Grid"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Grid</span>
                  </button>

                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      setCatalogueLayout('auto');
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${catalogueLayout === 'auto'
                        ? currentTheme === 'dark' ? 'bg-slate-700 text-cyan-300 shadow-2xs border border-slate-600' : currentTheme === 'light' ? 'bg-white text-emerald-800 shadow-2xs border border-stone-200' : 'bg-white text-pink-700 shadow-2xs border border-pink-200'
                        : currentTheme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-stone-500 hover:text-stone-800'
                      }`}
                    title="Auto Adaptive (Menu on Phone, Grid on Laptop)"
                  >
                    Auto
                  </button>
                </div>
              </div>
            </div>

            {/* Results Summary Counter */}
            <div className={`flex items-center justify-between text-xs px-1 ${currentTheme === 'dark' ? 'text-slate-400' : 'text-stone-500'
              }`}>
              <span>
                Showing <strong className={currentTheme === 'dark' ? 'text-white' : 'text-stone-900'}>{displayedCatalogue.length}</strong> of{' '}
                <strong className={currentTheme === 'dark' ? 'text-white' : 'text-stone-900'}>{filteredCatalogue.length}</strong> floral arrangements
              </span>
              {searchQuery && (
                <span className={currentTheme === 'dark' ? 'text-cyan-400 font-semibold' : currentTheme === 'light' ? 'text-emerald-600 font-semibold' : 'text-pink-600 font-semibold'}>
                  Filtering by "{searchQuery}"
                </span>
              )}
            </div>

            {/* Decay Markdown Clearance Info Notice Banner */}
            {catalogueFilter === 'decay_markdowns' && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
                <div>
                  <h4 className="font-bold text-sm text-rose-900 dark:text-rose-100">
                    Biological Freshness Markdown Clearance Deals
                  </h4>
                  <p className="text-[11px] text-rose-800 dark:text-rose-300 mt-0.5">
                    Premium floral stems harvested 3–5 days ago and maintained under continuous 4°C micro-mist cold-chain. Fully open and hydrated, offering maximum visual impact at discounts of up to 50%!
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-[10px] tracking-wider uppercase shrink-0 self-start sm:self-auto">
                  FEFO Freshness Allocation
                </span>
              </div>
            )}

            {/* ========================================================= */}
            {/* CATALOGUE CONTENT: EDITORIAL MENU OR SQUARE BOXES GRID    */}
            {/* ========================================================= */}
            {catalogueLayout === 'editorial' ? (
              renderEditorialMenuList()
            ) : catalogueLayout === 'grid' ? (
              renderSquareBoxesGrid()
            ) : (
              <>
                {/* On phone screens (< sm): Editorial Menu layout */}
                <div className="block sm:hidden">
                  {renderEditorialMenuList()}
                </div>

                {/* On laptop / tablet screens (>= sm): Square boxes grid */}
                <div className="hidden sm:block">
                  {renderSquareBoxesGrid()}
                </div>
              </>
            )}

            {/* ========================================================= */}
            {/* "VIEW MORE" PAGINATION BUTTON                             */}
            {/* ========================================================= */}
            {visibleCount < filteredCatalogue.length && (
              <div className="flex flex-col items-center justify-center pt-6 pb-4">
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setVisibleCount((prev) => prev + 8);
                  }}
                  className={`px-8 py-3.5 rounded-full font-bold text-xs sm:text-sm border-2 shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center space-x-2 ${currentTheme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700 hover:border-cyan-500/50'
                      : currentTheme === 'light'
                        ? 'bg-white hover:bg-emerald-50 text-emerald-800 border-stone-200 hover:border-emerald-300'
                        : 'bg-white hover:bg-pink-50 text-pink-700 hover:text-pink-800 border-pink-200'
                    }`}
                >
                  <span>View More Floral Options ({filteredCatalogue.length - visibleCount} remaining)</span>
                  <ChevronDown className={`w-4 h-4 animate-bounce ${currentTheme === 'dark' ? 'text-cyan-400' : currentTheme === 'light' ? 'text-emerald-500' : 'text-pink-500'}`} />
                </button>
                <p className={`text-[11px] mt-2 font-medium ${currentTheme === 'dark' ? 'text-slate-500' : 'text-stone-400'
                  }`}>
                  Click to load more curated botanical arrangements
                </p>
              </div>
            )}

            {/* All items viewed indicator */}
            {visibleCount >= filteredCatalogue.length && filteredCatalogue.length > 8 && (
              <div className={`text-center pt-6 pb-2 text-xs font-medium ${currentTheme === 'dark' ? 'text-slate-500' : 'text-stone-400'
                }`}>
                You've viewed all {filteredCatalogue.length} curated botanical arrangements
              </div>
            )}

          </section>
        )}

      </div>

      {/* ============================================================= */}
      {/* PRODUCT DETAIL MODAL                                          */}
      {/* ============================================================= */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className={`rounded-3xl max-w-2xl w-full p-4 sm:p-8 border shadow-2xl relative max-h-[92vh] overflow-y-auto transition-colors ${currentTheme === 'dark'
              ? 'bg-slate-900 border-slate-700 text-slate-100'
              : currentTheme === 'light'
                ? 'bg-white border-stone-200 text-stone-900'
                : 'bg-white border-rose-200 text-[#37131e]'
            }`}>

            {/* Header: Close Button & Favorite Heart */}
            <div className={`flex items-center justify-between pb-3 border-b ${currentTheme === 'dark' ? 'border-slate-800' : currentTheme === 'light' ? 'border-stone-100' : 'border-pink-100'
              }`}>
              <button
                onClick={() => setSelectedProduct(null)}
                className={`p-2 rounded-full transition-colors ${currentTheme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${currentTheme === 'dark' ? 'text-cyan-400' : currentTheme === 'light' ? 'text-emerald-700' : 'text-pink-600'
                  }`}>
                  {selectedProduct.category || 'Fresh Harvest'}
                </span>
                <button
                  onClick={() => handleToggleFavorite(selectedProduct.id)}
                  className={`p-2 rounded-full transition-colors ${currentTheme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400'
                      : 'bg-pink-50 hover:bg-pink-100 text-stone-400 hover:text-rose-500'
                    }`}
                  title="Favorite"
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${favoritesList.includes(selectedProduct.id) ? 'fill-rose-500 text-rose-500' : 'currentColor'
                      }`}
                  />
                </button>
              </div>
            </div>

            {/* Modal Body: Two-Column Image & Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 my-4 sm:my-5 items-center">

              {/* Product Photo */}
              <div className={`aspect-[16/10] sm:aspect-square max-h-56 sm:max-h-none w-full rounded-2xl overflow-hidden border flex items-center justify-center ${currentTheme === 'dark' ? 'bg-slate-800 border-slate-700' : currentTheme === 'light' ? 'bg-stone-100 border-stone-200' : 'bg-pink-50 border-pink-100'
                }`}>
                <img
                  src={selectedProduct.image || selectedProduct.image_url || '/pink_peonies_hero.jpg'}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="space-y-3">
                <div>
                  <h3 className={`text-xl sm:text-2xl font-bold leading-snug ${currentTheme === 'dark' ? 'text-white' : currentTheme === 'light' ? 'text-stone-900' : 'text-[#37131e]'
                    }`}>
                    {selectedProduct.name}
                  </h3>
                  <p className={`text-xs font-medium mt-1 ${currentTheme === 'dark' ? 'text-slate-400' : 'text-stone-400'
                    }`}>
                    {selectedProduct.specs}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex items-center space-x-1 text-amber-500 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold font-mono text-amber-950 dark:text-amber-200">
                        {reviewStats.average_rating}
                      </span>
                    </div>
                    <span className="text-xs text-stone-500 dark:text-slate-400">
                      ({reviewStats.total_reviews} {reviewStats.total_reviews === 1 ? 'review' : 'reviews'})
                    </span>
                    {reviewStats.customer_photos?.length > 0 && (
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                        <Camera className="w-3 h-3" />
                        <span>{reviewStats.customer_photos.length} photos</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing & Quantity Stepper */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <div className="flex items-baseline space-x-2 flex-wrap">
                      <span className={`text-2xl font-extrabold ${currentTheme === 'dark' ? 'text-white' : currentTheme === 'light' ? 'text-stone-950' : 'text-[#37131e]'
                        }`}>
                        ₹{unitPriceInr.toLocaleString()}
                      </span>
                      {selectedProduct.originalPrice && selectedProduct.originalPrice > (selectedProduct.inrPrice || selectedProduct.price) && (
                        <span className="text-sm text-stone-400 line-through">
                          ₹{selectedProduct.originalPrice.toLocaleString()}
                        </span>
                      )}
                      {selectedProduct.hasDecayDiscount && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          {Math.round(selectedProduct.decayDiscountPercent)}% OFF
                        </span>
                      )}
                    </div>
                    {selectedProduct.hasDecayDiscount && (
                      <span className="text-[11px] font-medium text-rose-700 dark:text-rose-400 block mt-0.5">
                        Biological Freshness Clearance Markdown Applied
                      </span>
                    )}
                  </div>

                  {/* Quantity Stepper */}
                  <div className={`flex items-center space-x-3 border rounded-full px-3 py-1.5 ${currentTheme === 'dark' ? 'bg-slate-800 border-slate-700' : currentTheme === 'light' ? 'bg-stone-100 border-stone-200' : 'bg-pink-50 border-pink-100'
                    }`}>
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="text-stone-400 hover:text-stone-100 text-sm font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className={`text-xs font-bold font-mono ${currentTheme === 'dark' ? 'text-white' : 'text-stone-800'
                      }`}>
                      {quantity < 10 ? `0${quantity}` : quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="text-stone-400 hover:text-stone-100 text-sm font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className={`text-xs leading-relaxed pt-1 ${currentTheme === 'dark' ? 'text-slate-300' : 'text-stone-600'
                  }`}>
                  {selectedProduct.description ||
                    'Fresh hand-tied artisan bouquet of premium blooms conditioned with botanical flower food for maximum 7-day freshness guarantee.'}
                </p>

                {/* Includes Chips */}
                <div className="space-y-1.5 pt-2">
                  <span className={`text-[11px] font-bold uppercase tracking-wide ${currentTheme === 'dark' ? 'text-slate-400' : 'text-stone-500'
                    }`}>
                    Includes
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(selectedProduct.includes || [
                      { name: 'Fresh Blooms' },
                      { name: 'Silver Foliage' },
                      { name: 'Satin Bow' }
                    ]).map((inc, i) => (
                      <span
                        key={i}
                        className={`px-2.5 py-1 rounded-xl text-xs font-medium border ${currentTheme === 'dark'
                            ? 'bg-slate-800 text-slate-200 border-slate-700'
                            : currentTheme === 'light'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-pink-50 text-stone-700 border-pink-100'
                          }`}
                      >
                        {inc.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Real-time Location Delivery Window */}
                <div className={`p-3 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 ${currentTheme === 'dark'
                    ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  }`}>
                  <div className="flex items-center space-x-2.5">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-[11px]">
                        Delivering to: <span className="underline decoration-emerald-500/50">{address}</span>
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400">
                        {deliveryEstimate.etaText}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-slate-900 border border-emerald-300 dark:border-slate-700 text-emerald-800 dark:text-emerald-300 shrink-0 self-start sm:self-auto">
                    {deliveryEstimate.transitSpeed}
                  </span>
                </div>

              </div>

            </div>



            {/* ========================================================= */}
            {/* VERIFIED CUSTOMER REVIEWS & PHOTO GALLERY                 */}
            {/* ========================================================= */}
            <div className={`my-5 p-4 sm:p-5 rounded-2xl border transition-colors ${currentTheme === 'dark'
                ? 'bg-slate-800/60 border-slate-700 text-slate-100'
                : currentTheme === 'light'
                  ? 'bg-stone-50 border-stone-200 text-stone-900'
                  : 'bg-rose-50/40 border-pink-200 text-stone-900'
              }`}>
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60 dark:border-slate-700">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold tracking-tight">
                      Customer Reviews & Botanical Photos
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center space-x-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= Math.round(reviewStats.average_rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-300 dark:text-slate-600'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold font-mono">
                      {reviewStats.average_rating} / 5.0
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-slate-400">
                      • {reviewStats.total_reviews} verified plant {reviewStats.total_reviews === 1 ? 'buyer' : 'buyers'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setIsAddingReview(!isAddingReview);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 self-start sm:self-auto ${isAddingReview
                      ? 'bg-stone-200 dark:bg-slate-700 text-stone-800 dark:text-slate-200'
                      : currentTheme === 'dark'
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-xs'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                    }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isAddingReview ? 'Close Review Form' : 'Write a Review'}</span>
                </button>
              </div>

              {/* Customer Photos Showcase Strip */}
              {reviewStats.customer_photos?.length > 0 && (
                <div className="pt-3 pb-2">
                  <div className="flex items-center space-x-1.5 mb-2">
                    <Camera className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wide text-stone-600 dark:text-slate-300">
                      Real Customer Photos ({reviewStats.customer_photos.length})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                    {reviewStats.customer_photos.map((photo, pIdx) => (
                      <div
                        key={pIdx}
                        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-stone-200 dark:border-slate-700 shrink-0 shadow-xs group"
                      >
                        <img
                          src={photo}
                          alt="Customer plant review"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                          <span className="text-[9px] text-white font-mono">Verified</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Collapsible Write Review Form */}
              {isAddingReview && (
                <form
                  onSubmit={handleAddReview}
                  className="mt-3 p-3.5 rounded-xl border border-emerald-300/60 dark:border-cyan-500/30 bg-white dark:bg-slate-900/90 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 dark:text-slate-100">
                      Rate this Botanical Specimen
                    </span>
                    {/* Star Picker */}
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            soundEffects.playClick();
                            setNewRating(star);
                          }}
                          className="p-1 text-amber-400 hover:scale-125 transition-transform"
                        >
                          <Star
                            className={`w-4 h-4 ${star <= newRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-stone-300 dark:text-slate-600'
                              }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-mono font-bold ml-1 text-amber-600 dark:text-amber-300">
                        {newRating}.0
                      </span>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Review Headline (e.g. Gorgeous fenestrations, healthy root ball)"
                      value={newReviewTitle}
                      onChange={(e) => setNewReviewTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <textarea
                      rows={3}
                      placeholder="Share your experience: plant vigor, packaging freshness, pot quality, watering response..."
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <Camera className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <input
                        type="url"
                        placeholder="Attach Photo URL (e.g. https://images.unsplash.com/...)"
                        value={newReviewPhotoUrl}
                        onChange={(e) => setNewReviewPhotoUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    {newReviewPhotoUrl && (
                      <div className="mt-2 flex items-center space-x-2">
                        <img
                          src={newReviewPhotoUrl}
                          alt="Preview"
                          className="w-12 h-12 rounded-lg object-cover border border-stone-200 dark:border-slate-700"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                          ✓ Photo attached
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingReview(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReview || !newReviewComment.trim()}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50 transition-all"
                    >
                      {isSubmittingReview ? 'Publishing...' : 'Publish Review'}
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="mt-3 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {isLoadingReviews ? (
                  <div className="py-4 text-center text-xs text-stone-400">
                    Loading botanical reviews...
                  </div>
                ) : productReviews.length === 0 ? (
                  <div className="py-4 text-center text-xs text-stone-400">
                    No customer reviews yet. Be the first to review this specimen!
                  </div>
                ) : (
                  productReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 rounded-xl border border-stone-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-left transition-all hover:border-stone-300 dark:hover:border-slate-600"
                    >
                      {/* Review Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-stone-900 dark:text-white">
                              {rev.reviewer_name}
                            </span>
                            {rev.is_verified_purchase && (
                              <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                <span>Verified Buyer</span>
                              </span>
                            )}
                          </div>
                          {/* Stars */}
                          <div className="flex items-center space-x-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${s <= rev.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-stone-300 dark:text-slate-600'
                                  }`}
                              />
                            ))}
                            <span className="text-[11px] font-bold ml-1 text-stone-700 dark:text-slate-300">
                              {rev.review_title}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] text-stone-400 dark:text-slate-500 font-mono shrink-0">
                          {rev.created_at ? rev.created_at.split('T')[0] : 'Recent'}
                        </span>
                      </div>

                      {/* Review Text */}
                      <p className="text-xs text-stone-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                        {rev.review_text}
                      </p>

                      {/* Review Photo & Helpful Action Footer */}
                      <div className="flex items-center justify-between gap-3 mt-2.5 pt-2 border-t border-stone-100 dark:border-slate-700/50">
                        {rev.photo_url ? (
                          <div className="flex items-center space-x-2">
                            <img
                              src={rev.photo_url}
                              alt="Customer photo"
                              className="w-10 h-10 rounded-lg object-cover border border-stone-200 dark:border-slate-600 cursor-pointer hover:scale-125 transition-transform"
                            />
                            <span className="text-[10px] text-stone-400 flex items-center space-x-1">
                              <Camera className="w-3 h-3" />
                              <span>Customer Photo</span>
                            </span>
                          </div>
                        ) : (
                          <div />
                        )}

                        <button
                          type="button"
                          onClick={() => handleVoteHelpful(rev.id)}
                          className="flex items-center space-x-1 text-[11px] font-semibold text-stone-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>Helpful ({rev.helpful_votes})</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Bottom: Add to Cart Button */}
            <div className={`pt-4 border-t flex items-center justify-between gap-4 ${currentTheme === 'dark' ? 'border-slate-800' : currentTheme === 'light' ? 'border-stone-100' : 'border-pink-100'
              }`}>
              <button
                onClick={() => setSelectedProduct(null)}
                className={`px-5 py-3 rounded-xl text-xs font-bold transition-all ${currentTheme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
              >
                Continue Browsing
              </button>

              <button
                onClick={() => {
                  if (!currentUser) {
                    soundEffects.playClick();
                    setAuthPromptAction('purchase');
                    setShowAuthPrompt(true);
                    return;
                  }
                  soundEffects.playStemSnip();
                  onAddToCart({
                    id: selectedProduct.id,
                    original_product_id: selectedProduct.id,
                    name: selectedProduct.name,
                    base_price: selectedProduct?.originalPrice || selectedProduct?.base_price || unitPriceInr,
                    effective_price: unitPriceInr,
                    price: unitPriceInr,
                    original_price: selectedProduct?.originalPrice || null,
                    decay_discount_percent: selectedProduct?.decayDiscountPercent || 0,
                    has_decay_discount: selectedProduct?.hasDecayDiscount || false,
                    image_url: selectedProduct.image || selectedProduct.image_url,
                    quantity: quantity
                  });
                  setToastMessage(
                    `Added ${quantity} × ${selectedProduct.name} to Basket!`
                  );
                  setSelectedProduct(null);
                  setTimeout(() => setToastMessage(null), 2500);
                }}
                className={`flex-1 py-3.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 ${currentTheme === 'dark'
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                    : currentTheme === 'light'
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20'
                      : 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-500/20'
                  }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  Add {quantity} to Cart • ₹{totalPriceInr.toLocaleString()}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Bottom Quick Bar for quick Cart & Orders jump */}
      <div className="fixed bottom-3 sm:bottom-5 left-1/2 transform -translate-x-1/2 z-40 max-w-[96vw] sm:max-w-none">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-pink-200/80 dark:border-slate-800 rounded-full px-3.5 sm:px-5 py-2 shadow-xl flex items-center space-x-2 sm:space-x-4 text-[11px] sm:text-xs">
          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex items-center space-x-1.5 text-xs font-bold transition-colors ${activeTab === 'home' ? 'text-pink-600 font-black' : 'text-stone-700 dark:text-slate-300 hover:text-pink-600'
              }`}
          >
            <Flower2 className="w-4 h-4 text-pink-600" />
            <span>Top</span>
          </button>

          <span className="text-pink-200 dark:text-slate-700">|</span>

          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('subscription');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex items-center space-x-1.5 text-xs font-bold transition-colors ${activeTab === 'subscription' ? 'text-emerald-700 dark:text-emerald-400 font-black' : 'text-stone-700 dark:text-slate-300 hover:text-emerald-600'
              }`}
          >
            <Gift className="w-4 h-4 text-emerald-600" />
            <span>Flower Box</span>
          </button>

          <span className="text-pink-200 dark:text-slate-700">|</span>

          <button
            onClick={() => {
              soundEffects.playClick();
              onOpenCart();
            }}
            className="flex items-center space-x-1.5 text-xs font-bold text-stone-700 dark:text-slate-300 hover:text-pink-600 transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-pink-600" />
            <span>Basket ({cartCount})</span>
          </button>

          <span className="text-pink-200 dark:text-slate-700">|</span>

          <button
            onClick={() => {
              soundEffects.playClick();
              onOpenOrders();
            }}
            className="flex items-center space-x-1.5 text-xs font-bold text-stone-700 dark:text-slate-300 hover:text-pink-600 transition-colors"
          >
            <User className="w-4 h-4 text-pink-600" />
            <span>Orders</span>
          </button>
        </div>
      </div>

      {/* Auth Prompt Modal for Signed-Out Users */}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {authPromptAction === 'wishlist' ? 'Save to Wishlist' : 'Sign In to Purchase'}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                {authPromptAction === 'wishlist'
                  ? 'Please log in or register to save your favorite floral arrangements and pots.'
                  : 'Please log in or create an account to add items to your basket and complete checkout.'}
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setShowAuthPrompt(false);
                  if (onOpenLogin) onOpenLogin();
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Log In or Register
              </button>
              <button
                type="button"
                onClick={() => setShowAuthPrompt(false)}
                className="w-full py-2 rounded-xl text-stone-500 hover:text-stone-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
