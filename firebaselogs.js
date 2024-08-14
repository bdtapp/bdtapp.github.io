import { getDatabase, ref, set, get, onValue, update, child } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
const db = getDatabase();
let topscroll = 0;

addEventListener("DOMContentLoaded", (event) => {

    let key = localStorage.getItem("dbpath");


    const activeref = ref(db, key + "/Logs");
    onValue(activeref, (snapshot) => {
        let container = [];

        let base = document.getElementById("container");
        base.addEventListener("scroll",(event)=>{
            console.log(event);
        })
        let tobedeleted = document.getElementById("container-list");
        if (tobedeleted != null && tobedeleted != undefined) {
            tobedeleted.remove();
        }



        snapshot.forEach((child) => {
            let childkey = child.key;


            let count = 0; 
            let active = false;
            let timestamp = "";
            let name = "";
            let date = "";
            let owner = "";
            child.forEach((inner) => {
                if (inner.key === "count") {
                    count = inner.val();
                }
                if (inner.key === "timestamp") {
                    timestamp = inner.val();
                }
                if (inner.key === "name") {
                    name = inner.val();
                }
                if (inner.key === "active") {
                    active = inner.val();
                }
                if(inner.key === "date"){
                    date = inner.val();
                }
                if(inner.key === "owner"){
                    owner = inner.val();
                }

            });

            container.push({
                key: childkey,
                name: name,
                active: active,
                date: date,
                timestamp:timestamp,
                count:count,
                owner:owner
            });
        });

        let parent = document.createElement("div");
        parent.setAttribute("id","container-list");
        parent.classList.add("listbox");

        container.sort(function (a, b) {
            // Turn your strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.
            return new Date(b.date) - new Date(a.date);
        });
        let counter = 0;
        container.forEach(e => {
            if(counter <=100){
                let item = document.createElement("div");

                item.classList.add("listbox-item");
                let title = document.createElement("p");
                title.innerHTML = e.name + " : " + e.owner +"<br>"+ (e.active ? "Arrived" : "Left") + " - count : " + e.count + "<br>" + e.timestamp;

                item.appendChild(title);

                parent.append(item);
                ++counter;
            }

        })
        base.appendChild(parent);
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