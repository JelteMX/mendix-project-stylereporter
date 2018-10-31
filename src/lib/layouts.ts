import { MendixSdkClient, OnlineWorkingCopy, Project, Revision, Branch, loadAsPromise } from "mendixplatformsdk";
import { ModelSdkClient, IModel, Model, projects, domainmodels, microflows, pages, navigation, customwidgets, texts, security, IStructure, menus, AbstractProperty } from "mendixmodelsdk";

import when = require('when');
import { Sheet } from "../excel";
import Store from './store';
import util = require('util');
import chalk from 'chalk';

import { getPropertyFromStructure, getPropertyList, Logger } from './helpers';

export function processLayouts(layouts: pages.Layout[], sheet: Sheet, moduleName: string, logger: Logger, store: Store) {
    return new Promise((resolve, reject) => {
        layouts.forEach(layout => {
            logger.log(`  ${logger.el('name')}:        ${layout.qualifiedName}`);
            logger.log(`    ${logger.el('class')}:     ${layout.class}`);
            logger.log(`    ${logger.el('style')}:     ${layout.style}`);

            sheet.addLine([
                'Layout',
                layout.qualifiedName,
                '',
                '---',
                '---',
                layout.class,
                layout.style
            ]);

            store.addClasses(layout.class);

            logger.log(`    ${logger.el('elements')}:`);
            layout.traverse(structure => {
                let line = [
                    'Layout',
                    layout.qualifiedName,
                    '',
                    structure.structureTypeName.replace('Pages$', '')
                ];
                const nameElProp = getPropertyFromStructure(structure, `name`);
                const classElProp = getPropertyFromStructure(structure, `class`);
                const styleElProp = getPropertyFromStructure(structure, `style`);
                if (nameElProp && !(structure instanceof pages.Layout)) {
                    line.push(nameElProp.get());
                    logger.log(`       ${logger.el('name')}:        ${nameElProp.get()}`);
                    logger.log(`         ${logger.el('type')}:      ${structure.structureTypeName.replace('Pages$', '')}`);
                    if (classElProp) {
                        logger.log(`         ${logger.el('class')}:     ${classElProp.get()}`);
                        store.addClasses(classElProp.get());
                        line.push(classElProp.get());
                    }
                    if (styleElProp) {
                        logger.log(`         ${logger.el('style')}:     ${styleElProp.get()}`);
                        line.push(styleElProp.get());
                    }

                    if (structure instanceof pages.SnippetCallWidget) {
                        const snippetStructure = structure as pages.SnippetCallWidget;
                        const snippetCall = getPropertyFromStructure(snippetStructure, `snippetCall`).get();
                        const snippet = getPropertyFromStructure(snippetCall, 'snippet').get() as pages.ISnippet;
                        if (snippet) {
                            logger.log(`    ${logger.spec('snippet')}:   ${snippet.qualifiedName}`);
                            line.push(snippet.qualifiedName);
                            store.addSnippet(snippet.qualifiedName, `Layout:${layout.qualifiedName}`);
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
                        logger.log(`         ${logger.spec('widget')}:    ${widgetID}`);
                        line.push(widgetID);
                        if (widgetID !== null) {
                            store.addWidget(widgetID, `Layout:${layout.qualifiedName}`);
                        }
                    }

                    sheet.addLine(line);
                }
            })
            logger.log(`\n=====================[ END LAYOUT ]========================\n`);
        });
        resolve();
    });
}
