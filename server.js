require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const SESSION_SECRET = process.env.SESSION_SECRET || 'stocksense-ai-super-secret-key-1783359';
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware Setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: false // set true in production if running HTTPS
    }
}));

// Local JSON Database Helper functions
function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2));
    }
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (err) {
        return { users: {} };
    }
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// API: Authentication Gateway

// Classic Registration (Sign Up)
app.post('/api/auth/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }
    
    const db = readDB();
    const normUser = username.toLowerCase().trim();
    if (db.users[normUser]) {
        return res.status(400).json({ success: false, message: 'Username already exists.' });
    }
    
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        db.users[normUser] = {
            username: username.trim(),
            passwordHash,
            provider: 'classic',
            funds: 45230.00,
            activeHoldings: [],
            closedHoldings: []
        };
        writeDB(db);
        
        req.session.username = normUser;
        res.json({ success: true, user: { username: db.users[normUser].username, funds: db.users[normUser].funds } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error hashing password credentials.' });
    }
});

// Classic Login (Sign In)
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }
    
    const db = readDB();
    const normUser = username.toLowerCase().trim();
    const user = db.users[normUser];
    if (!user || user.provider !== 'classic') {
        return res.status(400).json({ success: false, message: 'Invalid username or password.' });
    }
    
    try {
        const matches = await bcrypt.compare(password, user.passwordHash);
        if (!matches) {
            return res.status(400).json({ success: false, message: 'Invalid username or password.' });
        }
        
        req.session.username = normUser;
        res.json({ success: true, user: { username: user.username, funds: user.funds } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error verifying credentials.' });
    }
});

// Mock Social OAuth Gateway (Google, Facebook, GitHub)
app.post('/api/auth/social-login', (req, res) => {
    const { username, email, provider } = req.body;
    if (!username || !provider) {
        return res.status(400).json({ success: false, message: 'Missing social profile fields.' });
    }
    
    const db = readDB();
    const suffix = email ? email : username;
    const normUser = `${provider}_${suffix}`.toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    if (!db.users[normUser]) {
        db.users[normUser] = {
            username: username.trim(),
            email: email || '',
            provider,
            funds: 45230.00,
            activeHoldings: [],
            closedHoldings: []
        };
        writeDB(db);
    }
    
    req.session.username = normUser;
    res.json({ success: true, user: { username: db.users[normUser].username, funds: db.users[normUser].funds } });
});

// Session Auth status resolver
app.get('/api/auth/status', (req, res) => {
    if (!req.session.username) {
        return res.json({ loggedIn: false });
    }
    const db = readDB();
    const user = db.users[req.session.username];
    if (!user) {
        return res.json({ loggedIn: false });
    }
    res.json({
        loggedIn: true,
        user: {
            username: user.username,
            funds: user.funds,
            provider: user.provider
        }
    });
});

// Sign Out (Logout)
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// API: Portfolio Operations Gateways

// Get Portfolio data
app.get('/api/portfolio', (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ success: false, message: 'Unauthorized session' });
    }
    const db = readDB();
    const user = db.users[req.session.username];
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
        success: true,
        funds: user.funds,
        activeHoldings: user.activeHoldings || [],
        closedHoldings: user.closedHoldings || []
    });
});

// Place Buy or Sell Bid Order
app.post('/api/portfolio/order', (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ success: false, message: 'Unauthorized session' });
    }
    const { symbol, type, qty, entryPrice, invested } = req.body;
    const db = readDB();
    const user = db.users[req.session.username];
    
    if (user.funds < invested) {
        return res.status(400).json({ success: false, message: 'Insufficient Available Funds.' });
    }
    
    user.funds -= parseFloat(invested);
    const newPosition = {
        id: Math.random().toString(36).substr(2, 9),
        symbol,
        type,
        qty: parseFloat(qty),
        entryPrice: parseFloat(entryPrice),
        invested: parseFloat(invested),
        timestamp: new Date().toISOString()
    };
    
    if (!user.activeHoldings) user.activeHoldings = [];
    user.activeHoldings.push(newPosition);
    writeDB(db);
    
    res.json({ success: true, funds: user.funds, activeHoldings: user.activeHoldings });
});

