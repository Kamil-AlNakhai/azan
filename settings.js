const FONT_OPTIONS = {
  naskh: `"Amiri", "Noto Naskh Arabic", "Traditional Arabic", serif`,
  ruqaa: `"Aref Ruqaa", "Segoe UI", Tahoma, sans-serif`,
  cairo: `Cairo, Tahoma, Arial, sans-serif`,
  tajawal: `Tajawal, Tahoma, Arial, sans-serif`,
  system: `Tahoma, Arial, sans-serif`
};

const FONT_LABELS = [
  { value: FONT_OPTIONS.naskh, label: 'نسخ' },
  { value: FONT_OPTIONS.ruqaa, label: 'رقعة' },
  { value: FONT_OPTIONS.cairo, label: 'Cairo' },
  { value: FONT_OPTIONS.tajawal, label: 'Tajawal' },
  { value: FONT_OPTIONS.system, label: 'Tahoma / Arial' }
];

const DAY_NAMES = [
  { key: 6, label: 'السبت' },
  { key: 0, label: 'الأحد' },
  { key: 1, label: 'الاثنين' },
  { key: 2, label: 'الثلاثاء' },
  { key: 3, label: 'الأربعاء' },
  { key: 4, label: 'الخميس' },
  { key: 5, label: 'الجمعة' }
];

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
  calc: { fajrAngle: 18, maghribAngle: 4.5, ishaAngle: 14, asrFactor: 1, dhuhrOffset: 3 },
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

