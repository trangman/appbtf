'use client'

import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/lib/theme-context'

interface ThemeToggleProps {
  variant?: 'sidebar' | 'header'
  className?: string
}

export default function ThemeToggle({ variant = 'header', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  if (variant === 'sidebar') {
    return (
      <button
        onClick={toggleTheme}
        className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 ${className}`}
      >
        {theme === 'light' ? (
          <MoonIcon className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300" />
        ) : (
          <SunIcon className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300" />
        )}
        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className={`h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${className}`}
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      {theme === 'light' ? (
        <MoonIcon className="h-5 w-5" />
      ) : (
        <SunIcon className="h-5 w-5" />
      )}
    </button>
  )
} 