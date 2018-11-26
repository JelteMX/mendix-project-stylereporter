import { MendixSdkClient, OnlineWorkingCopy, Project, Revision, Branch, loadAsPromise } from "mendixplatformsdk";
import { ModelSdkClient, IModel, Model, projects, domainmodels, customwidgets, microflows, pages, navigation, texts, security, IStructure, menus, AbstractProperty } from "mendixmodelsdk";

import when = require('when');
import { Sheet } from "../excel";
import Store from './store';
import util = require('util');
import chalk from 'chalk';

import { getPropertyFromStructure, Logger, getPropertyList } from './helpers';
import { createCustomWidgetObject, handleWidget} from './widgets';

export function handleSnippet(structure: IStructure, logger: Logger, line: string[], store: Store, location: string) {
    const snippetStructure = structure as pages.SnippetCallWidget;
    const snippetCall = getPropertyFromStructure(snippetStructure, `snippetCall`).get();
    const snippet = getPropertyFromStructure(snippetCall, 'snippet').get() as pages.ISnippet;

    if (snippet) {
        logger.log(`    ${logger.spec('snippet')}:   ${snippet.qualifiedName}`);
        line.push(snippet.qualifiedName);
        store.addSnippet(snippet.qualifiedName, location);
    } else {
        logger.log(`    ${logger.spec('snippet')}:   ${chalk.red('unknown')}`);
        line.push('-unknown-');
    }
}

export function processSnippets(snippets: pages.Snippet[], sheet: Sheet, moduleName: string, logger: Logger, store: Store) {
    return new Promise((resolve, reject) => {
        snippets.forEach(snippet => {
            if (moduleName !== '' && snippet.qualifiedName.indexOf(moduleName) !== 0) {
                return;
            }
            logger.log(`${logger.el('name')}:       ${snippet.qualifiedName}`);
            logger.log(`${logger.el('elements')}:`);

            sheet.addLine([
                'Snippet',
                snippet.qualifiedName,
                '',
                '---',
                '---'
            ]);

            snippet.traverse(structure => {
                let line: string[];
                const nameProp = getPropertyFromStructure(structure, `name`);
                const classProp = getPropertyFromStructure(structure, `class`);
                const styleProp = getPropertyFromStructure(structure, `style`);
                if (nameProp && classProp && !(structure instanceof pages.Page)) {

                    line = [
                        'Snippet',
                        snippet.qualifiedName,
                        '',
                        structure.structureTypeName.replace('Pages$', ''),
                        nameProp.get(),
                        classProp.get(),
                        styleProp.get()
                    ];

                    logger.log(`  ${logger.el('name')}:        ${nameProp.get()}`);
                    logger.log(`    ${logger.el('type')}:      ${structure.structureTypeName.replace('Pages$', '')}`);
                    logger.log(`    ${logger.el('class')}:     ${classProp.get()}`);
                    logger.log(`    ${logger.el('style')}:     ${styleProp.get()}`);

                    store.addClasses(classProp.get());

                    if (structure instanceof pages.SnippetCallWidget) {
                        handleSnippet(structure, logger, line, store, `Snippet:${snippet.qualifiedName}`);
                    } else {
                        line.push('');
                    }

                    if (structure instanceof customwidgets.CustomWidget) {
                        handleWidget(structure, logger, line, nameProp.get(), store, `Snippet:${snippet.qualifiedName}`);
                    }

                    sheet.addLine(line);
                }

            })
            logger.log(`\n=====================[ END SNIPPET ]========================\n`);
        });
        resolve();
    });
}
