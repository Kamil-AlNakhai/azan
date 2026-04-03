// ===== قائمة الخطوط المتاحة في الإعدادات =====
const FONT_OPTIONS = {
  naskh: `"Amiri", "Noto Naskh Arabic", "Traditional Arabic", serif`,
  ruqaa: `"Aref Ruqaa", "Segoe UI", Tahoma, sans-serif`,
  cairo: `Cairo, Tahoma, Arial, sans-serif`,
  tajawal: `Tajawal, Tahoma, Arial, sans-serif`,
  system: `Tahoma, Arial, sans-serif`
};


// ===== الإعدادات الافتراضية التي تُستخدم عند أول تشغيل =====
const DEFAULT_CONFIG = {
  mosqueName: 'اسم الجامع',
  cityKey: 'baghdad',
  ticker: 'الرجاء غلق الهاتف عند دخول المسجد',
  tickerText: 'الرجاء غلق الهاتف عند دخول المسجد',  // ⬅️ أضف هذا
  tickerSpeed: 'normal',  // ⬅️ أضف هذا
  tickerWPM: 120,
  madhab: 'jaafari',
  clockMode: 'digital',
  hijriAdjust: 0,
  styles: {
    mosque: { color: '#f5deb3', font: FONT_OPTIONS.naskh, size: '4.2rem' },
    dedication: { color: '#f7f2e8', font: FONT_OPTIONS.naskh, size: '1.25rem' },
    times: { color: '#f7f2e8', font: FONT_OPTIONS.system, size: '2.15rem' },
    dates: { color: '#ddd3c5', font: FONT_OPTIONS.system, size: '1.2rem' },
    awrad: { color: '#f5deb3', font: FONT_OPTIONS.system, size: '1.4rem' },
    ticker: { color: '#ddd3c5', font: FONT_OPTIONS.system, size: '1.15rem' }
  },
  dedication: '',
  designer: '',
  calc: { fajrAngle: 18, maghribAngle: 4.5, ishaAngle: 14, asrFactor: 1, dhuhrOffset: 0 },
  showAwrad: false,
  weeklyAwrad: {
    0: { text: '', count: '' },
    1: { text: '', count: '' },
    2: { text: '', count: '' },
    3: { text: '', count: '' },
    4: { text: '', count: '' },
    5: { text: '', count: '' },
    6: { text: '', count: '' }
  }
};


// ===== أسماء الصفوف الظاهرة في جدول المواقيت =====
const LABELS = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  zawal: 'الزوال',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  sunset: 'الغروب',
  isha: 'العشاء'
};

const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];


// ===== نسخ الإعدادات حتى لا يتم تعديل الأصل مباشرة =====
function cloneConfig(obj) {
  return JSON.parse(JSON.stringify(obj));
}


// ===== توحيد خصائص الألوان والخطوط والأحجام لكل مجموعة =====
function normalizeStyleGroup(src, fallback) {
  const out = Object.assign({}, fallback, src || {});
  if (!out.color) out.color = fallback.color;
  if (!out.font) out.font = fallback.font;
  if (!out.size) out.size = fallback.size || '1rem';
  return out;
}


