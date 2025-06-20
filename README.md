# 🕌 Prayer Times Calendar Generator

A modern web application that generates ICS calendar files for Islamic prayer times, which can be imported into any calendar application. Built with Next.js 15, TypeScript, and Tailwind CSS.

## ✨ Features

- **📅 ICS Calendar Generation**: Create importable calendar files with prayer times
- **🌍 Multi-language Support**: Available in Turkish and English
- **🏙️ City Selection**: Pre-configured with major Turkish cities or custom city ID input
- **📱 Responsive Design**: Works perfectly on desktop and mobile devices
- **⚡ Fast Performance**: Built with Next.js 15 and optimized for speed
- **📆 Flexible Duration**: Generate calendars for 1-365 days

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd namaz-vakti-ics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Ezan Vakti API Configuration
   API_URL=https://ezanvakti.herokuapp.com
   API_PASS=your_api_password_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_URL` | Ezan Vakti API base URL | `https://ezanvakti.emushaf.net` | No |
| `API_PASS` | API password for authenticated requests | - | No |

### API Endpoints

- **GET** `/api/times-ics` - Generate ICS calendar file
  - Query Parameters:
    - `countryID` (required): Country ID from Ezan Vakti API
    - `cityID` (optional): Backward compatibility support for city ID
    - `lang` (optional): Language (`tr` or `en`, default: `tr`)
    - `days` (optional): Number of days (1-365, default: 30)

### Example API Usage

```bash
# Generate 30-day calendar for Turkey in Turkish
curl "http://localhost:3000/api/times-ics?countryID=2&lang=tr&days=30"

# Generate 7-day calendar for Germany in English
curl "http://localhost:3000/api/times-ics?countryID=13&lang=en&days=7"

# Backward compatibility with cityID parameter
curl "http://localhost:3000/api/times-ics?cityID=2&lang=tr&days=30"
```

## 🏙️ Supported Cities

The app comes pre-configured with major Turkish cities:

| City | Province | ID |
|------|----------|-----|
| Istanbul | İstanbul | 9541 |
| Ankara | Ankara | 9206 |
| Izmir | İzmir | 9335 |
| Bursa | Bursa | 9117 |
| Antalya | Antalya | 9099 |
| Adana | Adana | 9106 |
| Konya | Konya | 9364 |
| Gaziantep | Gaziantep | 9479 |
| Kayseri | Kayseri | 9522 |
| Mersin | Mersin | 9225 |
| Eskisehir | Eskişehir | 9518 |
| Trabzon | Trabzon | 9542 |

For other cities, you can find the city ID from the Ezan Vakti API documentation.

## 📱 How to Use

1. **Select a City**: Choose from the dropdown or enter a custom city ID
2. **Choose Language**: Select Turkish or English for prayer names
3. **Set Duration**: Choose how many days of prayer times to generate (1-365)
4. **Generate Calendar**: Click the generate button to download the ICS file
5. **Import to Calendar**: Import the downloaded file into your calendar app

### Importing to Different Calendar Apps

#### iPhone/iPad (iOS Calendar)
1. Email the ICS file to yourself or save it to Files app
2. Tap the ICS file
3. Tap "Add All" to import events

#### Google Calendar
1. Open Google Calendar on web
2. Click the "+" next to "Other calendars"
3. Select "Import"
4. Choose your ICS file and calendar
5. Click "Import"

#### Outlook
1. Open Outlook
2. Go to Calendar view
3. Click "Add calendar" > "Upload from file"
4. Select your ICS file

## 🔧 Development

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── times-ics/
│   │       └── route.ts          # API endpoint for ICS generation
│   ├── globals.css               # Global styles
│   ├── layout.tsx               # Root layout component
│   ├── page.tsx                 # Main page component
│   └── favicon.ico              # App icon
├── package.json                 # Dependencies and scripts
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── next.config.ts              # Next.js configuration
```

### Built With

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Luxon](https://moment.github.io/luxon/)** - Date and time handling
- **[ICS](https://www.npmjs.com/package/ics)** - Calendar file generation

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Prayer times data provided by [Ezan Vakti API](https://ezanvakti.herokuapp.com)
- Islamic calendar calculations
- Turkish Directorate of Religious Affairs for accurate prayer time calculations

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/namaz-vakti-ics/issues) page
2. Create a new issue with detailed information
3. Include your browser version, operating system, and steps to reproduce

---

**May Allah accept your prayers** 🤲

Made with ❤️ for the Muslim community
