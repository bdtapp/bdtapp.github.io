import { getDatabase, ref, set, get, onValue, update, child } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
const db = getDatabase();
let topscroll = 0;
let dbkey = localStorage.getItem("dbpath");


function GetPathForNode(e) {
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
function GetPathForNodeActive(e) {
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
export const Reactivate = (e) => {
    topscroll = e.parentNode.parentNode.scrollTop;
    let obj = GetPathForNode(e);
    let parentnode = e.parentNode;
    //set their active value to false in /Inactive

    update(ref(db, obj.path), {
        active: true
    });

    //update and add them to the /Active db
    obj = GetPathForNodeActive(e);
    update(ref(db, obj.path), {
        name: obj.name,
        fed: false,
        cleared: false,
        out: false,
        owner: obj.owner,
    }).then(e => {

        let path = localStorage.getItem("dbpath");
        let activepath = path + "/Active/";
        let counter = 0;
        onValue(ref(db, activepath), (snapshot) => {
            snapshot.forEach(child => {
                ++counter;
            });
            let uuid = uuidV4();
            let logpath = path + "/Logs/" + uuid;
            let date = new Date(Date.now());
            let ts = date.getMonth() + "-" + date.getDay() + "-" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
            set(ref(db, logpath), {
                key: obj.id,
                name: obj.name,
                count: counter,
                active: true,
                date: date.toString(),
                owner: obj.owner,
                timestamp: date.toLocaleString()
            });
        }, {
            onlyOnce: true
        });
    })
}

function HandleSnapshotContainer(snapshot, search) {
    let container = [];
    let totalcount = 0;



    snapshot.forEach((child) => {
        ++totalcount;
        let childkey = child.key;


        let active = false;
        let name = "";
        let owner = "";
        child.forEach((inner) => {
            if (inner.key === "name") {
                name = inner.val();
            }
            if (inner.key === "active") {
                active = inner.val();
            }
            if (inner.key === "owner") {
                owner = inner.val();
            }

        });
        if (search == "") {
            container.push({
                key: childkey,
                name: name,
                active: active,
                owner: owner
            });
        } else {
            if (name.toLowerCase().includes(search.toLowerCase())) {
                container.push({
                    key: childkey,
                    name: name,
                    active: active,
                    owner: owner
                });
            }
        }

    });

    return {
        container: container,
        totalcount: totalcount
    }
}
function CreateAndPopulateElements(container) {

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




    const { compare } = Intl.Collator('en-US');
    container.sort((a, b) => compare(a.name, b.name));
    container.forEach(e => {
        let li = document.createElement("li");
        let inpute = document.createElement("input");
        let spane = document.createElement("span");
        let labele = document.createElement("label");

        let bs = document.createElement("i");
        let edit = document.createElement("i");
        let log = document.createElement("i");

        log.classList.add("fa-solid");
        log.classList.add("fa-clipboard");
        log.classList.add("fa-xl");
        log.onclick = function(){
            localStorage.setItem("logentry",e.key);
            window.location.href = "entrylog.html";
        }

        edit.classList.add("fa-solid");
        edit.classList.add("fa-pen");
        edit.classList.add("fa-xl");
        edit.onclick = function () {
            localStorage.setItem("editkey", e.key);
            window.location.href = "editentry.html";
        }

        inpute.setAttribute("type", "checkbox");
        inpute.setAttribute("id", e.key);
        inpute.addEventListener("change", function (event) {
            event.target.checked = !event.target.checked;

        });
        labele.setAttribute("for", e.key);
        spane.classList.add("check");
        if (!e.active) {
            bs.onclick = function () {
                window.Reactivate(this);
            }
            bs.classList.add("fa-solid");
            bs.classList.add("fa-ban");
            bs.classList.add("fa-xl");
            //bs.style.setProperty("color", "#63E7BE");
            bs.style.setProperty("color", "#242343");
        } else {
            bs.classList.add("fa-solid");
            bs.classList.add("fa-heart");
            bs.classList.add("fa-xl");
            bs.style.setProperty("color", "#cdb4db");
            inpute.checked = true;
        }

        li.appendChild(inpute);
        let paragraph = document.createElement("p");
        paragraph.innerHTML = e.name + "<br>" + e.owner;
        labele.appendChild(paragraph);
        labele.appendChild(spane);

        li.append(labele);

        li.appendChild(bs);
        li.appendChild(log);
        li.appendChild(edit);

        li.setAttribute("idforpath", e.key);
        li.setAttribute("id", "li" + e.key);
        li.setAttribute("name", e.name);
        li.setAttribute("owner", e.owner);

        ul.appendChild(li);
    })
    base.appendChild(ul);
    parent.appendChild(base);
    ul.scrollTo({
        top: topscroll,
        left: 0,
        behavior: "instant"
    });
}
export const LocalCachePull = (searchstring) => {
    let key = localStorage.getItem("dbpath");


    const activeref = ref(db, key + "/Inactive");
    onValue(activeref, (snapshot) => {

        let search = searchstring;
        let obj = HandleSnapshotContainer(snapshot, search);
        let container = obj.container;
        CreateAndPopulateElements(container);
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

    const activeref = ref(db, key + "/Inactive");
    onValue(activeref, (snapshot) => {



        let search = document.getElementById("searchid").value;
        let obj = HandleSnapshotContainer(snapshot, search);
        let container = obj.container;
        let totalcount = obj.totalcount;
        CreateAndPopulateElements(container);

        document.getElementById("totalcount").innerHTML = totalcount;
        document.getElementsByClassName("todos")[0].addEventListener("scroll", (event) => {
            topscroll = event.target.scrollTop;
        })
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
*/