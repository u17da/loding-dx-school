import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-footer text-text-light">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">ローディングDXスクール</h3>
            <p>
              デジタルトランスフォーメーションの学習プラットフォーム
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">リンク</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  ホーム
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  コース
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  料金
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">お問い合わせ</h3>
            <p>
              お問い合わせはこちらからお願いします。
            </p>
            <div className="mt-4">
              <Link href="#" className="btn">
                お問い合わせフォーム
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} ローディングDXスクール. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
