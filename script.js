const GAME_WIDTH = 650;
const GAME_HEIGHT = 500;
const STORAGE_KEY = 'restaurant_tycoon_save_v2';
const DYNAMIC_EVENTS = [
    {
        id: 'rushHour',
        name: 'Dinner rush',
        description: 'Customers arrive much faster',
        duration: 20000,
        effect: {type: 'spawnRate', multiplier: 1.8},
        announcement: 'Dinner rush! Keep the line moving.'
    }, {
        id: 'criticsNight',
        name: 'Critic visit',
        description: 'A critic will visit you, earn extra tips!',
        duration: 18000,
        effect: {type: 'payout', multiplier: 1.4},
        announcement: 'A food critic arrived, make sure you deliver perfection!',
        miniGame: 'quickChop'
    },
    {
        id: 'chefFocus',
        name: 'Chef Focus',
        description: 'The kitchen is locked in. Cooking is faster.',
        duration: 15000,
        effect: {type: 'cookSpeed', multiplier: 1.5},
        announcement: 'Chefs found their rhythm—meals cook quicker!'
    }
];
const MINIGAMES = {
    quickChop: {
        id: 'quickChop',
        name: 'Quick Chop',
        instruction: 'Tap the Chop button 7 times before the timer ends to boost cooking speed!',
        actionLabel: 'Chop!',
        clicksRequired: 7,
        duration: 6000,
        reward: {type: 'cookSpeed', multiplier: 1.6, duration: 25000},
        cooldown: 45000,
        retryDelay: 25000,
        successMessage: 'Flawless prep! Cooking speed boosted.',
        failMessage: 'Prep was garbage. No boost this time :('
    }
}
const THEMES = [
    {
        name: "Local bistro",
        background: "#eecfa1",
        border: "#8d6e63",
        items: [
            {id: 'salad', name: "Salad", price: 15, time: 2000, color: "#2ecc71"},
            {id: 'burger', name: "Burger", price: 30, time: 5000, color: "#d35400"},
            {id: 'steak', name: "Steak", price: 50, time: 8000, color: "#c0392b"}
        ]
    },
    {
        name: "Downtown Pizza",
        background: "#fdedec", 
        border: "#e74c3c",
        items: [
            {id: 'salad', name: "Knots", price: 20, time: 2000, color: "#f1c40f"},
            {id: 'burger', name: "Slice", price: 40, time: 5000, color: "#e67e22"},
            {id: 'steak', name: "Deep Dish", price: 70, time: 8000, color: "#c0392b"}
        ]
    },
    {
        name: "Royal Steakhouse",
        bg: "#2c3e50",
        border: "#f1c40f",
        items: [
            {id: 'salad', name: "Bisque", price: 50, time: 2000, color: "#ecf0f1"},
            {id: 'burger', name: "Tartare", price: 100, time: 5000, color: "#e74c3c"},
            {id: 'steak', name: "Wagyu", price: 200, time: 8000, color: "#f39c12"}
        ]
    },
    {
        name: "Cyber Cafe 2077",
        bg: "#000000",
        border: "#00ffcc",
        items: [
            {id: 'salad', name: "Data Chip", price: 100, time: 2000, color: "#00ffcc"},
            {id: 'burger', name: "Nutri-Paste", price: 250, time: 5000, color: "#ff00ff"},
            {id: 'steak', name: "Plasma Rib", price: 500, time: 8000, color: "#ffff00"}
        ]
    }
]
;
const STOCK_PRICES = {salad: 20, burger: 40, steak: 80};
const STOCK_PACK_SIZE = 5;
let state = {
    money: 200,
    tables: [],
    customers: [],
    customerQueue: 0,
    idCounter: 0,
    lastSpawn: 0,
    prestigeLevel: 0,
    staff: {
        waiters: 0,
        chefs: 0
    },
    upgrades: {
        marketing: false,
        fastCook: false,
        highPrice: false
    },
    inventory: {
        salad: 10,
        burger: 10,
        steak: 10
    },
    lastStaffAction: 0,
    modifiers: {
        spawnRate: 1,
        cookSpeed: 1,
        payout: 1
    },
    modifierEffects: [],
    events: {
        current: null,
        nextTrigger: null
    },
    miniGame: {
        active: false,
        nextOffer: null,
        type: null,
        progress: 0,
        endAt: null,
        pendingType: null,
    },
    alerts: {lowStock: {salad: false, burger: false, steak: false}}
};
const gameArea = document.getElementById('game-area');
const money = document.getElementById('money');
const message = document.getElementById('message-box');
const queue = document.getElementById('queue-count');
const stove = document.getElementById('stove');
const gameTitle = document.getElementById('game-title');
const buttonBuyTable = document.getElementById('button-buy-table');
const buttonHireWaiter = document.getElementById('button-hire-waiter');
const buttonHireChef = document.getElementById('button-hire-chef');
const waiterCount = document.getElementById('waiter-count');
const chefCount = document.getElementById('chef-count');
const buttonBuyUpgradeMarketing = document.getElementById('button-upgrade-marketing');
const buttonBuyUpgradeSpeed = document.getElementById('button-upgrade-speed');
const buttonBuyUpgradeProfit = document.getElementById('button-upgrade-profit')
const buttonBuy1 = document.getElementById('button-buy-1');
const buttonBuy2 = document.getElementById('button-buy-2');
const buttonBuy3 = document.getElementById('button-buy-3');
const stock1 = document.getElementById('stock-1');
const stock2 = document.getElementById('stock-2');
const stock3 = document.getElementById('stock-3');
const buttonPrestige = document.getElementById('button-prestige')
const prestigeMult = document.getElementById('prestige-mult');
const hud = document.getElementById('hud');
const topAlert = document.getElementById('top-alert');
let eventBanner = null;
let miniGameOverlay = null;
let miniGameTitle = null;
let miniGameInstruction = null;
let miniGameProgress = null;
let miniGameActionButton = null;
let miniGameCancelButton = null;
let topAlertTimeout = null;

