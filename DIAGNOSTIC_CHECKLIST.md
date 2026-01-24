# Products & Accessories Not Displaying - Diagnostic Guide

## Quick Troubleshooting Steps:

### 1. **Check Browser Console** (Press F12)
Look for any errors in the Console tab. Share any red error messages you see.

### 2. **Check Network Tab** (Press F12 → Network)
- Refresh the page
- Look for requests to:
  - `http://localhost:5000/api/products`
  - `http://localhost:5000/api/accessories`
- Check if they return **200 OK** or an **error**
- Click on each and check the **Response** tab - should show JSON data

### 3. **Check Backend Logs**
The backend terminal should show incoming requests. Look for:
- `GET /api/products`
- `GET /api/accessories`

If you don't see these requests, the frontend isn't calling them.

### 4. **Common Issues:**

#### ❌ Products show but accessories don't?
- Check if accessories exist in MongoDB

#### ❌ Both empty?
- MongoDB connection issue
- No data in database

#### ❌ Errors in console?
- CORS issue
- API URL misconfiguration

---

## Solutions:

### **If API not responding (Network tab shows error):**
```bash
# Kill all and restart clean
# Terminal 1: Backend
cd e:\project-grp-main\backend
npm start

# Terminal 2: Frontend  
cd e:\project-grp-main
npm start
```

### **If data in MongoDB is empty:**
The database might have no products/accessories. You need to seed data or add items through admin panel.

---

**Please check these and tell me what you find!**
