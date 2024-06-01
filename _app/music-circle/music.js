// parameters
const radius = [1.0, 0.3, 0.6, 0.2, 0.3];
const velocity = [1.0, 2.1, 3.2, 5.5, 6.9];
var triggerInterval = 0.6;
var scaleMin = 50;
var scaleStep = 0.04;
var scales = SCALES["major"];
var avoidRepeatNote = true;

// variables
const phases = [0.0, 0.0, 0.0, 0.0, 0.0];
let tip = [0.0, 0.0];
let cumulateLength = 0.0;
let triggered = 0;
let lastTriggeredId = -1;
let triggerHistory = [];

function trigger(x, y, instrument) {
    const distance = Math.hypot(x, y);
    // set trigger animation cooldown
    triggered = triggerCooldown;
    // console.log("triggered");
    // enumerate the note number of the triggered distance
    let lastNoteId = -1;
    let lastDist = -1;
    let lastIndex = -1;
    let noteId = scaleMin;
    let dist = 0;
    let index = 0;
    for(; dist < distance; index++) {
        lastNoteId = noteId;
        lastDist = dist;
        lastIndex = index;
        noteId += scales[index % scales.length];
        dist += scales[index % scales.length] * scaleStep;
    }
    // select the nearest note
    if(distance - lastDist < dist - distance) {
        noteId = lastNoteId;
        index = lastIndex;
    }
    // avoid repetition of the same note
    if(avoidRepeatNote && noteId == lastTriggeredId) {
        noteId += scales[index % scales.length];
    }
    // play note
    instrument.play(noteId);
    // write back to the history
    lastTriggeredId = noteId;
    triggerHistory.push([x, y]);
    while(triggerHistory.length > drawTriggeredHistorySize) {
        triggerHistory.shift();
    }
}

function advance(dt, instrument) {
    for (let i = 0; i < radius.length; i++) {
        phases[i] += velocity[i] * dt;
    }
    let newTip = [0.0, 0.0];
    for (let i = 0; i < radius.length; i++) {
        newTip[0] += radius[i] * Math.cos(phases[i]);
        newTip[1] += radius[i] * Math.sin(phases[i]);
    }
    let length = Math.hypot(newTip[0] - tip[0], newTip[1] - tip[1]);
    cumulateLength += length;
    tip = newTip;
    if (cumulateLength >= triggerInterval) {
        trigger(tip[0], tip[1], instrument);
        cumulateLength -= triggerInterval;
    }
}