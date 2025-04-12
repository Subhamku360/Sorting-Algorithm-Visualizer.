'use strict';

const visualizationArea = document.getElementById('visualization-area');
const algorithmSelect = document.getElementById('algorithm');
const speedSlider = document.getElementById('speed');
const sizeSlider = document.getElementById('size');
const generateButton = document.getElementById('generate');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');

let array = [];
let delay = 100; // Initial delay in ms
let arraySize = 20; // Initial array size set to 20
let sortingInProgress = false;
let stopSortingFlag = false; // Flag to signal sorting functions to stop
let domElements = []; // Array to store references to the DOM elements

// --- Utility Functions ---

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function generateRandomArray(size) {
    const arr = [];
    for (let i = 0; i < size; i++) {
        arr.push(Math.floor(Math.random() * 96) + 5); // e.g., numbers 5-100
        // Or use a smaller range for readability?
        // arr.push(Math.floor(Math.random() * 50) + 1); // e.g., numbers 1-50
    }
    return arr;
}

function renderArray(arr = array, highlightIndices = {}, state = '') {
    visualizationArea.innerHTML = ''; // Clear previous boxes
    domElements = []; // Clear the references array

    arr.forEach((value, index) => {
        const bar = document.createElement('div');
        bar.classList.add('bar');
        bar.textContent = value;
        bar.dataset.value = value; // Store value in data attribute if needed later
        bar.dataset.id = `bar-${index}`; // Unique ID might be useful

        // Apply highlighting based on state
        if (highlightIndices.comparing?.includes(index)) {
            bar.classList.add('comparing');
        }
        if (highlightIndices.swapping?.includes(index)) {
            bar.classList.add('swapping');
        }
        if (highlightIndices.sorted?.includes(index)) {
            bar.classList.add('sorted');
        }
        // Special case for final render
        if (state === 'sorted' && !highlightIndices.sorted?.includes(index)) {
             bar.classList.add('sorted');
        }

        visualizationArea.appendChild(bar);
        domElements.push(bar); // Store the reference
    });
}

function updateDelay() {
    const maxDelay = 500;
    const minDelay = 5;
    // Inverse relationship: higher speed value -> lower delay
    delay = Math.floor(maxDelay - ((speedSlider.value - 1) / 99) * (maxDelay - minDelay));
}

function updateArraySize() {
    arraySize = parseInt(sizeSlider.value);
    generateAndRenderArray();
}

async function generateAndRenderArray() {
    if (sortingInProgress) {
        console.log("Cannot generate new array while sorting is in progress.");
        sizeSlider.value = array.length; // Reset slider to current size
        return;
    }
    stopSortingFlag = true; // Signal any ongoing sort to stop
    await sleep(delay > 0 ? delay * 2 : 50); // Give time for stop signal processing
    stopSortingFlag = false; // Reset flag

    array = generateRandomArray(arraySize);
    renderArray();
    enableControls(); // Ensure controls are enabled after generation
}

function disableControls() {
    algorithmSelect.disabled = true;
    speedSlider.disabled = true;
    sizeSlider.disabled = true;
    generateButton.disabled = true;
    startButton.disabled = true;
    // Hide Start/Generate, show Stop
    startButton.classList.add('hidden');
    generateButton.classList.add('hidden');
    stopButton.classList.remove('hidden');
    stopButton.disabled = false; // Ensure stop button is clickable
    // startButton.textContent = "Sorting..."; // No longer needed as button is hidden
}

function enableControls() {
    algorithmSelect.disabled = false;
    speedSlider.disabled = false;
    sizeSlider.disabled = false;
    generateButton.disabled = false;
    startButton.disabled = false;
    // Show Start/Generate, hide Stop
    startButton.classList.remove('hidden');
    generateButton.classList.remove('hidden');
    stopButton.classList.add('hidden');
    stopButton.disabled = true; // Disable stop button when not sorting
    // startButton.textContent = "Start Sorting"; // No longer needed as text doesn't change
    sortingInProgress = false; // Ensure this is reset
}

