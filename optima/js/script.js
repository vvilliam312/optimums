import elements from "./elements.js";

$("#foodVote").hide();

function loadData() {
  fetch("/mat/api/optima", {
    headers: {
      from: document.getElementById("dateFrom").value,
      to: document.getElementById("dateTo").value
    }
  })
    .then(function(response) {
      return response.json();
    })
    .then(function(myJson) {
      const list = myJson
        .map(x => {
          return { date: new Date(x.date), food: x.sv };
        })
        .sort((a, b) => {
          return a.date - b.date;
        });
      let html = "";
      const mainElem = $("#main")[0];
      mainElem.innerHTML = "";
      for (let i = 0; i < list.length; i++) {
        const timeNow = new Date();
        let active = "";
        if (
          list[i].date.getTime() ==
          new Date(
            timeNow.getFullYear(),
            timeNow.getMonth(),
            timeNow.getDate(),
            0,
            0,
            0,
            0
          ).getTime()
        )
          active = " active";
        const li = document.createElement("li");
        const span = document.createElement("span");
        const content = document.createElement("div");
        content.onclick = () => {
          console.log("#c" + list[i].date.getTime());
          $("#c" + list[i].date.getTime()).collapse("toggle");
        };
        const collapse = document.createElement("div");
        collapse.className = "collapse";
        collapse.id = "c" + list[i].date.getTime();
        content.className = "d-flex justify-content-between align-items-center";

        if (active !== "") {
          elements.voteToday().then(res => {
            collapse.appendChild(res);
          });
        } else {
          elements.pastVote(list[i].date.getTime()).then(res => {
            collapse.appendChild(res);
          });
        }

        span.innerHTML = `${list[i].date.getDate()}.${list[i].date.getMonth() +
          1}`;
        span.className = "badge badge-primary badge-pill";
        content.innerHTML = list[i].food + "   ";
        li.className = "list-group-item" + active;
        content.appendChild(span);
        li.appendChild(content);
        li.appendChild(collapse);

        mainElem.appendChild(li);
      }

      //$("#main").html(html);
    });
}

$("#refresh").click(function() {
  loadData();
  datum();
});
function datum() {
  const daysDate = new Date();
  let dayName;
  switch (daysDate.getDay()) {
    case 0:
      dayName = "Söndag";
      break;

    case 1:
      dayName = "Måndag";
      break;

    case 2:
      dayName = "Tisdag";
      break;

    case 3:
      dayName = "Onsdag";
      break;

    case 4:
      dayName = "Torsdag";
      break;

    case 5:
      dayName = "Fredag";
      break;

    case 6:
      dayName = "Lördag";
      break;
  }
  $(".dateX").html(
    `${dayName} ${daysDate.getDate()}.${daysDate.getMonth() + 1}`
  );
}
datum();

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

function findWeek() {
  const dateNow = new Date();
  const dayOfWeek = dateNow.getDay();
  const sunday = dateNow.addDays(-dayOfWeek);
  const saturday = sunday.addDays(6);
  console.log(sunday, saturday);
  document.getElementById("dateFrom").value = sunday
    .toISOString()
    .substring(0, 10);
  document.getElementById("dateTo").value = saturday
    .toISOString()
    .substring(0, 10);
}
$(".votebtn").click(e => {
  if (e.currentTarget.innerHTML == "👎") {
    sendvote("-1");
  } else {
    sendvote("1");
  }
});
// $("#backToList").click(() => {
//   $("#foodVote").hide();
//   $("#foodList").show();
// });
// $(".collapse").on("show.bs.collapse", function() {
//   console.log("ABC");
//   $(".collapse").collapse("hide");
// });

findWeek();
loadData();
