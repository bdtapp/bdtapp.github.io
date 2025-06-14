import { getDatabase, ref, set, get, onValue, update, child } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
const db = getDatabase();

let topscroll = 0;
let sortbyowner = false;
/*
setInterval(() => {
  let list = document.getElementsByClassName("currentlyouttimer");
  for (let index = 0; index < list.length; index++) {
    //console.log(list[index].getAttribute("currentlyouttimestamp"));
    let timestamp = list[index].getAttribute("currentlyouttimestamp");
    timestamp = parseInt(timestamp);
    let now = Date.now();
    let diff = now - timestamp;
    let seconds = Math.floor(diff / 1000);
    let h = Math.floor(seconds / 3600);
    let m = Math.floor(seconds % 3600 / 60);
    let s = seconds % 60;
    list[index].innerHTML = ""+h+":"+(m< 10 ? "0"+m : m)+":"+(s< 10 ? "0"+s : s);
  }


}, 100);
*/
function GetPathForNode(e) {
  let parent = e.parentNode;

  let key = parent.getAttribute("idforpath");

  let keypath = localStorage.getItem("dbpath");
  keypath += "/Active/" + key
  return {
    path: keypath,
    id: key,
    name: parent.getAttribute("name"),
    owner: parent.getAttribute("owner"),
  };
}
export const ToggleSortByOwner = () => {
  sortbyowner = !sortbyowner;
  console.log(sortbyowner);
  let e = document.getElementById("sortbyowner");
  e.classList.toggle("sortswapdetoggled");
  e.classList.toggle("sortswaptoggled");
  LocalCachePull("");
}
export const ToggleFed = (e) => {
  topscroll = e.parentNode.parentNode.scrollTop;
  let path = GetPathForNode(e).path;
  if (e.parentNode.classList.contains("--fed")) {
    update(ref(db, path), { fed: false });
  } else {
    update(ref(db, path), { fed: true });
  }


};
export const ToggleOut = (e) => {
  topscroll = e.parentNode.parentNode.scrollTop;
  let path = GetPathForNode(e).path;
  if (e.parentNode.classList.contains("--out")) {
    update(ref(db, path), { out: false, currentlyout: false });

  } else {
    update(ref(db, path), { out: true, currentlyout: true, currentlyouttimestamp:Date.now() });
  }
};
export const ToggleClear = (e) => {
  topscroll = e.parentNode.parentNode.scrollTop;
  let path = GetPathForNode(e).path;
  update(ref(db, path), { cleared: true });
}
export const EnableClear = (e) => {
  topscroll = e.parentNode.parentNode.scrollTop;
  let path = GetPathForNode(e).path;
  if (e.parentNode.classList.contains("--currentlyout")) {
    update(ref(db, path), { currentlyout: false });
  } else {
    update(ref(db, path), { cleared: true, currentlyout: true, currentlyouttimestamp:Date.now() });
  }
}
export const DisableClear = (e) => {
  topscroll = e.parentNode.parentNode.scrollTop;
  let path = GetPathForNode(e).path;
  if (e.parentNode.classList.contains("--currentlyout")) {
    update(ref(db, path), { currentlyout: false });
  }else{
    update(ref(db, path), { cleared: false });
  }
  
}
export const ResetStates = () => {

  if (confirm("Reset?") == true) {
    let path = localStorage.getItem("dbpath");
    path += "/Active/"

    return onValue(ref(db, path), (snapshot) => {
      snapshot.forEach((child) => {
        let childpath = path + child.key;
        update(ref(db, childpath), {
          cleared: false,
          out: false,
          fed: false,
          cleared: false,
        })
      })
    }, {
      onlyOnce: true
    });
  }

}
function GetPathForeInactive(e) {
  let parent = e.parentNode;

  let key = parent.getAttribute("idforpath");

  let keypath = localStorage.getItem("dbpath");
  keypath += "/Inactive/" + key
  return {
    path: keypath,
    id: key,
    name: parent.getAttribute("name"),
    owner: parent.getAttribute("owner")
  };
}
export const RemoveFromActive = (e) => {
  topscroll = e.parentNode.parentNode.scrollTop;

  let obj = GetPathForNode(e);
  let path = obj.path;
  if (confirm("send " + obj.name + " home?") == true) {
    set(ref(db, path), null);

    let uuid = uuidV4();
    path = localStorage.getItem("dbpath");
    let activepath = path + "/Active/";
    let counter = 0;
    onValue(ref(db, activepath), (snapshot) => {
      snapshot.forEach(child => {
        ++counter;
      });

      let logpath = path + "/Logs/" + uuid;
      let date = new Date(Date.now());
      let ts = date.getMonth() + "-" + date.getDay() + "-" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

      set(ref(db, logpath), {
        key: obj.id,
        name: obj.name,
        count: counter,
        active: false,
        date: date.toString(),
        owner: obj.owner,
        timestamp: date.toLocaleString()
      });
      obj = GetPathForeInactive(e);
      update(ref(db, obj.path), {
        active: false
      });

    }, {
      onlyOnce: true
    });


  }
}

