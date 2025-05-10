import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-header text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-white text-center mx-auto md:mx-0">
          ローディングDXスクール
        </Link>
        <nav className="hidden md:flex space-x-6">
          <Link href="/" className="text-white hover:text-accent transition-colors">
            ホーム
          </Link>
          <Link href="#" className="text-white hover:text-accent transition-colors">
            コース
          </Link>
          <Link href="#" className="text-white hover:text-accent transition-colors">
            料金
          </Link>
          <Link href="/submit" className="text-white hover:text-accent transition-colors">
            事例提出
          </Link>
          <Link href="#" className="text-white hover:text-accent transition-colors">
            お問い合わせ
          </Link>
        </nav>
        <div className="md:hidden">
          <button className="text-white hover:text-accent focus:outline-none">
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
