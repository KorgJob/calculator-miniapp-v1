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
// === Калькулятор гармоник (ограничение до 7300 MHz) ===

// Все частоты популярных видеопередатчиков
const videoChannels = {
  '1.2G': [
    1165, 1125, 1085, 1045, 1258, 1286, 1324, 1362
  ],
  '1.3G': [
    1080, 1120, 1160, 1200, 1240, 1258, 1280, 1320
  ],
  '2.4G': [
    2412, 2437, 2462, 2472, 2484
  ],
  '3.3G': [
    3300, 3320, 3340, 3360, 3380, 3400, 3420, 3440
  ],
  '5.2G': [
    5180, 5200, 5220, 5240, 5260, 5280, 5300, 5320
  ],
  '5.3G': [
    5500, 5520, 5540, 5560, 5580, 5600, 5620, 5640
  ],
  '5.6G': [
    5650, 5670, 5690, 5710, 5730, 5750, 5770, 5790
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
  '6.0G': [
    5955, 5975, 5995, 6015, 6035, 6055, 6075, 6095
  ],
  '6.5G': [
    6425, 6445, 6465, 6485, 6505, 6525, 6545, 6565
  ],
  '7.0G': [
    6850, 6870, 6890, 6910, 6930, 6950, 6970, 6990
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

  const maxFreqLimit = 7300; // Максимальная частота гармоник

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

  // --- ПРАВИЛЬНЫЙ РАСЧЕТ ГАРМОНИК с ограничением до 7300 MHz ---
  const harmonics = [];
  let n = 1;
  
  while (true) {
    const multiplier = n + 1;
    const harmStart = rangeStart * multiplier;
    const harmEnd = rangeEnd * multiplier;
    
    // Если гармоника превышает лимит - останавливаемся
    if (harmStart > maxFreqLimit) {
      break;
    }
    
    harmonics.push({
      n: n,
      start: harmStart,
      end: harmEnd
    });
    
    n++;
    
    // Защита от бесконечного цикла
    if (n > 100) break;
  }

  checkChannels(harmonics, bw, dirtyEl, cleanEl);
}

// === проверка каналов на пересечение ===
function checkChannels(harmonics, bw, dirtyEl, cleanEl) {
  const allHarmonicsList = [];
  const cleanList = [];

  // Минимальная частота для проверки пересечений - 1080 МГц
  const minCheckFreq = 1080;

  // Для каждой гармоники находим пересечения
  harmonics.forEach(h => {
    const overlaps = [];
    
    // Проверяем, находится ли гармоника выше минимальной частоты 1080 МГц
    const isAboveMinFreq = h.end >= minCheckFreq - bw / 2;
    
    if (isAboveMinFreq) {
      // Только для гармоник выше 1080 МГц проверяем пересечения
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

          // Проверяем только каналы выше 1080 МГц
          if (freq >= 1080) {
            const chStart = freq - bw / 2;
            const chEnd = freq + bw / 2;

            if (isOverlap(h.start, h.end, chStart, chEnd)) {
              overlaps.push({ band, name, freq });
            }
          }
        });
      }
    }

    // Добавляем гармонику в общий список
    allHarmonicsList.push({
      harmonic: h,
      overlaps: overlaps,
      isAboveMinFreq: isAboveMinFreq
    });
  });

  // Собираем список чистых каналов (без пересечений с любой гармоникой)
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

      // Только каналы выше 1080 МГц
      if (freq >= 1080) {
        const chStart = freq - bw / 2;
        const chEnd = freq + bw / 2;

        const hasAnyOverlap = harmonics.some(h => isOverlap(h.start, h.end, chStart, chEnd));
        
        if (!hasAnyOverlap) {
          cleanList.push({ band, name, freq });
        }
      }
    });
  }

  // ВЫВОД ВСЕХ ГАРМОНИК
  if (allHarmonicsList.length === 0) {
    dirtyEl.innerHTML = '<div class="text-success">Нет рассчитанных гармоник.</div>';
  } else {
    const frag = document.createElement('div');
    
    allHarmonicsList.forEach(item => {
      const h = item.harmonic;
      const overlaps = item.overlaps;
      const isAboveMinFreq = item.isAboveMinFreq;
      
      const hdr = document.createElement('div');
      hdr.className = 'mt-3 mb-2 p-2 bg-dark rounded';
      hdr.innerHTML = `<strong class="text-warning">Гармоника #${h.n}</strong> 
        <small class="text-muted">(${fmt(h.start)}–${fmt(h.end)} MHz)</small>`;
      frag.appendChild(hdr);

      if (!isAboveMinFreq) {
        // Для гармоник ниже 1080 МГц
        const belowMinMsg = document.createElement('div');
        belowMinMsg.className = 'small text-muted ps-3 mb-2';
        belowMinMsg.textContent = 'Нет пересечений с видеоканалами';
        frag.appendChild(belowMinMsg);
      } else {
        // Для гармоник выше 1080 МГц
        if (overlaps.length > 0) {
          // Сортируем каналы по частоте
          overlaps.sort((a, b) => a.freq - b.freq);

          // Выводим все каналы в один список
          overlaps.forEach(ov => {
            const row = document.createElement('div');
            row.className = 'mb-1 ps-3';
            row.innerHTML = `<span class="badge bg-danger me-2">${ov.freq} MHz</span>`;
            frag.appendChild(row);
          });
        } else {
          // Если пересечений нет, но гармоника выше 1080 МГц
          const noOverlapMsg = document.createElement('div');
          noOverlapMsg.className = 'small text-muted ps-3 mb-2';
          noOverlapMsg.textContent = 'Нет пересечений с видеоканалами';
          frag.appendChild(noOverlapMsg);
        }
      }
    });
    
    dirtyEl.appendChild(frag);
  }

  // вывод чистых каналов (только частоты выше 1080 МГц)
  if (cleanList.length === 0) {
    cleanEl.innerHTML = '<div class="text-muted">Нет чистых каналов.</div>';
  } else {
    const frag2 = document.createElement('div');
    
    // Собираем все чистые каналы в один список и сортируем по частоте
    const allCleanChannels = [];
    cleanList.forEach(c => {
      allCleanChannels.push({ freq: c.freq });
    });
    
    allCleanChannels.sort((a, b) => a.freq - b.freq);
    
    // Выводим все чистые каналы
    allCleanChannels.forEach(c => {
      const el = document.createElement('span');
      el.className = 'badge bg-success me-2 mb-2';
      el.textContent = `${c.freq} MHz`;
      frag2.appendChild(el);
    });
    
    cleanEl.appendChild(frag2);
  }

  // переключаем вкладку
  try {
    if (allHarmonicsList.some(item => item.overlaps.length > 0)) {
      new bootstrap.Tab(document.getElementById('dirty-tab')).show();
    } else {
      new bootstrap.Tab(document.getElementById('clean-tab')).show();
    }
  } catch (e) {
    console.log('Bootstrap Tab error:', e);
  }
}



