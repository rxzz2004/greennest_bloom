/**
 * Green Nest Bloom - Location-Aware Botanical Delivery Calculator
 * Dispatches originate from: Kalmane Mother Nursery & Cold-Chain Logistics Hub,
 * Thirthahalli, Karnataka 577432.
 */

export const POPULAR_DELIVERY_HUBS = [
  { label: 'Kavoor, Mangalore (575015)', address: 'Kavoor, Mangalore - 575015', eta: '1-2 Days' },
  { label: 'Kalmane, Thirthahalli (577432)', address: 'Kalmane Nursery Hub, Thirthahalli - 577432', eta: 'Same Day' },
  { label: 'Indiranagar, Bengaluru (560038)', address: 'Indiranagar, Bengaluru - 560038', eta: '1-2 Days' },
  { label: 'Manipal / Udupi (576104)', address: 'Manipal, Udupi - 576104', eta: '1-2 Days' },
  { label: 'Shimoga Town (577201)', address: 'Shivamogga Central - 577201', eta: '1 Day' },
];

export const calculateDeliveryEstimate = (userAddress = '') => {
  const addr = (userAddress || '').trim();
  const lower = addr.toLowerCase();
  const now = new Date();

  const formatDate = (dateObj) => {
    return dateObj.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const getFutureDate = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };

  // 1. Hyper-Local Western Ghats Surrounds (< 30 km from Kalmane Nursery Hub)
  // Thirthahalli, Kalmane, Koppa, Agumbe, Sringeri
  if (
    lower.includes('thirthahalli') ||
    lower.includes('kalmane') ||
    lower.includes('koppa') ||
    lower.includes('agumbe') ||
    lower.includes('sringeri') ||
    lower.includes('577432') ||
    lower.includes('577126') ||
    lower.includes('577139')
  ) {
    const todayStr = formatDate(now);
    return {
      type: 'hyper_local',
      minDays: 0,
      maxDays: 0,
      transitSpeed: 'Same-Day Rapid Dispatch',
      vehicleType: 'EV Scooter / Local Nursery Van',
      dateRange: todayStr,
      shortEta: `Today by 5:00 PM (${todayStr})`,
      etaText: `Same-Day Express • Delivered Today by 5:00 PM (${todayStr})`,
      originNotice: 'Immediate dispatch from Kalmane Mother Nursery (< 25 km)',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
  }

  // 2. Coastal Karnataka & Western Ghats Corridor (~120-170 km from Kalmane)
  // Kavoor, Mangalore, Surathkal, Kadri, Udupi, Manipal, Karkala, Sagar, Shimoga
  if (
    lower.includes('kavoor') ||
    lower.includes('mangalore') ||
    lower.includes('mangaluru') ||
    lower.includes('575015') ||
    lower.includes('5750') ||
    lower.includes('surathkal') ||
    lower.includes('kadri') ||
    lower.includes('bejai') ||
    lower.includes('kankanady') ||
    lower.includes('udupi') ||
    lower.includes('manipal') ||
    lower.includes('5761') ||
    lower.includes('karkala') ||
    lower.includes('bantwal') ||
    lower.includes('puttur') ||
    lower.includes('shimoga') ||
    lower.includes('shivamogga') ||
    lower.includes('sagar') ||
    lower.includes('bhadravathi')
  ) {
    const minDate = getFutureDate(1);
    const maxDate = getFutureDate(2);
    const dateRangeStr = `${formatDate(minDate)} – ${formatDate(maxDate)}`;
    return {
      type: 'coastal_cold_chain',
      minDays: 1,
      maxDays: 2,
      transitSpeed: '1-2 Days Ghat Cold-Chain',
      vehicleType: 'Refrigerated Cold-Chain Van (4°C Micro-Mist)',
      dateRange: dateRangeStr,
      shortEta: `Arrives in 1-2 Days (${dateRangeStr})`,
      etaText: `Cold-Chain Delivery in 1-2 Days • ${dateRangeStr}`,
      originNotice: 'Cross-Ghat Cold-Chain Van from Kalmane Nursery (~140 km)',
      badgeClass: 'bg-teal-100 text-teal-800 border-teal-300'
    };
  }

  // 3. Karnataka Metros (~250-380 km from Kalmane Hub)
  // Bengaluru, Mysuru, Hubli, Dharwad, Belgaum
  if (
    lower.includes('bengaluru') ||
    lower.includes('bangalore') ||
    lower.includes('mysuru') ||
    lower.includes('mysore') ||
    lower.includes('hubli') ||
    lower.includes('dharwad') ||
    lower.includes('belagavi') ||
    lower.includes('belgaum') ||
    lower.includes('5600') ||
    lower.includes('5700') ||
    lower.includes('5800')
  ) {
    const minDate = getFutureDate(1);
    const maxDate = getFutureDate(2);
    const dateRangeStr = `${formatDate(minDate)} – ${formatDate(maxDate)}`;
    return {
      type: 'metro_line_haul',
      minDays: 1,
      maxDays: 2,
      transitSpeed: '1-2 Days Express Van',
      vehicleType: 'Line-Haul Refrigerated Transit',
      dateRange: dateRangeStr,
      shortEta: `Arrives in 1-2 Days (${dateRangeStr})`,
      etaText: `Cold-Chain Delivery in 1-2 Days • ${dateRangeStr}`,
      originNotice: 'Line-Haul refrigerated dispatch from Kalmane Nursery Hub',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
  }

  // 4. Other National Hubs / General Pincodes (> 400 km)
  // Checks if it is a Karnataka 57/58/56 postal region vs national
  const isKarnatakaPin = /\b(56|57|58|59)\d{4}\b/.test(addr);
  const minDays = isKarnatakaPin ? 1 : 2;
  const maxDays = isKarnatakaPin ? 2 : 3;
  const minDate = getFutureDate(minDays);
  const maxDate = getFutureDate(maxDays);
  const dateRangeStr = `${formatDate(minDate)} – ${formatDate(maxDate)}`;

  return {
    type: 'national_dispatch',
    minDays,
    maxDays,
    transitSpeed: `${minDays}-${maxDays} Days Express`,
    vehicleType: 'Heavy Refrigerated Line-Haul / Express Cargo',
    dateRange: dateRangeStr,
    shortEta: `Arrives in ${minDays}-${maxDays} Days (${dateRangeStr})`,
    etaText: `Cold-Chain Delivery in ${minDays}-${maxDays} Days • ${dateRangeStr}`,
    originNotice: 'Climate-controlled dispatch from Kalmane Nursery Hub, Thirthahalli',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300'
  };
};