// ===== دمج الإعدادات المحفوظة مع القيم الافتراضية =====
function normalizeConfig(cfg) {
  const merged = Object.assign({}, DEFAULT_CONFIG, cfg || {});
  merged.styles = {
    mosque: normalizeStyleGroup(cfg && cfg.styles && cfg.styles.mosque, DEFAULT_CONFIG.styles.mosque),
    dedication: normalizeStyleGroup(cfg && cfg.styles && cfg.styles.dedication, DEFAULT_CONFIG.styles.dedication),
    times: normalizeStyleGroup(cfg && cfg.styles && cfg.styles.times, DEFAULT_CONFIG.styles.times),
    dates: normalizeStyleGroup(cfg && cfg.styles && cfg.styles.dates, DEFAULT_CONFIG.styles.dates),
    awrad: normalizeStyleGroup(cfg && cfg.styles && cfg.styles.awrad, DEFAULT_CONFIG.styles.awrad),
    ticker: normalizeStyleGroup(cfg && cfg.styles && cfg.styles.ticker, DEFAULT_CONFIG.styles.ticker)
  };
  merged.calc = Object.assign({}, DEFAULT_CONFIG.calc, (cfg && cfg.calc) || {});
  const weekly = Object.assign({}, DEFAULT_CONFIG.weeklyAwrad, (cfg && cfg.weeklyAwrad) || {});
  merged.weeklyAwrad = {};
  Object.keys(DEFAULT_CONFIG.weeklyAwrad).forEach(key => {
    const src = weekly[key] || {};
    merged.weeklyAwrad[key] = {
      text: typeof src.text === 'string' ? src.text : '',
      count: src.count === undefined || src.count === null ? '' : String(src.count)
    };
  });
  merged.showAwrad = Boolean(cfg && cfg.showAwrad);
  if (!merged.madhab) merged.madhab = DEFAULT_CONFIG.madhab;
  if (!merged.clockMode) merged.clockMode = DEFAULT_CONFIG.clockMode;
  if (Number.isNaN(parseInt(merged.hijriAdjust, 10))) merged.hijriAdjust = 0;
  if (!merged.tickerText) merged.tickerText = merged.ticker || DEFAULT_CONFIG.ticker;
  if (!merged.tickerSpeed) merged.tickerSpeed = DEFAULT_CONFIG.tickerSpeed;
  merged.tickerWPM = parseInt(merged.tickerWPM || DEFAULT_CONFIG.tickerWPM || 120, 10);
  if (!Number.isFinite(merged.tickerWPM) || merged.tickerWPM <= 0) merged.tickerWPM = 120;
  return merged;
}


// ===== تحميل الإعدادات من LocalStorage =====
function loadConfig() {
  const raw = localStorage.getItem('prayerDisplayConfig');
  if (!raw) return cloneConfig(DEFAULT_CONFIG);
  try {
    return normalizeConfig(JSON.parse(raw));
  } catch (err) {
    console.error('تعذر تحميل الإعدادات:', err);
    return cloneConfig(DEFAULT_CONFIG);
  }
}

function saveConfig(cfg) {
  localStorage.setItem('prayerDisplayConfig', JSON.stringify(normalizeConfig(cfg)));
}


