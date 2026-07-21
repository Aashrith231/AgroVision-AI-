# RootSage AI - User Flows & Key Functions

This document provides a detailed breakdown of user journeys and the key functions that power each feature. Use this to understand where to add new farmer-focused features.

---

## 📱 User Journey Flows

### Flow 1: Disease Diagnosis (Main Feature)
**User Goal**: "Take a leaf photo → Get disease prediction + treatment advice"

```
1. User lands on home (index.tsx)
   ↓
2. Selects crop type: "Normal Crops" or "Medicinal Plants"
   ↓
3. Selects language: English / Hindi / Telugu
   ↓
4. Uploads leaf image:
   - Via camera capture (ImageUploader.tsx)
   - Via drag-drop file picker (ImageUploader.tsx)
   ↓
5. Frontend client-side quality checks:
   - Brightness analysis (utils/imageQuality.ts → analyzeImageQuality)
   - Sharpness detection (Laplacian approximation)
   - Shows "Good", "Warning", or "Bad" status
   ↓
6. User clicks "Analyze Image"
   ↓
7. Frontend calls backend:
   - POST /predict (file + mode="crop" or "medicinal")
   - services/api.ts → predictDisease()
   ↓
8. Backend processing:
   - routes/predict.py → predict endpoint
   - Validates file (JPG/PNG only, <8MB)
   - Calls inference/predictor.py → predict()
   - Runs Keras CNN model
   - Returns [disease_name, confidence, top_3_predictions]
   - **NEW**: Runs OpenCV leaf analysis (affected_area_percentage, color_severity, overlay_image)
   ↓
9. Frontend receives prediction
   - Saves to localStorage (utils/storage.ts → saveScanRecord)
   - Shows ResultsPanel.tsx with:
     * Disease name
     * Confidence % (with disclaimer: NOT severity)
     * Top-3 alternative predictions
     * Leaf affected area % (from OpenCV analysis)
     * Color-based severity overlay
   ↓
10. Frontend calls guidance generation:
    - POST /generate-guidance (disease + language)
    - services/api.ts → generateGuidance()
    ↓
11. Backend guidance chain:
    - routes/guidance.py → guidance endpoint
    - services/gemini_service.py → generate_guidance()
    - Tries providers in order:
      1. Gemini API (gemini-2.0-flash)
      2. Groq API (llama-3.1-8b-instant)
      3. NVIDIA NIM DeepSeek (deepseek-v4-flash)
      4. Ollama local (qwen2.5-coder:7b)
      5. local_disease_dictionary.py (static fallback)
    - Returns JSON: {explanation, symptoms[], prevention[], treatment[], severity, weather_risk_tips}
    ↓
12. Frontend displays AI guidance:
    - InfoSections.tsx → tabbed view:
      * Symptoms tab
      * Prevention tab
      * Treatment tab
      * Advice tab
   ↓
13. User can play voice explanation:
    - Clicks "Play" button
    - Frontend calls POST /voice (disease + treatment + prevention + language)
    - services/api.ts → generateVoice()
    ↓
14. Backend voice generation:
    - routes/voice.py → voice endpoint
    - services/voice_service.py → generate_voice()
    - Tries ElevenLabs API (multilingual_v2) → falls back to gTTS
    - Returns base64 encoded audio
    ↓
15. Frontend plays audio (audioRef.current)
    ↓
16. User can share via WhatsApp:
    - Enters phone number
    - Clicks "Send to WhatsApp"
    - Frontend builds WhatsApp message (treatment + prevention snippets)
    ↓
17. Two sharing methods:
    a) Direct link: wa.me/?text=... (opens WhatsApp in browser/phone)
    b) Via Twilio SMS: POST /send-whatsapp (phone + disease + confidence + treatment + prevention)
       - services/whatsapp_service.py → send_whatsapp()
       - Twilio API sends SMS to WhatsApp
    ↓
18. User clicks "Know More":
    - Routes to dynamic disease page: pages/disease/[name].tsx
    - Shows full disease details from diseaseLibrary.ts
    ↓
19. Scan is saved to localStorage with:
    - UUID, timestamp, image data (base64), disease, confidence, mode
```

