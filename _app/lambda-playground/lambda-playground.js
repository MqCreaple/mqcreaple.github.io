const alphabet = "abcdefghijklmnopqrstuvwxyz";
const replacingList = {
    "ID": [ "λx", "x" ],
    // logic
    "T": [ "λx", "λy", "x" ],
    "F": [ "λx", "λy", "y" ],
    "AND": [ "λa", "λb", [ "a", "b", "F" ] ],
    "OR":  [ "λa", "λb", [ "a", "T", "b" ] ],
    "NOT": [ "λa", [ "a", "F", "T" ] ],
    "XOR": [ "λa", "λb", [ "a", [ "NOT", "b" ], "b" ] ],
    // natural number
    "0": [ "λf", "λx", "x" ],
    "1": [ "λf", "λx", [ "f", "x" ] ],
    "2": [ "λf", "λx", [ "f", [ "f", "x" ] ] ],
    "3": [ "λf", "λx", [ "f", [ "f", [ "f", "x" ] ] ] ],
    "4": [ "λf", "λx", [ "f", [ "f", [ "f", [ "f", "x" ] ] ] ] ],
    "SUCC": [ "λn", "λf", "λx", [ "f", [ "n", "f", "x" ] ] ],
    "+": [ "λm", "λn", "λf", "λx", [ "m", "f", [ "n", "f", "x" ] ] ],
    "*": [ "λm", "λn", "λf", [ "m", [ "n", "f" ] ] ],
    "PRED": [ "λn", "λf", "λx", [ [ "n", [ "λg", "λh", [ "h", [ "g", "f" ] ] ] , [ "λu", "x" ] ], "ID" ] ],
    // Y combinator
    "Y": [ "λf", [ [ "λx", [ "f", [ "x", "x" ] ] ], [ "λx", [ "f", [ "x", "x" ] ] ] ] ]
}
const lambdaExample1 = [ [ "λx", "λy", [ "+", "x", "y" ] ], "2", "3" ];
const lambdaExample2 = [ "OR", [ "AND", "T", "F" ], ["T"] ];

/**
 * Takes a lambda term and parse it to DOM node
 * @param expr lambda term
 * @returns HTML DOM node
 */
function parseExpr(expr) {
    let domNode = document.createElement("span");
    domNode.classList.add("l");

    if(typeof expr == "object") {
        if(typeof expr[0] == "string" && expr[0].startsWith("λ")) {
            // lambda expression
            domNode.classList.add("l-lambda-expr")
            for(let i = 0; i < expr.length - 1; i++) {
                if(!typeof expr[i] == "string" || !expr[i].startsWith("λ")) {
                    throw "Syntax Error: lambda expression should have only 1 body!";
                }
                // create DOM node for `λ` bouded variable
                let child = document.createElement("span");
                child.className = "l l-lambda";
                child.innerHTML = expr[i].substring(1);
                domNode.appendChild(child);
            }
            // create DOM node for function body
            domNode.appendChild(parseExpr(expr[expr.length - 1]));
        } else {
            // function call
            domNode.classList.add("l-func-call");
            for(let i = 0; i < expr.length; i++) {
                // create DOM node for function body and variables
                domNode.appendChild(parseExpr(expr[i]));
            }
            domNode.dataset.nextId = expr.length;
        }
    } else {
        // atom
        domNode.classList.add("l-atom");
        domNode.innerHTML = expr;
    }
    return domNode;
}

/**
 * Join key-value pairs of an object with given string.
 * Idea from: https://stackoverflow.com/questions/68215522/simplest-way-to-join-object-key-value-pair-with
 * @param obj object whose values are DOM nodes
 * @param str string
 * @returns joined string
 */
function joinObject(obj, str = " ") {
    return Object.keys(obj).filter(key => obj[key]).map(key => `${key}=${obj[key].id}`).join(str);
}

function unjoinObject(sobj, str = " ") {
    return Object.fromEntries(sobj.split(str).filter(value => (value != "")).map(str => {
        let pair = str.split("=");
        return [pair[0], document.getElementById(pair[1])];
    }));
}

/**
 * Give each individual elements in the DOM tree a unique ID.
 * Add reference of variables to their lambda terms.
 * @param dom dom tree
 * @param globalName the name of whole expression
 * @param localName the name of the current node
 * @param refTable a list with pairs of variable names and corresponding lambda DOM nodes
 * @returns the dom tree
 */