function HandleSnapshotContainer(snapshot, search) {
  let container = [];
  let totalcount = 0;
  snapshot.forEach((child) => {

    let childkey = child.key;
    ++totalcount;

    let cleared = false;
    let fed = false;
    let out = false;
    let currentlyout = false;
    let currentlyouttimestamp = 0;
    let name = "";
    let owner = "";

    child.forEach((inner) => {
      if (inner.key === "cleared") {
        cleared = inner.val();
      }
      if(inner.key == "currentlyouttimestamp"){
        currentlyouttimestamp = inner.val();
      }
      if (inner.key == "currentlyout") {
        currentlyout = inner.val();
      }
      if (inner.key === "fed") {
        fed = inner.val();
        if (fed) {
          fed = inner.val();
        }
      }
      if (inner.key === "out") {
        out = inner.val();
        if (out) {
          out = inner.val();

        }
      }
      if (inner.key === "name") {
        name = inner.val();
      }
      if (inner.key === "owner") {
        owner = inner.val();
      }
    });
    if (search === "") {
      container.push({
        key: childkey,
        name: name,
        fed: fed,
        out: out,
        currentlyout: currentlyout,
        currentlyouttimestamp: currentlyouttimestamp,
        cleared: cleared,
        owner: owner,

      });
    } else {
      if (name.toLowerCase().includes(search.toLowerCase())) {
        container.push({
          key: childkey,
          name: name,
          fed: fed,
          out: out,
          currentlyout: currentlyout,
          currentlyouttimestamp: currentlyouttimestamp,
          cleared: cleared,
          owner: owner
        });
      }
    }


  });

  return {
    container: container,
    totalcount: totalcount,
  }
}

