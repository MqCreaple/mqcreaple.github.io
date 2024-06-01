function noteIdToFreq(noteId) {
    return 440 * Math.pow(2, (noteId - 69) / 12)
}