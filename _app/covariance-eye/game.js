// State
let charts = [];
let hiddenPairs = [];
let selectedCharts = new Set();
let startTime = Date.now();
let pairsFound = 0;

// DOM elements
var chartGrid;
var totalChartsInput;
var totalChartsValue;
var difficultySelect;
var noiseLevelInput;
var noiseLevelValue;
var numPairsInput;
var numPairsValue;
var generateBtn;
var checkBtn;
var revealBtn;
var analysisResult;
var correlationThresholdDisplay;
var totalChartsDisplay;
var pairsFoundDisplay;
var timeSpentDisplay;

// Correlation thresholds by difficulty
const difficultyThresholds = {
    easy: 0.90,
    medium: 0.85,
    hard: 0.80,
    insane: 0.70
};

// Non-diagonal element threshold (for background noise)
const BACKGROUND_THRESHOLD = 0.1;

// -------------------------------
// Linear Algebra Utilities
// -------------------------------

// Log a matrix to the console
function logMatrix(A) {
    console.log("[\n\t" + A.map(row => "[" + row.join(", ") + "]").join(",\n\t") + "\n]")
}

// Create n x n identity matrix
function identity(n) {
    const mat = Array(n);
    for (let i = 0; i < n; i++) {
        mat[i] = Array(n).fill(0);
        mat[i][i] = 1;
    }
    return mat;
}

// Generate covariance matrix
function generateCovarianceMatrix(n, hiddenPairs, targetCorrelation, addBackgroundNoise = true) {
    // Start with identity matrix
    const cov = identity(n);
    
    // Add small background noise to off-diagonal elements
    if (addBackgroundNoise) {
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                // Sample from Gaussian with small variance
                let noise = gaussianRandom(0, 0.03);
                // Clamp to [-BACKGROUND_THRESHOLD, BACKGROUND_THRESHOLD]
                noise = Math.max(-BACKGROUND_THRESHOLD, Math.min(BACKGROUND_THRESHOLD, noise));
                cov[i][j] = noise;
                cov[j][i] = noise;
            }
        }
    }
    
    // Set hidden pairs to target correlation
    hiddenPairs.forEach(([i, j]) => {
        cov[i][j] = targetCorrelation;
        cov[j][i] = targetCorrelation;
    });
    
    return cov;
}

// Gaussian random number (Box-Muller transform)
function gaussianRandom(mean = 0, std = 1) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * std;
}

// Cholesky decomposition with regularization for positive definiteness
function choleskyDecomposition(A) {
    const n = A.length;
    const L = Array(n);
    for (let i = 0; i < n; i++) {
        L[i] = Array(n).fill(0);
    }
    
    // Regularization factor
    const reg = 1e-6;
    
    for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
            let sum = 0;
            for (let k = 0; k < j; k++) {
                sum += L[i][k] * L[j][k];
            }
            
            if (i === j) {
                const diag = A[i][i] - sum;
                // Ensure positive diagonal
                L[i][j] = Math.sqrt(Math.max(diag, reg));
            } else {
                L[i][j] = (A[i][j] - sum) / L[j][j];
            }
        }
    }
    return L;
}

// Matrix-vector multiplication: L * z
function matrixVectorMultiply(L, z) {
    const n = L.length;
    const result = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
            result[i] += L[i][j] * z[j];
        }
    }
    return result;
}

// Generate multivariate random walk
function generateMultivariateRandomWalk(n, L, length, volatility) {
    // Initialize n time series with random starting points
    const series = Array(n);
    for (let i = 0; i < n; i++) {
        series[i] = [gaussianRandom(50, 10)]; // Start around 50 with some spread
    }
    
    // Generate steps
    for (let t = 1; t < length; t++) {
        // Generate independent standard normal vector
        const z = Array(n);
        for (let i = 0; i < n; i++) {
            z[i] = gaussianRandom(0, 1);
        }
        
        // Compute correlated increments: ΔX = L * z * volatility
        const delta = matrixVectorMultiply(L, z);
        for (let i = 0; i < n; i++) {
            series[i].push(series[i][t - 1] + delta[i] * volatility);
        }
    }
    
    return series;
}

