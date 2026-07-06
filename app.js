/* ==========================================================================
   STOCKSENSE AI - DASHBOARD LOGIC ENGINE (RESTORED GLASSMORPHISM SYSTEM)
   ========================================================================== */

// 1. Stock Datasets categorized by Sector Stacks
const stocksData = {
    AAPL: {
        name: "Apple Inc.",
        symbol: "AAPL",
        stack: "tech",
        yesterdayBase: 172.50,
        todayBase: 174.20,
        volatility: 0.15,
        drift: 0.05,
        chanceIncrease: 68,
        sentiment: "Strong institutional demand for AI-integrated hardware and positive consumer sentiment post-WWDC drives positive predictive momentum. Projections show tests of upper resistance bounds.",
        tomorrowForecast: 178.50,
        todayPrices: [],
        yesterdayPrices: [],
        tomorrowPrices: []
    },
    TSLA: {
        name: "Tesla Inc.",
        symbol: "TSLA",
        stack: "ev",
        yesterdayBase: 184.80,
        todayBase: 181.50,
        volatility: 0.35,
        drift: -0.15,
        chanceIncrease: 38,
        sentiment: "Production delays in Gigafactory Berlin and cooling global EV demand signal near-term downward pressure. AI indicators point to consolidation below key moving averages.",
        tomorrowForecast: 171.20,
        todayPrices: [],
        yesterdayPrices: [],
        tomorrowPrices: []
    },
    NVDA: {
        name: "NVIDIA Corp.",
        symbol: "NVDA",
        stack: "tech",
        yesterdayBase: 890.00,
        todayBase: 908.50,
        volatility: 0.45,
        drift: 0.25,
        chanceIncrease: 82,
        sentiment: "Hyperscaler capital expenditure on AI clusters remains robust. AI predictive analysis suggests high probability of immediate breakout past historical resistance levels.",
        tomorrowForecast: 938.40,
        todayPrices: [],
        yesterdayPrices: [],
        tomorrowPrices: []
    },
    MSFT: {
        name: "Microsoft Corp.",
        symbol: "MSFT",
        stack: "tech",
        yesterdayBase: 416.20,
        todayBase: 419.50,
        volatility: 0.10,
        drift: 0.08,
        chanceIncrease: 61,
        sentiment: "Steady cloud deployment (Azure) coupled with Copilot monetization structures sustains steady support. Volatility is low; excellent baseline stability expected.",
        tomorrowForecast: 424.10,
        todayPrices: [],
        yesterdayPrices: [],
        tomorrowPrices: []
    },
    BTC: {
        name: "Bitcoin (USD)",
        symbol: "BTC",
        stack: "crypto",
        yesterdayBase: 64500,
        todayBase: 65900,
        volatility: 1.20,
        drift: 0.35,
        chanceIncrease: 73,
        sentiment: "Institutional inflows via spot ETFs combined with low exchange-side liquid reserves suggest significant supply squeeze. Predictive analysis supports testing of yearly peaks.",
        tomorrowForecast: 68750,
        todayPrices: [],
        yesterdayPrices: [],
        tomorrowPrices: []
    },
    RIVN: {
        name: "Rivian Automotive",
        symbol: "RIVN",
        stack: "ev",
        yesterdayBase: 11.20,
        todayBase: 10.90,
        volatility: 0.40,
        drift: -0.10,
        chanceIncrease: 31,
        sentiment: "High capital burn rates and production targets scaling back lead to bearish predictions. Rebound potential lies at historical $10 support level.",
        tomorrowForecast: 10.15,
        todayPrices: [],
        yesterdayPrices: [],
        tomorrowPrices: []
    },
    NIO: {
        name: "NIO Inc.",
        symbol: "NIO",
        stack: "ev",
        yesterdayBase: 4.50,
        todayBase: 4.70,
        volatility: 0.48,
        drift: 0.12,
        chanceIncrease: 64,
        sentiment: "Robust delivery numbers in domestic China and battery-swap expansion sustain optimistic local sentiment. Forecast models indicate breakout momentum.",
        tomorrowForecast: 5.12,
        todayPrices: [],
        yesterdayPrices: [],
        tomorrowPrices: []
    },
    ETH: {
        name: "Ethereum (USD)",
        symbol: "ETH",
        stack: "crypto",
        yesterdayBase: 3420,
        todayBase: 3510,
        volatility: 1.05,
        drift: 0.28,
        chanceIncrease: 69,
        sentiment: "Record high Layer-2 transaction metrics and ETF staking discussions maintain highly constructive price trends. Lower boundaries established at $3,450.",
        tomorrowForecast: 3655,
        todayPrices: [],
        yesterdayPrices: [],
        tomorrowPrices: []
    },
    SOL: {
        name: "Solana (USD)",
        symbol: "SOL",
        stack: "crypto",
        yesterdayBase: 136.00,
        todayBase: 141.50,
        volatility: 1.45,
        drift: 0.40,
        chanceIncrease: 74,
        sentiment: "Unprecedented DEX activity and token minting throughput sustains highly bullish predictions. Forecast metrics point to upper resistance breakthrough.",
        tomorrowForecast: 156.20,
        todayPrices: [],
        yesterdayPrices: [],
        tomorrowPrices: []
    }
};

// 2. Application Global State
let activeStock = "AAPL";
let selectedTableStack = "tech"; // default recommendations stack filter
let orderType = "buy";           // 'buy' or 'sell'
let userFunds = 45230.00;        // Account balance funds
let activeHoldings = [];         // Active user holdings/positions
let closedHoldings = [];         // Realized user positions ledger
let totalWithdrawnCapital = 0;   // Cumulative withdrawn capital returned to balance
let totalWithdrawnPnL = 0;       // Cumulative realized profit/loss
let chartInstance = null;
let liveInterval = null;
let currentHourIndex = 9;        // Index 9 represents 18:00
const labels = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];

// 3. Initialize Stock random walks (Yesterday actuals, predictions, today intradays)
function initializeData() {
    Object.keys(stocksData).forEach(key => {
        const s = stocksData[key];
        
        // Generate Yesterday Actuals and Predictions (to compare accuracy)
        let price = s.yesterdayBase;
        s.yesterdayPrices = [];
        s.yesterdayPredictedPrices = [];
        let totalError = 0;
        for (let i = 0; i < 12; i++) {
            price = price * (1 + (Math.sin(i / 2) * s.drift * 0.1) + ((Math.random() - 0.5) * s.volatility * 0.05));
            s.yesterdayPrices.push(parseFloat(price.toFixed(2)));
            
            // Yesterday predicted curve (adds minor variance relative to actuals)
            const predPrice = price * (1 + (Math.sin(i * 1.5) * 0.005) + ((Math.random() - 0.5) * s.volatility * 0.02));
            s.yesterdayPredictedPrices.push(parseFloat(predPrice.toFixed(2)));
            
            totalError += Math.abs(price - predPrice) / price;
        }
        const avgError = totalError / 12;
        s.yesterdayAccuracy = (1 - avgError) * 100;
        
        // Today starts at Yesterday's close
        s.todayBase = s.yesterdayPrices[11];
        s.todayPrices = [];
        price = s.todayBase;
        for (let i = 0; i <= currentHourIndex; i++) {
            price = price * (1 + (s.drift * 0.008) + ((Math.random() - 0.5) * s.volatility * 0.008));
            s.todayPrices.push(parseFloat(price.toFixed(2)));
        }
        
        // Set session highest high
        s.dailyHigh = Math.max(...s.todayPrices);
        
        // Pad out the rest of the day
        for (let i = currentHourIndex + 1; i < 12; i++) {
            s.todayPrices.push(null);
        }

        // Generate Tomorrow Prediction curve (Starts at today's active price at index 9)
        s.tomorrowPrices = new Array(12).fill(null);
        let startPrice = s.todayPrices[currentHourIndex];
        s.tomorrowPrices[currentHourIndex] = startPrice;
        let targetForecast = s.tomorrowForecast;
        
        for (let i = currentHourIndex + 1; i < 12; i++) {
            let progress = (i - currentHourIndex) / (11 - currentHourIndex);
            let nextPredicted = startPrice + (targetForecast - startPrice) * progress + ((Math.random() - 0.5) * s.volatility * 0.05 * startPrice);
            s.tomorrowPrices[i] = parseFloat(nextPredicted.toFixed(2));
        }
    });
}

