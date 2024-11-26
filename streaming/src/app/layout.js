import Header from "@/components/Header";

// src/app/layout.js
export const metadata = {
  title: 'My Streaming Site',
  description: 'Stream your favorite content here!',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="h-full">
        <main className="h-full">{children}</main>
      </body>
    </html>
  );
}
