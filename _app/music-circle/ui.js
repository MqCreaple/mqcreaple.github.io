

// display parameters
var unitPixel = 220;
const circleColor = "#000000";
const centerColor = "#507f72";
const tipColor = "#af270c";
const tipTriggeredColor = "#efcf40";
var triggerCooldown = 3;
const scaleLineColor = "#a1e0c5";
var drawScaleLines = true;
var drawTriggeredHistorySize = 0;

function draw(canvas, ctx) {
    // draw scale lines
    if(drawScaleLines) {
        const maxRadius = radius.reduce((a, b) => (a + b), 0);
        let distance = 0;
        for(let i = 0; distance < maxRadius; i++) {
            distance += scales[i % scales.length] * scaleStep;
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, distance * unitPixel, 0, 2 * Math.PI);
            ctx.strokeStyle = scaleLineColor;
            ctx.stroke();
        }
    }
    // draw circles
    let center = [canvas.width / 2, canvas.height / 2];
    for (let i = 0; i < radius.length; i++) {
        // draw center
        ctx.beginPath();
        ctx.arc(center[0], center[1], 3, 0, 2 * Math.PI);
        ctx.fillStyle = centerColor;
        ctx.fill();
        // draw circle 
        ctx.beginPath();
        ctx.arc(center[0], center[1], radius[i] * unitPixel, 0, 2 * Math.PI);
        ctx.strokeStyle = circleColor;
        ctx.stroke();
        center[0] += radius[i] * unitPixel * Math.cos(phases[i]);
        center[1] += radius[i] * unitPixel * Math.sin(phases[i]);
    }
    // draw the tip
    ctx.beginPath();
    ctx.arc(center[0], center[1], 5, 0, 2 * Math.PI);
    if(triggered > 0) {
        ctx.fillStyle = tipTriggeredColor;
        triggered -= 1;
    } else {
        ctx.fillStyle = tipColor;
    }
    ctx.fill();
    // draw all triggered notes
    for(let i = 0; i < triggerHistory.length; i++) {
        ctx.beginPath();
        const x = triggerHistory[i][0] * unitPixel + canvas.width / 2;
        const y = triggerHistory[i][1] * unitPixel + canvas.height / 2;
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = tipTriggeredColor;
        ctx.fill();
    }
}

/**
 * Handles all the input events from the controllers, except for the circle data.
 */
function handleInputs() {
    // music
    document.getElementById("scale").addEventListener("change", e => {
        scales = SCALES[e.target.value];
    });
    document.getElementById("base-note").addEventListener("change", e => {
        scaleMin = parseInt(e.target.value);
    });
    document.getElementById("avoid-repeat").addEventListener("change", e => {
        avoidRepeatNote = e.target.checked;
    });

    // mechanism
    document.getElementById("trigger-interval").addEventListener("input", e => {
        triggerInterval = parseFloat(e.target.value);
    });
    document.getElementById("scale-step").addEventListener("input", e => {
        scaleStep = parseFloat(e.target.value);
    });

    // displays
    document.getElementById("unit-pixel").addEventListener("input", e => {
        unitPixel = parseInt(e.target.value);
    });
    document.getElementById("trigger-history").addEventListener("input", e => {
        drawTriggeredHistorySize = parseInt(e.target.value);
    });
    document.getElementById("display-scale-line").addEventListener("change", e => {
        drawScaleLines = e.target.checked;
    });
}

function initCircleList() {
    const circleList = document.getElementById("circle-data");
    circleList.innerHTML = "";
    for(let i = 0; i < radius.length; i++) {
        const parent = document.createElement("li");
        parent.style.display = "block";
        const label = document.createElement("strong");
        label.textContent = "Circle " + (i + 1) + ": ";
        parent.appendChild(label);
        const removeButton = document.createElement("a");
        removeButton.textContent = "[Remove]";
        removeButton.href = "#";
        removeButton.addEventListener("click", e => {
            e.preventDefault();
            removeCircle(i);
        });
        parent.appendChild(removeButton);
        const table = document.createElement("table");
        table.style.width = "100%";

        // label and slider for circle radius
        const radiusLabel = document.createElement("label");
        radiusLabel.textContent = "Radius: ";
        const radiusInput = document.createElement("input");
        radiusInput.type = "range";
        radiusInput.min = 0.1;
        radiusInput.max = 1.0;
        radiusInput.step = 0.02;
        radiusInput.value = radius[i];
        radiusInput.addEventListener("input", e => {
            radius[i] = parseFloat(e.target.value);
        });
        radiusInput.setAttribute("list", "radius-ticks-" + i);
        const radiusTicks = document.createElement("datalist");
        radiusTicks.id = "radius-ticks-" + i;
        radiusTicks.style.display = "none";
        for(let tick = 0.1; tick <= 1.0; tick += 0.2) {
            const option = document.createElement("option");
            option.value = tick;
            radiusTicks.appendChild(option);
        }
        const radiusRow = document.createElement("tr");
        radiusRow.appendChild(wrapElemIn("td", radiusLabel));
        radiusRow.appendChild(wrapElemIn("td", radiusInput));
        table.appendChild(radiusRow);

        // label and slider for circle velocity
        const velocityLabel = document.createElement("label");
        velocityLabel.textContent = "Velocity: ";
        const velocityInput = document.createElement("input");
        velocityInput.type = "range";
        velocityInput.min = -6.0;
        velocityInput.max = 6.0;
        velocityInput.step = 0.1;
        velocityInput.value = velocity[i];
        velocityInput.addEventListener("input", e => {
            velocity[i] = parseFloat(e.target.value);
        });
        velocityInput.setAttribute("list", "velocity-ticks-" + i);
        const velocityTicks = document.createElement("datalist");
        velocityTicks.id = "velocity-ticks-" + i;
        velocityTicks.style.display = "none";
        for(let tick = -6.0; tick <= 6.0; tick += 1.0) {
            const option = document.createElement("option");
            option.value = tick;
            velocityTicks.appendChild(option);
        }
        const velocityRow = document.createElement("tr");
        velocityRow.appendChild(wrapElemIn("td", velocityLabel));
        velocityRow.appendChild(wrapElemIn("td", velocityInput));
        table.appendChild(velocityRow);

        parent.appendChild(table);
        parent.appendChild(radiusTicks);
        parent.appendChild(velocityTicks);
        circleList.appendChild(parent);
    }
    // add the 'add circle' button
    const addButton = document.createElement("a");
    addButton.textContent = "[+] Add Circle";
    addButton.addEventListener("click", e => {
        e.preventDefault();
        addCircle();
    });
    circleList.appendChild(addButton);
}

function removeCircle(index) {
    radius.splice(index, 1);
    velocity.splice(index, 1);
    phases.splice(index, 1);
    initCircleList();
}

function addCircle() {
    radius.push(0.3);
    velocity.push(2.1);
    phases.push(0.0);
    initCircleList();
}