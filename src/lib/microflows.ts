import { microflows, pages } from "mendixmodelsdk";
import { Sheet } from "./excel";
import { getPropertyFromStructure, Logger, getPropertyList } from './helpers';
import Store from './store';

export function processMicroflows(mics: microflows.Microflow[], sheet: Sheet, moduleName: string, logger: Logger, store: Store) {
    return new Promise((resolve, reject) => {
        mics.forEach(microflow => {
            if (moduleName !== '' && microflow.qualifiedName.indexOf(moduleName) !== 0) {
                return;
            }
            let shown = false;
            let elementCount = 0;
            let loops = 0;
            logger.log(`${logger.el('name')}:       ${microflow.qualifiedName}`);
            logger.log(`${logger.el('excluded')}:   ${microflow.excluded}`);
            microflow.traverse(structure => {
                if (structure instanceof microflows.MicroflowAction) {
                    elementCount++;
                }

                if (structure instanceof microflows.ShowPageAction) {
                    const { pageSettings } = structure;
                    const { pageQualifiedName } = pageSettings;
                    if (pageQualifiedName) {
                        shown = true;
                        logger.log(`${logger.el('open page')}:  ${pageQualifiedName}`);
                        sheet.addLine([
                            'microflow',
                            microflow.qualifiedName,
                            pageSettings.pageQualifiedName
                        ]);
                    }
                } else if (structure instanceof microflows.MicroflowCallAction) {
                    logger.log(`${logger.el('call mf')}:    ${structure.microflowCall.microflowQualifiedName}`);
                } else if (structure instanceof microflows.LoopedActivity) {
                    loops++;
                } else if (structure instanceof microflows.JavaActionCallAction) {
                    logger.log(`${logger.el('java call')}:  ${structure.javaActionQualifiedName}`);
                } else {
                    // console.log(getPropertyList(structure), structure.structureTypeName);
                    // structure.allProperties().forEach(prop => { console.log(prop.name); });
                }

            });
            logger.log(`${logger.el('elements')}:   ${elementCount}`);
            logger.log(`${logger.el('loops')}:      ${loops}`);

            // if (shown) {
                logger.log(`\n=====================[ END MICROFLOW ]========================\n`);
            // }
        });
        resolve();
    });
}
