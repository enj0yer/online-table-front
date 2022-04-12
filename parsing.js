import {getNumberInsteadLiteral, getSelection, Cell, checkStringId} from "./scripts.js";
import {Formula, SUM, SUB} from "./formulas_logic.js";

export function isCalcExpression(cell_value){
    if (cell_value[0] === '='){
        return parseAll(cell_value.slice(1))
    }
    else return false;
}

/**
 * Check cell value for containing only one formula
 * @param cell_value : string
 * @returns {boolean}
 */
export function isSingleFunction(cell_value){
    let counter = 0;
    let isChanged = false;

    for (let i = 0; i < cell_value.length; i++){
        if (cell_value[i] === '('){
            counter += 1;
            isChanged = true;
        }

        if (cell_value[i] === ')'){
            counter -= 1;
        }

        if (counter === 0 && isChanged === true){
            return i === cell_value.length - 1;
        }
    }
}

//^[0-9.]{1,}$|^[A-Za-z0-9]{1,6}$|^[A-Za-z]{1,}$

function searchSafeValues(string){

    let searchString = '';

    for (let s of string){
        searchString += s;
        if (searchString.match("^[0-9.]{1,}$|^[A-Za-z0-9]{1,6}$")){
            return searchString;
        }
    }

    return false;
}

function replaceOp(stringOp){
    switch (stringOp) {
        case 'AND':
            return '&&';

        case 'OR':
            return '||';

        case 'NOT':
            return '!';
    }
}

export function parseAll(calc_expression){
    let singleSeps = ['(', ')', ' ', '+', '-', '*', '/', '%', '!'];

    let nonSingleSeps = ['<=', '>=', '==', '===', '&&', '||'];

    let replaceSeps = ['AND', 'OR', 'NOT']

    let result_array = [];

    let acc = '';

    for (let i = 0; i < calc_expression.length; i++){
        if (singleSeps.includes(calc_expression[i]) && acc !== ''){
            result_array.push(acc);
            acc = ''
        }
        else if (nonSingleSeps.includes(acc)
            && i < calc_expression.length - 1
            && (singleSeps.includes(calc_expression[i + 1])
                || searchSafeValues(calc_expression.slice(i, calc_expression.length)))){

            result_array.push(acc);
            acc = '';
        }

        acc += calc_expression[i];

        if (replaceSeps.includes(acc)){
            calc_expression.replace(acc, replaceOp(acc));
        }
    }

    return result_array;
}

/**
 * Check the cell_value for similarity with formula format.
 * @param cell_value : string
 * @returns {boolean}
 */
export function isFormula(cell_value){
    return cell_value.trim().match("^=[A-Za-z]{1,}\\(.{1,}\\)$") !== null;
}

/**
 * Check args for subformula.
 * @param args : string
 * @returns {boolean}
 */
export function hasSubFormula(args){
    return args.match("=[A-Za-z]{1,}\\(.{1,}\\)") !== null;
}

/**
 * Get a position of ) with nesting
 * @param params : string
 * @returns {number}
 */
export function getEndOfArgs(params){

    let counter = 0;
    let isChanged = false;

    for (let i = 0; i < params.length; i++){
        if (params[i] === '('){
            counter += 1;
            isChanged = true;
        }

        if (params[i] === ')'){
            counter -= 1;
        }

        if (counter === 0 && isChanged === true){
            return i;
        }
    }

    return -1;
}

/**
 * Calculates sub formulas in string and replaces formula with result
 * @param params : string
 * @returns
 */
export function calcSubFormula(params){

    let end_of_args = getEndOfArgs(params);

    if (end_of_args === -1) return false;

    let result = calcFormula(params.slice(params.indexOf('='), end_of_args + 1));

    if (result === '#ОШИБКА') return false;

    return params.replace(params.slice(params.indexOf('='), end_of_args + 1), result);
}

/**
 * Calculate slice of cells values.
 * Returns false, if args have wrong format.
 * @param args : string
 * @param action : function
 * @returns {boolean|number}
 */
