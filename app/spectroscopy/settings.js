/**
 * settings.js — GameSetting and settings panel logic
 *
 * HTML is static (in index.html); this file wires up events and provides
 * helpers for reading/writing settings and parsing formulas.
 */

var DEFAULT_SETTINGS = {
  carbonMin: 2,
  carbonMax: 8,
  hydrogenMin: 2,
  hydrogenMax: 18,
  numStructures: 4,
};

/**
 * Read current settings from the HTML form.
 */
function readSettings() {
  return {
    carbonMin: parseInt(document.getElementById('carbon-min').value, 10),
    carbonMax: parseInt(document.getElementById('carbon-max').value, 10),
    hydrogenMin: parseInt(document.getElementById('hydrogen-min').value, 10),
    hydrogenMax: parseInt(document.getElementById('hydrogen-max').value, 10),
    numStructures: parseInt(document.getElementById('num-structures').value, 10),
  };
}

/**
 * Sync the displayed range values with the slider positions.
 */
function updateSettingsDisplay() {
  document.getElementById('carbon-min-value').textContent =
    document.getElementById('carbon-min').value;
  document.getElementById('carbon-max-value').textContent =
    document.getElementById('carbon-max').value;
  document.getElementById('hydrogen-min-value').textContent =
    document.getElementById('hydrogen-min').value;
  document.getElementById('hydrogen-max-value').textContent =
    document.getElementById('hydrogen-max').value;
  document.getElementById('num-structures-value').textContent =
    document.getElementById('num-structures').value;
}

/**
 * Parse a molecular formula like "C4H8O2" into element counts.
 */
function parseFormula(formula) {
  var counts = {};
  var re = /([A-Z][a-z]*)(\d*)/g;
  var match;
  while ((match = re.exec(formula)) !== null) {
    var n = match[2] ? parseInt(match[2], 10) : 1;
    counts[match[1]] = n;
  }
  return counts;
}

/**
 * Wire up settings panel events.
 * @param {function} onChange — called as onChange(settings, isNewGame)
 */
function initSettings(onChange) {
  var rangeIds = ['carbon-min', 'carbon-max', 'hydrogen-min',
                  'hydrogen-max', 'num-structures'];

  rangeIds.forEach(function (id) {
    document.getElementById(id).addEventListener('input', function () {
      updateSettingsDisplay();
      if (onChange) onChange(readSettings(), false);
    });
  });

  document.getElementById('start-game-btn').addEventListener('click', function () {
    updateSettingsDisplay();
    if (onChange) onChange(readSettings(), true);
  });
}

/**
 * Update the "Available Data" info panel.
 */
function updateAvailableInfo(data, filteredCount) {
  var info = document.getElementById('available-structures-info');
  if (!info) return;
  if (!data) {
    info.textContent = 'No data loaded.';
    return;
  }
  var total = Object.keys(data).length;
  info.innerHTML =
    '<p>Total formulas in DB: <strong>' + total + '</strong></p>' +
    '<p>Matching current filter: <strong>' + filteredCount + '</strong></p>';
}
