const API_BASE = '/api';

export const api = {
  // Auth
  sendOtp: async (email, fullName, userType, intent = 'register') => {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, full_name: fullName, user_type: userType, intent })
    });
    return res.json();
  },
  loginWithOtp: async (email, otp) => {
    const res = await fetch(`${API_BASE}/auth/login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    return res.json();
  },
  verifyOtp: async (email, otp) => {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    return res.json();
  },
  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },
  login: async (credentials) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  },
  forgotPassword: async (email) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },
  resetPassword: async (email, otp, newPassword) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, new_password: newPassword })
    });
    return res.json();
  },
  getCurrentUser: async (email) => {
    const res = await fetch(`${API_BASE}/auth/me?email=${encodeURIComponent(email || '')}`);
    return res.json();
  },
  getAllUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/auth/users?${query}`);
    return res.json();
  },

  // Wishlist (Strictly User-Scoped)
  getWishlist: async (email) => {
    const res = await fetch(`${API_BASE}/wishlist?email=${encodeURIComponent(email || '')}`);
    return res.json();
  },
  toggleWishlist: async (email, productId) => {
    const res = await fetch(`${API_BASE}/wishlist/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, product_id: productId })
    });
    return res.json();
  },
  syncWishlist: async (email, items) => {
    const res = await fetch(`${API_BASE}/wishlist/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, items })
    });
    return res.json();
  },
  clearWishlist: async (email) => {
    const res = await fetch(`${API_BASE}/wishlist/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  // Products
  getProducts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/products?${query}`);
    return res.json();
  },
  getProductCategories: async () => {
    const res = await fetch(`${API_BASE}/products/categories`);
    return res.json();
  },
  createProduct: async (productData) => {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    return res.json();
  },
  updateProduct: async (productId, productData) => {
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    return res.json();
  },
  deleteProduct: async (productId) => {
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'DELETE'
    });
    return res.json();
  },
  clearAllProducts: async () => {
    const res = await fetch(`${API_BASE}/products/clear-all`, {
      method: 'POST'
    });
    return res.json();
  },

  // Perishable Batches & Decay
  getBatches: async () => {
    const res = await fetch(`${API_BASE}/batches`);
    return res.json();
  },
  createBatch: async (batchData) => {
    const res = await fetch(`${API_BASE}/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchData)
    });
    return res.json();
  },
  evaluateBatches: async () => {
    const res = await fetch(`${API_BASE}/batches/evaluate`, { method: 'POST' });
    return res.json();
  },
  overrideBatchDiscount: async (batchId, discountPercent, note) => {
    const res = await fetch(`${API_BASE}/batches/${batchId}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discount_percent: discountPercent, note })
    });
    return res.json();
  },

  // 7-Step Bouquet Customizer
  getBouquetElements: async () => {
    const res = await fetch(`${API_BASE}/bouquet/catalog-elements`);
    return res.json();
  },
  getBouquetPresets: async () => {
    const res = await fetch(`${API_BASE}/bouquet/presets`);
    return res.json();
  },
  calculateBOM: async (config) => {
    const res = await fetch(`${API_BASE}/bouquet/calculate-bom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)

    });
    return res.json();
  },
  saveCustomBouquet: async (payload) => {
    const res = await fetch(`${API_BASE}/bouquet/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Subscriptions & Feedback Loop
  getSubscriptionTiers: async () => {
    const res = await fetch(`${API_BASE}/subscriptions/tiers`);
    return res.json();
  },
  getUserSubscriptions: async (email) => {
    const res = await fetch(`${API_BASE}/subscriptions?email=${encodeURIComponent(email || '')}`);
    return res.json();
  },
  createSubscription: async (payload) => {
    const res = await fetch(`${API_BASE}/subscriptions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  changeSubscriptionPlan: async (payload) => {
    const res = await fetch(`${API_BASE}/subscriptions/change-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  cancelSubscription: async (payload) => {
    const res = await fetch(`${API_BASE}/subscriptions/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  submitSubscriptionFeedback: async (subId, feedbackData) => {
    const res = await fetch(`${API_BASE}/subscriptions/${subId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });
    return res.json();
  },
  getCurationMetrics: async () => {
    const res = await fetch(`${API_BASE}/subscriptions/admin/curation-metrics`);
    return res.json();
  },

  // Event Staging & Quotation Engine
  getVenueTemplates: async () => {
    const res = await fetch(`${API_BASE}/quotes/venues`);
    return res.json();
  },
  checkEventDate: async (dateStr) => {
    const res = await fetch(`${API_BASE}/quotes/check-date`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_date: dateStr })
    });
    return res.json();
  },
  checkVenueRadius: async (lat, lng) => {
    const res = await fetch(`${API_BASE}/quotes/check-radius`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng })
    });
    return res.json();
  },
  recommendFloriography: async (prompt) => {
    const res = await fetch(`${API_BASE}/quotes/floriography-recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    return res.json();
  },
  validateVenueImage: async (imageData) => {
    const res = await fetch(`${API_BASE}/quotes/validate-venue-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_data: imageData })
    });
    return res.json();
  },
  generateStagingPreview: async (templateId, prompt, maskArea, customImage = null) => {
    const res = await fetch(`${API_BASE}/quotes/stage-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        template_id: templateId, 
        prompt, 
        mask_area: maskArea,
        custom_image: customImage 
      })
    });
    return res.json();
  },
  getGeminiKeyStatus: async () => {
    const res = await fetch(`${API_BASE}/quotes/gemini-key-status`);
    return res.json();
  },
  saveGeminiKey: async (apiKey) => {
    const res = await fetch(`${API_BASE}/quotes/save-gemini-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey })
    });
    return res.json();
  },
  calculateEventEstimate: async (guestTier, modules) => {
    const res = await fetch(`${API_BASE}/quotes/calculate-estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guest_tier: guestTier, modules })
    });
    return res.json();
  },
  getFloralBriefing: async (venueId, guestTier, modules, prompt) => {
    const res = await fetch(`${API_BASE}/quotes/floral-briefing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venue_id: venueId, guest_tier: guestTier, modules, prompt })
    });
    return res.json();
  },
  submitEventQuote: async (payload) => {
    const res = await fetch(`${API_BASE}/quotes/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  getQuotations: async () => {
    const res = await fetch(`${API_BASE}/quotes`);
    return res.json();
  },
  updateQuoteStatus: async (quoteId, status, approvedAmount) => {
    const res = await fetch(`${API_BASE}/quotes/${quoteId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, approved_amount: approvedAmount })
    });
    return res.json();
  },

  // Orders & Invoices
  checkout: async (payload) => {
    const res = await fetch(`${API_BASE}/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  getOrders: async (email) => {
    const res = await fetch(`${API_BASE}/orders?email=${encodeURIComponent(email || '')}`);
    return res.json();
  },
  getInvoice: async (orderId) => {
    const res = await fetch(`${API_BASE}/orders/${orderId}/invoice`);
    return res.json();
  },
  getReminders: async () => {
    const res = await fetch(`${API_BASE}/orders/reminders`);
    return res.json();
  },
  createReminder: async (payload) => {
    const res = await fetch(`${API_BASE}/orders/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Live Telemetry & Fleet Management
  getTelemetry: async (orderId) => {
    const res = await fetch(`${API_BASE}/telemetry/order/${orderId}`);
    return res.json();
  },
  stepTelemetry: async (orderId) => {
    const res = await fetch(`${API_BASE}/telemetry/order/${orderId}/step`, { method: 'POST' });
    return res.json();
  },
  triggerTransitException: async (orderId, reason) => {
    const res = await fetch(`${API_BASE}/telemetry/order/${orderId}/exception`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return res.json();
  },
  getDeliveryDrivers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/telemetry/drivers?${query}`);
    return res.json();
  },
  getDriverDetail: async (driverId) => {
    const res = await fetch(`${API_BASE}/telemetry/drivers/${driverId}`);
    return res.json();
  },
  updateDriverStatus: async (driverId, status) => {
    const res = await fetch(`${API_BASE}/telemetry/drivers/${driverId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },
  updateDriverLocation: async (driverId, locationData) => {
    const res = await fetch(`${API_BASE}/telemetry/drivers/${driverId}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locationData)
    });
    return res.json();
  },
  simulateFleetTick: async () => {
    const res = await fetch(`${API_BASE}/telemetry/drivers/simulate-tick`, {
      method: 'POST'
    });
    return res.json();
  },
  sendDriverOTP: async (phone) => {
    const res = await fetch(`${API_BASE}/telemetry/driver/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    return res.json();
  },
  verifyDriverOTP: async (phone, otp) => {
    const res = await fetch(`${API_BASE}/telemetry/driver/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    return res.json();
  },
  getDriverOrders: async (driverId) => {
    const res = await fetch(`${API_BASE}/telemetry/drivers/${driverId}/orders`);
    return res.json();
  },
  completeDriverDelivery: async (driverId, orderId, notes = '') => {
    const res = await fetch(`${API_BASE}/telemetry/drivers/${driverId}/orders/${orderId}/deliver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    return res.json();
  },
  reportCustomerUnavailable: async (driverId, orderId, reason) => {
    const res = await fetch(`${API_BASE}/telemetry/drivers/${driverId}/orders/${orderId}/customer-unavailable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return res.json();
  },
  assignOrderCourier: async (orderId, driverId) => {
    const res = await fetch(`${API_BASE}/telemetry/orders/${orderId}/assign-courier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driver_id: driverId })
    });
    return res.json();
  },

  // Analytics & Prophet
  getProphetForecast: async (horizon = 45) => {
    const res = await fetch(`${API_BASE}/analytics/prophet-forecast?horizon=${horizon}`);
    return res.json();
  },
  getSystemAlerts: async () => {
    const res = await fetch(`${API_BASE}/analytics/system-alerts`);
    return res.json();
  },
  getInventoryHealth: async () => {
    const res = await fetch(`${API_BASE}/analytics/inventory-health`);
    return res.json();
  },

  // Database Inspector & Table Editor
  getDbTables: async () => {
    const res = await fetch(`${API_BASE}/admin/db/tables`);
    return res.json();
  },
  getDbTableData: async (tableName, search = '', limit = 50, offset = 0) => {
    const res = await fetch(`${API_BASE}/admin/db/table/${tableName}?search=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}`);
    return res.json();
  },
  updateDbTableRow: async (tableName, rowId, updates) => {
    const res = await fetch(`${API_BASE}/admin/db/table/${tableName}/${rowId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },
  insertDbTableRow: async (tableName, record) => {
    const res = await fetch(`${API_BASE}/admin/db/table/${tableName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    return res.json();
  },
  deleteDbTableRow: async (tableName, rowId) => {
    const res = await fetch(`${API_BASE}/admin/db/table/${tableName}/${rowId}`, {
      method: 'DELETE'
    });
    return res.json();
  }
};