export function calcSliceArgs(args, action){
    if (args.length !== 2) return false;

    if (!isCellNumber(args[0]) || !isCellNumber(args[1])) return false;

    let start_cell = new Cell(getCellHTMLId(args[0]));
    if (!checkStringId(start_cell.getFullId())) return false;
    start_cell.setValue(document.getElementById(start_cell.getFullId()));

    let finish_cell = new Cell(getCellHTMLId(args[1]));
    if (!checkStringId(finish_cell.getFullId())) return false;
    finish_cell.setValue(document.getElementById(finish_cell.getFullId()));

    return calcSelection(getSelection(start_cell, finish_cell), action);
}

export function addOffsetToRelId(indicative_cell, args_array){
    let formula = indicative_cell.getFormula();

    for (let arg of args_array){
        if (arg[0] === '$'){}
    }
}

/**
 * Calculate separated arguments.
 * @param args : Array<string>
 * @param action : function
 * @returns {number, boolean}
 */
export function calcSepArgs(args, action){

    for (let arg of args){
        if (arg.includes(':')) return false;
    }

    return action(args);
}

/**
 * Trim arguments in array
 * @param args : Array<string>
 */
export function trimArguments(args){
    for (let i = 0; i < args.length; i++){
        args[i] = args[i].trim();
    }

}

/**
 * Calculate values of cells in selection.
 * @param selection : Selection
 * @param action : function
 * @returns {number}
 */
function calcSelection(selection, action){
    return action(selection);
}

/**
 * Check value for string representation of number.
 * @param value : string
 * @returns {boolean}
 */
export function isDigit(value){
    return !isNaN(value) && value !== '';
}

/**
 * Get cell value of table.
 * Cell number format like A1, b3, C20.
 * @param cell_number : string
 * @returns {string}
 */
export function getCellHTMLValue(cell_number){
    return document.getElementById(getCellHTMLId(cell_number)).value;
}

/**
 * Get cell id for HTML search.
 * Cell number format like A1, b3, C20.
 * @param cell_number : string
 * @returns {string}
 */
export function getCellHTMLId(cell_number){
    let letterId = cell_number.match("^[$]{0,1}[A-Za-z]{1,3}")[0];
    let numberId = cell_number.match("[$]{0,1}[1-9]{1,3}")[0];

    if (letterId.includes('$')){
        letterId = letterId.replaceAll('$', '');
    }

    if (numberId.includes('$')){
        numberId = numberId.replaceAll('$', '');
    }

    return `${numberId}_${getNumberInsteadLiteral(letterId)}`
}

/**
 * Check value for representation of cell number format like A1, b3, C20.
 * @param value : string
 * @returns {boolean}
 */
export function isCellNumber(value) {
    return value.match("^[$]{0,1}[A-Za-z]{1,3}[$]{0,1}[1-9]{1,3}$") !== null;
}

/**
 * Get formula name from string, which containing a string representation of formula.
 * @param string_formula : string
 * @returns {string}
 */
function getFormulaName(string_formula){
    return string_formula.slice(string_formula.indexOf('=') + 1, string_formula.indexOf('(')).toUpperCase();
}

/**
 * Get formula arguments from string, which containing a string representation of formula.
 * @param string_formula : string
 * @returns {string}
 */
function getFormulaArguments(string_formula){
    return string_formula.slice(string_formula.indexOf('(') + 1, string_formula.lastIndexOf(')'));
}

/**
 * Check formula name for presence in formulas list.
 * Returns false, if formula does not exist.
 * @param formula_name : string
 * @returns {Formula|boolean}
 */
function checkFormula(formula_name){
    for (let formula of FORMULAS){
        if (formula.getName() === formula_name){
            return formula;
        }
    }
    return false;
}

/**
 * Calculate formula.
 * Returns false, if found errors.
 * @param string_formula : string
 * @returns {string|boolean}
 */
export function calcFormula(string_formula){

    let fName = getFormulaName(string_formula);

    if (fName === ''){
        return false;
    }

    let formula = checkFormula(fName);

    if (formula === false){
        return false;
    }

    let fArgs = getFormulaArguments(string_formula);

    if (fArgs === ''){
        return false;
    }

    return formula.action(fArgs);

}

/**
 * List of available formulas.
 * @type {Array<Formula>}
 */
const FORMULAS = [new Formula("SUM", SUM),
    new Formula("SUB", SUB),
    new Formula("MULT"),
    new Formula("DIV"),
    new Formula("AVG"),
    new Formula("MAX"),
    new Formula("MIN"),
    new Formula("IF"),
    new Formula("LENGTH"),
    new Formula("FILL")];
