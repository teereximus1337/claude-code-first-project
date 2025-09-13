import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { Providers } from './providers'

export const metadata = {
  title: 'Tasks & Calendar',
  description: 'A simple task management app with calendar integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#000', margin: 0, padding: 0 }} suppressHydrationWarning={true}>
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: '#6366f1',
              colorBackground: '#000000',
              colorInputBackground: '#111827',
              colorInputText: '#ffffff',
            },
            elements: {
              card: {
                backgroundColor: '#111827',
                border: '1px solid #374151',
              },
              headerTitle: {
                color: '#ffffff',
              },
              headerSubtitle: {
                color: '#9ca3af',
              },
              socialButtonsBlockButton: {
                backgroundColor: '#111827',
                border: '1px solid #374151',
                color: '#ffffff',
              },
              formButtonPrimary: {
                backgroundColor: '#6366f1',
                '&:hover': {
                  backgroundColor: '#5855eb',
                },
              },
            },
          }}
        >
          <Providers>
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}