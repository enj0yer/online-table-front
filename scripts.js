import {isFormula, calcFormula, isSingleFunction, isCalcExpression} from "./parsing.js";
import {Formula} from "./formulas_logic.js";

/**
 * Amount of rows in table.
 * @type {number}
 */
const ROWS = 10;

/**
 * Amount of columns in table.
 * @type {number}
 */
const COLS = 10;

/**
 * First cell of selection.
 * @type {Cell}
 */
let MOUSE_SELECTION_START = null;

/**
 * Last cell of selection.
 * @type {Cell}
 */
let MOUSE_SELECTION_FINISH = null;

/**
 * Condition of mouse button.
 * @type {boolean}
 */
let MOUSE_PRESSED = false;

/**
 * Condition of selection.
 * @type {boolean}
 */
let SELECTION_ACTIVE = false;

/**
 * Condition of cell state
 * @type {boolean}
 */
let IS_CHANGING = false;

/**
 * Clipboard content.
 * @type {Selection}
 */
let CLIPBOARD = null;

/**
 * Representation of HTML cells
 * @type {Array<Cell>}
 */
let CELLS = null

/**
 * Class, which represents the selected cells.
 */
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

    /**
     * Get all cells of specific selection.
     * @returns {Array<Cell>}
     */
    getCells() {
        return this.#cells;
    }

    /**
     * Get amount of rows in specific selection.
     * @returns {number}
     */
    getRowsNum() {
        return this.#rows_num;
    }

    /**
     * Get amount of columns in specific selection.
     * @returns {number}
     */
    getColsNum() {
        return this.#cols_num;
    }

    /**
     * Get first cell of specific selection.
     * @returns {Cell}
     */
    getFirst() {
        return this.#cells[0];
    }

    /**
     * Get last cell of specific selection.
     * @returns {Cell}
     */
    getLast(){
        return this.#cells[this.#cells.length - 1];
    }

    /**
     * Get cell by relative numbers of its row and column.
     * @param row : number
     * @param col : number
     * @returns {Cell}
     */
    getCellByRowCol(row, col){
        if (row > this.#rows_num || col > this.#cols_num || col < 1 || row < 1){
            throw new Error(`Values of row = ${row} or col = ${col} is out of bounds`);
        }

        let start = (row - 1) * this.#cols_num - 1;

        return this.#cells[start + col];
    }
}

/**
 * Class, which represents one cell.
 */
export class Cell{
    #col_num;
    #row_num;
    #value;
    #formula;
    #is_committed;
    constructor(id, value="", formula="") {
        if (id.split('_').length !== 2)
            throw new Error("Wrong id parameter of Cell: " + id + ". Must be like X_X");
        this.#row_num = Number(id.split('_')[0]);
        this.#col_num = Number(id.split('_')[1]);
        this.#value = value;
        this.#formula = formula;
        this.#is_committed = true;
    }

    /**
     * Get cell id (format like [#row_num]_[#col_num]).
     * Can be used in searching HTML.
     * @returns {string}
     */
    getFullId(){
        return this.#row_num + "_" + this.#col_num;
    }

    /**
     * Get the column number of specific cell.
     * @returns {number}
     */
    getColNum(){
        return this.#col_num;
    }

    /**
     * Get the row number of specific cell.
     * @returns {number}
     */
    getRowNum(){
        return this.#row_num;
    }

    /**
     * Set value to specific cell.
     * @param value : string
     */
    setValue(value){
        this.#value = value;
    }

    /**
     * Get value of specific cell.
     * @returns {string}
     */
    getValue(){
        return this.#value;
    }

    /**
     * Get formula (if exists) of specific cell.
     * @returns {string}
     */
    getFormula(){
        return this.#formula;
    }

    /**
     * Set formula to specific cell.
     * @param formula : string
     */
    setFormula(formula){
        this.#formula = formula;
    }

    isCommitted(){
        return this.#is_committed;
    }

    setCommitState(state){
        this.#is_committed = state;
    }
}

/**
 * Check id (format like [#row_num]_[#col_num]) for being inside a valid value.
 * @param id : string
 * @returns {boolean}
 */
export function checkStringId(id){
    const row_num = Number(id.split('_')[0]);
    const col_num = Number(id.split('_')[1]);

    return checkNumId(row_num, col_num);
}