function CreateAndPopulateElements(container, totalcount) {
  let outof = totalcount
  const parent = document.getElementById("content");
  let tobedeleted = document.getElementById("accordian");
  if (tobedeleted != null && tobedeleted != undefined) {
    tobedeleted.remove();
  }
  const base = document.createElement("div");
  base.setAttribute("id", "accordian");

  const ul = document.createElement("ul");
  ul.classList.add("todos");
  ul.classList.add("expanded");
  ul.setAttribute("id","accordianlist");




  const { compare } = Intl.Collator('en-US');
  if (sortbyowner === true) {
    container.sort((a, b) => compare(a.owner, b.owner));
  } else if (sortbyowner === false) {
    container.sort((a, b) => compare(a.name, b.name));
  }
  container.forEach(e => {
    let li = document.createElement("li");
    let inpute = document.createElement("input");
    let spane = document.createElement("span");
    let labele = document.createElement("label");
    let fs = document.createElement("i");
    fs.onclick = function () {
      window.ToggleFed(this);
    }
    let ps = document.createElement("i");
    ps.onclick = function () {
      window.ToggleOut(this);
    }
    let bs = document.createElement("i");
    bs.onclick = function () {
      window.RemoveFromActive(this);
    }
    inpute.setAttribute("type", "checkbox");
    inpute.setAttribute("id", e.key);
    inpute.addEventListener("change", function (event) {
      if (event.target.checked) {
        EnableClear(inpute);
      } else {
        DisableClear(inpute);
      }

    });
    labele.setAttribute("for", e.key);
    spane.classList.add("check");

    fs.classList.add("fa-solid");
    fs.classList.add("fa-bowl-rice");
    fs.classList.add("fa-xl");
    ps.classList.add("fa-solid");
    ps.classList.add("fa-poop");
    ps.classList.add("fa-xl");
    bs.classList.add("fa-solid");
    bs.classList.add("fa-ban");
    bs.classList.add("fa-xl");
    bs.style.setProperty("color", "#242343");
    li.appendChild(inpute);
    let paragraph = document.createElement("p");



    li.append(labele);
    li.appendChild(fs);
    li.appendChild(ps);
    li.appendChild(bs);

    li.setAttribute("idforpath", e.key);
    li.setAttribute("id", "li" + e.key);
    li.setAttribute("name", e.name);
    li.setAttribute("owner", e.owner);
    if (e.out) {
      li.classList.add("--out");
      ps.style.setProperty("color", "#ffafcc");
    }
    if (e.currentlyout) {
      li.classList.add("--currentlyout");
      //
      //paragraph.style.setProperty("color", "#1f1f1f");
      const now = new Date(e.currentlyouttimestamp)
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      paragraph.innerHTML = e.name + "<br>" + e.owner;
      let h5 = document.createElement("h5");
      h5.innerHTML = hours + ":" + minutes + ":" + seconds ;
      h5.style.setProperty("color", "#E95262");
      h5.classList.add("currentlyouttimer");
      h5.setAttribute("currentlyouttimestamp", e.currentlyouttimestamp);
      labele.appendChild(paragraph);
      labele.appendChild(h5);
    }
    else{
      paragraph.innerHTML = e.name + "<br>" + e.owner;
      labele.appendChild(paragraph);
    }
    
    labele.appendChild(spane);
    if (e.fed) {
      li.classList.add("--fed");
      fs.style.setProperty("color", "#cdb4db");
    }
    if (e.out && e.fed) {
      e.cleared = true;
    }
    if (e.cleared) {
      paragraph.style.setProperty("color","#1f1f1f");
      li.classList.add("--cleared");

      inpute.checked = true;
      --outof;
    }

    ul.appendChild(li);
  })

  base.appendChild(ul);

  parent.appendChild(base);

  ul.scrollTo({
    top: topscroll,
    left: 0,
    behavior: "instant"
  });
  document.getElementsByClassName("todos")[0].addEventListener("scroll", (event) => {
    topscroll = event.target.scrollTop;
  })

  return outof;
}
export const LocalCachePull = (searchstring) => {
  let key = localStorage.getItem("dbpath");


  const activeref = ref(db, key + "/Active");
  onValue(activeref, (snapshot) => {

    let search = searchstring;
    let obj = HandleSnapshotContainer(snapshot, search);
    let container = obj.container;
    let totalcount = obj.totalcount;
    CreateAndPopulateElements(container, totalcount);
  }, {
    onlyOnce: true
  });
}
addEventListener("DOMContentLoaded", (event) => {

  let key = localStorage.getItem("dbpath");
  let taskspath = key + "/Tasks";
  onValue(ref(db, taskspath), snapshot => {
    let unclearedtasks = false;
    document.getElementById("taskslink").classList.add("unselected");
    document.getElementById("taskslink").classList.remove("untoggled");
    snapshot.forEach(child => {
      let obj = child.val();
      if (obj.cleared === false) {
        unclearedtasks = true;
      }
    })
    if (unclearedtasks == true) {
      document.getElementById("taskslink").classList.remove("unselected");
      document.getElementById("taskslink").classList.add("untoggled");
    }
  });

  const activeref = ref(db, key + "/Active");
  onValue(activeref, (snapshot) => {
    let search = document.getElementById("searchid").value;
    let obj = HandleSnapshotContainer(snapshot, search);
    let container = obj.container;
    let totalcount = obj.totalcount;
    let outof = CreateAndPopulateElements(container, totalcount);
    document.getElementById("outoftotal").innerHTML = outof + "/" + totalcount;
  });


});



/*
Changes which need to be made to the original database file
Restored needs to be replaced with Active
Acrhived needs to be replaced with Inactive
Logged needs to be replaced with Logs
“Restored” state needs to be replcaed with true
“Archived” state needs to be replaced with false
state: for logs needs to be replaced with active:
"steril" needs to be replaced with "sterile"
"quantity" needs to be replaced with "foodquantity"
"Key" needs to be replaced with key"

*/