// 4. Render Chart.js line graph
function updateChart() {
    const s = stocksData[activeStock];
    const ctx = document.getElementById('stockChart').getContext('2d');
    
    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Yesterday Actual',
                data: s.yesterdayPrices,
                borderColor: '#9ca3af',
                backgroundColor: 'rgba(156, 163, 175, 0.03)',
                borderWidth: 1.5,
                pointRadius: 2,
                tension: 0.35,
                fill: false
            },
            {
                label: "Yesterday Predicted",
                data: s.yesterdayPredictedPrices,
                borderColor: '#ec4899',
                borderDash: [4, 4],
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                pointRadius: 2,
                pointBackgroundColor: '#ec4899',
                tension: 0.35,
                fill: false
            },
            {
                label: 'Today Live',
                data: s.todayPrices,
                borderColor: '#5f5af6',
                backgroundColor: 'rgba(95, 90, 246, 0.06)',
                borderWidth: 3.5,
                pointRadius: 3,
                pointBackgroundColor: '#5f5af6',
                tension: 0.3,
                fill: true
            },
            {
                label: 'Tomorrow Prediction',
                data: s.tomorrowPrices,
                borderColor: '#10b981',
                borderDash: [6, 6],
                borderWidth: 1.5,
                pointRadius: 2,
                pointBackgroundColor: '#10b981',
                tension: 0.3,
                fill: false
            }
        ]
    };

    if (chartInstance) {
        chartInstance.data = chartData;
        chartInstance.update('none'); // Update without full reset animations for continuos ticks
    } else {
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af', font: { family: 'Inter', size: 10 } }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { 
                            color: '#9ca3af', 
                            font: { family: 'Inter', size: 10 },
                            callback: function(value) {
                                return activeStock === 'BTC' ? '$' + value.toLocaleString() : '$' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }
}

// 5. Update UI Metrics and Indicators
function updateUI() {
    const s = stocksData[activeStock];
    
    // Set Header Titles
    document.getElementById('chart-stock-title').textContent = `${s.name} (${s.symbol}) Trend Dashboard`;
    
    // Yesterday Close
    const yesterdayClose = s.yesterdayPrices[11];
    document.getElementById('metric-yesterday').textContent = formatCurrency(yesterdayClose);
    
    // Today Live LTP
    const todayCurrentPrice = s.todayPrices[currentHourIndex];
    document.getElementById('metric-today').textContent = formatCurrency(todayCurrentPrice);
    
    const todayDiffVal = todayCurrentPrice - s.todayBase;
    const todayDiffPct = (todayDiffVal / s.todayBase) * 100;
    const todayDiffEl = document.getElementById('metric-today-diff');
    
    if (todayDiffVal >= 0) {
        todayDiffEl.className = 'metric-diff up';
        todayDiffEl.innerHTML = `▲ +${todayDiffPct.toFixed(2)}% (+$${todayDiffVal.toFixed(2)})`;
    } else {
        todayDiffEl.className = 'metric-diff down';
        todayDiffEl.innerHTML = `▼ ${todayDiffPct.toFixed(2)}% (-$${Math.abs(todayDiffVal).toFixed(2)})`;
    }
    
    // Tomorrow AI target forecast
    const tomorrowPredPrice = s.tomorrowForecast;
    document.getElementById('metric-tomorrow').textContent = formatCurrency(tomorrowPredPrice);
    
    const tomorrowDiffVal = tomorrowPredPrice - todayCurrentPrice;
    const tomorrowDiffPct = (tomorrowDiffVal / todayCurrentPrice) * 100;
    const tomorrowDiffEl = document.getElementById('metric-tomorrow-diff');
    const tomorrowCard = document.getElementById('metric-tomorrow-card');
    
    if (tomorrowDiffVal >= 0) {
        tomorrowDiffEl.className = 'metric-diff up';
        tomorrowDiffEl.innerHTML = `▲ +${tomorrowDiffPct.toFixed(2)}% (+$${tomorrowDiffVal.toFixed(2)})`;
        tomorrowCard.className = 'glass-card metric-card tomorrow';
    } else {
        tomorrowDiffEl.className = 'metric-diff down';
        tomorrowDiffEl.innerHTML = `▼ ${tomorrowDiffPct.toFixed(2)}% (-$${Math.abs(tomorrowDiffVal).toFixed(2)})`;
        tomorrowCard.className = 'glass-card metric-card tomorrow down';
    }
    
    // AI Gauges & Probability percentages
    const chanceIncrease = s.chanceIncrease;
    const chanceDecrease = 100 - chanceIncrease;
    document.getElementById('chance-increase').textContent = `${chanceIncrease}%`;
    document.getElementById('chance-decrease').textContent = `${chanceDecrease}%`;
    
    document.getElementById('probability-value').textContent = `${chanceIncrease}%`;
    document.getElementById('probability-label').textContent = chanceIncrease >= 50 ? 'Increase' : 'Decrease';
    
    const gaugePath = document.getElementById('probability-gauge');
    const strokeOffset = 264 - (264 * (chanceIncrease / 100));
    if (gaugePath) {
        gaugePath.style.strokeDashoffset = strokeOffset;
        gaugePath.style.stroke = "url(#gauge-grad)";
    }
    
    document.getElementById('ai-insight-text').textContent = s.sentiment;
    
    // Yesterday prediction accuracy badge in chart title
    const accuracyBadge = document.getElementById('chart-accuracy-badge');
    if (accuracyBadge) {
        accuracyBadge.textContent = `Yesterday's Accuracy: ${s.yesterdayAccuracy.toFixed(2)}%`;
        if (s.yesterdayAccuracy >= 96) {
            accuracyBadge.style.color = "var(--secondary)";
            accuracyBadge.style.borderColor = "rgba(16,185,129,0.3)";
            accuracyBadge.style.backgroundColor = "rgba(16,185,129,0.05)";
        } else {
            accuracyBadge.style.color = "var(--warning)";
            accuracyBadge.style.borderColor = "rgba(255,152,0,0.3)";
            accuracyBadge.style.backgroundColor = "rgba(255,152,0,0.05)";
        }
    }
    
    // Update active dropdown funds
    updateUserFundsUI();
    
    // Calculate ticket outputs
    runROICalculator();
    
    // Update sector recommendations list table
    updateRecommendationsTable();

    // Update quick trade action buttons text labels
    const buyTickerSpan = document.getElementById('quick-buy-ticker');
    const sellTickerSpan = document.getElementById('quick-sell-ticker');
    if (buyTickerSpan) buyTickerSpan.textContent = s.symbol;
    if (sellTickerSpan) sellTickerSpan.textContent = s.symbol;
}

// 6. User Profile Dropdown and Margin balance manager
function updateUserFundsUI() {
    document.getElementById('profile-funds').textContent = formatCurrency(userFunds);
}

