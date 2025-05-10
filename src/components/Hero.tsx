const Hero = () => {
  return (
    <div className="bg-gradient-to-r from-primary to-header py-20 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          ローディングDXスクール
        </h1>
        <p className="text-xl md:text-2xl text-white opacity-90 max-w-3xl mx-auto">
          デジタルトランスフォーメーションの未来を創る学習プラットフォーム
        </p>
        <div className="mt-8">
          <button className="btn bg-white text-primary hover:bg-gray-100 px-6 py-3 text-lg shadow-lg">
            コースを見る
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
