"use strict";
// GitHub API Docs: https://octokit.github.io/rest.js/v18
// Scaffolding inspired by: https://github.com/actions/github-script
// YML events: https://docs.github.com/en/free-pro-team@latest/actions/reference/events-that-trigger-workflows#pull_request_review
// To run the script locally from PowerShell:
// clear; node .\index.js
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const github = require("@actions/github");
try {
    const octokit = github.getOctokit(core.getInput("github-token"));
    const repo = github.context.repo;
    const payload = github.context.payload;
    console.log("Creating issue");
    octokit.rest.issues.create(Object.assign(Object.assign({}, repo), { title: `Update RSPEC before ${payload.milestone.title} release`, milestone: payload.milestone.number, labels: ["Type: Tooling"] }));
    console.log("Done");
}
catch (ex) {
    core.setFailed(ex.message);
}
//# sourceMappingURL=index.js.map