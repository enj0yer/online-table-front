import {checkStringId} from "./scripts.js";
import {
    isDigit,
    hasSubFormula,
    calcSubFormula,
    isCellNumber,
    getCellHTMLValue,
    getCellHTMLId,
    calcSepArgs,
    calcSliceArgs,
    trimArguments, isFormula
} from "./parsing.js";

/**
 * Class, which represents the cell formula.
 */
export class Formula{
    #name;
    #action;

    constructor(name, action) {
        this.#name = name;
        this.#action = action;
    }

    /**
     * Get formula name.
     * @returns {string}
     */
    getName(){
        return this.#name;
    }

    /**
     * Do formula action with params.
     * @param params : string
     * @returns {string}
     */
    action(params){
        return this.#action(params);
    }

}

/**
 * Sum formula logic.
 * Returns false, if found errors.
 * @param params : string
 * @returns {boolean|number}
 */
export const SUM = (params) => {

    let act_args = params;

    let mode;

    while (hasSubFormula(act_args)){
        act_args = calcSubFormula(act_args);
        if (act_args === false) return false;

    }

    if (act_args.includes(';')) mode = ';';
    else if (act_args.includes(':')) mode = ':';
    else return false;

    let args = act_args.split(mode);

    trimArguments(args);

    if (mode === ';')
        return calcSepArgs(args, (args) => {
            let acc = 0;
            for (let arg of args){
                if (isDigit(arg)) acc += Number(arg);
                else if (isCellNumber(arg) && checkStringId(getCellHTMLId(arg))){
                    let value = getCellHTMLValue(arg);
                    if (isDigit(value)){
                        acc += Number(value);
                    }
                    else return false;
                }
                else return false;
            }
            return acc;
    });
    if (mode === ':')
        return calcSliceArgs(args, (selection) => {
            let acc = 0;
            for (let cell of selection.getCells()){
                if (isDigit(cell.getValue()))
                    acc += Number(cell.getValue());
            }
            return acc;
    });
};

/**
 * Sub formula logic.
 * @param params : string
 * @returns {number|boolean}
 */
export const SUB = (params) =>{

    let act_args = params;

    while (hasSubFormula(act_args)){
        act_args = calcSubFormula(act_args);
        if (act_args === false) return false;
    }


    if (act_args.includes(':')) return false;
    if (act_args.includes(';')){
        let args = act_args.split(';');
        trimArguments(args);
        return calcSepArgs(args, (args) => {
            if (args.length !== 2) return false;

            let result = 0;

            if (isDigit(args[0])) result = Number(args[0]);
            else if (isCellNumber(args[0]) && checkStringId(getCellHTMLId(args[0]))){
                let value = getCellHTMLValue(args[0]);
                if (!isDigit(value)) return false;
                result = Number(value);
            }
            else return false;

            if (isDigit(args[1])) return result - Number(args[1]);
            else if (isCellNumber(args[1]) && checkStringId(getCellHTMLId(args[1]))){
                let value = getCellHTMLValue(args[1]);
                if (!isDigit(value)) return false;
                return result - Number(value);
            }
            else return false;
        });
    }
};

export const MULT = (params) =>{
    let act_args = params;

    let mode;

    while (hasSubFormula(act_args)){
        act_args = calcSubFormula(act_args);
        if (act_args === false) return false;

    }

    if (act_args.includes(';')) mode = ';';
    else if (act_args.includes(':')) mode = ':';
    else return false;

    let args = act_args.split(mode);

    trimArguments(args);

    if (mode === ';')
        return calcSepArgs(args, (args) => {
            let acc = 0;
            for (let i = 0; i < args.length; i++){
                if (i === 0)
                    if (isDigit(args[i])) acc = Number(args[i]);
                    else if (isCellNumber(args[i]) && checkStringId(getCellHTMLId(args[i]))){
                        let value = getCellHTMLValue(args[i]);
                        if (isDigit(value)){
                            acc = Number(value);
                        }
                        else return false;
                    }
                    else return false;
                else {
                    if (isDigit(args[i])) acc *= Number(args[i]);
                    else if (isCellNumber(args[i]) && checkStringId(getCellHTMLId(args[i]))){
                        let value = getCellHTMLValue(args[i]);
                        if (isDigit(value)){
                            acc *= Number(value);
                        }
                        else return false;
                    }
                    else return false;
                }
            }
            return acc;
        });
    if (mode === ':')
        return calcSliceArgs(args, (selection) => {
            let acc = 0;
            let cells = selection.getCells();
            for (let i = 0; i < cells.length; i++){
                if (i === 0)
                    acc = Number(cells[i].getValue());
                else{
                    if (isDigit(cells[i].getValue()))
                        acc *= Number(cells[i].getValue());
                }
            }
            return acc;
        });
};