// ===== تحميل ملف المحافظات والإحداثيات =====
async function loadData() {
  if (window.PRAYER_LOCATIONS) return window.PRAYER_LOCATIONS;
  try {
    const res = await fetch('data/locations.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    console.error('تعذر تحميل ملف المحافظات:', err);
    return {};
  }
}


// ===== بناء التاريخ الهجري مع تعويض الرؤية =====
function hijriDate(now, adjustDays) {
  const adjusted = new Date(now);
  adjusted.setDate(adjusted.getDate() + (parseInt(adjustDays || 0, 10) || 0));

  const weekday = new Intl.DateTimeFormat('ar-IQ', {
    weekday: 'long'
  }).format(now);

  const hijriRest = new Intl.DateTimeFormat('ar-IQ-u-ca-islamic', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(adjusted);

  return `${weekday} : ${hijriRest}`;
}


// ===== بناء التاريخ الميلادي =====
function gregorianDate(now) {
  return new Intl.DateTimeFormat('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' }).format(now) + ' م';
}

function getTimezoneHours(date) {
  return -date.getTimezoneOffset() / 60;
}


// ===== تحديد معاملات الحساب الشرعي حسب المذهب والإعدادات =====
function effectiveCalc(cfg) {
  if (cfg.madhab === 'jaafari') {
    return {
      fajrAngle: parseFloat(cfg.calc?.fajrAngle ?? 18),
      maghribAngle: parseFloat(cfg.calc?.maghribAngle ?? 4.5),
      ishaAngle: parseFloat(cfg.calc?.ishaAngle ?? 14),
      asrFactor: 1,
      dhuhrOffset: Number.isFinite(parseInt(cfg.calc?.dhuhrOffset, 10))
        ? parseInt(cfg.calc.dhuhrOffset, 10)
        : 3
    };
  }

  if (cfg.madhab === 'hanafi') {
    return {
      fajrAngle: parseFloat(cfg.calc?.fajrAngle ?? 18),
      maghribAngle: parseFloat(cfg.calc?.maghribAngle ?? 0.833),
      ishaAngle: parseFloat(cfg.calc?.ishaAngle ?? 17),
      asrFactor: 2,
      dhuhrOffset: parseInt(cfg.calc?.dhuhrOffset || 0, 10) || 0
    };
  }

  return Object.assign({}, cfg.calc);
}


// ===== تحديد الصفوف التي تظهر في الجدول الرئيسي =====
function visibleRows(cfg) {
  const rows = [
    { key: 'fajr', label: LABELS.fajr },
    { key: 'sunrise', label: LABELS.sunrise },
    { key: 'dhuhr', label: LABELS.dhuhr }
  ];

  if (cfg.madhab !== 'jaafari') rows.push({ key: 'asr', label: LABELS.asr });
  rows.push({ key: 'sunset', label: LABELS.sunset });
  rows.push({ key: 'maghrib', label: LABELS.maghrib });
  if (cfg.madhab !== 'jaafari') rows.push({ key: 'isha', label: LABELS.isha });
  return rows;
}


// ===== تحديد الصلوات التي تدخل في حساب الصلاة القادمة =====
function countdownPrayerKeys(cfg) {
  return cfg.madhab === 'jaafari'
    ? ['fajr', 'dhuhr', 'maghrib']
    : ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
}


// ===== إيجاد الصلاة القادمة بناءً على الوقت الحالي =====
function nextPrayerNameAndRemaining(schedule, now, cfg) {
  const ordered = countdownPrayerKeys(cfg);
  for (const key of ordered) {
    if (schedule[key] > now) return { key, date: schedule[key] };
  }
  return { key: ordered[0], date: schedule[ordered[0] + 'Tomorrow'] || schedule[ordered[0]] };
}


// ===== تحويل الأرقام الإنجليزية إلى أرقام عربية =====
function toArabicNumbers(str) {
  return str.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}


// ===== تصفير الثواني من وقت الصلاة حتى يتطابق العرض مع الوقت الفعلي بالدقيقة =====
function snapToMinute(date) {
  const d = new Date(date.getTime());
  d.setSeconds(0, 0);
  return d;
}


// ===== حساب الوقت المتبقي حتى الصلاة القادمة =====
function diffText(target, now) {
  const targetMs = target.getTime();
  const nowMs = now.getTime();
  let sec = Math.max(0, Math.ceil((targetMs - nowMs) / 1000));
  const h = Math.floor(sec / 3600);
  sec -= h * 3600;
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return toArabicNumbers([h, m, s].map(v => String(v).padStart(2, '0')).join(':'));
}

// ===== بناء جدول مواقيت اليوم والغد للمحافظة المختارة =====
function buildSchedule(date, city, cfg) {
  const calc = effectiveCalc(cfg);
  const floats = PrayerDisplayCore.computePrayerTimes(date, city.lat, city.lng, getTimezoneHours(date), calc);
  const out = {};
  Object.keys(floats).forEach(k => { out[k] = snapToMinute(PrayerDisplayCore.floatToDate(date, floats[k])); });
  out.zawal = snapToMinute(PrayerDisplayCore.floatToDate(date, floats.zawal));
  out.dhuhr = snapToMinute(PrayerDisplayCore.addMinutes(out.zawal, parseInt(calc.dhuhrOffset || 0, 10) || 0));
  const tomorrow = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  const tomorrowFloats = PrayerDisplayCore.computePrayerTimes(tomorrow, city.lat, city.lng, getTimezoneHours(tomorrow), calc);
  const keys = countdownPrayerKeys(cfg);
  keys.forEach(key => {
    let dt = PrayerDisplayCore.floatToDate(tomorrow, tomorrowFloats[key]);
    if (key === 'dhuhr') {
      const zawalTomorrow = snapToMinute(PrayerDisplayCore.floatToDate(tomorrow, tomorrowFloats.zawal));
      dt = snapToMinute(PrayerDisplayCore.addMinutes(zawalTomorrow, parseInt(calc.dhuhrOffset || 0, 10) || 0));
    }
    out[key + 'Tomorrow'] = snapToMinute(dt);
  });
  return out;
}


// ===== رسم جدول الأوقات وإبراز الصف النشط =====
function renderTable(schedule, cfg, activeKey) {
  const table = document.getElementById('timesTable');
  table.innerHTML = '';
  visibleRows(cfg).forEach(p => {
    const row = document.createElement('div');
    row.className = 'table-row row row-two side-balance' + (activeKey === p.key ? ' active' : '');
    const adhan = PrayerDisplayCore.formatTime(schedule[p.key]);
    row.innerHTML = `<div class="prayer-name">${p.label}</div><div class="prayer-time">${adhan}</div>`;
    table.appendChild(row);
  });
}


// ===== عرض ورد اليوم بحسب يوم الأسبوع =====
function renderAwrad(cfg, now) {
  const section = document.getElementById('awradSection');
  const list = document.getElementById('awradList');
  const dayLabel = document.getElementById('awradDayLabel');
  list.innerHTML = '';
  const item = (cfg.weeklyAwrad && cfg.weeklyAwrad[now.getDay()]) || { text: '', count: '' };
  if (!cfg.showAwrad || !(item.text || '').trim()) {
    section.hidden = true;
    return;
  }
  dayLabel.textContent = DAY_NAMES[now.getDay()] || '';

  // ===修正: تطبيق حجم الخط على الأوراد ===
  if (cfg.styles.awrad.size) {
    section.style.fontSize = cfg.styles.awrad.size;
  }

  const row = document.createElement('div');
  row.className = 'awrad-row';
  row.innerHTML = `
    <div class="awrad-name">📿 ${(item.text || '').trim()}</div>
    <div class="awrad-count">${(item.count || '').trim() ? '× ' + String(item.count).trim() : '× -'}</div>
  `;
  list.appendChild(row);
  section.hidden = false;
}


// ===== تطبيق الألوان والخطوط والأحجام المختارة من صفحة الإعدادات =====
function applyBranding(cfg, city) {
  const root = document.documentElement;
  root.style.setProperty('--mosque-color', cfg.styles.mosque.color);
  root.style.setProperty('--mosque-font', cfg.styles.mosque.font);
  root.style.setProperty('--mosque-size', cfg.styles.mosque.size);
  root.style.setProperty('--dedication-color', cfg.styles.dedication.color);
  root.style.setProperty('--dedication-font', cfg.styles.dedication.font);
  root.style.setProperty('--dedication-size', cfg.styles.dedication.size);
  root.style.setProperty('--times-color', cfg.styles.times.color);
  root.style.setProperty('--times-font', cfg.styles.times.font);
  root.style.setProperty('--times-size', cfg.styles.times.size);
  root.style.setProperty('--dates-color', cfg.styles.dates.color);
  root.style.setProperty('--dates-font', cfg.styles.dates.font);
  root.style.setProperty('--dates-size', cfg.styles.dates.size);
  root.style.setProperty('--awrad-color', cfg.styles.awrad.color);
  root.style.setProperty('--awrad-font', cfg.styles.awrad.font);
  root.style.setProperty('--awrad-size', cfg.styles.awrad.size);
  root.style.setProperty('--ticker-color', cfg.styles.ticker.color);
  root.style.setProperty('--ticker-font', cfg.styles.ticker.font);
  root.style.setProperty('--ticker-size', cfg.styles.ticker.size);

  const mosqueName = document.getElementById('mosqueName');
  mosqueName.textContent = cfg.mosqueName || 'اسم الجامع';

  const dedication = document.getElementById('dedication');
  const dedicationText = (cfg.dedication || '').trim();
  dedication.textContent = dedicationText;
  dedication.hidden = !dedicationText;

  const designerLine = document.getElementById('designerLine');
  const designerText = (cfg.designer || '').trim();
  designerLine.textContent = designerText ? `تصميم المهندس: ${designerText}` : '';
  designerLine.hidden = !designerText;

  document.getElementById('locationLabel').textContent = city ? `المحافظة: ${city.name}` : '';

  // تهيئة حاوية نص الفقرات فقط، أمّا التبديل بين الفقرات فيدار من مدير مستقل
  const tickerElement = document.getElementById('messageTicker');
  // تفعيل الانتقال الناعم
  tickerElement.style.transition = 'opacity 0.6s ease';
  tickerElement.style.opacity = '1';
  if (tickerElement) {
    tickerElement.style.animationDuration = '';
  }
}


// ===== تحديد هل تظهر الساعة الرقمية أو التناظرية أو الاثنتان معًا =====
function applyClockMode(mode) {
  const analog = document.getElementById('analogClock');
  const digital = document.getElementById('digitalClockWrap');
  analog.hidden = !(mode === 'analog' || mode === 'both');
  digital.hidden = !(mode === 'digital' || mode === 'both');
}


// ===== رسم الساعة التناظرية على Canvas =====
function drawAnalogClock(date, cfg) {
  const canvas = document.getElementById('analogClock');
  if (canvas.hidden) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) - 12;
  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.translate(cx, cy);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(8, 18, 26, 0.68)';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = cfg.styles.times.color || '#f7f2e8';
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(215,191,138,.55)';
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI / 6) * i - Math.PI / 2;
    const x1 = Math.cos(angle) * (radius - 10);
    const y1 = Math.sin(angle) * (radius - 10);
    const x2 = Math.cos(angle) * (radius - 24);
    const y2 = Math.sin(angle) * (radius - 24);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  const hour = date.getHours() % 12;
  const minute = date.getMinutes();
  const second = date.getSeconds();

  function hand(angle, length, width, color) {
    ctx.save();
    ctx.rotate(angle - Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(length, 0);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  hand((Math.PI / 6) * (hour + minute / 60), radius * 0.45, 8, cfg.styles.times.color || '#fff');
  hand((Math.PI / 30) * (minute + second / 60), radius * 0.68, 5, cfg.styles.times.color || '#fff');
  hand((Math.PI / 30) * second, radius * 0.78, 2, cfg.styles.mosque.color || '#d7bf8a');

  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fillStyle = cfg.styles.mosque.color || '#d7bf8a';
  ctx.fill();
  ctx.restore();
}

function renderError(message) {
  document.getElementById('timesTable').innerHTML = `<div class="table-row row row-two"><div style="grid-column:1 / -1;color:#ffd7d7">${message}</div></div>`;
  document.getElementById('locationLabel').textContent = message;
}


// ===== نقطة البداية: تشغيل اللوحة وتحديثها باستمرار =====

const ParagraphTicker = {
  timer: null,
  fadeTimer: null,
  signature: '',
  paragraphs: [],
  index: 0,

  buildParagraphs(text) {
    const maxWords = 20;

    function splitLongParagraph(paragraph) {
      const words = String(paragraph || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      const chunks = [];
      for (let i = 0; i < words.length; i += maxWords) {
        chunks.push(words.slice(i, i + maxWords).join(' '));
      }

      return chunks;
    }

    return String(text || '')
      .split('---')
      .map(p => p.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .flatMap(splitLongParagraph);
  },

  durationFor(paragraph, cfg) {
    const el = document.getElementById('messageTicker') || document.getElementById('messageTickerAlt');

    const words = String(paragraph || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length || 1;

    const baseWPM = Math.max(40, parseInt(cfg.tickerWPM || 120, 10) || 120);
    const speed = cfg.tickerSpeed || 'normal';

    let multiplier = 1;
    if (speed === 'fast') factor = 0.85;
    else if (speed === 'slow') factor = 1.15;
    else if (speed === 'very-slow') factor = 1.35;

    const readingMs = Math.round((words / baseWPM) * 60 * 1000 * multiplier);

    // لو ماكو عنصر، ارجع للحساب العادي
    if (!el) {
      return Math.max(3500, readingMs);
    }

    // قياس عدد الأسطر الفعلي
    const originalText = el.textContent;
    el.textContent = paragraph;

    const style = window.getComputedStyle(el);
    let lineHeight = parseFloat(style.lineHeight);

    if (!lineHeight || Number.isNaN(lineHeight)) {
      const fontSize = parseFloat(style.fontSize) || 16;
      lineHeight = fontSize * 1.7;
    }

    const lines = Math.max(1, Math.round(el.scrollHeight / lineHeight));

    // رجع النص كما كان
    el.textContent = originalText;

    // سطر واحد = وقت أطول
    if (lines <= 1) {
      return Math.max(5000, readingMs + 1200);
    }

    // سطرين أو أكثر = اعتماد طبيعي على الكلمات
    return Math.max(3200, readingMs + 400);
  },

  renderCurrent(cfg) {
    const el = document.getElementById('messageTicker');
    if (!el) return;

    if (!this.paragraphs.length) {
      el.textContent = '';
      return;
    }

    const paragraph = this.paragraphs[this.index] || '';

    // إلغاء أي عمليات سابقة
    cancelAnimationFrame(this.raf1);
    cancelAnimationFrame(this.raf2);
    cancelAnimationFrame(this.raf3);

    // 1️⃣ إطفاء
    el.style.opacity = '0';

    // 2️⃣ انتظار frame
    this.raf1 = requestAnimationFrame(() => {

      // 3️⃣ انتظار frame ثاني (مهم جدًا)
      this.raf2 = requestAnimationFrame(() => {

        // تغيير النص
        el.textContent = paragraph;

        // 4️⃣ انتظار frame ثالث
        this.raf3 = requestAnimationFrame(() => {

          // 5️⃣ إظهار
          el.style.opacity = '0';

        });

      });

    });
  },

  scheduleNext(cfg) {
    clearTimeout(this.timer);
    if (!this.paragraphs.length) return;
    const paragraph = this.paragraphs[this.index] || '';
    const duration = this.durationFor(paragraph, cfg);
    this.timer = setTimeout(() => {
      this.index = (this.index + 1) % this.paragraphs.length;
      this.renderCurrent(cfg);
      this.scheduleNext(cfg);
    }, duration);
  },

  update(cfg) {
    const text = cfg.tickerText || cfg.ticker || DEFAULT_CONFIG.ticker;
    const signature = JSON.stringify({
      text,
      wpm: parseInt(cfg.tickerWPM || 120, 10) || 120,
      speed: cfg.tickerSpeed || 'normal'
    });

    if (signature === this.signature) return;

    this.signature = signature;
    this.paragraphs = this.buildParagraphs(text);
    this.index = 0;
    this.renderCurrent(cfg);
    this.scheduleNext(cfg);
  }
};


(async function init() {
  document.body.classList.add('portrait-preview');
  const locations = await loadData();
  let cfg = loadConfig();
  saveConfig(cfg);

  if (!locations || !Object.keys(locations).length) {
    renderError('تعذر تحميل المحافظات. افتح المجلد كاملًا من الفلاش.');
    return;
  }




  // ===== تحديث الشاشة كل ثانية باستخدام نفس الوقت المرجعي =====
  function tick() {
    function toArabicNumbers(str) {
      return str.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
    }
    cfg = loadConfig();
    const city = locations[cfg.cityKey] || locations.baghdad || Object.values(locations)[0];
    const now = new Date();
    const schedule = buildSchedule(now, city, cfg);
    const nxt = nextPrayerNameAndRemaining(schedule, now, cfg);

    applyBranding(cfg, city);
    applyClockMode(cfg.clockMode || 'digital');
    document.getElementById('hijriDate').textContent = hijriDate(now, cfg.hijriAdjust || 0);
    document.getElementById('gregorianDate').textContent = gregorianDate(now);

    const clockParts = PrayerDisplayCore.clockParts(now);
    const clockEl = document.getElementById('clock');
    clockEl.innerHTML = `
    <div class="clock-title">الوقت الآن</div>
    <div class="clock-time">${clockParts.time}</div>
  `;
    document.getElementById('secondsAmPm').textContent = ` ${clockParts.seconds} ${clockParts.dayPeriod || ''}`.trim();

    ParagraphTicker.update(cfg);

    const prayerLabel = LABELS[nxt.key] || 'الصلاة القادمة';
    document.getElementById('nextPrayerLabel').textContent = `الوقت المتبقي لـ ${prayerLabel}`;
    document.getElementById('countdown').textContent = diffText(nxt.date, now);
    document.getElementById('nextPrayerTime').textContent = `${prayerLabel}: ${toArabicNumbers(PrayerDisplayCore.formatTime(nxt.date))}`;

    let active = visibleRows(cfg).some(p => p.key === nxt.key) ? nxt.key : null;
    renderTable(schedule, cfg, active);
    renderAwrad(cfg, now);
    drawAnalogClock(now, cfg);
  }

  // تشغيل أول تحديث فورًا، ثم مزامنة التحديثات مع بداية كل ثانية
  // حتى تختفي فروق الثانية الواحدة بين الساعة الحالية والوقت المتبقي.
  tick();
  const firstDelay = 1000 - (Date.now() % 1000);
  setTimeout(() => {
    tick();
    setInterval(tick, 1000);
  }, firstDelay);
})();
