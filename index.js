import * as core from '@actions/core'
import { getOctokit } from '@actions/github'
//import * as io from '@actions/io'

process.on('unhandledRejection', handleError)
main().catch(handleError)

async function main() {
    const github = getOctokit("FIXME");
    const context = createContext();
    // github, context, core, io
    //const issue = await github.issues.get({ owner: context.repo.owner, repo: context.repo.repo, issue_number: context.payload.number });
    const toDoColumn = 11144556;
    const inProgressColumn = 11144557;
    const reviewInProgressColumn = 11144558;
    const reviewApprovedColumn = 11144559;
    const doneColumn = 11144560;
    //
    async function getIssue(issue_number) {
        try {
            return (await github.issues.get({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number
            })).data;
        }
        catch{
            console.log("Issue not found: #" + issue_number);
            return null;
        }
    }
    //
    async function findCard(content_url) {
        // Columns are searched from the most probable one
        const allColumns = [reviewInProgressColumn, reviewApprovedColumn, inProgressColumn, toDoColumn, doneColumn];
        for (let i = 0; i < allColumns.length; i++) {
            let cards = await github.projects.listCards({ column_id: allColumns[i] });
            let card = cards.data.find(x => x.content_url == content_url);
            if (card) {
                return card;
            }
        }
        console.log("Card not found for: " + content_url);
        return null;
    }
    //
    async function processIssue(issue) {
        const oldAssignees = issue.assignees.map(x => x.login);
        if (oldAssignees.length) {
            console.log("Removing assignees: " + oldAssignees.join(", "));
            github.issues.removeAssignees({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                assignees: oldAssignees
            });
        }
        console.log("Assigning to: " + context.payload.requested_reviewer.login);
        github.issues.addAssignees({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: issue.number,
            assignees: [context.payload.requested_reviewer.login]
        });
        const card = await findCard(issue.url);
        if (card) {
            console.log("Moving card");
            github.projects.moveCard({ card_id: card.id, position: "bottom", column_id: reviewInProgressColumn });
        } else if (issue.pull_request) {
            console.log("Creating PR card");
            github.projects.createCard({ column_id: reviewInProgressColumn, content_id: context.payload.pull_request.id, content_type: "PullRequest" });
        } else {
            console.log("Creating Issue card");
            github.projects.createCard({ column_id: reviewInProgressColumn, content_id: issue.id, content_type: "Issue" });
        }
    }
    //
    let processPR = true;
    const matches = context.payload.pull_request.body.match(/Fixes\s*#\d+/gi);
    if (matches) {
        for (var i = 0; i < matches.length; i++) {
            console.log("Processing linked issue: " + matches[i]);
            let linkedIssue = await getIssue(matches[i].split("#")[1]);
            if (linkedIssue) {
                processPR = false;
                processIssue(linkedIssue);
            }
        }
    }
    if (processPR) {
        console.log("Processing PR: #" + context.payload.number);
        const issue = await getIssue(context.payload.number);
        if (issue) {
            processIssue(issue);
        }
    }
    console.log("Done");


    /*
    if (issue.data.pull_request) {
        const matches = issue.data.body.match(/Fixes\s*#\d+/gi);
        if (matches) {
            for (var i = 0; i < matches.length; i++) {
                let issue_number = matches[i].split("#")[1];
                let linkedissue = null;
                try {
                    linkedissue = await github.issues.get({ owner: "pavel-mikula-sonarsource", repo: "GitHubActionPlayground", issue_number });
                }
                catch{
                    linkedissue = null;
                    console.log("Linked issue not found: #" + issue_number);
                }
                if (linkedissue) {
                    console.log("Found linked issue: #" + linkedissue.data.number);
                }
            }
        }
    }
    */

    //github.issues.removeAssignees({ owner: "pavel-mikula-sonarsource", repo: "GitHubActionPlayground", issue_number: 2, assignees: issue.data.assignees.map(x => x.login) });
    /*
    const cards = await github.projects.listCards({ column_id: 11144558 });
    cards.data.forEach(card => {
        if (card.content_url == issue.url) {
            github.projects.moveCard({ card_id: card.id, position: "bottom", column_id: 11144558 });
            return;
        }
    });
    if (issue.data.pull_request) {
        const pull_request = await github.pulls.get({ owner: "pavel-mikula-sonarsource", repo: "GitHubActionPlayground", pull_number: 2 })
        github.projects.createCard({ column_id: 11144558, content_id: pull_request.data.id, content_type: "PullRequest"});
    } else {
        github.projects.createCard({ column_id: 11144558, content_id: issue.data.id, content_type: "Issue"});
    }
    */
    //.listColumns({ project_id: 1, mediaType: { previews: ['inertia'] } });


    //console.log(`output: ${ret}`);
    //console.log(`output: ${JSON.stringify(ret, undefined, 2)}`);

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleError(err) {
    console.error(err)
    core.setFailed(`Unhandled error: ${err}`)
}

function createContext() {
    return { repo: createRepo(), payload: createPayloadPR() };
}

function createRepo() {
    return { owner: "pavel-mikula-sonarsource", repo: "GitHubActionPlayground" };
}

function createPayloadPR() {
    return {
        "action": "review_requested",
        "number": 2,
        "pull_request": {
            "_links": {
                "comments": {
                    "href": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/issues/2/comments"
                },
                "commits": {
                    "href": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/pulls/2/commits"
                },
                "html": {
                    "href": "pavel-mikula-sonarsource/GitHubActionPlayground/pull/2"
                },
                "issue": {
                    "href": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/issues/2"
                },
                "review_comment": {
                    "href": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/pulls/comments{/number}"
                },
                "review_comments": {
                    "href": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/pulls/2/comments"
                },
                "self": {
                    "href": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/pulls/2"
                },
                "statuses": {
                    "href": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/statuses/4cfbd8143f13d077d0de21524539e1f6d3e87d2a"
                }
            },
            "active_lock_reason": null,
            "additions": 1,
            "assignee": null,
            "assignees": [],
            "author_association": "OWNER",
            "base": {
                "label": "pavel-mikula-sonarsource:master",
                "ref": "master",
                "repo": {
                    "allow_merge_commit": true,
                    "allow_rebase_merge": true,
                    "allow_squash_merge": true,
                    "archive_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/{archive_format}{/ref}",
                    "archived": false,
                    "assignees_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/assignees{/user}",
                    "blobs_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/git/blobs{/sha}",
                    "branches_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/branches{/branch}",
                    "clone_url": "pavel-mikula-sonarsource/GitHubActionPlayground.git",
                    "collaborators_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/collaborators{/collaborator}",
                    "comments_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/comments{/number}",
                    "commits_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/commits{/sha}",
                    "compare_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/compare/{base}...{head}",
                    "contents_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/contents/{+path}",
                    "contributors_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/contributors",
                    "created_at": "2020-10-06T12:38:45Z",
                    "default_branch": "master",
                    "delete_branch_on_merge": false,
                    "deployments_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/deployments",
                    "description": null,
                    "disabled": false,
                    "downloads_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/downloads",
                    "events_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/events",
                    "fork": false,
                    "forks": 0,
                    "forks_count": 0,
                    "forks_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/forks",
                    "full_name": "pavel-mikula-sonarsource/GitHubActionPlayground",
                    "git_commits_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/git/commits{/sha}",
                    "git_refs_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/git/refs{/sha}",
                    "git_tags_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/git/tags{/sha}",
                    "git_url": "git://github.com/pavel-mikula-sonarsource/GitHubActionPlayground.git",
                    "has_downloads": true,
                    "has_issues": true,
                    "has_pages": false,
                    "has_projects": true,
                    "has_wiki": true,
                    "homepage": null,
                    "hooks_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/hooks",
                    "html_url": "pavel-mikula-sonarsource/GitHubActionPlayground",
                    "id": 301721889,
                    "issue_comment_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/issues/comments{/number}",
                    "issue_events_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/issues/events{/number}",
                    "issues_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/issues{/number}",
                    "keys_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/keys{/key_id}",
                    "labels_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/labels{/name}",
                    "language": "JavaScript",
                    "languages_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/languages",
                    "license": null,
                    "merges_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/merges",
                    "milestones_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/milestones{/number}",
                    "mirror_url": null,
                    "name": "GitHubActionPlayground",
                    "node_id": "MDEwOlJlcG9zaXRvcnkzMDE3MjE4ODk=",
                    "notifications_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/notifications{?since,all,participating}",
                    "open_issues": 2,
                    "open_issues_count": 2,
                    "owner": {
                        "avatar_url": "avatars3.githubusercontent.com/u/57188685?v=4",
                        "events_url": "https://api.github.com/users/pavel-mikula-sonarsource/events{/privacy}",
                        "followers_url": "api.github.com/users/pavel-mikula-sonarsource/followers",
                        "following_url": "https://api.github.com/users/pavel-mikula-sonarsource/following{/other_user}",
                        "gists_url": "https://api.github.com/users/pavel-mikula-sonarsource/gists{/gist_id}",
                        "gravatar_id": "",
                        "html_url": "@pavel-mikula-sonarsource",
                        "id": 57188685,
                        "login": "pavel-mikula-sonarsource",
                        "node_id": "MDQ6VXNlcjU3MTg4Njg1",
                        "organizations_url": "api.github.com/users/pavel-mikula-sonarsource/orgs",
                        "received_events_url": "api.github.com/users/pavel-mikula-sonarsource/received_events",
                        "repos_url": "api.github.com/users/pavel-mikula-sonarsource/repos",
                        "site_admin": false,
                        "starred_url": "https://api.github.com/users/pavel-mikula-sonarsource/starred{/owner}{/repo}",
                        "subscriptions_url": "api.github.com/users/pavel-mikula-sonarsource/subscriptions",
                        "type": "User",
                        "url": "api.github.com/users/pavel-mikula-sonarsource"
                    },
                    "private": false,
                    "pulls_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/pulls{/number}",
                    "pushed_at": "2020-10-16T13:53:06Z",
                    "releases_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/releases{/id}",
                    "size": 624,
                    "ssh_url": "git@github.com:pavel-mikula-sonarsource/GitHubActionPlayground.git",
                    "stargazers_count": 0,
                    "stargazers_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/stargazers",
                    "statuses_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/statuses/{sha}",
                    "subscribers_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/subscribers",
                    "subscription_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/subscription",
                    "svn_url": "pavel-mikula-sonarsource/GitHubActionPlayground",
                    "tags_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/tags",
                    "teams_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/teams",
                    "trees_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/git/trees{/sha}",
                    "updated_at": "2020-10-16T13:53:08Z",
                    "url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground",
                    "watchers": 0,
                    "watchers_count": 0
                },
                "sha": "39ed336f1d040b0fab7fbf261b108142d205bc62",
                "user": {
                    "avatar_url": "avatars3.githubusercontent.com/u/57188685?v=4",
                    "events_url": "https://api.github.com/users/pavel-mikula-sonarsource/events{/privacy}",
                    "followers_url": "api.github.com/users/pavel-mikula-sonarsource/followers",
                    "following_url": "https://api.github.com/users/pavel-mikula-sonarsource/following{/other_user}",
                    "gists_url": "https://api.github.com/users/pavel-mikula-sonarsource/gists{/gist_id}",
                    "gravatar_id": "",
                    "html_url": "@pavel-mikula-sonarsource",
                    "id": 57188685,
                    "login": "pavel-mikula-sonarsource",
                    "node_id": "MDQ6VXNlcjU3MTg4Njg1",
                    "organizations_url": "api.github.com/users/pavel-mikula-sonarsource/orgs",
                    "received_events_url": "api.github.com/users/pavel-mikula-sonarsource/received_events",
                    "repos_url": "api.github.com/users/pavel-mikula-sonarsource/repos",
                    "site_admin": false,
                    "starred_url": "https://api.github.com/users/pavel-mikula-sonarsource/starred{/owner}{/repo}",
                    "subscriptions_url": "api.github.com/users/pavel-mikula-sonarsource/subscriptions",
                    "type": "User",
                    "url": "api.github.com/users/pavel-mikula-sonarsource"
                }
            },
            "body": "Fixes #1 ",
            "changed_files": 1,
            "closed_at": null,
            "comments": 0,
            "comments_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/issues/2/comments",
            "commits": 1,
            "commits_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/pulls/2/commits",
            "created_at": "2020-10-07T07:35:12Z",
            "deletions": 0,
            "diff_url": "2.diff",
            "draft": false,
            "head": {
                "label": "pavel-mikula-sonarsource:RandomPR",
                "ref": "RandomPR",
                "repo": {
                    "allow_merge_commit": true,
                    "allow_rebase_merge": true,
                    "allow_squash_merge": true,
                    "archive_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/{archive_format}{/ref}",
                    "archived": false,
                    "assignees_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/assignees{/user}",
                    "blobs_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/git/blobs{/sha}",
                    "branches_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/branches{/branch}",
                    "clone_url": "pavel-mikula-sonarsource/GitHubActionPlayground.git",
                    "collaborators_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/collaborators{/collaborator}",
                    "comments_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/comments{/number}",
                    "commits_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/commits{/sha}",
                    "compare_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/compare/{base}...{head}",
                    "contents_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/contents/{+path}",
                    "contributors_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/contributors",
                    "created_at": "2020-10-06T12:38:45Z",
                    "default_branch": "master",
                    "delete_branch_on_merge": false,
                    "deployments_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/deployments",
                    "description": null,
                    "disabled": false,
                    "downloads_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/downloads",
                    "events_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/events",
                    "fork": false,
                    "forks": 0,
                    "forks_count": 0,
                    "forks_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/forks",
                    "full_name": "pavel-mikula-sonarsource/GitHubActionPlayground",
                    "git_commits_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/git/commits{/sha}",
                    "git_refs_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/git/refs{/sha}",
                    "git_tags_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/git/tags{/sha}",
                    "git_url": "git://github.com/pavel-mikula-sonarsource/GitHubActionPlayground.git",
                    "has_downloads": true,
                    "has_issues": true,
                    "has_pages": false,
                    "has_projects": true,
                    "has_wiki": true,
                    "homepage": null,
                    "hooks_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/hooks",
                    "html_url": "pavel-mikula-sonarsource/GitHubActionPlayground",
                    "id": 301721889,
                    "issue_comment_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/issues/comments{/number}",
                    "issue_events_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/issues/events{/number}",
                    "issues_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/issues{/number}",
                    "keys_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/keys{/key_id}",
                    "labels_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/labels{/name}",
                    "language": "JavaScript",
                    "languages_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/languages",
                    "license": null,
                    "merges_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/merges",
                    "milestones_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/milestones{/number}",
                    "mirror_url": null,
                    "name": "GitHubActionPlayground",
                    "node_id": "MDEwOlJlcG9zaXRvcnkzMDE3MjE4ODk=",
                    "notifications_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/notifications{?since,all,participating}",
                    "open_issues": 2,
                    "open_issues_count": 2,
                    "owner": {
                        "avatar_url": "avatars3.githubusercontent.com/u/57188685?v=4",
                        "events_url": "https://api.github.com/users/pavel-mikula-sonarsource/events{/privacy}",
                        "followers_url": "api.github.com/users/pavel-mikula-sonarsource/followers",
                        "following_url": "https://api.github.com/users/pavel-mikula-sonarsource/following{/other_user}",
                        "gists_url": "https://api.github.com/users/pavel-mikula-sonarsource/gists{/gist_id}",
                        "gravatar_id": "",
                        "html_url": "@pavel-mikula-sonarsource",
                        "id": 57188685,
                        "login": "pavel-mikula-sonarsource",
                        "node_id": "MDQ6VXNlcjU3MTg4Njg1",
                        "organizations_url": "api.github.com/users/pavel-mikula-sonarsource/orgs",
                        "received_events_url": "api.github.com/users/pavel-mikula-sonarsource/received_events",
                        "repos_url": "api.github.com/users/pavel-mikula-sonarsource/repos",
                        "site_admin": false,
                        "starred_url": "https://api.github.com/users/pavel-mikula-sonarsource/starred{/owner}{/repo}",
                        "subscriptions_url": "api.github.com/users/pavel-mikula-sonarsource/subscriptions",
                        "type": "User",
                        "url": "api.github.com/users/pavel-mikula-sonarsource"
                    },
                    "private": false,
                    "pulls_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/pulls{/number}",
                    "pushed_at": "2020-10-16T13:53:06Z",
                    "releases_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/releases{/id}",
                    "size": 624,
                    "ssh_url": "git@github.com:pavel-mikula-sonarsource/GitHubActionPlayground.git",
                    "stargazers_count": 0,
                    "stargazers_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/stargazers",
                    "statuses_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/statuses/{sha}",
                    "subscribers_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/subscribers",
                    "subscription_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/subscription",
                    "svn_url": "pavel-mikula-sonarsource/GitHubActionPlayground",
                    "tags_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/tags",
                    "teams_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/teams",
                    "trees_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/git/trees{/sha}",
                    "updated_at": "2020-10-16T13:53:08Z",
                    "url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground",
                    "watchers": 0,
                    "watchers_count": 0
                },
                "sha": "4cfbd8143f13d077d0de21524539e1f6d3e87d2a",
                "user": {
                    "avatar_url": "avatars3.githubusercontent.com/u/57188685?v=4",
                    "events_url": "https://api.github.com/users/pavel-mikula-sonarsource/events{/privacy}",
                    "followers_url": "api.github.com/users/pavel-mikula-sonarsource/followers",
                    "following_url": "https://api.github.com/users/pavel-mikula-sonarsource/following{/other_user}",
                    "gists_url": "https://api.github.com/users/pavel-mikula-sonarsource/gists{/gist_id}",
                    "gravatar_id": "",
                    "html_url": "@pavel-mikula-sonarsource",
                    "id": 57188685,
                    "login": "pavel-mikula-sonarsource",
                    "node_id": "MDQ6VXNlcjU3MTg4Njg1",
                    "organizations_url": "api.github.com/users/pavel-mikula-sonarsource/orgs",
                    "received_events_url": "api.github.com/users/pavel-mikula-sonarsource/received_events",
                    "repos_url": "api.github.com/users/pavel-mikula-sonarsource/repos",
                    "site_admin": false,
                    "starred_url": "https://api.github.com/users/pavel-mikula-sonarsource/starred{/owner}{/repo}",
                    "subscriptions_url": "api.github.com/users/pavel-mikula-sonarsource/subscriptions",
                    "type": "User",
                    "url": "api.github.com/users/pavel-mikula-sonarsource"
                }
            },
            "html_url": "pavel-mikula-sonarsource/GitHubActionPlayground/pull/2",
            "id": 499046748,
            "issue_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/issues/2",
            "labels": [],
            "locked": false,
            "maintainer_can_modify": false,
            "merge_commit_sha": "239966a42795de572d7afce3f1e35cb7fdd56fdb",
            "mergeable": true,
            "mergeable_state": "clean",
            "merged": false,
            "merged_at": null,
            "merged_by": null,
            "milestone": null,
            "node_id": "MDExOlB1bGxSZXF1ZXN0NDk5MDQ2NzQ4",
            "number": 2,
            "patch_url": "2.patch",
            "rebaseable": true,
            "requested_reviewers": [
                {
                    "avatar_url": "avatars2.githubusercontent.com/u/43468290?v=4",
                    "events_url": "https://api.github.com/users/PavlinII/events{/privacy}",
                    "followers_url": "api.github.com/users/PavlinII/followers",
                    "following_url": "https://api.github.com/users/PavlinII/following{/other_user}",
                    "gists_url": "https://api.github.com/users/PavlinII/gists{/gist_id}",
                    "gravatar_id": "",
                    "html_url": "@PavlinII",
                    "id": 43468290,
                    "login": "PavlinII",
                    "node_id": "MDQ6VXNlcjQzNDY4Mjkw",
                    "organizations_url": "api.github.com/users/PavlinII/orgs",
                    "received_events_url": "api.github.com/users/PavlinII/received_events",
                    "repos_url": "api.github.com/users/PavlinII/repos",
                    "site_admin": false,
                    "starred_url": "https://api.github.com/users/PavlinII/starred{/owner}{/repo}",
                    "subscriptions_url": "api.github.com/users/PavlinII/subscriptions",
                    "type": "User",
                    "url": "api.github.com/users/PavlinII"
                }
            ],
            "requested_teams": [],
            "review_comment_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/pulls/comments{/number}",
            "review_comments": 0,
            "review_comments_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/pulls/2/comments",
            "state": "open",
            "statuses_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/statuses/4cfbd8143f13d077d0de21524539e1f6d3e87d2a",
            "title": "Test - Ignore me",
            "updated_at": "2020-10-16T13:53:13Z",
            "url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/pulls/2",
            "user": {
                "avatar_url": "avatars3.githubusercontent.com/u/57188685?v=4",
                "events_url": "https://api.github.com/users/pavel-mikula-sonarsource/events{/privacy}",
                "followers_url": "api.github.com/users/pavel-mikula-sonarsource/followers",
                "following_url": "https://api.github.com/users/pavel-mikula-sonarsource/following{/other_user}",
                "gists_url": "https://api.github.com/users/pavel-mikula-sonarsource/gists{/gist_id}",
                "gravatar_id": "",
                "html_url": "@pavel-mikula-sonarsource",
                "id": 57188685,
                "login": "pavel-mikula-sonarsource",
                "node_id": "MDQ6VXNlcjU3MTg4Njg1",
                "organizations_url": "api.github.com/users/pavel-mikula-sonarsource/orgs",
                "received_events_url": "api.github.com/users/pavel-mikula-sonarsource/received_events",
                "repos_url": "api.github.com/users/pavel-mikula-sonarsource/repos",
                "site_admin": false,
                "starred_url": "https://api.github.com/users/pavel-mikula-sonarsource/starred{/owner}{/repo}",
                "subscriptions_url": "api.github.com/users/pavel-mikula-sonarsource/subscriptions",
                "type": "User",
                "url": "api.github.com/users/pavel-mikula-sonarsource"
            }
        },
        "repository": {
            "archive_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/{archive_format}{/ref}",
            "archived": false,
            "assignees_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/assignees{/user}",
            "blobs_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/git/blobs{/sha}",
            "branches_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/branches{/branch}",
            "clone_url": "pavel-mikula-sonarsource/GitHubActionPlayground.git",
            "collaborators_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/collaborators{/collaborator}",
            "comments_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/comments{/number}",
            "commits_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/commits{/sha}",
            "compare_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/compare/{base}...{head}",
            "contents_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/contents/{+path}",
            "contributors_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/contributors",
            "created_at": "2020-10-06T12:38:45Z",
            "default_branch": "master",
            "deployments_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/deployments",
            "description": null,
            "disabled": false,
            "downloads_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/downloads",
            "events_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/events",
            "fork": false,
            "forks": 0,
            "forks_count": 0,
            "forks_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/forks",
            "full_name": "pavel-mikula-sonarsource/GitHubActionPlayground",
            "git_commits_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/git/commits{/sha}",
            "git_refs_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/git/refs{/sha}",
            "git_tags_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/git/tags{/sha}",
            "git_url": "git://github.com/pavel-mikula-sonarsource/GitHubActionPlayground.git",
            "has_downloads": true,
            "has_issues": true,
            "has_pages": false,
            "has_projects": true,
            "has_wiki": true,
            "homepage": null,
            "hooks_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/hooks",
            "html_url": "pavel-mikula-sonarsource/GitHubActionPlayground",
            "id": 301721889,
            "issue_comment_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/issues/comments{/number}",
            "issue_events_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/issues/events{/number}",
            "issues_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/issues{/number}",
            "keys_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/keys{/key_id}",
            "labels_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/labels{/name}",
            "language": "JavaScript",
            "languages_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/languages",
            "license": null,
            "merges_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/merges",
            "milestones_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/milestones{/number}",
            "mirror_url": null,
            "name": "GitHubActionPlayground",
            "node_id": "MDEwOlJlcG9zaXRvcnkzMDE3MjE4ODk=",
            "notifications_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/notifications{?since,all,participating}",
            "open_issues": 2,
            "open_issues_count": 2,
            "owner": {
                "avatar_url": "avatars3.githubusercontent.com/u/57188685?v=4",
                "events_url": "https://api.github.com/users/pavel-mikula-sonarsource/events{/privacy}",
                "followers_url": "api.github.com/users/pavel-mikula-sonarsource/followers",
                "following_url": "https://api.github.com/users/pavel-mikula-sonarsource/following{/other_user}",
                "gists_url": "https://api.github.com/users/pavel-mikula-sonarsource/gists{/gist_id}",
                "gravatar_id": "",
                "html_url": "@pavel-mikula-sonarsource",
                "id": 57188685,
                "login": "pavel-mikula-sonarsource",
                "node_id": "MDQ6VXNlcjU3MTg4Njg1",
                "organizations_url": "api.github.com/users/pavel-mikula-sonarsource/orgs",
                "received_events_url": "api.github.com/users/pavel-mikula-sonarsource/received_events",
                "repos_url": "api.github.com/users/pavel-mikula-sonarsource/repos",
                "site_admin": false,
                "starred_url": "https://api.github.com/users/pavel-mikula-sonarsource/starred{/owner}{/repo}",
                "subscriptions_url": "api.github.com/users/pavel-mikula-sonarsource/subscriptions",
                "type": "User",
                "url": "api.github.com/users/pavel-mikula-sonarsource"
            },
            "private": false,
            "pulls_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/pulls{/number}",
            "pushed_at": "2020-10-16T13:53:06Z",
            "releases_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/releases{/id}",
            "size": 624,
            "ssh_url": "git@github.com:pavel-mikula-sonarsource/GitHubActionPlayground.git",
            "stargazers_count": 0,
            "stargazers_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/stargazers",
            "statuses_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/statuses/{sha}",
            "subscribers_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/subscribers",
            "subscription_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/subscription",
            "svn_url": "pavel-mikula-sonarsource/GitHubActionPlayground",
            "tags_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/tags",
            "teams_url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/teams",
            "trees_url": "https://api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground/git/trees{/sha}",
            "updated_at": "2020-10-16T13:53:08Z",
            "url": "api.github.com/repos/pavel-mikula-sonarsource/GitHubActionPlayground",
            "watchers": 0,
            "watchers_count": 0
        },
        "requested_reviewer": {
            "avatar_url": "avatars2.githubusercontent.com/u/43468290?v=4",
            "events_url": "https://api.github.com/users/PavlinII/events{/privacy}",
            "followers_url": "api.github.com/users/PavlinII/followers",
            "following_url": "https://api.github.com/users/PavlinII/following{/other_user}",
            "gists_url": "https://api.github.com/users/PavlinII/gists{/gist_id}",
            "gravatar_id": "",
            "html_url": "@PavlinII",
            "id": 43468290,
            "login": "PavlinII",
            "node_id": "MDQ6VXNlcjQzNDY4Mjkw",
            "organizations_url": "api.github.com/users/PavlinII/orgs",
            "received_events_url": "api.github.com/users/PavlinII/received_events",
            "repos_url": "api.github.com/users/PavlinII/repos",
            "site_admin": false,
            "starred_url": "https://api.github.com/users/PavlinII/starred{/owner}{/repo}",
            "subscriptions_url": "api.github.com/users/PavlinII/subscriptions",
            "type": "User",
            "url": "api.github.com/users/PavlinII"
        },
        "sender": {
            "avatar_url": "avatars3.githubusercontent.com/u/57188685?v=4",
            "events_url": "https://api.github.com/users/pavel-mikula-sonarsource/events{/privacy}",
            "followers_url": "api.github.com/users/pavel-mikula-sonarsource/followers",
            "following_url": "https://api.github.com/users/pavel-mikula-sonarsource/following{/other_user}",
            "gists_url": "https://api.github.com/users/pavel-mikula-sonarsource/gists{/gist_id}",
            "gravatar_id": "",
            "html_url": "@pavel-mikula-sonarsource",
            "id": 57188685,
            "login": "pavel-mikula-sonarsource",
            "node_id": "MDQ6VXNlcjU3MTg4Njg1",
            "organizations_url": "api.github.com/users/pavel-mikula-sonarsource/orgs",
            "received_events_url": "api.github.com/users/pavel-mikula-sonarsource/received_events",
            "repos_url": "api.github.com/users/pavel-mikula-sonarsource/repos",
            "site_admin": false,
            "starred_url": "https://api.github.com/users/pavel-mikula-sonarsource/starred{/owner}{/repo}",
            "subscriptions_url": "api.github.com/users/pavel-mikula-sonarsource/subscriptions",
            "type": "User",
            "url": "api.github.com/users/pavel-mikula-sonarsource"
        }
    };
}