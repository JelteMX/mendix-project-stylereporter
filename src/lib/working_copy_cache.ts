import { readJSON, writeJSON } from 'fs-extra';

export default class WorkingCopyCache {
    cache: any
    filename: string
    key: string

    constructor(key: string, cache_file_name?: string) {
        this.cache = {};
        this.key = key;
        this.filename = cache_file_name || './working_copy_cache.json';
    }

    async init() {
        const loaded = await this.load();
        if (false === loaded) {
            await this.write();
        }
    }

    load() {
        return new Promise(async (resolve, reject) => {
            try {
                const cacheFile = await readJSON(this.filename);
                this.cache = cacheFile;
                resolve(this.cache);
            } catch (e) {
                console.log('No workcopy cache found');
                resolve(false);
            }
        })
    }

    write() {
        return new Promise(async (resolve, reject) => {
            try {
                await writeJSON(this.filename, this.cache);
                resolve(this.cache);
            } catch (e) {
                console.log('Error writing working copy cache');
                resolve(false);
            }
        });
    }
}
