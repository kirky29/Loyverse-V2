// lib/auth.ts
import { auth, db } from './firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  User,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'

export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  createdAt: number
  lastLogin: number
}

// Sign in
export const signIn = async (email: string, password: string): Promise<User> => {
  const result = await signInWithEmailAndPassword(auth, email, password)
  await updateLastLogin(result.user.uid)
  return result.user
}

// Sign up
export const signUp = async (email: string, password: string): Promise<User> => {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  await createUserProfile(result.user)
  return result.user
}

// Sign out
export const logOut = async (): Promise<void> => {
  await signOut(auth)
}

// Create user profile in Firestore
const createUserProfile = async (user: User): Promise<void> => {
  try {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || undefined,
      createdAt: Date.now(),
      lastLogin: Date.now()
    }

    await setDoc(doc(db, 'users', user.uid), userProfile)
  } catch (error) {
    console.error('Error creating user profile:', error)
  }
}

// Update last login
const updateLastLogin = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      await setDoc(userRef, { lastLogin: Date.now() }, { merge: true })
    }
  } catch (error) {
    console.error('Error updating last login:', error)
  }
}

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback)
}
