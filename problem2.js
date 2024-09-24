const { sort, readDataFromFile, writeDataToFile } = require("./utils");

// processes the data fromt he file and returns the number of employees and the products array
const getDataFromFile = async (filePath) => {
  const data = await readDataFromFile(filePath);
  const lines = data.split("\n");
  let numOfEmployees = 0;
  const products = [];

  for (const line of lines) {
    if (line.startsWith("Number of employees:")) {
      numOfEmployees = parseInt(line.split(":")[1].trim());
    } else if (line.includes(":") && !line.startsWith("Goodies and Prices:")) {
      const [name, price] = line.split(":");
      products.push({ name: name.trim(), price: parseInt(price.trim()) });
    }
  }

  return { numOfEmployees, products };
};

// finds the minimum price difference between the highest and lowest priced products for the given number of employees, sorts the products by price and finds the minimum difference
const findMinPriceDifference = (products, numOfProducts) => {
  // sort the product first so that we can just go through the array once and find the minimum difference
  const sortedProducts = sort(products, (a, b) => a.price < b.price);

  let leastPriceDifference = { amount: Infinity, lastItemIndex: 0 };

  // go through the array, calculate the price difference between the last and first item, if it is less than the current least price difference, update the least price difference object with the amount and the last item index
  for (
    let lastItemIndex = numOfProducts - 1;
    lastItemIndex < products.length;
    lastItemIndex++
  ) {
    const firstItemIndex = lastItemIndex - numOfProducts + 1;
    let priceDifference =
      sortedProducts[lastItemIndex].price -
      sortedProducts[firstItemIndex].price;
    if (priceDifference < leastPriceDifference.amount) {
      leastPriceDifference.amount = priceDifference;
      leastPriceDifference.lastItemIndex = lastItemIndex;
    }
  }

  const leastPriceDifferenceProducts = [];

  // get the products that are part of the minimum price difference and push them into the leastPriceDifferenceProducts array for the return value
  for (
    let index = leastPriceDifference.lastItemIndex + 1 - numOfProducts;
    index < leastPriceDifference.lastItemIndex + 1;
    index++
  ) {
    leastPriceDifferenceProducts.push(sortedProducts[index]);
  }

  return leastPriceDifferenceProducts;
};

const start = async (sourceFile) => {
  const { numOfEmployees, products } = await getDataFromFile(sourceFile);

  console.log("Number of employees:", numOfEmployees);
  console.log("Goodies and Prices:");
  console.log("Name                Price");
  products.forEach(({ name, price }) => {
    console.log(`${name.padEnd(20, " ")}${price}`);
  });

  const productsSelected = findMinPriceDifference(products, numOfEmployees);

  let dataToWrite = "The goodies selected for distribution are:\n";
  productsSelected.forEach(({ name, price }) => {
    dataToWrite += `${name}: ${price}\n`;
  });
  dataToWrite += `And the difference between the chosen goodie with highest price and the lowest price is ${
    productsSelected[productsSelected.length - 1].price -
    productsSelected[0].price
  }\n`;

  console.log("-".repeat(40));
  console.log(dataToWrite);

  const outputFile = sourceFile.replace("./", "").split(".")[0] + "-output.txt";

  await writeDataToFile(outputFile, dataToWrite);

  // end the program
  process.exit(0);
};

// get the source file from the command line arguments, if no arguments are provided, use the default file "./goodies.txt"
const args = process.argv.slice(2);
const sourceFile = args[0] || "./goodies.txt";

start(sourceFile);
