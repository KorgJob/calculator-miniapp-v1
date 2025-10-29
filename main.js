// Конвертация дБм → Вт
function dbmToW(dbm) {
  return Math.pow(10, (dbm - 30) / 10);
}

// Конвертация Вт → дБм
function wToDbm(watt) {
  return 10 * Math.log10(watt) + 30;
}

// Валидация целых чисел для усиления антенн
function validateIntegerInput(value, fieldName) {
    if (value === '' || isNaN(value)) {
        return { isValid: false, message: `Введите числовое значение для ${fieldName}` };
    }
    
    const numValue = parseFloat(value);
    
    // Проверяем что число целое
    if (!Number.isInteger(numValue)) {
        const nearestInt = Math.round(numValue);
        return { 
            isValid: false, 
            message: `Для ${fieldName} разрешены только целые числа. Используйте ${nearestInt} вместо ${value}`,
            nearestValue: nearestInt
        };
    }
    
    return { isValid: true, value: numValue };
}

// Синхронизация полей мощности
document.getElementById('p_tx_dbm').addEventListener('input', function() {
  const dbm = parseFloat(this.value);
  if (!isNaN(dbm)) {
    document.getElementById('p_tx_w').value = dbmToW(dbm).toFixed(3);
  }
});

document.getElementById('p_tx_w').addEventListener('input', function() {
  const watt = parseFloat(this.value);
  if (!isNaN(watt) && watt > 0) {
    document.getElementById('p_tx_dbm').value = wToDbm(watt).toFixed(1);
  }
});

// Функция для показа ошибки
function showError(field, message) {
    // Убираем старую ошибку
    hideError(field);
    
    // Добавляем класс ошибки к полю
    field.classList.add('is-invalid');
    
    // Создаем элемент с ошибкой
    const errorElement = document.createElement('div');
    errorElement.className = 'invalid-feedback d-block';
    errorElement.textContent = message;
    errorElement.style.color = '#ef4444';
    errorElement.style.fontSize = '0.8rem';
    
    // Вставляем ошибку после поля
    field.parentNode.appendChild(errorElement);
}

// Функция для скрытия ошибки
function hideError(field) {
    field.classList.remove('is-invalid');
    const existingError = field.parentNode.querySelector('.invalid-feedback');
    if (existingError) {
        existingError.remove();
    }
}

// Валидация полей усиления при изменении
document.getElementById('g_tx').addEventListener('input', function() {
    const validation = validateIntegerInput(this.value, 'усиления передатчика');
    if (!validation.isValid) {
        showError(this, validation.message);
        // Автокоррекция
        if (validation.nearestValue !== undefined) {
            setTimeout(() => {
                this.value = validation.nearestValue;
                hideError(this);
            }, 1500);
        }
    } else {
        hideError(this);
    }
});

document.getElementById('g_rx').addEventListener('input', function() {
    const validation = validateIntegerInput(this.value, 'усиления приемника');
    if (!validation.isValid) {
        showError(this, validation.message);
        // Автокоррекция
        if (validation.nearestValue !== undefined) {
            setTimeout(() => {
                this.value = validation.nearestValue;
                hideError(this);
            }, 1500);
        }
    } else {
        hideError(this);
    }
});

