const core = require('@actions/core');
const github = require('@actions/github');
const { updateOnPremPR } = require('../changelog/onprem');
const { updateReleasePR } = require('../changelog/release');

async function getPrNumber(octokit) {
  const { payload: { repository: { name, owner: { login } } } } = github.context;
  if (['pull_request_target', 'pull_request'].includes(github.context.eventName)) {
    return github.context.payload.number;
  }

  if (github.context.eventName === 'workflow_run' && github.context.payload.workflow_run.event === 'pull_request') {
    const prs = github.context.payload.workflow_run.pull_requests;
    if (Array.isArray(prs) && prs.length > 0) {
      return prs[0].number;
    }
  }

  const prs = await octokit.rest.pulls.list({
    owner: login,
    repo: name,
    state: 'open',
    base: core.getInput('base'),
  });

  if (prs.data.length === 0) {
    core.info('No open pull requests found');
    process.exit(1);
  }

  return prs.data[0].number;
}

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

    const type = core.getInput('type', { required: true });
    const number = await getPrNumber(octokit);
    switch (type) {
      case 'release':
        await updateReleasePR(octokit, login, name, number);
        break;
      case 'onprem':
        await updateOnPremPR(octokit, login, name, number);
        break;
      default:
        core.setFailed('Invalid type input');
    }
  } catch (err) {
    core.setFailed(`Err ${err.message} at ${err.stack}`);
  }
}

run();