// 7. Order Ticket / ROI Calculator Operations
function setOrderType(type) {
    orderType = type;
    const btnSubmit = document.getElementById('order-submit-btn');
    
    const btnBuy = document.getElementById('order-btn-buy');
    const btnSell = document.getElementById('order-btn-sell');
    
    btnSubmit.textContent = `Place ${type.toUpperCase()} Order`;
    
    if (type === 'buy') {
        btnBuy.classList.add('active');
        btnSell.classList.remove('active');
        btnBuy.classList.remove('sell-mode');
        btnSubmit.classList.remove('sell-mode');
    } else {
        btnSell.classList.add('active');
        btnBuy.classList.remove('active');
        btnSell.classList.add('sell-mode');
        btnSubmit.classList.add('sell-mode');
    }
    
    runROICalculator();
}
window.setOrderType = setOrderType;

function runROICalculator() {
    const s = stocksData[activeStock];
    const amountInput = document.getElementById('calc-amount');
    const investAmount = parseFloat(amountInput.value);
    
    document.getElementById('calc-amount-label').textContent = `$${investAmount.toLocaleString()}`;
    
    const todayCurrentPrice = s.todayPrices[currentHourIndex];
    const tomorrowPredPrice = s.tomorrowForecast;
    const returnPct = ((tomorrowPredPrice - todayCurrentPrice) / todayCurrentPrice);
    
    let expectedProfitLoss = 0;
    if (orderType === 'buy') {
        expectedProfitLoss = investAmount * returnPct;
    } else {
        expectedProfitLoss = investAmount * (-returnPct); // short position profit
    }
    
    const endBalance = investAmount + expectedProfitLoss;
    document.getElementById('calc-end-balance').textContent = `$${endBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    const returnEl = document.getElementById('calc-return');
    const returnPctValue = (expectedProfitLoss / investAmount) * 100;
    
    if (expectedProfitLoss >= 0) {
        returnEl.className = 'calc-res-val profit';
        returnEl.textContent = `+$${expectedProfitLoss.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (+${returnPctValue.toFixed(2)}%)`;
    } else {
        returnEl.className = 'calc-res-val loss';
        returnEl.textContent = `-$${Math.abs(expectedProfitLoss).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${returnPctValue.toFixed(2)}%)`;
    }
}

async function executeTradeOrder() {
    const s = stocksData[activeStock];
    const investAmount = parseFloat(document.getElementById('calc-amount').value);
    
    // Balance check
    if (investAmount > userFunds) {
        showToast("❌ Insufficient available funds in account balance!", "alert");
        return;
    }
    
    const currentPrice = s.todayPrices[currentHourIndex];
    
    try {
        const res = await fetch('/api/portfolio/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                symbol: s.symbol,
                type: orderType,
                qty: investAmount / currentPrice,
                entryPrice: currentPrice,
                invested: investAmount
            })
        });
        const data = await res.json();
        if (data.success) {
            userFunds = data.funds;
            activeHoldings = data.activeHoldings;
            
            updateUserFundsUI();
            playSuccessChime();
            
            const msg = `Order Executed: ${orderType.toUpperCase()} $${investAmount.toLocaleString()} worth of ${s.symbol} at $${s.todayPrices[currentHourIndex].toFixed(2)}`;
            showToast(msg, orderType === 'buy' ? 'buy' : 'sell');
            
            updateUI();
            updatePortfolioUI();
        } else {
            showToast(`❌ Order Placement Failed: ${data.message}`, 'alert');
        }
    } catch (err) {
        console.error('Order placement request failed:', err);
    }
}
window.executeTradeOrder = executeTradeOrder;

// Success Order Chime (Web Audio API)
function playSuccessChime() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); // G5
        
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    } catch(e) {
        console.warn('Audio blocked:', e);
    }
}

// 8. Warning Sirens Alarm Chime
function playWarningSiren() {
    if (!document.getElementById('alert-audio-toggle').checked) return;
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(660, audioCtx.currentTime);
        osc1.frequency.linearRampToValueAtTime(330, audioCtx.currentTime + 0.3);
        
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(330, audioCtx.currentTime);
        osc2.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.35);
        osc2.stop(audioCtx.currentTime + 0.35);
    } catch(e) {
        console.warn('Audio blocked:', e);
    }
}

function triggerSuddenDropAlert(symbol, percentDrop, actualPrice) {
    const overlay = document.getElementById('alert-overlay');
    
    document.getElementById('modal-alert-ticker').textContent = `${symbol} BREACHED RISK LIMIT`;
    document.getElementById('modal-alert-details').textContent = 
        `Warning: ${stocksData[symbol].name} (${symbol}) has crashed by ${percentDrop.toFixed(2)}% in recent ticks. Price fell to $${actualPrice.toFixed(2)}. Direct Buy/Sell option buttons triggered below.`;
    
    overlay.classList.add('show');
    document.body.classList.add('flashing-bg');
    
    playWarningSiren();
    showToast(`CRITICAL: ${symbol} drop warning triggered!`, 'alert');
    
    // Simulated Email Dispatch
    if (document.getElementById('alert-email-toggle').checked) {
        const email = document.getElementById('alert-email-address').value || 'investor@stocksense.ai';
        setTimeout(() => {
            showToast(`📧 [Email Dispatched] To: ${email} | Subject: StockSense Drop Warning - ${symbol} fell ${percentDrop.toFixed(2)}%`, 'alert');
        }, 800);
    }

    // Simulated SMS Dispatch
    if (document.getElementById('alert-sms-toggle').checked) {
        const phone = document.getElementById('alert-phone-number').value || '+91 98765 43210';
        setTimeout(() => {
            showToast(`💬 [SMS Dispatched] To: ${phone} | msg: StockSense Alert: ${symbol} crashed by ${percentDrop.toFixed(2)}%! LTP: $${actualPrice.toFixed(2)}`, 'alert');
        }, 1500);
    }
    
    setTimeout(() => {
        document.body.classList.remove('flashing-bg');
    }, 2000);
}

// 9. Toast Notification dispatches
function showToast(message, type) {
    const container = document.getElementById('toast-drawer');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'sell' ? 'sell-toast' : (type === 'alert' ? 'alert-toast' : '')}`;
    
    toast.innerHTML = `
        <span>${message}</span>
        <span class="toast-close" onclick="this.parentElement.remove()">×</span>
    `;
    
    container.appendChild(toast);
    
    // Fade out after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slide-in 0.3s reverse';
        setTimeout(() => toast.remove(), 290);
    }, 4000);
}

// 10. Live ticks walk generator
function startLiveTicks() {
    if (liveInterval) clearInterval(liveInterval);
    
    liveInterval = setInterval(() => {
        const s = stocksData[activeStock];
        let currentPrice = s.todayPrices[currentHourIndex];
        
        const changeRate = ((Math.random() - 0.5) * s.volatility * 0.003) + (s.drift * 0.0005);
        let newPrice = currentPrice * (1 + changeRate);
        newPrice = parseFloat(newPrice.toFixed(2));
        
        s.todayPrices[currentHourIndex] = newPrice;
        
        if (newPrice > s.dailyHigh) {
            s.dailyHigh = newPrice;
        } else {
            const dropPct = ((s.dailyHigh - newPrice) / s.dailyHigh) * 100;
            const userThreshold = parseFloat(document.getElementById('alert-threshold').value);
            
            if (dropPct >= userThreshold) {
                s.dailyHigh = newPrice; // Reset dailyHigh
                triggerSuddenDropAlert(activeStock, dropPct, newPrice);
            }
        }
        
        updateUI();
        updateChart();
        updateTopTicker();
        updatePortfolioUI();
    }, 2500);
}

