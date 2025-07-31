// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2NsTbLeap4wrzUarAW2pQYf3YaStYPqo",
  authDomain: "testpoint-81a9a.firebaseapp.com",
  projectId: "testpoint-81a9a",
  storageBucket: "testpoint-81a9a.firebasestorage.app",
  messagingSenderId: "953282742732",
  appId: "1:953282742732:web:874ad2ba31236d123b3569"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export { app };