/**
 * Check id for being inside a valid value.
 * @param row : number
 * @param col : number
 * @returns {boolean}
 */
function checkNumId(row, col){
    if (col < 1 || col > COLS) return false;
    if (row < 1 || row > ROWS) return false;

    return true;
}

function copyString(string){
    return string.slice();
}

/**
 * @deprecated Has no usage.
 * @param id : string
 * @returns {Array<Cell>}
 */
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

/**
 * Generate a table with set parameters.
 * @param rows : number
 * @param cols : number
 */
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

/**
 * Color all selected cell in table.
 * @param selection : Selection
 */
function colorize(selection = null){
    if (selection === null){
        SELECTION_ACTIVE = false;
        return;
    }

    document.querySelectorAll('input.cell, div.border').forEach(el => el.style.backgroundColor = 'white');
    selection.getCells().forEach(el => {
        document.getElementById(el.getFullId()).style.backgroundColor = 'rgb(105,181,255)';
        document.getElementById("row_" + el.getRowNum() + "_num").style.backgroundColor = 'rgb(178,178,178)';
        document.getElementById("col_" + el.getColNum()).style.backgroundColor = 'rgb(178,178,178)';

    });

}

/**
 * Get selection by first and last cells in it.
 * Returns null if one of the parameters is null.
 * @param cell_1 : Cell
 * @param cell_2 : Cell
 * @returns {Selection|null}
 */
export function getSelection(cell_1, cell_2){

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
            cells.push(getCellById(`${i}_${j}`));
        }
    }

    return new Selection(cells, bottom - top + 1, right - left + 1);
}

/**
 * Paste cells values into specific zone.
 * @param start_cell : Cell
 * @param cells_array : Selection
 */
function pasteValues(start_cell, cells_array){

    let start_col = start_cell.getColNum();
    let start_row = start_cell.getRowNum();

    if (!checkNumId(cells_array.getRowsNum() + start_row - 1, cells_array.getColsNum() + start_col - 1)){
        alert("Недостаточно места для заполнения");
        return;
    }

    for (let i = start_row; i <= cells_array.getRowsNum() + start_row - 1; i++){
        for (let j = start_col; j <= cells_array.getColsNum() + start_col - 1; j++){
            let new_cell = cells_array.getCellByRowCol(i - start_row + 1, j - start_col + 1);
            let cell = getCellById(`${i}_${j}`);
            document.getElementById(`${i}_${j}`).value = new_cell.getValue();
            cell.setCommitState(false);
            cell.setValue(new_cell.getValue());
            cell.setFormula(new_cell.getFormula());
            cell.setCommitState(true);
        }
    }
}

/**
 * Delete values of specific cells in table.
 * @param cells : Selection
 */
function deleteValues(cells){
    for (let el of cells.getCells()){
        document.getElementById(el.getFullId()).value = "";
        el.setCommitState(false);
        el.setValue('');
        el.setFormula('');
        el.setCommitState(true);
    }
}

/**
 * Get literal [A-Z] instead number.
 * If number not in range [1-26] returns ''.
 * @param number : number
 * @returns {string}
 */
export function getLiteralInsteadNumber(number){
    const literals = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    if (number >= 0 && number <= 26){
        return literals[number];
    }

    return literals[0];

}

/**
 * Get number [1-26] instead literal [A-Za-z].
 * If literal is not valid, returns 0.
 * @param literal : string
 * @returns {number}
 */
export function getNumberInsteadLiteral(literal){
    const literals = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    return (literals.indexOf(literal.toUpperCase()) === -1 || literals.indexOf(literal.toUpperCase()) === 0) ? 0 : literals.indexOf(literal.toUpperCase());
}

/**
 * @deprecated
 * Print to console all values of table.
 */
function getAllValues(){
    const map = new Map();

    document.querySelectorAll("input.cell").forEach(el => map.set(el, el.value));

    console.log(map);
}

/**
 * Get all HTML cells as Cell objects after page load
 * @returns {Array<Cell>}
 */
function getCellsArray(){

    console.log("Get new cells");

    const HTMLCells = document.querySelectorAll('input.cell');

    let objCells = [];

    for (let HTMLCell of HTMLCells){
        objCells.push(new Cell(HTMLCell.id, HTMLCell.value));
    }

    return objCells;
}

