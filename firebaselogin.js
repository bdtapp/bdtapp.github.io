import { getDatabase, ref, get,child  } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";


function TestAccessKey(key){
    const dbRef = ref(getDatabase());
    const dbpath = "/"+key+"/internal";
    get(child(dbRef, dbpath+"/foo")).then((snapshot) => {
        if (snapshot.exists()) {
            console.log(snapshot.val());
            const msg = document.getElementById("idInvalidAccessKey");
            msg.textContent = "Success";
            localStorage.setItem("dbpath", dbpath);
            window.location.href = "index.html";
        } else {
            const msg = document.getElementById("idInvalidAccessKey");
            msg.textContent = "Invalid Key";
        }
    }).catch((error) => {
        const msg = document.getElementById("idInvalidAccessKey");
        msg.textContent = "Invalid Key";
    });
}
export const StoreAccessKey = ()=>{
    const key = document.getElementById("idAccessKey");
    TestAccessKey(key.value);
}