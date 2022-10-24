// GitHub API Docs: https://octokit.github.io/rest.js/v18
// Scaffolding inspired by: https://github.com/actions/github-script
// YML events: https://docs.github.com/en/free-pro-team@latest/actions/reference/events-that-trigger-workflows#pull_request_review
// To run the script locally from PowerShell:
// clear; node .\index.js

const core = require('@actions/core');
const github = require('@actions/github');

try {
    console.log("--- Event payload ---");
    console.log(JSON.stringify(github.context.payload, undefined, 2));
    console.log("----------");
    console.log("Done");
}
catch (ex) {
    core.setFailed(error.message);
}

/*
import * as core from '@actions/core'
import { getOctokit } from '@actions/github'
//import * as io from '@actions/io'

process.on('unhandledRejection', handleError)
main().catch(handleError)

async function main() {
    const github = getOctokit("FIXME");
    const peyload = {"test": "test"};
    console.log("----------");
    console.log(`Projects: ${JSON.stringify(payload, undefined, 2)}`);
    console.log("----------");
    console.log("Done");
}

function handleError(err) {
    console.error(err)
    core.setFailed(`Unhandled error: ${err}`)
}

*/