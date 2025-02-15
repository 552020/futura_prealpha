export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4">
        <div className="flex flex-col items-center gap-2 sm:gap-4">
          {/* Links */}
          <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
            <a href="#" className="hover:text-gray-900 dark:hover:text-gray-300 py-1">
              Contact
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-gray-300 py-1">
              About
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-gray-300 py-1">
              X
            </a>
          </div>

          {/* Tagline - hidden on mobile */}
          <p className="hidden sm:block text-xs sm:text-sm text-gray-500">
            Made with ❤️ between Berlin, Marseille and Lisbon
          </p>
        </div>
      </div>
    </footer>
  );
}
