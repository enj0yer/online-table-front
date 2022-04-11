import {checkStringId} from "./scripts.js";
import {
    calcFormula,
    isDigit,
    hasSubFormula,
    calcSubFormula,
    isCellNumber,
    getCellHTMLValue,
    getCellHTMLId,
    calcSepArgs,
    calcSliceArgs,
    trimArguments
} from "./parsing.js";

/**
 * @deprecated
 */
class FormulaAction{
    #selection;
    #formula;
}

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
 * Sum formula.
 * Returns false, if found errors.
 * @param params : string
 * @returns {boolean|number}
 * @constructor
 */
export let SUM = (params) => {

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
    })
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

export let SUB = (params) =>{

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