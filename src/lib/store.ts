import fs = require('fs');

export interface StorePart {
    id: string;
    usedIn: string[];
}

export interface Widget extends StorePart {}
export interface Layout extends StorePart {}
export interface Snippet extends StorePart {}

interface Store {
    store: {
        layout: Layout[],
        widget: Widget[],
        snippet: Snippet[],
        classList: string[],
        unused: {
            snippet: string[],
            layout: string[]
        }
    }
}

class Store {
    constructor() {
        this.store = {
            layout: [],
            widget: [],
            snippet: [],
            classList: [],
            unused: {
                snippet: [],
                layout: []
            }
        }
    }

    used(storeId: 'snippet'|'layout'|'widget', id: string) {
        const stored = this.store[storeId].filter(s => s.id === id);
        return stored.length > 0;
    }

    findOrCreate(storeId: 'snippet'|'layout'|'widget', id: string) {
        const stored = this.store[storeId].filter(s => s.id === id);
        if (stored.length > 0) {
            return stored[0];
        }
        const newPart = {
            id,
            usedIn: []
        };
        this.store[storeId].push(newPart);
        return newPart;
    }

    addToUsedId(part: StorePart, usedId: string) {
        if (part.usedIn.indexOf(usedId) === -1) {
            part.usedIn.push(usedId);
        }
    }

    addLayout(id: string, usedId: string) {
        const found = this.findOrCreate('layout', id) as Layout;
        this.addToUsedId(found, usedId);
    }

    addSnippet(id: string, usedId: string) {
        const found = this.findOrCreate('snippet', id) as Snippet;
        this.addToUsedId(found, usedId);
    }

    addWidget(id: string, usedId: string) {
        const found = this.findOrCreate('widget', id) as Widget;
        this.addToUsedId(found, usedId);
    }

    addClasses(classString: string) {
        if (!classString) {
            return;
        }
        let classes = classString.trim();
        if (classes === '') {
            return;
        }
        classes = classes.replace(/\s\s+/g, ' ');
        const classList = classes.split(' ');
        classList.forEach(cl => {
            if (this.store.classList.indexOf(cl) === -1) {
                this.store.classList.push(cl);
            }
        })
    }

    toJSON(): string {
        return JSON.stringify(this.store, null, 4);
    }

    writeFile(filename: string) {
        fs.writeFileSync(filename, this.toJSON());
    }
}

export default Store;
