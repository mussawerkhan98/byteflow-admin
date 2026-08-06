import { createClient } from '@libsql/client'
if (!process.env.TURSO_DATABASE_URL) throw new Error('TURSO_DATABASE_URL is required')
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })

const pages = [
  ['Home','home','Byteflow Information Technology','Leading IT solutions provider trusted by 500+ businesses across Dubai and UAE since 2017.'],
  ['About Us','about-us','About Byteflow Information Technology','Meet the Dubai-based team providing complete IT, cloud, security and digital services.'],
  ['Projects','projects','Byteflow Projects','Explore selected technology projects delivered by Byteflow.'],
  ['Blog','blog','Byteflow IT Insights','Practical IT, cloud, cybersecurity and digital growth insights.'],
  ['Contact Us','contact-us','Contact Byteflow','Speak with Byteflow about IT support and digital services in the UAE.'],
  ['Careers','careers','Careers at Byteflow','Explore career opportunities with Byteflow in Dubai.'],
  ['IT AMC Services','it-amc-services-dubai','IT AMC Services Dubai','Reliable managed IT support for businesses in Dubai and the UAE.'],
  ['Cyber Security','cyber-security','Cyber Security Dubai','Layered cybersecurity services for UAE businesses.'],
  ['System Integration','system-integration','System Integration Dubai','Connected infrastructure, devices and cloud systems.'],
  ['Data Backup & Recovery','data-backup-recovery','Data Backup and Recovery Dubai','Protect business data with automated backup and rapid recovery.'],
  ['Website Development','website-development','Website Development Dubai','Websites, applications and bots designed for growth.'],
  ['Cloud Services','cloud-services-dubai','Cloud Services Dubai','Microsoft 365, Azure and managed cloud infrastructure.'],
  ['Graphics Designing','graphics-designing','Graphic Design Dubai','Brand, UI/UX and graphic design services.'],
  ['Digital Marketing','digital-marketing','Digital Marketing Dubai','SEO, paid media and digital campaigns for UAE businesses.'],
  ['Landing Page Designing','landing-page-designing','Landing Page Design Dubai','Conversion-focused landing page design and development.'],
]
for (const [name,slug,title,description] of pages) await db.execute({ sql: `INSERT INTO pages (name,slug,meta_title,meta_description,status) VALUES (?,?,?,?, 'published') ON CONFLICT(slug) DO UPDATE SET name=excluded.name`, args: [name,slug,title,description] })

const menus = [['header','Home','/',0],['header','About Us','/about-us',10],['header','Projects','/projects',30],['header','Blog','/blog',40],['header','Contact Us','/contact-us',50],['footer','Home','/',0],['footer','About Us','/about-us',10],['footer','Projects','/projects',20],['footer','Blog','/blog',30],['footer','Contact Us','/contact-us',40]]
for (const [area,label,href,order] of menus) await db.execute({ sql: 'INSERT INTO menu_items (area,label,href,sort_order,visible) SELECT ?,?,?,?,1 WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE area=? AND href=?)', args: [area,label,href,order,area,href] })

const services = [
  ['System Integration','system-integration','Connect every part of your business with secure, reliable infrastructure.'],
  ['Cyber Security','cyber-security','Layered protection for your people, devices, network, email and data.'],
  ['IT AMC / IT Support','it-amc-services-dubai','Predictable, responsive IT support for businesses across the UAE.'],
  ['Data Backup & Recovery','data-backup-recovery','Automated backups and tested recovery that keep your business moving.'],
  ['Website / Apps / Bots','website-development','High-performance websites, applications and automations built around your goals.'],
  ['Cloud Services','cloud-services-dubai','Microsoft 365, Azure, cloud backup and hybrid infrastructure managed end to end.'],
  ['UI/UX & Graphics Design','graphics-designing','Clear digital experiences and brand visuals designed for real customers.'],
  ['Digital Marketing','digital-marketing','SEO, paid campaigns and social content focused on measurable growth.'],
]
for (let i=0;i<services.length;i++) { const [title,slug,excerpt]=services[i]; await db.execute({ sql: `INSERT INTO services (title,slug,excerpt,description,sort_order,published,status) VALUES (?,?,?,?,?,1,'published') ON CONFLICT(slug) DO UPDATE SET title=excluded.title`, args: [title,slug,excerpt,excerpt,i*10] }) }

await db.execute(`INSERT INTO menu_items (area,label,href,sort_order,visible) SELECT 'header','Services','#',20,1 WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE area='header' AND lower(label)='services' AND parent_id IS NULL)`)
const servicesMenu=await db.execute(`SELECT id FROM menu_items WHERE area='header' AND lower(label)='services' AND parent_id IS NULL LIMIT 1`)
if(servicesMenu.rows[0]){for(let i=0;i<services.length;i++){const [title,slug]=services[i];const href=`/${slug}`;await db.execute({sql:`INSERT INTO menu_items (area,label,href,parent_id,sort_order,visible) SELECT 'header',?,?,?, ?,1 WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE area='header' AND href=?)`,args:[title,href,Number(servicesMenu.rows[0].id),i*10,href]})}}

