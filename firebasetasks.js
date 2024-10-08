import { getDatabase, ref, set, get, onValue, update, child } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

const db = getDatabase();
let topscroll = 0;
function GetPathForNode(e) {
    let parent = e.parentNode;

    let key = parent.getAttribute("idforpath");

    let keypath = localStorage.getItem("dbpath");
    keypath += "/Tasks/" + key
    return {
        path: keypath,
        id: key,
        name: parent.getAttribute("name")
    };
}

export const AddTask = () => {
    let task = document.getElementById("taskid");
    if (task.value != "") {
        let uuid = uuidV4();
        let path = localStorage.getItem("dbpath");
        path += '/Tasks/' + uuid;
        //set their active value to false in /Inactive
        let date = new Date(Date.now());
        let ts = date.getMonth() + "-" + date.getDay() + "-" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
        update(ref(db, path), {
            cleared: false,
            task: task.value,
            created: date.toLocaleString(),
        }).then(e => {
            task.value = "";
        });
    }
}
export const CompleteTask = (task) => {
    topscroll = e.parentNode.parentNode.scrollTop;
}
export const EraseTask = (task) => {
    topscroll = e.parentNode.parentNode.scrollTop;
}
export const EnableClear = (e) => {
    let date = new Date(Date.now());
    topscroll = e.parentNode.parentNode.scrollTop;
    let path = GetPathForNode(e).path;
    update(ref(db, path), {
        cleared: true,
        completed: date.toLocaleString()
    });
}
export const DisableClear = (e) => {
    topscroll = e.parentNode.parentNode.scrollTop;
    let path = GetPathForNode(e).path;

    update(ref(db, path), { cleared: false });
}
export const RemoveFromActive = (e) => {
    topscroll = e.parentNode.parentNode.scrollTop;

    let obj = GetPathForNode(e);
    onValue(ref(db, obj.path), snapshot => {
        let completed = "";
        let created = "";
        let task = "";
        let key = snapshot.key;

        snapshot.forEach(child => {
            if (child.key === "created") {
                created = child.val();
            }
            if (child.key === "completed") {
                completed = child.val();
            }
            if (child.key === "task") {
                task = child.val();
            }
        })
        let uuid = uuidV4();
        let path = localStorage.getItem("dbpath");
        path += '/TasksLogs/' + uuid;
        update(ref(db, path), {
            created: created,
            completed: completed,
            task: task
        }).then(e=>{
            set(ref(db,obj.path),null);
        });
    }, { onlyOnce: true });


}
addEventListener("DOMContentLoaded", (event) => {

    let key = localStorage.getItem("dbpath");


    const activeref = ref(db, key + "/Tasks");
    onValue(activeref, (snapshot) => {
        let total = 0;
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

        snapshot.forEach((child) => {
            ++total;
            let childkey = child.key;


            let cleared = false;
            let task = "";
            let created = "";
            child.forEach((inner) => {

                if (inner.key === "cleared") {
                    cleared = inner.val();
                    if (cleared) {
                        ++outof;
                    }
                }

                if (inner.key === "task") {
                    task = inner.val();
                }
                if (inner.key === "created") {
                    created = inner.val();
                }

            });
            container.push({
                key: childkey,
                cleared: cleared,
                task: task,
                created: created
            });

        });


        container.forEach(e => {
            let li = document.createElement("li");
            let inpute = document.createElement("input");
            let spane = document.createElement("span");
            let labele = document.createElement("label");

            let bs = document.createElement("i");
            bs.classList.add("fa-solid");
            bs.classList.add("fa-trash");
            bs.classList.add("fa-xl");
            bs.onclick = function () {
                if (e.cleared) {
                    RemoveFromActive(this);
                }

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
            if (e.cleared) {
                inpute.checked = true;
            }

            li.appendChild(inpute);
            labele.innerHTML = e.task;
            labele.appendChild(spane);

            li.append(labele);

            li.appendChild(bs);

            li.setAttribute("idforpath", e.key);
            li.setAttribute("id", "li" + e.key);
            li.setAttribute("created", e.created);
            ul.appendChild(li);

        })
        base.appendChild(ul);
        parent.appendChild(base);
        document.getElementById("outoftotal").innerHTML = outof + "/" + total;
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
*/