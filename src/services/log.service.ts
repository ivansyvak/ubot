class LogService {
  log(message: string) {
    console.log(message);
  }

  error(message: string, error?: any) {
    console.error(message);
    if (error) {
      console.error(error);
    }
  }
}

export default new LogService();
