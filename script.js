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
    customer.element = element;
    customer.bubble = bubble;
    state.customers.push(customer);
    setTimeout(() => {
        setCustomerState(customer, 'ready_to_order');
    }, 1000);
}
function setCustomerState(cust, status) {
    customer.status = status;
    const element = cust.element;
    if (status === 'ready_to_order') {
        customer.bubble.textContent = "Order?";
        element.classList.add('needs-attention');
        element.style.backgroundColor = '#e74c3c';
    }
    else if (status === 'waiting_food') {
        customer.bubble.textContent = "Waiting...";
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
        sendOrderToKitchen(customer);
        setCustomerState(customer, 'waiting_food');
        showMessage("Order taken, cooking in kitchen")
    }
    else if (customer.status === 'ready_to_serve') {
        serveFood(customer);
    }
    else if (cust.status === 'ready_to_pay') {
        collectMoney(cust);
    }
}
function sendOrderToKitchen(customer) {
    const orderElement = document.createElement('div');
    orderElement.className = 'kitchen-order';
    orderEl.innerHTML = `Order #${customer.id.split('-')[1]} <div class="progress-bar"></div>`;
    elementStove.appendChild(orderElement);
    const bar = orderElement.querySelector('.progress-bar');
    
    setTimeout(() => {
        bar.style.width = '100%';
        bar.style.transition = 'width 3s linear';
    }, 50);
    
    setTimeout(() => {
        orderElement.classList.add('order-ready');
        orderElement.innerHTML = "SERVE!";
        orderElement.onclick = () => {
            serveFood(customer);
            orderElement.remove();
        };
        showMessage("Food ready, click kitchen item to serve")
    }, 3050);
}
function serveFood(customer) {
    if (customer.status !== 'waiting_food') return;
    setCustomerState(customer, 'eating');
    showMessage("Customer served.")
}
function collectMoney(customer) {
    customer.element.remove();
    const table = state.tables.find(t => t.id === customer.tableId);
    if (table) table.occupiedBy = null;
    state.customers = state.customers.filter(c => c.id !== customer.id);
    const amount = 20;
    state.money += amount;
    spawnFloater(customer.element.style.left, customer.element.style.top, `+$${amount}`);
    updateUI();
    showMessage("Money collected!");
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
    if (state.money < 100) {
        buttonBuyTable.style.opacity = "0.5";
        buttonBuyTable.style.cursor = "not-allowed";
    } else {
        buttonBuyTable.style.opacity = "1";
        buttonBuyTable.style.cursor = "pointer";
    }
}
init();