class LogService {
  log(message: string) {
    console.log(message);
  }

  error(message: string, error?: any) {
    console.error(message);
  }
}

export default new LogService();
