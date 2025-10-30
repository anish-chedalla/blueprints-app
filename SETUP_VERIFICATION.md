# Setup Verification Checklist

Use this checklist to verify everything is working correctly after following the README.

---

## ✅ What You Should See After Setup

### **When You Visit the Grants Page** (`/grants`)

You should see **19 grant programs**:

#### State Grants (5)
- [ ] Arizona Innovation Challenge
- [ ] Arizona Competes Fund
- [ ] AZ Main Street Program
- [ ] Rural Business Development Grant
- [ ] Workforce Development Grant

#### Local Grants - Phoenix Area (5)
- [ ] Greater Phoenix Economic Council Grant
- [ ] City of Phoenix Small Business Grant
- [ ] Scottsdale Arts District Grant
- [ ] Mesa Manufacturing Incentive
- [ ] Tempe Innovation Hub Grant

#### Local Grants - Tucson Area (2)
- [ ] Pima County Small Business Grant
- [ ] Tucson Hispanic Business Grant

#### National Grants (7)
- [ ] SBIR Phase I
- [ ] SBIR Phase II
- [ ] STTR Phase I
- [ ] USDA Rural Business Development Grant
- [ ] EDA Economic Adjustment Assistance
- [ ] Minority Business Development Grant
- [ ] Women-Owned Small Business Grant
- [ ] Veteran Business Grant Program

---

### **When You Visit the Loans Page** (`/loans`)

You should see **17 loan programs**:

#### State Loans (5)
- [ ] Arizona Microbusiness Loan Program
- [ ] Local First Arizona Green Loan
- [ ] Arizona Small Business Loan Program
- [ ] AZ Women Business Loan Fund
- [ ] Arizona Growth Capital Loan

#### Local Loans - Phoenix Area (4)
- [ ] Phoenix Community Loan Fund
- [ ] Maricopa County Microenterprise Loan
- [ ] Scottsdale Small Business Line of Credit
- [ ] Mesa Manufacturing Equipment Loan

#### Local Loans - Tucson Area (2)
- [ ] Tucson Hispanic Chamber Loan Fund
- [ ] Pima County Construction Loan

#### National Loans (8)
- [ ] SBA 7(a) Loan
- [ ] SBA 504 Loan
- [ ] SBA Microloan
- [ ] SBA Express Loan
- [ ] USDA Business & Industry Loan
- [ ] Veteran Small Business Loan
- [ ] Export Express Loan

---

## 🧪 Feature Testing Checklist

### **Authentication** (`/auth`)
- [ ] Can create new account with email/password
- [ ] Receive confirmation email
- [ ] Can sign in with credentials
- [ ] Redirected to onboarding for new users
- [ ] Redirected to dashboard for existing users
- [ ] **No Google sign-in button visible**

### **Program Browsing**
- [ ] Grants page shows 19 programs
- [ ] Loans page shows 17 programs
- [ ] Can click on a program to view details
- [ ] Program detail page shows all information

### **Filtering & Search**
- [ ] Can filter by industry tags
- [ ] Can filter by location (state/county/city)
- [ ] Can filter by demographics (minority/women/veteran-owned)
- [ ] Can search by keyword
- [ ] Filters combine correctly

### **User Features** (requires sign-in)
- [ ] Can save/favorite programs (heart icon)
- [ ] Saved programs appear in `/saved` page
- [ ] Can remove saved programs
- [ ] Can add notes to saved programs

### **AI Features** (requires sign-in & OpenAI API key)
- [ ] Idea Lab (`/idea-lab`) analyzes business ideas
- [ ] Launch Companion (`/assistant`) provides guidance
- [ ] Chat responses are relevant and helpful

### **Profile & Dashboard**
- [ ] Onboarding flow captures business info
- [ ] Dashboard shows saved programs
- [ ] Can edit profile information
- [ ] Profile filters affect program recommendations

### **Licensing** (requires sign-in)
- [ ] Licensing checklist page loads
- [ ] Can track licensing progress

---

## 🔧 Technical Verification

### **Environment Variables**
Check your `.env` file has:
- [ ] `VITE_SUPABASE_URL` - Your project URL
- [ ] `VITE_SUPABASE_PROJECT_ID` - Your project ID
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` - Your anon key
- [ ] `VITE_OPENAI_API_KEY` - Your OpenAI key

### **Database Setup**
In Supabase Dashboard → SQL Editor, verify:
- [ ] `profiles` table exists
- [ ] `programs` table exists with 36 rows
- [ ] `favorites` table exists
- [ ] `reminders` table exists
- [ ] `applications` table exists
- [ ] `launch_companion_chats` table exists
- [ ] `launch_companion_progress` table exists
- [ ] `sync_metadata` table exists

### **Edge Functions** (Optional for AI features)
- [ ] `chat-assistant` function deployed
- [ ] `analyze-idea` function deployed
- [ ] `launch-companion` function deployed
- [ ] OpenAI API key set as secret in Supabase

### **Dev Server**
- [ ] Server running on port 8080 or 8081
- [ ] Can access `http://localhost:8081/blueprints-app/`
- [ ] Hot reload works when editing files
- [ ] No console errors on page load

---

## 📊 Database Query Verification

Run these queries in Supabase SQL Editor to verify data:

### Count Programs
```sql
SELECT type, COUNT(*) as count 
FROM programs 
GROUP BY type;
```
**Expected:** GRANT: 19, LOAN: 17

### Check Program Levels
```sql
SELECT level, COUNT(*) as count 
FROM programs 
GROUP BY level;
```
**Expected:** STATE: 8, LOCAL: 13, NATIONAL: 15

### Verify All Programs Loaded
```sql
SELECT COUNT(*) as total FROM programs;
```
**Expected:** 36

---

## 🐛 Common Issues

### Issue: Blank page or 404
**Solution:** 
- Make sure you're accessing `http://localhost:8081/blueprints-app/` (with the path)
- Check browser console for errors

### Issue: No programs showing
**Solution:**
- Verify all migrations ran: Check Supabase Dashboard → Database → Migrations
- Run `supabase db push` again
- Check SQL Editor and manually verify programs table has 36 rows

### Issue: Authentication not working
**Solution:**
- Check Site URL in Supabase: Authentication → URL Configuration
- Should be `http://localhost:8081/blueprints-app`
- Add redirect URL: `http://localhost:8081/blueprints-app/onboarding`

### Issue: AI features not working
**Solution:**
- Verify OpenAI API key in `.env` file
- Check Edge Functions are deployed: `supabase functions list`
- Verify OpenAI secret is set: `supabase secrets list`
- Check OpenAI account has credits

---

## ✨ Success Criteria

Your setup is complete when:

✅ You can access the app at `http://localhost:8081/blueprints-app/`  
✅ Grants page shows **19 programs**  
✅ Loans page shows **17 programs**  
✅ You can sign up and sign in (email only, no Google)  
✅ You can save/favorite programs  
✅ All filters and search work  
✅ AI features work (if Edge Functions deployed)  
✅ No console errors  

---

**If all checkboxes are checked, congratulations! Your Blueprints app is fully functional! 🎉**
