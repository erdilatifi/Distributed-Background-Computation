import type { AppProps } from "next/app"
import "../styles/globals.css"

export default function App({ Component, pageProps }: AppProps) {
  // Type assertion to fix React 18 compatibility with Next.js
  const ComponentToRender = Component as any
  return <ComponentToRender {...pageProps} />
}
