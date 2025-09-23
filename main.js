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


// Калькулятор гаромник
/* Частоты видеоканалов (центры в MHz) */
const videoChannels = {
  A: [5865, 5845, 5825, 5805, 5785, 5765, 5745, 5725],
  B: [5733, 5752, 5771, 5790, 5809, 5828, 5847, 5866],
  E: [5705, 5685, 5665, 5645, 5885, 5905, 5925, 5945],
  F: [5740, 5760, 5780, 5800, 5820, 5840, 5860, 5880],
  R: [5658, 5695, 5732, 5769, 5806, 5843, 5880, 5917],
  L: [{name: 'L-1', f: 5362}, {name: 'L-2', f: 5399}, {name: 'L-7', f: 5584}, {name: 'L-8', f: 5621}]
};

function isOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}
function fmt(n){ return Number(n).toFixed(3).replace(/\.000$/, ''); }

function calculateHarmonics() {
  // элементы вывода
  const dirtyEl = document.getElementById('dirty-results');
  const cleanEl = document.getElementById('clean-results');
  // очистить
  dirtyEl.innerHTML = '';
  cleanEl.innerHTML = '';

  // чтение полей
  const txFreq = parseFloat(document.getElementById('tx_freq').value) || 433;
  const maxHarm = Math.max(1, Math.min(200, parseInt(document.getElementById('max_harm').value) || 20));
  const bwInput = parseFloat(document.getElementById('bandwidth').value);
  const startInput = parseFloat(document.getElementById('start_freq').value);
  const endInput = parseFloat(document.getElementById('end_freq').value);
  const centerInput = parseFloat(document.getElementById('center_freq').value);

  // валидный bw
  if (isNaN(bwInput) || bwInput <= 0) {
    dirtyEl.innerHTML = '<div class="text-warning">Ошибка: укажите корректную ширину канала (&gt;0).</div>';
    return;
  }
  const bw = bwInput;

  // диапазон (приоритет start/end)
  let rangeStart, rangeEnd;
  if (!isNaN(startInput) && !isNaN(endInput) && endInput > startInput) {
    rangeStart = startInput;
    rangeEnd = endInput;
  } else if (!isNaN(centerInput)) {
    rangeStart = centerInput - bw/2;
    rangeEnd = centerInput + bw/2;
  } else {
    dirtyEl.innerHTML = '<div class="text-warning">Ошибка: задайте диапазон (start/end) или центр+ширину.</div>';
    return;
  }

  // постройка гармоник
  const harmonics = [];
  for (let n = 1; n <= maxHarm; n++) {
    const center = txFreq * n;
    harmonics.push({
      n,
      center,
      start: center - bw/2,
      end: center + bw/2
    });
  }

  // проверка каналов
  const dirtyList = []; // {band, name, freq, overlaps: [{n, start,end}]}
  const cleanList = []; // {band, name, freq}

  for (const [band, arr] of Object.entries(videoChannels)) {
    arr.forEach((entry, idx) => {
      let name, freq;
      if (typeof entry === 'object') { name = entry.name; freq = entry.f; }
      else { name = `${band}-${idx+1}`; freq = entry; }

      const chStart = freq - bw/2;
      const chEnd = freq + bw/2;

      // если пользователь интересуется только отдельным диапазоном, мы продолжаем проверять каналы в таблице;
      // проверяем пересечения канала с гармониками
      const overlaps = harmonics.filter(h => isOverlap(h.start, h.end, chStart, chEnd))
                                .map(h => ({n: h.n, start: h.start, end: h.end}));

      if (overlaps.length > 0) {
        dirtyList.push({band, name, freq, overlaps});
      } else {
        cleanList.push({band, name, freq});
      }
    });
  }

  // вывод грязных, сгруппировать по гармоникам (удобно для чтения)
  if (dirtyList.length === 0) {
    dirtyEl.innerHTML = '<div class="text-success">Нет каналов, пересекающихся с гармониками (в выбранном диапазоне/ширине).</div>';
  } else {
    // сгруппируем по n
    const byHarm = {};
    dirtyList.forEach(d => {
      d.overlaps.forEach(o => {
        if (!byHarm[o.n]) byHarm[o.n] = [];
        byHarm[o.n].push({channel: `${d.name} (${d.freq} MHz)`, overlap: o});
      });
    });

    const frag = document.createElement('div');
    Object.keys(byHarm).sort((a,b)=>a-b).forEach(nKey => {
      const n = parseInt(nKey,10);
      const h = harmonics.find(hh => hh.n === n);
      const hdr = document.createElement('div');
      hdr.className = 'mt-2 mb-1';
      hdr.innerHTML = `<strong class="text-danger">Гармоника #${n} (${fmt(h.start)} – ${fmt(h.end)} MHz)</strong>`;
      frag.appendChild(hdr);

      byHarm[n].forEach(it => {
        const row = document.createElement('div');
        row.className = 'mb-1';
        row.innerHTML = `<span class="badge bg-danger me-2">${it.channel}</span> <small class="text-muted">пересечение: ${fmt(it.overlap.start)}–${fmt(it.overlap.end)} MHz</small>`;
        frag.appendChild(row);
      });
    });
    dirtyEl.appendChild(frag);
  }

  // вывод чистых — сгруппировать по band
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
      hdr.className = 'mt-2';
      hdr.innerHTML = `<strong class="text-success">Диапазон ${b}</strong>`;
      frag2.appendChild(hdr);
      const wrap = document.createElement('div');
      grouped[b].forEach(c => {
        const el = document.createElement('span');
        el.className = 'badge bg-success me-2 mb-2';
        el.textContent = `${c.name} (${c.freq} MHz)`;
        wrap.appendChild(el);
      });
      frag2.appendChild(wrap);
    });
    cleanEl.appendChild(frag2);
  }

  // авто-показ вкладки грязных, если есть
  try {
    if (dirtyList.length > 0) {
      new bootstrap.Tab(document.getElementById('dirty-tab')).show();
    } else {
      new bootstrap.Tab(document.getElementById('clean-tab')).show();
    }
  } catch (e) {}
}
