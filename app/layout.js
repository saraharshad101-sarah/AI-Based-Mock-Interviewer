import "./globals.css";

export const metadata = {
  title: "AI Mock Interviewer",
  description: "Adaptive AI-driven mock interview practice with instant feedback.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <span className="logo-dot" />
            <span className="app-title">AI Mock Interviewer</span>
          </header>
          <main>{children}</main>
          <footer className="app-footer">
            Powered by OpenAI &middot; Sessions saved with Firebase
          </footer>
        </div>
      </body>
    </html>
  );
}
