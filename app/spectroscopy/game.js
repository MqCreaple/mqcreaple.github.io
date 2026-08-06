/**
 * game.js — Main game controller
 *
 * Coordinates loading data, filtering, selecting game rounds,
 * and managing the game UI for pairing and drawing modes.
 * UI skeletons live in index.html; only dynamic content is built here.
 */

function init() {
  initSettings(function (settings, isNewGame) {
    if (isNewGame && window.__nmrData) {
      startGame(settings);
    }
  });

  loadNmrData('./nmr_data.json')
    .then(function (data) {
      var s = readSettings();
      var filtered = filterData(data, s);
      updateAvailableInfo(data, filtered.filteredFormulas.length);
      window.__nmrData = data;
      window.__lastFiltered = filtered;
    })
    .catch(function (err) {
      console.error('Failed to load NMR data:', err);
    });
}

function startGame(settings) {
  var data = window.__nmrData;
  if (!data) return;

  var filtered = filterData(data, settings);
  window.__lastFiltered = filtered;
  updateAvailableInfo(data, filtered.filteredFormulas.length);

  if (filtered.entries.length === 0) {
    alert('No formulas match the current filter. Please adjust your settings.');
    return;
  }

  var round = pickGameRound(filtered, settings);
  console.log(round);
  if (!round) {
    alert('Not enough structures available. Try different settings.');
    return;
  }

  window.__currentRound = round;

  // Show/hide game areas
  document.getElementById('main-container').classList.add('hidden');
  document.getElementById('pairing-area').classList.add('hidden');

  renderPairingMode(round);
}

// ─── Pairing mode ───

