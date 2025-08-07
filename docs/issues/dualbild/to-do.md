# Dual-Build Todo List

> This todo list focuses first on decoupling the frontend from the full-stack Next.js architecture, targeting a fully static SPA build for ICP with no backend dependencies. Backend integration will come in Phase 2.

## 🎯 **Phase 1: Pure Client-Side SPA (No Backend)**

### **Features to Replace/Remove:**

- [ ] **Loading UI Files** → Replace with React Suspense
- [ ] **Error Boundaries** → Replace with global error handling
- [ ] **Development Tools** → Set up Vite for ICP build
- [ ] **API Routes** → Remove/mock for static build
- [ ] **PostHog Middleware** → Remove (no analytics needed)
- [ ] **Vercel Blob** → Remove (no file uploads needed)

### **Features with Dual Build:**

- [ ] **File-Based Routing** → Next.js App Router (Vercel) vs React Router (ICP)
- [ ] **Server Components** → Keep on Vercel, client-side on ICP
- [ ] **Image Optimization** → next/image vs standard img
- [ ] **Dynamic Metadata** → generateMetadata vs static build
- [ ] **Middleware i18n** → Server-side vs client-side routing
- [ ] **Font Optimization** → Next.js vs manual loading
- [ ] **Code Splitting** → Automatic vs manual configuration
- [ ] **Static Site Generation** → generateStaticParams vs build script

---

## 🚀 **Phase 2: Backend Integration (Future)**

### **Backend Features:**

- [ ] **API Routes** → Extract to Express.js server
- [ ] **PostHog Analytics** → Implement client-side analytics
- [ ] **File Storage** → Implement alternative storage solution
- [ ] **Authentication** → Add auth integration
- [ ] **Database Integration** → Connect to shared backend API
