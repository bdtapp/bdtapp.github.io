import { getDatabase, ref, set, get, onValue, update, child } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

const db = getDatabase();
let topscroll = 0;
let totalcount = 0;
let outof = 0;
let dbpath = localStorage.getItem("dbpath");
let activepath = dbpath + "/Active/";
onValue(ref(db, activepath), (snapshot) => {
    snapshot.forEach(child => {
        ++totalcount;
    });

}, {
    onlyOnce: true
});

function GetPathForNode(e) {
    let parent = e.parentNode;

    let key = parent.getAttribute("idforpath");

    let keypath = localStorage.getItem("dbpath");
    keypath += "/Rooms/" + key
    return {
        path: keypath,
        id: key,
        name: parent.getAttribute("name")
    };
    
}

function IncreaseCountForRoom(e){
    if(outof>=totalcount){
        return;
    }
    let obj = GetPathForNode(e);
    let count = parseInt(e.parentNode.getAttribute("count"));
    console.log(count);
    ++count;
    console.log(count);
    update(ref(db,obj.path),{
        count:count
    }).then(e=>{

    });
    
}
function DecreaseCountForRoom(e){

    let obj = GetPathForNode(e);
    let count = parseInt(e.parentNode.getAttribute("count"));
    if(count<=0){
        return;
    }
    --count;
    update(ref(db, obj.path), {
        count: count
    }).then(e=>{
    });
    
}
addEventListener("DOMContentLoaded", (event) => {

    let key = localStorage.getItem("dbpath");


    const activeref = ref(db, key + "/Rooms");
    
    onValue(activeref, (snapshot) => {
        outof = 0;
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
            let childkey = child.key;


            let name = "";
            let count = 0;
            child.forEach((inner) => {
                if (inner.key === "name") {
                    name = inner.val();
                }

                if (inner.key === "count") {
                    count = inner.val();
                    outof+=count;
                }

            });
            container.push({
                key: childkey,
                name: name,
                count: count
            });

        });


        container.forEach(e => {
            let li = document.createElement("li");
            let inpute = document.createElement("input");
            let spane = document.createElement("span");
            let labele = document.createElement("label");

            let plus = document.createElement("i");
            plus.classList.add("fa-solid");
            plus.classList.add("fa-plus");
            plus.classList.add("fa-xl");
            plus.style.setProperty("color","#63E6BE")
            plus.onclick = function () {
                IncreaseCountForRoom(this);
            }
            let minus = document.createElement("i");
            minus.classList.add("fa-solid");
            minus.classList.add("fa-minus");
            minus.classList.add("fa-xl");
            minus.style.setProperty("color","#E16972");
            minus.onclick = function () {
                DecreaseCountForRoom(this);
            }
            inpute.setAttribute("type", "checkbox");
            inpute.setAttribute("id", e.key);
            inpute.addEventListener("change", function (event) {
                event.target.checked = !event.target.checked;
            });
            labele.setAttribute("for", e.key);
            spane.classList.add("check");


            li.appendChild(inpute);
            labele.innerHTML = e.name + " : " + e.count;
            labele.appendChild(spane);

            li.append(labele);

            li.appendChild(plus);
            li.appendChild(minus);
            li.setAttribute("idforpath", e.key);
            li.setAttribute("id", "li" + e.key);
            li.setAttribute("count",e.count);
            ul.appendChild(li);
        })
        base.appendChild(ul);
        parent.appendChild(base);   
        document.getElementById("outoftotal").innerHTML = outof + "/" + totalcount;
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