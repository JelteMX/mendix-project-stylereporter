`use strict`;
require('dotenv').config();

import chalk from 'chalk';
import { ensureFile, readJSON, writeJSON } from 'fs-extra';
import * as _ from 'lodash';
import { IModel, microflows, pages } from "mendixmodelsdk";
import { Branch, MendixSdkClient, OnlineWorkingCopy, Project, Revision } from "mendixplatformsdk";
import Excel from './excel';
import { loadAllLayouts, loadAllMicroflows, loadAllPages, loadAllSnippets, Logger } from './lib/helpers';
import { processLayouts } from './lib/layouts';
import { processMicroflows } from './lib/microflows';
import { processPagesElements } from './lib/pages';
import { processSnippets } from './lib/snippets';
import Store from './lib/store';

import util = require('util');


const {
    PROJECT_ID,
    PROJECT_TITLE,
    MODULE_NAME,
    MODEL_SDK_USER,
    MODEL_SDK_TOKEN,
    EXCEL_FILE,
    JSON_FILE,
    VERBOSE,
    BRANCH
} = process.env;

const excelFileName =   typeof EXCEL_FILE !== 'undefined' ? EXCEL_FILE : '';
const jsonFileName =    typeof JSON_FILE !== 'undefined' ? JSON_FILE : '';

const logger = new Logger(typeof VERBOSE !== 'undefined' ? VERBOSE === 'true' : false);
const store = new Store();

const revNo = -1; // -1 for latest
const branchName = typeof BRANCH !== 'undefined' ? BRANCH : null;
const cacheKey = `${PROJECT_TITLE}-${PROJECT_ID}-${branchName !== null ? branchName : 'main'}`;
let wc_cache:any = {} // null for mainline

const loadWcCache = () => new Promise(async (resolve, reject) => {
    try {
        const cacheFile = await readJSON('./working_copy_cache.json');
        wc_cache = cacheFile;
        resolve(true);
    } catch (e) {
        console.log('No workcopy cache found');
        resolve(false);
    }
});

const writeWcCache = () => new Promise(async (resolve, reject) => {
    try {
        await writeJSON('./working_copy_cache.json', wc_cache);
        resolve(true);
    } catch (e) {
        console.log('Error writing working copy cache');
        resolve(false);
    }
});


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

if (!MODEL_SDK_USER || !MODEL_SDK_TOKEN) {
    console.error(`Make sure you have set ${chalk.cyan('MODEL_SDK_USER')} and ${chalk.cyan('MODEL_SDK_TOKEN')}`)
}

if (!PROJECT_ID || !PROJECT_TITLE) {
    console.error(`Please make sure the following things are set: ${chalk.cyan('PROJECT_ID')}, ${chalk.cyan('PROJECT_TITLE')}`);
    process.exit(1);
}

const client = new MendixSdkClient(MODEL_SDK_USER, MODEL_SDK_TOKEN);
const project = new Project(client, PROJECT_ID, PROJECT_TITLE);

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
        await processPagesElements(pages, overviewSheet, MODULE_NAME, logger, store);
    } catch (error) {
        console.log('Error loading pages', error);
        process.exit(1);
    }

    try {
        util.log('loading snippets');
        snippets = await loadAllSnippets(model);
        util.log(`snippets loaded`);
        logger.log(`\n=====================[ SNIPPETS ]========================\n`);
        await processSnippets(snippets, overviewSheet, MODULE_NAME, logger, store);
    } catch (error) {
        console.log('Error loading snippets', error);
        process.exit(1);
    }

    try {
        util.log('loading layouts');
        layouts = await loadAllLayouts(model);
        util.log(`layouts loaded`);
        logger.log(`\n=====================[ LAYOUTS ]========================\n`);
        await processLayouts(layouts, overviewSheet, MODULE_NAME, logger, store);
    } catch (error) {
        console.log('Error loading layouts', error);
        process.exit(1);
    }

    try {
        util.log('loading microflows');
        microflows = await loadAllMicroflows(model);
        util.log(`microflows loaded`);
        logger.log(`=====================[ MICROFLOWS ]========================\n`);
        await processMicroflows(microflows, microflowSheet, MODULE_NAME, logger, store);
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
            await ensureFile(excelFileName);
        } catch (e) {
            console.log(`Error with storing file at ${excelFileName}:`, e);
            process.exit(1);
        }
        excelFile.writeFile(excelFileName);
        console.log(`File written: ${excelFileName}`);
    }
    if (jsonFileName !== '') {
        try {
            await ensureFile(jsonFileName);
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

main();