---

### Flow 2: View Scan History
**User Goal**: "See all my past leaf scans"

```
1. User navigates to /history
   ↓
2. Frontend loads (history.tsx):
   - Gets all scans from localStorage (utils/storage.ts → getScanHistory)
   - Gets all follow-up reminders (utils/storage.ts → getReminders)
   ↓
3. Displays scan list:
   - Thumbnail, disease name, confidence, date
   - Follow-up reminders with status badges
   ↓
4. User can:
   - Click scan → routes to /progress?scan={id} (pre-selects for comparison)
   - Click reminder → updates status (utils/storage.ts → updateReminder)
   - Clear all history (utils/storage.ts → clearScanHistory)
```

---

### Flow 3: Track Disease Progress (Heuristic Comparison)
**User Goal**: "Compare two scans to see if my plant is improving/worsening"

```
1. User navigates to /progress
   ↓
2. Frontend displays (progress.tsx):
   - Left panel: list of past scans
   - Right panel: selected scan preview
   ↓
3. User selects scan 1 (e.g., "Diseased leaf from 5 days ago")
   ↓
4. User uploads new scan 2 (healthy or different disease)
   ↓
5. Frontend runs client-side analysis (utils/progressAnalysis.ts):
   - Calls analyzeProgress(scan1, scan2)
   - Checks if crop matches (e.g., both "Tomato")
   - If both predictions < 40% confidence: "Inconclusive"
   - Else if scan1_disease → "healthy": "Improving" ✅
   - Else if scan1_disease == scan2_disease: "Stable" ⚠️
   - Else if "healthy" → scan2_disease: "Worsening" 🔴
   ↓
6. Frontend calls backend LLM analysis (optional):
   - POST /progress-report (scan1_data + scan2_data + language)
   - services/api.ts → generateProgressReport()
   ↓
7. Backend LLM (routes/progress.py):
    - Receives heuristic comparison + full scan details
    - Calls services/progress_service.py → generate_progress_report()
    - Sends to LLM provider chain (same fallback as guidance)
    - LLM generates contextual text explanation in target language
    - Returns summary + next-step recommendations
   ↓
8. Frontend displays result:
   - Status badge (Improving/Stable/Worsening)
   - Visual side-by-side comparison
   - LLM-generated summary text
   - **Disclaimer**: "Confidence score is model certainty, NOT disease severity"
   ↓
9. User can save as ProgressRecord (utils/storage.ts → saveProgressRecord):
   - Stores scan1_id, scan2_id, status, LLM summary, timestamp
```

---

### Flow 4: Learn Disease Information
**User Goal**: "Browse all supported diseases and learn about them"

```
1. User navigates to /library
   ↓
2. Frontend loads (library.tsx):
   - Gets all diseases from data/diseaseLibrary.ts
   - Shows 36 crop disease cards
   ↓
3. User searches by crop or disease name
   - Filters diseaseLibrary in real-time
   ↓
4. User clicks a disease card
   - Routes to /disease/[slug]?lang=en
   ↓
5. Dynamic disease detail page (pages/disease/[name].tsx):
   - Shows disease metadata (crop, summary, category)
   - Full description from diseaseLibrary entry
   - All text is i18n-translated (i18n/translations.ts)
```

---

### Flow 5: Check Local Weather Risk
**User Goal**: "Know if weather is risky for my crop disease"