// --- Event Listeners ---

generateButton.addEventListener('click', generateAndRenderArray);
speedSlider.addEventListener('input', updateDelay);
sizeSlider.addEventListener('input', updateArraySize);
startButton.addEventListener('click', () => {
    console.log("Start button clicked!");
    startSorting();
});
stopButton.addEventListener('click', () => {
    console.log("Stop button clicked!");
    stopSortingFlag = true; // Set the flag to stop the sorting loop
    // Optionally disable the stop button immediately after click
    stopButton.disabled = true;
    // enableControls() will be called by the finally block in startSorting
});
window.addEventListener('resize', () => {
    // Re-render only if not sorting, otherwise it interferes
    if (!sortingInProgress) {
        renderArray();
    }
});

// --- Initialization ---

updateDelay(); // Set initial delay based on slider
updateArraySize(); // Set initial size and generate/render array

// --- Sorting Algorithm Logic ---

async function startSorting() {
    console.log("startSorting function entered."); // Log function entry
    if (sortingInProgress) {
        console.log("Sorting already in progress, returning.");
        return;
    }

    sortingInProgress = true;
    stopSortingFlag = false;
    console.log("Controls disabling...");
    disableControls();

    const selectedAlgorithm = algorithmSelect.value;
    console.log(`Attempting to start: ${selectedAlgorithm}`); // Log selected algorithm

    try {
        switch (selectedAlgorithm) {
            case 'bubbleSort':
                console.log("Calling bubbleSort...");
                await bubbleSort();
                break;
            case 'selectionSort':
                console.log("Calling selectionSort...");
                await selectionSort();
                break;
            case 'insertionSort':
                console.log("Calling insertionSort...");
                await insertionSort();
                break;
            case 'mergeSort':
                console.log("Calling mergeSortWrapper...");
                await mergeSortWrapper();
                break;
            case 'quickSort':
                console.log("Calling quickSortWrapper...");
                await quickSortWrapper();
                break;
            default:
                console.error("Unknown algorithm selected in switch");
                // enableControls(); // Already handled in finally
                return; // Exit early
        }
        console.log(`${selectedAlgorithm} function finished.`); // Log successful completion

        // Check flag *after* the sort function finishes
        if (!stopSortingFlag) {
           renderArray(array, {}, 'sorted');
           console.log("Sorting completed!");
        } else {
            console.log("Sorting stopped.");
            renderArray(); // Render final state after stop
        }

    } catch (error) {
        if (error.message === 'Sorting stopped') {
            console.log("Sorting process stopped by user.");
            renderArray(); // Render the array in its current state when stopped
        } else {
            console.error("An error occurred during sorting:", error);
        }
    } finally {
        // Ensure controls are always re-enabled and flags reset
        stopSortingFlag = false;
        sortingInProgress = false;
        enableControls();
    }
}

// Utility to check for stop signal and pause
async function checkForStop() {
    if (stopSortingFlag) {
        throw new Error('Sorting stopped');
    }
    // Only sleep if delay is greater than 0
    if (delay > 0) {
        await sleep(delay);
    }
}

// --- Sorting Algorithms ---

async function bubbleSort() {
    console.log("bubbleSort started");
    const n = array.length;
    let swapped;
    let pass = 0;
    do {
        swapped = false;
        for (let i = 0; i < n - 1 - pass; i++) {
            await checkForStop();
            // Highlight comparison without swapping class
            renderArray(array, { comparing: [i, i + 1], sorted: Array.from({length: pass}, (_, k) => n - 1 - k) });
            await sleep(delay);

            if (array[i] > array[i + 1]) {
                await checkForStop();
                // Perform the visual swap
                await visualSwap(i, i + 1);
                swapped = true;
                // visualSwap handles the delay and internal array swap
                // Re-render to ensure correct state after swap (e.g., comparison colors)
                renderArray(array, { comparing: [i, i + 1], sorted: Array.from({length: pass}, (_, k) => n - 1 - k) });
                await sleep(delay/2); // Shorter delay after swap animation completes
            }
            // Render normal state after comparison/swap before next iteration
            // renderArray clears transforms implicitly
             await checkForStop();
             renderArray(array, { sorted: Array.from({length: pass}, (_, k) => n - 1 - k) });
        }
        pass++;
        // Mark the last element of the pass as sorted visually
        renderArray(array, { sorted: Array.from({length: pass}, (_, k) => n - 1 - k) });
        await sleep(delay);

    } while (swapped);
}

