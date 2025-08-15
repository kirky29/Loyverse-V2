// lib/accountService.ts
import { db } from './firebase'
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore'
import { LoyverseAccount } from '../app/types'

export class AccountService {
  constructor(private userId: string) {}

  // Save accounts to both localStorage and Firestore
  async saveAccounts(accounts: LoyverseAccount[]): Promise<void> {
    try {
      // Save to localStorage for instant access
      localStorage.setItem('loyverse-accounts', JSON.stringify(accounts))
      
      // Save to Firestore for sync across devices
      for (const account of accounts) {
        await setDoc(doc(db, 'users', this.userId, 'accounts', account.id), {
          ...account,
          updatedAt: Date.now()
        })
      }
    } catch (error) {
      console.error('Error saving accounts:', error)
    }
  }

  // Load accounts from Firestore (with localStorage fallback)
  async loadAccounts(): Promise<LoyverseAccount[]> {
    try {
      // Try Firestore first for most up-to-date data
      const accountsRef = collection(db, 'users', this.userId, 'accounts')
      const snapshot = await getDocs(accountsRef)
      
      if (!snapshot.empty) {
        const firestoreAccounts = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: data.id,
            name: data.name,
            apiToken: data.apiToken,
            storeId: data.storeId,
            isActive: data.isActive || false
          } as LoyverseAccount
        })
        
        // Update localStorage with Firestore data
        localStorage.setItem('loyverse-accounts', JSON.stringify(firestoreAccounts))
        return firestoreAccounts
      }
      
      // Fallback to localStorage
      const localAccounts = localStorage.getItem('loyverse-accounts')
      if (localAccounts) {
        const accounts = JSON.parse(localAccounts)
        // Sync to Firestore if we found local data
        await this.saveAccounts(accounts)
        return accounts
      }
      
      return []
    } catch (error) {
      console.error('Error loading accounts:', error)
      
      // Final fallback to localStorage only
      try {
        const localAccounts = localStorage.getItem('loyverse-accounts')
        return localAccounts ? JSON.parse(localAccounts) : []
      } catch {
        return []
      }
    }
  }

  // Delete account from both storage locations
  async deleteAccount(accountId: string): Promise<void> {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', this.userId, 'accounts', accountId))
      
      // Update localStorage
      const localAccounts = localStorage.getItem('loyverse-accounts')
      if (localAccounts) {
        const accounts = JSON.parse(localAccounts).filter((acc: LoyverseAccount) => acc.id !== accountId)
        localStorage.setItem('loyverse-accounts', JSON.stringify(accounts))
      }
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }
}
