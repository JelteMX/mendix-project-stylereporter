import { readJSON, writeJSON, readFile, writeFile } from 'fs-extra';
import * as crypto from 'crypto';
const Cryptr = require('cryptr');

interface UserDetails {
    MODEL_SDK_USER: string
    MODEL_SDK_TOKEN: string
}

interface ICryptr {
    encrypt: (string) => string
    decrypt: (string) => string
}
export default class WorkingCopyCache {
    cache: any
    filename: string
    key: string
    cryptr: ICryptr
    userDetails: UserDetails

    constructor(userDetails:UserDetails, key: string) {
        this.cache = {};
        this.userDetails = userDetails;
        this.key = key;

        const hash = crypto.createHash('sha256');
        const str = `${this.userDetails.MODEL_SDK_USER}::${this.userDetails.MODEL_SDK_TOKEN}`;
        hash.update(str);
        this.filename = `./reporter-cache-${hash.digest('hex')}.dat`;
        this.cryptr = new Cryptr(`${this.userDetails.MODEL_SDK_TOKEN}::${this.userDetails.MODEL_SDK_USER}`)
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
                const file = await readFile(this.filename, 'UTF-8');
                const jsonString = this.cryptr.decrypt(file);
                this.cache = JSON.parse(jsonString);
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
                const encryptedString = this.cryptr.encrypt(JSON.stringify(this.cache));
                await writeFile(this.filename, encryptedString);
                resolve(this.cache);
            } catch (e) {
                console.log('Error writing working copy cache');
                resolve(false);
            }
        });
    }

    get_key() {
        if (typeof this.cache[this.key] === 'undefined') {
            return null;
        }
        const time = parseInt(this.cache[this.key].split(':')[0], 10);
        const id = this.cache[this.key].split(':')[1];
        return {
            time,
            id
        }
    }

    set_key(id: string) {
        const date = new Date();
        this.cache[this.key] = `${date.getTime()}:${id}`;
        return this.write();
    }
}
