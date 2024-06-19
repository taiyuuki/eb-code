use tokio::sync::mpsc::Sender;
use tokio::sync::Mutex;

pub struct AsyncProcInputTx<T> {
    pub inner: Mutex<Sender<T>>,
}

impl<T> AsyncProcInputTx<T> {
    pub fn new(tx: Sender<T>) -> Self {
        Self {
            inner: Mutex::new(tx),
        }
    }
}
