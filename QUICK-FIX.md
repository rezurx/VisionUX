# 🚑 QUICK FIX REFERENCE - Vision UX Research Suite

## 🚨 BLANK SCREEN? START HERE!

### 1️⃣ **Most Common Fix (90% of cases)**
```bash
npm install lucide-react@latest
npm run dev
```

### 2️⃣ **If still blank, add CSP fix to `index.html`**
Add this line in `<head>` section:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self';">
```

### 3️⃣ **Clear browser cache**
- Hard refresh: `Ctrl+F5` (Windows) / `Cmd+Shift+R` (Mac)
- Or open DevTools (F12) → Network → check "Disable cache"

---

## 🔨 BUILD ERRORS?

### TypeScript compilation failing:
```bash
npm install @types/axe-core
npm install lucide-react@latest
npm run build
```

### Can't find specific icons:
**Error**: `'Grid3x3' is not exported`  
**Fix**: Update lucide-react (needs version ≥ 0.376.0)

---

## ⚡ NUCLEAR OPTION (Reset Everything)

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 🔍 CHECK THESE FIRST

1. **Browser Console** (F12) - Look for red error messages
2. **lucide-react version** - Run `npm list lucide-react` (should be ≥ 0.376.0)  
3. **Node.js version** - Run `node --version` (should be ≥ 16.0.0)
4. **Port conflicts** - Try different port: `npm run dev -- --port 3000`

---

## 🎯 SUCCESS INDICATORS

✅ Dev server starts without errors  
✅ Browser console shows no red errors  
✅ Application interface loads (not blank)  
✅ Icons display properly  
✅ No 404 errors in Network tab  

---

**💡 For detailed solutions → see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)**