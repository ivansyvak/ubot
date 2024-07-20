import * as fs from 'fs';

export default class StorageService<T> {

  private get storagePath() {
    return `storage/${this.storageName}.json`;
  }

  constructor(private storageName: string) {}

  private async checkStorageFolder() {
    return new Promise<void>((resolve, reject) => {
      fs.access('storage', fs.constants.F_OK, (err) => {
        if (err) {
          fs.mkdir('storage', (err) => {
            if (err) {
              reject(err);
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }

  private async checkStorageFile() {
    await this.checkStorageFolder();

    return new Promise<void>((resolve, reject) => {
      fs.access(this.storagePath, fs.constants.F_OK, (err) => {
        if (err) {
          fs.writeFile(this.storagePath, '{}', (err) => {
            if (err) {
              reject(err);
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }

  private async readStorageFile() {
    await this.checkStorageFile();

    return new Promise<string>((resolve, reject) => {
      fs.readFile(this.storagePath, 'utf-8', (err, data) => {
        if (err) {
          reject(err);
        }

        resolve(data.trim());
      });
    });
  }

  public async get(key: string): Promise<T> {
    const data = await this.readStorageFile();

    const storage = JSON.parse(data);

    return storage[key];
  }

  public async set(key: string, value: T): Promise<boolean> {  
    const data = await this.readStorageFile();

    const storage = JSON.parse(data);

    return new Promise<boolean>((resolve, reject) => {
      fs.writeFile(this.storagePath, JSON.stringify({...storage, [key]: value}), (err) => {
        if (err) {
          reject(err);
        }

        resolve(true);
      });
    });
  }

  public async list(): Promise<{[key: string]: T}> {
    const data = await this.readStorageFile();

    const storage = JSON.parse(data);

    return storage;
  }
}
