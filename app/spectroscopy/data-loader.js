/**
 * data-loader.js — Load NMR data JSON and filter by settings
 */

/**
 * Load NMR database from a JSON file.
 * @param {string} url - Path to nmr_data.json
 * @returns {Promise<object>}
 */
function loadNmrData(url) {
  return fetch(url)
    .then(function (response) {
      if (!response.ok) throw new Error('Failed to load NMR data: ' + response.statusText);
      return response.json();
    });
}

/**
 * Filter the NMR database by game settings.
 * Returns only formulas whose C/H counts fall within range and have
 * at least numStructures usable structures.
 *
 * @param {object} data - Full NMR database (formula -> entry)
 * @param {object} settings - GameSetting
 * @returns {{ allFormulas: string[], filteredFormulas: string[], entries: object[] }}
 */
function filterData(data, settings) {
  var result = [];

  Object.keys(data).forEach(function (formula) {
    var entry = data[formula];
    var counts = parseFormula(formula);
    var c = counts['C'] || 0;
    var h = counts['H'] || 0;

    if (c < settings.carbonMin || c > settings.carbonMax) return;
    if (h < settings.hydrogenMin || h > settings.hydrogenMax) return;

    var hnmrList = entry['HNMR'] || [];
    var cnList = entry['CNMR'] || [];
    var usable = [];

    for (var i = 0; i < entry['SDBS'].length; i++) {
      var hnmr = hnmrList[i];
      var cn = cnList[i];
      var hasH = hnmr && Object.keys(hnmr).length > 0;
      var hasC = cn && cn.length > 0;
      if (hasH && hasC) usable.push(i);
    }

    if (usable.length >= settings.numStructures) {
      result.push({
        formula: formula,
        formulaData: entry,
        usableStructures: usable,
      });
    }
  });

  return {
    allFormulas: Object.keys(data),
    filteredFormulas: result.map(function (r) { return r.formula; }),
    entries: result,
  };
}

/**
 * Pick random structures from the filtered data for a game round.
 *
 * @param {{ entries: object[] }} filteredResult - Result from filterData()
 * @param {object} settings - GameSetting
 * @returns {object|null}
 */
function pickGameRound(filteredResult, settings) {
  var entries = filteredResult.entries;
  if (entries.length === 0) return null;

  var entry = entries[Math.floor(Math.random() * entries.length)];
  var usable = entry.usableStructures;
  var numPicks = Math.min(settings.numStructures, usable.length);
  var indices = shuffle(usable).slice(0, numPicks);

  var structures = indices.map(function (idx) {
    var hnmr = entry.formulaData['HNMR'][idx];
    var cn = entry.formulaData['CNMR'][idx];
    // Pick the highest HNMR frequency
    var freqs = Object.keys(hnmr).map(Number).sort(function (a, b) { return b - a; });
    var freq = String(freqs[0]);
    return {
      sdbs: entry.formulaData['SDBS'][idx],
      formula: entry.formula,
      hnmrFreq: freq,
      hnmrPeaks: hnmr[freq],
      cnmrPeaks: cn,
    };
  });

  return { formula: entry.formula, structures: structures };
}

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}
