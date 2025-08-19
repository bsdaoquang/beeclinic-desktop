# 📦 BeeClinic – Publish Thủ Công

## 1. Xóa CI/CD cũ
- Xóa thư mục `.github/workflows/` nếu có.  
- Loại bỏ script CI/CD không dùng trong `package.json`.  

---

## 2. Cấu hình `package.json`

```json
"build": {
  "appId": "com.beeclinic.desktop",
  "productName": "BeeClinic",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "main/**/*",
    "preload.js",
    "package.json"
  ],
  "mac": {
    "target": ["dmg", "zip"],
    "icon": "assets/icons/icon.icns"
  },
  "win": {
    "target": ["nsis"],
    "icon": "assets/icons/icon.ico"
  },
  "publish": [
    {
      "provider": "github",
      "owner": "bsdaoquang",
      "repo": "beeclinic-desktop"
    }
  ]
}
```

👉 `publish` phải trỏ đúng repo GitHub public.  

---

## 3. Build app

```bash
npx electron-builder -mwl
```

- `-mwl`: build cho macOS, Windows, Linux.  
- Kết quả trong thư mục `release/` gồm:  
  - `BeeClinic-0.0.X.dmg` (macOS)  
  - `BeeClinic Setup 0.0.X.exe` (Windows)  
  - `latest.yml`, `latest-mac.yml`  
  - `*.blockmap`  

---

## 4. Upload thủ công với GitHub CLI

1. Cài GitHub CLI  
   ```bash
   brew install gh   # macOS
   ```

2. Đăng nhập  
   ```bash
   gh auth login
   ```

3. Tạo release mới và upload file  
   ```bash
   gh release create v0.0.X ./release/*
   ```

---

## 5. Kiểm tra Release
Trên GitHub → tab **Releases**, phải có đủ file:  

- `.dmg`  
- `.exe`  
- `latest.yml` / `latest-mac.yml`  
- `.blockmap`  

Nếu thiếu `latest.yml` → auto update sẽ không hoạt động.  

---

## 6. Test auto update
- Cài lại bản cũ (ví dụ 0.0.3).  
- Mở ứng dụng, autoUpdater sẽ kiểm tra GitHub Release → nếu có bản mới (0.0.4) sẽ báo update.  

---

## 7. Debug auto update
Trong `main.js`:

```js
const { autoUpdater } = require("electron-updater");
autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";

app.on("ready", () => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

📂 Log:  
- macOS: `~/Library/Logs/BeeClinic/log.log`  
- Windows: `%USERPROFILE%\AppData\Roaming\BeeClinic\logs\log.log`  
