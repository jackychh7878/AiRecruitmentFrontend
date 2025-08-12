import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="border-b border-gray-200 pb-5 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-4xl text-sm text-gray-500">{description}</p>}
        </div>
        {children && <div className="flex items-center space-x-3">{children}</div>}
      </div>
    </div>
  )
}
