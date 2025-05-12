import Image from 'next/image';

const Hero = () => {
  return (
    <div className="relative w-full h-[500px] md:h-[600px]">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image 
          src="/hero.jpg" 
          alt="Hero Background" 
          fill
          priority
          className="object-cover"
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 text-center">
          ローディングDXスクール
        </h1>
        <p className="text-xl md:text-2xl text-white opacity-90 max-w-3xl mx-auto text-center">
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
