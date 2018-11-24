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

function loadDocuments(all: any[], identifier?: string): When.Promise<any> {
    let loaded = 0;
    console.log(`Loading ${all.length} ${identifier}s`);
    return when
        .all(all.map(form => new Promise((resolve, reject) => {
            try {
                form.load(el => {
                    console.log(`Loaded ${loaded++}/${all.length} ${identifier}s`);
                    resolve(el);
                });
            } catch (e) {
                console.log(`Error loading ${identifier}`, e)
                reject(e);
            }
        })));
}

export function loadAllLayouts(model: IModel): When.Promise<pages.Layout[]> {
    return (<When.Promise<pages.Layout[]>>loadDocuments(model.allLayouts(), 'layout'));
}

export function loadAllPages(model: IModel): When.Promise<pages.Page[]> {
    return (<When.Promise<pages.Page[]>>loadDocuments(model.allPages(), 'page'));
}

export function loadAllSnippets(model: IModel): When.Promise<pages.Snippet[]> {
    return (<When.Promise<pages.Snippet[]>>loadDocuments(model.allSnippets(), 'snippet'));
}

export function loadAllMicroflows(model: IModel): When.Promise<microflows.Microflow[]> {
    return (<When.Promise<microflows.Microflow[]>>loadDocuments(model.allMicroflows(), 'microflow'));
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
