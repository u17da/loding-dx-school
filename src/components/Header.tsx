import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">
          ローディングDXスクール
        </Link>
        <nav className="hidden md:flex space-x-6">
          <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
            ホーム
          </Link>
          <Link href="#" className="text-gray-700 hover:text-blue-600 transition-colors">
            コース
          </Link>
          <Link href="#" className="text-gray-700 hover:text-blue-600 transition-colors">
            料金
          </Link>
          <Link href="#" className="text-gray-700 hover:text-blue-600 transition-colors">
            お問い合わせ
          </Link>
        </nav>
        <div className="md:hidden">
          <button className="text-gray-700 hover:text-blue-600 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
