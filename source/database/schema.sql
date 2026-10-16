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
