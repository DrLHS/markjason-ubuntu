// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  // Force software rendering for WSL2/Linux compatibility
  // (WebKit EGL fails without real GPU passthrough in WSL2)
  // On Windows, Tauri uses WebView2 — these are not needed.
  #[cfg(target_os = "linux")]
  {
    if std::env::var("WEBKIT_DISABLE_COMPOSITING_MODE").is_err() {
      std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
    }
    if std::env::var("LIBGL_ALWAYS_SOFTWARE").is_err() {
      std::env::set_var("LIBGL_ALWAYS_SOFTWARE", "1");
    }
  }

  markjason_lib::run();
}
