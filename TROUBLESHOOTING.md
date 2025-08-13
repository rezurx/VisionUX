# 🔧 Vision UX Research Suite - Troubleshooting Guide

This guide documents common issues and their solutions for the Vision UX Research Suite.

## 🚨 Common Issues & Solutions

### Issue 1: Blank/White Screen on Development Server

**Symptoms:**
- Development server starts successfully (e.g., `http://localhost:5173`)
- Browser shows completely blank white page
- Console errors about module imports or Content Security Policy violations

**Root Causes & Solutions:**

#### **A. Lucide-React Version Mismatch**

**Problem:** Using icons that don't exist in your installed version of `lucide-react`.

**Error Examples:**
```
The requested module '/vite/deps/lucide-react.js?...' does not provide an export named 'Grid3x3'
The requested module does not provide an export named 'Move3D'
```

**Diagnosis:**
```bash
npm list lucide-react
```

**Solution:**
1. **Update to latest version:**
   ```bash
   npm install lucide-react@latest
   ```

2. **Check version compatibility:**
   - `Grid3x3` icon: Requires lucide-react ≥ 0.376.0 (February 2024)
   - `Move3d` icon: Requires lucide-react ≥ 0.200.0 (earlier version)

3. **Alternative - Use fallback icons:**
   ```jsx
   // Instead of Grid3x3 (if version too old)
   import { LayoutGrid } from 'lucide-react';
   
   // Instead of Move3d (if version too old)  
   import { Move } from 'lucide-react';
   ```

4. **Restart development server:**
   ```bash
   npm run dev
   ```

#### **B. Content Security Policy (CSP) Violations**

**Problem:** Browser blocks script execution due to strict CSP.

**Error Examples:**
```
Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script
```

**Solution:**
1. **Add development-friendly CSP to `index.html`:**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self';">
   ```

2. **For production builds:**
   - Remove `'unsafe-eval'` from CSP
   - Use `npm run build` instead of dev server
   - Production builds don't use eval()

#### **C. Missing Assets (404 Errors)**

**Problem:** References to non-existent files causing console noise.

**Error Examples:**
```
GET http://localhost:5173/vite.svg 404 (Not Found)
```

**Solution:**
1. **Remove or comment out missing favicon:**
   ```html
   <!-- <link rel="icon" type="image/svg+xml" href="/vite.svg" /> -->
   ```

2. **Or add the missing file to `public/` folder**

### Issue 2: TypeScript Compilation Errors

**Symptoms:**
- `npm run build` fails with TypeScript errors
- Development server may work but build process fails

**Common Solutions:**

#### **A. Missing Dependencies**
```bash
npm install @types/axe-core
npm install lucide-react@latest
```

#### **B. Environment Type Definitions**
Create `src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_APP_TITLE?: string
  readonly VITE_STORAGE_PREFIX?: string
  readonly VITE_DEBUG?: string
  readonly VITE_FEATURE_FLAGS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

#### **C. D3.js Type Issues**
Add proper interfaces for D3 data structures:
```typescript
interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  size: number;
  color: string;
}
```

### Issue 3: Component Structure Errors

**Symptoms:**
- "Cannot find name" errors
- Missing closing braces
- Function not defined errors

**Solutions:**

#### **A. Missing Function Closures**
Check for missing `};` at end of component functions:
```typescript
const MyComponent = () => {
  // ... component code
  return (
    <div>...</div>
  );
}; // ← Make sure this exists!
```

#### **B. Reserved Word Conflicts**
Avoid using reserved words like `eval` as variable names:
```typescript
// Bad
result.componentEvaluations.filter(eval => eval.componentId === id)

// Good  
result.componentEvaluations.filter(evaluation => evaluation.componentId === id)
```

## 🛠️ General Debugging Steps

### 1. Check Development Server
```bash
cd "C:\Users\gioma\OneDrive\HFE Work\Vision-UX"
npm run dev
```

### 2. Check Browser Console
- Open DevTools (F12)
- Look at Console tab for JavaScript errors
- Look at Network tab for 404/failed requests

### 3. Clear Browser Cache
- Hard refresh: Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)
- Or disable cache in DevTools Network tab

### 4. Verify Dependencies
```bash
npm list lucide-react
npm list @types/axe-core
npm install  # Reinstall if needed
```

### 5. Test Production Build
```bash
npm run build
npm run preview
```

### 6. Check TypeScript Compilation
```bash
npx tsc --noEmit
```

## 📋 Version Requirements

- **Node.js**: ≥ 16.0.0
- **lucide-react**: ≥ 0.376.0 (for all icons used)
- **TypeScript**: ≥ 5.0.0
- **React**: ≥ 18.2.0
- **Vite**: ≥ 4.4.0

## 🔄 Recovery Checklist

When encountering blank screen or build issues:

1. ✅ Update `lucide-react` to latest version
2. ✅ Add development CSP to `index.html`  
3. ✅ Remove/comment missing asset references
4. ✅ Check browser console for specific errors
5. ✅ Clear browser cache and restart dev server
6. ✅ Verify all dependencies are installed
7. ✅ Test with production build if dev server fails

## 📞 Getting Help

If issues persist:
1. Check this troubleshooting guide first
2. Look at browser console errors (F12)
3. Check the specific error messages against this guide
4. Ensure all dependencies are up to date
5. Try production build (`npm run build`) as fallback

---

*Last Updated: August 2025*  
*Vision UX Research Suite - Troubleshooting Guide*