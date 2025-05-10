import Hero from "@/components/Hero";

export default function Home() {
  return (
    <>
      <Hero />
      <div className="container mx-auto px-4 py-12">
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
            DXスキルを身につけよう
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-blue-600">基礎コース</h3>
              <p className="text-gray-600">
                デジタルトランスフォーメーションの基礎知識を学びます。初心者向けのコースです。
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-blue-600">応用コース</h3>
              <p className="text-gray-600">
                実践的なDXスキルを身につけるための応用コースです。基礎知識がある方向けです。
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-blue-600">専門コース</h3>
              <p className="text-gray-600">
                特定の業界や分野に特化したDX専門知識を学ぶコースです。
              </p>
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
            なぜローディングDXスクールなのか
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>実践的なカリキュラム</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>業界のプロフェッショナルによる指導</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>柔軟な学習スケジュール</span>
                </li>
              </ul>
            </div>
            <div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>最新のDX技術とトレンド</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>修了証の発行</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>キャリアサポート</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
