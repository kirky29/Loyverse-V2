// lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBioUmJ8k48bxYMJxAJqsD7e7b60s8RHFc",
  authDomain: "loyverse-sync.firebaseapp.com",
  projectId: "loyverse-sync",
  storageBucket: "loyverse-sync.firebasestorage.app",
  messagingSenderId: "10117650823",
  appId: "1:10117650823:web:1fdbf6ccc5dcd176661b22"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const db = getFirestore(app)
export const auth = getAuth(app)

export default app
