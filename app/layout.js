import "./globals.css";
import Link from "next/link";

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
            <Link className="brand-link" href="/">
              <span className="logo-mark" aria-hidden="true">MI</span>
              <span className="app-title">AI Mock Interviewer</span>
            </Link>
          </header>
          <main>{children}</main>
          <footer className="app-footer">
            AI feedback by Groq &middot; Sessions saved with Firebase
          </footer>
        </div>
      </body>
    </html>
  );
}