const faqs = [
  ['IT Support','What is an IT AMC and why does my business need one?','An Annual Maintenance Contract means we manage your computers, servers, network, printers and software for a fixed monthly fee, giving you predictable costs and faster support.'],
  ['IT Support','How quickly do your engineers respond to IT issues?','We provide on-site or remote support across Dubai, Sharjah and Abu Dhabi, with critical outages handled immediately.'],
  ['Cloud & Microsoft','Can you migrate our team to Microsoft 365?','Yes. We handle email, files, Teams, SharePoint and licensing migration, staff training and ongoing management.'],
  ['Security','How do you protect businesses from ransomware and cyber attacks?','We combine firewalls, endpoint protection, email filtering, monitoring and automated cloud backups with tested recovery.'],
  ['Services','Can you build a website and handle our digital marketing too?','Yes. Website development, SEO, paid advertising, social media and graphic design are delivered by one coordinated team.'],
]
for (let i=0;i<faqs.length;i++) { const [category,question,answer]=faqs[i]; await db.execute({ sql: 'INSERT INTO faqs (category,question,answer,sort_order,active) SELECT ?,?,?,?,1 WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE question=?)', args: [category,question,answer,i*10,question] }) }

const testimonials = [
  ['Ahmed Al Mansouri','CEO, Al Mansouri Trading','Byteflow completely transformed our IT setup. They connected our offices across Dubai and handled everything from servers to Microsoft 365. Response time is incredible — issues get fixed before we even notice them.'],
  ['Sarah Thompson','Operations Manager, Gulf Logistics','We had a ransomware scare and Byteflow restored everything within hours. Their backup system saved us completely. Highly professional team — they know exactly what they are doing.'],
  ['Mohammed Al Rashidi','Director, Rashidi Group','Best IT AMC service in Dubai. Fixed monthly cost, no hidden charges, and their engineers are always available. We have been with Byteflow for 3 years and never had a major downtime.'],
  ['Priya Nair','Marketing Head, TechBridge UAE','The digital marketing team at Byteflow doubled our website traffic in 4 months. Their SEO and Google Ads work is exceptional. They also built our new website which looks amazing.'],
  ['Khalid Al Zaabi','Owner, Al Zaabi Consultancy','Switched to Byteflow after a bad experience with another IT company. The difference is night and day. They set up our entire cloud infrastructure and the support is always fast and friendly.'],
  ['Jennifer Cruz','Finance Director, Emirates Solutions','Byteflow handles all our cybersecurity, backups and IT support. Peace of mind is priceless. Their team explains everything clearly and the pricing is very fair for what you get.'],
]
for(let i=0;i<testimonials.length;i++){const [name,role,text]=testimonials[i];await db.execute({sql:`INSERT INTO testimonials (customer_name,customer_role,review_text,rating,source,sort_order,featured,status) SELECT ?,?,?,5,'Google',?,1,'published' WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE customer_name=?)`,args:[name,role,text,i*10,name]})}

await db.execute(`UPDATE pages SET hero_heading = CASE WHEN hero_heading='' THEN meta_title ELSE hero_heading END, hero_description = CASE WHEN hero_description='' THEN meta_description ELSE hero_description END, hero_primary_label = CASE WHEN hero_primary_label='' THEN 'Get a Free Quote' ELSE hero_primary_label END, hero_primary_link = CASE WHEN hero_primary_link='' THEN '/contact-us' ELSE hero_primary_link END`)

const home = await db.execute("SELECT id FROM pages WHERE slug='home' LIMIT 1")
if (home.rows[0]) await db.execute({ sql: `INSERT INTO page_sections (page_id,section_type,name,content,sort_order,visible,status) SELECT ?,'hero','Homepage hero',?,0,1,'published' WHERE NOT EXISTS (SELECT 1 FROM page_sections WHERE page_id=? AND section_type='hero')`, args: [Number(home.rows[0].id), JSON.stringify({ badge:'Trusted IT Partner Since 2017', heading:'We Handle Your IT, You Focus On Your Business.', highlightedText:'IT,|Business.', description:'From network infrastructure to cloud services and digital marketing, Byteflow delivers complete IT solutions for businesses across Dubai and the UAE. One call, one team, all your IT handled.', primaryButtonLabel:'Get Started Today', primaryButtonLink:'/contact-us', secondaryButtonLabel:'Call +971 54 328 2042', secondaryButtonLink:'tel:+971543282042', backgroundImage:'/images/hero/hero.png' }), Number(home.rows[0].id)] })
await db.execute(`INSERT INTO contact_form_settings (name,recipient_email,reply_to_mode,email_subject,success_message,error_message,enabled) SELECT 'Website contact form','info@byteflow.ae','submitter','New Byteflow website enquiry','Thank you. Our team will get back to you within two business hours.','Unable to send your message. Please call or WhatsApp us.',1 WHERE NOT EXISTS (SELECT 1 FROM contact_form_settings)`)
console.log('Seeded the CMS with the current Byteflow content baseline.')
