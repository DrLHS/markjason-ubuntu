mod watcher;

use watcher::WatcherState;
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(WatcherState::new())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // CLI file arguments: open files passed on the command line
            let file_args: Vec<String> = std::env::args()
                .skip(1)
                .filter(|a| !a.starts_with('-'))
                .filter_map(|a| {
                    let path = std::path::Path::new(&a);
                    match path.canonicalize() {
                        Ok(abs) => Some(abs.to_string_lossy().to_string()),
                        Err(_) => {
                            log::warn!("Skipping unresolvable path: {}", a);
                            None
                        }
                    }
                })
                .collect();

            if !file_args.is_empty() {
                let handle = app.handle().clone();
                // Emit after a short delay so the frontend listener is ready
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(300));
                    let _ = handle.emit("open-files", file_args);
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            watcher::watch_file,
            watcher::unwatch_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
