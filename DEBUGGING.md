# 🚀 App Startup & Debugging Guide

  ## Current Status

  ✅ Database schema defined (11 tables)
  ✅ API routes implemented (40+ endpoints)
  ✅ Mobile screens created (6 screens)
  ✅ Color system configured
  ✅ Navigation set up (Expo Router with tabs)

  ## What Was Fixed

  ### 1. Server Routes
  - ✅ Fixed `registerRoutes` to return Express app
  - ✅ Updated `server/index.ts` to handle app correctly
  - ✅ Added database connection check on startup

  ### 2. Dependencies
  - ✅ Added `date-fns` for date formatting
  - ✅ Added `@react-native-community/datetimepicker` for date picking
  - ✅ All required packages in package.json

  ### 3. Database
  - ✅ PostgreSQL connection configured
  - ✅ Schema defined with proper types
  - ✅ Seed script created for educational resources
  - ✅ Migration command available (`npm run db:push`)

  ### 4. App Configuration
  - ✅ Updated app.json with proper branding
  - ✅ Color palette configured
  - ✅ TypeScript paths configured (@/ and @shared/)

  ## How to Start the App

  ### 1. Push Database Schema (if not already done)
  ```bash
  npm run db:push
  ```

  ### 2. Seed the Database (optional but recommended)
  ```bash
  npm run db:seed
  ```

  ### 3. Start the Development Server
  The app should start automatically via Replit. If not:

  ```bash
  # Terminal 1: Start the backend server
  npm run server:dev

  # Terminal 2: Start Expo
  npm run expo:dev
  ```

  ### 4. Open on Your Device
  - Install Expo Go on your mobile device
  - Scan the QR code shown in the terminal
  - The app will load on your device

  ## Common Issues & Solutions

  ### Issue: "Cannot find module '@shared/schema'"
  **Solution:** TypeScript paths are configured. Make sure you restart the TypeScript server or rebuild.

  ### Issue: "Database connection error"
  **Solution:** 
  1. Check that DATABASE_URL is set in environment variables
  2. Run `npm run db:push` to create tables
  3. Verify PostgreSQL is running

  ### Issue: "Module not found: date-fns"
  **Solution:**
  ```bash
  npm install date-fns @react-native-community/datetimepicker
  ```

  ### Issue: App shows white screen
  **Solution:**
  1. Check the Expo logs for errors
  2. Make sure all imports are correct
  3. Try clearing cache: `npx expo start --clear`

  ### Issue: "No children found" on dashboard
  **Solution:** This is expected on first launch. Tap "Add Child" to create your first child profile.

  ## Testing the API

  You can test the API endpoints directly:

  ```bash
  # Get all children
  curl http://localhost:5000/api/children

  # Create a child
  curl -X POST http://localhost:5000/api/children \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Baby","dateOfBirth":"2024-01-01T00:00:00Z"}'

  # Get educational resources
  curl http://localhost:5000/api/resources
  ```

  ## File Structure

  ```
  ├── app/                    # React Native app
  │   ├── (tabs)/            # Tab screens
  │   │   ├── index.tsx      # Dashboard
  │   │   ├── tracking.tsx   # Tracking logs
  │   │   ├── milestones.tsx # Milestones
  │   │   ├── health.tsx     # Health records
  │   │   └── resources.tsx  # Educational resources
  │   ├── _layout.tsx        # Root layout
  │   └── add-child.tsx      # Add child modal
  ├── server/                 # Backend
  │   ├── index.ts           # Server entry point
  │   ├── routes.ts          # API routes
  │   ├── db.ts              # Database connection
  │   ├── seed.ts            # Database seeder
  │   └── startup-check.ts   # Startup verification
  ├── shared/                 # Shared code
  │   └── schema.ts          # Database schema
  └── constants/              # App constants
      └── colors.ts          # Color palette
  ```

  ## Next Steps After Successful Start

  1. **Add Your First Child**
     - Open the app
     - Tap "Add Child"
     - Enter name and date of birth
     - Save

  2. **Start Tracking**
     - Use quick action buttons on dashboard
     - Or go to Tracking tab
     - Log feeding, diaper, sleep, medicine

  3. **Explore Features**
     - Check Milestones tab
     - View Health records
     - Read Educational resources

  4. **Customize**
     - Adjust colors in `constants/colors.ts`
     - Modify app name in `app.json`
     - Add more educational resources via seed script

  ## Debugging Tips

  ### View Server Logs
  The server logs will show:
  - API requests and responses
  - Database queries
  - Any errors

  ### View Expo Logs
  The Expo terminal shows:
  - Component rendering
  - JavaScript errors
  - Network requests

  ### Database Inspection
  ```bash
  # Connect to PostgreSQL
  psql $DATABASE_URL

  # List tables
  \dt

  # View data
  SELECT * FROM educational_resources;
  SELECT * FROM children;
  ```

  ## Support

  If you encounter issues:
  1. Check the error message carefully
  2. Verify all environment variables are set
  3. Try restarting the development server
  4. Clear Expo cache
  5. Check the debugging tips above

  ---

  **Your Parenting Companion app is ready! 🎉**
  