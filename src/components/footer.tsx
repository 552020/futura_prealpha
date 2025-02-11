export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col items-center gap-4">
          {/* Links */}
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-900 dark:hover:text-gray-300">
              Contact
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-gray-300">
              About
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-gray-300">
              X
            </a>
          </div>

          {/* Tagline */}
          <p className="text-sm text-gray-500">Made with ❤️ between Berlin, Marseille, Riga and Lisbon</p>
        </div>
      </div>
    </footer>
  );
}