function preCalcFormula(cell_value){
    const trim_cell_value = cell_value.trim();

    if (isFormula(trim_cell_value)){
        if (isSingleFunction(trim_cell_value)){
            let result = calcFormula(trim_cell_value);
            return (result === false) ? "#ОШИБКА" : [result, cell_value];
        }
        else return "#ОШИБКА";
    }
    else return cell_value;
    // else if (isCalcExpression(cell_value)){
    //     console.log(isCalcExpression(cell_value));
    // }
}

function updateCell(newCell){

    for (let i = 0; i < CELLS.length; i++){
        if (CELLS[i].getFullId() === newCell.getFullId()){
            CELLS[i].setValue(newCell.getValue());
            CELLS[i].setFormula(newCell.getFormula());
            return;
        }
    }
}

function getCellById(id){
    for (let i = 0; i < CELLS.length; i++){
        if (CELLS[i].getFullId() === id){
            return CELLS[i];
        }
    }
}

function enableCellsSelection(selection){
    for (let cell of selection.getCells()){
        enableCell(getCellById(cell));
    }
}

function disableCellsSelection(selection){
    for (let cell of selection.getCells()){
        disableCell(getCellById(cell));
    }
}

function disableCellsExceptSome(element){
    for (let cell of CELLS){
        if (cell.getFullId() !== element.id){
            disableCell(document.getElementById(cell.getFullId()));
        }
    }
}

function enableCell(element){
    IS_CHANGING = true;
    MOUSE_PRESSED = true;

    let cell = getCellById(element.id);

    // MOUSE_SELECTION_START = cell;
    // MOUSE_SELECTION_FINISH = cell;


    cell.setCommitState(false);

    element.removeAttribute('readonly');

    let formula = cell.getFormula();

    if (formula !== '') element.value = formula;

    element.style.backgroundColor = 'rgb(182,204,250)';

    cell.setCommitState(true);
}

function disableCell(element){
    IS_CHANGING = false;
    MOUSE_PRESSED = false;

    MOUSE_SELECTION_START = null;
    MOUSE_SELECTION_FINISH = null;

    let cell = getCellById(element.id);

    cell.setCommitState(false);

    syncHTMLWithCell(element);

    element.setAttribute('readonly', 'readonly');
    element.style.backgroundColor = 'rgb(255, 255, 255)';

    cell.setCommitState(true);

}

function syncHTMLWithCell(element){

    const result = preCalcFormula(element.value);
    let formula = "";
    let value;
    if (result instanceof Array){
        value = result[0];
        formula = result[1];
    }
    else{
        value = result;
    }
    element.value = value;
    updateCell(new Cell(element.id, element.value, formula));
}


generateGrid(ROWS, COLS);
CELLS = getCellsArray();


document.getElementById("header").addEventListener('click', getAllValues);

document.addEventListener('copy', ev => {
    if (SELECTION_ACTIVE){
        CLIPBOARD = getSelection(MOUSE_SELECTION_START, MOUSE_SELECTION_FINISH);
    }
});
document.addEventListener('cut', ev => {
    if (SELECTION_ACTIVE){
        CLIPBOARD = getSelection(MOUSE_SELECTION_START, MOUSE_SELECTION_FINISH);
        deleteValues(getSelection(MOUSE_SELECTION_START, MOUSE_SELECTION_FINISH));
    }
});

document.addEventListener('paste', ev => {
    if (CLIPBOARD !== null){
        pasteValues(getSelection(MOUSE_SELECTION_START, MOUSE_SELECTION_FINISH).getFirst(), CLIPBOARD);
    }
});

document.addEventListener('blur', ev => {
    if (ev.target.classList.contains('cell') && IS_CHANGING && getCellById(ev.target.id).isCommitted()){
        // syncHTMLWithCell(ev.target);
        // console.log('change: ' + ev.target.id);
        // ev.target.value = getCellById(ev.target.id).getValue();
        disableCell(ev.target);
    }
});

document.addEventListener('change', ev => {
    if (ev.target.classList.contains('cell') && IS_CHANGING && getCellById(ev.target.id).isCommitted()){
        disableCell(ev.target);
    }
});


