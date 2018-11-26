import { ModelSdkClient, IModel, Model, projects, domainmodels, microflows, pages, customwidgets, navigation, texts, security, IStructure, menus, AbstractProperty } from "mendixmodelsdk";
import { getPropertyFromStructure, Logger, getPropertyList, getPropertyListValues } from './helpers';
import { IStructureJSON } from "mendixmodelsdk/dist/sdk/internal/deltas";
import Store from "./store";

function handlePropsSub(valueType:any, valueJSON: IStructureJSON, wpValue?:customwidgets.WidgetValue) {
    let propValue = null;
    if (['String', 'Integer', 'Enumeration'].indexOf(valueType.type) !== -1) {
        propValue = valueJSON.primitiveValue;
    } else if (valueType.type === 'Boolean') {
        propValue = valueJSON.primitiveValue === 'true';
    } else if (valueType.type === 'Entity') {
        if (typeof valueJSON.entityPath !== 'undefined') {
            propValue = valueJSON.entityPath;
        } else if (typeof valueJSON.entityRef !== 'undefined') {
            if (null === valueJSON.entityRef) {
                propValue = null;
            } else if (typeof valueJSON.entityRef['steps'] !== 'undefined') {
                propValue =  valueJSON.entityRef['steps'].map(tr => {
                    return {
                        'association': tr.association,
                        'destinationEntity': tr.destinationEntity
                    };
                });
            }
        } else {
            propValue = 'Unknown, check output';
            console.log(valueJSON);
        }
    } else if (valueType.type === 'EntityConstraint') {
        propValue = valueJSON.xPathConstraint;
    } else if (valueType.type === 'Microflow') {
        propValue = valueJSON.microflow;
    } else if (valueType.type === 'TranslatableString') {
        propValue = valueJSON.translatableValue['translations'].map(tr => {
            return {
                'language': tr.languageCode,
                'text': tr.text
            };
        });
    } else if (valueType.type === 'Attribute') {
        if (typeof valueJSON.attributePath !== 'undefined') {
            propValue = valueJSON.attributePath;
        } else if (typeof valueJSON.attributeRef !== 'undefined') {
            if (null === valueJSON.attributeRef) {
                propValue = null;
            } else if (typeof valueJSON.attributeRef['attribute'] !== 'undefined') {
                propValue = valueJSON.attributeRef['attribute'];
            }
        } else {
            propValue = 'Unknown, check output';
            console.log(valueJSON);
        }
    } else if (valueType.type === 'Object' && wpValue) {
        propValue = [];
        const objects = getPropertyFromStructure(wpValue, 'objects').get();
        const widgetPropertiesList:any[] = objects.map(o => getPropertyFromStructure(o, 'properties').get());
        widgetPropertiesList.forEach(wPListItem => {
            let propObj = {};
            wPListItem.forEach(wPListSubItem => {
                const wpTypeSubJSON = wPListSubItem.type.toJSON();
                const wpValueSubJSON = wPListSubItem.value.toJSON();

                const subkey = <string>wpTypeSubJSON.key;
                const subcategory = <string>wpTypeSubJSON.category;
                const subvT:any = wpTypeSubJSON.valueType;

                const subValue = handlePropsSub(subvT, wpValueSubJSON);

                if (typeof propObj[subcategory] === 'undefined') {
                    propObj[subcategory] = {};
                } else {
                }

                propObj[subcategory][subkey] = {
                    'type': subvT.type,
                    'value': subValue
                };
            });
            propValue.push(propObj);
        })
    } else {
        console.log(valueType.type, valueJSON);
    }
    return propValue;
}

function handleWidgetProps(props: customwidgets.WidgetProperty[]):any {
    const obj = {};
    props.forEach(wp => {
        const wpType:customwidgets.WidgetPropertyType = getPropertyFromStructure(wp, 'type').get();
        const wpValue:customwidgets.WidgetValue = getPropertyFromStructure(wp, 'value').get();
        const wpTypeJSON = wpType.toJSON();
        const wpValueJSON = wpValue.toJSON();

        const key = <string>wpTypeJSON.key;
        const category = <string>wpTypeJSON.category;
        const vT:any = wpTypeJSON.valueType;

        const vValue = handlePropsSub(vT, wpValueJSON, wpValue);

        if (typeof obj[category] === 'undefined') {
            obj[category] = {};
        }

        obj[category][key] = {
            'type': vT.type,
            'value': vValue
        };
    });
    return obj;
}

export function createCustomWidgetObject(widgetStructure:customwidgets.CustomWidget, name:string, widgetID:string):any {
    const widgetObjectProps:customwidgets.WidgetProperty[] = getPropertyFromStructure(widgetStructure.object, 'properties').get();
    const widget = {
        name,
        widgetID,
        properties: handleWidgetProps(widgetObjectProps)
    };
    return widget;
}

export function handleWidget(structure: IStructure, logger: Logger, line: string[], name: string, store: Store, location: string) {
    const widgetStructure = structure as customwidgets.CustomWidget;
    const widgetJSON = widgetStructure.toJSON() as any;
    const widgetID = widgetJSON.type && widgetJSON.type.widgetId || null;

    logger.log(`         ${logger.spec('widget')}:    ${widgetID}`);
    line.push(widgetID);
    if (widgetID !== null) {
        const widgetObj = createCustomWidgetObject(widgetStructure, name, widgetID);
        store.addWidget(widgetID, location, widgetObj);
    }
}