function nameExpr(dom, globalName, localName = "", refTable = {}) {
    dom.id = globalName + localName;
    // record defined variable names in DOM node's data section
    dom.dataset.refTable = joinObject(refTable);

    if(dom.classList.contains("l-atom")) {
        //* atom *//
        if(dom.innerHTML in refTable) {
            // if this atom's content is contained in refTable,
            // find the corresponding lambda node, and add record both their reference (ID).
            let lambdaNode = refTable[dom.innerHTML];
            lambdaNode.dataset.refs += dom.id + " ";
            dom.dataset.refBy = lambdaNode.id;
        }
    } else if(dom.classList.contains("l-lambda-expr")) {
        //* lambda expression *//
        let newRefTable = {...refTable};
        for(let i = 0; i < dom.children.length - 1; i++) {
            let child = dom.children[i];
            child.id = globalName + localName + i;
            child.dataset.refs = "";
            // add variable name to refTable
            newRefTable[child.innerHTML] = child;
        }
        // recursively name the body of lambda expression
        nameExpr(dom.children[dom.children.length - 1], globalName, localName + "b", newRefTable);
    } else if(dom.classList.contains("l-func-call")) {
        //* function call *//
        for(let i = 0; i < dom.children.length; i++) {
            // recursively name the function and parameters
            nameExpr(dom.children[i], globalName, localName + i, refTable);
        }
    }
    return dom;
}

/**
 * Rename a variable in lambda expression to another name.
 * Also known as: alpha conversion
 * @param lambda DOM node of a lambda term inside lambda expression
 * @param newName variable's new name
 */
function renameVar(lambda, newName) {
    if(!lambda.classList.contains("l-lambda")) {
        throw "Function `renameVar` only accepts lambda term!";
    }
    lambda.innerHTML = newName;
    let refs = lambda.dataset.refs.split(' ');
    refs.forEach(ref => {
        let refNode = document.getElementById(ref);
        if(refNode) {
            refNode.innerHTML = newName;
        }
    });
}

/**
 * Generate an unused name with given array of names that are already taken.
 * @param definedNames names that are already taken
 * @returns a name that is not contained in `definedNames`
 */
function generateUnusedName(base, definedNames) {
    let capital = (base.charAt(0).match(/[A-Z]/))? 65: 97;   // if letter `base` is capital letter, return 'A', otherwise 'a'
    let baseCh = base.charCodeAt(0) - capital;
    let ch = (baseCh + 1) % 26;
    while(ch != baseCh) {
        if(!definedNames.includes(String.fromCharCode(ch + capital))) {
            break;
        }
        ch = (ch + 1) % 26;
    }
    if(ch != baseCh) {
        return String.fromCharCode(ch + capital);
    }

    function enumerate(len, cap, defNames, partial = "") {
        if(len == 0) {
            return (defNames.includes(partial))? null: partial;
        }
        for(let i = 0; i < 26; i++) {
            enumerate(len - 1, cap, defNames, partial + String.fromCharCode(i + cap));
        }
    }
    let find = false;
    for(let length = 2; find; length++) {
        find = enumerate(length, capital, definedNames);
    }
    return find;
}

/**
 * Recursively rename variables if the same name already exists
 * @param dom dom tree
 * @param definedVars already defined variable names
 */
function renameExpr(dom, definedVars = []) {
    if(dom.classList.contains("l-atom")) {
        return;
    }
    if(dom.classList.contains("l-lambda-expr")) {
        let newVars = definedVars;
        for(let i = 0; i < dom.children.length - 1; i++) {
            if(newVars.includes(dom.children[i].innerHTML)) {
                renameVar(dom.children[i], generateUnusedName(dom.children[i].innerHTML, newVars));
            }
            newVars.push(dom.children[i].innerHTML);
        }
        renameExpr(dom.children[dom.children.length - 1], newVars);
    }
    if(dom.classList.contains("l-func-call")) {
        for(let i = 0; i < dom.children.length; i++) {
            renameExpr(dom.children[i], definedVars);
        }
    }
}

/**
 * Render the expression (making special elements clickable, add dragging links, etc.)
 * @param dom expression's DOM tree
 * @param replTable custom replacing table
 * @returns 
 */
