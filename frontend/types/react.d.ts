import 'react'

declare module 'react' {
  // Extend ReactNode to be compatible with async components
  type ReactNode =
    | React.ReactElement
    | string
    | number
    | Iterable<React.ReactNode>
    | React.ReactPortal
    | boolean
    | null
    | undefined
    | Promise<React.ReactNode>
}
