const fetch = require("node-fetch");

const parse = require("node-html-parser").parse;

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

module.exports = class {
  constructor(db) {
    this.db = db;
  }

  update() {
    console.log("Started Update");

    setTimeout(() => {
      this.getData();
    }, 100);
  }

  getData() {
    console.log("Started Update On Food");

    fetch(
      "https://www.optimaedu.fi/svenska/for-studerande/studieguiden/lunchmeny-/-lounasmenu.html",
      {
        method: "get"
      }
    )
      .then(res => res.text())

      .then(body => this.parseHTML(body))

      .catch(err => {
        console.error(err);
      });
  }

  parseHTML(body) {
    const root = parse(body);
    const mainText = root.querySelector(".mainText");
    // console.log(body);
    const arr = [];
    mainText.querySelectorAll("p").forEach((element, index) => {
      if (index > 3) arr.push(element.innerHTML);
    });
    const date = mainText
      .querySelector("h3")
      .innerHTML.split("<br />")[0]
      .match(/(\d{1,2}\.)?\d{1,2}-\d{1,2}.\d{1,2}.\d{4}/)[0];

    this.combineData(arr, date);
  }

  combineData(foodList, date) {
    // const day = parseInt(date.split("-")[0]) - 1;
    // const dateSplit = date.split(".");
    // const monthSplit = dateSplit[1].split("-");
    // const month = parseInt(monthSplit[0]) - monthSplit[1] == null ? 1 : 2;

    // const year = dateSplit[2];

    // let d = new Date(year, month, day, 0, 0, 0, 0);
    let d = this.dateCheck(date);
    console.log("datenow", date);
    console.log(d.toUTCString());
    const finalList = foodList.map(food => {
      const splitted = food.split("<br />");
      const result = {
        date: new Date(d.getTime()),
        sv: splitted[0],
        fi: splitted[1]
      };
      d = d.addDays(1);
      return result;
    });
    this.writeToDb(finalList);
  }
  writeToDb(foodList) {
    for (let i = 0; i < foodList.length; i++) {
      const food = foodList[i];
      this.addToDb("FoodListOptima", [
        null,
        food.date.toUTCString(),
        food.sv,
        food.fi,
        food.date.getTime()
      ]);
    }
  }

  addToDb(table, addArray) {
    return new Promise((resolve, reject) => {
      this.removeFromDb(table, ` WHERE date = "${addArray[1]}"`)
        .then(() => {
          let lastId;

          let j = "";

          for (let i = 0; i < addArray.length; i++) {
            if (i != 0) j += ", ";

            j += "?";
          }

          console.log(addArray);

          console.log(`INSERT INTO ${table} VALUES (${j})`);

          try {
            const stmt = this.db.prepare(`INSERT INTO ${table} VALUES (${j})`);

            stmt.run(addArray, function(err) {
              if (err) console.log(err);

              lastId = this.lastID;

              resolve(lastId);
            });
          } catch (err) {
            reject(err);
          }
        })
        .catch(err => console.error(err));
    });
  }
  removeFromDb(table, where) {
    console.log("DELETING", where);
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM ${table}${where}`, function(err) {
        if (err) {
          reject(err.message);
        }
        console.log(`DELETE FROM ${table}${where}`);
        resolve("Complete");
      });
    });
  }
  dateCheck(date) {
    const day = parseInt(date.split("-")[0]) - 0; //1
    const dateSplit = date.split(".");
    const monthSplit = dateSplit[1].split("-");
    const month = parseInt(monthSplit[0]) - (monthSplit[1] == null ? 1 : 1);

    const year = dateSplit[dateSplit.length - 1];

    const d = new Date(year, month, day, 0, 0, 0, 0);
    if (d.getDay() == 1) return d;
    return d.addDays(d.getDay() - 1);
  }
};
