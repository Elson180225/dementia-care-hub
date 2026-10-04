import { Link } from "react-router-dom";

function NotFound() {
return (
    <main className="page">
    <div className="page-container">
        <h1>Page not found</h1>

        <p>
        The page you are looking for may have moved or may no longer exist.
        </p>

        <Link to="/">Return to homepage</Link>
    </div>
    </main>
);
}

export default NotFound;