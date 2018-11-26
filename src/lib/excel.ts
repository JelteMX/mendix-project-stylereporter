import XLSX = require('xlsx');
import {
    WorkBook
} from 'xlsx';

function datenum(v, date1904 = false) {
    if (date1904) v += 1462;
    const epoch = Date.parse(v);
    const r = +(new Date(Date.UTC(1899, 11, 30)));
    return (epoch - r / (24 * 60 * 60 * 1000));
}

function sheet_from_array_of_arrays(data) {
    let ws = {};
    let range = {
        s: {
            c: 10000000,
            r: 10000000
        },
        e: {
            c: 0,
            r: 0
        }
    };
    for (var R = 0; R != data.length; ++R) {
        for (var C = 0; C != data[R].length; ++C) {
            if (range.s.r > R) range.s.r = R;
            if (range.s.c > C) range.s.c = C;
            if (range.e.r < R) range.e.r = R;
            if (range.e.c < C) range.e.c = C;
            var cell = {
                v: data[R][C],
                t: null,
                z: undefined
            };
            if (cell.v == null) continue;
            var cell_ref = XLSX.utils.encode_cell({
                c: C,
                r: R
            });

            if (typeof cell.v === 'number') cell.t = 'n';
            else if (typeof cell.v === 'boolean') cell.t = 'b';
            else if (cell.v instanceof Date) {
              cell.t = 'n';
              cell.z = XLSX.SSF._table[14];
              cell.v = datenum(cell.v);
            }
            else cell.t = 's';

            ws[cell_ref] = cell;
        }
    }
    if (range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
    return ws;
}

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
            this.wb.Sheets[sheet.title] = sheet_from_array_of_arrays(sheet.data);
        });

        XLSX.writeFile(this.wb, filename, { bookSST: true });
    }
}

export default Writer;
