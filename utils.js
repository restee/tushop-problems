const readline = require("readline");
const fs = require("fs").promises;

const readLine = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// reads the data from the file and returns the data as a string
const readDataFromFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf8");

    return data;
  } catch (error) {
    console.error("Error reading file:", error);
  }
};

// writes the data to the file
const writeDataToFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, data, "utf8");
    console.log(`Data successfully written to ${filePath}`);
  } catch (error) {
    console.error("Error writing to file:", error);
  }
};

// asks the user for input and returns the input as a promise
const askQuestion = (query) => {
  return new Promise((resolve) => readLine.question(query, resolve));
};

// compares the start and end time to see if the start time is before the end time
const compareTime = (start, end) => {
  return parseInt(start) < parseInt(end);
};

// validates the time input to ensure it is in the correct format
const isValidTime = (time) => {
  const hours = parseInt(time.slice(0, 2));
  const minutes = parseInt(time.slice(2));
  return (
    time.length === 4 &&
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59
  );
};

// would normally just use array.sort but following the instructions, just implemented a simple merge sort for sorting without using any built-in functions
const mergeSort = (array, compareFn) => {
  if (array.length <= 1) {
    return array;
  }

  const middle = Math.floor(array.length / 2);
  const left = [];
  const right = [];

  for (let i = 0; i < middle; i++) {
    left[i] = array[i];
  }

  for (let i = middle; i < array.length; i++) {
    right[i - middle] = array[i];
  }

  return merge(
    mergeSort(left, compareFn),
    mergeSort(right, compareFn),
    compareFn
  );
};

const merge = (left, right, compareFn) => {
  const result = [];
  let leftIndex = 0;
  let rightIndex = 0;
  let resultIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    if (compareFn(left[leftIndex], right[rightIndex])) {
      result[resultIndex] = left[leftIndex];
      leftIndex++;
    } else {
      result[resultIndex] = right[rightIndex];
      rightIndex++;
    }
    resultIndex++;
  }

  while (leftIndex < left.length) {
    result[resultIndex] = left[leftIndex];
    leftIndex++;
    resultIndex++;
  }

  while (rightIndex < right.length) {
    result[resultIndex] = right[rightIndex];
    rightIndex++;
    resultIndex++;
  }

  return result;
};

module.exports = {
  askQuestion,
  compareTime,
  isValidTime,
  sort: mergeSort,
  readDataFromFile,
  writeDataToFile,
};