function renderExpr(dom, replTable = {}) {
    if(dom.classList.contains("l-atom")) {
        //* atom *//
        // case: content of the atom is in replacing list
        if(dom.innerHTML in replacingList || dom.innerHTML in replTable) {
            dom.classList.add("l-replace");
            dom.addEventListener('click', function(event) {
                // when the element is clicked, replace the content of element to corresponding content in replacingList
                let newExpr = parseExpr(replTable[dom.innerHTML]? replTable[dom.innerHTML]: replacingList[dom.innerHTML]);
                let refTable = unjoinObject(dom.dataset.refTable);
                dom.replaceWith(nameExpr(newExpr, dom.id, "", refTable));
                renameExpr(newExpr, Object.keys(refTable));
    
                // Render the element.
                // Only when its parent is a function call and the element is lambda expression, render its parent.
                let nodeToRender = document.getElementById(dom.id);
                if(nodeToRender.classList.contains("l-lambda-expr")) {
                    nodeToRender = nodeToRender.parentNode;
                }
                renderExpr(nodeToRender, replTable);
            });
        }

    } else if(dom.classList.contains("l-lambda-expr")) {
        //* lambda expression *//
        // only render the last child
        renderExpr(dom.children[dom.children.length - 1], replTable);
        // case: lambda expression has no lambda node, but only body
        if(dom.children.length == 1) {
            let child = dom.children[0];
            dom.replaceWith(child);
            (child.classList.contains("l-lambda-expr"))?
                    renderExpr(child.parentNode, replTable): renderExpr(child, replTable);
            return;
        }
        // case: lambda expression's body is another lambda expression
        if(dom.children[dom.children.length - 1].classList.contains("l-lambda-expr")) {
            let child = dom.children[dom.children.length - 1];
            for(let i = 0; i < child.children.length - 1; i++) {
                // merge lambda node of two expressions
                dom.insertBefore(child.children[i].cloneNode(true), child);
            }
            child.replaceWith(child.children[child.children.length - 1]);
            nameExpr(dom, dom.id, "", unjoinObject(dom.dataset.refTable));
            renderExpr(dom, replTable);
            return;
        }

    } else if(dom.classList.contains("l-func-call")) {
        //* function call *//
        // render every children
        for(let i = 0; i < dom.children.length; i++) {
            renderExpr(dom.children[i], replTable);
        }
        // case: function has no parameter
        if(dom.children.length == 1) {
            let child = dom.children[0];
            dom.replaceWith(child);
            (child.classList.contains("l-lambda-expr"))?
                    renderExpr(child.parentNode, replTable): renderExpr(child, replTable);
            return;
        }
        // case: function is a lambda expression
        if(dom.children[0].classList.contains("l-lambda-expr")) {
            let lambdaExpr = dom.children[0];
            let paramLen = Math.min(dom.children.length, lambdaExpr.children.length) - 1;
            // loop through every function parameters and corresponding lambda nodes in the expression
            //* [   [ 'λx', 'λy', ... ],        a, b ]
            //*       lambda node         function parameter
            var currentDraggingTarget = "";          // shared variable storing the ID of target lambda node of the parameter currently being dragged
            for(let i = 0; i < paramLen; i++) {
                let parameter = dom.children[i + 1]; // the ith parameter
                let lambda = lambdaExpr.children[i]; // the ith lambda node
                parameter.draggable = true;          // let the parameter node be draggable
                parameter.addEventListener("mouseover", function(event) {
                    parameter.classList.add("l-emph");
                    lambda.classList.add("l-emph");
                });
                parameter.addEventListener("mouseout", function(event) {
                    parameter.classList.remove("l-emph");
                    lambda.classList.remove("l-emph");
                });
                parameter.ondragstart = function(event) {
                    // set `currentDraggingTarget` to be the lambda node's ID
                    currentDraggingTarget = lambda.id;
                };
                lambda.ondragover = function(event) {
                    event.preventDefault();
                    // verify the id of target element
                    if(event.target.id == currentDraggingTarget) {
                        let refs = event.target.dataset.refs.split(' ');
                        // add border to each reference node
                        refs.forEach(refID => {
                            let refNode = document.getElementById(refID);
                            if(refNode) {
                                refNode.style.borderColor = "rgba(0, 0, 0, 0.4)";
                            }
                        });
                    }
                };
                lambda.ondrop = function(event) {
                    event.preventDefault();
                    // verify the id of target element
                    if(event.target.id == currentDraggingTarget) {
                        let parent = event.target.parentNode;
                        let refs = event.target.dataset.refs.split(' ');    // list of IDs of references
                        let definedVars = Object.keys(unjoinObject(parent.children[parent.children.length - 1].dataset.refTable));
                        refs.forEach(refID => {
                            // loop through every node referenced by lambda node, replace them with the parameter
                            let refNode = document.getElementById(refID);
                            if(refNode) {
                                let newNode = parameter.cloneNode(true);
                                refNode.replaceWith(nameExpr(newNode, refNode.id, "", unjoinObject(dom.dataset.refTable)));
                                if(definedVars) {
                                    renameExpr(newNode, definedVars);
                                }
                                newNode.classList.remove("l-emph");
                            }
                        });
                        event.target.remove();
                        parameter.remove();
                        // re-name and re-render the parent node
                        let nodeToRender = parent;
                        if(parent.classList.contains("l-lambda-expr") && parent.parentNode.classList.contains("l")) {
                            nodeToRender = parent.parentNode;
                        }
                        renderExpr(nameExpr(nodeToRender, nodeToRender.id, "", unjoinObject(nodeToRender.dataset.refTable)), replTable);
                    }
                };
            }
        }
    }
    return dom;
}

/**
 * All-in-one render lambda term.
 * @param expr expression (same format with lambdaExample1 and lambdaExample2)
 * @param name name (identifier) of the term (every term should have unique names)
 * @param panel panel to embed the expression
 * @param replTable replacing table
 */
function lambdaExpr(expr, name, panel, replTable = {}) {
    panel.className = "lambda-panel";
    panel.innerHTML = "";
    panel.appendChild(renderExpr(nameExpr(parseExpr(expr), name), replTable));
}

function autoRender() {
    document.addEventListener("DOMContentLoaded", function() {
        document.querySelectorAll("p.lambda-r").forEach(function(element, index) {
            let replTable = {};
            if(element.dataset.replTable) {
                replTable = JSON.parse(element.dataset.replTable);
            }
            lambdaExpr(JSON.parse(element.innerHTML), `lexp${index}`, element, replTable);
        });
    });
}