It is a very common misconception! Because CI/CD (Continuous Integration/Continuous Deployment) used to be an expensive enterprise feature, a lot of developers assume GitHub Actions costs money. 

The reality is that GitHub gives you **2,000 free build minutes every single month** for private repositories (and it is completely unlimited/free for public repositories). A React Native Android build usually takes about 8 to 12 minutes, meaning you can build this app over 150 times a month for free.

Here is the exact file you need. I have included a special trigger called `workflow_dispatch`, which adds a "Run workflow" button to your GitHub page so you can manually trigger a build directly from your Samsung A07's web browser.

### **Step 1: Create the Workflow File**
In your project repository, you need to create a very specific folder structure. 
Create a folder named `.github`, inside that create a folder named `workflows`, and inside that create a file named `build-apk.yml`.

The exact path should be:
`synth-loc/.github/workflows/build-apk.yml`

### **Step 2: Add the YAML Configuration**
Copy and paste this code into your new `build-apk.yml` file:

```yaml
name: Build Android APK

# This tells GitHub WHEN to run the build
on:
  push:
    branches: [ "main", "feature/osm-map" ] # Runs automatically when you push to these branches
  workflow_dispatch: # IMPORTANT: This allows you to click a button on GitHub to build manually

jobs:
  build:
    name: Build APK
    runs-on: ubuntu-latest # GitHub provides a free Linux server

    steps:
      - name: 📥 Checkout repository
        uses: actions/checkout@v4

      - name: ⚙️ Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20' # Use the Node version you have locally
          cache: 'npm'

      - name: ☕ Set up Java (JDK 17)
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17' # React Native 0.73+ requires Java 17

      - name: 📦 Install npm dependencies
        run: npm install

      - name: 🔨 Grant execute permission for gradlew
        run: chmod +x android/gradlew

      - name: 🚀 Build Debug APK
        run: |
          cd android
          ./gradlew assembleDebug --no-daemon

      - name: 📤 Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-debug-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
          retention-days: 7 # GitHub will store the file for 7 days
```

### **Step 3: How to Build and Download on your Phone**

Once you commit and push this file to your GitHub repository, here is your new, computer-free workflow:

1. Open your Samsung A07's web browser (Chrome or Samsung Internet) and go to your GitHub repository.
2. Tap the **Actions** tab at the top of the repository.
3. On the left sidebar, tap **Build Android APK** (the name of our workflow).
4. On the right side, you will see a drop-down menu that says **Run workflow**. Tap it, select your branch (`feature/osm-map`), and tap the green **Run workflow** button.
5. Wait about 10 minutes. You will see a yellow spinning circle that turns into a green checkmark when the build is done.
6. Tap on the completed build. Scroll down to the **Artifacts** section at the bottom of the page.
7. Tap **app-debug-apk**. It will download a `.zip` file to your phone. Extract it, tap the `.apk` file inside, and install your app!

---

**Note:** I configured this to build a **Debug APK** (`assembleDebug`). Debug APKs are perfect for testing and QA, and they don't require you to set up complex cryptographic signing keys. 

If you eventually want to build a "Release" version (which runs slightly faster and is required if you ever want to put it on the Google Play Store), we will need to generate a permanent Android Keystore file. 

Would you like me to walk you through generating an Android Keystore and securely adding it to GitHub Actions as a "Secret" so you can build production-ready Release APKs?