const voteToday = async () => {
  return new Promise((resolve, reject) => {
    getVoteData().then(voteData => {
      if (!voteData.haveVoted && checkTime()) {
        return resolve(vote(voteData));
      } else {
        if (!checkTime(true)) {
          const voteTime = document.createElement("h1");
          voteTime.innerHTML = "Rösta mellan kl. 10-13";
          resolve(voteTime);
        } else {
          return resolve(voteProgress(voteData));
        }
      }
    });
  });
};

const pastVote = day => {
  return new Promise((resolve, reject) => {
    getVoteData(day).then(voteData => {
      resolve(voteProgress(voteData));
    });
  });
};

function sendvote(change) {
  fetch("/mat/api/optima/vote", {
    headers: {
      vote: change
    }
  })
    .then(d => d.json())
    .then(d => $("#refresh").click())
    .catch(err => console.error(err));
}

function getVoteData(day) {
  return new Promise((resolve, reject) => {
    fetch("/mat/api/optima/vote", {
      headers: {
        day: day
      }
    })
      .then(d => d.json())
      .then(d => resolve(d.opinionNow))
      .catch(err => reject(err));
  });
}

function vote(voteData) {
  const foodVote = document.createElement("div");
  const btnHolder = document.createElement("div");
  const btnLike = document.createElement("button");
  btnLike.className = "btn btn-success votebtn";
  btnLike.innerHTML = "👍";
  btnLike.onclick = () => {
    sendvote("1");
  };
  const btnDislike = document.createElement("button");
  btnDislike.className = "btn btn-danger votebtn";
  btnDislike.innerHTML = "👎";
  btnDislike.onclick = () => {
    sendvote("-1");
  };
  const text = document.createElement("h3");
  text.innerHTML = "Rösta på dagens maträtt";

  btnHolder.appendChild(btnLike);
  btnHolder.appendChild(btnDislike);

  foodVote.appendChild(text);
  foodVote.appendChild(btnHolder);
  return foodVote;
}

function voteProgress(voteData) {
  const progressBar = document.createElement("div");

  const pText = document.createElement("p");
  if (voteData.percent == null) {
    pText.innerHTML = "Inga Röster";
  } else {
    pText.innerHTML =
      voteData.percent + "% Av " + voteData.totalVotes + " röster";
  }
  pText.className = "progText";

  progressBar.className = "progress";

  const prog = document.createElement("div");
  prog.className = "progress-bar bg-success progress-bar-striped";
  prog.setAttribute("role", "progressbar"); //style="width: 50%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"
  prog.style.width = voteData.percent + "%";

  progressBar.appendChild(prog);
  progressBar.appendChild(pText);
  return progressBar;
}

function checkTime(befOnly = false) {
  const timeNow = new Date();
  if (!befOnly) return timeNow.getHours() > 9 && timeNow.getHours() < 13;
  return timeNow.getHours() > 9;
}

export default { voteToday, pastVote };
