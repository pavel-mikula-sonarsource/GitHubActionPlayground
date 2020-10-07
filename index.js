const core = require('@actions/core');
const github = require('@actions/github');

try {
    // `who-to-greet` input defined in action metadata file
    const token = core.getInput('token');
    const issue_number = 1;//core.getInput('issue_number');
    const assignee_id = core.getInput('assignee_id');
    const octokit = github.getOctokit(token)
    console.log(`assignee_id: ${assignee_id}!`);

    console.log(`github.context.repo.owner: ${JSON.stringify(github.context.repo.owner, undefined, 2)}`);
    console.log(`github.context.repo: ${JSON.stringify(github.context.repo, undefined, 2)}`);
    var assignees = octokit.issues.listAssignees(github.context.repo);
    console.log(`Assignees v1: ${JSON.stringify(assignees, undefined, 2)}`);
    var assignees = octokit.issues.listAssignees({ owner: "pavel-mikula-sonarsource", repo: "GitHubActionPlayground" });
    console.log(`Assignees v2: ${JSON.stringify(assignees, undefined, 2)}`);

    //octokit.issues.removeAssignees({ repo: github.context, issue_number: issue_number, assignees: [] });
    var x = octokit.issues.addAssignees({ owner: github.context.repo.owner, repo: github.context.repo.repo, issue_number: issue_number, assignees: [assignee_id] });
    console.log(`x: ${JSON.stringify(x, undefined, 2)}`);

    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);

} catch (error) {
    core.setFailed(error.message);
}