export const DIV = (params) =>{
    let act_args = params;

    while (hasSubFormula(act_args)){
        act_args = calcSubFormula(act_args);
        if (act_args === false) return false;
    }

    if (act_args.includes(':')) return false;
    if (act_args.includes(';')){
        let args = act_args.split(';');
        trimArguments(args);
        return calcSepArgs(args, (args) => {
            if (args.length !== 2) return false;

            let result = 0;

            if (isDigit(args[0])) result = Number(args[0]);
            else if (isCellNumber(args[0]) && checkStringId(getCellHTMLId(args[0]))){
                let value = getCellHTMLValue(args[0]);
                if (!isDigit(value)) return false;
                result = Number(value);
            }
            else return false;

            if (isDigit(args[1])){
                result = result / Number(args[1]);
                if (!isDigit(result)) return false;
                return result;
            }
            else if (isCellNumber(args[1]) && checkStringId(getCellHTMLId(args[1]))){
                let value = getCellHTMLValue(args[1]);
                if (!isDigit(value)) return false;
                result = result / Number(value);
                if (!isDigit(result)) return false;
                return result;
            }
            else return false;
        });
    }
};

export const AVG = (params) => {
    let act_args = params;

    let mode;

    while (hasSubFormula(act_args)){
        act_args = calcSubFormula(act_args);
        if (act_args === false) return false;

    }

    if (act_args.includes(';')) mode = ';';
    else if (act_args.includes(':')) mode = ':';
    else return false;

    let args = act_args.split(mode);

    trimArguments(args);

    if (mode === ';')
        return calcSepArgs(args, (args) => {
            let acc = 0;
            for (let arg of args){
                if (isDigit(arg)){
                    acc += Number(arg);
                }
                else if (isCellNumber(arg) && checkStringId(getCellHTMLId(arg))){
                    let value = getCellHTMLValue(arg);
                    if (isDigit(value)){
                        acc += Number(value);
                    }
                    else return false;
                }
                else return false;
            }
            return acc / args.length;
        });
    if (mode === ':')
        return calcSliceArgs(args, (selection) => {
            let acc = 0;
            let count = 0;
            for (let cell of selection.getCells()){
                if (isDigit(cell.getValue())) {
                    acc += Number(cell.getValue());
                    count++;
                }
            }
            return acc / count;
        });
};

export const MAX = (params) => {
    let act_args = params;

    let mode;

    while (hasSubFormula(act_args)){
        act_args = calcSubFormula(act_args);
        if (act_args === false) return false;
    }

    if (act_args.includes(';')) mode = ';';
    else if (act_args.includes(':')) mode = ':';
    else return false;

    let args = act_args.split(mode);

    trimArguments(args);

    if (mode === ';')
        return calcSepArgs(args, (args) => {
            let max = Number.NEGATIVE_INFINITY;
            for (let arg of args){
                if (isDigit(arg)){
                    if (Number(arg) > max)
                        max = Number(arg);
                }
                else if (isCellNumber(arg) && checkStringId(getCellHTMLId(arg))){
                    let value = getCellHTMLValue(arg);
                    if (isDigit(value)){
                        if (Number(arg) > max)
                            max = Number(arg);
                    }
                    else return false;
                }
                else return false;
            }
            return max;
        });
    if (mode === ':')
        return calcSliceArgs(args, (selection) => {
            let max = Number.NEGATIVE_INFINITY;
            for (let cell of selection.getCells()){
                if (isDigit(cell.getValue())) {
                    if (Number(cell.getValue()) > max){
                        max = Number(cell.getValue());
                    }
                }
            }
            return max;
        });
};

export const MIN = (params) => {
    let act_args = params;

    let mode;

    while (hasSubFormula(act_args)){
        act_args = calcSubFormula(act_args);
        if (act_args === false) return false;
    }

    if (act_args.includes(';')) mode = ';';
    else if (act_args.includes(':')) mode = ':';
    else return false;

    let args = act_args.split(mode);

    trimArguments(args);

    if (mode === ';')
        return calcSepArgs(args, (args) => {
            let min = Number.POSITIVE_INFINITY;
            for (let arg of args){
                if (isDigit(arg)){
                    if (Number(arg) < min)
                        min = Number(arg);
                }
                else if (isCellNumber(arg) && checkStringId(getCellHTMLId(arg))){
                    let value = getCellHTMLValue(arg);
                    if (isDigit(value)){
                        if (Number(arg) < min)
                            min = Number(arg);
                    }
                    else return false;
                }
                else return false;
            }
            return min;
        });
    if (mode === ':')
        return calcSliceArgs(args, (selection) => {
            let min = Number.POSITIVE_INFINITY;
            for (let cell of selection.getCells()){
                if (isDigit(cell.getValue())) {
                    if (Number(cell.getValue()) < min){
                        min = Number(cell.getValue());
                    }
                }
            }
            return min;
        });
};

export const LENGTH = (params) => {
    let act_arg = params;

    while (hasSubFormula(act_arg)){
        act_arg = calcSubFormula(act_arg);
        if (act_arg === false) return false;
    }

    trimArguments(act_arg);

    if (isCellNumber(act_arg)) {
        if (checkStringId(getCellHTMLId(act_arg))){
            act_arg = getCellHTMLValue(act_arg);
        }
        else return false;
    }

    return act_arg.length;
};

//TODO
export const FILL = (params) => {
    let parsed_args = params.split(';');

    let mode;

    if (isFormula(parsed_args[0])) mode = 'f';
    else mode = 'v';

    if (mode === 'f'){
        if (parsed_args.length !== 3) return false;
        let formula = parsed_args[0];

        let length = 0;

        if (isDigit(parsed_args[1]))
            length = Number(parsed_args[1]);
        else return false;

        let dir = parsed_args[2];
    }
    //else mode = 'v'

    trimArguments(parsed_args);
};
