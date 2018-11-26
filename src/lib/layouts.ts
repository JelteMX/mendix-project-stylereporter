import { customwidgets, pages } from "mendixmodelsdk";
import { Sheet } from "../excel";
import { getPropertyFromStructure, Logger } from './helpers';
import { handleSnippet } from "./snippets";
import Store from './store';
import { handleWidget } from './widgets';

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
                        handleSnippet(structure, logger, line, store, `Layout:${layout.qualifiedName}`);
                    } else {
                        line.push('');
                    }

                    if (structure instanceof customwidgets.CustomWidget) {
                        handleWidget(structure, logger, line, nameElProp.get(), store, `Layout:${layout.qualifiedName}`);
                    }

                    sheet.addLine(line);
                }
            })
            logger.log(`\n=====================[ END LAYOUT ]========================\n`);
        });
        resolve();
    });
}