```
1. User is on home page with a prediction result
   ↓
2. WeatherRiskCard.tsx is rendered:
   - Requests geolocation (browser permission)
   - Calls Open-Meteo API with coordinates
   ↓
3. Open-Meteo returns:
   - Current humidity, rain, wind speed
   ↓
4. Frontend calculates risk (components/WeatherRiskCard.tsx):
   - If humidity >= 80%: fungal disease risk 🔴
   - If rain > 0 mm: warning against spraying pesticide 💧
   - If wind >= 18 km/h: warning against spray drift 💨
   ↓
5. Displays risk panel with:
   - Icons and text warnings
   - Farmer-friendly recommendations
```

---

## 🔧 Backend API Endpoints (Key Functions)

### Health & Info
```
GET /health
  → Returns app status, model info, loaded model names
  → Route: backend/routes/health.py

GET /model-info
  → Returns list of available classes and model metadata
  → Route: backend/routes/health.py
```

### Core Inference
```
POST /predict
  Input:
    - file: image file (JPG/PNG, <8MB)
    - mode: "crop" or "medicinal"
  
  Processing:
    1. backend/routes/predict.py → predict()
    2. Validates file type and size
    3. Calls backend/inference/predictor.py → predict(image_bytes, mode)
    4. predictor.py:
       - Loads model: models/EfficientNetB0.h5 (crop) or medicinal model
       - Calls backend/inference/preprocess.py → preprocess_image()
       - EXIF transpose (ImageOps.exif_transpose)
       - Resize to 224×224
       - Normalize pixel values (model-specific scaling)
       - Runs Keras model.predict()
       - Returns top-3 predictions + confidence scores
    5. **NEW**: Calls backend/services/leaf_analysis_service.py → analyze_leaf_severity()
       - OpenCV analysis on image
       - Detects leaf boundaries
       - Calculates affected area % (diseased vs healthy pixels)
       - Generates color-based severity heatmap overlay
       - Returns: affected_area_percentage, severity_score, overlay_image (base64)
    6. Returns JSON: {
         disease: string,
         confidence: float (0-1),
         top_3: [{name: string, score: float}],
         affected_area_percentage: float,
         color_severity: string ("mild" | "moderate" | "severe"),
         overlay_image: string (base64 PNG),
         leaf_detected: boolean
       }
  
  Error codes:
    - 400: Invalid image format (not JPG/PNG)
    - 413: Image too large (>8MB)
    - 500: Model prediction failed
```

### Guidance Generation (LLM Fallback Chain)
```
POST /generate-guidance
  Input:
    - disease: string (e.g., "Tomato___Leaf_Blight")
    - language: string ("en" | "hi" | "te")
  
  Processing:
    1. backend/routes/guidance.py → guidance()
    2. Calls backend/services/gemini_service.py → generate_guidance()
    3. Builds prompt: "Farmer-friendly advice for [disease] in [language]"
    4. Tries providers in sequence:
       a) Gemini API (google.generativeai)
          - Model: gemini-2.0-flash
          - Key: GEMINI_API_KEY from .env
       
       b) Groq API (fallback if Gemini fails)
          - Model: llama-3.1-8b-instant
          - Key: GROQ_API_KEY
       
       c) NVIDIA NIM DeepSeek (fallback)
          - Model: deepseek-ai/deepseek-v4-flash
          - Key: NVIDIA_API_KEY
       
       d) Ollama local (fallback if no API available)
          - URL: OLLAMA_API_BASE or localhost:11434
          - Model: qwen2.5-coder:7b
       
       e) Local disease dictionary (ultimate fallback)
          - backend/services/local_disease_dictionary.py
          - Static JSON with generic advice for each disease class
    
    5. Returns JSON: {
         disease: string,
         language: string,
         explanation: string,
         symptoms: [string],
         prevention: [string],
         treatment: [string],
         advice: string,
         severity_indicator: string,
         weather_risk_tips: [string],
         follow_up_days: int
       }
  
  Error codes:
    - 400: Invalid disease or language
    - 500: All providers failed (returns local dictionary data)
```

