/* ============================================================
   A3 Green Tomorrow - Database Helper
   ============================================================ */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'charityevents_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

try {
  pool = mysql.createPool(DB_CONFIG);
} catch (error) {
  console.error('Database connection failed:', error.message);
  pool = null;
}

async function query(sql, params = []) {
  if (!pool) {
    throw new Error('Database not available');
  }
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getCategories() {
  return query('SELECT id, name, description FROM categories ORDER BY id');
}

async function getOrganisations() {
  return query('SELECT id, name, slug, focus, email, city FROM charities ORDER BY id');
}

async function getEvents(filters = {}) {
  let sql = `
    SELECT e.id, e.title, c.name AS category, DATE_FORMAT(e.event_date, '%Y-%m-%d') AS date,
           e.location, e.status, e.image, e.description, e.purpose,
           e.price, e.service_type AS serviceType,
           e.latitude, e.longitude,
           (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registrationCount
    FROM events e
    JOIN categories c ON e.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status) {
    sql += ' AND e.status = ?';
    params.push(filters.status);
  }
  if (filters.category) {
    sql += ' AND c.name = ?';
    params.push(filters.category);
  }
  if (filters.keyword) {
    sql += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)';
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`, `%${filters.keyword}%`);
  }
  if (filters.open === '1' || filters.open === 'true' || filters.open === true || filters.open === 1) {
    sql += ` AND e.status != 'suspended'`;
  }

  sql += ' ORDER BY e.event_date ASC';
  return query(sql, params);
}

async function getFeaturedEvents() {
  return query(`
    SELECT e.id, e.title, c.name AS category, DATE_FORMAT(e.event_date, '%Y-%m-%d') AS date,
           e.location, e.status, e.image, e.description, e.purpose, e.price,
           e.latitude, e.longitude
    FROM events e
    JOIN categories c ON e.category_id = c.id
    WHERE e.status != 'suspended'
    ORDER BY e.event_date ASC
  `);
}

async function getEventById(id) {
  const [event] = await query(`
    SELECT e.id, e.title, c.name AS category, DATE_FORMAT(e.event_date, '%Y-%m-%d') AS date,
           e.location, e.status, e.image, e.description, e.purpose,
           e.price, e.service_type AS serviceType, e.category_id AS categoryId,
           e.latitude, e.longitude,
           o.id AS organisationId, o.name AS organisationName, o.focus, o.email, o.city
    FROM events e
    JOIN categories c ON e.category_id = c.id
    JOIN charities o ON e.charity_id = o.id
    WHERE e.id = ?
  `, [id]);

  if (!event) return null;

  // Get registrations
  const registrations = await query(`
    SELECT id, name, email, phone, quantity, registered_at AS registeredAt
    FROM registrations
    WHERE event_id = ?
    ORDER BY registered_at DESC
  `, [id]);

  return {
    ...event,
    organisation: {
      id: event.organisationId,
      name: event.organisationName,
      focus: event.focus,
      email: event.email,
      city: event.city
    },
    registrations: registrations.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      quantity: r.quantity,
      registeredAt: r.registeredAt
    })),
    registrationCount: registrations.length
  };
}

async function createEvent(data) {
  const result = await query(`
    INSERT INTO events (title, category_id, charity_id, event_date, location,
                        status, image, description, purpose, price, service_type,
                        latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    data.title, data.categoryId, data.charityId, data.date, data.location,
    data.status, data.image, data.description, data.purpose, data.price,
    data.serviceType || null, data.latitude, data.longitude
  ]);
  return { id: result.insertId };
}

async function updateEvent(id, data) {
  await query(`
    UPDATE events
    SET title = ?, category_id = ?, event_date = ?, location = ?,
        status = ?, image = ?, description = ?, purpose = ?, price = ?,
        service_type = ?, latitude = ?, longitude = ?
    WHERE id = ?
  `, [
    data.title, data.categoryId, data.date, data.location,
    data.status, data.image, data.description, data.purpose, data.price,
    data.serviceType || null, data.latitude, data.longitude, id
  ]);
  return true;
}

async function deleteEvent(id) {
  // Check if has registrations
  const [regCount] = await query(
    'SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?',
    [id]
  );

  if (regCount.count > 0) {
    const error = new Error('Event has existing registrations');
    error.code = 'REGISTRATIONS_EXIST';
    error.count = regCount.count;
    throw error;
  }

  await query('DELETE FROM events WHERE id = ?', [id]);
  return true;
}

async function createRegistration(eventId, data) {
  // Check if email already registered for this event
  const [existing] = await query(
    'SELECT id FROM registrations WHERE event_id = ? AND email = ?',
    [eventId, data.email]
  );

  if (existing) {
    const error = new Error('Email already registered for this event');
    error.code = 'DUPLICATE_REGISTRATION';
    throw error;
  }

  const result = await query(`
    INSERT INTO registrations (event_id, name, email, phone, quantity)
    VALUES (?, ?, ?, ?, ?)
  `, [eventId, data.name, data.email, data.phone, data.quantity]);

  return { id: result.insertId };
}

module.exports = {
  query,
  getCategories,
  getOrganisations,
  getEvents,
  getFeaturedEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  createRegistration
};
