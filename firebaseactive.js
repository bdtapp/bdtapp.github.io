import { getDatabase, ref, set, get, onValue, update, child } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
const db = getDatabase();

let topscroll = 0;

function GetPathForNode(e) {
  let parent = e.parentNode;

  let key = parent.getAttribute("idforpath");

  let keypath = localStorage.getItem("dbpath");
  keypath += "/Active/" + key
  return {
    path: keypath,
    id: key,
    name: parent.getAttribute("name")
  };
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
    update(ref(db, path), { out: false });
  } else {
    update(ref(db, path), { out: true });
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
  update(ref(db, path), { cleared: true });
}
export const DisableClear = (e) => {
  topscroll = e.parentNode.parentNode.scrollTop;
  let path = GetPathForNode(e).path;
  update(ref(db, path), { cleared: false });
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
    name: parent.getAttribute("name")
  };
}
export const RemoveFromActive = (e) => {
  topscroll = e.parentNode.parentNode.scrollTop;

  let obj = GetPathForNode(e);
  let path = obj.path;
  if (confirm("Are you sure?") == true) {
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
export const LocalCachePull = (searchstring) => {
  let key = localStorage.getItem("dbpath");


  const activeref = ref(db, key + "/Active");
  onValue(activeref, (snapshot) => {
    let container = [];

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

    let search = searchstring;
    snapshot.forEach((child) => {
      let childkey = child.key;


      let cleared = false;
      let fed = false;
      let out = false;
      let name = "";
      let owner = "";

      child.forEach((inner) => {
        if (inner.key === "cleared") {
          cleared = inner.val();
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
        if(inner.key === "owner"){
          owner = inner.val();
        }
      });
      if (search === "") {
        container.push({
          key: childkey,
          name: name,
          fed: fed,
          out: out,
          cleared: cleared,
          owner: owner,
        });
      } else {
        if (name.includes(search)) {
          container.push({
            key: childkey,
            name: name,
            fed: fed,
            out: out,
            cleared: cleared,
            owner: owner
          });
        }
      }


    });


    const { compare } = Intl.Collator('en-US');
    container.sort((a, b) => compare(a.name, b.name));
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
      bs.style.setProperty("color", "#E16972");
      li.appendChild(inpute);
      labele.innerHTML = e.name + "<br>" + e.owner;
      labele.appendChild(spane);

      li.append(labele);
      li.appendChild(fs);
      li.appendChild(ps);
      li.appendChild(bs);

      li.setAttribute("idforpath", e.key);
      li.setAttribute("id", "li" + e.key);
      li.setAttribute("name", e.name);
      if (e.out) {
        li.classList.add("--out");
        ps.style.setProperty("color", "#583400");
      }
      if (e.fed) {
        li.classList.add("--fed");
        fs.style.setProperty("color", "#B197FC");
      }
      if (e.out && e.fed) {
        //cleared = true;
      }
      if (e.cleared) {
        li.classList.add("--cleared");
        inpute.checked = true;
      }

      ul.appendChild(li);
    })

    base.appendChild(ul);

    parent.appendChild(base);
    ul.scrollTo({
      top: topscroll,
      left: 0,
      behavior: "smooth"
    });
  }, {
    onlyOnce: true
  });
}
addEventListener("DOMContentLoaded", (event) => {

  let key = localStorage.getItem("dbpath");


  const activeref = ref(db, key + "/Active");
  onValue(activeref, (snapshot) => {
    let totalcount = 0;
    let outof = 0;
    let container = [];

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

    let search = document.getElementById("searchid").value;
    snapshot.forEach((child) => {
      ++totalcount;
      ++outof;
      let childkey = child.key;


      let cleared = false;
      let fed = false;
      let out = false;
      let name = "";
      let owner = "";

      //just a placeholder 

      child.forEach((inner) => {
        if (inner.key === "cleared") {
          cleared = inner.val();
          
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
        if(inner.key === "owner"){
          owner = inner.val();
        }
      });
      if (search === "") {
        container.push({
          key: childkey,
          name: name,
          fed: fed,
          out: out,
          cleared: cleared,
          owner: owner,
        });
      } else {
        if (name.includes(search)) {
          container.push({
            key: childkey,
            name: name,
            fed: fed,
            out: out,
            cleared: cleared,
            owner: owner
          });
        }
      }


    });


    const { compare } = Intl.Collator('en-US');
    container.sort((a, b) => compare(a.name, b.name));
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
      bs.style.setProperty("color", "#E16972");
      li.appendChild(inpute);
      labele.innerHTML = e.name + "<br>" + e.owner;
      labele.appendChild(spane);

      li.append(labele);
      li.appendChild(fs);
      li.appendChild(ps);
      li.appendChild(bs);

      li.setAttribute("idforpath", e.key);
      li.setAttribute("id", "li" + e.key);
      li.setAttribute("name", e.name);
      if (e.out) {
        li.classList.add("--out");
        ps.style.setProperty("color", "#583400");
      }
      if (e.fed) {
        li.classList.add("--fed");
        fs.style.setProperty("color", "#B197FC");
      }
      if (e.out && e.fed) {
        //cleared = true;
      }
      if (e.cleared) {
        li.classList.add("--cleared");
        inpute.checked = true;
        --outof;
      }

      ul.appendChild(li);
    })

    base.appendChild(ul);

    parent.appendChild(base);
    document.getElementById("outoftotal").innerHTML=outof+"/"+totalcount;
    ul.scrollTo({
      top: topscroll,
      left: 0,
      behavior: "smooth"
    });
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