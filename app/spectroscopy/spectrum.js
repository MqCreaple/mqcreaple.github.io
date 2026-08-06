/**
 * spectrum.js — drawSpectrum() using Plotly
 *
 * Renders an NMR spectrum as vertical lines with interactive features:
 * - Horizontal scroll-wheel zoom
 * - Fixed vertical range (no vertical zoom)
 * - Hover shows ppm and intensity
 */

/**
 * Draw an NMR spectrum in the given container.
 *
 * @param {HTMLElement} container - DOM element to render into
 * @param {Array<[number, number]>} peaks - [[ppm, intensity], ...]
 * @param {string} nucleus - '1H' or '13C' (controls x-axis range)
 * @param {number|string} freqMHz - Spectrometer frequency in MHz (for hover Hz)
 * @param {number} width - Width in pixels (default: auto)
 * @param {number} height - Height in pixels (default: 300)
 */
function drawSpectrum(container, peaks, nucleus, freqMHz, width, height) {
  if (!container || !peaks || peaks.length === 0) return;

  height = height || 300;

  var xMax = 0;
  var xMin = (nucleus === '13C') ? 220 : 16;

  // Sort by ppm descending (high ppm on left)
  var sorted = [...peaks].sort(function (a, b) { return b[0] - a[0]; });

  var lines = [];
  for (var i = 0; i < sorted.length; i++) {
    var ppm = sorted[i][0];
    var intensity = sorted[i][1];
    lines.push({
      x: [ppm, ppm],
      y: [0, intensity],
      type: 'scatter',
      mode: 'lines',
      line: { color: '#1a1a2e', width: 1.5 },
      hoverinfo: 'text',
      text: 'δ = ' + ppm.toFixed(3) + ' ppm' +
        (nucleus === '1H' && freqMHz ? '<br>' + (parseFloat(freqMHz) * ppm).toFixed(1) + ' Hz' : '') +
        '<br>Intensity = ' + intensity,
      showlegend: false,
    });
  }

  var layout = {
    margin: { t: 30, b: 50, l: 50, r: 20 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { size: 12 },
    width: width || container.clientWidth || 500,
    height: height,
    xaxis: {
      range: [xMin, xMax],
      autorange: false,
      title: 'δ (ppm)',
      zeroline: true,
      zerolinecolor: '#999',
      zerolinewidth: 1,
      gridcolor: '#e8e8e8',
    },
    yaxis: {
      title: 'Intensity',
      fixedrange: true,
      showgrid: true,
      gridcolor: '#e8e8e8',
      zeroline: true,
      zerolinecolor: '#999',
      zerolinewidth: 1,
    },
    dragmode: 'zoom',
    hovermode: 'closest',
    showlegend: false,
  };

  var config = {
    scrollZoom: true,
    displayModeBar: true,
    modeBarButtonsToRemove: [
      'zoom2d', 'pan2d', 'select2d', 'lasso2d',
      'zoomIn2d', 'zoomOut2d', 'autoScale2d',
      'resetScale2d', 'hoverClosestCartesian',
      'hoverCompareCartesian', 'toggleSpikelines',
    ],
    displaylogo: false,
    responsive: true,
  };

  Plotly.newPlot(container, lines, layout, config);
}

/**
 * Clear a spectrum container.
 */
function clearSpectrum(container) {
  if (container) {
    Plotly.purge(container);
    container.innerHTML = '';
  }
}
