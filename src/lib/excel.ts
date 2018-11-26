import XLSX = require('xlsx');
import {
    WorkBook
} from 'xlsx';
export interface Book {
    SheetNames: string[];
    Sheets: {};
}

export class Book {
    constructor() {
        if (!(this instanceof Book)) return new Book();
        this.SheetNames = [];
        this.Sheets = {};
    }
}

export interface Sheet {
    title: string;
    data: string[][];
}

export class Sheet {
    constructor(title: string, headers: string[]) {
        this.title = title;
        this.data = [];
        this.addLine(headers);
    }

    addLine(data: string[]) {
        this.data.push(data);
    }
}

interface Writer {
    wb: Book;
    sheets: Sheet[];
}

class Writer {
    constructor() {
        this.wb = new Book();
        this.sheets = [];
    }

    createSheet(title: string, headers: string[]) {
        const sheet = new Sheet(title, headers);
        this.sheets.push(sheet);
        return sheet;
    }

    writeFile(filename) {
        this.sheets.forEach(sheet => {
            this.wb.SheetNames.push(sheet.title);
            this.wb.Sheets[sheet.title] = XLSX.utils.aoa_to_sheet(sheet.data);
        });

        XLSX.writeFile(this.wb, filename, { bookSST: true });
    }
}

export default Writer;
