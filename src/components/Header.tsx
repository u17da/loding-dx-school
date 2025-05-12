import Link from 'next/link';
import Image from 'next/image';

const Header = () => {
  return (
    <header className="bg-header text-white shadow-md">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <Image 
            src="/logo-yoko.png" 
            alt="ローディングDXスクール" 
            width={180} 
            height={60} 
            className="h-[60px] w-auto"
          />
        </Link>
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/submit" className="flex items-center hover:opacity-80 transition-opacity">
            <Image 
              src="/post.png" 
              alt="事例投稿" 
              width={32} 
              height={32} 
              className="h-8 w-8"
            />
            <span className="ml-2 text-white">事例投稿</span>
          </Link>
          <Link href="#" className="flex items-center hover:opacity-80 transition-opacity">
            <Image 
              src="/contact.png" 
              alt="問合せ" 
              width={32} 
              height={32} 
              className="h-8 w-8"
            />
            <span className="ml-2 text-white">問合せ</span>
          </Link>
        </div>
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
