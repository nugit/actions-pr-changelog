const core = require('@actions/core');
const github = require('@actions/github');
const { createPullRequest } = require('../github/pulls');

async function run() {
  if (core.isDebug()) {
    core.startGroup('github.context:');
    core.debug(JSON.stringify(github.context, null, 2));
    core.endGroup();
  }

  try {
    const { payload: { repository: { name, owner: { login } } } } = github.context;
    const token = core.getInput('token');
    const octokit = github.getOctokit(token);

    await createPullRequest(
      octokit,
      login,
      name,
      core.getInput('head', { required: true }),
      core.getInput('base', { required: true }),
      core.getInput('title', { required: true }),
      core.getInput('reviewers', { required: true }).split(','),
    );
  } catch (err) {
    core.setFailed(`Err ${err.message} at ${err.stack}`);
  }
}

run();
