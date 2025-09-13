function calculate() {
  const R = 6371000; 

  const f = parseFloat(document.getElementById('freq').value);
  const h_tx = parseFloat(document.getElementById('h_tx').value);
  const h_rx = parseFloat(document.getElementById('h_rx').value);
  const p_tx = parseFloat(document.getElementById('p_tx').value);
  const g_tx = parseFloat(document.getElementById('g_tx').value);
  const g_rx = parseFloat(document.getElementById('g_rx').value);
  const sensitivity = parseFloat(document.getElementById('sensitivity').value);
  const loss_other = parseFloat(document.getElementById('loss_other').value);

 
  const d_horizon = (Math.sqrt(2 * R * h_tx) + Math.sqrt(2 * R * h_rx)) / 1000;

  
  const ML = p_tx + g_tx + g_rx - sensitivity - loss_other; 
  const log_d = (ML - 32.44 - 20 * Math.log10(f)) / 20;
  const d_energy = Math.pow(10, log_d); 

  
  const d_max = Math.min(d_horizon, d_energy);

  document.getElementById('result').innerHTML = `
    Радиогоризонт: ${d_horizon.toFixed(2)} км <br>
    Энергетическая дальность: ${d_energy.toFixed(2)} км <br>
    <span style="color: #f3b84b;">Максимальная дальность: ${d_max.toFixed(2)} км</span>
  `;
}