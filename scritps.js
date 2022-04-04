const ROWS = 10;
const COLS = 10;

let MOUSESELECTIONSTART = null;
let MOUSESELECTIONFINISH = null;
let MOUSEPRESSED = false;
let SELECTIONACTIVE = false;

class Cell{
    #col_num;
    #row_num;
    #value;
    constructor(id, value="") {
        if (id.split('_').length !== 2)
            throw new Error("Wrong id parameter of Cell: " + id + ". Must be like X_X");
        this.#row_num = Number(id.split('_')[0]);
        this.#col_num = Number(id.split('_')[1]);
        this.#value = value;
    }

    getFullId(){
        return this.#row_num + "_" + this.#col_num;
    }

    getColNum(){
        return this.#col_num;
    }

    getRowNum(){
        return this.#row_num;
    }

    setValue(value){
        this.#value = value;
    }

    getValue(){
        return this.#value;
    }
}

function checkStringId(id){
    const row_num = id.split('_')[0];
    const col_num = id.split('_')[1];

    if (col_num < 1 || col_num > COLS) return false;
    if (row_num < 1 || row_num > ROWS) return false;

    return true;
}

function getNeighbours(id){
    if (typeof id === "string"){
        const id_values = id.split('_');

        const row_num = Number(id_values[1]);
        const col_num = Number(id_values[2]);

        const temp_neighbours = [];

        const neighbours = [];

        temp_neighbours.push(new Cell(`${1 + row_num}_${col_num}`));
        temp_neighbours.push(new Cell(`${row_num}_${col_num - 1}`));
        temp_neighbours.push(new Cell(`${row_num}_${1 + col_num}`));
        temp_neighbours.push(new Cell(`${row_num - 1}_${col_num}`));

        temp_neighbours.forEach(el => {
            if (checkStringId(el.getFullId())){
                el.setValue(document.getElementById(el.getFullId()).value);
                neighbours.push(el);
            }
        });



        return neighbours;
    }
}

function generateGrid(rows, cols){

    const container = document.getElementById('container');

    container.innerHTML += `<div class="col_nums row" id="row_0"></div>`
    for(let i = 1; i <= rows; i++){
        container.innerHTML += `<div class="row" id="row_${i}"></div>`;
    }

    container.querySelectorAll('.row').forEach(el => {
        if (!el.classList.contains("col_nums")) {
            el.innerHTML += `<div class="row_nums cell border" id="${el.id}_num" style="text-align: center">${el.id.split('_')[1]}</div>`
            for (let i = 1; i <= cols; i++) {
                el.innerHTML += `<input id="${el.id.split('_')[1]}_${i}" value="${(Math.random() * rows * cols) >> 0}" class="cell">`;
            }
        }
        else {
            for (let i = 0; i <= cols; i++) {
                el.innerHTML += `<div id="col_${i}" class="cell border" style="text-align: center">${i}</div>`
            }
        }
    });
}

function colorize(cells = null){
    if (cells === null) return;
    document.querySelectorAll('input.cell, div.border').forEach(el => el.style.backgroundColor = 'white');
    cells.forEach(el => {
        document.getElementById(el.getFullId()).style.backgroundColor = 'rgb(105,181,255)';
        document.getElementById("row_" + el.getRowNum() + "_num").style.backgroundColor = 'rgb(178,178,178)';
        document.getElementById("col_" + el.getColNum()).style.backgroundColor = 'rgb(178,178,178)';

    });

}

function getRectangle(cell_1, cell_2){

    if (cell_1 === null || cell_2 === null) return null;

    let left;
    let right;
    let top;
    let bottom;

    if (cell_1.getColNum() < cell_2.getColNum()){
        left = cell_1.getColNum();
        right = cell_2.getColNum();
    }
    else {
        left = cell_2.getColNum();
        right = cell_1.getColNum()
    }

    if (cell_1.getRowNum() < cell_2.getRowNum()){
        top = cell_1.getRowNum();
        bottom = cell_2.getRowNum();
    }
    else {
        top = cell_2.getRowNum();
        bottom = cell_1.getRowNum()
    }

    const cells = [];

    for (let i = left; i <= right; i++){
        for (let j = top; j <= bottom; j++){
            cells.push(new Cell(`${j}_${i}`, document.getElementById(`${j}_${i}`).value));
        }
    }

    return cells;

}

function getAllValues(){
    const map = new Map();

    document.querySelectorAll("input.cell").forEach(el => map.set(el, el.value));

    console.log(map);
}

generateGrid(ROWS, COLS);
document.getElementById("header").addEventListener('click', getAllValues);
// document.querySelectorAll('input.cell').forEach(el => {
//     el.addEventListener('click', el => console.log(getNeighbours(el.target.id)));
// });

document.querySelectorAll('input.cell').forEach(el => {
    el.addEventListener('mousedown', el => {
        if (MOUSEPRESSED === true){
            SELECTIONACTIVE = false;
            MOUSESELECTIONSTART = new Cell(el.target.id);
            MOUSESELECTIONFINISH = new Cell(el.target.id);
            colorize(getRectangle(MOUSESELECTIONSTART, MOUSESELECTIONFINISH));
        }
        else{
            SELECTIONACTIVE = true;
            MOUSEPRESSED = true;
            MOUSESELECTIONSTART = new Cell(el.target.id);
            MOUSESELECTIONFINISH = new Cell(el.target.id);
            colorize(getRectangle(MOUSESELECTIONSTART, MOUSESELECTIONFINISH));
        }

    });
    el.addEventListener('mouseup', el => {
        console.log(getRectangle(MOUSESELECTIONSTART, MOUSESELECTIONFINISH));
        MOUSEPRESSED = false;
    });
    el.addEventListener('mouseover', el => {
        if (MOUSEPRESSED === true){
            MOUSESELECTIONFINISH = new Cell(el.target.id);
            colorize(getRectangle(MOUSESELECTIONSTART, MOUSESELECTIONFINISH));
        }
    });
});
