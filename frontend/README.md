# Frontend - Next.js with shadcn/ui

Modern, accessible UI built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui components.

## 🎨 Tech Stack

- **Framework**: Next.js 14.1.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.3.5
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Animations**: tailwindcss-animate

## 📦 Components

All components are located in `components/ui/`:

- **Button** - Versatile button with multiple variants (default, destructive, outline, ghost, link)
- **Card** - Container component with Header, Title, Description, Content, and Footer
- **Input** - Styled form input with focus states
- **Label** - Accessible form labels
- **Progress** - Animated progress bar using Radix UI

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🎯 Features

- **Dark Theme** - Beautiful dark color scheme optimized for readability
- **Responsive** - Works seamlessly on mobile, tablet, and desktop
- **Accessible** - Built on Radix UI primitives for WCAG compliance
- **Type-safe** - Full TypeScript support
- **Customizable** - Easy theme customization via CSS variables

## 🔧 Configuration

### Path Aliases
```typescript
// Import components using @/ alias
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```

### Theme Customization
Edit `styles/globals.css` to modify colors:
```css
:root {
  --primary: 217.2 91.2% 59.8%;
  --background: 222.2 84% 4.9%;
  /* ... more variables */
}
```

### Tailwind Config
Customize in `tailwind.config.js`:
- Add custom colors
- Modify breakpoints
- Add animations
- Configure plugins

## 📁 Project Structure

```
frontend/
├── components/
│   └── ui/              # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── progress.tsx
├── lib/
│   └── utils.ts         # Utility functions
├── pages/
│   ├── _app.tsx         # App wrapper
│   └── index.tsx        # Main page
├── styles/
│   └── globals.css      # Global styles & theme
├── components.json      # shadcn/ui config
├── tailwind.config.js   # Tailwind configuration
└── tsconfig.json        # TypeScript config
```

## 🎨 Component Usage Examples

### Button
```tsx
<Button variant="default" size="lg">
  Click me
</Button>

<Button variant="destructive">
  Delete
</Button>

<Button variant="outline" disabled>
  Disabled
</Button>
```

### Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>
```

### Progress
```tsx
<Progress value={75} className="h-3" />
```

## 🌐 Environment Variables

Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📝 Notes

- The TypeScript errors in the IDE about missing modules will resolve after `npm install`
- CSS warnings about `@tailwind` directives are expected and can be ignored
- All components use the `cn()` utility for className merging

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com)
