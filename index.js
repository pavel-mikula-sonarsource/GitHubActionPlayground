const core = require('@actions/core');
const github = require('@actions/github');

try {
    // `who-to-greet` input defined in action metadata file
    const token = core.getInput('token');
    //const issue_number = 1;//core.getInput('issue_number');
    const assignee_login = core.getInput('assignee_login');
    const octokit = github.getOctokit(token)
    console.log(`assignee_login: ${assignee_login}!`);

    console.log(`github.context.repo: ${JSON.stringify(github.context.repo, undefined, 2)}`);
    console.log(`github.context.repo.owner: ${JSON.stringify(github.context.repo.owner, undefined, 2)}`);
    console.log(`github.context.repo.repo: ${JSON.stringify(github.context.repo.repo, undefined, 2)}`);
    //var assignees = octokit.issues.listAssignees(github.context.repo);
    //console.log(`Assignees v1: ${JSON.stringify(assignees, undefined, 2)}`);
    //var assignees = octokit.issues.listAssignees({ owner: "pavel-mikula-sonarsource", repo: "GitHubActionPlayground" });
    //console.log(`Assignees v2: ${JSON.stringify(assignees, undefined, 2)}`);

    var issue = await github.request(github.context.payload.project_card.content_url);
    console.log(`issue ${issue}`);
    console.log(`issue.number ${issue.number}`);

    //octokit.issues.removeAssignees({ repo: github.context, issue_number: issue_number, assignees: [] });
    var x = octokit.issues.addAssignees({ owner: github.context.repo.owner, repo: github.context.repo.repo, issue_number: issue.number, assignees: [assignee_login] });
    console.log(`x: ${JSON.stringify(x, undefined, 2)}`);

    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);

} catch (error) {
    core.setFailed(error.message);
}

