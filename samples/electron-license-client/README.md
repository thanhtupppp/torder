# Electron License Client Sample

Bộ mẫu chuẩn để Electron app kết nối License Manager.

## 1) Mục tiêu

- Activate key
- Verify key định kỳ
- Deactivate key
- Mã hóa + lưu `license_data` local
- IPC chuẩn giữa renderer ↔ main

## 2) Cấu trúc

- `main/licenseService.js`: logic gọi API activate/verify/deactivate
- `main/ipc.js`: đăng ký IPC handlers
- `main/cryptoUtil.js`: AES-256-GCM encrypt/decrypt `license_data`
- `main/preload.js`: expose API an toàn cho renderer
- `renderer/index.html`, `renderer/renderer.js`: UI flow nhập key

## 3) Cấu hình

Copy `.env.example` thành `.env` (hoặc set env khi start app):

```env
LM_CLIENT_BASE_URL=https://license.trathainguyenviluyen.com/
LM_CLIENT_API_KEY=your_external_api_key
LM_CLIENT_PRODUCT_ID=PROD-001
LM_CLIENT_VERIFY_TYPE=non_envato
LM_CLIENT_TIMEOUT_MS=15000
```

## 4) Chạy thử

```bash
npm install
npm run start
```

## 5) Cách hoạt động

### Activate

- Endpoint: `POST /api/external/license/activate`
- Payload:
  - `verify_type`
  - `product_id`
  - `license_code`
  - `client_name`
- Kết quả: lấy `lic_response` (hoặc `data.license_data`) rồi mã hóa lưu local.

### Verify

- Endpoint: `POST /api/external/license/verify`
- Payload:
  - `product_id`
  - `license_data` (đã lưu local)
  - `client_name`

### Deactivate

- Endpoint: `POST /api/external/license/deactivate`
- Payload tương tự verify.
- Thành công thì xóa local license.

## 6) Bảo mật khuyến nghị

- Không hardcode API key trong source.
- Đổi cơ chế machine fingerprint để chống copy license file.
- Có thể thêm ký app/version trong header.
- Bật SSL pinning hoặc check cert nếu cần mức bảo mật cao hơn.

## 7) Lưu ý backend (lỗi bảng lm_products)

Nếu server báo thiếu bảng `lm_products`, chạy migration trên license server:

```bash
php artisan migrate --force
```

Và đảm bảo plugin `license-manager` đang active.
