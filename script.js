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