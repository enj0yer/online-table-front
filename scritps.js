class Cell{
    #id;
    #value;
    constructor(id, value="") {
        this.#id = id;
        this.#value = value;
    }

    get getId(){
        return this.#id;
    }
}

function generateGrid(rows, cols){
    for (let i = 1; i <= rows; i++){
        for (let j = 1; j <= cols; j++){
            document.getElementById("container").innerHTML += `<input id="${i}_${j}" value="${i}_${j}" class="cell">`;
        }
        document.getElementById("container").append(document.createElement("br"));
    }
}

function getAllValues(){
    let map = new Map();

    document.querySelectorAll(".cell").forEach(el => map.set(el, el.value));

    console.log(map);
}

generateGrid(40, 10);
document.getElementById("header").addEventListener('click', getAllValues);