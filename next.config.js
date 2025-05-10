module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.openai.com', // OpenAIの画像URLを許可
      },
    ],
  },
};
