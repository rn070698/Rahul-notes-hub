const { getDB } = require('./database');
const bcrypt = require('bcryptjs');

function seed() {
  const db = getDB();

  console.log('🌱 Seeding database...');

  // Admin user
  const adminPass = bcrypt.hashSync('Admin@123456', 10);
  db.prepare(`INSERT OR IGNORE INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, 'admin', 1)`)
    .run('Rahul Admin', 'admin@rahulnoteshub.in', adminPass);

  // Demo user
  const userPass = bcrypt.hashSync('User@123456', 10);
  db.prepare(`INSERT OR IGNORE INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, 'user', 1)`)
    .run('Priya Sharma', 'priya@example.com', userPass);

  // Subjects
  const subjects = [
    { name: 'Polity & Governance', slug: 'polity', emoji: '📜', description: 'Indian Constitution, governance, political science', sort_order: 1 },
    { name: 'History', slug: 'history', emoji: '🏺', description: 'Ancient, medieval, modern history', sort_order: 2 },
    { name: 'Geography', slug: 'geography', emoji: '🌍', description: 'Physical and human geography', sort_order: 3 },
    { name: 'Economics', slug: 'economics', emoji: '📈', description: 'Indian and world economy', sort_order: 4 },
    { name: 'Science & Technology', slug: 'science-tech', emoji: '🔬', description: 'Science, space, defence, emerging tech', sort_order: 5 },
    { name: 'Ethics & GS4', slug: 'ethics', emoji: '⚖️', description: 'Ethics, integrity, aptitude, case studies', sort_order: 6 },
    { name: 'Environment', slug: 'environment', emoji: '🌿', description: 'Ecology, biodiversity, climate change', sort_order: 7 },
    { name: 'Current Affairs', slug: 'current-affairs', emoji: '📰', description: 'Monthly current affairs compilation', sort_order: 8 },
    { name: 'CSAT', slug: 'csat', emoji: '🔢', description: 'Civil Services Aptitude Test preparation', sort_order: 9 },
    { name: 'Essay', slug: 'essay', emoji: '✍️', description: 'Essay writing skills and model essays', sort_order: 10 },
  ];

  const insertSubject = db.prepare(`INSERT OR IGNORE INTO subjects (name, slug, emoji, description, sort_order) VALUES (?, ?, ?, ?, ?)`);
  subjects.forEach(s => insertSubject.run(s.name, s.slug, s.emoji, s.description, s.sort_order));

  // Notes
  const notes = [
    { title: 'Indian Constitution – Complete Notes', slug: 'indian-constitution-complete', description: 'All 25 Parts, 12 Schedules, major amendments, and landmark judgments. Perfect for Prelims & Mains.', subject_slug: 'polity', price: 149, is_free: 0, pages: 320, language: 'English', exam_type: 'UPSC', emoji: '📜', downloads: 12400, rating: 4.9, rating_count: 842, tags: 'constitution,polity,articles' },
    { title: 'Modern History – Spectrum Shortcut Notes', slug: 'modern-history-spectrum', description: 'Complete modern history from 1757 to 1947. Freedom movement, revolts, acts, and personalities.', subject_slug: 'history', price: 0, is_free: 1, pages: 210, language: 'English', exam_type: 'UPSC', emoji: '🏺', downloads: 9100, rating: 4.8, rating_count: 620, tags: 'history,freedom,1857' },
    { title: 'Physical Geography – Complete Guide', slug: 'physical-geography-complete', description: 'Climatology, geomorphology, oceanography with detailed diagrams and maps for UPSC Prelims & Mains.', subject_slug: 'geography', price: 129, is_free: 0, pages: 280, language: 'English', exam_type: 'UPSC', emoji: '🌍', downloads: 7600, rating: 4.7, rating_count: 510, tags: 'geography,climate,maps' },
    { title: 'Indian Economy – Budget 2025 Edition', slug: 'indian-economy-budget-2025', description: 'Economic Survey, Union Budget 2025 highlights, monetary policy, and all flagship government schemes.', subject_slug: 'economics', price: 0, is_free: 1, pages: 190, language: 'English', exam_type: 'UPSC', emoji: '📈', downloads: 8300, rating: 4.8, rating_count: 590, tags: 'economy,budget,schemes' },
    { title: 'Science & Technology – Mains Focus', slug: 'science-tech-mains', description: 'Space technology, biotechnology, defence, AI, cybersecurity – from UPSC Mains perspective with model answers.', subject_slug: 'science-tech', price: 99, is_free: 0, pages: 165, language: 'English', exam_type: 'UPSC', emoji: '🔬', downloads: 5200, rating: 4.6, rating_count: 380, tags: 'science,ISRO,tech,AI' },
    { title: 'Ethics, Integrity & Aptitude – GS4 Complete', slug: 'ethics-gs4-complete', description: '50 case studies with model answers, all ethical theories, thinkers and quotes, public administration ethics.', subject_slug: 'ethics', price: 179, is_free: 0, pages: 240, language: 'English', exam_type: 'UPSC', emoji: '⚖️', downloads: 10100, rating: 4.9, rating_count: 720, tags: 'ethics,GS4,case-studies' },
    { title: 'Current Affairs – Jan–Mar 2025', slug: 'current-affairs-jan-mar-2025', description: '3-month comprehensive compilation. All national, international, economy, science events with 200+ MCQs.', subject_slug: 'current-affairs', price: 0, is_free: 1, pages: 130, language: 'English', exam_type: 'UPSC', emoji: '📰', downloads: 15600, rating: 4.7, rating_count: 930, tags: 'current-affairs,MCQ,2025' },
    { title: 'Environment & Ecology – Complete', slug: 'environment-ecology-complete', description: 'Biodiversity, ecosystems, climate conventions, environmental laws, National Parks – Shankar IAS style.', subject_slug: 'environment', price: 119, is_free: 0, pages: 195, language: 'English', exam_type: 'UPSC', emoji: '🌿', downloads: 8800, rating: 4.8, rating_count: 640, tags: 'environment,ecology,biodiversity' },
    { title: 'Ancient & Medieval History – Complete', slug: 'ancient-medieval-history', description: 'Indus Valley to Mughal Empire – complete notes with culture, art, architecture and society.', subject_slug: 'history', price: 139, is_free: 0, pages: 260, language: 'English', exam_type: 'UPSC', emoji: '🏯', downloads: 6100, rating: 4.7, rating_count: 410, tags: 'ancient,medieval,mughal' },
    { title: 'CSAT – Quantitative Aptitude Shortcuts', slug: 'csat-quant-shortcuts', description: '200+ shortcut methods, practice questions, and previous year solutions for CSAT Paper 2.', subject_slug: 'csat', price: 89, is_free: 0, pages: 175, language: 'English', exam_type: 'UPSC', emoji: '🔢', downloads: 4300, rating: 4.5, rating_count: 290, tags: 'CSAT,aptitude,maths' },
    { title: 'Indian Geography – Human & Economic', slug: 'indian-geography-human', description: 'Population, agriculture, industries, transport, trade – complete human geography of India.', subject_slug: 'geography', price: 0, is_free: 1, pages: 145, language: 'Hindi', exam_type: 'UPSC', emoji: '🗺️', downloads: 7200, rating: 4.6, rating_count: 480, tags: 'geography,India,population' },
    { title: 'Essay Writing – 50 Model Essays', slug: 'essay-model-50', description: '50 model essays on philosophy, society, technology, governance – structured with intro, body, conclusion.', subject_slug: 'essay', price: 199, is_free: 0, pages: 300, language: 'English', exam_type: 'UPSC', emoji: '✍️', downloads: 5800, rating: 4.8, rating_count: 390, tags: 'essay,writing,UPSC-mains' },
  ];

  const getSubjectId = db.prepare('SELECT id FROM subjects WHERE slug = ?');
  const insertNote = db.prepare(`
    INSERT OR IGNORE INTO notes (title, slug, description, subject_id, price, is_free, pages, language, exam_type, emoji, downloads, rating, rating_count, tags, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  notes.forEach(n => {
    const subject = getSubjectId.get(n.subject_slug);
    if (subject) {
      insertNote.run(n.title, n.slug, n.description, subject.id, n.price, n.is_free, n.pages, n.language, n.exam_type, n.emoji, n.downloads, n.rating, n.rating_count, n.tags);
    }
  });

  // Bundles
  db.prepare(`INSERT OR IGNORE INTO bundles (id, title, description, price, original_price) VALUES (1, 'UPSC Prelims 2025 – Complete Pack', 'All 18 note sets covering GS1+GS2+CSAT+Current Affairs. 3800+ pages updated March 2025.', 799, 1800)`).run();

  // Coupons
  db.prepare(`INSERT OR IGNORE INTO coupons (code, discount_type, discount_value, min_amount, max_uses) VALUES ('FIRST50', 'percent', 50, 100, 500)`).run();
  db.prepare(`INSERT OR IGNORE INTO coupons (code, discount_type, discount_value, min_amount, max_uses) VALUES ('FLAT100', 'flat', 100, 200, 200)`).run();
  db.prepare(`INSERT OR IGNORE INTO coupons (code, discount_type, discount_value, min_amount, max_uses) VALUES ('UPSC2025', 'percent', 30, 149, 1000)`).run();

  console.log('✅ Seeding complete!');
  console.log('👤 Admin: admin@rahulnoteshub.in / Admin@123456');
  console.log('👤 User:  priya@example.com / User@123456');
}

seed();
