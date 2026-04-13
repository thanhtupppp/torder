import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../constants/routes";
import { setCurrentSession } from "../../app/auth/session";
import type { AppPermission } from "../../app/permissions";

export function LoginScreen() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    const authApi = window.appApi?.auth;
    if (!authApi?.login) {
      setError("Auth API chưa sẵn sàng. Vui lòng khởi động lại ứng dụng.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await authApi.login({ phone: phone.trim(), password });
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setCurrentSession({
        ...result.user,
        permissions: result.user.permissions as AppPermission[],
      });

      navigate(APP_ROUTES.sales, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể đăng nhập.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="settings-screen"
      style={{ maxWidth: 720, margin: "0 auto", paddingTop: 60 }}
    >
      <main
        className="settings-screen__content"
        style={{ gridColumn: "1 / -1" }}
      >
        <section className="settings-screen__panel settings-screen__tab settings-screen__tab--fade-in">
          <div className="settings-screen__panel-header">
            <h3>Đăng nhập hệ thống</h3>
          </div>
          <div className="settings-screen__panel-body">
            <div className="settings-screen__field">
              <label className="settings-screen__label">Số điện thoại</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0xxxxxxxxx"
              />
            </div>

            <div className="settings-screen__field">
              <label className="settings-screen__label">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p
                className="settings-screen__help-text"
                style={{ color: "#b91c1c" }}
              >
                {error}
              </p>
            )}

            <div className="settings-screen__actions">
              <button
                className="btn btn--primary"
                type="button"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
