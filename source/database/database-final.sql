-- ============================================================
-- PROG2002 A3 - Theme A / Green Tomorrow (Forest + Ocean)
-- Combined database file: schema + seed (single-file import)
-- Database: charityevents_db
--   mysql -u root -p < source/database/database-final.sql
-- ============================================================

-- ============================================================
-- PROG2002 Web Development II - Charity Events website
-- A3 project: A / Green Tomorrow (Forest + Ocean)
-- Database: charityevents_db
--
-- Run schema.sql first, then seed.sql.
--   mysql -u root -p < source/database/schema.sql
--   mysql -u root -p < source/database/seed.sql
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS charityevents_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE charityevents_db;

-- Drop in child-to-parent order
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS charities;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- charities: the charity organisations that run the events
-- ------------------------------------------------------------
CREATE TABLE charities (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name        VARCHAR(150)  NOT NULL,
  slug        VARCHAR(150)  NOT NULL,
  focus       VARCHAR(150)  NOT NULL,
  email       VARCHAR(190)  NOT NULL,
  city        VARCHAR(120)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_charities_slug (slug)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- categories: the type of activity an event belongs to
-- ------------------------------------------------------------
CREATE TABLE categories (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name        VARCHAR(80)   NOT NULL,
  description VARCHAR(255)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- events: one row per charity event
-- ------------------------------------------------------------
CREATE TABLE events (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  title        VARCHAR(180)  NOT NULL,
  category_id  INT UNSIGNED  NOT NULL,
  charity_id   INT UNSIGNED  NOT NULL,
  event_date   DATE          NOT NULL,
  location     VARCHAR(180)  NOT NULL,
  status       ENUM('upcoming', 'ongoing', 'suspended') NOT NULL DEFAULT 'upcoming',
  image        VARCHAR(120)  NOT NULL,
  description  TEXT          NOT NULL,
  purpose      TEXT          NOT NULL,
  price        VARCHAR(80)   NOT NULL,
  service_type VARCHAR(80)   NULL,
  -- Coordinates used by the Open-Meteo weather lookup (optional feature).
  latitude     DECIMAL(9,6)  NULL,
  longitude    DECIMAL(9,6)  NULL,
  PRIMARY KEY (id),
  KEY idx_events_category (category_id),
  KEY idx_events_charity (charity_id),
  KEY idx_events_date (event_date),
  KEY idx_events_status (status),
  CONSTRAINT fk_events_category
    FOREIGN KEY (category_id) REFERENCES categories (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_events_charity
    FOREIGN KEY (charity_id) REFERENCES charities (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- registrations: user registrations for events (A3 new)
-- ------------------------------------------------------------
CREATE TABLE registrations (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  event_id      INT UNSIGNED  NOT NULL,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(100)  NOT NULL,
  phone         VARCHAR(20)   NOT NULL,
  quantity      INT           NOT NULL CHECK (quantity > 0),
  registered_at DATETIME      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_registrations_event (event_id),
  KEY idx_registrations_email (email),
  UNIQUE KEY uq_registrations_event_email (event_id, email),
  CONSTRAINT fk_registrations_event
    FOREIGN KEY (event_id) REFERENCES events (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;


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
