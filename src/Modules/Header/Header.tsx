import { Link } from "../../Common/Components/Core/Link";
import ExternalLink from "../../Common/Components/ExternalLink/ExternalLink";

export default function Header() {
  // FIXME: Crap just to see if its build
  let isHomeActive, isBlogActive, isPhotosActive;
  return (
    <header className="metro-header">
      <div className="metro-header-row">
        <nav className="metro-pivot" aria-label="Primary">
          <Link
            // href={homeHref}
            className={`pivot-item ${isHomeActive ? "is-active" : ""}`.trim()}
          >
            Home
          </Link>
          <Link
            // href={blogHref}
            className={`pivot-item ${isBlogActive ? "is-active" : ""}`.trim()}
          >
            Blog
          </Link>
          <Link
            // href={photosHref}
            className={`pivot-item ${isPhotosActive ? "is-active" : ""}`.trim()}
          >
            Photos
          </Link>

          <ExternalLink
            href="https://github.com/powerm1nt"
            label="GitHub"
            className="pivot-item pivot-item-external"
          >
            GitHub
          </ExternalLink>
          <ExternalLink
            href="https://www.linkedin.com/in/lchab1440/"
            label="LinkedIn"
            className="pivot-item pivot-item-external"
          >
            LinkedIn
          </ExternalLink>
        </nav>

        {/* <Link
          href={"/"}
          className="metro-avatar-tile"
          aria-label="Home"
          title="Emi"
        >
          <HeadlineLogo />
        </Link> */}
      </div>
    </header>
  );
}
