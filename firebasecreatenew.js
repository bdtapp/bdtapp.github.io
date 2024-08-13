import { getDatabase, ref, set, get, onValue, update, child } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
const db = getDatabase();
const editkey = localStorage.getItem("editkey");
let dbpath = localStorage.getItem("dbpath");
if(editkey==="foo"){
    let date = new Date(Date.now());
    document.getElementById("date").value = date.toDateString();
}else{
    let path = dbpath + "/Inactive/" + editkey;

    onValue(ref(db, path), (snapshot) => {

        let date = "";
        snapshot.forEach((child) => {
            if(child.key==="name"){
                document.getElementById("name").value = child.val();

            }
            if(child.key==="owner"){
                document.getElementById("owner").value = child.val();

            }
            if(child.key==="sex"){
                document.getElementById("sex").value = child.val();

            }
            if(child.key === "sterile"){
                document.getElementById("sterile").checked = child.val();

            }
            if(child.key=="quantity"){
                document.getElementById("quantity").value = child.val();


            }
            if (child.key == "age") {
                document.getElementById("age").value = child.val();

            }
            if(child.key === "date"){
                date = child.val();
            
            }
        })
        if(date === ""){
           // date = new Date(Date.now()).toDateString();
            //don't give them a newer date
            //just leave their date entry empty
        }
        document.getElementById("date").value = date;   
    }, {
        onlyOnce: true
    });
}
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
        
        
        onValue(ref(db,dbpath+"/Inactive/"+uuid),snapshot=>{
            snapshot.forEach(e=>{
                if(e.key==="active"){
                    if(e.val()===true){
                        update(ref(db,dbpath+"/Active/"+uuid),{
                            name:name,
                            owner:ownername,
                            quantity:foodquantity,
                            
                        }).then(e=>{
                            localStorage.setItem("editkey", "foo");
                            console.log("success");
                            window.location.href = "./createnew.html";
                        })
                    }
                }else{
                    window.location.href = "./createnew.html";
                }
            })
        });

    }).catch(e => {

    });
}
export const CreateNewEntry = ()=>{
    let name = document.getElementById("name").value;
    let ownername = document.getElementById("owner").value;
    let sterile = document.getElementById("sterile").checked;
    let age = parseInt(document.getElementById("age").value);
    let foodquantity = parseFloat(document.getElementById("quantity").value);
    let date = document.getElementById("date").value;
    let sex = document.getElementById("sex").value;
    let uuid = editkey;
    if(editkey==="foo"){
        uuid = uuidV4();
    }
    InternalCreateNewEntry(ownername,name,sex,sterile,age,foodquantity,uuid,date);
}