// Withdraw / Liquidate single position
app.post('/api/portfolio/withdraw', (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ success: false, message: 'Unauthorized session' });
    }
    const { id, livePrice } = req.body;
    const db = readDB();
    const user = db.users[req.session.username];
    
    if (!user.activeHoldings) user.activeHoldings = [];
    const posIndex = user.activeHoldings.findIndex(p => p.id === id);
    if (posIndex === -1) {
        return res.status(404).json({ success: false, message: 'Position not found.' });
    }
    
    const pos = user.activeHoldings[posIndex];
    let currentValue = 0;
    if (pos.type === 'buy') {
        currentValue = pos.qty * parseFloat(livePrice);
    } else {
        currentValue = pos.invested + (pos.qty * (pos.entryPrice - parseFloat(livePrice)));
    }
    
    const pnl = currentValue - pos.invested;
    user.funds += currentValue;
    
    if (!user.closedHoldings) user.closedHoldings = [];
    user.closedHoldings.push({
        symbol: pos.symbol,
        type: pos.type,
        entryPrice: pos.entryPrice,
        exitPrice: parseFloat(livePrice),
        invested: pos.invested,
        withdrawn: currentValue,
        pnl: pnl,
        time: new Date().toLocaleTimeString()
    });
    
    user.activeHoldings.splice(posIndex, 1);
    writeDB(db);
    
    res.json({ success: true, funds: user.funds, activeHoldings: user.activeHoldings, closedHoldings: user.closedHoldings });
});

// Liquidate/Withdraw all positions
app.post('/api/portfolio/withdraw-all', (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ success: false, message: 'Unauthorized session' });
    }
    const { livePrices } = req.body; // e.g. { AAPL: 174.50, TSLA: 180.20, ... }
    const db = readDB();
    const user = db.users[req.session.username];
    
    if (!user.activeHoldings || user.activeHoldings.length === 0) {
        return res.status(400).json({ success: false, message: 'No active holdings.' });
    }
    
    let totalReturn = 0;
    if (!user.closedHoldings) user.closedHoldings = [];
    
    user.activeHoldings.forEach(pos => {
        const livePrice = parseFloat(livePrices[pos.symbol] || pos.entryPrice);
        let currentValue = 0;
        if (pos.type === 'buy') {
            currentValue = pos.qty * livePrice;
        } else {
            currentValue = pos.invested + (pos.qty * (pos.entryPrice - livePrice));
        }
        const pnl = currentValue - pos.invested;
        totalReturn += currentValue;
        
        user.closedHoldings.push({
            symbol: pos.symbol,
            type: pos.type,
            entryPrice: pos.entryPrice,
            exitPrice: livePrice,
            invested: pos.invested,
            withdrawn: currentValue,
            pnl: pnl,
            time: new Date().toLocaleTimeString()
        });
    });
    
    user.funds += totalReturn;
    user.activeHoldings = [];
    writeDB(db);
    
    res.json({ success: true, funds: user.funds, activeHoldings: [], closedHoldings: user.closedHoldings });
});

// Sync user funds manually
app.post('/api/portfolio/sync-funds', (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ success: false, message: 'Unauthorized session' });
    }
    const { funds } = req.body;
    const db = readDB();
    const user = db.users[req.session.username];
    user.funds = parseFloat(funds);
    writeDB(db);
    
    res.json({ success: true, funds: user.funds });
});

// Serve Dashboard Static Files
app.use(express.static(__dirname));

// Send fallback requests to main interface
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server Listen
app.listen(PORT, () => {
    console.log(`[STATEFUL BACKEND] Server listening on http://localhost:${PORT}`);
});
