import chalk from 'chalk';
import { AbstractProperty, IModel, IStructure, microflows, pages, Model, javaactions } from "mendixmodelsdk";
import when = require('when');

export function getPropertyFromStructure(structure: IStructure , propName: string): AbstractProperty<any, any> {
    const properties = structure.allProperties().filter(prop => prop.name && prop.name === propName);
    return properties ? properties[0] : null;
}

export function getPropertyListValues(structure: IStructure, props: string[]): AbstractProperty<any, any>[] {
    const properties = structure.allProperties().filter(prop => prop.name && props.indexOf(prop.name) !== -1);
    return properties || [];
}

export function getPropertyList(structure: IStructure) {
    return structure.allProperties().map(prop => prop.name).filter(n => typeof n !== 'undefined');
}

function loadDocuments<T>(all: any[], identifier?: string): When.Promise<T> {
    let loaded = 0;
    console.log(`Loading ${all.length} ${identifier}s`);
    return when
        .all(all.map(document => new Promise((resolve, reject) => {
            try {
                document.load(loadedDoc => {
                    console.log(`Loaded ${loaded++}/${all.length} ${identifier}s`);
                    resolve(loadedDoc);
                });
            } catch (e) {
                console.log(`Error loading ${identifier}`, e)
                reject(e);
            }
        })));
}

export function loadAllLayouts(model: IModel): When.Promise<pages.Layout[]> {
    return loadDocuments(model.allLayouts(), 'layout');
}

export function loadAllPages(model: IModel): When.Promise<pages.Page[]> {
    return loadDocuments(model.allPages(), 'page');
}

export function loadAllSnippets(model: IModel): When.Promise<pages.Snippet[]> {
    return loadDocuments(model.allSnippets(), 'snippet');
}

export function loadAllMicroflows(model: IModel): When.Promise<microflows.Microflow[]> {
    return loadDocuments(model.allMicroflows(), 'microflow');
}

export function loadAllJavaActions(model: IModel): When.Promise<javaactions.JavaAction[]> {
    return loadDocuments(model.allJavaActions(), 'javaaction');
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

    el(...args: string[]) {
        return chalk.cyan(...args);
    }

    spec(...args: string[]) {
        return chalk.magenta(...args);
    }
}

interface subLevelProps {
    name:string
    type:string
    className:string
    style:string
}

export function logSublevel(logger:Logger, {name, type, className, style}:subLevelProps) {
    logger.log(`  ${logger.el('name')}:        ${name}`);
    logger.log(`    ${logger.el('type')}:      ${type}`);
    logger.log(`    ${logger.el('class')}:     ${className}`);
    logger.log(`    ${logger.el('style')}:     ${style}`);
}
