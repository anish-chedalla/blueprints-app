import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-12">
      <div className="container mx-auto px-6">
        <div className="mb-8 grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 font-semibold">About</h3>
            <p className="text-sm text-muted-foreground">
              Blueprints helps Arizona small businesses find funding they can actually pursue.
              Live federal grants, reviewed local programs, and vetted loans in one place.
            </p>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Find funding</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/grants" className="hover:text-foreground">Grants</Link></li>
              <li><Link to="/loans" className="hover:text-foreground">Loans</Link></li>
              <li><Link to="/idea-lab" className="hover:text-foreground">Idea Lab</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Tools</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/saved" className="hover:text-foreground">Saved Funding</Link></li>
              <li><Link to="/history" className="hover:text-foreground">History</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground">Terms</a></li>
              <li><a href="#" className="hover:text-foreground">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Blueprints. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
