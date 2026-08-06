CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  meta_title TEXT NOT NULL DEFAULT '', meta_description TEXT NOT NULL DEFAULT '', canonical_url TEXT NOT NULL DEFAULT '',
  og_title TEXT NOT NULL DEFAULT '', og_description TEXT NOT NULL DEFAULT '', og_image TEXT NOT NULL DEFAULT '',
  hero_label TEXT NOT NULL DEFAULT '', hero_heading TEXT NOT NULL DEFAULT '', hero_description TEXT NOT NULL DEFAULT '',
  hero_background_image TEXT NOT NULL DEFAULT '', hero_primary_label TEXT NOT NULL DEFAULT '', hero_primary_link TEXT NOT NULL DEFAULT '',
  hero_secondary_label TEXT NOT NULL DEFAULT '', hero_secondary_link TEXT NOT NULL DEFAULT '',
  indexable INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT, area TEXT NOT NULL CHECK(area IN ('header','footer')), label TEXT NOT NULL, href TEXT NOT NULL,
  parent_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL, sort_order INTEGER NOT NULL DEFAULT 0,
  new_tab INTEGER NOT NULL DEFAULT 0, visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS page_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT, page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL, name TEXT NOT NULL, content TEXT NOT NULL DEFAULT '{}', sort_order INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, excerpt TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '', icon TEXT NOT NULL DEFAULT '', image_url TEXT NOT NULL DEFAULT '', image_alt TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT '', cta_link TEXT NOT NULL DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published')),
  published INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, question TEXT NOT NULL, answer TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'General',
  page_id INTEGER REFERENCES pages(id) ON DELETE SET NULL, sort_order INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL, customer_role TEXT NOT NULL DEFAULT '', review_text TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK(rating BETWEEN 1 AND 5), image_url TEXT NOT NULL DEFAULT '', image_alt TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0, featured INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS ctas (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, heading TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  background_image TEXT NOT NULL DEFAULT '', button_label TEXT NOT NULL DEFAULT '', button_link TEXT NOT NULL DEFAULT '',
  phone_number TEXT NOT NULL DEFAULT '', whatsapp_link TEXT NOT NULL DEFAULT '', page_id INTEGER REFERENCES pages(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0, visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, job_title TEXT NOT NULL, biography TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '', image_alt TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
  linkedin_url TEXT NOT NULL DEFAULT '', x_url TEXT NOT NULL DEFAULT '', github_url TEXT NOT NULL DEFAULT '',
  page_id INTEGER REFERENCES pages(id) ON DELETE SET NULL, sort_order INTEGER NOT NULL DEFAULT 0, featured INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY CHECK(id = 1), business_name TEXT NOT NULL DEFAULT '', logo_url TEXT NOT NULL DEFAULT '', favicon_url TEXT NOT NULL DEFAULT '',
  header_phone TEXT NOT NULL DEFAULT '', whatsapp_number TEXT NOT NULL DEFAULT '', whatsapp_link TEXT NOT NULL DEFAULT '',
  primary_email TEXT NOT NULL DEFAULT '', physical_address TEXT NOT NULL DEFAULT '', business_hours TEXT NOT NULL DEFAULT '',
  footer_text TEXT NOT NULL DEFAULT '', copyright_text TEXT NOT NULL DEFAULT '', facebook_url TEXT NOT NULL DEFAULT '', instagram_url TEXT NOT NULL DEFAULT '',
  linkedin_url TEXT NOT NULL DEFAULT '', x_url TEXT NOT NULL DEFAULT '', youtube_url TEXT NOT NULL DEFAULT '', tiktok_url TEXT NOT NULL DEFAULT '', github_url TEXT NOT NULL DEFAULT '',
  google_maps_url TEXT NOT NULL DEFAULT '', map_embed_url TEXT NOT NULL DEFAULT '', map_latitude TEXT NOT NULL DEFAULT '', map_longitude TEXT NOT NULL DEFAULT '',
  map_enabled INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS contact_form_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, recipient_email TEXT NOT NULL,
  reply_to_mode TEXT NOT NULL DEFAULT 'submitter' CHECK(reply_to_mode IN ('submitter','site')),
  email_subject TEXT NOT NULL DEFAULT 'New website enquiry', success_message TEXT NOT NULL DEFAULT 'Thank you. We will be in touch shortly.',
  error_message TEXT NOT NULL DEFAULT 'Something went wrong. Please try again.', page_id INTEGER REFERENCES pages(id) ON DELETE SET NULL,
  enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, submitted_at TEXT NOT NULL DEFAULT (datetime('now')), name TEXT NOT NULL,
  email TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', message TEXT NOT NULL, source_page TEXT NOT NULL DEFAULT '', is_read INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL, url TEXT NOT NULL UNIQUE, mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL, alt_text TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK(role IN ('administrator','editor')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, category TEXT NOT NULL DEFAULT 'IT Support', title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '', content TEXT NOT NULL DEFAULT '', date TEXT NOT NULL DEFAULT '', read_time TEXT NOT NULL DEFAULT '5 min read',
  published INTEGER NOT NULL DEFAULT 1, image_url TEXT, meta_title TEXT, meta_description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '', industry TEXT NOT NULL DEFAULT '', year TEXT NOT NULL DEFAULT '', image_url TEXT,
  bullet_points TEXT NOT NULL DEFAULT '[]', metrics TEXT NOT NULL DEFAULT '[]', tags TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 1, featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_menu_area_order ON menu_items(area, sort_order);
CREATE INDEX IF NOT EXISTS idx_sections_page_order ON page_sections(page_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_faq_page_order ON faqs(page_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_team_page_order ON team_members(page_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_submissions_date ON contact_submissions(submitted_at DESC);
INSERT OR IGNORE INTO site_settings (id, business_name, logo_url, favicon_url, header_phone, whatsapp_number, whatsapp_link, primary_email, physical_address, business_hours, footer_text, copyright_text, facebook_url, instagram_url, linkedin_url, tiktok_url)
VALUES (1, 'Byteflow Information Technology', '/images/logo.png', '/favicon.ico', '+971 54 328 2042', '+971543282042', 'https://wa.me/971543282042', 'info@byteflow.ae', 'Dubai, United Arab Emirates', 'Monday–Saturday, 9:00 AM–6:00 PM', 'Leading IT solutions provider trusted by 500+ businesses across Dubai and UAE since 2017.', 'Byteflow Information Technology. All rights reserved.', 'https://m.facebook.com/byteflow.ae/', 'https://www.instagram.com/byteflow.ae/', 'https://ae.linkedin.com/company/byteflow-techcascade', 'https://www.tiktok.com/@byteflow.ae');
