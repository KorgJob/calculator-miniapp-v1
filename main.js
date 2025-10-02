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
// === Калькулятор гармоник (разрешены одинаковые частоты + группировка чистых каналов) ===

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
    const center = (start + end) / 2;
    const bw = Math.max(0, end - start); // Ширина может быть 0
    document.getElementById('center_freq').value = fmt(center);
    document.getElementById('bandwidth').value = fmt(bw);
  }
}

function syncFromCenter() {
  const center = parseFloat(document.getElementById('center_freq').value);
  const bw = parseFloat(document.getElementById('bandwidth').value);
  if (!isNaN(center) && !isNaN(bw) && bw >= 0) { // Разрешена ширина 0
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
    if (startInput > endInput) { // Убрал >=, теперь можно start = end
      dirtyEl.innerHTML = '<div class="text-warning">Ошибка: начальная частота не может быть выше конечной.</div>';
      return;
    }
  }
  if (isNaN(bw) || bw < 0) { // Разрешена ширина 0
    dirtyEl.innerHTML = '<div class="text-warning">Ошибка: ширина канала не может быть отрицательной.</div>';
    return;
  }

  let rangeStart, rangeEnd;
  if (!isNaN(startInput) && !isNaN(endInput) && endInput >= startInput) { // Разрешено start = end
    rangeStart = startInput;
    rangeEnd = endInput;
  } else if (!isNaN(centerInput) && !isNaN(bw) && bw >= 0) { // Разрешена ширина 0
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
    const container = document.createElement('div');
    container.className = 'results-flex';

    allHarmonicsList.forEach(item => {
      const h = item.harmonic;
      const overlaps = item.overlaps;

      const block = document.createElement('div');
      block.className = 'harmonic-block';

      block.innerHTML = `
        <div class="harmonic-header">Гармоника #${h.n}
          <small class="harmonic-content">(${fmt(h.start)}–${fmt(h.end)} MHz)</small>
        </div>
      `;

      if (overlaps.length > 0) {
        overlaps.sort((a, b) => a.freq - b.freq);
        overlaps.forEach(ov => {
          const row = document.createElement('span');
          row.className = 'badge bg-danger me-1 mb-1';
          row.textContent = `${ov.freq} MHz`;
          block.appendChild(row);
        });
      } else {
        const noOverlapMsg = document.createElement('div');
        noOverlapMsg.className = 'no-overlap';
        noOverlapMsg.textContent = 'Нет пересечений с видеоканалами';
        block.appendChild(noOverlapMsg);
      }

      container.appendChild(block);
    });

    dirtyEl.appendChild(container);
  }

  // ВЫВОД ЧИСТЫХ ЧАСТОТ (разделение на Диапазоны и Каналы)
  if (cleanList.length === 0) {
    cleanEl.innerHTML = '<div class="text-muted">Нет чистых частот.</div>';
  } else {
    const container = document.createElement('div');
    container.className = 'clean-frequencies-container';
    container.style.cssText = `
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 20px;
      align-items: start;
    `;

    // Левый столбец - Диапазоны
    const rangesColumn = document.createElement('div');
    rangesColumn.className = 'ranges-column';
    
    const rangesTitle = document.createElement('div');
    rangesTitle.className = 'column-title mb-2';
    rangesTitle.innerHTML = '<strong>Диапазоны</strong>';
    rangesTitle.style.cssText = 'color: #f3b84b; font-size: 0.9rem; text-align: center;';
    rangesColumn.appendChild(rangesTitle);

    // Правый столбец - Каналы
    const channelsColumn = document.createElement('div');
    channelsColumn.className = 'channels-column';
    
    const channelsTitle = document.createElement('div');
    channelsTitle.className = 'column-title mb-2';
    channelsTitle.innerHTML = '<strong>Каналы</strong>';
    channelsTitle.style.cssText = 'color: #f3b84b; font-size: 0.9rem; text-align: center;';
    channelsColumn.appendChild(channelsTitle);

    // Разделительная линия
    const divider = document.createElement('div');
    divider.className = 'divider';
    divider.style.cssText = `
      width: 1px;
      background: #444;
      height: 100%;
      margin: 0 10px;
    `;

    // Собираем все чистые частоты и сортируем
    const allCleanFreqs = [];
    cleanList.forEach(c => allCleanFreqs.push(c.freq));
    allCleanFreqs.sort((a, b) => a - b);

    // Группируем частоты в диапазоны и отдельные каналы
    const ranges = [];
    const singleChannels = [];
    let currentRange = { start: allCleanFreqs[0], end: allCleanFreqs[0] };
    
    for (let i = 1; i < allCleanFreqs.length; i++) {
      // Если разница между текущей и предыдущей частотой <= 20 МГц - продолжаем диапазон
      if (allCleanFreqs[i] - allCleanFreqs[i-1] <= 20) {
        currentRange.end = allCleanFreqs[i];
      } else {
        // Разрыв больше 20 МГц - начинаем новый диапазон
        if (currentRange.start === currentRange.end) {
          // Если диапазон из одной частоты - добавляем в каналы
          singleChannels.push(currentRange.start);
        } else {
          // Если диапазон из нескольких частот - добавляем в диапазоны
          ranges.push(currentRange);
        }
        currentRange = { start: allCleanFreqs[i], end: allCleanFreqs[i] };
      }
    }
    
    // Обрабатываем последний диапазон
    if (currentRange.start === currentRange.end) {
      singleChannels.push(currentRange.start);
    } else {
      ranges.push(currentRange);
    }

    // Заполняем столбец Диапазоны
    ranges.forEach(range => {
      const rangeEl = document.createElement('div');
      rangeEl.className = 'range-item mb-2';
      rangeEl.innerHTML = `<span class="badge bg-success">${range.start}–${range.end} MHz</span>`;
      rangesColumn.appendChild(rangeEl);
    });

    // Заполняем столбец Каналы
    singleChannels.forEach(channel => {
      const channelEl = document.createElement('div');
      channelEl.className = 'channel-item mb-2';
      channelEl.innerHTML = `<span class="badge bg-success">${channel} MHz</span>`;
      channelsColumn.appendChild(channelEl);
    });

    // Если в одном из столбцов нет данных - показываем сообщение
    if (ranges.length === 0) {
      const noRangesMsg = document.createElement('div');
      noRangesMsg.className = 'text-muted small';
      noRangesMsg.textContent = 'Нет диапазонов';
      rangesColumn.appendChild(noRangesMsg);
    }

    if (singleChannels.length === 0) {
      const noChannelsMsg = document.createElement('div');
      noChannelsMsg.className = 'text-muted small';
      noChannelsMsg.textContent = 'Нет каналов';
      channelsColumn.appendChild(noChannelsMsg);
    }

    // Собираем контейнер
    container.appendChild(rangesColumn);
    container.appendChild(divider);
    container.appendChild(channelsColumn);

    cleanEl.appendChild(container);
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





