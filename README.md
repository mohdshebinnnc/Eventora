# Eventora – AI Events Organiser

📌 **Project Overview**  
Eventora is a full-stack SaaS platform that revolutionizes event discovery, creation, and management using AI. Powered by Google Gemini, users can generate complete event details from simple prompts, browse real-time listings, register with QR tickets, and access analytics dashboards—all in a seamless, mobile-first experience tailored for organizers and attendees alike.

---

## 🎯 Key Features & Functionalities

### **AI-Powered Event Creation**
- Transform natural language prompts (e.g., "tech meetup in Mumbai") into fully structured events with titles, descriptions, and suggestions.  
- Multi-step forms for refinement, integrated with Unsplash for cover images.

### **Event Discovery & Exploration**
- Browse by location, category, or interests with real-time search and filters.  
- Hero carousels and personalized feeds based on user onboarding data.

### **Registration & Ticketing**
- Quick sign-up with instant QR code generation for tickets.  
- Mobile scanning for check-ins, updating attendance in real-time.

### **Organizer Dashboards**
- Track registrations, earnings, and check-in rates with metrics and CSV exports.  
- Manage events via edit/delete options and time-to-event countdowns.

### **Subscription Tiers**
- **Free plan:** 1 event limit  
- **Pro plan:** Unlimited creations, custom themes, and advanced analytics  
- Secure auth with onboarding for interests and location preferences.

---

## 📱 Responsive Design
- Mobile-first UI with dark mode.  
- Touch-friendly navigation and loading skeletons.  
- Dynamic routing for global locations (e.g., `/explore/mumbai`).

---

## 🛠️ Tech Stack

### **Frontend**
- Next.js 16 (App Router) – SSR, dynamic routing, optimised rendering  
- React 19 – interactive components and hooks  
- Tailwind CSS & Shadcn UI – utility-first styling and custom components

### **Backend**
- Convex – real-time database with TypeScript schemas, queries, and mutations  
- Clerk – OAuth auth, user management, subscription handling

### **AI Integration**
- Google Gemini API – NLP for prompt-to-event generation with JSON outputs

### **Additional Tools**
- `react-qr-code` & `html5-qrcode` – QR generation and scanning  
- `react-hook-form` & Zod – form validation  
- `date-fns` & `country-state-cities` – date and location utilities  
- Sonner & Lucide React – notifications and icons

> **Note:**  
> Eventora requires API keys for Gemini, Unsplash, and Clerk.  
> Set them in `.env.local` and initialize Convex with `npx convex dev`.  
> Free tiers are available for prototyping.

---

## 🚀 Future Enhancements
- **Paid Ticketing** – Integrate Stripe for revenue-generating events  
- **Predictive Analytics** – AI insights on attendance trends and recommendations  
- **Community Features** – Public event feeds and social sharing  
- **International Expansion** – i18n support and global payment gateways  
- **Notification System** – Push alerts via email or in-app

---