// Основная функция расчета
function calculate() {
    const R = 6371000; 

    // Получаем значения
    const f = parseFloat(document.getElementById('freq').value);
    const h_tx = parseFloat(document.getElementById('h_tx').value);
    const h_rx = parseFloat(document.getElementById('h_rx').value);
    const p_tx = parseFloat(document.getElementById('p_tx_dbm').value);
    const sensitivity = parseFloat(document.getElementById('sensitivity').value);
    const loss_other = parseFloat(document.getElementById('loss_other').value);
    
    // Валидируем усиление антенн
    const g_tx_validation = validateIntegerInput(document.getElementById('g_tx').value, 'усиления передатчика');
    const g_rx_validation = validateIntegerInput(document.getElementById('g_rx').value, 'усиления приемника');
    
    // Сбрасываем все ошибки
    hideError(document.getElementById('g_tx'));
    hideError(document.getElementById('g_rx'));
    
    // Проверяем ошибки валидации
    let hasErrors = false;
    let errorMessage = '';
    
    if (!g_tx_validation.isValid) {
        showError(document.getElementById('g_tx'), g_tx_validation.message);
        errorMessage += `• ${g_tx_validation.message}<br>`;
        hasErrors = true;
    }
    
    if (!g_rx_validation.isValid) {
        showError(document.getElementById('g_rx'), g_rx_validation.message);
        errorMessage += `• ${g_rx_validation.message}<br>`;
        hasErrors = true;
    }
    
    if (hasErrors) {
        document.getElementById('result').innerHTML = `<span style="color: #ef4444;">${errorMessage}</span>`;
        return;
    }
    
    const g_tx = g_tx_validation.value;
    const g_rx = g_rx_validation.value;
    
    // Проверяем остальные поля
    if (isNaN(f) || isNaN(h_tx) || isNaN(h_rx) || isNaN(p_tx) || isNaN(sensitivity) || isNaN(loss_other)) {
        document.getElementById('result').innerHTML = '<span style="color: #ef4444;">Заполните все поля корректными числовыми значениями</span>';
        return;
    }
    
    // Проверяем положительные значения
    if (f <= 0 || h_tx <= 0 || h_rx <= 0) {
        document.getElementById('result').innerHTML = '<span style="color: #ef4444;">Частота и высоты должны быть положительными числами</span>';
        return;
    }

    // Расчет радиогоризонта
    const d_horizon = (Math.sqrt(2 * R * h_tx) + Math.sqrt(2 * R * h_rx)) / 1000;

    // Расчет энергетической дальности
    const ML = p_tx + g_tx + g_rx - sensitivity - loss_other; 
    const log_d = (ML - 32.44 - 20 * Math.log10(f)) / 20;
    const d_energy = Math.pow(10, log_d); 

    // Максимальная дальность
    const d_max = Math.min(d_horizon, d_energy);

    document.getElementById('result').innerHTML = `
        <div class="mb-2"><strong>Радиогоризонт:</strong> ${d_horizon.toFixed(2)} км</div>
        <div class="mb-2"><strong>Энергетическая дальность:</strong> ${d_energy.toFixed(2)} км</div>
        <div class="mb-2" style="color: #f3b84b;"><strong>Максимальная дальность:</strong> ${d_max.toFixed(2)} км</div>
    `;
}

// Добавляем CSS для ошибок
const style = document.createElement('style');
style.textContent = `
    .is-invalid {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 0.2rem rgba(239, 68, 68, 0.25) !important;
    }
    .invalid-feedback {
        display: block !important;
    }
`;
document.head.appendChild(style);


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




