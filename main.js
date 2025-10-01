// Конвертация дБм → Вт
function dbmToW(dbm) {
  return Math.pow(10, (dbm - 30) / 10);
}

// Конвертация Вт → дБм
function wToDbm(watt) {
  return 10 * Math.log10(watt) + 30;
}

// Синхронизация полей
document.getElementById('p_tx_dbm').addEventListener('input', () => {
  const dbm = parseFloat(document.getElementById('p_tx_dbm').value);
  if (!isNaN(dbm)) {
    document.getElementById('p_tx_w').value = dbmToW(dbm).toFixed(3);
  }
});

document.getElementById('p_tx_w').addEventListener('input', () => {
  const watt = parseFloat(document.getElementById('p_tx_w').value);
  if (!isNaN(watt) && watt > 0) {
    document.getElementById('p_tx_dbm').value = wToDbm(watt).toFixed(1);
  }
});


function calculate() {
  const R = 6371000; 

  const f = parseFloat(document.getElementById('freq').value);
  const h_tx = parseFloat(document.getElementById('h_tx').value);
  const h_rx = parseFloat(document.getElementById('h_rx').value);
  const p_tx = parseFloat(document.getElementById('p_tx_dbm').value); // берем дБм
  const g_tx = parseFloat(document.getElementById('g_tx').value);
  const g_rx = parseFloat(document.getElementById('g_rx').value);
  const sensitivity = parseFloat(document.getElementById('sensitivity').value);
  const loss_other = parseFloat(document.getElementById('loss_other').value);

  
  const d_horizon = (Math.sqrt(2 * R * h_tx) + Math.sqrt(2 * R * h_rx)) / 1000;

  
  const ML = p_tx + g_tx + g_rx - sensitivity - loss_other; 
  const log_d = (ML - 32.44 - 20 * Math.log10(f)) / 20;
  const d_energy = Math.pow(10, log_d); 

  // Максимальная дальность
  const d_max = Math.min(d_horizon, d_energy);

  document.getElementById('result').innerHTML = `
    Радиогоризонт: ${d_horizon.toFixed(2)} км <br>
    Энергетическая дальность: ${d_energy.toFixed(2)} км <br>
    <span style="color: #f3b84b;">Максимальная дальность: ${d_max.toFixed(2)} км</span>
  `;
}


// Калькулятор гармоник
// === Калькулятор гармоник (исправленный расчет гармоник) ===

// Все частоты популярных видеопередатчиков
const videoChannels = {
  '1.2G': [
    1165, 1125, 1085, 1045, 1258, 1286, 1324, 1362
  ],
  '1.3G': [
    1080, 1120, 1160, 1200, 1240, 1258, 1280, 1320
  ],
  '2.4G': [
    2412, 2437, 2462, 2472, 2484, 5740, 5760, 5780, 5800
  ],
  '5.8G-A': [5865, 5845, 5825, 5805, 5785, 5765, 5745, 5725],
  '5.8G-B': [5733, 5752, 5771, 5790, 5809, 5828, 5847, 5866],
  '5.8G-E': [5705, 5685, 5665, 5645, 5885, 5905, 5925, 5945],
  '5.8G-F': [5740, 5760, 5780, 5800, 5820, 5840, 5860, 5880],
  '5.8G-R': [5658, 5695, 5732, 5769, 5806, 5843, 5880, 5917],
  '5.8G-L': [
    { name: 'L-1', f: 5362 },
    { name: 'L-2', f: 5399 },
    { name: 'L-3', f: 5436 },
    { name: 'L-4', f: 5473 },
    { name: 'L-5', f: 5510 },
    { name: 'L-6', f: 5547 },
    { name: 'L-7', f: 5584 },
    { name: 'L-8', f: 5621 }
  ],
  '3.3G': [
    3300, 3320, 3340, 3360, 3380, 3400, 3420, 3440
  ],
  '900M': [
    910, 920, 930, 940, 950, 960, 970, 980
  ],
  '800M': [
    810, 820, 830, 840, 850, 860, 870, 880
  ]
};

