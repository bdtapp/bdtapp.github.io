
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBzjJ6wmc-OkVoEfWn2SXQX5HWInlrv-q4",
    authDomain: "bdtwebapp.firebaseapp.com",
    databaseURL: "https://bdtwebapp-default-rtdb.firebaseio.com",
    projectId: "bdtwebapp",
    storageBucket: "bdtwebapp.appspot.com",
    messagingSenderId: "315285039462",
    appId: "1:315285039462:web:5fccff153213033cc680a7"
};
/*
const firebaseConfig = {
    apiKey: "AIzaSyBxDTEmUvnytKC9nU5HQU1yDOCnQsSl3QQ",
    authDomain: "testdb-a5b32.firebaseapp.com",
    databaseURL: "https://testdb-a5b32-default-rtdb.firebaseio.com",
    projectId: "testdb-a5b32",
    storageBucket: "testdb-a5b32.firebasestorage.app",
    messagingSenderId: "933418442366",
    appId: "1:933418442366:web:9d5d1fc7a1174d59d3c22f"
  };
  */
const app = initializeApp(firebaseConfig);