module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.openai.com', // OpenAIの画像URLを許可
      },
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net', // DALL-E APIの画像URLを許可
      },
    ],
  },
};