async function selectionSort() {
    console.log("selectionSort started");
    const n = array.length;
    const sortedIndices = [];

    for (let i = 0; i < n - 1; i++) {
        let minIndex = i;
        renderArray(array, { comparing: [minIndex], sorted: [...sortedIndices] });
        await checkForStop();

        for (let j = i + 1; j < n; j++) {
            renderArray(array, { comparing: [minIndex, j], sorted: [...sortedIndices] });
            await checkForStop();

            if (array[j] < array[minIndex]) {
                const oldMinIndex = minIndex;
                minIndex = j;
                renderArray(array, { comparing: [minIndex], sorted: [...sortedIndices] });
                await sleep(delay / 2);
             }
             renderArray(array, { comparing: [minIndex], sorted: [...sortedIndices] });
             await sleep(delay / 4);
        }

        if (minIndex !== i) {
            await checkForStop();
            // Perform visual swap
            await visualSwap(i, minIndex);
            // visualSwap handles delay and internal array update
            // Re-render to clear comparison highlights correctly
            renderArray(array, { sorted: [...sortedIndices, i] }); // Add i here as it's now sorted
            await sleep(delay/2); // Short delay after swap animation completes
        }

        // Mark index i as sorted
        if (!sortedIndices.includes(i)) sortedIndices.push(i);
        await checkForStop();
        renderArray(array, { sorted: [...sortedIndices] });
        await sleep(delay);
    }
}

async function insertionSort() {
    console.log("insertionSort started"); // Log entry
    const n = array.length;
    // Keep track of the index up to which the array is sorted
    let sortedUpto = 0;

    renderArray(array, { sorted: [0] }); // Mark first element as initially sorted
    await sleep(delay);

    for (let i = 1; i < n; i++) {
        await checkForStop();
        let currentVal = array[i];
        let j = i - 1;

        // Highlight the element being inserted
        renderArray(array, { comparing: [i], sorted: Array.from({length: i}, (_, k) => k) });
        await sleep(delay);

        // Shift elements greater than currentVal to the right
        while (j >= 0 && array[j] > currentVal) {
            await checkForStop();
            // Highlight comparison and the element being shifted
            renderArray(array, { comparing: [j], swapping: [j + 1], sorted: Array.from({length: i}, (_, k) => k) });
            await sleep(delay);

            array[j + 1] = array[j];

            await checkForStop();
            // Show the result of the shift
            renderArray(array, { comparing: [j], swapping: [j + 1], sorted: Array.from({length: i}, (_, k) => k) });
            await sleep(delay);

            // Render normally before next comparison/shift
            renderArray(array, { comparing: [j], sorted: Array.from({length: i}, (_, k) => k) });
            await sleep(delay / 2);
            j--;
        }

        // Insert the currentVal into its correct position (j + 1)
        array[j + 1] = currentVal;
        sortedUpto = i; // Update the sorted range index

        await checkForStop();
        // Highlight the final position of the inserted element
        renderArray(array, { swapping: [j + 1], sorted: Array.from({length: sortedUpto + 1}, (_, k) => k) });
        await sleep(delay);

        await checkForStop();
        // Render the array with the updated sorted section
        renderArray(array, { sorted: Array.from({length: sortedUpto + 1}, (_, k) => k) });
        await sleep(delay);
    }
}

