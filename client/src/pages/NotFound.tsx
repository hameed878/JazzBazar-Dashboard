import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="mobile-shell flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-gray-800">Page not found</h1>
      <Link href="/" className="text-jb-red font-semibold underline">
        Go back home
      </Link>
    </div>
  );
}
