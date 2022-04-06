const ROWS = 10;
const COLS = 10;

let MOUSESELECTIONSTART = null;
let MOUSESELECTIONFINISH = null;
let MOUSEPRESSED = false;
let SELECTIONACTIVE = false;
let CLIPBOARD = null;

class Selection {
    #rows_num;
    #cols_num;
    #cells;

    constructor(cells, rows_num, cols_num) {
        if (!checkNumId(rows_num, cols_num)) throw new Error(`Wrong value(s) of rows = ${rows_num} and cols = ${cols_num} number `);
        this.#cols_num = cols_num;
        this.#rows_num = rows_num;
        this.#cells = cells;
    }

    getCells() {
        return this.#cells;
    }

    getRowsNum() {
        return this.#rows_num;
    }

    getColsNum() {
        return this.#cols_num;
    }

    getFirst() {
        return this.#cells[0];
    }

    getLast(){
        return this.#cells[this.#cells.length - 1];
    }

    getCellByRowCol(row, col){
        if (row > this.#rows_num || col > this.#cols_num || col < 1 || row < 1){
            throw new Error(`Values of row = ${row} or col = ${col} is out of bounds`);
        }

        let start = (row - 1) * this.#cols_num - 1;

        return this.#cells[start + col];
    }
}

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

function checkNumId(row, col){
    if (col < 1 || col > COLS) return false;
    if (row < 1 || row > ROWS) return false;

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

//"${(Math.random() * cols * rows) >> 0}"

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
                el.innerHTML += `<input id="${el.id.split('_')[1]}_${i}" value="" class="cell">`;
            }
        }
        else {
            for (let i = 0; i <= cols; i++) {
                el.innerHTML += `<div id="col_${i}" class="cell border" style="text-align: center">${getLiteralInsteadNumber(i)}</div>`
            }
        }
    });
}

function colorize(selection = null){
    if (selection === null){
        SELECTIONACTIVE = false;
        return;
    }

    // SELECTIONACTIVE = true;

    document.querySelectorAll('input.cell, div.border').forEach(el => el.style.backgroundColor = 'white');
    selection.getCells().forEach(el => {
        document.getElementById(el.getFullId()).style.backgroundColor = 'rgb(105,181,255)';
        document.getElementById("row_" + el.getRowNum() + "_num").style.backgroundColor = 'rgb(178,178,178)';
        document.getElementById("col_" + el.getColNum()).style.backgroundColor = 'rgb(178,178,178)';

    });

}

function getSelection(cell_1, cell_2){

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

    for (let i = top; i <= bottom; i++){
        for (let j = left; j <= right; j++){
            cells.push(new Cell(`${i}_${j}`, document.getElementById(`${i}_${j}`).value));
        }
    }

    return new Selection(cells, bottom - top + 1, right - left + 1);
}

function pasteValues(start_cell, cells_array){

    let start_col = start_cell.getColNum();
    let start_row = start_cell.getRowNum();

    if (!checkNumId(cells_array.getRowsNum() + start_row - 1, cells_array.getColsNum() + start_col - 1)){
        alert("Недостаточно места для заполнения");
        return;
    }

    for (let i = start_row; i <= cells_array.getRowsNum() + start_row - 1; i++){
        for (let j = start_col; j <= cells_array.getColsNum() + start_col - 1; j++){
            document.getElementById(`${i}_${j}`).value = cells_array.getCellByRowCol(i - start_row + 1, j - start_col + 1).getValue();
        }
    }
}

function deleteValues(cells){
    for (let el of cells.getCells()){
        document.getElementById(el.getFullId()).value = "";
    }
}

function getLiteralInsteadNumber(number){
    const literals = ['', 'A', 'B', 'C', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    if (number >= 0 && number <= 26){
        return literals[number];
    }

    return literals[0];

}

function getAllValues(){
    const map = new Map();

    document.querySelectorAll("input.cell").forEach(el => map.set(el, el.value));

    console.log(map);
}

generateGrid(ROWS, COLS);
document.getElementById("header").addEventListener('click', getAllValues);

document.querySelectorAll('input.cell').forEach(el => {
    el.setAttribute('readonly', 'readonly');
    el.addEventListener('cut', ev => {
        if (SELECTIONACTIVE){
            CLIPBOARD = getSelection(MOUSESELECTIONSTART, MOUSESELECTIONFINISH);
            deleteValues(getSelection(MOUSESELECTIONSTART, MOUSESELECTIONFINISH));
        }
    });
    el.addEventListener('copy', ev => {
        if (SELECTIONACTIVE){
            CLIPBOARD = getSelection(MOUSESELECTIONSTART, MOUSESELECTIONFINISH);
        }
    });
    el.addEventListener('paste', ev => {
        if (CLIPBOARD !== null){
            pasteValues(getSelection(MOUSESELECTIONSTART, MOUSESELECTIONFINISH).getFirst(), CLIPBOARD);
        }
    });
    el.addEventListener('mousedown', ev => {
        el.setAttribute('readonly', 'readonly');
        if (MOUSEPRESSED === true){
            SELECTIONACTIVE = false;
            MOUSESELECTIONSTART = new Cell(ev.target.id);
            MOUSESELECTIONFINISH = new Cell(ev.target.id);
            colorize(getSelection(MOUSESELECTIONSTART, MOUSESELECTIONFINISH));
        }
        else{
            SELECTIONACTIVE = true;
            MOUSEPRESSED = true;
            MOUSESELECTIONSTART = new Cell(ev.target.id);
            MOUSESELECTIONFINISH = new Cell(ev.target.id);
            colorize(getSelection(MOUSESELECTIONSTART, MOUSESELECTIONFINISH));
        }
    });
    el.addEventListener('dblclick', ev => {
        ev.target.style.backgroundColor = 'rgb(182,204,250)'
        MOUSEPRESSED = true;
        MOUSESELECTIONSTART = null;
        MOUSESELECTIONFINISH = null;
        el.removeAttribute('readonly');
    });
    el.addEventListener('mouseup', ev => {
        console.log(getSelection(MOUSESELECTIONSTART, MOUSESELECTIONFINISH));
        el.setAttribute('readonly', 'readonly');
        MOUSEPRESSED = false;
    });
    el.addEventListener('mouseover', ev => {
        if (MOUSEPRESSED === true){
            el.setAttribute('readonly', 'readonly');
            MOUSESELECTIONFINISH = new Cell(ev.target.id);
            colorize(getSelection(MOUSESELECTIONSTART, MOUSESELECTIONFINISH));
        }
    });
});

document.onkeydown = (event) => {
    if (SELECTIONACTIVE && event.key === 'Delete'){
        console.log("delete");
        deleteValues(getSelection(MOUSESELECTIONSTART, MOUSESELECTIONFINISH))
    }
}
