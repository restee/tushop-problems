const { askQuestion, isValidTime, compareTime, sort } = require("./utils");

const isValidNumJobs = (numJobs) => {
  return numJobs >= 1 && numJobs <= 99 && !isNaN(numJobs);
};

// handles the input from the user, validates the input and reasks for the input if it is invalid
const getInput = async () => {
  const jobs = [];
  let numJobs;

  do {
    numJobs = parseInt(await askQuestion("Enter the number of jobs (1-99): "));
    if (!isValidNumJobs(numJobs)) {
      console.log("Invalid input. Please enter a number between 1 and 99.");
    }
  } while (!isValidNumJobs(numJobs));

  for (let jobIndex = 0; jobIndex < numJobs; jobIndex++) {
    console.log(`\nJob ${jobIndex + 1}:`);
    let startTime, endTime;

    do {
      startTime = await askQuestion("Enter start time (HHMM): ");
      if (!isValidTime(startTime)) {
        console.log("Invalid time format. Please use HHMM (0000-2359).");
        continue;
      }

      endTime = await askQuestion("Enter end time (HHMM): ");
      if (!isValidTime(endTime)) {
        console.log("Invalid time format. Please use HHMM (0000-2359).");
        continue;
      }

      if (!compareTime(startTime, endTime)) {
        console.log(
          "Start time must be before end time. Please enter times again."
        );
      }
    } while (
      !isValidTime(startTime) ||
      !isValidTime(endTime) ||
      !compareTime(startTime, endTime)
    );

    const profit = parseFloat(await askQuestion("Enter job profit: "));
    jobs.push({ startTime, endTime, profit });
  }

  return jobs;
};

// Generate random JSON data for testing
const generateRandomJobs = (numJobs) => {
  const jobs = [];
  for (let index = 0; index < numJobs; index++) {
    let startHour, startMinute, endHour, endMinute;

    do {
      startHour = Math.floor(Math.random() * 24);
      startMinute = Math.floor(Math.random() * 60);
      const duration = Math.floor(Math.random() * 180) + 60; // 1 to 4 hours

      endHour = startHour + Math.floor(duration / 60);
      endMinute = startMinute + (duration % 60);

      if (endMinute >= 60) {
        endHour++;
        endMinute -= 60;
      }
      if (endHour >= 24) {
        endHour -= 24;
      }
    } while (
      endHour < startHour ||
      (endHour === startHour && endMinute <= startMinute)
    );

    const startTime = `${startHour.toString().padStart(2, "0")}${startMinute
      .toString()
      .padStart(2, "0")}`;
    const endTime = `${endHour.toString().padStart(2, "0")}${endMinute
      .toString()
      .padStart(2, "0")}`;
    const profit = Math.floor(Math.random() * 1000) + 100; // 100 to 1099

    jobs.push({ startTime, endTime, profit });
  }
  return jobs;
};

// to determine if a job is conflicting with any other job in the list
const isJobConflict = (jobIndex, jobIndices, jobs) => {
  const currentJob = jobs[jobIndex];

  for (const index of jobIndices) {
    const job = jobs[index];

    if (
      (currentJob.startTime >= job.startTime &&
        currentJob.startTime < job.endTime) ||
      (currentJob.endTime > job.startTime &&
        currentJob.endTime <= job.endTime) ||
      (currentJob.startTime <= job.startTime &&
        currentJob.endTime >= job.endTime)
    ) {
      return true;
    }
  }

  return false;
};

// to get the remaining tasks that were not part of the selected jobs, and calculate the profit from the remaining tasks
const getUnusedJobsProfit = (allJobs, maxJobs) => {
  let unusedJobsProfit = 0;
  let unusedJobs = [];
  let isUsed;

  for (let allJobIndex = 0; allJobIndex < allJobs.length; allJobIndex++) {
    isUsed = false;
    for (let maxJobIndex = 0; maxJobIndex < maxJobs.length; maxJobIndex++) {
      if (allJobIndex === maxJobs[maxJobIndex]) {
        isUsed = true;
        break;
      }
    }
    if (!isUsed) {
      unusedJobsProfit = unusedJobsProfit + allJobs[allJobIndex].profit;
      unusedJobs.push(allJobs[allJobIndex]);
    }
  }

  return [unusedJobsProfit, unusedJobs];
};

// can be ignored, just here to test efficiency between the algorithms implemented
let iterations = 0;

