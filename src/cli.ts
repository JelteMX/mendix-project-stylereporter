`use strict`;
require('dotenv').config();

import { MendixSdkClient, OnlineWorkingCopy, Project, Revision, Branch, loadAsPromise } from "mendixplatformsdk";
import { ModelSdkClient, IModel, Model, projects, domainmodels, microflows, pages, navigation, texts, security, IStructure, menus, AbstractProperty } from "mendixmodelsdk";

import when = require('when');
import util = require('util');
import chalk from 'chalk';
import * as _ from 'lodash';

import Excel from './excel';
import Store from './lib/store';
import { Logger, getPropertyFromStructure } from './lib/helpers';

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
const branchName = null // null for mainline
const wc = null;

import { loadAllPages, processPagesElements } from './lib/pages';
import { loadAllSnippets, processSnippets } from './lib/snippets';
import { loadAllLayouts, processLayouts } from './lib/layouts';

const excelFile = new Excel();
const excelOutput = excelFile.createSheet('overview', [
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

if (!username || !apikey) {
    console.error(`Make sure you have set ${chalk.cyan('MODEL_SDK_USER')} and ${chalk.cyan('MODEL_SDK_TOKEN')}`)
}

if (!workingCopyId && (!projectId || !projectName)) {
    console.error(`You have not provided a ${chalk.cyan('WORKING_COPY')}, so we need get a new one. Please make sure the following
things are set: ${chalk.cyan('PROJECT_ID')}, ${chalk.cyan('PROJECT_TITLE')}`);
}

const client = new MendixSdkClient(username, apikey);
const project = new Project(client, projectId, projectName);

function load() {
    client
        .platform()
        .createOnlineWorkingCopy(project, new Revision(revNo, new Branch(project, branchName)))
        .then(workingCopy => {
            console.log(`\nCreated a working copy. Provide this as WORKING_COPY=${chalk.cyan(workingCopy.id())} and run again.\n`);
            return;
        })
        .done(() => {
            console.log(`done`);
        }, error => {
            console.log(`error`, error);
        })
}

async function main() {
    let model;
    try {
        model = await getWorkingCopy(client, workingCopyId); util.log(`model loaded`);
    } catch (e) {
        console.log('Error opening model: \n', e);
        process.exit(1);
    }

    const pages = await loadAllPages(model); util.log(`pages loaded`);
    const snippets = await loadAllSnippets(model); util.log(`snippets loaded`);
    const layouts = await loadAllLayouts(model); util.log(`layouts loaded`);

    logger.log(`=====================[ PAGES ]========================\n`);
    await processPagesElements(pages, excelOutput, moduleName, logger, store);
    logger.log(`\n=====================[ SNIPPETS ]========================\n`);
    await processSnippets(snippets, excelOutput, moduleName, logger, store);
    logger.log(`\n=====================[ LAYOUTS ]========================\n`);
    await processLayouts(layouts, excelOutput, moduleName, logger, store);

    const snippetsList = _.uniq(snippets.map(sn => sn.qualifiedName));
    const layoutsList = _.uniq(layouts.map(lo => lo.qualifiedName));

    const unusedSnippets = snippetsList.filter(sn => !store.used('snippet', sn));
    const unusedLayouts = layoutsList.filter(lo => !store.used('layout', lo));

    store.store.unused.layout = unusedLayouts;
    store.store.unused.snippet = unusedSnippets;

    if (excelFileName !== '') {
        excelFile.writeFile(excelFileName);
        console.log(`File written: ${excelFileName}`);
    }
    if (jsonFileName !== '') {
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

if (workingCopyId) {
    main();
} else {
    console.log('No working copy provided. Running the loader');
    load();
}