document.onkeydown = ev => {
    if (ev.target.classList.contains('cell')){
        console.log('keydown: ' + ev.target.id);
        if (ev.key === "Enter"){
            disableCell(ev.target);
        }
    }
};

document.addEventListener('focusout', ev => {
    if (ev.target.classList.contains('cell') && IS_CHANGING && getCellById(ev.target.id).isCommitted()){
        console.log('blur: ' + ev.target.id);
        disableCell(ev.target);
    }
});

document.addEventListener('mousedown', ev => {
    if (ev.target.classList.contains('cell')) {
        console.log('mousedown: ' + ev.target.id);
        // disableCellsExceptSome(ev.target);
        ev.target.setAttribute('readonly', 'readonly');
        SELECTION_ACTIVE = true;
        MOUSE_PRESSED = true;
        MOUSE_SELECTION_START = getCellById(ev.target.id);
        MOUSE_SELECTION_FINISH = getCellById(ev.target.id);
        colorize(getSelection(MOUSE_SELECTION_START, MOUSE_SELECTION_FINISH));
    }
});

document.addEventListener('dblclick', ev => {
    if (ev.target.classList.contains('cell')){
        console.log('dbclick: ' + ev.target.id);
        enableCell(ev.target);
    }
});

document.addEventListener('mouseup', ev => {
    if (ev.target.classList.contains('cell')){
        console.log('mouseup: ' + ev.target.id);
        ev.target.setAttribute('readonly', 'readonly');
        MOUSE_PRESSED = false;
    }
});

document.addEventListener('mouseover', ev => {
    if (ev.target.classList.contains('cell') && MOUSE_PRESSED === true && IS_CHANGING === false){
        console.log('mouseover MOUSE_PRESSED IS_CHANGING ' + ev.target.id);
        ev.target.setAttribute('readonly', 'readonly');
        MOUSE_SELECTION_FINISH = getCellById(ev.target.id);
        colorize(getSelection(MOUSE_SELECTION_START, MOUSE_SELECTION_FINISH));

    }
});

// document.querySelectorAll('input.cell').forEach(el => {
//     el.onkeydown = (ev) => {
//         console.log('keydown: ' + ev.target.id);
//         if (ev.key === "Enter"){
//             disableCell(ev.target);
//         }
//     }
//     el.addEventListener('change', ev => {
//         syncHTMLWithCell(ev.target);
//         console.log('change: ' + ev.target.id);
//         ev.target.value = getCellById(ev.target.id).getValue();
//     });
//     el.addEventListener('focusout', ev => {
//         console.log('focusout: ' + ev.target.id);
//     });
//     el.addEventListener('mousedown', ev => {
//         console.log('mousedown: ' + ev.target.id);
//         disableCellsExceptSome(ev.target);
//         ev.target.setAttribute('readonly', 'readonly');
//         SELECTION_ACTIVE = true;
//         MOUSE_PRESSED = true;
//         MOUSE_SELECTION_START = getCellById(ev.target.id);
//         MOUSE_SELECTION_FINISH = getCellById(ev.target.id);
//         colorize(getSelection(MOUSE_SELECTION_START, MOUSE_SELECTION_FINISH));
//
//     });
//     el.addEventListener('dblclick', ev => {
//         console.log('dbclick: ' + ev.target);
//         enableCell(ev.target);
//     });
//     el.addEventListener('mouseup', ev => {
//         console.log('mouseup: ' + ev.target.id);
//         ev.target.setAttribute('readonly', 'readonly');
//         MOUSE_PRESSED = false;
//     });
//     el.addEventListener('mouseover', ev => {
//         if (MOUSE_PRESSED === true && IS_CHANGING === false){
//             console.log('mouseover MOUSE_PRESSED IS_CHANGING ' + ev.target.id);
//             ev.target.setAttribute('readonly', 'readonly');
//             MOUSE_SELECTION_FINISH = getCellById(ev.target.id);
//             colorize(getSelection(MOUSE_SELECTION_START, MOUSE_SELECTION_FINISH));
//         }
//     });
// });

document.onkeydown = (ev) => {
    if (SELECTION_ACTIVE && ev.key === 'Delete'){
        deleteValues(getSelection(MOUSE_SELECTION_START, MOUSE_SELECTION_FINISH))
    }
}
