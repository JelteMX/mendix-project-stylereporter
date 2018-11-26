import { customwidgets, pages } from "mendixmodelsdk";
import { Sheet } from "./excel";
import { getPropertyFromStructure, Logger } from './helpers';
import { handleSnippet } from "./snippets";
import Store from './store';
import { handleWidget } from './widgets';

function logTopLevel(logger:Logger, layout: pages.Layout) {
    logger.log(`  ${logger.el('name')}:        ${layout.qualifiedName}`);
    logger.log(`    ${logger.el('class')}:     ${layout.class}`);
    logger.log(`    ${logger.el('style')}:     ${layout.style}`);
}

export function processLayouts(layouts: pages.Layout[], sheet: Sheet, moduleName: string, logger: Logger, store: Store) {
    return new Promise((resolve, reject) => {
        layouts.forEach(layout => {
            logTopLevel(logger, layout);

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
                    const name = nameElProp.get();
                    line.push(name);
                    logger.log(`       ${logger.el('name')}:        ${name}`);
                    logger.log(`         ${logger.el('type')}:      ${structure.structureTypeName.replace('Pages$', '')}`);
                    if (classElProp) {
                        const className = classElProp.get();
                        logger.log(`         ${logger.el('class')}:     ${className}`);
                        store.addClasses(className);
                        line.push(className);
                    }
                    if (styleElProp) {
                        const style = styleElProp.get();
                        logger.log(`         ${logger.el('style')}:     ${style}`);
                        line.push(style);
                    }

                    if (structure instanceof pages.SnippetCallWidget) {
                        handleSnippet(structure, logger, line, store, `Layout:${layout.qualifiedName}`);
                    } else {
                        line.push('');
                    }

                    if (structure instanceof customwidgets.CustomWidget) {
                        handleWidget(structure, logger, line, name, store, `Layout:${layout.qualifiedName}`);
                    }

                    sheet.addLine(line);
                }
            })
            logger.log(`\n=====================[ END LAYOUT ]========================\n`);
        });
        resolve();
    });
}