// 11. Scrolling Header Ticker updates
function updateTopTicker() {
    const tickerContainer = document.getElementById('header-ticker');
    let tickerHtml = "";
    
    const keys = Object.keys(stocksData);
    const doubledKeys = [...keys, ...keys];
    
    doubledKeys.forEach(key => {
        const s = stocksData[key];
        const currentPrice = s.todayPrices[currentHourIndex];
        const diffVal = currentPrice - s.todayBase;
        const diffPct = (diffVal / s.todayBase) * 100;
        const statusClass = diffVal >= 0 ? "up" : "down";
        const sign = diffVal >= 0 ? "+" : "";
        
        tickerHtml += `
            <div class="ticker-item ${statusClass}">
                <span>${s.symbol}</span>
                <span>$${currentPrice.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                <span>(${sign}${diffPct.toFixed(2)}%)</span>
            </div>
        `;
    });
    
    tickerContainer.innerHTML = tickerHtml;
}

// Utilities
function formatCurrency(num) {
    if (num >= 1000) {
        return '$' + num.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    return '$' + num.toFixed(2);
}

// 12. Accordion Sector Recommendations rendering
function updateRecommendationsTable() {
    const tableBody = document.getElementById('recommendations-table-body');
    if (!tableBody) return;
    
    let html = "";
    Object.keys(stocksData).forEach(key => {
        const s = stocksData[key];
        
        // Filter by tab stack
        if (s.stack !== selectedTableStack) return;
        
        const currentPrice = s.todayPrices[currentHourIndex];
        const forecastPrice = s.tomorrowForecast;
        const changePct = ((forecastPrice - currentPrice) / currentPrice) * 100;
        
        let signalLabel = "HOLD";
        let signalClass = "hold";
        
        if (changePct >= 2.5 && s.chanceIncrease >= 75) {
            signalLabel = "STRONG BUY";
            signalClass = "strong-buy";
        } else if (changePct >= 0.8 && s.chanceIncrease >= 55) {
            signalLabel = "BUY";
            signalClass = "buy";
        } else if (changePct <= -2.0) {
            signalLabel = "SELL";
            signalClass = "sell";
        } else {
            signalLabel = "HOLD";
            signalClass = "hold";
        }
        
        const changeSign = changePct >= 0 ? "+" : "";
        const changeColor = changePct >= 0 ? "var(--secondary)" : "var(--danger)";
        
        html += `
            <tr style="cursor: pointer;" onclick="selectStock('${s.symbol}')">
                <td style="padding: 0.9rem 1rem; font-weight: 600;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="color: white; font-family: 'Outfit', sans-serif;">${s.symbol}</span>
                        <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: normal;">${s.name}</span>
                    </div>
                </td>
                <td style="padding: 0.9rem 1rem; font-family: monospace;">${formatCurrency(currentPrice)}</td>
                <td style="padding: 0.9rem 1rem; font-family: monospace; color: ${changeColor};">${formatCurrency(forecastPrice)}</td>
                <td style="padding: 0.9rem 1rem; font-weight: bold; color: ${changeColor};">
                    ${changeSign}${changePct.toFixed(2)}%
                </td>
                <td style="padding: 0.9rem 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 50px; background: rgba(255,255,255,0.05); height: 4px; border-radius: 2px;">
                            <div style="width: ${s.chanceIncrease}%; background: ${s.chanceIncrease >= 50 ? 'var(--secondary)' : 'var(--danger)'}; height: 100%; border-radius: 2px;"></div>
                        </div>
                        <span>${s.chanceIncrease}%</span>
                    </div>
                </td>
                <td style="padding: 0.9rem 1rem; text-align: center;">
                    <span class="signal-badge ${signalClass}">${signalLabel}</span>
                </td>
                <td style="padding: 0.9rem 1rem; text-align: right;">
                    <button class="action-btn" onclick="event.stopPropagation(); selectStock('${s.symbol}')">View</button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Sector Tab switcher
function switchStack(stackName) {
    selectedTableStack = stackName;
    document.querySelectorAll('.stack-tab-btn').forEach(btn => {
        if (btn.id === `tab-${stackName}`) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    updateUI();
    updateChart();
}
window.switchStack = switchStack;

// Active stock selector binder
function selectStock(symbol) {
    activeStock = symbol;
    
    // Auto-switch recommendation stack tab to match selected stock's stack
    const targetStack = stocksData[symbol].stack;
    if (selectedTableStack !== targetStack) {
        selectedTableStack = targetStack;
        document.querySelectorAll('.stack-tab-btn').forEach(btn => {
            if (btn.id === `tab-${targetStack}`) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    updateUI();
    updateChart();
}
window.selectStock = selectStock;

// 13. DOM Listeners setup
function setupEventListeners() {
    const btnContainer = document.getElementById('stock-selectors');
    
    // Create stock selector buttons dynamically
    Object.keys(stocksData).forEach((key) => {
        const s = stocksData[key];
        const btn = document.createElement('button');
        btn.className = `stock-btn ${key === activeStock ? 'active' : ''}`;
        btn.textContent = s.symbol;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.stock-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectStock(s.symbol);
        });
        btnContainer.appendChild(btn);
    });

    // ROI inputs triggers
    document.getElementById('calc-amount').addEventListener('input', runROICalculator);
    
    const thresholdInput = document.getElementById('alert-threshold');
    const thresholdLabel = document.getElementById('alert-threshold-label');
    thresholdInput.addEventListener('input', () => {
        thresholdLabel.textContent = `${parseFloat(thresholdInput.value).toFixed(1)}%`;
    });

    // Profile Dropdown click toggler
    const profileTrigger = document.getElementById('profile-trigger');
    const statsTrigger = document.getElementById('stats-trigger');
    const drawer = document.getElementById('analytics-drawer');
    const drawerCloseBtn = document.getElementById('drawer-close-btn');

    if (profileTrigger) {
        profileTrigger.addEventListener('click', (e) => {
            // Prevent closing card when clicking inside, unless close button is clicked
            if (e.target.closest('.google-account-card') && !e.target.closest('#profile-close-btn')) {
                e.stopPropagation();
                return;
            }
            e.stopPropagation();
            profileTrigger.classList.toggle('active');
            if (drawer) drawer.classList.remove('active');
        });
    }
    if (drawerCloseBtn && drawer) {
        drawerCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            drawer.classList.remove('active');
        });
    }
    
    document.addEventListener('click', (e) => {
        if (profileTrigger) profileTrigger.classList.remove('active');
        if (drawer && !drawer.contains(e.target) && statsTrigger && !statsTrigger.contains(e.target) && !e.target.closest('.analytics-drawer-overlay')) {
            drawer.classList.remove('active');
        }
    });

    const profileCloseBtn = document.getElementById('profile-close-btn');
    if (profileCloseBtn && profileTrigger) {
        profileCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileTrigger.classList.remove('active');
        });
    }

    // Warning Dialog dispatches
    document.getElementById('modal-close-btn').addEventListener('click', () => {
        document.getElementById('alert-overlay').classList.remove('show');
    });

    // BUY THE DIP inside modal warning dialog
    document.getElementById('modal-buy-dip-btn').addEventListener('click', () => {
        setOrderType('buy');
        document.getElementById('calc-amount').value = 5000; // invest $5,000 in dip
        executeTradeOrder();
        document.getElementById('alert-overlay').classList.remove('show');
    });

    // SHORT SELL inside modal warning dialog
    document.getElementById('modal-short-sell-btn').addEventListener('click', () => {
        setOrderType('sell');
        document.getElementById('calc-amount').value = 5000; // invest $5,000 in short sell
        executeTradeOrder();
        document.getElementById('alert-overlay').classList.remove('show');
    });

    // Trigger Crash simulator
    document.getElementById('simulate-drop-btn').addEventListener('click', () => {
        const s = stocksData[activeStock];
        const currentPrice = s.todayPrices[currentHourIndex];
        const threshold = parseFloat(document.getElementById('alert-threshold').value);
        
        const crashPct = threshold + 1.5;
        const crashedPrice = currentPrice * (1 - (crashPct / 100));
        
        s.dailyHigh = currentPrice;
        s.todayPrices[currentHourIndex] = parseFloat(crashedPrice.toFixed(2));
        
        s.tomorrowPrices[currentHourIndex] = parseFloat(crashedPrice.toFixed(2));
        let startPrice = crashedPrice;
        let targetForecast = s.tomorrowForecast;
        for (let i = currentHourIndex + 1; i < 12; i++) {
            let progress = (i - currentHourIndex) / (11 - currentHourIndex);
            let nextPredicted = startPrice + (targetForecast - startPrice) * progress + ((Math.random() - 0.5) * s.volatility * 0.05 * startPrice);
            s.tomorrowPrices[i] = parseFloat(nextPredicted.toFixed(2));
        }

        updateUI();
        updateChart();
        triggerSuddenDropAlert(activeStock, crashPct, crashedPrice);
    });

    // Alert Bell click triggers
    document.getElementById('alert-bell-trigger').addEventListener('click', () => {
        document.getElementById('bell-badge').classList.remove('active');
    });

    // Live clock ticks
    setInterval(() => {
        const date = new Date();
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        const dateStr = date.toLocaleDateString('en-US', options);
        const timeStr = date.toLocaleTimeString('en-US', { hour12: false });
        document.getElementById('date-string').textContent = `${dateStr} ${timeStr}`;
    }, 1000);
}

// 13. Verified Customer Trades Ledger (Trust Builder)
const customerTrades = [
    { client: "Amit K. (Bengaluru)", symbol: "NVDA", buyPrice: 885.20, target: 915.00, actual: 912.80, accuracy: 99.76, roi: 3.12 },
    { client: "Sarah M. (New York)", symbol: "AAPL", buyPrice: 171.10, target: 176.50, actual: 175.80, accuracy: 99.60, roi: 2.75 },
    { client: "Hideki T. (Tokyo)", symbol: "BTC", buyPrice: 63800, target: 66000, actual: 65920, accuracy: 99.88, roi: 3.32 },
    { client: "Elena R. (Berlin)", symbol: "TSLA", buyPrice: 188.50, target: 182.00, actual: 180.90, accuracy: 99.39, roi: 4.03 },
    { client: "Rajesh S. (Mumbai)", symbol: "MSFT", buyPrice: 418.00, target: 422.50, actual: 421.90, accuracy: 99.86, roi: 0.93 }
];

function updateTrustLedger() {
    const ledgerBody = document.getElementById('trust-ledger-body');
    if (!ledgerBody) return;
    
    let html = "";
    customerTrades.forEach(trade => {
        const format = val => val >= 1000 ? '$' + val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '$' + val.toFixed(2);
        
        html += `
            <tr>
                <td style="padding: 0.9rem 1rem; font-weight: 600; color: white;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 24px; height: 24px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-card); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; color: var(--primary);">
                            ${trade.client.charAt(0)}
                        </div>
                        <span>${trade.client}</span>
                    </div>
                </td>
                <td style="padding: 0.9rem 1rem; font-weight: 700; color: var(--text-secondary);">${trade.symbol}</td>
                <td style="padding: 0.9rem 1rem; font-family: monospace;">${format(trade.buyPrice)}</td>
                <td style="padding: 0.9rem 1rem; font-family: monospace; color: var(--primary);">${format(trade.target)}</td>
                <td style="padding: 0.9rem 1rem; font-family: monospace; color: var(--secondary);">${format(trade.actual)}</td>
                <td style="padding: 0.9rem 1rem; text-align: center;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                        <strong style="color: var(--secondary); font-family: monospace; font-size: 0.9rem;">${trade.accuracy.toFixed(2)}%</strong>
                        <span style="font-size: 0.65rem; color: var(--text-secondary);">Return: +${trade.roi.toFixed(2)}%</span>
                    </div>
                </td>
                <td style="padding: 0.9rem 1rem; text-align: right;">
                    <span style="font-size: 0.7rem; color: var(--secondary); background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); padding: 2px 6px; border-radius: 4px; font-weight: bold;">
                        ✓ VERIFIED
                    </span>
                </td>
            </tr>
        `;
    });
    ledgerBody.innerHTML = html;
}

// Quick Trade Actions below Chart Card
function triggerQuickTrade(type) {
    setOrderType(type);
    
    // Visual flash and scroll highlight guide on the order ticket card on the right
    const orderCard = document.querySelector('.calculator-card');
    if (orderCard) {
        orderCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        orderCard.style.transform = 'scale(1.03)';
        orderCard.style.borderColor = type === 'buy' ? 'var(--secondary)' : 'var(--danger)';
        orderCard.style.boxShadow = type === 'buy' ? '0 0 25px var(--secondary-glow)' : '0 0 25px var(--danger-glow)';
        
        setTimeout(() => {
            orderCard.style.transform = '';
            orderCard.style.borderColor = '';
            orderCard.style.boxShadow = '';
        }, 800);
    }
    
    showToast(`⚡ Swapped to ${type.toUpperCase()} mode for ${activeStock}. Configure capital amount and submit!`, type === 'buy' ? 'buy' : 'sell');
}
window.triggerQuickTrade = triggerQuickTrade;

// Helper to navigate between dashboard and portfolio manager page
function navigateToPage(pageId) {
    const dashboard = document.getElementById('dashboard-view');
    const ledger = document.getElementById('portfolio-ledger-view');
    const profileTrigger = document.getElementById('profile-trigger');
    
    if (profileTrigger) profileTrigger.classList.remove('active');
    
    if (pageId === 'portfolio') {
        if (dashboard) dashboard.style.display = 'none';
        if (ledger) ledger.style.display = 'block';
        updatePortfolioUI();
    } else {
        if (dashboard) dashboard.style.display = 'block';
        if (ledger) ledger.style.display = 'none';
    }
}
window.navigateToPage = navigateToPage;

// Helper to close side analytics drawer
function closeAnalyticsDrawer() {
    const drawer = document.getElementById('analytics-drawer');
    const overlay = document.getElementById('drawer-overlay');
    if (drawer) drawer.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}
window.closeAnalyticsDrawer = closeAnalyticsDrawer;

// Helper to update the header analytics dropdown card
function updateHeaderStatsUI(activeInvested, presentValue, presentPnL, presentPnLPct) {
    const format = val => val >= 1000 ? '$' + val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '$' + val.toFixed(2);
    
    const headerLabel = document.getElementById('header-total-invested-label');
    if (headerLabel) headerLabel.textContent = format(activeInvested);
    
    const activeEl = document.getElementById('stat-active-invested');
    const valueEl = document.getElementById('stat-present-value');
    const pnlEl = document.getElementById('stat-present-pnl');
    const withdrawnEl = document.getElementById('stat-total-withdrawn');
    const withdrawnPnlEl = document.getElementById('stat-withdrawn-pnl');
    
    if (activeEl) activeEl.textContent = format(activeInvested);
    if (valueEl) valueEl.textContent = format(presentValue);
    
    if (pnlEl) {
        const sign = presentPnL >= 0 ? "+" : "";
        pnlEl.textContent = `${sign}${format(presentPnL)} (${sign}${presentPnLPct.toFixed(2)}%)`;
        pnlEl.style.color = presentPnL >= 0 ? "var(--secondary)" : "var(--danger)";
    }
    
    if (withdrawnEl) withdrawnEl.textContent = format(totalWithdrawnCapital);
    if (withdrawnPnlEl) {
        const sign = totalWithdrawnPnL >= 0 ? "+" : "";
        withdrawnPnlEl.textContent = `${sign}${format(totalWithdrawnPnL)}`;
        withdrawnPnlEl.style.color = totalWithdrawnPnL >= 0 ? "var(--secondary)" : "var(--danger)";
    }

    // Dynamic stats card glows
    const presentCard = document.getElementById('stat-present-pnl-card');
    if (presentCard) {
        presentCard.className = 'drawer-stat-item dynamic-glow ' + (presentPnL >= 0 ? 'profit-glow' : 'loss-glow');
    }
    
    const withdrawnCard = document.getElementById('stat-withdrawn-pnl-card');
    if (withdrawnCard) {
        withdrawnCard.className = 'drawer-stat-item dynamic-glow ' + (totalWithdrawnPnL >= 0 ? 'profit-glow' : 'loss-glow');
    }

    // Profile Dropdown summary section update
    const profileLabel = document.getElementById('profile-total-invested');
    if (profileLabel) {
        profileLabel.innerHTML = `${format(activeInvested)} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left: 2px; vertical-align: middle;"><polyline points="9 18 15 12 9 6"/></svg>`;
    }

    // Ledger page elements updates
    const ledgerInvested = document.getElementById('ledger-total-invested');
    const ledgerWithdrawn = document.getElementById('ledger-total-withdrawn');
    const ledgerPresentVal = document.getElementById('ledger-present-value');
    const ledgerPnL = document.getElementById('ledger-realized-pnl');
    const ledgerPnLCard = document.getElementById('ledger-pnl-card');

    if (ledgerInvested) ledgerInvested.textContent = format(activeInvested);
    if (ledgerWithdrawn) ledgerWithdrawn.textContent = format(totalWithdrawnCapital);
    if (ledgerPresentVal) ledgerPresentVal.textContent = format(presentValue);
    if (ledgerPnL) {
        const sign = totalWithdrawnPnL >= 0 ? "+" : "";
        ledgerPnL.textContent = `${sign}${format(totalWithdrawnPnL)}`;
        ledgerPnL.style.color = totalWithdrawnPnL >= 0 ? "var(--secondary)" : "var(--danger)";
    }
    if (ledgerPnLCard) {
        ledgerPnLCard.className = 'glass-card ' + (totalWithdrawnPnL >= 0 ? 'profit-glow' : 'loss-glow');
    }
}

// 13. Portfolio Holdings Rendering and Withdraw / Liquidation Logic
function updatePortfolioUI() {
    const portBody = document.getElementById('portfolio-positions-body');
    const withdrawBtn = document.getElementById('withdraw-all-btn');
    
    const investedEl = document.getElementById('port-total-invested');
    const valueEl = document.getElementById('port-current-value');
    const pnlEl = document.getElementById('port-unrealized-pnl');
    
    if (!portBody) return;
    
    if (activeHoldings.length === 0) {
        portBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 1.5rem 0; font-size: 0.85rem;">
                    No active holdings. Set amount on ROI card and click "Place Order" to invest!
                </td>
            </tr>
        `;
        withdrawBtn.disabled = true;
        investedEl.textContent = "$0.00";
        valueEl.textContent = "$0.00";
        pnlEl.textContent = "$0.00 (0.00%)";
        pnlEl.style.color = "var(--text-secondary)";
        
        // Update header dropdown as well
        updateHeaderStatsUI(0, 0, 0, 0);
        return;
    }
    
    withdrawBtn.disabled = false;
    
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let html = "";
    
    activeHoldings.forEach(pos => {
        const s = stocksData[pos.symbol];
        const livePrice = s.todayPrices[currentHourIndex];
        
        let currentValue = 0;
        if (pos.type === 'buy') {
            currentValue = pos.qty * livePrice;
        } else {
            currentValue = pos.invested + (pos.qty * (pos.entryPrice - livePrice));
        }
        
        const pnl = currentValue - pos.invested;
        const pnlPct = (pnl / pos.invested) * 100;
        
        totalInvested += pos.invested;
        totalCurrentValue += currentValue;
        
        const format = val => val >= 1000 ? '$' + val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '$' + val.toFixed(2);
        
        const pnlColor = pnl >= 0 ? "var(--secondary)" : "var(--danger)";
        const pnlSign = pnl >= 0 ? "+" : "";
        const typeColor = pos.type === 'buy' ? 'var(--secondary)' : 'var(--danger)';
        
        html += `
            <tr>
                <td style="padding: 0.75rem 1rem; font-weight: 600;">
                    <div style="display: flex; gap: 0.4rem; align-items: center;">
                        <span style="color: white; font-family: 'Outfit', sans-serif;">${pos.symbol}</span>
                        <span style="font-size: 0.65rem; padding: 1px 4px; border-radius: 3px; background: ${pos.type === 'buy' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; color: ${typeColor}; font-weight: bold; text-transform: uppercase;">
                            ${pos.type}
                        </span>
                    </div>
                </td>
                <td style="padding: 0.75rem 1rem; font-family: monospace;">${format(pos.invested)}</td>
                <td style="padding: 0.75rem 1rem; font-family: monospace;">${format(pos.entryPrice)}</td>
                <td style="padding: 0.75rem 1rem; font-family: monospace; color: var(--text-primary);">${format(livePrice)}</td>
                <td style="padding: 0.75rem 1rem; font-family: monospace; color: white;">${format(currentValue)}</td>
                <td style="padding: 0.75rem 1rem; font-family: monospace; font-weight: bold; color: ${pnlColor};">
                    ${pnlSign}${format(pnl)} (${pnlSign}${pnlPct.toFixed(2)}%)
                </td>
                <td style="padding: 0.75rem 1rem; text-align: right;">
                    <button class="action-btn" onclick="withdrawSinglePosition('${pos.id}')" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239,68,68,0.2); color: var(--danger); font-size: 0.75rem; padding: 2px 6px;">Withdraw</button>
                </td>
            </tr>
        `;
    });
    
    portBody.innerHTML = html;
    
    // Update banner metrics
    const totalPnL = totalCurrentValue - totalInvested;
    const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    
    investedEl.textContent = '$' + totalInvested.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    valueEl.textContent = '$' + totalCurrentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    
    const pnlSign = totalPnL >= 0 ? "+" : "";
    const formatTotal = val => val >= 1000 ? '$' + val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '$' + val.toFixed(2);
    
    pnlEl.textContent = `${pnlSign}${formatTotal(totalPnL)} (${pnlSign}${totalPnLPct.toFixed(2)}%)`;
    if (totalPnL >= 0) {
        pnlEl.style.color = "var(--secondary)";
    } else {
        pnlEl.style.color = "var(--danger)";
    }

    // Render Active Bids on Full-page Ledger
    const ledgerActiveBody = document.getElementById('ledger-active-bids-body');
    if (ledgerActiveBody) {
        if (activeHoldings.length === 0) {
            ledgerActiveBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 1.5rem 0; font-size: 0.85rem;">
                        No active bids. Return to Dashboard and place a BUY or SELL order to start trading!
                    </td>
                </tr>
            `;
        } else {
            let activeBidsHtml = "";
            activeHoldings.forEach(pos => {
                const s = stocksData[pos.symbol];
                const livePrice = s.todayPrices[currentHourIndex];
                
                let currentValue = 0;
                if (pos.type === 'buy') {
                    currentValue = pos.qty * livePrice;
                } else {
                    currentValue = pos.invested + (pos.qty * (pos.entryPrice - livePrice));
                }
                
                const pnl = currentValue - pos.invested;
                const pnlPct = (pnl / pos.invested) * 100;
                const pnlColor = pnl >= 0 ? "var(--secondary)" : "var(--danger)";
                const pnlSign = pnl >= 0 ? "+" : "";
                const typeColor = pos.type === 'buy' ? 'var(--secondary)' : 'var(--danger)';
                
                activeBidsHtml += `
                    <tr>
                        <td style="padding: 0.75rem 1rem; font-weight: 600;">
                            <div style="display: flex; gap: 0.4rem; align-items: center;">
                                <span style="color: white; font-family: 'Outfit', sans-serif;">${pos.symbol}</span>
                                <span style="font-size: 0.65rem; padding: 1px 4px; border-radius: 3px; background: ${pos.type === 'buy' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; color: ${typeColor}; font-weight: bold; text-transform: uppercase;">
                                    ${pos.type}
                                </span>
                            </div>
                        </td>
                        <td style="padding: 0.75rem 1rem; font-weight: bold; color: ${typeColor};">${pos.type.toUpperCase()}</td>
                        <td style="padding: 0.75rem 1rem; font-family: monospace;">${formatTotal(pos.invested)}</td>
                        <td style="padding: 0.75rem 1rem; font-family: monospace;">${formatTotal(pos.entryPrice)}</td>
                        <td style="padding: 0.75rem 1rem; font-family: monospace; color: var(--text-primary);">${formatTotal(livePrice)}</td>
                        <td style="padding: 0.75rem 1rem; font-family: monospace; color: white;">${formatTotal(currentValue)}</td>
                        <td style="padding: 0.75rem 1rem; font-family: monospace; font-weight: bold; color: ${pnlColor};">
                            ${pnlSign}${formatTotal(pnl)} (${pnlSign}${pnlPct.toFixed(2)}%)
                        </td>
                        <td style="padding: 0.75rem 1rem; text-align: right;">
                            <button class="action-btn" onclick="withdrawSinglePosition('${pos.id}')" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239,68,68,0.2); color: var(--danger); font-size: 0.75rem; padding: 2px 6px;">Withdraw</button>
                        </td>
                    </tr>
                `;
            });
            ledgerActiveBody.innerHTML = activeBidsHtml;
        }
    }

    // Update the sell all projection text
    const projectionText = document.getElementById('ledger-sell-all-summary');
    const projectionBtn = document.getElementById('ledger-sell-all-btn');
    if (projectionText) {
        if (activeHoldings.length === 0) {
            projectionText.innerHTML = `No active holdings to liquidate.`;
            if (projectionBtn) projectionBtn.disabled = true;
        } else {
            if (projectionBtn) projectionBtn.disabled = false;
            const pnlColor = totalPnL >= 0 ? "var(--secondary)" : "var(--danger)";
            const pnlSign = totalPnL >= 0 ? "+" : "";
            
            projectionText.innerHTML = `If you sell all active positions now at day to day market rates, you will receive a total of <strong>${formatTotal(totalCurrentValue)}</strong>, resulting in a net profit/loss of <strong style="color: ${pnlColor};">${pnlSign}${formatTotal(totalPnL)} (${pnlSign}${totalPnLPct.toFixed(2)}%)</strong>.`;
        }
    }

    // Render Closed Bids on Full-page Ledger
    const ledgerClosedBody = document.getElementById('ledger-closed-bids-body');
    if (ledgerClosedBody) {
        if (closedHoldings.length === 0) {
            ledgerClosedBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 1.5rem 0; font-size: 0.85rem;">
                        No closed bids. Withdraw active positions to realize profits!
                    </td>
                </tr>
            `;
        } else {
            let closedBidsHtml = "";
            closedHoldings.forEach(pos => {
                const pnlColor = pos.pnl >= 0 ? "var(--secondary)" : "var(--danger)";
                const pnlSign = pos.pnl >= 0 ? "+" : "";
                
                closedBidsHtml += `
                    <tr>
                        <td style="padding: 0.75rem 1rem; font-weight: 600; color: white;">${pos.symbol}</td>
                        <td style="padding: 0.75rem 1rem; font-weight: 700; color: ${pos.type === 'buy' ? 'var(--secondary)' : 'var(--danger)'};">${pos.type.toUpperCase()}</td>
                        <td style="padding: 0.75rem 1rem; font-family: monospace;">${formatTotal(pos.entryPrice)}</td>
                        <td style="padding: 0.75rem 1rem; font-family: monospace;">${formatTotal(pos.exitPrice)}</td>
                        <td style="padding: 0.75rem 1rem; font-family: monospace;">${formatTotal(pos.invested)}</td>
                        <td style="padding: 0.75rem 1rem; font-family: monospace; color: white;">${formatTotal(pos.withdrawn)}</td>
                        <td style="padding: 0.75rem 1rem; font-family: monospace; font-weight: bold; color: ${pnlColor};">
                            ${pnlSign}${formatTotal(pos.pnl)}
                        </td>
                        <td style="padding: 0.75rem 1rem; text-align: right; color: var(--text-muted); font-size: 0.75rem;">${pos.time}</td>
                    </tr>
                `;
            });
            ledgerClosedBody.innerHTML = closedBidsHtml;
        }
    }
    
    updateHeaderStatsUI(totalInvested, totalCurrentValue, totalPnL, totalPnLPct);
}
window.updatePortfolioUI = updatePortfolioUI;

async function withdrawSinglePosition(id) {
    const pos = activeHoldings.find(p => p.id === id);
    if (!pos) return;
    
    const s = stocksData[pos.symbol];
    const livePrice = s.todayPrices[currentHourIndex];
    
    try {
        const res = await fetch('/api/portfolio/withdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, livePrice })
        });
        const data = await res.json();
        if (data.success) {
            userFunds = data.funds;
            activeHoldings = data.activeHoldings;
            closedHoldings = data.closedHoldings;
            
            updateUserFundsUI();
            playSuccessChime();
            
            let currentValue = 0;
            if (pos.type === 'buy') {
                currentValue = pos.qty * livePrice;
            } else {
                currentValue = pos.invested + (pos.qty * (pos.entryPrice - livePrice));
            }
            const pnl = currentValue - pos.invested;
            const pnlSign = pnl >= 0 ? "+" : "";
            showToast(`💰 Withdrew position for ${pos.symbol}! Returned $${currentValue.toFixed(2)} (PnL: ${pnlSign}$${pnl.toFixed(2)})`, pnl >= 0 ? 'buy' : 'sell');
            
            updateUI();
            updatePortfolioUI();
        }
    } catch (err) {
        console.error('Withdraw single position failed:', err);
    }
}
window.withdrawSinglePosition = withdrawSinglePosition;

async function withdrawAllPositions() {
    if (activeHoldings.length === 0) return;
    
    const livePrices = {};
    activeHoldings.forEach(pos => {
        const s = stocksData[pos.symbol];
        livePrices[pos.symbol] = s.todayPrices[currentHourIndex];
    });
    
    try {
        const res = await fetch('/api/portfolio/withdraw-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ livePrices })
        });
        const data = await res.json();
        if (data.success) {
            userFunds = data.funds;
            activeHoldings = data.activeHoldings;
            closedHoldings = data.closedHoldings;
            
            updateUserFundsUI();
            playSuccessChime();
            
            showToast(`💰 Liquidated Portfolio! Returned funds to account balance.`, 'buy');
            
            updateUI();
            updatePortfolioUI();
        }
    } catch (err) {
        console.error('Withdraw all positions failed:', err);
    }
}
window.withdrawAllPositions = withdrawAllPositions;

// 14. Authentication and Dashboard Gateway Controllers

function switchAuthTab(mode) {
    const loginTab = document.getElementById('auth-tab-login');
    const signupTab = document.getElementById('auth-tab-signup');
    const submitBtn = document.getElementById('auth-submit-btn');
    const errBox = document.getElementById('auth-error-box');
    
    if (errBox) errBox.style.display = 'none';
    
    if (mode === 'login') {
        if (loginTab) loginTab.classList.add('active');
        if (signupTab) signupTab.classList.remove('active');
        if (submitBtn) {
            submitBtn.textContent = 'Unlock Dashboard';
            submitBtn.dataset.mode = 'login';
        }
    } else {
        if (loginTab) loginTab.classList.remove('active');
        if (signupTab) signupTab.classList.add('active');
        if (submitBtn) {
            submitBtn.textContent = 'Register & Unlock';
            submitBtn.dataset.mode = 'signup';
        }
    }
}
window.switchAuthTab = switchAuthTab;

async function handleAuthSubmit(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('auth-username');
    const passwordInput = document.getElementById('auth-password');
    const submitBtn = document.getElementById('auth-submit-btn');
    const errBox = document.getElementById('auth-error-box');
    
    const mode = submitBtn.dataset.mode || 'login';
    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: usernameInput.value,
                password: passwordInput.value
            })
        });
        const data = await res.json();
        if (data.success) {
            usernameInput.value = '';
            passwordInput.value = '';
            if (errBox) errBox.style.display = 'none';
            checkAuthStatus();
        } else {
            if (errBox) {
                errBox.textContent = data.message || 'Error occurred. Please try again.';
                errBox.style.display = 'block';
            }
        }
    } catch (err) {
        if (errBox) {
            errBox.textContent = 'Server connection failed.';
            errBox.style.display = 'block';
        }
    }
}
window.handleAuthSubmit = handleAuthSubmit;

function triggerSocialAuth(provider) {
    const width = 500;
    const height = 600;
    const left = (screen.width / 2) - (width / 2);
    const top = (screen.height / 2) - (height / 2);
    
    const mockPopup = window.open('', `${provider}_auth`, `width=${width},height=${height},left=${left},top=${top}`);
    
    let titleColor = "#ea4335"; 
    if (provider === 'facebook') titleColor = "#3b5998";
    if (provider === 'github') titleColor = "#24292e";
    
    const popupContent = `
        <html>
        <head>
            <title>Sign In - ${provider.toUpperCase()}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;800&display=swap" rel="stylesheet">
            <style>
                body {
                    background: #0f172a;
                    color: #f8fafc;
                    font-family: 'Inter', sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    padding: 20px;
                    box-sizing: border-box;
                }
                .card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    padding: 30px;
                    text-align: center;
                    max-width: 380px;
                    width: 100%;
                }
                h2 {
                    font-family: 'Outfit', sans-serif;
                    font-size: 1.5rem;
                    margin-bottom: 5px;
                    color: ${titleColor};
                }
                p {
                    font-size: 0.85rem;
                    color: #94a3b8;
                    margin-bottom: 25px;
                }
                input {
                    background: rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    padding: 10px 15px;
                    border-radius: 6px;
                    width: 100%;
                    box-sizing: border-box;
                    margin-bottom: 15px;
                    outline: none;
                }
                button {
                    background: ${titleColor};
                    color: white;
                    border: none;
                    padding: 12px;
                    font-weight: bold;
                    width: 100%;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                }
                button:hover {
                    opacity: 0.9;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>Secure Sign In</h2>
                <p>Authorize <strong>StockSense AI</strong> to access your public profile details from your ${provider} account.</p>
                <input type="text" id="name" placeholder="Enter Full Name" value="Varun Sharma">
                <input type="email" id="email" placeholder="Enter Email" value="varun.sharma@${provider}.com">
                <button onclick="authorize()">Grant Access & Authorize</button>
            </div>
            <script>
                function authorize() {
                    const name = document.getElementById('name').value;
                    const email = document.getElementById('email').value;
                    window.opener.handleSocialCallback('${provider}', name, email);
                    window.close();
                }
            </script>
        </body>
        </html>
    `;
    
    mockPopup.document.write(popupContent);
}
window.triggerSocialAuth = triggerSocialAuth;

async function handleSocialCallback(provider, name, email) {
    try {
        const res = await fetch('/api/auth/social-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: name, email, provider })
        });
        const data = await res.json();
        if (data.success) {
            checkAuthStatus();
        } else {
            alert('Social authentication failed.');
        }
    } catch (err) {
        alert('Social authentication backend server offline.');
    }
}
window.handleSocialCallback = handleSocialCallback;

async function checkAuthStatus() {
    try {
        const res = await fetch('/api/auth/status');
        const data = await res.json();
        const authView = document.getElementById('auth-view');
        const appContainer = document.querySelector('.app-container');
        
        if (data.loggedIn) {
            if (authView) authView.style.display = 'none';
            if (appContainer) appContainer.style.display = 'flex';
            
            const profileNameEl = document.querySelector('.user-fullname');
            const profileEmailEl = document.querySelector('.card-email');
            const avatarSpanEl = document.querySelector('.google-avatar-btn span');
            const largeAvatarSpanEl = document.querySelector('.large-avatar span');
            
            if (profileNameEl) profileNameEl.textContent = data.user.username;
            if (profileEmailEl) {
                const normEmail = data.user.username.toLowerCase().replace(/\s/g, '');
                profileEmailEl.textContent = `${normEmail}@stocksense.ai`;
            }
            
            const initials = data.user.username.split(' ').map(n => n[0]).join('').toUpperCase().substr(0, 2);
            if (avatarSpanEl) avatarSpanEl.textContent = initials;
            if (largeAvatarSpanEl) largeAvatarSpanEl.textContent = initials;
            
            userFunds = data.user.funds;
            updateUserFundsUI();
            
            fetchPortfolioData();
        } else {
            if (authView) authView.style.display = 'flex';
            if (appContainer) appContainer.style.display = 'none';
        }
    } catch (err) {
        console.error('Auth verification failed:', err);
    }
}
window.checkAuthStatus = checkAuthStatus;

async function fetchPortfolioData() {
    try {
        const res = await fetch('/api/portfolio');
        const data = await res.json();
        if (data.success) {
            userFunds = data.funds;
            activeHoldings = data.activeHoldings;
            closedHoldings = data.closedHoldings;
            updateUserFundsUI();
            updatePortfolioUI();
        }
    } catch (err) {
        console.error('Failed to sync portfolio data:', err);
    }
}
window.fetchPortfolioData = fetchPortfolioData;

async function logoutUser() {
    try {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            checkAuthStatus();
        }
    } catch (err) {
        console.error('Sign Out failed:', err);
    }
}
window.logoutUser = logoutUser;

// 15. Bootstrapper
window.addEventListener('DOMContentLoaded', () => {
    initializeData();
    setupEventListeners();
    updateTopTicker();
    checkAuthStatus();
    updateUI();
    updateChart();
    updateTrustLedger();
    startLiveTicks();
});
