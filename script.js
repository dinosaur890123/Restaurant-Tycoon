const GAME_WIDTH = 650;
const GAME_HEIGHT = 500;
let state = {
    money: 150,
    tables: [],
    customers: [],
    customerQueue: 0,
    idCounter: 0,
    lastSpawn: 0
};
const gameArea = document.getElementById('game-area');
const money = document.getElementById('money');
const message = document.getElementById('message-box');
const queue = document.getElementById('queue-count');
const stove = document.getElementById('stove');
const buttonBuyTable = document.getElementById('button-buy-table');
function init() {
    updateUI();
    gameLoop();
}
function resetGame() {
    location.reload();
}
function gameLoop(timestamp) {
    if (timestamp - state.lastSpawn > 3000) {
        if (Math.random() > 0.3 && state.customerQueue < 5) {
            state.customerQueue++;
            updateUI();
        }
        state.lastSpawn = timestamp;
    }
    processQueue();
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
function buyTable() {
    if (state.money >= 100) {
        const col = state.tables.length % 3;
        const row = Math.floor(state.tables.length / 3);
        const x = 50 + (col * 150);
        const y = 50 + (row * 120);
        if (state.tables.length < 9) {
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
        } else {
            showMessage("Restaurant full, no more space.")
        }
    } else {
        showMessage("Not enough cash!")
    }
}
function createTableElement() {
    const element = document.createElement('div');
    element.className = 'table';
    element.style.left = tableData.x + 'px';
    element.style.top = tableData.y + 'px';
    element.textContent = "Table";
    gameArea.appendChild(element);
    tableData.element = element;
}
function spawnCustomer(table) {
    const customer = {
        id: `cust-${state.idCounter++}`,
        tableId: table.id,
        status: 'seated',
        orderTimer: 0,
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
    
}