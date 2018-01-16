import { MendixSdkClient, OnlineWorkingCopy, Project, Revision, Branch, loadAsPromise } from "mendixplatformsdk";
import { ModelSdkClient, IModel, Model, projects, domainmodels, microflows, pages, customwidgets, navigation, texts, security, IStructure, menus, AbstractProperty } from "mendixmodelsdk";

import when = require('when');
import { Sheet } from "../excel";
import Store from './store';
import util = require('util');
import chalk from 'chalk';

import { getPropertyFromStructure, Logger } from './helpers';

export function loadAllPages(model: IModel): When.Promise<pages.Page[]> {
    return when.all(model.allPages().map(page => new Promise((resolve, reject) => { page.load(resolve) })));
}

export function processPagesElements(allPages: pages.Page[], sheet: Sheet, moduleName: string, logger: Logger, store: Store) {
    return new Promise((resolve, reject) => {
        allPages.forEach(page => {
            if (moduleName !== '' && page.qualifiedName.indexOf(moduleName) !== 0) {
                return;
            }
            logger.log(`${logger.el('name')}:       ${page.qualifiedName}`);
            logger.log(`${logger.el('layout')}:     ${page.layoutCall.layoutQualifiedName}`);
            logger.log(`${logger.el('classNames')}: ${page.class}`);
            logger.log(`${logger.el('styles')}:     ${page.style}`);

            sheet.addLine([
                'Page',
                page.qualifiedName,
                page.layoutCall.layoutQualifiedName,
                '---',
                '---',
                page.class,
                page.style
            ]);

            store.addClasses(page.class);
            store.addLayout(page.layoutCall.layoutQualifiedName, `Page:${page.qualifiedName}`);

            logger.log(`${logger.el('elements')}:`);
            page.traverse(structure => {
                let line: string[];
                const nameProp = getPropertyFromStructure(structure, `name`);
                const classProp = getPropertyFromStructure(structure, `class`);
                const styleProp = getPropertyFromStructure(structure, `style`);
                if (nameProp && classProp && !(structure instanceof pages.Page)) {
                    logger.log(`  ${logger.el('name')}:        ${nameProp.get()}`);
                    logger.log(`    ${logger.el('type')}:      ${structure.structureTypeName.replace('Pages$', '')}`);
                    logger.log(`    ${logger.el('class')}:     ${classProp.get()}`);
                    logger.log(`    ${logger.el('style')}:     ${styleProp.get()}`);

                    store.addClasses(classProp.get());

                    line = [
                        'Page',
                        page.qualifiedName,
                        '',
                        structure.structureTypeName.replace('Pages$', ''),
                        nameProp.get(),
                        classProp.get(),
                        styleProp.get()
                    ];

                    if (structure instanceof pages.SnippetCallWidget) {
                        const snippetStructure = structure as pages.SnippetCallWidget;
                        const snippetCall = getPropertyFromStructure(snippetStructure, `snippetCall`).get();
                        const snippet = getPropertyFromStructure(snippetCall, 'snippet').get() as pages.ISnippet;
                        if (snippet) {
                            logger.log(`    ${logger.spec('snippet')}:   ${snippet.qualifiedName}`);
                            line.push(snippet.qualifiedName);
                            store.addSnippet(snippet.qualifiedName, `Page:${page.qualifiedName}`);
                        } else {
                            logger.log(`    ${logger.spec('snippet')}:   ${chalk.red('unknown')}`);
                            line.push('-unknown-');
                        }
                    } else {
                        line.push('');
                    }

                    if (structure instanceof customwidgets.CustomWidget) {
                        const widgetStructure = structure as customwidgets.CustomWidget;
                        const widgetJSON = widgetStructure.toJSON() as any;
                        const widgetID = widgetJSON.type && widgetJSON.type.widgetId || null;
                        logger.log(`    ${logger.spec('widget')}:    ${widgetID}`);
                        line.push(widgetID);
                        if (widgetID !== null) {
                            store.addWidget(widgetID, `Page:${page.qualifiedName}`);
                        }
                    }

                    sheet.addLine(line);
                }
            })
            logger.log(`\n=====================[ END PAGE ]========================\n`);
        });
        resolve();
    });
}