// вспомогательные функции
function isOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}

function fmt(n) {
  return Number(n).toFixed(3).replace(/\.000$/, '');
}

// --- синхронизация полей ---
function syncFromRange() {
  const start = parseFloat(document.getElementById('start_freq').value);
  const end = parseFloat(document.getElementById('end_freq').value);
  if (!isNaN(start) && !isNaN(end)) {
    if (end > start) {
      const center = (start + end) / 2;
      const bw = end - start;
      document.getElementById('center_freq').value = fmt(center);
      document.getElementById('bandwidth').value = fmt(bw);
    }
  }
}

function syncFromCenter() {
  const center = parseFloat(document.getElementById('center_freq').value);
  const bw = parseFloat(document.getElementById('bandwidth').value);
  if (!isNaN(center) && !isNaN(bw) && bw > 0) {
    const start = center - bw / 2;
    const end = center + bw / 2;
    document.getElementById('start_freq').value = fmt(start);
    document.getElementById('end_freq').value = fmt(end);
  }
}

// обработчики полей ввода
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start_freq').addEventListener('input', syncFromRange);
  document.getElementById('end_freq').addEventListener('input', syncFromRange);
  document.getElementById('center_freq').addEventListener('input', syncFromCenter);
  document.getElementById('bandwidth').addEventListener('input', syncFromCenter);
});

// === основной расчёт ===
function calculateHarmonics() {
  const dirtyEl = document.getElementById('dirty-results');
  const cleanEl = document.getElementById('clean-results');
  dirtyEl.innerHTML = '';
  cleanEl.innerHTML = '';

  const maxHarm = 30;

  const bw = parseFloat(document.getElementById('bandwidth').value);
  const startInput = parseFloat(document.getElementById('start_freq').value);
  const endInput = parseFloat(document.getElementById('end_freq').value);
  const centerInput = parseFloat(document.getElementById('center_freq').value);

  // --- проверки ввода ---
  if (!isNaN(startInput) && !isNaN(endInput)) {
    if (startInput >= endInput) {
      dirtyEl.innerHTML = '<div class="text-warning">Ошибка: начальная частота должна быть ниже конечной.</div>';
      return;
    }
  }
  if (isNaN(bw) || bw <= 0) {
    dirtyEl.innerHTML = '<div class="text-warning">Ошибка: ширина канала должна быть больше нуля.</div>';
    return;
  }

  let rangeStart, rangeEnd;
  if (!isNaN(startInput) && !isNaN(endInput) && endInput > startInput) {
    rangeStart = startInput;
    rangeEnd = endInput;
  } else if (!isNaN(centerInput) && !isNaN(bw) && bw > 0) {
    rangeStart = centerInput - bw / 2;
    rangeEnd = centerInput + bw / 2;
  } else {
    dirtyEl.innerHTML = '<div class="text-warning">Ошибка: задайте диапазон (start/end) или центр+ширину.</div>';
    return;
  }

  // --- ПРАВИЛЬНЫЙ РАСЧЕТ ГАРМОНИК ---
  // Гармоника #1: диапазон × 2
  // Гармоника #2: диапазон × 3
  // Гармоника #5: диапазон × 6
  const harmonics = [];
  for (let n = 1; n <= maxHarm; n++) {
    const multiplier = n + 1; // гармоника #n = умножение на (n+1)
    const harmStart = rangeStart * multiplier;
    const harmEnd = rangeEnd * multiplier;
    
    harmonics.push({
      n: n, // гармоника #1, #2, #3 и т.д.
      start: harmStart,
      end: harmEnd
    });
  }

  checkChannels(harmonics, bw, dirtyEl, cleanEl);
}

