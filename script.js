const GAME_WIDTH = 650;
const GAME_HEIGHT = 500;
const RECIPES = {
    salad: {
        id: 'salad',
        name: 'salad',
        price: 15,
        time: 2000,
        color: "#2ecc71"
    },
    burger: {
        id: 'burger',
        name: "Burger", 
        price: 30, 
        time: 5000,
        color: "#d35400"
    },
    steak: {
        id: 'steak',
        name: "Steak",
        price: 50, 
        time: 8000, 
        color: "#c0392b"
    }
};
let state = {
    money: 150,
    tables: [],
    customers: [],
    customerQueue: 0,
    idCounter: 0,
    lastSpawn: 0,
    staff: {
        waiters: 0,
        chefs: 0
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
const ChefCount = document.getElementById('chef-count');
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
                handleCustomerClick(customer);
                waiterMoves--;
                createEffect(customer.element.style.left, customer.element.style.top, "📝");
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
        sendOrderToKitchen(customer);
        setCustomerState(customer, 'waiting_food');
        showMessage(`Ordering ${customer.order.name}...`)
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
    
    setTimeout(() => {
        bar.style.width = '100%';
        bar.style.transition = `width ${customer.order.time / 1000}s linear`;
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
    const amount = customer.order.price;
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
    waiterCount.textContent = state.staff.waiters;
    chefCount.textContent = state.staff.chefs;
    buttonBuyTable.disabled = state.money < 100;
    buttonBuyTable.style.opacity = state.money < 100 ? 0.5 : 1;
    buttonHireWaiter.disabled = state.money < 500;
    buttonHireWaiter.style.opacity = state.money < 500 ? 0.5 : 1;
    buttonHireChef.disabled = state.money < 500;
    buttonHireChef.style.opacity = state.money < 500 ? 0.5 : 1;
}
init();