addEventListener("DOMContentLoaded", (event) => { 
    let path = localStorage.getItem("dbpath");
    if(path==null||path==undefined){
        window.location.href = "login.html";
    }else{

        if (window.location.href.toString().includes("index.html") || window.location.pathname==="/"){
            window.location.href = localStorage.getItem("redirect");
        }
    }
});