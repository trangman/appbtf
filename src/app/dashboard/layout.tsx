'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon, 
  UserIcon, 
  PhoneIcon,
  BookOpenIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import ThemeToggle from '@/components/ThemeToggle'

const baseNavigation = [
  { name: 'Legal Briefs', href: '/dashboard', icon: DocumentTextIcon },
  { name: 'Ask the Expert', href: '/dashboard/ai-assistant', icon: ChatBubbleLeftRightIcon },
  { name: 'Contact', href: '/dashboard/contact', icon: PhoneIcon },
  { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
]

const adminNavigation = [
  { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: BookOpenIcon },
]

function getNavigationItems(isAdmin: boolean) {
  return isAdmin ? [...baseNavigation, ...adminNavigation] : baseNavigation
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Check if user is admin
  const user = session?.user as any
  const isAdmin = user?.isAdmin || false
  const navigation = getNavigationItems(isAdmin)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-blue-400"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-900">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">          
            <div className="px-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Legal Briefs Thailand</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Role: {user?.role?.replace('_', ' ') || 'User'}</p>
            </div>
            <nav className="mt-8 px-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300" />
                  {item.name}
                </Link>
              ))}
              
              {/* Theme Toggle Button */}
              <ThemeToggle variant="sidebar" className="text-base mr-4" />
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={handleSignOut}
              className="flex-shrink-0 w-full group block"
            >
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-base font-medium text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white">
                    Sign out
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="px-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Legal Briefs Thailand</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Role: {user?.role?.replace('_', ' ') || 'User'}</p>
            </div>
            <nav className="mt-8 flex-1 px-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                >
                  <item.icon className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300" />
                  {item.name}
                </Link>
              ))}
              
              {/* Theme Toggle Button */}
              <ThemeToggle variant="sidebar" />
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={handleSignOut}
              className="flex-shrink-0 w-full group block"
            >
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white">
                    {user?.name || user?.email || 'User'}
                  </p>
                  <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300">
                    Sign out
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1 w-full min-w-0">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6">
                      <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                className="h-10 w-10 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white truncate">
                Legal Briefs Thailand
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                {user?.role?.replace('_', ' ') || 'User'}
              </div>
              {/* Theme Toggle Button */}
              <ThemeToggle />
            </div>
          </div>
        </div>
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutContent>{children}</DashboardLayoutContent>
} 