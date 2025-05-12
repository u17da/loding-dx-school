import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-footer text-text-light">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center md:items-start">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="flex items-center">
              <Image 
                src="/logo-yoko.png" 
                alt="ローディングDXスクール" 
                width={150} 
                height={50} 
                className="h-[50px] w-auto"
              />
            </Link>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-6 pt-6">
          <p className="text-sm text-gray-600 text-center">&copy; 2025 ローディングDXスクール All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
