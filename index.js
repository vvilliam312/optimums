const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const visitorsCounter = require("./visitorCounter");
const app = express();
const requestIp = require("request-ip");
const port = 3000;
const db = new sqlite3.Database("Sqlite.db");

const Upd = require("./updater");
const updater = new Upd(db);

//app.enable("trust proxy");

app.get("/mat/visits", async (req, res) => {
  visitorsCounter.visit("visitsPage");
  res.json(visitorsCounter.visitData());
});

app.get("/mat/ip", async (req, res) => {
  visitorsCounter.visit("ipPage");
  const clientIp = requestIp.getClientIp(req);
  console.log(clientIp);
  res.send(clientIp);
});

app.get("/mat/api/optima/vote", (req, res) => {
  visitorsCounter.visit("voteAPI");
  const timeNow = new Date();
  const dateToday = new Date(
    timeNow.getFullYear(),
    timeNow.getMonth(),
    timeNow.getDate(),
    0,
    0,
    0,
    0
  ).getTime();

  const getOpinion = day => {
    return new Promise((resolve, reject) => {
      let totalVotes = 0;
      let opinion = 0;
      let up = 0;
      db.all(
        `SELECT vote, ip FROM FoodVoteOptima WHERE date = "${
          day ? day : dateToday
        }"`,
        (err, rows) => {
          console.log(rows);
          const ip = requestIp.getClientIp(req);
          let haveVoted = false;
          rows.forEach(i => {
            if (i.ip == ip) haveVoted = true;
            if (i.vote == -1) {
              opinion--;
            } else {
              opinion++;
              up++;
            }
            totalVotes++;
          });
          const percent = Math.round((up / rows.length) * 100);
          console.log(up);
          resolve({ opinion, percent, haveVoted, totalVotes });
        }
      );
    });
  };
  console.log(req.header("day"));
  if (!(req.header("day") == "undefined" || req.header("day") == null))
    return getOpinion(req.header("day")).then(op => {
      res.json({
        counted: false,
        opinionNow: op,
        error: "Not today"
      });
    });

  console.log(timeNow.getHours());
  if (timeNow.getHours() > 9 && timeNow.getHours() < 13) {
    if (req.header("vote")) {
      visitorsCounter.visit("voted");
      addToDb("FoodVoteOptima", [
        null,
        dateToday,
        req.header("vote") === "-1" ? -1 : 1,
        requestIp.getClientIp(req)
      ])
        .then(async () => {
          res.json({ counted: true, opinionNow: await getOpinion() });
        })
        .catch(async err => {
          res.json({
            counted: false,
            opinionNow: await getOpinion(),
            error: err
          });
        });
    } else {
      getOpinion().then(op =>
        res.json({
          counted: false,
          opinionNow: op,
          error: "No vote header"
        })
      );
    }
  } else {
    getOpinion().then(op =>
      res.json({
        counted: false,
        opinionNow: op,
        error: "Voting closed!"
      })
    );
  }
});

app.get("/mat/api/optima", (req, res) => {
  visitorsCounter.visit("listAPI");
  const from = req.header("from");
  const to = req.header("to");
  let where = "";
  console.log(from, to);
  if (from != null && to != null) {
    where = ` WHERE dateInt BETWEEN ${new Date(from).getTime()} AND ${new Date(
      to
    ).getTime()}`;
  }
  console.log("SELECT date,sv,fi FROM FoodListOptima" + where);
  db.all("SELECT date,sv,fi FROM FoodListOptima" + where, function(err, rows) {
    res.json(rows);
  });
});
app.use("/mat", express.static("optima"));
app.listen(port, () => console.log(`Optimums listening on port ${port}!`));

setInterval(() => updater.update(), 3600000);
updater.update();

function addToDb(table, addArray) {
  return new Promise((resolve, reject) => {
    let lastId;

    let j = "";

    for (let i = 0; i < addArray.length; i++) {
      if (i != 0) j += ", ";

      j += "?";
    }

    console.log(addArray);

    console.log(`INSERT INTO ${table} VALUES (${j})`);

    try {
      const stmt = db.prepare(`INSERT INTO ${table} VALUES (${j})`);

      stmt.run(addArray, function(err) {
        if (err) console.log(err);

        lastId = this.lastID;

        if (lastId == null) return reject("Ip Already Voted");

        resolve(lastId);
      });
    } catch (err) {
      reject(err);
    }
  });
}