### Voice Synthesis
```
POST /voice
  Input:
    - disease: string
    - treatment: [string]
    - prevention: [string]
    - language: string ("en" | "hi" | "te")
  
  Processing:
    1. backend/routes/voice.py → voice()
    2. Calls backend/services/voice_service.py → generate_voice()
    3. Builds text: "Disease: {disease}. Treatment: {treatment}. Prevention: {prevention}."
    4. Tries voice providers:
       a) ElevenLabs API (ELEVENLABS_API_KEY)
          - Model: eleven_multilingual_v2
          - Voice ID: auto-selected per language
       
       b) gTTS fallback (Google Text-to-Speech)
          - No API key needed
          - Language: auto-mapped from "en"/"hi"/"te"
    
    5. Returns JSON: {
         audio_base64: string (mp3 or wav)
         language: string,
         provider: string ("elevenlabs" | "gtts" | "none")
       }
  
  Error codes:
    - 500: Voice generation failed (empty audio)
```

### WhatsApp Sharing
```
POST /send-whatsapp
  Input:
    - phone: string (country code + number, e.g., "919876543210")
    - disease: string
    - confidence: float
    - treatment: [string]
    - prevention: [string]
  
  Processing:
    1. backend/routes/whatsapp.py → whatsapp()
    2. Calls backend/services/whatsapp_service.py → send_whatsapp()
    3. Formats message: "RootSage AI Result\nDisease: {disease}\nConfidence: {confidence}%\nTreatment: {...}\nPrevention: {...}"
    4. Tries to send:
       a) Twilio SMS Gateway (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
          - Sends SMS to WhatsApp number
       
       b) Fallback: Returns wa.me link (frontend handles direct redirect)
    
    5. Returns JSON: {
         success: boolean,
         message_id: string (or null),
         whatsapp_link: string (wa.me link)
       }
```

### Disease Progress Report (LLM Analysis)
```
POST /progress-report
  Input:
    - scan1: {disease, confidence, crop, date}
    - scan2: {disease, confidence, crop, date}
    - language: string
    - client_status: string ("Improving" | "Stable" | "Worsening" | "Inconclusive")
  
  Processing:
    1. backend/routes/progress.py → progress_report()
    2. Calls backend/services/progress_service.py → generate_progress_report()
    3. Builds LLM prompt:
       "Compare two crop scans taken {days_apart} days apart.
        Scan 1: {disease1} (confidence {conf1})
        Scan 2: {disease2} (confidence {conf2})
        Client analysis shows: {client_status}
        Generate a {language} farmer-friendly summary."
    4. Uses same LLM fallback chain (Gemini → Groq → NVIDIA → Ollama → local dict)
    5. Returns JSON: {
         status: string ("Improving" | "Stable" | "Worsening" | "Inconclusive"),
         summary: string (LLM-generated text),
         next_steps: [string],
         days_apart: int,
         confidence_disclaimer: string
       }
  
  Error codes:
    - 400: Invalid scan data
    - 500: Analysis failed
```

---

## 🎨 Frontend Components & Pages (Key Functions)

### Pages (User-Facing)

**pages/index.tsx** (Main Diagnosis Page)
```
Key State:
  - language: Language (en | hi | te)
  - file: File | null
  - prediction: PredictionResponse | null
  - guidance: GuidanceResponse | null
  - imageQuality: ImageQuality (brightness, sharpness)
  - modelMode: ModelMode (crop | medicinal)

Key Functions:
  - handleFile(file): Processes user-selected image
  - analyzeImage(): Calls POST /predict
  - handleGenerateGuidance(): Calls POST /generate-guidance
  - handleGenerateVoice(): Calls POST /voice
  - handleWhatsAppShare(): Builds wa.me link or calls POST /send-whatsapp
  - handleKnowMore(): Routes to /disease/[name] page

Key Components:
  - ImageUploader: File picker + camera capture
  - ResultsPanel: Shows prediction + confidence + top-3
  - InfoSections: Tabbed guidance (symptoms, treatment, etc.)
  - WeatherRiskCard: Local weather risk assessment
```