// Calculate Pearson correlation
function calculateCorrelation(series1, series2) {
    // Compute first differences (returns)
    const n = series1.length;
    if (n < 2) return 0;
    
    const diff1 = [];
    const diff2 = [];
    
    for (let i = 1; i < n; i++) {
        diff1.push(series1[i] - series1[i-1]);
        diff2.push(series2[i] - series2[i-1]);
    }
    
    const m = diff1.length; // m = n-1
    const mean1 = diff1.reduce((a, b) => a + b) / m;
    const mean2 = diff2.reduce((a, b) => a + b) / m;
    
    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;
    
    for (let i = 0; i < m; i++) {
        const d1 = diff1[i] - mean1;
        const d2 = diff2[i] - mean2;
        numerator += d1 * d2;
        denom1 += d1 * d1;
        denom2 += d2 * d2;
    }
    
    // Handle zero variance cases
    if (denom1 === 0 || denom2 === 0) return 0;
    
    return numerator / Math.sqrt(denom1 * denom2);
}

// Plot scatter chart for two series (returns)
function plotScatter(series1, series2, id1, id2) {
    // Compute first differences (returns)
    const diff1 = [];
    const diff2 = [];
    
    for (let i = 1; i < series1.length; i++) {
        diff1.push(series1[i] - series1[i-1]);
        diff2.push(series2[i] - series2[i-1]);
    }
    
    const correlation = calculateCorrelation(series1, series2);
    
    const trace = {
        x: diff1,
        y: diff2,
        mode: 'markers',
        type: 'scatter',
        marker: {
            size: 8,
            color: getColorForCorrelation(correlation),
            opacity: 0.7
        },
        name: `Series #${id1+1} vs #${id2+1}`
    };
    
    const layout = {
        title: `Scatter Plot of Returns (r = ${correlation.toFixed(4)})`,
        xaxis: { title: `Series #${id1+1} Return` },
        yaxis: { title: `Series #${id2+1} Return` },
        height: 400,
        margin: { l: 60, r: 30, t: 50, b: 50 },
        plot_bgcolor: 'transparent',
        paper_bgcolor: 'transparent',
        font: { color: '#333333' },
        showlegend: false
    };
    
    const config = { responsive: true };
    
    Plotly.newPlot('scatter-plot', [trace], layout, config);
}

// -------------------------------
// Main Chart Generation
// -------------------------------

// Generate all charts
function generateCharts() {
    const total = parseInt(totalChartsInput.value);
    const difficulty = difficultySelect.value;
    const noise = parseFloat(noiseLevelInput.value);
    const numPairs = parseInt(numPairsInput.value);
    const targetCorrelation = difficultyThresholds[difficulty];

    if(isNaN(total) || isNaN(numPairs)) {
        console.error(`Invalid input detected: total = ${total}, numPairs = ${numPairs}`);
        return;
    }
    
    // Reset state
    charts = [];
    hiddenPairs = [];
    selectedCharts.clear();
    pairsFound = 0;
    startTime = Date.now();
    chartGrid.innerHTML = '';
    
    // Select non-overlapping pairs
    let usedIndices = new Set();
    for (let p = 0; p < numPairs; p++) {
        let idx1, idx2;
        do {
            idx1 = Math.floor(Math.random() * total);
        } while (usedIndices.has(idx1));
        usedIndices.add(idx1);
        
        do {
            idx2 = Math.floor(Math.random() * total);
        } while (usedIndices.has(idx2));
        usedIndices.add(idx2);
        
        hiddenPairs.push([idx1, idx2]);
    }
    
    // Generate covariance matrix
    const cov = generateCovarianceMatrix(total, hiddenPairs, targetCorrelation, true);
    // logMatrix(cov);
    
    // Cholesky decomposition
    const L = choleskyDecomposition(cov);
    // logMatrix(L);
    
    // Generate multivariate random walk
    const length = 100;
    const volatility = 0.5 * noise; // Scale by noise parameter
    const allSeries = generateMultivariateRandomWalk(total, L, length, volatility);
    
    // Store series
    for (let i = 0; i < total; i++) {
        const isHidden = hiddenPairs.some(([a, b]) => a === i || b === i);
        let pairIndex = -1;
        for (let p = 0; p < hiddenPairs.length; p++) {
            if (hiddenPairs[p][0] === i || hiddenPairs[p][1] === i) {
                pairIndex = p;
                break;
            }
        }
        
        charts[i] = {
            id: i,
            series: allSeries[i],
            isHidden: isHidden,
            pairIndex: pairIndex
        };
    }
    
    // Render all charts
    renderCharts();
    updateStats();
    analysisResult.innerHTML = `<p>Generated ${total} charts with ${numPairs} hidden pair${numPairs > 1 ? 's' : ''}. Find them!</p>`;
}

