-- ============================================================
-- PROG2002 Web Development II - Charity Events website
-- A3 project: A / Green Tomorrow (Forest + Ocean)
-- Sample data for charityevents_db
--
-- Run schema.sql first, then this file.
--   mysql -u root -p < source/database/seed.sql
--
-- Contents: 4 categories, 3 charities, 8 events, 10 registrations
-- ============================================================

USE charityevents_db;

SET NAMES utf8mb4;

-- Cleared child-first so the foreign keys stay valid on a re-import.
DELETE FROM registrations;
DELETE FROM events;
DELETE FROM categories;
DELETE FROM charities;

-- ------------------------------------------------------------
-- categories
-- ------------------------------------------------------------
INSERT INTO categories (id, name, description) VALUES
  (1, 'Forest', 'Woodland restoration and tree planting across shared green spaces.'),
  (2, 'Ocean', 'Shoreline, river and coastal clean-up for healthier water.'),
  (3, 'Wildlife', 'Habitat surveys that keep local species visible and protected.'),
  (4, 'Community', 'Neighbourhood action that makes conservation part of daily life.');

-- ------------------------------------------------------------
-- charities
-- ------------------------------------------------------------
INSERT INTO charities (id, name, slug, focus, email, city) VALUES
  (1, 'Green Tomorrow Trust', 'green-tomorrow-trust', 'Forest restoration', 'hello@greentomorrow.org', 'Green Valley'),
  (2, 'Blue Shore Alliance', 'blue-shore-alliance', 'Ocean clean-up', 'team@blueshore.org', 'East Coast'),
  (3, 'Green Tomorrow Volunteers', 'green-tomorrow-volunteers', 'Community action', 'volunteers@greentomorrow.org', 'North River');

-- ------------------------------------------------------------
-- events
-- ------------------------------------------------------------
INSERT INTO events
  (id, title, category_id, charity_id, event_date, location, status, image, description, purpose, price, service_type, latitude, longitude)
VALUES
  (1, 'Community Tree Planting', 1, 1, '2026-10-12', 'Green Valley Park', 'upcoming', 'E-01.jpg',
   'Plant native trees with local volunteers and restore a shared woodland.',
   'Restore native woodland so local wildlife and families have a greener place to share.',
   'Free entry', NULL, -33.868800, 151.209300),
  (2, 'Tidepool Habitat Watch', 2, 2, '2026-10-12', 'Harbor Shoreline', 'upcoming', 'O-01.jpg',
   'Record tidepool species and help coastal teams track changing shoreline habitats.',
   'Protect tidepool life so shoreline species keep a safe place to recover.',
   'Free entry', NULL, -33.891500, 151.276700),
  (3, 'River Cleanup Day', 1, 1, '2026-10-19', 'North River', 'upcoming', 'E-02.jpg',
   'Remove litter and protect the river habitat with a guided community team.',
   'Keep the river habitat clean so woodland species can feed and nest safely.',
   'Free · donations welcome', NULL, -33.814000, 151.001000),
  (4, 'Coastal Conservation Walk', 2, 2, '2026-11-09', 'East Coast', 'upcoming', 'O-04.jpg',
   'Record shoreline conditions and share practical conservation actions.',
   'Document shoreline change so coastal habitats are protected before damage spreads.',
   'Suggested donation 50', NULL, -33.946000, 151.262000),
  (5, 'Forest Canopy Survey', 1, 1, '2026-11-02', 'Pine Ridge', 'upcoming', 'E-05.jpg',
   'Support a simple biodiversity survey and learn about local canopy health.',
   'Track canopy health so restoration work targets the trees that need it most.',
   'Free entry', NULL, -33.750000, 151.050000),
  (6, 'Ocean Plastic Survey', 2, 2, '2026-12-05', 'Harbor Shoreline', 'upcoming', 'O-06.jpg',
   'Measure plastic litter along the shore and feed the results to clean-up teams.',
   'Map plastic pollution so clean-up crews can stop it at the source.',
   'Suggested donation 50', NULL, -33.891500, 151.276700),
  (7, 'Wildlife Watch at Dawn', 3, 1, '2026-11-21', 'Green Valley Park', 'ongoing', 'E-03.jpg',
   'Join an early survey of birds and small mammals across the woodland edge.',
   'Count local species so woodland management keeps every habitat in balance.',
   'Free entry', NULL, -33.868800, 151.209300),
  (8, 'Rockpool Wildlife Survey', 3, 2, '2026-12-12', 'East Coast', 'suspended', 'O-08.jpg',
   'Survey rockpool species and share findings with shoreline protection teams.',
   'Record rockpool wildlife so shoreline protection keeps fragile species safe.',
   'Free entry', NULL, -33.946000, 151.262000);

-- ------------------------------------------------------------
-- registrations (at least 10 records)
-- ------------------------------------------------------------
INSERT INTO registrations (event_id, name, email, phone, quantity, registered_at) VALUES
  (1, 'Zhang Wei', 'zhang.wei@example.com', '13800138001', 2, '2026-09-15 10:30:00'),
  (1, 'Li Na', 'li.na@example.com', '13800138002', 1, '2026-09-14 14:22:00'),
  (1, 'Wang Fang', 'wang.fang@example.com', '13800138003', 3, '2026-09-13 09:15:00'),
  (2, 'Liu Yang', 'liu.yang@example.com', '13800138004', 1, '2026-09-12 16:45:00'),
  (2, 'Chen Jing', 'chen.jing@example.com', '13800138005', 2, '2026-09-11 11:20:00'),
  (3, 'Zhao Lei', 'zhao.lei@example.com', '13800138006', 1, '2026-09-10 13:55:00'),
  (4, 'Sun Mei', 'sun.mei@example.com', '13800138007', 2, '2026-09-09 08:30:00'),
  (5, 'Zhou Tao', 'zhou.tao@example.com', '13800138008', 1, '2026-09-08 15:10:00'),
  (6, 'Wu Qiang', 'wu.qiang@example.com', '13800138009', 4, '2026-09-07 12:40:00'),
  (7, 'Zheng Xue', 'zheng.xue@example.com', '13800138010', 2, '2026-09-06 17:25:00');