function getRecipes() {
    const theme = getTheme();
    return theme.items.map(item => ({...item, stockKey: item.id}));
}

function init() {
    createDynamicUI();
    const loaded = loadGame();
    if (!loaded) {
        applyTheme();
        updateUI();
        const now = Date.now();
        scheduleNextEvent(now);
        scheduleNextMiniGame(now);
    } else {
        const now = Date.now();
        if (!state.events.nextTrigger) scheduleNextEvent(now);
        if (!state.miniGame.nextOffer) scheduleNextMiniGame(now);
    }
    requestAnimationFrame(gameLoop);
    setInterval(saveGame, 10000);
}
function resetGame() {
    if (confirm("Are you sure? This will delete your save file.")) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}
function saveGame() {
    cleanupModifiers(Date.now());
    const saveState = {
        money: state.money,
        idCounter: state.idCounter,
        staff: state.staff,
        upgrades: state.upgrades,
        inventory: state.inventory,
        prestigeLevel: state.prestigeLevel, 
        tables: state.tables.map(t => ({
            id: t.id,
            x: t.x,
            y: t.y
        })),
        modifierEffects: state.modifierEffects,
        events: state.events,
        miniGame: {nextOffer: state.miniGame.nextOffer}
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveState));
    const originalText = message.textContent;
    showMessage("Game saved!");
    setTimeout(() => {
        if (message.textContent === "Game saved!") showMessage(originalText);
    }, 2000);
}
function loadGame() {
    const savedJSON = localStorage.getItem(STORAGE_KEY);
    if (!savedJSON) return false;
    try {
        const savedState = JSON.parse(savedJSON);
        state.money = savedState.money;
        state.idCounter = savedState.idCounter;
        state.staff = savedState.staff;
        state.upgrades = savedState.upgrades;
        state.inventory = savedState.inventory || {salad: 10, burger: 10, steak: 10};
        state.alerts = savedState.alerts || {lowStock: {salad: false, burger: false, steak: false}};
        state.prestigeLevel = savedState.prestigeLevel || 0;
        state.modifierEffects = savedState.modifierEffects || [];
        recalcModifiers();
        cleanupModifiers(Date.now());
        state.events = savedState.events || {current: null, nextTrigger: null};
        const now = Date.now();
        if (state.events.current) {
            const eventDef = DYNAMIC_EVENTS.find(e => e.id === state.events.current.id);
            if (!eventDef || now >= state.events.current.endAt) {
                state.events.current = null;
            } else {
                showEventBanner(eventDef);
                if (!state.modifierEffects.find(mod => mod.id === `event-${eventDef.id}`) && eventDef.effect) {
                    activateModifier({
                        id: `event-${eventDef.id}`,
                        type: eventDef.effect.type,
                        multiplier: eventDef.effect.multiplier,
                        expiresAt: state.events.current.endAt
                    });
                }
            }
        }
        if (!state.events.nextTrigger || state.events.nextTrigger < now) scheduleNextEvent(now);
        const savedMiniGame = savedState.miniGame || {};
        state.miniGame = {
            active: false,
            nextOffer: savedMiniGame.nextOffer || null,
            type: null,
            progress: 0,
            endAt: null,
            pendingType: null
        };
        if (!state.miniGame.nextOffer || state.miniGame.nextOffer < now) scheduleNextMiniGame(now);
        applyTheme();
        updateUI();
        return true;
    } catch (e) {
        console.error("Save file corrupted", e);
        return false;
    }
}
function triggerPrestige() {
    if (state.money < 5000) {
        showMessage("Need $5,000 to expand!");
        return;
    }
    if (confirm("Sell your restaurant to open a better one? You will lose all cash, staff, tables and stock, but gain +50% permanent profits.")) {
        state.prestigeLevel++;
        state.money = 200;
        state.tables = [];
        state.customers = [];
        state.staff = {waiters: 0, chefs: 0};
        state.upgrades = {marketing: false, fastCook: false, highPrice: false};
        state.inventory = {salad: 10, burger: 10, steak: 10};
        state.modifiers = {spawnRate: 1, cookSpeed: 1, payout: 1};
        state.modifierEffects = [];
        state.events = {current: null, nextTrigger: Date.now() + getRandomInt(20000, 35000)};
        state.miniGame = {
            active: false,
            nextOffer: Date.now() + getRandomInt(35000, 50000),
            type: null,
            progress: 0,
            endAt: null,
            pendingType: null
        };
        state.alerts = {lowStock: {salad: false, burger: false, steak: false}};
        hideEventBanner();
        if (miniGameOverlay) miniGameOverlay.style.display = 'none';
        
        gameArea.innerHTML = `
        <div id="kitchen">
            <div class="kitchen-label">KITCHEN</div>
            <div class="kitchen-stock">
                <div id="stock-1" class="stock-item"></div>
                <div id="stock-2" class="stock-item"></div>
                <div id="stock-3" class="stock-item"></div>
            </div>
            <div id="stove"></div>
        </div>
        <div id="staff-area">
            <div>Waiters: <span id="waiter-count">0</span></div>
            <div>Chefs: <span id="chef-count">0</span></div>
        </div>
        `;
        saveGame();
        location.reload();
    }
}
function getTheme() {
    const a = Math.min(state.prestigeLevel, THEMES.length - 1);
    const theme = THEMES[a];
    if (!theme.background && theme.bg) return {...theme, background: theme.bg};
    return theme;
}
function applyTheme() {
    const theme = getTheme();
    gameTitle.textContent = theme.name;
    gameArea.style.backgroundColor = theme.background;
    gameArea.style.borderColor = theme.border;
    buttonBuy1.textContent = `Buy ${theme.items[0].name} ($${STOCK_PRICES.salad})`;
    buttonBuy2.textContent = `Buy ${theme.items[1].name} ($${STOCK_PRICES.burger})`;
    buttonBuy3.textContent = `Buy ${theme.items[2].name} ($${STOCK_PRICES.steak})`;
}
function gameLoop(timestamp) {
    const now = Date.now();
    cleanupModifiers(now);
    handleEvents(now);
    handleMiniGames(now);
    const baseSpawnRate = state.upgrades.marketing ? 1500 : 3000;
    const spawnRate = baseSpawnRate / Math.max(state.modifiers.spawnRate, 0.1);
    if (timestamp - state.lastSpawn > spawnRate) {
        if (Math.random() > 0.3 && state.customerQueue < 10) {
            state.customerQueue++;
            updateUI();
        }
        state.lastSpawn = timestamp;
    }
    processQueue();
    if (timestamp - state.lastStaffAction > 1000) {
        runStaffLogic();
        state.lastStaffAction = timestamp;
    }
    requestAnimationFrame(gameLoop);
}
function processQueue() {
    if (state.customerQueue > 0) {
        const emptyTable = state.tables.find(t => t.occupiedBy === null);
        if (emptyTable) {
            state.customerQueue--;
            spawnCustomer(emptyTable);
            updateUI();
        }
    }
}
function buyStock(type) {
    const price = STOCK_PRICES[type];
    if (state.money >= price) {
        state.money -= price;
        state.inventory[type] += STOCK_PACK_SIZE;
        updateUI();
        saveGame();
    } else {
        showMessage(`Need $${price}!`)
    }
}
function updateStockDisplay() {
    const theme = getTheme();
    stock1.textContent = `${theme.items[0].name}: ${state.inventory.salad}`;
    stock2.textContent = `${theme.items[1].name}: ${state.inventory.burger}`;
    stock3.textContent = `${theme.items[2].name}: ${state.inventory.steak}`;
    checkLowStock('salad', stock1, state.inventory.salad, theme.items[0].name);
    checkLowStock('burger', stock2, state.inventory.burger, theme.items[1].name);
    checkLowStock('steak', stock3, state.inventory.steak, theme.items[2].name);
}
function checkLowStock(type, element, amount, label) {
    if (amount <= 2) {
        element.classList.add('stock-low');
        if (!state.alerts.lowStock[type]) {
            showTopAlert(`${label} stock is running low!`);
            state.alerts.lowStock[type] = true;
        }
    } else {
        element.classList.remove('stock-low');
        if (state.alerts.lowStock[type]) {
            state.alerts.lowStock[type] = false;
        }
    }
}
function buyUpgrade(type) {
    let cost = 0;
    let name = "";
    if (type === 'marketing') {cost = 450; name = "Marketing";}
    else if (type === 'fastCook') {cost = 650; name = "Faster cooking";}
    else if (type === 'highPrice') {cost = 850; name = "Premium Menu";}
    if (state.money >= cost && !state.upgrades[type]) {
        state.money -= cost;
        state.upgrades[type] = true;
        showMessage(`${name} Purchased!`);
        updateUI();
    } else if (state.upgrades[type]) {
        showMessage("You already own this!");
    } else {
        showMessage(`Need $${cost} for ${name}!`)
    }
}
function hireWaiter() {
    const hireCost = 400;
    if (state.money >= hireCost) {
        state.money -= hireCost;
        state.staff.waiters++;
        showMessage("Waiter hired, they will take orders and collect cash.");
        updateUI();
    } else {
        showMessage(`Need $${hireCost} to hire a waiter!`)
    }
}
function hireChef() {
    const hireCost = 400;
    if (state.money >= hireCost) {
        state.money -= hireCost;
        state.staff.chefs++;
        showMessage("Chef hired, they will serve ready food.");
        updateUI();
    } else {
        showMessage(`Need $${hireCost} to hire a chef`);
    }
}
function runStaffLogic() {
    let waiterMoves = state.staff.waiters;
    if (waiterMoves > 0) {
        for (let i = 0; i < state.customers.length; i++) {
            if (waiterMoves <= 0) break;
            const customer = state.customers[i];
            if (customer.status === 'ready_to_pay') {
                handleCustomerClick(customer);
                waiterMoves--;
                createEffect(customer.element.style.left, customer.element.style.top, "🤵")
            } else if (customer.status === 'ready_to_order') {
                const stockType = customer.order.stockKey;
                if (state.inventory[stockType] > 0) {
                    handleCustomerClick(customer);
                    waiterMoves--;
                    createEffect(customer.element.style.left, customer.element.style.top, "📝");
                }
            }
        }
    }
    let chefMoves = state.staff.chefs;
    if (chefMoves > 0) {
        const readyOrders = Array.from(document.querySelectorAll('.kitchen-order.order-ready'));
        for (let order of readyOrders) {
            if (chefMoves <= 0) break;
            order.click(); 
            chefMoves--;
            const rect = order.getBoundingClientRect();
            createEffect("600px", (rect.top - 80) + "px", "👨‍🍳");
        }
    }
}
function createEffect(x, y, emoji) {
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = x;
    element.style.top = y;
    element.style.fontSize = '20px';
    element.style.zIndex = '100';
    element.style.pointerEvents = 'none';
    element.textContent = emoji;
    element.style.transition = 'top 1s ease, opacity 1s ease';
    gameArea.appendChild(element);

    requestAnimationFrame(() => {
        element.style.top = (parseInt(y) - 30) + 'px';
        element.style.opacity = '0';
    });
    setTimeout(() => element.remove(), 1000);
}
function buyTable() {
    if (state.money >= 100) {
        state.money -= 100;
        const col = state.tables.length % 4;
        const row = Math.floor(state.tables.length / 4);
        const x = 50 + (col * 150);
        const y = 50 + (row * 120);
        if (state.tables.length < 12) {
            const table = {
                id: `table-${state.idCounter++}`,
                x: x,
                y: y,
                occupiedBy: null,
                element: null
            };
            createTableElement(table);
            state.tables.push(table);
            updateUI();
            showMessage("Table purchased! Waiting for customers...");
            saveGame();
        } else {
            showMessage("Restaurant full, no more space.")
        }
    } else {
        showMessage("Not enough cash!")
    }
}
function createTableElement(tableData) {
    const element = document.createElement('div');
    element.className = 'table';
    element.style.left = tableData.x + 'px';
    element.style.top = tableData.y + 'px';
    element.textContent = "Table";
    gameArea.appendChild(element);
    tableData.element = element;
}
function spawnCustomer(table) {
    const recipes = getRecipes();
    const chosenRecipe = recipes[Math.floor(Math.random() * recipes.length)];
    const customer = {
        id: `cust-${state.idCounter++}`,
        tableId: table.id,
        status: 'seated',
        order: chosenRecipe,
        element: null,
        bubble: null
    };
    table.occupiedBy = customer.id;
    const element = document.createElement('div');
    element.className = 'customer';
    element.style.top = (table.y - 10) + 'px';
    element.style.left = (table.x + 25) + 'px';
    element.onclick = () => handleCustomerClick(customer);

    const bubble = document.createElement('div');
    bubble.className = 'status-bubble';
    bubble.textContent = "Order!";
    element.appendChild(bubble);
    gameArea.appendChild(element);
    customer.element = element;
    customer.bubble = bubble;
    state.customers.push(customer);
    setTimeout(() => {
        setCustomerState(customer, 'ready_to_order');
    }, 1000);
}
function setCustomerState(customer, status) {
    customer.status = status;
    const element = customer.element;
    if (status === 'ready_to_order') {
        customer.bubble.textContent = `${customer.order.name}?`;
        customer.bubble.style.color = customer.order.color;
        customer.bubble.style.borderColor = customer.order.color;
        element.classList.add('needs-attention');
        element.style.backgroundColor = '#e74c3c';
    }
    else if (status === 'waiting_food') {
        customer.bubble.textContent = "Waiting...";
        customer.bubble.style.color = '#383636';
        customer.bubble.style.borderColor = '#9b9696';
        element.classList.remove('needs-attention');
        element.style.backgroundColor = '#3498db';
    }
    else if (status === 'eating') {
        customer.bubble.textContent = "yum!";
        element.style.backgroundColor = '#f1c40f';
        setTimeout(() => {
            setCustomerState(customer, 'ready_to_pay');
        }, 4000);
    }
    else if (status === 'ready_to_pay') {
        customer.bubble.textContent = "Pay $";
        element.classList.add('needs-attention');
        element.style.backgroundColor = '#2ecc71';
    }
}
function handleCustomerClick(customer) {
    if (customer.status === 'ready_to_order') {
        const stockType = customer.order.stockKey;
        if (state.inventory[stockType] > 0) {
            state.inventory[stockType]--;
            sendOrderToKitchen(customer);
            setCustomerState(customer, 'waiting_food');
            showMessage(`Ordering ${customer.order.name}...`);
            updateUI();
        } else {
            showMessage(`Out of ${customer.order.name}! Buy Stock!`)
        }
    }
    else if (customer.status === 'ready_to_pay') {
        collectMoney(customer);
    }
}
function sendOrderToKitchen(customer) {
    const orderElement = document.createElement('div');
    orderElement.className = 'kitchen-order';
    orderElement.innerHTML = `${customer.order.name} <div class="progress-bar"></div>`;
    orderElement.style.borderLeft = `5px solid ${customer.order.color}`;
    stove.appendChild(orderElement);
    const bar = orderElement.querySelector('.progress-bar');
    bar.style.backgroundColor = customer.order.color;
    const baseTime = customer.order.time;
    const cookModifier = Math.max(state.modifiers.cookSpeed, 0.1);
    const cookTime = (state.upgrades.fastCook ? baseTime / 2 : baseTime) / cookModifier;
    
    setTimeout(() => {
        bar.style.transition = `width ${cookTime / 1000}s linear`;
        bar.style.width = '100%';
    }, 50);
    
    setTimeout(() => {
        orderElement.classList.add('order-ready');
        orderElement.innerHTML = "SERVE!";
        orderElement.onclick = () => {
            serveFood(customer);
            orderElement.remove();
        };
        showMessage(`${customer.order.name} ready!`)
    }, cookTime + 50);
}
function serveFood(customer) {
    if (!state.customers.find(c => c.id === customer.id)) return;
    if (customer.status !== 'waiting_food') return;
    setCustomerState(customer, 'eating');
    showMessage("Customer served.")
}
function collectMoney(customer) {
    const x = customer.element.style.left;
    const y = customer.element.style.top;
    customer.element.remove();
    const table = state.tables.find(t => t.id === customer.tableId);
    if (table) table.occupiedBy = null;
    state.customers = state.customers.filter(c => c.id !== customer.id);
    let amount = customer.order.price;
    if (state.upgrades.highPrice) {
        amount = Math.floor(amount * 1.5);
    }
    const mult = 1 + (state.prestigeLevel * 0.5);
    amount = Math.floor(amount * mult * Math.max(state.modifiers.payout, 0.1));
    state.money += amount;
    spawnFloater(x, y, `+$${amount}`);
    updateUI();
    showMessage(`Collected $${amount}`);
}
function spawnFloater(x, y, text) {
    const f = document.createElement('div');
    f.className = 'floater';
    f.style.left = x;
    f.style.top = y;
    f.textContent = text;
    gameArea.appendChild(f);
    setTimeout(() => f.remove(), 1000);
}
function showMessage(text) {
    message.textContent = text;
}
function showTopAlert(text, options = {}) {
    if (!topAlert) return;
    const duration = options.duration || 4500;
    if (topAlertTimeout) clearTimeout(topAlertTimeout);
    topAlert.textContent = text;
    topAlert.style.display = 'block';
    requestAnimationFrame(() => topAlert.classList.add('visible'));
    topAlertTimeout = setTimeout(() => {
        topAlert.classList.remove('visible');
        setTimeout(() => {
            if (!topAlert.classList.contains('visible')) {
                topAlert.style.display = 'none';
            }
        }, 300);
    }, duration);
}
function createDynamicUI() {
    if (!eventBanner) {
        eventBanner = document.createElement('div');
        eventBanner.id = 'event-banner';
        eventBanner.textContent = '';
        eventBanner.style.display = 'none';
        hud.insertAdjacentElement('afterend', eventBanner);
    }
    if (!miniGameOverlay) {
        miniGameOverlay = document.createElement('div');
        miniGameOverlay.id = 'minigame-overlay';
        miniGameOverlay.innerHTML = `
        <div class="minigame-panel">
            <h2 class="minigame-title"></h2>
            <p class="minigame-instruction"></p>
            <div class="minigame-progress"></div>
            <button class="minigame-action">${MINIGAMES.quickChop.actionLabel}</button>
            <button class="minigame-cancel">Skip</button>
        </div>
        `;
        document.body.appendChild(miniGameOverlay);
        miniGameTitle = miniGameOverlay.querySelector('.minigame-title');
        miniGameInstruction = miniGameOverlay.querySelector('.minigame-instruction');
        miniGameProgress = miniGameOverlay.querySelector('.minigame-progress');
        miniGameActionButton = miniGameOverlay.querySelector('.minigame-action');
        miniGameCancelButton = miniGameOverlay.querySelector('.minigame-cancel');
        miniGameOverlay.style.display = 'none';
        miniGameCancelButton.onclick = () => completeMiniGame(false, {reason: 'skip'});
        miniGameOverlay.addEventListener('click', (evt) => {
            if (evt.target === miniGameOverlay && state.miniGame.active) {
                completeMiniGame(false, {reason: 'skip'});
            }
        })
    }
}
function showEventBanner(eventDef) {
    if (!eventBanner) return;
    eventBanner.textContent = `${eventDef.name}: ${eventDef.description}`;
    eventBanner.style.display = 'block';
    requestAnimationFrame(() => eventBanner.classList.add('visible'));
}
function hideEventBanner() {
    if (!eventBanner) return;
    eventBanner.classList.remove('visible');
    setTimeout(() => {
        if (!eventBanner.classList.contains('visible')) eventBanner.style.display = 'none';
    }, 250);
}
function scheduleNextEvent(baseTime) {
    state.events.nextTrigger = baseTime + getRandomInt(20000, 35000);
}
function scheduleNextMiniGame(baseTime) {
    state.miniGame.nextOffer = baseTime + getRandomInt(35000, 50000);
}
function handleEvents(now) {
    if (state.events.current) {
        const eventDef = DYNAMIC_EVENTS.find(e => e.id === state.events.current.id);
        if (!eventDef || now >= state.events.current.endAt) {
            if (eventDef) deactivateModifier(`event-${eventDef.id}`);
            state.events.current = null;
            hideEventBanner();
            if (!state.events.nextTrigger || state.events.nextTrigger < now) scheduleNextEvent(now);
        }
        return;
    }
    if (!state.events.nextTrigger) {
        scheduleNextEvent(now);
        return;
    }
    if (now >= state.events.nextTrigger) {
        triggerRandomEvent(now);
    }
}
function triggerRandomEvent(now) {
    const eventDef = DYNAMIC_EVENTS[Math.floor(Math.random() * DYNAMIC_EVENTS.length)];
    if (!eventDef) return;
    state.events.current = {
        id: eventDef.id,
        endAt: now + eventDef.duration
    };
    showEventBanner(eventDef);
    showMessage(eventDef.announcement);
    if (eventDef.effect) {
        activateModifier({
            id: `event-${eventDef.id}`,
            type: eventDef.effect.type,
            multiplier: eventDef.effect.multiplier,
            expiresAt: state.events.current.endAt
        });
    }
    scheduleNextEvent(state.events.current.endAt);
    if (eventDef.miniGame) {
        queueMiniGame(eventDef.miniGame, now + 800);
    }
    if (eventDef.minigame) {
        queueMiniGame(eventDef.miniGame, now + 800);
    }
}
function handleMiniGames(now) {
    if (state.miniGame.active) {
        const config = MINIGAMES[state.miniGame.type];
        if (!config) {
            state.miniGame.active = false;
            scheduleNextMiniGame(now);
            return;
        }
        if (now >= state.miniGame.endAt) {
            completeMiniGame(false);
            return;
        }
        refreshMiniGameUI(config, now);
        return;
    }
    if (!state.miniGame.nextOffer) {
        scheduleNextMiniGame(now);
        return;
    }
    if (now >= state.miniGame.nextOffer) {
        const type = state.miniGame.pendingType || 'quickChop';
        if (MINIGAMES[type]) startMiniGame(type);
        else scheduleNextMiniGame(now);
    }
}
function queueMiniGame(type, targetTime) {
    if (state.miniGame.active) return;
    state.miniGame.pendingType = type;
    state.miniGame.nextOffer = targetTime;
}
function startMiniGame(type) {
    const config = MINIGAMES[type];
    if (!config || !miniGameOverlay) return;
    state.miniGame.active = true;
    state.miniGame.type = type;
    state.miniGame.progress = 0;
    state.miniGame.endAt = Date.now() + config.duration;
    state.miniGame.pendingType = null;
    miniGameTitle.textContent = config.name;
    miniGameInstruction.textContent = config.instruction;
    refreshMiniGameUI(config, Date.now());
    miniGameActionButton.textContent = config.actionLabel;
    miniGameActionButton.onclick = () => {
        if (!state.miniGame.active) return;
        state.miniGame.progress++;
        if (state.miniGame.progress >= config.clicksRequired) {
            completeMiniGame(true);
        } else {
            refreshMiniGameUI(config, Date.now());
        }
    };
    miniGameOverlay.style.display = 'flex';
}
function refreshMiniGameUI(config, now) {
    if (!miniGameProgress) return;
    const remaining = Math.max(0, state.miniGame.endAt - now);
    miniGameProgress.textContent = `${state.miniGame.progress}/${config.clicksRequired} • ${(remaining / 1000).toFixed(1)}s`;
}
function completeMiniGame(success, options = {}) {
    if (!state.miniGame.active && !options.reason) return;
    const config = MINIGAMES[state.miniGame.type || 'quickChop'];
    if (miniGameOverlay) miniGameOverlay.style.display = 'none';
    if (miniGameActionButton) miniGameActionButton.onclick = null;
    if (miniGameProgress) miniGameProgress.textContent = '';
    const now = Date.now();
    if (success && config) {
        activateModifier({
            id: `minigame-${config.id}`,
            type: config.reward.type,
            multiplier: config.reward.multiplier,
            expiresAt: now + config.reward.duration
        });
        showMessage(config.successMessage);
        state.miniGame.nextOffer = now + config.cooldown;
    } else {
        if (config) state.miniGame.nextOffer = now + (config.retryDelay || config.cooldown);
        if (options.reason === 'skip') showMessage("Mini-game skipped.");
        else if (config) showMessage(config.failMessage);
    }
    state.miniGame.active = false;
    state.miniGame.type = null;
    state.miniGame.progress = 0;
    state.miniGame.endAt = null;
    state.miniGame.pendingType = null;
}
function activateModifier(effect) {
    if (!effect || !effect.type || !effect.multiplier) return;
    if (!effect.expiresAt) effect.expiresAt = Date.now() + 15000;
    state.modifierEffects = state.modifierEffects.filter(mod => mod.id !== effect.id);
    state.modifierEffects.push(effect);
    recalcModifiers();
}
function deactivateModifier(id) {
    const before = state.modifierEffects.length;
    state.modifierEffects = state.modifierEffects.filter(mod => mod.id !== id);
    if (state.modifierEffects.length !== before) recalcModifiers();
}
function cleanupModifiers(now) {
    const before = state.modifierEffects.length;
    state.modifierEffects = state.modifierEffects.filter(mod => !mod.expiresAt || now < mod.expiresAt);
    if (state.modifierEffects.length !== before) recalcModifiers();
}
function recalcModifiers() {
    state.modifiers.spawnRate = state.modifierEffects
        .filter(mod => mod.type === 'spawnRate')
        .reduce((acc, mod) => acc * mod.multiplier, 1);
    state.modifiers.cookSpeed = state.modifierEffects
        .filter(mod => mod.type === 'cookSpeed')
        .reduce((acc, mod) => acc * mod.multiplier, 1);
    state.modifiers.payout = state.modifierEffects
        .filter(mod => mod.type === 'payout')
        .reduce((acc, mod) => acc * mod.multiplier, 1);
    if (!state.modifiers.spawnRate) state.modifiers.spawnRate = 1;
    if (!state.modifiers.cookSpeed) state.modifiers.cookSpeed = 1;
    if (!state.modifiers.payout) state.modifiers.payout = 1;
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function updateUI() {
    money.textContent = state.money;
    queue.textContent = state.customerQueue;
    waiterCount.textContent = state.staff.waiters;
    chefCount.textContent = state.staff.chefs;
    const mult = 1 + (state.prestigeLevel * 0.5);
    prestigeMult.textContent = mult.toFixed(1);
    updateStockDisplay();
    buttonBuyTable.disabled = state.money < 100;
    buttonHireWaiter.disabled = state.money < 400;
    buttonHireChef.disabled = state.money < 400;
    buttonPrestige.disabled = state.money < 5000;
    if (state.money < 5000) buttonPrestige.style.opacity = "0.7";
    else buttonPrestige.style.opacity = "1";
    buttonBuy1.disabled = state.money < STOCK_PRICES.salad;
    buttonBuy2.disabled = state.money < STOCK_PRICES.burger;
    buttonBuy3.disabled = state.money < STOCK_PRICES.steak;
    updateUpgradeButton(buttonBuyUpgradeMarketing, 'marketing', 450);
    updateUpgradeButton(buttonBuyUpgradeSpeed, 'fastCook', 650);
    updateUpgradeButton(buttonBuyUpgradeProfit, 'highPrice', 850);
}
function updateUpgradeButton(button, type, cost) {
    if (state.upgrades[type]) {
        button.disabled = true;
        button.classList.add('upgrade-owned');
        button.textContent = "OWNED";
    } else {
        button.disabled = state.money < cost;
    }
}
init();