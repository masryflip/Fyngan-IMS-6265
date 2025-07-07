import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import SignIn from '../pages/SignIn'
import * as FiIcons from 'react-icons/fi'
import SafeIcon from '../common/SafeIcon'

const { FiRefreshCw } = FiIcons

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth()
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    if (!loading) {
      setInitialLoad(false)
    }
  }, [loading])

  if (loading || initialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <SafeIcon icon={FiRefreshCw} className="animate-spin text-4xl text-coffee-600 mb-4 mx-auto" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // For development/demo purposes, skip authentication
  if (process.env.NODE_ENV === 'development' || !user) {
    // Skip authentication in development or if no user is signed in
    // This allows the app to work without requiring sign-in
    return children
  }

  return children
}