import chalk from 'chalk';
import { customwidgets, IStructure, pages } from "mendixmodelsdk";
import { Sheet } from "./excel";
import { getPropertyFromStructure, Logger, logSublevel } from './helpers';
import Store from './store';
import { handleWidget } from './widgets';

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
                const nameProp = getPropertyFromStructure(structure, `name`);
                const classProp = getPropertyFromStructure(structure, `class`);
                const styleProp = getPropertyFromStructure(structure, `style`);
                if (nameProp && classProp && !(structure instanceof pages.Page)) {

                    let line = [
                        'Snippet',
                        snippet.qualifiedName,
                        '',
                        structure.structureTypeName.replace('Pages$', ''),
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
