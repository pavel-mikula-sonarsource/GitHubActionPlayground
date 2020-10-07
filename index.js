const core = require('@actions/core');
const github = require('@actions/github');

try {
    // `who-to-greet` input defined in action metadata file
    const token = core.getInput('token');
    const issue_number = 1;//core.getInput('issue_number');
    const assignee_id = core.getInput('assignee_id');
    const octokit = github.getOctokit(token)
    console.log(`assignee_id: ${assignee_id}!`);

    var assignees = octokit.issues.listAssignees({ owner: github.context.owner, repo: github.context });
    console.log(`Assignees: ${JSON.stringify(assignees, undefined, 2)}`);

    //octokit.issues.removeAssignees({ repo: github.context, issue_number: issue_number, assignees: [] });
    var x = octokit.issues.addAssignees({ owner: github.context.owner, repo: github.context, issue_number: issue_number, assignees: [assignee_id] }).catch();
    console.log(`x: ${JSON.stringify(x, undefined, 2)}`);

    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);

} catch (error) {
    core.setFailed(error.message);
}

