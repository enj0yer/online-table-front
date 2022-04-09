import {getNumberInsteadLiteral, getSelection, checkStringId, Cell} from "./scripts.js";

class FormulaAction{
    #selection;
    #formula;
}

class Formula{
    #name;
    #action;

    constructor(name, action) {
        this.#name = name;
        this.#action = action;
    }

    getName(){
        return this.#name;
    }


    action(params){
        return this.#action(params);
    }

}

export function isFormula(cell_value){
    return cell_value.trim().match("^=[A-Za-z]{1,}\\(.{1,}\\)$") !== null;
}

function hasSubFormula(value){
    return value.match("=[A-Za-z]{1,}\\(.{1,}\\)") !== null;
}




let SUM = (params) => {

    let act_args = params;

    let mode;

    while (hasSubFormula(act_args)){
        let result = calcFormula(params.slice(params.indexOf('='), params.lastIndexOf(')') + 1));

        if (result === '#ОШИБКА') return false;

        act_args = params.replace(params.slice(params.indexOf('='), params.lastIndexOf(')') + 1), result);

    }

    if (act_args.includes(';')) mode = ';';
    else if (act_args.includes(':')) mode = ':';
    else return false;

    let args = act_args.split(mode);

    args.forEach(el => el = el.trim());

    if (mode === ';') return calcSepArgs(args);
    if (mode === ':') return calcSliceArgs(args);
}

function calcSliceArgs(args){
    if (args.length !== 2) return false;

    let start_cell = new Cell(getCellHTMLId(args[0]));
    start_cell.setValue(document.getElementById(start_cell.getFullId()));

    let finish_cell = new Cell(getCellHTMLId(args[1]));
    finish_cell.setValue(document.getElementById(finish_cell.getFullId()));

    return sumOfSelection(getSelection(start_cell, finish_cell));

}

function calcSepArgs(args){
    let acc = 0;

    for (let arg of args){
        if (isDigit(arg)) acc += Number(arg);
        else if (isCellNumber(arg) && checkStringId(getCellHTMLId(arg))){
            let value = getCellHTMLValue(arg);
            if (isDigit(value)){
                acc += Number(value);
            }
        }
    }

    return acc;
}

function sumOfSelection(selection){
    let result = 0;
    for (let cell of selection.getCells()){
        if (!isDigit(cell.getValue())) continue;
        result += Number(cell.getValue());
    }

    return result;
}

function isDigit(value){
    return !isNaN(value);
}

function getCellHTMLValue(cell_number){
    return document.getElementById(getCellHTMLId(cell_number)).value;
}

function getCellHTMLId(cell_number){
    let letterId = cell_number.match("^[A-Za-z]{1,3}")[0];
    let numberId = cell_number.match("[1-9]{1,3}")[0];

    return `${numberId}_${getNumberInsteadLiteral(letterId)}`
}

function isCellNumber(value) {
    return value.match("^[A-Za-z]{1,3}[1-9]{1,3}$") !== null;
}

function getFormulaName(string_formula){
    return string_formula.slice(string_formula.indexOf('=') + 1, string_formula.indexOf('(')).toUpperCase();
}

function getFormulaArguments(string_formula){
    return string_formula.slice(string_formula.indexOf('(') + 1, string_formula.lastIndexOf(')'));
}

function checkFormula(formula_name){
    for (let formula of FORMULAS){
        if (formula.getName() === formula_name){
            return formula;
        }
    }
    return false;
}

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

const FORMULAS = [new Formula("SUM", SUM),
    new Formula("SUB"),
    new Formula("MULT"),
    new Formula("DIV"),
    new Formula("AVG"),
    new Formula("MAX"),
    new Formula("MIN"),
    new Formula("IF"),
    new Formula("LENGTH"),
    new Formula("FILL")];



