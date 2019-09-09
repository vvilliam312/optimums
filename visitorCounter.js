const fs = require("fs");

const fileName = "stats/current.json";

let visitsData = {};
try {
  visitsData = JSON.parse(fs.readFileSync(fileName, "utf8"));
} catch (error) {
  console.log(error);
}

process.stdin.resume(); //so the program will not close instantly

setInterval(() => {
  saveVisits();
}, 3600000);

function exitHandler(options, exitCode) {
  saveVisits();
  if (options.cleanup) console.log("clean");
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) process.exit();
}

function saveVisits() {
  const json = visitDataJSON();
  if (json.length < 10000) {
    fs.writeFileSync(fileName, json);
  } else {
    visitsData = {};
    fs.writeFileSync("stats/" + dhString(true) + ".json", json);
  }
}

//do something when app is closing
process.on("exit", exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

function visit(section) {
  const dStr = dhString();
  if (visitsData[dStr] == null) visitsData[dStr] = {};
  if (visitsData[dStr][section] == null) visitsData[dStr][section] = 0;
  visitsData[dStr][section]++;
}

function dhString(slim = false) {
  const d = new Date();
  if (!slim)
    return `H${d.getHours()} - ${d.getDate()}.${d.getMonth()}.${d.getFullYear()}`;
  return `H${d.getHours()}D${d.getDate()}M${d.getMonth()}Y${d.getFullYear()}`;
}

function visitDataJSON() {
  return JSON.stringify(visitsData);
}

function visitData() {
  return visitsData;
}

module.exports = { visit, visitDataJSON, visitData };
