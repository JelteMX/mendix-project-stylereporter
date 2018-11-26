import { customwidgets, pages } from "mendixmodelsdk";
import { Sheet } from "../excel";
import { getPropertyFromStructure, Logger } from './helpers';
import { handleSnippet } from "./snippets";
import Store from './store';
import { handleWidget } from './widgets';

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
                        handleSnippet(structure, logger, line, store, `Page:${page.qualifiedName}`);
                    } else {
                        line.push('');
                    }

                    if (structure instanceof customwidgets.CustomWidget) {
                        handleWidget(structure, logger, line, nameProp.get(), store, `Page:${page.qualifiedName}`);
                    }

                    sheet.addLine(line);
                }
            })
            logger.log(`\n=====================[ END PAGE ]========================\n`);
        });
        resolve();
    });
}