**pages/progress.tsx** (Disease Progress Tracker)
```
Key State:
  - history: ScanRecord[] (all past scans from localStorage)
  - selectedId: string (first scan ID)
  - file: File | null (second scan to compare)
  - currentScan: ScanRecord | null
  - activeRecord: ProgressRecord | null

Key Functions:
  - handleFile(file): Processes second scan image
  - handleAnalyze(): Compares two scans
    1. Calls POST /predict on new image
    2. Calls analyzeProgress() for client-side comparison
    3. Calls POST /progress-report for LLM analysis
    4. Saves result to localStorage (saveProgressRecord)
  - handleSaveRecord(): Persists comparison result

Key Components:
  - Scan list selector
  - Progress comparison visualization
  - Status badge (Improving/Stable/Worsening)
  - LLM summary text
```

**pages/history.tsx** (Scan History)
```
Key Functions:
  - refresh(): Reloads scan history and reminders from localStorage
  - handleClearHistory(): Clears all stored scans
  - handleUpdateReminder(): Updates follow-up reminder status

Key Components:
  - Scan list with thumbnails
  - Reminder section with status badges
  - Delete/clear buttons
```

**pages/library.tsx** (Disease Knowledge Base)
```
Key State:
  - query: string (search text)
  - filtered: DiseaseEntry[] (search results)

Key Functions:
  - Filter diseaseLibrary by crop/disease name in real-time

Key Components:
  - Search input
  - Disease card grid
  - Links to /disease/[name] detail pages
```

**pages/disease/[name].tsx** (Disease Detail Page)
```
Key Functions:
  - Maps disease slug to diseaseLibrary entry
  - Displays full disease metadata in selected language

Key Components:
  - Disease description
  - Crop info
  - Symptoms list
  - Prevention tips
  - Treatment methods
```

---

### Key Components (Reusable UI)

**components/ImageUploader.tsx**
```
Props:
  - onFile: (file: File) => void
  - onQuality?: (quality: ImageQuality) => void

Key Functions:
  - handleDrop(): Drag-drop file upload
  - handleCameraCapture(): Mobile camera capture
  - analyzeImageQuality(): Client-side brightness/sharpness check
    * Brightness: canvas pixel analysis
    * Sharpness: Laplacian approximation (edge detection)

Outputs:
  - Calls parent onFile() with File object
  - Calls onQuality() with {brightness, sharpness, status}
```

**components/ResultsPanel.tsx**
```
Props:
  - prediction: PredictionResponse
  - guidance: GuidanceResponse | null
  - onGenerateGuidance: () => void
  - onPlayVoice: () => void
  - onKnowMore: () => void

Displays:
  - Disease name (bold)
  - Confidence % + disclaimer
  - Top-3 predictions
  - Affected area % (from OpenCV)
  - Color severity indicator
  - Action buttons
```

**components/InfoSections.tsx**
```
Props:
  - guidance: GuidanceResponse
  - language: Language

Key State:
  - activeTab: string ("symptoms" | "prevention" | "treatment" | "advice")

Displays:
  - Tabbed interface with guidance sections
  - Farmer-friendly language formatting
  - Weather risk tips
  - Follow-up reminder suggestion
```

**components/WeatherRiskCard.tsx**
```
Key Functions:
  - getGeolocation(): Browser geolocation API
  - fetchWeather(lat, lon): Calls Open-Meteo API
  - calculateRiskScore(): Humidity, rain, wind analysis

Displays:
  - Current weather icons
  - Risk warnings (fungal, spray, drift)
  - Farmer-friendly tooltips
```

---

## 💾 Data Storage & Persistence (localStorage)

