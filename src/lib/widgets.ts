import { ModelSdkClient, IModel, Model, projects, domainmodels, microflows, pages, customwidgets, navigation, texts, security, IStructure, menus, AbstractProperty } from "mendixmodelsdk";
import { getPropertyFromStructure, Logger, getPropertyList, getPropertyListValues } from './helpers';
import { IStructureJSON } from "mendixmodelsdk/dist/sdk/internal/deltas";

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
        let vValue = null;
        if (['String', 'Integer', 'Enumeration'].indexOf(vT.type) !== -1) {
            vValue = wpValueJSON.primitiveValue;
        } else if (vT.type === 'Boolean') {
            vValue = wpValueJSON.primitiveValue === 'true';
        } else if (vT.type === 'Entity') {
            if (typeof wpValueJSON.entityPath !== 'undefined') {
                vValue = wpValueJSON.entityPath;
            } else if (typeof wpValueJSON.entityRef !== 'undefined') {
                if (null === wpValueJSON.entityRef) {
                    vValue = null;
                } else if (typeof wpValueJSON.entityRef['steps'] !== 'undefined') {
                    vValue =  wpValueJSON.entityRef['steps'].map(tr => {
                        return {
                            'association': tr.association,
                            'destinationEntity': tr.destinationEntity
                        };
                    });
                }
            } else {
                vValue = 'Unknown, check output';
                console.log(wpValueJSON);
            }
        } else if (vT.type === 'EntityConstraint') {
            vValue = wpValueJSON.xPathConstraint;
        } else if (vT.type === 'Microflow') {
            vValue = wpValueJSON.microflow;
        } else if (vT.type === 'TranslatableString') {
            vValue = wpValueJSON.translatableValue['translations'].map(tr => {
                return {
                    'language': tr.languageCode,
                    'text': tr.text
                };
            });
        } else if (vT.type === 'Attribute') {
            if (typeof wpValueJSON.attributePath !== 'undefined') {
                vValue = wpValueJSON.attributePath;
            } else if (typeof wpValueJSON.attributeRef !== 'undefined') {
                if (null === wpValueJSON.attributeRef) {
                    vValue = null;
                } else if (typeof wpValueJSON.attributeRef['attribute'] !== 'undefined') {
                    vValue = wpValueJSON.attributeRef['attribute'];
                }
            } else {
                vValue = 'Unknown, check output';
                console.log(wpValueJSON);
            }
        } else if (vT.type === 'Object') {
            vValue = [];
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
                    let subValue = null;
                    if (['String', 'Integer', 'Enumeration'].indexOf(subvT.type) !== -1) {
                        subValue = wpValueSubJSON.primitiveValue;
                    } else if (subvT.type === 'Boolean') {
                        subValue = wpValueSubJSON.primitiveValue === 'true';
                    } else if (subvT.type === 'Entity') {
                        if (typeof wpValueSubJSON.entityPath !== 'undefined') {
                            subValue = wpValueSubJSON.entityPath;
                        } else if (typeof wpValueSubJSON.entityRef !== 'undefined') {
                            if (null === wpValueSubJSON.entityRef) {
                                subValue = null;
                            } else if (typeof wpValueSubJSON.entityRef['steps'] !== 'undefined') {
                                subValue = wpValueSubJSON.entityRef['steps'].map(tr => {
                                    return {
                                        'association': tr.association,
                                        'destinationEntity': tr.destinationEntity
                                    };
                                });
                            }
                        } else {
                            subValue = 'Unknown, check output';
                            console.log(wpValueSubJSON);
                        }
                    } else if (subvT.type === 'EntityConstraint') {
                        subValue = wpValueSubJSON.xPathConstraint;
                    } else if (subvT.type === 'Microflow') {
                        subValue = wpValueSubJSON.microflow;
                    } else if (vT.type === 'TranslatableString') {
                        subValue = wpValueSubJSON.translatableValue['translations'].map(tr => {
                            return {
                                'language': tr.languageCode,
                                'text': tr.text
                            };
                        });
                    } else if (subvT.type === 'Attribute') {
                        if (typeof wpValueSubJSON.attributePath !== 'undefined') {
                            subValue = wpValueSubJSON.attributePath;
                        } else if (typeof wpValueSubJSON.attributeRef !== 'undefined') {
                            if (null === wpValueSubJSON.attributeRef) {
                                subValue = null;
                            } else if (typeof wpValueSubJSON.attributeRef['attribute'] !== 'undefined') {
                                subValue = wpValueSubJSON.attributeRef['attribute'];
                            }
                        } else {
                            subValue = 'Unknown, check output';
                        }
                    }

                    if (typeof propObj[subcategory] === 'undefined') {
                        propObj[subcategory] = {};
                    } else {
                    }

                    propObj[subcategory][subkey] = {
                        'type': subvT.type,
                        'value': subValue
                    };
                });
                vValue.push(propObj);
            })
        } else {
            console.log(vT.type, wpValueJSON);
        }

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