// --- Merge Sort Implementation ---
async function mergeSortWrapper() {
    console.log("mergeSortWrapper started"); // Log entry
    // We use indices to define subarrays within the main 'array'
    await mergeSortRecursive(0, array.length - 1);
}

async function mergeSortRecursive(left, right) {
    if (left >= right) {
        // Base case: Subarray with 0 or 1 element is sorted
        // Optionally highlight the single element as sorted briefly
        if (left === right) {
             renderArray(array, { sorted: [left] });
             await sleep(delay / 2);
        }
        return;
    }

    const mid = Math.floor(left + (right - left) / 2);

    // Recursively sort the left and right halves
    await mergeSortRecursive(left, mid);
    await checkForStop(); // Check for stop signal between recursive calls
    await mergeSortRecursive(mid + 1, right);
    await checkForStop();

    // Merge the two sorted halves
    await merge(left, mid, right);
}

async function merge(left, mid, right) {
    const leftArrSize = mid - left + 1;
    const rightArrSize = right - mid;

    // Create temporary arrays to hold the values of the two halves
    const leftArr = new Array(leftArrSize);
    const rightArr = new Array(rightArrSize);

    // Copy data from the main array to temporary arrays
    // Highlight the ranges being copied
    const rangeToCopy = Array.from({length: right - left + 1}, (_, i) => left + i);
    renderArray(array, { comparing: rangeToCopy });
    await sleep(delay);
    for (let i = 0; i < leftArrSize; i++) {
        leftArr[i] = array[left + i];
    }
    for (let j = 0; j < rightArrSize; j++) {
        rightArr[j] = array[mid + 1 + j];
    }
    await checkForStop();


    let i = 0; // Index for leftArr
    let j = 0; // Index for rightArr
    let k = left; // Index for the main array (starting from left boundary)

    // Merge the temp arrays back into the main array[left..right]
    while (i < leftArrSize && j < rightArrSize) {
        await checkForStop();
        // Highlight elements being compared (original indices)
        renderArray(array, { comparing: [left + i, mid + 1 + j] });
        await sleep(delay);

        if (leftArr[i] <= rightArr[j]) {
            // Highlight the target position in the main array where the value is placed
            renderArray(array, { comparing: [left + i, mid + 1 + j], swapping: [k] });
            array[k] = leftArr[i];
            await sleep(delay);
            i++;
        } else {
             // Highlight the target position in the main array where the value is placed
            renderArray(array, { comparing: [left + i, mid + 1 + j], swapping: [k] });
            array[k] = rightArr[j];
            await sleep(delay);
            j++;
        }
        // Show the array with the element placed at index k
        renderArray(array, { comparing: [k]}); // Briefly highlight the placed element
        await sleep(delay / 2);
        k++;
    }

    // Copy remaining elements of leftArr, if any
    while (i < leftArrSize) {
        await checkForStop();
        renderArray(array, { swapping: [k], comparing: [left + i] }); // Show source and destination
        array[k] = leftArr[i];
        await sleep(delay);
        renderArray(array, { comparing: [k] }); // Briefly highlight placement
        await sleep(delay / 2);
        i++;
        k++;
    }

    // Copy remaining elements of rightArr, if any
    while (j < rightArrSize) {
        await checkForStop();
        renderArray(array, { swapping: [k], comparing: [mid + 1 + j] }); // Show source and destination
        array[k] = rightArr[j];
        await sleep(delay);
        renderArray(array, { comparing: [k] }); // Briefly highlight placement
        await sleep(delay / 2);
        j++;
        k++;
    }

    // Optional: Highlight the entire merged range as sorted
    const mergedRange = Array.from({length: right - left + 1}, (_, idx) => left + idx);
    renderArray(array, { sorted: mergedRange });
    await sleep(delay);
}
// --- End Merge Sort ---

// --- Quick Sort Implementation ---
async function quickSortWrapper() {
    console.log("quickSortWrapper started"); // Log entry
    // Keep track of sorted elements globally for visualization
    let sortedIndices = [];
    await quickSortRecursive(0, array.length - 1, sortedIndices);
}