// 3 calculate
// 3
const filterCalculator = {
  BW_FIXED: 20,
  FMAX_MHZ: 7500,
  Y_MIN: -60,
  CHART_HEIGHT: 200,

  BPF_TABLE: [
    { fc: 1056, bw: 30 }, { fc: 1128, bw: 34 }, { fc: 1150, bw: 32 }, { fc: 1200, bw: 40 },
    { fc: 1250, bw: 36 }, { fc: 1315, bw: 30 }, { fc: 1370, bw: 40 }, { fc: 1447, bw: 30 },
    { fc: 1500, bw: 40 }, { fc: 999, bw: 40 }
  ],
  BPF_WIDE: [
    { f1: 3100, f2: 3400, label: '3.1–3.4 ГГц' },
    { f1: 3700, f2: 4500, label: '3.7–4.5 ГГц' },
    { f1: 4900, f2: 6000, label: '4.9–6.0 ГГц' }
  ],
  LPF_TX_RECO: [
    { name: 'ФНЧ200', cut: 200 }, { name: 'ФНЧ300', cut: 300 }, { name: 'ФНЧ400', cut: 400 },
    { name: 'ФНЧ500', cut: 500 }, { name: 'ФНЧ600', cut: 600 }, { name: 'ФНЧ800', cut: 800 },
    { name: 'ФНЧ1000', cut: 1000 }, { name: 'ФНЧ1400', cut: 1400 }, { name: 'ФНЧ3500', cut: 3500 }
  ],
  HPF_RX_RECO: [
    { name: 'ФВЧ1000', cut: 1000, forCenter: 1200 },
    { name: 'ФВЧ1200', cut: 1200, forCenter: 1500 },
    { name: 'ФВЧ3100', cut: 3100, forCenter: 3300 },
    { name: 'ФВЧ4500', cut: 4500, forCenter: 4900 },
    { name: 'ФВЧ5500', cut: 5500, forCenter: 5800 }
  ],

  $(id){ return document.getElementById(id); },
  db(x){ if (x < 1e-6) x = 1e-6; return 20*Math.log10(x); },
  overlap(a1,a2,b1,b2){ const x0=Math.max(a1,b1), x1=Math.min(a2,b2); return (x1>x0)?[x0,x1]:null; },

  traceIndex: { 
    before:{video:{}, ctrl:{}}, 
    after:{video:{}, ctrl:{}}, 
    filters:{ after:{ video:[], rx:[], ctrl:[] } } 
  },

  makeSpectrum(f0){
    const arr = [];
    if (!f0 || f0 <= 0) return arr;
    const hmax = Math.floor(this.FMAX_MHZ / f0);
    for (let n=1; n<=hmax; n++){
      const fc=f0*n, bw=this.BW_FIXED*n, amp=1/Math.pow(n,1.25);
      arr.push({ n, fc, f1: fc-bw/2, f2: fc+bw/2, amp });
    }
    return arr;
  },

  pickBestLPF(f0){
    const need = f0 + this.BW_FIXED/2;
    let best = this.LPF_TX_RECO[this.LPF_TX_RECO.length-1];
    for (const opt of this.LPF_TX_RECO){ if (opt.cut >= need){ best = opt; break; } }
    return best;
  },

  pickBPFforVideo(f){
    let best=null, dBest=1e9;
    for (const x of this.BPF_TABLE){
      const vL=f-this.BW_FIXED/2, vR=f+this.BW_FIXED/2;
      const bL=x.fc-x.bw/2, bR=x.fc+x.bw/2;
      if (this.overlap(vL,vR,bL,bR)){ const d=Math.abs(f-x.fc); if (d<dBest){ dBest=d; best={type:'bpf', f1:bL,f2:bR, label:`ППФ ${x.fc}/${x.bw} МГц`}; } }
    }
    if (best) return best;
    for (const r of this.BPF_WIDE){ if (f>=r.f1 && f<=r.f2){ return {type:'bpf', f1:r.f1, f2:r.f2, label:`ППФ ${r.label}`}; } }
    const lpf = this.pickBestLPF(f);
    return { type:'lpf', fc:lpf.cut, label:`${lpf.name} (срез ~${lpf.cut} МГц)` };
  },

  pickHPFforRX(f){
    let best = this.HPF_RX_RECO[0], dBest = Math.abs(f-best.forCenter);
    for (let i=1;i<this.HPF_RX_RECO.length;i++){
      const d = Math.abs(f-this.HPF_RX_RECO[i].forCenter);
      if (d<dBest){ dBest=d; best=this.HPF_RX_RECO[i]; }
    }
    return best;
  },

  bandTrace(name,f1,f2,levelDb,color,alpha=0.25){
    return {
      x:[f1,f1,f2,f2], y:[this.Y_MIN,levelDb,levelDb,this.Y_MIN],
      type:'scatter', mode:'lines', fill:'toself',
      line:{ color, width:1 }, fillcolor: color.replace('1)', `${alpha})`),
      name, hovertemplate: name+'<br>%{x:.0f} МГц<br>'+levelDb.toFixed(1)+' дБ<extra></extra>',
      visible: true
    };
  },

  conflictTrace(f1,f2){
    return {
      x:[f1,f1,f2,f2], y:[this.Y_MIN,0,0,this.Y_MIN],
      type:'scatter', mode:'lines', fill:'toself',
      line:{ color:'rgba(239,68,68,1)', width:0 },
      fillcolor:'rgba(239,68,68,0.35)',
      name:'⚠ конфликт', hovertemplate:'⚠ конфликт<br>%{x:.0f}–%{x:.0f} МГц<extra></extra>',
      visible: true
    };
  },

  layout(title,xmax){
    return {
      title:{ text:title, font:{ size:16, color:'#f3b84b', family:'Arial, sans-serif' }, x:0.05 },
      margin:{ l:60, r:30, b:40, t:40 },
      height: this.CHART_HEIGHT,
      paper_bgcolor:'rgba(28,27,25,0.9)', plot_bgcolor:'rgba(28,27,25,0.9)',
      xaxis:{ title:{ text:'' }, range:[0,xmax], gridcolor:'rgba(243,184,75,0.2)',
              zerolinecolor:'rgba(243,184,75,0.3)', tickfont:{ color:'#ccc', size:10 },
              color:'#fff', showline:true, linecolor:'rgba(243,184,75,0.3)' },
      yaxis:{ title:{ text:'Уровень, дБ', font:{ color:'#f3b84b', size:12 } },
              range:[this.Y_MIN,0], gridcolor:'rgba(243,184,75,0.2)', zerolinecolor:'rgba(243,184,75,0.3)',
              tickfont:{ color:'#ccc', size:10 }, color:'#fff', showline:true, linecolor:'rgba(243,184,75,0.3)' },
      showlegend: false,
      font:{ color:'#fff', family:'Arial, sans-serif' },
      hoverlabel:{ bgcolor:'rgba(28,27,25,0.9)', bordercolor:'#f3b84b', font:{ color:'#fff' } }
    };
  },

  setHarmonicVisibility(type, n, visible){
    const beforeIdxs = this.traceIndex.before[type][n] || [];
    const afterIdxs  = this.traceIndex.after[type][n]  || [];
    if (beforeIdxs.length){ beforeIdxs.forEach(i => Plotly.restyle('filter_chartBefore', { visible }, [i ])); }
    if (afterIdxs.length){  afterIdxs.forEach(i  => Plotly.restyle('filter_chartAfter',  { visible }, [i ])); }
  },

  setFilterVisibility(kind, visible){
    const idxs = this.traceIndex.filters.after[kind] || [];
    if (idxs.length){ idxs.forEach(i => Plotly.restyle('filter_chartAfter', { visible }, [i ])); }
  },

  ensureFiltersPanel(){
    let panel = document.getElementById('filters-panel');
    if (panel) return panel;
    const calcRoot = document.querySelector('.filter-calculator');
    if (!calcRoot) return null;

    panel = document.createElement('div');
    panel.className = 'harmonics-panel';
    panel.id = 'filters-panel';
    panel.innerHTML = `
      <div class="harmonics-title"><i class="fas fa-filter me-2"></i>Фильтры</div>
      <div id="filters-list" class="harmonics-list"></div>
    `;
    const charts = calcRoot.querySelector('.filter-charts-mobile');
    if (charts) charts.after(panel); else calcRoot.appendChild(panel);
    return panel;
  },

  getHarmonicsPanel(){
    const calcRoot = document.querySelector('.filter-calculator');
    if (!calcRoot) return null;
    let panel = calcRoot.querySelector('#harmonics-panel');
    if (panel) return panel;
    const byContent = calcRoot.querySelector('#harmonics-video');
    if (byContent){
      panel = byContent.closest('.harmonics-panel');
      if (panel) panel.id = 'harmonics-panel';
    }
    return panel;
  },

  arrangeOrder(){
    const root = document.querySelector('.filter-calculator');
    const chartsWrap = root?.querySelector('.filter-charts-mobile');
    if (!root || !chartsWrap) return;
    const beforeEl = this.$('filter_chartBefore');
    const afterEl  = this.$('filter_chartAfter');
    const harmPanel = this.getHarmonicsPanel();
    const filtersPanel = this.ensureFiltersPanel();
    if (beforeEl) chartsWrap.insertBefore(beforeEl, chartsWrap.firstChild);
    if (harmPanel) chartsWrap.insertBefore(harmPanel, afterEl || null);
    if (afterEl) chartsWrap.appendChild(afterEl);
    if (filtersPanel) root.insertBefore(filtersPanel, chartsWrap.nextSibling);
  },

  buildFilterButtons(filtVideo, hpfRx, filtCtrl){
    const panel = this.ensureFiltersPanel();
    const list = document.getElementById('filters-list');
    if (!panel || !list) return;
    list.innerHTML = '';

    const items = [
      { kind:'video', label:`Видео-TX: ${filtVideo.label}` },
      { kind:'rx',    label:`Видео-RX: ${hpfRx.name} (срез ≈ ${hpfRx.cut} МГц)` },
      { kind:'ctrl',  label:`Управление-TX: ${filtCtrl.name} (срез ≈ ${filtCtrl.cut} МГц)` },
    ];

    items.forEach(({kind,label}) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'harm-btn on';
      btn.textContent = label;
      btn.setAttribute('aria-pressed','true');
      btn.addEventListener('click', () => {
        const isOn = btn.classList.contains('on');
        btn.classList.toggle('on', !isOn);
        btn.classList.toggle('off', isOn);
        btn.setAttribute('aria-pressed', String(!isOn));
        this.setFilterVisibility(kind, !isOn);
      });
      list.appendChild(btn);
    });
  },

  buildHarmonicsButtons(vPeaks, cPeaks){
    const videoBox = this.$('harmonics-video');
    const ctrlBox  = this.$('harmonics-ctrl');
    if (!videoBox || !ctrlBox) return;
    videoBox.innerHTML = ''; 
    ctrlBox.innerHTML  = '';

    const pickByN = (peaks) => {
      const byN = new Map();
      for (const p of peaks) if (!byN.has(p.n)) byN.set(p.n, p);
      return [...byN.values()].sort((a,b)=>a.n-b.n);
    };
    const vList = pickByN(vPeaks);
    const cList = pickByN(cPeaks);

    const makeBtn = (type, n, fc, f1, f2) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'harm-btn on';
      btn.dataset.type = type;
      btn.dataset.n = String(n);
      btn.setAttribute('aria-pressed', 'true');
      btn.title = `${n}× • ~${Math.round(f1)}–${Math.round(f2)} МГц`;
      btn.textContent = `${n}× • ${Math.round(fc)} МГц`;
      btn.addEventListener('click', () => {
        const isOn = btn.classList.contains('on');
        btn.classList.toggle('on', !isOn);
        btn.classList.toggle('off', isOn);
        btn.setAttribute('aria-pressed', String(!isOn));
        this.setHarmonicVisibility(type, n, !isOn);
      });
      return btn;
    };

    vList.forEach(p => videoBox.appendChild(makeBtn('video', p.n, p.fc, p.f1, p.f2)));
    cList.forEach(p =>  ctrlBox.appendChild(makeBtn('ctrl',  p.n, p.fc, p.f1, p.f2)));
  },

  run(){
    if (typeof Plotly === 'undefined'){
      this.$('filter_reco').innerHTML = 'Ошибка: библиотека графиков не загружена';
      return;
    }
    const fVideo = +this.$('filter_fVideo').value;
    const fCtrl  = +this.$('filter_fCtrl').value;
    const xmax   = +this.$('filter_xspan').value; // теперь может быть 3600
    if (isNaN(fVideo) || isNaN(fCtrl) || fVideo<=0 || fCtrl<=0){
      this.$('filter_reco').innerHTML = '<span style="color:#ef4444;">Ошибка: введите корректные частоты</span>';
      return;
    }

    const vPeaks = this.makeSpectrum(fVideo);
    const cPeaks = this.makeSpectrum(fCtrl);
    this.traceIndex = { 
      before:{video:{}, ctrl:{}}, 
      after:{video:{}, ctrl:{}}, 
      filters:{ after:{ video:[], rx:[], ctrl:[] } } 
    };

    // ---- ДО фильтра ----
    const before = [], conflBefore = [];
    const addIdx = (place, type, n, idx) => {
      const bucket = this.traceIndex[place][type];
      if (!bucket[n]) bucket[n] = [];
      bucket[n].push(idx);
    };

    vPeaks.forEach(p => {
      const name = `${p.n}× видео • ${Math.round(p.fc)} МГц`;
      const tr = this.bandTrace(name, p.f1, p.f2, this.db(p.amp), 'rgba(243, 184, 75, 1)', 0.25);
      before.push(tr);
      addIdx('before','video',p.n, before.length-1);
    });
    cPeaks.forEach(p => {
      const name = `${p.n}× упр. • ${Math.round(p.fc)} МГц`;
      const tr = this.bandTrace(name, p.f1, p.f2, this.db(p.amp), 'rgba(16, 185, 129, 1)', 0.25);
      before.push(tr);
      addIdx('before','ctrl',p.n, before.length-1);
    });

    if (vPeaks.length){
      const vFund = vPeaks[0];
      cPeaks.forEach(p => {
        const ov = this.overlap(p.f1,p.f2,vFund.f1,vFund.f2);
        if (ov) conflBefore.push(this.conflictTrace(ov[0], ov[1]));
      });
    }

    Plotly.newPlot('filter_chartBefore', before.concat(conflBefore), this.layout('До фильтра', xmax), {
      displayModeBar:true, displaylogo:false, modeBarButtonsToRemove:['pan2d','lasso2d','select2d'], responsive:true
    });

    // ---- ПОДБОР фильтров ----
    const filtVideo = this.pickBPFforVideo(fVideo);
    const filtCtrl  = this.pickBestLPF(fCtrl);
    const hpfRx     = this.pickHPFforRX(fVideo);

    // ---- ПОСЛЕ фильтра ----
    const after = [], conflAfter = [];

    if (filtVideo.type === 'bpf'){
      after.push(this.bandTrace(filtVideo.label, filtVideo.f1, filtVideo.f2, 0, 'rgba(243,184,75,1)', 0.12));
    } else {
      after.push(this.bandTrace(filtVideo.label, 0, filtVideo.fc, 0, 'rgba(243,184,75,1)', 0.12));
    }
    this.traceIndex.filters.after.video.push(after.length-1);

    after.push(this.bandTrace(hpfRx.name+' (RX)', hpfRx.cut, xmax, 0, 'rgba(243,184,75,1)', 0.08));
    this.traceIndex.filters.after.rx.push(after.length-1);

    after.push(this.bandTrace(filtCtrl.name, 0, filtCtrl.cut, 0, 'rgba(16,185,129,1)', 0.12));
    this.traceIndex.filters.after.ctrl.push(after.length-1);

    const gVideoTx = (f) => (filtVideo.type==='bpf' ? (f>=filtVideo.f1 && f<=filtVideo.f2) : (f<=filtVideo.fc)) ? 1 : 0;
    const gVideo   = (f) => gVideoTx(f) * (f >= hpfRx.cut ? 1 : 0);
    const gCtrl    = (f) => (f <= filtCtrl.cut) ? 1 : 0;

    vPeaks.forEach(p => {
      const g = Math.max(gVideo(p.f1), gVideo((p.f1+p.f2)/2), gVideo(p.f2));
      if (g>0){
        const name = `${p.n}× видео • ${Math.round(p.fc)} МГц`;
        const tr = this.bandTrace(name, p.f1, p.f2, this.db(p.amp*g), 'rgba(243,184,75,1)', 0.25);
        after.push(tr);
        const j = after.length-1;
        if (!this.traceIndex.after.video[p.n]) this.traceIndex.after.video[p.n]=[];
        this.traceIndex.after.video[p.n].push(j);
      }
    });

    const vPass = (filtVideo.type==='bpf') ? [filtVideo.f1, filtVideo.f2] : [0, filtVideo.fc];
    const vPassWithRx = this.overlap(vPass[0], vPass[1], hpfRx.cut, xmax);

    cPeaks.forEach(p => {
      const g = Math.max(gCtrl(p.f1), gCtrl((p.f1+p.f2)/2), gCtrl(p.f2));
      if (g>0){
        const name = `${p.n}× упр. • ${Math.round(p.fc)} МГц`;
        const tr = this.bandTrace(name, p.f1, p.f2, this.db(p.amp*g), 'rgba(16,185,129,1)', 0.25);
        after.push(tr);
        const j = after.length-1;
        if (!this.traceIndex.after.ctrl[p.n]) this.traceIndex.after.ctrl[p.n]=[];
        this.traceIndex.after.ctrl[p.n].push(j);

        if (vPassWithRx){
          const ov = this.overlap(p.f1,p.f2, vPassWithRx[0], vPassWithRx[1]);
          if (ov) conflAfter.push(this.conflictTrace(ov[0], ov[1]));
        }
      }
    });

    Plotly.newPlot('filter_chartAfter', after.concat(conflAfter), this.layout('После фильтра', xmax), {
      displayModeBar:true, displaylogo:false, modeBarButtonsToRemove:['pan2d','lasso2d','select2d'], responsive:true
    });

    // панели и кнопки
    this.buildHarmonicsButtons(vPeaks, cPeaks);
    this.buildFilterButtons(filtVideo, hpfRx, filtCtrl);
    this.arrangeOrder();

    // рекомендации — с заголовком и кнопкой
    const conflictStatus = conflAfter.length === 0
      ? '<span style="color:#10b981;"><i class="fas fa-check-circle me-1"></i>Конфликты устранены</span>'
      : `<span style="color:#ef4444;"><i class="fas fa-exclamation-triangle me-1"></i>Осталось конфликтов: ${conflAfter.length}</span>`;

    const header = `<div class="harmonics-title" style="margin-bottom:8px;"><i class="fas fa-sliders-h me-2"></i><b>Фильтры, рекомендуемые к установке</b></div>`;
    let txt = '';
    txt += `<div class="mb-2"><i class="fas fa-tv me-2"></i><b>Видео-TX:</b> ${filtVideo.label}</div>`;
    txt += `<div class="mb-2"><i class="fas fa-satellite-dish me-2"></i><b>Видео-RX:</b> ${hpfRx.name} (срез ≈ ${hpfRx.cut} МГц)</div>`;
    txt += `<div class="mb-2"><i class="fas fa-gamepad me-2"></i><b>Управление-TX:</b> ${filtCtrl.name} (срез ≈ ${filtCtrl.cut} МГц)</div>`;
    const cta = `<a href="https://sector-lab.ru/filters" target="_blank" rel="noopener noreferrer" class="btn btn-calc w-100 mt-3">Заказать фильтры</a>`;
    this.$('filter_reco').innerHTML = header + txt + `<div class="mt-3">${conflictStatus}</div>` + cta;
  },

  clear(){
    this.$('filter_fVideo').value = 1200;
    this.$('filter_fCtrl').value  = 868;
    this.$('filter_xspan').value  = 7500;
    this.$('filter_reco').innerHTML = '';
    const v = this.$('harmonics-video'); const c = this.$('harmonics-ctrl');
    if (v) v.innerHTML = ''; if (c) c.innerHTML = '';
    const fl = document.getElementById('filters-list'); if (fl) fl.innerHTML = '';
    Plotly.purge('filter_chartBefore');
    Plotly.purge('filter_chartAfter');
    this.$('filter_reco').innerHTML =
      '<div style="color:#f3b84b;"><i class="fas fa-info-circle me-2"></i>Параметры сброшены. Введите новые значения и нажмите "Подобрать фильтр"</div>';
  },

  init(){
    setTimeout(()=>{ if (this.$('filter_fVideo') && this.$('filter_fCtrl')) this.run(); }, 400);
    this.$('filter_fVideo').addEventListener('change', () => this.run());
    this.$('filter_fCtrl').addEventListener('change', () => this.run());
    this.$('filter_xspan').addEventListener('change', () => this.run());
  }
};

