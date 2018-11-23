import { IStructure, AbstractProperty, IModel, pages, microflows, customwidgets } from "mendixmodelsdk";
import * as _ from 'lodash';
import chalk from 'chalk';
import when = require('when');

export function getPropertyFromStructure(structure: IStructure , propName: string): AbstractProperty<any, any> {
    const r = structure.allProperties().filter(prop => prop.name && prop.name === propName);
    return r ? r[0] : null;
}

export function getPropertyListValues(structure: IStructure, props: string[]): AbstractProperty<any, any>[] {
    const r = structure.allProperties().filter(prop => prop.name && props.indexOf(prop.name) !== -1);
    return r || [];
}

export function getPropertyList(structure: IStructure) {
    return structure.allProperties().map(prop => prop.name).filter(n => typeof n !== 'undefined');
}

export function loadAllLayouts(model: IModel): When.Promise<pages.Layout[]> {
    const all = model.allLayouts();
    let loaded = 0;
    console.log(`Loading ${all.length} layouts`);
    return when
        .all(all.map(layout => new Promise((resolve, reject) => {
            try {
                layout.load(el => {
                    console.log(`Loaded ${loaded++}/${all.length} layouts`);
                    resolve(el);
                });
            } catch (e) {
                console.log('Error loading layout', e)
                reject(e);
            }
        })));
}

export function loadAllPages(model: IModel): When.Promise<pages.Page[]> {
    const all = model.allPages();
    let loaded = 0;
    console.log(`Loading ${all.length} pages`);
    return when
        .all(all.map(page => new Promise((resolve, reject) => {
            try {
                page.load(el => {
                    console.log(`Loaded ${loaded++}/${all.length} pages`);
                    resolve(el);
                });
            } catch (e) {
                console.log('Error loading page', e)
                reject(e);
            }
        })));
}

export function loadAllSnippets(model: IModel): When.Promise<pages.Snippet[]> {
    const all = model.allSnippets();
    let loaded = 0;
    console.log(`Loading ${all.length} snippets`);
    return when
        .all(all.map(snippet => new Promise((resolve, reject) => {
            try {
                snippet.load(el => {
                    console.log(`Loaded ${loaded++}/${all.length} snippets`);
                    resolve(el);
                }) ;
            }catch (e) {
                console.log('Error loading snippet', e)
                reject(e);
            }
        })));
}

export function loadAllMicroflows(model: IModel): When.Promise<microflows.Microflow[]> {
    const all = model.allMicroflows();
    let loaded = 0;
    console.log(`Loading ${all.length} microflow`);
    return when
        .all(all.map(microflow => new Promise((resolve, reject) => {
            try {
                microflow.load(el => {
                    console.log(`Loaded ${loaded++}/${all.length} microflow`);
                    resolve(el);
                }) ;
            }catch (e) {
                console.log('Error loading microflow', e)
                reject(e);
            }
        })));
}

export interface Logger {
    verbose: boolean;
}
export class Logger {
    constructor(verbose) {
        this.verbose = verbose;
    }

    log(...args) {
        if (this.verbose) {
            console.log.apply(console, args);
        }
    }

    padLog(padding: number = 0, str: string) {

    }

    el(...args: string[]) {
        return chalk.cyan(...args);
    }

    spec(...args: string[]) {
        return chalk.magenta(...args);
    }
}
