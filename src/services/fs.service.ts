import * as fs from 'fs';

class FSService {
  async readFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf-8', (err, data) => {
        if (err) {
          reject(err);
        }

        resolve(data);
      });
    });
  }

  async writeFile(path: string, value: string | Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile(path, value, 'utf-8', (err) => {
        if (err) {
          reject(err);
        }

        resolve();
      });
    });
  }

  async removeFile(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.unlink(path, (err) => {
        if (err) {
          reject(err);
        }

        resolve();
      });
    });
  }
}

export default new FSService();