// first implementation run of the algorithm, not used in the final version. this version explores all possible paths and calculates the profit for each path, but it is less efficient than the final version
const generatePath = async (path, availableJobs) => {
  //   console.log("Path", JSON.stringify(path));
  const activeIndex = path.active.index;
  //   console.log("Active index", activeIndex);

  // goes through all jobs after the active job, also serves as the recursion termination condition if the active job is the last job or if there is no longer a nonconflicting job remaining
  for (
    let currentIndexProcessed = activeIndex + 1;
    currentIndexProcessed < availableJobs.length;
    currentIndexProcessed++
  ) {
    const job = availableJobs[currentIndexProcessed];
    if (
      !isJobConflict(currentIndexProcessed, path.active.jobs, availableJobs)
    ) {
      const newProfit = path.active.profit + job.profit;
      iterations++;
      const endPath = await generatePath(
        {
          ...path,
          active: {
            jobs: [...path.active.jobs, currentIndexProcessed],
            profit: newProfit,
            index: currentIndexProcessed,
          },
        },
        availableJobs
      );
      path.max = endPath.max;
    }
  }

  if (path.active.profit > path.max.profit) {
    path.max = {
      jobs: path.active.jobs,
      profit: path.active.profit,
    };
  }
  return path;
};

// final version of the algorithm, this version of the algorithm uses the potential profit to reduce the number of iterations by skipping over jobs that are not part of the optimal solution
const generatePaths2 = async (path, availableJobs) => {
  //   console.log("Path", JSON.stringify(path));
  const activeIndex = path.active.index;
  //   console.log("Active index", activeIndex);

  let potentialProfit = path.active.potentialProfit;

  // goes through all jobs after the active job, also serves as the recursion termination condition if the active job is the last job or if there is no longer a nonconflicting job remaining
  for (
    let currentIndexProcessed = activeIndex + 1;
    currentIndexProcessed < availableJobs.length;
    currentIndexProcessed++
  ) {
    const job = availableJobs[currentIndexProcessed];

    // checks the remaining potential profit to see if it is greater than the current max profit, if it is not, it skips the job
    const remainingPotentialMaxProfit =
      path.active.profit + path.active.potentialProfit;
    if (
      !isJobConflict(currentIndexProcessed, path.active.jobs, availableJobs) &&
      remainingPotentialMaxProfit > path.max.profit
    ) {
      iterations++;
      const newProfit = path.active.profit + job.profit;
      // recursively calls the function to explore the next job, updates the jobs list with the current job and the profit
      const endPath = await generatePaths2(
        {
          ...path,
          active: {
            jobs: [...path.active.jobs, currentIndexProcessed],
            profit: newProfit,
            index: currentIndexProcessed,
            potentialProfit: potentialProfit - job.profit,
          },
        },
        availableJobs
      );
      path.max = endPath.max;
    }

    potentialProfit -= job.profit;
  }

  if (path.active.profit > path.max.profit) {
    path.max = {
      jobs: path.active.jobs,
      profit: path.active.profit,
    };
  }
  return path;
};

const start = async () => {
  // Generate and log random job data for testing
  //   const jobs = generateRandomJobs(30); // Generate random jobs
  //   console.log("\nRandom job data for testing:");
  //   console.log(JSON.stringify(jobs, null, 2));

  const jobs = await getInput();

  // calculates the total profit of all jobs to be used by the algorithm to determine if paths are worth exploring further
  let totalProfit = 0;
  for (let index = 0; index < jobs.length; index++) {
    totalProfit += jobs[index].profit;
  }

  // sorting data by descending order further improves the performance of the algorithm. combined with the usage of the potential profit, the algorithm is able to skip over more jobs and reduce the number of iterations
  const sortedJobs = sort(jobs, (a, b) => b.profit - a.profit);

  let path2 = await generatePaths2(
    {
      active: {
        jobs: [],
        profit: 0,
        index: -1,
        unusedJobs: [],
        potentialProfit: totalProfit,
      },
      max: { profit: 0 },
    },
    sortedJobs
  );

  const [unusedJobsProfit, unusedJobs] = getUnusedJobsProfit(
    sortedJobs,
    path2.max.jobs
  );
  console.log("\nThe number of tasks and earnings available for others");
  console.log("Tasks: ", unusedJobs.length);
  console.log("Earnings: ", unusedJobsProfit);

  //   console.log("Max jobs", path2?.max);

  //   console.table(
  //     path2.max.jobs.map((jobIndex) => {
  //       const job = jobs[jobIndex];
  //       return {
  //         "Start Time": job.startTime,
  //         "End Time": job.endTime,
  //         Profit: job.profit,
  //       };
  //     })
  //   );

  //   console.log("Max Profit: ", path2.max.profit);
  //   console.log("Iterations: ", iterations, "\n\n");

  // end the program
  process.exit(0);
};

start();
