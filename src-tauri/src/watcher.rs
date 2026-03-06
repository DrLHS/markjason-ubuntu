use notify_debouncer_mini::{new_debouncer, DebouncedEventKind};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};

type Debouncer = notify_debouncer_mini::Debouncer<notify::RecommendedWatcher>;

pub struct WatcherState {
    watchers: Mutex<HashMap<String, Debouncer>>,
}

impl WatcherState {
    pub fn new() -> Self {
        Self {
            watchers: Mutex::new(HashMap::new()),
        }
    }
}

#[tauri::command]
pub fn watch_file(
    app: AppHandle,
    state: State<'_, WatcherState>,
    path: String,
) -> Result<(), String> {
    let mut watchers = state.watchers.lock().map_err(|e| e.to_string())?;

    if watchers.contains_key(&path) {
        return Ok(());
    }

    let emit_path = path.clone();
    let app_handle = app.clone();

    let mut debouncer = new_debouncer(Duration::from_millis(500), move |res: Result<Vec<notify_debouncer_mini::DebouncedEvent>, notify::Error>| {
        if let Ok(events) = res {
            for event in events {
                if event.kind == DebouncedEventKind::Any {
                    let _ = app_handle.emit("file-changed", serde_json::json!({ "path": emit_path }));
                }
            }
        }
    })
    .map_err(|e| e.to_string())?;

    debouncer
        .watcher()
        .watch(
            std::path::Path::new(&path),
            notify::RecursiveMode::NonRecursive,
        )
        .map_err(|e| e.to_string())?;

    watchers.insert(path, debouncer);
    Ok(())
}

#[tauri::command]
pub fn unwatch_file(state: State<'_, WatcherState>, path: String) -> Result<(), String> {
    let mut watchers = state.watchers.lock().map_err(|e| e.to_string())?;
    watchers.remove(&path);
    Ok(())
}
