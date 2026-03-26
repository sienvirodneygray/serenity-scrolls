import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Serenity Scrolls Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBijg1FDioOYpo8DjV-l-xeWfCCS-fUpJU",
  authDomain: "serenity-scrolls-bcf4d.firebaseapp.com",
  projectId: "serenity-scrolls-bcf4d",
  storageBucket: "serenity-scrolls-bcf4d.firebasestorage.app",
  messagingSenderId: "1026988345804",
  appId: "1:1026988345804:web:525708cf5a2bab2f47f569",
  measurementId: "G-S6617XNVHV",
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser, not during SSR)
let analytics: ReturnType<typeof getAnalytics> | null = null;

isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(firebaseApp);
  }
});

export { analytics };
