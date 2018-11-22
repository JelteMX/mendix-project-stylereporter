`use strict`;
require('dotenv').config();

import { MendixSdkClient, OnlineWorkingCopy, Project, Revision, Branch, loadAsPromise } from "mendixplatformsdk";
import { ModelSdkClient, IModel, Model, projects, domainmodels, microflows, pages, navigation, texts, security, IStructure, menus, AbstractProperty } from "mendixmodelsdk";

import when = require('when');
import util = require('util');
import chalk from 'chalk';
import * as _ from 'lodash';
import fs = require('fs-extra');

import Excel from './excel';
import Store from './lib/store';
import { Logger, getPropertyFromStructure, loadAllPages, loadAllSnippets, loadAllLayouts, loadAllMicroflows } from './lib/helpers';

// Only edit this part!
const projectId = process.env.PROJECT_ID;
const projectName = process.env.PROJECT_TITLE;
const workingCopyId = process.env.WORKING_COPY;
const moduleName = process.env.MODULE_NAME;
const excelFileName = typeof process.env.EXCEL_FILE !== 'undefined' ? process.env.EXCEL_FILE : '';
const jsonFileName = typeof process.env.JSON_FILE !== 'undefined' ? process.env.JSON_FILE : '';
const verbose = typeof process.env.VERBOSE !== 'undefined' ? process.env.VERBOSE === 'true' : false;
const username = process.env.MODEL_SDK_USER;
const apikey = process.env.MODEL_SDK_TOKEN;

const logger = new Logger(verbose);
const store = new Store();

const revNo = -1; // -1 for latest
const branchName = typeof process.env.BRANCH !== 'undefined' ? process.env.BRANCH : null;
const cacheKey = `${projectName}-${projectId}-${branchName !== null ? branchName : 'main'}`;
let wc_cache:any = {} // null for mainline

const loadWcCache = () => new Promise(async (resolve, reject) => {
    try {
        const cacheFile = await fs.readJSON('./working_copy_cache.json');
        wc_cache = cacheFile;
        resolve(true);
    } catch (e) {
        console.log('No workcopy cache found');
        resolve(false);
    }
});

const writeWcCache = () => new Promise(async (resolve, reject) => {
    try {
        await fs.writeJSON('./working_copy_cache.json', wc_cache);
        resolve(true);
    } catch (e) {
        console.log('Error writing working copy cache');
        resolve(false);
    }
});

import { processPagesElements } from './lib/pages';
import { processSnippets } from './lib/snippets';
import { processLayouts } from './lib/layouts';
import { processMicroflows } from './lib/microflows';
import { allowStateChanges } from "mobx/lib/internal";

const excelFile = new Excel();
const overviewSheet = excelFile.createSheet('overview', [
    'Location Type',
    'Location Name',
    'Layout',
    'Element Type',
    'Element Name',
    'Class',
    'Style',
    'Snippet Reference',
    'Widget ID'
]);

const microflowSheet = excelFile.createSheet('microflows', [
    'Type',
    'Name',
    'Open page action'
]);

if (!username || !apikey) {
    console.error(`Make sure you have set ${chalk.cyan('MODEL_SDK_USER')} and ${chalk.cyan('MODEL_SDK_TOKEN')}`)
}

if (!workingCopyId && (!projectId || !projectName)) {
    console.error(`You have not provided a ${chalk.cyan('WORKING_COPY')}, so we need get a new one. Please make sure the following
things are set: ${chalk.cyan('PROJECT_ID')}, ${chalk.cyan('PROJECT_TITLE')}`);
}

const client = new MendixSdkClient(username, apikey);
const project = new Project(client, projectId, projectName);

function loadWorkingCopy():Promise<OnlineWorkingCopy> {
    return new Promise((resolve, reject) => {
        client
        .platform()
        .createOnlineWorkingCopy(project, new Revision(revNo, new Branch(project, branchName)))
        .then(workingCopy => {
            console.log(`\nCreated a working copy. Provide this as WORKING_COPY=${chalk.cyan(workingCopy.id())}.\n`);
            resolve(workingCopy);
            return;
        })
        .done(() => {
            console.log(`done`);
        }, error => {
            console.log(`error`, error);
            reject(error);
        })
    });
}

