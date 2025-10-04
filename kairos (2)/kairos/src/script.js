document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;
});

function getLikelihoodLevel(probability) {
  if (probability < 30)
    return { label: 'LOW', colorClass: 'text-low bg-low', emoji: '✅' };
  if (probability < 65)
    return { label: 'MODERATE', colorClass: 'text-moderate bg-moderate', emoji: '⚠️' };
  return { label: 'HIGH', colorClass: 'text-high bg-high', emoji: '🚨' };
}

function locationToLat(locationText) {
  const normalized = locationText.toLowerCase().trim();
  switch (true) {
    case normalized.includes('equator'):
    case normalized.includes('singapore'):
    case normalized.includes('bogota'):
    case normalized.includes('amazon'):
      return 5;
    case normalized.includes('new york'):
    case normalized.includes('london'):
    case normalized.includes('paris'):
      return 45;
    case normalized.includes('dubai'):
    case normalized.includes('phoenix'):
      return 30;
    case normalized.includes('antarctic'):
    case normalized.includes('ushuaia'):
      return -55;
    default:
      console.log(`Location "${locationText}" unrecognized. Defaulting to Latitude 40.7.`);
      return 40.7;
  }
}

function calculateLikelihood(lat, date) {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const absLat = Math.abs(lat);
  const isNorthern = lat >= 0;
  let seasonalFactor = 0.5;
  const PI = Math.PI;

  if (isNorthern)
    seasonalFactor = (Math.sin((month - 4) / 6 * PI) + 1) / 2;
  else
    seasonalFactor = (Math.sin((month + 2) / 6 * PI) + 1) / 2;

  seasonalFactor = Math.min(1, Math.max(0, seasonalFactor));

  const polarFactor = absLat / 90;
  const equatorialFactor = 1 - polarFactor;
  let results = {};

  let hotProb = seasonalFactor * 65 + equatorialFactor * 35;
  let coldProb = (1 - seasonalFactor) * 65 + polarFactor * 35;
  let wetProb = equatorialFactor * 40 + seasonalFactor * 30 + Math.random() * 30;
  let windProb = Math.sin(polarFactor * PI * 2) * 30 + polarFactor * 20 + 30 + Math.random() * 20;
  let uncomfortableProb = hotProb * 0.4 + wetProb * 0.4 + 20 + Math.random() * 10;

  const probabilities = { hotProb, coldProb, wetProb, windProb, uncomfortableProb };
  for (const key in probabilities)
    probabilities[key] = Math.min(100, Math.max(0, probabilities[key] + (Math.random() * 20 - 10)));

  if (probabilities.hotProb > 70 && probabilities.coldProb > 70) {
    if (seasonalFactor > 0.5) probabilities.coldProb *= 0.3;
    else probabilities.hotProb *= 0.3;
  }

  results = [
    { name: 'Very Hot', prob: probabilities.hotProb, ...getLikelihoodLevel(probabilities.hotProb) },
    { name: 'Very Cold', prob: probabilities.coldProb, ...getLikelihoodLevel(probabilities.coldProb) },
    { name: 'Very Windy', prob: probabilities.windProb, ...getLikelihoodLevel(probabilities.windProb) },
    { name: 'Very Wet (Precipitation)', prob: probabilities.wetProb, ...getLikelihoodLevel(probabilities.wetProb) },
    { name: 'Very Uncomfortable (Humidity/Heat)', prob: probabilities.uncomfortableProb, ...getLikelihoodLevel(probabilities.uncomfortableProb) }
  ];

  return results;
}

function handleQuery() {
  const locationInput = document.getElementById('location');
  const dateInput = document.getElementById('date');
  const locationText = locationInput.value;
  const date = dateInput.value;

  if (!locationText || !date) {
    console.error('Validation failed: Please enter a location and date.');
    return;
  }

  const lat = locationToLat(locationText);
  document.getElementById('placeholder-card').style.display = 'none';
  document.getElementById('results-card').style.display = 'block';
  document.getElementById('location-display').textContent = `// DATA LOG: ${locationText} (${date})`;

  const resultsDisplay = document.getElementById('results-display');
  resultsDisplay.innerHTML = '<p class="text-center py-4 text-red-500 font-medium">// RUNNING SIMULATION...</p>';

  setTimeout(() => {
    const results = calculateLikelihood(lat, date);
    resultsDisplay.innerHTML = '';

    results.forEach(item => {
      const resultHtml = `
        <div class="likelihood-item flex justify-between items-center ${item.colorClass}">
          <div class="flex items-center space-x-3">
            <span class="text-2xl">${item.emoji}</span>
            <span class="font-semibold text-gray-100">${item.name}</span>
          </div>
          <div class="text-right">
            <span class="font-extrabold text-lg ${item.colorClass.split(' ')[0]}">${item.label}</span>
            <span class="text-sm text-gray-400 ml-2">(${item.prob.toFixed(1)}% LIKELIHOOD)</span>
          </div>
        </div>
      `;
      resultsDisplay.innerHTML += resultHtml;
    });
  }, 800);
}