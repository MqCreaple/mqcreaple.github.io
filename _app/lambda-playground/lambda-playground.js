const alphabet = "abcdefghijklmnopqrstuvwxyz";
const replacingList = {
    "ID": [ "λx", "x" ],
    // logic
    "T": [ "λx", "λy", "x" ],
    "F": [ "λx", "λy", "y" ],
    "AND": [ "λa", "λb", [ "a", "b", "F" ] ],
    "OR":  [ "λa", "λb", [ "a", "T", "b" ] ],
    "NOT": [ "λa", [ "a", "F", "T" ] ]
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
 * Give each individual elements in the DOM tree a unique ID.
 * Add reference of variables to their lambda terms.
 * @param dom dom tree
 * @param globalName the name of whole expression
 * @param localName the name of the current node
 * @param refTable a list with pairs of variable names and corresponding lambda DOM nodes
 * @param definedVars set of defined variable names
 * @returns the dom tree
 */
function nameExpr(dom, globalName, localName = "", refTable = {}, definedVars = []) {
    dom.id = globalName + localName;
    // record defined variable names in DOM node's data section
    dom.dataset.definedVars = definedVars.join(" ");

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
        for(let i = 0; i < dom.children.length - 1; i++) {
            let child = dom.children[i];
            child.id = globalName + localName + i;
            child.dataset.refs = "";
            // add variable name to refTable
            refTable[child.innerHTML] = child;
            // add variable to definedVars
            definedVars.push(child.innerHTML);
        }
        // recursively name the body of lambda expression
        nameExpr(dom.children[dom.children.length - 1], globalName, localName + "b", refTable, definedVars);
    } else if(dom.classList.contains("l-func-call")) {
        //* function call *//
        for(let i = 0; i < dom.children.length; i++) {
            // recursively name the function and parameters
            nameExpr(dom.children[i], globalName, localName + i, refTable, definedVars);
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
    dom.dataset.definedVars = definedVars.join(" ");
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
                dom.replaceWith(nameExpr(newExpr, dom.id));
                let definedVars = dom.dataset.definedVars.split(" ");
                renameExpr(newExpr, definedVars);
    
                // Render the element.
                // Only when its parent is a function call and the element is lambda expression, render its parent.
                let nodeToRender = document.getElementById(dom.id);
                if(nodeToRender.parentNode.classList.contains("l-func-call") && nodeToRender.classList.contains("l-lambda-expr")) {
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
            (child.parentNode.classList.contains("l-func-call") && child.classList.contains("l-lambda-expr"))?
                    renderExpr(child.parentNode, replTable): renderExpr(child, replTable);
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
            (child.parentNode.classList.contains("l-func-call") && child.classList.contains("l-lambda-expr"))?
                    renderExpr(child.parentNode, replTable): renderExpr(child, replTable);
            return;
        }
        // case: function is a lambda expression
        if(dom.children[0].classList.contains("l-lambda-expr")) {
            let lambdaExpr = dom.children[0];
            let paramLen = Math.max(dom.children.length, lambdaExpr.children.length) - 1;
            // loop through every function parameters and corresponding lambda nodes in the expression
            //* [   [ 'λx', 'λy', ... ],        a, b ]
            //*       lambda node         function parameter
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
                    // set the data transferred to be the lambda node's ID
                    event.dataTransfer.setData("text", lambda.id);
                };
                lambda.ondragover = function(event) {
                    event.preventDefault();
                };
                lambda.ondrop = function(event) {
                    event.preventDefault();
                    // verify the dropped element has the correct data transferred
                    if(event.target.id == event.dataTransfer.getData("text")) {
                        let parent = event.target.parentNode;
                        let refs = event.target.dataset.refs.split(' ');
                        refs.forEach(refID => {
                            // loop through every node referenced by lambda node, replace them with the parameter
                            let refNode = document.getElementById(refID);
                            if(refNode) {
                                let newNode = parameter.cloneNode(true);
                                refNode.replaceWith(newNode);
                                let definedVars = refNode.dataset.definedVars.split(" ");
                                if(definedVars) {
                                    renameExpr(newNode, definedVars); // TODO
                                }
                                newNode.classList.remove("l-emph");
                            }
                        });
                        event.target.remove();
                        parameter.remove();
                        // re-name and re-render the parent node
                        let nodeToRender = parent;
                        if(parent.parentNode.classList.contains("l")) {
                            nodeToRender = parent.parentNode;
                        }
                        renderExpr(nameExpr(nodeToRender, nodeToRender.id), replTable); // TODO (backup refTable)
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
    $(document).ready(function() {
        $("p.lambda-r").each(function(index) {
            let replTable = {};
            if(this.dataset.replTable) {
                replTable = JSON.parse(this.dataset.replTable);
            }
            lambdaExpr(JSON.parse($(this).html()), `lexp${index}`, this, replTable);
        });
    });
}