// lib/cache.ts
import { db } from './firebase'
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp, deleteDoc } from 'firebase/firestore'
import { LoyverseAccount, DailyTaking } from '../app/types'

export interface CacheEntry {
  data: DailyTaking[]
  timestamp: number
  fromDate?: string
  accountId: string
  userId: string
}

export class OptimizedCache {
  private memoryCache = new Map<string, CacheEntry>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private readonly FIRESTORE_CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  constructor(private userId: string) {}

  // Generate cache key
  private getCacheKey(accountId: string, fromDate?: string): string {
    return `${accountId}-${fromDate || 'default'}`
  }

  // Level 1: Memory cache (instant)
  getFromMemory(accountId: string, fromDate?: string): CacheEntry | null {
    const key = this.getCacheKey(accountId, fromDate)
    const entry = this.memoryCache.get(key)
    
    if (entry && Date.now() - entry.timestamp < this.CACHE_DURATION) {
      console.log('🚀 Cache hit: Memory (instant)')
      return entry
    }
    
    if (entry) {
      this.memoryCache.delete(key)
    }
    return null
  }

  // Level 2: localStorage (fast)
  getFromLocalStorage(accountId: string, fromDate?: string): CacheEntry | null {
    try {
      const key = this.getCacheKey(accountId, fromDate)
      const stored = localStorage.getItem(`loyverse-cache-${key}`)
      if (!stored) return null

      const entry: CacheEntry = JSON.parse(stored)
      
      if (Date.now() - entry.timestamp < this.CACHE_DURATION) {
        console.log('⚡ Cache hit: localStorage (fast)')
        // Promote to memory cache
        this.memoryCache.set(key, entry)
        return entry
      }
      
      localStorage.removeItem(`loyverse-cache-${key}`)
      return null
    } catch (error) {
      console.error('localStorage cache error:', error)
      return null
    }
  }

  // Level 3: Firestore (persistent, real-time)
  async getFromFirestore(accountId: string, fromDate?: string): Promise<CacheEntry | null> {
    try {
      const key = this.getCacheKey(accountId, fromDate)
      const docRef = doc(db, 'users', this.userId, 'cache', key)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) return null
      
      const data = docSnap.data()
      const entry: CacheEntry = {
        data: data.data,
        timestamp: data.timestamp,
        fromDate: data.fromDate,
        accountId: data.accountId,
        userId: data.userId
      }
      
      if (Date.now() - entry.timestamp < this.FIRESTORE_CACHE_DURATION) {
        console.log('☁️ Cache hit: Firestore (persistent)')
        // Promote to memory and localStorage
        this.setInMemory(accountId, entry.data, fromDate)
        this.setInLocalStorage(accountId, entry.data, fromDate)
        return entry
      }
      
      return null
    } catch (error) {
      console.error('Firestore cache error:', error)
      return null
    }
  }

  // Set in memory cache
  setInMemory(accountId: string, data: DailyTaking[], fromDate?: string): void {
    const key = this.getCacheKey(accountId, fromDate)
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      fromDate,
      accountId,
      userId: this.userId
    }
    this.memoryCache.set(key, entry)
  }

  // Set in localStorage
  setInLocalStorage(accountId: string, data: DailyTaking[], fromDate?: string): void {
    try {
      const key = this.getCacheKey(accountId, fromDate)
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        fromDate,
        accountId,
        userId: this.userId
      }
      localStorage.setItem(`loyverse-cache-${key}`, JSON.stringify(entry))
    } catch (error) {
      console.error('localStorage set error:', error)
    }
  }

  // Set in Firestore
  async setInFirestore(accountId: string, data: DailyTaking[], fromDate?: string): Promise<void> {
    try {
      const key = this.getCacheKey(accountId, fromDate)
      const docRef = doc(db, 'users', this.userId, 'cache', key)
      
      await setDoc(docRef, {
        data,
        timestamp: Date.now(),
        fromDate,
        accountId,
        userId: this.userId,
        lastUpdated: serverTimestamp()
      })
    } catch (error) {
      console.error('Firestore set error:', error)
    }
  }

  // Set in all cache levels
  async setInAllCaches(accountId: string, data: DailyTaking[], fromDate?: string): Promise<void> {
    this.setInMemory(accountId, data, fromDate)
    this.setInLocalStorage(accountId, data, fromDate)
    await this.setInFirestore(accountId, data, fromDate)
  }

  // Get from any available cache level
  async getFromAnyCache(accountId: string, fromDate?: string): Promise<CacheEntry | null> {
    // Try memory first (instant)
    let entry = this.getFromMemory(accountId, fromDate)
    if (entry) return entry

    // Try localStorage (fast)
    entry = this.getFromLocalStorage(accountId, fromDate)
    if (entry) return entry

    // Try Firestore (persistent)
    entry = await this.getFromFirestore(accountId, fromDate)
    if (entry) return entry

    return null
  }

  // Clear all caches for an account
  async clearAccount(accountId: string): Promise<void> {
    // Clear memory - using Array.from to avoid iteration issues
    const keysToDelete = Array.from(this.memoryCache.keys()).filter(key => key.startsWith(accountId))
    keysToDelete.forEach(key => this.memoryCache.delete(key))

    // Clear localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && key.includes(`loyverse-cache-${accountId}`)) {
        localStorage.removeItem(key)
      }
    }

    // Clear Firestore
    try {
      const q = query(
        collection(db, 'users', this.userId, 'cache'),
        where('accountId', '==', accountId)
      )
      const querySnapshot = await getDocs(q)
      
      for (const docSnapshot of querySnapshot.docs) {
        await deleteDoc(docSnapshot.ref)
      }
    } catch (error) {
      console.error('Error clearing Firestore cache:', error)
    }
  }

  // Clear all caches
  async clearAll(): Promise<void> {
    this.memoryCache.clear()
    
    // Clear localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && key.startsWith('loyverse-cache-')) {
        localStorage.removeItem(key)
      }
    }

    // Clear Firestore
    try {
      const q = query(collection(db, 'users', this.userId, 'cache'))
      const querySnapshot = await getDocs(q)
      
      for (const docSnapshot of querySnapshot.docs) {
        await deleteDoc(docSnapshot.ref)
      }
    } catch (error) {
      console.error('Error clearing all Firestore cache:', error)
    }
  }
}