import { ImageResponse } from "next/og"

export const size = {
  width: 64,
  height: 64,
}

export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#0f172a",
          color: "#22d3ee",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        DB
      </div>
    ),
    size,
  )
}