function renderPairingMode(round) {
  var area = document.getElementById('pairing-area');
  area.classList.remove('hidden');

  // Clear previous reveal state
  document.getElementById('answer-reveal').classList.add('hidden');
  document.getElementById('answer-reveal').innerHTML = '';

  // Set title with subscript-formatted formula
  document.getElementById('pairing-title').innerHTML = toSubscript(round.formula);

  var structures = round.structures;
  var shuffledIndices = shuffle(structures.map(function (_, i) { return i; }));
  var selectedStructure = null;
  var selectedSpectrum = null;
  var matches = {};
  var incorrectPair = null;
  var revealedAll = false;

  function isSpectrumMatched(origIdx) {
    var keys = Object.keys(matches);
    for (var k = 0; k < keys.length; k++) {
      if (matches[keys[k]] === origIdx) return true;
    }
    return false;
  }

  function buildCards() {
    // ── Structure grid ──
    var structGrid = document.getElementById('structure-grid');
    var html = '';
    structures.forEach(function (s, i) {
      if (matches[i] !== undefined) {
        // Already matched — show greyed out placeholder
        html += '<div class="card matched"><h3>Structure ' + (i + 1) + '</h3>';
        html += '<div class="match-badge">&#10003; Matched</div></div>';
        return;
      }
      if (revealedAll) {
        // Revealed — unmatched structure is incorrect
        html += '<div class="card incorrect"><h3>Structure ' + (i + 1) + '</h3>';
        html += '<img class="structure-img" src="https://sdbs.db.aist.go.jp/API/ImageDisplayHandler.ashx?SdbsNo=' + s.sdbs + '&amp;FileType=Formula&amp;Format=New" alt="Structure ' + (i + 1) + '">';
        html += '<div class="incorrect-badge">&#10007; Incorrect</div></div>';
        return;
      }
      var sel = selectedStructure === i;
      var incorr = incorrectPair && incorrectPair.structure === i;
      var bothSel = sel && selectedSpectrum !== null;
      var cls = 'card clickable';
      if (bothSel) cls += ' selected matching';
      else if (sel) cls += ' selected';
      else if (incorr) cls += ' incorrect';

      html += '<div class="' + cls + '" data-structure-idx="' + i + '">';
      html += '<h3>Structure ' + (i + 1) + '</h3>';
      html += '<img class="structure-img" src="https://sdbs.db.aist.go.jp/API/ImageDisplayHandler.ashx?SdbsNo=' + s.sdbs + '&amp;FileType=Formula&amp;Format=New" alt="Structure ' + (i + 1) + '">';
      if (bothSel) html += '<div class="matching-badge">Match?</div>';
      else if (incorr) html += '<div class="incorrect-badge">&#10007; Incorrect</div>';
      html += '</div>';
    });
    structGrid.innerHTML = html;

    // ── Spectrum grid ──
    var specGrid = document.getElementById('spectrum-grid');
    var specHtml = '';
    shuffledIndices.forEach(function (origIdx, displayIdx) {
      if (isSpectrumMatched(origIdx)) {
        specHtml += '<div class="card matched"><h3>Spectrum ' + (displayIdx + 1) + '</h3>';
        specHtml += '<div class="match-badge">&#10003; Matched</div></div>';
        return;
      }
      if (revealedAll) {
        // Revealed — unmatched spectrum is incorrect, keep plots visible
        var s = structures[origIdx];
        specHtml += '<div class="card incorrect"><h3>Spectrum ' + (displayIdx + 1) + '</h3>';
        specHtml += '<div class="spectrum-plot-c13" id="spectrum-plot-c13-' + origIdx + '"></div>';
        specHtml += '<div class="spectrum-label"><sup>13</sup>C NMR</div>';
        specHtml += '<div class="spectrum-plot-h1" id="spectrum-plot-h1-' + origIdx + '"></div>';
        specHtml += '<div class="spectrum-label"><sup>1</sup>H NMR (' + s.hnmrFreq + ' MHz)</div>';
        specHtml += '<div class="incorrect-badge">&#10007; Incorrect</div></div>';
        return;
      }
      var s = structures[origIdx];
      var sel = selectedSpectrum === origIdx;
      var incorr = incorrectPair && incorrectPair.spectrum === origIdx;
      var bothSel = sel && selectedStructure !== null;
      var cls = 'card clickable';
      if (bothSel) cls += ' selected matching';
      else if (sel) cls += ' selected';
      else if (incorr) cls += ' incorrect';

      specHtml += '<div class="' + cls + '" data-spectrum-idx="' + origIdx + '">';
      specHtml += '<h3>Spectrum ' + (displayIdx + 1) + '</h3>';
      specHtml += '<div class="spectrum-plot-c13" id="spectrum-plot-c13-' + origIdx + '"></div>';
      specHtml += '<div class="spectrum-label"><sup>13</sup>C NMR</div>';
      specHtml += '<div class="spectrum-plot-h1" id="spectrum-plot-h1-' + origIdx + '"></div>';
      specHtml += '<div class="spectrum-label"><sup>1</sup>H NMR (' + s.hnmrFreq + ' MHz)</div>';
      if (bothSel) specHtml += '<div class="matching-badge">Match?</div>';
      else if (incorr) specHtml += '<div class="incorrect-badge">&#10007; Incorrect</div>';
      specHtml += '</div>';
    });
    specGrid.innerHTML = specHtml;

    // ── Click handlers ──
    structGrid.querySelectorAll('[data-structure-idx]').forEach(function (el) {
      el.addEventListener('click', function () { onSelect('structure', el); });
    });
    specGrid.querySelectorAll('[data-spectrum-idx]').forEach(function (el) {
      el.addEventListener('click', function () { onSelect('spectrum', el); });
    });

    // ── Draw spectra ──
    shuffledIndices.forEach(function (origIdx) {
      if (isSpectrumMatched(origIdx)) return;
      var s = structures[origIdx];
      var c13 = document.getElementById('spectrum-plot-c13-' + origIdx);
      var h1 = document.getElementById('spectrum-plot-h1-' + origIdx);
      if (c13) drawSpectrum(c13, s.cnmrPeaks, '13C', null, c13.clientWidth, 150);
      if (h1) drawSpectrum(h1, s.hnmrPeaks, '1H', s.hnmrFreq, h1.clientWidth, 150);
    });
  }

  function onSelect(type, el) {
    var idx = parseInt(el.dataset[type + 'Idx'], 10);

    // Already revealed — ignore
    if (revealedAll) return;

    // Already matched — ignore
    if (type === 'structure' && matches[idx] !== undefined) return;
    if (type === 'spectrum' && isSpectrumMatched(idx)) return;

    // Clear incorrect on any new action
    incorrectPair = null;

    if (type === 'structure') {
      selectedStructure = (selectedStructure === idx && selectedSpectrum === null) ? null : idx;
    } else {
      selectedSpectrum = (selectedSpectrum === idx && selectedStructure === null) ? null : idx;
    }

    // When both are selected, clear individual selections so the
    // "matching" state takes over — new click starts fresh
    var bothReady = (selectedStructure !== null && selectedSpectrum !== null);
    document.getElementById('check-btn').disabled = !bothReady;
    buildCards();
  }

  buildCards();

  // Check button — validates the current pair
  document.getElementById('check-btn').onclick = function () {
    var si = selectedStructure;
    var sp = selectedSpectrum;
    if (si === null || sp === null) return;

    if (si === sp) {
      matches[si] = sp;
    } else {
      incorrectPair = { structure: si, spectrum: sp };
    }
    selectedStructure = null;
    selectedSpectrum = null;
    document.getElementById('check-btn').disabled = true;
    buildCards();
  };

  document.getElementById('check-all-btn').onclick = function () {
    // Build and show answer key
    var lines = [];
    for (var i = 0; i < structures.length; i++) {
      for (var d = 0; d < shuffledIndices.length; d++) {
        if (shuffledIndices[d] === i) {
          lines.push('Structure ' + (i + 1) + '  \u2014\u2014  Spectrum ' + (d + 1));
          break;
        }
      }
    }
    document.getElementById('answer-reveal').innerHTML = lines.join('<br>');
    document.getElementById('answer-reveal').classList.remove('hidden');

    // Set revealed mode — unmatched items show as incorrect, matched stay folded
    revealedAll = true;
    selectedStructure = null;
    selectedSpectrum = null;
    document.getElementById('check-btn').disabled = true;
    // Keep check-all-btn enabled
    buildCards();

    // Draw spectra for incorrectly marked items too
    shuffledIndices.forEach(function (origIdx) {
      if (matches[origIdx] !== undefined) return;
      var s = structures[origIdx];
      var c13 = document.getElementById('spectrum-plot-c13-' + origIdx);
      var h1 = document.getElementById('spectrum-plot-h1-' + origIdx);
      if (c13) drawSpectrum(c13, s.cnmrPeaks, '13C', null, c13.clientWidth, 150);
      if (h1) drawSpectrum(h1, s.hnmrPeaks, '1H', s.hnmrFreq, h1.clientWidth, 150);
    });
  };
}

/** Convert "C4H8O2" to "C₄H₈O₂" using Unicode subscripts. */
function toSubscript(formula) {
  var subs = {'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'};
  return formula.replace(/[0-9]/g, function (d) { return subs[d]; });
}

// Auto-init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