document.addEventListener('DOMContentLoaded', () => {
  filterCalculator.init();
  const acc = document.getElementById('collapseThree');
  if (acc){
    acc.addEventListener('shown.bs.collapse', () => {
      setTimeout(() => {
        if (typeof Plotly !== 'undefined'){
          Plotly.Plots.resize('filter_chartBefore');
          Plotly.Plots.resize('filter_chartAfter');
        }
      }, 150);
    });
  }
});


// глоссарий
(function(){
  const nav = document.querySelector('.gloss-nav');
  const groups = Array.from(document.querySelectorAll('.gloss-group'));
  if(!nav || !groups.length) return;

  function openGroup(id, withScroll=true){
    const target = document.querySelector(id);
    if(!target) return;
    groups.forEach(d => d.open = (d === target));
    if(withScroll){
      target.scrollIntoView({behavior:'smooth', block:'start'});
    }
    target.querySelector('.gloss-summary')?.focus({preventScroll:true});
  }

  nav.addEventListener('click', (e)=>{
    const a = e.target.closest('a[href^="#gl-"]');
    if(!a) return;
    e.preventDefault();
    openGroup(a.getAttribute('href'));
    history.replaceState(null, "", a.getAttribute('href'));
  });

 
  if(location.hash && location.hash.startsWith('#gl-')){
    openGroup(location.hash, false);
  }
})();