async function quickSortRecursive(low, high, sortedIndices) {
    if (low < high) {
        await checkForStop();
        // pi is the partitioning index, array[pi] is now at the right place
        const pi = await partition(low, high, sortedIndices);

        // Mark the pivot as sorted *after* partitioning
        sortedIndices.push(pi);
        renderArray(array, { sorted: [...sortedIndices]});
        await sleep(delay);

        await checkForStop();
        // Recursively sort elements before partition and after partition
        await quickSortRecursive(low, pi - 1, sortedIndices);
        await checkForStop();
        await quickSortRecursive(pi + 1, high, sortedIndices);
    } else if (low === high) {
        // Base case: single element is trivially sorted
        if (!sortedIndices.includes(low)) {
            sortedIndices.push(low);
            renderArray(array, { sorted: [...sortedIndices]});
            await sleep(delay / 2);
        }
    }
}

// Lomuto partition scheme
async function partition(low, high, sortedIndices) {
    await checkForStop();
    const pivotValue = array[high];
    let i = low - 1;
    renderArray(array, { comparing: [high], sorted: [...sortedIndices] });
    await sleep(delay);

    for (let j = low; j < high; j++) {
        await checkForStop();
        renderArray(array, { comparing: [j, high], sorted: [...sortedIndices] });
        await sleep(delay);

        if (array[j] < pivotValue) {
            i++;
            await checkForStop();
            // Perform visual swap
            await visualSwap(i, j);
            // Re-render to update comparison colors
            renderArray(array, { comparing: [j, high], sorted: [...sortedIndices] });
            await sleep(delay/2);
        }
         renderArray(array, { comparing: [high], sorted: [...sortedIndices] });
         await sleep(delay / 2);
    }

    // Swap the pivot element to its final place
    const pivotIndex = i + 1;
    await checkForStop();
    await visualSwap(pivotIndex, high);
    // Re-render to clear highlights
    renderArray(array, { sorted: [...sortedIndices, pivotIndex] }); // Pivot is now sorted
    await sleep(delay/2);

    return pivotIndex;
}
// --- End Quick Sort ---

// Helper function for visual swap animation
async function visualSwap(index1, index2) {
    if (index1 === index2) return; // No swap needed

    const element1 = domElements[index1];
    const element2 = domElements[index2];

    if (!element1 || !element2) {
        console.error("Cannot find elements for visual swap:", index1, index2);
        return;
    }

    // Calculate distance to move
    const rect1 = element1.getBoundingClientRect();
    const rect2 = element2.getBoundingClientRect();
    const distance = rect2.left - rect1.left;

    // Apply translation
    element1.style.transform = `translateX(${distance}px)`;
    element2.style.transform = `translateX(${-distance}px)`;

    // Add swapping class for color change during transition
    element1.classList.add('swapping');
    element2.classList.add('swapping');

    // Wait for the transition to complete (should match CSS transition duration)
    await sleep(delay > 0 ? Math.max(50, delay) : 50); // Use animation delay, ensure minimum for visibility

    // --- IMPORTANT PART: Update backend and frontend state AFTER animation ---

    // 1. Swap in the underlying array
    [array[index1], array[index2]] = [array[index2], array[index1]];

    // 2. Swap the DOM element references in our tracking array
    [domElements[index1], domElements[index2]] = [domElements[index2], domElements[index1]];

    // 3. Reset transforms and remove swapping class
    // We will re-render shortly after in the main sort function, which handles this cleanup.
    // However, to avoid glitches IF re-render is delayed, reset styles here:
    element1.style.transform = '';
    element2.style.transform = '';
    element1.classList.remove('swapping');
    element2.classList.remove('swapping');

    // 4. Re-render the specific elements or the whole array to reflect the number change and correct order/styles
    // The calling sort function should ideally call renderArray after this to update colors/text
    // For now, let's update text content directly as a fallback
    element1.textContent = array[index1];
    element2.textContent = array[index2];
}