**LocalStorage Keys** (utils/storage.ts)
```
scanHistory: ScanRecord[] = [
  {
    id: UUID,
    createdAt: ISO timestamp,
    disease: string,
    confidence: float,
    crop: string,
    mode: "crop" | "medicinal",
    imageDataUrl: base64 string,
    modelMode?: string
  },
  ...
]

progressRecords: ProgressRecord[] = [
  {
    id: UUID,
    createdAt: ISO timestamp,
    scan1Id: UUID,
    scan2Id: UUID,
    status: "Improving" | "Stable" | "Worsening" | "Inconclusive",
    summary: string,
    llmAnalysis?: string,
    language: string
  },
  ...
]

followUpReminders: FollowUpReminder[] = [
  {
    id: UUID,
    createdAt: ISO timestamp,
    scanId: UUID,
    remindAfterDays: int,
    status: "pending" | "completed",
    notes: string
  },
  ...
]

diseaseHandoff: {
  diseaseName: string,
  imageDataUrl?: string
} (temporary, used for page transitions)
```

**Key Storage Functions**
```
saveScanRecord(record: ScanRecord): void
  → Adds to scanHistory array, saves to localStorage

getScanHistory(): ScanRecord[]
  → Retrieves all scan records

getProgressRecords(): ProgressRecord[]
  → Retrieves all progress comparisons

saveProgressRecord(record: ProgressRecord): void
  → Adds progress comparison to localStorage

getReminders(): FollowUpReminder[]
  → Retrieves all reminders

updateReminder(id: string, updates: Partial<FollowUpReminder>): void
  → Updates reminder status (e.g., mark as completed)

clearScanHistory(): void
  → Deletes all scans and related reminders (user confirmation)

saveDiseaseHandoff(disease: string, imageDataUrl?: string): void
  → Temporary storage for routing to disease detail page
```

---

## 🔌 Integration Points for New Features

### Adding a New Farmer Feature

Follow this pattern to add a new feature that helps real KISAN users:

#### 1. Define the User Flow
```
User wants to: [specific farmer problem]
  ↓ What data does they need?
  ↓ Where should it be stored?
  ↓ What calculations are needed?
  ↓ Should backend or frontend handle it?
```

#### 2. Backend Integration (If Needed)
```
Create backend/routes/my_feature.py:
  @router.post("/my-endpoint")
  def my_feature(payload: MyRequest) -> MyResponse:
    return my_service_function(payload)

Create backend/services/my_feature_service.py:
  def my_function():
    # Implement logic
    # Use LLM fallback chain if needed (gemini_service pattern)
    pass

Update backend/main.py:
  app.include_router(my_feature.router)

Add API endpoint to frontend/services/api.ts:
  export async function callMyFeature(data): Promise<MyResponse> {
    return api.post("/my-endpoint", data)
  }
```

#### 3. Frontend Integration
```
Create frontend/pages/my_feature.tsx or add to existing page:
  - Use useTranslation() for i18n (en, hi, te)
  - Call API function from services/api.ts
  - Display results with consistent UI (Lucide icons, Tailwind)
  - Save data to localStorage if persistence needed

Update frontend/components/Header.tsx:
  - Add navigation link to new page
```

#### 4. Storage Integration (If Persisting User Data)
```
Create new localStorage key:
  myFeatureData: MyDataRecord[] = [{...}, ...]

Add functions to frontend/utils/storage.ts:
  export function saveMyFeatureData(data): void { ... }
  export function getMyFeatureData(): MyDataRecord[] { ... }
```

#### 5. Translations (i18n)
```
Update frontend/i18n/translations.ts:
  Add keys for new feature labels, buttons, error messages in:
  - en (English)
  - hi (Hindi)
  - te (Telugu)
```

---

## 🌾 Feature Ideas for Real KISAN Users

Based on the architecture, here are places to add new farmer-useful features:

### 1. **Pesticide Recommendation Engine**
- **Problem**: Farmers don't know which pesticide works for which disease
- **Implementation**:
  - Create `backend/services/pesticide_service.py`
  - POST `/recommend-pesticide` with disease + crop + language
  - Return pesticide options with dosage + safety warnings
  - Store farmer's pesticide usage history in localStorage
  - **Feature**: "This pesticide worked for me last time" → store + recommend next time