async function main() {
    let model:IModel;

    const loadedCache = await loadWcCache();
    if (!loadedCache) {
        await writeWcCache();
    }
    const copyStr:any = wc_cache[cacheKey];

    if (typeof copyStr === 'undefined') {
        let workingCopy:OnlineWorkingCopy;
        try {
            workingCopy = await loadWorkingCopy();
            model = workingCopy.model();
        } catch (e) {
            console.log('Error opening model: \n', e);
            process.exit(1);
        }
        const date = new Date();
        wc_cache[cacheKey] = `${date.getTime()}:${workingCopy.id()}`;
        await writeWcCache();
    } else {
        const currentDate = (new Date()).getTime();
        const minTime = currentDate - (24*60*60*1000);

        const time = parseInt(copyStr.split(':')[0], 10);
        const copyId = copyStr.split(':')[1];

        if (time < minTime) {
            let workingCopy:OnlineWorkingCopy;
            try {
                workingCopy = await loadWorkingCopy();
                model = workingCopy.model();
            } catch (e) {
                console.log('Error opening model: \n', e);
                process.exit(1);
            }
            const date = new Date();
            wc_cache[cacheKey] = `${date.getTime()}:${workingCopy.id()}`;
            await writeWcCache();
        } else {
            try {
                model = await getWorkingCopy(client, copyId); util.log(`model loaded`);
            } catch (e) {
                console.log('Error opening model: \n', e);
                process.exit(1);
            }
        }
    }

    let pages: pages.Page[] = [],
        snippets: pages.Snippet[] = [],
        layouts: pages.Layout[] = [],
        microflows: microflows.Microflow[] = [];

    try {
        util.log('loading pages');
        pages = await loadAllPages(model);
        util.log(`pages loaded`);
        logger.log(`=====================[ PAGES ]========================\n`);
        await processPagesElements(pages, overviewSheet, moduleName, logger, store);
    } catch (error) {
        console.log('Error loading pages', error);
        process.exit(1);
    }
    try {
        util.log('loading snippets');
        snippets = await loadAllSnippets(model);
        util.log(`snippets loaded`);
        logger.log(`\n=====================[ SNIPPETS ]========================\n`);
        await processSnippets(snippets, overviewSheet, moduleName, logger, store);
    } catch (error) {
        console.log('Error loading snippets', error);
        process.exit(1);
    }
    try {
        util.log('loading layouts');
        layouts = await loadAllLayouts(model);
        util.log(`layouts loaded`);
        logger.log(`\n=====================[ LAYOUTS ]========================\n`);
        await processLayouts(layouts, overviewSheet, moduleName, logger, store);
    } catch (error) {
        console.log('Error loading layouts', error);
        process.exit(1);
    }
    try {
        util.log('loading microflows');
        microflows = await loadAllMicroflows(model);
        util.log(`microflows loaded`);
        logger.log(`=====================[ MICROFLOWS ]========================\n`);
        await processMicroflows(microflows, microflowSheet, moduleName, logger, store);
    } catch (e) {
        console.log('Error loading microflows', e);
        process.exit(1);
    }


    const snippetsList = _.uniq(snippets.map(sn => sn.qualifiedName));
    const layoutsList = _.uniq(layouts.map(lo => lo.qualifiedName));

    const unusedSnippets = snippetsList.filter(sn => !store.used('snippet', sn));
    const unusedLayouts = layoutsList.filter(lo => !store.used('layout', lo));

    store.store.unused.layout = unusedLayouts;
    store.store.unused.snippet = unusedSnippets;

    if (excelFileName !== '') {
        try {
            await fs.ensureFile(excelFileName);
        } catch (e) {
            console.log(`Error with storing file at ${excelFileName}:`, e);
            process.exit(1);
        }
        excelFile.writeFile(excelFileName);
        console.log(`File written: ${excelFileName}`);
    }
    if (jsonFileName !== '') {
        try {
            await fs.ensureFile(jsonFileName);
        } catch (e) {
            console.log(`Error with storing file at ${jsonFileName}:`, e);
            process.exit(1);
        }
        store.writeFile(jsonFileName);
        console.log(`File written: ${jsonFileName}`);
    }
}

// Processing
function getWorkingCopy(client: MendixSdkClient, id: string): Promise<IModel> {
    return new Promise((resolve, reject) => {
        client.model().openWorkingCopy(id, resolve, reject);
    })
}

// if (workingCopyId) {
    main();
// } else {
//     console.log('No working copy provided. Running the loader');
//     load();
// }
