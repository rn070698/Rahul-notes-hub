const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

/* On Vercel, /tmp is the only writable directory */
const DB_DIR  = process.env.NODE_ENV === 'production'
  ? '/tmp'
  : path.join(__dirname, '../../');
const DB_PATH = path.join(DB_DIR, 'notes_hub.db');

let db;

function getDB() {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema(db);
  seedIfEmpty(db);
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
      role TEXT DEFAULT 'user', is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_login DATETIME
    );
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
      emoji TEXT DEFAULT '📄', description TEXT, sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT,
      subject_id INTEGER REFERENCES subjects(id),
      price REAL DEFAULT 0, is_free INTEGER DEFAULT 0, is_published INTEGER DEFAULT 1,
      pages INTEGER DEFAULT 0, language TEXT DEFAULT 'English', exam_type TEXT DEFAULT 'UPSC',
      file_path TEXT, preview_path TEXT, emoji TEXT DEFAULT '📄',
      downloads INTEGER DEFAULT 0, rating REAL DEFAULT 0, rating_count INTEGER DEFAULT 0,
      tags TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id), note_id INTEGER REFERENCES notes(id),
      razorpay_order_id TEXT, razorpay_payment_id TEXT, razorpay_signature TEXT,
      amount REAL NOT NULL, status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, paid_at DATETIME
    );
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id), note_id INTEGER REFERENCES notes(id),
      order_id INTEGER REFERENCES orders(id),
      purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, note_id)
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id), note_id INTEGER REFERENCES notes(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, note_id)
    );
    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id), note_id INTEGER REFERENCES notes(id),
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, note_id)
    );
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL, discount_type TEXT DEFAULT 'percent',
      discount_value REAL NOT NULL, min_amount REAL DEFAULT 0,
      max_uses INTEGER DEFAULT 100, used_count INTEGER DEFAULT 0,
      expires_at DATETIME, is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS bundles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL, description TEXT,
      price REAL NOT NULL, original_price REAL NOT NULL, is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS bundle_notes (
      bundle_id INTEGER REFERENCES bundles(id),
      note_id   INTEGER REFERENCES notes(id),
      PRIMARY KEY (bundle_id, note_id)
    );
  `);
}

function seedIfEmpty(db) {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (count > 0) return;

  const bcrypt = require('bcryptjs');

  /* admin */
  db.prepare(`INSERT OR IGNORE INTO users (name,email,password,role,is_verified) VALUES (?,?,?,?,?)`)
    .run('Rahul Admin','admin@rahulnoteshub.in', bcrypt.hashSync('Admin@123456',10),'admin',1);
  /* demo user */
  db.prepare(`INSERT OR IGNORE INTO users (name,email,password,role,is_verified) VALUES (?,?,?,?,?)`)
    .run('Priya Sharma','priya@example.com', bcrypt.hashSync('User@123456',10),'user',1);

  const subjects = [
    ['Polity & Governance','polity','📜','Indian Constitution, governance',1],
    ['History','history','🏺','Ancient, medieval, modern history',2],
    ['Geography','geography','🌍','Physical and human geography',3],
    ['Economics','economics','📈','Indian and world economy',4],
    ['Science & Technology','science-tech','🔬','Space, defence, emerging tech',5],
    ['Ethics & GS4','ethics','⚖️','Ethics, integrity, case studies',6],
    ['Environment','environment','🌿','Ecology, biodiversity',7],
    ['Current Affairs','current-affairs','📰','Monthly compilations',8],
    ['CSAT','csat','🔢','Aptitude test preparation',9],
    ['Essay','essay','✍️','Essay writing & model essays',10],
  ];
  const ins = db.prepare(`INSERT OR IGNORE INTO subjects (name,slug,emoji,description,sort_order) VALUES (?,?,?,?,?)`);
  subjects.forEach(s => ins.run(...s));

  const notes = [
    ['Indian Constitution – Complete Notes','indian-constitution-complete','All 25 Parts, 12 Schedules, major amendments and landmark judgments.','polity',149,0,320,'English','UPSC','📜',12400,4.9,842,'constitution,polity,articles'],
    ['Modern History – Spectrum Shortcut','modern-history-spectrum','1757 to 1947: Freedom movement, revolts, acts and personalities.','history',0,1,210,'English','UPSC','🏺',9100,4.8,620,'history,freedom,1857'],
    ['Physical Geography – Complete Guide','physical-geography-complete','Climatology, geomorphology, oceanography with diagrams and maps.','geography',129,0,280,'English','UPSC','🌍',7600,4.7,510,'geography,climate,maps'],
    ['Indian Economy – Budget 2025 Edition','indian-economy-budget-2025','Economic Survey, Budget 2025, monetary policy & flagship schemes.','economics',0,1,190,'English','UPSC','📈',8300,4.8,590,'economy,budget,schemes'],
    ['Science & Technology – Mains Focus','science-tech-mains','Space, biotech, defence, AI from UPSC Mains perspective.','science-tech',99,0,165,'English','UPSC','🔬',5200,4.6,380,'science,ISRO,tech,AI'],
    ['Ethics, Integrity & Aptitude – GS4','ethics-gs4-complete','50 case studies with model answers, all ethical theories & thinkers.','ethics',179,0,240,'English','UPSC','⚖️',10100,4.9,720,'ethics,GS4,case-studies'],
    ['Current Affairs – Jan–Mar 2025','current-affairs-jan-mar-2025','3-month compilation with 200+ MCQs on all major events.','current-affairs',0,1,130,'English','UPSC','📰',15600,4.7,930,'current-affairs,MCQ,2025'],
    ['Environment & Ecology – Complete','environment-ecology-complete','Biodiversity, climate conventions, environmental laws & parks.','environment',119,0,195,'English','UPSC','🌿',8800,4.8,640,'environment,ecology,biodiversity'],
    ['Ancient & Medieval History','ancient-medieval-history','Indus Valley to Mughal Empire – culture, art & architecture.','history',139,0,260,'English','UPSC','🏯',6100,4.7,410,'ancient,medieval,mughal'],
    ['CSAT – Quantitative Aptitude Shortcuts','csat-quant-shortcuts','200+ shortcuts, practice questions & previous year CSAT solutions.','csat',89,0,175,'English','UPSC','🔢',4300,4.5,290,'CSAT,aptitude,maths'],
    ['Indian Geography – Human & Economic','indian-geography-human','Population, agriculture, industries, transport & trade of India.','geography',0,1,145,'Hindi','UPSC','🗺️',7200,4.6,480,'geography,India,population'],
    ['Essay Writing – 50 Model Essays','essay-model-50','50 model essays on philosophy, society, tech & governance.','essay',199,0,300,'English','UPSC','✍️',5800,4.8,390,'essay,writing,UPSC-mains'],
  ];

  const getSub = db.prepare('SELECT id FROM subjects WHERE slug=?');
  const insN   = db.prepare(`INSERT OR IGNORE INTO notes
    (title,slug,description,subject_id,price,is_free,pages,language,exam_type,emoji,downloads,rating,rating_count,tags,is_published)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`);
  notes.forEach(([title,slug,desc,subSlug,price,is_free,pages,lang,exam,emoji,dl,rat,rc,tags]) => {
    const sub = getSub.get(subSlug);
    if (sub) insN.run(title,slug,desc,sub.id,price,is_free,pages,lang,exam,emoji,dl,rat,rc,tags);
  });

  /* coupons */
  [['FIRST50','percent',50,100,500],['FLAT100','flat',100,200,200],['UPSC2025','percent',30,149,1000]]
    .forEach(([code,type,val,min,max]) =>
      db.prepare(`INSERT OR IGNORE INTO coupons (code,discount_type,discount_value,min_amount,max_uses) VALUES (?,?,?,?,?)`)
        .run(code,type,val,min,max)
    );

  /* bundle */
  db.prepare(`INSERT OR IGNORE INTO bundles (id,title,description,price,original_price) VALUES (1,?,?,?,?)`)
    .run('UPSC Prelims 2025 – Complete Pack','All GS1+GS2+CSAT+Current Affairs. 3800+ pages.',799,1800);

  console.log('✅ DB seeded. Admin: admin@rahulnoteshub.in / Admin@123456');
}

module.exports = { getDB };
