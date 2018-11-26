import { microflows, pages } from "mendixmodelsdk";
import { Sheet } from "../excel";
import { getPropertyFromStructure, Logger } from './helpers';
import Store from './store';

export function processMicroflows(mics: microflows.Microflow[], sheet: Sheet, moduleName: string, logger: Logger, store: Store) {
    return new Promise((resolve, reject) => {
        mics.forEach(microflow => {
            if (moduleName !== '' && microflow.qualifiedName.indexOf(moduleName) !== 0) {
                return;
            }
            let shown = false;
            microflow.traverse(structure => {
                let line: string[];
                if (structure.structureTypeName && (structure.structureTypeName.toLowerCase().indexOf('showpageaction') !== -1)) {
                    const pageSettings: pages.PageSettings = getPropertyFromStructure(structure, 'pageSettings').get();
                    if (pageSettings.pageQualifiedName) {
                        if (!shown) {
                            logger.log(`${logger.el('name')}:  ${microflow.qualifiedName}`);
                            logger.log(`${logger.el('open page actions')}:`);
                            shown = true;
                        }
                        logger.log(`    ${pageSettings.pageQualifiedName}`);
                        sheet.addLine([
                            'microflow',
                            microflow.qualifiedName,
                            pageSettings.pageQualifiedName
                        ]);
                    }
                }
            });
            if (shown) {
                logger.log(`\n=====================[ END MICROFLOW ]========================\n`);
            }
        });
        resolve();
    });
}
