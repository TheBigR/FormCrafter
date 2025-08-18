# FormCrafter - Dynamic Form Builder

A powerful Next.js application that allows admins to create dynamic forms with automatic endpoint generation. Built with TypeScript, Tailwind CSS, and Neon PostgreSQL.

## Features

- 🎨 **Drag & Drop Form Builder** - Intuitive interface for creating forms
- 🔗 **Automatic Endpoint Generation** - Each form gets a unique public URL
- 📊 **Real-time Analytics** - Track form submissions and performance
- 📱 **Responsive Design** - Works perfectly on all devices
- 🚀 **Vercel Ready** - Optimized for deployment on Vercel
- 💾 **Neon PostgreSQL** - Serverless database with generous free tier

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Database**: Neon PostgreSQL (serverless)
- **Deployment**: Vercel
- **Styling**: Tailwind CSS with custom components

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Neon database account (free at [neon.tech](https://neon.tech))

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd FormCrafter
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Neon Database

1. Go to [console.neon.tech](https://console.neon.tech) and create a free account
2. Create a new project
3. Copy your connection string from the dashboard
4. Create a `.env.local` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"
```

### 4. Initialize Database Schema

1. Copy the SQL from `src/lib/schema.sql`
2. Go to your Neon dashboard → SQL Editor
3. Paste and run the schema to create the necessary tables

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### Creating Forms

1. Navigate to `/create` to access the form builder
2. Add a title and description for your form
3. Click on field types in the sidebar to add them to your form
4. Customize each field's properties (label, placeholder, required status, etc.)
5. Click "Save Form" to create the form and get a public URL

### Public Form URLs

Each saved form gets a unique URL like:
```
https://yourdomain.com/form/contact-form-123456
```

Share this URL with your customers to collect responses.

### Managing Forms

- **Dashboard** (`/`) - Overview of all forms and statistics
- **Forms** (`/forms`) - List and manage all created forms
- **Submissions** (`/submissions`) - View and export form responses

## Database Schema

### Forms Table
- `id` - Unique identifier (UUID)
- `title` - Form title
- `description` - Form description
- `fields` - JSON array of form fields
- `slug` - URL-friendly identifier
- `is_active` - Whether the form is active
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Form Submissions Table
- `id` - Unique identifier (UUID)
- `form_id` - Reference to the form
- `data` - JSON object of submitted data
- `ip_address` - Submitter's IP address
- `user_agent` - Submitter's browser info
- `submitted_at` - Submission timestamp

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your `DATABASE_URL` environment variable in Vercel dashboard
4. Deploy!

### Environment Variables

Make sure to set these in your Vercel dashboard:
- `DATABASE_URL` - Your Neon database connection string

## API Endpoints

### Forms
- `POST /api/forms` - Create a new form
- `GET /api/forms` - Get all forms
- `GET /api/forms/[slug]` - Get a specific form by slug
- `POST /api/forms/[slug]` - Submit form data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact the development team.
