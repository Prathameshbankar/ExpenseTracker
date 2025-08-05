# Firebase Setup Guide for Expense Tracker

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "expense-tracker")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Firestore Database

1. In your Firebase project, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location closest to your users
5. Click "Done"

## Step 3: Get Your Firebase Configuration

1. In your Firebase project, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "expense-tracker-web")
6. Copy the firebaseConfig object

## Step 4: Update Your Code

Replace the placeholder configuration in `index.html` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Step 5: Set Up Firestore Security Rules

In your Firestore Database, go to "Rules" tab and update the rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /expenses/{document} {
      allow read, write: if true;  // For development only
    }
  }
}
```

**Note:** For production, you should implement proper authentication and security rules.

## Step 6: Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy your application

## Benefits of This Setup

✅ **Data Persistence**: Your expense data is stored in the cloud
✅ **Cross-Device Sync**: Access your data from any device
✅ **No Data Loss**: Cache clearing won't affect your data
✅ **Backup**: Firebase automatically backs up your data
✅ **Free Tier**: Firebase offers generous free limits

## Free Tier Limits

- **Firestore**: 1GB storage, 50,000 reads/day, 20,000 writes/day
- **Perfect for personal expense tracking**

## Troubleshooting

If you see errors in the console:
1. Check that your Firebase config is correct
2. Ensure Firestore is enabled
3. Verify your security rules allow read/write access
4. Check your internet connection

The app will automatically fall back to localStorage if Firebase is not available. 