'use client'

interface LogoHeaderProps {
  className?: string
}

export default function LogoHeader({ className = "mb-8" }: LogoHeaderProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      <div className="w-48 h-16 flex items-center justify-center">
        {/* Use the btf-white.svg file as requested */}
        <img
          src="/btf-white.svg"
          alt="Better Than Freehold"
          width={192}
          height={64}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
      </div>
    </div>
  )
}
