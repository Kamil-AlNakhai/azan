(function (global) {
  function dtr(x) { return (x * Math.PI) / 180; }
  function rtd(x) { return (x * 180) / Math.PI; }
  function fixAngle(a) { a = a - 360 * Math.floor(a / 360); return a < 0 ? a + 360 : a; }
  function fixHour(a) { a = a - 24 * Math.floor(a / 24); return a < 0 ? a + 24 : a; }
  function julian(year, month, day) {
    if (month <= 2) { year -= 1; month += 12; }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
  }
  function sunPosition(jd) {
    const D = jd - 2451545.0;
    const g = fixAngle(357.529 + 0.98560028 * D);
    const q = fixAngle(280.459 + 0.98564736 * D);
    const L = fixAngle(q + 1.915 * Math.sin(dtr(g)) + 0.020 * Math.sin(dtr(2 * g)));
    const e = 23.439 - 0.00000036 * D;
    const RA = rtd(Math.atan2(Math.cos(dtr(e)) * Math.sin(dtr(L)), Math.cos(dtr(L)))) / 15;
    const eqt = q / 15 - fixHour(RA);
    const decl = rtd(Math.asin(Math.sin(dtr(e)) * Math.sin(dtr(L))));
    return { declination: decl, equation: eqt };
  }
  function midDay(time, jd, lng) {
    const sp = sunPosition(jd + time);
    return fixHour(12 - sp.equation - lng / 15);
  }
  function hourAngle(angle, time, jd, lat, lng, direction) {
    const sp = sunPosition(jd + time);
    const decl = sp.declination;
    const noon = midDay(time, jd, lng);
    const top = -Math.sin(dtr(angle)) - Math.sin(dtr(decl)) * Math.sin(dtr(lat));
    const bottom = Math.cos(dtr(decl)) * Math.cos(dtr(lat));
    const v = top / bottom;
    if (v < -1 || v > 1) return null;
    const t = rtd(Math.acos(v)) / 15;
    return noon + (direction === 'ccw' ? -t : t);
  }
  function asrTime(factor, time, jd, lat, lng) {
    const sp = sunPosition(jd + time);
    const decl = sp.declination;
    const angle = -rtd(Math.atan(1 / (factor + Math.tan(Math.abs(dtr(lat - decl))))));
    return hourAngle(angle, time, jd, lat, lng, 'cw');
  }
  function timeDiff(a, b) { return fixHour(b - a); }
  function computePrayerTimes(date, lat, lng, timezone, opts) {
    const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
    const jd = julian(y, m, d) - lng / (15 * 24);
    const cfg = Object.assign({ fajrAngle: 18, sunriseAngle: 0.833, maghribAngle: 4.5, ishaAngle: 14, asrFactor: 1 }, opts || {});
    let times = { fajr: 5, sunrise: 6, zawal: 12, dhuhr: 12, asr: 15, maghrib: 18, sunset: 18, isha: 19 };
    for (let i = 0; i < 2; i++) {
      const t = {
        fajr: times.fajr / 24,
        sunrise: times.sunrise / 24,
        dhuhr: times.dhuhr / 24,
        asr: times.asr / 24,
        maghrib: times.maghrib / 24,
        sunset: times.sunset / 24,
        isha: times.isha / 24
      };
      const zawal = midDay(t.dhuhr, jd, lng);
      times.fajr = hourAngle(cfg.fajrAngle, t.fajr, jd, lat, lng, 'ccw');
      times.sunrise = hourAngle(cfg.sunriseAngle, t.sunrise, jd, lat, lng, 'ccw');
      times.zawal = zawal;
      times.dhuhr = zawal;
      times.asr = asrTime(cfg.asrFactor, t.asr, jd, lat, lng);
      times.maghrib = hourAngle(cfg.maghribAngle, t.maghrib, jd, lat, lng, 'cw');
      times.sunset = hourAngle(cfg.sunriseAngle, t.sunset, jd, lat, lng, 'cw');
      times.isha = hourAngle(cfg.ishaAngle, t.isha, jd, lat, lng, 'cw');
    }
    Object.keys(times).forEach(k => { times[k] = fixHour(times[k] + timezone); });
    return times;
  }
  function floatToDate(baseDate, hoursFloat) {
    const h = Math.floor(hoursFloat);
    const m = Math.floor((hoursFloat - h) * 60);
    const s = Math.round((((hoursFloat - h) * 60) - m) * 60);
    const dt = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
    dt.setHours(h, m, s, 0);
    return dt;
  }
  function formatTime(date) {
    return date.toLocaleTimeString('ar-IQ', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  function clockParts(date) {
    const parts = new Intl.DateTimeFormat('ar-IQ', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).formatToParts(date);
    const map = {};
    parts.forEach(part => { map[part.type] = (map[part.type] || '') + part.value; });
    return {
      time: (map.hour || '00') + ':' + (map.minute || '00'),
      seconds: map.second || '00',
      dayPeriod: map.dayPeriod || ''
    };
  }
  function addMinutes(date, mins) {
    return new Date(date.getTime() + mins * 60000);
  }
  global.PrayerDisplayCore = { computePrayerTimes, floatToDate, formatTime, clockParts, addMinutes, timeDiff };
})(window);
