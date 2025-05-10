# ローディングDXスクール (Loading DX School)

A Next.js 14 application with TypeScript and Tailwind CSS for ローディングDXスクール (Loading DX School).

## Features

- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Supabase integration for backend database
- Responsive design (mobile and desktop friendly)
- ESLint and Prettier for code formatting

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/u17da/loding-dx-school.git
cd loding-dx-school
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```
Then edit `.env.local` with your Supabase credentials.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Deployment

The application is configured to deploy automatically to Vercel using GitHub Actions. Push to the main branch to trigger a deployment.

### Required Secrets for GitHub Actions

To enable automatic deployment to Vercel, add the following secrets to your GitHub repository:

- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

## License

See the [LICENSE](LICENSE) file for details.
