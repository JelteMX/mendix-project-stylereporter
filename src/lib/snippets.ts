import chalk from 'chalk';
import { customwidgets, IStructure, pages } from "mendixmodelsdk";
import { Sheet } from "./excel";
import { getPropertyFromStructure, Logger, logSublevel } from './helpers';
import Store from './store';
import { handleWidget } from './widgets';

export function handleSnippet(structure: IStructure, logger: Logger, line: string[], store: Store, location: string) {
    const snippetStructure = structure as pages.SnippetCallWidget;
    const snippetCall = snippetStructure.snippetCall;
    const snippet = snippetCall instanceof pages.SnippetCall ? snippetCall.snippet : false;

    if (snippet instanceof pages.Snippet) {
        logger.log(`    ${logger.spec('snippet')}:   ${snippet.qualifiedName}`);
        line.push(snippet.qualifiedName);
        store.addSnippet(snippet.qualifiedName, location);
    } else if (snippet === null) {
        const aPArray = snippetCall.allProperties().filter(aP => aP.name === 'snippet');
        let val = '';
        if (aPArray.length === 1) {
            const sn = aPArray[0];
            val = sn.observableValue && sn.observableValue.value || false;
        }
        if (val !== '') {
            logger.log(`    ${logger.spec('snippet')}:   ${val}`);
            line.push(val);
            store.addSnippet(val, location);
        } else {
            logger.log(`    ${logger.spec('snippet')}:   ${chalk.red('unknown')}`);
            line.push('-unknown-');
        }
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
                snippet.excluded ? 'true' : 'false',
                snippet.qualifiedName,
                '',
                '---',
                '---'
            ]);

            snippet.traverse(structure => {
                const nameProp = getPropertyFromStructure(structure, `name`);
                const classProp = getPropertyFromStructure(structure, `class`);
                const styleProp = getPropertyFromStructure(structure, `style`);
                if (nameProp && classProp && !(structure instanceof pages.Page)) {

                    let line = [
                        'Snippet',
                        snippet.excluded ? 'true' : 'false',
                        snippet.qualifiedName,
                        '',
                        structure.structureTypeName.replace('Pages$', '').replace('CustomWidgets$', ''),
                        nameProp.get(),
                        classProp.get(),
                        styleProp.get()
                    ];

                    logSublevel(logger, {
                        name: <string>nameProp.get(),
                        type: <string>structure.structureTypeName.replace('Pages$', ''),
                        className: <string>classProp.get(),
                        style: <string>styleProp.get()
                    });

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
