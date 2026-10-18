/* ============================================================
   A3 Green Tomorrow - API Server
   ============================================================ */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const express = require('express');
const db = require('./event_db');

const app = express();
const PORT = process.env.PORT || 3101;

// Angular build output (dist/client/browser) is what the SPA is served from.
const CLIENT_DIR = path.join(__dirname, '../client/dist/client/browser');

// Middleware
app.use(express.json());
app.use(express.static(CLIENT_DIR));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// API Routes
// ----------

// GET /api/categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch categories' });
  }
});

// GET /api/organisations
app.get('/api/organisations', async (req, res) => {
  try {
    const organisations = await db.getOrganisations();
    res.json(organisations);
  } catch (error) {
    console.error('Error fetching organisations:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch organisations' });
  }
});

// GET /api/events
app.get('/api/events', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      category: req.query.category,
      keyword: req.query.keyword
    };
    const events = await db.getEvents(filters);
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch events' });
  }
});

// GET /api/weather?latitude=..&longitude=..
// Server-side proxy for Open-Meteo so the browser never talks to a third party
// directly and identical lookups can be cached in memory.
const weatherCache = new Map();
const WEATHER_TTL_MS = 10 * 60 * 1000;

app.get('/api/weather', async (req, res) => {
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);

  if (
    req.query.latitude === undefined || req.query.longitude === undefined ||
    !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 ||
    longitude < -180 || longitude > 180
  ) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Valid latitude and longitude are required'
    });
  }

  const key = `${latitude},${longitude}`;
  const cached = weatherCache.get(key);
  if (cached && Date.now() - cached.at < WEATHER_TTL_MS) {
    return res.json(cached.data);
  }

  try {
    const url = 'https://api.open-meteo.com/v1/forecast'
      + `?latitude=${latitude}&longitude=${longitude}`
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min'
      + '&timezone=auto&forecast_days=5';

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo responded with ${response.status}`);
    }

    const payload = await response.json();
    const data = {
      latitude: payload.latitude,
      longitude: payload.longitude,
      timezone: payload.timezone,
      daily: payload.daily
        ? {
            time: payload.daily.time || [],
            weatherCode: payload.daily.weather_code || [],
            temperatureMax: payload.daily.temperature_2m_max || [],
            temperatureMin: payload.daily.temperature_2m_min || []
          }
        : null
    };

    weatherCache.set(key, { at: Date.now(), data });
    res.json(data);

  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(502).json({ error: 'UPSTREAM_ERROR', message: 'Weather service is unavailable' });
  }
});

// GET /api/events/featured
app.get('/api/events/featured', async (req, res) => {
  try {
    const events = await db.getFeaturedEvents();
    res.json(events);
  } catch (error) {
    console.error('Error fetching featured events:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch featured events' });
  }
});

// GET /api/events/search
app.get('/api/events/search', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      category: req.query.category,
      keyword: req.query.q,
      open: req.query.open
    };
    const events = await db.getEvents(filters);
    res.json(events);
  } catch (error) {
    console.error('Error searching events:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Search failed' });
  }
});

// GET /api/events/:id
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await db.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch event' });
  }
});

// GET /api/events/:id/registrations
app.get('/api/events/:id/registrations', async (req, res) => {
  try {
    const event = await db.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Event not found' });
    }
    res.json(event.registrations || []);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch registrations' });
  }
});

// POST /api/events/:id/registrations
app.post('/api/events/:id/registrations', async (req, res) => {
  try {
    const eventId = req.params.id;
    const { name, email, phone, quantity } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Name must be at least 2 characters' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Please provide a valid email address' });
    }
    if (!phone || phone.trim().length < 8) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Please provide a valid phone number' });
    }
    if (!quantity || quantity < 1 || quantity > 99) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Quantity must be between 1 and 99' });
    }

    // Check event exists
    const event = await db.getEventById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Event not found' });
    }

    if (event.status === 'suspended') {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Registration is closed for this event' });
    }

    const result = await db.createRegistration(eventId, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      quantity: parseInt(quantity, 10)
    });

    res.status(201).json({
      id: result.id,
      eventId: parseInt(eventId, 10),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      quantity: parseInt(quantity, 10),
      registeredAt: new Date().toISOString()
    });

  } catch (error) {
    if (error.code === 'DUPLICATE_REGISTRATION') {
      return res.status(409).json({
        error: 'CONFLICT',
        message: 'This email is already registered for this event'
      });
    }
    console.error('Error creating registration:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to create registration' });
  }
});

// Admin Routes
// ------------

// Validates and normalises the coordinates supplied by the admin form, so the
// Open-Meteo lookup always receives in-range values.
function readCoordinates(data) {
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);

  if (
    data.latitude === undefined || data.latitude === null || data.latitude === '' ||
    data.longitude === undefined || data.longitude === null || data.longitude === '' ||
    !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 ||
    longitude < -180 || longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

// GET /api/admin/events
app.get('/api/admin/events', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      keyword: req.query.q
    };
    const events = await db.getEvents(filters);
    res.json(events);
  } catch (error) {
    console.error('Error fetching admin events:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch events' });
  }
});

// GET /api/admin/events/:id
app.get('/api/admin/events/:id', async (req, res) => {
  try {
    const event = await db.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch event' });
  }
});

// POST /api/admin/events
app.post('/api/admin/events', async (req, res) => {
  try {
    const data = req.body;

    // Validation
    if (!data.title || data.title.trim().length < 2) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Title must be at least 2 characters' });
    }
    if (!data.categoryId || !data.charityId || !data.date || !data.location || !data.status || !data.price) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Missing required fields' });
    }

    const coordinates = readCoordinates(data);
    if (!coordinates) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Latitude (-90..90) and longitude (-180..180) are required' });
    }

    const result = await db.createEvent({ ...data, ...coordinates });
    res.status(201).json({ id: result.id, ...data });

  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to create event' });
  }
});

// PUT /api/admin/events/:id
app.put('/api/admin/events/:id', async (req, res) => {
  try {
    const data = req.body;

    // Validation
    if (!data.title || data.title.trim().length < 2) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Title must be at least 2 characters' });
    }

    const coordinates = readCoordinates(data);
    if (!coordinates) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Latitude (-90..90) and longitude (-180..180) are required' });
    }

    await db.updateEvent(req.params.id, { ...data, ...coordinates });
    res.json({ id: req.params.id, ...data });

  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update event' });
  }
});

// DELETE /api/admin/events/:id
app.delete('/api/admin/events/:id', async (req, res) => {
  try {
    await db.deleteEvent(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    if (error.code === 'REGISTRATIONS_EXIST') {
      return res.status(409).json({
        error: 'CONFLICT',
        message: 'Cannot delete event with existing registrations',
        registrationCount: error.count
      });
    }
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to delete event' });
  }
});

// Unknown API routes -> JSON 404 (must be registered before the SPA fallback)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'API route not found' });
});

// Missing image/static assets must 404 instead of falling through to the SPA
// shell, otherwise the browser receives index.html (HTTP 200, text/html) and
// renders a silent broken image.
app.use('/assets', (req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Asset not found' });
});

// Fallback - serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Green Tomorrow A3 server running at http://localhost:${PORT}`);
});