// === проверка каналов на пересечение ===
function checkChannels(harmonics, bw, dirtyEl, cleanEl) {
  const dirtyList = [];
  const cleanList = [];

  for (const [band, arr] of Object.entries(videoChannels)) {
    arr.forEach((entry, idx) => {
      let name, freq;
      if (typeof entry === 'object') {
        name = entry.name;
        freq = entry.f;
      } else {
        name = `${band}-${idx + 1}`;
        freq = entry;
      }

      const chStart = freq - bw / 2;
      const chEnd = freq + bw / 2;

      const overlaps = harmonics.filter(h => isOverlap(h.start, h.end, chStart, chEnd));

      if (overlaps.length > 0) {
        dirtyList.push({ band, name, freq, overlaps });
      } else {
        cleanList.push({ band, name, freq });
      }
    });
  }

  // вывод грязных (по гармоникам в порядке)
  if (dirtyList.length === 0) {
    dirtyEl.innerHTML = '<div class="text-success">Нет каналов с гармониками.</div>';
  } else {
    const byHarm = {};
    dirtyList.forEach(d => {
      d.overlaps.forEach(o => {
        if (!byHarm[o.n]) byHarm[o.n] = [];
        byHarm[o.n].push({ 
          channel: `${d.name} (${d.freq} MHz)`, 
          range: o,
          band: d.band
        });
      });
    });

    const frag = document.createElement('div');
    Object.keys(byHarm).map(Number).sort((a, b) => a - b).forEach(n => {
      const hdr = document.createElement('div');
      hdr.className = 'mt-3 mb-2 p-2 bg-dark rounded';
      hdr.innerHTML = `<strong class="text-warning">Гармоника #${n}</strong> 
        <small class="text-muted">(${fmt(harmonics[n-1].start)}–${fmt(harmonics[n-1].end)} MHz)</small>`;
      frag.appendChild(hdr);

      // Группируем по диапазонам
      const byBand = {};
      byHarm[n].forEach(it => {
        if (!byBand[it.band]) byBand[it.band] = [];
        byBand[it.band].push(it);
      });

      Object.keys(byBand).sort().forEach(band => {
        const bandHeader = document.createElement('div');
        bandHeader.className = 'small text-muted mb-1';
        bandHeader.textContent = `Диапазон ${band}:`;
        frag.appendChild(bandHeader);

        byBand[band].forEach(it => {
          const row = document.createElement('div');
          row.className = 'mb-1 ps-3';
          row.innerHTML = `<span class="badge bg-danger me-2">${it.channel}</span>`;
          frag.appendChild(row);
        });
      });
    });
    dirtyEl.appendChild(frag);
  }

  // вывод чистых
  if (cleanList.length === 0) {
    cleanEl.innerHTML = '<div class="text-muted">Нет чистых каналов.</div>';
  } else {
    const grouped = {};
    cleanList.forEach(c => {
      if (!grouped[c.band]) grouped[c.band] = [];
      grouped[c.band].push(c);
    });

    const frag2 = document.createElement('div');
    Object.keys(grouped).sort().forEach(b => {
      const hdr = document.createElement('div');
      hdr.className = 'mt-3 mb-2';
      hdr.innerHTML = `<strong class="text-success">Диапазон ${b}</strong>`;
      frag2.appendChild(hdr);

      const channelsContainer = document.createElement('div');
      channelsContainer.className = 'd-flex flex-wrap gap-2 mb-3';
      
      grouped[b].forEach(c => {
        const el = document.createElement('span');
        el.className = 'badge bg-success';
        el.textContent = `${c.name} (${c.freq} MHz)`;
        channelsContainer.appendChild(el);
      });
      
      frag2.appendChild(channelsContainer);
    });
    cleanEl.appendChild(frag2);
  }

  // переключаем вкладку
  try {
    if (dirtyList.length > 0) {
      new bootstrap.Tab(document.getElementById('dirty-tab')).show();
    } else {
      new bootstrap.Tab(document.getElementById('clean-tab')).show();
    }
  } catch (e) {
    console.log('Bootstrap Tab error:', e);
  }
}