### 2. **Crop-Specific Treatment Timeline**
- **Problem**: Farmers don't know when to apply treatment relative to crop stage
- **Implementation**:
  - Add crop growth stage selection (seedling/vegetative/flowering/fruiting)
  - POST `/treatment-timeline` with disease + crop + stage + language
  - Return week-by-week treatment plan
  - Show calendar view with treatment reminders

### 3. **Farmer Market Prices (Integration)**
- **Problem**: Farmers lose income when crops are diseased
- **Implementation**:
  - Integrate with commodity price APIs (mandi rates)
  - Show "potential crop loss %" if disease isn't treated
  - Motivate early action with economic data
  - Save expected harvest date in scan record

### 4. **Community Disease Hotspot Map**
- **Problem**: Farmers don't know if disease is spreading in their region
- **Implementation**:
  - Send anonymous geolocation + disease to backend
  - Create heatmap: `/disease-hotspots?region=...`
  - Show "X farmers detected this disease nearby last week"
  - **Privacy**: Never store personal farmer data, only aggregate counts

### 5. **Soil-Based Disease Prevention**
- **Problem**: Some diseases relate to soil conditions
- **Implementation**:
  - Ask: "Have you tested soil recently?"
  - POST `/soil-based-advice` with disease + soil_pH + soil_moisture
  - Return soil-specific prevention tips
  - Link to local soil testing labs

### 6. **Yield Loss Prediction**
- **Problem**: Farmers want to know crop damage impact
- **Implementation**:
  - POST `/predict-yield-loss` with disease + severity % + days_to_harvest
  - Use LLM: "Based on {disease} at {severity}%, expected yield loss is {X}%"
  - Help farmers decide: treat now vs. accept loss

### 7. **Farmer Diary & Multi-Field Management**
- **Problem**: Farmers manage multiple fields
- **Implementation**:
  - Add field names/IDs to scan records
  - Group scans by field in history page
  - New page `/fields`: manage 5+ fields separately
  - Quick-add: "Same disease? Apply to Field 2 also"

### 8. **Weather-Triggered Alerts**
- **Problem**: Certain weather triggers disease (high humidity = fungal risk)
- **Implementation**:
  - When user enters coordinates (in WeatherRiskCard)
  - Subscribe to Open-Meteo alerts
  - Send notification: "Humidity rising to 85% → fungal disease risk in 2 days"
  - localStorage: store weather thresholds per crop

### 9. **Integrated Organic vs. Chemical Advisor**
- **Problem**: Some farmers prefer organic, some chemical
- **Implementation**:
  - Add user preference: `localStorage.farmerPreference = "organic" | "chemical" | "both"`
  - POST `/guidance` includes preference-filtered treatment options
  - Show comparison: "Neem spray takes 2 weeks, Fungicide takes 5 days"

### 10. **Farmer-to-Expert Chat**
- **Problem**: AI sometimes fails; farmers need human expert backup
- **Implementation**:
  - If confidence < 40%, show: "Connect with agricultural expert?"
  - Email/WhatsApp: export scan + guidance to expert
  - Expert replies with verified diagnosis
  - Save expert reply to scan record

---

## 🎯 Key Takeaways for Adding Features

1. **Always ask**: "Does this solve a real KISAN problem?"
2. **Respect data**: No unnecessary personal data collection
3. **Language first**: Design translations (en/hi/te) from day 1
4. **Offline-ready**: Use localStorage, don't assume internet
5. **LLM fallback**: Use the gemini_service pattern for any AI feature
6. **Simple UI**: Farmers may have low digital literacy → big buttons, clear icons
7. **One feature per scan**: Don't overload history with metadata
8. **Test with farmers**: Use college deployment (COLLEGE_SERVER_DEPLOYMENT.md)