function cloneConfig(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normalizeStyleGroup(src, fallback) {
  const out = Object.assign({}, fallback, src || {});
  if (!out.color) out.color = fallback.color;
  if (!out.font) out.font = fallback.font;
  if (!out.size) out.size = fallback.size || '1rem';
  return out;
}

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

async function loadLocations() {
  if (window.PRAYER_LOCATIONS) return window.PRAYER_LOCATIONS;
  try {
    const res = await fetch('data/locations.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    console.error('تعذر تحميل المحافظات:', err);
    return {};
  }
}

function jaafariDefaults() {
  return { fajrAngle: 18, maghribAngle: 4.5, ishaAngle: 14, asrFactor: 1, dhuhrOffset: 3 };
}

function hanafiDefaults() {
  return { fajrAngle: 18, maghribAngle: 0.833, ishaAngle: 17, asrFactor: 2, dhuhrOffset: 0 };
}

function buildFontSelect(id, selectedValue) {
  const select = document.getElementById(id);
  select.innerHTML = '';
  FONT_LABELS.forEach(item => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    select.appendChild(option);
  });
  select.value = selectedValue;
}

function buildWeeklyAwradRows(cfg) {
  const wrap = document.getElementById('weeklyAwradRows');
  wrap.innerHTML = '';
  DAY_NAMES.forEach(day => {
    const item = (cfg.weeklyAwrad && cfg.weeklyAwrad[day.key]) || { text: '', count: '' };
    const row = document.createElement('div');
    row.className = 'awrad-week-row';
    row.innerHTML = `
      <div>${day.label}</div>
      <input id="wird_text_${day.key}" type="text" placeholder="مثال: الاستغفار" value="${(item.text || '').replace(/"/g, '&quot;')}" />
      <input id="wird_count_${day.key}" type="text" placeholder="100" value="${(item.count || '').replace(/"/g, '&quot;')}" />
    `;
    wrap.appendChild(row);
  });
}

function collectWeeklyAwrad() {
  const out = {};
  DAY_NAMES.forEach(day => {
    out[day.key] = {
      text: document.getElementById('wird_text_' + day.key).value.trim(),
      count: document.getElementById('wird_count_' + day.key).value.trim()
    };
  });
  return out;
}

function applyMadhabDefaults() {
  const madhab = document.getElementById('madhabSelect').value;
  let calc;
  if (madhab === 'jaafari') calc = jaafariDefaults();
  else if (madhab === 'hanafi') calc = hanafiDefaults();
  else return;

  document.getElementById('fajrAngle').value = calc.fajrAngle;
  document.getElementById('ishaAngle').value = calc.ishaAngle;
  document.getElementById('maghribAngle').value = calc.maghribAngle;
  document.getElementById('asrFactor').value = String(calc.asrFactor);
  document.getElementById('dhuhrOffset').value = String(calc.dhuhrOffset);
}

async function initSettings() {
  const locations = await loadLocations();
  const cfg = loadConfig();
  const citySelect = document.getElementById('citySelect');

  Object.entries(locations).forEach(([key, val]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = val.name;
    citySelect.appendChild(option);
  });

  if (!citySelect.options.length) {
    const option = document.createElement('option');
    option.textContent = 'تعذر تحميل المحافظات';
    option.value = 'baghdad';
    citySelect.appendChild(option);
  }

  buildFontSelect('mosqueFontInput', cfg.styles.mosque.font);
  buildFontSelect('dedicationFontInput', cfg.styles.dedication.font);
  buildFontSelect('timesFontInput', cfg.styles.times.font);
  buildFontSelect('datesFontInput', cfg.styles.dates.font);
  buildFontSelect('awradFontInput', cfg.styles.awrad.font);
  buildFontSelect('tickerFontInput', cfg.styles.ticker.font);
  buildWeeklyAwradRows(cfg);

  document.getElementById('mosqueInput').value = cfg.mosqueName;
  citySelect.value = cfg.cityKey;
  document.getElementById('madhabSelect').value = cfg.madhab || 'jaafari';
  document.getElementById('clockModeSelect').value = cfg.clockMode || 'digital';
  document.getElementById('hijriAdjustInput').value = parseInt(cfg.hijriAdjust || 0, 10) || 0;
  document.getElementById('tickerInput').value = cfg.ticker;
  document.getElementById('tickerTextInput').value = cfg.tickerText || cfg.ticker || DEFAULT_CONFIG.ticker;
  document.getElementById('tickerSpeedSelect').value = cfg.tickerSpeed || 'normal';
  document.getElementById('tickerWPMInput').value = cfg.tickerWPM || 120;
  // شريط التكرار المتحرك
  document.getElementById('tickerTextInput').value = cfg.tickerText || cfg.ticker || DEFAULT_CONFIG.ticker;
  document.getElementById('tickerSpeedSelect').value = cfg.tickerSpeed || 'normal';
  document.getElementById('tickerWPMInput').value = cfg.tickerWPM || 120;

  document.getElementById('mosqueColorInput').value = cfg.styles.mosque.color;
  document.getElementById('dedicationColorInput').value = cfg.styles.dedication.color;
  document.getElementById('timesColorInput').value = cfg.styles.times.color;
  document.getElementById('datesColorInput').value = cfg.styles.dates.color;
  document.getElementById('awradColorInput').value = cfg.styles.awrad.color;
  document.getElementById('tickerColorInput').value = cfg.styles.ticker.color;

  document.getElementById('dedicationInput').value = cfg.dedication || '';
  document.getElementById('designerInput').value = cfg.designer || '';
  document.getElementById('fajrAngle').value = cfg.calc.fajrAngle;
  document.getElementById('ishaAngle').value = cfg.calc.ishaAngle;
  document.getElementById('maghribAngle').value = cfg.calc.maghribAngle;
  document.getElementById('asrFactor').value = String(cfg.calc.asrFactor);
  document.getElementById('dhuhrOffset').value = String(cfg.calc.dhuhrOffset || 0);
  document.getElementById('mosqueSizeInput').value = cfg.styles.mosque.size;
  document.getElementById('dedicationSizeInput').value = cfg.styles.dedication.size;
  document.getElementById('timesSizeInput').value = cfg.styles.times.size;
  document.getElementById('datesSizeInput').value = cfg.styles.dates.size;
  document.getElementById('awradSizeInput').value = cfg.styles.awrad.size;
  document.getElementById('tickerSizeInput').value = cfg.styles.ticker.size;
  document.getElementById('showAwrad').checked = Boolean(cfg.showAwrad);

  document.getElementById('madhabSelect').addEventListener('change', applyMadhabDefaults);
  // ===== تحديد معاملات الحساب الشرعي حسب المذهب والإعدادات =====

  document.getElementById('saveBtn').addEventListener('click', () => {
    const madhab = document.getElementById('madhabSelect').value;
    let calc = {
      fajrAngle: parseFloat(document.getElementById('fajrAngle').value || '18'),
      ishaAngle: parseFloat(document.getElementById('ishaAngle').value || '14'),
      maghribAngle: parseFloat(document.getElementById('maghribAngle').value || '4.5'),
      asrFactor: parseFloat(document.getElementById('asrFactor').value || '1'),
      dhuhrOffset: parseInt(document.getElementById('dhuhrOffset').value || '0', 10) || 0
    };

    if (madhab === 'jaafari') {
      calc = {
        fajrAngle: parseFloat(document.getElementById('fajrAngle').value || '18'),
        ishaAngle: parseFloat(document.getElementById('ishaAngle').value || '14'),
        maghribAngle: parseFloat(document.getElementById('maghribAngle').value || '4.5'),
        asrFactor: 1,
        dhuhrOffset: parseInt(document.getElementById('dhuhrOffset').value || '3', 10) || 0
      };
    }

    if (madhab === 'hanafi') {
      calc = {
        fajrAngle: parseFloat(document.getElementById('fajrAngle').value || '18'),
        ishaAngle: parseFloat(document.getElementById('ishaAngle').value || '17'),
        maghribAngle: parseFloat(document.getElementById('maghribAngle').value || '0.833'),
        asrFactor: 2,
        dhuhrOffset: parseInt(document.getElementById('dhuhrOffset').value || '0', 10) || 0
      };
    }

    const out = {
      mosqueName: document.getElementById('mosqueInput').value.trim() || 'اسم الجامع',
      cityKey: citySelect.value,
      madhab,
      clockMode: document.getElementById('clockModeSelect').value,
      hijriAdjust: parseInt(document.getElementById('hijriAdjustInput').value || '0', 10) || 0,
      ticker: document.getElementById('tickerInput').value.trim() || DEFAULT_CONFIG.ticker,
      tickerText: document.getElementById('tickerTextInput').value.trim() || DEFAULT_CONFIG.ticker,
      tickerSpeed: document.getElementById('tickerSpeedSelect').value,
      tickerWPM: Math.max(30, parseInt(document.getElementById('tickerWPMInput').value || '120', 10) || 120),
      styles: {
        mosque: {
          color: document.getElementById('mosqueColorInput').value || DEFAULT_CONFIG.styles.mosque.color,
          font: document.getElementById('mosqueFontInput').value || DEFAULT_CONFIG.styles.mosque.font,
          size: document.getElementById('mosqueSizeInput').value || DEFAULT_CONFIG.styles.mosque.size
        },
        dedication: {
          color: document.getElementById('dedicationColorInput').value || DEFAULT_CONFIG.styles.dedication.color,
          font: document.getElementById('dedicationFontInput').value || DEFAULT_CONFIG.styles.dedication.font,
          size: document.getElementById('dedicationSizeInput').value || DEFAULT_CONFIG.styles.dedication.size
        },
        times: {
          color: document.getElementById('timesColorInput').value || DEFAULT_CONFIG.styles.times.color,
          font: document.getElementById('timesFontInput').value || DEFAULT_CONFIG.styles.times.font,
          size: document.getElementById('timesSizeInput').value || DEFAULT_CONFIG.styles.times.size
        },
        dates: {
          color: document.getElementById('datesColorInput').value || DEFAULT_CONFIG.styles.dates.color,
          font: document.getElementById('datesFontInput').value || DEFAULT_CONFIG.styles.dates.font,
          size: document.getElementById('datesSizeInput').value || DEFAULT_CONFIG.styles.dates.size
        },
        awrad: {
          color: document.getElementById('awradColorInput').value || DEFAULT_CONFIG.styles.awrad.color,
          font: document.getElementById('awradFontInput').value || DEFAULT_CONFIG.styles.awrad.font,
          size: document.getElementById('awradSizeInput').value || DEFAULT_CONFIG.styles.awrad.size
        },
        ticker: {
          color: document.getElementById('tickerColorInput').value || DEFAULT_CONFIG.styles.ticker.color,
          font: document.getElementById('tickerFontInput').value || DEFAULT_CONFIG.styles.ticker.font,
          size: document.getElementById('tickerSizeInput').value || DEFAULT_CONFIG.styles.ticker.size
        }
      },
      dedication: document.getElementById('dedicationInput').value.trim(),
      designer: document.getElementById('designerInput').value.trim(),
      calc,
      showAwrad: document.getElementById('showAwrad').checked,
      weeklyAwrad: collectWeeklyAwrad()
    };
    localStorage.setItem('prayerDisplayConfig', JSON.stringify(normalizeConfig(out)));
    alert('تم حفظ الإعدادات بنجاح. افتح الصفحة الرئيسية لرؤية التعديلات.');
  });
}
initSettings();
