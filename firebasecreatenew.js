import { getDatabase, ref, set, get, onValue, update, child } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
const db = getDatabase();
let dbpath = localStorage.getItem("dbpath");
let date = new Date(Date.now());
document.getElementById("date").value = date.toDateString();
function InternalCreateNewEntry(ownername,name,sex,sterile,age,foodquantity,uuid,date){
    let path = dbpath + "/Inactive/" + uuid;
    update(ref(db, path), {
        name: name,
        owner: ownername,
        steril: sterile,
        sex: sex,
        age: age,
        quantity: foodquantity,
        key: uuid,
        date: date
    }).then(e => {
        window.location.href = "./createnew.html";


    }).catch(e => {

    });
}
export const CreateNewEntry = ()=>{
    let name = document.getElementById("name").value;
    let ownername = document.getElementById("owner").value;
    let sterile = document.getElementById("sterile").checked;
    let age = parseInt(document.getElementById("age").value);
    //let foodquantity = parseFloat(document.getElementById("quantity").value);
    let foodquantity = 0.0;
    let date = document.getElementById("date").value;
    let sex = document.getElementById("sex").value;
    let uuid = uuidV4();

    InternalCreateNewEntry(ownername,name,sex,sterile,age,foodquantity,uuid,date);
}

addEventListener("DOMContentLoaded",event=>{
    let taskspath = localStorage.getItem("dbpath") + "/Tasks";
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
});