// Render charts to grid
function renderCharts() {
    chartGrid.innerHTML = '';
    
    charts.forEach(chart => {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.dataset.id = chart.id;
        
        if (selectedCharts.has(chart.id)) {
            container.classList.add('selected');
        }
        
        const title = document.createElement('div');
        title.className = 'chart-title';
        title.textContent = `Series #${chart.id + 1}`;
        
        const plotDiv = document.createElement('div');
        plotDiv.className = 'chart-plot';
        plotDiv.id = `plot-${chart.id}`;
        
        container.appendChild(title);
        container.appendChild(plotDiv);
        chartGrid.appendChild(container);
        
        // Create Lightweight Chart (candlestick)
        const chartInstance = LightweightCharts.createChart(plotDiv, {
            width: plotDiv.clientWidth,
            height: 300,
            layout: {
                background: { color: 'transparent' },
                textColor: '#333333',
            },
            grid: {
                vertLines: { color: '#e0e0e0' },
                horzLines: { color: '#e0e0e0' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: '#e0e0e0',
            },
            timeScale: {
                borderColor: '#e0e0e0',
                timeVisible: false,
                secondsVisible: false,
            },
            handleScroll: false,
            handleScale: false,
            dragPan: false,
            mouseWheel: false,
        });
        
        // Convert time series to candlestick data
        const candlestickSeries = chartInstance.addSeries(
            LightweightCharts.CandlestickSeries,
            {
                upColor: '#10b981',  // green for up candles
                downColor: '#dc2626', // red for down candles
                borderVisible: false,
                wickUpColor: '#10b981',
                wickDownColor: '#dc2626',
            }
        );
        
        // Generate candlestick data from time series
        const candleData = [];
        const series = chart.series;
        
        for (let i = 1; i < series.length; i++) {
            const close = series[i];
            const open = series[i-1];
            
            candleData.push({
                time: i,
                open: open,
                high: Math.max(open, close),
                low: Math.min(open, close),
                close: close,
            });
        }
        
        candlestickSeries.setData(candleData);
        
        // Store chart instance for potential updates
        chart.chartInstance = chartInstance;
        
        // Add click handler
        container.addEventListener('click', () => {
            if (selectedCharts.has(chart.id)) {
                selectedCharts.delete(chart.id);
                container.classList.remove('selected');
            } else {
                if (selectedCharts.size >= 2) {
                    // Remove the first selected
                    const firstId = Array.from(selectedCharts)[0];
                    selectedCharts.delete(firstId);
                    document.querySelector(`.chart-container[data-id="${firstId}"]`).classList.remove('selected');
                }
                selectedCharts.add(chart.id);
                container.classList.add('selected');
            }
            
            // Update analysis if two selected
            if (selectedCharts.size === 2) {
                const [id1, id2] = Array.from(selectedCharts);
                const series1 = charts[id1].series;
                const series2 = charts[id2].series;
                const correlation = calculateCorrelation(series1, series2);
                
                analysisResult.innerHTML = `
                    <p><strong>Series #${id1 + 1} vs Series #${id2 + 1}</strong></p>
                    <p>Correlation: <span style="color:${getColorForCorrelation(correlation)};font-weight:bold">
                        ${correlation.toFixed(4)}
                    </span></p>
                    <p>${getCorrelationInterpretation(correlation)}</p>
                    <div id="scatter-plot" style="height: 400px; margin-top: 20px;"></div>
                `;
                
                // Plot scatter chart after DOM update
                setTimeout(() => {
                    plotScatter(series1, series2, id1, id2);
                }, 0);
            } else {
                analysisResult.innerHTML = `<p>Select two charts to see their correlation.</p>`;
            }
        });
    });
}

// Get color for correlation value
function getColorForCorrelation(corr) {
    if (corr > 0.7) return '#10b981'; // Strong positive
    if (corr > 0.3) return '#3b82f6'; // Moderate positive
    if (corr > -0.3) return '#6b7280'; // Weak
    if (corr > -0.7) return '#f59e0b'; // Moderate negative
    return '#dc2626'; // Strong negative
}

// Get interpretation text
function getCorrelationInterpretation(corr) {
    if (corr > 0.8) return 'Very strong positive correlation! Could be a hidden pair.';
    if (corr > 0.6) return 'Strong positive correlation.';
    if (corr > 0.4) return 'Moderate positive correlation.';
    if (corr > 0.2) return 'Weak positive correlation.';
    if (corr > -0.2) return 'No significant correlation.';
    if (corr > -0.4) return 'Weak negative correlation.';
    if (corr > -0.6) return 'Moderate negative correlation.';
    if (corr > -0.8) return 'Strong negative correlation.';
    return 'Very strong negative correlation!';
}

// Check selected pair
function checkSelectedPair() {
    if (selectedCharts.size !== 2) {
        analysisResult.innerHTML = `<p class="warn">Please select exactly two charts.</p>`;
        return;
    }
    
    const [id1, id2] = Array.from(selectedCharts);
    const chart1 = charts[id1];
    const chart2 = charts[id2];
    const correlation = calculateCorrelation(chart1.series, chart2.series);
    const threshold = difficultyThresholds[difficultySelect.value];
    
    // Check if it's a hidden pair
    let isHiddenPair = false;
    for (const [pairId1, pairId2] of hiddenPairs) {
        if ((id1 === pairId1 && id2 === pairId2) || (id1 === pairId2 && id2 === pairId1)) {
            isHiddenPair = true;
            break;
        }
    }
    
    if (isHiddenPair && !chart1.revealed && !chart2.revealed) {
        pairsFound++;
        chart1.revealed = true;
        chart2.revealed = true;
        
        // Update UI
        document.querySelector(`#plot-${id1}`).parentNode.style.border = '3px solid #fbbf24';
        document.querySelector(`#plot-${id2}`).parentNode.style.border = '3px solid #fbbf24';
        
        analysisResult.innerHTML = `
            <p><strong>🎉 Found a hidden pair!</strong></p>
            <p>Series #${id1 + 1} and Series #${id2 + 1} are correlated with r = ${correlation.toFixed(4)}.</p>
            <p>Pairs found: ${pairsFound} / ${hiddenPairs.length}</p>
        `;
        
        if (pairsFound === hiddenPairs.length) {
            const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
            analysisResult.innerHTML += `
                <p><strong>🏆 You found all hidden pairs in ${timeElapsed} seconds!</strong></p>
            `;
        }
    } else if (correlation >= threshold) {
        analysisResult.innerHTML = `
            <p><strong>High correlation detected!</strong></p>
            <p>Series #${id1 + 1} and Series #${id2 + 1} have r = ${correlation.toFixed(4)} (≥ ${threshold.toFixed(2)}).</p>
            <p>But this is not a hidden pair. Keep looking!</p>
        `;
    } else {
        analysisResult.innerHTML = `
            <p><strong>Not a hidden pair.</strong></p>
            <p>Series #${id1 + 1} and Series #${id2 + 1} have r = ${correlation.toFixed(4)}.</p>
            <p>Correlation is below the threshold of ${threshold.toFixed(2)}.</p>
        `;
    }
    
    updateStats();
}

// Reveal all hidden pairs
function revealAllPairs() {
    hiddenPairs.forEach(([id1, id2], pairIdx) => {
        // Highlight the pair
        const plot1 = document.querySelector(`#plot-${id1}`).parentNode;
        const plot2 = document.querySelector(`#plot-${id2}`).parentNode;
        
        if (plot1) plot1.style.border = '3px solid #ef4444';
        if (plot2) plot2.style.border = '3px solid #ef4444';
        
        // Update titles
        const title1 = document.querySelector(`.chart-container[data-id="${id1}"] .chart-title`);
        const title2 = document.querySelector(`.chart-container[data-id="${id2}"] .chart-title`);
        
        if (title1) title1.textContent = `Series #${id1 + 1} 🔍 (Pair ${pairIdx + 1})`;
        if (title2) title2.textContent = `Series #${id2 + 1} 🔍 (Pair ${pairIdx + 1})`;
    });
    
    updateStats();
    
    const correlation = calculateCorrelation(charts[hiddenPairs[0][0]].series, charts[hiddenPairs[0][1]].series);
    analysisResult.innerHTML = `
        <p><strong>All hidden pairs revealed!</strong></p>
        <p>There were ${hiddenPairs.length} hidden pair${hiddenPairs.length > 1 ? 's' : ''}.</p>
        <p>Example correlation: r = ${correlation.toFixed(4)}</p>
    `;
}

// Update statistics display
function updateStats() {
    const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
    
    totalChartsDisplay.textContent = charts.length;
    pairsFoundDisplay.textContent = `${pairsFound} / ${hiddenPairs.length}`;
    timeSpentDisplay.textContent = `${timeElapsed}s`;
}

// Initialize the application
function init() {
    // Get DOM elements
    chartGrid = document.getElementById('chart-grid');
    totalChartsInput = document.getElementById('total-charts');
    totalChartsValue = document.getElementById('total-charts-value');
    difficultySelect = document.getElementById('difficulty');
    noiseLevelInput = document.getElementById('noise-level');
    noiseLevelValue = document.getElementById('noise-level-value');
    numPairsInput = document.getElementById('num-pairs');
    numPairsValue = document.getElementById('num-pairs-value');
    generateBtn = document.getElementById('generate-btn');
    checkBtn = document.getElementById('check-btn');
    revealBtn = document.getElementById('reveal-btn');
    analysisResult = document.getElementById('analysis-result');
    totalChartsDisplay = document.getElementById('total-charts');
    correlationThresholdDisplay = document.getElementById('correlation-threshold');
    pairsFoundDisplay = document.getElementById('pairs-found');
    timeSpentDisplay = document.getElementById('time-spent');
    
    function updateNumPairsRange() {
        numPairsInput.max = Math.floor(parseInt(totalChartsInput.value) / 2);
        numPairsInput.value = Math.min(parseInt(numPairsInput.value), parseInt(numPairsInput.max));
        numPairsValue.textContent = numPairsInput.value;
    }

    // Update range value displays
    totalChartsInput.addEventListener('input', () => {
        totalChartsValue.textContent = totalChartsInput.value;
        updateNumPairsRange();
    });
    noiseLevelInput.addEventListener('input', () => {
        noiseLevelValue.textContent = parseFloat(noiseLevelInput.value).toFixed(1);
    });
    numPairsInput.addEventListener('input', () => {
        numPairsValue.textContent = numPairsInput.value;
    });
    difficultySelect.addEventListener('change', () => {
        const threshold = difficultyThresholds[difficultySelect.value];
        correlationThresholdDisplay.textContent = threshold.toFixed(2);
    });
    
    // Initialize threshold display
    correlationThresholdDisplay.textContent = difficultyThresholds[difficultySelect.value].toFixed(2);
    
    // Button event listeners
    generateBtn.addEventListener('click', generateCharts);
    checkBtn.addEventListener('click', checkSelectedPair);
    revealBtn.addEventListener('click', revealAllPairs);
    
    // Ensure the range is correct
    updateNumPairsRange();

    // Auto-update time
    setInterval(updateStats, 1000);
    
    // Initial generation
    generateCharts();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM already loaded
    init();
}