const GAME_WIDTH = 650;
const GAME_HEIGHT = 500;
const STORAGE_KEY = 'restaurant_tycoon_save_v2';
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
const STOCK_PRICES = {salad: 20, burger: 40, steak: 80};
const STOCK_PACK_SIZE = 5;
let state = {
    money: 200,
    tables: [],
    customers: [],
    customerQueue: 0,
    idCounter: 0,
    lastSpawn: 0,
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
    lastStaffAction: 0
};
const gameArea = document.getElementById('game-area');
const money = document.getElementById('money');
const message = document.getElementById('message-box');
const queue = document.getElementById('queue-count');
const stove = document.getElementById('stove');
const buttonBuyTable = document.getElementById('button-buy-table');
const buttonHireWaiter = document.getElementById('btn-hire-waiter');
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

function init() {
    if (!loadGame()) {
        updateUI();
    }
    gameLoop();
    setInterval(saveGame, 10000);
}
function resetGame() {
    if (confirm("Are you sure? This will delete your save file.")) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}
function saveGame() {
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
        }))
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveState));
    const originalText = message.textContent;
    showMessage("Game saved");
    setTimeout(() => {
        if (message.textContent === "Game Saved!") showMessage(originalText);
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
        state.prestigeLevel = savedState.prestigeLevel || 0;
        state.tables = [];
        savedState.tables.forEach(tableData => {
            const table = {
                id: tableData.id,
                x: tableData.x,
                y: tableData.y,
                occupiedBy: null,
                element: null
            };
            createTableElement(table);
            state.tables.push(table);
        });
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
        state.upgrades = {marketing: false, fastCook: false,};
    }
}
function gameLoop(timestamp) {
    const spawnRate = state.upgrades.marketing ? 1500 : 3000;
    if (timestamp - state.lastSpawn > 3000) {
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
function buyStock() {
    const price = STOCK_PRICES[type];
    if (state.money >= price) {
        state.money -= price;
        state.inventory[type] += STOCK_PACK_SIZE;
        showMessage(`Bought ${STOCK_PACK_SIZE} ${type}!`);
        updateUI();
        saveGame();
    } else {
        showMessage(`Need $${price} for ${type}!`)
    }
}
function updateStockDisplay() {
    stockSalad.textContent = `🥗 ${state.inventory.salad}`;
    stockBurger.textContent = `🍔 ${state.inventory.burger}`;
    stockSteak.textContent = `🥩 ${state.inventory.steak}`;
    checkLowStock(stockSalad, state.inventory.salad);
    checkLowStock(stockBurger, state.inventory.burger);
    checkLowStock(stockSteak, state.inventory.steak);
}
function checkLowStock(element, amount) {
    if (amount <= 2) element.classList.add('stock-low');
    else element.classList.remove('stock-low');
}
function buyUpgrade(type) {
    let cost = 0;
    let name = "";
    if (type === 'marketing') {cost = 600; name = "Marketing";}
    else if (type === 'fastCook') {cost = 800; name = "Faster cooking";}
    else if (type === 'highPrice') {cost = 1000; name = "Premium Menu";}
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
    if (state.money >= 500) {
        state.money -= 500;
        state.staff.waiters++;
        showMessage("Waiter hired, they will take orders and collect cash.");
        updateUI();
    } else {
        showMessage("Need $500 to hire a waiter!")
    }
}
function hireChef() {
    if (state.money >= 500) {
        state.money -= 500;
        state.staff.chefs++;
        showMessage("Chef hired, they will serve ready food.");
        updateUI();
    } else {
        showMessage("Need $500 to hire a chef");
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
                    handleCustomerClick(cust);
                    waiterMoves--;
                    createEffect(cust.element.style.left, cust.element.style.top, "📝");
                }
            }
        }
    }
    let chefMoves = state.staff.chefs;
    if (chefMoves > 0) {
        const readyOrders = Array.from(document.querySelectorAll());
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
    element.stylezIndex = '100';
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
    const recipeKeys = Object.keys(RECIPES);
    const randomKey = recipeKeys[Math.floor(Math.random() * recipeKeys.length)];
    const chosenRecipe = RECIPES[randomKey];
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
        customer.bubble.textContent = `${cust.order.name}?`;
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
            setCustomerState(cust, 'ready_to_pay');
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
        collectMoney(cust);
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
    const cookTime = state.upgrades.fastCook ? baseTime / 2 : baseTime;
    
    setTimeout(() => {
        bar.style.width = '100%';
        bar.style.transition = `width ${cookTime / 1000}s linear`;
    }, 50);
    
    setTimeout(() => {
        orderElement.classList.add('order-ready');
        orderElement.innerHTML = "SERVE!";
        orderElement.onclick = () => {
            serveFood(customer);
            orderElement.remove();
        };
        showMessage(`${customer.order.name} ready!`)
    }, customer.order.time + 50);
}
function serveFood(customer) {
    if (!state.customers.find(c => c.id === customer.id)) return;
    if (customer.status !== 'waiting_food') return;
    setCustomerState(customer, 'eating');
    showMessage("Customer served.")
}
function collectMoney(customer) {
    customer.element.remove();
    const table = state.tables.find(t => t.id === customer.tableId);
    if (table) table.occupiedBy = null;
    state.customers = state.customers.filter(c => c.id !== customer.id);
    let amount = customer.order.price;
    if (state.upgrades.highPrice) {
        amount = Math.floor(amount * 1.5);
    }
    state.money += amount;
    spawnFloater(customer.element.style.left, customer.element.style.top, `+$${amount}`);
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
function updateUI() {
    money.textContent = state.money;
    queue.textContent = state.customerQueue;
    waiterCount.textContent = state.staff.waiters;
    chefCount.textContent = state.staff.chefs;
    buttonBuyTable.disabled = state.money < 100;
    buttonHireWaiter.disabled = state.money < 500;
    buttonHireChef.disabled = state.money < 500;
    updateUpgradeButton(buttonBuyUpgradeMarketing, 'marketing', 600);
    updateUpgradeButton(buttonBuyUpgradeSpeed, 'fastCook', 800);
    updateUpgradeButton(buttonBuyUpgradeProfit, 'highPrice', 1000);
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