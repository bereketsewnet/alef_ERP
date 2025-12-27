# CORS and 500 Error Fix

## Changes Made

### 1. CORS Middleware (Fixed)
- **File**: `backend/bootstrap/app.php`
- Changed CORS middleware to be applied **globally** (prepend) instead of just API routes
- This ensures preflight OPTIONS requests are handled correctly

### 2. CORS Configuration (Updated)
- **File**: `backend/config/cors.php`
- Added wildcard `'*'` to allowed origins for development
- This allows all origins to access the API

### 3. JWT Secret (Generated)
- Generated JWT secret using: `php artisan jwt:secret --force`
- Published JWT config: `php artisan vendor:publish --provider="Tymon\JWTAuth\Providers\LaravelServiceProvider"`

## Testing

### 1. Restart Backend
```powershell
docker-compose restart backend
```

### 2. Clear Config Cache
```powershell
docker-compose exec backend php artisan config:clear
docker-compose exec backend php artisan cache:clear
```

### 3. Test Login Endpoint
Try logging in from the frontend again. The CORS error should be resolved.

### 4. Check Backend Logs
If 500 error persists, check logs:
```powershell
docker-compose logs backend --tail 100
```

## Common Issues

### Issue: Still getting CORS error
**Solution**: 
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check browser console for actual error

### Issue: 500 Internal Server Error
**Possible causes**:
1. **JWT Secret not set** - Run: `docker-compose exec backend php artisan jwt:secret --force`
2. **Database connection issue** - Check: `docker-compose logs db`
3. **User not found** - Make sure users are seeded: `docker-compose exec backend php artisan db:seed --class=AdminSeeder`
4. **Password hash issue** - Check if passwords are hashed correctly

### Issue: "Invalid credentials" (401)
**Solution**: 
- Make sure you're using the correct login format:
  - Username: `admin` OR Email: `admin@alefdelta.com`
  - Password: `admin123`
- Check user exists: `docker-compose exec backend php artisan tinker` then `User::where('username', 'admin')->first()`

## Debug Steps

### 1. Check if user exists
```powershell
docker-compose exec backend php artisan tinker
```
Then run:
```php
User::where('username', 'admin')->first();
```

### 2. Test password
```php
$user = User::where('username', 'admin')->first();
Hash::check('admin123', $user->password); // Should return true
```

### 3. Test JWT
```php
$credentials = ['username' => 'admin', 'password' => 'admin123'];
JWTAuth::attempt($credentials);
```

### 4. Check CORS headers
Open browser DevTools → Network tab → Check response headers for:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, GET, OPTIONS`
- `Access-Control-Allow-Headers: *`

## If Still Not Working

1. **Rebuild backend container**:
   ```powershell
   docker-compose build backend
   docker-compose up -d backend
   ```

2. **Reset database and reseed**:
   ```powershell
   reset_db.bat
   ```

3. **Check frontend API URL**:
   - Make sure frontend is calling: `http://localhost:4001/api/auth/login`
   - Not: `http://localhost:8000/api/auth/login`

4. **Check browser console**:
   - Look for actual error message
   - Check Network tab for request/response details

